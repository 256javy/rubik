import { describe, it, expect } from "vitest";
import { solvedCube, stateKey, pieceSolved } from "./index";
import {
  MOVES,
  applyMove,
  applySequence,
  inverse,
  inverseSequence,
  parseMoves,
} from "../moves";
import { scramble } from "../scramble";
import { newHistory, record, seek, resetHistory } from "../history";
import { whiteEdges, whiteCorners } from "../selectors";
import {
  crossComplete,
  firstLayerComplete,
  cubeSolved,
  permutationComplete,
} from "../validation";
import { getObjective } from "../../tutorial/engine/objective";
import { planObjective } from "../../tutorial/engine/planner";
import { stages } from "../../tutorial/steps";
const initial = solvedCube();
describe("physical cube model", () => {
  it("has 26 unique identities and 54 stickers", () => {
    expect(initial).toHaveLength(26);
    expect(new Set(initial.map((p) => p.id)).size).toBe(26);
    expect(initial.flatMap((p) => p.stickers)).toHaveLength(54);
  });
  for (const m of MOVES) {
    it(`${m} and inverse restore permutation and orientation`, () => {
      expect(stateKey(applySequence(initial, [m, inverse(m)]))).toBe(
        stateKey(initial),
      );
      expect(stateKey(applySequence(initial, [m, m, m, m]))).toBe(
        stateKey(initial),
      );
    });
  }
  it("R clockwise maps the upper front corner to the upper back corner", () => {
    const p = initial.find((p) => p.id === "WHITE_RED_BLUE_CORNER")!;
    const next = applyMove(initial, "R").find((t) => t.id === p.id)!;
    expect(next.position).toEqual([1, 1, -1]);
    expect(next.stickers.find((s) => s.color === "white")!.normal).toEqual([
      0, 0, -1,
    ]);
  });
  it("keeps centers fixed and pieces on unique legal positions for seeded mixes", () => {
    for (let seed = 0; seed < 30; seed++) {
      const moves = scramble(seed);
      const state = applySequence(initial, moves);
      expect(new Set(state.map((p) => p.position.join(","))).size).toBe(26);
      expect(state.filter((p) => p.type === "center").every(pieceSolved)).toBe(
        true,
      );
      expect(cubeSolved(applySequence(state, inverseSequence(moves)))).toBe(
        true,
      );
      expect(state.map((p) => p.id)).toEqual(initial.map((p) => p.id));
    }
  });
  it("rejects malformed notation", () => {
    expect(() => parseMoves("R rubbish U")).toThrow();
    expect(parseMoves("R U2 F' ")).toEqual(["R", "U2", "F'"]);
  });
  it("a white sticker cross with rotated lateral identities is incomplete", () => {
    const state = applyMove(initial, "U");
    expect(
      whiteEdges(state).every(
        (p) => p.stickers.find((s) => s.color === "white")!.normal[1] === 1,
      ),
    ).toBe(true);
    expect(crossComplete(state)).toBe(false);
  });
  it("stage completion includes previous layers and final corner orientation", () => {
    expect(stages.every((s) => s.isComplete(initial))).toBe(true);
    expect(firstLayerComplete(applyMove(initial, "R"))).toBe(false);
    const corner = initial.find((p) => p.type === "corner")!;
    const twisted = initial.map((p) =>
      p === corner
        ? {
            ...p,
            stickers: p.stickers.map((s, i) => ({
              ...s,
              normal: p.stickers[(i + 1) % 3].normal,
            })),
          }
        : p,
    );
    expect(permutationComplete(twisted)).toBe(true);
    expect(cubeSolved(twisted)).toBe(false);
  });
});
describe("stage-local snapshots", () => {
  it("never undoes the scramble or earlier stage", () => {
    const start = applySequence(initial, scramble(12));
    let h = newHistory(start);
    h = record(record(h, "R"), "U");
    expect(stateKey(seek(h, 0).states[0])).toBe(stateKey(start));
    expect(seek(h, -100).cursor).toBe(0);
    expect(stateKey(resetHistory(h).states[0])).toBe(stateKey(start));
    expect(resetHistory(h).moves).toHaveLength(0);
  });
  it("undo, redo and branching reconstruct exact states", () => {
    let h = record(record(record(newHistory(initial), "R"), "U"), "F'");
    h = seek(h, 1);
    expect(stateKey(h.states[h.cursor])).toBe(
      stateKey(applyMove(initial, "R")),
    );
    expect(stateKey(seek(h, 3).states[3])).toBe(
      stateKey(applySequence(initial, ["R", "U", "F'"])),
    );
    h = record(h, "D");
    expect(h.moves).toEqual(["R", "D"]);
    expect(h.cursor).toBe(2);
  });
});
describe("spatial guide", () => {
  it("selects unsolved target, correct centers and solved protection", () => {
    const s = applyMove(initial, "R");
    const o = getObjective(s, 0);
    expect(o.target).toBeDefined();
    expect(pieceSolved(o.target!)).toBe(false);
    expect(
      o.relevant
        .filter((p) => p.type === "center")
        .map((p) => p.stickers[0].color)
        .sort(),
    ).toEqual(["blue", "green", "orange", "red", "white"]);
    expect(o.protectedPieces.every(pieceSolved)).toBe(true);
  });
  it("solves four cross objectives across independent seeded scrambles", () => {
    for (const seed of [1, 42, 100, 2026, 927]) {
      let s = applySequence(initial, scramble(seed));
      for (let i = 0; i < 4 && !crossComplete(s); i++) {
        const o = getObjective(s, 0);
        const plan = planObjective(s, [
          o.target!.id,
          ...o.protectedPieces.map((p) => p.id),
        ]);
        expect(plan, `seed ${seed}, target ${o.target!.id}`).not.toBeNull();
        s = applySequence(s, plan!);
        expect(pieceSolved(s.find((p) => p.id === o.target!.id)!)).toBe(true);
        expect(
          o.protectedPieces.every((p) =>
            pieceSolved(s.find((t) => t.id === p.id)!),
          ),
        ).toBe(true);
      }
      expect(crossComplete(s)).toBe(true);
    }
  }, 30000);
  it("supports a corner case while restoring the entire white cross", () => {
    const s = applySequence(initial, ["R'", "D'", "R", "D"]);
    expect(crossComplete(s)).toBe(true);
    const o = getObjective(s, 1);
    expect(o.target).toBeDefined();
    const moves = planObjective(s, [
      o.target!.id,
      ...o.protectedPieces.map((p) => p.id),
    ]);
    expect(moves).not.toBeNull();
    const end = applySequence(s, moves!);
    expect(whiteEdges(end).every(pieceSolved)).toBe(true);
    expect(whiteCorners(end).filter(pieceSolved).length).toBeGreaterThan(
      whiteCorners(s).filter(pieceSolved).length,
    );
  }, 30000);
});

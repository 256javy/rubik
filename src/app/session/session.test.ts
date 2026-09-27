import { it, expect } from "vitest";
import { solvedCube, stateKey } from "../../cube/model";
import { newHistory, record, seek } from "../../cube/history";
import { decodeSession, encodeSession, type Session } from "./index";
const initial = solvedCube();
const history = seek(record(record(newHistory(initial), "R"), "U"), 1);
const session: Session = {
  history,
  active: true,
  stage: 3,
  hasScrambled: true,
  scrambleMoves: ["R", "U"],
  demo: { start: 0, moves: ["R", "U"], state: initial, kind: "guided" },
  reference: { front: "R", up: "U" },
  dual: true,
  showAxes: true,
  speed: 0.5,
};
it("restores stage, cursor, pending demonstration, undo and redo states exactly", () => {
  const saved = decodeSession(encodeSession(session))!;
  expect(saved.stage).toBe(3);
  expect(saved.history.cursor).toBe(1);
  expect(saved.history.moves).toEqual(["R", "U"]);
  expect(saved.reference).toEqual(session.reference);
  expect(saved.demo?.moves).toEqual(["R", "U"]);
  expect(saved.showAxes).toBe(true);
  saved.history.states.forEach((s, i) =>
    expect(stateKey(s)).toBe(stateKey(history.states[i])),
  );
});
it("ignores corrupt or incompatible storage instead of breaking startup", () => {
  expect(decodeSession("bad json")).toBeNull();
  for (const patch of [
    { version: 2 },
    { cursor: 99 },
    { stage: -1 },
    { moves: ["X"] },
    { initial: [] },
    { reference: { front: "F", up: "B" } },
  ])
    expect(
      decodeSession(
        JSON.stringify({ ...JSON.parse(encodeSession(session)), ...patch }),
      ),
    ).toBeNull();
});

import { describe, expect, it } from "vitest";
import { solvedCube } from "../../cube/model";
import { applySequence, parseMoves } from "../../cube/moves";
import { getObjective } from "./objective";
import { roleFor } from "../../rendering/highlighting";

describe("persistent stage colors", () => {
  it("colors all four white edges and their five centers even after completion", () => {
    const state = solvedCube();
    const objective = getObjective(state, 0);
    expect(objective.relevant.filter((p) => p.type === "edge")).toHaveLength(4);
    expect(
      objective.relevant
        .filter((p) => p.type === "center")
        .flatMap((p) => p.stickers.map((s) => s.color))
        .sort(),
    ).toEqual(["blue", "green", "orange", "red", "white"]);
    expect(
      objective.relevant.some((p) =>
        p.stickers.some((s) => s.color === "yellow"),
      ),
    ).toBe(false);
  });
  it("retains identities during turns and accumulates previous stages", () => {
    const state = solvedCube();
    const moved = applySequence(state, parseMoves("R U F D"));
    let previous: string[] = [];
    for (let stage = 0; stage < 7; stage++) {
      const ids = getObjective(state, stage).relevant.map((p) => p.id);
      expect(getObjective(moved, stage).relevant.map((p) => p.id)).toEqual(ids);
      expect(previous.every((id) => ids.includes(id))).toBe(true);
      for (const id of ids)
        expect(
          roleFor(id, {
            related: ids,
            protected: [],
            muted: true,
          }),
        ).toBe("RELATED");
      previous = ids;
    }
    expect(previous).toHaveLength(26);
  });
});

import { it, expect } from "vitest";
import { FACES, applySequence, inverseSequence, MOVES } from "../moves";
import { solvedCube } from "../model";
import { cubeSolved } from "../validation";
import {
  referenceMap,
  toPhysical,
  toRelative,
  validReference,
  suggestReference,
} from "./index";
it("has exactly 24 proper orientations and bijective move mappings", () => {
  let count = 0;
  for (const front of FACES)
    for (const up of FACES) {
      const ref = { front, up };
      if (!validReference(ref)) continue;
      count++;
      expect(new Set(Object.values(referenceMap(ref))).size).toBe(6);
      for (const m of MOVES)
        expect(toRelative(toPhysical(m, ref), ref)).toBe(m);
      const moves = ["R'", "D'", "R", "D"] as const;
      const physical = moves.map((m) => toPhysical(m, ref));
      expect(
        cubeSolved(
          applySequence(solvedCube(), [
            ...physical,
            ...inverseSequence(physical),
          ]),
        ),
      ).toBe(true);
    }
  expect(count).toBe(24);
});
it("derives right from up and front without mirroring clockwise turns", () => {
  expect(referenceMap({ front: "R", up: "U" })).toEqual({
    F: "R",
    B: "L",
    U: "U",
    D: "D",
    R: "B",
    L: "F",
  });
  expect(toPhysical("R'", { front: "R", up: "U" })).toBe("B'");
  expect(toPhysical("U", { front: "F", up: "D" })).toBe("D");
  expect(validReference({ front: "F", up: "B" })).toBe(false);
});
it("snaps camera suggestions to a valid orientation", () => {
  expect(suggestReference([0, 0, 1], [0, 1, 0])).toEqual({
    front: "F",
    up: "U",
  });
  expect(suggestReference([1, 0, 0], [0, -1, 0])).toEqual({
    front: "R",
    up: "D",
  });
});

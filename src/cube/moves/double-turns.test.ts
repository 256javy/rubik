import { it, expect } from "vitest";
import { expandDoubleTurns, applySequence, applyMove, FACES } from "./index";
import { solvedCube, stateKey } from "../model";
import { newHistory, record, seek } from "../history";
it("expands each double turn while retaining inverse quarter turns", () => {
  expect(expandDoubleTurns(["R2", "U'", "F2"])).toEqual([
    "R",
    "R",
    "U'",
    "F",
    "F",
  ]);
  for (const face of FACES)
    expect(
      stateKey(applySequence(solvedCube(), expandDoubleTurns([`${face}2`]))),
    ).toBe(stateKey(applyMove(solvedCube(), `${face}2`)));
});
it("lets the learner stop and undo at the intermediate 90-degree state", () => {
  let h = newHistory(solvedCube());
  for (const m of expandDoubleTurns(["R2"])) h = record(h, m);
  expect(h.moves).toEqual(["R", "R"]);
  expect(stateKey(seek(h, 1).states[1])).toBe(
    stateKey(applyMove(solvedCube(), "R")),
  );
});

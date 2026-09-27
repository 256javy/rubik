import { it, expect } from "vitest";
import { solvedCube } from "../../cube/model";
import { applySequence, inverseSequence } from "../../cube/moves";
import * as v from "../../cube/validation";
import {
  orientYellowEdges,
  cycleYellowEdges,
  cycleYellowCorners,
} from "../algorithms/last-layer";
import { planLastLayer } from "./last-layer";
it("last-layer algorithms preserve the layers required by their stage", () => {
  for (const moves of orientYellowEdges)
    expect(v.middleComplete(applySequence(solvedCube(), moves))).toBe(true);
  for (const moves of cycleYellowEdges)
    expect(v.yellowCrossComplete(applySequence(solvedCube(), moves))).toBe(
      true,
    );
  for (const moves of cycleYellowCorners)
    expect(v.yellowEdgesComplete(applySequence(solvedCube(), moves))).toBe(
      true,
    );
});
it("finishes each last-layer stage independently, including final orientation", () => {
  const validators = [
    v.yellowCrossComplete,
    v.yellowEdgesComplete,
    v.permutationComplete,
    v.cubeSolved,
  ];
  for (let seed = 0; seed < 12; seed++) {
    let state = solvedCube();
    for (let i = 0; i < 5; i++)
      state = applySequence(
        state,
        [...orientYellowEdges, ...cycleYellowEdges, ...cycleYellowCorners][
          (seed * 5 + i * 7) % 24
        ],
      );
    for (let stage = 3; stage < 7; stage++) {
      const before = state;
      const moves = planLastLayer(state, stage);
      expect(moves, `seed ${seed} stage ${stage}`).not.toBeNull();
      state = applySequence(state, moves!);
      expect(validators[stage - 3](state)).toBe(true);
      expect(applySequence(state, inverseSequence(moves!))).toEqual(before);
    }
    expect(v.cubeSolved(state)).toBe(true);
  }
}, 30000);

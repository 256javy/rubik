import { it, expect } from "vitest";
import { solvedCube, pieceSolved } from "../../cube/model";
import { applySequence, inverseSequence } from "../../cube/moves";
import { firstLayerComplete, middleComplete } from "../../cube/validation";
import { middleEdges } from "../../cube/selectors";
import { middleLayerAlgorithms } from "../algorithms/middle-layer";
import { planMiddleLayer } from "./middle-layer";
import { getObjective } from "./objective";
it("all insertion algorithms preserve the white first layer", () => {
  for (const moves of middleLayerAlgorithms)
    expect(firstLayerComplete(applySequence(solvedCube(), moves))).toBe(true);
});
it("solves flipped, displaced and last-layer edges while protecting solved pieces", () => {
  for (let seed = 0; seed < 12; seed++) {
    let state = solvedCube();
    for (let i = 0; i < 5; i++)
      state = applySequence(state, middleLayerAlgorithms[(seed + i * 3) % 8]);
    for (let i = 0; i < 4 && !middleComplete(state); i++) {
      const o = getObjective(state, 2);
      const ids = o.protectedPieces.map((p) => p.id);
      const moves = planMiddleLayer(state, o.target!.id, ids);
      expect(moves).not.toBeNull();
      const before = state;
      state = applySequence(state, moves!);
      expect(firstLayerComplete(state)).toBe(true);
      expect(pieceSolved(state.find((p) => p.id === o.target!.id)!)).toBe(true);
      expect(
        ids.every((id) => pieceSolved(state.find((p) => p.id === id)!)),
      ).toBe(true);
      expect(applySequence(state, inverseSequence(moves!))).toEqual(before);
    }
    expect(middleComplete(state)).toBe(true);
    expect(middleEdges(state).every(pieceSolved)).toBe(true);
  }
}, 30000);

import { it, expect } from "vitest";
import { solvedCube, pieceSolved } from "../../cube/model";
import { applySequence } from "../../cube/moves";
import { scramble } from "../../cube/scramble";
import { crossComplete, firstLayerComplete } from "../../cube/validation";
import { getObjective } from "./objective";
import { planObjective } from "./planner";
it("restores all white corners after a seeded cross without disturbing earlier objectives", () => {
  let s = applySequence(solvedCube(), scramble(42, 12));
  for (let stage = 0; stage < 2; stage++) {
    for (let i = 0; i < 4; i++) {
      if ((stage === 0 ? crossComplete : firstLayerComplete)(s)) break;
      const o = getObjective(s, stage);
      const moves = planObjective(s, [
        o.target!.id,
        ...o.protectedPieces.map((p) => p.id),
      ]);
      expect(moves, `stage ${stage} target ${o.target!.id}`).not.toBeNull();
      s = applySequence(s, moves!);
      expect(pieceSolved(s.find((p) => p.id === o.target!.id)!)).toBe(true);
      expect(
        o.protectedPieces.every((p) =>
          pieceSolved(s.find((t) => t.id === p.id)!),
        ),
      ).toBe(true);
    }
    expect((stage === 0 ? crossComplete : firstLayerComplete)(s)).toBe(true);
  }
}, 30000);

it("prioritizes recovery of a disturbed cross before teaching a corner", () => {
  const disturbed = applySequence(solvedCube(), ["R"]);
  const objective = getObjective(disturbed, 1);
  expect(objective.recovery).toBe(true);
  expect(objective.target?.type).toBe("edge");
});

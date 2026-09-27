import { type CubeState } from "../../cube/model";
import { yellowEdges, yellowCorners } from "../../cube/selectors";
import {
  middleComplete,
  yellowCrossComplete,
  yellowEdgesComplete,
  permutationComplete,
} from "../../cube/validation";
import { MOVES, type Move } from "../../cube/moves";
import { getPieceOrbit, pieceOrbitKey } from "./planner";
import { lastLayerActions } from "../algorithms/last-layer";
export function planLastLayer(state: CubeState, stage: number): Move[] | null {
  const prerequisites = [
    middleComplete,
    yellowCrossComplete,
    yellowEdgesComplete,
    permutationComplete,
  ];
  if (!prerequisites[stage - 3]?.(state)) return null;
  const pieces =
    stage < 5
      ? yellowEdges(state)
      : stage === 5
        ? yellowCorners(state)
        : [...yellowEdges(state), ...yellowCorners(state)];
  const orbits = pieces.map(getPieceOrbit);
  const actions = lastLayerActions[stage];
  const tables = orbits.map((orbit) =>
    actions.map((moves) =>
      orbit.transitions.map((_, index) =>
        moves.reduce(
          (value, move) => orbit.transitions[value][MOVES.indexOf(move)],
          index,
        ),
      ),
    ),
  );
  const initial = pieces.map((p, i) => orbits[i].index.get(pieceOrbitKey(p))!);
  const allowed = pieces.map((p, i) => {
    if (stage !== 3 && stage !== 5) return new Set([0]);
    const goal = new Set<number>();
    // Enumerate each physical piece's orbit and test only the stage's actual goal.
    for (const [key, index] of orbits[i].index) {
      const [position, stickers] = key.split(":");
      if (
        stage === 5
          ? position === p.solvedPosition.join(",")
          : stickers.split(";")[
              p.stickers.findIndex((s) => s.color === "yellow")
            ] === "0,-1,0"
      )
        goal.add(index);
    }
    return goal;
  });
  const queue: { values: number[]; parent: number; action: number }[] = [
    { values: initial, parent: -1, action: -1 },
  ];
  const seen = new Set([initial.join(".")]);
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    if (node.values.every((v, j) => allowed[j].has(v))) {
      const path: number[] = [];
      let cursor = i;
      while (queue[cursor].parent >= 0) {
        path.push(queue[cursor].action);
        cursor = queue[cursor].parent;
      }
      return path.reverse().flatMap((a) => actions[a]);
    }
    for (let a = 0; a < actions.length; a++) {
      const values = node.values.map((v, j) => tables[j][a][v]);
      const key = values.join(".");
      if (!seen.has(key)) {
        seen.add(key);
        queue.push({ values, parent: i, action: a });
      }
    }
  }
  return null;
}

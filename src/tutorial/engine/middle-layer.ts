import { type CubeState, type Piece, pieceSolved } from "../../cube/model";
import { applySequence, type Move } from "../../cube/moves";
import { firstLayerComplete } from "../../cube/validation";
import { middleLayerActions } from "../algorithms/middle-layer";
const key = (pieces: Piece[]) =>
  pieces
    .map(
      (p) =>
        p.position.join(",") +
        ":" +
        p.stickers.map((s) => s.normal.join(",")).join(";"),
    )
    .join("|");
// Search over layer-preserving insertion algorithms, not over a whole-cube solution.
export function planMiddleLayer(
  state: CubeState,
  targetId: string,
  protectedIds: string[],
): Move[] | null {
  if (!firstLayerComplete(state)) return null;
  const ids = new Set([targetId, ...protectedIds]);
  const initial = state.filter(
    (p) => ids.has(p.id) && p.type === "edge" && p.solvedPosition[1] === 0,
  );
  const queue: { pieces: Piece[]; parent: number; action: number }[] = [
    { pieces: initial, parent: -1, action: -1 },
  ];
  const seen = new Set([key(initial)]);
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    if (node.pieces.every(pieceSolved)) {
      const actions: number[] = [];
      let cursor = i;
      while (queue[cursor].parent >= 0) {
        actions.push(queue[cursor].action);
        cursor = queue[cursor].parent;
      }
      return actions.reverse().flatMap((a) => middleLayerActions[a]);
    }
    for (let action = 0; action < middleLayerActions.length; action++) {
      const pieces = applySequence(node.pieces, middleLayerActions[action]);
      const k = key(pieces);
      if (!seen.has(k)) {
        seen.add(k);
        queue.push({ pieces, parent: i, action });
      }
    }
  }
  return null;
}

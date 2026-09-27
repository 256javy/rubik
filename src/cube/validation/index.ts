import { pieceSolved, piecePositioned, type CubeState } from "../model";
import {
  whiteEdges,
  whiteCorners,
  middleEdges,
  yellowEdges,
  yellowCorners,
} from "../selectors";
export const crossComplete = (s: CubeState) => whiteEdges(s).every(pieceSolved);
export const firstLayerComplete = (s: CubeState) =>
  crossComplete(s) && whiteCorners(s).every(pieceSolved);
export const middleComplete = (s: CubeState) =>
  firstLayerComplete(s) && middleEdges(s).every(pieceSolved);
export const yellowCrossComplete = (s: CubeState) =>
  middleComplete(s) &&
  yellowEdges(s).every(
    (p) => p.stickers.find((t) => t.color === "yellow")?.normal[1] === -1,
  );
export const yellowEdgesComplete = (s: CubeState) =>
  yellowCrossComplete(s) && yellowEdges(s).every(pieceSolved);
export const permutationComplete = (s: CubeState) =>
  yellowEdgesComplete(s) && yellowCorners(s).every(piecePositioned);
export const cubeSolved = (s: CubeState) => s.every(pieceSolved);

import { pieceSolved, type CubeState, type Piece } from "../model";
export const whiteEdges = (s: CubeState) =>
  s.filter((p) => p.type === "edge" && p.solvedPosition[1] === 1);
export const whiteCorners = (s: CubeState) =>
  s.filter((p) => p.type === "corner" && p.solvedPosition[1] === 1);
export const middleEdges = (s: CubeState) =>
  s.filter((p) => p.type === "edge" && p.solvedPosition[1] === 0);
export const yellowEdges = (s: CubeState) =>
  s.filter((p) => p.type === "edge" && p.solvedPosition[1] === -1);
export const yellowCorners = (s: CubeState) =>
  s.filter((p) => p.type === "corner" && p.solvedPosition[1] === -1);
export const solvedPieces = (pieces: Piece[]) => pieces.filter(pieceSolved);

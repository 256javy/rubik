import { parseMoves, inverseSequence, type Move } from "../../cube/moves";
// Algorithms expressed in the fixed white-up frame; Cuby attribution remains unverified.
function variants(notation: string): Move[][] {
  const sides = ["F", "R", "B", "L"];
  const base = parseMoves(notation);
  return Array.from({ length: 4 }, (_, yaw) =>
    base.map((m) => {
      const index = sides.indexOf(m[0]);
      return index < 0
        ? m
        : (`${sides[(index + yaw) % 4]}${m.slice(1)}` as Move);
    }),
  ).flatMap((m) => [m, inverseSequence(m)]);
}
export const orientYellowEdges = variants("B R D R' D' B'");
export const cycleYellowEdges = variants("R D R' D R D2 R'");
export const cycleYellowCorners = variants("D R D' L' D R' D' L");
export const lastLayerActions: Record<number, Move[][]> = {
  3: [["D"], ["D'"], ["D2"], ...orientYellowEdges],
  4: [["D"], ["D'"], ["D2"], ...cycleYellowEdges],
  5: cycleYellowCorners,
  6: [["D"], ["D'"], ["D2"], ...cycleYellowEdges, ...cycleYellowCorners],
};

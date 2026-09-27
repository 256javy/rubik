import { parseMoves, inverseSequence, type Move } from "../../cube/moves";
// Standard insertion adapted to the fixed white-up frame. Not attributed to Cuby.
const base = parseMoves("R D R' D' B' D' B D");
const sides = ["F", "R", "B", "L"];
export const middleLayerAlgorithms: Move[][] = Array.from(
  { length: 4 },
  (_, yaw) =>
    base.map((move) => {
      const index = sides.indexOf(move[0]);
      return index < 0
        ? move
        : (`${sides[(index + yaw) % 4]}${move.slice(1)}` as Move);
    }),
).flatMap((moves) => [moves, inverseSequence(moves)]);
export const middleLayerActions: Move[][] = [
  ["D"],
  ["D'"],
  ["D2"],
  ...middleLayerAlgorithms,
];

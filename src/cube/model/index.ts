export type Vec = readonly [number, number, number];
export type Color = "white" | "yellow" | "red" | "orange" | "blue" | "green";
export type PieceType = "center" | "edge" | "corner";
export interface Sticker {
  color: Color;
  normal: Vec;
}
export interface Piece {
  id: string;
  type: PieceType;
  position: Vec;
  solvedPosition: Vec;
  stickers: Sticker[];
  solvedStickers: Sticker[];
}
export type CubeState = Piece[];
export const COLORS: Record<Color, string> = {
  white: "#fafbff",
  yellow: "#ffd441",
  red: "#f3483e",
  orange: "#ff9b38",
  blue: "#2188ee",
  green: "#26b76a",
};
export const COLOR_NAMES: Record<Color, string> = {
  white: "blanco",
  yellow: "amarillo",
  red: "rojo",
  orange: "naranja",
  blue: "azul",
  green: "verde",
};
const faces: [Color, Vec][] = [
  ["white", [0, 1, 0]],
  ["yellow", [0, -1, 0]],
  ["red", [0, 0, 1]],
  ["orange", [0, 0, -1]],
  ["blue", [1, 0, 0]],
  ["green", [-1, 0, 0]],
];
export const equalVec = (a: Vec, b: Vec) => a.every((v, i) => v === b[i]);
export function solvedCube(): CubeState {
  const pieces: CubeState = [];
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        const position: Vec = [x, y, z];
        const count = position.filter(Boolean).length;
        if (!count) continue;
        const stickers = faces
          .filter(([, n]) => n.some((v, i) => v !== 0 && position[i] === v))
          .map(([color, normal]) => ({ color, normal }));
        const type: PieceType =
          count === 1 ? "center" : count === 2 ? "edge" : "corner";
        pieces.push({
          id:
            stickers.map((s) => s.color.toUpperCase()).join("_") +
            "_" +
            type.toUpperCase(),
          type,
          position,
          solvedPosition: position,
          stickers,
          solvedStickers: stickers,
        });
      }
  return pieces;
}
export function pieceSolved(p: Piece) {
  return (
    equalVec(p.position, p.solvedPosition) &&
    p.stickers.every((s) =>
      equalVec(
        s.normal,
        p.solvedStickers.find((t) => t.color === s.color)!.normal,
      ),
    )
  );
}
export function piecePositioned(p: Piece) {
  return equalVec(p.position, p.solvedPosition);
}
export function stateKey(state: CubeState) {
  return state
    .map(
      (p) =>
        p.position.join(",") +
        ":" +
        p.stickers.map((s) => s.normal.join(",")).join(";"),
    )
    .join("|");
}

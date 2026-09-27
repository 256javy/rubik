import type { CubeState, Piece, Vec } from "../model";
export type Face = "U" | "D" | "L" | "R" | "F" | "B";
export type Move = `${Face}${"" | "'" | "2"}`;
export const FACES: Face[] = ["U", "D", "L", "R", "F", "B"];
export const MOVES = FACES.flatMap((f) => [f, `${f}'`, `${f}2`] as Move[]);
export const FACE_INFO: Record<
  Face,
  { axis: 0 | 1 | 2; layer: number; direction: number; name: string }
> = {
  U: { axis: 1, layer: 1, direction: -1, name: "superior (blanco)" },
  D: { axis: 1, layer: -1, direction: 1, name: "inferior (amarillo)" },
  R: { axis: 0, layer: 1, direction: -1, name: "derecha (azul)" },
  L: { axis: 0, layer: -1, direction: 1, name: "izquierda (verde)" },
  F: { axis: 2, layer: 1, direction: -1, name: "frontal (rojo)" },
  B: { axis: 2, layer: -1, direction: 1, name: "posterior (naranja)" },
};
export function moveInfo(move: Move) {
  const info = FACE_INFO[move[0] as Face];
  return {
    ...info,
    turns: move.endsWith("2") ? 2 : move.endsWith("'") ? -1 : 1,
  };
}
export function rotate(v: Vec, axis: number, turns: number): Vec {
  let a = [...v];
  for (let i = 0; i < ((turns % 4) + 4) % 4; i++) {
    const [x, y, z] = a;
    a = axis === 0 ? [x, -z, y] : axis === 1 ? [z, y, -x] : [-y, x, z];
  }
  return a.map((v) => (v === 0 ? 0 : v)) as unknown as Vec;
}
export function movePiece(p: Piece, move: Move): Piece {
  const m = moveInfo(move);
  if (p.position[m.axis] !== m.layer) return p;
  return {
    ...p,
    position: rotate(p.position, m.axis, m.direction * m.turns),
    stickers: p.stickers.map((s) => ({
      ...s,
      normal: rotate(s.normal, m.axis, m.direction * m.turns),
    })),
  };
}
export function applyMove(state: CubeState, move: Move): CubeState {
  return state.map((p) => movePiece(p, move));
}
export function applySequence(state: CubeState, moves: readonly Move[]) {
  return moves.reduce(applyMove, state);
}
export function inverse(move: Move): Move {
  return move.endsWith("2")
    ? move
    : move.endsWith("'")
      ? (move[0] as Move)
      : (`${move}'` as Move);
}
export const inverseSequence = (moves: readonly Move[]) =>
  [...moves].reverse().map(inverse);
export function parseMoves(text: string): Move[] {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  if (tokens.some((t) => !MOVES.includes(t as Move)))
    throw new Error("Usa U, D, L, R, F o B, con apóstrofo o 2.");
  return tokens as Move[];
}

/** Educational playback: every half-turn becomes two reversible quarter-turns. */
export function expandDoubleTurns(moves: readonly Move[]): Move[] {
  return moves.flatMap((move) =>
    move.endsWith("2") ? [move[0] as Move, move[0] as Move] : [move],
  );
}

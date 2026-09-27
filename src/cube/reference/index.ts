import type { Vec, Color } from "../model";
import { FACES, FACE_INFO, type Face, type Move } from "../moves";
export interface Reference {
  front: Face;
  up: Face;
}
export const DEFAULT_REFERENCE: Reference = { front: "F", up: "U" };
export const FACE_COLORS: Record<Face, Color> = {
  U: "white",
  D: "yellow",
  F: "red",
  B: "orange",
  R: "blue",
  L: "green",
};
export function normal(face: Face): Vec {
  const info = FACE_INFO[face];
  return [0, 1, 2].map((i) =>
    i === info.axis ? info.layer : 0,
  ) as unknown as Vec;
}
const dot = (a: Vec, b: Vec) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const cross = (a: Vec, b: Vec): Vec => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const faceOf = (v: Vec) => FACES.find((f) => dot(normal(f), v) === 1)!;
export function validReference(ref: Reference) {
  return (
    FACES.includes(ref?.front) &&
    FACES.includes(ref?.up) &&
    dot(normal(ref.front), normal(ref.up)) === 0
  );
}
export function referenceMap(ref: Reference): Record<Face, Face> {
  if (!validReference(ref))
    throw new Error("El frente y arriba deben ser caras adyacentes.");
  const front = normal(ref.front),
    up = normal(ref.up),
    right = cross(up, front);
  const opposite = (v: Vec) => faceOf(v.map((n) => -n) as unknown as Vec);
  return {
    F: ref.front,
    B: opposite(front),
    U: ref.up,
    D: opposite(up),
    R: faceOf(right),
    L: opposite(right),
  };
}
export function toPhysical(move: Move, ref: Reference): Move {
  return `${referenceMap(ref)[move[0] as Face]}${move.slice(1)}` as Move;
}
export function toRelative(move: Move, ref: Reference): Move {
  const map = referenceMap(ref);
  return `${FACES.find((f) => map[f] === move[0])}${move.slice(1)}` as Move;
}
export function suggestReference(view: Vec, screenUp: Vec): Reference {
  let best = DEFAULT_REFERENCE,
    score = -Infinity;
  for (const front of FACES)
    for (const up of FACES) {
      const ref = { front, up };
      if (!validReference(ref)) continue;
      const candidate = dot(normal(front), view) + dot(normal(up), screenUp);
      if (candidate > score) {
        score = candidate;
        best = ref;
      }
    }
  return best;
}

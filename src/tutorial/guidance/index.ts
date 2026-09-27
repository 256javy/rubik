import { COLOR_NAMES, type Piece } from "../../cube/model";
import { FACE_INFO, type Face, type Move } from "../../cube/moves";
export const pieceLabel = (p: Piece) =>
  p.solvedStickers.map((s) => COLOR_NAMES[s.color]).join(" / ");
import {
  toRelative,
  FACE_COLORS,
  DEFAULT_REFERENCE,
  type Reference,
} from "../../cube/reference";
export function explainMove(
  move: Move,
  target: Piece,
  reference: Reference = DEFAULT_REFERENCE,
) {
  const face = FACE_INFO[move[0] as Face];
  const inLayer = target.position[face.axis] === face.layer;
  return `Gira la cara ${toRelative(move, reference)[0]} (${COLOR_NAMES[FACE_COLORS[move[0] as Face]]}) ${move.endsWith("2") ? "media vuelta" : move.endsWith("'") ? "en sentido antihorario" : "en sentido horario"}, mirándola de frente. ${inLayer ? "La pieza objetivo viaja con toda esa capa." : "La pieza objetivo permanece en su lugar; este giro prepara la siguiente posición."}`;
}

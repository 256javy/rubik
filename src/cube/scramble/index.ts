import { FACES, type Move } from "../moves";
export function scramble(
  seed = Math.floor(Math.random() * 0xffffffff),
  length = 20,
): Move[] {
  let n = seed >>> 0;
  const random = () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
  const moves: Move[] = [];
  while (moves.length < length) {
    const face = FACES[Math.floor(random() * 6)];
    if (moves.at(-1)?.[0] === face) continue;
    moves.push(`${face}${["", "'", "2"][Math.floor(random() * 3)]}` as Move);
  }
  return moves;
}

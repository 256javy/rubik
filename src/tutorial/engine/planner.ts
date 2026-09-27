import { type CubeState, type Piece } from "../../cube/model";
import { MOVES, movePiece, type Move } from "../../cube/moves";
const key = (p: Piece) =>
  p.position.join(",") +
  ":" +
  p.stickers.map((s) => s.normal.join(",")).join(";");
interface Orbit {
  index: Map<string, number>;
  transitions: number[][];
}
const orbitCache = new Map<string, Orbit>();
function orbit(piece: Piece): Orbit {
  const cached = orbitCache.get(piece.id);
  if (cached) return cached;
  const initial = {
    ...piece,
    position: piece.solvedPosition,
    stickers: piece.solvedStickers,
  };
  const pieces = [initial];
  const index = new Map([[key(initial), 0]]);
  const transitions: number[][] = [];
  for (let i = 0; i < pieces.length; i++) {
    transitions[i] = MOVES.map((m) => {
      const next = movePiece(pieces[i], m);
      const k = key(next);
      if (!index.has(k)) {
        index.set(k, pieces.length);
        pieces.push(next);
      }
      return index.get(k)!;
    });
  }
  const result = { index, transitions };
  orbitCache.set(piece.id, result);
  return result;
}
// Pair pattern databases provide exact lower bounds while ignoring other pieces.
function pairDistances(a: Orbit, b: Orbit) {
  const size = b.transitions.length;
  const distances = new Int8Array(a.transitions.length * size).fill(-1);
  distances[0] = 0;
  const queue = [0];
  for (let i = 0; i < queue.length; i++) {
    const code = queue[i],
      x = Math.floor(code / size),
      y = code % size;
    for (let m = 0; m < MOVES.length; m++) {
      const n = a.transitions[x][m] * size + b.transitions[y][m];
      if (distances[n] === -1) {
        distances[n] = distances[code] + 1;
        queue.push(n);
      }
    }
  }
  return distances;
}
export function planObjective(
  state: CubeState,
  ids: string[],
  maxNodes = 3_000_000,
): Move[] | null {
  const pieces = ids.map((id) => state.find((p) => p.id === id)!);
  const orbits = pieces.map(orbit);
  const initial = pieces.map((p, i) => orbits[i].index.get(key(p))!);
  const pairs: { a: number; b: number; size: number; d: Int8Array }[] = [];
  for (let a = 0; a < ids.length; a++)
    for (let b = a; b < ids.length; b++)
      pairs.push({
        a,
        b,
        size: orbits[b].transitions.length,
        d: pairDistances(orbits[a], orbits[b]),
      });
  const heuristic = (s: number[]) =>
    Math.max(0, ...pairs.map((p) => p.d[s[p.a] * p.size + s[p.b]]));
  let nodes = 0;
  const path: number[] = [];
  const opposites: Record<string, string> = {
    U: "D",
    D: "U",
    L: "R",
    R: "L",
    F: "B",
    B: "F",
  };
  function search(s: number[], remaining: number, last: string): boolean {
    if (++nodes > maxNodes) return false;
    const h = heuristic(s);
    if (h > remaining) return false;
    if (s.every((v) => v === 0)) return true;
    if (!remaining) return false;
    for (let m = 0; m < MOVES.length; m++) {
      const face = MOVES[m][0];
      if (face === last || (opposites[face] === last && face < last)) continue;
      path.push(m);
      if (
        search(
          s.map((v, i) => orbits[i].transitions[v][m]),
          remaining - 1,
          face,
        )
      )
        return true;
      path.pop();
      if (nodes > maxNodes) return false;
    }
    return false;
  }
  for (let depth = heuristic(initial); depth <= 12; depth++) {
    if (search(initial, depth, "")) return path.map((i) => MOVES[i]);
    if (nodes > maxNodes) break;
  }
  return null;
}

export { orbit as getPieceOrbit, key as pieceOrbitKey };

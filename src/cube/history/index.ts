import type { CubeState } from "../model";
import { applyMove, type Move } from "../moves";
export interface History {
  states: CubeState[];
  moves: Move[];
  cursor: number;
}
export const newHistory = (state: CubeState): History => ({
  states: [state],
  moves: [],
  cursor: 0,
});
export function record(h: History, move: Move): History {
  return {
    states: [
      ...h.states.slice(0, h.cursor + 1),
      applyMove(h.states[h.cursor], move),
    ],
    moves: [...h.moves.slice(0, h.cursor), move],
    cursor: h.cursor + 1,
  };
}
export function seek(h: History, cursor: number): History {
  return { ...h, cursor: Math.max(0, Math.min(cursor, h.moves.length)) };
}
export const resetHistory = (h: History) => newHistory(h.states[0]);

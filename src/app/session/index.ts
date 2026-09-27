import { solvedCube, type CubeState, type Vec } from "../../cube/model";
import { newHistory, record, seek, type History } from "../../cube/history";
import { MOVES, type Move } from "../../cube/moves";
import { validReference, type Reference } from "../../cube/reference";
export const SESSION_KEY = "rubik.tutor.session.v1";
export interface Demo {
  moves: Move[];
  start: number;
  state: CubeState;
  kind: "guided" | "algorithm" | "insertion";
}
export interface Session {
  history: History;
  active: boolean;
  stage: number;
  hasScrambled: boolean;
  scrambleMoves: Move[];
  demo: Demo | null;
  reference: Reference;
  dual: boolean;
  showAxes: boolean;
  autoCamera?: boolean;
  cameraStyle?: "follow" | "stage";
  mute?: boolean;
  emphasizeTarget?: boolean;
  speed: number;
}
const movesValid = (v: unknown): v is Move[] =>
  Array.isArray(v) && v.length <= 5000 && v.every((m) => MOVES.includes(m));
function restoreCube(data: unknown): CubeState {
  if (!Array.isArray(data) || data.length !== 26) throw Error();
  const positions = new Set<string>();
  return solvedCube().map((base) => {
    const p = data.find((p) => p.id === base.id);
    const vec = (v: unknown): v is Vec =>
      Array.isArray(v) &&
      v.length === 3 &&
      v.every((n) => Number.isInteger(n) && Math.abs(n) <= 1);
    if (
      !p ||
      !vec(p.position) ||
      p.position.filter(Boolean).length !==
        base.solvedPosition.filter(Boolean).length ||
      positions.has(p.position.join(","))
    )
      throw Error();
    positions.add(p.position.join(","));
    if (
      !Array.isArray(p.stickers) ||
      p.stickers.length !== base.stickers.length
    )
      throw Error();
    const stickers = base.stickers.map((s) => {
      const t = p.stickers.find((t: { color: string }) => t.color === s.color);
      if (
        !t ||
        !vec(t.normal) ||
        t.normal.reduce((sum: number, n: number) => sum + Math.abs(n), 0) !==
          1 ||
        t.normal.reduce(
          (sum: number, n: number, i: number) => sum + n * p.position[i],
          0,
        ) !== 1
      )
        throw Error();
      return { color: s.color, normal: t.normal };
    });
    if (
      new Set(stickers.map((s) => s.normal.join(","))).size !== stickers.length
    )
      throw Error();
    if (
      base.type === "center" &&
      (p.position.join(",") !== base.position.join(",") ||
        stickers[0].normal.join(",") !== base.stickers[0].normal.join(","))
    )
      throw Error();
    return { ...base, position: p.position, stickers };
  });
}
export function decodeSession(text: string | null): Session | null {
  try {
    if (!text) return null;
    const s = JSON.parse(text);
    if (
      s.version !== 1 ||
      !movesValid(s.moves) ||
      !movesValid(s.scrambleMoves) ||
      !Number.isInteger(s.cursor) ||
      s.cursor < 0 ||
      s.cursor > s.moves.length ||
      !Number.isInteger(s.stage) ||
      s.stage < 0 ||
      s.stage > 6 ||
      !validReference(s.reference) ||
      ![0.5, 1, 2].includes(s.speed) ||
      ["active", "hasScrambled", "dual", "showAxes"].some(
        (k) => typeof s[k] !== "boolean",
      )
    )
      return null;
    let history = newHistory(restoreCube(s.initial));
    for (const move of s.moves) history = record(history, move);
    history = seek(history, s.cursor);
    let demo: Demo | null = null;
    if (
      s.demo &&
      movesValid(s.demo.moves) &&
      Number.isInteger(s.demo.start) &&
      s.demo.start >= 0 &&
      s.demo.start <= s.cursor &&
      s.cursor <= s.demo.start + s.demo.moves.length &&
      ["guided", "algorithm", "insertion"].includes(s.demo.kind)
    ) {
      const prefix = s.moves.slice(s.demo.start);
      if (prefix.every((m: Move, i: number) => m === s.demo.moves[i]))
        demo = { ...s.demo, state: history.states[s.demo.start] };
    }
    return {
      ...s,
      history,
      demo,
      mute: typeof s.mute === "boolean" ? s.mute : true,
      emphasizeTarget:
        typeof s.emphasizeTarget === "boolean" ? s.emphasizeTarget : true,
      cameraStyle: s.cameraStyle === "stage" ? "stage" : "follow",
      autoCamera: typeof s.autoCamera === "boolean" ? s.autoCamera : true,
    };
  } catch {
    return null;
  }
}
export function encodeSession(s: Session): string {
  return JSON.stringify({
    version: 1,
    initial: s.history.states[0],
    moves: s.history.moves,
    cursor: s.history.cursor,
    active: s.active,
    stage: s.stage,
    hasScrambled: s.hasScrambled,
    scrambleMoves: s.scrambleMoves,
    demo: s.demo
      ? { moves: s.demo.moves, start: s.demo.start, kind: s.demo.kind }
      : null,
    reference: s.reference,
    dual: s.dual,
    showAxes: s.showAxes,
    autoCamera: s.autoCamera ?? true,
    cameraStyle: s.cameraStyle ?? "follow",
    mute: s.mute ?? true,
    emphasizeTarget: s.emphasizeTarget ?? true,
    speed: s.speed,
  });
}
export function loadSession() {
  try {
    return decodeSession(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}
export function saveSession(s: Session) {
  try {
    localStorage.setItem(SESSION_KEY, encodeSession(s));
    return true;
  } catch {
    return false;
  }
}

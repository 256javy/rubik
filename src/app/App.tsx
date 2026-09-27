import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import {
  Shuffle,
  RotateCcw,
  Focus,
  Undo2,
  Redo2,
  ArrowRight,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  solvedCube,
  pieceSolved,
  COLOR_NAMES,
  COLORS,
  type CubeState,
  type Vec,
} from "../cube/model";
import {
  expandDoubleTurns,
  inverse,
  parseMoves,
  FACES,
  type Move,
} from "../cube/moves";
import {
  DEFAULT_REFERENCE,
  FACE_COLORS,
  validReference,
  referenceMap,
  toPhysical,
  toRelative,
  type Reference,
} from "../cube/reference";
import { loadSession, saveSession } from "./session";
import { cubeSolved } from "../cube/validation";
import { scramble } from "../cube/scramble";
import { newHistory, record, seek, type History } from "../cube/history";
import { stages } from "../tutorial/steps";
import {
  getObjective,
  getProtectedIds,
  objectivePieceComplete,
} from "../tutorial/engine/objective";
import { pieceLabel, explainMove } from "../tutorial/guidance";
import { notationExample } from "../tutorial/algorithms";
import { Cube3D, type Turn } from "../rendering/Cube3D";
import { GuidedMovePlayer, type PlayerProps } from "../components/MovePlayer";
import { AlgorithmPlayer } from "../components/AlgorithmPlayer";
import { SettingsSection, ToggleSetting } from "../components/ControlCenter";
interface Demonstration {
  moves: Move[];
  start: number;
  state: CubeState;
  kind: "guided" | "algorithm" | "insertion";
}
export default function App() {
  const [saved] = useState(loadSession);
  const [history, setHistory] = useState(
    () => saved?.history ?? newHistory(solvedCube()),
  );
  const historyRef = useRef(history);
  const [active, setActive] = useState(saved?.active ?? false);
  const [stage, setStage] = useState(saved?.stage ?? 0);
  const [hasScrambled, setHasScrambled] = useState(
    saved?.hasScrambled ?? false,
  );
  const [scrambleMoves, setScrambleMoves] = useState<Move[]>(
    saved?.scrambleMoves ?? [],
  );
  const [turn, setTurn] = useState<Turn | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [dual, setDual] = useState(saved?.dual ?? false);
  const [settingsCollapsed, setSettingsCollapsed] = useState(true);
  const [cameraStyle, setCameraStyle] = useState<"follow" | "stage">(
    saved?.cameraStyle ?? "follow",
  );
  const [autoCamera, setAutoCamera] = useState(saved?.autoCamera ?? true);
  const [showAxes, setShowAxes] = useState(saved?.showAxes ?? false);
  const [reference, setReference] = useState<Reference>(
    saved?.reference ?? DEFAULT_REFERENCE,
  );
  const [draftReference, setDraftReference] = useState<Reference>(reference);
  const [referenceRequest, setReferenceRequest] = useState(0);
  const [storageWarning, setStorageWarning] = useState(false);
  const [cameraReset, setCameraReset] = useState(0);
  const [focus, setFocus] = useState<Vec>();
  const [speed, setSpeed] = useState(saved?.speed ?? 1);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const [demo, setDemo] = useState<Demonstration | null>(saved?.demo ?? null);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const [planning, setPlanning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const [message, setMessage] = useState("");
  const [practiceText, setPracticeText] = useState("R' D' R D");
  const [debugText, setDebugText] = useState("R U R' U'");
  const [debugStage, setDebugStage] = useState(0);
  const [debugPiece, setDebugPiece] = useState("");
  const [debugProtected, setDebugProtected] = useState<string[]>([]);
  const [mute, setMute] = useState(saved?.mute ?? true);
  const [emphasizeTarget, setEmphasizeTarget] = useState(
    saved?.emphasizeTarget ?? true,
  );
  const [debugInspect, setDebugInspect] = useState(false);
  const mounted = useRef(true);
  const frame = useRef(0);
  const resolveAnimation = useRef<(() => void) | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      cancelAnimationFrame(frame.current);
      resolveAnimation.current?.();
      workerRef.current?.terminate();
    };
  }, []);
  useLayoutEffect(() => {
    if (busy && !active) return;
    setStorageWarning(
      !saveSession({
        history,
        active,
        stage,
        hasScrambled,
        scrambleMoves,
        demo,
        reference,
        dual,
        showAxes,
        autoCamera,
        cameraStyle,
        mute,
        emphasizeTarget,
        speed,
      }),
    );
  }, [
    history,
    active,
    stage,
    hasScrambled,
    scrambleMoves,
    demo,
    reference,
    dual,
    showAxes,
    autoCamera,
    cameraStyle,
    mute,
    emphasizeTarget,
    speed,
    busy,
  ]);
  function applyReference(next: Reference) {
    if (busyRef.current || planning || !validReference(next)) return;
    stop();
    setReference(next);
    setDraftReference(next);
  }
  const state = history.states[history.cursor];
  const current = stages[stage];
  const complete = active && current.isComplete(state);
  const objective = useMemo(() => getObjective(state, stage), [state, stage]);
  const demoObjective =
    demo && demo.kind !== "algorithm" ? getObjective(demo.state, stage) : null;
  const target =
    demo && history.cursor < demo.start + demo.moves.length
      ? (demoObjective?.target ?? objective.target)
      : objective.target;
  const protectedIds = useMemo(
    () => getProtectedIds(history.states.slice(0, history.cursor + 1), stage),
    [history, stage],
  );
  const protectedPieces = state.filter((p) => protectedIds.includes(p.id));
  const relevant =
    demo && history.cursor < demo.start + demo.moves.length
      ? (demoObjective?.relevant ?? objective.relevant)
      : objective.relevant;
  const updateHistory = (h: History) => {
    historyRef.current = h;
    setHistory(h);
  };
  const stop = () => {
    playingRef.current = false;
    setPlaying(false);
  };
  const cancelPlan = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setPlanning(false);
  };
  async function animate(move: Move) {
    busyRef.current = true;
    setBusy(true);
    await new Promise<void>((resolve) => {
      resolveAnimation.current = resolve;
      const start = performance.now();
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const duration = reduced ? 1 : 560 / speedRef.current;
      const hold = reduced ? 0 : 120 / speedRef.current;
      const tick = (now: number) => {
        if (!mounted.current) {
          resolve();
          return;
        }
        const t = Math.min(1, (now - start) / duration);
        setTurn({ move, progress: t * t * (3 - 2 * t) });
        if (now - start < duration + hold)
          frame.current = requestAnimationFrame(tick);
        else resolve();
      };
      frame.current = requestAnimationFrame(tick);
    });
    resolveAnimation.current = null;
  }
  function finish(h: History) {
    if (!mounted.current) return;
    updateHistory(h);
    setTurn(null);
    busyRef.current = false;
    setBusy(false);
  }
  async function manualMove(move: Move) {
    if (busyRef.current || planning) return;
    stop();
    setDemo(null);
    setMessage("");
    for (const quarter of expandDoubleTurns([toPhysical(move, reference)])) {
      const h = record(historyRef.current, quarter);
      await animate(quarter);
      finish(h);
      if (!mounted.current) return;
    }
  }
  async function historySeek(cursor: number) {
    if (busyRef.current || planning) return;
    stop();
    setDemo(null);
    const h = historyRef.current;
    const next = seek(h, cursor);
    if (next.cursor === h.cursor) return;
    const delta = next.cursor - h.cursor;
    if (Math.abs(delta) === 1) {
      await animate(
        delta === 1 ? h.moves[h.cursor] : inverse(h.moves[h.cursor - 1]),
      );
    }
    finish(next);
  }
  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const target = event.target;
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        busyRef.current ||
        planning ||
        (target instanceof HTMLElement &&
          (target.closest("input, textarea, select") ||
            target.isContentEditable))
      )
        return;
      const key = event.key.toUpperCase();
      if ((event.ctrlKey || event.metaKey) && !event.altKey && key === "Z") {
        const h = historyRef.current;
        const cursor = h.cursor + (event.shiftKey ? 1 : -1);
        if (cursor < 0 || cursor > h.moves.length) return;
        event.preventDefault();
        void historySeek(cursor);
      } else if (
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        FACES.includes(key as (typeof FACES)[number])
      ) {
        event.preventDefault();
        void manualMove(`${key}${event.shiftKey ? "'" : ""}` as Move);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });
  async function demoSeek(index: number, demonstration = demo) {
    if (busyRef.current || !demonstration) return;
    const h = historyRef.current;
    const destination = demonstration.start + index;
    let next = h;
    for (let i = next.moves.length; i < destination; i++) {
      next = { ...next, cursor: i };
      next = record(next, demonstration.moves[i - demonstration.start]);
    }
    next = seek(next, destination);
    const delta = next.cursor - h.cursor;
    if (Math.abs(delta) === 1) {
      await animate(
        delta === 1 ? next.moves[h.cursor] : inverse(h.moves[h.cursor - 1]),
      );
    }
    finish(next);
  }
  async function play(demonstration = demo) {
    if (playingRef.current) {
      stop();
      return;
    }
    if (busyRef.current || !demonstration) return;
    playingRef.current = true;
    setPlaying(true);
    for (
      let i = historyRef.current.cursor - demonstration.start;
      i < demonstration.moves.length && playingRef.current;
      i++
    ) {
      await demoSeek(i + 1, demonstration);
    }
    stop();
  }
  async function doScramble(sequence = scramble()) {
    const moves = expandDoubleTurns(sequence);
    if (busyRef.current || planning) return;
    stop();
    setActive(false);
    setStage(0);
    setDemo(null);
    setMessage("");
    setHasScrambled(false);
    setScrambleMoves(moves);
    updateHistory(newHistory(solvedCube()));
    busyRef.current = true;
    setBusy(true);
    for (const move of moves) {
      const next = record(historyRef.current, move);
      await animate(move);
      if (!mounted.current) return;
      updateHistory(next);
      setTurn(null);
    }
    finish(newHistory(historyRef.current.states[historyRef.current.cursor]));
    setHasScrambled(true);
  }
  function startTutorial() {
    stop();
    setActive(true);
    setStage(0);
    setDemo(null);
    updateHistory(newHistory(state));
    setMessage("");
  }
  function plan(autoPlay = false) {
    if (busyRef.current || planning || !objective.target) return;
    stop();
    setDemo(null);
    setMessage("");
    setPlanning(true);
    const snapshot = state;
    const start = history.cursor;
    const worker = new Worker(
      new URL("../tutorial/engine/planner.worker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    const ids = [
      objective.target.id,
      ...(objective.recovery
        ? objective.protectedPieces.map((p) => p.id)
        : protectedIds
      ).filter((id) => id !== objective.target!.id),
    ];
    worker.onmessage = (e) => {
      if (workerRef.current !== worker) return;
      setPlanning(false);
      worker.terminate();
      workerRef.current = null;
      if (e.data.moves?.length) {
        const demonstration: Demonstration = {
          moves: e.data.moves,
          start,
          state: snapshot,
          kind: objective.effectiveStage >= 2 ? "insertion" : "guided",
        };
        const expanded = beginDemo(demonstration);
        if (autoPlay) void play(expanded);
      } else {
        setMessage(
          "La búsqueda alcanzó su límite para esta posición. Puedes explorar con giros manuales o probar la mezcla de práctica.",
        );
      }
    };
    worker.onerror = () => {
      if (workerRef.current !== worker) return;
      cancelPlan();
      setMessage("No se pudo calcular el recorrido. Vuelve a intentarlo.");
    };
    worker.postMessage({
      state: snapshot,
      ids,
      stage,
      recovery: objective.recovery,
    });
  }
  function resetStage() {
    if (busyRef.current) return;
    cancelPlan();
    stop();
    setDemo(null);
    setMessage("");
    updateHistory(newHistory(history.states[0]));
  }
  function continueStage() {
    if (!complete || busyRef.current || planning || stage === 6) return;
    stop();
    setDemo(null);
    setStage(stage + 1);
    setMessage("");
    updateHistory(newHistory(state));
  }
  function beginDemo(d: Demonstration) {
    const h = historyRef.current;
    updateHistory({
      ...h,
      states: h.states.slice(0, h.cursor + 1),
      moves: h.moves.slice(0, h.cursor),
    });
    const expanded = { ...d, moves: expandDoubleTurns(d.moves) };
    setDemo(expanded);
    return expanded;
  }
  function preparePractice(autoPlay = false) {
    if (busyRef.current || planning) return;
    try {
      const moves = parseMoves(practiceText).map((m) =>
        toPhysical(m, reference),
      );
      if (!moves.length) {
        setMessage("Escribe al menos un movimiento.");
        return;
      }
      stop();
      setMessage("");
      const d = beginDemo({
        moves,
        start: history.cursor,
        state,
        kind: "algorithm",
      });
      if (autoPlay) void play(d);
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  const demoCursor = demo
    ? Math.max(0, Math.min(demo.moves.length, history.cursor - demo.start))
    : 0;
  const player: PlayerProps = {
    moves: demo?.moves.map((m) => toRelative(m, reference)) ?? [],
    cursor: demoCursor,
    busy,
    playing,
    onSeek: (i) => {
      stop();
      void demoSeek(i);
    },
    onPlay: () => void play(),
    speed,
    onSpeed: setSpeed,
  };
  const destination =
    active &&
    stage !== 3 &&
    target &&
    !pieceSolved(state.find((p) => p.id === target.id)!)
      ? target.solvedPosition
      : undefined;
  const attention = {
    target: debugPiece || (active ? target?.id : undefined),
    related: active ? relevant.map((p) => p.id) : [],
    protected: [...protectedPieces.map((p) => p.id), ...debugProtected],
    muted: active && mute,
    emphasizeTarget,
  };
  const progress = objective.group.filter((p) =>
    objectivePieceComplete(p, stage),
  ).length;
  const disturbed = protectedPieces.filter(
    (p) => p.id !== target?.id && !pieceSolved(p),
  );
  const manualControls = (
    <details className="manual-controls" open={!active ? true : undefined}>
      <summary>
        Explorar con giros manuales
        <ChevronDown size={16} />
      </summary>
      <p>
        Estos botones usan el frente y arriba que has establecido. Los giros se
        leen mirando la cara correspondiente de frente.
      </p>
      <p>
        Teclado: U, D, L, R, F o B para girar; Mayús + letra para el giro
        inverso. Deshacer: Ctrl/Cmd + Z. Rehacer: Ctrl/Cmd + Mayús + Z.
      </p>
      <div className="manual-moves">
        {FACES.map((face) => (
          <div key={face}>
            <button
              disabled={busy || planning}
              onClick={() => void manualMove(face)}
            >
              {face}
            </button>
            <button
              disabled={busy || planning}
              onClick={() => void manualMove(`${face}'`)}
            >
              {face}'
            </button>
            <button
              disabled={busy || planning}
              onClick={() => void manualMove(`${face}2`)}
            >
              {face} + {face}
            </button>
          </div>
        ))}
      </div>
      <div className="history-actions">
        <button
          disabled={busy || planning || !history.cursor}
          onClick={() => void historySeek(history.cursor - 1)}
        >
          <Undo2 size={16} />
          Deshacer
        </button>
        <button
          disabled={busy || planning || history.cursor === history.moves.length}
          onClick={() => void historySeek(history.cursor + 1)}
        >
          <Redo2 size={16} />
          Rehacer
        </button>
        <span>
          {history.cursor} movimientos{active ? " en esta etapa" : ""}
        </span>
      </div>
    </details>
  );
  return (
    <div className="app-shell">
      <main>
        <section className="lesson-heading">
          <div>
            <p className="step-label">
              {active ? `Paso ${stage + 1} de 7` : "Práctica libre"}
            </p>
            <h1>{active ? current.title : "Cubo de Rubik"}</h1>
            <p className="subtitle">
              {active
                ? current.description
                : "Explora los giros o mezcla el cubo para empezar el tutorial."}
            </p>
          </div>
          {active && (
            <div
              className="stage-progress"
              aria-label={`${progress} de ${objective.group.length} piezas resueltas`}
            >
              <div>
                {objective.group.map((p) => (
                  <span
                    key={p.id}
                    className={objectivePieceComplete(p, stage) ? "filled" : ""}
                  />
                ))}
              </div>
              <span>
                {progress} / {objective.group.length}{" "}
                {stage === 1 || stage >= 5 ? "esquinas" : "aristas"}
              </span>
            </div>
          )}
        </section>
        <section className="cube-workspace" aria-label="Cubo interactivo">
          <div className="workspace-top">
            <span className="objective-caption">
              {active
                ? complete
                  ? "Objetivo alcanzado"
                  : stage >= 3
                    ? stage < 5
                      ? "Sigue las cuatro aristas amarillas"
                      : "Sigue las cuatro esquinas amarillas"
                    : `Encuentra la ${target?.type === "corner" ? "esquina" : "arista"} ${target ? pieceLabel(target) : "objetivo"}`
                : "Giros libres"}
            </span>
          </div>
          <Cube3D
            state={state}
            attention={attention}
            turn={turn}
            destination={destination}
            dual={dual}
            reset={cameraReset}
            focus={focus}
            reference={reference}
            showAxes={showAxes}
            autoCamera={autoCamera && active}
            cameraStyle={cameraStyle}
            stage={stage}
            referenceRequest={referenceRequest}
            onSuggest={(next) => {
              setDraftReference(next);
              const panel = document.getElementById(
                "reference-controls",
              ) as HTMLDetailsElement | null;
              if (panel) panel.open = true;
            }}
          />
          <div className="workspace-bottom">
            <div className="legend">
              {active ? (
                <>
                  <span>
                    <i className="target-dot" />
                    Objetivo
                  </span>
                  <span>
                    <i className="protected-dot" />
                    Protegida
                  </span>
                  <span>
                    <i className="destination-dot" />
                    Destino
                  </span>
                </>
              ) : (
                <span>
                  U {COLOR_NAMES[FACE_COLORS[reference.up]]} · F{" "}
                  {COLOR_NAMES[FACE_COLORS[reference.front]]} · R{" "}
                  {COLOR_NAMES[FACE_COLORS[referenceMap(reference).R]]}
                </span>
              )}
            </div>
            <div className="camera-tools">
              <button
                aria-label="Restablecer cámara"
                title="Restablecer cámara"
                onClick={() => setCameraReset((n) => n + 1)}
              >
                <RotateCcw size={17} />
              </button>
              <button
                aria-label="Enfocar pieza objetivo"
                title="Enfocar pieza objetivo"
                disabled={!active || !target}
                onClick={() => {
                  const p = state.find((p) => p.id === target?.id);
                  setFocus(p ? ([...p.position] as unknown as Vec) : undefined);
                }}
              >
                <Focus size={18} />
              </button>
            </div>
          </div>
        </section>
        <section className="control-center" aria-label="Ajustes del cubo">
          <header>
            <div>
              <h2>Ajustes del cubo</h2>
            </div>
            <button
              className="settings-collapse"
              aria-label={
                settingsCollapsed
                  ? "Expandir ajustes del cubo"
                  : "Colapsar ajustes del cubo"
              }
              aria-expanded={!settingsCollapsed}
              aria-controls="cube-settings-content"
              onClick={() => setSettingsCollapsed((v) => !v)}
            >
              <ChevronDown size={20} />
            </button>
          </header>
          <div id="cube-settings-content" hidden={settingsCollapsed}>
            <SettingsSection
              title="Vista"
              description="Cámara y perspectivas"
              initialOpen
            >
              <ToggleSetting
                title="Cámara automática"
                description="Elige cómo colocar la cámara durante el tutorial."
                value={autoCamera}
                onChange={() => setAutoCamera((v) => !v)}
              />
              <div className="setting-row">
                <div>
                  <strong>Modo de cámara</strong>
                  <p>
                    La vista de etapa se coloca una vez y permanece fija durante
                    los giros.
                  </p>
                </div>
                <select
                  aria-label="Modo de cámara"
                  value={cameraStyle}
                  onChange={(e) =>
                    setCameraStyle(e.target.value as "follow" | "stage")
                  }
                >
                  <option value="follow">Seguir objetivo</option>
                  <option value="stage">Vista fija de etapa</option>
                </select>
              </div>
              <ToggleSetting
                title="Perspectiva doble"
                description="Añade una vista del lado opuesto del cubo."
                value={dual}
                onChange={() => setDual((v) => !v)}
              />
              <div className="setting-row">
                <div>
                  <strong>Posición de la cámara</strong>
                  <p>Vuelve a la vista de tu orientación elegida.</p>
                </div>
                <button
                  className="secondary"
                  onClick={() => setCameraReset((n) => n + 1)}
                >
                  Restablecer vista
                </button>
              </div>
              <details className="settings-help">
                <summary>Cómo funciona la cámara</summary>
                <p>
                  Desactiva la cámara automática para mirar libremente. Mover la
                  cámara no cambia el frente y arriba de los algoritmos.
                </p>
              </details>
            </SettingsSection>
            <SettingsSection
              title="Ayudas visuales"
              description="Ejes, objetivo y piezas de referencia"
            >
              <ToggleSetting
                title="Mostrar ejes"
                description="Muestra las letras de las caras y el sentido de sus giros."
                value={showAxes}
                onChange={() => setShowAxes((v) => !v)}
              />
              <ToggleSetting
                title="Destacar objetivo"
                description="Añade una etiqueta y un contorno celeste a la pieza protagonista."
                value={emphasizeTarget}
                onChange={() => setEmphasizeTarget((v) => !v)}
              />
              <ToggleSetting
                title="Atenuar otras piezas"
                description="Deja en primer plano las piezas involucradas en la etapa."
                value={mute}
                onChange={() => setMute((v) => !v)}
              />
              <details className="settings-help">
                <summary>Cómo leer los ejes</summary>
                <p>
                  Las flechas indican el giro sin apóstrofo, mirando cada cara
                  de frente. El apóstrofo invierte el sentido.
                </p>
              </details>
            </SettingsSection>
            <SettingsSection
              title="Orientación"
              description="Frente y arriba para los algoritmos"
            >
              <div className="orientation-summary">
                {(["F", "U", "R"] as const).map((face) => (
                  <span key={face}>
                    <i
                      style={{
                        background:
                          COLORS[FACE_COLORS[referenceMap(reference)[face]]],
                      }}
                    />
                    {face === "F"
                      ? "Frente"
                      : face === "U"
                        ? "Arriba"
                        : "Derecha"}{" "}
                    <strong>
                      {COLOR_NAMES[FACE_COLORS[referenceMap(reference)[face]]]}
                    </strong>
                  </span>
                ))}
              </div>
              <details id="reference-controls" className="reference-controls">
                <summary>Cambiar orientación</summary>
                <p>
                  Coloca el cubo como quieres sostenerlo para ejecutar el
                  algoritmo. Elige los colores de sus centros: F es el frente, U
                  es arriba y R queda a tu derecha. Mirar alrededor no cambia
                  esta elección.
                </p>
                <button
                  className="secondary"
                  disabled={busy || planning}
                  onClick={() => setReferenceRequest((n) => n + 1)}
                >
                  Proponer F y U desde esta vista
                </button>
                <div className="reference-selectors">
                  <label>
                    Frente (F)
                    <select
                      aria-label="Frente (F)"
                      value={draftReference.front}
                      onChange={(e) =>
                        setDraftReference((r) => ({
                          ...r,
                          front: e.target.value as import("../cube/moves").Face,
                        }))
                      }
                    >
                      {FACES.map((f) => (
                        <option key={f} value={f}>
                          {COLOR_NAMES[FACE_COLORS[f]]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Arriba (U)
                    <select
                      aria-label="Arriba (U)"
                      value={draftReference.up}
                      onChange={(e) =>
                        setDraftReference((r) => ({
                          ...r,
                          up: e.target.value as import("../cube/moves").Face,
                        }))
                      }
                    >
                      {FACES.map((f) => (
                        <option key={f} value={f}>
                          {COLOR_NAMES[FACE_COLORS[f]]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {validReference(draftReference) ? (
                    <span className="right-preview">
                      <i
                        style={{
                          background:
                            COLORS[FACE_COLORS[referenceMap(draftReference).R]],
                        }}
                      />
                      R será{" "}
                      {COLOR_NAMES[FACE_COLORS[referenceMap(draftReference).R]]}
                    </span>
                  ) : (
                    <span role="status">
                      Elige dos caras adyacentes, no la misma cara ni caras
                      opuestas.
                    </span>
                  )}
                </div>
                <div className="action-row">
                  <button
                    className="primary"
                    disabled={
                      busy || planning || !validReference(draftReference)
                    }
                    onClick={() => applyReference(draftReference)}
                  >
                    Establecer F y U
                  </button>
                  <button
                    className="text-button"
                    disabled={busy || planning}
                    onClick={() => applyReference(DEFAULT_REFERENCE)}
                  >
                    Volver a blanco arriba y rojo al frente
                  </button>
                </div>
                <details className="settings-help">
                  <summary>Cómo funciona la orientación</summary>
                  <p>
                    El cubo y el progreso se conservan. Los botones, los ejes y
                    la notación usan las caras elegidas. La guía mantiene sus
                    objetivos de colores.
                  </p>
                </details>
              </details>
            </SettingsSection>
          </div>
        </section>
        {storageWarning && (
          <p className="notice" role="status">
            El navegador no permite guardar el progreso. Esta sesión continuará,
            pero no se podrá recuperar al recargar.
          </p>
        )}
        {!active ? (
          <section className="welcome-controls">
            <div>
              <h2>
                {!cubeSolved(state)
                  ? "Tu cubo está listo."
                  : "Explora el cubo."}
              </h2>
              <p>
                {!cubeSolved(state)
                  ? "Puedes seguir girando, mezclar o empezar el tutorial con este cubo."
                  : "Prueba los giros con los botones o el teclado. Después, mézclalo para aprender a resolverlo."}
              </p>
            </div>
            <div className="action-row">
              <button
                className="secondary"
                disabled={busy || planning}
                onClick={() => void doScramble()}
              >
                <Shuffle size={16} />
                {busy ? "Girando…" : "Mezclar cubo"}
              </button>
              <button
                className="primary"
                disabled={cubeSolved(state) || busy || planning}
                onClick={startTutorial}
              >
                Empezar tutorial
                <ArrowRight size={17} />
              </button>
            </div>
          </section>
        ) : (
          <section className="teaching-area">
            <div className="lesson-actions">
              {complete ? (
                stage < 6 ? (
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={continueStage}
                  >
                    Continuar al paso {stage + 2}
                    <ArrowRight size={17} />
                  </button>
                ) : (
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={() => void doScramble()}
                  >
                    Volver a mezclar
                  </button>
                )
              ) : (
                <button
                  className="primary"
                  disabled={(busy && !playing) || planning}
                  onClick={() => {
                    if (playing) stop();
                    else if (demo && demoCursor < demo.moves.length)
                      void play();
                    else plan(true);
                  }}
                >
                  {planning
                    ? "Calculando recorrido…"
                    : playing
                      ? "Pausar recorrido"
                      : demo && demoCursor < demo.moves.length
                        ? "Continuar recorrido"
                        : demo
                          ? stage >= 3
                            ? "Restaurar y continuar"
                            : "Colocar siguiente pieza"
                          : stage >= 3
                            ? "Mostrar cómo se completa"
                            : "Mostrar cómo se coloca"}
                  <ArrowRight size={17} />
                </button>
              )}
              {!complete && (!demo || demoCursor === demo.moves.length) && (
                <button
                  className="text-button"
                  disabled={busy || planning}
                  onClick={() => plan()}
                >
                  Ver pasos antes de empezar
                </button>
              )}
              <button
                className="text-button"
                disabled={busy}
                onClick={resetStage}
              >
                <RotateCcw size={15} />
                Reiniciar etapa
              </button>
            </div>
            {!demo || demo.kind === "guided" ? (
              <GuidedMovePlayer {...player} />
            ) : (
              <AlgorithmPlayer
                {...player}
                label={
                  demo.kind === "insertion"
                    ? stage >= 3
                      ? current.title
                      : "Inserción de la arista"
                    : undefined
                }
              />
            )}
            <div className="guidance">
              <span className="guidance-number">
                {complete ? <Check size={22} /> : `${stage + 1}`}
              </span>
              <div>
                <h2>
                  {complete
                    ? `${current.title}: completa`
                    : demo?.kind === "algorithm"
                      ? notationExample.title
                      : stage >= 3
                        ? current.guidance?.title
                        : target
                          ? `Esta pieza es ${pieceLabel(target)}.`
                          : "Observa las piezas de esta etapa."}
                </h2>
                <p aria-live="polite">
                  {complete
                    ? stage === 6
                      ? "Las seis caras están resueltas. Puedes volver a mezclar y practicar."
                      : "Has alcanzado el objetivo. Continúa cuando estés listo."
                    : demo?.kind === "algorithm"
                      ? notationExample.description
                      : demo && target && demoCursor < demo.moves.length
                        ? explainMove(
                            demo.moves[demoCursor],
                            state.find((p) => p.id === target.id)!,
                            reference,
                          )
                        : demo && demoCursor === demo.moves.length
                          ? "La pieza llegó a su destino y las piezas protegidas quedaron restauradas. Elige la siguiente pieza."
                          : stage < 3 && target
                            ? stage === 2 && !objective.recovery
                              ? `Esta arista ${pieceLabel(target)} pertenece a la segunda capa. ${target.position[1] === 0 ? "Primero la sacaremos de su posición actual y después la insertaremos orientada." : "La alinearemos en la capa inferior y la insertaremos entre sus centros."} La secuencia restaura la capa blanca y las aristas protegidas.`
                              : `Le corresponde el lugar entre los centros ${pieceLabel(target)}. El contorno marca su destino; las piezas con borde verde ya están bien colocadas.`
                            : (current.guidance?.explanation ??
                              current.description)}
                </p>
                <p className="protection-status" role="status">
                  {disturbed.length > 0
                    ? demo && demoCursor < demo.moves.length
                      ? "Algunas piezas protegidas se desplazan temporalmente. La secuencia las restaura al terminar."
                      : "Has desplazado piezas protegidas. El siguiente recorrido ayudará a restaurarlas."
                    : objective.recovery
                      ? "Restauraremos los objetivos anteriores antes de continuar con esta etapa."
                      : "Las piezas con borde verde están protegidas. Comprueba que vuelvan a su lugar al terminar."}
                </p>
              </div>
            </div>
            {planning && (
              <button className="text-button" onClick={cancelPlan}>
                Cancelar búsqueda
              </button>
            )}
            {message && (
              <p role="status" className="notice">
                {message}
              </p>
            )}
            {manualControls}
            <details className="algorithm-practice">
              <summary>Practicar un algoritmo con esta orientación</summary>
              <p>
                Sostén el cubo con F {COLOR_NAMES[FACE_COLORS[reference.front]]}{" "}
                al frente y U {COLOR_NAMES[FACE_COLORS[reference.up]]} arriba.
                Las letras de esta secuencia usan esa referencia; la cámara
                puede mirar desde otro ángulo.
              </p>
              <label>
                Mi algoritmo
                <input
                  value={practiceText}
                  onChange={(e) => setPracticeText(e.target.value)}
                  placeholder="R' D' R D"
                />
              </label>
              <div className="action-row">
                <button
                  className="primary"
                  disabled={busy || planning}
                  onClick={() => preparePractice(true)}
                >
                  Reproducir mi algoritmo
                </button>
                <button
                  className="text-button"
                  disabled={busy || planning}
                  onClick={() => preparePractice()}
                >
                  Ver pasos de mi algoritmo
                </button>
              </div>
            </details>
          </section>
        )}
        {!active && manualControls}
        {scrambleMoves.length > 0 && (
          <details className="scramble-detail">
            <summary>Ver mezcla utilizada</summary>
            <p>
              {scrambleMoves.map((m) => toRelative(m, reference)).join(" ")}
            </p>
          </details>
        )}
        {import.meta.env.DEV && (
          <details className="debug-panel">
            <summary>Herramientas de desarrollo</summary>
            <div className="debug-content">
              <button
                disabled={busy}
                onClick={() => {
                  cancelPlan();
                  stop();
                  setActive(false);
                  setHasScrambled(false);
                  setDemo(null);
                  updateHistory(newHistory(solvedCube()));
                }}
              >
                Estado resuelto
              </button>
              <button
                disabled={busy || planning}
                onClick={() => void doScramble(scramble(42, 12))}
              >
                Mezcla reproducible (42)
              </button>
              <label>
                Notación{" "}
                <input
                  value={debugText}
                  onChange={(e) => setDebugText(e.target.value)}
                />
              </label>
              <button
                disabled={busy || planning}
                onClick={() => {
                  try {
                    void doScramble(
                      parseMoves(debugText).map((m) =>
                        toPhysical(m, reference),
                      ),
                    );
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              >
                Usar como mezcla
              </button>
              <button
                disabled={busy || planning}
                onClick={() => {
                  try {
                    const moves = parseMoves(debugText).map((m) =>
                      toPhysical(m, reference),
                    );
                    if (moves.length) {
                      beginDemo({
                        moves,
                        start: history.cursor,
                        state,
                        kind: "algorithm",
                      });
                      setActive(true);
                    }
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              >
                Preparar secuencia
              </button>
              <label>
                Etapa{" "}
                <select
                  value={debugStage}
                  onChange={(e) => setDebugStage(+e.target.value)}
                >
                  {stages.map((s, i) => (
                    <option key={s.id} value={i}>
                      {i + 1}. {s.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                disabled={busy || planning}
                onClick={() => {
                  stop();
                  setStage(debugStage);
                  setActive(true);
                  setDemo(null);
                  updateHistory(newHistory(state));
                }}
              >
                Ir a etapa
              </button>
              <label>
                Pieza{" "}
                <select
                  value={debugPiece}
                  onChange={(e) => setDebugPiece(e.target.value)}
                >
                  <option value="">Objetivo automático</option>
                  {state.map((p) => (
                    <option key={p.id}>{p.id}</option>
                  ))}
                </select>
              </label>
              <button
                disabled={!debugPiece}
                onClick={() =>
                  setDebugProtected((p) =>
                    p.includes(debugPiece)
                      ? p.filter((id) => id !== debugPiece)
                      : [...p, debugPiece],
                  )
                }
              >
                Alternar protegida
              </button>
              <label>
                <input
                  type="checkbox"
                  checked={mute}
                  onChange={(e) => setMute(e.target.checked)}
                />{" "}
                Atenuar piezas irrelevantes
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={debugInspect}
                  onChange={(e) => setDebugInspect(e.target.checked)}
                />{" "}
                Inspeccionar identidades, posiciones y orientación
              </label>
              <label>
                Velocidad de animación{" "}
                <select
                  value={speed}
                  onChange={(e) => setSpeed(+e.target.value)}
                >
                  <option value={0.5}>0,5×</option>
                  <option value={1}>1×</option>
                  <option value={2}>2×</option>
                </select>
              </label>
              {debugInspect && (
                <pre>
                  {JSON.stringify(
                    debugPiece ? state.find((p) => p.id === debugPiece) : state,
                    null,
                    2,
                  )}
                </pre>
              )}
            </div>
          </details>
        )}
      </main>
    </div>
  );
}

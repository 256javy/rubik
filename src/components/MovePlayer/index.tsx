import {
  SkipBack,
  ChevronLeft,
  Play,
  Pause,
  ChevronRight,
  SkipForward,
} from "lucide-react";
import type { Move } from "../../cube/moves";
export interface PlayerProps {
  moves: Move[];
  cursor: number;
  busy: boolean;
  playing: boolean;
  onSeek: (n: number) => void;
  onPlay: () => void;
  speed: number;
  onSpeed: (n: number) => void;
}
export function MovePlayer({
  moves,
  cursor,
  busy,
  playing,
  onSeek,
  onPlay,
  speed,
  onSpeed,
}: PlayerProps) {
  return (
    <div className="move-player">
      <div className="transport">
        <button
          aria-label="Inicio de la demostración"
          disabled={busy || !cursor}
          onClick={() => onSeek(0)}
        >
          <SkipBack size={18} />
        </button>
        <button
          aria-label="Movimiento anterior"
          disabled={busy || !cursor}
          onClick={() => onSeek(cursor - 1)}
        >
          <ChevronLeft size={22} />
        </button>
        <button
          className="play-button"
          aria-label={playing ? "Pausar" : "Reproducir"}
          disabled={
            !moves.length || (!playing && busy) || cursor === moves.length
          }
          onClick={onPlay}
        >
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          aria-label="Movimiento siguiente"
          disabled={busy || cursor === moves.length}
          onClick={() => onSeek(cursor + 1)}
        >
          <ChevronRight size={22} />
        </button>
        <button
          aria-label="Final de la demostración"
          disabled={busy || cursor === moves.length}
          onClick={() => onSeek(moves.length)}
        >
          <SkipForward size={18} />
        </button>
      </div>
      <div className="timeline">
        <span>
          {cursor} / {moves.length}
        </span>
        <input
          aria-label="Posición en la demostración"
          type="range"
          min="0"
          max={moves.length || 1}
          value={cursor}
          disabled={busy || !moves.length}
          onChange={(e) => onSeek(+e.target.value)}
        />
        <label>
          Velocidad{" "}
          <select value={speed} onChange={(e) => onSpeed(+e.target.value)}>
            <option value={0.5}>0,5×</option>
            <option value={1}>1×</option>
            <option value={2}>2×</option>
          </select>
        </label>
      </div>
    </div>
  );
}
export function GuidedMovePlayer(props: PlayerProps) {
  return (
    <div>
      <p className="player-label">Recorrido de esta pieza</p>
      <div className="move-tokens">
        {props.moves.map((m, i) => (
          <button
            key={i}
            className={
              i === props.cursor ? "current" : i < props.cursor ? "past" : ""
            }
            disabled={props.busy}
            onClick={() => props.onSeek(i + 1)}
            aria-label={`Ir al movimiento ${i + 1}: ${m}`}
          >
            {m}
          </button>
        ))}
      </div>
      <MovePlayer {...props} />
    </div>
  );
}

import { MovePlayer, type PlayerProps } from "../MovePlayer";
export function AlgorithmPlayer(props: PlayerProps & { label?: string }) {
  return (
    <div>
      <p className="player-label">{props.label ?? "Secuencia de práctica"}</p>
      <div className="move-tokens">
        {props.moves.map((m, i) => (
          <button
            key={i}
            disabled={props.busy}
            className={
              i === props.cursor ? "current" : i < props.cursor ? "past" : ""
            }
            onClick={() => props.onSeek(i + 1)}
          >
            {m}
          </button>
        ))}
      </div>
      <MovePlayer {...props} />
    </div>
  );
}

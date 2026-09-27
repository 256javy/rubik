import { Suspense, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import {
  Group,
  Vector3,
  Quaternion,
  DoubleSide,
  CanvasTexture,
  BoxGeometry,
  EdgesGeometry,
} from "three";
import { MovementAxes } from "../axes";
import { FACE_COLORS, type Reference } from "../../cube/reference";
import { COLOR_NAMES } from "../../cube/model";
import { Cameras } from "../camera";
import { COLORS, type CubeState, type Piece, type Vec } from "../../cube/model";
import { moveInfo, type Move } from "../../cube/moves";
import { roleFor, type Attention } from "../highlighting";
import { diagram } from "../materials";
export interface Turn {
  move: Move;
  progress: number;
}
function Sticker({
  normal,
  color,
  muted,
}: {
  normal: Vec;
  color: string;
  muted: boolean;
}) {
  const rotation = useMemo(
    () =>
      new Quaternion().setFromUnitVectors(
        new Vector3(0, 0, 1),
        new Vector3(...normal),
      ),
    [normal],
  );
  return (
    <mesh
      position={normal.map((v) => v * 0.477) as [number, number, number]}
      quaternion={rotation}
    >
      <planeGeometry args={[0.78, 0.78]} />
      <meshBasicMaterial
        color={muted ? diagram.neutral : color}
        transparent
        opacity={muted ? 0.2 : 1}
        side={DoubleSide}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}
const outlineGeometry = new EdgesGeometry(new BoxGeometry(0.955, 0.955, 0.955));
function Outline({
  color,
  opacity = 1,
  scale = 1,
  depthTest = true,
}: {
  color: string;
  opacity?: number;
  scale?: number;
  depthTest?: boolean;
}) {
  return (
    <lineSegments geometry={outlineGeometry} scale={scale}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthTest={depthTest}
      />
    </lineSegments>
  );
}
function TargetBadge() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 80;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#243d61";
    ctx.fillRect(0, 0, 256, 80);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 34px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("OBJETIVO", 128, 40);
    return new CanvasTexture(canvas);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={[0, 0.78, 0]} scale={[1.15, 0.36, 1]} renderOrder={1100}>
      <spriteMaterial map={texture} depthTest={false} depthWrite={false} />
    </sprite>
  );
}
function Cubie({ piece, attention }: { piece: Piece; attention: Attention }) {
  const role = roleFor(piece.id, attention);
  const muted = role === "IRRELEVANT";
  return (
    <group
      position={piece.position.map((v) => v * 1.02) as [number, number, number]}
    >
      <RoundedBox args={[0.94, 0.94, 0.94]} radius={0.055} smoothness={2}>
        <meshBasicMaterial
          color={muted ? diagram.neutral : "#36434e"}
          transparent
          opacity={muted ? 0.72 : 1}
          depthWrite={true}
        />
      </RoundedBox>
      <Outline
        color={
          role === "TARGET"
            ? diagram.target
            : role === "PROTECTED"
              ? diagram.protected
              : diagram.outline
        }
        opacity={muted ? 0.6 : 1}
      />
      {piece.stickers.map((s) => (
        <Sticker
          key={s.color}
          normal={s.normal}
          color={COLORS[s.color]}
          muted={muted}
        />
      ))}
      {role === "TARGET" && attention.emphasizeTarget !== false && (
        <>
          <Outline color="#31b9ee" scale={1.12} depthTest={false} />
          <TargetBadge />
        </>
      )}
    </group>
  );
}
function Cube({
  state,
  attention,
  turn,
  destination,
}: {
  state: CubeState;
  attention: Attention;
  turn: Turn | null;
  destination?: Vec;
}) {
  const moving = useRef<Group>(null);
  const info = turn ? moveInfo(turn.move) : null;
  useFrame(() => {
    if (moving.current) {
      moving.current.rotation.set(0, 0, 0);
      if (info && turn)
        moving.current.rotation[["x", "y", "z"][info.axis] as "x" | "y" | "z"] =
          ((info.direction * info.turns * Math.PI) / 2) * turn.progress;
    }
  });
  const movingPieces = info
    ? state.filter((p) => p.position[info.axis] === info.layer)
    : [];
  return (
    <group>
      {state
        .filter((p) => !movingPieces.includes(p))
        .map((p) => (
          <Cubie key={p.id} piece={p} attention={attention} />
        ))}
      <group ref={moving}>
        {movingPieces.map((p) => (
          <Cubie key={p.id} piece={p} attention={attention} />
        ))}
      </group>
      {destination && (
        <group
          position={
            destination.map((v) => v * 1.02) as [number, number, number]
          }
        >
          <Outline
            color="#4e71bf"
            scale={1.13}
            opacity={0.7}
            depthTest={false}
          />
        </group>
      )}
    </group>
  );
}
export function Cube3D({
  state,
  attention,
  turn,
  destination,
  dual,
  reset,
  focus,
  reference,
  showAxes,
  referenceRequest,
  autoCamera,
  cameraStyle,
  stage,
  onSuggest,
}: {
  state: CubeState;
  attention: Attention;
  turn: Turn | null;
  destination?: Vec;
  dual: boolean;
  reset: number;
  focus?: Vec;
  reference: Reference;
  showAxes: boolean;
  referenceRequest: number;
  autoCamera: boolean;
  cameraStyle: "follow" | "stage";
  stage: number;
  onSuggest: (ref: Reference) => void;
}) {
  return (
    <div className={`cube-viewport ${dual ? "dual" : ""}`}>
      <span className="view-label">
        {dual
          ? "Vista principal"
          : autoCamera && cameraStyle === "stage"
            ? `Vista fija · ${stage >= 2 ? "amarillo" : "blanco"} arriba · rojo al frente`
            : `U ${COLOR_NAMES[FACE_COLORS[reference.up]]} · F ${COLOR_NAMES[FACE_COLORS[reference.front]]}`}
      </span>
      {dual && <span className="opposite-label">Vista opuesta</span>}
      <Canvas
        camera={{ position: [6, 5.2, 7], fov: 34 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        fallback={
          <p>
            Se necesita WebGL para mostrar el cubo. Prueba con un navegador
            actualizado.
          </p>
        }
      >
        <Suspense fallback={null}>
          <Cube
            state={state}
            attention={attention}
            turn={turn}
            destination={destination}
          />
          {showAxes && <MovementAxes reference={reference} />}
          <Cameras
            dual={dual}
            autoCamera={autoCamera}
            cameraStyle={cameraStyle}
            stage={stage}
            protagonist={state.find((p) => p.id === attention.target)}
            turn={turn}
            reset={reset}
            focus={focus}
            reference={reference}
            showAxes={showAxes}
            referenceRequest={referenceRequest}
            onSuggest={onSuggest}
          />
        </Suspense>
      </Canvas>
      <span className="orbit-hint">
        {autoCamera && cameraStyle === "stage"
          ? "Vista fija de etapa · desplaza para acercarte"
          : autoCamera && attention.target
            ? "La cámara sigue el objetivo · desplaza para acercarte"
            : "Arrastra para mirar alrededor · desplaza para acercarte"}
      </span>
    </div>
  );
}

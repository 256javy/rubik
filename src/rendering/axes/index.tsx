import { useMemo, useEffect } from "react";
import { Line } from "@react-three/drei";
import { CanvasTexture, Quaternion, Vector3 } from "three";
import { FACES, type Face } from "../../cube/moves";
import { normal, referenceMap, type Reference } from "../../cube/reference";
function Label({ face }: { face: Face }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fbfcfd";
    ctx.beginPath();
    ctx.arc(64, 64, 47, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#60788f";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#263746";
    ctx.font = "bold 66px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(face, 64, 66);
    return new CanvasTexture(canvas);
  }, [face]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite
      renderOrder={1000}
      position={[0, 0, 2.8]}
      scale={[0.56, 0.56, 0.56]}
    >
      <spriteMaterial map={texture} depthTest={false} />
    </sprite>
  );
}
export function MovementAxes({ reference }: { reference: Reference }) {
  const mapping = referenceMap(reference);
  return (
    <group>
      {FACES.map((face) => {
        const n = normal(mapping[face]);
        const q = new Quaternion().setFromUnitVectors(
          new Vector3(0, 0, 1),
          new Vector3(...n),
        );
        const end = -Math.PI * 0.6;
        const points = Array.from({ length: 28 }, (_, i) => {
          const angle = Math.PI * 0.9 + ((end - Math.PI * 0.9) * i) / 27;
          return [0.25 * Math.cos(angle), 0.25 * Math.sin(angle), 2.12] as [
            number,
            number,
            number,
          ];
        });
        return (
          <group key={face} quaternion={q}>
            <Line
              points={[
                [0, 0, 1.6],
                [0, 0, 2.55],
              ]}
              color="#61798e"
              lineWidth={1.5}
            />
            <Line points={points} color="#2e577a" lineWidth={2} />
            <mesh position={points.at(-1)} rotation={[0, 0, end + Math.PI]}>
              <coneGeometry args={[0.065, 0.16, 8]} />
              <meshBasicMaterial color="#2e577a" />
            </mesh>
            <Label face={face} />
          </group>
        );
      })}
    </group>
  );
}

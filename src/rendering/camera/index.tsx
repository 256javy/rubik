import { useRef, useMemo, useEffect } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { PerspectiveCamera, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import {
  suggestReference,
  normal,
  referenceMap,
  type Reference,
} from "../../cube/reference";
import { moveInfo } from "../../cube/moves";
import type { Turn } from "../Cube3D";
import type { Piece, Vec } from "../../cube/model";
export function Cameras({
  dual,
  autoCamera,
  cameraStyle,
  stage,
  protagonist,
  turn,
  reset,
  focus,
  reference,
  showAxes,
  referenceRequest,
  onSuggest,
}: {
  dual: boolean;
  autoCamera: boolean;
  cameraStyle: "follow" | "stage";
  stage: number;
  protagonist?: Piece;
  turn: Turn | null;
  reset: number;
  focus?: Vec;
  reference: Reference;
  showAxes: boolean;
  referenceRequest: number;
  onSuggest: (reference: Reference) => void;
}) {
  const { gl, scene, camera, size } = useThree();
  const controls = useRef<OrbitControlsImpl>(null);
  const opposite = useMemo(() => new PerspectiveCamera(34, 1, 0.1, 100), []);
  useEffect(() => {
    const fixed = autoCamera && cameraStyle === "stage";
    const viewReference: Reference = fixed
      ? { up: stage >= 2 ? "D" : "U", front: "F" }
      : reference;
    const up = new Vector3(...normal(viewReference.up)),
      front = new Vector3(...normal(viewReference.front)),
      right = new Vector3(...normal(referenceMap(viewReference).R));
    camera.up.copy(up);
    camera.position.copy(
      right
        .multiplyScalar(6)
        .add(up.multiplyScalar(5.2))
        .add(front.multiplyScalar(7)),
    );
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
  }, [
    reset,
    camera,
    reference.front,
    reference.up,
    autoCamera,
    cameraStyle,
    stage,
  ]);
  useEffect(() => {
    if (focus && !(autoCamera && cameraStyle === "stage")) {
      controls.current?.target.set(
        ...(focus.map((v) => v * 0.25) as [number, number, number]),
      );
      controls.current?.update();
    }
  }, [focus, autoCamera, cameraStyle]);
  const suggestRef = useRef(onSuggest);
  suggestRef.current = onSuggest;
  useEffect(() => {
    if (!referenceRequest) return;
    const center = controls.current?.target ?? new Vector3();
    const view = camera.position.clone().sub(center).normalize();
    const up = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    suggestRef.current(
      suggestReference(
        view.toArray() as [number, number, number],
        up.toArray() as [number, number, number],
      ),
    );
  }, [referenceRequest, camera]);
  useFrame((_, delta) => {
    if (
      autoCamera &&
      cameraStyle === "follow" &&
      protagonist &&
      controls.current
    ) {
      const direction = new Vector3(...protagonist.position);
      if (turn) {
        const info = moveInfo(turn.move);
        if (protagonist.position[info.axis] === info.layer) {
          const axis = new Vector3().setComponent(info.axis, 1);
          direction.applyAxisAngle(
            axis,
            ((info.direction * info.turns * Math.PI) / 2) * turn.progress,
          );
        }
      }
      const vertical = new Vector3(...normal(reference.up));
      // A slight lateral angle keeps both stickers visible on edges and
      // avoids a camera pole when the protagonist is directly above or below.
      const tangent = new Vector3().crossVectors(vertical, direction);
      if (tangent.lengthSq() < 0.01)
        tangent.set(...normal(referenceMap(reference).R));
      direction.addScaledVector(tangent.normalize(), 0.25).normalize();
      const distance = camera.position.distanceTo(controls.current.target);
      const desired = direction.multiplyScalar(distance);
      const blend = 1 - Math.exp(-delta * 7);
      controls.current.target.lerp(new Vector3(), blend);
      camera.position.lerp(desired, blend);
      controls.current.update();
    }

    const portrait = size.width < 650;
    const mainW =
      dual && !portrait ? Math.floor(size.width * 0.65) : size.width;
    const mainH =
      dual && portrait ? Math.floor(size.height * 0.64) : size.height;
    const mainY = size.height - mainH;
    const main = camera as PerspectiveCamera;
    main.fov = showAxes ? 44 : 34;
    main.aspect = mainW / mainH;
    main.updateProjectionMatrix();
    gl.setScissorTest(true);
    gl.setViewport(0, mainY, mainW, mainH);
    gl.setScissor(0, mainY, mainW, mainH);
    gl.render(scene, main);
    if (dual) {
      const target = controls.current?.target ?? new Vector3();
      const offset = main.position.clone().sub(target);
      const vertical = main.up.clone().normalize();
      opposite.position
        .copy(target)
        .add(vertical.multiplyScalar(2 * offset.dot(vertical)).sub(offset));
      opposite.up.copy(main.up);
      opposite.lookAt(target);
      const w = portrait ? size.width : size.width - mainW,
        h = portrait ? size.height - mainH : size.height;
      opposite.aspect = w / h;
      opposite.fov = main.fov;
      opposite.updateProjectionMatrix();
      gl.setViewport(portrait ? 0 : mainW, 0, w, h);
      gl.setScissor(portrait ? 0 : mainW, 0, w, h);
      gl.render(scene, opposite);
    }
    gl.setScissorTest(false);
  }, 1);
  return (
    <OrbitControls
      ref={controls}
      enableRotate={!autoCamera || (cameraStyle === "follow" && !protagonist)}
      enablePan={false}
      minDistance={showAxes ? 8 : 6}
      maxDistance={14}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI - 0.25}
      enableDamping={false}
    />
  );
}

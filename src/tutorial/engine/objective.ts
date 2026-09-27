import { pieceSolved, piecePositioned, type CubeState } from "../../cube/model";
import {
  whiteEdges,
  whiteCorners,
  middleEdges,
  yellowEdges,
  yellowCorners,
} from "../../cube/selectors";
import * as validators from "../../cube/validation";
const checks = [
  validators.crossComplete,
  validators.firstLayerComplete,
  validators.middleComplete,
  validators.yellowCrossComplete,
  validators.yellowEdgesComplete,
  validators.permutationComplete,
  validators.cubeSolved,
];
export function effectiveStageFor(state: CubeState, stage: number) {
  const first = checks.findIndex((check) => !check(state));
  return first < 0 ? stage : Math.min(stage, first);
}
export function objectivePieceComplete(
  p: import("../../cube/model").Piece,
  stage: number,
) {
  return stage === 3
    ? p.stickers.find((s) => s.color === "yellow")?.normal[1] === -1
    : stage === 5
      ? piecePositioned(p)
      : pieceSolved(p);
}
export function getObjective(state: CubeState, stage: number) {
  const group = [
    whiteEdges,
    whiteCorners,
    middleEdges,
    yellowEdges,
    yellowEdges,
    yellowCorners,
    yellowCorners,
  ][stage](state);
  const effectiveStage = effectiveStageFor(state, stage);
  const recovery = effectiveStage < stage;
  const targetGroup = [
    whiteEdges,
    whiteCorners,
    middleEdges,
    yellowEdges,
    yellowEdges,
    yellowCorners,
    yellowCorners,
  ][effectiveStage](state);
  const target = targetGroup.find(
    (p) => !objectivePieceComplete(p, effectiveStage),
  );
  const previous =
    effectiveStage === 0
      ? []
      : effectiveStage === 1
        ? whiteEdges(state)
        : effectiveStage === 2
          ? [...whiteEdges(state), ...whiteCorners(state)]
          : [
              ...whiteEdges(state),
              ...whiteCorners(state),
              ...middleEdges(state),
              ...(effectiveStage >= 5 ? yellowEdges(state) : []),
            ];
  const protectedPieces = [
    ...previous,
    ...(effectiveStage === 3 ? [] : targetGroup),
  ]
    .filter(pieceSolved)
    .filter((p) => p.id !== target?.id);
  // Keep each stage's pieces and earlier references colored by identity,
  // including while a sequence temporarily moves them out of place.
  const involved = [
    ...whiteEdges(state),
    ...(stage >= 1 ? whiteCorners(state) : []),
    ...(stage >= 2 ? middleEdges(state) : []),
    ...(stage >= 3 ? yellowEdges(state) : []),
    ...(stage >= 5 ? yellowCorners(state) : []),
  ];
  const involvedColors = new Set(
    involved.flatMap((p) => p.stickers.map((s) => s.color)),
  );
  const relevant = [
    ...involved,
    ...state.filter(
      (p) =>
        p.type === "center" &&
        p.stickers.some((s) => involvedColors.has(s.color)),
    ),
  ];
  return {
    effectiveStage,
    target,
    protectedPieces,
    relevant,
    group,
    recovery,
  };
}

// A protected identity stays protected even while temporarily displaced.
export function getProtectedIds(states: CubeState[], stage: number): string[] {
  return [
    ...new Set(
      states.flatMap((s) =>
        getObjective(s, stage).protectedPieces.map((p) => p.id),
      ),
    ),
  ];
}

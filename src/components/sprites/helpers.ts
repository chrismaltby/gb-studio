import l10n from "../../lib/helpers/l10n";
import { SpriteAnimationType } from "../../store/features/entities/entitiesTypes";

const animationNames = [
  l10n("FIELD_IDLE_DIR", { direction: l10n("FIELD_DIRECTION_RIGHT") }),
  l10n("FIELD_IDLE_DIR", { direction: l10n("FIELD_DIRECTION_LEFT") }),
  l10n("FIELD_IDLE_DIR", { direction: l10n("FIELD_DIRECTION_UP") }),
  l10n("FIELD_IDLE_DIR", { direction: l10n("FIELD_DIRECTION_DOWN") }),
  l10n("FIELD_MOVING_DIR", { direction: l10n("FIELD_DIRECTION_RIGHT") }),
  l10n("FIELD_MOVING_DIR", { direction: l10n("FIELD_DIRECTION_LEFT") }),
  l10n("FIELD_MOVING_DIR", { direction: l10n("FIELD_DIRECTION_UP") }),
  l10n("FIELD_MOVING_DIR", { direction: l10n("FIELD_DIRECTION_DOWN") }),
];

const multiAnimationNames = [
  l10n("FIELD_DIRECTION_RIGHT"),
  l10n("FIELD_DIRECTION_LEFT"),
  l10n("FIELD_DIRECTION_UP"),
  l10n("FIELD_DIRECTION_DOWN"),
];

const fixedAnimationNames = [l10n("FIELD_IDLE"), l10n("FIELD_MOVING")];

const platformAnimationNames = [
  l10n("FIELD_IDLE_DIR", { direction: l10n("FIELD_DIRECTION_RIGHT") }),
  l10n("FIELD_IDLE_DIR", { direction: l10n("FIELD_DIRECTION_LEFT") }),
  l10n("FIELD_JUMPING_DIR", { direction: l10n("FIELD_DIRECTION_RIGHT") }),
  l10n("FIELD_JUMPING_DIR", { direction: l10n("FIELD_DIRECTION_LEFT") }),
  l10n("FIELD_MOVING_DIR", { direction: l10n("FIELD_DIRECTION_RIGHT") }),
  l10n("FIELD_MOVING_DIR", { direction: l10n("FIELD_DIRECTION_LEFT") }),
  l10n("FIELD_CLIMBING"),
];

export const getAnimationNameByIndex = (
  type: SpriteAnimationType,
  flipLeft: boolean,
  animationIndex: number
) => {
  if (type === "fixed" || type === "fixed_movement") {
    return fixedAnimationNames[animationIndex];
  }
  if (type === "platform_player") {
    return filterAnimationsBySpriteType(platformAnimationNames, type, flipLeft)[
      animationIndex
    ];
  }
  if (type === "multi") {
    return filterAnimationsBySpriteType(multiAnimationNames, type, flipLeft)[
      animationIndex
    ];
  }
  return filterAnimationsBySpriteType(animationNames, type, flipLeft)[
    animationIndex
  ];
};

export const getAnimationNameById = (
  type: SpriteAnimationType,
  flipLeft: boolean,
  selectedId: string,
  animationIds: string[]
) => {
  const filteredIds =
    filterAnimationsBySpriteType(animationIds, type, flipLeft) || [];
  const animationIndex = filteredIds.indexOf(selectedId);
  return getAnimationNameByIndex(type, flipLeft, animationIndex);
};

const fixedIndexes = [0];
const fixedMovementIndexes = [0, 4];
const multiIndexes = [0, 1, 2, 3];
const multiFlipIndexes = [0, 2, 3];
const platformIndexes = [0, 1, 4, 5, 2, 3, 6];
const platformFlipIndexes = [0, 4, 2, 6];
const flipIndexes = [0, 2, 3, 4, 6, 7];

export const filterAnimationsBySpriteType = (
  animationIds: string[],
  type: SpriteAnimationType,
  flipLeft: boolean
): string[] => {
  if (type === "fixed") {
    return fixedIndexes.map((i) => animationIds[i]);
  }
  if (type === "fixed_movement") {
    return fixedMovementIndexes.map((i) => animationIds[i]);
  }
  if (type === "multi" && !flipLeft) {
    return multiIndexes.map((i) => animationIds[i]);
  }
  if (type === "multi" && flipLeft) {
    return multiFlipIndexes.map((i) => animationIds[i]);
  }
  if (type === "platform_player" && !flipLeft) {
    return platformIndexes.map((i) => animationIds[i]);
  }
  if (type === "platform_player" && flipLeft) {
    return platformFlipIndexes.map((i) => animationIds[i]);
  }
  if (flipLeft) {
    return flipIndexes.map((i) => animationIds[i]);
  }
  return animationIds;
};

export const animationIndexBySpriteType = (
  animationIndex: number,
  type: SpriteAnimationType,
  flipLeft: boolean
): number => {
  if (type === "fixed") {
    return fixedIndexes[animationIndex % fixedIndexes.length];
  }
  if (type === "fixed_movement") {
    return fixedMovementIndexes[animationIndex % fixedMovementIndexes.length];
  }
  if (type === "multi" && !flipLeft) {
    return multiIndexes[animationIndex % multiIndexes.length];
  }
  if (type === "multi" && flipLeft) {
    return multiFlipIndexes[animationIndex % multiFlipIndexes.length];
  }
  if (type === "platform_player" && !flipLeft) {
    return platformIndexes[animationIndex % platformIndexes.length];
  }
  if (type === "platform_player" && flipLeft) {
    return platformFlipIndexes[animationIndex % platformFlipIndexes.length];
  }
  if (flipLeft) {
    return flipIndexes[animationIndex % flipIndexes.length];
  }
  return animationIndex;
};

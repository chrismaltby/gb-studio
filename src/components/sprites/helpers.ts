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
  const filteredIds = filterAnimationsBySpriteType(
    animationIds,
    type,
    flipLeft
  );
  const animationIndex = filteredIds.indexOf(selectedId);
  return getAnimationNameByIndex(type, flipLeft, animationIndex);
};

export const filterAnimationsBySpriteType = (
  animationIds: string[],
  type: SpriteAnimationType,
  flipLeft: boolean
): string[] => {
  if (type === "fixed") {
    return [animationIds[0]];
  }
  if (type === "fixed_movement") {
    return [animationIds[0], animationIds[4]];
  }
  if (type === "multi" && !flipLeft) {
    return [animationIds[0], animationIds[1], animationIds[2], animationIds[3]];
  }
  if (type === "multi" && flipLeft) {
    return [animationIds[0], animationIds[2], animationIds[3]];
  }
  if (type === "platform_player" && !flipLeft) {
    return [
      animationIds[0],
      animationIds[1],
      animationIds[4],
      animationIds[5],
      animationIds[2],
      animationIds[3],
      animationIds[6],
    ];
  }
  if (type === "platform_player" && flipLeft) {
    return [animationIds[0], animationIds[4], animationIds[2], animationIds[6]];
  }
  if (flipLeft) {
    return [
      animationIds[0],
      animationIds[2],
      animationIds[3],
      animationIds[4],
      animationIds[6],
      animationIds[7],
    ];
  }
  return animationIds;
};

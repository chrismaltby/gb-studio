import { SpriteAnimationType } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import {
  filterAnimationsBySpriteType,
  AnimationType,
} from "shared/lib/sprites/helpers";

export const getAnimationNameForType = (type: AnimationType) => {
  const animationNameLookup: Record<AnimationType, string> = {
    idle: l10n("FIELD_IDLE"),
    moving: l10n("FIELD_MOVING"),
    idleLeft: l10n("FIELD_IDLE_DIR", {
      direction: l10n("FIELD_DIRECTION_LEFT"),
    }),
    idleRight: l10n("FIELD_IDLE_DIR", {
      direction: l10n("FIELD_DIRECTION_RIGHT"),
    }),
    idleUp: l10n("FIELD_IDLE_DIR", { direction: l10n("FIELD_DIRECTION_UP") }),
    idleDown: l10n("FIELD_IDLE_DIR", {
      direction: l10n("FIELD_DIRECTION_DOWN"),
    }),
    movingLeft: l10n("FIELD_MOVING_DIR", {
      direction: l10n("FIELD_DIRECTION_LEFT"),
    }),
    movingRight: l10n("FIELD_MOVING_DIR", {
      direction: l10n("FIELD_DIRECTION_RIGHT"),
    }),
    movingUp: l10n("FIELD_MOVING_DIR", {
      direction: l10n("FIELD_DIRECTION_UP"),
    }),
    movingDown: l10n("FIELD_MOVING_DIR", {
      direction: l10n("FIELD_DIRECTION_DOWN"),
    }),
    jumpingLeft: l10n("FIELD_JUMPING_DIR", {
      direction: l10n("FIELD_DIRECTION_LEFT"),
    }),
    jumpingRight: l10n("FIELD_JUMPING_DIR", {
      direction: l10n("FIELD_DIRECTION_RIGHT"),
    }),
    climbing: l10n("FIELD_CLIMBING"),
    hover: l10n("FIELD_HOVER"),
  };
  return animationNameLookup[type];
};

export const getAnimationNameByIndex = (
  type: SpriteAnimationType,
  flipLeft: boolean,
  animationIndex: number,
) => {
  if (type === "fixed" || type === "fixed_movement") {
    const fixedAnimationNames = [l10n("FIELD_IDLE"), l10n("FIELD_MOVING")];
    return fixedAnimationNames[animationIndex];
  }
  if (type === "platform_player") {
    const platformAnimationNames = [
      l10n("FIELD_IDLE_DIR", { direction: l10n("FIELD_DIRECTION_RIGHT") }),
      l10n("FIELD_IDLE_DIR", { direction: l10n("FIELD_DIRECTION_LEFT") }),
      l10n("FIELD_JUMPING_DIR", { direction: l10n("FIELD_DIRECTION_RIGHT") }),
      l10n("FIELD_JUMPING_DIR", { direction: l10n("FIELD_DIRECTION_LEFT") }),
      l10n("FIELD_MOVING_DIR", { direction: l10n("FIELD_DIRECTION_RIGHT") }),
      l10n("FIELD_MOVING_DIR", { direction: l10n("FIELD_DIRECTION_LEFT") }),
      l10n("FIELD_CLIMBING"),
    ];
    return filterAnimationsBySpriteType(platformAnimationNames, type, flipLeft)[
      animationIndex
    ];
  }
  if (type === "horizontal" || type === "horizontal_movement") {
    const horizontalAnimationNames = [
      l10n("FIELD_IDLE_DIR", { direction: l10n("FIELD_DIRECTION_RIGHT") }),
      l10n("FIELD_IDLE_DIR", { direction: l10n("FIELD_DIRECTION_LEFT") }),
      l10n("FIELD_MOVING_DIR", { direction: l10n("FIELD_DIRECTION_RIGHT") }),
      l10n("FIELD_MOVING_DIR", { direction: l10n("FIELD_DIRECTION_LEFT") }),
    ];
    return filterAnimationsBySpriteType(
      horizontalAnimationNames,
      type,
      flipLeft,
    )[animationIndex];
  }
  if (type === "multi") {
    const multiAnimationNames = [
      l10n("FIELD_DIRECTION_RIGHT"),
      l10n("FIELD_DIRECTION_LEFT"),
      l10n("FIELD_DIRECTION_UP"),
      l10n("FIELD_DIRECTION_DOWN"),
    ];
    return filterAnimationsBySpriteType(multiAnimationNames, type, flipLeft)[
      animationIndex
    ];
  }
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
  return filterAnimationsBySpriteType(animationNames, type, flipLeft)[
    animationIndex
  ];
};

export const getAnimationNameById = (
  type: SpriteAnimationType,
  flipLeft: boolean,
  selectedId: string,
  animationIds: string[],
) => {
  const filteredIds =
    filterAnimationsBySpriteType(animationIds, type, flipLeft) || [];
  const animationIndex = filteredIds.indexOf(selectedId);
  return getAnimationNameByIndex(type, flipLeft, animationIndex);
};

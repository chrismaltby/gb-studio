import React, { memo, useCallback, useContext, useMemo } from "react";
import { useAppSelector } from "store/hooks";
import {
  ActorNormalized,
  ActorPrefabNormalized,
} from "shared/lib/entities/entitiesTypes";
import {
  Option,
  OptionLabelWithPreview,
  Select,
  SingleValueWithPreview,
} from "ui/form/Select";
import {
  actorPrefabSelectors,
  actorSelectors,
  customEventSelectors,
  getSceneActorIds,
  sceneSelectors,
} from "store/features/entities/entitiesSelectors";
import { actorName } from "shared/lib/entities/entitiesHelpers";
import SpriteSheetCanvas from "components/rendering/SpriteSheetCanvas";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";
import l10n from "shared/lib/lang/l10n";
import { components, GroupBase } from "react-select";
import type { SingleValue, SingleValueProps } from "react-select";
import { ActorDirection } from "shared/lib/resources/types";

interface ActorSelectProps {
  name: string;
  value: string;
  onChange: (newValue: string) => void;
  direction?: ActorDirection;
  frame?: number;
}

type ActorOption = Option & {
  spriteSheetId?: string;
  direction?: ActorDirection;
};

const allCustomEventActors = Array.from(Array(10).keys()).map((i) => ({
  id: String(i),
  letter: String.fromCharCode("A".charCodeAt(0) + i),
}));

const ActorSelectComponent = ({
  name,
  value,
  onChange,
  direction,
  frame,
}: ActorSelectProps) => {
  const context = useContext(ScriptEditorContext);

  const sceneType = useAppSelector(
    (state) => sceneSelectors.selectById(state, context.sceneId)?.type,
  );

  const scenePlayerSpriteSheetId = useAppSelector(
    (state) =>
      sceneSelectors.selectById(state, context.sceneId)?.playerSpriteSheetId,
  );

  const defaultPlayerSprites = useAppSelector(
    (state) => state.project.present.settings.defaultPlayerSprites,
  );

  const sceneActorIds = useAppSelector((state) =>
    getSceneActorIds(state, { id: context.sceneId }),
  );

  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state),
  );

  const actorPrefabsLookup = useAppSelector((state) =>
    actorPrefabSelectors.selectEntities(state),
  );

  const actorPrefabIds = useAppSelector((state) =>
    actorPrefabSelectors.selectIds(state),
  );

  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, context.entityId),
  );

  const sceneActorId = context.instanceId
    ? context.instanceId
    : context.entityId;

  const sceneActorIndex = sceneActorIds?.indexOf(sceneActorId);
  const sceneActor = actorsLookup[sceneActorId];
  const selfPrefab = actorPrefabsLookup[context.entityId];
  const selfPrefabIndex = actorPrefabIds.indexOf(context.entityId);

  const playerSpriteSheetId =
    scenePlayerSpriteSheetId || (sceneType && defaultPlayerSprites[sceneType]);

  const getActorSpriteId = useCallback(
    (actorId: string): string => {
      const actor = actorsLookup[actorId];

      if (!actor) {
        return "";
      }

      const prefab = actorPrefabsLookup[actor.prefabId];

      if (!prefab) {
        return actor.spriteSheetId;
      }

      return prefab.spriteSheetId;
    },
    [actorPrefabsLookup, actorsLookup],
  );

  const options = useMemo<ActorOption[]>(() => {
    if (context.type === "script" && customEvent) {
      return [
        {
          label: l10n("FIELD_PLAYER"),
          value: "player",
          spriteSheetId: playerSpriteSheetId,
        },
        ...allCustomEventActors.map((actor) => ({
          label:
            customEvent.actors[actor.id]?.name ??
            `${l10n("FIELD_ACTOR")} ${actor.letter}`,
          value: actor.id,
        })),
      ];
    }

    if (
      (context.type === "entity" || context.type === "prefab") &&
      sceneActorIds
    ) {
      const sceneActorOptions = sceneActorIds.reduce<ActorOption[]>(
        (memo, actorId, actorIndex) => {
          const actor = actorsLookup[actorId];

          if (!actor) {
            return memo;
          }

          memo.push({
            label: actorName(actor as ActorNormalized, actorIndex),
            value: actor.id,
            spriteSheetId: getActorSpriteId(actor.id),
            direction: actor.direction,
          });

          return memo;
        },
        [],
      );

      return [
        ...((context.entityType === "actor" ||
          context.entityType === "actorPrefab") &&
        sceneActor &&
        sceneActorIndex !== undefined &&
        sceneActorIndex >= 0
          ? [
              {
                label: `${l10n("FIELD_SELF")} (${actorName(
                  sceneActor as ActorNormalized,
                  sceneActorIndex,
                )})`,
                value: "$self$",
                spriteSheetId: getActorSpriteId(sceneActor.id),
                direction: sceneActor.direction,
              },
            ]
          : []),
        {
          label: l10n("FIELD_PLAYER"),
          value: "player",
          spriteSheetId: playerSpriteSheetId,
        },
        ...sceneActorOptions,
      ];
    }

    if (context.type === "prefab") {
      return [
        ...(context.entityType === "actorPrefab" &&
        selfPrefab &&
        selfPrefabIndex >= 0
          ? [
              {
                label: `${l10n("FIELD_SELF")} (${actorName(
                  selfPrefab as ActorPrefabNormalized,
                  selfPrefabIndex,
                )})`,
                value: "$self$",
                spriteSheetId: selfPrefab.spriteSheetId,
                direction: "down" as ActorDirection,
              },
            ]
          : []),
        {
          label: l10n("FIELD_PLAYER"),
          value: "player",
          spriteSheetId: playerSpriteSheetId,
        },
      ];
    }

    return [
      {
        label: l10n("FIELD_PLAYER"),
        value: "player",
        spriteSheetId: playerSpriteSheetId,
      },
    ];
  }, [
    actorsLookup,
    context,
    customEvent,
    getActorSpriteId,
    playerSpriteSheetId,
    sceneActor,
    sceneActorIds,
    sceneActorIndex,
    selfPrefab,
    selfPrefabIndex,
  ]);

  const currentValue = useMemo(
    () => options.find((option) => option.value === value) || options[0],
    [options, value],
  );

  const onSelectChange = useCallback(
    (newValue: SingleValue<ActorOption>) => {
      if (newValue) {
        onChange(newValue.value);
      }
    },
    [onChange],
  );

  const formatOptionLabel = useCallback(
    (option: ActorOption) => {
      return option.spriteSheetId ? (
        <OptionLabelWithPreview
          preview={
            <SpriteSheetCanvas
              spriteSheetId={option.spriteSheetId}
              direction={direction || option.direction}
              frame={frame}
            />
          }
        >
          {option.label}
        </OptionLabelWithPreview>
      ) : (
        option.label
      );
    },
    [direction, frame],
  );

  const SingleValueComponent = useCallback(
    (props: SingleValueProps<ActorOption, false, GroupBase<ActorOption>>) => {
      return currentValue?.spriteSheetId ? (
        <SingleValueWithPreview
          preview={
            <SpriteSheetCanvas
              spriteSheetId={currentValue.spriteSheetId}
              direction={direction || currentValue.direction}
              frame={frame}
            />
          }
        >
          {currentValue.label}
        </SingleValueWithPreview>
      ) : (
        <components.SingleValue {...props}>
          {currentValue?.label}
        </components.SingleValue>
      );
    },
    [
      currentValue?.direction,
      currentValue?.label,
      currentValue?.spriteSheetId,
      direction,
      frame,
    ],
  );

  const selectComponents = useMemo(
    () => ({
      SingleValue: SingleValueComponent,
    }),
    [SingleValueComponent],
  );

  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={onSelectChange}
      formatOptionLabel={formatOptionLabel}
      components={selectComponents}
    />
  );
};

export const ActorSelect = memo(ActorSelectComponent);

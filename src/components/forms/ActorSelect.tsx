import React, { useContext, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import {
  ActorNormalized,
  ActorDirection,
} from "shared/lib/entities/entitiesTypes";
import {
  Option,
  OptionLabelWithPreview,
  Select,
  SingleValueWithPreview,
} from "ui/form/Select";
import {
  actorSelectors,
  customEventSelectors,
  getSceneActorIds,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import { actorName } from "shared/lib/entities/entitiesHelpers";
import SpriteSheetCanvas from "components/world/SpriteSheetCanvas";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import l10n from "shared/lib/lang/l10n";

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

export const ActorSelect = ({
  name,
  value,
  onChange,
  direction,
  frame,
}: ActorSelectProps) => {
  const context = useContext(ScriptEditorContext);
  const [options, setOptions] = useState<ActorOption[]>([]);
  const [currentValue, setCurrentValue] = useState<ActorOption>();
  const sceneType = useAppSelector(
    (state) => sceneSelectors.selectById(state, context.sceneId)?.type
  );
  const scenePlayerSpriteSheetId = useAppSelector(
    (state) =>
      sceneSelectors.selectById(state, context.sceneId)?.playerSpriteSheetId
  );
  const defaultPlayerSprites = useAppSelector(
    (state) => state.project.present.settings.defaultPlayerSprites
  );
  const sceneActorIds = useAppSelector((state) =>
    getSceneActorIds(state, { id: context.sceneId })
  );
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state)
  );
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, context.entityId)
  );
  const selfIndex = sceneActorIds?.indexOf(context.entityId);
  const selfActor = actorsLookup[context.entityId];
  const playerSpriteSheetId =
    scenePlayerSpriteSheetId || (sceneType && defaultPlayerSprites[sceneType]);

  useEffect(() => {
    if (context.type === "script" && customEvent) {
      setOptions([
        {
          label: l10n("FIELD_PLAYER"),
          value: "player",
          spriteSheetId: playerSpriteSheetId,
        },
        ...allCustomEventActors.map((actor) => {
          return {
            label:
              customEvent.actors[actor.id]?.name ??
              `${l10n("FIELD_ACTOR")} ${actor.letter}`,
            value: actor.id,
          };
        }),
      ]);
    } else if (context.type === "entity" && sceneActorIds) {
      setOptions([
        ...(context.entityType === "actor" &&
        selfActor &&
        selfIndex !== undefined
          ? [
              {
                label: `${l10n("FIELD_SELF")} (${actorName(
                  selfActor,
                  selfIndex
                )})`,
                value: "$self$",
                spriteSheetId: selfActor.spriteSheetId,
                direction: selfActor.direction,
              },
            ]
          : []),
        {
          label: l10n("FIELD_PLAYER"),
          value: "player",
          spriteSheetId: playerSpriteSheetId,
        },
        ...sceneActorIds.map((actorId, actorIndex) => {
          const actor = actorsLookup[actorId] as ActorNormalized;
          return {
            label: actorName(actor, actorIndex),
            value: actor.id,
            spriteSheetId: actor.spriteSheetId,
            direction: actor.direction,
          };
        }),
      ]);
    } else {
      setOptions([
        {
          label: "Player",
          value: "player",
          spriteSheetId: playerSpriteSheetId,
        },
      ]);
    }
  }, [
    actorsLookup,
    context,
    customEvent,
    playerSpriteSheetId,
    sceneActorIds,
    selfActor,
    selfIndex,
  ]);

  useEffect(() => {
    setCurrentValue(
      options.find((option) => {
        return option.value === value;
      }) || options[0]
    );
  }, [options, value]);

  return (
    <Select
      name={name}
      value={currentValue}
      options={options}
      onChange={(newValue: ActorOption) => {
        onChange?.(newValue.value);
      }}
      formatOptionLabel={(option: ActorOption) => {
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
      }}
      components={{
        SingleValue: () =>
          currentValue?.spriteSheetId ? (
            <SingleValueWithPreview
              preview={
                <SpriteSheetCanvas
                  spriteSheetId={currentValue.spriteSheetId}
                  direction={direction || currentValue.direction}
                  frame={frame}
                />
              }
            >
              {currentValue?.label}
            </SingleValueWithPreview>
          ) : (
            currentValue?.label
          ),
      }}
    />
  );
};

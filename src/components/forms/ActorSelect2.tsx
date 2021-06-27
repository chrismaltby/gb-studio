import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Actor, ActorDirection } from "store/features/entities/entitiesTypes";
import { RootState } from "store/configureStore";
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
import { actorName } from "store/features/entities/entitiesHelpers";
import l10n from "lib/helpers/l10n";
import SpriteSheetCanvas from "components/world/SpriteSheetCanvas";

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
  name: `Actor ${String.fromCharCode("A".charCodeAt(0) + i)}`,
}));

export const ActorSelect = ({
  name,
  value,
  onChange,
  direction,
  frame,
}: ActorSelectProps) => {
  const [options, setOptions] = useState<ActorOption[]>([]);
  const [currentValue, setCurrentValue] = useState<ActorOption>();

  const editorType = useSelector((state: RootState) => state.editor.type);
  const sceneId = useSelector((state: RootState) => state.editor.scene);
  const sceneType = useSelector(
    (state: RootState) => sceneSelectors.selectById(state, sceneId)?.type
  );
  const scenePlayerSpriteSheetId = useSelector(
    (state: RootState) =>
      sceneSelectors.selectById(state, sceneId)?.playerSpriteSheetId
  );
  const defaultPlayerSprites = useSelector(
    (state: RootState) => state.project.present.settings.defaultPlayerSprites
  );
  const contextEntityId = useSelector(
    (state: RootState) => state.editor.entityId
  );
  const sceneActorIds = useSelector((state: RootState) =>
    getSceneActorIds(state, { id: sceneId })
  );
  const actorsLookup = useSelector((state: RootState) =>
    actorSelectors.selectEntities(state)
  );
  const customEvent = useSelector((state: RootState) =>
    customEventSelectors.selectById(state, contextEntityId)
  );
  const selfIndex = sceneActorIds?.indexOf(contextEntityId);
  const selfActor = actorsLookup[contextEntityId];
  const playerSpriteSheetId =
    scenePlayerSpriteSheetId || (sceneType && defaultPlayerSprites[sceneType]);

  useEffect(() => {
    if (editorType === "customEvent" && customEvent) {
      setOptions([
        {
          label: "Player",
          value: "player",
          spriteSheetId: playerSpriteSheetId,
        },
        ...allCustomEventActors.map((actor) => {
          return {
            label: customEvent.actors[actor.id]?.name ?? actor.name,
            value: actor.id,
          };
        }),
      ]);
    } else if (sceneActorIds) {
      setOptions([
        ...(editorType === "actor" && selfActor && selfIndex !== undefined
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
          label: "Player",
          value: "player",
          spriteSheetId: playerSpriteSheetId,
        },
        ...sceneActorIds.map((actorId, actorIndex) => {
          const actor = actorsLookup[actorId] as Actor;
          return {
            label: actorName(actor, actorIndex),
            value: actor.id,
            spriteSheetId: actor.spriteSheetId,
            direction: actor.direction,
          };
        }),
      ]);
    }
  }, [
    actorsLookup,
    contextEntityId,
    customEvent,
    editorType,
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

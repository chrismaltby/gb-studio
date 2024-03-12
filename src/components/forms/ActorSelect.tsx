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
  name: `Actor ${String.fromCharCode("A".charCodeAt(0) + i)}`,
}));

export const ActorSelect = ({
  name,
  value,
  onChange,
  direction,
  frame,
}: ActorSelectProps) => {
  const context = useContext(ScriptEditorContext);
  const editorType = useAppSelector((state) => state.editor.type);
  const [options, setOptions] = useState<ActorOption[]>([]);
  const [currentValue, setCurrentValue] = useState<ActorOption>();
  const sceneId = useAppSelector((state) => state.editor.scene);
  const sceneType = useAppSelector(
    (state) => sceneSelectors.selectById(state, sceneId)?.type
  );
  const scenePlayerSpriteSheetId = useAppSelector(
    (state) => sceneSelectors.selectById(state, sceneId)?.playerSpriteSheetId
  );
  const defaultPlayerSprites = useAppSelector(
    (state) => state.project.present.settings.defaultPlayerSprites
  );
  const contextEntityId = useAppSelector((state) => state.editor.entityId);
  const sceneActorIds = useAppSelector((state) =>
    getSceneActorIds(state, { id: sceneId })
  );
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state)
  );
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, contextEntityId)
  );
  const selfIndex = sceneActorIds?.indexOf(contextEntityId);
  const selfActor = actorsLookup[contextEntityId];
  const playerSpriteSheetId =
    scenePlayerSpriteSheetId || (sceneType && defaultPlayerSprites[sceneType]);

  useEffect(() => {
    if (context === "script" && customEvent) {
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
    } else if (context === "entity" && sceneActorIds) {
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

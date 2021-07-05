import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Actor } from "store/features/entities/entitiesTypes";
import { RootState } from "store/configureStore";
import {
  OptGroup,
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

interface PropertySelectProps {
  name: string;
  value: string;
  onChange: (newValue: string) => void;
}

type ActorOption = Option & {
  spriteSheetId?: string;
  menuSpriteSheetId?: string;
};

type ActorOptGroup = OptGroup & {
  options: ActorOption[];
};

const allCustomEventActors = Array.from(Array(10).keys()).map((i) => ({
  id: String(i),
  name: `Actor ${String.fromCharCode("A".charCodeAt(0) + i)}`,
}));

export const PropertySelect = ({
  name,
  value,
  onChange,
}: PropertySelectProps) => {
  const [options, setOptions] = useState<ActorOptGroup[]>([]);
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
      setOptions(
        [
          {
            label: "Player",
            value: "player",
          },
          ...allCustomEventActors.map((actor) => {
            return {
              label: customEvent.actors[actor.id]?.name ?? actor.name,
              value: actor.id,
            };
          }),
        ].map((actorOption) => {
          return {
            label: actorOption.label,
            options: [
              {
                ...actorOption,
                label: l10n("FIELD_X_POSITION"),
                value: `${actorOption.value}:xpos`,
              },
              {
                ...actorOption,
                label: l10n("FIELD_Y_POSITION"),
                value: `${actorOption.value}:ypos`,
              },
              {
                ...actorOption,
                label: l10n("FIELD_DIRECTION"),
                value: `${actorOption.value}:direction`,
              },
              {
                ...actorOption,
                label: l10n("FIELD_ANIMATION_FRAME"),
                value: `${actorOption.value}:frame`,
              },
            ],
          };
        })
      );
    } else if (sceneActorIds) {
      setOptions(
        [
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
            };
          }),
        ].map((actorOption) => {
          return {
            label: actorOption.label,
            options: [
              {
                ...actorOption,
                label: l10n("FIELD_X_POSITION"),
                value: `${actorOption.value}:xpos`,
                menuSpriteSheetId: actorOption.spriteSheetId,
              },
              {
                ...actorOption,
                label: l10n("FIELD_Y_POSITION"),
                value: `${actorOption.value}:ypos`,
                menuSpriteSheetId: "",
              },
              {
                ...actorOption,
                label: l10n("FIELD_DIRECTION"),
                value: `${actorOption.value}:direction`,
                menuSpriteSheetId: "",
              },
              {
                ...actorOption,
                label: l10n("FIELD_ANIMATION_FRAME"),
                value: `${actorOption.value}:frame`,
                menuSpriteSheetId: "",
              },
            ],
          };
        })
      );
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
    let option: Option | null = null;
    options.find((optGroup) => {
      const foundOption = optGroup.options.find((opt) => opt.value === value);
      if (foundOption) {
        option = foundOption;
        return true;
      }
      return false;
    });
    setCurrentValue(option || options[0]?.options[0]);
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
        return option.menuSpriteSheetId !== undefined ? (
          <OptionLabelWithPreview
            preview={
              <SpriteSheetCanvas spriteSheetId={option.menuSpriteSheetId} />
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
          currentValue?.spriteSheetId !== undefined ? (
            <SingleValueWithPreview
              preview={
                <SpriteSheetCanvas spriteSheetId={currentValue.spriteSheetId} />
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

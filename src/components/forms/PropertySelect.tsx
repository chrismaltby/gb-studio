import React, { ReactElement, useContext, useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import {
  ActorDirection,
  ActorNormalized,
  UnitType,
} from "shared/lib/entities/entitiesTypes";
import {
  OptGroup,
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
} from "store/features/entities/entitiesState";
import { actorName } from "shared/lib/entities/entitiesHelpers";
import l10n from "shared/lib/lang/l10n";
import SpriteSheetCanvas from "components/world/SpriteSheetCanvas";
import styled from "styled-components";
import { UnitsSelectButtonInputOverlay } from "./UnitsSelectButtonInputOverlay";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import { components, SingleValue } from "react-select";
import { CameraIcon } from "ui/icons/Icons";

interface PropertySelectProps {
  name: string;
  value: string;
  onChange: (newValue: string) => void;
  units?: UnitType;
  unitsAllowed?: UnitType[];
  onChangeUnits?: (newUnits: UnitType) => void;
}

type PropertyOption = Option & {
  spriteSheetId?: string;
  menuSpriteSheetId?: string;
  icon?: ReactElement;
  menuIcon?: ReactElement;
};

type PropertyOptGroup = OptGroup & {
  options: PropertyOption[];
};

const allCustomEventActors = Array.from(Array(10).keys()).map((i) => ({
  id: String(i),
  name: `Actor ${String.fromCharCode("A".charCodeAt(0) + i)}`,
}));

const PropertySelectWrapper = styled.div`
  position: relative;
  width: 100%;
  min-width: 78px;
`;

const IconWrapper = styled.div`
  display: inline;
  align-items: center;
  font-weight: bold;

  svg {
    width: 15px;
    margin-right: 3px;
    margin-top: 3px;
    fill: ${(props) => props.theme.colors.secondaryText};
  }
`;

export const PropertySelect = ({
  name,
  value,
  onChange,
  units,
  unitsAllowed,
  onChangeUnits,
}: PropertySelectProps) => {
  const context = useContext(ScriptEditorContext);
  const [options, setOptions] = useState<PropertyOptGroup[]>([]);
  const [currentValue, setCurrentValue] = useState<PropertyOption>();

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
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, context.entityId),
  );
  const actorPrefabsLookup = useAppSelector((state) =>
    actorPrefabSelectors.selectEntities(state),
  );
  const actorPrefabIds = useAppSelector((state) =>
    actorPrefabSelectors.selectIds(state),
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

  useEffect(() => {
    const actorToOptions = (actorOption: {
      label: string;
      value: string;
      spriteSheetId?: string;
    }) => {
      return {
        label: actorOption.label,
        options: [
          {
            ...actorOption,
            label: l10n("FIELD_X_POSITION"),
            value: `${actorOption.value}:xpos`,
            menuSpriteSheetId: actorOption.spriteSheetId ?? "",
          },
          {
            ...actorOption,
            label: l10n("FIELD_Y_POSITION"),
            value: `${actorOption.value}:ypos`,
            menuSpriteSheetId: "",
          },
          {
            ...actorOption,
            label: l10n("FIELD_PX_POSITION"),
            value: `${actorOption.value}:pxpos`,
            menuSpriteSheetId: "",
          },
          {
            ...actorOption,
            label: l10n("FIELD_PY_POSITION"),
            value: `${actorOption.value}:pypos`,
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
            label: l10n("FIELD_FRAME"),
            value: `${actorOption.value}:frame`,
            menuSpriteSheetId: "",
          },
        ],
      };
    };

    let actorOptions: PropertyOptGroup[] = [];
    if (context.entityType === "customEvent" && customEvent) {
      actorOptions = [
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
      ].map(actorToOptions);
    } else if (sceneActorIds) {
      actorOptions = [
        ...((context.entityType === "actor" ||
          context.entityType === "actorPrefab") &&
        sceneActor &&
        sceneActorIndex !== undefined
          ? [
              {
                label: `${l10n("FIELD_SELF")} (${actorName(
                  sceneActor,
                  sceneActorIndex,
                )})`,
                value: "$self$",
                spriteSheetId: sceneActor.spriteSheetId,
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
          };
        }),
      ].map(actorToOptions);
    } else if (context.type === "prefab") {
      actorOptions = [
        ...(context.entityType === "actorPrefab" &&
        selfPrefab &&
        selfPrefabIndex !== undefined
          ? [
              {
                label: `${l10n("FIELD_SELF")} (${actorName(
                  selfPrefab,
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
      ].map(actorToOptions);
    }

    const cameraOptions = {
      label: l10n("FIELD_CAMERA"),
      options: [
        {
          label: l10n("FIELD_X_POSITION"),
          value: "camera:xpos",
          icon: <CameraIcon />,
          menuIcon: <CameraIcon />,
        },
        {
          label: l10n("FIELD_Y_POSITION"),
          value: "camera:ypos",
          icon: <CameraIcon />,
          menuIcon: "",
        },
        {
          label: l10n("FIELD_PX_POSITION"),
          value: "camera:pxpos",
          icon: <CameraIcon />,
          menuIcon: "",
        },
        {
          label: l10n("FIELD_PY_POSITION"),
          value: "camera:pypos",
          icon: <CameraIcon />,
          menuIcon: "",
        },
        {
          label: l10n("FIELD_DEADZONE_X"),
          value: "camera:xdeadzone",
          icon: <CameraIcon />,
          menuIcon: "",
        },
        {
          label: l10n("FIELD_DEADZONE_Y"),
          value: "camera:ydeadzone",
          icon: <CameraIcon />,
          menuIcon: "",
        },
        {
          label: l10n("FIELD_OFFSET_X"),
          value: "camera:xoffset",
          icon: <CameraIcon />,
          menuIcon: "",
        },
        {
          label: l10n("FIELD_OFFSET_Y"),
          value: "camera:yoffset",
          icon: <CameraIcon />,
          menuIcon: "",
        },
      ],
    } as PropertyOptGroup;

    const allOptions: PropertyOptGroup[] = actorOptions.concat([cameraOptions]);
    setOptions(allOptions);
  }, [
    actorsLookup,
    context.entityType,
    customEvent,
    playerSpriteSheetId,
    sceneActorIds,
    sceneActor,
    sceneActorIndex,
    context.type,
    selfPrefab,
    selfPrefabIndex,
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
    <PropertySelectWrapper>
      <Select
        name={name}
        value={currentValue}
        options={options}
        onChange={(newValue: SingleValue<PropertyOption>) => {
          if (newValue) {
            onChange?.(newValue.value);
          }
        }}
        formatOptionLabel={(option: PropertyOption) => {
          return option.menuSpriteSheetId !== undefined ? (
            <OptionLabelWithPreview
              preview={
                <SpriteSheetCanvas spriteSheetId={option.menuSpriteSheetId} />
              }
            >
              {option.label}
            </OptionLabelWithPreview>
          ) : option?.menuIcon !== undefined ? (
            <OptionLabelWithPreview
              preview={<IconWrapper>{option.menuIcon}</IconWrapper>}
            >
              {option.label}
            </OptionLabelWithPreview>
          ) : (
            option.label
          );
        }}
        components={{
          SingleValue: (props) =>
            currentValue?.spriteSheetId !== undefined ? (
              <SingleValueWithPreview
                preview={
                  <SpriteSheetCanvas
                    spriteSheetId={currentValue.spriteSheetId}
                  />
                }
              >
                {currentValue?.label}
              </SingleValueWithPreview>
            ) : currentValue?.icon ? (
              <SingleValueWithPreview
                preview={<IconWrapper>{currentValue.icon}</IconWrapper>}
              >
                {currentValue?.label}
              </SingleValueWithPreview>
            ) : (
              <components.SingleValue {...props}>
                {currentValue?.label}
              </components.SingleValue>
            ),
        }}
      />
      {units && (
        <UnitsSelectButtonInputOverlay
          parentValue={(currentValue && `$${currentValue.label}`) ?? ""}
          parentValueOffset={16}
          value={units}
          allowedValues={unitsAllowed}
          onChange={onChangeUnits}
        />
      )}
    </PropertySelectWrapper>
  );
};

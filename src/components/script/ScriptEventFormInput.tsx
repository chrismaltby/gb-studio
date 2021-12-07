import { ActorSelect } from "components/forms/ActorSelect";
import { AnimationSpeedSelect } from "components/forms/AnimationSpeedSelect";
import AnimationStateSelect from "components/forms/AnimationStateSelect";
import { AvatarSelect } from "components/forms/AvatarSelect";
import { BackgroundSelect } from "components/forms/BackgroundSelect";
import { CameraSpeedSelect } from "components/forms/CameraSpeedSelect";
import CollisionMaskPicker from "components/forms/CollisionMaskPicker";
import { CustomEventSelect } from "components/forms/CustomEventSelect";
import DirectionPicker from "components/forms/DirectionPicker";
import { EmoteSelect } from "components/forms/EmoteSelect";
import EngineFieldSelect from "components/forms/EngineFieldSelect";
import { FadeSpeedSelect } from "components/forms/FadeSpeedSelect";
import InputPicker from "components/forms/InputPicker";
import { MovementSpeedSelect } from "components/forms/MovementSpeedSelect";
import { MusicSelect } from "components/forms/MusicSelect";
import { OperatorSelect } from "components/forms/OperatorSelect";
import { OverlayColorSelect } from "components/forms/OverlayColorSelect";
import { PaletteSelect } from "components/forms/PaletteSelect";
import { PropertySelect } from "components/forms/PropertySelect";
import { SceneSelect } from "components/forms/SceneSelect";
import { SoundEffectSelect } from "components/forms/SoundEffectSelect";
import { SpriteSheetSelect } from "components/forms/SpriteSheetSelect";
import { VariableSelect } from "components/forms/VariableSelect";
import castEventValue from "lib/helpers/castEventValue";
import l10n from "lib/helpers/l10n";
import React, { useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import {
  ActorDirection,
  ScriptEventFieldSchema,
} from "store/features/entities/entitiesTypes";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { CheckboxField } from "ui/form/CheckboxField";
import { Input } from "ui/form/Input";
import { Select } from "ui/form/Select";
import { SliderField } from "ui/form/SliderField";
import ToggleButtons from "ui/form/ToggleButtons";
import { BlankIcon, CheckIcon, ConnectIcon } from "ui/icons/Icons";
import { MenuItem, MenuItemIcon } from "ui/menu/Menu";
import { OffscreenSkeletonInput } from "ui/skeleton/Skeleton";
import ScriptEventFormMathArea from "./ScriptEventFormMatharea";
import ScriptEventFormTextArea from "./ScriptEventFormTextarea";

interface ScriptEventFormInputProps {
  id: string;
  entityId: string;
  type: string | undefined;
  index?: number;
  field: ScriptEventFieldSchema;
  defaultValue: unknown;
  value: unknown;
  args: Record<string, unknown>;
  allowRename?: boolean;
  onChange: (newValue: unknown, valueIndex?: number | undefined) => void;
}

const ConnectButton = styled.div`
  ${Button} {
    min-width: 15px;
    padding: 0;
    height: 28px;
  }
`;

const argValue = (arg: unknown): unknown => {
  const unionArg = arg as { value: unknown; type: unknown };
  if (unionArg && unionArg.value !== undefined) {
    if (unionArg.type === "variable" || unionArg.type === "property") {
      return undefined;
    }
    return unionArg.value;
  }
  return arg;
};

const ScriptEventFormInput = ({
  id,
  entityId,
  type,
  field,
  value,
  args,
  index,
  defaultValue,
  onChange,
  allowRename = true,
}: ScriptEventFormInputProps) => {
  const defaultBackgroundPaletteIds = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultBackgroundPaletteIds || []
  );
  const defaultSpritePaletteIds = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultSpritePaletteIds || []
  );
  const editorType = useSelector((state: RootState) => state.editor.type);

  const onChangeField = useCallback(
    (e: unknown) => {
      const { updateFn } = field;
      let newValue = castEventValue(e);
      if (type === "direction" && newValue === value) {
        // Toggle direction
        newValue = "";
      }
      if (type === "select") {
        newValue = newValue.value;
      }
      if (updateFn) {
        newValue = updateFn(newValue, field, args);
      }
      onChange(newValue, index);
    },
    [args, field, index, onChange, type, value]
  );

  const onChangeUnionField = (newValue: unknown) => {
    const prevValue = typeof value === "object" ? value : {};
    onChange(
      {
        ...prevValue,
        value: newValue,
      },
      index
    );
  };

  const onChangeUnionType = useCallback(
    (newType: string) => {
      const valueType =
        typeof value === "object"
          ? (value as { type: string }).type
          : undefined;
      if (newType !== valueType) {
        let replaceValue = null;
        const defaultUnionValue =
          typeof field.defaultValue === "object"
            ? (field.defaultValue as { [key: string]: string | undefined })[
                newType
              ]
            : undefined;
        if (defaultUnionValue === "LAST_VARIABLE") {
          replaceValue = editorType === "customEvent" ? "0" : "L0";
        } else if (defaultUnionValue !== undefined) {
          replaceValue = defaultUnionValue;
        }
        onChange(
          {
            type: newType,
            value: replaceValue,
          },
          index
        );
      }
    },
    [editorType, field.defaultValue, index, onChange, value]
  );

  if (type === "textarea") {
    return (
      <ScriptEventFormTextArea
        id={id}
        value={String(value || "")}
        placeholder={field.placeholder}
        onChange={onChangeField}
        entityId={entityId}
      />
    );
  } else if (type === "matharea") {
    return (
      <ScriptEventFormMathArea
        id={id}
        value={String(value || "")}
        placeholder={field.placeholder}
        onChange={onChangeField}
        entityId={entityId}
      />
    );
  } else if (type === "text") {
    return (
      <Input
        id={id}
        type="text"
        value={String(value || "")}
        placeholder={String(field.placeholder || defaultValue)}
        maxLength={field.maxLength}
        onChange={onChangeField}
      />
    );
  } else if (type === "number") {
    return (
      <Input
        id={id}
        type="number"
        value={String(value !== undefined && value !== null ? value : "")}
        min={field.min}
        max={field.max}
        step={field.step}
        placeholder={String(field.placeholder || defaultValue)}
        onChange={onChangeField}
      />
    );
  } else if (type === "slider") {
    return (
      <SliderField
        name={id}
        value={typeof value === "number" ? value : undefined}
        min={field.min || 0}
        max={field.max || 255}
        placeholder={
          typeof defaultValue === "number" ? defaultValue : undefined
        }
        onChange={onChangeField}
      />
    );
  } else if (type === "checkbox") {
    return (
      <CheckboxField
        name={id}
        label={String(field.checkboxLabel || field.label)}
        checked={
          typeof value === "boolean" ? value : Boolean(defaultValue || false)
        }
        onChange={onChangeField}
      />
    );
  } else if (type === "select") {
    const options = (field.options || []).map(([value, label]) => ({
      value,
      label: l10n(label),
    }));
    const currentValue = options.find((o) => o.value === value) || options[0];
    return (
      <Select
        id={id}
        name={id}
        value={currentValue}
        options={options}
        onChange={onChangeField}
      />
    );
  } else if (type === "selectbutton") {
    const selectedOption = (field.options || []).find(
      ([type]) => type === value
    );
    const selectedLabel = selectedOption ? selectedOption[1] : undefined;
    return (
      <ConnectButton>
        <DropdownButton
          variant="transparent"
          size="small"
          showArrow={false}
          menuDirection="right"
          label={
            <ConnectIcon
              connected={value !== field.defaultValue}
              title={selectedLabel}
            />
          }
        >
          {(field.options || []).map(([type, label]) => (
            <MenuItem key={String(type)} onClick={() => onChangeField(type)}>
              <MenuItemIcon>
                {type === value ? <CheckIcon /> : <BlankIcon />}
              </MenuItemIcon>
              {label}
            </MenuItem>
          ))}
        </DropdownButton>
      </ConnectButton>
    );
  } else if (type === "togglebuttons") {
    return (
      <div>
        <ToggleButtons
          name={id}
          options={field.options as [string, string][]}
          value={value as string[]}
          allowMultiple={field.allowMultiple as true}
          allowNone={field.allowNone}
          onChange={onChangeField}
        />
      </div>
    );
  } else if (type === "scene") {
    return (
      <OffscreenSkeletonInput>
        <SceneSelect
          name={id}
          value={String(value || "")}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "background") {
    return (
      <OffscreenSkeletonInput>
        <BackgroundSelect
          name={id}
          value={String(value || "")}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "palette") {
    if (field.paletteType === "ui") {
      return (
        <OffscreenSkeletonInput>
          <PaletteSelect
            name={id}
            value={String(value || "")}
            onChange={onChangeField}
            optional
            optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
            optionalDefaultPaletteId={defaultBackgroundPaletteIds[7] || ""}
            type="tile"
          />
        </OffscreenSkeletonInput>
      );
    }
    if (field.paletteType === "emote") {
      return (
        <OffscreenSkeletonInput>
          <PaletteSelect
            name={id}
            value={String(value || "")}
            onChange={onChangeField}
            optional
            optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
            optionalDefaultPaletteId={defaultSpritePaletteIds[7] || ""}
            type="sprite"
          />
        </OffscreenSkeletonInput>
      );
    }
    if (field.paletteType === "sprite") {
      return (
        <OffscreenSkeletonInput>
          <PaletteSelect
            name={id}
            value={String(value || "")}
            onChange={onChangeField}
            prefix={`${(field.paletteIndex || 0) + 1}: `}
            optional
            optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
            optionalDefaultPaletteId={
              defaultSpritePaletteIds[field.paletteIndex || 0] || ""
            }
            canKeep={field.canKeep}
            keepLabel={l10n("FIELD_DONT_MODIFY")}
            type="sprite"
          />
        </OffscreenSkeletonInput>
      );
    }
    return (
      <OffscreenSkeletonInput>
        <PaletteSelect
          name={id}
          value={String(value || "")}
          onChange={onChangeField}
          prefix={`${(field.paletteIndex || 0) + 1}: `}
          optional
          optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
          optionalDefaultPaletteId={
            defaultBackgroundPaletteIds[field.paletteIndex || 0] || ""
          }
          canKeep={field.canKeep}
          keepLabel={l10n("FIELD_DONT_MODIFY")}
          type="tile"
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "sprite") {
    return (
      <OffscreenSkeletonInput>
        <SpriteSheetSelect
          name={id}
          value={String(value || "")}
          filter={field.filter}
          optional={field.optional}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "animationstate") {
    return (
      <OffscreenSkeletonInput>
        <AnimationStateSelect
          name={id}
          value={String(value || "")}
          onChange={onChangeField}
          allowDefault
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "variable") {
    return (
      <OffscreenSkeletonInput>
        <VariableSelect
          name={id}
          value={String(value || "0")}
          entityId={entityId}
          onChange={onChangeField}
          allowRename={allowRename}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "direction") {
    return (
      <OffscreenSkeletonInput>
        <DirectionPicker id={id} value={value} onChange={onChangeField} />
      </OffscreenSkeletonInput>
    );
  } else if (type === "collisionMask") {
    return (
      <OffscreenSkeletonInput>
        <CollisionMaskPicker
          id={id}
          value={value}
          onChange={onChangeField}
          includePlayer={field.includePlayer}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "input") {
    return <InputPicker id={id} value={value} onChange={onChangeField} />;
  } else if (type === "fadeSpeed") {
    return (
      <OffscreenSkeletonInput>
        <FadeSpeedSelect
          name={id}
          value={Number(value ?? 2)}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "cameraSpeed") {
    return (
      <OffscreenSkeletonInput>
        <CameraSpeedSelect
          name={id}
          allowNone
          value={Number(value ?? 0)}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "moveSpeed") {
    return (
      <OffscreenSkeletonInput>
        <MovementSpeedSelect
          name={id}
          value={Number(value ?? 1)}
          allowNone={field.allowNone}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "animSpeed") {
    return (
      <AnimationSpeedSelect
        name={id}
        value={Number(value ?? 3)}
        onChange={onChangeField}
      />
    );
  } else if (type === "overlayColor") {
    return (
      <OffscreenSkeletonInput>
        <OverlayColorSelect
          name={id}
          value={String(value ?? "")}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "actor") {
    return (
      <OffscreenSkeletonInput>
        <ActorSelect
          name={id}
          value={String(value ?? "")}
          direction={argValue(args.direction) as ActorDirection}
          frame={argValue(args.frame) as number | undefined}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "emote") {
    return (
      <OffscreenSkeletonInput>
        <EmoteSelect name={id} value={String(value)} onChange={onChangeField} />
      </OffscreenSkeletonInput>
    );
  } else if (type === "avatar") {
    return (
      <OffscreenSkeletonInput>
        <AvatarSelect
          name={id}
          value={String(value ?? "")}
          onChange={onChangeField}
          optional={field.optional}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "operator") {
    return (
      <OffscreenSkeletonInput>
        <OperatorSelect
          name={id}
          value={String(value ?? "")}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "music") {
    return (
      <OffscreenSkeletonInput>
        <MusicSelect
          name={id}
          value={String(value ?? "")}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "soundEffect") {
    return (
      <OffscreenSkeletonInput>
        <SoundEffectSelect
          name={id}
          value={String(value ?? "")}
          onChange={onChangeField}
          duration={argValue(args.duration) as number | undefined}
          pitch={argValue(args.pitch) as number | undefined}
          frequency={argValue(args.frequency) as number | undefined}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "engineField") {
    return (
      <OffscreenSkeletonInput>
        <EngineFieldSelect
          name={id}
          value={String(value ?? "")}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "customEvent") {
    return (
      <OffscreenSkeletonInput>
        <CustomEventSelect
          name={id}
          value={String(value ?? "")}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "property") {
    return (
      <OffscreenSkeletonInput>
        <PropertySelect
          name={id}
          value={String(value ?? "")}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "union") {
    const currentType = ((value && (value as { type: string }).type) ||
      field.defaultType) as string;
    const currentValue =
      typeof value === "object"
        ? (value as { value: string | undefined }).value
        : undefined;
    const defaultUnionValue =
      typeof field.defaultValue === "object"
        ? (field.defaultValue as { [key: string]: string | undefined })[
            currentType
          ]
        : undefined;
    return (
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ flexGrow: 1, marginRight: 2 }}>
          <ScriptEventFormInput
            id={id}
            entityId={entityId}
            type={currentType}
            field={field}
            value={currentValue}
            defaultValue={defaultUnionValue}
            allowRename={false}
            args={args}
            onChange={onChangeUnionField}
          />
        </div>
        <ConnectButton>
          <DropdownButton
            variant="transparent"
            size="small"
            showArrow={false}
            menuDirection="right"
            label={
              <ConnectIcon connected={currentType !== field.defaultType} />
            }
          >
            {(field.types || []).map((type) => (
              <MenuItem key={type} onClick={() => onChangeUnionType(type)}>
                <MenuItemIcon>
                  {type === currentType ? <CheckIcon /> : <BlankIcon />}
                </MenuItemIcon>
                {type}
              </MenuItem>
            ))}
          </DropdownButton>
        </ConnectButton>
      </div>
    );
  }

  return null;
};

export default ScriptEventFormInput;

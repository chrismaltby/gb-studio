import { ActorSelect } from "components/forms/ActorSelect2";
import { AnimationSpeedSelect } from "components/forms/AnimationSpeedSelect";
import AnimationStateSelect from "components/forms/AnimationStateSelect";
import { BackgroundSelect } from "components/forms/BackgroundSelect";
import { CameraSpeedSelect } from "components/forms/CameraSpeedSelect2";
import CollisionMaskPicker from "components/forms/CollisionMaskPicker";
import DirectionPicker from "components/forms/DirectionPicker";
import { EmoteSelect } from "components/forms/EmoteSelect";
import { FadeSpeedSelect } from "components/forms/FadeSpeedSelect2";
import InputPicker from "components/forms/InputPicker";
import { MovementSpeedSelect } from "components/forms/MovementSpeedSelect";
import { OverlayColorSelect } from "components/forms/OverlayColorSelect2";
import { PaletteSelect } from "components/forms/PaletteSelect";
import { SceneSelect } from "components/forms/SceneSelect";
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
import { CheckboxField } from "ui/form/CheckboxField";
import { Input } from "ui/form/Input";
import { Select } from "ui/form/Select";
import { SliderField } from "ui/form/SliderField";
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
  onChange: (newValue: unknown, valueIndex?: number | undefined) => void;
}

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
}: ScriptEventFormInputProps) => {
  const defaultBackgroundPaletteIds = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultBackgroundPaletteIds || []
  );
  const defaultSpritePaletteIds = useSelector(
    (state: RootState) =>
      state.project.present.settings.defaultSpritePaletteIds || []
  );

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
  } else if (type === "scene") {
    return (
      <SceneSelect
        name={id}
        value={String(value || "")}
        onChange={onChangeField}
      />
    );
  } else if (type === "background") {
    return (
      <BackgroundSelect
        name={id}
        value={String(value || "")}
        onChange={onChangeField}
      />
    );
  } else if (type === "palette") {
    if (field.paletteType === "ui") {
      return (
        <PaletteSelect
          name={id}
          value={String(value || "")}
          onChange={onChangeField}
          optional
          optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
          optionalDefaultPaletteId={defaultBackgroundPaletteIds[7] || ""}
          type="tile"
        />
      );
    }
    if (field.paletteType === "emote") {
      return (
        <PaletteSelect
          name={id}
          value={String(value || "")}
          onChange={onChangeField}
          optional
          optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
          optionalDefaultPaletteId={defaultSpritePaletteIds[7] || ""}
          type="sprite"
        />
      );
    }
    if (field.paletteType === "sprite") {
      return (
        <PaletteSelect
          name={id}
          value={String(value || "")}
          onChange={onChangeField}
          optional
          optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
          optionalDefaultPaletteId={
            defaultSpritePaletteIds[field.paletteIndex || 0] || ""
          }
          canKeep={field.canKeep}
          keepLabel={l10n("FIELD_DONT_MODIFY")}
          type="sprite"
        />
      );
    }
    return (
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
    );
  } else if (type === "sprite") {
    return (
      <SpriteSheetSelect
        name={id}
        value={String(value || "")}
        filter={field.filter}
        optional={field.optional}
        onChange={onChangeField}
      />
    );
  } else if (type === "animationstate") {
    return (
      <AnimationStateSelect
        name={id}
        value={String(value || "")}
        onChange={onChangeField}
        allowDefault
      />
    );
  } else if (type === "variable") {
    return (
      <VariableSelect
        name={id}
        value={String(value || "0")}
        entityId={entityId}
        onChange={onChangeField}
        allowRename
      />
    );
  } else if (type === "direction") {
    return <DirectionPicker id={id} value={value} onChange={onChangeField} />;
  } else if (type === "collisionMask") {
    return (
      <CollisionMaskPicker
        id={id}
        value={value}
        onChange={onChangeField}
        includePlayer={field.includePlayer}
      />
    );
  } else if (type === "input") {
    return <InputPicker id={id} value={value} onChange={onChangeField} />;
  } else if (type === "fadeSpeed") {
    return (
      <FadeSpeedSelect
        name={id}
        value={Number(value ?? 2)}
        onChange={onChangeField}
      />
    );
  } else if (type === "cameraSpeed") {
    return (
      <CameraSpeedSelect
        name={id}
        allowNone
        value={Number(value ?? 0)}
        onChange={onChangeField}
      />
    );
  } else if (type === "moveSpeed") {
    return (
      <MovementSpeedSelect
        name={id}
        value={Number(value ?? 1)}
        onChange={onChangeField}
      />
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
      <OverlayColorSelect
        name={id}
        value={String(value ?? "")}
        onChange={onChangeField}
      />
    );
  } else if (type === "actor") {
    return (
      <ActorSelect
        name={id}
        value={String(value ?? "")}
        direction={argValue(args.direction) as ActorDirection}
        frame={argValue(args.frame) as number | undefined}
        onChange={onChangeField}
      />
    );
  } else if (type === "emote") {
    return (
      <EmoteSelect name={id} value={String(value)} onChange={onChangeField} />
    );
  }

  return <div>ABC</div>;
};

export default ScriptEventFormInput;

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
import { MovementTypeSelect } from "components/forms/MovementTypeSelect";
import { MusicSelect } from "components/forms/MusicSelect";
import { OperatorSelect } from "components/forms/OperatorSelect";
import { MathOperatorSelect } from "components/forms/MathOperatorSelect";
import { OverlayColorSelect } from "components/forms/OverlayColorSelect";
import { PaletteSelect } from "components/forms/PaletteSelect";
import { Priority, PrioritySelect } from "components/forms/PrioritySelect";
import { PropertySelect } from "components/forms/PropertySelect";
import { Reference, ReferencesSelect } from "components/forms/ReferencesSelect";
import { SceneSelect } from "components/forms/SceneSelect";
import { SoundEffectSelect } from "components/forms/SoundEffectSelect";
import { SpriteSheetSelect } from "components/forms/SpriteSheetSelect";
import { VariableSelect } from "components/forms/VariableSelect";
import {
  castEventToBool,
  castEventToFloat,
} from "renderer/lib/helpers/castEventValue";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import React, { useCallback, useContext } from "react";
import { useAppSelector } from "store/hooks";
import {
  ActorDirection,
  CollisionGroup,
  MovementType,
  ScriptEventFieldSchema,
  UnionValue,
  UnitType,
} from "shared/lib/entities/entitiesTypes";
import styled from "styled-components";
import { Button, ButtonPrefixIcon } from "ui/buttons/Button";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { CheckboxField } from "ui/form/CheckboxField";
import { CodeEditor } from "ui/form/CodeEditor";
import { Input } from "ui/form/Input";
import { NumberInput } from "ui/form/NumberInput";
import { Select } from "ui/form/Select";
import { SliderField } from "ui/form/SliderField";
import ToggleButtons from "ui/form/ToggleButtons";
import { BlankIcon, CheckIcon, ConnectIcon, PlusIcon } from "ui/icons/Icons";
import { MenuItem, MenuItemIcon } from "ui/menu/Menu";
import { OffscreenSkeletonInput } from "ui/skeleton/Skeleton";
import { ScriptEditorContext } from "./ScriptEditorContext";
import { defaultVariableForContext } from "shared/lib/scripts/context";
import ScriptEventFormMathArea from "./ScriptEventFormMatharea";
import ScriptEventFormTextArea from "./ScriptEventFormTextarea";
import { AngleInput } from "ui/form/AngleInput";
import { ensureMaybeNumber, isStringArray } from "shared/types";
import { clampToCType } from "shared/lib/engineFields/engineFieldToCType";
import { setDefault } from "shared/lib/helpers/setDefault";
import { TilesetSelect } from "components/forms/TilesetSelect";
import ValueSelect from "components/forms/ValueSelect";
import { isScriptValue } from "shared/lib/scriptValue/types";
import { FlagField } from "ui/form/FlagField";
import { FlagSelect } from "components/forms/FlagSelect";

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
  onChangeArg: (key: string, newValue: unknown) => void;
  onInsertEventAfter: () => void;
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
    if (unionArg.type === "number" || unionArg.type === "direction") {
      return unionArg.value;
    }
    return undefined;
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
  onChangeArg,
  onInsertEventAfter,
  allowRename = true,
}: ScriptEventFormInputProps) => {
  const defaultBackgroundPaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultBackgroundPaletteIds || []
  );
  const defaultSpritePaletteIds = useAppSelector(
    (state) => state.project.present.settings.defaultSpritePaletteIds || []
  );
  const engineFieldsLookup = useAppSelector((state) => state.engine.lookup);
  const context = useContext(ScriptEditorContext);

  const onChangeField = useCallback(
    (e: unknown) => {
      onChange(e, index);
    },
    [index, onChange]
  );

  const onChangeTextInputField = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onChange(e.currentTarget.value, index);
    },
    [index, onChange]
  );

  const onChangeNumberInputField = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(castEventToFloat(e, Number(defaultValue) ?? 0), index);
    },
    [defaultValue, index, onChange]
  );

  const onChangeCheckboxField = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(castEventToBool(e), index);
    },
    [index, onChange]
  );

  const onChangeSelectField = useCallback(
    (e: { value: unknown }) => {
      onChange(e.value, index);
    },
    [index, onChange]
  );

  const onChangeUnionField = (newValue: unknown) => {
    const prevValue =
      typeof value === "object"
        ? (value as UnionValue | null)
        : ({} as UnionValue);
    onChange(
      {
        ...prevValue,
        type: prevValue?.type ?? field.defaultType,
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
          replaceValue = defaultVariableForContext(context.type);
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
    [context, field.defaultValue, index, onChange, value]
  );

  if (type === "textarea") {
    return (
      <ScriptEventFormTextArea
        id={id}
        value={String(value || "")}
        placeholder={field.placeholder}
        singleLine={field.singleLine}
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
        onChange={onChangeTextInputField}
      />
    );
  } else if (type === "code") {
    return (
      <OffscreenSkeletonInput>
        <CodeEditor value={String(value || "")} onChange={onChangeField} />
      </OffscreenSkeletonInput>
    );
  } else if (type === "number") {
    return (
      <NumberInput
        id={id}
        type="number"
        value={String(value !== undefined && value !== null ? value : "")}
        min={field.min}
        max={field.max}
        step={field.step}
        placeholder={String(field.placeholder || defaultValue)}
        onChange={onChangeNumberInputField}
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
        title={field.description}
        checked={
          typeof value === "boolean" ? value : Boolean(defaultValue || false)
        }
        onChange={onChangeCheckboxField}
      />
    );
  } else if (type === "flag") {
    return (
      <FlagField
        name={id}
        bit={field.key ?? "flag1"}
        defaultLabel={String(field.checkboxLabel || field.label)}
        title={field.description}
        variableId={argValue(args.variable) as string}
        checked={
          typeof value === "boolean" ? value : Boolean(defaultValue || false)
        }
        entityId={entityId}
        onChange={onChangeCheckboxField}
      />
    );
  } else if (type === "selectFlags") {
    return (
      <FlagSelect
        name={id}
        variableId={argValue(args.variable) as string}
        entityId={entityId}
        value={Number(value ?? defaultValue)}
        onChange={onChangeField}
      ></FlagSelect>
    );
  } else if (type === "select") {
    const options = (field.options || []).map(([value, label]) => ({
      value,
      label: l10n(label as L10NKey),
    }));
    const currentValue =
      options.find((o) =>
        value ? o.value === value : o.value === defaultValue
      ) || options[0];
    return (
      <Select
        id={id}
        name={id}
        value={currentValue}
        options={options}
        onChange={onChangeSelectField}
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
          value={(value ?? field.defaultValue) as string[]}
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
  } else if (type === "value") {
    const isValueScript = isScriptValue(value);
    const isDefaultScript = isScriptValue(defaultValue);

    return (
      <ValueSelect
        name={id}
        entityId={entityId}
        value={
          isValueScript ? value : isDefaultScript ? defaultValue : undefined
        }
        onChange={onChangeField}
        min={field.min}
        max={field.max}
        step={field.step}
        placeholder={String(
          field.placeholder ||
            (isValueScript && value.type === "number" ? value.value : "")
        )}
      />
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
            canRestore={field.canRestore}
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
          canRestore={field.canRestore}
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
    let fallbackValue = defaultValue;
    if (fallbackValue === "LAST_VARIABLE") {
      fallbackValue = defaultVariableForContext(context.type);
    }
    return (
      <OffscreenSkeletonInput>
        <VariableSelect
          name={id}
          value={String(value || fallbackValue || "0")}
          entityId={entityId}
          onChange={onChangeField}
          allowRename={allowRename}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "direction") {
    return (
      <OffscreenSkeletonInput>
        <DirectionPicker
          id={id}
          value={value as ActorDirection | undefined}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "angle") {
    return (
      <OffscreenSkeletonInput>
        <AngleInput
          id={id}
          value={String(value !== undefined && value !== null ? value : "")}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={String(field.placeholder || defaultValue)}
          onChange={onChangeNumberInputField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "collisionMask") {
    if (isStringArray(value)) {
      return (
        <OffscreenSkeletonInput>
          <CollisionMaskPicker
            id={id}
            value={value as CollisionGroup[]}
            onChange={onChangeField}
            includePlayer={field.includePlayer}
            multiple
          />
        </OffscreenSkeletonInput>
      );
    } else {
      return (
        <OffscreenSkeletonInput>
          <CollisionMaskPicker
            id={id}
            value={String(value) as CollisionGroup}
            onChange={onChangeField}
            includePlayer={field.includePlayer}
          />
        </OffscreenSkeletonInput>
      );
    }
  } else if (type === "input") {
    if (isStringArray(value)) {
      return (
        <InputPicker id={id} value={value} onChange={onChangeField} multiple />
      );
    } else {
      return (
        <InputPicker id={id} value={String(value)} onChange={onChangeField} />
      );
    }
  } else if (type === "fadeSpeed") {
    return (
      <OffscreenSkeletonInput>
        <FadeSpeedSelect
          name={id}
          value={Number(value ?? 2)}
          onChange={onChangeField}
          allowNone={field.allowNone}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "cameraSpeed") {
    return (
      <OffscreenSkeletonInput>
        <CameraSpeedSelect
          name={id}
          allowNone
          allowDefault={field.allowDefault}
          value={Number(value ?? field.defaultValue ?? 0)}
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
          noneLabel={field.noneLabel}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "moveType") {
    return (
      <OffscreenSkeletonInput>
        <MovementTypeSelect
          value={value as MovementType | undefined}
          onChange={onChangeField}
        />
      </OffscreenSkeletonInput>
    );
  } else if (type === "priority") {
    return (
      <OffscreenSkeletonInput>
        <PrioritySelect
          value={value as Priority | undefined}
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
          frame={ensureMaybeNumber(argValue(args.frame), undefined)}
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
  } else if (type === "tileset") {
    return (
      <OffscreenSkeletonInput>
        <TilesetSelect
          name={id}
          optional={field.optional}
          optionalLabel={field.optionalLabel}
          value={String(value)}
          onChange={onChangeField}
          tileIndex={argValue(args.tileIndex) as number | undefined}
          units={
            (args[field.unitsField || ""] || field.unitsDefault) as UnitType
          }
          filters={field.filters}
        />
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
  } else if (type === "mathOperator") {
    return (
      <OffscreenSkeletonInput>
        <MathOperatorSelect
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
          effectIndex={argValue(args.effect) as number | undefined}
          allowNone={field.allowNone}
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
  } else if (type === "references") {
    return (
      <OffscreenSkeletonInput>
        <ReferencesSelect
          value={(value as Reference[]) || []}
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
  } else if (type === "engineFieldValue") {
    const engineField = engineFieldsLookup[args.engineFieldKey as string];
    if (engineField) {
      const fieldType = engineField.type || "number";
      const engineDefaultValue = {
        type: "number",
        value: engineField.defaultValue,
      };
      const isValueScript = isScriptValue(value);
      const isDefaultScript = isScriptValue(engineDefaultValue);

      return (
        <ValueSelect
          name={id}
          entityId={entityId}
          value={
            isValueScript
              ? value
              : isDefaultScript
              ? engineDefaultValue
              : undefined
          }
          onChange={onChangeField}
          min={clampToCType(
            setDefault(engineField.min, -Infinity),
            engineField.cType
          )}
          max={clampToCType(
            setDefault(engineField.max, Infinity),
            engineField.cType
          )}
          step={field.step}
          placeholder={String(engineField.defaultValue ?? 0)}
          inputOverride={{
            type: fieldType,
            topLevelOnly: true,
            options: engineField.options || [],
            checkboxLabel: l10n(engineField.label as L10NKey),
          }}
        />
      );
    }
  } else if (type === "addEventButton") {
    return (
      <Button style={{ width: "100%" }} onClick={onInsertEventAfter}>
        <ButtonPrefixIcon>
          <PlusIcon />
        </ButtonPrefixIcon>
        {field.label}
      </Button>
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
            onChangeArg={onChangeArg}
            onInsertEventAfter={onInsertEventAfter}
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

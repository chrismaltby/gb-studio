import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import SceneSelect from "../forms/SceneSelect";
import BackgroundSelect from "../forms/BackgroundSelect";
import SpriteSheetSelect from "../forms/SpriteSheetSelect";
import { VariableSelect } from "../forms/VariableSelectv2";
import DirectionPicker from "../forms/DirectionPicker";
import InputPicker from "../forms/InputPicker";
import FadeSpeedSelect from "../forms/FadeSpeedSelect";
import FadeStyleSelect from "../forms/FadeStyleSelect";
import CameraSpeedSelect from "../forms/CameraSpeedSelect";
import AnimationSpeedSelect from "../forms/AnimationSpeedSelect";
import MovementSpeedSelect from "../forms/MovementSpeedSelect";
import PaletteSelect from "../forms/PaletteSelect";
import ActorSelect from "../forms/ActorSelect";
import EmoteSelect from "../forms/EmoteSelect";
import OverlayColorSelect from "../forms/OverlayColorSelect";
import MusicSelect from "../forms/MusicSelect";
import SoundEffectSelect from "../forms/SoundEffectSelect";
import castEventValue from "../../lib/helpers/castEventValue";
import OperatorSelect from "../forms/OperatorSelect";
import ScriptEventFormTextArea from "./ScriptEventFormTextarea";
import { DropdownButton } from "../library/Button";
import { MenuItem } from "../library/Menu";
import { ConnectIcon, CheckIcon, BlankIcon } from "../library/Icons";
import PropertySelect from "../forms/PropertySelect";
import CollisionMaskPicker from "../forms/CollisionMaskPicker";
import { EventValueShape, EventDefaultValueShape } from "../../store/stateShape";
import l10n from "../../lib/helpers/l10n";
import { VariablePairSelect } from "../forms/VariablePairSelect";
import EngineFieldSelect from "../forms/EngineFieldSelect";
import { SliderField } from "../ui/form/SliderField";
import { CheckboxField } from "../ui/form/CheckboxField";
import { Input } from "../ui/form/Input";
import { Select } from "../ui/form/Select";

const argValue = (arg) => {
  if(arg && arg.value !== undefined) {
    if(arg.type === "variable" || arg.type === "variablePair" || arg.type === "property") {
      return undefined;
    }
    return arg.value;
  }
  return arg;
}

class ScriptEventFormInput extends Component {
  onChange = e => {
    const { onChange, field, value, index, args, type } = this.props;
    const { updateFn } = field;
    let newValue = e && e.currentTarget ? castEventValue(e) : e;
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
  };

  onChangeUnionValue = newValue => {
    const { onChange, value, index } = this.props;
    onChange({
      ...value,
      value: newValue
    }, index);
  };

  onChangeUnionType = newType => e => {
    const { onChange, value, index, field, scope } = this.props;
    if(newType !== value.type) {
      let replaceValue = null;
      const defaultValue = field.defaultValue[newType];

      if (defaultValue === "LAST_VARIABLE") {
        replaceValue = scope === "customEvents" ? "0" : "L0";
      } else if (defaultValue !== undefined) {
        replaceValue = defaultValue;
      }

      onChange({
        type: newType,
        value: replaceValue
      }, index);
    }
  }  

  render() {
    const { type, id, value, defaultValue, args, field, entityId, allowRename, scope, defaultBackgroundPaletteIds, defaultUIPaletteId } = this.props;

    if (type === "textarea") {
      return (
        <ScriptEventFormTextArea
          id={id}
          value={value}
          rows={field.rows}
          maxlength={args.avatarId ? 48 : 52}
          placeholder={field.placeholder}
          onChange={this.onChange}
          entityId={entityId}
        />
      );
    }
    if (type === "text") {
      return (
        <Input
          id={id}
          type="text"
          value={value || ""}
          placeholder={field.placeholder || defaultValue}
          maxLength={field.maxLength}
          onChange={this.onChange}
        />
      );
    }
    if (type === "number") {
      return (
        <Input
          id={id}
          type="number"
          value={value !== undefined && value !== null ? value : ""}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder || defaultValue}
          onChange={this.onChange}
        />
      );
    }
    if (type === "slider") {
      return (
        <SliderField
          id={id}
          value={typeof value === "number" ? value : undefined}
          defaultValue={defaultValue}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={defaultValue}
          onChange={this.onChange}
        />
      );
    }    
    if (type === "checkbox") {
      return <CheckboxField
        id={id}
        name={id}
        label={field.checkboxLabel || field.label}
        type="checkbox"
        className="Checkbox"
        checked={typeof value === "boolean" ? value : defaultValue || false}
        onChange={this.onChange}
      />
    }
    if (type === "select") {
      const options = field.options.map(([value, label]) => ({
        value,
        label: l10n(label)
      }));
      const currentValue = options.find((o) => o.value === value) || options[0];
      return (
        <Select
          id={id}
          name={id}
          value={currentValue}
          options={options}
          onChange={this.onChange}
        />
      );
    }
    if (type === "scene") {
      return <SceneSelect id={id} value={value} onChange={this.onChange} />;
    }
    if (type === "background") {
      return (
        <BackgroundSelect id={id} value={value} onChange={this.onChange} />
      );
    }
    if (type === "palette") {
      if (field.paletteType === "background") {
        return (
          <PaletteSelect
            id={id}
            value={value}
            onChange={this.onChange}
            prefix={`${field.paletteIndex + 1}: `}
            optional
            optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
            optionalDefaultPaletteId={
              defaultBackgroundPaletteIds[field.paletteIndex] || ""
            }
            canKeep
            keepLabel={l10n("FIELD_DONT_MODIFY")}
          />
        );
      }
      if (field.paletteType === "ui") {
        return (
          <PaletteSelect
            id={id}
            value={value}
            onChange={this.onChange}
            optional
            optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
            optionalDefaultPaletteId={
              defaultUIPaletteId || ""
            }
          />
        );
      }      
      return (
        <PaletteSelect
          id={id}
          value={value}
          onChange={this.onChange}
          optional
          optionalLabel={l10n("FIELD_GLOBAL_DEFAULT")}
        />
      );
    }
    if (type === "sprite") {
      return (
        <SpriteSheetSelect
          id={id}
          value={value}
          filter={field.filter}
          optional={field.optional}
          onChange={this.onChange}
        />
      );
    }
    if (type === "variable") {
      return (
        <VariableSelect
          id={id}
          value={value || "0"}
          entityId={entityId}
          onChange={this.onChange}
          allowRename={allowRename}
        />
      );
    }
    if (type === "variablePair") {
      return (
        <VariablePairSelect
          id={id}
          value={value || "0:0"}
          entityId={entityId}
          onChange={this.onChange}
        />
      );
    }    
    if (type === "direction") {
      return <DirectionPicker id={id} value={value} onChange={this.onChange} />;
    }
    if (type === "collisionMask") {
      return <CollisionMaskPicker id={id} value={value} onChange={this.onChange} includePlayer={field.includePlayer} />;
    }    
    if (type === "input") {
      return <InputPicker id={id} value={value} onChange={this.onChange} />;
    }
    if (type === "fadeSpeed") {
      return <FadeSpeedSelect id={id} value={value} onChange={this.onChange} />;
    }
    if (type === "fadeStyle") {
      return <FadeStyleSelect id={id} value={value} onChange={this.onChange} />
    }    
    if (type === "cameraSpeed") {
      return (
        <CameraSpeedSelect
          id={id}
          allowNone
          value={value}
          onChange={this.onChange}
        />
      );
    }
    if (type === "moveSpeed") {
      return (
        <MovementSpeedSelect id={id} value={value} onChange={this.onChange} />
      );
    }
    if (type === "animSpeed") {
      return (
        <AnimationSpeedSelect id={id} value={value} onChange={this.onChange} />
      );
    }
    if (type === "overlayColor") {
      return (
        <OverlayColorSelect id={id} value={value} onChange={this.onChange} />
      );
    }
    if (type === "actor") {
      return (
        <ActorSelect
          id={id}
          value={value}
          direction={argValue(args.direction)}
          frame={argValue(args.frame)}
          onChange={argValue(this.onChange)}
        />
      );
    }
    if (type === "emote") {
      return (
        <EmoteSelect id={id} value={String(value)} onChange={this.onChange} />
      );
    }
    if (type === "operator") {
      return <OperatorSelect id={id} value={value} onChange={this.onChange} />;
    }
    if (type === "music") {
      return <MusicSelect id={id} value={value} onChange={this.onChange} />;
    }
    if (type === "soundEffect") {
      return (
        <SoundEffectSelect
          id={id}
          value={value}
          onChange={this.onChange}
          duration={argValue(args.duration)}
          pitch={argValue(args.pitch)}
          frequency={argValue(args.frequency)}
        />
      );
    }
    if (type === "engineField") {
      return <EngineFieldSelect
        id={id}
        value={value}
        onChange={this.onChange}
      />
    }
    if (type === "property") {
      return (
        <PropertySelect
          id={id}
          value={value}
          onChange={this.onChange}
        />
      );
    }   
    if (type === "union") {
      const currentType = (value && value.type) || (field.defaultType);
      const currentValue = value ? value.value : undefined;
      return (
        <div style={{display: "flex", alignItems:"center"}}>
          <div style={{flexGrow:1, marginRight: 2}}>
            <ScriptEventFormInput
              id={id}
              entityId={entityId}
              type={currentType}
              field={field}
              value={currentValue}
              defaultValue={field.defaultValue[currentType]}
              allowRename={false}
              args={args}
              onChange={this.onChangeUnionValue}
              scope={scope}
            />
          </div>
          <DropdownButton
            transparent
            small
            showArrow={false}
            label={<ConnectIcon connected={currentType !== "number"} />}
          >
            {field.types.map((type) =>
              <MenuItem key={type} onClick={this.onChangeUnionType(type)}>
                {type === currentType ? <CheckIcon /> : <BlankIcon />} {type}
              </MenuItem>
            )}
          </DropdownButton>
        </div>
      );
    }
    return <div />;
  }
}

ScriptEventFormInput.propTypes = {
  index: PropTypes.number,
  id: PropTypes.string,
  entityId: PropTypes.string.isRequired,
  type: PropTypes.string,
  field: PropTypes.shape().isRequired,
  args: PropTypes.shape(),
  value: EventValueShape,
  defaultValue: EventDefaultValueShape,
  allowRename: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  scope: PropTypes.string.isRequired,
  defaultBackgroundPaletteIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  defaultUIPaletteId: PropTypes.string.isRequired
};

ScriptEventFormInput.defaultProps = {
  id: undefined,
  index: undefined,
  value: "",
  defaultValue: undefined,
  args: {},
  type: "",
  allowRename: true,
};

function mapStateToProps(state) {
  const scope = state.editor.type === "customEvent"
    ? "customEvent"
    : "global";
  const settings = state.project.present.settings;
  const defaultBackgroundPaletteIds =
    settings.defaultBackgroundPaletteIds || [];
  const defaultUIPaletteId = settings.defaultUIPaletteId || "";
  return {
    scope,
    defaultBackgroundPaletteIds,
    defaultUIPaletteId
  };
}

export default connect(mapStateToProps)(ScriptEventFormInput);

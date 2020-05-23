import React, { Component } from "react";
import PropTypes from "prop-types";
import SceneSelect from "../forms/SceneSelect";
import BackgroundSelect from "../forms/BackgroundSelect";
import SpriteSheetSelect from "../forms/SpriteSheetSelect";
import VariableSelect from "../forms/VariableSelect";
import DirectionPicker from "../forms/DirectionPicker";
import InputPicker from "../forms/InputPicker";
import FadeSpeedSelect from "../forms/FadeSpeedSelect";
import CameraSpeedSelect from "../forms/CameraSpeedSelect";
import AnimationSpeedSelect from "../forms/AnimationSpeedSelect";
import MovementSpeedSelect from "../forms/MovementSpeedSelect";
import ActorSelect from "../forms/ActorSelect";
import EmoteSelect from "../forms/EmoteSelect";
import OverlayColorSelect from "../forms/OverlayColorSelect";
import MusicSelect from "../forms/MusicSelect";
import SoundEffectSelect from "../forms/SoundEffectSelect";
import castEventValue from "../../lib/helpers/castEventValue";
import OperatorSelect from "../forms/OperatorSelect";
import ScriptEventFormTextArea from "./ScriptEventFormTextarea";

class ScriptEventFormInput extends Component {
  onChange = e => {
    const { onChange, field, value, index, args } = this.props;
    const { type, updateFn } = field;
    let newValue = e.currentTarget ? castEventValue(e) : e;
    if (type === "direction" && newValue === value) {
      // Toggle direction
      newValue = "";
    }
    if (type === "variable") {
      newValue = newValue.value;
    }
    if (updateFn) {
      newValue = updateFn(newValue, field, args);
    }
    onChange(newValue, index);
  };

  render() {
    const { type, id, value, args, field, entityId } = this.props;

    if (type === "textarea") {
      return (
        <ScriptEventFormTextArea
          id={id}
          value={value}
          rows={field.rows}
          placeholder={field.placeholder}
          onChange={this.onChange}
        />
      );
    }
    if (type === "text") {
      return (
        <input
          id={id}
          type="text"
          value={value || ""}
          placeholder={field.placeholder || field.defaultValue}
          maxLength={field.maxLength}
          onChange={this.onChange}
        />
      );
    }
    if (type === "number") {
      return (
        <input
          id={id}
          type="number"
          value={value !== undefined && value !== null ? value : ""}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder || field.defaultValue}
          onChange={this.onChange}
        />
      );
    }
    if (type === "checkbox") {
      return [
        <input
          key="0"
          id={id}
          type="checkbox"
          className="Checkbox"
          checked={value || false}
          onChange={this.onChange}
        />,
        <div key="1" className="FormCheckbox" />
      ];
    }
    if (type === "select") {
      return (
        <select
          id={id}
          onChange={this.onChange}
          value={value || field.options[0][0]}
        >
          {field.options.map(option => (
            <option key={option[0]} value={option[0]}>
              {option[1]}
            </option>
          ))}
        </select>
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
        />
      );
    }
    if (type === "direction") {
      return <DirectionPicker id={id} value={value} onChange={this.onChange} />;
    }
    if (type === "input") {
      return <InputPicker id={id} value={value} onChange={this.onChange} />;
    }
    if (type === "fadeSpeed") {
      return <FadeSpeedSelect id={id} value={value} onChange={this.onChange} />;
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
          direction={args.direction}
          frame={args.frame}
          onChange={this.onChange}
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
          duration={args.duration}
          pitch={args.pitch}
          frequency={args.frequency}
        />
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
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.bool,
    PropTypes.arrayOf(PropTypes.number),
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.arrayOf(PropTypes.bool)
  ]),
  onChange: PropTypes.func.isRequired
};

ScriptEventFormInput.defaultProps = {
  id: undefined,
  index: undefined,
  value: "",
  args: {},
  type: ""
};

export default ScriptEventFormInput;

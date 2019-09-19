/* eslint-disable react/no-multi-comp */
/* eslint-disable jsx-a11y/label-has-for */
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
import { FormField, ToggleableFormField } from "../library/Forms";
import OverlayColorSelect from "../forms/OverlayColorSelect";
import MusicSelect from "../forms/MusicSelect";
import castEventValue from "../../lib/helpers/castEventValue";
import OperatorSelect from "../forms/OperatorSelect";
import { textNumLines } from "../../lib/helpers/trimlines";
import events from "../../lib/events";
import GBScriptEditor from "../library/GBScriptEditor";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";

const genKey = (id, key, index) => `${id}_${key}_${index || 0}`;

class TextArea extends Component {
  onChange = e => {
    const { onChange } = this.props;
    const el = e.currentTarget;
    const cursorPosition = el.selectionStart;
    onChange(e);
    this.forceUpdate(() => {
      el.selectionStart = cursorPosition;
      el.selectionEnd = cursorPosition;
    });
  }

  render() {
    const { id, value, rows, placeholder } = this.props;
    return (
      <textarea
            id={id}
            value={value || ""}
            rows={rows || textNumLines(value)}
            placeholder={placeholder}
            onChange={this.onChange}
          />
    );
  }
}

class ScriptEventInput extends Component {
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
    const { type, id, value, args, field } = this.props;

    if (type === "textarea") {
      return (
        <TextArea
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
    if (type === "code") {
      return <GBScriptEditor value={value || ""} onChange={this.onChange} />;
    }
    if (type === "number") {
      return (
        <input
          id={id}
          type="number"
          value={value || ""}
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
        <SpriteSheetSelect id={id} value={value} filter={field.filter} optional={field.optional} onChange={this.onChange} />
      );
    }
    if (type === "variable") {
      return <VariableSelect id={id} value={value} onChange={this.onChange} />;
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
    return <div />;
  }
}

ScriptEventInput.propTypes = {
  index: PropTypes.number,
  id: PropTypes.string,
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

ScriptEventInput.defaultProps = {
  id: undefined,
  index: undefined,
  value: "",
  args: {},
  type: ""
};

class ScriptEventField extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("ScriptEventField", this.props, {}, nextProps, {});
    return true;
  }

  onChange = (newValue, valueIndex) => {
    const { field, value, onChange } = this.props;
    const { key } = field;

    if (Array.isArray(value) && valueIndex !== undefined) {
      return onChange({
        [key]: value.map((v, i) => {
          if (i !== valueIndex) {
            return v;
          }
          return newValue;
        })
      }, field.postUpdate);
      
    }
    return onChange({
      [key]: newValue
    }, field.postUpdate);
  };

  onAddValue = valueIndex => e => {
    const { onChange, field, value } = this.props;
    const { key } = field;
    return onChange({
      [key]: [].concat(
        [],
        value.slice(0, valueIndex + 1),
        field.defaultValue,
        value.slice(valueIndex + 1)
      )
    }, field.postUpdate);
  };

  onRemoveValue = valueIndex => e => {
    const { onChange, field, value } = this.props;
    const { key } = field;
    return onChange({
      [key]: value.filter((_v, i) => i !== valueIndex)
    }, field.postUpdate);
  };

  render() {
    const { eventId, field, value, args } = this.props;

    const inputField = field.multiple ? (
      value.map((_, valueIndex) => {
        const fieldId = genKey(eventId, field.key, valueIndex);
        return (
          <span key={fieldId} className="ScriptEventBlock__InputRow">
            <ScriptEventInput
              id={fieldId}
              type={field.type}
              field={field}
              index={valueIndex}
              value={value[valueIndex]}
              args={args}
              onChange={this.onChange}
            />
            <div className="ScriptEventBlock__BtnRow">
              {valueIndex !== 0 && (
                <div
                  className="ScriptEventBlock__Btn"
                  onClick={this.onRemoveValue(valueIndex)}
                >
                  -
                </div>
              )}
              <div
                className="ScriptEventBlock__Btn"
                onClick={this.onAddValue(valueIndex)}
              >
                +
              </div>
            </div>
          </span>
        );
      })
    ) : (
      <ScriptEventInput
        id={genKey(eventId, field.key)}
        type={field.type}
        field={field}
        value={value}
        args={args}
        onChange={this.onChange}
      />
    );

    if (field.toggleLabel) {
      return (
        <ToggleableFormField
          htmlFor={genKey(eventId, field.key)}
          closedLabel={field.toggleLabel}
          label={field.label}
          open={!!value}
        >
          {inputField}
        </ToggleableFormField>
      );
    }

    return (
      <FormField halfWidth={field.width === "50%"}>
        <label htmlFor={genKey(eventId, field.key)}>
          {field.type !== "checkbox" && field.label}
          {inputField}
          {field.type === "checkbox" && field.label}
        </label>
      </FormField>
    );
  }
}

ScriptEventField.propTypes = {
  eventId: PropTypes.string.isRequired,
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

ScriptEventField.defaultProps = {
  value: "",
  args: {}
};

class ScriptEventBlock extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("ScriptEventBlock", this.props, {}, nextProps, {});
    return true;
  }

  render() {
    const { command, id, value, onChange } = this.props;
    const fields = (events[command] && events[command].fields) || [];

    return (
      <div className="ScriptEventBlock">
        {fields.map((field, index) => {
          if (field.showIfKey) {
            if (value[field.showIfKey] !== field.showIfValue) {
              return null;
            }
          }
          if (field.type === "events") {
            return null;
          }

          const fieldValue = field.multiple
            ? [].concat([], value[field.key])
            : value[field.key];

          return (
            <ScriptEventField
              key={genKey(id, field.key)}
              eventId={id}
              field={field}
              value={fieldValue}
              args={value}
              onChange={onChange}
            />
          );
        })}
      </div>
    );
  }
}

ScriptEventBlock.propTypes = {
  id: PropTypes.string.isRequired,
  command: PropTypes.string.isRequired,
  value: PropTypes.shape({}),
  onChange: PropTypes.func.isRequired
};

ScriptEventBlock.defaultProps = {
  value: {}
};

export default ScriptEventBlock;

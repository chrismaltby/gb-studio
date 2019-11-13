/* eslint-disable react/no-multi-comp */
/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { TriangleIcon } from "../library/Icons";
import { connect } from "react-redux";
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
import SoundEffectSelect from "../forms/SoundEffectSelect";
import castEventValue from "../../lib/helpers/castEventValue";
import OperatorSelect from "../forms/OperatorSelect";
import { textNumLines } from "../../lib/helpers/trimlines";
import events from "../../lib/events";
import GBScriptEditor from "../library/GBScriptEditor";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import { CustomEventShape } from "../../reducers/stateShape";

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
  };

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
    const { type, id, value, args, field, entityId } = this.props;

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

ScriptEventInput.propTypes = {
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
      return onChange(
        {
          [key]: value.map((v, i) => {
            if (i !== valueIndex) {
              return v;
            }
            return newValue;
          })
        },
        field.postUpdate
      );
    }
    return onChange(
      {
        [key]: newValue
      },
      field.postUpdate
    );
  };

  onAddValue = valueIndex => e => {
    const { onChange, field, value } = this.props;
    const { key } = field;
    return onChange(
      {
        [key]: [].concat(
          [],
          value.slice(0, valueIndex + 1),
          field.defaultValue,
          value.slice(valueIndex + 1)
        )
      },
      field.postUpdate
    );
  };

  onRemoveValue = valueIndex => e => {
    const { onChange, field, value } = this.props;
    const { key } = field;
    return onChange(
      {
        [key]: value.filter((_v, i) => i !== valueIndex)
      },
      field.postUpdate
    );
  };

  render() {
    const { eventId, field, value, args, entityId } = this.props;

    let label = field.label;
    if (label && label.replace) {
      label = label.replace(/\$\$([^$]*)\$\$/g, (match, key) => args[key] || 0);
    }

    if (field.type === "collapsable") {
      return (
        <div
          className={cx("ActionMini__Else", {
            "ActionMini__Else--Open": !value
          })}
          onClick={() => this.onChange(!value)}
        >
          <TriangleIcon /> {label}
        </div>
      );
    }

    const inputField = field.multiple ? (
      value.map((_, valueIndex) => {
        const fieldId = genKey(eventId, field.key, valueIndex);
        return (
          <span key={fieldId} className="ScriptEventBlock__InputRow">
            <ScriptEventInput
              id={fieldId}
              entityId={entityId}
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
        entityId={entityId}
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
          {field.type !== "checkbox" && field.type !== "group" && label}
          {inputField}
          {field.type === "checkbox" && label}
        </label>
      </FormField>
    );
  }
}

ScriptEventField.propTypes = {
  eventId: PropTypes.string.isRequired,
  entityId: PropTypes.string.isRequired,
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

  getFields() {
    const { command, value, customEvents } = this.props;
    const eventCommands = (events[command] && events[command].fields) || [];
    if (value.customEventId && customEvents[value.customEventId]) {
      const customEvent = customEvents[value.customEventId];
      const description = customEvent.description
        ? [
            {
              label: customEvent.description
                .split("\n")
                .map((text, index) => <div key={index}>{text || <div>&nbsp;</div>}</div>)
            }
          ]
        : [];
      const usedVariables =
        Object.values(customEvent.variables).map(v => {
          return {
            label: `${v.name}`,
            defaultValue: "LAST_VARIABLE",
            key: `$variable[${v.id}]$`,
            type: "variable"
          };
        }) || [];
      const usedActors =
        Object.values(customEvent.actors).map(a => {
          return {
            label: `${a.name}`,
            defaultValue: "player",
            key: `$actor[${a.id}]$`,
            type: "actor"
          };
        }) || [];

      return [].concat(description, eventCommands, usedVariables, usedActors);
    }
    return eventCommands;
  }

  renderFields = fields => {
    const { id, value, renderEvents, onChange, entityId } = this.props;
    return fields.map((field, index) => {
      if (field.hide) {
        return null;
      }
      // Determine if field conditions are met and hide if not
      if (field.conditions) {
        const showField = field.conditions.reduce((memo, condition) => {
          const keyValue = value[condition.key];
          return (
            memo &&
            (!condition.eq || keyValue === condition.eq) &&
            (!condition.ne || keyValue !== condition.ne) &&
            (!condition.gt || keyValue > condition.gt) &&
            (!condition.gte || keyValue >= condition.gte) &&
            (!condition.lt || keyValue > condition.lt) &&
            (!condition.lte || keyValue >= condition.lte)
          );
        }, true);
        if (!showField) {
          return null;
        }
      }

      if (field.type === "events") {
        return renderEvents(field.key);
      }

      const fieldValue = field.multiple
        ? [].concat([], value[field.key])
        : value[field.key];

      return (
        <ScriptEventField
          key={genKey(id, field.key)}
          eventId={id}
          entityId={entityId}
          field={field}
          value={fieldValue}
          args={value}
          onChange={onChange}
        />
      );
    });
  };

  render() {
    const fields = this.getFields();
    return <div className="ScriptEventBlock">{this.renderFields(fields)}</div>;
  }
}

ScriptEventBlock.propTypes = {
  id: PropTypes.string.isRequired,
  entityId: PropTypes.string.isRequired,
  command: PropTypes.string.isRequired,
  value: PropTypes.shape({
    customEventId: PropTypes.string
  }),
  onChange: PropTypes.func.isRequired,
  renderEvents: PropTypes.func.isRequired,
  customEvents: PropTypes.objectOf(CustomEventShape)
};

ScriptEventBlock.defaultProps = {
  value: {},
  customEvents: []
};

function mapStateToProps(state) {
  const customEvents = state.entities.present.entities.customEvents || {};
  return {
    customEvents
  };
}

export default connect(mapStateToProps)(ScriptEventBlock);

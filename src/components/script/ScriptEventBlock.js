/* eslint-disable jsx-a11y/label-has-for */
import React from "react";
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
import { FormField } from "../library/Forms";
import OverlayColorSelect from "../forms/OverlayColorSelect";
import MusicSelect from "../forms/MusicSelect";
import castEventValue from "../../lib/helpers/castEventValue";
import OperatorSelect from "../forms/OperatorSelect";
import { textNumLines } from "../../lib/helpers/trimlines";
import events from "../../lib/events";

const genKey = (id, key, index) => `${id}_${key}_${index || 0}`;

const ScriptEventBlock = ({ command, id, value = {}, onChange }) => {
  const fields = (events[command] && events[command].fields) || [];
  const onChangeField = (key, index, type = "text", updateFn) => e => {
    let newValue = e.currentTarget ? castEventValue(e) : e;
    if (type === "direction" && newValue === value[key]) {
      // Toggle direction
      newValue = "";
    }
    if (updateFn) {
      newValue = updateFn(newValue);
    }
    if (Array.isArray(value[key]) && index !== undefined) {
      return onChange({
        [key]: value[key].map((v, i) => {
          if (i !== index) {
            return v;
          }
          return newValue;
        })
      });
    }
    return onChange({
      [key]: newValue
    });
  };
  const onAddValue = (key, field, index) => e => {
    const current = [].concat(value[key]);
    return onChange({
      [key]: [].concat(
        [],
        current.slice(0, index + 1),
        field.defaultValue,
        current.slice(index + 1)
      )
    });
  };
  const onRemoveValue = (key, field, index) => e => {
    const current = [].concat(value[key]);
    return onChange({
      [key]: current.filter((v, i) => i !== index)
    });
  };

  if (events[command] && events[command].renderEvent) {
    return events[command].renderEvent({
      fields,
      value,
      onChange
    });
  }

  return (
    <div className="ScriptEventBlock">
      {fields.map((field, index) => {
        if (field.showIfKey) {
          if (value[field.showIfKey] !== field.showIfValue) {
            return null;
          }
        }

        const fieldValue = field.multiple
          ? [].concat([], value[field.key])
          : value[field.key];

        const renderInput = fieldIndex => {
          const inputValue = field.multiple
            ? fieldValue[fieldIndex]
            : fieldValue;
          const fieldId = genKey(id, field.key, fieldIndex);
          if (field.type === "textarea") {
            return (
              <textarea
                id={fieldId}
                key={fieldId}
                value={inputValue || ""}
                rows={textNumLines(inputValue)}
                placeholder={field.placeholder}
                onChange={onChangeField(
                  field.key,
                  fieldIndex,
                  "text",
                  field.updateFn
                )}
              />
            );
          }
          if (field.type === "text") {
            return (
              <input
                id={fieldId}
                key={fieldId}
                type="text"
                value={inputValue || ""}
                placeholder={field.placeholder || field.defaultValue}
                maxLength={field.maxLength}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "number") {
            return (
              <input
                id={fieldId}
                key={fieldId}
                type="number"
                value={inputValue || ""}
                min={field.min}
                max={field.max}
                step={field.step}
                placeholder={field.placeholder || field.defaultValue}
                onChange={onChangeField(field.key, fieldIndex, field.type)}
              />
            );
          }
          if (field.type === "checkbox") {
            return [
              <input
                id={fieldId}
                key={fieldId}
                type="checkbox"
                className="Checkbox"
                checked={inputValue || false}
                onChange={onChangeField(field.key, fieldIndex)}
              />,
              <div key="1" className="FormCheckbox" />
            ];
          }
          if (field.type === "select") {
            return (
              <select
                id={fieldId}
                key={fieldId}
                onChange={onChangeField(field.key, fieldIndex)}
                value={inputValue || field.options[0][0]}
              >
                {field.options.map(option => (
                  <option key={option[0]} value={option[0]}>
                    {option[1]}
                  </option>
                ))}
              </select>
            );
          }
          if (field.type === "scene") {
            return (
              <SceneSelect
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "background") {
            return (
              <BackgroundSelect
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "sprite") {
            return (
              <SpriteSheetSelect
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "variable") {
            return (
              <VariableSelect
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "direction") {
            return (
              <DirectionPicker
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex, "direction")}
              />
            );
          }
          if (field.type === "input") {
            return (
              <InputPicker
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex, "input")}
              />
            );
          }
          if (field.type === "fadeSpeed") {
            return (
              <FadeSpeedSelect
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "cameraSpeed") {
            return (
              <CameraSpeedSelect
                id={fieldId}
                key={fieldId}
                allowNone
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "moveSpeed") {
            return (
              <MovementSpeedSelect
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "animSpeed") {
            return (
              <AnimationSpeedSelect
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "overlayColor") {
            return (
              <OverlayColorSelect
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "actor") {
            return (
              <ActorSelect
                id={fieldId}
                key={fieldId}
                value={inputValue}
                direction={value.direction}
                frame={value.frame}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "emote") {
            return (
              <EmoteSelect
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "operator") {
            return (
              <OperatorSelect
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          if (field.type === "music") {
            return (
              <MusicSelect
                id={fieldId}
                key={fieldId}
                value={inputValue}
                onChange={onChangeField(field.key, fieldIndex)}
              />
            );
          }
          return <div />;
        };

        return (
          <FormField
            key={genKey(id, field.key)}
            halfWidth={field.width === "50%"}
          >
            <label htmlFor={genKey(id, field.key)}>
              {field.type !== "checkbox" && field.label}
              {field.multiple
                ? fieldValue.map((_, valueIndex) => {
                    return (
                      <span
                        key={genKey(id, field.key, valueIndex)}
                        className="ScriptEventBlock__InputRow"
                      >
                        {renderInput(valueIndex)}
                        <div className="ScriptEventBlock__BtnRow">
                          {valueIndex !== 0 && (
                            <div
                              className="ScriptEventBlock__Btn"
                              onClick={onRemoveValue(
                                field.key,
                                field,
                                valueIndex
                              )}
                            >
                              -
                            </div>
                          )}
                          <div
                            className="ScriptEventBlock__Btn"
                            onClick={onAddValue(field.key, field, valueIndex)}
                          >
                            +
                          </div>
                        </div>
                      </span>
                    );
                  })
                : renderInput()}
              {field.type === "checkbox" && field.label}
            </label>
          </FormField>
        );
      })}
    </div>
  );
};

ScriptEventBlock.propTypes = {
  id: PropTypes.string.isRequired,
  command: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired
};

ScriptEventBlock.defaultProps = {
  value: {}
};

export default ScriptEventBlock;

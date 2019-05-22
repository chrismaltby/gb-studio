import React from "react";
import { EventFields } from "../../lib/compiler/eventTypes";
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

const ScriptEventBlock = ({ command, value = {}, onChange }) => {
  const fields = EventFields[command] || [];
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
  return (
    <div className="ScriptEventBlock">
      {fields.map((field, index) => {
        if (field.showIfKey) {
          console.log({ value });
          if (value[field.showIfKey] !== field.showIfValue) {
            return null;
          }
        }

        const fieldValue = field.multiple
          ? [].concat([], value[field.key])
          : value[field.key];

        const renderInput = index => {
          const inputValue = field.multiple ? fieldValue[index] : fieldValue;
          return field.type === "textarea" ? (
            <textarea
              value={inputValue}
              rows={textNumLines(inputValue)}
              placeholder={field.placeholder}
              onChange={onChangeField(field.key, index, "text", field.updateFn)}
            />
          ) : field.type === "text" ? (
            <input
              type="text"
              value={inputValue}
              placeholder={field.placeholder || field.defaultValue}
              maxLength={field.maxLength}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "number" ? (
            <input
              type="number"
              value={inputValue}
              min={field.min}
              max={field.max}
              step={field.step}
              placeholder={field.placeholder || field.defaultValue}
              onChange={onChangeField(field.key, index, field.type)}
            />
          ) : field.type === "checkbox" ? (
            <label>
              <input
                type="checkbox"
                className="Checkbox"
                checked={inputValue || false}
                onChange={onChangeField(field.key, index)}
              />
              <div className="FormCheckbox" />
              {field.label}
            </label>
          ) : field.type === "select" ? (
            <label>
              <select
                onChange={onChangeField(field.key, index)}
                value={inputValue || field.options[0][0]}
              >
                {field.options.map(option => (
                  <option key={option[0]} value={option[0]}>
                    {option[1]}
                  </option>
                ))}
              </select>
            </label>
          ) : field.type === "scene" ? (
            <SceneSelect
              value={inputValue}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "background" ? (
            <BackgroundSelect
              value={inputValue}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "sprite" ? (
            <SpriteSheetSelect
              value={inputValue}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "variable" ? (
            <VariableSelect
              value={inputValue}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "direction" ? (
            <DirectionPicker
              value={inputValue}
              onChange={onChangeField(field.key, index, "direction")}
            />
          ) : field.type === "input" ? (
            <InputPicker
              value={inputValue}
              onChange={onChangeField(field.key, index, "input")}
            />
          ) : field.type === "fadeSpeed" ? (
            <FadeSpeedSelect
              value={inputValue}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "cameraSpeed" ? (
            <CameraSpeedSelect
              allowNone
              value={inputValue}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "moveSpeed" ? (
            <MovementSpeedSelect
              value={inputValue}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "animSpeed" ? (
            <AnimationSpeedSelect
              value={inputValue}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "overlayColor" ? (
            <OverlayColorSelect
              value={inputValue}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "actor" ? (
            <ActorSelect
              value={inputValue}
              direction={value.direction}
              frame={value.frame}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "emote" ? (
            <EmoteSelect
              value={inputValue}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "operator" ? (
            <OperatorSelect
              value={inputValue}
              onChange={onChangeField(field.key, index)}
            />
          ) : field.type === "music" ? (
            <MusicSelect
              value={inputValue}
              onChange={onChangeField(field.key, index)}
            />
          ) : (
            <div />
          );
        };

        return (
          <FormField key={field.key || index} halfWidth={field.width === "50%"}>
            {field.label && field.type !== "checkbox" && (
              <label>{field.label}</label>
            )}
            {field.multiple
              ? fieldValue.map((value, index) => {
                  return (
                    <span key={index} className="ScriptEventBlock__InputRow">
                      {renderInput(index)}
                      <div className="ScriptEventBlock__BtnRow">
                        {index !== 0 && (
                          <div
                            className="ScriptEventBlock__Btn"
                            onClick={onRemoveValue(field.key, field, index)}
                          >
                            -
                          </div>
                        )}
                        <div
                          className="ScriptEventBlock__Btn"
                          onClick={onAddValue(field.key, field, index)}
                        >
                          +
                        </div>
                      </div>
                    </span>
                  );
                })
              : renderInput()}
          </FormField>
        );
      })}
    </div>
  );
};

export default ScriptEventBlock;

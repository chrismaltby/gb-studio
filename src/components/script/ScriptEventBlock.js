import React from "react";
import { EventFields } from "../../lib/compiler/eventTypes";
import SceneSelect from "../forms/SceneSelect";
import BackgroundSelect from "../forms/BackgroundSelect";
import VariableSelect from "../forms/VariableSelect";
import DirectionPicker from "../forms/DirectionPicker";
import InputPicker from "../forms/InputPicker";
import FadeSpeedSelect from "../forms/FadeSpeedSelect";
import CameraSpeedSelect from "../forms/CameraSpeedSelect";
import ActorSelect from "../forms/ActorSelect";
import EmoteSelect from "../forms/EmoteSelect";
import { FormField } from "../library/Forms";
import OverlayColorSelect from "../forms/OverlayColorSelect";
import MusicSelect from "../forms/MusicSelect";
import castEventValue from "../../lib/helpers/castEventValue";
import OperatorSelect from "../forms/OperatorSelect";

const ScriptEventBlock = ({ command, value = {}, onChange }) => {
  const fields = EventFields[command] || [];
  const onChangeField = (key, type = "text", updateFn) => e => {
    let newValue = e.currentTarget ? castEventValue(e) : e;
    if (type === "direction" && newValue === value[key]) {
      // Toggle direction
      newValue = "";
    }
    if (updateFn) {
      newValue = updateFn(newValue);
    }
    return onChange({
      [key]: newValue
    });
  };
  return (
    <div className="ScriptEventBlock">
      {fields.map((field, index) => {
        return (
          <FormField key={field.key || index} halfWidth={field.width === "50%"}>
            {field.label && field.type !== "checkbox" && (
              <label>{field.label}</label>
            )}
            {field.type === "textarea" ? (
              <textarea
                value={value[field.key]}
                rows={field.rows}
                placeholder={field.placeholder}
                onChange={onChangeField(field.key, "text", field.updateFn)}
              />
            ) : field.type === "text" ? (
              <input
                type="text"
                value={value[field.key]}
                placeholder={field.placeholder || field.defaultValue}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "number" ? (
              <input
                type="number"
                value={value[field.key]}
                min={field.min}
                max={field.max}
                step={field.step}
                placeholder={field.placeholder || field.defaultValue}
                onChange={onChangeField(field.key, field.type)}
              />
            ) : field.type === "checkbox" ? (
              <label>
                <input
                  type="checkbox"
                  className="Checkbox"
                  checked={value[field.key] || false}
                  onChange={onChangeField(field.key)}
                />
                <div className="FormCheckbox" />
                {field.label}
              </label>
            ) : field.type === "scene" ? (
              <SceneSelect
                value={value[field.key]}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "background" ? (
              <BackgroundSelect
                value={value[field.key]}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "variable" ? (
              <VariableSelect
                value={value[field.key]}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "direction" ? (
              <DirectionPicker
                value={value[field.key]}
                onChange={onChangeField(field.key, "direction")}
              />
            ) : field.type === "input" ? (
              <InputPicker
                value={value[field.key]}
                onChange={onChangeField(field.key, "input")}
              />
            ) : field.type === "fadeSpeed" ? (
              <FadeSpeedSelect
                value={value[field.key]}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "cameraSpeed" ? (
              <CameraSpeedSelect
                allowNone
                value={value[field.key]}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "overlayColor" ? (
              <OverlayColorSelect
                value={value[field.key]}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "actor" ? (
              <ActorSelect
                value={value[field.key]}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "emote" ? (
              <EmoteSelect
                value={value[field.key]}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "operator" ? (
              <OperatorSelect
                value={value[field.key]}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "music" ? (
              <MusicSelect
                value={value[field.key]}
                onChange={onChangeField(field.key)}
              />
            ) : (
              <div />
            )}
          </FormField>
        );
      })}
    </div>
  );
};

export default ScriptEventBlock;

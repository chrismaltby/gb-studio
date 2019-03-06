import React from "react";
import { EventFields } from "../../lib/compiler/eventTypes";
import SceneSelect from "../forms/SceneSelect";
import ImageSelect from "../forms/ImageSelect";
import FlagSelect from "../forms/FlagSelect";
import DirectionPicker from "../forms/DirectionPicker";
import FadeSpeedSelect from "../forms/FadeSpeedSelect";
import CameraSpeedSelect from "../forms/CameraSpeedSelect";
import ActorSelect from "../forms/ActorSelect";
import EmotionSelect from "../forms/EmotionSelect";
import { FormField } from "../library/Forms";
import OverlayColorSelect from "../forms/OverlayColorSelect";

const ScriptEventBlock = ({ command, value = {}, onChange }) => {
  const fields = EventFields[command] || [];
  const onChangeField = (key, type = "text", updateFn) => e => {
    let newValue = e.currentTarget ? e.currentTarget.value : e;
    if (type === "number") {
      newValue = parseFloat(newValue);
    }
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
      {fields.map(field => {
        return (
          <FormField key={field.key} halfWidth={field.width === "50%"}>
            {field.label && <label>{field.label}</label>}
            {field.type === "textarea" ? (
              <textarea
                value={value[field.key]}
                defaultValue={field.defaultValue}
                rows={field.rows}
                placeholder={field.placeholder}
                onChange={onChangeField(field.key, "text", field.updateFn)}
              />
            ) : field.type === "text" ? (
              <input
                type="text"
                value={value[field.key]}
                defaultValue={field.defaultValue}
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
                defaultValue={field.defaultValue}
                placeholder={field.placeholder || field.defaultValue}
                onChange={onChangeField(field.key, field.type, val => {
                  if (!field.step || field.step === 1) {
                    val = Math.round(val);
                  }
                  return val;
                })}
              />
            ) : field.type === "scene" ? (
              <SceneSelect
                value={value[field.key]}
                defaultValue={field.defaultValue}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "image" ? (
              <ImageSelect
                value={value[field.key]}
                defaultValue={field.defaultValue}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "flag" ? (
              <FlagSelect
                value={value[field.key]}
                defaultValue={field.defaultValue}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "direction" ? (
              <DirectionPicker
                value={value[field.key]}
                defaultValue={field.defaultValue}
                onChange={onChangeField(field.key, "direction")}
              />
            ) : field.type === "fadeSpeed" ? (
              <FadeSpeedSelect
                value={value[field.key]}
                defaultValue={field.defaultValue}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "cameraSpeed" ? (
              <CameraSpeedSelect
                allowNone
                value={value[field.key]}
                defaultValue={field.defaultValue}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "overlayColor" ? (
              <OverlayColorSelect
                value={value[field.key]}
                defaultValue={field.defaultValue}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "actor" ? (
              <ActorSelect
                value={value[field.key]}
                defaultValue={field.defaultValue}
                onChange={onChangeField(field.key)}
              />
            ) : field.type === "emotion" ? (
              <EmotionSelect
                value={value[field.key]}
                defaultValue={field.defaultValue}
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

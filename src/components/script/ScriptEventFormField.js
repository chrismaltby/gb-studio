/* eslint-disable react/no-multi-comp */
/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { TriangleIcon } from "../library/Icons";
import { FormField, ToggleableFormField } from "../library/Forms";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import ScriptEventFormInput from "./ScriptEventFormInput";

const genKey = (id, key, index) => `${id}_${key}_${index || 0}`;

class ScriptEventFormField extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("ScriptEventFormField", this.props, {}, nextProps, {});
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
          className={cx("ScriptEditorEvent__Else", {
            "ScriptEditorEvent__Else--Open": !value
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
          <span key={fieldId} className="ScriptEventForm__InputRow">
            <ScriptEventFormInput
              id={fieldId}
              entityId={entityId}
              type={field.type}
              field={field}
              index={valueIndex}
              defaultValue={field.defaultValue}
              value={value[valueIndex]}
              args={args}
              onChange={this.onChange}
            />
            <div className="ScriptEventForm__BtnRow">
              {valueIndex !== 0 && (
                <div
                  className="ScriptEventForm__Btn"
                  onClick={this.onRemoveValue(valueIndex)}
                >
                  -
                </div>
              )}
              <div
                className="ScriptEventForm__Btn"
                onClick={this.onAddValue(valueIndex)}
              >
                +
              </div>
            </div>
          </span>
        );
      })
    ) : (
      <ScriptEventFormInput
        id={genKey(eventId, field.key)}
        entityId={entityId}
        type={field.type}
        field={field}
        defaultValue={field.defaultValue}
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
        {label && field.type !== "checkbox" && field.type !== "group" && (
          <label htmlFor={genKey(eventId, field.key)}>{label}</label>
        )}
        {field.type !== "checkbox" && inputField}
        {field.type === "checkbox" && (
          <label htmlFor={genKey(eventId, field.key)}>{inputField} {label}</label>
        )}
      </FormField>
    );
  }
}

ScriptEventFormField.propTypes = {
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

ScriptEventFormField.defaultProps = {
  value: "",
  args: {}
};

export default ScriptEventFormField;

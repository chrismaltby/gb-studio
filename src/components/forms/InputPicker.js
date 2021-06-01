import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { TriangleIcon } from "ui/icons/Icons";
import l10n from "lib/helpers/l10n";

const renderButton = (id, value, onChange) => (input) =>
  (
    <label htmlFor={`${id}_${input.key}`} key={input.key} title={input.title}>
      <input
        id={`${id}_${input.key}`}
        type="checkbox"
        checked={
          Array.isArray(value)
            ? value.indexOf && value.indexOf(input.key) > -1
            : value === input.key
        }
        onChange={() => {
          if (Array.isArray(value)) {
            if (value.indexOf(input.key) > -1) {
              if (value.length > 1) {
                onChange(value.filter((i) => i !== input.key));
              }
            } else {
              onChange([].concat(value, input.key));
            }
          } else {
            onChange(input.key);
          }
        }}
      />
      <div
        key={input.key}
        className={cx(
          "InputPicker__Button",
          `InputPicker__Button--${input.name}`,
          {
            "InputPicker__Button--Active": Array.isArray(value)
              ? value.indexOf && value.indexOf(input.key) > -1
              : value === input.key,
          }
        )}
      >
        {input.label}
      </div>
    </label>
  );

class InputPicker extends Component {
  render() {
    const { id, value, onChange } = this.props;
    const inputs = [
      {
        key: "left",
        name: "Left",
        label: <TriangleIcon />,
        title: l10n("FIELD_DIRECTION_LEFT"),
      },
      {
        key: "up",
        name: "Up",
        label: <TriangleIcon />,
        title: l10n("FIELD_DIRECTION_UP"),
      },
      {
        key: "down",
        name: "Down",
        label: <TriangleIcon />,
        title: l10n("FIELD_DIRECTION_DOWN"),
      },
      {
        key: "right",
        name: "Right",
        label: <TriangleIcon />,
        title: l10n("FIELD_DIRECTION_RIGHT"),
      },
      {
        key: "a",
        name: "A",
        label: "A",
        title: "A",
      },
      {
        key: "b",
        name: "B",
        label: "B",
        title: "B",
      },
      {
        key: "start",
        name: "Start",
        label: "Start",
        title: "Start",
      },
      {
        key: "select",
        name: "Select",
        label: "Select",
        title: "Select",
      },
    ];

    return (
      <div id={id} className="InputPicker">
        <div className="InputPicker__Row">
          {inputs.slice(0, 4).map(renderButton(id, value, onChange))}
        </div>
        <div className="InputPicker__Row">
          {inputs.slice(4, 8).map(renderButton(id, value, onChange))}
        </div>
        {Array.isArray(value) && (
          <div className="InputPicker__Selection">
            {inputs
              .filter((input) => value.indexOf(input.key) > -1)
              .map((input) => input.name)
              .join(", ")}
          </div>
        )}
      </div>
    );
  }
}

InputPicker.propTypes = {
  id: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  onChange: PropTypes.func.isRequired,
};

InputPicker.defaultProps = {
  id: undefined,
  value: "",
};

export default InputPicker;

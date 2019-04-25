import React, { Component } from "react";
import cx from "classnames";
import { TriangleIcon } from "../library/Icons";
import l10n from "../../lib/helpers/l10n";

class InputPicker extends Component {
  render() {
    const { value, onChange } = this.props;
    const inputs = [
      {
        key: "left",
        name: "Left",
        label: <TriangleIcon />,
        title: l10n("FIELD_DIRECTION_LEFT")
      },
      {
        key: "up",
        name: "Up",
        label: <TriangleIcon />,
        title: l10n("FIELD_DIRECTION_UP")
      },
      {
        key: "down",
        name: "Down",
        label: <TriangleIcon />,
        title: l10n("FIELD_DIRECTION_DOWN")
      },
      {
        key: "right",
        name: "Right",
        label: <TriangleIcon />,
        title: l10n("FIELD_DIRECTION_RIGHT")
      },
      {
        key: "a",
        name: "A",
        label: "A",
        title: "A"
      },
      {
        key: "b",
        name: "B",
        label: "B",
        title: "B"
      },
      {
        key: "start",
        name: "Start",
        label: "Start",
        title: "Start"
      },
      {
        key: "select",
        name: "Select",
        label: "Select",
        title: "Select"
      }
    ];

    return (
      <div className="InputPicker">
        <div className="InputPicker__Row">
          {inputs.slice(0, 4).map(renderButton(value, onChange))}
        </div>
        <div className="InputPicker__Row">
          {inputs.slice(4, 8).map(renderButton(value, onChange))}
        </div>
      </div>
    );
  }
}

const renderButton = (value, onChange) => input => (
  <label key={input.key} title={input.title}>
    <input
      type="checkbox"
      checked={value && value.indexOf && value.indexOf(input.key) > -1}
      onChange={() => {
        if (Array.isArray(value)) {
          if (value.indexOf(input.key) > -1) {
            onChange(value.filter(i => i !== input.key));
          } else {
            onChange([].concat(value, input.key));
          }
        } else {
          onChange([input.key]);
        }
      }}
    />
    <div
      key={input.key}
      className={cx(
        "InputPicker__Button",
        "InputPicker__Button--" + input.name,
        {
          "InputPicker__Button--Active":
            value && value.indexOf && value.indexOf(input.key) > -1
        }
      )}
    >
      {input.label}
    </div>
  </label>
);

export default InputPicker;

import React, { Component } from "react";
import cx from "classnames";
import { TriangleIcon } from "../library/Icons";

class InputPicker extends Component {
  render() {
    const { value, onChange } = this.props;
    const inputs = [
      {
        key: "left",
        name: "Left",
        label: <TriangleIcon />
      },
      {
        key: "up",
        name: "Up",
        label: <TriangleIcon />
      },
      {
        key: "down",
        name: "Down",
        label: <TriangleIcon />
      },
      {
        key: "right",
        name: "Right",
        label: <TriangleIcon />
      },
      {
        key: "a",
        name: "A",
        label: "A"
      },
      {
        key: "b",
        name: "B",
        label: "B"
      },
      {
        key: "start",
        name: "Start",
        label: "Start"
      },
      {
        key: "select",
        name: "Select",
        label: "Select"
      }
    ];

    return (
      <div className="InputPicker">
        {inputs.map(input => (
          <div
            key={input.key}
            onClick={() => {
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
        ))}
      </div>
    );
  }
}

export default InputPicker;

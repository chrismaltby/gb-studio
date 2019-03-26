import React, { Component } from "react";
import cx from "classnames";
import { TriangleIcon } from "../library/Icons";

class DirectionPicker extends Component {
  render() {
    const { value, onChange } = this.props;
    const directions = [
      {
        key: "left",
        name: "Left"
      },
      {
        key: "up",
        name: "Up"
      },
      {
        key: "down",
        name: "Down"
      },
      {
        key: "right",
        name: "Right"
      }
    ];

    return (
      <div className="DirectionPicker">
        {directions.map(direction => (
          <label key={direction.key} title={direction.name}>
            <input
              type="radio"
              checked={value === direction.key}
              onChange={() => onChange(direction.key)}
            />
            <div
              className={cx(
                "DirectionPicker__Button",
                "DirectionPicker__Button--" + direction.name,
                {
                  "DirectionPicker__Button--Active": value === direction.key
                }
              )}
            >
              <TriangleIcon />
            </div>
          </label>
        ))}
      </div>
    );
  }
}

export default DirectionPicker;

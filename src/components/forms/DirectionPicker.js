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
          <div
            key={direction.key}
            onClick={() => onChange(direction.key)}
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
        ))}
      </div>
    );
  }
}

export default DirectionPicker;

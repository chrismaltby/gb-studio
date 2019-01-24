import React, { Component } from "react";
import cx from "classnames";

class DirectionPicker extends Component {
  render() {
    const { value, onChange } = this.props;
    const directions = [
      {
        key: "left",
        name: "Left",
        label: "◀"
      },
      {
        key: "up",
        name: "Up",
        label: "▲"
      },
      {
        key: "down",
        name: "Down",
        label: "▼"
      },
      {
        key: "right",
        name: "Right",
        label: "▶"
      }
    ];

    return (
      <div className="DirectionPicker">
        {directions.map(direction =>
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
            {direction.label}
          </div>
        )}
      </div>
    );
  }
}

export default DirectionPicker;

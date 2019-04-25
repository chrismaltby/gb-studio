import React, { Component } from "react";
import cx from "classnames";
import { TriangleIcon } from "../library/Icons";
import l10n from "../../lib/helpers/l10n";

class DirectionPicker extends Component {
  render() {
    const { value, onChange } = this.props;
    const directions = [
      {
        key: "left",
        name: "Left",
        title: l10n("FIELD_DIRECTION_LEFT")
      },
      {
        key: "up",
        name: "Up",
        title: l10n("FIELD_DIRECTION_UP")
      },
      {
        key: "down",
        name: "Down",
        title: l10n("FIELD_DIRECTION_DOWN")
      },
      {
        key: "right",
        name: "Right",
        title: l10n("FIELD_DIRECTION_RIGHT")
      }
    ];

    return (
      <div className="DirectionPicker">
        {directions.map(direction => (
          <label key={direction.key} title={direction.title}>
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

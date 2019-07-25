import React from "react";
import cx from "classnames";

const directions = ["up", "down", "left", "right"];
const buttons = ["a", "b", "start", "select"];

export default ({ onSelect, selected }) => (
  <div className="GBControlsPreview">
    <div className="GBControlsPreview__DPad">
      {directions.map(direction => (
        <div
          key={direction}
          className={cx(
            "GBControlsPreview__DPadButton",
            `GBControlsPreview__DPadButton--${direction}`,
            {
              "GBControlsPreview__DPadButton--Selected": direction === selected
            }
          )}
          onClick={() => onSelect(direction)}
        />
      ))}
    </div>
    <div className="GBControlsPreview__Buttons">
      {buttons.map(button => (
        <div
          key={button}
          className={cx(
            "GBControlsPreview__Button",
            `GBControlsPreview__Button--${button}`,
            { "GBControlsPreview__Button--Selected": button === selected }
          )}
          onClick={() => onSelect(button)}
        >
          <div className="GBControlsPreview__ButtonLabel">{button}</div>
        </div>
      ))}
    </div>
  </div>
);

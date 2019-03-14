import React from "react";
import cx from "classnames";

export default ({ transparent, small, large, ...props }) => (
  <div
    className={cx("Button", {
      "Button--Transparent": transparent,
      "Button--Small": small,
      "Button--Large": large
    })}
    {...props}
  />
);

export const ButtonToolbar = props => (
  <div className="ButtonToolbar" {...props} />
);

export const ButtonToolbarSpacer = props => (
  <div className="ButtonToolbar__Spacer" {...props} />
);

export const ButtonToolbarFixedSpacer = props => (
  <div className="ButtonToolbar__FixedSpacer" {...props} />
);

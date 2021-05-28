import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

const LabelButton = ({ color, onClick }) => (
  <div
    className={cx("LabelButton", {
      "LabelButton--Red": color === "red",
      "LabelButton--Orange": color === "orange",
      "LabelButton--Yellow": color === "yellow",
      "LabelButton--Green": color === "green",
      "LabelButton--Blue": color === "blue",
      "LabelButton--Purple": color === "purple",
      "LabelButton--Gray": color === "gray",
    })}
    onClick={onClick}
  />
);

LabelButton.propTypes = {
  color: PropTypes.oneOf([
    "red",
    "orange",
    "yellow",
    "green",
    "blue",
    "purple",
    "gray",
  ]),
  onClick: PropTypes.func,
};

LabelButton.defaultProps = {
  color: undefined,
  onClick: undefined,
};

export default LabelButton;

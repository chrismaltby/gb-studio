import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

const Menu = ({ up, right, ...props }) => (
  <div
    className={cx("Menu", { "Menu--Right": right, "Menu--Up": up })}
    {...props}
  />
);

Menu.propTypes = {
  right: PropTypes.bool,
  up: PropTypes.bool,
};

Menu.defaultProps = {
  right: false,
  up: false,
};

const MenuItem = (props) => <div className="MenuItem" {...props} />;
const MenuDivider = (props) => <div className="MenuDivider" {...props} />;
const MenuOverlay = (props) => <div className="MenuOverlay" {...props} />;

export { Menu, MenuItem, MenuDivider, MenuOverlay };

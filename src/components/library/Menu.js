import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";

const Menu = ({ right, ...props }) => (
  <div className={cx("Menu", { "Menu--Right": right })} {...props} />
);

Menu.propTypes = {
  right: PropTypes.bool
};

Menu.defaultProps = {
  right: false
};

const MenuItem = props => <div className="MenuItem" {...props} />;
const MenuDivider = props => <div className="MenuDivider" {...props} />;
const MenuOverlay = props => <div className="MenuOverlay" {...props} />;

export { Menu, MenuItem, MenuDivider, MenuOverlay };

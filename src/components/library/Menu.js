import React, { Component } from "react";
import cx from "classnames";
// import "./Menu.css";

const Menu = ({ right, ...props }) => (
  <div className={cx("Menu", { "Menu--Right": right })} {...props} />
);
const MenuItem = props => <div className="MenuItem" {...props} />;
const MenuDivider = props => <div className="MenuDivider" {...props} />;
const MenuOverlay = props => <div className="MenuOverlay" {...props} />;

export { Menu, MenuItem, MenuDivider, MenuOverlay };

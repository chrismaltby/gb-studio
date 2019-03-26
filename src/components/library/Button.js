import React, { Component } from "react";
import cx from "classnames";
import { TriangleIcon } from "./Icons";
import { MenuOverlay, Menu } from "./Menu";

const Button = ({ transparent, small, large, ...props }) => (
  <div
    className={cx("Button", {
      "Button--Transparent": transparent,
      "Button--Small": small,
      "Button--Large": large
    })}
    {...props}
  />
);

export default Button;

export const ButtonToolbar = props => (
  <div className="ButtonToolbar" {...props} />
);

export const ButtonToolbarSpacer = props => (
  <div className="ButtonToolbar__Spacer" {...props} />
);

export const ButtonToolbarFixedSpacer = props => (
  <div className="ButtonToolbar__FixedSpacer" {...props} />
);

export class DropdownButton extends Component {
  constructor() {
    super();
    this.state = {
      open: false
    };
  }

  toggleOpen = () => {
    this.setState({ open: !this.state.open });
  };

  render() {
    const {
      children,
      label,
      showArrow = true,
      transparent,
      small,
      large,
      right,
      ...props
    } = this.props;
    const { open } = this.state;

    return (
      <div className="DropdownButton" {...props}>
        <Button
          onClick={this.toggleOpen}
          transparent={transparent}
          small={small}
          large={large}
        >
          {label}
          {showArrow && (
            <div className="DropdownButton__Triangle">
              <TriangleIcon />
            </div>
          )}
        </Button>
        {open && <MenuOverlay onClick={this.toggleOpen} />}
        {open && (
          <Menu onClick={this.toggleOpen} right>
            {children}
          </Menu>
        )}
      </div>
    );
  }
}

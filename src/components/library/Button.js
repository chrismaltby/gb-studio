import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { TriangleIcon } from "ui/icons/Icons";
import { MenuOverlay, Menu } from "./Menu";

const Button = ({ transparent, small, large, ...props }) => (
  <div
    className={cx("Button", {
      "Button--Transparent": transparent,
      "Button--Small": small,
      "Button--Large": large,
    })}
    {...props}
  />
);

Button.propTypes = {
  transparent: PropTypes.bool,
  small: PropTypes.bool,
  large: PropTypes.bool,
};

Button.defaultProps = {
  transparent: false,
  small: false,
  large: false,
};

export default Button;

export const ButtonToolbar = (props) => (
  <div className="ButtonToolbar" {...props} />
);

export const ButtonToolbarSpacer = (props) => (
  <div className="ButtonToolbar__Spacer" {...props} />
);

export const ButtonToolbarFixedSpacer = (props) => (
  <div className="ButtonToolbar__FixedSpacer" {...props} />
);

export class DropdownButton extends Component {
  constructor() {
    super();
    this.buttonEl = React.createRef();
    this.state = {
      menuDirection: "down",
      open: false,
    };
  }

  toggleOpen = () => {
    this.setState((prevState) => {
      let menuDirection = "down";
      if (!prevState.open && this.buttonEl.current) {
        const boundingRect = this.buttonEl.current.getBoundingClientRect();
        if (boundingRect.bottom > window.innerHeight - 150) {
          menuDirection = "up";
        }
      }
      return {
        open: !prevState.open,
        menuDirection,
      };
    });
  };

  render() {
    const { children, label, showArrow, transparent, small, large, ...props } =
      this.props;
    const { open, menuDirection } = this.state;
    return (
      <div ref={this.buttonEl} className="DropdownButton" {...props}>
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
          <Menu onClick={this.toggleOpen} up={menuDirection === "up"} right>
            {children}
          </Menu>
        )}
      </div>
    );
  }
}

DropdownButton.propTypes = {
  children: PropTypes.node,
  label: PropTypes.node,
  showArrow: PropTypes.bool,
  transparent: PropTypes.bool,
  small: PropTypes.bool,
  large: PropTypes.bool,
};

DropdownButton.defaultProps = {
  children: undefined,
  label: "",
  showArrow: true,
  transparent: false,
  small: false,
  large: false,
};

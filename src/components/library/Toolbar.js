import React, { Component } from "react";
import PropTypes from "prop-types";
import { Menu, MenuOverlay } from "./Menu";
import { TriangleIcon } from "./Icons";

export const Toolbar = props => <div className="Toolbar" {...props} />;
export const ToolbarButton = props => (
  <div className="Toolbar__Button" {...props} />
);
export const ToolbarSpacer = props => (
  <div className="Toolbar__Spacer" {...props} />
);
export const ToolbarFixedSpacer = props => (
  <div className="Toolbar__FixedSpacer" {...props} />
);

export const ToolbarTitle = props => (
  <div className="Toolbar__Title" {...props} />
);

export class ToolbarDropdownButton extends Component {
  constructor() {
    super();
    this.state = {
      open: false
    };
  }

  toggleOpen = () => {
    this.setState(prevState => {
      return {
        open: !prevState.open
      };
    });
  };

  render() {
    const { children, label, showArrow = true, right, ...props } = this.props;
    const { open } = this.state;

    return (
      <div className="Toolbar__DropdownButton" {...props}>
        <ToolbarButton onClick={this.toggleOpen}>
          {label}
          {showArrow && (
            <div className="Toolbar__DropdownButton__Triangle">
              <TriangleIcon />
            </div>
          )}
        </ToolbarButton>
        {open && <MenuOverlay onClick={this.toggleOpen} />}
        {open && (
          <Menu onClick={this.toggleOpen} right={right}>
            {children}
          </Menu>
        )}
      </div>
    );
  }
}

ToolbarDropdownButton.propTypes = {
  children: PropTypes.node,
  label: PropTypes.node,
  showArrow: PropTypes.bool,
  right: PropTypes.bool
};

ToolbarDropdownButton.defaultProps = {
  children: undefined,
  label: "",
  showArrow: true,
  right: false
};

import React, {Component} from "react";
import cx from "classnames";
import {TriangleIcon} from "ui/icons/Icons";
import {Menu, MenuOverlay} from "./Menu";

interface Props extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
  transparent?: boolean;
  small?: boolean;
  large?: boolean;
}

const Button = ({transparent = false, small = false, large = false, ...props}: Props) => (
  <div
    className={cx("Button", {
      "Button--Transparent": transparent,
      "Button--Small": small,
      "Button--Large": large,
    })}
    {...props}
  />
);

export default Button;

export const ButtonToolbar = (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => (
  <div className="ButtonToolbar" {...props} />
);

export const ButtonToolbarSpacer = (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => (
  <div className="ButtonToolbar__Spacer" {...props} />
);

export const ButtonToolbarFixedSpacer = (props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>) => (
  <div className="ButtonToolbar__FixedSpacer" {...props} />
);

interface DropdownButtonProps {
  children?: React.ReactNode;
  label?: React.ReactNode;
  showArrow?: boolean;
  transparent?: boolean;
  small?: boolean;
  large?: boolean;
}

interface DropdownButtonState {
  menuDirection: "up" | "down";
  open: boolean;
}

export class DropdownButton extends Component<DropdownButtonProps, DropdownButtonState> {
  static defaultProps = {
    children: undefined,
    label: "",
    showArrow: true,
    transparent: false,
    small: false,
    large: false,
  }
  private buttonEl: React.RefObject<HTMLDivElement>;

  constructor(props: DropdownButtonProps) {
    super(props);
    this.buttonEl = React.createRef();
    this.state = {
      menuDirection: "down",
      open: false,
    };
  }

  toggleOpen = () => {
    this.setState((prevState) => {
      let menuDirection = "down" as 'up'|'down';
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
    const {children, label, showArrow, transparent, small, large, ...props} =
      this.props;
    const {open, menuDirection} = this.state;
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
              <TriangleIcon/>
            </div>
          )}
        </Button>
        {open && <MenuOverlay onClick={this.toggleOpen}/>}
        {open && (
          <Menu onClick={this.toggleOpen} up={menuDirection === "up"} right>
            {children}
          </Menu>
        )}
      </div>
    );
  }
}

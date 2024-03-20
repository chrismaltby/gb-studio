import React, {
  Children,
  cloneElement,
  CSSProperties,
  FC,
  isValidElement,
  ReactElement,
  ReactNode,
} from "react";
import styled, { css } from "styled-components";
import { RelativePortal } from "ui/layout/RelativePortal";
import useDropdownMenu from "ui/hooks/use-dropdown-menu";
import { CaretDownIcon } from "ui/icons/Icons";
import { Menu, MenuItem, MenuItemProps } from "ui/menu/Menu";
import { Button, ButtonProps } from "./Button";

export interface DropdownButtonProps {
  readonly label?: ReactNode;
  readonly title?: string;
  readonly children?: ReactNode;
  readonly showArrow?: boolean;
  readonly menuDirection?: "left" | "right";
  readonly offsetX?: number;
  readonly offsetY?: number;
  readonly style?: CSSProperties;
  readonly onMouseDown?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void;
}

interface MenuWrapperProps {
  readonly menuDirection?: "left" | "right";
}

export const MenuWrapper = styled.div<MenuWrapperProps>`
  position: absolute;
  margin-top: 2px;
  z-index: 10001;
  left: 0;

  ${(props) =>
    props.menuDirection === "right"
      ? css`
          left: auto;
          right: 0;
        `
      : ""}
`;

export const Wrapper = styled.div`
  position: relative;
  flex-shrink: 0;
  [aria-expanded="false"] + ${MenuWrapper} {
    display: none;
  }
`;

export const ArrowWrapper = styled.div`
  margin-right: -5px;
  margin-top: -1px;
  min-width: 8px;
  &:not(:first-child) {
    padding-left: 5px;
  }
  &&&& > svg {
    height: 8px;
  }
`;

export const DropdownButton: FC<DropdownButtonProps & ButtonProps> = ({
  size,
  variant,
  label,
  title,
  children,
  showArrow,
  menuDirection,
  offsetX,
  offsetY,
  active,
  style,
  onMouseDown,
}) => {
  const childArray = Children.toArray(children);
  const menuItemChildren = childArray.filter((child) => {
    return isValidElement<MenuItemProps>(child) && child.type === MenuItem;
  }) as ReactElement[];

  const { buttonProps, itemProps, isOpen, setIsOpen, moveFocus } =
    useDropdownMenu(menuItemChildren.length);

  const childrenWithProps = childArray.map((child) => {
    if (!isValidElement<MenuItemProps>(child) || child.type !== MenuItem) {
      return child;
    }
    const itemIndex = menuItemChildren.indexOf(child);
    return cloneElement(child, {
      ...itemProps[itemIndex],
      onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        setIsOpen(false);
        child.props.onClick?.(e);
      },
      onMouseEnter: () => {
        moveFocus(itemIndex);
      },
    });
  });

  return (
    <Wrapper>
      <Button
        title={title}
        size={size}
        variant={variant}
        active={active}
        {...buttonProps}
        onMouseDown={onMouseDown}
        style={{
          ...style,
          ...(showArrow && !label
            ? {
                paddingLeft: 0,
                paddingRight: 5,
              }
            : {}),
        }}
      >
        {label}
        {showArrow && (
          <ArrowWrapper>
            <CaretDownIcon />
          </ArrowWrapper>
        )}
      </Button>
      {isOpen && (
        <MenuWrapper menuDirection={menuDirection}>
          <RelativePortal
            pin={menuDirection === "left" ? "top-left" : "top-right"}
            offsetX={offsetX}
            offsetY={offsetY}
          >
            <Menu role="menu">{childrenWithProps}</Menu>
          </RelativePortal>
        </MenuWrapper>
      )}
    </Wrapper>
  );
};

DropdownButton.defaultProps = {
  showArrow: true,
  menuDirection: "left",
};

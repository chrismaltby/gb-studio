import React, {
  Children,
  ReactElement,
  cloneElement,
  isValidElement,
  useCallback,
} from "react";
import styled from "styled-components";
import { MenuWrapper } from "ui/buttons/DropdownButton";
import useDropdownMenu from "ui/hooks/use-dropdown-menu";
import { RelativePortal } from "ui/layout/RelativePortal";
import { Menu, MenuItem, MenuItemProps } from "ui/menu/Menu";
// import { MenuItem, MenuItemProps } from "ui/menu/Menu";

type NestedMenuProps = {
  label: React.ReactNode;
  children?: React.ReactNode;
};

const Wrapper = styled.button`
  display: flex;
  position: relative;
`;

const SubMenuWrapper = styled.button`
  position: relative;
  background: orange;
  width: 5px;
  height: 5px;
`;

export const NestedMenu = ({ label, children }: NestedMenuProps) => {
  const childArray = Children.toArray(children);
  const menuItemChildren = childArray.filter((child) => {
    return isValidElement<MenuItemProps>(child) && child.type === MenuItem;
  }) as ReactElement[];

  const { buttonProps, itemProps, isOpen, setIsOpen, moveFocus } =
    useDropdownMenu(menuItemChildren.length);

  //   const childrenWithProps = childArray.map((child) => {
  //     if (!isValidElement<MenuItemProps>(child) || child.type !== MenuItem) {
  //       return child;
  //     }
  //     const itemIndex = menuItemChildren.indexOf(child);
  //     return cloneElement(child, {
  //       ...itemProps[itemIndex],
  //       onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  //         console.log("BBB");
  //         e.stopPropagation();
  //         setIsOpen(false);
  //         child.props.onClick?.(e);
  //       },
  //       onMouseEnter: () => {
  //         console.log("FOCUS!!");
  //         moveFocus(itemIndex);
  //       },
  //     });
  //   });
  //   const mergedKeyDown = useCallback(
  //     (e: React.KeyboardEvent<HTMLButtonElement>) => {
  //       if (onKeyDown?.(e)) {
  //         setIsOpen(false);
  //       } else {
  //         buttonProps?.onKeyDown?.(e);
  //       }
  //     },
  //     [buttonProps, onKeyDown, setIsOpen]
  //   );

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      buttonProps.onClick?.(e);
    },
    [buttonProps]
  );

  return (
    <Wrapper {...buttonProps} onClick={onClick}>
      {/* <SubMenuWrapper>
        {isOpen && (
          <MenuWrapper menuDirection={"right"}>
            <RelativePortal pin={"top-right"} offsetX={-5} offsetY={-16}>
              <Menu role="menu">{childrenWithProps}</Menu>
            </RelativePortal>
          </MenuWrapper>
        )}
      </SubMenuWrapper>
      -{label}+ */}
    </Wrapper>
  );
};

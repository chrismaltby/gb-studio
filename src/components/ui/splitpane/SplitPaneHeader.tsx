import React, { ReactNode } from "react";
import styled from "styled-components";
import { Button } from "../buttons/Button";
import { CaretDownIcon, CaretRightIcon } from "../icons/Icons";

interface SplitPaneHeaderProps {
  children: ReactNode;
  buttons?: ReactNode;
  collapsed: boolean;
  onToggle?: () => void;
}

export const Wrapper = styled.div`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 5px;
  padding-left: 5px;
  height: 30px;
  background-color: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  border-bottom: 1px solid ${(props) => props.theme.colors.input.border};

  > span {
    flex-grow: 1;
  }

  :active {
    background-color: ${(props) => props.theme.colors.input.hoverBackground};
  }

  ${Button} {
    width: 16px;
    padding: 4px;
    min-width: 18px;
  }
`;

const CollapseIcon = styled.div`
  width: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  svg {
    width: 8px;
    fill: ${(props) => props.theme.colors.input.text};
  }
`;

export const SplitPaneHeader: React.FC<SplitPaneHeaderProps> = ({
  children,
  buttons,
  onToggle,
  collapsed,
}) => {
  return (
    <Wrapper onClick={onToggle}>
      <CollapseIcon>
        {collapsed ? <CaretRightIcon /> : <CaretDownIcon />}
      </CollapseIcon>
      <span>{children}</span>
      {buttons}
    </Wrapper>
  );
};

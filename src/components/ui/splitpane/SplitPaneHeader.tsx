import React, { ReactNode } from "react";
import styled from "styled-components";
import { CaretDownIcon, CaretUpIcon } from "../icons/Icons";

interface SplitPaneHeaderProps {
  children: ReactNode;
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
  height: 30px;
  background-color: ${props => props.theme.colors.input.background};
  color: ${props => props.theme.colors.input.text};
  border-bottom: 1px solid ${props => props.theme.colors.input.border};

  > span {
    flex-grow: 1;
  }

  svg {
    width: 8px;
    fill: ${props => props.theme.colors.input.text};
  }

  :active {
    background-color: ${props => props.theme.colors.input.hoverBackground};
  }
`;

export const SplitPaneHeader: React.FC<SplitPaneHeaderProps> = ({
  children,
  onToggle,
  collapsed,
}) => {
  return (
    <Wrapper onClick={onToggle}>
      <span>{children}</span>
      {collapsed ? <CaretUpIcon /> : <CaretDownIcon />}
    </Wrapper>
  );
};

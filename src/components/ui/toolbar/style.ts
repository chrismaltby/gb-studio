import styled, { css } from "styled-components";
import { StyledButton } from "ui/buttons/style";

interface StyledToolbarProps {
  readonly $focus?: boolean;
}

export const StyledToolbar = styled.div<StyledToolbarProps>`
  display: flex;
  box-sizing: border-box;
  height: 38px;
  font-size: ${(props) => props.theme.typography.toolbarFontSize};
  flex-shrink: 0;
  background: ${(props) => props.theme.colors.toolbar.background};
  color: ${(props) => props.theme.colors.text};
  border-bottom: 1px solid ${(props) => props.theme.colors.toolbar.border};
  display: flex;
  align-items: center;
  padding-left: 10px;
  padding-right: 10px;
  user-select: none;
  z-index: 1;
  -webkit-app-region: drag;
  position: relative;
  z-index: 1000;

  .Platform__darwin & {
    padding-left: 80px;
  }

  .full-screen & {
    padding-left: 10px;
  }

  & > *:not(:last-child) {
    margin-right: 5px;
  }

  input {
    -webkit-app-region: no-drag;
  }

  ${StyledButton} {
    -webkit-app-region: no-drag;
    border: 1px solid ${(props) => props.theme.colors.toolbar.button.border};
    height: 26px;
    padding: 0px 10px;
    flex-shrink: 0;
    font-size: 13px;

    svg {
      width: 17px;
      height: 17px;
    }
  }

  ${(props) => (props.$focus === false ? blurStyles : "")}
`;

const blurStyles = css`
  background: ${(props) => props.theme.colors.toolbar.inactiveBackground};
`;

export const StyledToolbarTitle = styled.div`
  text-shadow: ${(props) => props.theme.colors.toolbar.textShadow};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

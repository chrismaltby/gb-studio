import styled, { css } from "styled-components";

// #region SplashWindow

export interface StyledSplashWindowProps {
  $focus: boolean;
}

export const StyledSplashWindow = styled.div<StyledSplashWindowProps>`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  ${(props) =>
    props.$focus === false
      ? css`
          opacity: 0.75;
          -webkit-filter: grayscale(100%);
        `
      : ""}
`;

// #endregion SplashWindow

// #region SplashTab

interface StyledSplashTabProps {
  $selected?: boolean;
}

export const StyledSplashTab = styled.button<StyledSplashTabProps>`
  font-size: 13px;
  padding: 8px 20px;
  text-align: left;
  color: ${(props) => props.theme.colors.text};
  background: transparent;
  border: 0;
  -webkit-app-region: no-drag;

  &:hover {
    background: rgba(128, 128, 128, 0.3);
  }

  &:active {
    background: rgba(128, 128, 128, 0.4);
  }

  ${(props) => (props.$selected ? styledSplashTabSelectedStyles : "")}
`;

const styledSplashTabSelectedStyles = css`
  background: ${(props) => props.theme.colors.highlight};
  color: #fff;

  &:hover {
    background: ${(props) => props.theme.colors.highlight};
    color: #fff;
  }
  &:active {
    background: ${(props) => props.theme.colors.highlight};
    color: #fff;
  }
`;

// #endregion SplashTab

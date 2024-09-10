import styled, { css } from "styled-components";

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

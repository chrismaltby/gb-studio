import styled, { css } from "styled-components";
import { StyledButton } from "ui/buttons/style";

interface StyledFloatingPanelProps {
  $vertical?: boolean;
}

export const StyledFloatingPanel = styled.div<StyledFloatingPanelProps>`
  position: absolute;
  display: flex;
  background: ${(props) => props.theme.colors.sidebar.background};
  border: 1px solid ${(props) => props.theme.colors.sidebar.border};
  border-radius: 4px;
  padding: 0 4px;

  ${StyledButton} {
    width: 36px;
    height: 36px;
    border-radius: 0;
    padding: 5px;
    svg {
      width: 20px;
      height: 20px;
      max-width: 20px;
      max-height: 20px;
    }
    & ~ ${StyledButton} {
      margin-left: 1px;
    }
  }

  ${(props) =>
    props.$vertical
      ? css`
          flex-direction: column;
          padding: 4px 0;
          ${StyledButton} {
            & ~ ${StyledButton} {
              margin-left: 0px;
              margin-bottom: 1px;
            }
          }
        `
      : ""}

  .CustomSelect {
    width: 120px;

    .CustomSelect__control {
      height: 36px;
      background: transparent;
      border: 0;
    }

    .CustomSelect__control:hover {
      border: 0;
    }

    .CustomSelect__control--is-focused {
      border: 0 !important;
      box-shadow: none !important;
    }
  }
`;

export const StyledFloatingPanelDivider = styled.div`
  background: ${(props) => props.theme.colors.sidebar.border};
  min-width: 1px;
  min-height: 1px;
  align-self: stretch;
  margin: 5px 5px;
`;

export const StyledFloatingPanelBreak = styled.div`
  flex-basis: 100%;
  height: 0;
`;

import styled, { css } from "styled-components";
import { StyledButton } from "ui/buttons/style";

interface StyledFloatingPanelProps {
  $vertical?: boolean;
}

export const StyledFloatingPanel = styled.div<StyledFloatingPanelProps>`
  display: flex;
  color: ${(props) => props.theme.colors.panel.text};
  background: ${(props) => props.theme.colors.panel.background};
  border: 1px solid ${(props) => props.theme.colors.panel.border};
  border-radius: 4px;
  padding: 0 4px;

  ${StyledButton} {
    width: 36px;
    height: 36px;
    border-radius: 0;
    padding: 5px;
    color: ${(props) => props.theme.colors.panel.text};
    background: ${(props) => props.theme.colors.panel.background};

    &:hover {
      background: ${(props) => props.theme.colors.panel.hoverBackground};
    }

    &:active {
      background: ${(props) => props.theme.colors.panel.activeBackground};
    }

    svg {
      fill: ${(props) => props.theme.colors.panel.icon};
      width: 20px;
      height: 20px;
      max-width: 20px;
      max-height: 20px;
    }

    &[data-is-active="true"] {
      background: ${(props) => props.theme.colors.panel.selectedBackground};
      svg {
        fill: ${(props) => props.theme.colors.panel.selectedIcon};
      }
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
  background: ${(props) => props.theme.colors.panel.divider};
  min-width: 1px;
  min-height: 1px;
  align-self: stretch;
  margin: 5px 5px;
`;

export const StyledFloatingPanelBreak = styled.div`
  flex-basis: 100%;
  height: 0;
`;

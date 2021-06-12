import styled, { css } from "styled-components";
import { Select } from "ui/form/Select";
import { Button } from "../buttons/Button";

interface FloatingPanelProps {
  vertical?: boolean;
}

const FloatingPanel = styled.div<FloatingPanelProps>`
  position: absolute;
  display: flex;
  background: ${(props) => props.theme.colors.sidebar.background};
  border: 1px solid ${(props) => props.theme.colors.sidebar.border};
  border-radius: 4px;
  padding: 0 4px;

  ${(props) =>
    props.vertical
      ? css`
          flex-direction: column;
        `
      : ""}

  ${Button} {
    width: 36px;
    height: 36px;
    border-radius: 0;
    padding: 5px;
    svg {
      width: 20px;
    }
    & ~ ${Button} {
      margin-left: 1px;
    }
  }

  ${Select} {
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

export const FloatingPanelDivider = styled.div`
  background: ${(props) => props.theme.colors.sidebar.border};
  min-width: 1px;
  min-height: 1px;
  align-self: stretch;
  margin: 5px 5px;
`;

export default FloatingPanel;

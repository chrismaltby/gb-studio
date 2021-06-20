import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";

export const ScriptEventPlaceholder = styled.div`
  background: #ccc;
  height: 50px;
`;

interface ScriptEventHeaderProps {
  conditional: boolean;
  nestLevel: number;
  child?: boolean;
  open: boolean;
}

export const ScriptEventHeader = styled.div<ScriptEventHeaderProps>`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 5px;
  padding-left: 10px;
  height: 30px;
  background-color: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  // border-bottom: 1px solid ${(props) => props.theme.colors.input.border};

  svg {
    fill: ${(props) => props.theme.colors.text};
    width: 8px;
    height: 8px;
    transform: rotate(${(props) => (props.open ? 90 : 0)}deg);
  }

  ${(props) =>
    props.conditional && props.nestLevel === 0
      ? css`
          background: blue;
          color: #fff;
          svg {
            fill: #fff;
          }
        `
      : ""}

  ${(props) =>
    props.conditional && props.nestLevel === 1
      ? css`
          background: purple;
          color: #fff;
          svg {
            fill: #fff;
          }
        `
      : ""}      

  ${(props) =>
    props.child
      ? css`
          padding-left: 0;
        `
      : ""}


  > span {
    flex-grow: 1;
  }

  ${Button} {
    padding: 4px;
    min-width: 18px;
  }
`;

export const ScriptEventWrapper = styled.div`
  & ~ & {
    border-top: 1px solid ${(props) => props.theme.colors.input.border};
  }
`;

interface ScriptEventFormWrapperProps {
  conditional: boolean;
  nestLevel: number;
}

export const ScriptEventFormWrapper = styled.div<ScriptEventFormWrapperProps>`
  ${(props) =>
    props.conditional && props.nestLevel === 0
      ? css`
          border-left: 10px solid blue;
        `
      : ""}

  ${(props) =>
    props.conditional && props.nestLevel === 1
      ? css`
          border-left: 10px solid purple;
        `
      : ""}
`;

export const ScriptEventFields = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 10px;
  padding: 10px;
  & > * {
    grid-column-end: span 2;
  }
`;

interface ScriptEventFieldProps {
  halfWidth?: boolean;
}

export const ScriptEventField = styled.div<ScriptEventFieldProps>`
  // padding: 10px;
  ${(props) =>
    props.halfWidth
      ? css`
          grid-column-end: span 1;
        `
      : ""}
`;

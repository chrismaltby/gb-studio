import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";

export const ScriptEventPlaceholder = styled.div`
  background: #ccc;
  height: 25px;
`;

interface ScriptEventHeaderProps {
  conditional: boolean;
  nestLevel: number;
  comment?: boolean;
  child?: boolean;
  open?: boolean;
}

export const ScriptEventHeader = styled.div<ScriptEventHeaderProps>`
  position: relative;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 5px;
  padding-left: 10px;
  height: 25px;
  background-color: ${(props) => props.theme.colors.sidebar.background};
  color: ${(props) => props.theme.colors.input.text};
  line-height: 12px;
  cursor: move;

  &:before {
    content: "⋮";
    position: absolute;
    left: 3px;
    top: 6px;
  }

  svg {
    fill: ${(props) => props.theme.colors.text};
    width: 8px;
    height: 8px;
    transform: rotate(${(props) => (props.open ? 90 : 0)}deg);
  }

  ${(props) =>
    props.conditional && props.nestLevel % 4 === 0
      ? css`
          background: ${props.theme.colors.scripting.header.nest1Background};
        `
      : ""}
  ${(props) =>
    props.conditional && props.nestLevel % 4 === 1
      ? css`
          background: ${props.theme.colors.scripting.header.nest2Background};
        `
      : ""}
  ${(props) =>
    props.conditional && props.nestLevel % 4 === 2
      ? css`
          background: ${props.theme.colors.scripting.header.nest3Background};
        `
      : ""}
          
  ${(props) =>
    props.conditional && props.nestLevel % 4 === 3
      ? css`
          background: ${props.theme.colors.scripting.header.nest4Background};
        `
      : ""}

  ${(props) =>
    props.comment
      ? css`
          background: ${props.theme.colors.scripting.header.commentBackground};
        `
      : ""}


  ${(props) =>
    props.child
      ? css`
          padding-left: 0;
        `
      : ""}

  ${Button} {
    padding: 4px;
    min-width: 18px;
  }
`;

export const ScriptEventWrapper = styled.div`
  background: ${(props) => props.theme.colors.scripting.form.background};
  & ~ & {
    border-top: 1px solid ${(props) => props.theme.colors.input.border};
  }
`;

interface ScriptEventFormWrapperProps {
  conditional: boolean;
  nestLevel: number;
}

export const ScriptEventFormWrapper = styled.div<ScriptEventFormWrapperProps>`
  position: relative;

  ${(props) =>
    props.conditional && props.nestLevel % 4 === 0
      ? css`
          border-left: 10px solid
            ${props.theme.colors.scripting.header.nest1Background};
        `
      : ""}
  ${(props) =>
    props.conditional && props.nestLevel % 4 === 1
      ? css`
          border-left: 10px solid
            ${props.theme.colors.scripting.header.nest2Background};
        `
      : ""}
  ${(props) =>
    props.conditional && props.nestLevel % 4 === 2
      ? css`
          border-left: 10px solid
            ${props.theme.colors.scripting.header.nest3Background};
        `
      : ""}
          
  ${(props) =>
    props.conditional && props.nestLevel % 4 === 3
      ? css`
          border-left: 10px solid
            ${props.theme.colors.scripting.header.nest4Background};
        `
      : ""}
`;

export const ScriptEventFormNest = styled.div`
  position: absolute;
  top: 0;
  left: -10px;
  bottom: 0;
  width: 12px;
  :hover {
    background: rgba(128, 128, 128, 0.1);
  }
`;

export const ScriptEventFields = styled.div`
  border-top: 1px solid ${(props) => props.theme.colors.input.border};
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

export const ScriptEditorChildren = styled.div`
  border: 1px solid ${(props) => props.theme.colors.input.border};
  border-right: 0;
  margin-right: -10px;
`;

import styled, { css } from "styled-components";

export const ScriptEventPlaceholder = styled.div`
  background: ${(props) => props.theme.colors.scripting.placeholder.background};
  height: 25px;
`;

export const ScriptEventWrapper = styled.div`
  background: ${(props) => props.theme.colors.scripting.form.background};
  & ~ & {
    border-top: 1px solid ${(props) => props.theme.colors.input.border};
  }
`;

export const ScriptEventRenameInput = styled.input`
  flex-grow: 1;
  border: 0;
  border-radius: 4px;
  padding: 5px;
  margin-left: -5px;
  font-weight: bold;
  margin-right: -22px;
`;

export const ScriptEventRenameInputCompleteButton = styled.button`
  z-index: 10000;
  position: relative;
  top: 0px;
  left: 0px;
  width: 21px;
  height: 21px;
  border: 0;
  border-radius: ${(props) => Math.max(0, props.theme.borderRadius - 1)}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 10px;
  font-size: 12px;
  font-weight: bold;
  background: transparent;
  border-color: transparent;

  :hover {
    background: rgba(128, 128, 128, 0.3);
  }
  :active {
    background: rgba(128, 128, 128, 0.4);
  }
  svg {
    width: 12px;
    height: 12px;
    fill: #333;
  }
`;

export const ScriptEventHeaderTitle = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: center;
  height: 25px;
`;

interface ScriptEventHeaderCaretProps {
  open?: boolean;
}

export const ScriptEventHeaderCaret = styled.div<ScriptEventHeaderCaretProps>`
  svg {
    fill: ${(props) => props.theme.colors.text};
    width: 8px;
    height: 8px;
    flex-shrink: 0;
    transform: rotate(${(props) => (props.open ? 90 : 0)}deg);
  }
`;

interface ScriptEventHeaderProps {
  conditional: boolean;
  nestLevel: number;
  comment?: boolean;
  child?: boolean;
  altBg?: boolean;
}

export const ScriptEventHeader = styled.div<ScriptEventHeaderProps>`
  position: relative;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 10px;
  padding-left: 10px;
  height: 25px;
  background-color: ${(props) =>
    props.theme.colors.scripting.header.background};
  color: ${(props) => props.theme.colors.input.text};
  line-height: 12px;
  cursor: move;

  &:hover:before {
    content: "⋮";
    position: absolute;
    left: 3px;
    top: 6px;
  }

  ${(props) =>
    props.altBg
      ? css`
          background: ${props.theme.colors.scripting.header.backgroundAlt};
        `
      : ""}

  ${(props) =>
    !props.altBg && props.conditional && props.nestLevel % 4 === 0
      ? css`
          background: ${props.theme.colors.scripting.header.nest1Background};
        `
      : ""}
  ${(props) =>
    !props.altBg && props.conditional && props.nestLevel % 4 === 1
      ? css`
          background: ${props.theme.colors.scripting.header.nest2Background};
        `
      : ""}
  ${(props) =>
    !props.altBg && props.conditional && props.nestLevel % 4 === 2
      ? css`
          background: ${props.theme.colors.scripting.header.nest3Background};
        `
      : ""}
          
  ${(props) =>
    !props.altBg && props.conditional && props.nestLevel % 4 === 3
      ? css`
          background: ${props.theme.colors.scripting.header.nest4Background};
        `
      : ""}

  ${(props) =>
    !props.altBg && props.comment
      ? css`
          &&& {
            background: ${props.theme.colors.scripting.header
              .commentBackground};
          }
        `
      : ""}

  ${(props) =>
    props.altBg && props.conditional && props.nestLevel % 4 === 0
      ? css`
          background: ${props.theme.colors.scripting.header.nest1BackgroundAlt};
        `
      : ""}
  ${(props) =>
    props.altBg && props.conditional && props.nestLevel % 4 === 1
      ? css`
          background: ${props.theme.colors.scripting.header.nest2BackgroundAlt};
        `
      : ""}
  ${(props) =>
    props.altBg && props.conditional && props.nestLevel % 4 === 2
      ? css`
          background: ${props.theme.colors.scripting.header.nest3BackgroundAlt};
        `
      : ""}
          
  ${(props) =>
    props.altBg && props.conditional && props.nestLevel % 4 === 3
      ? css`
          background: ${props.theme.colors.scripting.header.nest4BackgroundAlt};
        `
      : ""}

  ${(props) =>
    props.altBg && props.comment
      ? css`
          &&& {
            background: ${props.theme.colors.scripting.header
              .commentBackgroundAlt};
          }
        `
      : ""}

  ${(props) =>
    props.child
      ? css`
          padding-left: 0;
        `
      : ""}
`;

export const ScriptEventBranchHeader = styled.div<ScriptEventHeaderProps>`
  position: relative;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 5px;
  padding-left: 8px;
  margin-left: -10px;
  margin-right: -10px;
  margin-bottom: -10px;
  height: 25px;
  color: ${(props) => props.theme.colors.input.text};
  line-height: 12px;

  ${(props) =>
    !props.altBg && props.conditional && props.nestLevel % 4 === 0
      ? css`
          background: ${props.theme.colors.scripting.header.nest1Background};
        `
      : ""}
  ${(props) =>
    !props.altBg && props.conditional && props.nestLevel % 4 === 1
      ? css`
          background: ${props.theme.colors.scripting.header.nest2Background};
        `
      : ""}
  ${(props) =>
    !props.altBg && props.conditional && props.nestLevel % 4 === 2
      ? css`
          background: ${props.theme.colors.scripting.header.nest3Background};
        `
      : ""}
          
  ${(props) =>
    !props.altBg && props.conditional && props.nestLevel % 4 === 3
      ? css`
          background: ${props.theme.colors.scripting.header.nest4Background};
        `
      : ""}

  ${(props) =>
    props.altBg && props.conditional && props.nestLevel % 4 === 0
      ? css`
          background: ${props.theme.colors.scripting.header.nest1BackgroundAlt};
        `
      : ""}
  ${(props) =>
    props.altBg && props.conditional && props.nestLevel % 4 === 1
      ? css`
          background: ${props.theme.colors.scripting.header.nest2BackgroundAlt};
        `
      : ""}
  ${(props) =>
    props.altBg && props.conditional && props.nestLevel % 4 === 2
      ? css`
          background: ${props.theme.colors.scripting.header.nest3BackgroundAlt};
        `
      : ""}
          
  ${(props) =>
    props.altBg && props.conditional && props.nestLevel % 4 === 3
      ? css`
          background: ${props.theme.colors.scripting.header.nest4BackgroundAlt};
        `
      : ""}
`;

interface ScriptEventFormWrapperProps {
  conditional: boolean;
  nestLevel: number;
  altBg?: boolean;
}

export const ScriptEventFormWrapper = styled.div<ScriptEventFormWrapperProps>`
  position: relative;

  ${(props) =>
    !props.altBg && props.conditional && props.nestLevel % 4 === 0
      ? css`
          border-left: 2px solid
            ${props.theme.colors.scripting.header.nest1Background};
        `
      : ""}
  ${(props) =>
    !props.altBg && props.conditional && props.nestLevel % 4 === 1
      ? css`
          border-left: 2px solid
            ${props.theme.colors.scripting.header.nest2Background};
        `
      : ""}
  ${(props) =>
    !props.altBg && props.conditional && props.nestLevel % 4 === 2
      ? css`
          border-left: 2px solid
            ${props.theme.colors.scripting.header.nest3Background};
        `
      : ""}
          
  ${(props) =>
    !props.altBg && props.conditional && props.nestLevel % 4 === 3
      ? css`
          border-left: 2px solid
            ${props.theme.colors.scripting.header.nest4Background};
        `
      : ""}

  ${(props) =>
    props.altBg && props.conditional && props.nestLevel % 4 === 0
      ? css`
          border-left: 2px solid
            ${props.theme.colors.scripting.header.nest1BackgroundAlt};
        `
      : ""}
  ${(props) =>
    props.altBg && props.conditional && props.nestLevel % 4 === 1
      ? css`
          border-left: 2px solid
            ${props.theme.colors.scripting.header.nest2BackgroundAlt};
        `
      : ""}
  ${(props) =>
    props.altBg && props.conditional && props.nestLevel % 4 === 2
      ? css`
          border-left: 2px solid
            ${props.theme.colors.scripting.header.nest3BackgroundAlt};
        `
      : ""}
          
  ${(props) =>
    props.altBg && props.conditional && props.nestLevel % 4 === 3
      ? css`
          border-left: 2px solid
            ${props.theme.colors.scripting.header.nest4BackgroundAlt};
        `
      : ""}
`;

export const ScriptEventFormNest = styled.div`
  position: absolute;
  top: 0;
  left: -2px;
  bottom: 0;
  width: 4px;
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

  ${ScriptEventBranchHeader} + & {
    margin-top: 10px;
  }
`;

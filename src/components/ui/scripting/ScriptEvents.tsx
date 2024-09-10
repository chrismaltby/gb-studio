import React from "react";
import styled, { css } from "styled-components";
import {
  StyledScriptEventPlaceholder,
  StyledScriptEventRenameInput,
  StyledScriptEventRenameInputCompleteButton,
} from "ui/scripting/style";

export const ScriptEventPlaceholder = () => <StyledScriptEventPlaceholder />;

export const ScriptEventRenameInput = (
  props: React.InputHTMLAttributes<HTMLInputElement>
) => <StyledScriptEventRenameInput {...props} />;

export const ScriptEventRenameInputCompleteButton = (
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) => <StyledScriptEventRenameInputCompleteButton {...props} />;

export const ScriptEventHeaderTitle = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: center;
  height: 25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

export const ScriptEventHeaderBreakpointIndicator = styled.div`
  display: flex;
  svg {
    fill: ${(props) => props.theme.colors.highlight};
    max-width: 15px;
    max-height: 15px;
  }
`;

interface ScriptEventHeaderCaretProps {
  open?: boolean;
}

export const ScriptEventHeaderCaret = styled.div<ScriptEventHeaderCaretProps>`
  svg {
    fill: ${(props) => props.theme.colors.scripting.header.text};
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
  isSelected?: boolean;
  isExecuting?: boolean;
  child?: boolean;
  altBg?: boolean;
}

export const ScriptEventHeader = styled.div<ScriptEventHeaderProps>`
  scroll-margin-top: 32px;
  position: relative;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 10px;
  padding-left: 10px;
  height: 25px;
  background: linear-gradient(
    0deg,
    ${(props) => props.theme.colors.scripting.header.backgroundAlt},
    ${(props) => props.theme.colors.scripting.header.background}
  );

  color: ${(props) => props.theme.colors.scripting.header.text};
  line-height: 12px;
  cursor: move;

  &:hover:before {
    content: "⋮";
    position: absolute;
    left: 3px;
    top: 6px;
  }

  ${(props) =>
    props.conditional && props.nestLevel % 4 === 0
      ? css`
          background: linear-gradient(
            0deg,
            ${props.theme.colors.scripting.header.nest1BackgroundAlt},
            ${props.theme.colors.scripting.header.nest1Background}
          );
        `
      : ""}
  ${(props) =>
    props.conditional && props.nestLevel % 4 === 1
      ? css`
          background: linear-gradient(
            0deg,
            ${props.theme.colors.scripting.header.nest2BackgroundAlt},
            ${props.theme.colors.scripting.header.nest2Background}
          );
        `
      : ""}
    ${(props) =>
    props.conditional && props.nestLevel % 4 === 2
      ? css`
          background: linear-gradient(
            0deg,
            ${props.theme.colors.scripting.header.nest3BackgroundAlt},
            ${props.theme.colors.scripting.header.nest3Background}
          );
        `
      : ""}
    ${(props) =>
    props.conditional && props.nestLevel % 4 === 3
      ? css`
          background: linear-gradient(
            0deg,
            ${props.theme.colors.scripting.header.nest4BackgroundAlt},
            ${props.theme.colors.scripting.header.nest4Background}
          );
        `
      : ""}


  ${(props) =>
    props.comment
      ? css`
          &&& {
            background: linear-gradient(
              0deg,
              ${(props) =>
                props.theme.colors.scripting.header.commentBackgroundAlt},
              ${(props) =>
                props.theme.colors.scripting.header.commentBackground}
            );
          }
        `
      : ""}

  ${(props) =>
    props.isSelected
      ? css`
          &&& {
            background: ${(props) => props.theme.colors.highlight};
            color: ${(props) => props.theme.colors.highlightText};

            svg {
              fill: ${(props) => props.theme.colors.highlightText};
            }
          }
        `
      : ""}

  ${(props) =>
    props.isExecuting
      ? css`
          &&& {
            background: ${(props) => props.theme.colors.highlight};
            color: ${(props) => props.theme.colors.highlightText};

            svg {
              fill: ${(props) => props.theme.colors.highlightText};
            }
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

interface ScriptEventBranchHeaderProps {
  conditional: boolean;
  nestLevel: number;
  comment?: boolean;
  child?: boolean;
  altBg?: boolean;
  open?: boolean;
}

export const ScriptEventBranchHeader = styled.div<ScriptEventBranchHeaderProps>`
  position: relative;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 5px;
  padding-left: 8px;
  margin: -15px;

  && {
    margin-right: -5px;
    margin-left: -5px;
    flex-basis: 100%;
    max-width: 100%;
  }

  height: 25px;
  color: ${(props) => props.theme.colors.scripting.header.text};
  line-height: 12px;

  ${(props) =>
    props.conditional && props.nestLevel % 4 === 0
      ? css`
          background: ${props.theme.colors.scripting.branch.nest1Background};
        `
      : ""}
  ${(props) =>
    props.conditional && props.nestLevel % 4 === 1
      ? css`
          background: ${props.theme.colors.scripting.branch.nest2Background};
        `
      : ""}
    ${(props) =>
    props.conditional && props.nestLevel % 4 === 2
      ? css`
          background: ${props.theme.colors.scripting.branch.nest3Background};
        `
      : ""}
    ${(props) =>
    props.conditional && props.nestLevel % 4 === 3
      ? css`
          background: ${props.theme.colors.scripting.branch.nest4Background};
        `
      : ""}


  ${(props) =>
    !props.open
      ? css`
          && {
            margin-bottom: -5px;
          }
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
`;

export const ScriptEventFields = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  padding: 5px;

  & > * {
    flex-grow: 1;
    flex-grow: 1;
    flex-basis: 300px;
    margin: 5px;
    max-width: calc(100% - 10px);
  }
`;

interface ScriptEventFieldProps {
  $halfWidth?: boolean;
  $inline?: boolean;
  $alignBottom?: boolean;
}

export const ScriptEventField = styled.div<ScriptEventFieldProps>`
  ${(props) =>
    props.$halfWidth
      ? css`
          flex-basis: 100px;
        `
      : ""}

  ${(props) =>
    props.$inline
      ? css`
          flex-basis: 0;
          flex-grow: 0;
          margin-left: -2px;
        `
      : ""}

  ${(props) =>
    props.$alignBottom
      ? css`
          align-self: flex-end;
        `
      : ""}
  }

`;

interface ScriptEditorChildrenProps {
  nestLevel: number;
}

export const ScriptEditorChildren = styled.div<ScriptEditorChildrenProps>`
  flex-grow: 1;
  flex-shrink: 0;
  flex-basis: 100%;
  display: flex;
  width: 100%;
  max-width: 100%;
`;

interface ScriptEditorChildrenBorderProps {
  nestLevel: number;
}

export const ScriptEditorChildrenBorder = styled.div<ScriptEditorChildrenBorderProps>`
  border-left: 2px solid #ccc;
  width: 10px;
  border-radius: 10px;
  flex-shrink: 0;

  ${(props) =>
    props.nestLevel % 4 === 0
      ? css`
          border-color: ${props.theme.colors.scripting.children.nest1Border};
        `
      : ""}
  ${(props) =>
    props.nestLevel % 4 === 1
      ? css`
          border-color: ${props.theme.colors.scripting.children.nest2Border};
        `
      : ""}
  ${(props) =>
    props.nestLevel % 4 === 2
      ? css`
          border-color: ${props.theme.colors.scripting.children.nest3Border};
        `
      : ""}
  ${(props) =>
    props.nestLevel % 4 === 3
      ? css`
          border-color: ${props.theme.colors.scripting.children.nest4Border};
        `
      : ""}
`;

export const ScriptEditorChildrenWrapper = styled.div`
  flex-grow: 1;
  border: 1px solid ${(props) => props.theme.colors.sidebar.border};
  border-right: 0px;
  min-width: 0;
  align-self: flex-start;
`;

interface ScriptEditorChildrenLabelProps {
  nestLevel: number;
}

export const ScriptEditorChildrenLabel = styled.span<ScriptEditorChildrenLabelProps>`
  display: inline-block;
  position: sticky;
  top: 35px;
  left: 0px;
  padding: 10px 0px;
  font-size: 8px;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  writing-mode: vertical-rl;
  transform: rotate(180deg) translate(50%, 0);

  > span {
    display: inline-block;
    background: ${(props) => props.theme.colors.scripting.form.background};
    padding: 5px 0px;
    position: relative;
    left: -1px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  ${(props) =>
    props.nestLevel % 4 === 0
      ? css`
          color: ${props.theme.colors.scripting.children.nest1Text};
        `
      : ""}
  ${(props) =>
    props.nestLevel % 4 === 1
      ? css`
          color: ${props.theme.colors.scripting.children.nest2Text};
        `
      : ""}
           ${(props) =>
    props.nestLevel % 4 === 2
      ? css`
          color: ${props.theme.colors.scripting.children.nest3Text};
        `
      : ""}
               ${(props) =>
    props.nestLevel % 4 === 3
      ? css`
          color: ${props.theme.colors.scripting.children.nest4Text};
        `
      : ""}
`;

interface ScriptEventWrapperProps {
  conditional: boolean;
  nestLevel: number;
  altBg?: boolean;
}

export const ScriptEventWrapper = styled.div<ScriptEventWrapperProps>`
  background-color: ${(props) => props.theme.colors.scripting.form.background};
  color: ${(props) => props.theme.colors.text};
`;

interface ScriptEventFieldGroupProps {
  $halfWidth?: boolean;
  $wrapItems?: boolean;
  $alignBottom?: boolean;
}

export const ScriptEventFieldGroupWrapper = styled.div<ScriptEventFieldGroupProps>`
  ${(props) =>
    props.$halfWidth
      ? css`
          flex-basis: 100px;
        `
      : ""}
  ${(props) =>
    props.$alignBottom
      ? css`
          align-self: flex-end;
        `
      : ""}      
  & > div {
    margin: -10px;
    ${(props) =>
      !props.$wrapItems
        ? css`
            flex-wrap: nowrap;
          `
        : ""}
  }
`;

export const ScriptEventWarning = styled.div`
  background: #ffc107;
  color: #000;
  padding: 10px;
  font-size: 11px;
`;

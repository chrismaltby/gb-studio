import styled, { css } from "styled-components";
import { StyledButton } from "ui/buttons/style";
import { IMEUnstyledInput } from "ui/form/IMEInput";
import { Label } from "ui/form/Label";
import { StyledFormField, StyledFormFieldInput } from "ui/form/layout/style";
import { StyledInput } from "ui/form/style";

// #region ScriptEventPlaceholder

export const StyledScriptEventPlaceholder = styled.div`
  background: ${(props) => props.theme.colors.scripting.placeholder.background};
  height: 25px;
`;

// #endregion ScriptEventPlaceholder

// #region ScriptEventRenameInput

export const StyledScriptEventRenameInput = styled(IMEUnstyledInput)`
  background: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  font-size: 11px;
  flex-grow: 1;
  border: 0;
  border-radius: 4px;
  padding: 5px;
  margin-left: -5px;
  font-weight: bold;
  margin-right: -18px;
`;

export const StyledScriptEventRenameInputCompleteButton = styled.button`
  z-index: 10000;
  position: relative;
  top: 0px;
  left: -4px;
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

  &:hover {
    background: rgba(128, 128, 128, 0.3);
  }
  &:active {
    background: rgba(128, 128, 128, 0.4);
  }
  svg {
    width: 12px;
    height: 12px;
    fill: ${(props) => props.theme.colors.input.text};
  }
`;

// #endregion ScriptEventRenameInput

// #region ScriptEventHeaderTitle

export const StyledScriptEventHeaderTitle = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: center;
  height: 25px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
`;

// #endregion ScriptEventHeaderTitle

// #region ScriptEventHeaderBreakpointIndicator

export const StyledScriptEventHeaderBreakpointIndicator = styled.div`
  display: flex;
  svg {
    fill: ${(props) => props.theme.colors.highlight};
    max-width: 15px;
    max-height: 15px;
  }
`;

// #endregion ScriptEventHeaderBreakpointIndicator

// #region ScriptEventWarning

export const StyledScriptEventWarning = styled.div`
  background: #ffc107;
  color: #000;
  padding: 10px;
  font-size: 11px;
`;

// #endregion ScriptEventWarning

// #region ScriptEventHeader

interface StyledScriptEventHeaderProps {
  $nestLevel: number;
  $isConditional?: boolean;
  $isComment?: boolean;
  $isSelected?: boolean;
  $isExecuting?: boolean;
  $altBg?: boolean;
  $isMoveable?: boolean;
}

export const StyledScriptEventHeader = styled.div<StyledScriptEventHeaderProps>`
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
  background: ${(props) => props.theme.colors.scripting.header.background};
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
    props.$isConditional && props.$nestLevel % 4 === 0
      ? css`
          background: ${props.theme.colors.scripting.header.nest1Background};
        `
      : ""}
  ${(props) =>
    props.$isConditional && props.$nestLevel % 4 === 1
      ? css`
          background: ${props.theme.colors.scripting.header.nest2Background};
        `
      : ""}
    ${(props) =>
    props.$isConditional && props.$nestLevel % 4 === 2
      ? css`
          background: ${props.theme.colors.scripting.header.nest3Background};
        `
      : ""}
    ${(props) =>
    props.$isConditional && props.$nestLevel % 4 === 3
      ? css`
          background: ${props.theme.colors.scripting.header.nest4Background};
        `
      : ""}

  ${(props) =>
    props.$isComment
      ? css`
          &&& {
            background: ${(props) =>
              props.theme.colors.scripting.header.commentBackground};
          }
        `
      : ""}

  ${(props) =>
    props.$isSelected
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
    props.$isExecuting
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
    !props.$isMoveable
      ? css`
          cursor: not-allowed;
        `
      : ""}
`;

interface StyledScriptEventHeaderCaretProps {
  $isOpen?: boolean;
}

export const StyledScriptEventHeaderCaret = styled.div<StyledScriptEventHeaderCaretProps>`
  svg {
    fill: ${(props) => props.theme.colors.scripting.header.text};
    width: 8px;
    height: 8px;
    flex-shrink: 0;
    transform: rotate(${(props) => (props.$isOpen ? 90 : 0)}deg);
  }
`;

// #endregion ScriptEventHeader

// #region ScriptEventFormWrapper

export const StyledScriptEventFormWrapper = styled.div`
  position: relative;
`;

// #endregion ScriptEventFormWrapper

// #region ScriptEventFields

export const StyledScriptEventFields = styled.div`
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

// #endregion ScriptEventFields

// #region ScriptEventWrapper

export const StyledScriptEventWrapper = styled.div`
  background-color: ${(props) => props.theme.colors.scripting.form.background};
  color: ${(props) => props.theme.colors.text};
`;

// #endregion ScriptEventWrapper

// #region ScriptEditorChildren

export const StyledScriptEditorChildren = styled.div`
  flex-grow: 1;
  flex-shrink: 0;
  flex-basis: 100%;
  display: flex;
  width: 100%;
  max-width: 100%;
`;

interface StyledScriptEditorChildrenBorderProps {
  $nestLevel: number;
}

export const StyledScriptEditorChildrenBorder = styled.div<StyledScriptEditorChildrenBorderProps>`
  border-left: 2px solid #ccc;
  width: 10px;
  border-radius: 10px;
  flex-shrink: 0;

  ${(props) =>
    props.$nestLevel % 4 === 0
      ? css`
          border-color: ${props.theme.colors.scripting.children.nest1Border};
        `
      : ""}
  ${(props) =>
    props.$nestLevel % 4 === 1
      ? css`
          border-color: ${props.theme.colors.scripting.children.nest2Border};
        `
      : ""}
  ${(props) =>
    props.$nestLevel % 4 === 2
      ? css`
          border-color: ${props.theme.colors.scripting.children.nest3Border};
        `
      : ""}
  ${(props) =>
    props.$nestLevel % 4 === 3
      ? css`
          border-color: ${props.theme.colors.scripting.children.nest4Border};
        `
      : ""}
`;

interface StyledScriptEditorChildrenLabelProps {
  $nestLevel: number;
}

export const StyledScriptEditorChildrenLabel = styled.span<StyledScriptEditorChildrenLabelProps>`
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
    props.$nestLevel % 4 === 0
      ? css`
          color: ${props.theme.colors.scripting.children.nest1Text};
        `
      : ""}
  ${(props) =>
    props.$nestLevel % 4 === 1
      ? css`
          color: ${props.theme.colors.scripting.children.nest2Text};
        `
      : ""}
           ${(props) =>
    props.$nestLevel % 4 === 2
      ? css`
          color: ${props.theme.colors.scripting.children.nest3Text};
        `
      : ""}
               ${(props) =>
    props.$nestLevel % 4 === 3
      ? css`
          color: ${props.theme.colors.scripting.children.nest4Text};
        `
      : ""}
`;

export const StyledScriptEditorChildrenWrapper = styled.div`
  flex-grow: 1;
  border: 1px solid ${(props) => props.theme.colors.sidebar.border};
  border-right: 0px;
  min-width: 0;
  align-self: flex-start;
`;

// #endregion ScriptEditorChildren

// #region ScriptEventFieldGroup

interface StyledScriptEventFieldGroupProps {
  $halfWidth?: boolean;
  $wrapItems?: boolean;
  $alignBottom?: boolean;
}

export const StyledScriptEventFieldGroup = styled.div<StyledScriptEventFieldGroupProps>`
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

// #endregion ScriptEventFieldGroup

// #region ScriptEventField

interface StyledScriptEventFieldProps {
  $halfWidth?: boolean;
  $inline?: boolean;
  $alignBottom?: boolean;
}

export const StyledScriptEventField = styled.div<StyledScriptEventFieldProps>`
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

// #endregion ScriptEventField

// #region ScriptEventBranchHeader

interface StyledScriptEventBranchHeaderProps {
  $nestLevel: number;
  $altBg?: boolean;
  $isOpen?: boolean;
}

export const StyledScriptEventBranchHeader = styled.div<StyledScriptEventBranchHeaderProps>`
  position: relative;
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 5px;
  padding-left: 8px;
  margin-bottom: 5px;

  && {
    margin-right: -5px;
    margin-left: -5px;
    flex-basis: 100%;
    max-width: 100%;
  }

  min-height: 25px;
  color: ${(props) => props.theme.colors.scripting.header.text};
  line-height: 12px;

  border-bottom: 1px solid
    ${(props) => props.theme.colors.scripting.form.background};

  ${(props) =>
    props.$nestLevel % 4 === 0
      ? css`
          background: ${props.theme.colors.scripting.branch.nest1Background};
        `
      : ""}
  ${(props) =>
    props.$nestLevel % 4 === 1
      ? css`
          background: ${props.theme.colors.scripting.branch.nest2Background};
        `
      : ""}
    ${(props) =>
    props.$nestLevel % 4 === 2
      ? css`
          background: ${props.theme.colors.scripting.branch.nest3Background};
        `
      : ""}
    ${(props) =>
    props.$nestLevel % 4 === 3
      ? css`
          background: ${props.theme.colors.scripting.branch.nest4Background};
        `
      : ""}


  ${(props) =>
    !props.$isOpen
      ? css`
          && {
            margin-bottom: -5px;
          }
        `
      : ""}

  ${StyledScriptEventFields} {
    padding: 0;
    width: 100%;
    & > * {
      margin: 2px 0;
    }
  }

  ${StyledFormField} {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;

    ${Label} {
      margin-bottom: 0;
      margin-right: 10px;
    }
    ${StyledFormFieldInput} {
      width: 100%;
      max-width: 200px;

      .CustomSelect__control {
        height: 22px;
        min-height: 22px;
        font-weight: normal;
      }

      ${StyledInput} {
        height: 22px;
      }

      ${StyledButton} {
        height: 22px;
      }
    }
  }
`;

export const StyledScriptEventBranchHeaderFields = styled.div`
  width: 100%;
  max-width: 200px;
`;

// #endregion ScriptEventBranchHeader

import styled, { css } from "styled-components";
import { IMEUnstyledInput } from "ui/form/IMEInput";

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
    props.$isConditional && props.$nestLevel % 4 === 0
      ? css`
          background: linear-gradient(
            0deg,
            ${props.theme.colors.scripting.header.nest1BackgroundAlt},
            ${props.theme.colors.scripting.header.nest1Background}
          );
        `
      : ""}
  ${(props) =>
    props.$isConditional && props.$nestLevel % 4 === 1
      ? css`
          background: linear-gradient(
            0deg,
            ${props.theme.colors.scripting.header.nest2BackgroundAlt},
            ${props.theme.colors.scripting.header.nest2Background}
          );
        `
      : ""}
    ${(props) =>
    props.$isConditional && props.$nestLevel % 4 === 2
      ? css`
          background: linear-gradient(
            0deg,
            ${props.theme.colors.scripting.header.nest3BackgroundAlt},
            ${props.theme.colors.scripting.header.nest3Background}
          );
        `
      : ""}
    ${(props) =>
    props.$isConditional && props.$nestLevel % 4 === 3
      ? css`
          background: linear-gradient(
            0deg,
            ${props.theme.colors.scripting.header.nest4BackgroundAlt},
            ${props.theme.colors.scripting.header.nest4Background}
          );
        `
      : ""}

  ${(props) =>
    props.$isComment
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
`;

// #endregion ScriptEventBranchHeader

// #region ScriptEventFormWrapper

export const StyledScriptEventFormWrapper = styled.div`
  position: relative;
`;

// #endregion ScriptEventForm

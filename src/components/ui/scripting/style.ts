import styled from "styled-components";
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

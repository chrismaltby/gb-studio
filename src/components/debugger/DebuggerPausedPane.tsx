import React from "react";
import l10n from "shared/lib/lang/l10n";
import { useAppSelector } from "store/hooks";
import styled from "styled-components";
import { InfoIcon } from "ui/icons/Icons";

const PausedMessage = styled.div`
  display: flex;
  flex-shrink: 0;
  padding: 0 5px;
  height: 31px;
  box-sizing: border-box;
  align-items: center;
  font-weight: bold;
  background: ${(props) => props.theme.colors.highlight};
  color: ${(props) => props.theme.colors.highlightText};

  svg {
    width: 15px;
    margin-right: 3px;
    fill: ${(props) => props.theme.colors.highlightText};
  }
`;

const DebuggerPausedPane = () => {
  const isPaused = useAppSelector((state) => state.debug.isPaused);

  if (!isPaused) {
    return null;
  }

  return (
    <PausedMessage>
      <InfoIcon /> {l10n("FIELD_DEBUGGER_PAUSED")}
    </PausedMessage>
  );
};

export default DebuggerPausedPane;

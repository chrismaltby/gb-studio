import React, { useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { scriptEventSelectors } from "store/features/entities/entitiesState";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import settingsActions from "store/features/settings/settingsActions";
import { BreakpointData } from "store/features/settings/settingsState";
import DebuggerScriptCtxBreadcrumb from "components/debugger/DebuggerScriptCtxBreadcrumb";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import { BreakpointIcon, CloseIcon } from "ui/icons/Icons";
import useHover from "ui/hooks/use-hover";

interface DebuggerBreakpointItemProps {
  breakpoint: BreakpointData;
}

const Wrapper = styled.div`
  display: flex;
  padding: 5px 10px;
  padding-left: 7px;

  font-size: 11px;
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
  background: ${(props) => props.theme.colors.scripting.form.background};
  display: flex;
  align-items: center;

  ${Button} {
    margin-right: 3px;
    svg {
      width: 15px;
      height: 15px;
      min-width: 15px;
      min-height: 15px;
      opacity: 0.3;
    }
  }

  :hover ${Button} {
    svg {
      opacity: 1;
      width: 10px;
      height: 10px;
      min-width: 10px;
      min-height: 10px;
    }
  }
`;

const BreakpointLabel = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const BreakpointName = styled.div`
  font-weight: bold;
`;

const BreakpointPath = styled.div``;

const DebuggerBreakpointItem = ({
  breakpoint,
}: DebuggerBreakpointItemProps) => {
  const dispatch = useAppDispatch();
  const ref = useRef<HTMLDivElement>(null);
  const isHovered = useHover(ref);
  const scriptEventId = breakpoint.scriptEventId;

  const scriptEvent = useAppSelector((state) =>
    scriptEventSelectors.selectById(state, scriptEventId)
  );
  const scriptEventDefs = useAppSelector((state) =>
    selectScriptEventDefs(state)
  );
  const command = scriptEvent?.command ?? "";
  const localisedCommand = l10n(command as L10NKey);
  const eventName =
    localisedCommand !== command
      ? localisedCommand
      : (scriptEventDefs[command] && scriptEventDefs[command]?.name) || command;

  const onToggle = useCallback(() => {
    dispatch(settingsActions.toggleBreakpoint(breakpoint));
  }, [breakpoint, dispatch]);

  return (
    <Wrapper ref={ref}>
      <Button variant="transparent" size="small" onClick={onToggle}>
        {isHovered ? <CloseIcon /> : <BreakpointIcon />}
      </Button>
      <BreakpointLabel>
        <BreakpointName>{eventName}</BreakpointName>
        <BreakpointPath>
          <DebuggerScriptCtxBreadcrumb context={breakpoint.context} />
        </BreakpointPath>
      </BreakpointLabel>
    </Wrapper>
  );
};

export default DebuggerBreakpointItem;

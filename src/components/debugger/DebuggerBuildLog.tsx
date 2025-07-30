import React, { useCallback, useEffect, useRef } from "react";
import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";
import l10n from "shared/lib/lang/l10n";
import consoleActions from "store/features/console/consoleActions";
import buildGameActions from "store/features/buildGame/buildGameActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import { CheckIcon, BlankIcon } from "ui/icons/Icons";
import {
  SettingsState,
  getSettings,
} from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import DebuggerUsageData from "components/debugger/DebuggerUsageData";
import { ConsistentWidthLabel } from "ui/util/ConsistentWidthLabel";
import useDimensions from "react-cool-dimensions";
import editorActions from "store/features/editor/editorActions";
import { ConsoleLink } from "store/features/console/consoleState";
import { StyledButton } from "ui/buttons/style";
import { ResourceLinkedText } from "ui/links/ResourceLinkedText";

const PIN_TO_BOTTOM_RANGE = 100;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: auto;
  font-size: 11px;
`;

const Terminal = styled.div`
  flex-grow: 1;
  background: #111;
  color: #fff;
  padding: 10px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  overflow: auto;
  user-select: text;
`;

const ButtonToolbar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px;

  ${StyledButton} {
    height: 24px;
    line-height: 24px;
  }

  > * ~ * {
    margin-left: 10px;
  }
`;

const UsageWrapper = styled.div`
  display: flex;
  flex-grow: 1;
  justify-content: center;
  align-items: center;
`;

interface LogLineProps {
  $type: "log" | "warn";
}

const LogLine = styled.div<LogLineProps>`
  color: white;
  ${(props) =>
    props.$type === "warn"
      ? css`
          color: orange;
        `
      : ""};
`;

const LogLink = styled.a`
  cursor: pointer;
`;

interface BuildLogLineProps {
  text: string;
  link?: ConsoleLink;
  type: "log" | "warn";
}

const BuildLogLine = ({ text, type, link }: BuildLogLineProps) => {
  const dispatch = useAppDispatch();
  return (
    <LogLine $type={type}>
      <ResourceLinkedText text={text} />
      {link && (
        <LogLink
          onClick={() => {
            if (link.type === "customEvent") {
              dispatch(
                editorActions.selectCustomEvent({
                  customEventId: link.entityId,
                }),
              );
            } else if (link.type === "actor") {
              dispatch(
                editorActions.selectActor({
                  actorId: link.entityId,
                  sceneId: link.sceneId,
                }),
              );
            } else if (link.type === "trigger") {
              dispatch(
                editorActions.selectTrigger({
                  triggerId: link.entityId,
                  sceneId: link.sceneId,
                }),
              );
            } else if (link.type === "scene") {
              dispatch(
                editorActions.selectScene({
                  sceneId: link.sceneId,
                }),
              );
            }
          }}
        >
          ➡️ <u>{link.linkText}</u>
        </LogLink>
      )}
    </LogLine>
  );
};

const DebuggerBuildLog = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const output = useAppSelector((state) => state.console.output);
  const warnings = useAppSelector((state) => state.console.warnings);
  const status = useAppSelector((state) => state.console.status);
  const openBuildLogOnWarnings = useAppSelector(
    (state) => getSettings(state).openBuildLogOnWarnings,
  );
  const generateDebugFilesEnabled = useAppSelector(
    (state) => getSettings(state).generateDebugFilesEnabled,
  );

  const { currentBreakpoint: usageBreakpoint, observe } = useDimensions({
    breakpoints: { SM: 0, MD: 50, LG: 280 },
    updateOnBreakpointChange: true,
  });

  // Only show the latest 500 lines during build
  // show full output on complete
  const outputLines = status === "complete" ? output : output.slice(-500);

  const onDeleteCache = useCallback(() => {
    dispatch(buildGameActions.deleteBuildCache());
  }, [dispatch]);

  const onRun = useCallback(() => {
    dispatch(buildGameActions.buildGame());
  }, [dispatch]);

  const onClear = useCallback(() => {
    dispatch(consoleActions.clearConsole());
  }, [dispatch]);

  useEffect(() => {
    // Pin scroll to bottom of console as new lines arrive if currently near bottom of scroll anyway
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      if (
        scrollEl.scrollTop >
        scrollEl.scrollHeight - scrollEl.clientHeight - PIN_TO_BOTTOM_RANGE
      ) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
      }
    }
  }, [output]);

  useEffect(() => {
    // Pin scroll to bottom of console on initial load
    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, []);

  const onChangeSettingProp = useCallback(
    <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
      dispatch(
        settingsActions.editSettings({
          [key]: value,
        }),
      );
    },
    [dispatch],
  );

  const onToggleOpenBuildLogOnWarnings = useCallback(
    () =>
      onChangeSettingProp("openBuildLogOnWarnings", !openBuildLogOnWarnings),
    [onChangeSettingProp, openBuildLogOnWarnings],
  );

  const onToggleGenerateDebugFilesEnabled = useCallback(
    () =>
      onChangeSettingProp(
        "generateDebugFilesEnabled",
        !generateDebugFilesEnabled,
      ),
    [onChangeSettingProp, generateDebugFilesEnabled],
  );

  return (
    <Wrapper>
      <Terminal ref={scrollRef}>
        {outputLines.map((out, index) => (
          <BuildLogLine
            key={index}
            text={out.text}
            type={out.type === "err" ? "warn" : "log"}
            link={out.link}
          />
        ))}
        {status === "cancelled" && (
          <div style={{ color: "orange" }}>{l10n("BUILD_CANCELLING")}...</div>
        )}
        {status === "complete" && warnings.length > 0 && (
          <div>
            <br />
            Warnings:
            {warnings.map((out, index) => (
              <BuildLogLine
                key={index}
                type="warn"
                text={out.text}
                link={out.link}
              />
            ))}
          </div>
        )}
      </Terminal>
      <ButtonToolbar>
        <Button
          onClick={status !== "cancelled" ? onRun : undefined}
          disabled={status === "cancelled"}
        >
          <ConsistentWidthLabel
            label={
              status === "running" || status === "cancelled"
                ? l10n("BUILD_CANCEL")
                : l10n("BUILD_RUN")
            }
            possibleValues={[l10n("BUILD_CANCEL"), l10n("BUILD_RUN")]}
          />
        </Button>
        <DropdownButton label={l10n("SETTINGS_BUILD")} openUpwards>
          <MenuItem
            onClick={onToggleOpenBuildLogOnWarnings}
            icon={openBuildLogOnWarnings ? <CheckIcon /> : <BlankIcon />}
          >
            {l10n("FIELD_OPEN_BUILD_LOG_ON_WARNINGS")}
          </MenuItem>
          <MenuItem
            onClick={onToggleGenerateDebugFilesEnabled}
            icon={generateDebugFilesEnabled ? <CheckIcon /> : <BlankIcon />}
          >
            {l10n("FIELD_GENERATE_DEBUG_FILES")}
          </MenuItem>
          <MenuDivider />
          <MenuItem onClick={onDeleteCache} icon={<BlankIcon />}>
            {l10n("BUILD_EMPTY_BUILD_CACHE")}
          </MenuItem>
        </DropdownButton>
        <UsageWrapper ref={observe}>
          <DebuggerUsageData
            hideLabels={usageBreakpoint !== "LG"}
            forceZoom={usageBreakpoint === "SM"}
          ></DebuggerUsageData>
        </UsageWrapper>
        <Button onClick={onClear}>{l10n("BUILD_CLEAR")}</Button>
      </ButtonToolbar>
    </Wrapper>
  );
};

export default DebuggerBuildLog;

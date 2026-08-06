import React, { useCallback, useLayoutEffect, useRef } from "react";
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
import DebuggerMemoryUsageData from "components/debugger/DebuggerMemoryUsageData";
import { ConsistentWidthLabel } from "ui/util/ConsistentWidthLabel";
import useDimensions from "react-cool-dimensions";
import editorActions from "store/features/editor/editorActions";
import { ConsoleLink } from "store/features/console/consoleState";
import { StyledButton } from "ui/buttons/style";
import { ResourceLinkedText } from "ui/links/ResourceLinkedText";

const PIN_TO_BOTTOM_RANGE = 100;

const isNearBottom = (el: HTMLDivElement) =>
  el.scrollTop >= el.scrollHeight - el.clientHeight - PIN_TO_BOTTOM_RANGE;

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
  gap: 10px;
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
  const shouldPinToBottomRef = useRef(true);

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
  const openBuildFolderOnExport = useAppSelector(
    (state) => getSettings(state).openBuildFolderOnExport,
  );
  const showRomUsageAfterBuild = useAppSelector(
    (state) => getSettings(state).showRomUsageAfterBuild,
  );
  const showWramUsageAfterBuild = useAppSelector(
    (state) => getSettings(state).showWramUsageAfterBuild,
  );
  const showBank0UsageAfterBuild = useAppSelector(
    (state) => getSettings(state).showBank0UsageAfterBuild,
  );
  const logPluginUsageAfterBuild = useAppSelector(
    (state) => getSettings(state).logPluginUsageAfterBuild,
  );

  // Usage bars share the available space, so scale the breakpoints
  // by how many of them are currently visible
  const visibleUsageBars = Math.max(
    1,
    Number(showRomUsageAfterBuild) +
      Number(showBank0UsageAfterBuild) +
      Number(showWramUsageAfterBuild),
  );

  const { currentBreakpoint: usageBreakpoint, observe } = useDimensions({
    breakpoints: {
      SM: 0,
      MD: 50 * visibleUsageBars,
      LG: 280 * visibleUsageBars,
    },
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
  const onToggleOpenBuildFolderOnExport = useCallback(
    () =>
      onChangeSettingProp("openBuildFolderOnExport", !openBuildFolderOnExport),
    [onChangeSettingProp, openBuildFolderOnExport],
  );
  const onToggleShowRomUsageAfterBuild = useCallback(
    () =>
      onChangeSettingProp("showRomUsageAfterBuild", !showRomUsageAfterBuild),
    [onChangeSettingProp, showRomUsageAfterBuild],
  );
  const onToggleShowBank0UsageAfterBuild = useCallback(
    () =>
      onChangeSettingProp(
        "showBank0UsageAfterBuild",
        !showBank0UsageAfterBuild,
      ),
    [onChangeSettingProp, showBank0UsageAfterBuild],
  );
  const onToggleShowWramUsageAfterBuild = useCallback(
    () =>
      onChangeSettingProp("showWramUsageAfterBuild", !showWramUsageAfterBuild),
    [onChangeSettingProp, showWramUsageAfterBuild],
  );
  const onToggleLogPluginUsageAfterBuild = useCallback(
    () =>
      onChangeSettingProp(
        "logPluginUsageAfterBuild",
        !logPluginUsageAfterBuild,
      ),
    [onChangeSettingProp, logPluginUsageAfterBuild],
  );

  const onScroll = useCallback(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return;
    }
    shouldPinToBottomRef.current = isNearBottom(scrollEl);
  }, []);

  useLayoutEffect(() => {
    // Pin scroll to bottom of console as new lines arrive if currently near bottom of scroll anyway
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return;
    }

    if (shouldPinToBottomRef.current) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  }, [outputLines.length, warnings.length, status]);

  useLayoutEffect(() => {
    // Pin scroll to bottom of console on initial load
    const scrollEl = scrollRef.current;
    if (!scrollEl) {
      return;
    }

    scrollEl.scrollTop = scrollEl.scrollHeight;
    shouldPinToBottomRef.current = true;
  }, []);

  return (
    <Wrapper>
      <Terminal ref={scrollRef} onScroll={onScroll}>
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
          <MenuItem
            onClick={onToggleOpenBuildFolderOnExport}
            icon={openBuildFolderOnExport ? <CheckIcon /> : <BlankIcon />}
          >
            {l10n("FIELD_OPEN_BUILD_FOLDER_ON_EXPORT")}
          </MenuItem>
          <MenuItem
            onClick={onToggleShowRomUsageAfterBuild}
            icon={showRomUsageAfterBuild ? <CheckIcon /> : <BlankIcon />}
          >
            {l10n("FIELD_SHOW_ROM_USAGE_AFTER_BUILD")}
          </MenuItem>
          <MenuItem
            onClick={onToggleShowBank0UsageAfterBuild}
            icon={showBank0UsageAfterBuild ? <CheckIcon /> : <BlankIcon />}
          >
            {l10n("FIELD_SHOW_BANK_0_USAGE_AFTER_BUILD")}
          </MenuItem>
          <MenuItem
            onClick={onToggleShowWramUsageAfterBuild}
            icon={showWramUsageAfterBuild ? <CheckIcon /> : <BlankIcon />}
          >
            {l10n("FIELD_SHOW_WRAM_USAGE_AFTER_BUILD")}
          </MenuItem>
          <MenuItem
            onClick={onToggleLogPluginUsageAfterBuild}
            icon={logPluginUsageAfterBuild ? <CheckIcon /> : <BlankIcon />}
          >
            {l10n("FIELD_LOG_PLUGIN_USAGE_AFTER_BUILD")}
          </MenuItem>

          <MenuDivider />
          <MenuItem onClick={onDeleteCache} icon={<BlankIcon />}>
            {l10n("BUILD_EMPTY_BUILD_CACHE")}
          </MenuItem>
        </DropdownButton>
        <UsageWrapper ref={observe}>
          {showRomUsageAfterBuild && (
            <DebuggerUsageData
              hideLabels={usageBreakpoint !== "LG"}
              forceZoom={usageBreakpoint === "SM"}
            ></DebuggerUsageData>
          )}
          {showBank0UsageAfterBuild && (
            <DebuggerMemoryUsageData
              region="bank0"
              hideLabels={usageBreakpoint !== "LG"}
              showPlaceholder={!showRomUsageAfterBuild}
            ></DebuggerMemoryUsageData>
          )}
          {showWramUsageAfterBuild && (
            <DebuggerMemoryUsageData
              region="wram"
              hideLabels={usageBreakpoint !== "LG"}
              showPlaceholder={
                !showRomUsageAfterBuild && !showBank0UsageAfterBuild
              }
            ></DebuggerMemoryUsageData>
          )}
        </UsageWrapper>
        <Button onClick={onClear}>{l10n("BUILD_CLEAR")}</Button>
      </ButtonToolbar>
    </Wrapper>
  );
};

export default DebuggerBuildLog;

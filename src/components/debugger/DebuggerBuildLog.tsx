import React, { useCallback, useEffect, useRef } from "react";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import l10n from "shared/lib/lang/l10n";
import consoleActions from "store/features/console/consoleActions";
import buildGameActions from "store/features/buildGame/buildGameActions";
import { FlexGrow } from "ui/spacing/Spacing";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuDivider, MenuItem, MenuItemIcon } from "ui/menu/Menu";
import { CheckIcon, BlankIcon } from "ui/icons/Icons";
import {
  SettingsState,
  getSettings,
} from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";

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

  ${Button} {
    height: 24px;
    line-height: 24px;
  }

  > * ~ * {
    margin-left: 10px;
  }
`;

const DebuggerBuildLog = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dispatch = useAppDispatch();

  const output = useAppSelector((state) => state.console.output);
  const warnings = useAppSelector((state) => state.console.warnings);
  const status = useAppSelector((state) => state.console.status);
  const openBuildLogOnWarnings = useAppSelector(
    (state) => getSettings(state).openBuildLogOnWarnings
  );
  const generateDebugFilesEnabled = useAppSelector(
    (state) => getSettings(state).generateDebugFilesEnabled
  );

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
        })
      );
    },
    [dispatch]
  );

  const onToggleOpenBuildLogOnWarnings = useCallback(
    () =>
      onChangeSettingProp("openBuildLogOnWarnings", !openBuildLogOnWarnings),
    [onChangeSettingProp, openBuildLogOnWarnings]
  );

  const onToggleGenerateDebugFilesEnabled = useCallback(
    () =>
      onChangeSettingProp(
        "generateDebugFilesEnabled",
        !generateDebugFilesEnabled
      ),
    [onChangeSettingProp, generateDebugFilesEnabled]
  );

  return (
    <Wrapper>
      <Terminal ref={scrollRef}>
        {outputLines.map((out, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            style={{ color: out.type === "err" ? "orange" : "white" }}
          >
            {out.text}
          </div>
        ))}
        {status === "cancelled" && (
          <div style={{ color: "orange" }}>{l10n("BUILD_CANCELLING")}...</div>
        )}
        {status === "complete" && warnings.length > 0 && (
          <div>
            <br />
            Warnings:
            {warnings.map((out, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} style={{ color: "orange" }}>
                - {out.text}
              </div>
            ))}
          </div>
        )}
      </Terminal>
      <ButtonToolbar>
        {status === "running" ? (
          <Button onClick={onRun}>{l10n("BUILD_CANCEL")}</Button>
        ) : (
          <Button onClick={onRun}>{l10n("BUILD_RUN")}</Button>
        )}
        <DropdownButton label={l10n("SETTINGS_BUILD")} openUpwards>
          <MenuItem onClick={onToggleOpenBuildLogOnWarnings}>
            <MenuItemIcon>
              {openBuildLogOnWarnings ? <CheckIcon /> : <BlankIcon />}
            </MenuItemIcon>
            {l10n("FIELD_OPEN_BUILD_LOG_ON_WARNINGS")}
          </MenuItem>
          <MenuItem onClick={onToggleGenerateDebugFilesEnabled}>
            <MenuItemIcon>
              {generateDebugFilesEnabled ? <CheckIcon /> : <BlankIcon />}
            </MenuItemIcon>
            {l10n("FIELD_GENERATE_DEBUG_FILES")}
          </MenuItem>
          <MenuDivider />
          <MenuItem onClick={onDeleteCache}>
            <MenuItemIcon>
              <BlankIcon />
            </MenuItemIcon>
            {l10n("BUILD_EMPTY_BUILD_CACHE")}
          </MenuItem>
        </DropdownButton>
        <FlexGrow />
        <Button onClick={onClear}>{l10n("BUILD_CLEAR")}</Button>
      </ButtonToolbar>
    </Wrapper>
  );
};

export default DebuggerBuildLog;

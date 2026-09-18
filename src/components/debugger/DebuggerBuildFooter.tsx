import React, { useCallback } from "react";
import styled from "styled-components";
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
import { ConsistentWidthLabel } from "ui/util/ConsistentWidthLabel";
import { StyledButton } from "ui/buttons/style";

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

interface DebuggerBuildFooterProps {
  showClear?: boolean;
}

export const DebuggerBuildFooter = ({
  showClear,
}: DebuggerBuildFooterProps) => {
  const dispatch = useAppDispatch();

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

  return (
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
        <MenuDivider />
        <MenuItem onClick={onDeleteCache} icon={<BlankIcon />}>
          {l10n("BUILD_EMPTY_BUILD_CACHE")}
        </MenuItem>
      </DropdownButton>
      <div style={{ flexGrow: 1 }} />
      {showClear && <Button onClick={onClear}>{l10n("BUILD_CLEAR")}</Button>}
    </ButtonToolbar>
  );
};

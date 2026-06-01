import React, { useCallback, useState } from "react";
import l10n from "shared/lib/lang/l10n";
import {
  castEventToBool,
  castEventToString,
} from "renderer/lib/helpers/castEventValue";
import { Button } from "ui/buttons/Button";
import settingsActions from "store/features/settings/settingsActions";
import { Checkbox } from "ui/form/Checkbox";
import { Input } from "ui/form/Input";
import { CardAnchor, CardButtons, CardHeading } from "ui/cards/Card";
import { SearchableSettingRow } from "ui/form/SearchableSettingRow";
import { SettingRowInput, SettingRowLabel } from "ui/form/SettingRow";
import { SearchableCard } from "ui/cards/SearchableCard";
import { FlexRow } from "ui/spacing/Spacing";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { CompilerPresetSelect } from "components/forms/CompilerPresetSelect";
import stripInvalidFilenameCharacters from "shared/lib/helpers/stripInvalidFilenameCharacters";
import { getROMFilename } from "shared/lib/helpers/filePaths";

interface SettingsSectionBuildProps {
  searchTerm: string;
}

export const SettingsSectionBuild = ({
  searchTerm,
}: SettingsSectionBuildProps) => {
  const dispatch = useAppDispatch();

  const projectName = useAppSelector(
    (state) => state.project.present.metadata.name,
  );
  const colorMode = useAppSelector(
    (state) => state.project.present.settings.colorMode,
  );
  const openBuildLogOnWarnings = useAppSelector(
    (state) => state.project.present.settings.openBuildLogOnWarnings,
  );
  const generateDebugFilesEnabled = useAppSelector(
    (state) => state.project.present.settings.generateDebugFilesEnabled,
  );
  const openBuildFolderOnExport = useAppSelector(
    (state) => state.project.present.settings.openBuildFolderOnExport,
  );
  const showRomUsageAfterBuild = useAppSelector(
    (state) => state.project.present.settings.showRomUsageAfterBuild,
  );
  const compilerPreset = useAppSelector(
    (state) => state.project.present.settings.compilerPreset,
  );
  const romFilename = useAppSelector(
    (state) => state.project.present.settings.romFilename,
  );
  const [currentRomFilename, setCurrentRomFilename] = useState(romFilename);

  const defaultRomFilename = getROMFilename(
    "",
    projectName,
    colorMode === "color",
    "rom",
  );

  const onChangeROMFilename = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = castEventToString(e);
      setCurrentRomFilename(name);
      dispatch(
        settingsActions.editSettings({
          romFilename: stripInvalidFilenameCharacters(name),
        }),
      );
    },
    [dispatch],
  );

  const onChangeOpenBuildLogOnWarnings = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch(
        settingsActions.editSettings({
          openBuildLogOnWarnings: castEventToBool(e),
        }),
      ),
    [dispatch],
  );

  const onChangeGenerateDebugFilesEnabled = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch(
        settingsActions.editSettings({
          generateDebugFilesEnabled: castEventToBool(e),
        }),
      ),
    [dispatch],
  );

  const onChangeOpenBuildFolderOnExport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch(
        settingsActions.editSettings({
          openBuildFolderOnExport: castEventToBool(e),
        }),
      ),
    [dispatch],
  );

  const onChangeShowRomUsageAfterBuild = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch(
        settingsActions.editSettings({
          showRomUsageAfterBuild: castEventToBool(e),
        }),
      ),
    [dispatch],
  );

  const onChangeCompilerPreset = useCallback(
    (value: number) =>
      dispatch(
        settingsActions.editSettings({
          compilerPreset: value,
        }),
      ),
    [dispatch],
  );

  const onReset = useCallback(
    () =>
      dispatch(
        settingsActions.editSettings({
          openBuildLogOnWarnings: true,
          generateDebugFilesEnabled: false,
          compilerPreset: 3000,
        }),
      ),
    [dispatch],
  );

  return (
    <SearchableCard
      searchTerm={searchTerm}
      searchMatches={[
        l10n("SETTINGS_BUILD"),
        l10n("FIELD_ROM_FILENAME"),
        l10n("FIELD_OPEN_BUILD_LOG_ON_WARNINGS"),
        l10n("FIELD_GENERATE_DEBUG_FILES"),
        l10n("FIELD_COMPILER_PRESET"),
      ]}
    >
      <CardAnchor id="settingsBuild" />
      <CardHeading>{l10n("SETTINGS_BUILD")}</CardHeading>
      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_ROM_FILENAME")]}
      >
        <SettingRowLabel>{l10n("FIELD_ROM_FILENAME")}</SettingRowLabel>
        <SettingRowInput>
          <FlexRow>
            <Input
              id="romFilename"
              name="romFilename"
              onChange={onChangeROMFilename}
              value={currentRomFilename}
              placeholder={defaultRomFilename}
            />
          </FlexRow>
        </SettingRowInput>
      </SearchableSettingRow>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_OPEN_BUILD_LOG_ON_WARNINGS")]}
      >
        <SettingRowLabel>
          {l10n("FIELD_OPEN_BUILD_LOG_ON_WARNINGS")}
        </SettingRowLabel>
        <SettingRowInput>
          <Checkbox
            id="openBuildLogOnWarnings"
            name="openBuildLogOnWarnings"
            checked={openBuildLogOnWarnings}
            onChange={onChangeOpenBuildLogOnWarnings}
          />
        </SettingRowInput>
      </SearchableSettingRow>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_GENERATE_DEBUG_FILES")]}
      >
        <SettingRowLabel>{l10n("FIELD_GENERATE_DEBUG_FILES")}</SettingRowLabel>
        <SettingRowInput>
          <Checkbox
            id="generateDebugFilesEnabled"
            name="generateDebugFilesEnabled"
            checked={generateDebugFilesEnabled}
            onChange={onChangeGenerateDebugFilesEnabled}
          />
        </SettingRowInput>
      </SearchableSettingRow>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_OPEN_BUILD_FOLDER_ON_EXPORT")]}
      >
        <SettingRowLabel>
          {l10n("FIELD_OPEN_BUILD_FOLDER_ON_EXPORT")}
        </SettingRowLabel>
        <SettingRowInput>
          <Checkbox
            id="openBuildFolderOnExport"
            name="openBuildFolderOnExport"
            checked={openBuildFolderOnExport}
            onChange={onChangeOpenBuildFolderOnExport}
          />
        </SettingRowInput>
      </SearchableSettingRow>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_SHOW_ROM_USAGE_AFTER_BUILD")]}
      >
        <SettingRowLabel>
          {l10n("FIELD_SHOW_ROM_USAGE_AFTER_BUILD")}
        </SettingRowLabel>
        <SettingRowInput>
          <Checkbox
            id="showRomUsageAfterBuild"
            name="showRomUsageAfterBuild"
            checked={showRomUsageAfterBuild}
            onChange={onChangeShowRomUsageAfterBuild}
          />
        </SettingRowInput>
      </SearchableSettingRow>

      <SearchableSettingRow
        searchTerm={searchTerm}
        searchMatches={[l10n("FIELD_COMPILER_PRESET")]}
      >
        <SettingRowLabel>{l10n("FIELD_COMPILER_PRESET")}</SettingRowLabel>
        <SettingRowInput>
          <CompilerPresetSelect
            name={"compilerPreset"}
            value={compilerPreset}
            onChange={onChangeCompilerPreset}
          />
        </SettingRowInput>
      </SearchableSettingRow>

      {!searchTerm && (
        <CardButtons>
          <Button onClick={onReset}>{l10n("FIELD_RESTORE_DEFAULT")}</Button>
        </CardButtons>
      )}
    </SearchableCard>
  );
};

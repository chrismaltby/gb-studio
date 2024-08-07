import React, { useEffect, useMemo, useState } from "react";
import Path from "path";
import ThemeProvider from "ui/theme/ThemeProvider";
import GlobalStyle from "ui/globalStyle";
import { PreferencesWrapper } from "ui/preferences/Preferences";
import { FormField, FormRow } from "ui/form/FormLayout";
import { TextField } from "ui/form/TextField";
import { Button } from "ui/buttons/Button";
import { DotsIcon } from "ui/icons/Icons";
import { FixedSpacer, FlexGrow } from "ui/spacing/Spacing";
import { AppSelect } from "ui/form/AppSelect";
import { OptionLabelWithInfo, Select } from "ui/form/Select";
import API from "renderer/lib/api";
import l10n from "shared/lib/lang/l10n";

interface Options {
  value: number;
  label: string;
}

// ZoomLevel scale := 1.2 ^ level
const zoomOptions: Options[] = [
  { value: -3.80178, label: `50%` },
  { value: -3, label: `58%` },
  { value: -2, label: `69%` },
  { value: -1, label: `83%` },
  { value: 0, label: `100%` },
  { value: 1, label: `120%` },
  { value: 2.2239, label: `150%` },
  { value: 3, label: `172%` },
  { value: 3.80178, label: `200%` },
];

const Preferences = () => {
  const pathError = "";
  const [tmpPath, setTmpPath] = useState<string>("");
  const [imageEditorPath, setImageEditorPath] = useState<string>("");
  const [musicEditorPath, setMusicEditorPath] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(0);
  const [trackerKeyBindings, setTrackerKeyBindings] = useState<number>(0);
  const [compilerPreset, setCompilerPreset] = useState<number>(3000);
  const [compilerOptimisation, setCompilerOptimisation] = useState<number>(0);

  const currentZoomValue = zoomOptions.find((o) => o.value === zoomLevel);

  useEffect(() => {
    async function fetchData() {
      setTmpPath(await API.paths.getTmpPath());
      setImageEditorPath(await API.settings.getString("imageEditorPath", ""));
      setMusicEditorPath(await API.settings.getString("musicEditorPath", ""));
      setZoomLevel(await API.settings.app.getUIScale());
      setTrackerKeyBindings(await API.settings.app.getTrackerKeyBindings());
      setCompilerPreset(await API.settings.app.getCompilerPreset());
      setCompilerOptimisation(await API.settings.app.getCompilerOptimisation());
    }
    fetchData();
  }, []);

  const trackerKeyBindingsOptions: Options[] = useMemo(
    () => [
      { value: 0, label: l10n("FIELD_UI_LINEAR") },
      { value: 1, label: l10n("FIELD_UI_PIANO") },
    ],
    []
  );

  const trackerKeyBindingsOptionsInfo: string[] = useMemo(
    () => [l10n("FIELD_UI_LINEAR_INFO"), l10n("FIELD_UI_PIANO_INFO")],
    []
  );

  const currentTrackerKeyBindings = trackerKeyBindingsOptions.find(
    (o) => o.value === trackerKeyBindings
  );

  const compilerPresetOptions: Options[] = useMemo(
    () => [
      { value: 3000,   label: l10n("FIELD_DEFAULT") },
      { value: 1000,   label: l10n("FIELD_FAST") },
      { value: 50000,  label: l10n("FIELD_SLOW") },
      { value: 100000, label: l10n("FIELD_PLACEBO") },
    ],
    []
  );

  const currentCompilerPreset = compilerPresetOptions.find(
    (o) => o.value === compilerPreset
  );

  const compilerOptimisationOptions: Options[] = useMemo(
    () => [
      { value: 0, label: l10n("FIELD_NONE") },
      { value: 1, label: l10n("FIELD_SPEED") },
      { value: 2, label: l10n("FIELD_SIZE") },
    ],
    []
  );

  const currentCompilerOptimisation = compilerOptimisationOptions.find(
    (o) => o.value === compilerOptimisation
  );

  const onChangeTmpPath = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.currentTarget.value;
    setTmpPath(newPath);
    API.settings.set("tmpDir", newPath);
  };

  const onChangeImageEditorPath = (path: string) => {
    setImageEditorPath(path);
    API.settings.set("imageEditorPath", path);
  };

  const onChangeMusicEditorPath = (path: string) => {
    setMusicEditorPath(path);
    API.settings.set("musicEditorPath", path);
  };

  const onChangeZoomLevel = (zoomLevel: number) => {
    setZoomLevel(zoomLevel);
    API.settings.app.setUIScale(zoomLevel);
  };

  const onChangeTrackerKeyBindings = (trackerKeyBindings: number) => {
    setTrackerKeyBindings(trackerKeyBindings);
    API.settings.app.setTrackerKeyBindings(trackerKeyBindings);
  };

  const onSelectTmpFolder = async () => {
    const path = await API.dialog.chooseDirectory();
    if (path) {
      const newPath = Path.normalize(`${path}/`);
      setTmpPath(newPath);
      API.settings.set("tmpDir", newPath);
    }
  };

  const onRestoreDefaultTmpPath = async () => {
    API.settings.delete("tmpDir");
    setTmpPath(await API.paths.getTmpPath());
  };

  const onChangeCompilerPreset = (value: number) => {
    setCompilerPreset(value);
    API.settings.app.setCompilerPreset(value);
  };

  const onChangeCompilerOptimisation = (value: number) => {
    setCompilerOptimisation(value);
    API.settings.app.setCompilerOptimisation(value);
  };

  return (
    <ThemeProvider>
      <GlobalStyle />

      <PreferencesWrapper>
        <FormRow>
          <TextField
            name="path"
            label={l10n("FIELD_TMP_DIRECTORY")}
            errorLabel={pathError}
            value={tmpPath}
            onChange={onChangeTmpPath}
            additionalRight={
              <Button onClick={onSelectTmpFolder} type="button">
                <DotsIcon />
              </Button>
            }
            info={l10n("FIELD_TMP_DIRECTORY_INFO")}
          />
        </FormRow>
        <FormRow>
          <Button onClick={onRestoreDefaultTmpPath}>
            {l10n("FIELD_RESTORE_DEFAULT")}
          </Button>
        </FormRow>

        <FlexGrow />
        <FormRow>
          <FormField name="compilerPreset" label={l10n("FIELD_COMPILER_PRESET")}>
            <Select
              value={currentCompilerPreset}
              options={compilerPresetOptions}
              onChange={(newValue: Options) => {
                onChangeCompilerPreset(newValue.value);
              }}
            />
          </FormField>
          <FormField name="compilerOptimisation" label={l10n("FIELD_COMPILER_OPTIMISATION")}>
            <Select
              value={currentCompilerOptimisation}
              options={compilerOptimisationOptions}
              onChange={(newValue: Options) => {
                onChangeCompilerOptimisation(newValue.value);
              }}
            />
          </FormField>
        </FormRow>

        <FormRow>
          <FormField
            name="musicEditorPath"
            label={l10n("FIELD_DEFAULT_IMAGE_EDITOR")}
          >
            <AppSelect
              value={imageEditorPath}
              onChange={onChangeImageEditorPath}
            />
          </FormField>
          <FormField
            name="musicEditorPath"
            label={l10n("FIELD_DEFAULT_MUSIC_EDITOR")}
          >
            <AppSelect
              value={musicEditorPath}
              onChange={onChangeMusicEditorPath}
            />
          </FormField>
        </FormRow>

        <FixedSpacer height={10} />
        <FormRow>
          <FormField name="zoomLevel" label={l10n("FIELD_UI_ELEMENTS_SCALING")}>
            <Select
              value={currentZoomValue}
              options={zoomOptions}
              onChange={(newValue: Options) => {
                onChangeZoomLevel(newValue.value);
              }}
            />
          </FormField>
        </FormRow>
        <FixedSpacer height={10} />
        <FormRow>
          <FormField
            name="trackerKeyBindings"
            label={l10n("FIELD_UI_TRACKER_KEYBINDINGS")}
          >
            <Select
              value={currentTrackerKeyBindings}
              options={trackerKeyBindingsOptions}
              onChange={(newValue: Options) => {
                onChangeTrackerKeyBindings(newValue.value);
              }}
              formatOptionLabel={(
                option: Options,
                { context }: { context: "menu" | "value" }
              ) => {
                return (
                  <OptionLabelWithInfo
                    info={
                      context === "menu"
                        ? trackerKeyBindingsOptionsInfo[option.value]
                        : ""
                    }
                  >
                    {option.label}
                    {context === "value"
                      ? ` (${trackerKeyBindingsOptionsInfo[option.value]})`
                      : ""}
                  </OptionLabelWithInfo>
                );
              }}
            />
          </FormField>
        </FormRow>
      </PreferencesWrapper>
    </ThemeProvider>
  );
};

export default Preferences;

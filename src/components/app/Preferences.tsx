import React, { useEffect, useState } from "react";
import Path from "path";
import settings from "electron-settings";
import l10n from "lib/helpers/l10n";
import getTmp from "lib/helpers/getTmp";
import ThemeProvider from "ui/theme/ThemeProvider";
import GlobalStyle from "ui/globalStyle";
import { PreferencesWrapper } from "ui/preferences/Preferences";
import { FormField, FormRow } from "ui/form/FormLayout";
import { TextField } from "ui/form/TextField";
import { Button } from "ui/buttons/Button";
import { DotsIcon } from "ui/icons/Icons";
import { FixedSpacer, FlexGrow } from "ui/spacing/Spacing";
import { AppSelect } from "ui/form/AppSelect";
import { ipcRenderer, remote } from "electron";
import { Select } from "ui/form/Select";

const { dialog } = remote;

interface ZoomOptions {
  value: number;
  label: string;
}

const options: ZoomOptions[] = [
  { value: 0, label: `100%` },
  { value: 1, label: `200%` },
  { value: 2, label: `300%` },
  { value: 3, label: `400%` },
];

const Preferences = () => {
  const pathError = "";
  const [tmpPath, setTmpPath] = useState<string>("");
  const [imageEditorPath, setImageEditorPath] = useState<string>("");
  const [musicEditorPath, setMusicEditorPath] = useState<string>("");
  const [zoomLevel, setZoomLevel] = useState<number>(0);

  const currentZoomValue = options.find((o) => o.value === zoomLevel);

  useEffect(() => {
    setTmpPath(getTmp(false));
    setImageEditorPath(String(settings.get("imageEditorPath") || ""));
    setMusicEditorPath(String(settings.get("musicEditorPath") || ""));
    setZoomLevel(Number(settings.get("zoomLevel") || 0));
  }, []);

  const onChangeTmpPath = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.currentTarget.value;
    setTmpPath(newPath);
    settings.set("tmpDir", newPath);
  };

  const onChangeImageEditorPath = (path: string) => {
    setImageEditorPath(path);
    settings.set("imageEditorPath", path);
  };

  const onChangeMusicEditorPath = (path: string) => {
    setMusicEditorPath(path);
    settings.set("musicEditorPath", path);
  };

  const onChangeZoomLevel = (zoomLevel: number) => {
    setZoomLevel(zoomLevel);
    settings.set("zoomLevel", zoomLevel);
    ipcRenderer.send("window-zoom", zoomLevel);
  };

  const onSelectTmpFolder = async () => {
    const path = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (path.filePaths[0]) {
      const newPath = Path.normalize(`${path.filePaths[0]}/`);
      setTmpPath(newPath);
      settings.set("tmpDir", newPath);
    }
  };

  const onRestoreDefaultTmpPath = () => {
    settings.delete("tmpDir");
    setTmpPath(getTmp(false));
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
          <FormField name="zoomLevel" label={l10n("FIELD_DEFAULT_ZOOM_LEVEL")}>
            <Select
              value={currentZoomValue}
              options={options}
              onChange={(newValue: ZoomOptions) => {
                onChangeZoomLevel(newValue.value);
              }}
            />
          </FormField>
        </FormRow>
      </PreferencesWrapper>
    </ThemeProvider>
  );
};

export default Preferences;

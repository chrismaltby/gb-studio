import React, { useEffect, useState } from "react";
import Path from "path";
import settings from "electron-settings";
import { ipcRenderer, remote } from "electron";
import { DotsIcon } from "../library/Icons";
import l10n from "../../lib/helpers/l10n";
import Button from "../library/Button";
import getTmp from "../../lib/helpers/getTmp";

const { dialog } = require("electron").remote;

const Preferences = () => {
  const pathError = "";
  const [path, setPath] = useState<string>("");

  useEffect(() => {
    setPath(getTmp(false));
  }, []);

  const onChangePath = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPath = e.currentTarget.value;
    setPath(newPath);
    settings.set("tmpDir", newPath);
  };

  const onSelectFolder = async (
    e: React.MouseEvent<HTMLInputElement, MouseEvent>
  ) => {
    const path = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    if (path.filePaths[0]) {
      const newPath = Path.normalize(`${path.filePaths}/`);
      setPath(newPath);
      settings.set("tmpDir", newPath);
    }
  };

  const onRestoreDefault = () => {
    settings.delete("tmpDir");
    setPath(getTmp(false));
  };

  return (
    <div className="Preferences">
      <div className="Preferences__FormGroup">
        <label
          htmlFor="projectPath"
          className={pathError ? "Preferences__Label--Error" : ""}
        >
          {pathError || l10n("FIELD_TMP_DIRECTORY")}
          <input id="projectPath" value={path} onChange={onChangePath} />
          <div className="Preferences__InputButton">
            <DotsIcon />
            <input
              className="Preferences__InputButton"
              onClick={onSelectFolder}
            />
          </div>
        </label>
        <div className="Preferences__Info">
          {l10n("FIELD_TMP_DIRECTORY_INFO")}
        </div>
      </div>
      <div className="Preferences__FlexSpacer"></div>
      <div>
        <Button
          transparent={false}
          small={false}
          large={false}
          onClick={onRestoreDefault}
        >
          {l10n("FIELD_RESTORE_DEFAULT")}
        </Button>
      </div>
    </div>
  );
};

export default Preferences;

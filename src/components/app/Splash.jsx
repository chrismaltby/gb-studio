import React, { Component } from "react";
import cx from "classnames";
import { DotsIcon } from "../library/Icons";
import stripInvalidFilenameCharacters from "../../lib/helpers/stripInvalidFilenameCharacters";
import createProject, {
  ERR_PROJECT_EXISTS
} from "../../lib/project/createProject";
import { ipcRenderer, remote } from "electron";
import Path from "path";
import l10n from "../../lib/helpers/l10n";

const getLastUsedPath = () => {
  const storedPath = localStorage.getItem("__lastUsedPath");
  if (storedPath) {
    return Path.normalize(storedPath);
  } else {
    return remote.app.getPath("documents");
  }
};

const setLastUsedPath = path => {
  localStorage.setItem("__lastUsedPath", path);
};

class Splash extends Component {
  constructor() {
    super();
    this.state = {
      blur: false,
      tab: "new",
      name: l10n("SPLASH_DEFAULT_PROJECT_NAME"),
      target: "gbhtml",
      path: getLastUsedPath(),
      nameError: null,
      pathError: null,
      creating: false
    };
  }

  componentDidMount() {
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("focus", this.onFocus);
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("focus", this.onFocus);
    window.removeEventListener("keydown", this.onKeyDown);
  }

  onBlur = () => {
    this.setState({ blur: true });
  };

  onFocus = () => {
    this.setState({ blur: false });
  };

  onSetTab = tab => () => {
    this.setState({ tab });
  };

  onChange = key => e => {
    let value = e.currentTarget.value;
    if (key === "name") {
      value = stripInvalidFilenameCharacters(value);
    }

    this.setState({
      [key]: value,
      nameError: false
    });
  };

  onKeyDown = e => {
    if (e.key === "Enter") {
      this.onSubmit(e);
    }
  };

  onSelectFolder = e => {
    if (e.target.files && e.target.files[0]) {
      const newPath = Path.normalize(e.target.files[0].path + "/");
      setLastUsedPath(newPath);
      this.setState({
        path: newPath
      });
    }
  };

  onOpen = e => {
    ipcRenderer.send("open-project-picker");
  };

  onSubmit = async e => {
    const { name, target, path } = this.state;

    if (!name) {
      return this.setState({
        nameError: l10n("ERROR_PLEASE_ENTER_PROJECT_NAME")
      });
    }

    if (!path) {
      return this.setState({
        pathError: l10n("ERROR_PLEASE_ENTER_PROJECT_PATH")
      });
    }

    try {
      this.setState({
        creating: true
      });
      const projectPath = await createProject({
        name,
        target,
        path
      });
      ipcRenderer.send("open-project", { projectPath });
    } catch (e) {
      if (e === ERR_PROJECT_EXISTS) {
        this.setState({
          nameError: l10n("ERROR_PROJECT_ALREADY_EXISTS"),
          creating: false
        });
      }
    }
  };

  render() {
    const {
      blur,
      tab,
      name,
      target,
      path,
      nameError,
      pathError,
      creating
    } = this.state;
    return (
      <div className={cx("Splash", { "Splash--Blur": blur })}>
        <div className="Splash__Tabs">
          <div
            className={cx("Splash__Tab", {
              "Splash__Tab--Active": tab === "new"
            })}
            onClick={this.onSetTab("new")}
          >
            {l10n("SPLASH_NEW")}
          </div>
          <div className="Splash__Tab" onClick={this.onOpen}>
            {l10n("SPLASH_OPEN")}
          </div>
        </div>

        {tab === "new" ? (
          <div className="Splash__Content">
            <div className="Splash__FormGroup">
              <label className={nameError ? "Splash__Label--Error" : ""}>
                {nameError ? nameError : l10n("SPLASH_PROJECT_NAME")}
              </label>
              <input value={name} onChange={this.onChange("name")} />
            </div>

            <div className="Splash__FormGroup">
              <label>{l10n("SPLASH_PROJECT_TEMPLATE")}</label>
              <select value={target} onChange={this.onChange("target")}>
                <option value="gbhtml">{l10n("SPLASH_SAMPLE_PROJECT")}</option>
                <option value="blank">{l10n("SPLASH_BLANK_PROJECT")}</option>
              </select>
            </div>

            <div className="Splash__FormGroup">
              <label className={pathError ? "Splash__Label--Error" : ""}>
                {pathError ? pathError : l10n("SPLASH_PATH")}
              </label>
              <input value={path} onChange={this.onChange("path")} />
              <div className="Splash__InputButton">
                <DotsIcon />
              </div>
              <input
                type="file"
                directory=""
                webkitdirectory=""
                className="Splash__InputButton"
                onChange={this.onSelectFolder}
              />
            </div>
            <div className="Splash__FlexSpacer" />

            <div>
              <div
                className={cx("Splash__Button", {
                  "Splash__Button--Disabled": creating
                })}
                onClick={!creating && this.onSubmit}
              >
                {creating ? l10n("SPLASH_CREATING") : l10n("SPLASH_CREATE")}
              </div>
            </div>
          </div>
        ) : (
          tab === "recent" && (
            <div className="Splash__Content">Not implemented</div>
          )
        )}
      </div>
    );
  }
}

export default Splash;

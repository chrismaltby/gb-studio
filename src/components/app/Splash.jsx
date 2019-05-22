/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import { ipcRenderer, remote } from "electron";
import cx from "classnames";
import Path from "path";
import { DotsIcon } from "../library/Icons";
import stripInvalidFilenameCharacters from "../../lib/helpers/stripInvalidFilenameCharacters";
import createProject, {
  ERR_PROJECT_EXISTS
} from "../../lib/project/createProject";
import l10n from "../../lib/helpers/l10n";
import "../../lib/helpers/handleFirstTab";

const getLastUsedPath = () => {
  const storedPath = localStorage.getItem("__lastUsedPath");
  if (storedPath) {
    return Path.normalize(storedPath);
  }
  return remote.app.getPath("documents");
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
      creating: false,
      recentProjects: []
    };
  }

  componentDidMount() {
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("focus", this.onFocus);
    window.addEventListener("keydown", this.onKeyDown);

    const urlParams = new URLSearchParams(window.location.search);
    const forceNew = urlParams.get("new");
    ipcRenderer.send("request-recent-projects");
    ipcRenderer.once("recent-projects", (event, projectPaths) => {
      if (projectPaths && projectPaths.length > 0) {
        this.setState({
          tab: forceNew === "true" ? "new" : "recent",
          recentProjects: projectPaths.reverse()
        });
      }
    });
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
    let { value } = e.currentTarget;
    if (key === "name") {
      value = stripInvalidFilenameCharacters(value);
    }

    this.setState({
      [key]: value,
      nameError: false
    });
  };

  onKeyDown = e => {
    const { tab } = this.state;
    const { nodeName } = e.target;
    if (tab !== "new" || (nodeName !== "INPUT" && nodeName !== "SELECT")) {
      return;
    }
    if (e.key === "Enter") {
      this.onSubmit(e);
    }
  };

  onSelectFolder = e => {
    if (e.target.files && e.target.files[0]) {
      const newPath = Path.normalize(`${e.target.files[0].path}/`);
      setLastUsedPath(newPath);
      this.setState({
        path: newPath
      });
    }
  };

  onOpen = e => {
    ipcRenderer.send("open-project-picker");
  };

  openRecent = projectPath => e => {
    ipcRenderer.send("open-project", { projectPath });
  };

  clearRecent = e => {
    this.setState({
      recentProjects: []
    });
    ipcRenderer.send("clear-recent-projects");
  };

  onSubmit = async e => {
    const { name, target, path } = this.state;

    if (!name) {
      this.setState({
        nameError: l10n("ERROR_PLEASE_ENTER_PROJECT_NAME")
      });
      return;
    }

    if (!path) {
      this.setState({
        pathError: l10n("ERROR_PLEASE_ENTER_PROJECT_PATH")
      });
      return;
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
    } catch (err) {
      if (err === ERR_PROJECT_EXISTS) {
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
      creating,
      recentProjects
    } = this.state;
    return (
      <div className={cx("Splash", { "Splash--Blur": blur })}>
        <div className="Splash__Tabs">
          <button
            className={cx("Splash__Tab", {
              "Splash__Tab--Active": tab === "new"
            })}
            onClick={this.onSetTab("new")}
            type="button"
          >
            {l10n("SPLASH_NEW")}
          </button>
          <button
            className={cx("Splash__Tab", {
              "Splash__Tab--Active": tab === "recent"
            })}
            onClick={this.onSetTab("recent")}
            type="button"
          >
            {l10n("SPLASH_RECENT")}
          </button>
          <div className="Splash__FlexSpacer" />
          <button className="Splash__Tab" onClick={this.onOpen} type="button">
            <div className="Splash__OpenButton">{l10n("SPLASH_OPEN")}</div>
          </button>
        </div>

        {tab === "new" ? (
          <div className="Splash__Content">
            <div className="Splash__FormGroup">
              <label
                className={nameError ? "Splash__Label--Error" : ""}
                htmlFor="projectName"
              >
                {nameError || l10n("SPLASH_PROJECT_NAME")}
                <input
                  id="projectName"
                  value={name}
                  onChange={this.onChange("name")}
                />
              </label>
            </div>

            <div className="Splash__FormGroup">
              <label htmlFor="projectTemplate">
                {l10n("SPLASH_PROJECT_TEMPLATE")}
                <select
                  id="projectTemplate"
                  value={target}
                  onChange={this.onChange("target")}
                >
                  <option value="gbhtml">
                    {l10n("SPLASH_SAMPLE_PROJECT")}
                  </option>
                  <option value="blank">{l10n("SPLASH_BLANK_PROJECT")}</option>
                </select>
              </label>
            </div>

            <div className="Splash__FormGroup">
              <label
                htmlFor="projectPath"
                className={pathError ? "Splash__Label--Error" : ""}
              >
                {pathError || l10n("SPLASH_PATH")}
                <input
                  id="projectPath"
                  value={path}
                  onChange={this.onChange("path")}
                />
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
              </label>
            </div>
            <div className="Splash__FlexSpacer" />

            <div>
              <button
                className={cx("Splash__Button", {
                  "Splash__Button--Disabled": creating
                })}
                onClick={!creating ? this.onSubmit : undefined}
                type="button"
              >
                {creating ? l10n("SPLASH_CREATING") : l10n("SPLASH_CREATE")}
              </button>
            </div>
          </div>
        ) : (
          tab === "recent" && (
            <div className="Splash__RecentProjects">
              <div className="Splash__Content">
                {recentProjects.map((projectPath, index) => (
                  <button
                    key={projectPath}
                    className="Splash__RecentProject"
                    onClick={this.openRecent(projectPath)}
                    type="button"
                  >
                    <div className="Splash__RecentProject__Name">
                      {Path.basename(projectPath)}
                    </div>
                    <div className="Splash__RecentProject__Path">
                      {Path.dirname(projectPath)}
                    </div>
                  </button>
                ))}
                {recentProjects.length > 0 ? (
                  <button
                    className="Splash__ClearRecent"
                    onClick={this.clearRecent}
                    type="button"
                  >
                    {l10n("SPLASH_CLEAR_RECENT")}
                  </button>
                ) : (
                  <div>{l10n("SPLASH_NO_RECENT_PROJECTS")}</div>
                )}
              </div>
            </div>
          )
        )}
      </div>
    );
  }
}

export default Splash;

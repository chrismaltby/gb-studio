import React, { Component } from "react";
import cx from "classnames";
import { DotsIcon } from "../library/Icons";
import stripInvalidFilenameCharacters from "../../lib/helpers/stripInvalidFilenameCharacters";
import createProject, {
  ERR_PROJECT_EXISTS
} from "../../lib/project/createProject";
import { ipcRenderer, remote } from "electron";
import Path from "path";

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
      name: "Untitled",
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
      return this.setState({ nameError: "Please enter a project name" });
    }

    if (!path) {
      return this.setState({ pathError: "Please enter a project path" });
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
        this.setState({ nameError: "Project already exists", creating: false });
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
            New
          </div>
          <div className="Splash__Tab" onClick={this.onOpen}>
            Open
          </div>
        </div>

        {tab === "new" ? (
          <div className="Splash__Content">
            <div className="Splash__FormGroup">
              <label className={nameError ? "Splash__Label--Error" : ""}>
                {nameError ? nameError : "Project name"}
              </label>
              <input value={name} onChange={this.onChange("name")} />
            </div>

            <div className="Splash__FormGroup">
              <label>Template</label>
              <select value={target} onChange={this.onChange("target")}>
                <option value="gbhtml">GB + HTML</option>
                <option value="blank">Blank Project</option>
              </select>
            </div>

            <div className="Splash__FormGroup">
              <label className={pathError ? "Splash__Label--Error" : ""}>
                {pathError ? pathError : "Path"}
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
                {creating ? "Creating..." : "Create"}
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

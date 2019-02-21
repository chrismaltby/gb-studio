import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import { DotsIcon } from "./components/library/Icons";
import stripInvalidFilenameCharacters from "./lib/stripInvalidFilenameCharacters";
import createProject, { ERR_PROJECT_EXISTS } from "./lib/createProject";
import { ipcRenderer } from "electron";

class Splash extends Component {
  constructor() {
    super();
    this.state = {
      blur: false,
      tab: "new",
      name: "Untitled",
      target: "gbhtml",
      path: "/Users/cmaltby/Projects/",
      nameError: null
    };
  }

  componentWillMount() {
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("focus", this.onFocus);
  }

  componentWillUnmount() {
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("focus", this.onFocus);
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

  onSelectFolder = e => {
    if (e.target.files && e.target.files[0]) {
      this.setState({
        path: e.target.files[0].path + "/"
      });
    }
  };

  onOpen = e => {
    ipcRenderer.send("open-project-picker");
  };

  onSubmit = async e => {
    const { name, target, path } = this.state;
    try {
      const projectPath = await createProject({
        name,
        target,
        path
      });
      ipcRenderer.send("open-project", { projectPath });
    } catch (e) {
      if (e === ERR_PROJECT_EXISTS) {
        this.setState({ nameError: "Project already exists" });
      }
    }
  };

  render() {
    const { section } = this.props;
    const { blur, tab, name, target, path, nameError } = this.state;
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
          <div
            className={cx("Splash__Tab", {
              "Splash__Tab--Active": tab === "recent"
            })}
            onClick={this.onSetTab("recent")}
          >
            Recent
          </div>
          <div className="Splash__FlexSpacer" />

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
              <label>Target system</label>
              <select value={target} onChange={this.onChange("target")}>
                <option value="gbhtml">HTML</option>
              </select>
            </div>

            <div className="Splash__FormGroup">
              <label>Path</label>
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
              <div className="Splash__Button" onClick={this.onSubmit}>
                Create
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

function mapStateToProps(state) {
  return {
    section: state.navigation.section
  };
}

export default connect(mapStateToProps)(Splash);

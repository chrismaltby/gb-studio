import React, { Component } from "react";
import {
  Toolbar,
  ToolbarTitle,
  ToolbarSpacer,
  ToolbarFixedSpacer,
  ToolbarButton,
  ToolbarDropdownButton
} from "../components/library/Toolbar";
import { MenuItem } from "../components/library/Menu";
import {
  PlayIcon,
  DownloadIcon,
  PlusIcon,
  MinusIcon,
  FolderIcon,
  LoadingIcon
} from "../components/library/Icons";
import { connect } from "react-redux";
import * as actions from "../actions";

const sectionNames = {
  overview: "Overview",
  world: "Game World",
  sprites: "Sprites",
  backgrounds: "Backgrounds",
  ui: "UI Elements",
  music: "Music",
  script: "Script Review",
  build: "Build & Run"
};

class AppToolbar extends Component {
  setSection = section => e => {
    this.props.setSection(section);
  };

  onZoomIn = e => {
    e.preventDefault();
    e.stopPropagation();
    this.props.zoomIn(this.props.section);
  };

  onZoomOut = e => {
    e.preventDefault();
    e.stopPropagation();
    this.props.zoomOut(this.props.section);
  };

  onZoomReset = e => {
    e.preventDefault();
    e.stopPropagation();
    this.props.zoomReset(this.props.section);
  };

  onRun = async e => {
    this.props.buildGame({ buildType: "web" });
  };

  openProjectFolder = e => {
    this.props.openFolder(`${this.props.projectRoot}`);
  };

  render() {
    const { name, section = "overview", zoom, showZoom, running } = this.props;

    return (
      <Toolbar>
        <ToolbarDropdownButton
          title={sectionNames[section]}
          style={{ width: 130 }}
        >
          {Object.keys(sectionNames).map(key => (
            <MenuItem key={key} value={key} onClick={this.setSection(key)}>
              {sectionNames[key]}
            </MenuItem>
          ))}
        </ToolbarDropdownButton>
        <ToolbarButton style={{ width: 90, visibility: !showZoom && "hidden" }}>
          <ToolbarButton onClick={this.onZoomOut}>
            <MinusIcon />
          </ToolbarButton>
          <div
            onClick={this.onZoomReset}
            style={{ width: 44, flexShrink: 0, textAlign: "center" }}
          >
            {Math.round(zoom)}%
          </div>
          <ToolbarButton onClick={this.onZoomIn}>
            <PlusIcon />
          </ToolbarButton>
        </ToolbarButton>
        <ToolbarSpacer />
        <ToolbarTitle>{name || "Untitled"}</ToolbarTitle>
        <ToolbarSpacer />
        <ToolbarFixedSpacer style={{ width: 186 }} />
        <ToolbarButton onClick={this.openProjectFolder}>
          <FolderIcon />
        </ToolbarButton>
        {/* <ToolbarButton>
          <DownloadIcon />
        </ToolbarButton> */}
        <ToolbarFixedSpacer />
        <ToolbarButton onClick={this.onRun}>
          {running ? <LoadingIcon /> : <PlayIcon />}
        </ToolbarButton>
      </Toolbar>
    );
  }
}

function mapStateToProps(state) {
  const section = state.navigation.section;
  const zoom =
    section === "world"
      ? state.editor.zoom
      : section === "sprites"
      ? state.editor.zoomSprite
      : section === "backgrounds"
      ? state.editor.zoomImage
      : section === "ui"
      ? state.editor.zoomUI
      : 100;
  return {
    projectRoot: state.document && state.document.root,
    name: state.project.present && state.project.present.name,
    section,
    zoom,
    showZoom: ["world", "sprites", "backgrounds", "ui"].indexOf(section) > -1,
    running: state.console.status === "running"
  };
}

const mapDispatchToProps = {
  saveWorld: actions.saveWorld,
  setSection: actions.setSection,
  zoomIn: actions.zoomIn,
  zoomOut: actions.zoomOut,
  zoomReset: actions.zoomReset,
  buildGame: actions.buildGame,
  openFolder: actions.openFolder
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppToolbar);

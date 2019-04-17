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
  ExportIcon,
  PlusIcon,
  MinusIcon,
  FolderIcon,
  LoadingIcon
} from "../components/library/Icons";
import { connect } from "react-redux";
import * as actions from "../actions";

const sectionNames = {
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

  onBuild = buildType => e => {
    this.props.buildGame({ buildType, exportBuild: true });
  };

  openProjectFolder = e => {
    this.props.openFolder(`${this.props.projectRoot}`);
  };

  render() {
    const { name, section = "world", zoom, showZoom, running, modified } = this.props;

    return (
      <Toolbar>
        <ToolbarDropdownButton
          label={<div style={{ width: 106 }}>{sectionNames[section]}</div>}
        >
          {Object.keys(sectionNames).map(key => (
            <MenuItem
              key={key}
              value={key}
              onClick={this.setSection(key)}
              style={{ minWidth: 200 }}
            >
              {sectionNames[key]}
            </MenuItem>
          ))}
        </ToolbarDropdownButton>
        <ToolbarButton
          style={{
            width: 80,
            flexShrink: 0,
            visibility: !showZoom && "hidden"
          }}
        >
          <ToolbarButton onClick={this.onZoomOut} title="Zoom Out">
            <MinusIcon />
          </ToolbarButton>
          <div
            title="Reset Zoom"
            onClick={this.onZoomReset}
            style={{ width: 34, flexShrink: 0, textAlign: "center" }}
          >
            {Math.round(zoom)}%
          </div>
          <ToolbarButton onClick={this.onZoomIn} title="Zoom In">
            <PlusIcon />
          </ToolbarButton>
        </ToolbarButton>
        <ToolbarSpacer />
        <ToolbarTitle>{name || "Untitled"} {modified && " (modified)"}</ToolbarTitle>
        <ToolbarSpacer />
        <ToolbarFixedSpacer style={{ width: 138 }} />
        <ToolbarButton
          title="Open Project Folder"
          onClick={this.openProjectFolder}
        >
          <FolderIcon />
        </ToolbarButton>
        <ToolbarDropdownButton
          title="Export As..."
          label={<ExportIcon />}
          showArrow={false}
          right
        >
          <MenuItem onClick={this.onBuild("rom")}>Export ROM</MenuItem>
          <MenuItem onClick={this.onBuild("web")}>Export Web</MenuItem>
        </ToolbarDropdownButton>
        <ToolbarFixedSpacer />
        <ToolbarButton
          title="Run"
          onClick={running ? this.setSection("build") : this.onRun}
        >
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
    modified: state.document && state.document.modified,
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

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
import { shell } from "electron";
import { connect } from "react-redux";
import * as actions from "../actions";

const sectionNames = {
  overview: "Overview",
  world: "Game World",
  sprites: "Sprites",
  backgrounds: "Backgrounds",
  // tiles: "Tiles",
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
    this.props.zoomIn();
  };

  onZoomOut = e => {
    e.preventDefault();
    e.stopPropagation();
    this.props.zoomOut();
  };

  onZoomReset = e => {
    e.preventDefault();
    e.stopPropagation();
    this.props.zoomReset();
  };

  onRun = e => {
    this.props.runBuild({ buildType: "web" });
  };

  openProjectFolder = e => {
    shell.openItem(this.props.projectRoot);
  };

  render() {
    const { name, section = "overview", zoom, running } = this.props;
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
        <ToolbarButton style={{ width: 90 }}>
          <ToolbarButton onClick={this.onZoomOut}>
            <MinusIcon />
          </ToolbarButton>
          <div onClick={this.onZoomReset}>{Math.round(zoom)}%</div>
          <ToolbarButton onClick={this.onZoomIn}>
            <PlusIcon />
          </ToolbarButton>
        </ToolbarButton>
        <ToolbarSpacer />
        <ToolbarTitle>{name || "Untitled"}</ToolbarTitle>
        <ToolbarSpacer />
        <ToolbarSpacer />
        <ToolbarButton onClick={this.openProjectFolder}>
          <FolderIcon />
        </ToolbarButton>
        <ToolbarButton>
          <DownloadIcon />
        </ToolbarButton>
        <ToolbarFixedSpacer />
        <ToolbarButton onClick={this.onRun}>
          {running ? <LoadingIcon /> : <PlayIcon />}
        </ToolbarButton>
      </Toolbar>
    );
  }
}

function mapStateToProps(state) {
  return {
    projectRoot: state.document && state.document.root,
    name: state.project.present && state.project.present.name,
    section: state.navigation.section,
    zoom: state.editor.zoom,
    running: state.console.status === "running"
  };
}

const mapDispatchToProps = {
  saveWorld: actions.saveWorld,
  setSection: actions.setSection,
  zoomIn: actions.zoomIn,
  zoomOut: actions.zoomOut,
  zoomReset: actions.zoomReset,
  runBuild: actions.runBuild
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppToolbar);

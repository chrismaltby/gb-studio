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
import l10n from "../lib/helpers/l10n";

const sectionNames = {
  world: l10n("NAV_GAME_WORLD"),
  sprites: l10n("NAV_SPRITES"),
  backgrounds: l10n("NAV_BACKGROUNDS"),
  ui: l10n("NAV_UI_ELEMENTS"),
  music: l10n("NAV_MUSIC"),
  script: l10n("NAV_SCRIPT_REVIEW"),
  build: l10n("NAV_BUILD_AND_RUN")
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
    const {
      name,
      section = "world",
      zoom,
      showZoom,
      running,
      modified
    } = this.props;

    return (
      <Toolbar>
        <ToolbarDropdownButton
          label={<div style={{ minWidth: 106 }}>{sectionNames[section]}</div>}
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
          <ToolbarButton
            onClick={this.onZoomOut}
            title={l10n("TOOLBAR_ZOOM_OUT")}
          >
            <MinusIcon />
          </ToolbarButton>
          <div
            title={l10n("TOOLBAR_ZOOM_RESET")}
            onClick={this.onZoomReset}
            style={{ width: 34, flexShrink: 0, textAlign: "center" }}
          >
            {Math.round(zoom)}%
          </div>
          <ToolbarButton
            onClick={this.onZoomIn}
            title={l10n("TOOLBAR_ZOOM_IN")}
          >
            <PlusIcon />
          </ToolbarButton>
        </ToolbarButton>
        <ToolbarSpacer />
        <ToolbarTitle>
          {name || "Untitled"} {modified && ` (${l10n("TOOLBAR_MODIFIED")})`}
        </ToolbarTitle>
        <ToolbarSpacer />
        <ToolbarFixedSpacer style={{ width: 138 }} />
        <ToolbarButton
          title={l10n("TOOLBAR_OPEN_PROJECT_FOLDER")}
          onClick={this.openProjectFolder}
        >
          <FolderIcon />
        </ToolbarButton>
        <ToolbarDropdownButton
          title={l10n("TOOLBAR_EXPORT_AS")}
          label={<ExportIcon />}
          showArrow={false}
          right
        >
          <MenuItem onClick={this.onBuild("rom")}>
            {l10n("TOOLBAR_EXPORT_ROM")}
          </MenuItem>
          <MenuItem onClick={this.onBuild("web")}>
            {l10n("TOOLBAR_EXPORT_WEB")}
          </MenuItem>
        </ToolbarDropdownButton>
        <ToolbarFixedSpacer />
        <ToolbarButton
          title={l10n("TOOLBAR_RUN")}
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

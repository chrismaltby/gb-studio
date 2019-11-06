import React, { Component } from "react";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
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
import * as actions from "../actions";
import l10n from "../lib/helpers/l10n";
import { zoomForSection } from "../lib/helpers/gbstudio";

const sectionNames = {
  world: l10n("NAV_GAME_WORLD"),
  sprites: l10n("NAV_SPRITES"),
  backgrounds: l10n("NAV_BACKGROUNDS"),
  ui: l10n("NAV_UI_ELEMENTS"),
  music: l10n("NAV_MUSIC"),
  dialogue: l10n("NAV_DIALOGUE_REVIEW"),
  build: l10n("NAV_BUILD_AND_RUN"),
  settings: l10n("NAV_SETTINGS")
};

class AppToolbar extends Component {
  setSection = section => e => {
    const { setSection } = this.props;
    setSection(section);
  };

  onZoomIn = e => {
    e.preventDefault();
    e.stopPropagation();
    const { zoomIn, section } = this.props;
    zoomIn(section);
  };

  onZoomOut = e => {
    e.preventDefault();
    e.stopPropagation();
    const { zoomOut, section } = this.props;
    zoomOut(section);
  };

  onZoomReset = e => {
    e.preventDefault();
    e.stopPropagation();
    const { zoomReset, section } = this.props;
    zoomReset(section);
  };

  onRun = async e => {
    const { buildGame } = this.props;
    buildGame({ buildType: "web" });
  };

  onBuild = buildType => e => {
    const { buildGame } = this.props;
    buildGame({ buildType, exportBuild: true });
  };

  openProjectFolder = e => {
    const { openFolder, projectRoot } = this.props;
    openFolder(projectRoot);
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
        <Helmet>
          <title>{name}</title>
        </Helmet>
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

AppToolbar.propTypes = {
  name: PropTypes.string,
  projectRoot: PropTypes.string.isRequired,
  section: PropTypes.string.isRequired,
  zoom: PropTypes.number.isRequired,
  setSection: PropTypes.func.isRequired,
  zoomIn: PropTypes.func.isRequired,
  zoomOut: PropTypes.func.isRequired,
  zoomReset: PropTypes.func.isRequired,
  openFolder: PropTypes.func.isRequired,
  buildGame: PropTypes.func.isRequired,
  running: PropTypes.bool.isRequired,
  modified: PropTypes.bool.isRequired,
  showZoom: PropTypes.bool.isRequired
};

AppToolbar.defaultProps = {
  name: ""
};

function mapStateToProps(state) {
  const section = state.navigation.section;
  const zoom = zoomForSection(section, state.editor);
  return {
    projectRoot: state.document && state.document.root,
    modified: state.document && state.document.modified,
    name: state.entities.present.result.name,
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

import React, { Component } from "react";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet";
import { connect } from "react-redux";
import debounce from "lodash/debounce";
import {
  Toolbar,
  ToolbarTitle,
  ToolbarSpacer,
  ToolbarFixedSpacer,
  ToolbarButton,
  ToolbarDropdownButton,
  ToolbarSearch
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
import { actions as editorActions } from "../store/features/editor/editorSlice";
import { actions as navigationActions } from "../store/features/navigation/navigationSlice";
import { actions as electronActions } from "../store/features/electron/electronMiddleware";

const sectionNames = {
  world: l10n("NAV_GAME_WORLD"),
  sprites: l10n("NAV_SPRITES"),
  backgrounds: l10n("NAV_BACKGROUNDS"),
  ui: l10n("NAV_UI_ELEMENTS"),
  music: l10n("NAV_MUSIC"),
  palettes: l10n("NAV_PALETTES"),
  dialogue: l10n("NAV_DIALOGUE_REVIEW"),
  build: l10n("NAV_BUILD_AND_RUN"),
  settings: l10n("NAV_SETTINGS")
};

class AppToolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchTerm: props.searchTerm
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { searchTerm } = this.state;
    if(searchTerm && !nextProps.searchTerm) {
      this.setState({
        searchTerm: nextProps.searchTerm
      })
    }
  }

  onZoomIn = e => {
    e.preventDefault();
    e.stopPropagation();
    const { zoomIn, section } = this.props;
    zoomIn({section});
  };

  onZoomOut = e => {
    e.preventDefault();
    e.stopPropagation();
    const { zoomOut, section } = this.props;
    zoomOut({section});
  };

  onZoomReset = e => {
    e.preventDefault();
    e.stopPropagation();
    const { zoomReset, section } = this.props;
    zoomReset({section});
  };

  onRun = async e => {
    const { buildGame } = this.props;
    buildGame({ buildType: "web" });
  };

  onBuild = buildType => e => {
    const { buildGame } = this.props;
    buildGame({ buildType, exportBuild: true });
  };

  onChangeSearchTerm = e => {
    this.setState({
      searchTerm: e.currentTarget.value
    })
    this.onChangeSearchTermDebounced(e.currentTarget.value);
  }

  onChangeSearchTermDebounced = debounce((searchTerm) => {
    const { editSearchTerm } = this.props;
    editSearchTerm(searchTerm);
  }, 300);

  openProjectFolder = e => {
    const { openFolder, projectRoot } = this.props;
    openFolder(projectRoot);
  };

  setSection = section => e => {
    const { setSection } = this.props;
    setSection(section);
  };

  render() {
    const {
      name,
      section = "world",
      zoom,
      showZoom,
      showSearch,
      running,
      modified,
      loaded,
    } = this.props;
    const {
      searchTerm
    } = this.state;

    if (!loaded) {
      return <Toolbar />;
    }

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
        {showSearch && (
        <ToolbarSearch
          placeholder={l10n("TOOLBAR_SEARCH")}
          value={searchTerm || ""}
          onChange={this.onChangeSearchTerm}
          onSubmit={this.onChangeSearchTerm}
          style={{
            // visibility: !showSearch && "hidden",
            width: 133
          }}
        /> 
        )}
       
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
  loaded: PropTypes.bool.isRequired,
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
  showZoom: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string.isRequired,
  showSearch: PropTypes.bool.isRequired,
  editSearchTerm: PropTypes.func.isRequired
};

AppToolbar.defaultProps = {
  name: ""
};

function mapStateToProps(state) {
  const section = state.navigation.section;
  const zoom = zoomForSection(section, state.editor);
  const searchTerm = state.editor.searchTerm;
  const loaded = state.document.loaded;
  return {
    projectRoot: state.document && state.document.root,
    modified: state.document.modified,
    name: state.project.present.metadata.name,
    section,
    zoom,
    showZoom: ["world", "sprites", "backgrounds", "ui"].indexOf(section) > -1,
    running: state.console.status === "running",
    searchTerm,
    showSearch: section === "world",
    loaded,
  };
}

const mapDispatchToProps = {
  setSection: navigationActions.setSection,
  zoomIn: editorActions.zoomIn,
  zoomOut: editorActions.zoomOut,
  zoomReset: editorActions.zoomReset,
  editSearchTerm: actions.editSearchTerm,
  buildGame: actions.buildGame,
  openFolder: electronActions.openFolder
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AppToolbar);

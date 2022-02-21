import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import cx from "classnames";
import GlobalError from "../library/GlobalError";
import AppToolbar from "./AppToolbar";
import BackgroundsPage from "../pages/BackgroundsPage";
import SpritesPage from "../pages/SpritesPage";
import DialoguePage from "../pages/DialoguePage";
import BuildPage from "../pages/BuildPage";
import WorldPage from "../pages/WorldPage";
import MusicPage from "../pages/MusicPage";
import PalettePage from "../pages/PalettePage";
import SettingsPage from "../pages/SettingsPage";
import l10n from "lib/helpers/l10n";
import { ErrorShape } from "store/stateShape";
import LoadingPane from "../library/LoadingPane";
import { DropZone } from "ui/upload/DropZone";
import projectActions from "store/features/project/projectActions";
import { ipcRenderer } from "electron";
import settings from "electron-settings";
import SoundsPage from "components/pages/SoundsPage";

class App extends Component {
  constructor() {
    super();
    this.dragLeaveTimer = 0;
    this.state = {
      blur: false,
      draggingOver: false,
    };
  }

  componentDidMount() {
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("focus", this.onFocus);
    window.addEventListener("resize", this.onFocus);
    window.addEventListener("dragover", this.onDragOver);
    window.addEventListener("dragleave", this.onDragLeave);
    window.addEventListener("drop", this.onDrop);
    const zoomLevel = Number(settings.get("zoomLevel") || 0);
    ipcRenderer.send("window-zoom", zoomLevel);
  }

  onBlur = () => {
    if (!this.state.blur) {
      this.setState({ blur: true });
    }
  };

  onFocus = () => {
    if (this.state.blur) {
      this.setState({ blur: false });
    }
  };

  onDragOver = (e) => {
    // Don't activate dropzone unless dragging a file
    const types = e.dataTransfer.types;
    if (!types || types.indexOf("Files") === -1) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    clearTimeout(this.dragLeaveTimer);
    const { draggingOver } = this.state;
    if (!draggingOver) {
      this.setState({ draggingOver: true });
    }
  };

  onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(this.dragLeaveTimer);
    this.dragLeaveTimer = setTimeout(() => {
      this.setState({ draggingOver: false });
    }, 100);
  };

  onDrop = (e) => {
    const { addFileToProject } = this.props;
    this.setState({ draggingOver: false });
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      const file = e.dataTransfer.files[i];
      addFileToProject(file.path);
    }
  };

  render() {
    const { section, loaded, error } = this.props;
    const { blur, draggingOver } = this.state;

    if (error.visible) {
      return <GlobalError error={error} />;
    }

    return (
      <div
        className={cx("App", {
          "App--Blur": blur,
          "App--RTL": l10n("RTL") === true,
        })}
      >
        <AppToolbar />
        {!loaded ? (
          <LoadingPane />
        ) : (
          <div className="App__Content">
            {section === "world" && <WorldPage />}
            {section === "backgrounds" && <BackgroundsPage />}
            {section === "sprites" && <SpritesPage />}
            {section === "music" && <MusicPage />}
            {section === "sounds" && <SoundsPage />}
            {section === "palettes" && <PalettePage />}
            {section === "dialogue" && <DialoguePage />}
            {section === "build" && <BuildPage />}
            {section === "settings" && <SettingsPage />}
            {draggingOver && <DropZone />}
          </div>
        )}
      </div>
    );
  }
}

App.propTypes = {
  section: PropTypes.oneOf([
    "world",
    "backgrounds",
    "sprites",
    "ui",
    "music",
    "palettes",
    "dialogue",
    "build",
    "settings",
  ]).isRequired,
  loaded: PropTypes.bool.isRequired,
  error: ErrorShape.isRequired,
};

function mapStateToProps(state) {
  return {
    section: state.navigation.section,
    error: state.error,
    loaded: state.document.loaded,
  };
}

const mapDispatchToProps = {
  addFileToProject: projectActions.addFileToProject,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);

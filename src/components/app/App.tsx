import React, {Component} from "react";
import {connect} from "react-redux";
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
import {isRTL} from "lib/helpers/l10n";
import {InternalError} from "store/stateShape";
import LoadingPane from "../library/LoadingPane";
import {DropZone} from "ui/upload/DropZone";
import projectActions from "store/features/project/projectActions";
import {ipcRenderer} from "electron";
import settings from "electron-settings";
import SoundsPage from "components/pages/SoundsPage";
import {NavigationSection} from "store/features/navigation/navigationState";
import {RootState} from "store/configureStore";

interface StateProps {
  section: NavigationSection;
  loaded: boolean;
  error: InternalError;
}

interface ActionProps {
  addFileToProject: typeof projectActions.addFileToProject;
}

type Props = StateProps & ActionProps;

interface State {
  blur: boolean;
  draggingOver: boolean;
}

class App extends Component<Props, State> {
  private dragLeaveTimer: number;

  constructor(props: Props) {
    super(props);
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
      this.setState({blur: true});
    }
  };

  onFocus = () => {
    if (this.state.blur) {
      this.setState({blur: false});
    }
  };

  onDragOver = (e: DragEvent) => {
    const event = e as DragEvent & { dataTransfer: DataTransfer }
    // Don't activate dropzone unless dragging a file
    const types = event.dataTransfer.types;
    if (!types || types.indexOf("Files") === -1) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    clearTimeout(this.dragLeaveTimer);
    const {draggingOver} = this.state;
    if (!draggingOver) {
      this.setState({draggingOver: true});
    }
  };

  onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(this.dragLeaveTimer);
    this.dragLeaveTimer = setTimeout(() => {
      this.setState({draggingOver: false});
    }, 100);
  };

  onDrop = (e: DragEvent) => {
    const event = e as DragEvent & { dataTransfer: DataTransfer }
    const {addFileToProject} = this.props;
    this.setState({draggingOver: false});
    for (let i = 0; i < event.dataTransfer.files.length; i++) {
      const file = event.dataTransfer.files[i];
      addFileToProject(file.path);
    }
  };

  render() {
    const {section, loaded, error} = this.props;
    const {blur, draggingOver} = this.state;

    if (error.visible) {
      return <GlobalError error={error}/>;
    }

    return (
      <div
        className={cx("App", {
          "App--Blur": blur,
          "App--RTL": isRTL(),
        })}
      >
        <AppToolbar/>
        {!loaded ? (
          <LoadingPane/>
        ) : (
          <div className="App__Content">
            {section === "world" && <WorldPage/>}
            {section === "backgrounds" && <BackgroundsPage/>}
            {section === "sprites" && <SpritesPage/>}
            {section === "music" && <MusicPage/>}
            {section === "sounds" && <SoundsPage/>}
            {section === "palettes" && <PalettePage/>}
            {section === "dialogue" && <DialoguePage/>}
            {section === "build" && <BuildPage/>}
            {section === "settings" && <SettingsPage/>}
            {draggingOver && <DropZone/>}
          </div>
        )}
      </div>
    );
  }
}

function mapStateToProps(state: RootState) {
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

import React, {ChangeEvent, Component} from "react";
import {connect} from "react-redux";
import Button from "../library/Button";
import {PauseIcon, PlayIcon} from "ui/icons/Icons";
import l10n from "lib/helpers/l10n";
import musicActions from "store/features/music/musicActions";
import electronActions from "store/features/electron/electronActions";
import entitiesActions from "store/features/entities/entitiesActions";
import {RootState} from "store/configureStore";

interface StateProps {
  projectRoot: string;
  file: {
    id: string;
    filename: string;
    settings: {
      disableSpeedConversion: boolean;
    };
  };
  sidebarWidth: number;
  playing: boolean;
}

interface ActionProps {
  play: (args: { musicId: string }) => void;
  pause: () => void;
  openFile: (args: { filename: string; type: "image" | "music" }) => void;
  editMusicSettings: (args: { musicId: string; changes: any }) => void;
}

type Props = StateProps & ActionProps;

class MusicViewer extends Component<Props> {
  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  onOpen = () => {
    const {projectRoot, file, openFile} = this.props;
    openFile({
      filename: `${projectRoot}/assets/music/${file.filename}`,
      type: "music",
    });
  };

  onPlay = () => {
    const {file, play} = this.props;
    if (file) {
      play({musicId: file.id});
    }
  };

  onPause = () => {
    const {pause} = this.props;
    pause();
  };

  onKeyDown = (e: KeyboardEvent) => {
    const {playing} = this.props;
    if (e.key === "Enter") {
      if (playing) {
        this.onPause();
      } else {
        this.onPlay();
      }
    }
  };

  onChangeSpeedConversion = (e: ChangeEvent<HTMLInputElement>) => {
    const {file, editMusicSettings} = this.props;
    editMusicSettings({
      musicId: file.id,
      changes: {
        disableSpeedConversion: e.currentTarget.checked,
      },
    });
  };

  render() {
    const {file, playing, sidebarWidth} = this.props;
    return (
      <div className="MusicViewer" style={{right: sidebarWidth}}>
        {file && (
          <div className="MusicViewer__Content">
            {playing ? (
              <Button large transparent onClick={this.onPause}>
                <PauseIcon/>
              </Button>
            ) : (
              <Button large transparent onClick={this.onPlay}>
                <PlayIcon/>
              </Button>
            )}
            <div className="MusicViewer__Filename">{file.filename}</div>
            <div className="MusicViewer__Settings">
              <div className="FormField">
                <label htmlFor="disableSpeedConversion">
                  <input
                    id="disableSpeedConversion"
                    type="checkbox"
                    onChange={this.onChangeSpeedConversion}
                    checked={
                      (file.settings && file.settings.disableSpeedConversion) ||
                      false
                    }
                  />
                  <div className="FormCheckbox"/>
                  {l10n("FIELD_MUSIC_DISABLE_SPEED_CONVERSION")}
                </label>
              </div>
            </div>
          </div>
        )}
        {file && (
          <div className="ImageViewer__Edit" style={{right: 10}}>
            <Button onClick={this.onOpen}>{l10n("ASSET_EDIT")}</Button>
          </div>
        )}
      </div>
    );
  }
}

function mapStateToProps(state: RootState, ownProps: any): StateProps {
  const {filesSidebarWidth: sidebarWidth} = state.editor;
  return {
    projectRoot: state.document && state.document.root,
    playing: state.music.playing,
    sidebarWidth,
    file: ownProps.file,
  };
}

const mapDispatchToProps = {
  play: musicActions.playMusic,
  pause: musicActions.pauseMusic,
  openFile: electronActions.openFile,
  editMusicSettings: entitiesActions.editMusicSettings,
};

export default connect(mapStateToProps, mapDispatchToProps)(MusicViewer);

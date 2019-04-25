import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import Button from "../library/Button";
import { PlayIcon, PauseIcon } from "../library/Icons";
import l10n from "../../lib/helpers/l10n";

class MusicViewer extends Component {
  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  componentWillReceiveProps(nextProps) {
    const { projectRoot, file } = nextProps;
    const oldFile = this.props.file;

    if (file && (!oldFile || file.filename != oldFile.filename)) {
      const url =
        file &&
        `${projectRoot}/assets/music/${file.filename}?v=${file._v || 0}`;

      console.log({ url });
    }
  }

  onOpen = () => {
    const { projectRoot, file } = this.props;
    this.props.openFolder(`${projectRoot}/assets/music/${file.filename}`);
  };

  onPlay = () => {
    const { projectRoot, file } = this.props;
    if (file) {
      const filename = `${projectRoot}/assets/music/${file.filename}`;
      this.props.playMusic(filename);
    }
  };

  onPause = () => {
    this.props.pauseMusic();
  };

  onKeyDown = e => {
    const { playing } = this.props;
    if (e.key === "Enter") {
      if (playing) {
        this.onPause();
      } else {
        this.onPlay();
      }
    }
  };

  render() {
    const { projectRoot, file, playing } = this.props;
    return (
      <div className="MusicViewer">
        {file && (
          <div className="MusicViewer__Content">
            {playing ? (
              <Button large transparent onClick={this.onPause}>
                <PauseIcon />
              </Button>
            ) : (
              <Button large transparent onClick={this.onPlay}>
                <PlayIcon />
              </Button>
            )}
            <div className="MusicViewer__Filename">{file.filename}</div>
          </div>
        )}
        {file && (
          <div className="ImageViewer__Edit">
            <Button onClick={this.onOpen}>{l10n("ASSET_EDIT")}</Button>
          </div>
        )}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    projectRoot: state.document && state.document.root,
    playing: state.music.playing
  };
}

const mapDispatchToProps = {
  playMusic: actions.playMusic,
  pauseMusic: actions.pauseMusic,
  openFolder: actions.openFolder
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MusicViewer);

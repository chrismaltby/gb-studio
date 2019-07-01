import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as actions from "../../actions";
import Button from "../library/Button";
import { PlayIcon, PauseIcon } from "../library/Icons";
import l10n from "../../lib/helpers/l10n";
import { assetFilename } from "../../lib/helpers/gbstudio";

class MusicViewer extends Component {
  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  onOpen = () => {
    const { projectRoot, file, openFolder } = this.props;
    openFolder(`${projectRoot}/assets/music/${file.filename}`);
  };

  onPlay = () => {
    const { projectRoot, file, playMusic } = this.props;
    if (file) {
      const filename = assetFilename(projectRoot, "music", file);
      playMusic(filename);
    }
  };

  onPause = () => {
    const { pauseMusic } = this.props;
    pauseMusic();
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
    const { file, playing, sidebarWidth } = this.props;
    return (
      <div className="MusicViewer" style={{ right: sidebarWidth }}>
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
          <div
            className="ImageViewer__Edit"
            style={{ right: sidebarWidth + 10 }}
          >
            <Button onClick={this.onOpen}>{l10n("ASSET_EDIT")}</Button>
          </div>
        )}
      </div>
    );
  }
}

MusicViewer.propTypes = {
  projectRoot: PropTypes.string.isRequired,
  file: PropTypes.shape({
    id: PropTypes.string.isRequired,
    filename: PropTypes.string.isRequired
  }),
  sidebarWidth: PropTypes.number.isRequired,
  playing: PropTypes.bool.isRequired,
  playMusic: PropTypes.func.isRequired,
  pauseMusic: PropTypes.func.isRequired,
  openFolder: PropTypes.func.isRequired
};

MusicViewer.defaultProps = {
  file: {}
};

function mapStateToProps(state) {
  const { filesSidebarWidth: sidebarWidth } = state.settings;
  return {
    projectRoot: state.document && state.document.root,
    playing: state.music.playing,
    sidebarWidth
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

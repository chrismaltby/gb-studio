import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import { PlayIcon, PauseIcon } from "../library/Icons";
import Button from "../library/Button";

class MusicSelect extends Component {
  onPlay = () => {
    const { projectRoot, music, value } = this.props;
    const file = music.find(track => track.id === value) || music[0];
    if (file) {
      const filename = `${projectRoot}/assets/music/${file.filename}`;
      this.props.playMusic(filename);
    }
  };

  onPause = () => {
    this.props.pauseMusic();
  };

  render() {
    const {
      music,
      dispatch,
      playing,
      projectRoot,
      playMusic,
      pauseMusic,
      ...rest
    } = this.props;
    const current = music.find(m => m.id === rest.value);
    return (
      <div className="MusicSelect">
        <select {...rest}>
          {!current && <option value="" />}
          {music.map(track => (
            <option key={track.id} value={track.id}>
              {track.name}
            </option>
          ))}
        </select>
        <div className="MusicSelect__Preview">
          {rest.value && current && (
            <div>
              {playing ? (
                <Button small transparent onClick={this.onPause}>
                  <PauseIcon />
                </Button>
              ) : (
                <Button small transparent onClick={this.onPlay}>
                  <PlayIcon />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    music: (state.project.present && state.project.present.music) || [],
    projectRoot: state.document && state.document.root,
    playing: state.music.playing
  };
}

const mapDispatchToProps = {
  playMusic: actions.playMusic,
  pauseMusic: actions.pauseMusic
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MusicSelect);

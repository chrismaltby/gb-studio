import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as actions from "../../actions";
import { PlayIcon, PauseIcon } from "../library/Icons";
import Button from "../library/Button";
import { MusicShape } from "../../reducers/stateShape";

class MusicSelect extends Component {
  onPlay = () => {
    const { projectRoot, music, value, playMusic } = this.props;
    const file = music.find(track => track.id === value) || music[0];
    if (file) {
      const filename = `${projectRoot}/assets/music/${file.filename}`;
      playMusic(filename);
    }
  };

  onPause = () => {
    const { pauseMusic } = this.props;
    pauseMusic();
  };

  render() {
    const { music, playing, id, value, onChange } = this.props;
    const current = music.find(m => m.id === value);
    return (
      <div className="MusicSelect">
        <select id={id} value={value} onChange={onChange}>
          {!current && <option value="" />}
          {music.map(track => (
            <option key={track.id} value={track.id}>
              {track.name}
            </option>
          ))}
        </select>
        <div className="MusicSelect__Preview">
          {value && current && (
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

MusicSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  music: PropTypes.arrayOf(MusicShape).isRequired,
  projectRoot: PropTypes.string.isRequired,
  playing: PropTypes.bool.isRequired,
  playMusic: PropTypes.func.isRequired,
  pauseMusic: PropTypes.func.isRequired
};

MusicSelect.defaultProps = {
  id: undefined,
  value: ""
};

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

import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import * as actions from "../../actions";
import { PlayIcon, PauseIcon } from "../library/Icons";
import Button from "../library/Button";
import { MusicShape } from "../../reducers/stateShape";
import { groupBy } from "../../lib/helpers/array";
import { assetFilename } from "../../lib/helpers/gbstudio";
import { getMusic } from "../../reducers/entitiesReducer";

const groupByPlugin = groupBy("plugin");

class MusicSelect extends Component {
  onPlay = id => {
    const { projectRoot, music, value, playMusic } = this.props;
    const playId = id || value;
    const file = music.find(track => track.id === playId) || music[0];
    if (file) {
      const filename = assetFilename(projectRoot, "music", file);
      playMusic(filename);
    }
  };

  onPause = () => {
    const { pauseMusic } = this.props;
    pauseMusic();
  };

  renderDropdownIndicator = props => {
    const { playing } = this.props;
    return (
      <components.DropdownIndicator {...props}>
        {playing ? (
          <Button
            small
            transparent
            onMouseDown={e => {
              e.stopPropagation();
              e.preventDefault();
              this.onPause();
            }}
          >
            <PauseIcon />
          </Button>
        ) : (
          <Button
            small
            transparent
            onMouseDown={e => {
              e.stopPropagation();
              e.preventDefault();
              this.onPlay();
            }}
          >
            <PlayIcon />
          </Button>
        )}
      </components.DropdownIndicator>
    );
  };

  renderOption = props => {
    const { value, label } = props;
    return (
      <components.Option {...props}>
        <div style={{ display: "flex" }}>
          <div style={{ flexGrow: 1 }}>{label}</div>
          <Button
            small
            transparent
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              this.onPlay(value);
            }}
          >
            <PlayIcon />
          </Button>
        </div>
      </components.Option>
    );
  };

  render() {
    const { music, id, value, onChange } = this.props;
    const current = music.find(m => m.id === value);
    const groupedMusic = groupByPlugin(music);
    const options = Object.keys(groupedMusic)
      .sort()
      .reduce((memo, plugin) => {
        if (!plugin) {
          return [].concat(
            memo,
            groupedMusic[plugin].map(track => {
              return {
                label: track.name,
                value: track.id
              };
            })
          );
        }
        memo.push({
          label: plugin,
          options: groupedMusic[plugin].map(track => {
            return {
              label: track.name,
              value: track.id
            };
          })
        });
        return memo;
      }, []);

    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        options={options}
        value={{ label: current ? current.name : "", value }}
        onChange={data => {
          this.onPause();
          onChange(data.value);
        }}
        components={{
          DropdownIndicator: this.renderDropdownIndicator,
          Option: this.renderOption
        }}
      />
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
    music: getMusic(state),
    projectRoot: state.document.root,
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

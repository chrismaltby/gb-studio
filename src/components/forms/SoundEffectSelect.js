import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import * as actions from "../../actions";
import { PlayIcon } from "../library/Icons";
import Button from "../library/Button";
import l10n from "../../lib/helpers/l10n";

const options = [
  {
    label: l10n("FIELD_EFFECT_BEEP"),
    value: "beep"
  },
  {
    label: l10n("FIELD_EFFECT_TONE"),
    value: "tone"
  },
  {
    label: l10n("FIELD_EFFECT_CRASH"),
    value: "crash"
  }
];

class SoundEffectSelect extends Component {
  onPlay = type => {
    const {
      value,
      playSoundFxBeep,
      playSoundFxTone,
      playSoundFxCrash,
      pitch,
      frequency,
      duration
    } = this.props;
    const playType = type || value;
    if (playType === "beep") {
      playSoundFxBeep(pitch);
    } else if (playType === "tone") {
      playSoundFxTone(frequency, duration);
    } else if (playType === "crash") {
      playSoundFxCrash();
    }
  };

  renderDropdownIndicator = props => {
    return (
      <components.DropdownIndicator {...props}>
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
    const { id, value, onChange } = this.props;

    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        options={options}
        value={options.find(o => o.value === value)}
        onChange={data => {
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

SoundEffectSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  pitch: PropTypes.number,
  frequency: PropTypes.number,
  duration: PropTypes.number,
  playSoundFxBeep: PropTypes.func.isRequired,
  playSoundFxTone: PropTypes.func.isRequired,
  playSoundFxCrash: PropTypes.func.isRequired
};

SoundEffectSelect.defaultProps = {
  id: undefined,
  value: "",
  pitch: 4,
  frequency: 200,
  duration: 0.5
};

function mapStateToProps(state) {
  return {};
}

const mapDispatchToProps = {
  playSoundFxBeep: actions.playSoundFxBeep,
  playSoundFxTone: actions.playSoundFxTone,
  playSoundFxCrash: actions.playSoundFxCrash
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SoundEffectSelect);

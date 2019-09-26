import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import ActorCanvas from "../world/ActorCanvas";
import { ActorShape } from "../../reducers/stateShape";
import { getSceneActors } from "../../reducers/entitiesReducer";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";

class SceneActorSelect extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("SceneActorSelect", this.props, {}, nextProps, {});
    return true;
  }

  defaultValue = () => {
    const { playerSpriteSheetId } = this.props;
    return {
      name: "Player",
      spriteSheetId: playerSpriteSheetId,
      movementType: "player"
    };
  };

  renderDropdownIndicator = props => {
    const { actors, value, direction, frame } = this.props;
    const actor = actors.find(a => a.id === value) || this.defaultValue();
    if (!actor) {
      return <components.DropdownIndicator {...props} />;
    }

    return (
      <components.DropdownIndicator {...props}>
        <ActorCanvas actor={actor} direction={direction} frame={frame} />
      </components.DropdownIndicator>
    );
  };

  renderOption = props => {
    const { actors, direction, frame } = this.props;
    const { label, value } = props;
    const actor = actors.find(a => a.id === value) || this.defaultValue();
    if (!actor) {
      return <components.Option {...props} />;
    }

    return (
      <components.Option {...props}>
        <div style={{ display: "flex" }}>
          <div style={{ flexGrow: 1 }}>{label}</div>
          <ActorCanvas actor={actor} direction={direction} frame={frame} />
        </div>
      </components.Option>
    );
  };

  render() {
    const { actors, playerSpriteSheetId, id, value, onChange } = this.props;

    const defaultValue = {
      name: "Player",
      spriteSheetId: playerSpriteSheetId,
      movementType: "player"
    };
    const current = actors.find(a => a.id === value) || defaultValue;
    const currentIndex = actors.indexOf(current);

    const options = [].concat(
      {
        value: "player",
        label: "Player"
      },
      actors.map((a, index) => {
        return {
          value: a.id,
          label: a.name || `Actor ${index + 1}`,
          spriteSheetId: a.spriteSheetId
        };
      })
    );

    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        options={options}
        value={
          current && {
            label: current.name || `Actor ${currentIndex + 1}`,
            value
          }
        }
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

SceneActorSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  playerSpriteSheetId: PropTypes.string,
  actors: PropTypes.arrayOf(ActorShape).isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number
};

SceneActorSelect.defaultProps = {
  id: "",
  value: "",
  playerSpriteSheetId: "",
  frame: undefined,
  direction: undefined
};

function mapStateToProps(state) {
  const actors = getSceneActors(state, { id: state.editor.scene });
  const settings = state.entities.present.result.settings;
  const playerSpriteSheetId = settings.playerSpriteSheetId;
  return {
    actors,
    playerSpriteSheetId
  };
}

export default connect(mapStateToProps)(SceneActorSelect);

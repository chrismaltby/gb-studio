import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import ActorCanvas from "../world/ActorCanvas";
import { ActorShape } from "../../reducers/stateShape";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";

const allProcedureActors = Array.from(Array(10).keys()).map(i => 
  ({ 
    id : String(i),
    name: `Actor ${String.fromCharCode('A'.charCodeAt(0) + i)}`
  })
);

class ProcedureActorSelect extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("ProcedureActorSelect", this.props, {}, nextProps, {});
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
    const { value, direction, frame } = this.props;
    const actor = allProcedureActors.find(a => a.id === value) || this.defaultValue();
    if (!actor || (actor && !actor.spriteSheetId)) {
      return <components.DropdownIndicator {...props} />;
    }

    return (
      <components.DropdownIndicator {...props}>
        <ActorCanvas actor={actor} direction={direction} frame={frame} />
      </components.DropdownIndicator>
    );
  };

  renderOption = props => {
    const { direction, frame } = this.props;
    const { label, value } = props;
    const actor = allProcedureActors.find(a => a.id === value) || this.defaultValue();
    if (!actor || (actor && !actor.spriteSheetId)) {
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

  getOptions = () => {
    const { actors } = this.props;
    return [].concat(
      {
        value: "player",
        label: "Player"
      },
      allProcedureActors.map((a, index) => {
        return {
          value: String(a.id),
          label: actors[index] ? actors[index].name : a.name || `Actor ${index + 1}`,
          spriteSheetId: a.spriteSheetId
        };
      })
    );
  };

  render() {
    const { actors, playerSpriteSheetId, id, value, onChange } = this.props;

    const defaultValue = {
      name: "Player",
      spriteSheetId: playerSpriteSheetId,
      movementType: "player"
    };
    const current = allProcedureActors.find(a => a.id === value) || defaultValue;
    const currentIndex = allProcedureActors.indexOf(current);
    const options = this.getOptions()

    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        options={options}
        value={
          current && {
            label: actors[currentIndex] ? actors[currentIndex].name : current.name || `Actor ${currentIndex + 1}`,
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

ProcedureActorSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  playerSpriteSheetId: PropTypes.string,
  actors: PropTypes.arrayOf(ActorShape).isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number
};

ProcedureActorSelect.defaultProps = {
  id: "",
  value: "",
  playerSpriteSheetId: "",
  frame: undefined,
  direction: undefined
};

function mapStateToProps(state) {
  const actors = Object.values(state.entities.present.entities.procedures[state.editor.entityId].actors || {});
  const settings = state.entities.present.result.settings;
  const playerSpriteSheetId = settings.playerSpriteSheetId;
  return {
    actors,
    playerSpriteSheetId
  };
}

export default connect(mapStateToProps)(ProcedureActorSelect);

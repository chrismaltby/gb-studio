import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import ActorCanvas from "../world/ActorCanvas";
import { ActorShape } from "../../reducers/stateShape";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";

const allCustomEventActors = Array.from(Array(10).keys()).map(i => ({
  id: String(i),
  name: `Actor ${String.fromCharCode("A".charCodeAt(0) + i)}`
}));

class CustomEventActorSelect extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    rerenderCheck("CustomEventActorSelect", this.props, {}, nextProps, {});
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
    const actor =
      allCustomEventActors.find(a => a.id === value) || this.defaultValue();
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
    const actor =
      allCustomEventActors.find(a => a.id === value) || this.defaultValue();
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
      allCustomEventActors.map((actor, index) => {
        const namedActor = actors.find(a => a.id === actor.id);
        return {
          value: String(actor.id),
          label: namedActor
            ? namedActor.name
            : actor.name || `Actor ${index + 1}`,
          spriteSheetId: actor.spriteSheetId
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
    const current = actors.find(a => a.id === value) || defaultValue;
    const currentIndex = allCustomEventActors.indexOf(current);
    const options = this.getOptions();

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

CustomEventActorSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  playerSpriteSheetId: PropTypes.string,
  actors: PropTypes.arrayOf(ActorShape).isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number
};

CustomEventActorSelect.defaultProps = {
  id: "",
  value: "",
  playerSpriteSheetId: "",
  frame: undefined,
  direction: undefined
};

function mapStateToProps(state) {
  const customEventId = state.editor.entityId;
  const actors = Object.values(
    state.entities.present.entities.customEvents[customEventId].actors
  );
  const settings = state.entities.present.result.settings;
  const playerSpriteSheetId = settings.playerSpriteSheetId;
  return {
    actors,
    playerSpriteSheetId
  };
}

export default connect(mapStateToProps)(CustomEventActorSelect);

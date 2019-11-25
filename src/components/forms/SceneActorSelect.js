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

  actorName = actor => {
    const { actors } = this.props;
    return actor.name || `Actor ${actors.indexOf(actor) + 1}`;
  }

  renderDropdownIndicator = props => {
    const { actors, value, direction, frame, context } = this.props;
    const actorId = value === "$self$" && context.type === "actors" ? context.entityId : value;
    const actor = actors.find(a => a.id === actorId) || this.defaultValue();
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
    const { actors, direction, frame, context } = this.props;
    const { label, value } = props;
    const actorId = value === "$self$" && context.type === "actors" ? context.entityId : value;
    const actor = actors.find(a => a.id === actorId) || this.defaultValue();
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
    const { actors, id, value, onChange, context } = this.props;

    let current; 
    let currentName;
    let selfOption = [];
    
    if (context.type === "actors") {
      const selfActor = actors.find(a => a.id === context.entityId);
      const selfName = `Self (${this.actorName(selfActor)})`;
      selfOption = [ 
        { 
          value: "$self$", 
          label: selfName, 
          spriteSheetId: selfActor.spriteSheetId
        } 
      ];

      if (value === "$self$") {
        current = selfActor;
        currentName = selfName;
      } else {
        current = actors.find(a => a.id === value) || this.defaultValue();
        currentName = this.actorName(current);
      }     
    } else {
      if (value === "$self$ ") {
        current = this.defaultValue();
      } else {
        current = actors.find(a => a.id === value) || this.defaultValue();
      }
      currentName = this.actorName(current);
    }
    
    const options = selfOption.concat(
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
          {
            label: currentName,
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
  frame: PropTypes.number,
  context: PropTypes.shape({
    type: PropTypes.string.isRequired,
    entityId: PropTypes.string.isRequired
  }).isRequired
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
  const context = {
    type: state.editor.type,
    entityId: state.editor.entityId
  };
  return {
    actors,
    playerSpriteSheetId,
    context
  };
}

export default connect(mapStateToProps)(SceneActorSelect);

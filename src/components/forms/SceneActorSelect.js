import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import ActorCanvas from "../world/ActorCanvas";
import { ActorShape } from "../../reducers/stateShape";
import {
  getSceneActorIds,
  getActorsLookup,
  getSettings,
} from "../../reducers/entitiesReducer";
import { getCachedObject } from "../../lib/helpers/cache";

// Dropdown Indicator ---------------------------------------------------------

const DropdownIndicator = ({ actor, direction, frame, ...props }) => {
  if (!actor) {
    return <components.DropdownIndicator {...props} />;
  }
  return (
    <components.DropdownIndicator {...props}>
      <ActorCanvas actor={actor} direction={direction} frame={frame} />
    </components.DropdownIndicator>
  );
};

DropdownIndicator.propTypes = {
  actor: ActorShape,
  direction: PropTypes.string,
  frame: PropTypes.number,
};

DropdownIndicator.defaultProps = {
  actor: undefined,
  direction: undefined,
  frame: undefined,
};

const DropdownIndicatorWithData = (actorId, direction, frame) =>
  connect((state) => {
    const actorsLookup = getActorsLookup(state);
    const settings = getSettings(state);
    const playerSpriteSheetId = settings.playerSpriteSheetId;
    const actor =
      actorsLookup[actorId] ||
      getCachedObject({
        id: "player",
        spriteSheetId: playerSpriteSheetId,
      });
    return {
      actor,
      direction,
      frame,
    };
  })(DropdownIndicator);

// Option -------------------------------------------------------------------

const Option = ({ label, value, actor, direction, frame, ...props }) => {
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

Option.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  actor: ActorShape,
  direction: PropTypes.string,
  frame: PropTypes.number,
};

Option.defaultProps = {
  actor: undefined,
  direction: undefined,
  frame: undefined,
};

const OptionWithData = connect((state, ownProps) => {
  const actorsLookup = getActorsLookup(state);
  const settings = getSettings(state);
  const playerSpriteSheetId = settings.playerSpriteSheetId;
  const {
    value,
    label: actorIndex,
    data: { contextEntityId },
  } = ownProps;
  const actor =
    actorsLookup[value] ||
    actorsLookup[contextEntityId] ||
    getCachedObject({
      id: "player",
      name: "Player",
      spriteSheetId: playerSpriteSheetId,
    });
  const label =
    value === "$self$" ? "Self" : actor.name || `Actor ${actorIndex + 1}`;
  return {
    label,
    actor,
  };
})(Option);

// Select -------------------------------------------------------------------

class SceneActorSelect extends Component {
  render() {
    const {
      actorIds,
      id,
      label,
      value,
      onChange,
      direction,
      frame,
      contextType,
      contextEntityId,
    } = this.props;

    const actorId =
      value === "$self$" && contextType === "actors" ? contextEntityId : value;

    const options = [].concat(
      contextType === "actors"
        ? {
            value: "$self$",
            label: "Self",
            contextEntityId,
          }
        : [],
      {
        value: "player",
        label: "Player",
      },
      actorIds.map((sceneId, sceneIndex) => ({
        value: sceneId,
        label: sceneIndex,
      }))
    );

    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        options={options}
        value={{
          label,
          value,
        }}
        onChange={(data) => {
          onChange(data.value);
        }}
        components={{
          DropdownIndicator: DropdownIndicatorWithData(
            actorId,
            direction,
            frame
          ),
          Option: OptionWithData,
        }}
        menuPlacement="auto"
      />
    );
  }
}

SceneActorSelect.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  actorIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number,
  contextType: PropTypes.string.isRequired,
  contextEntityId: PropTypes.string.isRequired,
};

SceneActorSelect.defaultProps = {
  id: "",
  label: "",
  value: "",
  frame: undefined,
  direction: undefined,
};

function mapStateToProps(state, ownProps) {
  const actorIds = getSceneActorIds(state, { id: state.editor.scene });
  const actorsLookup = getActorsLookup(state);
  const settings = state.entities.present.result.settings;
  const playerSpriteSheetId = settings.playerSpriteSheetId;
  const contextType = state.editor.type;
  const contextEntityId = state.editor.entityId;
  const value = ownProps.value;
  const actorId = value === "$self$" ? contextEntityId : value;
  const actorIndex = actorIds.indexOf(actorId);
  const actor =
    value === "$self$"
      ? actorsLookup[actorId]
      : getCachedObject({
          id: "player",
          spriteSheetId: playerSpriteSheetId,
        });
  const actorName = actor ? actor.name || `Actor ${actorIndex + 1}` : "";
  const label =
    value === "player"
      ? "Player"
      : value === "$self$"
      ? `Self (${actorName})`
      : actorName;
  return {
    label,
    actorIds,
    playerSpriteSheetId,
    contextType,
    contextEntityId,
  };
}

export default connect(mapStateToProps)(SceneActorSelect);

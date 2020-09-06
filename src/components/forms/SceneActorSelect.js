import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import ActorCanvas from "../world/ActorCanvas";
import { ActorShape } from "../../store/stateShape";
import {
  getSettings,
} from "../../store/features/settings/settingsSlice";
import { getCachedObject, createCacheFunction } from "../../lib/helpers/cache";
import { actorSelectors, getSceneActorIds } from "../../store/features/entities/entitiesSlice";

const menuPortalEl = document.getElementById("MenuPortal");

const cachedObj = createCacheFunction();

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

const DropdownIndicatorWithData = (direction, frame) =>
  connect((state, ownProps) => {
    const actorId = ownProps.selectProps.value.id;
    const actorsLookup = actorSelectors.selectEntities(state);
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
  const actorsLookup = actorSelectors.selectEntities(state);
  const settings = getSettings(state);
  const playerSpriteSheetId = settings.playerSpriteSheetId;
  const {
    value,
    label,
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
  return {
    label,
    actor,
  };
})(Option);

// Select -------------------------------------------------------------------

class SceneActorSelect extends Component {
  render() {
    const {
      selectedIndex,
      options,
      id,
      onChange,
      direction,
      frame,
    } = this.props;

    const selectedOption = options[selectedIndex] || options[0];

    return (
      <Select
        id={id}
        className="ReactSelectContainer"
        classNamePrefix="ReactSelect"
        options={options}
        value={selectedOption}
        onChange={(data) => {
          onChange(data.value);
        }}
        components={{
          DropdownIndicator: DropdownIndicatorWithData(
            direction,
            frame
          ),
          Option: OptionWithData,
        }}
        menuPlacement="auto"
        menuPortalTarget={menuPortalEl}
        blurInputOnSelect
      />
    );
  }
}

const OptionShape = PropTypes.shape({
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
});

SceneActorSelect.propTypes = {
  id: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number,
  options: PropTypes.arrayOf(OptionShape.isRequired).isRequired,
  selectedIndex: PropTypes.number.isRequired,  
};

SceneActorSelect.defaultProps = {
  id: "",
  frame: undefined,
  direction: undefined,
};

function mapStateToProps(state, ownProps) {
  const actorIds = getSceneActorIds(state, { id: state.editor.scene });
  const actorsLookup = actorSelectors.selectEntities(state);
  const contextType = state.editor.type;
  const contextEntityId = state.editor.entityId;
  const value = ownProps.value;

  const selfIndex = actorIds.indexOf(contextEntityId);
  const selfActor = actorsLookup[contextEntityId];
  const selfActorName = selfActor ? selfActor.name || `Actor ${selfIndex + 1}` : "";

  const options = cachedObj(
    [].concat(
      contextType === "actor"
        ? {
            value: "$self$",
            label: `Self (${selfActorName})`,
            id: contextEntityId,
          }
        : [],
      {
        value: "player",
        label: "Player",
        id: "player"
      },
      actorIds.map((actorId, actorIndex) => {
        const actor = actorsLookup[actorId];
        const label = actor.name || `Actor ${actorIndex + 1}`;
        return {
          value: actorId,
          label,
          id: actorId
        };
      })
    )
  );

  const selectedIndex = options.findIndex((option) => option.value === value);

  return {
    options,
    selectedIndex,
  };
}

export default connect(mapStateToProps)(SceneActorSelect);

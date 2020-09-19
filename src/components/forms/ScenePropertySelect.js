import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import ActorCanvas from "../world/ActorCanvas";
import { ActorShape } from "../../store/stateShape";
import { getCachedObject } from "../../lib/helpers/cache";
import l10n from "../../lib/helpers/l10n";
import { actorSelectors, getSceneActorIds } from "../../store/features/entities/entitiesState";
import { getSettings } from "../../store/features/settings/settingsState";

const menuPortalEl = document.getElementById("MenuPortal");

const properties = {
  xpos: l10n("FIELD_X_POSITION"),
  ypos: l10n("FIELD_Y_POSITION"),
  direction: l10n("FIELD_DIRECTION"),
  moveSpeed: l10n("FIELD_MOVEMENT_SPEED"),
  animSpeed: l10n("FIELD_ANIMATION_SPEED"),
  frame: l10n("FIELD_ANIMATION_FRAME"),
};

// Group

const Group = ({ label, actor, ...props }) => {
  if (!actor) {
    return <components.Group {...props} />;
  }
  return (
    <components.Group
      {...props}
      label={
        <>
          {label}
          <div style={{ position: "absolute", right: 5, marginTop: 7 }}>
            <ActorCanvas actor={actor} />
          </div>
        </>
      }
    />
  );
};

const GroupWithData = connect((state, ownProps) => {
  const actorsLookup = actorSelectors.selectEntities(state);
  const actorIds = getSceneActorIds(state, { id: state.editor.scene });
  const settings = getSettings(state);
  const playerSpriteSheetId = settings.playerSpriteSheetId;
  const {
    data: { actorId, contextEntityId },
  } = ownProps;
  const actor =
    actorsLookup[actorId] ||
    actorsLookup[contextEntityId] ||
    getCachedObject({
      id: "player",
      name: "Player",
      spriteSheetId: playerSpriteSheetId,
    });
  const actorIndex = actorIds.indexOf(actor.id);
  const actorName = actor ? actor.name || `Actor ${actorIndex + 1}` : "";
  let label = actorName;
  if (actorId === "player") {
    label = "Player";
  } else if (actorId === "$self$") {
    label = `Self (${actorName})`;
  }

  return {
    label,
    actor,
  };
})(Group);

// Dropdown Indicator ---------------------------------------------------------

const DropdownIndicator = ({ actor, ...props }) => {
  if (!actor) {
    return <components.DropdownIndicator {...props} />;
  }
  return (
    <components.DropdownIndicator {...props}>
      <ActorCanvas actor={actor} />
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

const DropdownIndicatorWithData = (actorId) =>
  connect((state) => {
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
    };
  })(DropdownIndicator);

// Select -------------------------------------------------------------------

class ScenePropertySelect extends Component {
  render() {
    const {
      actorIds,
      id,
      label,
      value,
      onChange,
      contextType,
      contextEntityId,
    } = this.props;

    const actorValue = value && value.replace(/:.*/, "");

    const generateActorOptions = (id) => {
      return Object.keys(properties).map((property) => ({
        label: properties[property],
        value: `${id}:${property}`,
      }));
    };

    const selectedActorId =
      actorValue === "$self$" && contextType === "actor"
        ? contextEntityId
        : actorValue;

    const options = [].concat(
      contextType === "actor"
        ? {
            actorId: "$self$",
            contextEntityId,
            options: generateActorOptions("$self$"),
          }
        : [],
      {
        actorId: "player",
        options: generateActorOptions("player"),
      },
      actorIds.map((actorId) => ({
        actorId,
        options: generateActorOptions(actorId),
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
          DropdownIndicator: DropdownIndicatorWithData(selectedActorId),
          Group: GroupWithData,
        }}
        grouped
        menuPlacement="auto"
        menuPortalTarget={menuPortalEl}
        blurInputOnSelect
      />
    );
  }
}

ScenePropertySelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  actorIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  contextType: PropTypes.string.isRequired,
  contextEntityId: PropTypes.string.isRequired,
};

ScenePropertySelect.defaultProps = {
  id: "",
  label: "",
  value: "",
};

function mapStateToProps(state, ownProps) {
  const actorIds = getSceneActorIds(state, { id: state.editor.scene });
  const actorsLookup = actorSelectors.selectEntities(state);

  const contextType = state.editor.type;
  const contextEntityId = state.editor.entityId;

  const value = ownProps.value;
  const actorValue = value && value.replace(/:.*/, "");
  const propertyValue = value && value.replace(/.*:/, "");

  const actorId = actorValue === "$self$" ? contextEntityId : actorValue;
  const actorIndex = actorIds.indexOf(actorId);
  const actor =
    actorsLookup[actorId] ||
    getCachedObject({
      id: "player",
    });
  const actorName = actor ? actor.name || `Actor ${actorIndex + 1}` : "";
  let actorLabel = actorName;
  if (
    actorValue === "player" ||
    (actorValue === "$self$" && contextType !== "actor")
  ) {
    actorLabel = "Player";
  } else if (actorValue === "$self$") {
    actorLabel = `Self (${actorName})`;
  }
  const label = `${properties[propertyValue]} : ${actorLabel}`;

  return {
    label,
    actorIds,
    contextType,
    contextEntityId,
  };
}

export default connect(mapStateToProps)(ScenePropertySelect);

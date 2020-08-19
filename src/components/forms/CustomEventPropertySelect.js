import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import ActorCanvas from "../world/ActorCanvas";
import { ActorShape } from "../../reducers/stateShape";
import {
  getSettings,
} from "../../reducers/entitiesReducer";
import { getCachedObject } from "../../lib/helpers/cache";
import l10n from "../../lib/helpers/l10n";

const menuPortalEl = document.getElementById("MenuPortal");

const allCustomEventActors = Array.from(Array(10).keys()).map(i => ({
  id: String(i),
  name: `Actor ${String.fromCharCode("A".charCodeAt(0) + i)}`
}));

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
  const customEventId = state.editor.entityId;
  const actorsLookup = state.entities.present.entities.customEvents[customEventId].actors;
  const actorIds = allCustomEventActors.map((a) => a.id);
  const settings = getSettings(state);
  const playerSpriteSheetId = settings.playerSpriteSheetId;
  const {
    data: { actorId },
  } = ownProps;
  const actor =
    actorsLookup[actorId] || 
    allCustomEventActors[actorId] ||
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
    const customEventId = state.editor.entityId;
    const actorsLookup = state.entities.present.entities.customEvents[customEventId].actors;
    const settings = getSettings(state);
    const playerSpriteSheetId = settings.playerSpriteSheetId;
    const actor =
      actorsLookup[actorId] || allCustomEventActors[actorId] ||
      getCachedObject({
        id: "player",
        spriteSheetId: playerSpriteSheetId,
      });
    return {
      actor,
    };
  })(DropdownIndicator);

// Select -------------------------------------------------------------------

class CustomEventPropertySelect extends Component {
  render() {
    const {
      actorIds,
      id,
      label,
      value,
      onChange,
    } = this.props;

    const actorValue = value && value.replace(/:.*/, "");

    const generateActorOptions = (id) => {
      return Object.keys(properties).map((property) => ({
        label: properties[property],
        value: `${id}:${property}`,
      }));
    };

    const selectedActorId = actorValue;

    const options = [].concat(
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

CustomEventPropertySelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  actorIds: PropTypes.arrayOf(PropTypes.string).isRequired
};

CustomEventPropertySelect.defaultProps = {
  id: "",
  label: "",
  value: "",
};

function mapStateToProps(state, ownProps) {
  const customEventId = state.editor.entityId;
  const actorsLookup = state.entities.present.entities.customEvents[customEventId].actors;
  const actorIds = allCustomEventActors.map((a) => a.id);

  const value = ownProps.value;
  const actorValue = value && value.replace(/:.*/, "");
  const propertyValue = value && value.replace(/.*:/, "");

  const actorId = actorValue;
  console.log(actorValue, actorsLookup);
  const actor =
    actorsLookup[actorId] || allCustomEventActors[actorId] ||
    getCachedObject({
      id: "player",
    });
  console.log(actor);
  const actorName = actor ? actor.name : "";
  let actorLabel = actorName;
  if (actorValue === "player") {
    actorLabel = "Player";
  }
  const label = `${properties[propertyValue]} : ${actorLabel}`;

  return {
    label,
    actorIds,
  };
}

export default connect(mapStateToProps)(CustomEventPropertySelect);

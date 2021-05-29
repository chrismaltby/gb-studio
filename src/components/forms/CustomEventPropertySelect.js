import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import ActorCanvas from "../world/ActorCanvas";
import { getCachedObject } from "lib/helpers/cache";
import l10n from "lib/helpers/l10n";
import { getSettings } from "store/features/settings/settingsState";
import { customEventSelectors } from "store/features/entities/entitiesState";

const menuPortalEl = document.getElementById("MenuPortal");

const allCustomEventActors = Array.from(Array(10).keys()).map((i) => ({
  id: String(i),
  name: `Actor ${String.fromCharCode("A".charCodeAt(0) + i)}`,
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
  const customEvent = customEventSelectors.selectById(state, customEventId);
  const actorsLookup = customEvent.actors;
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

// Select -------------------------------------------------------------------

class CustomEventPropertySelect extends Component {
  defaultValue = () => {
    const { playerSpriteSheetId } = this.props;
    return {
      name: "Player",
      spriteSheetId: playerSpriteSheetId,
    };
  };

  renderDropdownIndicator = (props) => {
    const { value } = this.props;
    const actorValue = value && value.replace(/:.*/, "");
    const actor =
      allCustomEventActors.find((a) => a.id === actorValue) ||
      this.defaultValue();
    if (!actor || (actor && !actor.spriteSheetId)) {
      return <components.DropdownIndicator {...props} />;
    }
    return (
      <components.DropdownIndicator {...props}>
        <ActorCanvas actor={actor} />
      </components.DropdownIndicator>
    );
  };

  render() {
    const { actorIds, id, label, value, onChange } = this.props;

    const generateActorOptions = (id) => {
      return Object.keys(properties).map((property) => ({
        label: properties[property],
        value: `${id}:${property}`,
      }));
    };

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
          DropdownIndicator: this.renderDropdownIndicator,
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
  actorIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  playerSpriteSheetId: PropTypes.string,
};

CustomEventPropertySelect.defaultProps = {
  id: "",
  label: "",
  value: "",
  playerSpriteSheetId: "",
};

function mapStateToProps(state, ownProps) {
  const settings = getSettings(state);
  const customEventId = state.editor.entityId;
  const customEvent = customEventSelectors.selectById(state, customEventId);
  const actorsLookup = customEvent.actors;
  const actorIds = allCustomEventActors.map((a) => a.id);

  const value = ownProps.value;
  const actorValue = value && value.replace(/:.*/, "");
  const propertyValue = value && value.replace(/.*:/, "");

  const actorId = actorValue;
  const actor =
    actorsLookup[actorId] ||
    allCustomEventActors[actorId] ||
    getCachedObject({
      id: "player",
    });
  const actorName = actor ? actor.name : "";
  let actorLabel = actorName;
  if (actorValue === "player") {
    actorLabel = "Player";
  }
  const label = `${properties[propertyValue]} : ${actorLabel}`;
  const playerSpriteSheetId = settings.playerSpriteSheetId;

  return {
    label,
    actorIds,
    playerSpriteSheetId,
  };
}

export default connect(mapStateToProps)(CustomEventPropertySelect);

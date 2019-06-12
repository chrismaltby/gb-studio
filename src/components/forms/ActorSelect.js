import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import Select, { components } from "react-select";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";
import { framesPerDirection } from "../../lib/helpers/gbstudio";
import { ActorShape, SpriteShape } from "../../reducers/stateShape";
import { indexBy } from "../../lib/helpers/array";

const indexById = indexBy("id");

const renderActorCanvas = ({ actor, direction, frame, totalFrames }) => (
  <SpriteSheetCanvas
    spriteSheetId={actor.spriteSheetId}
    direction={
      actor.movementType === "static" && !direction
        ? "down"
        : direction || actor.direction
    }
    frame={
      !direction
        ? (frame !== null ? frame || 0 : actor.frame || 0) % totalFrames
        : 0
    }
    _spriteSheetId={actor && actor.spriteSheetId}
    _direction={direction}
    _frame={frame}
  />
);

renderActorCanvas.propTypes = {
  actor: ActorShape.isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number,
  totalFrames: PropTypes.number
};

renderActorCanvas.defaultProps = {
  direction: undefined,
  frame: undefined,
  totalFrames: 1
};

const DropdownIndicator = ({
  value,
  direction,
  frame,
  actorsById,
  spriteSheetsById,
  defaultValue
}) => props => {
  const actor = actorsById[value] || defaultValue;
  if (!actor) {
    return <components.DropdownIndicator {...props} />;
  }
  const spriteSheet = spriteSheetsById[actor.spriteSheetId];
  const spriteFrames = spriteSheet ? spriteSheet.numFrames : 0;
  const totalFrames = framesPerDirection(actor.movementType, spriteFrames);

  return (
    <components.DropdownIndicator {...props}>
      {actor && renderActorCanvas({ actor, direction, frame, totalFrames })}
    </components.DropdownIndicator>
  );
};

const Option = ({ actorsById, spriteSheetsById, defaultValue }) => props => {
  // eslint-disable-next-line react/prop-types
  const { value, label } = props;
  const actor = actorsById[value] || defaultValue;
  if (!actor) {
    return <components.Option {...props} />;
  }
  const spriteSheet = spriteSheetsById[actor.spriteSheetId];
  const spriteFrames = spriteSheet ? spriteSheet.numFrames : 0;
  const totalFrames = framesPerDirection(actor.movementType, spriteFrames);
  return (
    <components.Option {...props}>
      <div style={{ display: "flex" }}>
        <div style={{ flexGrow: 1 }}>{label}</div>
        {actor && renderActorCanvas({ actor, totalFrames })}
      </div>
    </components.Option>
  );
};

class ActorSelect extends Component {
  render() {
    const {
      actors,
      playerSpriteSheetId,
      spriteSheets,
      id,
      value,
      direction,
      frame,
      onChange
    } = this.props;

    const defaultValue = {
      name: "Player",
      spriteSheetId: playerSpriteSheetId,
      movementType: "player"
    };
    const current = actors.find(a => a.id === value) || defaultValue;
    const currentIndex = actors.indexOf(current);
    const spriteSheetsById = indexById(spriteSheets);
    const actorsById = indexById(actors);

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

    const componentProps = {
      value,
      direction,
      frame,
      actorsById,
      spriteSheetsById,
      defaultValue
    };

    const MyDropdownIndicator = DropdownIndicator(componentProps);
    const MyOption = Option(componentProps);

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
          DropdownIndicator: MyDropdownIndicator,
          Option: MyOption
        }}
      />
    );
  }
}

ActorSelect.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  playerSpriteSheetId: PropTypes.string,
  actors: PropTypes.arrayOf(ActorShape).isRequired,
  spriteSheets: PropTypes.arrayOf(SpriteShape).isRequired,
  direction: PropTypes.string,
  frame: PropTypes.number
};

ActorSelect.defaultProps = {
  id: "",
  value: "",
  playerSpriteSheetId: "",
  frame: null,
  direction: null
};

function mapStateToProps(state) {
  const scene = state.project.present.scenes.find(
    s => s.id === state.editor.scene
  );
  const actors = scene ? scene.actors : [];
  const spriteSheets = state.project.present.spriteSheets;
  const settings = state.project.present.settings;
  return {
    actors,
    spriteSheets,
    playerSpriteSheetId: settings.playerSpriteSheetId
  };
}

export default connect(mapStateToProps)(ActorSelect);

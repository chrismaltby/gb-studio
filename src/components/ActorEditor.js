import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../actions";
import { CloseIcon } from "./Icons";
import MovementTypeSelect from "./MovementTypeSelect";
import SpriteSheetSelect from "./SpriteSheetSelect";
import ScriptEditor from "./ScriptEditor";
import DirectionPicker from "./DirectionPicker";

class ActorEditor extends Component {
  onEdit = key => e => {
    const value = e.currentTarget
      ? e.currentTarget.type === "number"
        ? parseInt(e.currentTarget.value, 10)
        : e.currentTarget.value
      : e;
    this.props.editActor(this.props.map, this.props.id, {
      [key]: value
    });
  };

  onRemove = e => {
    this.props.removeActor(this.props.map, this.props.id);
  };

  render() {
    const { actor, id, spriteSheet } = this.props;

    if (!actor) {
      return <div />;
    }

    return (
      <div className="ActorEditor">
        <h2>
          Actor{" "}
          <div onClick={this.onRemove} className="EditorSidebar__DeleteButton">
            <CloseIcon />
          </div>
        </h2>

        <label>
          Actor name
          <input
            placeholder={"Actor " + (id + 1)}
            value={actor.name}
            onChange={this.onEdit("name")}
          />
        </label>

        <label className="HalfWidth">
          X
          <input
            type="number"
            value={actor.x}
            min={1}
            onChange={this.onEdit("x")}
          />
        </label>

        <label className="HalfWidth">
          Y
          <input
            type="number"
            value={actor.y}
            min={1}
            onChange={this.onEdit("y")}
          />
        </label>

        <label>
          Sprite sheet
          <span className="Select">
            <SpriteSheetSelect
              value={actor.spriteSheetId}
              onChange={this.onEdit("spriteSheetId")}
            />
          </span>
        </label>

        {spriteSheet &&
          spriteSheet.type !== "static" &&
          <div>
            <label className="HalfWidth">
              Movement Type
              <span className="Select">
                <MovementTypeSelect
                  value={actor.movementType}
                  onChange={this.onEdit("movementType")}
                />
              </span>
            </label>
            <label className="HalfWidth">
              Direction
              <DirectionPicker
                value={actor.direction}
                onChange={this.onEdit("direction")}
              />
            </label>
          </div>}

        <h2>Actor Script</h2>

        <ScriptEditor value={actor.script} onChange={this.onEdit("script")} />
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const { modified, editor, world } = state;
  const actor =
    world.maps && world.maps.find(map => map.id === props.map).actors[props.id];
  const spriteSheet =
    actor &&
    world.spriteSheets.find(
      spriteSheet => spriteSheet.id === actor.spriteSheetId
    );
  console.log({ actor, spriteSheet });
  return {
    modified,
    editor,
    actor,
    spriteSheet
  };
}

const mapDispatchToProps = {
  editActor: actions.editActor,
  removeActor: actions.removeActor
};

export default connect(mapStateToProps, mapDispatchToProps)(ActorEditor);

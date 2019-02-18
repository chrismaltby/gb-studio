import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import { CloseIcon } from "../../components/library/Icons";
import MovementTypeSelect from "../../components/MovementTypeSelect";
import SpriteSheetSelect from "../../components/SpriteSheetSelect";
import ScriptEditor from "../../components/script/ScriptEditor";
import DirectionPicker from "../../components/DirectionPicker";
import { FormField } from "../../components/library/Forms";

class ActorEditor extends Component {
  onEdit = key => e => {
    const value = e.currentTarget
      ? e.currentTarget.type === "number"
        ? parseInt(e.currentTarget.value, 10)
        : e.currentTarget.value
      : e;
    this.props.editActor(this.props.scene, this.props.id, {
      [key]: value
    });
  };

  onRemove = e => {
    this.props.removeActor(this.props.scene, this.props.id);
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

        <div>
          <FormField>
            <label htmlFor="actorName">Actor name</label>
            <input
              id="actorName"
              placeholder={"Actor " + (id + 1)}
              value={actor.name}
              onChange={this.onEdit("name")}
            />
          </FormField>

          <FormField halfWidth>
            <label htmlFor="actorX">X</label>
            <input
              id="actorX"
              type="number"
              value={actor.x}
              min={1}
              onChange={this.onEdit("x")}
            />
          </FormField>

          <FormField halfWidth>
            <label htmlFor="actorY">Y</label>
            <input
              id="actorY"
              type="number"
              value={actor.y}
              min={1}
              onChange={this.onEdit("y")}
            />
          </FormField>

          <FormField>
            <label htmlFor="actorSprite">Sprite sheet</label>
            <SpriteSheetSelect
              id="actorSprite"
              value={actor.spriteSheetId}
              onChange={this.onEdit("spriteSheetId")}
            />
          </FormField>

          {spriteSheet && spriteSheet.type !== "static" && (
            <div>
              <FormField halfWidth>
                <label htmlFor="actorMovement">Movement Type</label>
                <MovementTypeSelect
                  id="actorMovement"
                  value={actor.movementType}
                  onChange={this.onEdit("movementType")}
                />
              </FormField>
              <FormField halfWidth>
                <label htmlFor="actorDirection">Direction</label>
                <DirectionPicker
                  id="actorDirection"
                  value={actor.direction}
                  onChange={this.onEdit("direction")}
                />
              </FormField>
            </div>
          )}
        </div>

        <h2>Actor Script</h2>

        <ScriptEditor value={actor.script} onChange={this.onEdit("script")} />
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const { project } = state;
  const actor =
    project.scenes &&
    project.scenes.find(scene => scene.id === props.scene).actors[props.id];
  const spriteSheet =
    actor &&
    project.spriteSheets.find(
      spriteSheet => spriteSheet.id === actor.spriteSheetId
    );
  return {
    actor,
    spriteSheet
  };
}

const mapDispatchToProps = {
  editActor: actions.editActor,
  removeActor: actions.removeActor
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ActorEditor);

import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import { CloseIcon, TriggerIcon } from "../../components/library/Icons";
import ImageSelect from "../forms/ImageSelect";
import { FormField } from "../../components/library/Forms";
import ScriptEditor from "../script/ScriptEditor";
import castEventValue from "../../lib/helpers/castEventValue";
import Button from "../library/Button";
import SidebarHeading from "./SidebarHeading";
import SpriteSheetCanvas from "../world/SpriteSheetCanvas";

class SceneEditor extends Component {
  onEdit = key => e => {
    this.props.editScene(this.props.id, {
      [key]: castEventValue(e)
    });
  };

  onRemove = e => {
    this.props.removeScene(this.props.id);
  };

  render() {
    const { scene, sceneIndex } = this.props;

    if (!scene) {
      return <div />;
    }

    return (
      <div>
        <SidebarHeading
          title="Scene"
          buttons={
            <Button small onClick={this.onRemove}>
              Delete
            </Button>
          }
        />
        <div>
          <FormField>
            <label htmlFor="sceneName">Name</label>
            <input
              id="sceneName"
              placeholder={"Scene " + (sceneIndex + 1)}
              value={scene.name}
              onChange={this.onEdit("name")}
            />
          </FormField>

          <FormField>
            <label htmlFor="sceneType">Type</label>
            <select id="sceneType">
              <option>Top Down 2D</option>
            </select>
          </FormField>

          <FormField>
            <label htmlFor="sceneImage">Background</label>
            <ImageSelect
              id="sceneImage"
              value={scene.imageId}
              onChange={this.onEdit("imageId")}
            />
          </FormField>
        </div>

        {(scene.actors.length > 0 || scene.triggers.length > 0) && (
          <div>
            <SidebarHeading title="Navigation" />
            <ul>
              {scene.actors.map((actor, index) => (
                <li
                  key={index}
                  onClick={() => this.props.selectActor(scene.id, index)}
                >
                  <div className="EditorSidebar__Icon">
                    <SpriteSheetCanvas
                      spriteSheetId={actor.spriteSheetId}
                      direction={actor.direction}
                    />
                  </div>
                  {actor.name || "Actor " + (index + 1)}
                </li>
              ))}
              {scene.triggers.map((trigger, index) => (
                <li
                  key={index}
                  onClick={() => this.props.selectTrigger(scene.id, index)}
                >
                  <div className="EditorSidebar__Icon">
                    <TriggerIcon />
                  </div>
                  {trigger.name || "Trigger " + (index + 1)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <SidebarHeading title="Scene Start Script" />
        <ScriptEditor value={scene.script} onChange={this.onEdit("script")} />
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const hasScenes = state.project.present && state.project.present.scenes;
  const sceneIndex = hasScenes
    ? state.project.present.scenes.findIndex(scene => scene.id === props.id)
    : -1;
  return {
    sceneIndex,
    scene: sceneIndex != -1 && state.project.present.scenes[sceneIndex]
  };
}

const mapDispatchToProps = {
  editScene: actions.editScene,
  removeScene: actions.removeScene,
  selectActor: actions.selectActor,
  selectTrigger: actions.selectTrigger
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SceneEditor);

import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import { CloseIcon } from "../../components/library/Icons";
import ImageSelect from "../forms/ImageSelect";
import { FormField } from "../../components/library/Forms";
import ScriptEditor from "../script/ScriptEditor";
import castEventValue from "../../lib/helpers/castEventValue";
import Button from "../library/Button";
import SidebarHeading from "./SidebarHeading";

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
  removeScene: actions.removeScene
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SceneEditor);

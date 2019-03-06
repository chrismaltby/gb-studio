import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import { CloseIcon } from "../../components/library/Icons";
import ImageSelect from "../forms/ImageSelect";
import { FormField } from "../../components/library/Forms";
import ScriptEditor from "../script/ScriptEditor";
import castEventValue from "../../lib/helpers/castEventValue";

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
    const { scene } = this.props;

    if (!scene) {
      return <div />;
    }

    return (
      <div>
        <h2>
          Scene{" "}
          <div onClick={this.onRemove} className="EditorSidebar__DeleteButton">
            <CloseIcon />
          </div>
        </h2>

        <div>
          <FormField>
            <label htmlFor="sceneName">Scene name</label>
            <input
              id="sceneName"
              value={scene.name}
              onChange={this.onEdit("name")}
            />
          </FormField>

          <FormField>
            <label htmlFor="sceneType">Scene type</label>
            <select id="sceneType">
              <option>Top Down 2D</option>
            </select>
          </FormField>

          <FormField>
            <label htmlFor="sceneImage">Image</label>
            <ImageSelect
              id="sceneImage"
              value={scene.imageId}
              onChange={this.onEdit("imageId")}
            />
          </FormField>
        </div>

        <h2>Scene Start Script</h2>
        <ScriptEditor value={scene.script} onChange={this.onEdit("script")} />
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    scene:
      state.project.present &&
      state.project.present.scenes &&
      state.project.present.scenes.find(scene => scene.id === props.id)
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

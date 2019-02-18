import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import { CloseIcon } from "../../components/library/Icons";
import ImageSelect from "../../components/ImageSelect";
import { FormField } from "../../components/library/Forms";

class SceneEditor extends Component {
  onEdit = key => e => {
    const value = e.currentTarget
      ? e.currentTarget.type === "number"
        ? parseInt(e.currentTarget.value, 10)
        : e.currentTarget.value
      : e;
    this.props.editScene(this.props.id, {
      [key]: value
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

        <FormField>
          <label htmlFor="sceneName">Scene name</label>
          <input id="sceneName" value={scene.name} onChange={this.onEdit("name")} />
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
    );
  }
}

function mapStateToProps(state, props) {
  return {
    scene:
      state.project &&
      state.project.scenes &&
      state.project.scenes.find(scene => scene.id === props.id)
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

import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import { CloseIcon } from "../../components/library/Icons";
import ImageSelect from "../../components/ImageSelect";
import { FormField } from "../../components/library/Forms";

class MapEditor extends Component {
  onEdit = key => e => {
    const value = e.currentTarget
      ? e.currentTarget.type === "number"
        ? parseInt(e.currentTarget.value, 10)
        : e.currentTarget.value
      : e;
    this.props.editMap(this.props.id, {
      [key]: value
    });
  };

  onRemove = e => {
    this.props.removeMap(this.props.id);
  };

  render() {
    const { map } = this.props;

    if (!map) {
      return <div />;
    }

    return (
      <div>
        <h2>
          Map{" "}
          <div onClick={this.onRemove} className="EditorSidebar__DeleteButton">
            <CloseIcon />
          </div>
        </h2>

        <FormField>
          <label htmlFor="mapName">Map name</label>
          <input id="mapName" value={map.name} onChange={this.onEdit("name")} />
        </FormField>

        <FormField>
          <label htmlFor="mapImage">Image</label>
          <ImageSelect
            id="mapImage"
            value={map.imageId}
            onChange={this.onEdit("imageId")}
          />
        </FormField>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    modified: state.modified,
    editor: state.editor,
    map:
      state.project &&
      state.project.scenes &&
      state.project.scenes.find(map => map.id === props.id)
  };
}

const mapDispatchToProps = {
  editMap: actions.editMap,
  removeMap: actions.removeMap
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MapEditor);

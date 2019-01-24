import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../actions";
import { CloseIcon } from "./Icons";
import ImageSelect from "./ImageSelect";

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
      <div className="MapEditor">
        <h2>
          Map{" "}
          <div onClick={this.onRemove} className="EditorSidebar__DeleteButton">
            <CloseIcon />
          </div>
        </h2>

        <label>
          Map name
          <input value={map.name} onChange={this.onEdit("name")} />
        </label>

        <label>
          Image
          <span className="Select">
            <ImageSelect
              value={map.imageId}
              onChange={this.onEdit("imageId")}
            />
          </span>
        </label>
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    modified: state.modified,
    editor: state.editor,
    map:
      state.world &&
      state.world.maps &&
      state.world.maps.find(map => map.id === props.id)
  };
}

const mapDispatchToProps = {
  editMap: actions.editMap,
  removeMap: actions.removeMap
};

export default connect(mapStateToProps, mapDispatchToProps)(MapEditor);

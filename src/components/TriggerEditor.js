import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../actions";
import { CloseIcon } from "./Icons";
import ScriptEditor from "./ScriptEditor";

class TriggerEditor extends Component {
  onEdit = key => e => {
    const value = e.currentTarget
      ? e.currentTarget.type === "number"
        ? parseInt(e.currentTarget.value, 10)
        : e.currentTarget.value
      : e;
    this.props.editTrigger(this.props.map, this.props.id, {
      [key]: value
    });
  };

  onRemove = e => {
    this.props.removeTrigger(this.props.map, this.props.id);
  };

  render() {
    const { trigger } = this.props;

    if (!trigger) {
      return <div />;
    }

    return (
      <div className="TriggerEditor">
        <h2>
          Trigger{" "}
          <div onClick={this.onRemove} className="EditorSidebar__DeleteButton">
            <CloseIcon />
          </div>
        </h2>

        <label className="HalfWidth">
          X
          <input
            type="number"
            value={trigger.x}
            min={1}
            onChange={this.onEdit("x")}
          />
        </label>

        <label className="HalfWidth">
          Y
          <input
            type="number"
            value={trigger.y}
            min={1}
            onChange={this.onEdit("y")}
          />
        </label>

        <label className="HalfWidth">
          Width
          <input
            type="number"
            value={trigger.width}
            min={1}
            onChange={this.onEdit("width")}
          />
        </label>

        <label className="HalfWidth">
          Height
          <input
            type="number"
            value={trigger.height}
            min={1}
            onChange={this.onEdit("height")}
          />
        </label>

        <label>
          Activate on
          <span className="Select">
            <select
              value={trigger.trigger || "walk"}
              onChange={this.onEdit("trigger")}
            >
              <option value="walk">Walk over</option>
              <option value="action">Action button</option>
            </select>
          </span>
        </label>

        <h2>Trigger Script</h2>

        <ScriptEditor value={trigger.script} onChange={this.onEdit("script")} />
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    modified: state.modified,
    editor: state.editor,
    trigger:
      state.project &&
      state.project.scenes &&
      state.project.scenes.find(map => map.id === props.map).triggers[props.id]
  };
}

const mapDispatchToProps = {
  editTrigger: actions.editTrigger,
  removeTrigger: actions.removeTrigger
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TriggerEditor);

import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import { CloseIcon } from "../../components/library/Icons";
import ScriptEditor from "../../components/script/ScriptEditor";
import { FormField } from "../../components/library/Forms";
import castEventValue from "../../lib/helpers/castEventValue";
import Button from "../library/Button";
import SidebarHeading from "./SidebarHeading";

class TriggerEditor extends Component {
  onEdit = key => e => {
    this.props.editTrigger(this.props.scene, this.props.id, {
      [key]: castEventValue(e)
    });
  };

  onRemove = e => {
    this.props.removeTrigger(this.props.scene, this.props.id);
  };

  render() {
    const { trigger, id } = this.props;

    if (!trigger) {
      return <div />;
    }

    return (
      <div>
        <SidebarHeading
          title="Trigger"
          buttons={
            <Button small onClick={this.onRemove}>
              Delete
            </Button>
          }
        />
        <div>
          <FormField>
            <label htmlFor="triggerName">Name</label>
            <input
              id="triggerName"
              placeholder={"Trigger " + (id + 1)}
              value={trigger.name || ""}
              onChange={this.onEdit("name")}
            />
          </FormField>

          <FormField halfWidth>
            <label htmlFor="triggerX">X</label>
            <input
              id="triggerX"
              type="number"
              value={trigger.x}
              min={0}
              max={31}
              onChange={this.onEdit("x")}
            />
          </FormField>

          <FormField halfWidth>
            <label htmlFor="triggerY">Y</label>
            <input
              id="triggerY"
              type="number"
              value={trigger.y}
              min={0}
              max={31}
              onChange={this.onEdit("y")}
            />
          </FormField>

          <FormField halfWidth>
            <label htmlFor="triggerWidth">Width</label>
            <input
              id="triggerWidth"
              type="number"
              value={trigger.width}
              min={1}
              max={32}
              onChange={this.onEdit("width")}
            />
          </FormField>

          <FormField halfWidth>
            <label htmlFor="triggerHeight">Height</label>
            <input
              id="triggerHeight"
              type="number"
              value={trigger.height}
              min={1}
              max={32}
              onChange={this.onEdit("height")}
            />
          </FormField>
        </div>

        <SidebarHeading title="Trigger Script" />
        <ScriptEditor value={trigger.script} onChange={this.onEdit("script")} />
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    trigger:
      state.project.present &&
      state.project.present.scenes &&
      state.project.present.scenes.find(scene => scene.id === props.scene)
        .triggers[props.id]
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

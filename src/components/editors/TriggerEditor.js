import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import { CloseIcon } from "../../components/library/Icons";
import ScriptEditor from "../../components/script/ScriptEditor";
import { FormField } from "../../components/library/Forms";
import castEventValue from "../../lib/helpers/castEventValue";
import { DropdownButton } from "../library/Button";
import SidebarHeading from "./SidebarHeading";
import { MenuItem } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";

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
    const { index, trigger, id } = this.props;

    if (!trigger) {
      return <div />;
    }

    return (
      <div>
        <SidebarHeading
          title={l10n("TRIGGER")}
          buttons={
            <DropdownButton small transparent right>
              <MenuItem onClick={this.onRemove}>Delete Trigger</MenuItem>
            </DropdownButton>
          }
        />
        <div>
          <FormField>
            <label htmlFor="triggerName">{l10n("FIELD_NAME")}</label>
            <input
              id="triggerName"
              placeholder={"Trigger " + (index + 1)}
              value={trigger.name || ""}
              onChange={this.onEdit("name")}
            />
          </FormField>

          <FormField halfWidth>
            <label htmlFor="triggerX">{l10n("FIELD_X")}</label>
            <input
              id="triggerX"
              type="number"
              value={trigger.x}
              placeholder={0}
              min={0}
              max={31}
              onChange={this.onEdit("x")}
            />
          </FormField>

          <FormField halfWidth>
            <label htmlFor="triggerY">{l10n("FIELD_Y")}</label>
            <input
              id="triggerY"
              type="number"
              value={trigger.y}
              placeholder={0}
              min={0}
              max={31}
              onChange={this.onEdit("y")}
            />
          </FormField>

          <FormField halfWidth>
            <label htmlFor="triggerWidth">{l10n("FIELD_WIDTH")}</label>
            <input
              id="triggerWidth"
              type="number"
              value={trigger.width}
              placeholder={1}
              min={1}
              max={32}
              onChange={this.onEdit("width")}
            />
          </FormField>

          <FormField halfWidth>
            <label htmlFor="triggerHeight">{l10n("FIELD_HEIGHT")}</label>
            <input
              id="triggerHeight"
              type="number"
              value={trigger.height}
              placeholder={1}
              min={1}
              max={32}
              onChange={this.onEdit("height")}
            />
          </FormField>
        </div>

        <ScriptEditor
          value={trigger.script}
          title={l10n("SIDEBAR_TRIGGER_SCRIPT")}
          type="trigger"
          onChange={this.onEdit("script")}
        />
      </div>
    );
  }
}

function mapStateToProps(state, props) {
  const scenes = state.project.present && state.project.present.scenes;
  const scene = scenes && scenes.find(scene => scene.id === props.scene);
  const trigger = scene && scene.triggers.find(t => t.id === props.id);
  const index = scene && scene.triggers.indexOf(trigger);

  return {
    index,
    trigger
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

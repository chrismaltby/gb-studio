import React, { Component } from "react";
import { connect } from "react-redux";
import * as actions from "../../actions";
import ScriptEditor from "../../components/script/ScriptEditor";
import { FormField, ToggleableFormField } from "../../components/library/Forms";
import castEventValue from "../../lib/helpers/castEventValue";
import { DropdownButton } from "../library/Button";
import { MenuItem, MenuDivider } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";
import Sidebar, { SidebarHeading, SidebarColumn } from "./Sidebar";

class TriggerEditor extends Component {
  onEdit = key => e => {
    this.props.editTrigger(this.props.scene, this.props.id, {
      [key]: castEventValue(e)
    });
  };

  onCopy = e => {
    this.props.copyTrigger(this.props.trigger);
  };

  onPaste = e => {
    const { clipboardTrigger } = this.props;
    this.props.pasteTrigger(this.props.scene, clipboardTrigger);
  };

  onRemove = e => {
    this.props.removeTrigger(this.props.scene, this.props.id);
  };

  render() {
    const { index, trigger, id, clipboardTrigger } = this.props;

    if (!trigger) {
      return <div />;
    }

    return (
      <Sidebar>
        <SidebarColumn>
          <SidebarHeading
            title={l10n("TRIGGER")}
            buttons={
              <DropdownButton small transparent right>
                <MenuItem onClick={this.onCopy}>
                  {l10n("MENU_COPY_TRIGGER")}
                </MenuItem>
                {clipboardTrigger && (
                  <MenuItem onClick={this.onPaste}>
                    {l10n("MENU_PASTE_TRIGGER")}
                  </MenuItem>
                )}
                <MenuDivider />
                <MenuItem onClick={this.onRemove}>
                  {l10n("MENU_DELETE_TRIGGER")}
                </MenuItem>
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

            <ToggleableFormField
              htmlFor="triggerNotes"
              closedLabel={l10n("FIELD_ADD_NOTES")}
              label={l10n("FIELD_NOTES")}
              open={trigger.notes}
            >
              <textarea
                id="triggerNotes"
                value={trigger.notes || ""}
                placeholder={l10n("FIELD_NOTES")}
                onChange={this.onEdit("notes")}
                rows={3}
              />
            </ToggleableFormField>
          </div>
        </SidebarColumn>

        <SidebarColumn>
          <ScriptEditor
            value={trigger.script}
            title={l10n("SIDEBAR_TRIGGER_SCRIPT")}
            type="trigger"
            onChange={this.onEdit("script")}
          />
        </SidebarColumn>
      </Sidebar>
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
    trigger,
    clipboardTrigger: state.clipboard.trigger
  };
}

const mapDispatchToProps = {
  editTrigger: actions.editTrigger,
  removeTrigger: actions.removeTrigger,
  copyTrigger: actions.copyTrigger,
  pasteTrigger: actions.pasteTrigger
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TriggerEditor);

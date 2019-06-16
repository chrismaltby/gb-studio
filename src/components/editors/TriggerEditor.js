import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import * as actions from "../../actions";
import ScriptEditor from "../script/ScriptEditor";
import { FormField, ToggleableFormField } from "../library/Forms";
import castEventValue from "../../lib/helpers/castEventValue";
import { DropdownButton } from "../library/Button";
import { MenuItem, MenuDivider } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";
import Sidebar, { SidebarHeading, SidebarColumn } from "./Sidebar";
import { SceneIcon } from "../library/Icons";
import { TriggerShape, SceneShape } from "../../reducers/stateShape";

class TriggerEditor extends Component {
  onEdit = key => e => {
    const { editTrigger, sceneId, trigger } = this.props;
    editTrigger(sceneId, trigger.id, {
      [key]: castEventValue(e)
    });
  };

  onCopy = e => {
    const { copyTrigger, trigger } = this.props;
    copyTrigger(trigger);
  };

  onPaste = e => {
    const { pasteTrigger, sceneId, clipboardTrigger } = this.props;
    pasteTrigger(sceneId, clipboardTrigger);
  };

  onRemove = e => {
    const { removeTrigger, sceneId, trigger } = this.props;
    removeTrigger(sceneId, trigger.id);
  };

  render() {
    const { index, trigger, scene, clipboardTrigger, selectScene } = this.props;

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
              <label htmlFor="triggerName">
                {l10n("FIELD_NAME")}
                <input
                  id="triggerName"
                  placeholder={`Trigger ${index + 1}`}
                  value={trigger.name || ""}
                  onChange={this.onEdit("name")}
                />
              </label>
            </FormField>

            <FormField halfWidth>
              <label htmlFor="triggerX">
                {l10n("FIELD_X")}
                <input
                  id="triggerX"
                  type="number"
                  value={trigger.x}
                  placeholder={0}
                  min={0}
                  max={31}
                  onChange={this.onEdit("x")}
                />
              </label>
            </FormField>

            <FormField halfWidth>
              <label htmlFor="triggerY">
                {l10n("FIELD_Y")}
                <input
                  id="triggerY"
                  type="number"
                  value={trigger.y}
                  placeholder={0}
                  min={0}
                  max={31}
                  onChange={this.onEdit("y")}
                />
              </label>
            </FormField>

            <FormField halfWidth>
              <label htmlFor="triggerWidth">
                {l10n("FIELD_WIDTH")}
                <input
                  id="triggerWidth"
                  type="number"
                  value={trigger.width}
                  placeholder={1}
                  min={1}
                  max={32}
                  onChange={this.onEdit("width")}
                />
              </label>
            </FormField>

            <FormField halfWidth>
              <label htmlFor="triggerHeight">
                {l10n("FIELD_HEIGHT")}
                <input
                  id="triggerHeight"
                  type="number"
                  value={trigger.height}
                  placeholder={1}
                  min={1}
                  max={32}
                  onChange={this.onEdit("height")}
                />
              </label>
            </FormField>

            <ToggleableFormField
              htmlFor="triggerNotes"
              closedLabel={l10n("FIELD_ADD_NOTES")}
              label={l10n("FIELD_NOTES")}
              open={!!trigger.notes}
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

          <SidebarHeading title={l10n("SIDEBAR_NAVIGATION")} />
          <ul>
            <li onClick={() => selectScene(scene.id)}>
              <div className="EditorSidebar__Icon">
                <SceneIcon />
              </div>
              {scene.name || `Scene ${index + 1}`}
            </li>
          </ul>
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

TriggerEditor.propTypes = {
  index: PropTypes.number.isRequired,
  trigger: TriggerShape,
  scene: SceneShape,
  sceneId: PropTypes.string.isRequired,
  clipboardTrigger: TriggerShape,
  editTrigger: PropTypes.func.isRequired,
  removeTrigger: PropTypes.func.isRequired,
  copyTrigger: PropTypes.func.isRequired,
  pasteTrigger: PropTypes.func.isRequired,
  selectScene: PropTypes.func.isRequired
};

TriggerEditor.defaultProps = {
  trigger: null,
  scene: null,
  clipboardTrigger: null
};

function mapStateToProps(state, props) {
  const trigger = state.entities.present.entities.triggers[props.id];
  const scene = state.entities.present.entities.scenes[props.sceneId];
  const spriteSheet =
    state.entities.present.entities.spriteSheets[trigger.spriteSheetId];
  const index = scene.triggers.indexOf(props.id);
  return {
    index,
    trigger,
    scene,
    spriteSheet,
    clipboardTrigger: state.clipboard.trigger
  };
}

const mapDispatchToProps = {
  editTrigger: actions.editTrigger,
  removeTrigger: actions.removeTrigger,
  copyTrigger: actions.copyTrigger,
  pasteTrigger: actions.pasteTrigger,
  selectScene: actions.selectScene
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TriggerEditor);

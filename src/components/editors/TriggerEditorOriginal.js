import React, { Component } from "react";
import PropTypes from "prop-types";
import { clipboard } from "electron";
import { connect } from "react-redux";
import ScriptEditor from "../script/ScriptEditor";
import { FormField, ToggleableFormField } from "../library/Forms";
import castEventValue from "../../lib/helpers/castEventValue";
import { DropdownButton } from "../library/Button";
import { MenuItem, MenuDivider } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";
import { SidebarHeading, SidebarTabs } from "./Sidebar";
import { TriggerShape, SceneShape } from "../../store/stateShape";
import { WorldEditor } from "./WorldEditor";
import ScriptEditorDropdownButton from "../script/ScriptEditorDropdownButton";
import { triggerSelectors, sceneSelectors } from "../../store/features/entities/entitiesState";
import editorActions from "../../store/features/editor/editorActions";
import clipboardActions from "../../store/features/clipboard/clipboardActions";
import entitiesActions from "../../store/features/entities/entitiesActions";
import { SidebarMultiColumnAuto, SidebarColumn } from "../ui/sidebars/Sidebar";

class TriggerEditor extends Component {
  constructor() {
    super();
    this.state = {
      clipboardData: null
    };
  }

  onEdit = key => e => {
    const { editTrigger, trigger } = this.props;
    editTrigger({triggerId: trigger.id, changes: {
      [key]: castEventValue(e)
    }});
  };

  onCopy = e => {
    const { copyTrigger, trigger } = this.props;
    copyTrigger(trigger);
  };

  onPaste = (e) => {
    const { pasteClipboardEntity } = this.props;
    const { clipboardData } = this.state;
    pasteClipboardEntity(clipboardData);
  };

  onRemove = e => {
    const { removeTrigger, sceneId, trigger } = this.props;
    removeTrigger({sceneId, triggerId: trigger.id});
  };

  readClipboard = (e) => {
    try {
      const clipboardData = JSON.parse(clipboard.readText());
      this.setState({ clipboardData });
    } catch (err) {
      this.setState({ clipboardData: null });
    }
  };

  render() {
    const { index, trigger, scene, selectScene, selectSidebar } = this.props;

    if (!trigger) {
      return <WorldEditor />;
    }

    const { clipboardData } = this.state;

    return (
      <SidebarMultiColumnAuto onClick={selectSidebar}>
        <SidebarColumn>
          <SidebarHeading
            title={l10n("TRIGGER")}
            buttons={
              <DropdownButton
                small
                transparent
                right
                onMouseDown={this.readClipboard}
              >
                <MenuItem onClick={this.onCopy}>
                  {l10n("MENU_COPY_TRIGGER")}
                </MenuItem>
                {clipboardData && clipboardData.__type === "trigger" && (
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
                  max={scene.width - trigger.width}
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
                  max={scene.height - trigger.height}
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
                  max={scene.width - trigger.x}
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
                  max={scene.height - trigger.y}
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
        </SidebarColumn>

        <SidebarColumn>
          <div>
            <SidebarTabs
              values={{
                trigger: l10n("SIDEBAR_ON_TRIGGER")
              }}
              buttons={
                <ScriptEditorDropdownButton
                  value={trigger.script}
                  onChange={this.onEdit("script")}
                />
              }
            />
            <ScriptEditor
              value={trigger.script}
              type="trigger"
              onChange={this.onEdit("script")}
              entityId={trigger.id}
            />
          </div>
        </SidebarColumn>
      </SidebarMultiColumnAuto>
    );
  }
}

TriggerEditor.propTypes = {
  index: PropTypes.number.isRequired,
  trigger: TriggerShape,
  scene: SceneShape,
  sceneId: PropTypes.string.isRequired,
  editTrigger: PropTypes.func.isRequired,
  removeTrigger: PropTypes.func.isRequired,
  copyTrigger: PropTypes.func.isRequired,
  pasteClipboardEntity: PropTypes.func.isRequired,
  selectScene: PropTypes.func.isRequired,
  selectSidebar: PropTypes.func.isRequired
};

TriggerEditor.defaultProps = {
  trigger: null,
  scene: null
};

function mapStateToProps(state, props) {
  const trigger = triggerSelectors.selectById(state, props.id)  
  const scene = sceneSelectors.selectById(state, props.sceneId);
  const index = scene.triggers.indexOf(props.id);
  return {
    index,
    trigger,
    scene
  };
}

const mapDispatchToProps = {
  editTrigger: entitiesActions.editTrigger,
  removeTrigger: entitiesActions.removeTrigger,
  copyTrigger: clipboardActions.copyTrigger,
  pasteClipboardEntity: clipboardActions.pasteClipboardEntity,
  selectScene: editorActions.selectScene,
  selectSidebar: editorActions.selectSidebar
};

export default connect(mapStateToProps, mapDispatchToProps)(TriggerEditor);

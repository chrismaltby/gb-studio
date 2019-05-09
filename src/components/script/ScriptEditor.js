import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import uuid from "uuid/v4";
import { DragSource, DropTarget } from "react-dnd";
import { CloseIcon, TriangleIcon } from "../library/Icons";
import AddCommandButton from "./AddCommandButton";
import { FormField } from "../library/Forms";
import ScriptEventBlock from "./ScriptEventBlock";
import {
  EventNames,
  EventFields,
  EVENT_IF_TRUE,
  EVENT_IF_FALSE,
  EVENT_IF_VALUE,
  EVENT_IF_INPUT,
  EVENT_IF_ACTOR_AT_POSITION,
  EVENT_IF_ACTOR_DIRECTION,
  EVENT_IF_SAVED_DATA,
  EVENT_END,
  EVENT_LOOP,
  EVENT_GROUP,
  EVENT_IF_VALUE_COMPARE
} from "../../lib/compiler/eventTypes";
import {
  patchEvents,
  prependEvent,
  filterEvents,
  findEvent,
  appendEvent,
  regenerateEventIds
} from "../../lib/helpers/eventSystem";
import * as actions from "../../actions";
import { DropdownButton } from "../library/Button";
import { MenuItem, MenuDivider } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";
import SidebarHeading from "../editors/SidebarHeading";

const ItemTypes = {
  CARD: "card"
};

const cardSource = {
  beginDrag(props) {
    return {
      id: props.id,
      path: props.path
    };
  },

  canDrag(props) {
    return props.action.command !== "END";
  },

  endDrag(props, monitor) {
    const item = monitor.getItem();
    const target = monitor.getDropResult({ shallow: true });

    if (item && target) {
      props.moveActions(item.id, target.id);
    }
  }
};

const cardTarget = {
  canDrop(props, monitor) {
    return monitor.isOver({ shallow: true });
  },
  drop(props) {
    return {
      id: props.id,
      end: props.end
    };
  }
};

const isConditionalEvent = command => {
  return (
    [
      EVENT_IF_TRUE,
      EVENT_IF_FALSE,
      EVENT_IF_VALUE,
      EVENT_IF_INPUT,
      EVENT_IF_ACTOR_AT_POSITION,
      EVENT_IF_ACTOR_DIRECTION,
      EVENT_IF_SAVED_DATA,
      EVENT_IF_VALUE_COMPARE
    ].indexOf(command) > -1
  );
};

class ActionMini extends Component {
  constructor() {
    super();
    this.state = {
      rename: false
    };
  }

  toggleOpen = () => {
    const { id, action, onEdit } = this.props;
    onEdit(id, {
      __collapse: !action.args.__collapse
    });
  };

  toggleElseOpen = () => {
    const { id, action, onEdit } = this.props;
    onEdit(id, {
      __collapseElse: !action.args.__collapseElse
    });
  };

  toggleRename = () => {
    this.setState({
      rename: !this.state.rename
    });
  };

  submitOnEnter = e => {
    if (e.key === "Enter") {
      this.toggleRename();
    }
  };

  onPasteValues = e => {
    const { id, clipboardEvent, onEdit, action } = this.props;
    if (!clipboardEvent || Array.isArray(clipboardEvent)) {
      // Can't paste values if copied entire script, or not copied anything
      return;
    }
    // Only include values from clipboard event that existed on current event already
    const newArgs = Object.keys(clipboardEvent.args || {}).reduce(
      (memo, key) => {
        if (action.args && action.args[key] !== undefined) {
          memo[key] = clipboardEvent.args[key];
        }
        return memo;
      },
      {}
    );
    onEdit(id, newArgs);
  };

  onPasteEvent = before => e => {
    const { id, clipboardEvent, onPaste } = this.props;
    onPaste(id, clipboardEvent, before);
  };

  render() {
    const {
      id,
      type,
      action,
      connectDragSource,
      connectDragPreview,
      connectDropTarget,
      isDragging,
      isOverCurrent,
      moveActions,
      onAdd,
      onEdit,
      onRemove,
      onCopy,
      onPaste,
      onMouseEnter,
      onMouseLeave,
      clipboardEvent
    } = this.props;
    const { rename } = this.state;
    const { command } = action;

    if (command === EVENT_END) {
      return connectDropTarget(
        <div
          className={cx("ActionMini", "ActionMini--Add", {
            "ActionMini--Dragging": isDragging,
            "ActionMini--Over": isOverCurrent
          })}
        >
          <AddCommandButton onAdd={onAdd(id)} type={type} />
        </div>
      );
    }

    const open = action.args && !action.args.__collapse;
    const elseOpen = action.args && !action.args.__collapseElse;

    return connectDropTarget(
      connectDragPreview(
        <div
          className={cx("ActionMini", {
            "ActionMini--Dragging": isDragging,
            "ActionMini--Over": isOverCurrent,
            "ActionMini--Conditional":
              isConditionalEvent(command) ||
              command === EVENT_LOOP ||
              command === EVENT_GROUP
          })}
        >
          <div
            className="ActionMini__Content"
            onMouseEnter={() => onMouseEnter(id)}
            onMouseLeave={() => onMouseLeave(id)}
          >
            {connectDragSource(
              <div
                className={cx("ActionMini__Command", {
                  "ActionMini__Command--Open": open
                })}
                onClick={this.toggleOpen}
              >
                <TriangleIcon />{" "}
                {action.args.__label ? (
                  <span>
                    {action.args.__label}
                    <small>{l10n(command) || command}</small>
                  </span>
                ) : (
                  l10n(command) || command
                )}
              </div>
            )}

            <div className="ActionMini__Dropdown">
              <DropdownButton small transparent right>
                <MenuItem onClick={this.toggleRename}>
                  {l10n("MENU_RENAME_EVENT")}
                </MenuItem>
                <MenuDivider />
                <MenuItem onClick={onCopy(action)}>
                  {l10n("MENU_COPY_EVENT")}
                </MenuItem>
                <MenuDivider />
                {clipboardEvent && !Array.isArray(clipboardEvent) && (
                  <MenuItem onClick={this.onPasteValues}>
                    {l10n("MENU_PASTE_VALUES")}
                  </MenuItem>
                )}
                {clipboardEvent && (
                  <MenuItem onClick={this.onPasteEvent(true)}>
                    {l10n("MENU_PASTE_EVENT_BEFORE")}
                  </MenuItem>
                )}
                {clipboardEvent && (
                  <MenuItem onClick={this.onPasteEvent(false)}>
                    {l10n("MENU_PASTE_EVENT_AFTER")}
                  </MenuItem>
                )}
                <MenuDivider />
                <MenuItem onClick={onRemove(id)}>
                  {l10n("MENU_DELETE_EVENT")}
                </MenuItem>
              </DropdownButton>
            </div>

            {rename && (
              <FormField>
                <input
                  placeholder={l10n("FIELD_LABEL")}
                  value={action.args.__label || ""}
                  autoFocus={true}
                  onBlur={this.toggleRename}
                  onChange={e => {
                    onEdit(id, {
                      __label: e.currentTarget.value
                    });
                  }}
                  onKeyDown={this.submitOnEnter}
                />
              </FormField>
            )}

            {open && EventFields[command] && EventFields[command].length > 0 && (
              <ScriptEventBlock
                command={command}
                value={action.args}
                onChange={newValue => {
                  onEdit(id, newValue);
                }}
              />
            )}

            {open &&
              action.true &&
              connectDropTarget(
                <div className="ActionMini__Children">
                  {action.true.map((action, index) => (
                    <ActionMiniDnD
                      key={index}
                      id={action.id}
                      type={type}
                      path={id + "_true_" + action.id}
                      action={action}
                      moveActions={moveActions}
                      onAdd={onAdd}
                      onRemove={onRemove}
                      onEdit={onEdit}
                      onCopy={onCopy}
                      onPaste={onPaste}
                      onMouseEnter={onMouseEnter}
                      onMouseLeave={onMouseLeave}
                      clipboardEvent={clipboardEvent}
                    />
                  ))}
                </div>
              )}
            {action.false && (
              <div
                className={cx("ActionMini__Else", {
                  "ActionMini__Else--Open": elseOpen
                })}
                onClick={this.toggleElseOpen}
              >
                <TriangleIcon /> Else
              </div>
            )}
            {action.false && elseOpen && (
              <div className="ActionMini__Children">
                {action.false.map((action, index) => (
                  <ActionMiniDnD
                    key={index}
                    id={action.id}
                    type={type}
                    path={id + "_true_" + action.id}
                    action={action}
                    moveActions={moveActions}
                    onAdd={onAdd}
                    onRemove={onRemove}
                    onEdit={onEdit}
                    onCopy={onCopy}
                    onPaste={onPaste}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                    clipboardEvent={clipboardEvent}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )
    );
  }
}

const ActionMiniDnD = DropTarget(
  ItemTypes.CARD,
  cardTarget,
  (connect, monitor) => ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true })
  })
)(
  DragSource(ItemTypes.CARD, cardSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  }))(ActionMini)
);

class ScriptEditor extends Component {
  moveActions = (a, b) => {
    const root = this.props.value;
    if (a === b) {
      return;
    }
    const input = prependEvent(filterEvents(root, a), b, findEvent(root, a));
    this.setState({
      input
    });
    this.props.onChange(input);
  };

  onAdd = id => (command, defaults = {}) => {
    const root = this.props.value;
    const eventFields = EventFields[command];
    const defaultArgs = eventFields
      ? eventFields.reduce(
          (memo, field) => {
            if (field.defaultValue === "LAST_SCENE") {
              memo[field.key] = this.props.scenes[
                this.props.scenes.length - 1
              ].id;
            } else if (field.defaultValue === "LAST_VARIABLE") {
              memo[field.key] =
                this.props.variables.length > 0
                  ? this.props.variables[this.props.variables.length - 1].id
                  : "0";
            } else if (field.defaultValue === "LAST_MUSIC") {
              memo[field.key] = this.props.music[0].id;
            } else if (field.defaultValue === "LAST_SPRITE") {
              memo[field.key] = this.props.spriteSheets[0].id;
            } else if (field.defaultValue === "LAST_ACTOR") {
              const actors = this.props.scene.actors;
              memo[field.key] =
                actors.length > 0
                  ? this.props.scene.actors[this.props.scene.actors.length - 1]
                      .id
                  : "player";
            } else if (
              field.defaultValue !== undefined &&
              !defaults[field.key]
            ) {
              memo[field.key] = field.defaultValue;
            }
            return memo;
          },
          { ...defaults }
        )
      : { ...defaults };

    const input = prependEvent(
      root,
      id,
      Object.assign(
        {
          id: uuid(),
          command,
          args: defaultArgs
        },
        isConditionalEvent(command) && {
          true: [
            {
              id: uuid(),
              command: EVENT_END
            }
          ],
          false: [
            {
              id: uuid(),
              command: EVENT_END
            }
          ]
        },
        command === EVENT_LOOP && {
          true: [
            {
              id: uuid(),
              command: EVENT_END
            }
          ]
        },
        command === EVENT_GROUP && {
          true: [
            {
              id: uuid(),
              command: EVENT_END
            }
          ]
        }
      )
    );
    this.setState({
      input
    });
    this.props.onChange(input);
  };

  onRemove = id => () => {
    const root = this.props.value;
    const input = filterEvents(root, id);
    this.setState({
      input
    });
    this.props.onChange(input);
  };

  onEdit = (id, patch) => {
    const root = this.props.value;
    const input = patchEvents(root, id, patch);

    this.setState({
      input
    });
    this.props.onChange(input);
  };

  onCopy = event => () => {
    this.props.copyEvent(event);
  };

  onCopyScript = () => {
    this.props.copyEvent(this.props.value);
  };

  onPaste = (id, event, before) => {
    const root = this.props.value;
    const newEvent = Array.isArray(event)
      ? event.slice(0, -1).map(regenerateEventIds)
      : regenerateEventIds(event);
    const input = before
      ? prependEvent(root, id, newEvent)
      : appendEvent(root, id, newEvent);
    this.setState({
      input
    });
    this.props.onChange(input);
  };

  onRemoveScript = e => {
    this.props.onChange([
      {
        id: uuid(),
        command: EVENT_END
      }
    ]);
  };

  onReplaceScript = e => {
    const { clipboardEvent } = this.props;
    if (clipboardEvent) {
      this.props.onChange([].concat(clipboardEvent).map(regenerateEventIds));
    }
  };

  onPasteScript = before => () => {
    const { clipboardEvent, value } = this.props;
    const newEvent = Array.isArray(clipboardEvent)
      ? clipboardEvent.slice(0, -1).map(regenerateEventIds)
      : regenerateEventIds(clipboardEvent);
    if (clipboardEvent) {
      if (before) {
        this.props.onChange([].concat(newEvent, value));
      } else {
        this.props.onChange(
          [].concat(value.slice(0, -1), newEvent, value.slice(-1))
        );
      }
    }
  };

  onEnter = id => {
    this.props.selectScriptEvent(id);
  };

  onLeave = id => {
    this.props.selectScriptEvent("");
  };

  render() {
    const { value, type, title, clipboardEvent } = this.props;
    return (
      <div>
        <SidebarHeading
          title={title}
          buttons={
            <DropdownButton small transparent right>
              <MenuItem onClick={this.onCopyScript}>
                {l10n("MENU_COPY_SCRIPT")}
              </MenuItem>
              <MenuDivider />
              {clipboardEvent && (
                <MenuItem onClick={this.onReplaceScript}>
                  {l10n("MENU_REPLACE_SCRIPT")}
                </MenuItem>
              )}
              {clipboardEvent && value && value.length > 1 && (
                <MenuItem onClick={this.onPasteScript(true)}>
                  {l10n("MENU_PASTE_SCRIPT_BEFORE")}
                </MenuItem>
              )}
              {clipboardEvent && value && value.length > 1 && (
                <MenuItem onClick={this.onPasteScript(false)}>
                  {l10n("MENU_PASTE_SCRIPT_AFTER")}
                </MenuItem>
              )}
              <MenuDivider />
              <MenuItem onClick={this.onRemoveScript}>
                {l10n("MENU_DELETE_SCRIPT")}
              </MenuItem>
            </DropdownButton>
          }
        />{" "}
        <div className="ScriptEditor">
          {value.map((action, index) => (
            <ActionMiniDnD
              key={action.id}
              id={action.id}
              type={type}
              action={action}
              moveActions={this.moveActions}
              onAdd={this.onAdd}
              onRemove={this.onRemove}
              onEdit={this.onEdit}
              onCopy={this.onCopy}
              onPaste={this.onPaste}
              onMouseEnter={this.onEnter}
              onMouseLeave={this.onLeave}
              clipboardEvent={this.props.clipboardEvent}
            />
          ))}
        </div>
      </div>
    );
  }
}

ScriptEditor.defaultProps = {
  value: [
    {
      id: uuid(),
      command: EVENT_END
    }
  ]
};

function mapStateToProps(state) {
  return {
    variables: state.project.present && state.project.present.variables,
    scenes: state.project.present && state.project.present.scenes,
    scene:
      state.project.present &&
      state.project.present.scenes.find(scene => {
        return scene.id === state.editor.scene;
      }),
    music: state.project.present && state.project.present.music,
    spriteSheets: state.project.present && state.project.present.spriteSheets,
    clipboardEvent: state.clipboard.event
  };
}

const mapDispatchToProps = {
  selectScriptEvent: actions.selectScriptEvent,
  copyEvent: actions.copyEvent
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ScriptEditor);

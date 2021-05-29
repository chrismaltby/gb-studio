import React, { Component } from "react";
import PropTypes from "prop-types";
import { clipboard } from "electron";
import cx from "classnames";
import uuid from "uuid/v4";
import { DragSource, DropTarget } from "react-dnd";
import { TriangleIcon } from "../library/Icons";
import AddCommandButton from "./AddCommandButton";
import { FormField } from "../library/Forms";
import ScriptEventForm from "./ScriptEventForm";
import {
  EVENT_END,
  EVENT_CALL_CUSTOM_EVENT,
  EVENT_COMMENT,
} from "../../lib/compiler/eventTypes";
import { DropdownButton } from "../library/Button";
import { MenuItem, MenuDivider } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";
import { EventShape } from "../../store/stateShape";
import events from "../../lib/events";
import { ScriptEditorEventHelper } from "./ScriptEditorEventHelper";

const COMMENT_PREFIX = "//";

const ItemTypes = {
  CARD: "card",
};

const cardSource = {
  beginDrag(props) {
    return {
      id: props.id,
      path: props.path,
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
  },
};

const cardTarget = {
  canDrop(_props, monitor) {
    return monitor.isOver({ shallow: true });
  },
  drop(props) {
    return {
      id: props.id,
      end: props.end,
    };
  },
};

class ScriptEditorEvent extends Component {
  constructor() {
    super();
    this.state = {
      rename: false,
      clipboardEvent: null,
    };
  }

  toggleOpen = () => {
    const { id, action, onEdit } = this.props;
    onEdit(id, {
      __collapse: !action.args.__collapse,
    });
  };

  toggleComment = () => {
    const { id, action, onEdit } = this.props;
    onEdit(id, {
      __comment: !action.args.__comment,
    });
  };

  toggleElse = () => {
    const { id, action, onEdit } = this.props;
    onEdit(id, {
      __disableElse: !action.args.__disableElse,
    });
  };

  toggleRename = () => {
    this.setState((prevState) => {
      return {
        rename: !prevState.rename,
      };
    });
  };

  submitOnEnter = (e) => {
    if (e.key === "Enter") {
      this.toggleRename();
    }
  };

  onPasteValues = (_e) => {
    const { id, onEdit, action } = this.props;
    const { clipboardEvent } = this.state;
    if (!clipboardEvent || Array.isArray(clipboardEvent)) {
      // Can't paste values if copied entire script, or not copied anything
      return;
    }
    // Only include values from clipboard event that existed on current event already
    const newArgs = Object.keys(clipboardEvent.args || {}).reduce(
      (memo, key) => {
        if (action.args && action.args[key] !== undefined) {
          return {
            ...memo,
            [key]: clipboardEvent.args[key],
          };
        }
        return memo;
      },
      {}
    );
    onEdit(id, newArgs);
  };

  onPasteEvent = (before) => (_e) => {
    const { id, onPaste } = this.props;
    const clipboardEvent = this.readClipboard();
    if (clipboardEvent) {
      onPaste(id, clipboardEvent, before);
    }
  };

  onEdit = (newValue, postUpdate) => {
    const { onEdit, action, id } = this.props;
    if (postUpdate) {
      return onEdit(
        id,
        postUpdate(
          {
            ...action.args,
            ...newValue,
          },
          action.args
        )
      );
    }
    return onEdit(id, newValue);
  };

  onEditLabel = (e) => {
    const { onEdit, id } = this.props;
    onEdit(id, {
      __label: e.currentTarget.value,
    });
  };

  readClipboard = (_e) => {
    try {
      const clipboardData = JSON.parse(clipboard.readText());
      if (clipboardData.__type === "event") {
        this.setState({ clipboardEvent: clipboardData.event });
        return clipboardData.event;
      }
      if (clipboardData.__type === "script") {
        this.setState({ clipboardEvent: clipboardData.script });
        return clipboardData.script;
      }
      this.setState({ clipboardEvent: null });
      return null;
    } catch (err) {
      this.setState({ clipboardEvent: null });
      return null;
    }
  };

  editCustomEvent = (_e) => {
    const { onSelectCustomEvent, action } = this.props;
    if (action.args.customEventId) {
      onSelectCustomEvent(action.args.customEventId);
    }
  };

  render() {
    const {
      id,
      entityId,
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
      onSelectCustomEvent,
      onMouseEnter,
      onMouseLeave,
    } = this.props;
    const { rename, clipboardEvent } = this.state;
    const { command } = action;

    if (command === EVENT_END) {
      return connectDropTarget(
        <div
          className={cx("ScriptEditorEvent", "ScriptEditorEvent--Add", {
            "ScriptEditorEvent--Dragging": isDragging,
            "ScriptEditorEvent--Over": isOverCurrent,
          })}
        >
          <AddCommandButton
            onAdd={onAdd(id)}
            onPaste={this.onPasteEvent(true)}
            type={type}
          />
        </div>
      );
    }

    const open = action.args && !action.args.__collapse;
    const childKeys = action.children ? Object.keys(action.children) : [];
    const isComment = command === EVENT_COMMENT;
    const commented = action.args && action.args.__comment;
    const hasElse = action.children && action.children.false;
    const disabledElse = action.args && action.args.__disableElse;

    const localisedCommand = l10n(command);
    const defaultCommandName =
      localisedCommand !== command
        ? localisedCommand
        : (events[command] && events[command].name) || command;

    const eventName = action.args.__name || defaultCommandName;

    const labelName = action.args.__label
      ? action.args.__label
      : isComment && action.args.text;

    const hoverName = labelName || eventName;

    return connectDropTarget(
      connectDragPreview(
        <div
          className={cx("ScriptEditorEvent", {
            "ScriptEditorEvent--Dragging": isDragging,
            "ScriptEditorEvent--Over": isOverCurrent,
            "ScriptEditorEvent--Conditional":
              childKeys.length > 0 && command !== EVENT_CALL_CUSTOM_EVENT,
            "ScriptEditorEvent--Commented": commented,
          })}
        >
          <div
            className="ScriptEditorEvent__Content"
            onMouseEnter={() => onMouseEnter(id)}
            onMouseLeave={() => onMouseLeave(id)}
          >
            {connectDragSource(
              <div
                className={cx("ScriptEditorEvent__Command", {
                  "ScriptEditorEvent__Command--Open": open,
                  EventComment: isComment || commented,
                })}
                onClick={this.toggleOpen}
              >
                <TriangleIcon />{" "}
                {commented || isComment ? <span>{COMMENT_PREFIX} </span> : ""}
                {labelName ? (
                  <span>
                    {labelName}
                    <small>{eventName}</small>
                  </span>
                ) : (
                  <span>{eventName}</span>
                )}
              </div>
            )}

            <div className="ScriptEditorEvent__Dropdown">
              <DropdownButton
                small
                transparent
                right
                onMouseDown={this.readClipboard}
              >
                {command === EVENT_CALL_CUSTOM_EVENT && [
                  <MenuItem key="0" onClick={this.editCustomEvent}>
                    {l10n("MENU_EDIT_CUSTOM_EVENT")}
                  </MenuItem>,
                  <MenuDivider key="1" />,
                ]}
                <MenuItem onClick={this.toggleRename}>
                  {l10n("MENU_RENAME_EVENT")}
                </MenuItem>
                <MenuItem onClick={this.toggleComment}>
                  {commented
                    ? l10n("MENU_REENABLE_EVENT")
                    : l10n("MENU_DISABLE_EVENT")}
                </MenuItem>
                {hasElse && (
                  <MenuItem onClick={this.toggleElse}>
                    {disabledElse
                      ? l10n("MENU_REENABLE_ELSE")
                      : l10n("MENU_DISABLE_ELSE")}
                  </MenuItem>
                )}
                <MenuDivider />
                <MenuItem onClick={onCopy(action)}>
                  {l10n("MENU_COPY_EVENT")}
                </MenuItem>
                {clipboardEvent && !Array.isArray(clipboardEvent) && (
                  <MenuDivider />
                )}
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
              <div className="ScriptEditorEvent__Rename">
                <FormField>
                  <div style={{ display: "flex" }}>
                    <input
                      placeholder={l10n("FIELD_LABEL")}
                      value={action.args.__label || ""}
                      autoFocus
                      onBlur={this.toggleRename}
                      onChange={this.onEditLabel}
                      onKeyDown={this.submitOnEnter}
                    />
                    <div className="SelectRenamable__EditBtn SelectRenamable__SaveBtn">
                      {l10n("FIELD_SAVE")}
                    </div>
                  </div>
                </FormField>
              </div>
            )}

            {open && events[command] && events[command].fields && (
              <ScriptEditorEventHelper event={action} />
            )}
            {open && events[command] && events[command].fields && (
              <ScriptEventForm
                id={action.id}
                entityId={entityId}
                command={command}
                value={action.args}
                onChange={this.onEdit}
                renderEvents={(key) => (
                  <div className="ScriptEditorEvent__Children" key={key}>
                    {(
                      action.children[key] || [
                        {
                          id: uuid(),
                          command: EVENT_END,
                        },
                      ]
                    ).map((childAction) => (
                      // eslint-disable-next-line @typescript-eslint/no-use-before-define
                      <ScriptEditorEventDnD
                        key={childAction.id}
                        id={childAction.id}
                        entityId={entityId}
                        type={type}
                        path={`${id}_true_${childAction.id}`}
                        action={childAction}
                        moveActions={moveActions}
                        onAdd={onAdd}
                        onRemove={onRemove}
                        onEdit={onEdit}
                        onCopy={onCopy}
                        onPaste={onPaste}
                        onSelectCustomEvent={onSelectCustomEvent}
                        onMouseEnter={onMouseEnter}
                        onMouseLeave={onMouseLeave}
                      />
                    ))}
                    <div
                      className="ScriptEditorEvent__ChildrenBorder"
                      title={hoverName}
                    />
                  </div>
                )}
              />
            )}
          </div>
        </div>
      )
    );
  }
}

ScriptEditorEvent.propTypes = {
  id: PropTypes.string.isRequired,
  entityId: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  action: EventShape.isRequired,
  isDragging: PropTypes.bool.isRequired,
  isOverCurrent: PropTypes.bool.isRequired,
  onAdd: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onCopy: PropTypes.func.isRequired,
  onPaste: PropTypes.func.isRequired,
  onSelectCustomEvent: PropTypes.func.isRequired,
  moveActions: PropTypes.func.isRequired,
  onMouseLeave: PropTypes.func.isRequired,
  onMouseEnter: PropTypes.func.isRequired,
  connectDragSource: PropTypes.func.isRequired,
  connectDragPreview: PropTypes.func.isRequired,
  connectDropTarget: PropTypes.func.isRequired,
};

const ScriptEditorEventDnD = DropTarget(
  ItemTypes.CARD,
  cardTarget,
  (dndConnect, monitor) => ({
    connectDropTarget: dndConnect.dropTarget(),
    isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true }),
  })
)(
  DragSource(ItemTypes.CARD, cardSource, (dndConnect, monitor) => ({
    connectDragSource: dndConnect.dragSource(),
    connectDragPreview: dndConnect.dragPreview(),
    isDragging: monitor.isDragging(),
  }))(ScriptEditorEvent)
);

export default ScriptEditorEventDnD;

import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import uuid from "uuid/v4";
import { DragSource, DropTarget } from "react-dnd";
import { CloseIcon, TriangleIcon } from "../library/Icons";
import AddCommandButton from "./AddCommandButton";
import ScriptEventBlock from "./ScriptEventBlock";
import {
  EventNames,
  EventFields,
  EVENT_IF_TRUE,
  EVENT_IF_FALSE,
  EVENT_IF_VALUE,
  EVENT_IF_INPUT,
  EVENT_END,
  EVENT_LOOP
} from "../../lib/compiler/eventTypes";
import {
  patchEvents,
  prependEvent,
  filterEvents,
  findEvent
} from "../../lib/helpers/eventSystem";
import * as actions from "../../actions";
import { DropdownButton } from "../library/Button";
import { MenuItem, MenuDivider } from "../library/Menu";

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
    [EVENT_IF_TRUE, EVENT_IF_FALSE, EVENT_IF_VALUE, EVENT_IF_INPUT].indexOf(
      command
    ) > -1
  );
};

class ActionMini extends Component {
  constructor(props) {
    super(props);
    this.state = {
      elseOpen: props.action.false && props.action.false.length > 1
    };
  }

  toggleElseOpen = () => {
    this.setState({
      elseOpen: !this.state.elseOpen
    });
  };

  render() {
    const {
      id,
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
      onMouseEnter,
      onMouseLeave
    } = this.props;
    const { command } = action;
    const { elseOpen } = this.state;

    if (command === EVENT_END) {
      return connectDropTarget(
        <div
          className={cx("ActionMini", "ActionMini--Add", {
            "ActionMini--Dragging": isDragging,
            "ActionMini--Over": isOverCurrent
          })}
        >
          <AddCommandButton onAdd={onAdd(id)} />
        </div>
      );
    }

    return connectDropTarget(
      connectDragPreview(
        <div
          className={cx("ActionMini", {
            "ActionMini--Dragging": isDragging,
            "ActionMini--Over": isOverCurrent,
            "ActionMini--Conditional":
              isConditionalEvent(command) || command === EVENT_LOOP
          })}
        >
          <div
            className="ActionMini__Content"
            onMouseEnter={() => onMouseEnter(id)}
            onMouseLeave={() => onMouseLeave(id)}
          >
            {connectDragSource(
              <div className="ActionMini__Command">
                {EventNames[command] || command}
              </div>
            )}

            <div className="ActionMini__Dropdown">
              <DropdownButton small transparent right>
                <MenuItem>Copy Values</MenuItem>
                <MenuItem>Paste Values</MenuItem>
                <MenuDivider />
                <MenuItem>Copy Event</MenuItem>
                <MenuItem>Paste Event Before</MenuItem>
                <MenuItem>Paste Event After</MenuItem>
                <MenuDivider />
                <MenuItem onClick={onRemove(id)}>Delete Event</MenuItem>
              </DropdownButton>
            </div>

            <ScriptEventBlock
              command={command}
              value={action.args}
              onChange={newValue => {
                onEdit(id, newValue);
              }}
            />

            {action.true &&
              connectDropTarget(
                <div className="ActionMini__Children">
                  {action.true.map((action, index) => (
                    <ActionMiniDnD
                      key={index}
                      id={action.id}
                      path={id + "_true_" + action.id}
                      action={action}
                      moveActions={moveActions}
                      onAdd={onAdd}
                      onRemove={onRemove}
                      onEdit={onEdit}
                      onMouseEnter={onMouseEnter}
                      onMouseLeave={onMouseLeave}
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
                    path={id + "_true_" + action.id}
                    action={action}
                    moveActions={moveActions}
                    onAdd={onAdd}
                    onRemove={onRemove}
                    onEdit={onEdit}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
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

  onAdd = id => command => {
    const root = this.props.value;
    const eventFields = EventFields[command];
    const defaultArgs = eventFields
      ? eventFields.reduce((memo, field) => {
          if (field.defaultValue === "LAST_SCENE") {
            memo[field.key] = this.props.scenes[
              this.props.scenes.length - 1
            ].id;
          } else if (field.defaultValue === "LAST_VARIABLE") {
            memo[field.key] =
              this.props.variables.length > 0
                ? this.props.variables[this.props.variables.length - 1].id
                : 0;
          } else if (field.defaultValue === "LAST_MUSIC") {
            memo[field.key] = this.props.music[0].id;
          } else if (field.defaultValue === "LAST_SPRITE") {
            memo[field.key] = this.props.spriteSheets[0].id;
          } else if (field.defaultValue !== undefined) {
            memo[field.key] = field.defaultValue;
          }
          return memo;
        }, {})
      : {};
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

  onEnter = id => {
    this.props.selectScriptEvent(id);
  };

  onLeave = id => {
    this.props.selectScriptEvent("");
  };

  render() {
    const { value } = this.props;
    return (
      <div className="ScriptEditor">
        {value.map((action, index) => (
          <ActionMiniDnD
            key={action.id}
            id={action.id}
            action={action}
            moveActions={this.moveActions}
            onAdd={this.onAdd}
            onRemove={this.onRemove}
            onEdit={this.onEdit}
            onMouseEnter={this.onEnter}
            onMouseLeave={this.onLeave}
          />
        ))}
        {false && JSON.stringify(value, null, 4)}
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
    music: state.project.present && state.project.present.music,
    spriteSheets: state.project.present && state.project.present.spriteSheets
  };
}

const mapDispatchToProps = {
  selectScriptEvent: actions.selectScriptEvent
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ScriptEditor);

import React, { Component } from "react";
import cx from "classnames";
import { DragSource, DropTarget, DragDropContext } from "react-dnd";
import { CloseIcon } from "../Icons";
import HTML5Backend from "react-dnd-html5-backend";
import ItemTypes from "../../ItemTypes";
import AddCommandButton from "./AddCommandButton";
import ActorSelect from "../ActorSelect";
import ScriptEventBlock from "./ScriptEventBlock";
import { EVENT_IF_FLAG, EVENT_END } from "../../lib/data/compiler/eventTypes";

const uuid = a => {
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid);
};

const findData = (data, id) => {
  var r = null;
  for (let i = 0; i < data.length; i++) {
    var o = data[i];
    if (o.id === id) {
      return o;
    }
    if (o.true) {
      r = findData(o.true, id);
      if (r) return r;
    }
    if (o.false) {
      r = findData(o.false, id);
      if (r) return r;
    }
  }
  return r;
};

const filterData = (data, id) => {
  return data.reduce((memo, o) => {
    if (o.id !== id) {
      memo.push({
        ...o,
        true: o.true && filterData(o.true, id),
        false: o.false && filterData(o.false, id)
      });
    }
    return memo;
  }, []);
};

const prependData = (data, id, newData) => {
  var r = data.reduce((memo, o) => {
    if (o.true) o.true = prependData(o.true, id, newData);
    if (o.false) o.false = prependData(o.false, id, newData);
    if (o.id === id) {
      memo.push(newData);
    }
    memo.push(o);
    return memo;
  }, []);
  return r;
};

const patchData = (data, id, patch) => {
  var r = data.reduce((memo, o) => {
    if (o.true) {
      o.true = patchData(o.true, id, patch);
    }
    if (o.false) {
      o.false = patchData(o.false, id, patch);
    }
    if (o.id === id) {
      memo.push({
        ...o,
        args: {
          ...o.args,
          ...patch
        }
      });
    } else {
      memo.push(o);
    }
    return memo;
  }, []);
  return r;
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

class ActionMini extends Component {
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
      onRemove
    } = this.props;
    const { command } = action;

    if (command === EVENT_END) {
      return (
        <div className="ActionMini">
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
            "ActionMini--Conditional": command === EVENT_IF_FLAG
          })}
        >
          <div className="ActionMini__Content">
            {connectDragSource(
              <div className="ActionMini__Command">{command}</div>
            )}

            <div className="ActionMini__Remove" onClick={onRemove(id)}>
              <CloseIcon />
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
                    />
                  ))}
                </div>
              )}
            {action.false && <div className="ActionMini__Else">ELSE</div>}
            {action.false && (
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
  moveActions = (a, b, tree) => {
    const root = this.props.value;
    if (a === b) {
      return;
    }
    const input = prependData(filterData(root, a), b, findData(root, a));
    this.setState({
      input
    });
    this.props.onChange(input);
  };

  onAdd = id => command => {
    const root = this.props.value;
    const input = prependData(
      root,
      id,
      Object.assign(
        {
          id: uuid(),
          command,
          args: {}
        },
        command === "IF_FLAG" && {
          true: [
            {
              id: uuid(),
              command: "END"
            }
          ],
          false: [
            {
              id: uuid(),
              command: "END"
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
    const input = filterData(root, id);
    this.setState({
      input
    });
    this.props.onChange(input);
  };

  onEdit = (id, patch) => {
    console.log("ONEDIT", id, patch);
    const root = this.props.value;
    const input = patchData(root, id, patch);

    this.setState({
      input
    });
    this.props.onChange(input);
  };

  render() {
    // const { input } = this.state;
    const { value } = this.props;
    // const output = [];
    // compile(value, output);
    return (
      <div className="ScriptEditor">
        {value.map((action, index) => (
          <ActionMiniDnD
            key={index}
            id={action.id}
            action={action}
            moveActions={this.moveActions}
            onAdd={this.onAdd}
            onRemove={this.onRemove}
            onEdit={this.onEdit}
          />
        ))}
        {false && JSON.stringify(value, null, 4)}

        {/* <div className="Output">
          {output.map((line, num) =>
            <div>
              {String(num).padStart(2, " ")} : {line}
            </div>
          )}
        </div>*/}
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

export default DragDropContext(HTML5Backend)(ScriptEditor);

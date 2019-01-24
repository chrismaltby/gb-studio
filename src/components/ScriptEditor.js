import React, { Component } from "react";
import { connect } from "react-redux";
import cx from "classnames";
import { DragSource, DropTarget, DragDropContext } from "react-dnd";
import { CloseIcon } from "./Icons";
import HTML5Backend from "react-dnd-html5-backend";
import ItemTypes from "../ItemTypes";
import AddCommandButton from "./AddCommandButton";
import FlagSelect from "./FlagSelect";
import MapSelect from "./MapSelect";
import ActorSelect from "./ActorSelect";
import DirectionPicker from "./DirectionPicker";
import FadeSpeedSelect from "./FadeSpeedSelect";
import CameraSpeedSelect from "./CameraSpeedSelect";
import * as actions from "../actions";

const uuid = a => {
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid);
};

const trim4lines = string => {
  return string
    .replace(/^([^\n]*\n[^\n]*\n[^\n]*\n[^\n]*)[\w\W]*/g, "$1")
    .split("\n")
    .map(line => line.substring(0, 18))
    .join("\n");
};

const compile = (input, output) => {
  for (let i = 0; i < input.length; i++) {
    const command = input[i].command;

    if (command === "MOVE_TO") {
      output.push(input[i].command);
      output.push(input[i].args.x);
      output.push(input[i].args.y);
      output.push(input[i].args.speed);
    } else if (command === "TEXT") {
      output.push(input[i].command);
      output.push(input[i].args.text);
    } else if (command === "IF_SET") {
      output.push("UNLESS_SET");
      output.push(input[i].args.flag);
      let ptrIndex = output.length;
      output.push("PTR_PLACEHOLDER1");
      output.push("PTR_PLACEHOLDER2");
      compile(input[i].true, output);
      const falsePointer = output.length;
      console.log("A", output, output.length);
      output[ptrIndex] = falsePointer >> 8;
      output[ptrIndex + 1] = falsePointer & 0xff;
      compile(input[i].false, output);
    } else if (command === "END") {
      // output.push(input[i].command);
    }
  }
  // if (output[output.length - 1] !== "END") {
  output.push("END");
  // }
  return output;
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

    // const { id: droppedId } = monitor.getItem();
    // const { id: targetId } = monitor.getDropResult({ shallow: true });
    // const didDrop = monitor.didDrop();

    // // console.log({ droppedId, targetId });
    // props.moveActions(droppedId, targetId);

    // // if (!didDrop) {
    //   props.moveCard(droppedId);
    // }
  }
};

const cardTarget = {
  canDrop(props, monitor) {
    // console.log("canDrop", monitor.isOver({ shallow: true }));
    return monitor.isOver({ shallow: true });
  },
  drop(props) {
    console.log("DROPPP");
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
      onRemove,
      onRenameFlag
    } = this.props;
    const { command } = action;

    if (command === "END") {
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
            "ActionMini--Over": isOverCurrent
          })}
        >
          <div className="ActionMini__Content">
            {connectDragSource(
              <div className="ActionMini__Command">{command}</div>
            )}

            <div className="ActionMini__Remove" onClick={onRemove(id)}>
              <CloseIcon />
            </div>

            {command === "TEXT" ? (
              <div className="ActionMini__Form">
                <textarea
                  rows="4"
                  style={{
                    textTransform: "uppercase",
                    fontFamily: "monospace"
                  }}
                  value={action.args.text}
                  onChange={e => {
                    onEdit(id, {
                      text: trim4lines(e.currentTarget.value)
                    });
                  }}
                />
              </div>
            ) : command === "WAIT" ? (
              <div className="ActionMini__Form">
                <span className="ActionMini__Flex">
                  <label>Time</label>
                  <input
                    value={action.args.time}
                    type="number"
                    onChange={e => {
                      onEdit(id, {
                        time: parseInt(e.currentTarget.value, 10)
                      });
                    }}
                  />
                </span>
              </div>
            ) : command === "SET_FLAG" ? (
              <div className="ActionMini__Form">
                <span className="ActionMini__Flex">
                  <span className="Select">
                    <FlagSelect
                      value={action.args.flag}
                      onChange={e => {
                        onEdit(id, {
                          flag: e.currentTarget.value
                        });
                      }}
                    />
                  </span>
                  <div
                    className="ActionMini__Link"
                    onClick={() => onRenameFlag(action.args.flag || "0")}
                  >
                    Rename
                  </div>
                </span>
              </div>
            ) : command === "CLEAR_FLAG" ? (
              <div className="ActionMini__Form">
                <span className="ActionMini__Flex">
                  <span className="Select">
                    <FlagSelect
                      value={action.args.flag}
                      onChange={e => {
                        onEdit(id, {
                          flag: e.currentTarget.value
                        });
                      }}
                    />
                  </span>
                  <div
                    className="ActionMini__Link"
                    onClick={() => onRenameFlag(action.args.flag || "0")}
                  >
                    Rename
                  </div>
                </span>
              </div>
            ) : command === "IF_FLAG" ? (
              <div className="ActionMini__Form">
                <span className="ActionMini__Flex">
                  <span className="Select">
                    <FlagSelect
                      value={action.args.flag}
                      onChange={e => {
                        onEdit(id, {
                          flag: e.currentTarget.value
                        });
                      }}
                    />
                  </span>
                  <div
                    className="ActionMini__Link"
                    onClick={() => onRenameFlag(action.args.flag || "0")}
                  >
                    Rename
                  </div>
                </span>
              </div>
            ) : command === "ACTOR_SET_DIRECTION" ? (
              <div className="ActionMini__Form">
                <div className="ActionMini__FormRow">
                  <span className="Select">
                    <ActorSelect
                      value={action.args.actorId}
                      onChange={e => {
                        onEdit(id, {
                          actorId: e.currentTarget.value
                        });
                      }}
                    />
                  </span>
                </div>
                <div className="ActionMini__FormRow">
                  <DirectionPicker
                    value={action.args.direction}
                    onChange={e => {
                      onEdit(id, {
                        direction: e
                      });
                    }}
                  />
                </div>
              </div>
            ) : command === "ACTOR_SET_POSITION" ? (
              <div className="ActionMini__Form">
                <div className="ActionMini__FormRow">
                  <span className="Select">
                    <ActorSelect
                      value={action.args.actorId}
                      onChange={e => {
                        onEdit(id, {
                          actorId: e.currentTarget.value
                        });
                      }}
                    />
                  </span>
                </div>
                <div className="ActionMini__FormRow">
                  <label>X</label>
                  <input
                    type="number"
                    value={action.args.x}
                    min={1}
                    onChange={e => {
                      onEdit(id, {
                        x: parseInt(e.currentTarget.value, 10)
                      });
                    }}
                  />
                  <label>Y</label>
                  <input
                    type="number"
                    value={action.args.y}
                    min={1}
                    onChange={e => {
                      onEdit(id, {
                        y: parseInt(e.currentTarget.value, 10)
                      });
                    }}
                  />
                </div>
              </div>
            ) : command === "ACTOR_MOVE_TO" ? (
              <div className="ActionMini__Form">
                <div className="ActionMini__FormRow">
                  <span className="Select">
                    <ActorSelect
                      value={action.args.actorId}
                      onChange={e => {
                        onEdit(id, {
                          actorId: e.currentTarget.value
                        });
                      }}
                    />
                  </span>
                </div>
                <div className="ActionMini__FormRow">
                  <label>X</label>
                  <input
                    type="number"
                    value={action.args.x}
                    min={1}
                    onChange={e => {
                      onEdit(id, {
                        x: parseInt(e.currentTarget.value, 10)
                      });
                    }}
                  />
                  <label>Y</label>
                  <input
                    type="number"
                    value={action.args.y}
                    min={1}
                    onChange={e => {
                      onEdit(id, {
                        y: parseInt(e.currentTarget.value, 10)
                      });
                    }}
                  />
                </div>
              </div>
            ) : command === "FADE_IN" ? (
              <div className="ActionMini__Form">
                <div className="Select">
                  <FadeSpeedSelect
                    defaultValue="2"
                    value={action.args.speed}
                    onChange={e => {
                      onEdit(id, {
                        speed: parseInt(e.currentTarget.value)
                      });
                    }}
                  />
                </div>
              </div>
            ) : command === "FADE_OUT" ? (
              <div className="ActionMini__Form">
                <div className="Select">
                  <FadeSpeedSelect
                    defaultValue="2"
                    value={action.args.speed}
                    onChange={e => {
                      onEdit(id, {
                        speed: parseInt(e.currentTarget.value)
                      });
                    }}
                  />
                </div>
              </div>
            ) : command === "CAMERA_MOVE_TO" ? (
              <div className="ActionMini__Form">
                <div className="ActionMini__FormRow">
                  <label>X</label>
                  <input
                    type="number"
                    value={action.args.x}
                    min={1}
                    onChange={e => {
                      onEdit(id, {
                        x: parseInt(e.currentTarget.value, 10)
                      });
                    }}
                  />
                  <label>Y</label>
                  <input
                    type="number"
                    value={action.args.y}
                    min={1}
                    onChange={e => {
                      onEdit(id, {
                        y: parseInt(e.currentTarget.value, 10)
                      });
                    }}
                  />
                </div>
                <div className="ActionMini__FormRow">
                  <div className="Select">
                    <CameraSpeedSelect
                      allowNone
                      value={action.args.speed}
                      onChange={e => {
                        onEdit(id, {
                          speed: parseInt(e.currentTarget.value)
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : command === "CAMERA_LOCK" ? (
              <div className="ActionMini__Form">
                <div className="Select">
                  <CameraSpeedSelect
                    allowNone
                    value={action.args.speed}
                    onChange={e => {
                      onEdit(id, {
                        speed: parseInt(e.currentTarget.value)
                      });
                    }}
                  />
                </div>
              </div>
            ) : command === "LOAD_MAP" ? (
              <div className="ActionMini__Form">
                <div className="ActionMini__FormRow">
                  <div className="Select">
                    <MapSelect
                      value={action.args.map}
                      onChange={e => {
                        onEdit(id, {
                          map: e.currentTarget.value
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : command === "LOAD_BATTLE" ? (
              <div className="ActionMini__Form">
                <div className="ActionMini__FormRow">
                  <label>Encounter</label>
                  <input
                    type="number"
                    value={action.args.encounter}
                    min={0}
                    onChange={e => {
                      onEdit(id, {
                        encounter: parseInt(e.currentTarget.value, 10)
                      });
                    }}
                  />
                </div>
              </div>
            ) : command === "SET_EMOTION" ? (
              <div className="ActionMini__Form">
                <div className="ActionMini__FormRow">
                  <span className="Select">
                    <ActorSelect
                      value={action.args.actorId}
                      onChange={e => {
                        onEdit(id, {
                          actorId: e.currentTarget.value
                        });
                      }}
                    />
                  </span>
                </div>
                <div className="ActionMini__FormRow">
                  <span className="Select">
                    <label>Emotion</label>
                    <select
                      value={action.args.emotionType}
                      onChange={e => {
                        onEdit(id, {
                          emotionType: parseInt(e.currentTarget.value, 10)
                        });
                      }}
                    >
                      <option value="0">Shock</option>
                      <option value="1">Question</option>
                      <option value="2">Love</option>
                      <option value="3">Pause</option>
                      <option value="4">Anger</option>
                      <option value="5">Sweat</option>
                      <option value="6">Music</option>
                      <option value="7">Sleep</option>
                    </select>
                  </span>
                </div>
              </div>
            ) : command === "TRANSITION_MAP" ? (
              <div className="ActionMini__Form">
                <div className="ActionMini__FormRow">
                  <div className="Select">
                    <MapSelect
                      value={action.args.map}
                      onChange={e => {
                        onEdit(id, {
                          map: e.currentTarget.value
                        });
                      }}
                    />
                  </div>
                </div>
                <div className="ActionMini__FormRow">
                  <label>X</label>
                  <input
                    type="number"
                    value={action.args.x}
                    min={1}
                    onChange={e => {
                      onEdit(id, {
                        x: parseInt(e.currentTarget.value, 10)
                      });
                    }}
                  />
                  <label>Y</label>
                  <input
                    type="number"
                    value={action.args.y}
                    min={1}
                    onChange={e => {
                      onEdit(id, {
                        y: parseInt(e.currentTarget.value, 10)
                      });
                    }}
                  />
                  <DirectionPicker
                    value={action.args.direction}
                    onChange={e => {
                      onEdit(id, {
                        direction: e
                      });
                    }}
                  />
                </div>
                <div className="ActionMini__FormRow">
                  <label>Fade In</label>
                  <div className="Select">
                    <FadeSpeedSelect
                      allowNone
                      defaultValue="2"
                      value={action.args.fadeInSpeed}
                      onChange={e => {
                        onEdit(id, {
                          fadeInSpeed: parseInt(e.currentTarget.value)
                        });
                      }}
                    />
                  </div>
                  <label>Fade Out</label>
                  <div className="Select">
                    <FadeSpeedSelect
                      allowNone
                      defaultValue="2"
                      value={action.args.fadeOutSpeed}
                      onChange={e => {
                        onEdit(id, {
                          fadeOutSpeed: parseInt(e.currentTarget.value)
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}

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
                      onRenameFlag={onRenameFlag}
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
                    onRenameFlag={onRenameFlag}
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
    console.log("SWAP A => B", a, b);
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

  onRenameFlag = index => {
    const name = window.prompt("Rename flag to");
    if (name === null) {
      return;
    }
    if (name.length === 0) {
      this.props.renameFlag(index, null);
    } else {
      this.props.renameFlag(index, name);
    }
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
            onRenameFlag={this.onRenameFlag}
          />
        ))}
        {JSON.stringify(value, null, 4)}

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
      command: "END"
    }
  ]
};

function mapStateToProps(state) {
  return {
    flags: state.world.flags
  };
}

const mapDispatchToProps = {
  renameFlag: actions.renameFlag
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(DragDropContext(HTML5Backend)(ScriptEditor));

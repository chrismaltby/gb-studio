import React, { Component } from "react";
import cx from "classnames";
import Button from "./Button";

const actions = [
  "TEXT",
  "IF_FLAG",
  "SET_FLAG",
  "CLEAR_FLAG",
  "FADE_IN",
  "FADE_OUT",
  "WAIT",
  "LOAD_MAP",
  "LOAD_BATTLE",
  "TRANSITION_MAP",
  "ACTOR_SET_DIRECTION",
  "ACTOR_SET_POSITION",
  "ACTOR_MOVE_TO",
  "CAMERA_MOVE_TO",
  "CAMERA_LOCK",
  "SHOW_SPRITES",
  "HIDE_SPRITES",
  "SHOW_PLAYER",
  "HIDE_PLAYER",
  "SET_EMOTION"
];
const recentActions = ["TEXT", "TRANSITION_MAP", "IF_FLAG", "SET_FLAG"];

const DIRECTION_UP = "UP";
const DIRECTION_DOWN = "DOWN";

class AddCommandButton extends Component {
  constructor(props) {
    super(props);
    this.button = React.createRef();
    this.state = {
      query: "",
      open: false
    };
  }

  onOpen = () => {
    const boundingRect = this.button.current.getBoundingClientRect();
    this.setState({
      open: true,
      direction: boundingRect.y > 300 ? DIRECTION_UP : DIRECTION_DOWN
    });
  };

  onClose = () => {
    setTimeout(() => {
      this.setState({
        open: false
      });
    }, 500);
  };

  onAdd = action => () => {
    this.props.onAdd(action);
    this.setState({
      open: false
    });
  };

  onSearch = e => {
    this.setState({
      query: e.currentTarget.value
    });
  };

  render() {
    const { query, open, direction } = this.state;
    const actionsList = query
      ? actions.filter(action => {
          return action.toUpperCase().indexOf(query.toUpperCase()) > -1;
        })
      : actions;
    return (
      <div ref={this.button} className="AddCommandButton">
        <Button onClick={this.onOpen}>Add Command</Button>
        {open && (
          <div
            className={cx("AddCommandButton__Menu", {
              "AddCommandButton__Menu--Upwards": direction === DIRECTION_UP
            })}
          >
            <div className="AddCommandButton__Search">
              <input
                autoFocus
                placeholder="Search..."
                onChange={this.onSearch}
                onBlur={this.onClose}
                value={query}
              />
            </div>
            <div className="AddCommandButton__List">
              {!query &&
                recentActions.map(action => (
                  <div
                    key={action}
                    className="AddCommandButton__ListItem"
                    onClick={this.onAdd(action)}
                  >
                    {action}
                  </div>
                ))}
              <div className="AddCommandButton__ListDivider" />
              {actionsList.map(action => (
                <div
                  key={action}
                  className="AddCommandButton__ListItem"
                  onClick={this.onAdd(action)}
                >
                  {action}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default AddCommandButton;

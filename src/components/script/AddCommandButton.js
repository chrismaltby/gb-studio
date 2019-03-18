import React, { Component } from "react";
import cx from "classnames";
import Button from "../library/Button";
import { EventFields, EventNames } from "../../lib/compiler/eventTypes";

const actions = Object.keys(EventFields).sort((a, b) => {
  var textA = (EventNames[a] || a).toUpperCase();
  var textB = (EventNames[b] || b).toUpperCase();
  return textA < textB ? -1 : textA > textB ? 1 : 0;
});

const DIRECTION_UP = "UP";
const DIRECTION_DOWN = "DOWN";

class AddCommandButton extends Component {
  constructor(props) {
    super(props);
    this.button = React.createRef();
    this.state = {
      query: "",
      selectedIndex: 0,
      open: false
    };
    this.timeout = null;
  }

  onOpen = () => {
    const boundingRect = this.button.current.getBoundingClientRect();
    this.setState({
      open: true,
      query: "",
      direction: boundingRect.y > 300 ? DIRECTION_UP : DIRECTION_DOWN
    });
  };

  onClose = () => {
    this.timeout = setTimeout(() => {
      this.setState({
        open: false
      });
    }, 500);
  };

  onAdd = action => () => {
    clearTimeout(this.timeout);
    this.props.onAdd(action);
    this.setState({
      open: false
    });
  };

  onHover = actionIndex => () => {
    this.setState({
      selectedIndex: actionIndex
    });
  };

  onSearch = e => {
    this.setState({
      query: e.currentTarget.value
    });
  };

  onKeyDown = e => {
    const { selectedIndex } = this.state;
    const actionsList = this.filteredList();
    if (e.key === "Enter") {
      if (actionsList[selectedIndex]) {
        this.onAdd(actionsList[selectedIndex])();
      }
    } else if (e.key === "ArrowDown") {
      this.setState({
        selectedIndex: Math.min(actionsList.length - 1, selectedIndex + 1)
      });
    } else if (e.key === "ArrowUp") {
      this.setState({ selectedIndex: Math.max(0, selectedIndex - 1) });
    } else {
      this.setState({
        selectedIndex: Math.max(
          0,
          Math.min(actionsList.length - 1, selectedIndex)
        )
      });
    }
  };

  filteredList = () => {
    const { query } = this.state;
    return query
      ? actions.filter(action => {
          return (
            (EventNames[action] &&
              EventNames[action].toUpperCase().indexOf(query.toUpperCase()) >
                -1) ||
            action.toUpperCase().indexOf(query.toUpperCase()) > -1
          );
        })
      : actions;
  };

  render() {
    const { query, open, direction, selectedIndex } = this.state;
    const actionsList = this.filteredList();
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
                onKeyDown={this.onKeyDown}
                onBlur={this.onClose}
                value={query}
              />
            </div>
            <div className="AddCommandButton__List">
              <div className="AddCommandButton__ListDivider" />
              {actionsList.map((action, actionIndex) => (
                <div
                  key={action}
                  className={cx("AddCommandButton__ListItem", {
                    "AddCommandButton__ListItem--Selected":
                      selectedIndex === actionIndex
                  })}
                  onClick={this.onAdd(action)}
                  onMouseEnter={this.onHover(actionIndex)}
                >
                  {EventNames[action] || action}
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

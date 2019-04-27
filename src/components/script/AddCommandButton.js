import React, { Component } from "react";
import cx from "classnames";
import Button from "../library/Button";
import {
  EventFields,
  EventsOnlyForActors,
  EVENT_TEXT
} from "../../lib/compiler/eventTypes";
import Highlighter from "react-highlight-words";
import l10n from "../../lib/helpers/l10n";
import trim2lines from "../../lib/helpers/trim2lines";

const EventNames = Object.keys(EventFields).reduce((memo, key) => {
  memo[key] = l10n(key);
  return memo;
}, {});

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
      query: ""
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
    const typeActions = this.typeActions();
    this.setState({
      open: false,
      query: "",
      selectedIndex: typeActions.indexOf(action)
    });
  };

  onAddText = () => {
    clearTimeout(this.timeout);
    this.props.onAdd(EVENT_TEXT, { text: trim2lines(this.state.query) });
    this.setState({
      open: false,
      query: "",
      selectedIndex: 0
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
      } else if (this.state.query.length > 0) {
        this.onAddText();
      }
    } else if (e.key === "Escape") {
      this.setState({
        open: false
      });
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

  onKeyUp = e => {
    const { selectedIndex } = this.state;
    const actionsList = this.filteredList();
    this.setState({
      selectedIndex: Math.max(
        0,
        Math.min(actionsList.length - 1, selectedIndex)
      )
    });
  };

  typeActions = () => {
    const { type } = this.props;
    return actions.filter(action => {
      return type === "actor" || EventsOnlyForActors.indexOf(action) === -1;
    });
  };

  filteredList = () => {
    const { query } = this.state;
    const typeActions = this.typeActions();
    return query
      ? typeActions

          .filter(action => {
            // Split filter into words so they can be in any order
            // and have words between matches
            const queryWords = query.toUpperCase().split(" ");
            const searchName =
              (EventNames[action] ? EventNames[action].toUpperCase() : "") +
              " " +
              action.toUpperCase();
            return queryWords.reduce((memo, word) => {
              return memo && searchName.indexOf(word) > -1;
            }, true);
          })
          .sort((a, b) => {
            // Sort so that first match is listed at top
            const queryWords = query.toUpperCase().split(" ");
            const searchNameA =
              (EventNames[a] ? EventNames[a].toUpperCase() : "") +
              " " +
              a.toUpperCase();
            const searchNameB =
              (EventNames[b] ? EventNames[b].toUpperCase() : "") +
              " " +
              b.toUpperCase();
            const firstMatchA = queryWords.reduce((memo, word) => {
              const index = searchNameA.indexOf(word);
              return index > -1 ? Math.min(memo, index) : memo;
            }, Number.MAX_SAFE_INTEGER);
            const firstMatchB = queryWords.reduce((memo, word) => {
              const index = searchNameB.indexOf(word);
              return index > -1 ? Math.min(memo, index) : memo;
            }, Number.MAX_SAFE_INTEGER);
            return firstMatchA - firstMatchB;
          })
      : typeActions;
  };

  render() {
    const { query, open, selectedIndex } = this.state;
    const actionsList = this.filteredList();
    return (
      <div ref={this.button} className="AddCommandButton">
        <Button onClick={this.onOpen}>{l10n("SIDEBAR_ADD_EVENT")}</Button>
        {open && (
          <div className={cx("AddCommandButton__Menu")}>
            <div className="AddCommandButton__Search">
              <input
                autoFocus
                placeholder="Search..."
                onChange={this.onSearch}
                onKeyDown={this.onKeyDown}
                onKeyUp={this.onKeyUp}
                onBlur={this.onClose}
                value={query}
              />
            </div>
            <div className="AddCommandButton__List">
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
                  <Highlighter
                    highlightClassName="AddCommandButton__ListItem__Highlight"
                    searchWords={query.split(" ")}
                    autoEscape={true}
                    textToHighlight={EventNames[action] || action}
                  />
                </div>
              ))}
              {actionsList.length === 0 && (
                <div
                  className={cx(
                    "AddCommandButton__ListItem",
                    "AddCommandButton__ListItem--Selected"
                  )}
                  onClick={this.onAddText}
                >
                  <Highlighter
                    highlightClassName="AddCommandButton__ListItem__Highlight"
                    searchWords={query.split(" ")}
                    autoEscape={true}
                    textToHighlight={`${EventNames["EVENT_TEXT"]} "${query}"`}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default AddCommandButton;

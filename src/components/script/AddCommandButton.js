import React, { Component } from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import Highlighter from "react-highlight-words";
import { connect } from "react-redux";
import ScrollIntoViewIfNeeded from "react-scroll-into-view-if-needed";
import Button from "../library/Button";
import {
  EventsOnlyForActors,
  EventsHidden,
  EVENT_TEXT,
  EVENT_CALL_CUSTOM_EVENT
} from "../../lib/compiler/eventTypes";
import l10n from "../../lib/helpers/l10n";
import trimlines from "../../lib/helpers/trimlines";
import events from "../../lib/events";
import { CustomEventShape } from "../../reducers/stateShape";
import { getCustomEvents } from "../../reducers/entitiesReducer";

class AddCommandButton extends Component {
  constructor(props) {
    super(props);
    this.button = React.createRef();
    this.state = {
      query: "",
      selectedIndex: 0,
      open: false,
      pasteMode: false
    };
    this.timeout = null;
  }

  componentDidMount() {
    window.addEventListener("keydown", this.detectPasteMode);
    window.addEventListener("keyup", this.detectPasteMode);
    window.addEventListener("blur", this.onBlur);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.detectPasteMode);
    window.removeEventListener("keyup", this.detectPasteMode);
    window.removeEventListener("blur", this.onBlur);
  }

  detectPasteMode = e => {
    if (e.target.nodeName !== "BODY") {
      return;
    }
    this.setState({ pasteMode: e.altKey });
  };

  onBlur = e => {
    this.setState({ pasteMode: false });
  };

  onOpen = () => {
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
    const { onAdd } = this.props;
    clearTimeout(this.timeout);
    const fullList = this.fullList();
    const index = fullList.findIndex(event => event.key === action);
    onAdd(fullList[index].id, fullList[index].args, fullList[index].children);
    this.setState({
      open: false,
      query: "",
      selectedIndex: index
    });
  };

  onAddText = () => {
    const { onAdd } = this.props;
    const { query } = this.state;
    clearTimeout(this.timeout);
    onAdd(EVENT_TEXT, { text: trimlines(query) });
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
    const { selectedIndex, query } = this.state;
    const actionsList = this.filteredList();
    if (e.key === "Enter") {
      if (actionsList[selectedIndex]) {
        this.onAdd(actionsList[selectedIndex].key)();
      } else if (query.length > 0) {
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

  fullList = () => {
    const { type, customEvents } = this.props;

    let callCustomEventEvents = [];
    if (type !== "customEvent") {
      const templateEventCallCustomEvent = events[EVENT_CALL_CUSTOM_EVENT];
      callCustomEventEvents = customEvents.map((customEvent, index) => {
        if (!customEvent) return {};
        const customEventName =
          customEvent.name || `${l10n("CUSTOM_EVENT")} ${index + 1}`;
        const name = `${l10n("CUSTOM_EVENT")}: ${customEventName}`;
        const searchName = `${name.toUpperCase()}`;
        return {
          ...templateEventCallCustomEvent,
          args: {
            customEventId: customEvent.id,
            __name: customEventName
          },
          children: {
            script: customEvent.script
          },
          name,
          searchName,
          key: `EVENT_CALL_CUSTOM_EVENT_${index}`
        };
      });
    }

    return [
      ...Object.keys(events)
        .filter(key => {
          return (
            EventsHidden.indexOf(key) === -1 &&
            (type === "actor" || EventsOnlyForActors.indexOf(key) === -1)
          );
        })
        .map(key => {
          const name = l10n(key) || events[key].name || key;
          const searchName = `${name.toUpperCase()} ${key.toUpperCase()}`;
          return {
            ...events[key],
            name,
            searchName,
            key
          };
        }),
      ...callCustomEventEvents
    ];
  };

  filteredList = () => {
    const { query } = this.state;
    const fullList = this.fullList();

    if (!query) {
      return fullList;
    }

    const queryWords = query.toUpperCase().split(" ");

    return fullList
      .filter(event => {
        // Split filter into words so they can be in any order
        // and have words between matches
        return queryWords.reduce((memo, word) => {
          return memo && event.searchName.indexOf(word) > -1;
        }, true);
      })
      .sort((a, b) => {
        // Sort so that first match is listed at top
        const firstMatchA = queryWords.reduce((memo, word) => {
          const index = a.searchName.indexOf(word);
          return index > -1 ? Math.min(memo, index) : memo;
        }, Number.MAX_SAFE_INTEGER);
        const firstMatchB = queryWords.reduce((memo, word) => {
          const index = b.searchName.indexOf(word);
          return index > -1 ? Math.min(memo, index) : memo;
        }, Number.MAX_SAFE_INTEGER);
        return firstMatchA - firstMatchB;
      });
  };

  render() {
    const { query, open, selectedIndex, pasteMode } = this.state;
    const { onPaste } = this.props;
    const actionsList = this.filteredList();

    return (
      <div ref={this.button} className="AddCommandButton">
        {pasteMode ? (
          <Button onClick={onPaste}>{l10n("MENU_PASTE_EVENT")}</Button>
        ) : (
          <Button onClick={this.onOpen}>{l10n("SIDEBAR_ADD_EVENT")}</Button>
        )}
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
                <ScrollIntoViewIfNeeded
                  active={selectedIndex === actionIndex}
                  options={{
                    behavior: "instant",
                    block: "nearest"
                  }}
                  key={action.key}
                  className={cx("AddCommandButton__ListItem", {
                    "AddCommandButton__ListItem--Selected":
                      selectedIndex === actionIndex
                  })}
                  onClick={this.onAdd(action.key)}
                  onMouseEnter={this.onHover(actionIndex)}
                >
                  <Highlighter
                    highlightClassName="AddCommandButton__ListItem__Highlight"
                    searchWords={query.split(" ")}
                    autoEscape
                    textToHighlight={action.name}
                  />
                </ScrollIntoViewIfNeeded>
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
                    autoEscape
                    textToHighlight={`${l10n(EVENT_TEXT)} "${query}"`}
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

AddCommandButton.propTypes = {
  onAdd: PropTypes.func.isRequired,
  onPaste: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  customEvents: PropTypes.arrayOf(CustomEventShape).isRequired
};

function mapStateToProps(state) {
  const customEvents = getCustomEvents(state);
  return {
    customEvents
  };
}

export default connect(mapStateToProps)(AddCommandButton);

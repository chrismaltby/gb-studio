/* eslint-disable react/no-multi-comp */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { clipboard } from "electron";
import { connect } from "react-redux";
import uuid from "uuid/v4";
import {
  EVENT_END
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
import { SidebarHeading } from "../editors/Sidebar";
import events from "../../lib/events";
import ScriptEditorEvent from "./ScriptEditorEvent";

class ScriptEditor extends Component {
  constructor() {
    super();
    this.state = {
      clipboardEvent: null
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { value } = this.props;
    const { clipboardEvent } = this.state;
    return (
      nextProps.value !== value || nextState.clipboardEvent !== clipboardEvent
    );
  }

  onChange = newValue => {
    const { onChange } = this.props;
    onChange(newValue);
  };

  moveActions = (a, b) => {
    const { value: root } = this.props;
    if (a === b) {
      return;
    }
    const input = prependEvent(filterEvents(root, a), b, findEvent(root, a));
    this.onChange(input);
  };

  onAdd = id => (command, defaults = {}, defaultChildren = {}) => {
    const { musicIds, sceneIds, actorIds, spriteSheetIds, scope } = this.props;
    const { value: root } = this.props;
    const eventFields = events[command].fields;
    const defaultArgs = eventFields
      ? eventFields.reduce(
          (memo, field) => {
            let replaceValue = null;
            if (field.defaultValue === "LAST_SCENE") {
              replaceValue = sceneIds[sceneIds.length - 1];
            } else if (field.defaultValue === "LAST_VARIABLE") {
              replaceValue = scope === "customEvents" ? "0" : "L0";
            } else if (field.defaultValue === "LAST_MUSIC") {
              replaceValue = musicIds[0];
            } else if (field.defaultValue === "LAST_SPRITE") {
              replaceValue = spriteSheetIds[0];
            } else if (field.defaultValue === "LAST_ACTOR") {
              replaceValue =
                actorIds.length > 0 ? actorIds[actorIds.length - 1] : "player";
            } else if (field.type === "events") {
              replaceValue = undefined;
            } else if (
              field.defaultValue !== undefined &&
              !defaults[field.key]
            ) {
              replaceValue = field.defaultValue;
            }
            if (replaceValue !== null) {
              return {
                ...memo,
                [field.key]: replaceValue
              };
            }
            return memo;
          },
          { ...defaults }
        )
      : { ...defaults };

    const childFields = eventFields.filter(field => field.type === "events");
    const children = childFields.reduce((memo, field) => {
      const childScript = defaultChildren[field.key]
        ? defaultChildren[field.key]
        : [
            {
              id: uuid(),
              command: EVENT_END
            }
          ];
      return {
        ...memo,
        [field.key]: childScript
      };
    }, {});

    const input = prependEvent(
      root,
      id,
      {
        id: uuid(),
          command,
          args: defaultArgs,
        ...childFields.length > 0 && {
          children
        }
      }
    );
    this.onChange(input);
  };

  onRemove = id => () => {
    const { value } = this.props;
    const input = filterEvents(value, id);
    this.onChange(input);
  };

  onEdit = (id, patch) => {
    const { value } = this.props;
    const input = patchEvents(value, id, patch);
    this.onChange(input);
  };

  onCopy = event => () => {
    const { copyEvent } = this.props;
    copyEvent(event);
  };

  onCopyScript = () => {
    const { copyScript } = this.props;
    const { value } = this.props;
    copyScript(value);
  };

  onPaste = (id, event, before) => {
    const { value } = this.props;
    const newEvent = Array.isArray(event)
      ? event.slice(0, -1).map(regenerateEventIds)
      : regenerateEventIds(event);
    const input = before
      ? prependEvent(value, id, newEvent)
      : appendEvent(value, id, newEvent);
    this.onChange(input);
  };

  onRemoveScript = e => {
    this.onChange([
      {
        id: uuid(),
        command: EVENT_END
      }
    ]);
  };

  onReplaceScript = e => {
    const { clipboardEvent } = this.state;
    if (clipboardEvent) {
      this.onChange(
        []
          .concat(
            clipboardEvent,
            !Array.isArray(clipboardEvent)
              ? {
                  id: uuid(),
                  command: EVENT_END
                }
              : []
          )
          .map(regenerateEventIds)
      );
    }
  };

  onPasteScript = before => () => {
    const { clipboardEvent } = this.state;
    const { value } = this.props;
    const newEvent = Array.isArray(clipboardEvent)
      ? clipboardEvent.slice(0, -1).map(regenerateEventIds)
      : regenerateEventIds(clipboardEvent);
    if (clipboardEvent) {
      if (before) {
        this.onChange([].concat(newEvent, value));
      } else {
        this.onChange([].concat(value.slice(0, -1), newEvent, value.slice(-1)));
      }
    }
  };

  onEnter = id => {
    const { selectScriptEvent } = this.props;
    selectScriptEvent(id);
  };

  onLeave = id => {
    const { selectScriptEvent } = this.props;
    selectScriptEvent("");
  };

  onSelectCustomEvent = id => {
    const { selectCustomEvent } = this.props;
    selectCustomEvent(id);
  };

  readClipboard = e => {
    try {
      const clipboardData = JSON.parse(clipboard.readText());
      if (clipboardData.__type === "event") {
        this.setState({ clipboardEvent: clipboardData });
      } else if (clipboardData.__type === "script") {
        this.setState({ clipboardEvent: clipboardData.script });
      } else {
        this.setState({ clipboardEvent: null });
      }
    } catch (err) {
      this.setState({ clipboardEvent: null });
    }
  };

  render() {
    const { type, title, value, entityId, renderHeader } = this.props;
    const { clipboardEvent } = this.state;

    const buttons = (
      <DropdownButton small transparent right onMouseDown={this.readClipboard}>
        <MenuItem onClick={this.onCopyScript}>
          {l10n("MENU_COPY_SCRIPT")}
        </MenuItem>
        {clipboardEvent && <MenuDivider />}
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
    );

    const heading = renderHeader ? (
      renderHeader({ buttons })
    ) : (
      <SidebarHeading title={title} buttons={buttons} />
    );

    return (
      <div>
        {heading}
        <div className="ScriptEditor">
          {value.map(action => (
            <ScriptEditorEvent
              key={action.id}
              id={action.id}
              entityId={entityId}
              type={type}
              action={action}
              moveActions={this.moveActions}
              onAdd={this.onAdd}
              onRemove={this.onRemove}
              onEdit={this.onEdit}
              onCopy={this.onCopy}
              onPaste={this.onPaste}
              onSelectCustomEvent={this.onSelectCustomEvent}
              onMouseEnter={this.onEnter}
              onMouseLeave={this.onLeave}
              clipboardEvent={clipboardEvent}
            />
          ))}
        </div>
      </div>
    );
  }
}

ScriptEditor.propTypes = {
  title: PropTypes.string,
  type: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(PropTypes.shape({})),
  onChange: PropTypes.func.isRequired,
  musicIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  sceneIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  actorIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  spriteSheetIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectScriptEvent: PropTypes.func.isRequired,
  copyEvent: PropTypes.func.isRequired,
  copyScript: PropTypes.func.isRequired,
  selectCustomEvent: PropTypes.func.isRequired,
  entityId: PropTypes.string.isRequired,
  scope: PropTypes.string.isRequired,
  renderHeader: PropTypes.func
};

ScriptEditor.defaultProps = Object.create(
  {
    title: ""
  },
  {
    value: {
      enumerable: true,
      get: () => [
        {
          id: uuid(),
          command: EVENT_END
        }
      ]
    }
  }
);

function mapStateToProps(state, props) {
  const { result, entities } = state.entities.present;
  const { type: scope } = state.editor;
  return {
    sceneIds: result.scenes,
    actorIds: props.actors || entities.scenes[state.editor.scene].actors,
    musicIds: result.music,
    spriteSheetIds: result.spriteSheets,
    value: props.value && props.value.length > 0 ? props.value : undefined,
    scope
  };
}

const mapDispatchToProps = {
  selectScriptEvent: actions.selectScriptEvent,
  copyEvent: actions.copyEvent,
  copyScript: actions.copyScript,
  selectCustomEvent: actions.selectCustomEvent
};

export default connect(mapStateToProps, mapDispatchToProps)(ScriptEditor);

/* eslint-disable react/no-multi-comp */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { clipboard } from "electron";
import { connect } from "react-redux";
import uuid from "uuid/v4";
import debounce from "lodash/debounce";
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
import events from "../../lib/events";
import ScriptEditorEvent from "./ScriptEditorEvent";
import l10n from "../../lib/helpers/l10n";
import { sceneSelectors, spriteSheetSelectors, musicSelectors } from "../../store/features/entities/entitiesSlice";
import { actions as editorActions } from "../../store/features/editor/editorSlice";

class ScriptEditor extends Component {

  constructor() {
    super();
    this.timer = null;  
    this.scriptBottomRef = React.createRef();
    this.state = {
      clipboardEvent: null,
      limit: 10
    };
    this.debouncedLoadMore = debounce(this.loadMore, 10);
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      if(this.scriptBottomRef.current) {
        const bottomBoundingRect = this.scriptBottomRef.current.getBoundingClientRect();
        if(bottomBoundingRect.top <= window.innerHeight + 100) {  
          this.debouncedLoadMore();    
        }
      }
    }, 100);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { value } = this.props;
    const { clipboardEvent, limit } = this.state;
    return (
      nextProps.value !== value || nextState.clipboardEvent !== clipboardEvent || nextState.limit !== limit
    );
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  loadMore = () => {
    const { limit } = this.state;
    const { value } = this.props;
    if (limit < value.length) {
      this.setState({ limit: limit + 10 });
    }    
  };

  onChange = newValue => {
    const { onChange } = this.props;
    onChange(newValue);
  };

  moveActions = (a, b) => {
    const { value: root } = this.props;
    if (a === b) {
      return;
    }
    const input = prependEvent(filterEvents(root, (e) => e.id !== a), b, findEvent(root, a));
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
            let defaultValue = field.defaultValue;
            if(field.type === "union") {
              defaultValue = field.defaultValue[field.defaultType];
            }
            if (defaultValue === "LAST_SCENE") {
              replaceValue = sceneIds[sceneIds.length - 1];
            } else if (defaultValue === "LAST_VARIABLE") {
              replaceValue = scope === "customEvents" ? "0" : "L0";
            } else if (defaultValue === "LAST_MUSIC") {
              replaceValue = musicIds[0];
            } else if (defaultValue === "LAST_SPRITE") {
              replaceValue = spriteSheetIds[0];
            } else if (defaultValue === "LAST_ACTOR") {
              replaceValue =
                actorIds.length > 0 ? actorIds[actorIds.length - 1] : "player";
            } else if (field.type === "events") {
              replaceValue = undefined;
            } else if (
              defaultValue !== undefined &&
              !defaults[field.key]
            ) {
              replaceValue = defaultValue;
            }
            if(field.type === "union") {
              replaceValue = {
                type: field.defaultType,
                value: replaceValue
              }
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
    const input = filterEvents(value, (e) => e.id !== id);
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

  onPaste = (id, event, before) => {
    const { value, pasteCustomEvents } = this.props;
    const newEvent = Array.isArray(event)
      ? event.slice(0, -1).map(regenerateEventIds)
      : regenerateEventIds(event);
    const input = before
      ? prependEvent(value, id, newEvent)
      : appendEvent(value, id, newEvent);
    pasteCustomEvents(); 
    this.onChange(input);
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
    selectCustomEvent({customEventId: id});
  };

  render() {
    const { type, value, entityId } = this.props;
    const { clipboardEvent, limit } = this.state;

    return (
      <div className="ScriptEditor">
        {value.slice(0, limit).map(action => (
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
          />
        ))}
        {limit < value.length &&
          <div className="ScriptEditor__Loading">
            {l10n("FIELD_LOADING")}
          </div>
        }
        <div ref={this.scriptBottomRef} />
      </div>
    );
  }
}

ScriptEditor.propTypes = {
  type: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(PropTypes.shape({})),
  onChange: PropTypes.func.isRequired,
  musicIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  sceneIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  actorIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  spriteSheetIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectScriptEvent: PropTypes.func.isRequired,
  copyEvent: PropTypes.func.isRequired,
  selectCustomEvent: PropTypes.func.isRequired,
  entityId: PropTypes.string.isRequired,
  scope: PropTypes.string.isRequired,
  pasteCustomEvents: PropTypes.string.isRequired
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
  const { type: scope } = state.editor;
  const scene = sceneSelectors.selectById(state, state.editor.scene);
  const sceneIds = sceneSelectors.selectIds(state);
  const musicIds = musicSelectors.selectIds(state);
  const spriteSheetIds = spriteSheetSelectors.selectIds(state);

  return {
    sceneIds,
    actorIds: props.actors || (scene && scene.actors) || [],
    musicIds,
    spriteSheetIds,
    value: props.value && props.value.length > 0 ? props.value : undefined,
    scope
  };
}

const mapDispatchToProps = {
  selectScriptEvent: actions.selectScriptEvent,
  copyEvent: actions.copyEvent,
  selectCustomEvent: editorActions.selectCustomEvent,
  pasteCustomEvents: actions.pasteCustomEvents
};

export default connect(mapStateToProps, mapDispatchToProps)(ScriptEditor);

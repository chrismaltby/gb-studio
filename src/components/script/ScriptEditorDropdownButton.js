/* eslint-disable react/no-multi-comp */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { clipboard } from "electron";
import { connect } from "react-redux";
import uuid from "uuid/v4";
import { EVENT_END } from "../../lib/compiler/eventTypes";
import { regenerateEventIds } from "../../lib/helpers/eventSystem";
import { DropdownButton } from "../library/Button";
import { MenuItem, MenuDivider } from "../library/Menu";
import l10n from "../../lib/helpers/l10n";
import clipboardActions from "../../store/features/clipboard/clipboardActions";

class ScriptEditorDropdownButton extends Component {
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

  onChange = (newValue) => {
    const { onChange } = this.props;
    onChange(newValue);
  };

  onCopyScript = () => {
    const { copyScript } = this.props;
    const { value } = this.props;
    copyScript(value);
  };

  onRemoveScript = (e) => {
    this.onChange([
      {
        id: uuid(),
        command: EVENT_END,
      },
    ]);
  };

  onReplaceScript = (e) => {
    const { clipboardEvent } = this.state;
    if (clipboardEvent) {
      const { pasteCustomEvents } = this.props;
      pasteCustomEvents();
      this.onChange(
        []
          .concat(
            clipboardEvent,
            !Array.isArray(clipboardEvent)
              ? {
                  id: uuid(),
                  command: EVENT_END,
                }
              : []
          )
          .map(regenerateEventIds)
      );
    }
  };

  onPasteScript = (before) => () => {
    const { clipboardEvent } = this.state;
    const { value } = this.props;
    const newEvent = Array.isArray(clipboardEvent)
      ? clipboardEvent.slice(0, -1).map(regenerateEventIds)
      : regenerateEventIds(clipboardEvent);
    if (clipboardEvent) {
      const { pasteCustomEvents } = this.props;
      pasteCustomEvents();
      if (before) {
        this.onChange([].concat(newEvent, value));
      } else {
        this.onChange([].concat(value.slice(0, -1), newEvent, value.slice(-1)));
      }
    }
  };

  readClipboard = (e) => {
    try {
      const clipboardData = JSON.parse(clipboard.readText());
      if (clipboardData.__type === "event") {
        this.setState({ clipboardEvent: clipboardData.event });
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
    const { value } = this.props;
    const { clipboardEvent } = this.state;

    return (
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
  }
}

ScriptEditorDropdownButton.propTypes = {
  value: PropTypes.arrayOf(PropTypes.shape({})),
  onChange: PropTypes.func.isRequired,
  copyScript: PropTypes.func.isRequired,
  pasteCustomEvents: PropTypes.func.isRequired,
};

ScriptEditorDropdownButton.defaultProps = Object.create(
  {
    title: "",
  },
  {
    value: {
      enumerable: true,
      get: () => [
        {
          id: uuid(),
          command: EVENT_END,
        },
      ],
    },
  }
);

function mapStateToProps(state, props) {
  return {
    value: props.value && props.value.length > 0 ? props.value : undefined
  };
}

const mapDispatchToProps = {
  copyScript: clipboardActions.copyScript,
  pasteCustomEvents: clipboardActions.pasteCustomEvents
};

export default connect(mapStateToProps, mapDispatchToProps)(ScriptEditorDropdownButton);

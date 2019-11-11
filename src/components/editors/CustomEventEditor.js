import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import ScriptEditor from "../script/ScriptEditor";
import * as actions from "../../actions";
import { FormField } from "../library/Forms";
import l10n from "../../lib/helpers/l10n";
import Sidebar, { SidebarColumn, SidebarHeading } from "./Sidebar";
import castEventValue from "../../lib/helpers/castEventValue";
import { CustomEventShape } from "../../reducers/stateShape";
import { DropdownButton } from "../library/Button";
import { MenuItem } from "../library/Menu";
import {
  getCustomEvents,
  getCustomEventsLookup
} from "../../reducers/entitiesReducer";
import WorldEditor from "./WorldEditor";

class CustomEventEditor extends Component {
  constructor() {
    super();
    this.state = {};
  }

  onEditVariableName = key => e => {
    const { editCustomEvent, customEvent } = this.props;
    editCustomEvent(customEvent.id, {
      variables: {
        ...customEvent.variables,
        [key]: {
          ...customEvent.variables[key],
          name: castEventValue(e)
        }
      }
    });
  };

  onEditActorName = key => e => {
    const { editCustomEvent, customEvent } = this.props;
    editCustomEvent(customEvent.id, {
      actors: {
        ...customEvent.actors,
        [key]: {
          ...customEvent.actors[key],
          name: castEventValue(e)
        }
      }
    });
  };

  onEdit = key => e => {
    const { editCustomEvent, customEvent } = this.props;
    editCustomEvent(customEvent.id, {
      [key]: castEventValue(e)
    });
  };

  onRemove = () => () => {
    const { removeCustomEvent, customEvent } = this.props;
    removeCustomEvent(customEvent.id);
  };

  render() {
    const { index, customEvent, selectSidebar } = this.props;

    if (!customEvent) {
      return <WorldEditor />;
    }

    return (
      <Sidebar onMouseDown={selectSidebar}>
        <SidebarColumn>
          <SidebarHeading
            title={l10n("CUSTOM_EVENT")}
            buttons={
              <DropdownButton
                small
                transparent
                right
                onMouseDown={this.readClipboard}
              >
                <MenuItem onClick={this.onRemove()}>
                  {l10n("MENU_DELETE_CUSTOM_EVENT")}
                </MenuItem>
              </DropdownButton>
            }
          />
          <div>
            <FormField>
              <label htmlFor="customEventName">
                {l10n("FIELD_NAME")}
                <input
                  id="customEventName"
                  value={customEvent.name || ""}
                  placeholder={`Custom Event ${index + 1}`}
                  onChange={this.onEdit("name")}
                />
              </label>
            </FormField>
            <FormField>
              <label htmlFor="customEventDescription">
                {l10n("FIELD_DESCRIPTION")}
                <textarea
                  id="customEventDescription"
                  rows={3}
                  value={customEvent.description || ""}
                  placeholder={l10n(
                    "FIELD_CUSTOM_EVENT_DESCRIPTION_PLACEHOLDER"
                  )}
                  onChange={this.onEdit("description")}
                />
              </label>
            </FormField>
          </div>
          <div>
            <SidebarHeading title={l10n("SIDEBAR_PARAMETERS")} />
            <FormField>
              <label>
                {`Variables: ${Object.values(customEvent.variables).length}/10`}
              </label>
            </FormField>
            {Object.values(customEvent.variables).map((variable, i) => {
              return (
                <FormField key={variable.id}>
                  <input
                    id={`variable[${i}]`}
                    value={variable.name}
                    placeholder="Variable Name"
                    onChange={this.onEditVariableName(variable.id)}
                  />
                </FormField>
              );
            })}
            <FormField>
              <label>
                {`Actors: ${Object.values(customEvent.actors).length}/10`}
              </label>
            </FormField>
            {Object.values(customEvent.actors).map((actor, i) => {
              return (
                <FormField key={actor.id}>
                  <input
                    id={`actor[${i}]`}
                    value={actor.name}
                    placeholder="Actor Name"
                    onChange={this.onEditActorName(actor.id)}
                  />
                </FormField>
              );
            })}
          </div>
        </SidebarColumn>
        <SidebarColumn>
          <ScriptEditor
            value={customEvent.script}
            title={l10n("SIDEBAR_CUSTOM_EVENT_SCRIPT")}
            type="customEvent"
            variables={Object.keys(customEvent.variables)}
            actors={Object.keys(customEvent.actors)}
            onChange={this.onEdit("script")}
            entityId={customEvent.id}
          />
        </SidebarColumn>
      </Sidebar>
    );
  }
}

CustomEventEditor.propTypes = {
  customEvent: CustomEventShape,
  editCustomEvent: PropTypes.func.isRequired,
  removeCustomEvent: PropTypes.func.isRequired,
  selectSidebar: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired
};

CustomEventEditor.defaultProps = {
  customEvent: null
};

function mapStateToProps(state, props) {
  const customEvents = getCustomEvents(state);
  const customEventsLookup = getCustomEventsLookup(state);
  const customEvent = customEventsLookup[props.id];
  const index = customEvents.findIndex(p => p.id === props.id);
  return {
    customEvent,
    index
  };
}

const mapDispatchToProps = {
  editCustomEvent: actions.editCustomEvent,
  removeCustomEvent: actions.removeCustomEvent,
  selectSidebar: actions.selectSidebar
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomEventEditor);

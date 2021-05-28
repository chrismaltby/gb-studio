import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import ScriptEditor from "../script/ScriptEditor";
import { FormField } from "../library/Forms";
import l10n from "../../lib/helpers/l10n";
import { SidebarHeading } from "./Sidebar";
import castEventValue from "../../lib/helpers/castEventValue";
import { CustomEventShape } from "../../store/stateShape";
import { DropdownButton } from "../ui/buttons/DropdownButton";
import { MenuItem } from "../ui/menu/Menu";
import { WorldEditor } from "./WorldEditor";
import ScriptEditorDropdownButton from "../script/ScriptEditorDropdownButton";
import { customEventSelectors } from "../../store/features/entities/entitiesState";
import editorActions from "../../store/features/editor/editorActions";
import entitiesActions from "../../store/features/entities/entitiesActions";
import { SidebarMultiColumnAuto, SidebarColumn } from "../ui/sidebars/Sidebar";
import { FormContainer, FormHeader } from "../ui/form/FormLayout";
import { EditableText } from "../ui/form/EditableText";

const customEventName = (customEvent, customEventIndex) =>
  customEvent.name ? customEvent.name : `Script ${customEventIndex + 1}`;

class CustomEventEditor extends Component {
  constructor() {
    super();
    this.state = {};
  }

  onEditVariableName = (key) => (e) => {
    const { editCustomEvent, customEvent } = this.props;
    editCustomEvent({
      customEventId: customEvent.id,
      changes: {
        variables: {
          ...customEvent.variables,
          [key]: {
            ...customEvent.variables[key],
            name: castEventValue(e),
          },
        },
      },
    });
  };

  onEditActorName = (key) => (e) => {
    const { editCustomEvent, customEvent } = this.props;
    editCustomEvent({
      customEventId: customEvent.id,
      changes: {
        actors: {
          ...customEvent.actors,
          [key]: {
            ...customEvent.actors[key],
            name: castEventValue(e),
          },
        },
      },
    });
  };

  onEdit = (key) => (e) => {
    const { editCustomEvent, customEvent } = this.props;
    editCustomEvent({
      customEventId: customEvent.id,
      changes: {
        [key]: castEventValue(e),
      },
    });
  };

  onRemove = () => () => {
    const { removeCustomEvent, customEvent } = this.props;
    removeCustomEvent({ customEventId: customEvent.id });
  };

  render() {
    const { index, customEvent, selectSidebar } = this.props;

    if (!customEvent) {
      return <WorldEditor />;
    }

    return (
      <SidebarMultiColumnAuto onClick={selectSidebar}>
        <SidebarColumn>
          <FormContainer>
            <FormHeader>
              <EditableText
                name="name"
                placeholder={customEventName(customEvent, index)}
                value={customEvent.name || ""}
                onChange={this.onEdit("name")}
              />
              <DropdownButton
                size="small"
                variant="transparent"
                menuDirection="right"
              >
                <MenuItem onClick={this.onRemove()}>
                  {l10n("MENU_DELETE_CUSTOM_EVENT")}
                </MenuItem>
              </DropdownButton>
            </FormHeader>
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
          </FormContainer>
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
          <div>
            <SidebarHeading
              title={l10n("SIDEBAR_CUSTOM_EVENT_SCRIPT")}
              buttons={
                <ScriptEditorDropdownButton
                  value={customEvent.script}
                  onChange={this.onEdit("script")}
                />
              }
            />
            <ScriptEditor
              value={customEvent.script}
              type="customEvent"
              variables={Object.keys(customEvent.variables)}
              actors={Object.keys(customEvent.actors)}
              onChange={this.onEdit("script")}
              entityId={customEvent.id}
            />
          </div>
        </SidebarColumn>
      </SidebarMultiColumnAuto>
    );
  }
}

CustomEventEditor.propTypes = {
  customEvent: CustomEventShape,
  editCustomEvent: PropTypes.func.isRequired,
  removeCustomEvent: PropTypes.func.isRequired,
  selectSidebar: PropTypes.func.isRequired,
  index: PropTypes.number.isRequired,
};

CustomEventEditor.defaultProps = {
  customEvent: null,
};

function mapStateToProps(state, props) {
  const customEvents = customEventSelectors.selectAll(state);
  const customEvent = customEventSelectors.selectById(state, props.id);
  const index = customEvents.findIndex((p) => p.id === props.id);
  return {
    customEvent,
    index,
  };
}

const mapDispatchToProps = {
  editCustomEvent: entitiesActions.editCustomEvent,
  removeCustomEvent: entitiesActions.removeCustomEvent,
  selectSidebar: editorActions.selectSidebar,
};

export default connect(mapStateToProps, mapDispatchToProps)(CustomEventEditor);

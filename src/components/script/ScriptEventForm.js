/* eslint-disable react/no-multi-comp */
/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import events from "../../lib/events";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import { CustomEventShape, EngineFieldShape } from "../../store/stateShape";
import ScriptEventFormField from "./ScriptEventFormField";
import { customEventSelectors } from "../../store/features/entities/entitiesState";
import { SidebarTabs } from "../editors/Sidebar";
import { clampToCType, is16BitCType } from "../../lib/helpers/engineFields";
import { EVENT_ENGINE_FIELD_STORE, EVENT_ENGINE_FIELD_SET } from "../../lib/compiler/eventTypes";
import l10n from "../../lib/helpers/l10n";
import { setDefault } from "../../lib/helpers/setDefault";

const genKey = (id, key, index) => `${id}_${key}_${index || 0}`;

class ScriptEventForm extends Component {
  // shouldComponentUpdate(nextProps, nextState) {
  //   rerenderCheck("ScriptEventForm", this.props, {}, nextProps, {});
  //   return true;
  // }

  getFields() {
    const { command, value, customEvents, engineFields } = this.props;
    const eventCommands = (events[command] && events[command].fields) || [];
    if (value.customEventId && customEvents[value.customEventId]) {
      const customEvent = customEvents[value.customEventId];
      const description = customEvent.description
        ? [
            {
              label: customEvent.description
                .split("\n")
                .map((text, index) => <div key={index}>{text || <div>&nbsp;</div>}</div>)
            }
          ]
        : [];
      const usedVariables =
        Object.values(customEvent.variables).map(v => {
          return {
            label: `${v.name}`,
            defaultValue: "LAST_VARIABLE",
            key: `$variable[${v.id}]$`,
            type: "variable"
          };
        }) || [];
      const usedActors =
        Object.values(customEvent.actors).map(a => {
          return {
            label: `${a.name}`,
            defaultValue: "player",
            key: `$actor[${a.id}]$`,
            type: "actor"
          };
        }) || [];

      return [].concat(description, eventCommands, usedVariables, usedActors);
    }
    
    if ((command === EVENT_ENGINE_FIELD_SET || command === EVENT_ENGINE_FIELD_STORE) && value.engineFieldKey) {
      const engineField = engineFields.find((e) => e.key === value.engineFieldKey);
      if (engineField) {
        const fieldType = engineField.type || "number";
        if (command === EVENT_ENGINE_FIELD_SET) {
          if (is16BitCType(engineField.cType)) {
            return [].concat(
              eventCommands,
              {
                key: "value",
                type: "union",
                checkboxLabel: l10n(engineField.label),
                types: [fieldType, "variable"],
                defaultType: fieldType,
                min: clampToCType(setDefault(engineField.min, -Infinity), engineField.cType),
                max: clampToCType(setDefault(engineField.max, Infinity), engineField.cType),
                variableType: "16bit",
                options: engineField.options || [],
                defaultValue: {
                  [fieldType]: engineField.defaultValue || 0,
                  variable: "0",
                },
              }
            );
          } 
          return [].concat(eventCommands, {
            key: "value",
            type: "union",
            checkboxLabel: l10n(engineField.label),
            types: [fieldType, "variable"],
            defaultType: fieldType,
            min: clampToCType(setDefault(engineField.min, -Infinity), engineField.cType),
            max: clampToCType(setDefault(engineField.max, Infinity), engineField.cType),            
            options: engineField.options || [],
            defaultValue: {
              [fieldType]: engineField.defaultValue || 0,
              variable: "0",
            },
          });
        }
        if (command === EVENT_ENGINE_FIELD_STORE) {
          if (is16BitCType(engineField.cType)) {
            return [].concat(
              eventCommands,
              {
                key: "value",
                type: "variable",
                defaultValue: "0",
                variableType: "16bit"
              }
            );
          } 
          return [].concat(
            eventCommands,
            {
              key: "value",
              type: "variable",
              defaultValue: "0"
            }
          );
        }        
      } else {
        return [].concat(eventCommands, {
          label: `Unknown field "${value.engineFieldKey}"`
        })
      }
    }
    return eventCommands;
  }

  renderFields = fields => {
    const { id, value, renderEvents, onChange, entityId } = this.props;
    return fields.map((field, index) => {
      if (field.hide) {
        return null;
      }
      // Determine if field conditions are met and hide if not
      if (field.conditions) {
        const showField = field.conditions.reduce((memo, condition) => {
          const keyValue = value[condition.key];
          return (
            memo &&
            (!condition.eq || keyValue === condition.eq) &&
            (!condition.ne || keyValue !== condition.ne) &&
            (!condition.gt || keyValue > condition.gt) &&
            (!condition.gte || keyValue >= condition.gte) &&
            (!condition.lt || keyValue > condition.lt) &&
            (!condition.lte || keyValue >= condition.lte) &&
            (!condition.in || condition.in.indexOf(keyValue) >= 0)
          );
        }, true);
        if (!showField) {
          return null;
        }
      }

      if (field.type === "events") {
        return renderEvents(field.key);
      }

      if (field.type === "tabs") {
        return (
          <div className="ScriptEditorEvent__Tabs">
            <SidebarTabs
              small
              value={value[field.key]}
              values={field.values}
              onChange={(v) => {
                const newValue = {};
                newValue[field.key] = v;
                onChange(newValue);
              }}
            />                    
          </div>
        )
      }

      const fieldValue = field.multiple
        ? [].concat([], value[field.key])
        : value[field.key];

      return (
        <ScriptEventFormField
          key={genKey(id, field.key)}
          eventId={id}
          entityId={entityId}
          field={field}
          value={fieldValue}
          args={value}
          onChange={onChange}
        />
      );
    });
  };

  render() {
    const fields = this.getFields();
    return <div className="ScriptEventForm">{this.renderFields(fields)}</div>;
  }
}

ScriptEventForm.propTypes = {
  id: PropTypes.string.isRequired,
  entityId: PropTypes.string.isRequired,
  command: PropTypes.string.isRequired,
  value: PropTypes.shape({
    customEventId: PropTypes.string,
    engineFieldKey: PropTypes.string
  }),
  onChange: PropTypes.func.isRequired,
  renderEvents: PropTypes.func.isRequired,
  customEvents: PropTypes.objectOf(CustomEventShape),
  engineFields: PropTypes.objectOf(EngineFieldShape)
};

ScriptEventForm.defaultProps = {
  value: {},
  customEvents: [],
  engineFields: []
};

function mapStateToProps(state) {
  const customEvents = customEventSelectors.selectEntities(state);
  const engineFields = state.engine.fields;
  return {
    customEvents,
    engineFields
  };
}

export default connect(mapStateToProps)(ScriptEventForm);

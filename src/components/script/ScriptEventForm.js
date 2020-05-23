/* eslint-disable react/no-multi-comp */
/* eslint-disable jsx-a11y/label-has-for */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import events from "../../lib/events";
import rerenderCheck from "../../lib/helpers/reactRerenderCheck";
import { CustomEventShape } from "../../reducers/stateShape";
import ScriptEventFormField from "./ScriptEventFormField";

const genKey = (id, key, index) => `${id}_${key}_${index || 0}`;

class ScriptEventForm extends Component {
  // shouldComponentUpdate(nextProps, nextState) {
  //   rerenderCheck("ScriptEventForm", this.props, {}, nextProps, {});
  //   return true;
  // }

  getFields() {
    const { command, value, customEvents } = this.props;
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
            (!condition.lte || keyValue >= condition.lte)
          );
        }, true);
        if (!showField) {
          return null;
        }
      }

      if (field.type === "events") {
        return renderEvents(field.key);
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
    customEventId: PropTypes.string
  }),
  onChange: PropTypes.func.isRequired,
  renderEvents: PropTypes.func.isRequired,
  customEvents: PropTypes.objectOf(CustomEventShape)
};

ScriptEventForm.defaultProps = {
  value: {},
  customEvents: []
};

function mapStateToProps(state) {
  const customEvents = state.entities.present.entities.customEvents || {};
  return {
    customEvents
  };
}

export default connect(mapStateToProps)(ScriptEventForm);

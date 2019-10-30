import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { CustomEventShape } from "../../reducers/stateShape";
import * as actions from "../../actions";
import { getCustomEvents } from "../../reducers/entitiesReducer";

class CustomEventNavigation extends Component {
  render() {
    const { customEvents, selectCustomEvent } = this.props;

    return (
      customEvents.length > 0 && (
        <ul>
          {customEvents.map(
            (customEvent, index) =>
              customEvent && (
                <li
                  key={customEvent.id}
                  onClick={() => {
                    selectCustomEvent(customEvent.id);
                  }}
                >
                  {customEvent.name || `Custom Event ${index + 1}`}
                </li>
              )
          )}
        </ul>
      )
    );
  }
}

CustomEventNavigation.propTypes = {
  customEvents: PropTypes.arrayOf(CustomEventShape).isRequired,
  selectCustomEvent: PropTypes.func.isRequired
};

function mapStateToProps(state) {
  const customEvents = getCustomEvents(state);
  return { customEvents };
}

const mapDispatchToProps = {
  selectCustomEvent: actions.selectCustomEvent
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomEventNavigation);

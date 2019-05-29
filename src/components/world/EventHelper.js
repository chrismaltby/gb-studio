import React, { Component } from "react";
import PropTypes from "prop-types";
import {
  EVENT_CAMERA_MOVE_TO,
  EVENT_ACTOR_MOVE_TO,
  EVENT_ACTOR_SET_POSITION,
  EVENT_OVERLAY_SHOW,
  EVENT_OVERLAY_MOVE_TO,
  EVENT_IF_ACTOR_AT_POSITION
} from "../../lib/compiler/eventTypes";

const TILE_SIZE = 8;

class EventHelper extends Component {
  render() {
    const { event } = this.props;

    if (event.command === EVENT_CAMERA_MOVE_TO) {
      return (
        <div className="EventHelper">
          <div
            className="EventHelper__CameraPos"
            style={{
              left: (event.args.x || 0) * TILE_SIZE,
              top: (event.args.y || 0) * TILE_SIZE
            }}
          />
        </div>
      );
    }

    if (
      event.command === EVENT_ACTOR_MOVE_TO ||
      event.command === EVENT_ACTOR_SET_POSITION ||
      event.command === EVENT_IF_ACTOR_AT_POSITION
    ) {
      return (
        <div className="EventHelper">
          <div
            className="EventHelper__PosMarker"
            style={{
              left: (event.args.x || 0) * TILE_SIZE,
              top: (event.args.y || 0) * TILE_SIZE
            }}
          />
        </div>
      );
    }

    if (
      event.command === EVENT_OVERLAY_SHOW ||
      event.command === EVENT_OVERLAY_MOVE_TO
    ) {
      return (
        <div className="EventHelper">
          <div
            className="EventHelper__OverlayPos__Overlay"
            style={{
              left: (event.args.x || 0) * TILE_SIZE,
              top: (event.args.y || 0) * TILE_SIZE,
              background: event.args.color === "white" ? "#e0f8cf" : "#081820"
            }}
          />
        </div>
      );
    }

    return <div />;
  }
}

EventHelper.propTypes = {
  event: PropTypes.shape({
    command: PropTypes.string,
    args: PropTypes.shape({})
  })
};

EventHelper.defaultProps = {
  event: {}
};

export default EventHelper;

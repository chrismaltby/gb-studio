import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  EVENT_CAMERA_MOVE_TO,
  EVENT_ACTOR_MOVE_TO,
  EVENT_ACTOR_SET_POSITION,
  EVENT_OVERLAY_SHOW,
  EVENT_OVERLAY_MOVE_TO,
  EVENT_IF_ACTOR_AT_POSITION,
  EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR,
} from "lib/compiler/eventTypes";
import { actorSelectors } from "store/features/entities/entitiesState";

const TILE_SIZE = 8;

const argValue = (arg) => {
  if (arg && arg.value) {
    if (arg.type === "variable" || arg.type === "property") {
      return undefined;
    }
    return arg.value;
  }
  return arg;
};

class EventHelper extends Component {
  render() {
    const { event } = this.props;

    if (event.command === EVENT_CAMERA_MOVE_TO) {
      const units = argValue(event.args.units);
      const x = argValue(event.args.x);
      const y = argValue(event.args.y);
      if (x === undefined && y === undefined) {
        return <div />;
      }
      return (
        <div className="EventHelper">
          <div
            className="EventHelper__CameraPos"
            style={{
              left: (x || 0) * (units === "pixels" ? 1 : TILE_SIZE),
              top: (y || 0) * (units === "pixels" ? 1 : TILE_SIZE),
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
      const units = argValue(event.args.units);
      const x = argValue(event.args.x);
      const y = argValue(event.args.y);
      if (x === undefined && y === undefined) {
        return <div />;
      }
      return (
        <div className="EventHelper">
          <div
            className="EventHelper__PosMarker"
            style={{
              left: (x || 0) * (units === "pixels" ? 1 : TILE_SIZE),
              top: (y || 0) * (units === "pixels" ? 1 : TILE_SIZE),
            }}
          />
        </div>
      );
    }

    if (event.command === EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR) {
      const distance = argValue(event.args.distance);
      if (distance === undefined) {
        return <div />;
      }

      const otherActorId = argValue(event.args.otherActorId);
      if (otherActorId === undefined) {
        return <div />;
      }

      const { scene, actorsLookup, editorActorId } = this.props;
      // Find the actor that is referenced in the current event
      let actor;
      if (otherActorId === "$self$") {
        actor = actorsLookup[editorActorId];
      } else {
        actor = actorsLookup[otherActorId];
      }

      if (actor === undefined) {
        return <div />;
      }

      let { x, y } = actor;
      let { width, height } = scene;

      var tiles = [];
      for (var xpos = 0; xpos < width; xpos++) {
        for (var ypos = 0; ypos < height; ypos++) {
          // distance formula
          let d = Math.sqrt(Math.pow(xpos - x, 2) + Math.pow(ypos - y, 2));

          switch (event.args.operator) {
            case "==":
              if (d === distance) {
                tiles.push({ xpos, ypos });
              }
              break;
            case "!=":
              if (d !== distance) {
                tiles.push({ xpos, ypos });
              }
              break;
            case "<":
              if (d < distance) {
                tiles.push({ xpos, ypos });
              }
              break;
            case ">":
              if (d > distance) {
                tiles.push({ xpos, ypos });
              }
              break;
            case "<=":
              if (d <= distance) {
                tiles.push({ xpos, ypos });
              }
              break;
            case ">=":
              if (d >= distance) {
                tiles.push({ xpos, ypos });
              }
              break;
            default: {
            }
          }
        }
      }

      return (
        <div className="EventHelper">
          {tiles.map((v, i) => (
            <div
              key={i}
              className="EventHelper__PosMarker"
              style={{
                left: (v.xpos || 0) * TILE_SIZE,
                top: (v.ypos || 0) * TILE_SIZE,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      );
    }

    if (
      event.command === EVENT_OVERLAY_SHOW ||
      event.command === EVENT_OVERLAY_MOVE_TO
    ) {
      const x = argValue(event.args.x);
      const y = argValue(event.args.y);
      const color = argValue(event.args.color);
      if (x === undefined && y === undefined) {
        return <div />;
      }
      return (
        <div className="EventHelper">
          <div
            className="EventHelper__OverlayPos__Overlay"
            style={{
              left: (x || 0) * TILE_SIZE,
              top: (y || 0) * TILE_SIZE,
              background: color === "white" ? "#e0f8cf" : "#081820",
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
    args: PropTypes.shape({}),
  }),
};

EventHelper.defaultProps = {
  event: {},
};

function mapStateToProps(state, props) {
  const actorsLookup = actorSelectors.selectEntities(state);
  const editorActorId =
    state.editor.type === "actor" ? state.editor.entityId : undefined;
  return {
    ...props,
    actorsLookup,
    editorActorId,
  };
}

export default connect(mapStateToProps, null)(EventHelper);

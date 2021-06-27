import React from "react";
import {
  EVENT_CAMERA_MOVE_TO,
  EVENT_ACTOR_MOVE_TO,
  EVENT_ACTOR_SET_POSITION,
  EVENT_OVERLAY_SHOW,
  EVENT_OVERLAY_MOVE_TO,
  EVENT_IF_ACTOR_AT_POSITION,
} from "lib/compiler/eventTypes";

const TILE_SIZE = 8;

type Arg<T> = {
  value: T,
  type: "variable" | "property" | string
};

// This is grossly over-typed
const argValue = <T extends unknown>(arg: T):
  T extends Arg<infer R> ?
    T['type'] extends 'variable' | 'property' ? undefined : R:
    T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isShapedArg = (v: any): v is Arg<any> => v?.value;
  if (isShapedArg(arg)) {
    if (arg.type === "variable" || arg.type === "property") {
      return undefined as never;
    }
    return arg.value;
  }
  return arg as never;
};

interface EventShapeType {
  id: string,
  command: string,
  args: {
    x: number,
    y: number,
    color: string
  }
}

interface EventHelperProps {
  event: EventShapeType
}

const EventHelper = ({event}: EventHelperProps) => {
  if (event.command === EVENT_CAMERA_MOVE_TO) {
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
            left: (x || 0) * TILE_SIZE,
            top: (y || 0) * TILE_SIZE,
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
            left: (x || 0) * TILE_SIZE,
            top: (y || 0) * TILE_SIZE,
          }}
        />
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

export default EventHelper;

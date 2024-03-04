import React, { FC } from "react";
import { useSelector } from "react-redux";
import {
  actorSelectors,
  scriptEventSelectors,
} from "store/features/entities/entitiesState";
import { Scene } from "shared/lib/entities/entitiesTypes";
import { RootState } from "store/configureStore";
import styled from "styled-components";
import { ensureMaybeNumber, ensureMaybeString } from "shared/types";
import {
  EVENT_ACTOR_MOVE_TO,
  EVENT_ACTOR_SET_POSITION,
  EVENT_CAMERA_MOVE_TO,
  EVENT_IF_ACTOR_AT_POSITION,
  EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR,
  EVENT_OVERLAY_MOVE_TO,
  EVENT_OVERLAY_SHOW,
} from "consts";

const TILE_SIZE = 8;

interface SceneEventHelperProps {
  scene: Scene;
}

const EventHelperWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  transform: translate3d(0, 0, 0);
`;

const CameraPos = styled.div`
  position: absolute;
  width: 160px;
  height: 144px;
  outline: 10px solid red;
`;

const PosMarker = styled.div`
  position: absolute;
  width: 16px;
  height: 8px;
  background: red;
`;
const OverlayPos = styled.div`
  position: absolute;
  width: 256px;
  height: 256px;
  background: blue;
`;

const argValue = (arg: unknown): unknown => {
  const unionArg = arg as { value: unknown; type: unknown };
  if (unionArg && unionArg.value !== undefined) {
    if (unionArg.type === "variable" || unionArg.type === "property") {
      return undefined;
    }
    return unionArg.value;
  }
  return arg;
};

export const SceneEventHelper: FC<SceneEventHelperProps> = ({ scene }) => {
  const actorsLookup = useSelector((state: RootState) =>
    actorSelectors.selectEntities(state)
  );

  const editorType = useSelector((state: RootState) => state.editor.type);
  const entityId = useSelector((state: RootState) => state.editor.entityId);

  const editorActorId = editorType === "actor" ? entityId : undefined;

  const scriptEventsLookup = useSelector((state: RootState) =>
    scriptEventSelectors.selectEntities(state)
  );

  const eventId = useSelector((state: RootState) => state.editor.eventId);
  const sceneId = useSelector((state: RootState) => state.editor.scene);

  const sceneEventVisible = eventId && sceneId === scene.id;
  const event = sceneEventVisible && scriptEventsLookup[eventId];

  if (!event) {
    return <></>;
  }

  if (event.command === EVENT_CAMERA_MOVE_TO) {
    const units = argValue(event.args?.units);
    const x = ensureMaybeNumber(argValue(event.args?.x), 0);
    const y = ensureMaybeNumber(argValue(event.args?.y), 0);
    if (x === undefined && y === undefined) {
      return <div />;
    }
    return (
      <EventHelperWrapper>
        <CameraPos
          style={{
            left: (x || 0) * (units === "pixels" ? 1 : TILE_SIZE),
            top: (y || 0) * (units === "pixels" ? 1 : TILE_SIZE),
          }}
        />
      </EventHelperWrapper>
    );
  }

  if (
    event.command === EVENT_ACTOR_MOVE_TO ||
    event.command === EVENT_ACTOR_SET_POSITION ||
    event.command === EVENT_IF_ACTOR_AT_POSITION
  ) {
    const units = argValue(event.args?.units);
    const x = ensureMaybeNumber(argValue(event.args?.x), 0);
    const y = ensureMaybeNumber(argValue(event.args?.y), 0);
    if (x === undefined && y === undefined) {
      return <div />;
    }
    return (
      <EventHelperWrapper>
        <PosMarker
          style={{
            left: (x || 0) * (units === "pixels" ? 1 : TILE_SIZE),
            top: (y || 0) * (units === "pixels" ? 1 : TILE_SIZE),
          }}
        />
      </EventHelperWrapper>
    );
  }

  if (event.command === EVENT_IF_ACTOR_DISTANCE_FROM_ACTOR) {
    const distance = ensureMaybeNumber(argValue(event.args?.distance), 0);

    if (distance === undefined) {
      return <div />;
    }

    const otherActorId = ensureMaybeString(
      argValue(event.args?.otherActorId),
      ""
    );
    if (otherActorId === undefined) {
      return <div />;
    }

    // Find the actor that is referenced in the current event
    let actor;
    if (otherActorId === "$self$" && editorActorId !== undefined) {
      actor = actorsLookup[editorActorId];
    } else {
      actor = actorsLookup[otherActorId];
    }

    if (actor === undefined) {
      return <div />;
    }

    const { x, y } = actor;
    const { width, height } = scene;

    const tiles = [];
    for (let xpos = 0; xpos < width; xpos++) {
      for (let ypos = 0; ypos < height; ypos++) {
        // distance formula
        const d = Math.sqrt(Math.pow(xpos - x, 2) + Math.pow(ypos - y, 2));

        switch (event.args?.operator) {
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
      <EventHelperWrapper>
        {tiles.map((v, i) => (
          <PosMarker
            key={i}
            style={{
              left: (v.xpos || 0) * TILE_SIZE,
              top: (v.ypos || 0) * TILE_SIZE,
              opacity: 0.8,
            }}
          />
        ))}
      </EventHelperWrapper>
    );
  }

  if (
    event.command === EVENT_OVERLAY_SHOW ||
    event.command === EVENT_OVERLAY_MOVE_TO
  ) {
    const x = ensureMaybeNumber(argValue(event.args?.x), 0);
    const y = ensureMaybeNumber(argValue(event.args?.y), 0);
    const color = argValue(event.args?.color);
    if (x === undefined && y === undefined) {
      return <div />;
    }
    return (
      <EventHelperWrapper>
        <OverlayPos
          style={{
            left: (x || 0) * TILE_SIZE,
            top: (y || 0) * TILE_SIZE,
            background: color === "white" ? "#e0f8cf" : "#081820",
          }}
        />
      </EventHelperWrapper>
    );
  }

  return <div />;
};

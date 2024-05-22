import React, { FC } from "react";
import { useAppSelector } from "store/hooks";
import {
  actorSelectors,
  scriptEventSelectors,
} from "store/features/entities/entitiesState";
import { SceneNormalized } from "shared/lib/entities/entitiesTypes";
import styled from "styled-components";
import { ensureMaybeNumber, ensureMaybeString } from "shared/types";

const TILE_SIZE = 8;

interface SceneEventHelperProps {
  scene: SceneNormalized;
}

const EventHelperWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  transform: translate3d(0, 0, 0);
  z-index: 101;
`;

const CameraPos = styled.div`
  position: absolute;
  width: 160px;
  height: 144px;
  outline: 10px solid red;
`;

interface PosMarkerProps {
  tileWidth: number;
  tileHeight: number;
}

const PosMarker = styled.div<PosMarkerProps>`
  position: absolute;
  width: ${(props) => props.tileWidth * 8}px;
  height: ${(props) => props.tileHeight * 8}px;
  outline: 3px solid red;
  box-shadow: 0 0 1000px 1000px rgba(0, 0, 0, 0.6);
`;

const DistanceMarker = styled.div`
  position: absolute;
  width: 16px;
  height: 8px;
  background: red;
  opacity: 0.5;
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
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state)
  );

  const editorType = useAppSelector((state) => state.editor.type);
  const entityId = useAppSelector((state) => state.editor.entityId);

  const editorActorId = editorType === "actor" ? entityId : undefined;

  const scriptEventsLookup = useAppSelector((state) =>
    scriptEventSelectors.selectEntities(state)
  );

  const eventId = useAppSelector((state) => state.editor.eventId);
  const sceneId = useAppSelector((state) => state.editor.scene);

  const sceneEventVisible = eventId && sceneId === scene.id;
  const event = sceneEventVisible ? scriptEventsLookup[eventId] : undefined;
  const scriptEventDef = useAppSelector(
    (state) => state.scriptEventDefs.lookup[event?.command ?? ""]
  );

  if (!event || !scriptEventDef || !scriptEventDef.helper) {
    return <></>;
  }

  if (scriptEventDef.helper.type === "camera") {
    const units = scriptEventDef.helper.units
      ? argValue(event.args?.[scriptEventDef.helper.units])
      : "tiles";
    const x = ensureMaybeNumber(
      argValue(event.args?.[scriptEventDef.helper.x]),
      0
    );
    const y = ensureMaybeNumber(
      argValue(event.args?.[scriptEventDef.helper.y]),
      0
    );
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

  if (scriptEventDef.helper.type === "position") {
    const units = scriptEventDef.helper.units
      ? argValue(event.args?.[scriptEventDef.helper.units])
      : "tiles";
    const x = ensureMaybeNumber(
      argValue(event.args?.[scriptEventDef.helper.x]),
      0
    );
    const y = ensureMaybeNumber(
      argValue(event.args?.[scriptEventDef.helper.y]),
      0
    );
    const tileSize = ensureMaybeString(
      argValue(event.args?.[scriptEventDef.helper.tileSize ?? ""]),
      ""
    );
    let tileWidth = 1;
    let tileHeight = 1;
    if (tileSize === "16px") {
      tileWidth = 2;
      tileHeight = 2;
    }
    if (scriptEventDef.helper.tileWidth) {
      tileWidth = scriptEventDef.helper.tileWidth;
    }
    if (scriptEventDef.helper.tileHeight) {
      tileHeight = scriptEventDef.helper.tileHeight;
    }
    if (x === undefined && y === undefined) {
      return <div />;
    }
    return (
      <EventHelperWrapper>
        <PosMarker
          tileWidth={tileWidth}
          tileHeight={tileHeight}
          style={{
            left: (x || 0) * (units === "pixels" ? 1 : TILE_SIZE),
            top: (y || 0) * (units === "pixels" ? 1 : TILE_SIZE),
          }}
        />
      </EventHelperWrapper>
    );
  }

  if (scriptEventDef.helper.type === "distance") {
    const distance = ensureMaybeNumber(
      argValue(event.args?.[scriptEventDef.helper.distance]),
      0
    );

    if (distance === undefined) {
      return <div />;
    }

    const otherActorId = ensureMaybeString(
      argValue(event.args?.[scriptEventDef.helper.actorId]),
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

        switch (event.args?.[scriptEventDef.helper.operator]) {
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
          <DistanceMarker
            key={i}
            style={{
              left: (v.xpos || 0) * TILE_SIZE,
              top: (v.ypos || 0) * TILE_SIZE,
            }}
          />
        ))}
      </EventHelperWrapper>
    );
  }

  if (scriptEventDef.helper.type === "overlay") {
    const x = ensureMaybeNumber(
      argValue(event.args?.[scriptEventDef.helper.x]),
      0
    );
    const y = ensureMaybeNumber(
      argValue(event.args?.[scriptEventDef.helper.y]),
      0
    );
    const color = scriptEventDef.helper.color
      ? argValue(event.args?.[scriptEventDef.helper.color])
      : "black";
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

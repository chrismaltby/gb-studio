import React, { FC, useMemo } from "react";
import { useAppSelector } from "store/hooks";
import {
  actorSelectors,
  scriptEventSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import { SceneNormalized } from "shared/lib/entities/entitiesTypes";
import styled, { keyframes } from "styled-components";
import {
  ensureMaybeNumber,
  ensureMaybeString,
  ensureNumber,
  ensureString,
} from "shared/types";
import { DialoguePreview } from "components/script/DialoguePreview";

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
  outline: 4px solid red;
  box-shadow: 0 0 1000px 1000px rgba(0, 0, 0, 0.6);
`;

const ScreenMarker = styled.div`
  position: absolute;
  width: 160px;
  height: 144px;
  box-shadow: 0 0 1000px 1000px rgba(0, 0, 0, 0.6);
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
  width: 160px;
  height: 256px;
  background: blue;
`;

export const scanlineAnim = keyframes`
  0% {
      left: 0;
      opacity: 0;
  }
  70% {
    left: 0;
    opacity: 0;
  }
  75% {
    left: 0;
    opacity: 1;
  }
  98% {
    opacity: 1;
  }
  100% {
    left: 100%;
    opacity: 0;    
  }
`;

const ScanlinePos = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 160px;
  height: 144px;
  maxheight: 144px;
  background: #e0f8cf;
  &:before {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 1px;
    background: rgba(116, 216, 58, 0.8);
    box-shadow: 0px 0px 2px rgba(148, 239, 218, 0.9),
      0px 0px 10px rgba(0, 249, 106, 0.8);
  }
  &:after {
    content: "";
    position: absolute;
    left: 100%;
    bottom: 0;
    width: 1px;
    height: 1px;
    background: rgba(255, 255, 255, 0.5);
    box-shadow: 0px 0px 2px 2px rgba(220, 255, 254, 0.3);
    animation: ${scanlineAnim} 3s infinite linear forwards;
  }
`;

const BoundsMarker = styled.div`
  position: absolute;
  background: rgba(255, 193, 7, 0.58);
  box-shadow: 0px 0px 0px 1px rgba(255, 0, 0, 0.2) inset,
    0 0 1000px 1000px rgba(0, 0, 0, 0.6);
`;

const PosOffset = styled.div`
  position: absolute;
  > * {
    position: absolute;
    top: 0;
    left: 0;
  }
`;

export const argValue = (arg: unknown): unknown => {
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
  const editorTriggerId = editorType === "trigger" ? entityId : undefined;

  const scriptEventsLookup = useAppSelector((state) =>
    scriptEventSelectors.selectEntities(state)
  );

  const editorActor = useAppSelector((state) =>
    actorSelectors.selectById(state, editorActorId ?? "")
  );
  const editorTrigger = useAppSelector((state) =>
    triggerSelectors.selectById(state, editorTriggerId ?? "")
  );

  const eventId = useAppSelector((state) => state.editor.eventId);
  const sceneId = useAppSelector((state) => state.editor.scene);

  const sceneEventVisible = eventId && sceneId === scene.id;
  const event = sceneEventVisible ? scriptEventsLookup[eventId] : undefined;
  const scriptEventDef = useAppSelector(
    (state) => state.scriptEventDefs.lookup[event?.command ?? ""]
  );

  const args = useMemo(() => {
    if (!event) {
      return {};
    }
    if (
      editorType === "actor" &&
      editorActor?.prefabScriptOverrides?.[event.id]
    ) {
      return {
        ...event.args,
        ...editorActor?.prefabScriptOverrides?.[event.id].args,
      };
    }
    if (
      editorType === "trigger" &&
      editorTrigger?.prefabScriptOverrides?.[event.id]
    ) {
      return {
        ...event.args,
        ...editorTrigger?.prefabScriptOverrides?.[event.id].args,
      };
    }
    return event.args ?? {};
  }, [
    editorActor?.prefabScriptOverrides,
    editorTrigger?.prefabScriptOverrides,
    editorType,
    event,
  ]);

  if (!event || !scriptEventDef || !scriptEventDef.helper) {
    return <></>;
  }

  if (scriptEventDef.helper.type === "camera") {
    const units = scriptEventDef.helper.units
      ? argValue(args[scriptEventDef.helper.units])
      : "tiles";
    const x = ensureMaybeNumber(argValue(args[scriptEventDef.helper.x]), 0);
    const y = ensureMaybeNumber(argValue(args[scriptEventDef.helper.y]), 0);
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
      ? argValue(args[scriptEventDef.helper.units])
      : "tiles";
    const x = ensureMaybeNumber(argValue(args[scriptEventDef.helper.x]), 0);
    const y = ensureMaybeNumber(argValue(args[scriptEventDef.helper.y]), 0);
    const tileSize = ensureMaybeString(
      argValue(args[scriptEventDef.helper.tileSize ?? ""]),
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
      argValue(args[scriptEventDef.helper.distance]),
      0
    );

    if (distance === undefined) {
      return <div />;
    }

    const otherActorId = ensureMaybeString(
      argValue(args[scriptEventDef.helper.actorId]),
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

        switch (args[scriptEventDef.helper.operator]) {
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
    const x = ensureMaybeNumber(argValue(args[scriptEventDef.helper.x]), 0);
    const y = ensureMaybeNumber(argValue(args[scriptEventDef.helper.y]), 0);
    const units = scriptEventDef.helper.units
      ? argValue(args[scriptEventDef.helper.units])
      : "tiles";
    const color = scriptEventDef.helper.color
      ? argValue(args[scriptEventDef.helper.color])
      : "black";
    if (x === undefined && y === undefined) {
      return <div />;
    }
    return (
      <EventHelperWrapper>
        <OverlayPos
          style={{
            left: (x || 0) * (units === "pixels" ? 1 : TILE_SIZE),
            top: (y || 0) * (units === "pixels" ? 1 : TILE_SIZE),
            background: color === "white" ? "#e0f8cf" : "#081820",
          }}
        />
      </EventHelperWrapper>
    );
  }

  if (scriptEventDef.helper.type === "scanline") {
    const y = ensureNumber(argValue(args[scriptEventDef.helper.y]), 0);
    const units = ensureString(
      scriptEventDef.helper.units
        ? argValue(args[scriptEventDef.helper.units])
        : undefined,
      "pixels"
    );
    console.log({ args, units });
    if (y === undefined) {
      return <div />;
    }

    return (
      <EventHelperWrapper>
        <ScreenMarker />
        <ScanlinePos
          style={{
            height: y * (units === "pixels" ? 1 : TILE_SIZE) + 1,
          }}
        />
      </EventHelperWrapper>
    );
  }

  if (scriptEventDef.helper.type === "bounds") {
    const x =
      ensureMaybeNumber(argValue(args[scriptEventDef.helper.x]), 0) ?? 0;
    const y =
      ensureMaybeNumber(argValue(args[scriptEventDef.helper.y]), 0) ?? 0;
    const width =
      ensureMaybeNumber(argValue(args[scriptEventDef.helper.width]), 0) ?? 8;
    const height =
      ensureMaybeNumber(argValue(args[scriptEventDef.helper.height]), 0) ?? 8;
    const actorId = ensureMaybeString(
      argValue(args[scriptEventDef.helper.actorId ?? ""]),
      ""
    );

    if (actorId === undefined || (x === undefined && y === undefined)) {
      return <div />;
    }

    let actor;
    if (actorId === "$self$" && editorActorId !== undefined) {
      actor = actorsLookup[editorActorId];
    } else {
      actor = actorsLookup[actorId];
    }

    if (!actor) {
      return <div />;
    }

    return (
      <EventHelperWrapper>
        <BoundsMarker
          style={{
            left: actor.x * TILE_SIZE + (x || 0),
            top: actor.y * TILE_SIZE - (y || 0) - height + 9,
            width: width,
            height: height,
          }}
        />
      </EventHelperWrapper>
    );
  }

  if (scriptEventDef?.helper?.type === "textdraw") {
    const text = ensureString(argValue(args[scriptEventDef.helper.text]), "");
    const location = ensureString(
      argValue(args[scriptEventDef.helper.location]),
      "background"
    );
    const x = ensureNumber(
      argValue(args[scriptEventDef.helper.x]) ??
        scriptEventDef.fieldsLookup[scriptEventDef.helper.x]?.defaultValue,
      0
    );
    const y = ensureNumber(
      argValue(args[scriptEventDef.helper.y]) ??
        scriptEventDef.fieldsLookup[scriptEventDef.helper.y]?.defaultValue,
      0
    );
    if (location !== "background") {
      return <div />;
    }
    return (
      <PosOffset
        style={{
          left: x * TILE_SIZE,
          top: y * TILE_SIZE,
        }}
      >
        <DialoguePreview
          text={text}
          textX={0}
          textY={0}
          showFrame={false}
          showFill={false}
          minHeight={0}
          maxHeight={18}
        />
      </PosOffset>
    );
  }

  return <div />;
};

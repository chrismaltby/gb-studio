import ItemTypes from "lib/dnd/itemTypes";
import l10n from "lib/helpers/l10n";
import React, { useCallback, useRef, useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import {
  ScriptEvent,
  ScriptEventParentType,
  ScriptEventsRef,
} from "store/features/entities/entitiesTypes";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import entitiesActions from "store/features/entities/entitiesActions";
import { useDispatch, useSelector } from "react-redux";
import {
  ScriptEventPlaceholder,
  ScriptEventWrapper,
} from "ui/scripting/ScriptEvents";
import { RelativePortal } from "ui/layout/RelativePortal";
import AddScriptEventMenu from "./AddScriptEventMenu";
import { MenuOverlay } from "ui/menu/Menu";
import { EventHandler } from "lib/events";
import { Dictionary } from "@reduxjs/toolkit";
import cloneDeep from "lodash/cloneDeep";
import { RootState } from "store/configureStore";
import {
  musicSelectors,
  sceneSelectors,
  spriteSheetSelectors,
} from "store/features/entities/entitiesState";

interface AddButtonProps {
  parentType: ScriptEventParentType;
  parentId: string;
  parentKey: string;
}

interface InstanciateOptions {
  defaultSceneId: string;
  defaultVariableId: string;
  defaultMusicId: string;
  defaultActorId: string;
  defaultSpriteId: string;
}

const Wrapper = styled.div`
  display: flex;
  padding: 10px;
  background: ${(props) => props.theme.colors.scripting.form.background};

  ${Button} {
    width: 100%;
  }
`;

const instanciateScriptEvent = (
  handler: EventHandler,
  {
    defaultSceneId,
    defaultVariableId,
    defaultMusicId,
    defaultActorId,
    defaultSpriteId,
  }: InstanciateOptions
): Omit<ScriptEvent, "id"> => {
  const fields = handler.fields || [];
  const args = cloneDeep(
    fields.reduce((memo, field) => {
      let replaceValue = null;
      let defaultValue = field.defaultValue;
      if (field.type === "union") {
        defaultValue = (field?.defaultValue as Record<string, unknown>)?.[
          field.defaultType || ""
        ];
      }
      if (defaultValue === "LAST_SCENE") {
        replaceValue = defaultSceneId;
      } else if (defaultValue === "LAST_VARIABLE") {
        // replaceValue = scope === "customEvents" ? "0" : "L0";
        replaceValue = defaultVariableId;
      } else if (defaultValue === "LAST_MUSIC") {
        replaceValue = defaultMusicId;
      } else if (defaultValue === "LAST_SPRITE") {
        replaceValue = defaultSpriteId;
      } else if (defaultValue === "LAST_ACTOR") {
        replaceValue = defaultActorId;
        // replaceValue =
        //   actorIds.length > 0 ? actorIds[actorIds.length - 1] : "player";
      } else if (field.type === "events") {
        replaceValue = undefined;
      } else if (defaultValue !== undefined) {
        replaceValue = defaultValue;
      }
      if (field.type === "union") {
        replaceValue = {
          type: field.defaultType,
          value: replaceValue,
        };
      }
      if (replaceValue !== null) {
        return {
          ...memo,
          [field.key]: replaceValue,
        };
      }

      return memo;
    }, {} as Record<string, unknown>)
  );
  const childFields = fields.filter((field) => field.type === "events");
  const children =
    childFields.length > 0
      ? childFields.reduce((memo, field) => {
          return {
            ...memo,
            [field.key]: [],
          };
        }, {} as Dictionary<string[]>)
      : undefined;
  return {
    command: handler.id,
    args,
    ...(children && { children }),
  };
};

const AddButton = ({ parentType, parentId, parentKey }: AddButtonProps) => {
  const dispatch = useDispatch();
  const [isOpen, setOpen] = useState(false);
  const [pinDirection, setPinDirection] =
    useState<"bottom-right" | "top-right">("bottom-right");
  const [menuWidth, setMenuWidth] = useState(280);
  const dropRef = useRef<HTMLDivElement>(null);

  const lastSceneId = useSelector((state: RootState) => {
    const ids = sceneSelectors.selectIds(state);
    return ids[ids.length - 1];
  });
  const lastMusicId = useSelector(
    (state: RootState) => musicSelectors.selectIds(state)[0]
  );
  const lastSpriteId = useSelector(
    (state: RootState) => spriteSheetSelectors.selectIds(state)[0]
  );
  const scope = useSelector((state: RootState) => state.editor.type);

  const [{ handlerId, isOverCurrent }, drop] = useDrop({
    accept: ItemTypes.SCRIPT_EVENT,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOverCurrent: monitor.isOver({ shallow: true }),
      };
    },
    drop(item: ScriptEventsRef, monitor: DropTargetMonitor) {
      const didDrop = monitor.didDrop();
      if (didDrop) {
        return;
      }

      if (!dropRef.current) {
        return;
      }

      dispatch(
        entitiesActions.moveScriptEvent({
          to: {
            scriptEventId: "",
            parentType,
            parentKey,
            parentId,
          },
          from: item,
        })
      );

      item.parentType = parentType;
      item.parentKey = parentKey;
      item.parentId = parentId;
    },
  });

  const onOpen = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const boundingRect = e.currentTarget.getBoundingClientRect();
    if (boundingRect.top > window.innerHeight * 0.5) {
      setPinDirection("bottom-right");
    } else {
      setPinDirection("top-right");
    }
    setMenuWidth(boundingRect.width);
    setOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  const onAdd = useCallback(
    (newEvent: EventHandler) => {
      dispatch(
        entitiesActions.addScriptEvents({
          entityId: parentId,
          type: parentType,
          key: parentKey,
          data: [
            instanciateScriptEvent(newEvent, {
              defaultActorId: "player",
              defaultVariableId: scope === "customEvent" ? "0" : "L0",
              defaultMusicId: String(lastMusicId),
              defaultSceneId: String(lastSceneId),
              defaultSpriteId: String(lastSpriteId),
            }),
          ],
        })
      );

      setOpen(false);
    },
    [
      dispatch,
      lastMusicId,
      lastSceneId,
      lastSpriteId,
      parentId,
      parentKey,
      parentType,
      scope,
    ]
  );

  drop(dropRef);

  return (
    <ScriptEventWrapper ref={dropRef} data-handler-id={handlerId}>
      {isOverCurrent && <ScriptEventPlaceholder />}
      <div style={{ position: "absolute", right: 0 }}>
        {isOpen && (
          <>
            <MenuOverlay onClick={onClose} />
            <RelativePortal
              pin={pinDirection}
              offsetX={-10}
              offsetY={pinDirection === "top-right" ? 10 : 0}
            >
              <div style={{ minWidth: menuWidth }}>
                <AddScriptEventMenu onBlur={onClose} onChange={onAdd} />
              </div>
            </RelativePortal>
          </>
        )}
      </div>
      <Wrapper>
        <Button onClick={onOpen}>{l10n("SIDEBAR_ADD_EVENT")}</Button>
      </Wrapper>
    </ScriptEventWrapper>
  );
};

export default AddButton;

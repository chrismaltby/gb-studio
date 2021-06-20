import React, { useCallback, useRef } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { useDispatch, useSelector } from "react-redux";
import entityActions from "store/features/entities/entitiesActions";
import { RootState } from "store/configureStore";
import { scriptEventSelectors } from "store/features/entities/entitiesState";
import { ScriptEventsRef } from "store/features/entities/entitiesTypes";
import { EVENT_END } from "lib/compiler/eventTypes";
import AddButton from "./AddButton";
import {
  ScriptEventFormWrapper,
  ScriptEventHeader,
  ScriptEventWrapper,
  ScriptEventPlaceholder,
} from "ui/scripting/ScriptEvents";
import { ArrowIcon } from "ui/icons/Icons";
import { FixedSpacer } from "ui/spacing/Spacing";
import ScriptEventForm from "./ScriptEventForm2";

interface ScriptEditorEventProps {
  id: string;
  index: number;
  nestLevel?: number;
  parentType: "scene" | "actor" | "trigger" | "scriptEvent";
  parentId: string;
  parentKey: string;
  dropId: string;
  entityId: string;
  setDropId: (newId: string) => void;
}

const ItemTypes = {
  SCRIPT_EVENT: "SCRIPT_EVENT",
};

const ScriptEditorEvent = ({
  id,
  index,
  parentType,
  parentId,
  parentKey,
  dropId,
  setDropId,
  entityId,
  nestLevel = 0,
}: ScriptEditorEventProps) => {
  const dispatch = useDispatch();
  const dragRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.SCRIPT_EVENT,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: ScriptEventsRef) {
      if (!dropRef.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      //  Don't replace items with themselves
      if (
        dragIndex === hoverIndex &&
        parentType === item.parentType &&
        parentKey === item.parentKey &&
        parentId === item.parentId
      ) {
        return;
      }

      // Can't become as child of self
      if (parentId === item.scriptEventId) {
        return;
      }

      if (dropId !== id) {
        setDropId(id);
      }
    },

    drop(item: ScriptEventsRef, _monitor: DropTargetMonitor) {
      if (!dropRef.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = index;

      //  Don't replace items with themselves
      if (
        dragIndex === hoverIndex &&
        parentType === item.parentType &&
        parentKey === item.parentKey &&
        parentId === item.parentId
      ) {
        return;
      }

      // Can't become as child of self
      if (parentId === item.scriptEventId) {
        return;
      }

      dispatch(
        entityActions.moveScriptEvent({
          to: {
            scriptEventId: id,
            index,
            parentType,
            parentKey,
            parentId,
          },
          from: item,
        })
      );
      setDropId("");

      item.index = hoverIndex;
      item.parentType = parentType;
      item.parentKey = parentKey;
      item.parentId = parentId;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.SCRIPT_EVENT,
    item: (): ScriptEventsRef => {
      return {
        scriptEventId: id,
        index,
        parentType,
        parentId,
        parentKey,
      };
    },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const toggleOpen = useCallback(() => {
    dispatch(entityActions.toggleScriptEventOpen({ scriptEventId: id }));
  }, [dispatch, id]);

  drag(dragRef);
  drop(dropRef);

  const scriptEvent = useSelector((state: RootState) =>
    scriptEventSelectors.selectById(state, id)
  );
  if (!scriptEvent) {
    return null;
  }

  if (scriptEvent.command === EVENT_END) {
    return (
      <ScriptEventWrapper ref={dropRef} data-handler-id={handlerId}>
        {id === dropId && <ScriptEventPlaceholder />}
        <AddButton />
      </ScriptEventWrapper>
    );
  }

  const isOpen = scriptEvent.args && !scriptEvent.args.__collapse;

  return (
    <ScriptEventWrapper
      style={{
        height: isDragging ? 0 : "auto",
        display: isDragging ? "none" : "block",
      }}
    >
      <div ref={dropRef}>
        {id === dropId && <ScriptEventPlaceholder />}
        <div ref={dragRef}>
          <ScriptEventHeader
            conditional={!!scriptEvent.children}
            nestLevel={nestLevel}
            onClick={toggleOpen}
            open={isOpen}
          >
            <ArrowIcon />
            <FixedSpacer width={5} />
            {id}
          </ScriptEventHeader>
        </div>
        <ScriptEventFormWrapper
          conditional={!!scriptEvent.children}
          nestLevel={nestLevel}
          style={{
            height: isDragging ? 0 : "auto",
            display: isDragging ? "none" : "block",
          }}
          data-handler-id={handlerId}
        >
          {isOpen && <ScriptEventForm id={id} entityId={entityId} />}
        </ScriptEventFormWrapper>
      </div>
      {isOpen && scriptEvent.children && (
        <ScriptEventFormWrapper
          conditional={!!scriptEvent.children}
          nestLevel={nestLevel}
          style={{
            height: isDragging ? 0 : "auto",
            display: isDragging ? "none" : "block",
            background: "white",
          }}
          data-handler-id={handlerId}
        >
          {Object.keys(scriptEvent.children).map((key, groupIndex) => (
            <div key={key}>
              {groupIndex > 0 && (
                <ScriptEventHeader
                  conditional={!!scriptEvent.children}
                  nestLevel={nestLevel}
                  child
                  open={isOpen}
                >
                  {key}
                </ScriptEventHeader>
              )}
              <div
                style={{
                  padding: "10px 0 10px 10px",
                }}
              >
                <div
                  style={{
                    borderLeft: "1px solid #ccc",
                    borderTop: "1px solid #ccc",
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  {scriptEvent.children?.[key]?.map((child, index) => (
                    <ScriptEditorEvent
                      key={child}
                      id={child}
                      index={index}
                      nestLevel={nestLevel + 1}
                      parentType="scriptEvent"
                      parentId={id}
                      parentKey={key}
                      dropId={dropId}
                      entityId={entityId}
                      setDropId={setDropId}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </ScriptEventFormWrapper>
      )}
    </ScriptEventWrapper>
  );
};

export default ScriptEditorEvent;

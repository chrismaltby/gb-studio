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
import { EVENT_COMMENT, EVENT_END } from "lib/compiler/eventTypes";
import AddButton from "./AddButton";
import {
  ScriptEventFormWrapper,
  ScriptEventHeader,
  ScriptEventWrapper,
  ScriptEventPlaceholder,
  ScriptEditorChildren,
  ScriptEventFormNest,
} from "ui/scripting/ScriptEvents";
import { ArrowIcon } from "ui/icons/Icons";
import { FixedSpacer } from "ui/spacing/Spacing";
import ScriptEventForm from "./ScriptEventForm2";
import l10n from "lib/helpers/l10n";
import events from "lib/events";

interface ScriptEditorEventProps {
  id: string;
  index: number;
  nestLevel?: number;
  parentType: "scene" | "actor" | "trigger" | "scriptEvent";
  parentId: string;
  parentKey: string;
  entityId: string;
}

const ItemTypes = {
  SCRIPT_EVENT: "SCRIPT_EVENT",
};

const COMMENT_PREFIX = "//";

const ScriptEditorEvent = ({
  id,
  index,
  parentType,
  parentId,
  parentKey,
  entityId,
  nestLevel = 0,
}: ScriptEditorEventProps) => {
  const dispatch = useDispatch();
  const dragRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

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

      console.log("FROM", item.scriptEventId, "TO", id);
      console.log({
        to: {
          scriptEventId: id,
          index,
          parentType,
          parentKey,
          parentId,
        },
        from: item,
      });

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

  const renderEvents = useCallback(
    (key: string) => {
      return (
        <ScriptEditorChildren>
          {(scriptEvent?.children?.[key] || []).map((child, childIndex) => (
            <ScriptEditorEvent
              key={child}
              id={child}
              index={childIndex}
              nestLevel={nestLevel + 1}
              parentType="scriptEvent"
              parentId={id}
              parentKey={key}
              entityId={entityId}
            />
          ))}
        </ScriptEditorChildren>
      );
    },
    [entityId, id, nestLevel, scriptEvent?.children]
  );

  if (!scriptEvent) {
    return null;
  }

  const command = scriptEvent.command;
  const isComment = command === EVENT_COMMENT;
  const commented = scriptEvent.args && scriptEvent.args.__comment;
  const hasElse = scriptEvent.children && scriptEvent.children.false;
  const disabledElse = scriptEvent.args && scriptEvent.args.__disableElse;

  const localisedCommand = l10n(command);
  const defaultCommandName =
    localisedCommand !== command
      ? localisedCommand
      : (events[command] && events[command]?.name) || command;

  const eventName = String(scriptEvent.args?.__name || defaultCommandName);

  const labelName = scriptEvent.args?.__label
    ? scriptEvent.args.__label
    : isComment && scriptEvent.args?.text;

  const hoverName = labelName || eventName;

  if (scriptEvent.command === EVENT_END) {
    return (
      <ScriptEventWrapper ref={dropRef} data-handler-id={handlerId}>
        {isOverCurrent && <ScriptEventPlaceholder />}
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
        {isOverCurrent && <ScriptEventPlaceholder />}
        <div ref={dragRef}>
          <ScriptEventHeader
            conditional={!!scriptEvent.children}
            comment={Boolean(commented || isComment)}
            nestLevel={nestLevel}
            onClick={toggleOpen}
            open={isOpen && !commented}
            altBg={index % 2 === 0}
          >
            {!commented && (
              <>
                <ArrowIcon />
                <FixedSpacer width={5} />
              </>
            )}
            <div>
              {commented || isComment ? <span>{COMMENT_PREFIX} </span> : ""}
              {labelName ? (
                <span>
                  {labelName}
                  <small>{eventName}</small>
                </span>
              ) : (
                <span>{eventName}</span>
              )}
            </div>
          </ScriptEventHeader>
        </div>
        {isOpen && !commented && (
          <ScriptEventFormWrapper
            conditional={!!scriptEvent.children}
            nestLevel={nestLevel}
            altBg={index % 2 === 0}
            data-handler-id={handlerId}
          >
            {!!scriptEvent.children && (
              <ScriptEventFormNest
                title={String(hoverName || "")}
                onClick={toggleOpen}
              />
            )}
            <ScriptEventForm
              id={id}
              entityId={entityId}
              renderEvents={renderEvents}
            />
          </ScriptEventFormWrapper>
        )}
      </div>
    </ScriptEventWrapper>
  );
};

export default ScriptEditorEvent;

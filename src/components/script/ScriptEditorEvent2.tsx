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
import styled, { css } from "styled-components";
import { Button } from "ui/buttons/Button";
import AddButton from "./AddButton";

interface ScriptEditorEventProps {
  id: string;
  index: number;
  parentType: "scene" | "actor" | "trigger" | "scriptEvent";
  parentId: string;
  parentKey: string;
  dropId: string;
  setDropId: (newId: string) => void;
}

const ItemTypes = {
  SCRIPT_EVENT: "SCRIPT_EVENT",
};

const Placeholder = styled.div`
  background: #ccc;
  height: 50px;
`;

interface HeaderProps {
  conditional?: boolean;
}

export const Header = styled.div<HeaderProps>`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: bold;
  padding: 0px 10px;
  padding-right: 5px;
  padding-left: 5px;
  height: 30px;
  background-color: ${(props) => props.theme.colors.input.background};
  color: ${(props) => props.theme.colors.input.text};
  // border-bottom: 1px solid ${(props) => props.theme.colors.input.border};

  ${(props) =>
    props.conditional
      ? css`
          background: blue;
          color: #fff;
        `
      : ""}

  > span {
    flex-grow: 1;
  }

  ${Button} {
    padding: 4px;
    min-width: 18px;
  }
`;

const EventWrapper = styled.div`
  & ~ & {
    border-top: 1px solid ${(props) => props.theme.colors.input.border};
  }
`;

const ScriptEditorEvent = ({
  id,
  index,
  parentType,
  parentId,
  parentKey,
  dropId,
  setDropId,
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

  const opacity = isDragging ? 0.5 : 1;
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
      <EventWrapper
        ref={dropRef}
        style={{ opacity }}
        data-handler-id={handlerId}
      >
        {id === dropId && <Placeholder />}
        <AddButton />
      </EventWrapper>
    );
  }

  const isOpen = scriptEvent.args && !scriptEvent.args.__collapse;

  return (
    <>
      <EventWrapper>
        <div ref={dropRef}>
          {id === dropId && <Placeholder />}
          <div
            style={{
              opacity,
              height: isDragging ? 0 : "auto",
              display: isDragging ? "none" : "block",
              ...(scriptEvent.children && { borderLeft: "10px solid blue" }),
            }}
            data-handler-id={handlerId}
          >
            <div ref={dragRef}>
              <Header conditional={!!scriptEvent.children} onClick={toggleOpen}>
                {!!scriptEvent.children ? "T" : "F"}
                {id}
              </Header>
            </div>
            {isOpen && (
              <div>
                FORM
                <br />
                a<br />b
              </div>
            )}
          </div>
        </div>
        {isOpen && scriptEvent.children && (
          <div
            style={{
              opacity,
              height: isDragging ? 0 : "auto",
              display: isDragging ? "none" : "block",
              background: "white",
              borderLeft: "10px solid blue",
            }}
            data-handler-id={handlerId}
          >
            {Object.keys(scriptEvent.children).map((key, groupIndex) => (
              <div key={key}>
                {groupIndex > 0 && (
                  <div style={{ background: "blue" }}>{key}</div>
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
                        parentType="scriptEvent"
                        parentId={id}
                        parentKey={key}
                        dropId={dropId}
                        setDropId={setDropId}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </EventWrapper>
    </>
  );
};

export default ScriptEditorEvent;

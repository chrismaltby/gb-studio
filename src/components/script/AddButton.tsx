import ItemTypes from "lib/dnd/itemTypes";
import l10n from "lib/helpers/l10n";
import React, { useCallback, useRef, useState } from "react";
import { DropTargetMonitor, useDrop } from "react-dnd";
import {
  ScriptEventParentType,
  ScriptEventsRef,
} from "store/features/entities/entitiesTypes";
import styled from "styled-components";
import { Button } from "ui/buttons/Button";
import entitiesActions from "store/features/entities/entitiesActions";
import { useDispatch } from "react-redux";
import {
  ScriptEventPlaceholder,
  ScriptEventWrapper,
} from "ui/scripting/ScriptEvents";
import { RelativePortal } from "ui/layout/RelativePortal";
import AddScriptEventSelect from "./AddScriptEventSelect";
import { SelectMenu } from "ui/form/Select";

interface AddButtonProps {
  parentType: ScriptEventParentType;
  parentId: string;
  parentKey: string;
}

const Wrapper = styled.div`
  display: flex;
  padding: 10px;
  background: ${(props) => props.theme.colors.scripting.form.background};

  ${Button} {
    width: 100%;
  }
`;

const AddButton = ({ parentType, parentId, parentKey }: AddButtonProps) => {
  const dispatch = useDispatch();
  const [isOpen, setOpen] = useState(false);
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

  const onOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setOpen(false);
  }, []);

  const onAdd = useCallback((newEvent: any) => {
    console.log(
      "ADD NEW EVENT",
      JSON.stringify(newEvent),
      newEvent.event.id,
      JSON.stringify(newEvent.event.fields)
    );
    setOpen(false);
  }, []);

  drop(dropRef);

  return (
    <ScriptEventWrapper ref={dropRef} data-handler-id={handlerId}>
      {isOverCurrent && <ScriptEventPlaceholder />}
      <div style={{ position: "absolute", right: 10 }}>
        <RelativePortal pin="bottom-right" offsetX={-10} offsetY={-10}>
          {isOpen && (
            <SelectMenu style={{ width: 300 }}>
              <AddScriptEventSelect onBlur={onClose} onChange={onAdd} />
            </SelectMenu>
          )}
        </RelativePortal>
      </div>
      <Wrapper>
        <Button onClick={onOpen}>{l10n("SIDEBAR_ADD_EVENT")}</Button>
      </Wrapper>
    </ScriptEventWrapper>
  );
};

export default AddButton;

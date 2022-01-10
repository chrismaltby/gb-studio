import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import { useDispatch, useSelector } from "react-redux";
import entitiesActions from "store/features/entities/entitiesActions";
import { RootState } from "store/configureStore";
import { scriptEventSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import {
  ScriptEventParentType,
  ScriptEventsRef,
} from "store/features/entities/entitiesTypes";
import {
  EVENT_CALL_CUSTOM_EVENT,
  EVENT_COMMENT,
  EVENT_END,
} from "lib/compiler/eventTypes";
import AddButton from "./AddButton";
import {
  ScriptEventFormWrapper,
  ScriptEventHeader,
  ScriptEventWrapper,
  ScriptEventPlaceholder,
  ScriptEditorChildren,
  ScriptEventHeaderTitle,
  ScriptEventHeaderCaret,
  ScriptEventRenameInput,
  ScriptEventRenameInputCompleteButton,
  ScriptEditorChildrenWrapper,
  ScriptEditorChildrenLabel,
} from "ui/scripting/ScriptEvents";
import { ArrowIcon, CheckIcon, CommentIcon } from "ui/icons/Icons";
import { FixedSpacer } from "ui/spacing/Spacing";
import ScriptEventForm from "./ScriptEventForm";
import l10n from "lib/helpers/l10n";
import events from "lib/events";
import { ScriptEditorEventHelper } from "./ScriptEditorEventHelper";
import ItemTypes from "lib/dnd/itemTypes";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuDivider, MenuItem, MenuOverlay } from "ui/menu/Menu";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { ClipboardTypeScriptEvents } from "store/features/clipboard/clipboardTypes";
import { RelativePortal } from "ui/layout/RelativePortal";
import AddScriptEventMenu from "./AddScriptEventMenu";
import ScriptEventTitle from "./ScriptEventTitle";
import useOnScreen from "ui/hooks/use-on-screen";

interface ScriptEditorEventProps {
  id: string;
  index: number;
  nestLevel?: number;
  parentType: ScriptEventParentType;
  parentId: string;
  parentKey: string;
  entityId: string;
}

const ScriptEditorEvent = React.memo(
  ({
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
    const headerRef = useRef<HTMLDivElement>(null);
    const isVisible = useOnScreen(headerRef);

    const [rename, setRename] = useState(false);
    const [isAddOpen, setAddOpen] = useState(false);
    const [insertBefore, setInsertBefore] = useState(false);

    const clipboardFormat = useSelector(
      (state: RootState) => state.clipboard.data?.format
    );
    const scriptEvent = useSelector((state: RootState) =>
      scriptEventSelectors.selectById(state, id)
    );

    const onFetchClipboard = useCallback(() => {
      dispatch(clipboardActions.fetchClipboard());
    }, [dispatch]);

    const toggleRename = useCallback(() => {
      setRename(!rename);
    }, [rename]);

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

        //  Don't replace items with themselves
        if (id === item.scriptEventId) {
          return;
        }

        // Can't become as child of self
        if (parentId === item.scriptEventId) {
          return;
        }

        dispatch(
          entitiesActions.moveScriptEvent({
            to: {
              scriptEventId: id,
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

    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.SCRIPT_EVENT,
      item: (): ScriptEventsRef => {
        return {
          scriptEventId: id,
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
      dispatch(entitiesActions.toggleScriptEventOpen({ scriptEventId: id }));
    }, [dispatch, id]);

    const toggleComment = useCallback(() => {
      dispatch(entitiesActions.toggleScriptEventComment({ scriptEventId: id }));
    }, [dispatch, id]);

    const toggleElse = useCallback(() => {
      dispatch(
        entitiesActions.toggleScriptEventDisableElse({ scriptEventId: id })
      );
    }, [dispatch, id]);

    const editCustomEvent = useCallback(() => {
      const customEventId = scriptEvent?.args?.customEventId;
      if (customEventId && typeof customEventId === "string") {
        dispatch(editorActions.selectCustomEvent({ customEventId }));
      }
    }, [dispatch, scriptEvent?.args?.customEventId]);

    const onRemove = useCallback(() => {
      dispatch(
        entitiesActions.removeScriptEvent({
          scriptEventId: id,
          entityId: parentId,
          type: parentType,
          key: parentKey,
        })
      );
    }, [dispatch, id, parentId, parentKey, parentType]);

    const onPasteValues = useCallback(() => {
      dispatch(
        clipboardActions.pasteScriptEventValues({
          scriptEventId: id,
        })
      );
    }, [dispatch, id]);

    const onCopyScript = useCallback(() => {
      dispatch(
        clipboardActions.copyScriptEvents({
          scriptEventIds: [id],
        })
      );
    }, [dispatch, id]);

    const onPasteScript = useCallback(
      (before: boolean) => {
        dispatch(
          clipboardActions.pasteScriptEvents({
            entityId: parentId,
            type: parentType,
            key: parentKey,
            insertId: id,
            before,
          })
        );
      },
      [dispatch, id, parentId, parentKey, parentType]
    );

    const onRename = useCallback(
      (e) => {
        dispatch(
          entitiesActions.editScriptEventLabel({
            scriptEventId: id,
            value: e.currentTarget.value,
          })
        );
      },
      [dispatch, id]
    );

    const onRenameFocus = useCallback(
      (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.select();
      },
      []
    );

    const onRenameComplete = useCallback(() => {
      setRename(false);
    }, []);

    const onDetectRenameComplete = useCallback((e) => {
      if (e.key === "Enter") {
        setRename(false);
      }
    }, []);

    drag(dragRef);
    drop(dropRef);

    const command = scriptEvent?.command ?? "";
    const isComment = command === EVENT_COMMENT;
    const commented = (scriptEvent?.args && scriptEvent?.args.__comment) ?? "";
    const hasElse =
      (scriptEvent?.children && !!scriptEvent.children.false) ?? false;
    const disabledElse =
      (scriptEvent?.args && scriptEvent?.args.__disableElse) ?? false;
    const labelName =
      (scriptEvent?.args?.__label
        ? scriptEvent.args.__label
        : isComment && scriptEvent?.args?.text) || undefined;

    const renderEvents = useCallback(
      (key: string, label: string) => {
        return (
          <ScriptEditorChildren key={key} title={label} nestLevel={nestLevel}>
            {label && (
              <ScriptEditorChildrenLabel nestLevel={nestLevel}>
                {label}
              </ScriptEditorChildrenLabel>
            )}
            <ScriptEditorChildrenWrapper title="">
              {(scriptEvent?.children?.[key] || []).map((child, childIndex) => (
                <ScriptEditorEvent
                  key={`${child}_${childIndex}`}
                  id={child}
                  index={childIndex}
                  nestLevel={nestLevel + 1}
                  parentType="scriptEvent"
                  parentId={id}
                  parentKey={key}
                  entityId={entityId}
                />
              ))}
              <AddButton
                parentType="scriptEvent"
                parentId={id}
                parentKey={key}
                nestLevel={nestLevel}
                conditional={true}
              />
            </ScriptEditorChildrenWrapper>
          </ScriptEditorChildren>
        );
      },
      [nestLevel, scriptEvent?.children, id, entityId]
    );

    const onMouseEnter = useCallback(() => {
      dispatch(editorActions.selectScriptEvent({ eventId: id }));
    }, [dispatch, id]);

    const onMouseLeave = useCallback(() => {
      dispatch(editorActions.selectScriptEvent({ eventId: "" }));
    }, [dispatch]);

    const onOpenAddMenu = useCallback((before: boolean) => {
      setInsertBefore(before);
      setAddOpen(true);
    }, []);

    const onCloseAddMenu = useCallback(() => {
      setAddOpen(false);
    }, []);

    if (!scriptEvent) {
      return null;
    }

    if (scriptEvent.command === EVENT_END) {
      return null;
    }

    const isOpen = scriptEvent.args && !scriptEvent.args.__collapse;
    const isConditional = events[command]?.isConditional ?? false;

    return (
      <ScriptEventWrapper
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        conditional={isConditional}
        nestLevel={nestLevel}
        altBg={index % 2 === 0}
        style={{
          height: isDragging ? 0 : "auto",
          display: isDragging ? "none" : "block",
        }}
      >
        {isAddOpen && (
          <>
            <MenuOverlay onClick={onCloseAddMenu} />
            <RelativePortal pin={"top-right"} offsetX={40} offsetY={20}>
              <AddScriptEventMenu
                onBlur={onCloseAddMenu}
                parentId={parentId}
                parentKey={parentKey}
                parentType={parentType}
                insertId={id}
                before={insertBefore}
              />
            </RelativePortal>
          </>
        )}

        <div ref={dropRef}>
          {isOverCurrent && <ScriptEventPlaceholder />}
          <div ref={dragRef}>
            <ScriptEventHeader
              ref={headerRef}
              conditional={isConditional}
              comment={Boolean(commented || isComment)}
              nestLevel={nestLevel}
              altBg={index % 2 === 0}
            >
              {isVisible && (
                <>
                  <ScriptEventHeaderTitle
                    onClick={!rename ? toggleOpen : undefined}
                  >
                    {!commented ? (
                      <ScriptEventHeaderCaret open={isOpen && !commented}>
                        <ArrowIcon />
                      </ScriptEventHeaderCaret>
                    ) : (
                      <ScriptEventHeaderCaret>
                        <CommentIcon />
                      </ScriptEventHeaderCaret>
                    )}
                    <FixedSpacer width={5} />
                    {rename ? (
                      <>
                        <ScriptEventRenameInput
                          autoFocus
                          value={String(labelName || "")}
                          onChange={onRename}
                          onFocus={onRenameFocus}
                          onBlur={onRenameComplete}
                          onKeyDown={onDetectRenameComplete}
                          placeholder={l10n("FIELD_RENAME")}
                        />
                        <ScriptEventRenameInputCompleteButton
                          onClick={onRenameComplete}
                          title={l10n("FIELD_RENAME")}
                        >
                          <CheckIcon />
                        </ScriptEventRenameInputCompleteButton>
                      </>
                    ) : (
                      <ScriptEventTitle
                        command={scriptEvent.command}
                        args={scriptEvent.args}
                      />
                    )}
                  </ScriptEventHeaderTitle>

                  <DropdownButton
                    size="small"
                    variant="transparent"
                    menuDirection="right"
                    onMouseDown={onFetchClipboard}
                  >
                    {command === EVENT_CALL_CUSTOM_EVENT && [
                      <MenuItem key="0" onClick={editCustomEvent}>
                        {l10n("MENU_EDIT_CUSTOM_EVENT")}
                      </MenuItem>,
                      <MenuDivider key="1" />,
                    ]}
                    <MenuItem onClick={toggleRename}>
                      {l10n("MENU_RENAME_EVENT")}
                    </MenuItem>
                    <MenuItem onClick={toggleComment}>
                      {commented
                        ? l10n("MENU_ENABLE_EVENT")
                        : l10n("MENU_DISABLE_EVENT")}
                    </MenuItem>
                    {hasElse && (
                      <MenuItem onClick={toggleElse}>
                        {disabledElse
                          ? l10n("MENU_ENABLE_ELSE")
                          : l10n("MENU_DISABLE_ELSE")}
                      </MenuItem>
                    )}
                    <MenuDivider />
                    <MenuItem onClick={() => onOpenAddMenu(true)}>
                      {l10n("MENU_INSERT_EVENT_BEFORE")}
                    </MenuItem>
                    <MenuItem onClick={() => onOpenAddMenu(false)}>
                      {l10n("MENU_INSERT_EVENT_AFTER")}
                    </MenuItem>
                    <MenuDivider />
                    <MenuItem onClick={onCopyScript}>
                      {l10n("MENU_COPY_EVENT")}
                    </MenuItem>
                    {clipboardFormat === ClipboardTypeScriptEvents && (
                      <MenuDivider />
                    )}
                    {clipboardFormat === ClipboardTypeScriptEvents && (
                      <MenuItem onClick={onPasteValues}>
                        {l10n("MENU_PASTE_VALUES")}
                      </MenuItem>
                    )}
                    {clipboardFormat === ClipboardTypeScriptEvents && (
                      <MenuItem onClick={() => onPasteScript(true)}>
                        {l10n("MENU_PASTE_EVENT_BEFORE")}
                      </MenuItem>
                    )}
                    {clipboardFormat === ClipboardTypeScriptEvents && (
                      <MenuItem onClick={() => onPasteScript(false)}>
                        {l10n("MENU_PASTE_EVENT_AFTER")}
                      </MenuItem>
                    )}
                    <MenuDivider />
                    <MenuItem onClick={onRemove}>
                      {l10n("MENU_DELETE_EVENT")}
                    </MenuItem>
                  </DropdownButton>
                </>
              )}
            </ScriptEventHeader>
          </div>
          {isOpen && !commented && (
            <ScriptEventFormWrapper
              conditional={isConditional}
              nestLevel={nestLevel}
              altBg={index % 2 === 0}
              data-handler-id={handlerId}
            >
              <ScriptEditorEventHelper event={scriptEvent} />
              <ScriptEventForm
                id={id}
                entityId={entityId}
                renderEvents={renderEvents}
                nestLevel={nestLevel}
                altBg={index % 2 === 0}
              />
            </ScriptEventFormWrapper>
          )}
        </div>
      </ScriptEventWrapper>
    );
  }
);

export default ScriptEditorEvent;

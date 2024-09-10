import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DragSourceMonitor,
  DropTargetMonitor,
  useDrag,
  useDrop,
} from "react-dnd";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  actorSelectors,
  scriptEventSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import {
  ScriptEventNormalized,
  ScriptEventParentType,
  ScriptEventsRef,
} from "shared/lib/entities/entitiesTypes";
import {
  ScriptEventFormWrapper,
  ScriptEventHeader,
  ScriptEventWrapper,
  ScriptEventPlaceholder,
  ScriptEventRenameInput,
  ScriptEventRenameInputCompleteButton,
} from "ui/scripting/ScriptEvents";
import { CheckIcon } from "ui/icons/Icons";
import ScriptEventForm from "./ScriptEventForm";
import l10n from "shared/lib/lang/l10n";
import { ScriptEditorEventHelper } from "./ScriptEditorEventHelper";
import ItemTypes from "renderer/lib/dnd/itemTypes";
import { MenuOverlay } from "ui/menu/Menu";
import clipboardActions from "store/features/clipboard/clipboardActions";
import { RelativePortal } from "ui/layout/RelativePortal";
import AddScriptEventMenu from "./AddScriptEventMenu";
import ScriptEventTitle from "./ScriptEventTitle";
import useOnScreen from "ui/hooks/use-on-screen";
import { ScriptEventSymbolsEditor } from "components/forms/symbols/ScriptEventSymbolsEditor";
import { ScriptEventSymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { EVENT_COMMENT, EVENT_END } from "consts";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";
import { getSettings } from "store/features/settings/settingsState";
import renderScriptEventContextMenu from "components/script/renderScriptEventContextMenu";
import { ContextMenu } from "ui/menu/ContextMenu";
import { ScriptEventChildren } from "components/script/ScriptEventChildren";

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
    const dispatch = useAppDispatch();
    const context = useContext(ScriptEditorContext);
    const dragRef = useRef<HTMLDivElement>(null);
    const dropRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const isVisible = useOnScreen(headerRef);

    const [rename, setRename] = useState(false);
    const [isAddOpen, setAddOpen] = useState(false);
    const [insertBefore, setInsertBefore] = useState(false);
    const [showSymbols, setShowSymbols] = useState(false);

    const overrides = useAppSelector((state) => {
      if (context.entityType === "actorPrefab" && context.instanceId) {
        const instance = actorSelectors.selectById(state, context.instanceId);
        return instance?.prefabScriptOverrides?.[id];
      } else if (context.entityType === "triggerPrefab" && context.instanceId) {
        const instance = triggerSelectors.selectById(state, context.instanceId);
        return instance?.prefabScriptOverrides?.[id];
      }
    });

    const clipboardFormat = useAppSelector(
      (state) => state.clipboard.data?.format
    );
    const scriptEventData = useAppSelector((state) =>
      scriptEventSelectors.selectById(state, id)
    );
    const scriptEvent: ScriptEventNormalized | undefined = useMemo(
      () =>
        scriptEventData
          ? {
              ...scriptEventData,
              args: {
                ...scriptEventData.args,
                ...overrides?.args,
              },
            }
          : undefined,
      [overrides, scriptEventData]
    );

    const scriptEventDefs = useAppSelector((state) =>
      selectScriptEventDefs(state)
    );
    const scriptEventSelectionIds = useAppSelector(
      (state) => state.editor.scriptEventSelectionIds
    );

    const breakpointEnabled = useAppSelector(
      (state) =>
        getSettings(state).debuggerBreakpoints.findIndex(
          (b) => b.scriptEventId === id
        ) > -1
    );

    const onSelect = useCallback(
      (shiftPressed: boolean) => {
        if (shiftPressed) {
          dispatch(
            editorActions.toggleScriptEventSelectedId({
              scriptEventId: id,
              parentId,
              parentKey,
              parentType,
            })
          );
          return true;
        } else if (
          scriptEventSelectionIds.length > 0 &&
          !scriptEventSelectionIds.includes(id)
        ) {
          dispatch(editorActions.clearScriptEventSelectionIds());
          return true;
        }
        return false;
      },
      [dispatch, id, parentId, parentKey, parentType, scriptEventSelectionIds]
    );

    const onFetchClipboard = useCallback(
      (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
        onSelect(e.shiftKey);
        dispatch(clipboardActions.fetchClipboard());
      },
      [dispatch, onSelect]
    );

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
            additionalScriptEventIds: scriptEventSelectionIds,
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

    const toggleOpen = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (onSelect(e.shiftKey)) {
          return;
        }
        dispatch(entitiesActions.toggleScriptEventOpen({ scriptEventId: id }));
      },
      [dispatch, id, onSelect]
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
    const isOpen = (scriptEvent?.args && !scriptEvent.args.__collapse) ?? false;
    const isConditional = scriptEventDefs[command]?.isConditional ?? false;
    const editableSymbol = scriptEventDefs[command]?.editableSymbol ?? false;

    const onOpenAddMenu = useCallback((before: boolean) => {
      setInsertBefore(before);
      setAddOpen(true);
    }, []);

    const onCloseAddMenu = useCallback(() => {
      setAddOpen(false);
    }, []);

    const onApplyOverrides = useCallback(() => {
      if (context.entityType === "actorPrefab" && context.instanceId) {
        dispatch(
          entitiesActions.applyActorPrefabScriptEventOverride({
            actorId: context.instanceId,
            scriptEventId: id,
          })
        );
      } else if (context.entityType === "triggerPrefab" && context.instanceId) {
        dispatch(
          entitiesActions.applyTriggerPrefabScriptEventOverride({
            triggerId: context.instanceId,
            scriptEventId: id,
          })
        );
      }
    }, [context.entityType, context.instanceId, dispatch, id]);

    const onRevertOverrides = useCallback(() => {
      if (context.entityType === "actorPrefab" && context.instanceId) {
        dispatch(
          entitiesActions.revertActorPrefabScriptEventOverride({
            actorId: context.instanceId,
            scriptEventId: id,
          })
        );
      } else if (context.entityType === "triggerPrefab" && context.instanceId) {
        dispatch(
          entitiesActions.revertTriggerPrefabScriptEventOverride({
            triggerId: context.instanceId,
            scriptEventId: id,
          })
        );
      }
    }, [context.entityType, context.instanceId, dispatch, id]);

    const contextMenuItems = useMemo(
      () =>
        scriptEvent
          ? renderScriptEventContextMenu({
              scriptEventId: scriptEvent.id,
              additionalScriptEventIds: scriptEventSelectionIds,
              command,
              args: scriptEvent.args,
              dispatch,
              parentId,
              parentKey,
              parentType,
              context,
              breakpointEnabled,
              commented: !!commented,
              hasElse,
              hasOverride: !!overrides,
              disabledElse: !!disabledElse,
              clipboardFormat,
              onRename: toggleRename,
              onViewSymbols: editableSymbol
                ? () => setShowSymbols(true)
                : undefined,
              onInsert: onOpenAddMenu,
              onApplyOverrides: onApplyOverrides,
              onRevertOverrides: onRevertOverrides,
            })
          : [],
      [
        breakpointEnabled,
        clipboardFormat,
        command,
        commented,
        context,
        disabledElse,
        dispatch,
        editableSymbol,
        hasElse,
        onApplyOverrides,
        onOpenAddMenu,
        onRevertOverrides,
        overrides,
        parentId,
        parentKey,
        parentType,
        scriptEvent,
        scriptEventSelectionIds,
        toggleRename,
      ]
    );

    const [contextMenu, setContextMenu] =
      useState<{
        x: number;
        y: number;
        menu: JSX.Element[];
      }>();

    const onContextMenu = useCallback(
      (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        e.stopPropagation();
        onFetchClipboard(e);
        setContextMenu({ x: e.pageX, y: e.pageY, menu: contextMenuItems });
      },
      [contextMenuItems, onFetchClipboard]
    );

    const onContextMenuClose = useCallback(() => {
      setContextMenu(undefined);
    }, []);

    const renderEvents = useCallback(
      (key: string, label: string) => {
        return (
          <ScriptEventChildren
            key={key}
            label={label}
            nestLevel={nestLevel}
            entityId={entityId}
            parentId={id}
            parentKey={key}
            scriptEvent={scriptEvent}
          />
        );
      },
      [nestLevel, scriptEvent, id, entityId]
    );

    const onMouseEnter = useCallback(() => {
      dispatch(editorActions.selectScriptEvent({ eventId: id }));
    }, [dispatch, id]);

    const onMouseLeave = useCallback(() => {
      dispatch(editorActions.selectScriptEvent({ eventId: "" }));
    }, [dispatch]);

    const isExecuting = scriptEvent?.id === context.executingId;

    useEffect(() => {
      if (isExecuting && headerRef.current) {
        headerRef.current.scrollIntoView();
      }
    }, [isExecuting]);

    const onKeyDown = useCallback(
      (e: KeyboardEvent) => {
        // Group selection with ctrl/cmd + g
        if (
          (e.ctrlKey || e.metaKey) &&
          e.key === "g" &&
          scriptEventSelectionIds[0] === id
        ) {
          dispatch(
            entitiesActions.groupScriptEvents({
              scriptEventIds: scriptEventSelectionIds,
              parentId,
              parentKey,
              parentType,
            })
          );
          return;
        }
      },
      [dispatch, id, parentId, parentKey, parentType, scriptEventSelectionIds]
    );

    useEffect(() => {
      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
      };
    });

    if (!scriptEvent) {
      return null;
    }

    if (scriptEvent.command === EVENT_END) {
      return null;
    }

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
              isConditional={isConditional}
              isComment={Boolean(commented || isComment)}
              nestLevel={nestLevel}
              altBg={index % 2 === 0}
              isOpen={isOpen}
              isSelected={scriptEventSelectionIds.includes(scriptEvent.id)}
              isExecuting={isExecuting}
              isBreakpoint={breakpointEnabled}
              breakpointTitle={l10n("FIELD_BREAKPOINT")}
              menuItems={contextMenuItems}
              onOpenMenu={onFetchClipboard}
              onContextMenu={onContextMenu}
              onToggle={!rename ? toggleOpen : undefined}
            >
              {isVisible && (
                <>
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
              {showSymbols && (
                <ScriptEventSymbolEditorWrapper>
                  <ScriptEventSymbolsEditor id={id} />
                </ScriptEventSymbolEditorWrapper>
              )}
              <ScriptEventForm
                scriptEvent={scriptEvent}
                entityId={entityId}
                renderEvents={renderEvents}
                nestLevel={nestLevel}
                altBg={index % 2 === 0}
                parentId={parentId}
                parentKey={parentKey}
                parentType={parentType}
              />
            </ScriptEventFormWrapper>
          )}
        </div>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={onContextMenuClose}
          >
            {contextMenu.menu}
          </ContextMenu>
        )}
      </ScriptEventWrapper>
    );
  }
);

export default ScriptEditorEvent;

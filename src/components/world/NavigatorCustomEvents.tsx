import React, { FC, useCallback, useMemo, useState } from "react";
import { customEventSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { ScriptNormalized } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { EntityListItemDnD } from "ui/lists/EntityListItemDnD";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import {
  EntityNavigatorItem,
  buildEntityNavigatorItems,
  entityParentFolders,
} from "shared/lib/entities/buildEntityNavigatorItems";
import useToggleableList from "ui/hooks/use-toggleable-list";
import { customEventName } from "shared/lib/entities/entitiesHelpers";
import { CheckIcon, BlankIcon } from "ui/icons/Icons";
import ItemTypes from "renderer/lib/dnd/itemTypes";
import { getParentPath } from "shared/lib/helpers/virtualFilesystem";
import { useFlatListReparentDnD } from "ui/hooks/use-flatlist-reparent-dnd";
import { assertUnreachable } from "shared/lib/helpers/assert";

interface NavigatorCustomEventsProps {
  height: number;
  searchTerm: string;
}

const ACCEPT_TYPES = [ItemTypes.CUSTOM_EVENT, ItemTypes.CUSTOM_EVENT_FOLDER];

export const NavigatorCustomEvents: FC<NavigatorCustomEventsProps> = ({
  height,
  searchTerm,
}) => {
  const allCustomEvents = useAppSelector((state) =>
    customEventSelectors.selectAll(state),
  );
  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const selectedId = editorType === "customEvent" ? entityId : "";
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, selectedId),
  );
  const showUses = useAppSelector((state) => state.editor.showScriptUses);

  const dispatch = useAppDispatch();

  const {
    values: manuallyOpenedFolders,
    isSet: isFolderOpen,
    toggle: toggleFolderOpen,
    set: openFolder,
    unset: closeFolder,
  } = useToggleableList<string>([]);

  const openFolders = useMemo(() => {
    return [
      ...manuallyOpenedFolders,
      ...(customEvent ? entityParentFolders(customEvent) : []),
    ];
  }, [manuallyOpenedFolders, customEvent]);

  const nestedCustomEventItems = useMemo(
    () =>
      buildEntityNavigatorItems(
        allCustomEvents.map((customEvent, index) => ({
          ...customEvent,
          name: customEventName(customEvent, index),
        })),
        openFolders,
        searchTerm,
      ),
    [allCustomEvents, openFolders, searchTerm],
  );

  const setSelectedId = (id: string) => {
    dispatch(editorActions.selectCustomEvent({ customEventId: id }));
  };

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
      }
    },
    [selectedId],
  );

  const onRenameComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editCustomEvent({
            customEventId: renameId,
            changes: {
              name,
            },
          }),
        );
      }
      setRenameId("");
    },
    [dispatch, renameId],
  );

  const onRenameCancel = useCallback(() => {
    setRenameId("");
  }, []);

  const setShowUses = useCallback(
    (value: boolean) => {
      dispatch(editorActions.setShowScriptUses(value));
    },
    [dispatch],
  );

  const renderContextMenu = useCallback(
    (item: EntityNavigatorItem<ScriptNormalized>) => {
      return [
        <MenuItem
          key="rename"
          onClick={() => setRenameId(item.id)}
          icon={<BlankIcon />}
        >
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuDivider key="div-view-mode" />,
        <MenuItem
          key="view-editor"
          onClick={() => setShowUses(false)}
          icon={!showUses ? <CheckIcon /> : <BlankIcon />}
        >
          {l10n("MENU_EDIT_CUSTOM_EVENT")}
        </MenuItem>,
        <MenuItem
          key="view-uses"
          onClick={() => setShowUses(true)}
          icon={showUses ? <CheckIcon /> : <BlankIcon />}
        >
          {l10n("FIELD_VIEW_SCRIPT_USES")}
        </MenuItem>,
        <MenuDivider key="div-delete" />,
        <MenuItem
          key="delete"
          onClick={() =>
            dispatch(
              entitiesActions.removeCustomEvent({ customEventId: item.id }),
            )
          }
          icon={<BlankIcon />}
        >
          {l10n("MENU_DELETE_CUSTOM_EVENT")}
        </MenuItem>,
      ];
    },
    [dispatch, setShowUses, showUses],
  );

  const renderLabel = useCallback(
    (item: EntityNavigatorItem<ScriptNormalized>) => {
      if (item.type === "folder") {
        return (
          <div onClick={() => toggleFolderOpen(item.id)}>{item.filename}</div>
        );
      }
      return item.filename;
    },
    [toggleFolderOpen],
  );

  const { onDropOntoItem, flatListDropzone } = useFlatListReparentDnD<
    EntityNavigatorItem<ScriptNormalized>
  >({
    onReparent: (item, { dropFolder }) => {
      if (item.type === "folder") {
        dispatch(
          entitiesActions.reparentCustomEventsFolder({
            fromPath: item.name,
            toPath: dropFolder,
          }),
        );
      } else if (item.type === "entity") {
        dispatch(
          entitiesActions.reparentCustomEvent({
            customEventId: item.id,
            toPath: dropFolder,
          }),
        );
      } else {
        assertUnreachable(item.type);
      }
    },
    acceptTypes: ACCEPT_TYPES,
    getName: (item) => item.name,
    getDropFolder: (target) =>
      target.type === "folder" ? target.name : getParentPath(target.name),
  });

  return (
    <FlatList
      selectedId={selectedId}
      items={nestedCustomEventItems}
      setSelectedId={setSelectedId}
      height={height}
      onKeyDown={(e: KeyboardEvent, item) => {
        listenForRenameStart(e);
        if (item?.type === "folder") {
          if (e.key === "ArrowRight") {
            openFolder(selectedId);
          } else if (e.key === "ArrowLeft") {
            closeFolder(selectedId);
          }
        }
      }}
      outerElementType={flatListDropzone}
      children={({ item }) => (
        <EntityListItemDnD
          item={item}
          type={item.type === "folder" ? "folder" : "script"}
          rename={item.type === "entity" && renameId === item.id}
          onRename={onRenameComplete}
          onRenameCancel={onRenameCancel}
          renderContextMenu={
            item.type === "entity" ? renderContextMenu : undefined
          }
          collapsable={item.type === "folder"}
          collapsed={!isFolderOpen(item.name)}
          onToggleCollapse={() => toggleFolderOpen(item.name)}
          nestLevel={item.nestLevel}
          renderLabel={renderLabel}
          dragType={
            item.type === "folder"
              ? ItemTypes.CUSTOM_EVENT_FOLDER
              : ItemTypes.CUSTOM_EVENT
          }
          acceptTypes={ACCEPT_TYPES}
          onDrop={onDropOntoItem}
        />
      )}
    />
  );
};

import React, { FC, useCallback, useMemo, useState } from "react";
import { customEventSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { CustomEventNormalized } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { EntityListItem } from "ui/lists/EntityListItem";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import {
  EntityNavigatorItem,
  buildEntityNavigatorItems,
  entityParentFolders,
} from "shared/lib/entities/buildEntityNavigatorItems";
import useToggleableList from "ui/hooks/use-toggleable-list";
import { customEventName } from "shared/lib/entities/entitiesHelpers";

interface NavigatorCustomEventsProps {
  height: number;
}

export const NavigatorCustomEvents: FC<NavigatorCustomEventsProps> = ({
  height,
}) => {
  const allCustomEvents = useAppSelector((state) =>
    customEventSelectors.selectAll(state)
  );
  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const selectedId = editorType === "customEvent" ? entityId : "";
  const customEvent = useAppSelector((state) =>
    customEventSelectors.selectById(state, selectedId)
  );
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
        openFolders
      ),
    [allCustomEvents, openFolders]
  );

  const setSelectedId = (id: string) => {
    dispatch(editorActions.selectCustomEvent({ customEventId: id }));
  };

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
      }
    },
    [selectedId]
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
          })
        );
      }
      setRenameId("");
    },
    [dispatch, renameId]
  );

  const onRenameCancel = useCallback(() => {
    setRenameId("");
  }, []);

  const renderContextMenu = useCallback(
    (item: EntityNavigatorItem<CustomEventNormalized>) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuDivider key="div-delete" />,
        <MenuItem
          key="delete"
          onClick={() =>
            dispatch(
              entitiesActions.removeCustomEvent({ customEventId: item.id })
            )
          }
        >
          {l10n("MENU_DELETE_CUSTOM_EVENT")}
        </MenuItem>,
      ];
    },
    [dispatch]
  );

  const renderLabel = useCallback(
    (item: EntityNavigatorItem<CustomEventNormalized>) => {
      if (item.type === "folder") {
        return (
          <div onClick={() => toggleFolderOpen(item.id)}>{item.filename}</div>
        );
      }
      return item.filename;
    },
    [toggleFolderOpen]
  );

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
      children={({ item }) => (
        <EntityListItem
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
        />
      )}
    />
  );
};

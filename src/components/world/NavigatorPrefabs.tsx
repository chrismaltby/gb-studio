import React, { FC, useCallback, useMemo, useState } from "react";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { ActorPrefabNormalized } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { EntityListItem } from "ui/lists/EntityListItem";
import { MenuDivider, MenuItem, MenuItemIcon } from "ui/menu/Menu";
import {
  EntityNavigatorItem,
  buildEntityNavigatorItems,
  entityParentFolders,
} from "shared/lib/entities/buildEntityNavigatorItems";
import useToggleableList from "ui/hooks/use-toggleable-list";
import { actorName } from "shared/lib/entities/entitiesHelpers";
import { CheckIcon, BlankIcon } from "ui/icons/Icons";
import { actorPrefabSelectors } from "store/features/entities/entitiesState";

interface NavigatorPrefabsProps {
  height: number;
  searchTerm: string;
}

export const NavigatorPrefabs: FC<NavigatorPrefabsProps> = ({
  height,
  searchTerm,
}) => {
  const allActorPrefabs = useAppSelector(actorPrefabSelectors.selectAll);
  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const selectedId = editorType === "actorPrefab" ? entityId : "";
  const actorPrefab = null;
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
      ...(actorPrefab ? entityParentFolders(actorPrefab) : []),
    ];
  }, [manuallyOpenedFolders, actorPrefab]);

  const nestedPrefabItems = useMemo(
    () =>
      ([] as EntityNavigatorItem<ActorPrefabNormalized>[]).concat(
        {
          id: "actors",
          type: "folder",
          name: l10n("FIELD_ACTORS"),
          filename: l10n("FIELD_ACTORS"),
        },
        buildEntityNavigatorItems(
          allActorPrefabs.map((actorPrefab, index) => ({
            ...actorPrefab,
            name: actorName(actorPrefab, index),
          })),
          openFolders,
          searchTerm,
          undefined,
          1
        ),
        {
          id: "triggers",
          type: "folder",
          name: l10n("FIELD_TRIGGERS"),
          filename: l10n("FIELD_TRIGGERS"),
        }
      ),
    [allActorPrefabs, openFolders, searchTerm]
  );

  const setSelectedId = (id: string) => {
    dispatch(editorActions.selectActorPrefab({ actorPrefabId: id }));
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
        // dispatch(
        //   entitiesActions.editCustomEvent({
        //     customEventId: renameId,
        //     changes: {
        //       name,
        //     },
        //   })
        // );
      }
      setRenameId("");
    },
    [dispatch, renameId]
  );

  const onRenameCancel = useCallback(() => {
    setRenameId("");
  }, []);

  const setShowUses = useCallback(
    (value: boolean) => {
      dispatch(editorActions.setShowScriptUses(value));
    },
    [dispatch]
  );

  const renderContextMenu = useCallback(
    (item: EntityNavigatorItem<ActorPrefabNormalized>) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          <MenuItemIcon>
            <BlankIcon />
          </MenuItemIcon>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuDivider key="div-view-mode" />,
        <MenuItem key="view-editor" onClick={() => setShowUses(false)}>
          <MenuItemIcon>
            {!showUses ? <CheckIcon /> : <BlankIcon />}
          </MenuItemIcon>
          {l10n("FIELD_EDIT_PREFAB")}
        </MenuItem>,
        <MenuItem key="view-uses" onClick={() => setShowUses(true)}>
          <MenuItemIcon>
            {showUses ? <CheckIcon /> : <BlankIcon />}
          </MenuItemIcon>
          {l10n("FIELD_VIEW_PREFAB_USES")}
        </MenuItem>,
        <MenuDivider key="div-delete" />,
        <MenuItem
          key="delete"
          //   onClick={() =>
          //     dispatch(
          //       entitiesActions.removeCustomEvent({ customEventId: item.id })
          //     )
          //   }
        >
          <MenuItemIcon>
            <BlankIcon />
          </MenuItemIcon>
          {l10n("MENU_DELETE_PREFAB")}
        </MenuItem>,
      ];
    },
    [dispatch, setShowUses, showUses]
  );

  const renderLabel = useCallback(
    (item: EntityNavigatorItem<ActorPrefabNormalized>) => {
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
      items={nestedPrefabItems}
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
          collapsable={
            item.type === "folder" &&
            item.id !== "actors" &&
            item.id !== "triggers"
          }
          collapsed={!isFolderOpen(item.name)}
          onToggleCollapse={() => toggleFolderOpen(item.name)}
          nestLevel={item.nestLevel}
          renderLabel={renderLabel}
        />
      )}
    />
  );
};

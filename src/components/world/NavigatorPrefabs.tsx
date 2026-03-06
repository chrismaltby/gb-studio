import React, { FC, useCallback, useMemo, useState } from "react";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { EntityListItemDnD } from "ui/lists/EntityListItemDnD";
import { MenuDivider, MenuItem, MenuItemIcon } from "ui/menu/Menu";
import { entityParentFolders } from "shared/lib/entities/buildEntityNavigatorItems";
import useToggleableList from "ui/hooks/use-toggleable-list";
import { CheckIcon, BlankIcon, InstantiateIcon } from "ui/icons/Icons";
import {
  actorPrefabSelectors,
  triggerPrefabSelectors,
} from "store/features/entities/entitiesState";
import { Button } from "ui/buttons/Button";
import { FlexGrow, FlexRow } from "ui/spacing/Spacing";
import ItemTypes from "renderer/lib/dnd/itemTypes";
import { getParentPath } from "shared/lib/helpers/virtualFilesystem";
import {
  buildPrefabNavigatorItems,
  PrefabNavigatorItem,
} from "shared/lib/entities/buildPrefabNavigatorItems";
import { assertUnreachable } from "shared/lib/helpers/assert";
import { useFlatListReparentDnD } from "ui/hooks/use-flatlist-reparent-dnd";

interface NavigatorPrefabsProps {
  height: number;
  searchTerm: string;
}

const ACTOR_ACCEPT_TYPES = [
  ItemTypes.ACTOR_PREFAB,
  ItemTypes.ACTOR_PREFAB_FOLDER,
];
const TRIGGER_ACCEPT_TYPES = [
  ItemTypes.TRIGGER_PREFAB,
  ItemTypes.TRIGGER_PREFAB_FOLDER,
];

const getDropFolder = (target: PrefabNavigatorItem): string => {
  if (
    target.type === "actorPrefabFolder" ||
    target.type === "triggerPrefabFolder"
  ) {
    return target.isRoot ? "" : target.name;
  }

  return getParentPath(target.name);
};

const getPrefabCategory = (item: PrefabNavigatorItem): "actor" | "trigger" => {
  switch (item.type) {
    case "actorPrefab":
    case "actorPrefabFolder":
      return "actor";
    case "triggerPrefab":
    case "triggerPrefabFolder":
      return "trigger";
    default:
      return assertUnreachable(item);
  }
};

export const NavigatorPrefabs: FC<NavigatorPrefabsProps> = ({
  height,
  searchTerm,
}) => {
  const allActorPrefabs = useAppSelector(actorPrefabSelectors.selectAll);
  const allTriggerPrefabs = useAppSelector(triggerPrefabSelectors.selectAll);
  const actorPrefabsLookup = useAppSelector(
    actorPrefabSelectors.selectEntities,
  );
  const triggerPrefabsLookup = useAppSelector(
    triggerPrefabSelectors.selectEntities,
  );

  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const selectedId =
    editorType === "actorPrefab" || editorType === "triggerPrefab"
      ? entityId
      : "";
  const actorPrefab = useAppSelector((state) =>
    actorPrefabSelectors.selectById(state, selectedId),
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
      ...(actorPrefab ? entityParentFolders(actorPrefab) : []),
    ];
  }, [manuallyOpenedFolders, actorPrefab]);

  const nestedPrefabItems = useMemo(
    () =>
      buildPrefabNavigatorItems(
        allActorPrefabs,
        allTriggerPrefabs,
        openFolders,
        searchTerm,
      ),
    [allActorPrefabs, allTriggerPrefabs, openFolders, searchTerm],
  );

  const setSelectedId = (id: string, item: PrefabNavigatorItem) => {
    if (item.type === "actorPrefab") {
      dispatch(editorActions.selectActorPrefab({ actorPrefabId: id }));
    } else if (item.type === "triggerPrefab") {
      dispatch(editorActions.selectTriggerPrefab({ triggerPrefabId: id }));
    }
  };

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
      } else if (e.code === "Escape") {
        dispatch(editorActions.setTool({ tool: "select" }));
      }
    },
    [dispatch, selectedId],
  );

  const onRenameComplete = useCallback(
    (name: string) => {
      if (renameId && actorPrefabsLookup[renameId]) {
        dispatch(
          entitiesActions.editActorPrefab({
            actorPrefabId: renameId,
            changes: {
              name,
            },
          }),
        );
      } else if (renameId && triggerPrefabsLookup[renameId]) {
        dispatch(
          entitiesActions.editTriggerPrefab({
            triggerPrefabId: renameId,
            changes: {
              name,
            },
          }),
        );
      }
      setRenameId("");
    },
    [actorPrefabsLookup, dispatch, renameId, triggerPrefabsLookup],
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

  const setInstantiateActor = useCallback(
    (prefabId: string) => {
      dispatch(editorActions.setTool({ tool: "actors" }));
      dispatch(editorActions.setPrefabId(prefabId));
    },
    [dispatch],
  );

  const setInstantiateTrigger = useCallback(
    (prefabId: string) => {
      dispatch(editorActions.setTool({ tool: "triggers" }));
      dispatch(editorActions.setPrefabId(prefabId));
    },
    [dispatch],
  );

  const renderContextMenu = useCallback(
    (item: PrefabNavigatorItem) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          <MenuItemIcon>
            <BlankIcon />
          </MenuItemIcon>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuDivider key="div-instantiate" />,
        <MenuItem
          key="instantiate"
          onClick={() => {
            if (actorPrefabsLookup[item.id]) {
              setInstantiateActor(item.id);
            } else if (triggerPrefabsLookup[item.id]) {
              setInstantiateTrigger(item.id);
            }
          }}
        >
          <MenuItemIcon>
            <BlankIcon />
          </MenuItemIcon>
          {l10n("FIELD_INSTANTIATE_PREFAB")}
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
          onClick={() => {
            if (actorPrefabsLookup[item.id]) {
              dispatch(
                entitiesActions.removeActorPrefab({ actorPrefabId: item.id }),
              );
            } else if (triggerPrefabsLookup[item.id]) {
              dispatch(
                entitiesActions.removeTriggerPrefab({
                  triggerPrefabId: item.id,
                }),
              );
            }
          }}
        >
          <MenuItemIcon>
            <BlankIcon />
          </MenuItemIcon>
          {l10n("MENU_DELETE_PREFAB")}
        </MenuItem>,
      ];
    },
    [
      actorPrefabsLookup,
      dispatch,
      setInstantiateActor,
      setInstantiateTrigger,
      setShowUses,
      showUses,
      triggerPrefabsLookup,
    ],
  );

  const renderLabel = useCallback(
    (item: PrefabNavigatorItem) => {
      if (
        item.type === "actorPrefabFolder" ||
        item.type === "triggerPrefabFolder"
      ) {
        return (
          <div onClick={() => toggleFolderOpen(item.id)}>{item.filename}</div>
        );
      } else if (
        item.entity &&
        "spriteSheetId" in item.entity &&
        item.entity?.spriteSheetId !== undefined
      ) {
        const prefab = item.entity;
        return (
          <FlexRow>
            <FlexGrow style={{ overflow: "hidden" }}>{item.filename}</FlexGrow>
            <Button
              size="small"
              variant="transparent"
              title={l10n("FIELD_INSTANTIATE_PREFAB")}
              onClick={() => {
                setInstantiateActor(prefab.id);
              }}
            >
              <InstantiateIcon />
            </Button>
          </FlexRow>
        );
      } else if (item.entity) {
        const prefab = item.entity;
        return (
          <FlexRow>
            <FlexGrow style={{ overflow: "hidden" }}>{item.filename}</FlexGrow>
            <Button
              size="small"
              variant="transparent"
              title={l10n("FIELD_INSTANTIATE_PREFAB")}
              onClick={() => {
                setInstantiateTrigger(prefab.id);
              }}
            >
              <InstantiateIcon />
            </Button>
          </FlexRow>
        );
      }
      return item.filename;
    },
    [setInstantiateActor, setInstantiateTrigger, toggleFolderOpen],
  );

  const { onDropOntoItem } = useFlatListReparentDnD<PrefabNavigatorItem>({
    acceptTypes: [...ACTOR_ACCEPT_TYPES, ...TRIGGER_ACCEPT_TYPES],
    canDrop: (dragged, target) =>
      getPrefabCategory(dragged) === getPrefabCategory(target),
    getName: (item) => item.name,
    getDropFolder: (target) => getDropFolder(target),
    onReparent: (item, { dropFolder }) => {
      if (item.type === "actorPrefabFolder") {
        dispatch(
          entitiesActions.reparentActorPrefabsFolder({
            fromPath: item.name,
            toPath: dropFolder,
          }),
        );
      } else if (item.type === "actorPrefab") {
        dispatch(
          entitiesActions.reparentActorPrefab({
            actorPrefabId: item.id,
            toPath: dropFolder,
          }),
        );
      } else if (item.type === "triggerPrefabFolder") {
        dispatch(
          entitiesActions.reparentTriggerPrefabsFolder({
            fromPath: item.name,
            toPath: dropFolder,
          }),
        );
      } else if (item.type === "triggerPrefab") {
        dispatch(
          entitiesActions.reparentTriggerPrefab({
            triggerPrefabId: item.id,
            toPath: dropFolder,
          }),
        );
      } else {
        assertUnreachable(item);
      }
    },
  });

  return (
    <FlatList
      selectedId={selectedId}
      items={nestedPrefabItems}
      setSelectedId={setSelectedId}
      height={height}
      onKeyDown={(e: KeyboardEvent, item) => {
        listenForRenameStart(e);
        if (
          item?.type === "actorPrefabFolder" ||
          item?.type === "triggerPrefabFolder"
        ) {
          if (e.key === "ArrowRight") {
            openFolder(selectedId);
          } else if (e.key === "ArrowLeft") {
            closeFolder(selectedId);
          }
        }
      }}
      children={({ item }) => {
        if (
          item.type === "actorPrefabFolder" ||
          item.type === "triggerPrefabFolder"
        ) {
          return (
            <EntityListItemDnD
              item={item}
              type={"folder"}
              collapsable={item.id !== "actors" && item.id !== "triggers"}
              collapsed={!isFolderOpen(item.name)}
              onToggleCollapse={() => toggleFolderOpen(item.name)}
              nestLevel={item.nestLevel}
              renderLabel={renderLabel}
              dragType={
                item.type === "actorPrefabFolder"
                  ? ItemTypes.ACTOR_PREFAB_FOLDER
                  : ItemTypes.TRIGGER_PREFAB_FOLDER
              }
              acceptTypes={
                item.type === "actorPrefabFolder"
                  ? ACTOR_ACCEPT_TYPES
                  : TRIGGER_ACCEPT_TYPES
              }
              onDrop={onDropOntoItem}
            />
          );
        } else if (item.type === "actorPrefab") {
          return (
            <EntityListItemDnD
              item={item}
              type={"script"}
              rename={renameId === item.id}
              onRename={onRenameComplete}
              onRenameCancel={onRenameCancel}
              renderContextMenu={renderContextMenu}
              nestLevel={item.nestLevel}
              renderLabel={renderLabel}
              dragType={ItemTypes.ACTOR_PREFAB}
              acceptTypes={ACTOR_ACCEPT_TYPES}
              onDrop={onDropOntoItem}
            />
          );
        } else if (item.type === "triggerPrefab") {
          return (
            <EntityListItemDnD
              item={item}
              type={"script"}
              rename={renameId === item.id}
              onRename={onRenameComplete}
              onRenameCancel={onRenameCancel}
              renderContextMenu={renderContextMenu}
              nestLevel={item.nestLevel}
              renderLabel={renderLabel}
              dragType={ItemTypes.TRIGGER_PREFAB}
              acceptTypes={TRIGGER_ACCEPT_TYPES}
              onDrop={onDropOntoItem}
            />
          );
        } else {
          assertUnreachable(item);
        }
      }}
    />
  );
};

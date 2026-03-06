import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  actorSelectors,
  noteSelectors,
  sceneSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { EntityListItem } from "ui/lists/EntityListItem";
import useToggleableList from "ui/hooks/use-toggleable-list";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import {
  SceneNavigatorItem,
  buildSceneNavigatorItems,
  notesInFolder,
  sceneParentFolders,
  scenesInFolder,
} from "shared/lib/entities/buildSceneNavigatorItems";
import renderSceneContextMenu from "./renderSceneContextMenu";
import renderActorContextMenu from "./renderActorContextMenu";
import renderTriggerContextMenu from "./renderTriggerContextMenu";
import { assertUnreachable } from "shared/lib/helpers/assert";
import renderSceneFolderContextMenu from "components/world/renderSceneFolderContextMenu";
import renderNoteContextMenu from "components/world/renderNoteContextMenu";
import { EntityListItemDnD } from "ui/lists/EntityListItemDnD";
import ItemTypes from "renderer/lib/dnd/itemTypes";
import { getParentPath } from "shared/lib/helpers/virtualFilesystem";
import { useFlatListReparentDnD } from "ui/hooks/use-flatlist-reparent-dnd";

interface NavigatorScenesProps {
  height: number;
  searchTerm: string;
}

const StartSceneLabel = styled.div`
  font-weight: bold;
`;

const ACCEPT_TYPES = [ItemTypes.SCENE, ItemTypes.NOTE, ItemTypes.WORLD_FOLDER];

export const NavigatorScenes: FC<NavigatorScenesProps> = ({
  height,
  searchTerm,
}) => {
  const scenes = useAppSelector((state) => sceneSelectors.selectAll(state));
  const notes = useAppSelector((state) => noteSelectors.selectAll(state));

  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state),
  );
  const triggersLookup = useAppSelector((state) =>
    triggerSelectors.selectEntities(state),
  );
  const sceneId = useAppSelector((state) => state.editor.scene);
  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const startSceneId = useAppSelector(
    (state) => state.project.present.settings.startSceneId,
  );
  const startDirection = useAppSelector(
    (state) => state.project.present.settings.startDirection,
  );
  const sceneSelectionIds = useAppSelector(
    (state) => state.editor.sceneSelectionIds,
  );
  const runSceneSelectionOnly = useAppSelector(
    (state) => state.project.present.settings.runSceneSelectionOnly,
  );
  const colorsEnabled = useAppSelector(
    (state) => state.project.present.settings.colorMode !== "mono",
  );
  const [folderId, setFolderId] = useState("");

  const dispatch = useAppDispatch();

  const addToSelection = useRef(false);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.shiftKey) {
      addToSelection.current = true;
    }
  }, []);

  const onKeyUp = useCallback((e: KeyboardEvent) => {
    if (!e.shiftKey) {
      addToSelection.current = false;
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onKeyDown, onKeyUp]);

  const {
    values: manuallyOpenedFolders,
    toggle: toggleFolderOpen,
    set: openFolder,
    unset: closeFolder,
  } = useToggleableList<string>([]);

  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId),
  );

  const note = useAppSelector((state) =>
    noteSelectors.selectById(state, entityId),
  );

  const openFolders = useMemo(() => {
    return [
      ...manuallyOpenedFolders,
      ...(scene ? sceneParentFolders(scene) : []),
      ...(note ? sceneParentFolders(note) : []),
    ];
  }, [manuallyOpenedFolders, scene, note]);

  const nestedSceneItems = useMemo(
    () =>
      buildSceneNavigatorItems(
        scenes,
        notes,
        actorsLookup,
        triggersLookup,
        openFolders,
        searchTerm,
      ),
    [scenes, notes, actorsLookup, triggersLookup, openFolders, searchTerm],
  );

  useEffect(() => {
    if (sceneId || entityId) {
      setFolderId("");
    }
  }, [entityId, sceneId]);

  const selectedNoteId = editorType === "note" ? entityId : undefined;

  const selectedId =
    folderId ||
    selectedNoteId ||
    (editorType === "scene" || !openFolders.includes(sceneId)
      ? sceneId
      : entityId);

  const clearFolderSelection = useCallback(() => {
    setFolderId("");
  }, []);

  const setSelectedId = (id: string, item: SceneNavigatorItem) => {
    if (item.type === "actor") {
      dispatch(
        editorActions.selectActor({ actorId: id, sceneId: item.sceneId }),
      );
      dispatch(editorActions.setFocusSceneId(item.sceneId));
      clearFolderSelection();
    } else if (item.type === "trigger") {
      dispatch(
        editorActions.selectTrigger({ triggerId: id, sceneId: item.sceneId }),
      );
      dispatch(editorActions.setFocusSceneId(item.sceneId));
      clearFolderSelection();
    } else if (item.type === "scene") {
      if (addToSelection.current) {
        dispatch(editorActions.toggleSceneSelectedId(id));
      } else {
        dispatch(editorActions.selectScene({ sceneId: id }));
      }
      dispatch(editorActions.setFocusSceneId(item.id));
      clearFolderSelection();
    } else if (item.type === "note") {
      if (addToSelection.current) {
        dispatch(editorActions.toggleNoteSelectedId(id));
      } else {
        dispatch(editorActions.selectNote({ noteId: id }));
      }
      clearFolderSelection();
    } else if (item.type === "folder") {
      setFolderId(id);
    } else {
      assertUnreachable(item);
    }
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

  const onRenameSceneComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editScene({
            sceneId: renameId,
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

  const onRenameNoteComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editNote({
            noteId: renameId,
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

  const onRenameActorComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editActor({
            actorId: renameId,
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

  const onRenameTriggerComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editTrigger({
            triggerId: renameId,
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

  const renderContextMenu = useCallback(
    (item: SceneNavigatorItem, onClose: () => void) => {
      if (item.type === "scene") {
        return renderSceneContextMenu({
          dispatch,
          sceneId: item.id,
          additionalSceneIds: sceneSelectionIds,
          startSceneId,
          startDirection,
          hoverX: 0,
          hoverY: 0,
          colorsEnabled,
          colorModeOverride: item.scene.colorModeOverride,
          onRename: () => setRenameId(item.id),
          runSceneSelectionOnly,
          onClose,
        });
      } else if (item.type === "actor") {
        return renderActorContextMenu({
          dispatch,
          sceneId: item.sceneId,
          actorId: item.id,
          onRename: () => setRenameId(item.id),
        });
      } else if (item.type === "trigger") {
        return renderTriggerContextMenu({
          dispatch,
          sceneId: item.sceneId,
          triggerId: item.id,
          onRename: () => setRenameId(item.id),
        });
      } else if (item.type === "note") {
        return renderNoteContextMenu({
          dispatch,
          noteId: item.id,
          additionalSceneIds: sceneSelectionIds,
          onRename: () => setRenameId(item.id),
          onClose,
        });
      } else if (item.type === "folder") {
        return renderSceneFolderContextMenu({
          dispatch,
          scenes: scenesInFolder(item.id, scenes),
          notes: notesInFolder(item.id, notes),
        });
      } else {
        assertUnreachable(item);
      }
    },
    [
      dispatch,
      runSceneSelectionOnly,
      sceneSelectionIds,
      scenes,
      notes,
      startDirection,
      startSceneId,
      colorsEnabled,
    ],
  );

  const renderLabel = useCallback(
    (item: SceneNavigatorItem) => {
      if (item.type === "folder") {
        return (
          <div onClick={() => toggleFolderOpen(item.id)}>{item.filename}</div>
        );
      }
      if (item.id === startSceneId) {
        return <StartSceneLabel>{item.filename}</StartSceneLabel>;
      }
      return item.filename;
    },
    [startSceneId, toggleFolderOpen],
  );

  const { onDropOntoItem, flatListDropzone } =
    useFlatListReparentDnD<SceneNavigatorItem>({
      onReparent: (item, { dropFolder }) => {
        if (item.type === "folder") {
          dispatch(
            entitiesActions.reparentWorldFolder({
              fromPath: item.name,
              toPath: dropFolder,
            }),
          );
        } else if (item.type === "scene") {
          dispatch(
            entitiesActions.reparentScene({
              sceneId: item.id,
              toPath: dropFolder,
            }),
          );
        } else if (item.type === "note") {
          dispatch(
            entitiesActions.reparentNote({
              noteId: item.id,
              toPath: dropFolder,
            }),
          );
        } else if (item.type === "actor" || item.type === "trigger") {
          // Ignore
        } else {
          assertUnreachable(item);
        }
      },
      acceptTypes: ACCEPT_TYPES,
      isReparentable: (item) =>
        item.type === "folder" || item.type === "scene" || item.type === "note",
      getName: (item) => item.name,
      getDropFolder: (target) =>
        target.type === "folder" ? target.name : getParentPath(target.name),
    });

  return (
    <FlatList
      selectedId={selectedId}
      highlightIds={folderId ? [] : sceneSelectionIds}
      items={nestedSceneItems}
      setSelectedId={setSelectedId}
      height={height}
      onKeyDown={(e: KeyboardEvent) => {
        listenForRenameStart(e);
        if (e.key === "ArrowRight") {
          openFolder(selectedId);
        } else if (e.key === "ArrowLeft") {
          closeFolder(selectedId);
        }
      }}
      outerElementType={flatListDropzone}
      children={({ item }) => {
        if (item.type === "scene") {
          return (
            <EntityListItemDnD
              item={item}
              type={item.type}
              rename={renameId === item.id}
              onRename={onRenameSceneComplete}
              onRenameCancel={onRenameCancel}
              renderContextMenu={renderContextMenu}
              collapsable
              collapsed={!openFolders.includes(item.id)}
              onToggleCollapse={() => toggleFolderOpen(item.id)}
              nestLevel={item.nestLevel}
              renderLabel={renderLabel}
              dragType={ItemTypes.SCENE}
              acceptTypes={ACCEPT_TYPES}
              onDrop={onDropOntoItem}
            />
          );
        } else if (item.type === "folder") {
          return (
            <EntityListItemDnD
              item={item}
              type={item.type}
              renderContextMenu={renderContextMenu}
              collapsable
              collapsed={!openFolders.includes(item.id)}
              onToggleCollapse={() => toggleFolderOpen(item.id)}
              nestLevel={item.nestLevel}
              renderLabel={renderLabel}
              dragType={ItemTypes.WORLD_FOLDER}
              acceptTypes={ACCEPT_TYPES}
              onDrop={onDropOntoItem}
            />
          );
        } else if (item.type === "note") {
          return (
            <EntityListItemDnD
              item={item}
              type={item.type}
              rename={renameId === item.id}
              onRename={onRenameNoteComplete}
              onRenameCancel={onRenameCancel}
              renderContextMenu={renderContextMenu}
              nestLevel={(item.nestLevel ?? 0) + 1}
              renderLabel={renderLabel}
              dragType={ItemTypes.NOTE}
              acceptTypes={ACCEPT_TYPES}
              onDrop={onDropOntoItem}
            />
          );
        } else if (item.type === "actor" || item.type === "trigger") {
          return (
            <EntityListItem
              item={item}
              type={item.type}
              nestLevel={item.nestLevel}
              rename={renameId === item.id}
              onRename={
                item.type === "actor"
                  ? onRenameActorComplete
                  : onRenameTriggerComplete
              }
              onRenameCancel={onRenameCancel}
              renderContextMenu={renderContextMenu}
            />
          );
        } else {
          assertUnreachable(item);
        }
      }}
    />
  );
};

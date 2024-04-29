import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import {
  actorSelectors,
  sceneSelectors,
  triggerSelectors,
} from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  ActorNormalized,
  SceneNormalized,
  TriggerNormalized,
} from "shared/lib/entities/entitiesTypes";
import { EntityListItem } from "ui/lists/EntityListItem";
import useToggleableList from "ui/hooks/use-toggleable-list";
import {
  actorName,
  sceneName,
  triggerName,
} from "shared/lib/entities/entitiesHelpers";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled from "styled-components";
import renderSceneContextMenu from "./renderSceneContextMenu";
import renderActorContextMenu from "./renderActorContextMenu";
import renderTriggerContextMenu from "./renderTriggerContextMenu";
import { assertUnreachable } from "shared/lib/helpers/assert";

interface NavigatorScenesProps {
  height: number;
}

interface SceneNavigatorItem {
  id: string;
  sceneId: string;
  name: string;
  type: "scene" | "actor" | "trigger";
  labelColor?: string;
}

const sceneToNavigatorItem = (
  scene: SceneNormalized,
  sceneIndex: number
): SceneNavigatorItem => ({
  id: scene.id,
  sceneId: scene.id,
  name: sceneName(scene, sceneIndex),
  type: "scene",
  labelColor: scene.labelColor,
});

const actorToNavigatorItem = (
  actor: ActorNormalized,
  scene: SceneNormalized
): SceneNavigatorItem => ({
  id: actor.id,
  sceneId: scene.id,
  name: actorName(actor, scene.actors.indexOf(actor.id)),
  type: "actor",
});

const triggerToNavigatorItem = (
  trigger: TriggerNormalized,
  scene: SceneNormalized
): SceneNavigatorItem => ({
  id: trigger.id,
  sceneId: scene.id,
  name: triggerName(trigger, scene.triggers.indexOf(trigger.id)),
  type: "trigger",
});

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: SceneNavigatorItem, b: SceneNavigatorItem) => {
  return collator.compare(a.name, b.name);
};

const StartSceneLabel = styled.div`
  font-weight: bold;
`;

export const NavigatorScenes: FC<NavigatorScenesProps> = ({ height }) => {
  const [items, setItems] = useState<SceneNavigatorItem[]>([]);
  const scenes = useAppSelector((state) => sceneSelectors.selectAll(state));
  const actorsLookup = useAppSelector((state) =>
    actorSelectors.selectEntities(state)
  );
  const triggersLookup = useAppSelector((state) =>
    triggerSelectors.selectEntities(state)
  );
  const sceneId = useAppSelector((state) => state.editor.scene);
  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const startSceneId = useAppSelector(
    (state) => state.project.present.settings.startSceneId
  );
  const startDirection = useAppSelector(
    (state) => state.project.present.settings.startDirection
  );
  const sceneSelectionIds = useAppSelector(
    (state) => state.editor.sceneSelectionIds
  );

  const {
    values: openSceneIds,
    isSet: isOpen,
    toggle: toggleSceneOpen,
    set: openScene,
    unset: closeScene,
  } = useToggleableList<string>([]);

  const selectedId =
    editorType === "scene" || !openSceneIds.includes(sceneId)
      ? sceneId
      : entityId;

  const dispatch = useAppDispatch();

  const addToSelection = useRef(false);

  const onKeyDown = useCallback((e) => {
    if (e.shiftKey) {
      addToSelection.current = true;
    }
  }, []);

  const onKeyUp = useCallback((e) => {
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

  useEffect(() => {
    const sceneItems = scenes
      .map((scene, sceneIndex) => ({
        scene,
        item: sceneToNavigatorItem(scene, sceneIndex),
      }))
      .sort((a, b) => {
        return sortByName(a.item, b.item);
      });
    setItems(
      sceneItems.flatMap((scene) =>
        isOpen(scene.scene.id)
          ? [
              scene.item,
              ...(
                scene.scene.actors
                  .map((actorId) => actorsLookup[actorId])
                  .filter((i) => i) as ActorNormalized[]
              )
                .map((actor) => actorToNavigatorItem(actor, scene.scene))
                .sort(sortByName),
              ...(
                scene.scene.triggers
                  .map((triggerId) => triggersLookup[triggerId])
                  .filter((i) => i) as TriggerNormalized[]
              )
                .map((trigger) => triggerToNavigatorItem(trigger, scene.scene))
                .sort(sortByName),
            ]
          : scene.item
      )
    );
  }, [scenes, actorsLookup, triggersLookup, openSceneIds, isOpen]);

  const setSelectedId = (id: string, item: SceneNavigatorItem) => {
    if (item.type === "actor") {
      dispatch(
        editorActions.selectActor({ actorId: id, sceneId: item.sceneId })
      );
    } else if (item.type === "trigger") {
      dispatch(
        editorActions.selectTrigger({ triggerId: id, sceneId: item.sceneId })
      );
    } else {
      if (addToSelection.current) {
        dispatch(editorActions.toggleSceneSelectedId(id));
      } else {
        dispatch(editorActions.selectScene({ sceneId: id }));
      }
    }
    dispatch(editorActions.setFocusSceneId(item.sceneId));
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

  const onRenameSceneComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editScene({
            sceneId: renameId,
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

  const onRenameActorComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editActor({
            actorId: renameId,
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

  const onRenameTriggerComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editTrigger({
            triggerId: renameId,
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
    (item: SceneNavigatorItem) => {
      if (item.type === "scene") {
        return renderSceneContextMenu({
          dispatch,
          sceneId: item.sceneId,
          additionalSceneIds: sceneSelectionIds,
          startSceneId,
          startDirection,
          hoverX: 0,
          hoverY: 0,
          onRename: () => setRenameId(item.id),
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
      } else {
        assertUnreachable(item.type);
      }
    },
    [dispatch, sceneSelectionIds, startDirection, startSceneId]
  );

  const renderSceneLabel = useCallback(
    (item: SceneNavigatorItem) => {
      if (item.id === startSceneId) {
        return <StartSceneLabel>{item.name}</StartSceneLabel>;
      }
      return item.name;
    },
    [startSceneId]
  );

  return (
    <FlatList
      selectedId={selectedId}
      highlightIds={sceneSelectionIds}
      items={items}
      setSelectedId={setSelectedId}
      height={height}
      onKeyDown={(e: KeyboardEvent) => {
        listenForRenameStart(e);
        if (e.key === "ArrowRight") {
          openScene(sceneId);
        } else if (e.key === "ArrowLeft") {
          closeScene(sceneId);
        }
      }}
      children={({ item }) =>
        item.type === "scene" ? (
          <EntityListItem
            item={item}
            type={item.type}
            collapsable={true}
            collapsed={!isOpen(item.id)}
            onToggleCollapse={toggleSceneOpen(item.id)}
            rename={renameId === item.id}
            onRename={onRenameSceneComplete}
            onRenameCancel={onRenameCancel}
            renderContextMenu={renderContextMenu}
            renderLabel={renderSceneLabel}
          />
        ) : (
          <EntityListItem
            item={item}
            type={item.type}
            nestLevel={1}
            rename={renameId === item.id}
            onRename={
              item.type === "actor"
                ? onRenameActorComplete
                : onRenameTriggerComplete
            }
            onRenameCancel={onRenameCancel}
            renderContextMenu={renderContextMenu}
          />
        )
      }
    />
  );
};

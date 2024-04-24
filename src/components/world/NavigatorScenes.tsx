import React, { FC, useCallback, useEffect, useState } from "react";
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
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import l10n from "shared/lib/lang/l10n";

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
      dispatch(editorActions.selectScene({ sceneId: id }));
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

  const renderContextMenu = useCallback(
    (item: SceneNavigatorItem) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        ...(item.type === "scene"
          ? [
              <MenuDivider key="div-delete" />,
              <MenuItem
                key="delete"
                onClick={() =>
                  dispatch(entitiesActions.removeScene({ sceneId: item.id }))
                }
              >
                {l10n("MENU_DELETE_SCENE")}
              </MenuItem>,
            ]
          : []),
        ...(item.type === "actor"
          ? [
              <MenuDivider key="div-delete" />,
              <MenuItem
                key="delete"
                onClick={() =>
                  dispatch(
                    entitiesActions.removeActor({
                      actorId: item.id,
                      sceneId: item.sceneId,
                    })
                  )
                }
              >
                {l10n("MENU_DELETE_ACTOR")}
              </MenuItem>,
            ]
          : []),
        ...(item.type === "trigger"
          ? [
              <MenuDivider key="div-delete" />,
              <MenuItem
                key="delete"
                onClick={() =>
                  dispatch(
                    entitiesActions.removeTrigger({
                      triggerId: item.id,
                      sceneId: item.sceneId,
                    })
                  )
                }
              >
                {l10n("MENU_DELETE_TRIGGER")}
              </MenuItem>,
            ]
          : []),
      ];
    },
    [dispatch]
  );

  return (
    <FlatList
      selectedId={selectedId}
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
            renderContextMenu={renderContextMenu}
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
            renderContextMenu={renderContextMenu}
          />
        )
      }
    />
  );
};

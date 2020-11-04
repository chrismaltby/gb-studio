import React, { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import {
  actorSelectors,
  sceneSelectors,
  triggerSelectors,
} from "../../store/features/entities/entitiesState";
import { FlatList } from "../ui/lists/FlatList";
import editorActions from "../../store/features/editor/editorActions";
import {
  Actor,
  Scene,
  Trigger,
} from "../../store/features/entities/entitiesTypes";
import styled from "styled-components";
import { ArrowIcon, TriggerIcon } from "../library/Icons";
import { ActorIcon } from "../ui/icons/Icons";

interface NavigatorScenesProps {
  height: number;
}

interface SceneNavigatorItem {
  id: string;
  sceneId: string;
  name: string;
  type: "scene" | "actor" | "trigger";
}

const sceneToNavigatorItem = (
  scene: Scene,
  sceneIndex: number
): SceneNavigatorItem => ({
  id: scene.id,
  sceneId: scene.id,
  name: scene.name ? scene.name : `Scene ${sceneIndex + 1}`,
  type: "scene",
});

const actorToNavigatorItem = (
  actor: Actor,
  scene: Scene
): SceneNavigatorItem => ({
  id: actor.id,
  sceneId: scene.id,
  name: actor.name ? actor.name : `Actor ${scene.actors.indexOf(actor.id) + 1}`,
  type: "actor",
});

const triggerToNavigatorItem = (
  trigger: Trigger,
  scene: Scene
): SceneNavigatorItem => ({
  id: trigger.id,
  sceneId: scene.id,
  name: trigger.name
    ? trigger.name
    : `Trigger ${scene.triggers.indexOf(trigger.id) + 1}`,
  type: "trigger",
});

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: SceneNavigatorItem, b: SceneNavigatorItem) => {
  return collator.compare(a.name, b.name);
};

const NavigatorSceneRow = styled.div`
  display: flex;
  align-items: center;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const NavigatorSceneRowLabel = styled.div`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

interface NavigatorArrowProps {
  open: boolean;
}

const NavigatorArrow = styled.span<NavigatorArrowProps>`
  display: inline-flex;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  margin-left: -5px;

  svg {
    fill: ${(props) => props.theme.colors.text};
    width: 8px;
    height: 8px;
    transform: rotate(${(props) => (props.open ? 90 : 0)}deg);
  }
`;

const NavigatorEntityRow = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  padding-left: 15px;
  svg {
    fill: ${(props) => props.theme.colors.text};
    width: 10px;
    height: 10px;
    margin-right: 5px;
    opacity: 0.5;
  }
`;

export const NavigatorScenes: FC<NavigatorScenesProps> = ({ height }) => {
  const [openSceneIds, setOpenSceneIds] = useState<string[]>([]);
  const [items, setItems] = useState<SceneNavigatorItem[]>([]);
  const scenes = useSelector((state: RootState) =>
    sceneSelectors.selectAll(state)
  );
  const actorsLookup = useSelector((state: RootState) =>
    actorSelectors.selectEntities(state)
  );
  const triggersLookup = useSelector((state: RootState) =>
    triggerSelectors.selectEntities(state)
  );
  const sceneId = useSelector((state: RootState) => state.editor.scene);
  const entityId = useSelector((state: RootState) => state.editor.entityId);
  const editorType = useSelector((state: RootState) => state.editor.type);

  const selectedId =
    editorType === "scene" || !openSceneIds.includes(sceneId)
      ? sceneId
      : entityId;

  const dispatch = useDispatch();

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
              ...(scene.scene.actors
                .map((actorId) => actorsLookup[actorId])
                .filter((i) => i) as Actor[])
                .map((actor) => actorToNavigatorItem(actor, scene.scene))
                .sort(sortByName),
              ...(scene.scene.triggers
                .map((triggerId) => triggersLookup[triggerId])
                .filter((i) => i) as Trigger[])
                .map((trigger) => triggerToNavigatorItem(trigger, scene.scene))
                .sort(sortByName),
            ]
          : scene.item
      )
    );
  }, [scenes, actorsLookup, triggersLookup, openSceneIds]);

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

  const toggleSceneOpen = (id: string) => () => {
    if (isOpen(id)) {
      closeScene(id);
    } else {
      openScene(id);
    }
  };

  const openScene = (id: string) => {
    setOpenSceneIds((value) => ([] as string[]).concat(value, id));
  };

  const closeScene = (id: string) => {
    setOpenSceneIds((value) => value.filter((s) => s !== id));
  };

  const isOpen = (id: string) => {
    return openSceneIds.includes(id);
  };

  return (
    <FlatList
      selectedId={selectedId}
      items={items}
      setSelectedId={setSelectedId}
      height={height}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === "ArrowRight") {
          openScene(sceneId);
        } else if (e.key === "ArrowLeft") {
          closeScene(sceneId);
        }
      }}
      children={({ selected, item }) =>
        item.type === "scene" ? (
          <NavigatorSceneRow>
            <NavigatorArrow
              open={isOpen(item.id)}
              onClick={toggleSceneOpen(item.id)}
            >
              <ArrowIcon />
            </NavigatorArrow>
            <NavigatorSceneRowLabel>{item.name}</NavigatorSceneRowLabel>
          </NavigatorSceneRow>
        ) : (
          <NavigatorEntityRow>
            {item.type === "actor" && <ActorIcon />}
            {item.type === "trigger" && <TriggerIcon />}
            {item.name}
          </NavigatorEntityRow>
        )
      }
    />
  );
};

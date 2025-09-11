import React, { FC, useMemo } from "react";
import {
  actorSelectors,
  sceneSelectors,
} from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import { FlatList } from "ui/lists/FlatList";
import { EntityListItem } from "ui/lists/EntityListItem";
import useDimensions from "react-cool-dimensions";
import styled from "styled-components";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Button } from "ui/buttons/Button";
import { actorName, sceneName } from "shared/lib/entities/entitiesHelpers";
import {
  ActorNormalized,
  SceneNormalized,
} from "shared/lib/entities/entitiesTypes";

interface ActorPrefabUsesListProps {
  id: string;
  onClose?: () => void;
}

const UsesWrapper = styled.div`
  position: absolute;
  top: 38px;
  left: 0;
  bottom: 0;
  right: 0;
  width: 100%;
`;

const UseMessage = styled.div`
  padding: 5px 10px;
  font-size: 11px;
`;

type ActorPrefabUse = {
  id: string;
  name: string;
} & (
  | {
      type: "scene";
      sceneId: string;
      scene: SceneNormalized;
      sceneIndex: number;
    }
  | {
      type: "actor";
      actor: ActorNormalized;
      actorIndex: number;
      sceneId: string;
      scene: SceneNormalized;
      sceneIndex: number;
    }
);

export const ActorPrefabUsesList: FC<ActorPrefabUsesListProps> = ({
  id,
  onClose,
}) => {
  const { observe, height } = useDimensions();
  const scenes = useAppSelector(sceneSelectors.selectAll);
  const actorsLookup = useAppSelector(actorSelectors.selectEntities);
  // const [prefabUses, setPrefabUses] = useState<ActorPrefabUse[]>([]);

  const prefabUses: ActorPrefabUse[] = useMemo(() => {
    const uses: ActorPrefabUse[] = [];
    for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
      const scene = scenes[sceneIndex];
      const sceneUses: ActorPrefabUse[] = [];

      for (let actorIndex = 0; actorIndex < scene.actors.length; actorIndex++) {
        const actorId = scene.actors[actorIndex];
        const actor = actorsLookup[actorId];
        if (actor?.prefabId === id) {
          const numChanges = Object.keys(actor.prefabScriptOverrides).length;
          sceneUses.push({
            type: "actor",
            id: actor.id,
            name:
              numChanges === 0
                ? actorName(actor, actorIndex)
                : `${actorName(actor, actorIndex)} (+${l10n(
                    numChanges === 1 ? "FIELD_N_CHANGE" : "FIELD_N_CHANGES",
                    { n: numChanges },
                  )})`,
            actor,
            actorIndex,
            sceneId: scene.id,
            scene,
            sceneIndex: 0,
          });
        }
      }

      if (sceneUses.length > 0) {
        uses.push({
          type: "scene",
          id: scene.id,
          name: sceneName(scene, sceneIndex),
          sceneId: scene.id,
          scene,
          sceneIndex,
        });
        uses.push(...sceneUses);
      }
    }
    return uses;
  }, [actorsLookup, id, scenes]);

  const dispatch = useAppDispatch();

  const setSelectedId = (id: string, item: ActorPrefabUse) => {
    dispatch(editorActions.selectActor({ actorId: id, sceneId: item.sceneId }));
    dispatch(editorActions.setFocusSceneId(item.sceneId));
  };

  return (
    <UsesWrapper ref={observe}>
      <SplitPaneHeader
        collapsed={false}
        onToggle={onClose}
        buttons={
          <Button variant="transparent" size="small" onClick={onClose}>
            {l10n("MENU_EDIT_PREFAB")}
          </Button>
        }
      >
        {l10n("SIDEBAR_PREFAB_USES")}
      </SplitPaneHeader>
      {prefabUses.length > 0 ? (
        <FlatList
          items={prefabUses}
          height={height - 30}
          setSelectedId={setSelectedId}
          children={({ item }) => {
            if (item.type === "scene") {
              return <EntityListItem item={item} type={item.type} />;
            }
            return <EntityListItem item={item} type={"actor"} nestLevel={1} />;
          }}
        />
      ) : (
        <UseMessage>{l10n("FIELD_PREFAB_NOT_USED")}</UseMessage>
      )}
    </UsesWrapper>
  );
};

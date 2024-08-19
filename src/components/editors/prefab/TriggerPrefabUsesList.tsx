import React, { FC, RefObject, useMemo } from "react";
import {
  triggerSelectors,
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
import { triggerName, sceneName } from "shared/lib/entities/entitiesHelpers";
import {
  TriggerNormalized,
  SceneNormalized,
} from "shared/lib/entities/entitiesTypes";

interface TriggerPrefabUsesListProps {
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

export type TriggerPrefabUse = {
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
      type: "trigger";
      trigger: TriggerNormalized;
      triggerIndex: number;
      sceneId: string;
      scene: SceneNormalized;
      sceneIndex: number;
    }
);

export const TriggerPrefabUsesList: FC<TriggerPrefabUsesListProps> = ({
  id,
  onClose,
}) => {
  const { ref, height } = useDimensions();
  const scenes = useAppSelector(sceneSelectors.selectAll);
  const triggersLookup = useAppSelector(triggerSelectors.selectEntities);

  const prefabUses: TriggerPrefabUse[] = useMemo(() => {
    const uses: TriggerPrefabUse[] = [];
    for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
      const scene = scenes[sceneIndex];
      const sceneUses: TriggerPrefabUse[] = [];

      for (
        let triggerIndex = 0;
        triggerIndex < scene.triggers.length;
        triggerIndex++
      ) {
        const triggerId = scene.triggers[triggerIndex];
        const trigger = triggersLookup[triggerId];
        if (trigger?.prefabId === id) {
          sceneUses.push({
            type: "trigger",
            id: trigger.id,
            name: triggerName(trigger, triggerIndex),
            trigger,
            triggerIndex,
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
  }, [triggersLookup, id, scenes]);

  const dispatch = useAppDispatch();

  const setSelectedId = (id: string, item: TriggerPrefabUse) => {
    dispatch(
      editorActions.selectTrigger({ triggerId: id, sceneId: item.sceneId })
    );
    dispatch(editorActions.setFocusSceneId(item.sceneId));
  };

  return (
    <UsesWrapper ref={ref as RefObject<HTMLDivElement>}>
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
            return (
              <EntityListItem item={item} type={"trigger"} nestLevel={1} />
            );
          }}
        />
      ) : (
        <UseMessage>{l10n("FIELD_PREFAB_NOT_USED")}</UseMessage>
      )}
    </UsesWrapper>
  );
};

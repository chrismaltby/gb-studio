import { buildEntityNavigatorItems } from "shared/lib/entities/buildEntityNavigatorItems";
import { actorName, triggerName } from "shared/lib/entities/entitiesHelpers";
import {
  ActorPrefabNormalized,
  TriggerPrefabNormalized,
} from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";

export type PrefabNavigatorItem = {
  id: string;
  name: string;
  filename: string;
  nestLevel?: number;
} & (
  | {
      type: "actorPrefabFolder";
      isRoot: boolean;
    }
  | {
      type: "actorPrefab";
      entity: ActorPrefabNormalized;
    }
  | {
      type: "triggerPrefabFolder";
      isRoot: boolean;
    }
  | {
      type: "triggerPrefab";
      entity: TriggerPrefabNormalized;
    }
);

export const buildPrefabNavigatorItems = (
  allActorPrefabs: ActorPrefabNormalized[],
  allTriggerPrefabs: TriggerPrefabNormalized[],
  openFolders: string[],
  searchTerm: string,
): PrefabNavigatorItem[] => {
  const actorPrefabItems: PrefabNavigatorItem[] =
    buildEntityNavigatorItems<ActorPrefabNormalized>(
      allActorPrefabs.map((actorPrefab, index) => ({
        ...actorPrefab,
        name: actorName(actorPrefab, index),
      })),
      openFolders,
      searchTerm,
      undefined,
      1,
    ).map((item) => {
      if (item.type === "entity" && item.entity) {
        return {
          ...item,
          type: "actorPrefab",
          entity: item.entity,
        };
      } else {
        return {
          ...item,
          type: "actorPrefabFolder",
          isRoot: false,
        };
      }
    });

  const triggerPrefabItems: PrefabNavigatorItem[] = buildEntityNavigatorItems(
    allTriggerPrefabs.map((triggerPrefab, index) => ({
      ...triggerPrefab,
      name: triggerName(triggerPrefab, index),
    })),
    openFolders,
    searchTerm,
    undefined,
    1,
  ).map((item) => {
    if (item.type === "entity" && item.entity) {
      return {
        ...item,
        type: "triggerPrefab",
        entity: item.entity,
      };
    } else {
      return {
        ...item,
        type: "triggerPrefabFolder",
        isRoot: false,
      };
    }
  });

  return [
    {
      id: "actors",
      type: "actorPrefabFolder",
      name: l10n("FIELD_ACTORS"),
      filename: l10n("FIELD_ACTORS"),
      isRoot: true,
    },
    ...actorPrefabItems,
    {
      id: "triggers",
      type: "triggerPrefabFolder",
      name: l10n("FIELD_TRIGGERS"),
      filename: l10n("FIELD_TRIGGERS"),
      isRoot: true,
    },
    ...triggerPrefabItems,
  ];
};

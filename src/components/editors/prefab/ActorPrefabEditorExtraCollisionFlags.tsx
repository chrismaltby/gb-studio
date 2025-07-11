import React, { FC, useCallback } from "react";
import { FormRow } from "ui/form/layout/FormLayout";
import entitiesActions from "store/features/entities/entitiesActions";
import { ActorPrefabNormalized } from "shared/lib/entities/entitiesTypes";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { CheckboxField } from "ui/form/CheckboxField";
import {
  removeArrayElements,
  toggleArrayElement,
} from "shared/lib/helpers/array";
import { sceneSelectors } from "store/features/entities/entitiesState";
import l10n, { L10NKey } from "shared/lib/lang/l10n";

interface ActorPrefabEditorExtraCollisionFlagsProps {
  prefab: ActorPrefabNormalized;
  sceneId?: string;
}

export const ActorPrefabEditorExtraCollisionFlags: FC<
  ActorPrefabEditorExtraCollisionFlagsProps
> = ({ prefab, sceneId }) => {
  const dispatch = useAppDispatch();

  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId ?? ""),
  );

  const extraActorCollisionFlags = useAppSelector((state) => {
    if (!scene || !scene.type || !state.engine.sceneTypes) return [];
    const key = scene.type || "";
    const sceneType = state.engine.sceneTypes.find((s) => s.key === key);
    if (sceneType && sceneType.extraActorCollisionFlags)
      return sceneType.extraActorCollisionFlags;
    return [];
  });

  const onChangeActorPrefabProp = useCallback(
    <K extends keyof ActorPrefabNormalized>(
      key: K,
      value: ActorPrefabNormalized[K],
    ) => {
      dispatch(
        entitiesActions.editActorPrefab({
          actorPrefabId: prefab.id,
          changes: {
            [key]: value,
          },
        }),
      );
    },
    [dispatch, prefab.id],
  );

  if (!prefab || extraActorCollisionFlags.length === 0) {
    return <></>;
  }

  return Array.from({
    length: Math.ceil(extraActorCollisionFlags.length / 2),
  }).map((_, rowIndex) => {
    const startIndex = rowIndex * 2;
    const items = extraActorCollisionFlags.slice(startIndex, startIndex + 2);

    return (
      <FormRow key={rowIndex}>
        {items.map((flagDef) => (
          <CheckboxField
            key={flagDef.key}
            name={flagDef.key}
            label={l10n(flagDef.label as L10NKey)}
            title={
              flagDef.description
                ? l10n(flagDef.description as L10NKey)
                : undefined
            }
            checked={prefab.collisionExtraFlags.includes(flagDef.setFlag)}
            onChange={() => {
              onChangeActorPrefabProp(
                "collisionExtraFlags",
                removeArrayElements(
                  toggleArrayElement(
                    prefab.collisionExtraFlags,
                    flagDef.setFlag,
                  ),
                  flagDef.clearFlags ?? [],
                ),
              );
            }}
          />
        ))}
      </FormRow>
    );
  });
};

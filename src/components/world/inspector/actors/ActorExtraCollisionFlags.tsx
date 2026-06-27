import React, { useCallback, useMemo } from "react";
import { FormRow } from "ui/form/layout/FormLayout";
import entitiesActions from "store/features/entities/entitiesActions";
import { ActorNormalized } from "shared/lib/entities/entitiesTypes";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { CheckboxField } from "ui/form/CheckboxField";
import {
  removeArrayElements,
  toggleArrayElement,
} from "shared/lib/helpers/array";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import l10n, { L10NKey } from "shared/lib/lang/l10n";

interface ActorExtraCollisionFlagsProps {
  actor: ActorNormalized;
  sceneId?: string;
}

export const ActorExtraCollisionFlags = ({
  actor,
  sceneId,
}: ActorExtraCollisionFlagsProps) => {
  const dispatch = useAppDispatch();

  const sceneTypeKey = useAppSelector(
    (state) => sceneSelectors.selectById(state, sceneId ?? "")?.type,
  );

  const sceneTypeSchemas = useAppSelector((state) => state.engine.sceneTypes);

  const extraActorCollisionFlags = useMemo(() => {
    if (!sceneTypeKey || !sceneTypeSchemas) {
      return [];
    }
    return (
      sceneTypeSchemas.find((s) => s.key === sceneTypeKey)
        ?.extraActorCollisionFlags ?? []
    );
  }, [sceneTypeKey, sceneTypeSchemas]);

  const onChangeActorProp = useCallback(
    <K extends keyof ActorNormalized>(key: K, value: ActorNormalized[K]) => {
      dispatch(
        entitiesActions.editActor({
          actorId: actor.id,
          changes: {
            [key]: value,
          },
        }),
      );
    },
    [dispatch, actor.id],
  );

  if (!actor || extraActorCollisionFlags.length === 0) {
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
            checked={actor.collisionExtraFlags.includes(flagDef.setFlag)}
            onChange={() => {
              onChangeActorProp(
                "collisionExtraFlags",
                removeArrayElements(
                  toggleArrayElement(
                    actor.collisionExtraFlags,
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

import React, { FC, useCallback } from "react";
import { FormContainer, FormField, FormRow } from "ui/form/layout/FormLayout";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  ActorPrefabNormalized,
  CollisionGroup,
  SpriteSheetNormalized,
} from "shared/lib/entities/entitiesTypes";
import { SidebarColumn } from "ui/sidebars/Sidebar";
import { SpriteSheetSelectButton } from "components/forms/SpriteSheetSelectButton";
import { AnimationSpeedSelect } from "components/forms/AnimationSpeedSelect";
import { MovementSpeedSelect } from "components/forms/MovementSpeedSelect";
import CollisionMaskPicker from "components/forms/CollisionMaskPicker";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { ActorPrefabEditorExtraCollisionFlags } from "./ActorPrefabEditorExtraCollisionFlags";
import { sceneSelectors } from "store/features/entities/entitiesState";

interface ActorPrefabEditorPropertiesProps {
  prefab: ActorPrefabNormalized;
  sceneId?: string;
}

export const ActorPrefabEditorProperties: FC<
  ActorPrefabEditorPropertiesProps
> = ({ prefab, sceneId }) => {
  const dispatch = useAppDispatch();

  const defaultSpriteMode = useAppSelector(
    (state) => state.project.present.settings.spriteMode,
  );
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId ?? ""),
  );

  const sceneSpriteMode = scene?.spriteMode ?? defaultSpriteMode;

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

  const onChangeSpriteSheetId = useCallback(
    (e: string) => onChangeActorPrefabProp("spriteSheetId", e),
    [onChangeActorPrefabProp],
  );

  const onChangeMoveSpeed = useCallback(
    (e: number) => onChangeActorPrefabProp("moveSpeed", e),
    [onChangeActorPrefabProp],
  );

  const onChangeAnimSpeed = useCallback(
    (e: number) => onChangeActorPrefabProp("animSpeed", e),
    [onChangeActorPrefabProp],
  );

  const onChangeCollisionGroup = useCallback(
    (e: CollisionGroup) => onChangeActorPrefabProp("collisionGroup", e),
    [onChangeActorPrefabProp],
  );

  const onlyCurrentSpriteMode = useCallback(
    (spriteSheet: SpriteSheetNormalized) => {
      if (!sceneId) {
        return true;
      }
      return (spriteSheet.spriteMode ?? defaultSpriteMode) === sceneSpriteMode;
    },
    [defaultSpriteMode, sceneSpriteMode, sceneId],
  );

  if (!prefab) {
    return <div />;
  }

  return (
    <>
      <SidebarColumn>
        <FormContainer>
          <FormRow>
            <FormField name="actorSprite" label={l10n("FIELD_SPRITE_SHEET")}>
              <SpriteSheetSelectButton
                name="actorSprite"
                value={prefab.spriteSheetId}
                direction={"down"}
                frame={0}
                onChange={onChangeSpriteSheetId}
                filter={onlyCurrentSpriteMode}
                includeInfo
              />
            </FormField>
          </FormRow>
        </FormContainer>
      </SidebarColumn>
      <SidebarColumn>
        <FormContainer>
          <FormRow>
            <FormField
              name="actorMoveSpeed"
              label={l10n("FIELD_MOVEMENT_SPEED")}
            >
              <MovementSpeedSelect
                name="actorMoveSpeed"
                value={prefab.moveSpeed}
                onChange={onChangeMoveSpeed}
              />
            </FormField>
            <FormField
              name="actorAnimSpeed"
              label={l10n("FIELD_ANIMATION_SPEED")}
            >
              <AnimationSpeedSelect
                name="actorAnimSpeed"
                value={prefab.animSpeed}
                onChange={onChangeAnimSpeed}
              />
            </FormField>
          </FormRow>
        </FormContainer>
      </SidebarColumn>

      <SidebarColumn>
        <FormContainer>
          <FormRow>
            <FormField
              name="actorCollisionGroup"
              label={l10n("FIELD_COLLISION_GROUP")}
            >
              <CollisionMaskPicker
                id="actorCollisionGroup"
                value={prefab.collisionGroup}
                onChange={onChangeCollisionGroup}
                includeNone
              />
            </FormField>
          </FormRow>
          <ActorPrefabEditorExtraCollisionFlags
            prefab={prefab}
            sceneId={sceneId}
          />
        </FormContainer>
      </SidebarColumn>
    </>
  );
};

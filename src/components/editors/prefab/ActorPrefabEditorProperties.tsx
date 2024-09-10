import React, { FC, useCallback } from "react";
import { FormContainer, FormField, FormRow } from "ui/form/layout/FormLayout";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  ActorPrefabNormalized,
  CollisionGroup,
} from "shared/lib/entities/entitiesTypes";
import { SidebarColumn } from "ui/sidebars/Sidebar";
import { SpriteSheetSelectButton } from "components/forms/SpriteSheetSelectButton";
import { AnimationSpeedSelect } from "components/forms/AnimationSpeedSelect";
import { MovementSpeedSelect } from "components/forms/MovementSpeedSelect";
import CollisionMaskPicker from "components/forms/CollisionMaskPicker";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch } from "store/hooks";

interface ActorPrefabEditorPropertiesProps {
  prefab: ActorPrefabNormalized;
}

export const ActorPrefabEditorProperties: FC<ActorPrefabEditorPropertiesProps> =
  ({ prefab }) => {
    const dispatch = useAppDispatch();

    const onChangeActorPrefabProp = useCallback(
      <K extends keyof ActorPrefabNormalized>(
        key: K,
        value: ActorPrefabNormalized[K]
      ) => {
        dispatch(
          entitiesActions.editActorPrefab({
            actorPrefabId: prefab.id,
            changes: {
              [key]: value,
            },
          })
        );
      },
      [dispatch, prefab.id]
    );

    const onChangeSpriteSheetId = useCallback(
      (e: string) => onChangeActorPrefabProp("spriteSheetId", e),
      [onChangeActorPrefabProp]
    );

    const onChangeMoveSpeed = useCallback(
      (e: number) => onChangeActorPrefabProp("moveSpeed", e),
      [onChangeActorPrefabProp]
    );

    const onChangeAnimSpeed = useCallback(
      (e: number) => onChangeActorPrefabProp("animSpeed", e),
      [onChangeActorPrefabProp]
    );

    const onChangeCollisionGroup = useCallback(
      (e: CollisionGroup) => onChangeActorPrefabProp("collisionGroup", e),
      [onChangeActorPrefabProp]
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
          </FormContainer>
        </SidebarColumn>
      </>
    );
  };

import React, { FC, useCallback } from "react";
import { FormContainer, FormField, FormRow } from "ui/form/layout/FormLayout";
import entitiesActions from "store/features/entities/entitiesActions";
import {
  ActorNormalized,
  CollisionGroup,
  Palette,
  MonoPalette,
} from "shared/lib/entities/entitiesTypes";
import { SidebarColumn } from "ui/sidebars/Sidebar";
import { SpriteSheetSelectButton } from "components/forms/SpriteSheetSelectButton";
import { AnimationSpeedSelect } from "components/forms/AnimationSpeedSelect";
import { MovementSpeedSelect } from "components/forms/MovementSpeedSelect";
import CollisionMaskPicker from "components/forms/CollisionMaskPicker";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch } from "store/hooks";

interface ActorEditorPropertiesProps {
  actor: ActorNormalized;
  palettes?: Palette[];
  previewAsMono?: boolean;
  monoPalettes?: MonoPalette[];
}

export const ActorEditorProperties: FC<ActorEditorPropertiesProps> = ({
  actor,
  palettes,
  previewAsMono,
  monoPalettes,
}) => {
  const dispatch = useAppDispatch();

  const onChangeActorProp = useCallback(
    <K extends keyof ActorNormalized>(key: K, value: ActorNormalized[K]) => {
      dispatch(
        entitiesActions.editActor({
          actorId: actor.id,
          changes: {
            [key]: value,
          },
        })
      );
    },
    [dispatch, actor.id]
  );

  const onChangeSpriteSheetId = useCallback(
    (e: string) => onChangeActorProp("spriteSheetId", e),
    [onChangeActorProp]
  );

  const onChangeMoveSpeed = useCallback(
    (e: number) => onChangeActorProp("moveSpeed", e),
    [onChangeActorProp]
  );

  const onChangeAnimSpeed = useCallback(
    (e: number) => onChangeActorProp("animSpeed", e),
    [onChangeActorProp]
  );

  const onChangeCollisionGroup = useCallback(
    (e: CollisionGroup) => onChangeActorProp("collisionGroup", e),
    [onChangeActorProp]
  );

  if (!actor) {
    return <div />;
  }

  const showAnimSpeed = true;

  const showCollisionGroup = !actor.isPinned;

  return (
    <>
      <SidebarColumn>
        <FormContainer>
          <FormRow>
            <FormField name="actorSprite" label={l10n("FIELD_SPRITE_SHEET")}>
              <SpriteSheetSelectButton
                name="actorSprite"
                value={actor.spriteSheetId}
                direction={actor.direction}
                frame={0}
                onChange={onChangeSpriteSheetId}
                includeInfo
                previewAsMono={previewAsMono}
                palettes={palettes}
                monoPalettes={monoPalettes}
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
                value={actor.moveSpeed}
                onChange={onChangeMoveSpeed}
              />
            </FormField>
            {showAnimSpeed && (
              <FormField
                name="actorAnimSpeed"
                label={l10n("FIELD_ANIMATION_SPEED")}
              >
                <AnimationSpeedSelect
                  name="actorAnimSpeed"
                  value={actor.animSpeed}
                  onChange={onChangeAnimSpeed}
                />
              </FormField>
            )}
          </FormRow>
        </FormContainer>
      </SidebarColumn>
      {showCollisionGroup && (
        <SidebarColumn>
          <FormContainer>
            <FormRow>
              <FormField
                name="actorCollisionGroup"
                label={l10n("FIELD_COLLISION_GROUP")}
              >
                <CollisionMaskPicker
                  id="actorCollisionGroup"
                  value={actor.collisionGroup}
                  onChange={onChangeCollisionGroup}
                  includeNone
                />
              </FormField>
            </FormRow>
          </FormContainer>
        </SidebarColumn>
      )}
    </>
  );
};

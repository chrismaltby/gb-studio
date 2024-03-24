import { FadeSpeedSelect } from "components/forms/FadeSpeedSelect";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuItem } from "ui/menu/Menu";
import l10n from "shared/lib/lang/l10n";
import React, { useCallback, useContext, useEffect, useRef } from "react";
import entitiesActions from "store/features/entities/entitiesActions";
import { sceneSelectors } from "store/features/entities/entitiesState";
import { ArrowIcon } from "ui/icons/Icons";
import {
  ScriptEventWrapper,
  ScriptEventHeader,
  ScriptEventHeaderCaret,
  ScriptEventFormWrapper,
  ScriptEventField,
  ScriptEventFields as ScriptEventFieldsWrapper,
  ScriptEventHeaderTitle,
  ScriptEventWarning,
} from "ui/scripting/ScriptEvents";
import { OffscreenSkeletonInput } from "ui/skeleton/Skeleton";
import { FixedSpacer } from "ui/spacing/Spacing";
import { Button } from "ui/buttons/Button";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { ScriptEditorContext } from "components/script/ScriptEditorContext";

export const ScriptEventAutoFade = () => {
  const dispatch = useAppDispatch();
  const context = useContext(ScriptEditorContext);
  const type = context.entityType;
  const sceneId = context.sceneId;
  const headerRef = useRef<HTMLDivElement>(null);
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId)
  );
  const value =
    scene?.autoFadeSpeed === null ? null : scene?.autoFadeSpeed ?? 1;
  const autoFadeEventCollapse = scene?.autoFadeEventCollapse;
  const isOpen = !autoFadeEventCollapse;

  const onChangeField = useCallback(
    (newValue: number | null) => {
      console.log(newValue);
      dispatch(
        entitiesActions.editScene({
          sceneId,
          changes: {
            autoFadeSpeed: newValue,
          },
        })
      );
    },
    [dispatch, sceneId]
  );

  const onDisable = useCallback(() => {
    dispatch(
      entitiesActions.editScene({
        sceneId,
        changes: {
          autoFadeSpeed: null,
        },
      })
    );
  }, [dispatch, sceneId]);

  const toggleOpen = useCallback(() => {
    dispatch(
      entitiesActions.editScene({
        sceneId,
        changes: {
          autoFadeEventCollapse: !autoFadeEventCollapse,
        },
      })
    );
  }, [autoFadeEventCollapse, dispatch, sceneId]);

  const isExecuting = context.executingId === "autofade";

  useEffect(() => {
    if (isExecuting && headerRef.current) {
      headerRef.current.scrollIntoView();
    }
  }, [isExecuting]);

  if (type !== "scene" || value === null || !scene) {
    return null;
  }

  return (
    <ScriptEventWrapper conditional={false} nestLevel={0}>
      <ScriptEventHeader
        ref={headerRef}
        conditional={false}
        comment={false}
        nestLevel={0}
        altBg={false}
        isExecuting={isExecuting}
        style={{
          cursor: "not-allowed",
        }}
      >
        <ScriptEventHeaderTitle onClick={toggleOpen}>
          <ScriptEventHeaderCaret open={isOpen}>
            <ArrowIcon />
          </ScriptEventHeaderCaret>
          <FixedSpacer width={5} />
          {l10n("EVENT_FADE_IN")} ({l10n("FIELD_AUTOMATIC")})
        </ScriptEventHeaderTitle>

        <DropdownButton
          size="small"
          variant="transparent"
          menuDirection="right"
        >
          <MenuItem onClick={onDisable}>
            {l10n("FIELD_DISABLE_AUTOMATIC_FADE_IN")}
          </MenuItem>
        </DropdownButton>
      </ScriptEventHeader>
      {isOpen && (
        <ScriptEventFormWrapper conditional={false} nestLevel={0} altBg={false}>
          <ScriptEventFieldsWrapper>
            <ScriptEventField>
              <OffscreenSkeletonInput>
                <FadeSpeedSelect
                  name="sceneAutoFade"
                  value={Number(value ?? 2)}
                  onChange={onChangeField}
                />
              </OffscreenSkeletonInput>
            </ScriptEventField>
          </ScriptEventFieldsWrapper>
        </ScriptEventFormWrapper>
      )}
    </ScriptEventWrapper>
  );
};

export const ScriptEventAutoFadeDisabledWarning = () => {
  const dispatch = useAppDispatch();
  const type = useAppSelector((state) => state.editor.type);
  const sceneId = useAppSelector((state) => state.editor.scene);
  const scene = useAppSelector((state) =>
    sceneSelectors.selectById(state, sceneId)
  );

  const onEnable = useCallback(() => {
    dispatch(
      entitiesActions.editScene({
        sceneId,
        changes: {
          autoFadeSpeed: 1,
        },
      })
    );
  }, [dispatch, sceneId]);

  if (type !== "scene" || !scene) {
    return null;
  }

  return (
    <ScriptEventWarning>
      <strong> {l10n("FIELD_AUTOMATIC_FADE_IN_DISABLED")}</strong>
      <br />
      {l10n("FIELD_AUTOMATIC_FADE_IN_DISABLED_INFO", {
        eventName: l10n("EVENT_FADE_IN"),
      })}
      <FixedSpacer height={5} />
      <Button size="small" onClick={onEnable}>
        {l10n("FIELD_ENABLE_AUTOMATIC_FADE_IN")}
      </Button>
    </ScriptEventWarning>
  );
};

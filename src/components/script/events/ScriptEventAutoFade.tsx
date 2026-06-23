import { FadeSpeedSelect } from "components/forms/FadeSpeedSelect";
import { MenuItem } from "ui/menu/Menu";
import l10n from "shared/lib/lang/l10n";
import React, { useCallback, useContext, useEffect, useRef } from "react";
import entitiesActions from "store/features/entities/entitiesActions";
import { sceneSelectors } from "store/features/entities/entitiesSelectors";
import {
  ScriptEventWrapper,
  ScriptEventHeader,
  ScriptEventFormWrapper,
  ScriptEventField,
  ScriptEventFields as ScriptEventFieldsWrapper,
  ScriptEventWarning,
} from "ui/scripting/ScriptEvents";
import { OffscreenSkeletonInput } from "ui/skeleton/Skeleton";
import { FixedSpacer } from "ui/spacing/Spacing";
import { Button } from "ui/buttons/Button";
import {
  useAppDispatch,
  useAppSelector,
  useAppSelectorPick,
} from "store/hooks";
import { ScriptEditorContext } from "components/script/context/ScriptEditorContext";

export const ScriptEventAutoFade = () => {
  const dispatch = useAppDispatch();
  const context = useContext(ScriptEditorContext);
  const type = context.entityType;
  const sceneId = context.sceneId;
  const headerRef = useRef<HTMLDivElement>(null);
  const autoFade = useAppSelectorPick(
    (state) => sceneSelectors.selectById(state, sceneId),
    ["autoFadeSpeed", "autoFadeEventCollapse"] as const,
  );

  const value =
    autoFade?.autoFadeSpeed === null ? null : (autoFade?.autoFadeSpeed ?? 1);

  const autoFadeEventCollapse = autoFade?.autoFadeEventCollapse;
  const isOpen = !autoFadeEventCollapse;

  const onChangeField = useCallback(
    (newValue: number | null) => {
      dispatch(
        entitiesActions.editScene({
          sceneId,
          changes: {
            autoFadeSpeed: newValue,
          },
        }),
      );
    },
    [dispatch, sceneId],
  );

  const onDisable = useCallback(() => {
    dispatch(
      entitiesActions.editScene({
        sceneId,
        changes: {
          autoFadeSpeed: null,
        },
      }),
    );
  }, [dispatch, sceneId]);

  const toggleOpen = useCallback(() => {
    dispatch(
      entitiesActions.editScene({
        sceneId,
        changes: {
          autoFadeEventCollapse: !autoFadeEventCollapse,
        },
      }),
    );
  }, [autoFadeEventCollapse, dispatch, sceneId]);

  const isExecuting = context.executingId === "autofade";

  useEffect(() => {
    if (isExecuting && headerRef.current) {
      headerRef.current.scrollIntoView();
    }
  }, [isExecuting]);

  if (type !== "scene" || value === null || !autoFade) {
    return null;
  }

  return (
    <ScriptEventWrapper>
      <ScriptEventHeader
        ref={headerRef}
        scriptEventId=""
        nestLevel={0}
        altBg={false}
        isOpen={isOpen}
        isExecuting={isExecuting}
        isMoveable={false}
        menuItems={
          <MenuItem onClick={onDisable}>
            {l10n("FIELD_DISABLE_AUTOMATIC_FADE_IN")}
          </MenuItem>
        }
        onToggle={toggleOpen}
      >
        {l10n("EVENT_FADE_IN")} ({l10n("FIELD_AUTOMATIC")})
      </ScriptEventHeader>
      {isOpen && (
        <ScriptEventFormWrapper>
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
  const autoFadeSpeed = useAppSelector(
    (state) => sceneSelectors.selectById(state, sceneId)?.autoFadeSpeed,
  );

  const onEnable = useCallback(() => {
    dispatch(
      entitiesActions.editScene({
        sceneId,
        changes: {
          autoFadeSpeed: 1,
        },
      }),
    );
  }, [dispatch, sceneId]);

  if (type !== "scene" || autoFadeSpeed !== null) {
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

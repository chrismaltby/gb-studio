import React, { useCallback, useEffect } from "react";
import API from "renderer/lib/api";
import l10n, { L10NKey } from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { Button } from "ui/buttons/Button";
import { PlayStartIcon, PauseIcon, NextIcon, StepIcon } from "ui/icons/Icons";
import { FixedSpacer } from "ui/spacing/Spacing";
import debuggerActions from "store/features/debugger/debuggerActions";
import settingsActions from "store/features/settings/settingsActions";

const DebuggerControls = () => {
  const dispatch = useAppDispatch();
  const initialized = useAppSelector((state) => state.debug.initialized);
  const isPaused = useAppSelector((state) => state.debug.isPaused);
  const isLogOpen = useAppSelector((state) => state.debug.isLogOpen);
  const debuggerEnabled = useAppSelector(
    (state) => state.project.present.settings.debuggerEnabled,
  );

  const onPlayPause = useCallback(() => {
    if (isPaused) {
      API.debugger.resume();
    } else {
      API.debugger.pause();
    }
  }, [isPaused]);

  const onStep = useCallback(() => {
    API.debugger.step();
  }, []);

  const onStepFrame = useCallback(() => {
    API.debugger.stepFrame();
  }, []);

  const onToggleBuildLog = useCallback(() => {
    if (!debuggerEnabled) {
      dispatch(settingsActions.editSettings({ debuggerEnabled: true }));
      dispatch(debuggerActions.setIsLogOpen(true));
    } else {
      dispatch(debuggerActions.setIsLogOpen(!isLogOpen));
    }
  }, [debuggerEnabled, dispatch, isLogOpen]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "F8") {
        onPlayPause();
      } else if (e.key === "F9") {
        onStep();
      } else if (e.key === "F10") {
        onStepFrame();
      }
    },
    [onPlayPause, onStep, onStepFrame],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  return (
    <>
      {initialized && (
        <>
          <Button
            size="small"
            variant="transparent"
            onClick={onPlayPause}
            title={isPaused ? l10n("FIELD_RESUME") : l10n("FIELD_PAUSE")}
          >
            {isPaused ? <PlayStartIcon /> : <PauseIcon />}
          </Button>
          <FixedSpacer width={5} />
          <Button
            size="small"
            variant="transparent"
            disabled={!isPaused}
            onClick={isPaused ? onStep : undefined}
            title={l10n("FIELD_STEP")}
          >
            <StepIcon />
          </Button>
          <Button
            size="small"
            variant="transparent"
            disabled={!isPaused}
            onClick={isPaused ? onStepFrame : undefined}
            title={l10n("FIELD_STEP_FRAME")}
          >
            <NextIcon />
          </Button>
        </>
      )}
      <FixedSpacer width={10} />
      <Button
        size="small"
        variant={isLogOpen && debuggerEnabled ? "primary" : "transparent"}
        onClick={onToggleBuildLog}
      >
        {l10n("FIELD_BUILD_LOG" as L10NKey)}
      </Button>
    </>
  );
};

export default DebuggerControls;

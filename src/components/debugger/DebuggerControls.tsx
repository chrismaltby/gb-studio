import React, { useCallback, useEffect } from "react";
import API from "renderer/lib/api";
import l10n from "shared/lib/lang/l10n";
import { useAppSelector } from "store/hooks";
import { Button } from "ui/buttons/Button";
import { PlayStartIcon, PauseIcon, NextIcon, StepIcon } from "ui/icons/Icons";
import { FixedSpacer } from "ui/spacing/Spacing";

const DebuggerControls = () => {
  const initialized = useAppSelector((state) => state.debug.initialized);
  const isPaused = useAppSelector((state) => state.debug.isPaused);

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
    [onPlayPause, onStep, onStepFrame]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);

  if (!initialized) {
    return null;
  }

  return (
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
  );
};

export default DebuggerControls;

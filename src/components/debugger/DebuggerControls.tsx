import React, { useCallback } from "react";
import API from "renderer/lib/api";
import l10n from "shared/lib/lang/l10n";
import { useAppSelector } from "store/hooks";
import { Button } from "ui/buttons/Button";
import { PlayIcon, PauseIcon, NextIcon, StepIcon } from "ui/icons/Icons";
import { FixedSpacer } from "ui/spacing/Spacing";

const DebuggerControls = () => {
  const isPaused = useAppSelector((state) => state.debug.isPaused);

  const onPlayPause = useCallback(() => {
    if (isPaused) {
      API.debugger.resume();
    } else {
      API.debugger.pause();
    }
  }, [isPaused]);

  const onStep = useCallback(() => {
    if (isPaused) {
      API.debugger.step();
    } else {
      API.debugger.pause();
    }
  }, [isPaused]);

  const onStepFrame = useCallback(() => {
    if (isPaused) {
      API.debugger.stepFrame();
    } else {
      API.debugger.pause();
    }
  }, [isPaused]);

  return (
    <>
      <Button size="small" variant="transparent" onClick={onPlayPause}>
        {isPaused ? <PlayIcon /> : <PauseIcon />}
      </Button>
      <FixedSpacer width={5} />
      <Button
        size="small"
        variant="transparent"
        onClick={onStep}
        title={l10n("FIELD_STEP")}
      >
        <StepIcon />
      </Button>
      <Button
        size="small"
        variant="transparent"
        onClick={onStepFrame}
        title={l10n("FIELD_STEP_FRAME")}
      >
        <NextIcon />
      </Button>
    </>
  );
};

export default DebuggerControls;

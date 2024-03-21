import React from "react";
import l10n from "shared/lib/lang/l10n";
import { Button } from "ui/buttons/Button";
import { PlayIcon, PauseIcon, NextIcon } from "ui/icons/Icons";
import { FixedSpacer } from "ui/spacing/Spacing";

const DebuggerControls = () => {
  const isPaused = true;

  return (
    <>
      <Button size="small" variant="transparent" onClick={() => {}}>
        {isPaused ? <PlayIcon /> : <PauseIcon />}
      </Button>
      <FixedSpacer width={5} />
      <Button
        size="small"
        variant="transparent"
        onClick={() => {}}
        title={l10n("FIELD_STEP")}
      >
        <NextIcon />
      </Button>
    </>
  );
};

export default DebuggerControls;

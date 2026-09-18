import React from "react";
import { ROM_BANK_SIZE } from "shared/lib/compiler/memoryLayout";
import { StyledBankOverflowLabel } from "ui/debugger/style";
import { bytesToHumanReadable } from "shared/lib/helpers/formatBytes";

interface DebuggerBankUsageProps {
  size: number;
  maxSize?: number;
}

export const DebuggerBankUsage = ({
  size,
  maxSize = ROM_BANK_SIZE,
}: DebuggerBankUsageProps) => {
  if (size > maxSize) {
    return (
      <StyledBankOverflowLabel>
        {bytesToHumanReadable(size)}
      </StyledBankOverflowLabel>
    );
  }

  return bytesToHumanReadable(size);
};

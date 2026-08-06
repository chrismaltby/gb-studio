import React, { useMemo, useState } from "react";
import l10n from "shared/lib/lang/l10n";
import { useAppSelector } from "store/hooks";
import { TooltipWrapper } from "ui/tooltips/Tooltip";
import {
  FullSizeStep,
  renderSize,
  TooltipChild,
  Total,
  UsageLabel,
  Used,
  UsageWrapper as Wrapper,
} from "components/debugger/DebuggerUsageBar";
import {
  isBank0Overflow,
  isRomBank0,
  isWramBank,
  isWramOverflow,
  sumOverflow,
  sumUsage,
} from "shared/lib/debugger/usage";

export type MemoryUsageRegion = "wram" | "bank0";

interface DebuggerMemoryUsageDataProps {
  region: MemoryUsageRegion;
  hideLabels?: boolean;
  /**
   * Show the "run a build" message while no usage data is available.
   * Only one of the visible usage bars needs to display it.
   */
  showPlaceholder?: boolean;
}

const regionFilters = {
  wram: isWramBank,
  bank0: isRomBank0,
} as const;

const overflowFilters = {
  wram: isWramOverflow,
  bank0: isBank0Overflow,
} as const;

const regionLabel = (region: MemoryUsageRegion) =>
  region === "wram" ? "WRAM" : l10n("FIELD_ROM_BANK_0");

const DebuggerMemoryUsageData = ({
  region,
  hideLabels,
  showPlaceholder,
}: DebuggerMemoryUsageDataProps) => {
  const usageData = useAppSelector((state) => state.debug.usageData);
  const status = useAppSelector((state) => state.console.status);
  const [showBytes, setShowBytes] = useState(false);

  const { used, size, overrunBy } = useMemo(() => {
    if (!usageData) {
      return { used: 0, size: 0, overrunBy: 0 };
    }
    const totals = sumUsage(usageData.banks, regionFilters[region]);
    // Romusage clamps each bank's used value to the bank size, add back
    // anything the linker placed beyond the end of the region or on top of
    // an area the engine has reserved
    const overrunBy = sumOverflow(
      usageData.overflows ?? [],
      overflowFilters[region],
    );
    return { ...totals, used: totals.used + overrunBy, overrunBy };
  }, [usageData, region]);

  const toggleShowBytes = () => {
    setShowBytes(!showBytes);
  };

  const usedPercent = size > 0 ? (used * 100) / size : 0;
  // A region can be exactly full and still be overrun, when linker placed
  // data has landed on top of the stack or another reserved area
  const overflow = (size > 0 && used > size) || overrunBy > 0;
  const label = regionLabel(region);

  if (!usageData && !showPlaceholder) {
    return null;
  }

  return (
    <Wrapper>
      {!usageData ? (
        <div>
          {status === "running"
            ? l10n("FIELD_BUILDING")
            : l10n("FIELD_RUN_A_BUILD_MEMORY_USAGE_DESC")}
        </div>
      ) : (
        <>
          {!hideLabels && <div>{label}:</div>}
          <Total>
            <FullSizeStep>
              <TooltipWrapper
                tooltip={
                  <>
                    <strong>
                      {label} ({renderSize(size, showBytes)})
                    </strong>
                    <div>
                      {overflow
                        ? l10n("FIELD_MEMORY_USAGE_OVER_TOOLTIP", {
                            overflow: renderSize(
                              Math.max(used - size, overrunBy),
                              showBytes,
                            ),
                          })
                        : l10n("FIELD_MEMORY_USAGE_FREE_TOOLTIP", {
                            freeSpace: renderSize(size - used, showBytes),
                          })}
                    </div>
                  </>
                }
              >
                <TooltipChild />
              </TooltipWrapper>
            </FullSizeStep>
            <Used
              $overflow={overflow}
              style={{ width: `${Math.min(100, usedPercent)}%` }}
            ></Used>
          </Total>
          {!hideLabels && (
            <UsageLabel $overflow={overflow} onClick={toggleShowBytes}>
              {l10n("FIELD_MEMORY_USAGE_LABEL", {
                totalUsage: renderSize(used, showBytes),
                totalSize: renderSize(size, showBytes),
              })}
            </UsageLabel>
          )}
        </>
      )}
    </Wrapper>
  );
};

export default DebuggerMemoryUsageData;

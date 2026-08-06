import React, { useMemo, useState } from "react";
import l10n from "shared/lib/lang/l10n";
import { useAppSelector } from "store/hooks";
import { TooltipWrapper } from "ui/tooltips/Tooltip";
import {
  renderSize,
  SizeStep,
  TooltipChild,
  Total,
  Used,
  UsageWrapper as Wrapper,
} from "components/debugger/DebuggerUsageBar";
import { isRomBank } from "shared/lib/debugger/usage";

interface DebuggerUsageDataProps {
  hideLabels?: boolean;
  forceZoom?: boolean;
}

const sizes = [
  { bytes: 128 * 1024 }, // 128 KiB
  { bytes: 256 * 1024 }, // 256 KiB
  { bytes: 512 * 1024 }, // 512 KiB
  { bytes: 1 * 1024 * 1024 }, // 1 MiB
  { bytes: 2 * 1024 * 1024 }, // 2 MiB
  { bytes: 4 * 1024 * 1024 }, // 4 MiB
];

const DebuggerUsageData = ({
  hideLabels,
  forceZoom,
}: DebuggerUsageDataProps) => {
  const usageData = useAppSelector((state) => state.debug.usageData);
  const status = useAppSelector((state) => state.console.status);
  const [showBytes, setShowBytes] = useState(false);

  const [zoom, setZoom] = useState(false);

  const { totalUsage, romSizeIndex } = useMemo(() => {
    let totalUsage = 0;
    let romSizeIndex = 0;
    if (usageData) {
      usageData.banks
        .filter(isRomBank)
        .forEach((bank) => (totalUsage += Number(bank.used)));
      for (let i = 0; i < sizes.length; i++) {
        if (totalUsage <= sizes[i].bytes) {
          romSizeIndex = i;
          break;
        }
      }
    }
    return { totalUsage, romSizeIndex };
  }, [usageData]);

  const toggleZoom = () => {
    setZoom(!zoom);
  };

  const toggleShowBytes = () => {
    setShowBytes(!showBytes);
  };

  const maxSize =
    sizes[zoom || forceZoom ? romSizeIndex : sizes.length - 1].bytes;
  const usedPercent = (totalUsage * 100) / maxSize;

  return (
    <Wrapper>
      {!usageData ? (
        <div>
          {status === "running"
            ? l10n("FIELD_BUILDING")
            : l10n("FIELD_RUN_A_BUILD_USAGE_DESC")}
        </div>
      ) : (
        <>
          {!hideLabels && <div>ROM:</div>}
          <Total onClick={toggleZoom}>
            {sizes.map((s, i) => {
              const byteStep =
                s.bytes - (sizes[i - 1] ? sizes[i - 1].bytes : 0);
              return (
                <SizeStep
                  style={{ width: `${(byteStep * 100) / maxSize}%` }}
                  key={i}
                >
                  <TooltipWrapper
                    tooltip={
                      i <= romSizeIndex ? (
                        <>
                          <strong>
                            {renderSize(sizes[romSizeIndex].bytes, showBytes)}
                          </strong>
                          <div>
                            {l10n("FIELD_CURRENT_ROM_SIZE_TOOLTIP", {
                              freeSpace: renderSize(
                                sizes[romSizeIndex].bytes - totalUsage,
                                showBytes,
                              ),
                            })}
                          </div>
                        </>
                      ) : (
                        <>
                          <strong>
                            {renderSize(sizes[i].bytes, showBytes)}
                          </strong>
                          <div>
                            {l10n("FIELD_NEXT_ROM_SIZE_TOOLTIP", {
                              freeSpace: renderSize(
                                sizes[i - 1].bytes - totalUsage,
                                showBytes,
                              ),
                            })}
                          </div>
                        </>
                      )
                    }
                  >
                    <TooltipChild />
                  </TooltipWrapper>
                </SizeStep>
              );
            })}
            <Used style={{ width: `${usedPercent}%` }}></Used>
          </Total>
          {!hideLabels && (
            <div onClick={toggleShowBytes}>
              {l10n("FIELD_ROM_USAGE_LABEL", {
                totalUsage: renderSize(totalUsage, showBytes),
                romSize: renderSize(sizes[romSizeIndex].bytes, showBytes),
              })}
            </div>
          )}
        </>
      )}
    </Wrapper>
  );
};

export default DebuggerUsageData;

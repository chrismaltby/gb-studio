import React, { useMemo, useState } from "react";
import l10n from "shared/lib/lang/l10n";
import { useAppSelector } from "store/hooks";
import styled from "styled-components";
import { TooltipWrapper } from "ui/tooltips/Tooltip";

interface DebuggerUsageDataProps {
  hideLabels?: boolean;
  forceZoom?: boolean;
}

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  white-space: nowrap;
  flex-wrap: nowrap;
  flex-direction: row;
  gap: 6px;
  flex-grow: 2;
`;

const Total = styled.div`
  display: inline-block;
  position: relative;
  width: 100%;
  background-color: black;
  height: 20px;
  border-radius: ${(props) => props.theme.borderRadius}px;
  border: 1px solid ${(props) => props.theme.colors.input.border};
  overflow: hidden;
  max-width: 150px;
`;

const Used = styled.div`
  display: inline-block;
  position: absolute;
  left: 0;
  background-color: ${(props) => props.theme.colors.highlight};
  height: inherit;
  transition: width 0.3s ease-in-out;
  pointer-events: none;
`;

const SizeStep = styled.div`
  position: relative;
  display: inline-block;
  height: inherit;
  border-right: 1px solid ${(props) => props.theme.colors.input.border};
  transition: width 0.3s ease-in-out;

  :hover {
    background-color: #191919;
  }
`;

const TooltipChild = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
`;

const sizes = [
  { bytes: 128 * 1024 }, // 128 KiB
  { bytes: 256 * 1024 }, // 256 KiB
  { bytes: 512 * 1024 }, // 512 KiB
  { bytes: 1 * 1024 * 1024 }, // 1 MiB
  { bytes: 2 * 1024 * 1024 }, // 2 MiB
  { bytes: 4 * 1024 * 1024 }, // 4 MiB
];

const renderSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return `${parseFloat(kb.toFixed(2))} KiB`;
  } else {
    const mb = bytes / (1024 * 1024);
    return `${parseFloat(mb.toFixed(2))} MiB`;
  }
};

const DebuggerUsageData = ({
  hideLabels,
  forceZoom,
}: DebuggerUsageDataProps) => {
  const usageData = useAppSelector((state) => state.debug.usageData);
  const status = useAppSelector((state) => state.console.status);

  const [zoom, setZoom] = useState(false);

  const { totalUsage, romSizeIndex } = useMemo(() => {
    let totalUsage = 0;
    let romSizeIndex = 0;
    if (usageData) {
      usageData.banks.forEach((bank) => (totalUsage += Number(bank.used)));
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
                <SizeStep style={{ width: `${(byteStep * 100) / maxSize}%` }}>
                  <TooltipWrapper
                    tooltip={
                      i <= romSizeIndex ? (
                        <>
                          <strong>
                            {renderSize(sizes[romSizeIndex].bytes)}
                          </strong>
                          <div>
                            {l10n("FIELD_CURRENT_ROM_SIZE_TOOLTIP", {
                              freeSpace: renderSize(
                                sizes[romSizeIndex].bytes - totalUsage
                              ),
                            })}
                          </div>
                        </>
                      ) : (
                        <>
                          <strong>{renderSize(sizes[i].bytes)}</strong>
                          <div>
                            {l10n("FIELD_NEXT_ROM_SIZE_TOOLTIP", {
                              freeSpace: renderSize(
                                sizes[i - 1].bytes - totalUsage
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
            <div>
              {l10n("FIELD_ROM_USAGE_LABEL", {
                totalUsage: renderSize(totalUsage),
                romSize: renderSize(sizes[romSizeIndex].bytes),
              })}
            </div>
          )}
        </>
      )}
    </Wrapper>
  );
};

export default DebuggerUsageData;

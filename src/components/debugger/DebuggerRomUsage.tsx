import React from "react";
import styled from "styled-components";
import l10n from "shared/lib/lang/l10n";
import { useAppSelector } from "store/hooks";
import { DebuggerBuildFooter } from "components/debugger/DebuggerBuildFooter";
import { Card } from "ui/cards/Card";
import { bytesToHumanReadable } from "shared/lib/helpers/formatBytes";
import type { MemoryRegionUsage } from "lib/compiler/buildUsage";
import DebuggerRomUsageOverview from "components/debugger/DebuggerRomUsageOverview";
import { DebuggerPluginUsage } from "components/debugger/DebuggerPluginUsage";
import { FixedSpacer } from "ui/spacing/Spacing";
import DebuggerDataUsage from "components/debugger/DebuggerDataUsage";
import CachedScroll from "ui/util/CachedScroll";
import { Alert } from "ui/alerts/Alert";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  font-size: 11px;
`;

const Content = styled.div`
  flex-grow: 1;
  overflow: hidden;
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
`;

const ScrollContent = styled.div`
  padding: 16px;
  container-type: inline-size;
  user-select: text;
`;

const EmptyState = styled.div`
  font-size: 11px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 100px;
`;

const Summary = styled.div`
  display: grid;
  grid-template-columns: minmax(250px, 1fr);
  gap: 10px;

  @container (min-width: 510px) {
    grid-template-columns: repeat(2, minmax(250px, 1fr));
  }

  @container (min-width: 1030px) {
    grid-template-columns: repeat(4, minmax(250px, 1fr));
  }
`;

const StatLabel = styled.div`
  margin-bottom: 10px;
`;

const StatValue = styled.div`
  font-size: 18px;
  font-weight: bold;
`;

const StatDetail = styled.div`
  margin-top: 4px;
`;

const UsageBar = styled.div`
  position: relative;
  width: 100%;
  height: 6px;
  margin-top: 10px;
  overflow: hidden;
  border-radius: ${(props) => props.theme.borderRadius}px;
  background: ${(props) => props.theme.colors.input.border};
`;

const UsageBarUsed = styled.div<{ $overflow?: boolean }>`
  height: 100%;
  background: ${(props) =>
    props.$overflow ? "#e20e2b" : props.theme.colors.highlight};
`;

interface MemoryCardProps {
  label: string;
  usage: MemoryRegionUsage;
}

const usedPercent = (used: number, size: number) =>
  size > 0 ? Math.min(100, (used * 100) / size) : 0;

const MemoryCard = ({ label, usage }: MemoryCardProps) => {
  const { used, size } = usage;
  const overflow = size > 0 && used > size;

  return (
    <Card>
      <StatLabel>{label}</StatLabel>
      <StatValue>
        {bytesToHumanReadable(used)} / {bytesToHumanReadable(size)}
      </StatValue>
      <StatDetail>
        {overflow
          ? l10n("FIELD_MEMORY_USAGE_OVER", {
              overflow: bytesToHumanReadable(used - size),
            })
          : l10n("FIELD_MEMORY_USAGE_FREE", {
              freeSpace: bytesToHumanReadable(size - used),
            })}
      </StatDetail>
      <UsageBar>
        <UsageBarUsed
          $overflow={overflow}
          style={{ width: `${usedPercent(used, size)}%` }}
        />
      </UsageBar>
    </Card>
  );
};

const DebuggerRomUsage = () => {
  const usageData = useAppSelector((state) => state.debug.usageData);
  const buildStatus = useAppSelector((state) => state.console.status);

  const running = buildStatus === "running";

  if (!usageData || usageData.status === "unavailable") {
    return (
      <Wrapper>
        <Content>
          <EmptyState>
            {running
              ? l10n("FIELD_BUILDING")
              : l10n("FIELD_RUN_A_BUILD_USAGE_DESC")}
          </EmptyState>
        </Content>
        <DebuggerBuildFooter />
      </Wrapper>
    );
  }

  const showPlugins = usageData.plugins.length > 0;
  const showData = usageData.scripts.length > 0 || usageData.sources.length > 0;

  if (usageData.status === "partial") {
    return (
      <Wrapper>
        <Content>
          <CachedScroll cacheKey="debugger-rom-usage">
            <ScrollContent>
              <Alert variant="warning">{l10n("FIELD_BUILD_FAILED_INFO")}</Alert>
              {showPlugins && (
                <>
                  <FixedSpacer height={20} />
                  <DebuggerPluginUsage plugins={usageData.plugins} />
                </>
              )}
              {showData && (
                <>
                  <FixedSpacer height={20} />
                  <DebuggerDataUsage
                    scripts={usageData.scripts}
                    sources={usageData.sources}
                  />
                </>
              )}
            </ScrollContent>
          </CachedScroll>
        </Content>
        <DebuggerBuildFooter />
      </Wrapper>
    );
  }

  const memory = usageData.memory;
  const rom = memory.rom;
  const romUsedPercent = usedPercent(rom.used, rom.size);
  const maxUsedPercent = usedPercent(rom.used, rom.maxSize);

  return (
    <Wrapper>
      <Content>
        <CachedScroll cacheKey="debugger-rom-usage">
          <ScrollContent>
            <Summary>
              <Card>
                <StatLabel>{l10n("FIELD_ROM_USED")}</StatLabel>
                <StatValue>
                  {bytesToHumanReadable(rom.used)} /{" "}
                  {bytesToHumanReadable(rom.size)}
                </StatValue>
                <StatDetail>
                  {rom.nextSize
                    ? `${l10n("FIELD_ROM_NEXT_SIZE")}: ${bytesToHumanReadable(rom.nextSize)}`
                    : `${l10n("FIELD_ROM_MAX_SIZE")}: ${bytesToHumanReadable(rom.maxSize)}`}
                </StatDetail>
                <UsageBar>
                  <UsageBarUsed style={{ width: `${romUsedPercent}%` }} />
                </UsageBar>
              </Card>
              <Card>
                <StatLabel>{l10n("FIELD_ROM_MAX_CAPACITY")}</StatLabel>
                <StatValue>{maxUsedPercent.toFixed(1)}%</StatValue>
                <StatDetail>
                  {bytesToHumanReadable(rom.used)} /{" "}
                  {bytesToHumanReadable(rom.maxSize)}
                </StatDetail>
                <UsageBar>
                  <UsageBarUsed style={{ width: `${maxUsedPercent}%` }} />
                </UsageBar>
              </Card>
              <MemoryCard label={l10n("FIELD_BANK_0")} usage={memory.bank0} />
              <MemoryCard label="WRAM" usage={memory.wram} />
            </Summary>
            <FixedSpacer height={20} />
            <DebuggerRomUsageOverview overview={usageData.overview} />
            {showPlugins && (
              <>
                <FixedSpacer height={20} />
                <DebuggerPluginUsage plugins={usageData.plugins} />
              </>
            )}
            {showData && (
              <>
                <FixedSpacer height={20} />
                <DebuggerDataUsage
                  scripts={usageData.scripts}
                  sources={usageData.sources}
                />
              </>
            )}
          </ScrollContent>
        </CachedScroll>
      </Content>
      <DebuggerBuildFooter />
    </Wrapper>
  );
};

export default DebuggerRomUsage;

import React, { useMemo } from "react";
import styled from "styled-components";
import l10n from "shared/lib/lang/l10n";
import { useAppSelector } from "store/hooks";
import { DebuggerBuildFooter } from "components/debugger/DebuggerBuildFooter";
import { Card } from "ui/cards/Card";
import {
  bytesToHumanReadable,
  calculateRomUsageStats,
  MAX_ROM_SIZE,
} from "shared/lib/compiler/romUsageStats";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: auto;
  font-size: 11px;
`;

const Content = styled.div`
  flex-grow: 1;
  padding: 16px;
  overflow: auto;
  user-select: text;
  border-bottom: 1px solid ${(props) => props.theme.colors.sidebar.border};
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
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
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

const UsageBarUsed = styled.div`
  height: 100%;
  background: ${(props) => props.theme.colors.highlight};
`;

const DebuggerRomUsage = () => {
  const usageData = useAppSelector((state) => state.debug.usageData);

  const stats = useMemo(
    () => (usageData ? calculateRomUsageStats(usageData) : null),
    [usageData],
  );

  return (
    <Wrapper>
      <Content>
        {!stats ? (
          <EmptyState>{l10n("FIELD_RUN_A_BUILD_USAGE_DESC")}</EmptyState>
        ) : (
          <Summary>
            <Card>
              <StatLabel>{l10n("FIELD_ROM_USED")}</StatLabel>
              <StatValue>
                {bytesToHumanReadable(stats.used)} /{" "}
                {bytesToHumanReadable(stats.requiredSize)}
              </StatValue>
              <StatDetail>
                {stats.nextSize
                  ? `${l10n("FIELD_ROM_NEXT_SIZE")}: ${bytesToHumanReadable(stats.nextSize)}`
                  : `${l10n("FIELD_ROM_MAX_SIZE")}: ${bytesToHumanReadable(MAX_ROM_SIZE)}`}
              </StatDetail>

              <UsageBar>
                <UsageBarUsed style={{ width: `${stats.romUsedPercent}%` }} />
              </UsageBar>
            </Card>
            <Card>
              <StatLabel>{l10n("FIELD_ROM_MAX_CAPACITY")}</StatLabel>
              <StatValue>{stats.maxRomUsedPercent.toFixed(1)}%</StatValue>
              <StatDetail>
                {bytesToHumanReadable(stats.used)} /{" "}
                {bytesToHumanReadable(MAX_ROM_SIZE)}
              </StatDetail>

              <UsageBar>
                <UsageBarUsed
                  style={{ width: `${stats.maxRomUsedPercent}%` }}
                />
              </UsageBar>
            </Card>
          </Summary>
        )}
      </Content>

      <DebuggerBuildFooter />
    </Wrapper>
  );
};

export default DebuggerRomUsage;

import React from "react";
import styled from "styled-components";
import type { BuildUsageOverview } from "lib/compiler/buildUsage";
import type { RegionUsage } from "lib/compiler/buildArtifactParsers";
import l10n from "shared/lib/lang/l10n";
import { DebuggerUsageCard } from "ui/debugger/DebuggerUsageCard";
import {
  RegionUsageHeader,
  RegionUsageTable,
} from "ui/debugger/DebuggerUsageTable";
import { bytesToHumanReadable } from "shared/lib/helpers/formatBytes";
import { DebuggerBankUsage } from "ui/debugger/DebuggerBankUsage";

const UsageRow = styled.tr<{ $isTotal?: boolean }>`
  ${(props) =>
    props.$isTotal &&
    `
      font-weight: bold;

      td {
        border-top: 2px solid ${props.theme.colors.input.border};
      }
    `}
`;

const OverviewRow = ({
  label,
  usage,
  total,
  maxBankedRom,
}: {
  label: string;
  usage: RegionUsage;
  total?: boolean;
  maxBankedRom?: number;
}) => (
  <UsageRow $isTotal={total}>
    <td>{label}</td>
    <td>{bytesToHumanReadable(usage.bank0)}</td>
    <td>{bytesToHumanReadable(usage.wram)}</td>
    <td>
      {total ? (
        <DebuggerBankUsage size={usage.bankedRom} maxSize={maxBankedRom} />
      ) : (
        bytesToHumanReadable(usage.bankedRom)
      )}
    </td>
  </UsageRow>
);

const DebuggerRomUsageOverview = ({
  overview,
}: {
  overview: BuildUsageOverview;
}) => (
  <DebuggerUsageCard title={l10n("FIELD_MEMORY_USAGE")}>
    <RegionUsageTable>
      <RegionUsageHeader first={l10n("FIELD_SOURCE")} />
      <tbody>
        <OverviewRow
          label={l10n("FIELD_BASE_ENGINE")}
          usage={overview.engine}
        />
        <OverviewRow
          label={l10n("FIELD_MUSIC_DRIVER")}
          usage={overview.musicDriver}
        />
        <OverviewRow
          label={l10n("FIELD_GBDK_RUNTIME")}
          usage={overview.gbdkRuntime}
        />
        <OverviewRow
          label={l10n("FIELD_PROJECT_DATA")}
          usage={overview.project}
        />
        <OverviewRow label={l10n("FIELD_PLUGINS")} usage={overview.plugins} />
        <OverviewRow
          label={l10n("FIELD_RESERVED_MEMORY")}
          usage={overview.reserved}
        />
        <OverviewRow
          label={l10n("FIELD_TOTAL")}
          usage={overview.total}
          total
          maxBankedRom={overview.maximum.bankedRom}
        />
        <OverviewRow
          label={`${l10n("FIELD_MAXIMUM")} (${overview.cartType.toUpperCase()})`}
          usage={overview.maximum}
        />
        <OverviewRow
          label={l10n("FIELD_REMAINING")}
          usage={overview.remaining}
        />
      </tbody>
    </RegionUsageTable>
  </DebuggerUsageCard>
);

export default DebuggerRomUsageOverview;

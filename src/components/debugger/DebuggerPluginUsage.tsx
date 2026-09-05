import React from "react";
import type { BuildUsagePlugin } from "lib/compiler/buildUsage";
import l10n from "shared/lib/lang/l10n";
import { DebuggerUsageCard } from "ui/debugger/DebuggerUsageCard";
import {
  RegionUsageHeader,
  RegionUsageTable,
} from "ui/debugger/DebuggerUsageTable";
import { bytesToHumanReadable } from "shared/lib/helpers/formatBytes";
import { DebuggerBankUsage } from "ui/debugger/DebuggerBankUsage";

export const DebuggerPluginUsage = ({
  plugins,
}: {
  plugins: BuildUsagePlugin[];
}) => (
  <DebuggerUsageCard title={l10n("FIELD_PLUGIN_MEMORY_USAGE")}>
    <RegionUsageTable>
      <RegionUsageHeader first={l10n("FIELD_PLUGIN")} />
      <tbody>
        {plugins.flatMap((plugin) => [
          <tr key={plugin.pluginName}>
            <td>{plugin.pluginName}</td>
            <td>{bytesToHumanReadable(plugin.usage.bank0)}</td>
            <td>{bytesToHumanReadable(plugin.usage.wram)}</td>
            <td>{bytesToHumanReadable(plugin.usage.bankedRom)}</td>
          </tr>,
          ...plugin.files.map((file) => (
            <tr key={`${plugin.pluginName}:${file.sourceFile}`}>
              <td>
                ↳ {file.sourceFile}
                {file.replacesDefault
                  ? ` (${l10n("FIELD_REPLACES_DEFAULT_ENGINE_FILE")})`
                  : ""}
              </td>
              <td>
                <DebuggerBankUsage size={file.usage.bank0} />
              </td>
              <td>{bytesToHumanReadable(file.usage.wram)}</td>
              <td>
                <DebuggerBankUsage size={file.usage.bankedRom} />
              </td>
            </tr>
          )),
        ])}
      </tbody>
    </RegionUsageTable>
  </DebuggerUsageCard>
);

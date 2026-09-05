import React, { type ReactNode } from "react";
import l10n from "shared/lib/lang/l10n";
import { StyledRegionUsageTable } from "./style";

export const RegionUsageTable = ({ children }: { children: ReactNode }) => (
  <StyledRegionUsageTable>{children}</StyledRegionUsageTable>
);

export const RegionUsageHeader = ({ first }: { first: ReactNode }) => (
  <thead>
    <tr>
      <th>{first}</th>
      <th>{l10n("FIELD_BANK_0")}</th>
      <th>WRAM</th>
      <th>{l10n("FIELD_BANKED_ROM")}</th>
    </tr>
  </thead>
);

import React from "react";
import l10n from "shared/lib/lang/l10n";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { SplitPaneChildProps } from "ui/splitpane/SplitPaneVerticalContainer";
import { SplitPane } from "ui/splitpane/SplitPane";
import { ChannelsView } from "components/music/navigator/ChannelsView";

const COLLAPSED_SIZE = 30;

export const ChannelNavigatorPane = ({
  height,
  onToggle,
}: SplitPaneChildProps) => {
  const paneHeight = Math.floor(height ?? 0);

  if (paneHeight <= 0) {
    return null;
  }

  return (
    <SplitPane style={{ height: paneHeight }}>
      <SplitPaneHeader
        onToggle={onToggle}
        collapsed={paneHeight <= COLLAPSED_SIZE}
      >
        {l10n("FIELD_CHANNELS")}
      </SplitPaneHeader>
      <ChannelsView />
    </SplitPane>
  );
};

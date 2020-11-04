import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import l10n from "../../lib/helpers/l10n";
import { RootState } from "../../store/configureStore";
import useSplitPane from "../ui/hooks/use-split-pane";
import useWindowSize from "../ui/hooks/use-window-size";
import { SplitPaneVerticalDivider } from "../ui/splitpane/SplitPaneDivider";
import { SplitPaneHeader } from "../ui/splitpane/SplitPaneHeader";
import editorActions from "../../store/features/editor/editorActions";
import { NavigatorScenes } from "./NavigatorScenes";
import { NavigatorCustomEvents } from "./NavigatorCustomEvents";

const COLLAPSED_SIZE = 30;

const Wrapper = styled.div`
  height: 100%;
`;

const Pane = styled.div`
  overflow: hidden;
`;

export const Navigator = () => {
  const splitSizes = useSelector(
    (state: RootState) => state.editor.navigatorSplitSizes
  );
  const dispatch = useDispatch();
  const windowSize = useWindowSize();
  const height = windowSize.height ? windowSize.height - 38 - 2 : 0;

  const updateSplitSizes = (newSizes: number[]) => {
    dispatch(editorActions.setNavigatorSplitSizes(newSizes));
  };

  const [onDragStart, togglePane] = useSplitPane({
    sizes: splitSizes,
    setSizes: updateSplitSizes,
    minSizes: [COLLAPSED_SIZE, COLLAPSED_SIZE, COLLAPSED_SIZE],
    collapsedSize: COLLAPSED_SIZE,
    maxTotal: height,
    direction: "vertical",
  });

  return (
    <Wrapper>
      <Pane style={{ height: splitSizes[0] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(0)}
          collapsed={Math.floor(splitSizes[0]) <= COLLAPSED_SIZE}
        >
          {l10n("FIELD_SCENES")}
        </SplitPaneHeader>
        <NavigatorScenes height={splitSizes[0] - 30} />
      </Pane>
      <SplitPaneVerticalDivider onMouseDown={onDragStart(0)} />
      <Pane style={{ height: splitSizes[1] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(1)}
          collapsed={Math.floor(splitSizes[1]) <= COLLAPSED_SIZE}
        >
          {l10n("SIDEBAR_CUSTOM_EVENTS")}
        </SplitPaneHeader>
        <NavigatorCustomEvents height={splitSizes[1] - 30} />
      </Pane>
      <SplitPaneVerticalDivider onMouseDown={onDragStart(1)} />
      <Pane style={{ height: splitSizes[2] }}>
        <SplitPaneHeader
          onToggle={() => togglePane(2)}
          collapsed={Math.floor(splitSizes[2]) <= COLLAPSED_SIZE}
        >
          {l10n("FIELD_VARIABLES")}
        </SplitPaneHeader>
      </Pane>
    </Wrapper>
  );
};

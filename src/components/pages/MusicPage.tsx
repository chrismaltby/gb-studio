import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styled, { ThemeContext } from "styled-components";
import debounce from "lodash/debounce";
import useResizable from "ui/hooks/use-resizable";
import useWindowSize from "ui/hooks/use-window-size";
import {
  SplitPaneHorizontalDivider,
  SplitPaneVerticalDivider,
} from "ui/splitpane/SplitPaneDivider";
import editorActions from "store/features/editor/editorActions";
import { musicSelectors } from "store/features/entities/entitiesSelectors";
import { SongInspector } from "components/music/inspector/SongInspector";
import ModViewer from "components/music/mod/ModViewer";
import { clampSidebarWidth } from "renderer/lib/window/sidebar";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { sortByFilename } from "shared/lib/entities/entitiesHelpers";
import { InstrumentNavigatorPane } from "components/music/navigator/InstrumentNavigatorPane";
import { SongNavigatorPane } from "components/music/navigator/SongNavigatorPane";
import SplitPaneVerticalContainer, {
  SplitPaneLayout,
} from "ui/splitpane/SplitPaneVerticalContainer";
import { ChannelNavigatorPane } from "components/music/navigator/ChannelNavigatorPane";
import trackerActions from "store/features/tracker/trackerActions";
import { loadSongFile } from "store/features/trackerDocument/trackerDocumentState";
import { assetPath } from "shared/lib/helpers/assets";
import SongDocument from "components/music/SongDocument";
import { SequenceEditor } from "components/music/sequence/SequenceEditor";
import l10n from "shared/lib/lang/l10n";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { InstrumentProperties } from "components/music/inspector/instruments/InstrumentProperties";
import SongEditorToolsPanel from "components/music/toolbar/SongEditorToolsPanel";
import { FixedSpacer } from "ui/spacing/Spacing";
import { Grid2x2Icon } from "ui/icons/Icons";
import { Button } from "ui/buttons/Button";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const SplitPatternIcon = styled(Grid2x2Icon)`
  && {
    height: 12px;
    width: 12px;
    max-width: 12px;
    max-height: 12px;
    margin: 0px 2px;
  }
`;

const defaultPaneLayout: SplitPaneLayout[] = [
  { type: "fill", initialMinSize: 200 },
  { type: "fixed", size: 190, minSize: 190, maxSize: 190 },
  { type: "fixed", size: 485 },
];

const MusicPage = () => {
  const dispatch = useAppDispatch();
  const themeContext = useContext(ThemeContext);
  const worldSidebarWidth = useAppSelector(
    (state) => state.editor.worldSidebarWidth,
  );
  const navigatorSidebarWidth = useAppSelector(
    (state) => state.editor.navigatorSidebarWidth,
  );
  const windowSize = useWindowSize();
  const prevWindowWidthRef = useRef<number>(0);
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  const minCenterPaneWidth = 0;

  const allSongs = useAppSelector(musicSelectors.selectAll);
  const allUgeSongs = useMemo(
    () => [...allSongs].sort(sortByFilename),
    [allSongs],
  );

  const selectedSongId = useAppSelector(
    (state) => state.tracker.selectedSongId,
  );

  const song = useAppSelector((state) =>
    musicSelectors.selectById(state, selectedSongId),
  );

  const lastSongId = useRef("");
  useEffect(() => {
    if (song) {
      lastSongId.current = song.id;
    }
  }, [song]);

  const viewSongId = useMemo(
    () => song?.id || lastSongId.current || allUgeSongs[0]?.id,
    [allUgeSongs, song],
  );

  const viewSong = useAppSelector((state) =>
    musicSelectors.selectById(state, viewSongId),
  );

  const selectedSongPath = useMemo(
    () => (viewSong?.type === "uge" ? assetPath("music", viewSong) : ""),
    [viewSong],
  );

  useEffect(() => {
    if (selectedSongPath !== "") {
      dispatch(loadSongFile(selectedSongPath));
    }
  }, [dispatch, selectedSongPath]);

  const modified = useAppSelector((state) => state.tracker.modified);
  const status = useAppSelector((state) => state.tracker.status);
  const globalSplitPattern = useAppSelector(
    (state) => state.tracker.globalSplitPattern,
  );

  useEffect(() => {
    if (viewSong && (status === "init" || viewSong.id !== selectedSongId)) {
      dispatch(trackerActions.setSelectedSongId(viewSong.id));
    }
  }, [dispatch, status, viewSong, selectedSongId]);

  const [leftPaneWidth, setLeftPaneSize, startLeftPaneResize] = useResizable({
    initialSize: navigatorSidebarWidth,
    direction: "right",
    minSize: 50,
    maxSize: Math.max(101, windowWidth - minCenterPaneWidth - 200),
    onResize: () => {
      recalculateRightColumn();
    },
    onResizeComplete: (v) => {
      if (v < 200) {
        setLeftPaneSize(200);
      }
      recalculateRightColumn();
    },
  });
  const [rightPaneWidth, setRightPaneSize, onResizeRight] = useResizable({
    initialSize: worldSidebarWidth,
    direction: "left",
    minSize: 280,
    maxSize: Math.max(281, windowWidth - minCenterPaneWidth - 100),
    onResize: () => {
      recalculateLeftColumn();
    },
    onResizeComplete: (width) => {
      if (width > windowWidth - 200) {
        setLeftPaneSize(200);
        setRightPaneSize(windowWidth - 200);
      } else {
        recalculateLeftColumn();
      }
    },
  });

  useEffect(() => {
    prevWindowWidthRef.current = windowWidth;
  });
  const prevWidth = prevWindowWidthRef.current;

  useEffect(() => {
    if (windowWidth !== prevWidth) {
      const panelsTotalWidth =
        leftPaneWidth + rightPaneWidth + minCenterPaneWidth;
      const widthOverflow = panelsTotalWidth - windowWidth;
      if (widthOverflow > 0) {
        setLeftPaneSize(leftPaneWidth - 0.5 * widthOverflow);
        setRightPaneSize(rightPaneWidth - 0.5 * widthOverflow);
      }
    }
  }, [
    windowWidth,
    prevWidth,
    leftPaneWidth,
    setLeftPaneSize,
    rightPaneWidth,
    setRightPaneSize,
  ]);

  const debouncedStoreWidths = useRef(
    debounce((leftPaneWidth: number, rightPaneWidth: number) => {
      dispatch(
        editorActions.resizeWorldSidebar(clampSidebarWidth(rightPaneWidth)),
      );
      dispatch(editorActions.resizeNavigatorSidebar(leftPaneWidth));
    }, 100),
  );

  useEffect(
    () => debouncedStoreWidths.current(leftPaneWidth, rightPaneWidth),
    [leftPaneWidth, rightPaneWidth],
  );

  const recalculateLeftColumn = () => {
    const newWidth = Math.min(
      leftPaneWidth,
      windowWidth - rightPaneWidth - minCenterPaneWidth,
    );
    if (newWidth !== leftPaneWidth) {
      setLeftPaneSize(newWidth);
    }
  };

  const recalculateRightColumn = () => {
    const newWidth = Math.min(
      rightPaneWidth,
      windowWidth - leftPaneWidth - minCenterPaneWidth,
    );
    if (newWidth !== rightPaneWidth) {
      setRightPaneSize(newWidth);
    }
  };

  const isCompactLayout = windowSize?.width ? windowSize.width < 900 : false;

  const [patternsPanelOpen, setPatternsPanelOpen] = useState(true);

  const togglePatternsPanel = useCallback(() => {
    setPatternsPanelOpen((value) => !value);
  }, []);

  const songsPane = useMemo(
    () => (
      <SongNavigatorPane
        modified={modified}
        selectedSongId={selectedSongId || viewSongId}
      />
    ),
    [modified, selectedSongId, viewSongId],
  );

  return (
    <Wrapper>
      {!isCompactLayout && (
        <>
          <div
            style={{
              transition: "opacity 0.3s ease-in-out",
              width: Math.max(200, leftPaneWidth),
              background: themeContext?.colors.sidebar.background,
              overflow: "hidden",
              position: "relative",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                minWidth: 200,
                position: "relative",
                width: "100%",
                height: "100%",
              }}
            >
              <SplitPaneVerticalContainer
                height={windowHeight - 38}
                defaultLayout={defaultPaneLayout}
              >
                {songsPane}
                {viewSong?.type === "uge" ? <ChannelNavigatorPane /> : null}
                {viewSong?.type === "uge" ? <InstrumentNavigatorPane /> : null}
              </SplitPaneVerticalContainer>
            </div>
          </div>
          <SplitPaneHorizontalDivider onMouseDown={startLeftPaneResize} />
        </>
      )}
      {viewSong?.type === "mod" && (
        <div
          style={{
            flex: "1 1 0",
            minWidth: 0,
            overflow: "hidden",
            background: themeContext?.colors.background,
            color: themeContext?.colors.text,
            height: windowHeight - 38,
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flexGrow: 1, position: "relative" }}>
            <ModViewer trackId={viewSong.id} allowConvertToUge />
          </div>
        </div>
      )}
      {viewSong?.type === "uge" && (
        <>
          <div
            id="song-document"
            style={{
              flex: "1 1 0",
              minWidth: 0,
              overflow: "hidden",
              background: themeContext?.colors.background,
              color: themeContext?.colors.text,
              height: "100%",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <SongEditorToolsPanel musicAsset={viewSong} />
            <SplitPaneVerticalDivider />

            <SongDocument />

            {isCompactLayout && (
              <>
                <SplitPaneVerticalDivider />
                <div
                  style={{
                    height: 500,
                    background: themeContext?.colors.sidebar.background,
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                  }}
                >
                  <SplitPaneHeader collapsed={false}>WIP</SplitPaneHeader>
                  <div
                    style={{
                      flexGrow: 1,
                      overflow: "auto",
                    }}
                  >
                    {status === "loaded" && <InstrumentProperties />}
                    <FixedSpacer height={40} />
                  </div>
                </div>
              </>
            )}

            {!isCompactLayout && (
              <>
                <SplitPaneVerticalDivider />
                <SplitPaneHeader
                  onToggle={togglePatternsPanel}
                  collapsed={!patternsPanelOpen}
                  buttons={
                    <Button
                      size="small"
                      variant={globalSplitPattern ? "primary" : "transparent"}
                      onClick={() => {
                        dispatch(
                          trackerActions.setglobalSplitPattern(
                            !globalSplitPattern,
                          ),
                        );
                      }}
                      title={l10n("FIELD_SPLIT_PATTERN")}
                    >
                      <SplitPatternIcon />
                    </Button>
                  }
                >
                  {l10n("FIELD_ORDER")}
                </SplitPaneHeader>

                {patternsPanelOpen &&
                  (status === "loaded" ? (
                    <SequenceEditor direction="horizontal" />
                  ) : (
                    <div
                      style={{
                        height: 75,
                        background: themeContext?.colors.sidebar.background,
                      }}
                    />
                  ))}
              </>
            )}
          </div>
          {!isCompactLayout && (
            <>
              <SplitPaneHorizontalDivider onMouseDown={onResizeRight} />
              <div
                id="song-editor"
                style={{
                  width: rightPaneWidth,
                  background: themeContext?.colors.sidebar.background,
                  height: "100%",
                  overflow: "hidden",
                  position: "relative",
                  flexShrink: 0,
                }}
              >
                {status === "loaded" && <SongInspector />}
              </div>
            </>
          )}
        </>
      )}
    </Wrapper>
  );
};

export default MusicPage;

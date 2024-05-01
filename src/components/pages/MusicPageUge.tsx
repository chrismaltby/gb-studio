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
import { NavigatorSongs, ugeFilter } from "components/music/NavigatorSongs";
import { SongTracker } from "components/music/SongTracker";
import { musicSelectors } from "store/features/entities/entitiesState";
import { SongEditor } from "components/music/SongEditor";
import SongEditorToolsPanel from "components/music/SongEditorToolsPanel";
import SongEditorRightToolsPanel from "components/music/SongEditorRightToolsPanel";
import { loadSongFile } from "store/features/trackerDocument/trackerDocumentState";
import { SongPianoRoll } from "components/music/SongPianoRoll";
import { Music } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { clampSidebarWidth } from "renderer/lib/window/sidebar";
import { UgePlayer } from "components/music/UgePlayer";
import trackerActions from "store/features/tracker/trackerActions";
import { assetPath } from "shared/lib/helpers/assets";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { sortByFilename } from "shared/lib/entities/entitiesHelpers";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const ContentWrapper = styled.div`
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  background: ${(props) => props.theme.colors.document.background};
  color: ${(props) => props.theme.colors.text};
  position: relative;
  display: flex;
`;

const ContentMessage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`;

const ErrorTitle = styled.div`
  font-size: 14px;
  font-weight: bold;
`;

const ErrorDescription = styled.div`
  padding-top: 5px;
`;

const MusicPageUge = () => {
  const dispatch = useAppDispatch();
  const themeContext = useContext(ThemeContext);
  const worldSidebarWidth = useAppSelector(
    (state) => state.editor.worldSidebarWidth
  );
  const navigatorSidebarWidth = useAppSelector(
    (state) => state.editor.navigatorSidebarWidth
  );
  const windowSize = useWindowSize();
  const prevWindowWidthRef = useRef<number>(0);
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  const minCenterPaneWidth = 0;

  const allSongs = useAppSelector((state) =>
    musicSelectors.selectAll(state).filter(ugeFilter).sort(sortByFilename)
  );

  const selectedSongId = useAppSelector((state) => state.editor.selectedSongId);

  const song = useAppSelector((state) =>
    musicSelectors.selectById(state, selectedSongId)
  );

  const lastSongId = useRef("");
  useEffect(() => {
    if (song) {
      lastSongId.current = song.id;
    }
  }, [song]);

  const viewSongId = useMemo(
    () => song?.id || lastSongId.current || allSongs[0]?.id,
    [allSongs, song]
  );

  const viewSong = useAppSelector((state) =>
    musicSelectors.selectById(state, viewSongId)
  );

  const sequenceId = useAppSelector((state) => state.editor.selectedSequence);

  const songDocument = useAppSelector(
    (state) => state.trackerDocument.present.song
  );
  const modified = useAppSelector(
    (state) => state.trackerDocument.present.modified
  );
  const status = useAppSelector(
    (state) => state.trackerDocument.present.status
  );
  const error = useAppSelector((state) => state.trackerDocument.present.error);

  const [selectedSongPath, setSelectedSongPath] = useState("");
  const [selectedSongType, setSelectedSongType] = useState("");
  useEffect(() => {
    if (viewSong) {
      setSelectedSongPath(assetPath("music", viewSong));
      setSelectedSongType(viewSong.type || "");
    }
  }, [viewSong]);

  useEffect(() => {
    if (selectedSongPath !== "" && selectedSongType === "uge") {
      dispatch({ type: "@@TRACKER_INIT" });
      dispatch(loadSongFile(selectedSongPath));
      dispatch(trackerActions.init());
    }
  }, [dispatch, selectedSongPath, selectedSongType]);

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
  const [,] = useResizable({
    initialSize: 231,
    direction: "top",
    minSize: 30,
    maxSize: windowHeight - 100,
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
  const [,] = useResizable({
    initialSize: 231,
    direction: "top",
    minSize: 30,
    maxSize: windowHeight - 100,
  });
  const [,] = useState(true);

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
        editorActions.resizeWorldSidebar(clampSidebarWidth(rightPaneWidth))
      );
      dispatch(editorActions.resizeNavigatorSidebar(leftPaneWidth));
    }, 100)
  );

  useEffect(
    () => debouncedStoreWidths.current(leftPaneWidth, rightPaneWidth),
    [leftPaneWidth, rightPaneWidth]
  );

  const recalculateLeftColumn = () => {
    const newWidth = Math.min(
      leftPaneWidth,
      windowWidth - rightPaneWidth - minCenterPaneWidth
    );
    if (newWidth !== leftPaneWidth) {
      setLeftPaneSize(newWidth);
    }
  };

  const recalculateRightColumn = () => {
    const newWidth = Math.min(
      rightPaneWidth,
      windowWidth - leftPaneWidth - minCenterPaneWidth
    );
    if (newWidth !== rightPaneWidth) {
      setRightPaneSize(newWidth);
    }
  };

  const [channelStatus, setChannelStatus] = useState([
    false,
    false,
    false,
    false,
  ]);

  const view = useAppSelector((state) => state.tracker.view);

  const renderGridView = useCallback(() => {
    if (!songDocument) {
      return;
    } else if (view === "tracker") {
      return (
        <div style={{ position: "relative" }}>
          <SongTracker
            sequenceId={sequenceId}
            song={songDocument}
            height={windowHeight - 100}
            channelStatus={channelStatus}
          />
        </div>
      );
    } else {
      return (
        <SongPianoRoll
          sequenceId={sequenceId}
          song={songDocument}
          height={windowHeight - 100}
        />
      );
    }
  }, [channelStatus, sequenceId, songDocument, view, windowHeight]);

  return (
    <Wrapper>
      <div
        style={{
          transition: "opacity 0.3s ease-in-out",
          width: Math.max(200, leftPaneWidth),
          background: themeContext.colors.sidebar.background,
          overflow: "hidden",
          position: "relative",
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
          <NavigatorSongs
            height={windowHeight - 38}
            defaultFirst
            dutyInstruments={songDocument?.duty_instruments}
            waveInstruments={songDocument?.wave_instruments}
            noiseInstruments={songDocument?.noise_instruments}
            modified={modified}
          />
        </div>
      </div>
      <SplitPaneHorizontalDivider onMouseDown={startLeftPaneResize} />
      {status === "error" ? (
        <ContentWrapper style={{ height: windowHeight - 38 }}>
          <ContentMessage>
            <ErrorTitle>Can't load the song</ErrorTitle>
            <ErrorDescription>{error}</ErrorDescription>
          </ContentMessage>
        </ContentWrapper>
      ) : songDocument !== undefined ? (
        <>
          <div
            style={{
              flex: "1 1 0",
              minWidth: 0,
              overflow: "hidden",
              background: themeContext.colors.document.background,
              color: themeContext.colors.text,
              height: windowHeight - 38,
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ position: "relative", height: "60px" }}>
              <SongEditorToolsPanel selectedSong={viewSong} />
              <SongEditorRightToolsPanel channelStatus={channelStatus} />
            </div>
            <SplitPaneVerticalDivider />
            {renderGridView()}
            <UgePlayer
              data={songDocument}
              onChannelStatusUpdate={setChannelStatus}
            />
          </div>
          <SplitPaneHorizontalDivider onMouseDown={onResizeRight} />
          <div
            style={{
              width: rightPaneWidth,
              background: themeContext.colors.sidebar.background,
              height: "100%",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <SongEditor multiColumn={rightPaneWidth >= 500} />
          </div>
        </>
      ) : (
        <ContentWrapper style={{ height: windowHeight - 38 }}>
          <ContentMessage>
            {status === "loading" ? l10n("FIELD_LOADING") : "No song loaded"}
          </ContentMessage>
        </ContentWrapper>
      )}
    </Wrapper>
  );
};

export default MusicPageUge;

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import styled, { ThemeContext } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import debounce from "lodash/debounce";
import useResizable from "../../components/ui/hooks/use-resizable";
import useWindowSize from "../../components/ui/hooks/use-window-size";
import {
  SplitPaneHorizontalDivider,
  SplitPaneVerticalDivider,
} from "../../components/ui/splitpane/SplitPaneDivider";
import { RootState } from "../../store/configureStore";
import editorActions from "../../store/features/editor/editorActions";
import settingsActions from "../../store/features/settings/settingsActions";
import { SpriteEditor } from "../../components/sprites/SpriteEditor";
import { NavigatorSprites } from "../../components/sprites/NavigatorSprites";
import {
  spriteAnimationSelectors,
  spriteSheetSelectors,
} from "../../store/features/entities/entitiesState";
import MetaspriteEditor from "../../components/sprites/MetaspriteEditor";
import SpriteTilePalette from "../../components/sprites/SpriteTilePalette";
import SpriteAnimationTimeline from "../../components/sprites/SpriteAnimationTimeline";
import { SplitPaneHeader } from "../../components/ui/splitpane/SplitPaneHeader";
import l10n from "../../lib/helpers/l10n";
import { getAnimationNames } from "../../components/sprites/helpers";
import MetaspriteEditorToolsPanel from "../../components/sprites/MetaspriteEditorToolsPanel";
import { ZoomButton } from "../../components/ui/buttons/ZoomButton";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const SpritesPage = () => {
  const dispatch = useDispatch();
  const themeContext = useContext(ThemeContext);
  const worldSidebarWidth = useSelector(
    (state: RootState) => state.editor.worldSidebarWidth
  );
  const navigatorSidebarWidth = useSelector(
    (state: RootState) => state.editor.navigatorSidebarWidth
  );
  const tilesZoom = useSelector(
    (state: RootState) => state.editor.zoomSpriteTiles
  );
  const windowSize = useWindowSize();
  const prevWindowWidthRef = useRef<number>(0);
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  const minCenterPaneWidth = 0;

  const allSprites = useSelector((state: RootState) =>
    spriteSheetSelectors.selectAll(state)
  );
  const spritesLookup = useSelector((state: RootState) =>
    spriteSheetSelectors.selectEntities(state)
  );
  const spriteAnimationsLookup = useSelector((state: RootState) =>
    spriteAnimationSelectors.selectEntities(state)
  );
  const navigationId = useSelector(
    (state: RootState) => state.editor.selectedSpriteSheetId
  );
  const animationId = useSelector(
    (state: RootState) => state.editor.selectedAnimationId
  );
  const metaspriteId = useSelector(
    (state: RootState) => state.editor.selectedMetaspriteId
  );
  const selectedSprite = spritesLookup[navigationId] || allSprites[0];
  const selectedAnimation =
    spriteAnimationsLookup[animationId] ||
    spriteAnimationsLookup[selectedSprite.animations?.[0]];
  const selectedId = selectedSprite.id;
  const selectedAnimationId = selectedAnimation?.id || "";
  const selectedMetaspriteId =
    metaspriteId || selectedAnimation?.frames[0] || "";
  const selectedAnimationIndex =
    selectedSprite?.animations?.indexOf(selectedAnimationId) || 0;
  const frames = selectedAnimation?.frames || [];

  const [leftPaneWidth, setLeftPaneSize, startLeftPaneResize] = useResizable({
    initialSize: navigatorSidebarWidth,
    direction: "right",
    minSize: 50,
    maxSize: Math.max(101, windowWidth - minCenterPaneWidth - 200),
    onResize: (v) => {
      recalculateRightColumn();
    },
    onResizeComplete: (v) => {
      if (v < 100) {
        hideNavigator();
      }
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
    onResize: (v) => {
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
  const [centerPaneHeight, setCenterPaneSize, onResizeCenter] = useResizable({
    initialSize: 231,
    direction: "top",
    minSize: 30,
    maxSize: windowHeight - 100,
  });
  const [animationsOpen, setAnimationsOpen] = useState(true);

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
      dispatch(editorActions.resizeWorldSidebar(rightPaneWidth));
      dispatch(editorActions.resizeNavigatorSidebar(leftPaneWidth));
    }, 100)
  );

  useEffect(() => debouncedStoreWidths.current(leftPaneWidth, rightPaneWidth), [
    leftPaneWidth,
    rightPaneWidth,
  ]);

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

  const hideNavigator = () => {
    dispatch(settingsActions.setShowNavigator(false));
  };

  const toggleTilesPane = useCallback(() => {
    if (centerPaneHeight === 30) {
      setCenterPaneSize(231);
    } else {
      setCenterPaneSize(30);
    }
  }, [centerPaneHeight, setCenterPaneSize]);

  const toggleAnimationsPane = useCallback(() => {
    setAnimationsOpen(!animationsOpen);
  }, [animationsOpen, setAnimationsOpen]);

  const onZoomIn = useCallback(() => {
    dispatch(editorActions.zoomIn({ section: "spriteTiles" }));
  }, [dispatch]);

  const onZoomOut = useCallback(() => {
    dispatch(editorActions.zoomOut({ section: "spriteTiles" }));
  }, [dispatch]);

  const onZoomReset = useCallback(() => {
    dispatch(editorActions.zoomReset({ section: "spriteTiles" }));
  }, [dispatch]);

  const animationNames = getAnimationNames();

  return (
    <Wrapper>
      <div
        style={{
          transition: "opacity 0.3s ease-in-out",
          width: leftPaneWidth,
          background: themeContext.colors.sidebar.background,
          opacity: leftPaneWidth < 100 ? 0.1 : 1,
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
          <NavigatorSprites
            height={windowHeight - 38}
            selectedAnimationId={selectedAnimationId}
            defaultFirst
          />
        </div>
      </div>
      <SplitPaneHorizontalDivider onMouseDown={startLeftPaneResize} />
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
        <div style={{ flexGrow: 1, position: "relative" }}>
          <MetaspriteEditorToolsPanel
            selectedAnimationId={selectedAnimationId}
            metaspriteId={selectedMetaspriteId}
          />
          {frames.map((frameId) => (
            <MetaspriteEditor
              key={frameId}
              spriteSheetId={selectedId}
              metaspriteId={frameId}
              animationId={selectedAnimation?.id || ""}
              hidden={frameId !== selectedMetaspriteId}
            />
          ))}
        </div>
        <SplitPaneVerticalDivider onMouseDown={onResizeCenter} />
        <div style={{ position: "relative", height: centerPaneHeight }}>
          <SplitPaneHeader
            onToggle={toggleTilesPane}
            collapsed={centerPaneHeight === 30}
            buttons={
              centerPaneHeight > 30 && (
                <ZoomButton
                  zoom={tilesZoom}
                  size="small"
                  variant="transparent"
                  title={l10n("TOOLBAR_ZOOM_RESET")}
                  titleIn={l10n("TOOLBAR_ZOOM_IN")}
                  titleOut={l10n("TOOLBAR_ZOOM_OUT")}
                  onZoomIn={onZoomIn}
                  onZoomOut={onZoomOut}
                  onZoomReset={onZoomReset}
                />
              )
            }
          >
            {l10n("FIELD_TILES")}
          </SplitPaneHeader>
          <SpriteTilePalette id={selectedId} />
        </div>
        <SplitPaneVerticalDivider />
        <SplitPaneHeader
          onToggle={toggleAnimationsPane}
          collapsed={!animationsOpen}
        >
          {l10n("FIELD_FRAMES")}: {animationNames[selectedAnimationIndex]}
        </SplitPaneHeader>
        {animationsOpen && (
          <SpriteAnimationTimeline
            spriteSheetId={selectedId}
            animationId={selectedAnimation?.id || ""}
            metaspriteId={selectedMetaspriteId}
          />
        )}
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
        <SpriteEditor id={selectedId} metaspriteId={selectedMetaspriteId} />
      </div>
    </Wrapper>
  );
};

export default SpritesPage;

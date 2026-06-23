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
import { SpriteInspector } from "components/sprites/inspector/SpriteInspector";
import {
  spriteAnimationSelectors,
  spriteSheetSelectors,
  spriteStateSelectors,
} from "store/features/entities/entitiesSelectors";
import MetaspriteEditor from "components/sprites/MetaspriteEditor";
import SpriteTilePalette from "components/sprites/SpriteTilePalette";
import SpriteAnimationTimeline from "components/sprites/SpriteAnimationTimeline";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import l10n from "shared/lib/lang/l10n";
import MetaspriteEditorToolsPanel from "components/sprites/MetaspriteEditorToolsPanel";
import { ZoomButton } from "ui/buttons/ZoomButton";
import MetaspriteEditorPreviewSettings from "components/sprites/MetaspriteEditorPreviewSettings";
import spriteActions from "store/features/sprite/spriteActions";
import { clampSidebarWidth } from "renderer/lib/window/sidebar";
import { Button } from "ui/buttons/Button";
import { TargetIcon } from "ui/icons/Icons";
import { FixedSpacer } from "ui/spacing/Spacing";
import { getAnimationNameById } from "renderer/lib/sprites/spriteL10NHelpers";
import { useAppDispatch, useAppSelector } from "store/hooks";
import SplitPaneVerticalContainer, {
  SplitPaneLayout,
} from "ui/splitpane/SplitPaneVerticalContainer";
import { SpriteAnimationNavigatorPane } from "components/sprites/navigator/SpriteAnimationNavigatorPane";
import { SpriteNavigatorPane } from "components/sprites/navigator/SpriteNavigatorPane";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const PrecisionIcon = styled(TargetIcon)`
  && {
    height: 16px;
    width: 16px;
    max-width: 16px;
    max-height: 16px;
    margin: -2px 0 0 0;
  }
`;

const defaultPaneLayout: SplitPaneLayout[] = [
  { type: "fill", initialMinSize: 200 },
  { type: "fixed", size: 334 },
];

const SpritesPage = () => {
  const dispatch = useAppDispatch();
  const themeContext = useContext(ThemeContext);

  const worldSidebarWidth = useAppSelector(
    (state) => state.editor.worldSidebarWidth,
  );

  const navigatorSidebarWidth = useAppSelector(
    (state) => state.editor.navigatorSidebarWidth,
  );

  const tilesZoom = useAppSelector((state) => state.editor.zoomSpriteTiles);

  const selectedId = useAppSelector(
    (state) => state.editor.selectedSpriteSheetId,
  );

  const navigationStateId = useAppSelector(
    (state) => state.editor.selectedSpriteStateId,
  );

  const animationId = useAppSelector(
    (state) => state.editor.selectedAnimationId,
  );

  const metaspriteId = useAppSelector(
    (state) => state.editor.selectedMetaspriteId,
  );

  const selectedAdditionalMetaspriteIds = useAppSelector(
    (state) => state.editor.selectedAdditionalMetaspriteIds,
  );

  const precisionTileMode = useAppSelector(
    (state) => state.editor.precisionTileMode,
  );

  const firstSpriteId = useAppSelector(
    (state) => spriteSheetSelectors.selectIds(state)[0] ?? "",
  );

  const sprite = useAppSelector((state) =>
    spriteSheetSelectors.selectById(state, selectedId),
  );

  const windowSize = useWindowSize();
  const prevWindowWidthRef = useRef<number>(0);
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  const minCenterPaneWidth = 0;

  const lastSpriteId = useRef("");

  useEffect(() => {
    if (sprite) {
      lastSpriteId.current = sprite.id;
    }
  }, [sprite]);

  const viewSpriteId =
    sprite?.id || lastSpriteId.current || firstSpriteId || "";

  const selectedSprite = useAppSelector((state) =>
    viewSpriteId
      ? spriteSheetSelectors.selectById(state, viewSpriteId)
      : undefined,
  );

  const fallbackStateId = selectedSprite?.states[0] ?? "";

  const navigationState = useAppSelector((state) =>
    navigationStateId
      ? spriteStateSelectors.selectById(state, navigationStateId)
      : undefined,
  );

  const fallbackState = useAppSelector((state) =>
    fallbackStateId
      ? spriteStateSelectors.selectById(state, fallbackStateId)
      : undefined,
  );

  const selectedState = navigationState || fallbackState;
  const selectedStateId = selectedState?.id || "";

  const fallbackAnimationId = selectedState?.animations?.[0] ?? "";

  const navigationAnimation = useAppSelector((state) =>
    animationId
      ? spriteAnimationSelectors.selectById(state, animationId)
      : undefined,
  );

  const fallbackAnimation = useAppSelector((state) =>
    fallbackAnimationId
      ? spriteAnimationSelectors.selectById(state, fallbackAnimationId)
      : undefined,
  );

  const selectedAnimation = navigationAnimation || fallbackAnimation;
  const selectedAnimationId = selectedAnimation?.id || "";

  const [tmpPrecisionMode, setTmpPrecisionMode] = useState(false);

  const selectedMetaspriteId =
    metaspriteId || selectedAnimation?.frames[0] || "";
  const frames = useMemo(
    () => selectedAnimation?.frames || [],
    [selectedAnimation?.frames],
  );
  const selectedFrame = frames.indexOf(selectedMetaspriteId);

  // If selected frame not found jump to last frame in animation
  useEffect(() => {
    if (selectedFrame === -1 && frames.length > 0) {
      dispatch(
        editorActions.setSelectedMetaspriteId(frames[frames.length - 1]),
      );
    }
  }, [dispatch, frames, selectedFrame]);

  const [leftPaneWidth, setLeftPaneSize, startLeftPaneResize] = useResizable({
    initialSize: navigatorSidebarWidth,
    direction: "right",
    minSize: 50,
    maxSize: Math.max(101, windowWidth - minCenterPaneWidth - 200),
    onResize: (_v) => {
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
    onResize: (_v) => {
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
    if (!viewSpriteId) {
      return;
    }
    dispatch(spriteActions.compileSprite({ spriteSheetId: viewSpriteId }));
  }, [dispatch, viewSpriteId]);

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

  const toggleTilesPane = useCallback(() => {
    if (centerPaneHeight === 30) {
      setCenterPaneSize(231);
    } else {
      setCenterPaneSize(30);
    }
  }, [centerPaneHeight, setCenterPaneSize]);

  const toggleAnimationsPane = useCallback(() => {
    setAnimationsOpen((open) => !open);
  }, [setAnimationsOpen]);

  const onZoomIn = useCallback(() => {
    dispatch(editorActions.zoomIn({ section: "spriteTiles" }));
  }, [dispatch]);

  const onZoomOut = useCallback(() => {
    dispatch(editorActions.zoomOut({ section: "spriteTiles" }));
  }, [dispatch]);

  const onZoomReset = useCallback(() => {
    dispatch(editorActions.zoomReset({ section: "spriteTiles" }));
  }, [dispatch]);

  const onTogglePrecisionTiles = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      dispatch(editorActions.setPrecisionTileMode(!precisionTileMode));
    },
    [dispatch, precisionTileMode],
  );

  const handleKeys = useCallback((e: KeyboardEvent) => {
    if (e.altKey) {
      setTmpPrecisionMode(true);
    }
  }, []);

  const handleKeysUp = useCallback((e: KeyboardEvent) => {
    if (!e.altKey) {
      setTmpPrecisionMode(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeys);
    window.addEventListener("keyup", handleKeysUp);

    return () => {
      window.removeEventListener("keydown", handleKeys);
      window.removeEventListener("keyup", handleKeysUp);
    };
  }, [handleKeys, handleKeysUp]);

  return (
    <Wrapper>
      <div
        style={{
          transition: "opacity 0.3s ease-in-out",
          width: Math.max(200, leftPaneWidth),
          background: themeContext?.colors.sidebar.background,
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
          <SplitPaneVerticalContainer
            height={windowHeight - 38}
            defaultLayout={defaultPaneLayout}
          >
            <SpriteNavigatorPane viewSpriteId={viewSpriteId} />
            {selectedSprite && (
              <SpriteAnimationNavigatorPane viewSpriteId={viewSpriteId} />
            )}
          </SplitPaneVerticalContainer>
        </div>
      </div>
      <SplitPaneHorizontalDivider onMouseDown={startLeftPaneResize} />
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
          <MetaspriteEditorToolsPanel
            selectedAnimationId={selectedAnimationId}
            metaspriteId={selectedMetaspriteId}
          />
          {frames.map((frameId) => (
            <MetaspriteEditor
              key={frameId}
              spriteSheetId={viewSpriteId}
              metaspriteId={frameId}
              animationId={selectedAnimation?.id || ""}
              spriteStateId={selectedStateId}
              hidden={frameId !== selectedMetaspriteId}
            />
          ))}

          <MetaspriteEditorPreviewSettings
            spriteSheetId={viewSpriteId}
            metaspriteId={selectedMetaspriteId}
          />
        </div>
        <SplitPaneVerticalDivider onMouseDown={onResizeCenter} />
        <div style={{ position: "relative", height: centerPaneHeight }}>
          <SplitPaneHeader
            onToggle={toggleTilesPane}
            collapsed={centerPaneHeight === 30}
            buttons={
              centerPaneHeight > 30 && (
                <>
                  <Button
                    size="small"
                    variant={
                      precisionTileMode || tmpPrecisionMode
                        ? "primary"
                        : "transparent"
                    }
                    onClick={onTogglePrecisionTiles}
                    title={`${l10n("FIELD_PRECISION_SELECTION")}${
                      precisionTileMode ? ` (${l10n("FIELD_ENABLED")})` : ""
                    }`}
                  >
                    <PrecisionIcon />
                  </Button>
                  <FixedSpacer width={5} />
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
                </>
              )
            }
          >
            {l10n("FIELD_TILES")}
          </SplitPaneHeader>
          <SpriteTilePalette
            id={viewSpriteId}
            precisionMode={precisionTileMode || tmpPrecisionMode}
          />
        </div>
        <SplitPaneVerticalDivider />
        <SplitPaneHeader
          onToggle={toggleAnimationsPane}
          collapsed={!animationsOpen}
        >
          {l10n("FIELD_FRAMES")}
          {selectedState &&
            `: ${getAnimationNameById(
              selectedState.animationType,
              selectedState.flipLeft,
              selectedAnimationId,
              selectedState.animations,
            )}`}
        </SplitPaneHeader>
        {animationsOpen && (
          <SpriteAnimationTimeline
            spriteSheetId={viewSpriteId}
            animationId={selectedAnimation?.id || ""}
            metaspriteId={selectedMetaspriteId}
            additionalMetaspriteIds={selectedAdditionalMetaspriteIds}
          />
        )}
      </div>
      <SplitPaneHorizontalDivider onMouseDown={onResizeRight} />
      <div
        style={{
          width: rightPaneWidth,
          background: themeContext?.colors.sidebar.background,
          height: "100%",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <SpriteInspector
          id={viewSpriteId}
          metaspriteId={selectedMetaspriteId}
          spriteStateId={selectedStateId}
          animationId={selectedAnimation?.id || ""}
        />
      </div>
    </Wrapper>
  );
};

export default SpritesPage;

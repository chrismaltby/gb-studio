import React, { useCallback, useContext, useEffect, useRef } from "react";
import styled, { ThemeContext } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import debounce from "lodash/debounce";
import useResizable from "ui/hooks/use-resizable";
import useWindowSize from "ui/hooks/use-window-size";
import { SplitPaneHorizontalDivider } from "ui/splitpane/SplitPaneDivider";
import { RootState } from "store/configureStore";
import editorActions from "store/features/editor/editorActions";
import { backgroundSelectors } from "store/features/entities/entitiesState";
import { NavigatorBackgrounds } from "components/backgrounds/NavigatorBackgrounds";
import BackgroundViewer from "components/backgrounds/BackgroundViewer";
import { Button } from "ui/buttons/Button";
import BackgroundPreviewSettings from "components/backgrounds/BackgroundPreviewSettings";
import electronActions from "store/features/electron/electronActions";
import _l10n from "lib/helpers/_l10n";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const EditButtonWrapper = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
`;

const ImagesPage = () => {
  const dispatch = useDispatch();
  const themeContext = useContext(ThemeContext);
  const selectedId = useSelector((state: RootState) => state.navigation.id);
  const navigatorSidebarWidth = useSelector(
    (state: RootState) => state.editor.navigatorSidebarWidth
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const windowSize = useWindowSize();
  const prevWindowWidthRef = useRef<number>(0);
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  const minCenterPaneWidth = 0;

  const colorsEnabled = useSelector(
    (state: RootState) => state.project.present.settings.customColorsEnabled
  );

  const allBackgrounds = useSelector((state: RootState) =>
    backgroundSelectors.selectAll(state)
  );

  const background =
    useSelector((state: RootState) =>
      backgroundSelectors.selectById(state, selectedId)
    ) || allBackgrounds[0];

  const [leftPaneWidth, setLeftPaneSize, startLeftPaneResize] = useResizable({
    initialSize: navigatorSidebarWidth,
    direction: "right",
    minSize: 50,
    maxSize: Math.max(101, windowWidth - minCenterPaneWidth - 200),
    onResizeComplete: (v) => {
      if (v < 200) {
        setLeftPaneSize(200);
      }
    },
  });

  useEffect(() => {
    prevWindowWidthRef.current = windowWidth;
  });
  const prevWidth = prevWindowWidthRef.current;

  useEffect(() => {
    if (windowWidth !== prevWidth) {
      const panelsTotalWidth = leftPaneWidth + minCenterPaneWidth;
      const widthOverflow = panelsTotalWidth - windowWidth;
      if (widthOverflow > 0) {
        setLeftPaneSize(leftPaneWidth - 0.5 * widthOverflow);
      }
    }
  }, [windowWidth, prevWidth, leftPaneWidth, setLeftPaneSize]);

  const debouncedStoreWidths = useRef(
    debounce((leftPaneWidth: number) => {
      dispatch(editorActions.resizeNavigatorSidebar(leftPaneWidth));
    }, 100)
  );

  useEffect(() => debouncedStoreWidths.current(leftPaneWidth), [leftPaneWidth]);

  const onEdit = useCallback(() => {
    if (background) {
      dispatch(
        electronActions.openFile({
          filename: `${projectRoot}/assets/backgrounds/${background.filename}`,
          type: "image",
        })
      );
    }
  }, [background, dispatch, projectRoot]);

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
          <NavigatorBackgrounds
            height={windowHeight - 38}
            selectedId={background?.id || ""}
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
          {colorsEnabled && <BackgroundPreviewSettings />}
          <BackgroundViewer backgroundId={background?.id || ""} />
          <EditButtonWrapper>
            <Button onClick={onEdit}>{_l10n("ASSET_EDIT")}</Button>
          </EditButtonWrapper>
        </div>
      </div>
    </Wrapper>
  );
};

export default ImagesPage;

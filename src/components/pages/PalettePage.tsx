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
import useResizable from "ui/hooks/use-resizable";
import useWindowSize from "ui/hooks/use-window-size";
import { SplitPaneHorizontalDivider } from "ui/splitpane/SplitPaneDivider";
import { RootState } from "store/configureStore";
import editorActions from "store/features/editor/editorActions";
import { paletteSelectors } from "store/features/entities/entitiesState";
import l10n from "lib/helpers/l10n";
import { Button } from "ui/buttons/Button";
import CustomPalettePicker from "components/forms/CustomPalettePicker";
import { NavigatorPalettes } from "components/palettes/NavigatorPalettes";
import PageHeader from "components/library/PageHeader";
import entitiesActions from "store/features/entities/entitiesActions";
import castEventValue from "lib/helpers/castEventValue";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const PalettePage = () => {
  const dispatch = useDispatch();
  const themeContext = useContext(ThemeContext);
  const selectedId = useSelector((state: RootState) => state.navigation.id);
  const navigatorSidebarWidth = useSelector(
    (state: RootState) => state.editor.navigatorSidebarWidth
  );
  const windowSize = useWindowSize();
  const prevWindowWidthRef = useRef<number>(0);
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  const minCenterPaneWidth = 0;
  const [edit, setEdit] = useState(false);

  const allPalettes = useSelector((state: RootState) =>
    paletteSelectors.selectAll(state)
  );

  const palette =
    useSelector((state: RootState) =>
      paletteSelectors.selectById(state, selectedId)
    ) || allPalettes[0];

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

  const onStartEdit = useCallback(() => {
    setEdit(true);
  }, []);

  const onFinishEdit = () => {
    if (!palette.name) {
      dispatch(
        entitiesActions.editPalette({
          paletteId: palette.id,
          changes: {
            name: "Palette",
          },
        })
      );
    }
    setEdit(false);
  };

  const checkForFinishEdit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onFinishEdit();
    }
  };

  const onEditName = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(
      entitiesActions.editPalette({
        paletteId: palette.id,
        changes: {
          name: castEventValue(e),
        },
      })
    );
  };

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
          <NavigatorPalettes
            height={windowHeight - 38}
            selectedId={palette?.id || ""}
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
        <PageHeader>
          {palette ? (
            <h1>
              {edit ? (
                <input
                  maxLength={25}
                  value={palette.name}
                  onChange={onEditName}
                  onKeyDown={checkForFinishEdit}
                  onBlur={onFinishEdit}
                  autoFocus
                />
              ) : (
                palette.name
              )}{" "}
              {!palette.defaultColors && !edit && (
                <Button
                  key="edit"
                  onClick={onStartEdit}
                  size="small"
                  variant="transparent"
                >
                  {l10n("FIELD_RENAME")}
                </Button>
              )}
            </h1>
          ) : (
            <h1>No palette selected</h1>
          )}
        </PageHeader>
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            position: "relative",
            justifyContent: "center",
            padding: "0 40px",
          }}
        >
          <CustomPalettePicker paletteId={palette.id} />
        </div>
      </div>
    </Wrapper>
  );
};

export default PalettePage;

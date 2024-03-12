import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import debounce from "lodash/debounce";
import useResizable from "ui/hooks/use-resizable";
import useWindowSize from "ui/hooks/use-window-size";
import { SplitPaneHorizontalDivider } from "ui/splitpane/SplitPaneDivider";
import { RootState } from "store/configureStore";
import editorActions from "store/features/editor/editorActions";
import { paletteSelectors } from "store/features/entities/entitiesState";
import l10n from "shared/lib/lang/l10n";
import { Button } from "ui/buttons/Button";
import CustomPalettePicker from "components/forms/CustomPalettePicker";
import { NavigatorPalettes } from "components/palettes/NavigatorPalettes";
import entitiesActions from "store/features/entities/entitiesActions";
import { Input } from "ui/form/Input";

const Wrapper = styled.div`
  display: flex;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  height: 100px;
  align-items: center;
  margin-bottom: 30px;

  h1 {
    margin-right: 10px;
  }
`;

const Sidebar = styled.div`
  background: ${(props) => props.theme.colors.sidebar.background};
  overflow: hidden;
  position: relative;
`;

const SidebarContent = styled.div`
  min-width: 200px;
  position: relative;
  width: 100%;
  height: 100%;
`;

const Document = styled.div`
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  background: ${(props) => props.theme.colors.document.background};
  color: ${(props) => props.theme.colors.text};
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Container = styled.div`
  display: flex;
  flex-grow: 1;
  position: relative;
  padding: 20px 40px;
  max-width: 1000px;
  min-width: 500px;
  width: 100%;
  flex-direction: column;
  box-sizing: border-box;
`;

const PalettePage = () => {
  const dispatch = useDispatch();
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
    if (!palette) {
      return;
    }
    if (!palette?.name) {
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
    if (!palette) {
      return;
    }
    dispatch(
      entitiesActions.editPalette({
        paletteId: palette.id,
        changes: {
          name: e.currentTarget.value,
        },
      })
    );
  };

  return (
    <Wrapper>
      <Sidebar
        style={{
          width: Math.max(200, leftPaneWidth),
        }}
      >
        <SidebarContent>
          <NavigatorPalettes
            height={windowHeight - 38}
            selectedId={palette?.id || ""}
          />
        </SidebarContent>
      </Sidebar>
      <SplitPaneHorizontalDivider onMouseDown={startLeftPaneResize} />
      <Document>
        <Container>
          <Header>
            {palette && (
              <>
                {edit ? (
                  <Input
                    displaySize="large"
                    maxLength={25}
                    value={palette.name}
                    onChange={onEditName}
                    onKeyDown={checkForFinishEdit}
                    onBlur={onFinishEdit}
                    autoFocus
                  />
                ) : (
                  <h1>{palette.name}</h1>
                )}
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
              </>
            )}
          </Header>
          {palette && <CustomPalettePicker paletteId={palette.id} />}
        </Container>
      </Document>
    </Wrapper>
  );
};

export default PalettePage;

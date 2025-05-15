import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getSettings } from "store/features/settings/settingsState";
import settingsActions from "store/features/settings/settingsActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import styled, { ThemeContext } from "styled-components";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { decHexVal } from "shared/lib/helpers/8bit";
import l10n from "shared/lib/lang/l10n";
import { DataLabel, DataRow } from "components/debugger/DebuggerState";

const Content = styled.div`
  background: ${(props) => props.theme.colors.scripting.form.background};
  padding: 10px;
  max-width: 256px;
`;

const VramPreview = styled.div`
  position: relative;
  max-height: 240px;
`;

const Canvas = styled.canvas`
  position: absolute;
  top: 0px;
  left: 0px;
  width: 256px;
  height: 256px;
  border-radius: 4px;
  image-rendering: pixelated;
`;

const TileAddr = styled.span`
  font-family: monospace;
`;

const VramAreaLabel = styled.span`
  opacity: 0.5;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const DebuggerVRAMPane = () => {
  const dispatch = useAppDispatch();
  const vramPreview = useAppSelector((state) => state.debug.vramPreview);
  const isCollapsed = useAppSelector((state) =>
    getSettings(state).debuggerCollapsedPanes.includes("vram")
  );
  const themeContext = useContext(ThemeContext);

  const onToggleCollapsed = useCallback(() => {
    dispatch(settingsActions.toggleDebuggerPaneCollapsed("vram"));
  }, [dispatch]);
  const [position, setPosition] = useState([-1, -1]);
  const [index, setIndex] = useState(0);
  const [bank, setBank] = useState(0);
  const [vramArea, setVramArea] = useState(l10n("NAV_SPRITES"));

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    if (!themeContext) {
      return;
    }

    const drawWidth = canvas.width;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const ctx = canvas.getContext("2d");

    const tileSize = drawWidth / 32;

    // eslint-disable-next-line no-self-assign
    canvas.width = canvas.width;
    // eslint-disable-next-line no-self-assign
    canvas.height = canvas.height;

    const highlightColor = themeContext.colors.highlight;

    const drawGrid = () => {
      if (ctx) {
        // Draw grid
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0, 0, 0, .1)";
        ctx.lineWidth = scaleX;

        ctx.moveTo(tileSize * 16 - 1, 0);
        ctx.lineTo(tileSize * 16 - 1, 24 * tileSize);

        ctx.moveTo(0, tileSize * 8 - 1);
        ctx.lineTo(canvas.width, tileSize * 8 - 1);

        ctx.moveTo(0, tileSize * 12 - 1);
        ctx.lineTo(canvas.width, tileSize * 12 - 1);

        ctx.moveTo(0, tileSize * 16 - 1);
        ctx.lineTo(canvas.width, tileSize * 16 - 1);
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = highlightColor;
        ctx.strokeRect(
          position[0] * tileSize - 1,
          position[1] * tileSize - 1,
          tileSize,
          tileSize
        );

        ctx.stroke();
      }
    };

    drawGrid();

    const handleMouseMove = (e: MouseEvent) => {
      if (e.target !== canvasRef.current) {
        return;
      }

      if (ctx) {
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        const i = Math.floor(x / 16);
        const j = Math.floor(y / 16);

        if (i >= 0 && j >= 0) {
          let index = j * 16 + (i % 16);

          const bank = i < 16 ? 0 : 1;

          let vramArea = "";
          if (j < 8) {
            vramArea = l10n("NAV_SPRITES");
          } else if (j < 12) {
            vramArea = l10n("FIELD_SHARED");
          } else if (j < 16) {
            vramArea = l10n("MENU_UI_ELEMENTS");
          } else if (j < 24) {
            vramArea = l10n("FIELD_BACKGROUND");
            index = index - 256;
          }

          if (j < 24) {
            setPosition([i, j]);
            setIndex(index);
            setBank(bank);
            setVramArea(vramArea);
          }
        }
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  });

  return (
    <>
      <SplitPaneHeader
        onToggle={onToggleCollapsed}
        collapsed={isCollapsed}
        variant="secondary"
      >
        VRAM
      </SplitPaneHeader>
      {!isCollapsed && (
        <>
          <Content>
            <VramPreview>
              <img src={vramPreview} alt=""></img>
              <Canvas ref={canvasRef} width={512} height={512} />
            </VramPreview>
            <DataRow>
              <DataLabel>{l10n("FIELD_TILE_INDEX")}:</DataLabel>
              <TileAddr>
                {String(index).padStart(3, "0")} (${decHexVal(index)})
              </TileAddr>
            </DataRow>
            <DataRow>
              <DataLabel>{l10n("FIELD_MEMORY_BANK")}:</DataLabel>
              <TileAddr>{bank}</TileAddr>
            </DataRow>
            <DataRow>
              <VramAreaLabel>{vramArea}</VramAreaLabel>
            </DataRow>
          </Content>
        </>
      )}
    </>
  );
};

export default DebuggerVRAMPane;

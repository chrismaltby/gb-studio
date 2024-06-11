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

const Content = styled.div`
  position: relative;
  background: ${(props) => props.theme.colors.scripting.form.background};
  padding: 10px;
  max-width: 256px;
`;

const Canvas = styled.canvas`
  position: absolute;
  top: 10px;
  left: 10px;
  width: 256px;
  height: 256px;
  border-radius: 4px;
  image-rendering: pixelated;
`;

const TileInfo = styled.div`
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 12px;
  display: flex;
  flex-direction: row;
`;

const Label = styled.span`
  font-weight: bold;
  padding-right: 5px;
`;

const VramAreaLabel = styled.span`
  opacity: 0.5;
`;

const Gap = styled.span`
  flex-grow: 1;
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
  const [vramArea, setVramArea] = useState("");

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
    const drawHeight = canvas.height;
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
        // ctx.fillStyle = "#000";
        // ctx.fillRect(0, 0, canvas.width, canvas.height);

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
            vramArea = "Sprites";
          } else if (j < 12) {
            vramArea = "Shared";
          } else if (j < 16) {
            vramArea = "UI";
          } else if (j < 24) {
            vramArea = "Background";
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
            <img src={vramPreview} alt=""></img>
            <Canvas ref={canvasRef} width="512px" height="512px" />
            <TileInfo>
              <Label>Tile index:</Label>
              <span>
                {index} (${decHexVal(index)}) @ Bank {bank}
              </span>
              <Gap></Gap>
              <VramAreaLabel>{vramArea}</VramAreaLabel>
            </TileInfo>
          </Content>
        </>
      )}
    </>
  );
};

export default DebuggerVRAMPane;

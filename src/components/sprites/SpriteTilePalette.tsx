import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { assetFilename } from "lib/helpers/gbstudio";
import { RootState } from "store/configureStore";
import { SpriteTileSelection } from "store/features/editor/editorState";
import { spriteSheetSelectors } from "store/features/entities/entitiesState";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { roundDown8 } from "lib/helpers/8bit";
import styled from "styled-components";
import l10n from "lib/helpers/l10n";
import electronActions from "store/features/electron/electronActions";

const PillWrapper = styled.div`
  position: absolute;
  display: flex;
  align-items: center;
  bottom: 10px;
  left: 10px;
  z-index: 11;
  border-radius: 16px;
  background: ${(props) => props.theme.colors.document.background};
  box-shadow: 0 0 0 2px ${(props) => props.theme.colors.document.background};
  font-size: ${(props) => props.theme.typography.fontSize};
`;

const Pill = styled.button`
  color: ${(props) => props.theme.colors.button.text};
  background: ${(props) => props.theme.colors.list.activeBackground};
  border: 0px;
  border-radius: 16px;
  padding: 3px 10px;
  font-size: ${(props) => props.theme.typography.fontSize};

  :active {
    background: ${(props) => props.theme.colors.list.selectedBackground};
  }
`;

interface SpriteTilePaletteProps {
  id: string;
  precisionMode: boolean;
}

interface Coordinates {
  x: number;
  y: number;
}

const SpriteTilePalette = ({ id, precisionMode }: SpriteTilePaletteProps) => {
  const dispatch = useDispatch();
  const zoom =
    useSelector((state: RootState) => state.editor.zoomSpriteTiles) / 100;
  const selectedTiles = useSelector(
    (state: RootState) => state.editor.spriteTileSelection
  );

  const setSelectedTiles = useCallback(
    (tiles: SpriteTileSelection) => {
      dispatch(editorActions.setSpriteTileSelection(tiles));
    },
    [dispatch]
  );
  const [hoverTile, setHoverTile] = useState<Coordinates | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const spriteSheet = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, id)
  );
  const selectedTileIds = useSelector(
    (state: RootState) => state.editor.selectedMetaspriteTileIds
  );
  const replaceSpriteTileMode = useSelector(
    (state: RootState) => state.editor.replaceSpriteTileMode
  );
  const projectRoot = useSelector((state: RootState) => state.document.root);
  const width = spriteSheet?.width || 0;
  const height = spriteSheet?.height || 0;

  const snapX = useCallback(
    (offsetX: number): number => {
      return Math.min(
        width - 8,
        Math.max(0, precisionMode ? offsetX - 4 : roundDown8(offsetX))
      );
    },
    [precisionMode, width]
  );

  const snapY = useCallback(
    (offsetY: number): number => {
      return Math.min(
        height - 16,
        Math.max(0, precisionMode ? offsetY - 8 : roundDown8(offsetY))
      );
    },
    [precisionMode, height]
  );

  const onReplace = useCallback(
    (sliceX: number, sliceY: number) => {
      dispatch(
        entitiesActions.editMetaspriteTile({
          spriteSheetId: id,
          metaspriteTileId: selectedTileIds[0],
          changes: {
            sliceX,
            sliceY,
          },
        })
      );
      dispatch(editorActions.setReplaceSpriteTileMode(false));
    },
    [dispatch, id, selectedTileIds]
  );

  const onDragStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      e.preventDefault();

      const currentTargetRect = e.currentTarget.getBoundingClientRect();

      const offsetX = Math.floor((e.pageX - currentTargetRect.left) / zoom);
      const offsetY = Math.floor((e.pageY - currentTargetRect.top) / zoom);

      if (replaceSpriteTileMode && selectedTileIds[0]) {
        onReplace(snapX(offsetX), snapY(offsetY));
        return;
      }

      setSelectedTiles({
        x: snapX(offsetX),
        y: snapY(offsetY),
        width: 1,
        height: 1,
      });
      setIsDragging(true);
    },
    [
      onReplace,
      replaceSpriteTileMode,
      selectedTileIds,
      setSelectedTiles,
      snapX,
      snapY,
      zoom,
    ]
  );

  const onDrag = useCallback(
    (e: MouseEvent) => {
      if (!wrapperRef.current || !selectedTiles) {
        return;
      }
      const currentTargetRect = wrapperRef.current.getBoundingClientRect();

      const offsetX = Math.floor((e.pageX - currentTargetRect.left) / zoom);
      const offsetY = Math.floor((e.pageY - currentTargetRect.top) / zoom);

      const x = Math.min(selectedTiles.x, offsetX);
      const y = Math.min(selectedTiles.y, offsetY);

      const selectionWidth = Math.ceil(
        Math.max(
          8,
          offsetX < selectedTiles.x ? 1 : offsetX - selectedTiles.x + 1
        ) / 8
      );
      const selectionHeight = Math.ceil(
        Math.max(
          8,
          offsetY < selectedTiles.y ? 2 : offsetY - selectedTiles.y + 1
        ) / 16
      );

      setSelectedTiles({
        x: snapX(precisionMode ? offsetX : x),
        y: snapY(precisionMode ? offsetY : y),
        width: precisionMode ? 1 : selectionWidth,
        height: precisionMode ? 1 : selectionHeight,
      });
    },
    [selectedTiles, zoom, setSelectedTiles, snapX, snapY, precisionMode]
  );

  const onDragEnd = (_e: MouseEvent) => {
    setIsDragging(false);
    setHoverTile(undefined);
  };

  const onHover = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const currentTargetRect = e.currentTarget.getBoundingClientRect();
      const offsetX = Math.floor((e.pageX - currentTargetRect.left) / zoom);
      const offsetY = Math.floor((e.pageY - currentTargetRect.top) / zoom);
      setHoverTile({
        x: snapX(offsetX),
        y: snapY(offsetY),
      });
    },
    [zoom, snapX, snapY]
  );

  const onMouseOut = useCallback(() => {
    setHoverTile(undefined);
  }, []);

  // Drag and drop handlers
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onDrag);
      window.addEventListener("mouseup", onDragEnd);
      return () => {
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", onDragEnd);
      };
    }
    return () => {};
  }, [isDragging, onDrag]);

  const onEdit = useCallback(() => {
    if (spriteSheet) {
      dispatch(
        electronActions.openFile({
          filename: `${projectRoot}/assets/sprites/${spriteSheet.filename}`,
          type: "image",
        })
      );
    }
  }, [spriteSheet, dispatch, projectRoot]);

  if (!spriteSheet) {
    return null;
  }

  const filename = `file://${assetFilename(
    projectRoot,
    "sprites",
    spriteSheet
  )}?_v=${spriteSheet._v}`;

  return (
    <div
      style={{
        position: "absolute",
        top: 32,
        left: 0,
        right: 0,
        bottom: 0,
        overflowX: "auto",
        overflowY: "scroll",
        minWidth: 0,
      }}
    >
      <PillWrapper>
        <Pill onClick={onEdit}>{l10n("FIELD_EDIT_IMAGE")}</Pill>
      </PillWrapper>

      <div
        style={{
          display: "flex",
          width: "100%",
          minHeight: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            textAlign: "center",
            padding: 10,
          }}
        >
          <div
            ref={wrapperRef}
            style={{
              position: "relative",
              userSelect: "none",
              display: "inline-block",
            }}
            onMouseDown={onDragStart}
            onMouseMove={onHover}
            onMouseLeave={onMouseOut}
          >
            <img
              style={{
                imageRendering: "pixelated",
                minWidth: width * zoom,
              }}
              alt={spriteSheet.name}
              src={filename}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: width * zoom,
                height: height * zoom,
                border: `${1 / zoom}px solid #d4d4d4`,
                backgroundSize: `${8 * zoom}px ${8 * zoom}px`,
                backgroundImage:
                  zoom >= 8
                    ? `linear-gradient(to right, 
          #079f1c 1px, transparent 1px, transparent 7px, #efefef 8px, transparent 8px, transparent 15px, #efefef 16px, transparent 16px, transparent 23px, #efefef 24px, transparent 24px, transparent 31px, #efefef 32px, transparent 32px, transparent 39px, #efefef 40px, transparent 40px, transparent 47px, #efefef 48px, transparent 48px, transparent 55px, #efefef 56px, transparent 56px
          ), linear-gradient(to bottom, 
          #079f1c 1px, transparent 1px, transparent 7px, #efefef 8px, transparent 8px, transparent 15px, #efefef 16px, transparent 16px, transparent 23px, #efefef 24px, transparent 24px, transparent 31px, #efefef 32px, transparent 32px, transparent 39px, #efefef 40px, transparent 40px, transparent 47px, #efefef 48px, transparent 48px, transparent 55px, #efefef 56px, transparent 56px
          )`
                    : "linear-gradient(to right, rgba(0,220,0,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,220,0,0.5) 1px, transparent 1px)",
              }}
            />
            {hoverTile && !isDragging && (
              <div
                style={{
                  position: "absolute",
                  left: hoverTile.x * zoom,
                  top: hoverTile.y * zoom,
                  width: 8 * zoom,
                  height: 16 * zoom,
                  background: "rgba(0,0,0,0.1)",
                }}
              />
            )}
            {selectedTiles && (
              <div
                style={{
                  position: "absolute",
                  left: selectedTiles.x * zoom,
                  top: selectedTiles.y * zoom,
                  width: selectedTiles.width * 8 * zoom,
                  height: selectedTiles.height * 16 * zoom,
                  boxShadow: `0px 0px 0px ${zoom}px rgba(255, 0, 0, 0.5)`,
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpriteTilePalette;

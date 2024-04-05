import React, { useCallback, useState } from "react";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { EditableText } from "ui/form/EditableText";
import {
  FormContainer,
  FormDivider,
  FormField,
  FormFieldInfo,
  FormHeader,
  FormRow,
  FormSectionTitle,
} from "ui/form/FormLayout";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import l10n from "shared/lib/lang/l10n";
import { Sidebar, SidebarColumn } from "ui/sidebars/Sidebar";
import {
  MetaspriteTile,
  ObjPalette,
  SpriteAnimationType,
  SpriteSheet,
  SpriteState,
} from "shared/lib/entities/entitiesTypes";
import { CoordinateInput } from "ui/form/CoordinateInput";
import { Label } from "ui/form/Label";
import {
  metaspriteTileSelectors,
  spriteAnimationSelectors,
  spriteSheetSelectors,
  spriteStateSelectors,
} from "store/features/entities/entitiesState";
import entitiesActions from "store/features/entities/entitiesActions";
import editorActions from "store/features/editor/editorActions";
import spriteActions from "store/features/sprite/spriteActions";
import clipboardActions from "store/features/clipboard/clipboardActions";
import {
  castEventToBool,
  castEventToInt,
} from "renderer/lib/helpers/castEventValue";
import { Button } from "ui/buttons/Button";
import {
  FlipHorizontalIcon,
  FlipVerticalIcon,
  SendToFrontIcon,
  SendToBackIcon,
} from "ui/icons/Icons";
import { FlexGrow } from "ui/spacing/Spacing";
import { SidebarHeader } from "ui/form/SidebarHeader";
import {
  ClipboardTypeMetasprites,
  ClipboardTypeMetaspriteTiles,
  ClipboardTypeSpriteState,
} from "store/features/clipboard/clipboardTypes";
import { CheckboxField } from "ui/form/CheckboxField";
import { AnimationTypeSelect } from "components/forms/AnimationTypeSelect";
import { ObjPaletteSelect } from "components/forms/ObjPaletteSelect";
import { PaletteIndexSelect } from "components/forms/PaletteIndexSelect";
import AnimationStateSelect from "components/forms/AnimationStateSelect";
import { SpriteSymbolsEditor } from "components/forms/symbols/SpriteSymbolsEditor";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface SpriteEditorProps {
  id: string;
  metaspriteId: string;
  spriteStateId: string;
  animationId: string;
}

export const SpriteEditor = ({
  id,
  metaspriteId,
  animationId,
  spriteStateId,
}: SpriteEditorProps) => {
  const colorsEnabled = useAppSelector(
    (state) => state.project.present.settings.colorMode !== "mono"
  );
  const sprite = useAppSelector((state) =>
    spriteSheetSelectors.selectById(state, id)
  );
  const spriteState = useAppSelector((state) =>
    spriteStateSelectors.selectById(state, spriteStateId)
  );
  const animation = useAppSelector((state) =>
    spriteAnimationSelectors.selectById(state, animationId)
  );
  const selectedTileIds = useAppSelector(
    (state) => state.editor.selectedMetaspriteTileIds
  );
  const metaspriteTile = useAppSelector((state) =>
    metaspriteTileSelectors.selectById(state, selectedTileIds[0])
  );
  const clipboardFormat = useAppSelector(
    (state) => state.clipboard.data?.format
  );
  const replaceSpriteTileMode = useAppSelector(
    (state) => state.editor.replaceSpriteTileMode
  );

  const selectedTileId = selectedTileIds[0];

  const [showSymbols, setShowSymbols] = useState(false);

  const dispatch = useAppDispatch();

  const selectSidebar = () => {};

  const onChangeSpriteSheetProp = useCallback(
    <K extends keyof SpriteSheet>(key: K, value: SpriteSheet[K]) => {
      dispatch(
        entitiesActions.editSpriteSheet({
          spriteSheetId: id,
          changes: {
            [key]: value,
          },
        })
      );
    },
    [dispatch, id]
  );

  const onChangeSpriteStateProp = useCallback(
    <T extends keyof SpriteState>(key: T, value: SpriteState[T]) => {
      dispatch(
        entitiesActions.editSpriteState({
          spriteStateId,
          changes: {
            [key]: value,
          },
        })
      );
    },
    [dispatch, spriteStateId]
  );

  const onChangeMultipleTilesProp = useCallback(
    <T extends keyof MetaspriteTile>(key: T, value: MetaspriteTile[T]) => {
      dispatch(
        entitiesActions.editMetaspriteTiles({
          spriteSheetId: id,
          metaspriteTileIds: selectedTileIds,
          changes: {
            [key]: value,
          },
        })
      );
    },
    [dispatch, id, selectedTileIds]
  );

  const onChangeTileProp = useCallback(
    <T extends keyof MetaspriteTile>(key: T, value: MetaspriteTile[T]) => {
      dispatch(
        entitiesActions.editMetaspriteTile({
          spriteSheetId: id,
          metaspriteTileId: selectedTileId,
          changes: {
            [key]: value,
          },
        })
      );
    },
    [dispatch, id, selectedTileId]
  );

  const onChangeName = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSpriteSheetProp("name", e.currentTarget.value),
    [onChangeSpriteSheetProp]
  );

  const onChangeCanvasWidth = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSpriteSheetProp("canvasWidth", castEventToInt(e, 16)),
    [onChangeSpriteSheetProp]
  );

  const onChangeCanvasHeight = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSpriteSheetProp("canvasHeight", castEventToInt(e, 16)),
    [onChangeSpriteSheetProp]
  );

  const onChangeBoundsX = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSpriteSheetProp("boundsX", castEventToInt(e, 0)),
    [onChangeSpriteSheetProp]
  );

  const onChangeBoundsY = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSpriteSheetProp("boundsY", castEventToInt(e, 0)),
    [onChangeSpriteSheetProp]
  );

  const onChangeBoundsWidth = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSpriteSheetProp("boundsWidth", castEventToInt(e, 16)),
    [onChangeSpriteSheetProp]
  );

  const onChangeBoundsHeight = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSpriteSheetProp("boundsHeight", castEventToInt(e, 16)),
    [onChangeSpriteSheetProp]
  );

  const onChangeStateName = useCallback(
    (e: string) => onChangeSpriteStateProp("name", e),
    [onChangeSpriteStateProp]
  );

  const onChangeStateAnimationType = useCallback(
    (e: SpriteAnimationType) => onChangeSpriteStateProp("animationType", e),
    [onChangeSpriteStateProp]
  );

  const onChangeStateFlipLeft = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeSpriteStateProp("flipLeft", castEventToBool(e)),
    [onChangeSpriteStateProp]
  );

  const onChangeTileX = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTileProp("x", castEventToInt(e, 0)),
    [onChangeTileProp]
  );

  const onChangeTileY = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeTileProp("y", castEventToInt(e, 0)),
    [onChangeTileProp]
  );

  const onChangeTilesObjPalette = useCallback(
    (e: ObjPalette) => onChangeMultipleTilesProp("objPalette", e),
    [onChangeMultipleTilesProp]
  );

  const onChangeTilesPaletteIndex = useCallback(
    (e: number) => onChangeMultipleTilesProp("paletteIndex", e),
    [onChangeMultipleTilesProp]
  );

  const onChangeTilesPriority = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChangeMultipleTilesProp("priority", castEventToBool(e)),
    [onChangeMultipleTilesProp]
  );

  const onToggleFlipX = useCallback(() => {
    dispatch(
      entitiesActions.flipXMetaspriteTiles({
        spriteSheetId: id,
        metaspriteTileIds: selectedTileIds,
      })
    );
  }, [dispatch, id, selectedTileIds]);

  const onToggleFlipY = useCallback(() => {
    dispatch(
      entitiesActions.flipYMetaspriteTiles({
        spriteSheetId: id,
        metaspriteTileIds: selectedTileIds,
      })
    );
  }, [dispatch, id, selectedTileIds]);

  const sendTileToBack = useCallback(() => {
    dispatch(
      entitiesActions.sendMetaspriteTilesToBack({
        spriteSheetId: id,
        metaspriteTileIds: selectedTileIds,
        metaspriteId: metaspriteId,
      })
    );
  }, [dispatch, id, selectedTileIds, metaspriteId]);

  const sendTileToFront = useCallback(() => {
    dispatch(
      entitiesActions.sendMetaspriteTilesToFront({
        spriteSheetId: id,
        metaspriteTileIds: selectedTileIds,
        metaspriteId: metaspriteId,
      })
    );
  }, [dispatch, id, selectedTileIds, metaspriteId]);

  const showBoundingBox = useCallback(() => {
    dispatch(editorActions.setShowSpriteBoundingBox(true));
  }, [dispatch]);

  const hideBoundingBox = useCallback(() => {
    dispatch(editorActions.setShowSpriteBoundingBox(false));
  }, [dispatch]);

  const onCopyTiles = useCallback(() => {
    dispatch(
      clipboardActions.copyMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
      })
    );
  }, [dispatch, selectedTileIds]);

  const onCopyMetasprite = useCallback(() => {
    dispatch(
      clipboardActions.copyMetasprites({
        metaspriteIds: [metaspriteId],
      })
    );
  }, [dispatch, metaspriteId]);

  const onCopySpriteState = useCallback(() => {
    dispatch(
      clipboardActions.copySpriteState({
        spriteStateId,
      })
    );
  }, [dispatch, spriteStateId]);

  const onPaste = useCallback(() => {
    dispatch(
      clipboardActions.pasteSprite({
        spriteSheetId: id,
        metaspriteId,
        spriteAnimationId: animationId,
        spriteStateId,
      })
    );
  }, [dispatch, id, metaspriteId, animationId, spriteStateId]);

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, [dispatch]);

  const onRemoveSelectedTiles = useCallback(() => {
    dispatch(
      entitiesActions.removeMetaspriteTiles({
        spriteSheetId: id,
        metaspriteTileIds: selectedTileIds,
        metaspriteId,
      })
    );
  }, [dispatch, id, selectedTileIds, metaspriteId]);

  const onRemoveMetasprite = useCallback(() => {
    dispatch(
      entitiesActions.removeMetasprite({
        spriteSheetId: id,
        metaspriteId,
        spriteAnimationId: animationId,
      })
    );
  }, [dispatch, id, metaspriteId, animationId]);

  const onRemoveSpriteState = useCallback(() => {
    dispatch(
      entitiesActions.removeSpriteState({
        spriteSheetId: id,
        spriteStateId,
      })
    );
  }, [dispatch, id, spriteStateId]);

  const toggleReplaceMode = useCallback(() => {
    dispatch(editorActions.setReplaceSpriteTileMode(!replaceSpriteTileMode));
  }, [dispatch, replaceSpriteTileMode]);

  const onAutoDetect = useCallback(() => {
    dispatch(
      spriteActions.detectSprite({
        spriteSheetId: id,
      })
    );
  }, [dispatch, id]);

  if (!sprite || !spriteState || !animation) {
    return null;
  }

  const isDefaultState = sprite.states.indexOf(spriteStateId) === 0;
  const showAutodetect = isDefaultState && sprite.height === 16;

  return (
    <Sidebar onClick={selectSidebar}>
      <SidebarColumn>
        <FormContainer>
          <FormHeader>
            {metaspriteTile && selectedTileIds.length === 1 && (
              <SidebarHeader>{l10n("FIELD_SPRITE_TILE")}</SidebarHeader>
            )}
            {metaspriteTile && selectedTileIds.length > 1 && (
              <SidebarHeader>{l10n("FIELD_SPRITE_TILES")}</SidebarHeader>
            )}
            {!metaspriteTile && (
              <EditableText
                name="name"
                placeholder="Sprite"
                value={sprite?.name || ""}
                onChange={onChangeName}
              />
            )}
            <DropdownButton
              size="small"
              variant="transparent"
              menuDirection="right"
              onMouseDown={onFetchClipboard}
            >
              {!metaspriteTile && !showSymbols && (
                <MenuItem onClick={() => setShowSymbols(true)}>
                  {l10n("FIELD_VIEW_GBVM_SYMBOLS")}
                </MenuItem>
              )}
              {selectedTileIds.length > 0 && (
                <MenuItem onClick={onCopyTiles}>
                  {l10n("MENU_SPRITE_TILE_COPY")}
                </MenuItem>
              )}
              {selectedTileIds.length === 0 && (
                <MenuItem onClick={onCopyMetasprite}>
                  {l10n("MENU_SPRITE_COPY")}
                </MenuItem>
              )}
              {selectedTileIds.length === 0 && (
                <MenuItem onClick={onCopySpriteState}>
                  {l10n("MENU_SPRITE_STATE_COPY")}
                </MenuItem>
              )}
              {clipboardFormat === ClipboardTypeMetaspriteTiles && (
                <MenuItem onClick={onPaste}>
                  {l10n("MENU_SPRITE_TILE_PASTE")}
                </MenuItem>
              )}
              {clipboardFormat === ClipboardTypeMetasprites && (
                <MenuItem onClick={onPaste}>
                  {l10n("MENU_SPRITE_PASTE")}
                </MenuItem>
              )}
              {clipboardFormat === ClipboardTypeSpriteState && (
                <MenuItem onClick={onPaste}>
                  {l10n("MENU_SPRITE_STATE_PASTE")}
                </MenuItem>
              )}
              <MenuDivider />
              {selectedTileIds.length > 0 && (
                <MenuItem onClick={onRemoveSelectedTiles}>
                  {l10n("MENU_SPRITE_TILE_DELETE")}
                </MenuItem>
              )}
              {selectedTileIds.length === 0 && (
                <MenuItem onClick={onRemoveMetasprite}>
                  {l10n("MENU_SPRITE_DELETE")}
                </MenuItem>
              )}
              {!isDefaultState && selectedTileIds.length === 0 && (
                <MenuItem onClick={onRemoveSpriteState}>
                  {l10n("MENU_SPRITE_STATE_DELETE")}
                </MenuItem>
              )}
            </DropdownButton>
          </FormHeader>

          {metaspriteTile && (
            <>
              {selectedTileIds.length === 1 && (
                <FormRow>
                  <CoordinateInput
                    name="x"
                    coordinate="x"
                    value={metaspriteTile.x}
                    placeholder="0"
                    min={-96}
                    max={96}
                    onChange={onChangeTileX}
                  />
                  <CoordinateInput
                    name="y"
                    coordinate="y"
                    value={metaspriteTile.y}
                    placeholder="0"
                    min={-96}
                    max={96}
                    onChange={onChangeTileY}
                  />
                </FormRow>
              )}

              <FormRow>
                <Button
                  onClick={sendTileToFront}
                  style={{ width: 28, padding: 3 }}
                  title={l10n("FIELD_BRING_TO_FRONT")}
                >
                  <SendToFrontIcon />
                </Button>
                <Button
                  onClick={sendTileToBack}
                  style={{ width: 28, padding: 3 }}
                  title={l10n("FIELD_SEND_TO_BACK")}
                >
                  <SendToBackIcon />
                </Button>
                <FlexGrow />
                <Button
                  onClick={onToggleFlipX}
                  variant={
                    selectedTileIds.length === 1 && metaspriteTile.flipX
                      ? "primary"
                      : "normal"
                  }
                  style={{ width: 28, padding: 3 }}
                  title={l10n("FIELD_FLIP_HORIZONTAL")}
                >
                  <FlipHorizontalIcon />
                </Button>
                <Button
                  onClick={onToggleFlipY}
                  variant={
                    selectedTileIds.length === 1 && metaspriteTile.flipY
                      ? "primary"
                      : "normal"
                  }
                  style={{ width: 28, padding: 3 }}
                  title={l10n("FIELD_FLIP_VERTICAL")}
                >
                  <FlipVerticalIcon />
                </Button>
              </FormRow>

              <FormDivider />

              <FormRow>
                <FormField
                  name="objPalette"
                  label={l10n("FIELD_MONOCHROME_PALETTE")}
                >
                  <ObjPaletteSelect
                    name="objPalette"
                    value={metaspriteTile.objPalette}
                    onChange={onChangeTilesObjPalette}
                  />
                </FormField>
              </FormRow>

              {colorsEnabled && (
                <FormRow>
                  <FormField
                    name="paletteIndex"
                    label={l10n("FIELD_COLOR_PALETTE")}
                  >
                    <PaletteIndexSelect
                      name="paletteIndex"
                      value={metaspriteTile.paletteIndex}
                      onChange={onChangeTilesPaletteIndex}
                    />
                  </FormField>
                </FormRow>
              )}

              <FormRow>
                <CheckboxField
                  name="priority"
                  label={l10n("FIELD_DISPLAY_BEHIND_BACKGROUND")}
                  checked={metaspriteTile.priority}
                  onChange={onChangeTilesPriority}
                />
              </FormRow>

              {selectedTileIds.length === 1 && (
                <>
                  <FormDivider />
                  <FormRow>
                    <Button
                      onClick={toggleReplaceMode}
                      variant={replaceSpriteTileMode ? "primary" : "normal"}
                    >
                      {replaceSpriteTileMode
                        ? l10n("FIELD_CHOOSE_REPLACEMENT")
                        : l10n("FIELD_REPLACE_TILE")}
                    </Button>
                  </FormRow>
                  {replaceSpriteTileMode && (
                    <FormRow>
                      <FormFieldInfo>
                        {l10n("FIELD_CHOOSE_REPLACEMENT_DETAILS")}
                      </FormFieldInfo>
                    </FormRow>
                  )}
                </>
              )}
            </>
          )}

          {!metaspriteTile && (
            <>
              {showSymbols && (
                <>
                  <SymbolEditorWrapper>
                    <SpriteSymbolsEditor id={sprite.id} />
                  </SymbolEditorWrapper>
                  <FormDivider />
                </>
              )}

              <FormRow>
                <Label>{l10n("FIELD_CANVAS_SIZE")}</Label>
              </FormRow>
              <FormRow>
                <CoordinateInput
                  name="canvasWidth"
                  coordinate="w"
                  value={sprite.canvasWidth}
                  placeholder="16"
                  min={16}
                  max={160}
                  step={16}
                  onChange={onChangeCanvasWidth}
                />
                <CoordinateInput
                  name="canvasHeight"
                  coordinate="h"
                  value={sprite.canvasHeight}
                  placeholder="16"
                  min={16}
                  max={144}
                  step={8}
                  onChange={onChangeCanvasHeight}
                />
              </FormRow>

              <FormDivider />

              <div
                onMouseEnter={showBoundingBox}
                onMouseLeave={hideBoundingBox}
              >
                <FormRow>
                  <Label>{l10n("FIELD_COLLISION_BOUNDING_BOX")}</Label>
                </FormRow>
                <FormRow>
                  <CoordinateInput
                    name="boundsX"
                    coordinate="x"
                    value={sprite.boundsX}
                    placeholder="0"
                    min={-96}
                    max={96}
                    onChange={onChangeBoundsX}
                  />
                  <CoordinateInput
                    name="boundsY"
                    coordinate="y"
                    value={sprite.boundsY}
                    placeholder="0"
                    min={-96}
                    max={96}
                    onChange={onChangeBoundsY}
                  />
                </FormRow>
                <FormRow>
                  <CoordinateInput
                    name="boundsWidth"
                    coordinate="w"
                    value={sprite.boundsWidth}
                    placeholder="16"
                    min={0}
                    max={128}
                    onChange={onChangeBoundsWidth}
                  />
                  <CoordinateInput
                    name="boundsHeight"
                    coordinate="h"
                    value={sprite.boundsHeight}
                    placeholder="16"
                    min={0}
                    max={128}
                    onChange={onChangeBoundsHeight}
                  />
                </FormRow>
              </div>
              <FormSectionTitle>
                {l10n("FIELD_ANIMATION_SETTINGS")}
              </FormSectionTitle>
              {!isDefaultState && (
                <FormRow>
                  <FormField name="stateName" label="State Name">
                    <AnimationStateSelect
                      name="stateName"
                      value={spriteState.name}
                      onChange={onChangeStateName}
                      canRename
                    />
                  </FormField>
                </FormRow>
              )}

              <FormRow>
                <FormField
                  name="animationType"
                  label={l10n("FIELD_ANIMATION_TYPE")}
                >
                  <AnimationTypeSelect
                    name="animationType"
                    value={spriteState.animationType}
                    onChange={onChangeStateAnimationType}
                  />
                </FormField>
              </FormRow>
              {spriteState.animationType &&
                spriteState.animationType !== "fixed" &&
                spriteState.animationType !== "fixed_movement" &&
                spriteState.animationType !== "cursor" && (
                  <FormRow>
                    <CheckboxField
                      name="flipRightForLeft"
                      label={l10n("FIELD_FLIP_RIGHT_TO_CREATE_LEFT")}
                      checked={!!spriteState.flipLeft}
                      onChange={onChangeStateFlipLeft}
                    />
                  </FormRow>
                )}
              {showAutodetect && (
                <FormRow>
                  <Button onClick={onAutoDetect}>
                    {l10n("FIELD_AUTODETECT_ANIMATIONS")}
                  </Button>
                </FormRow>
              )}
            </>
          )}
        </FormContainer>
      </SidebarColumn>
    </Sidebar>
  );
};

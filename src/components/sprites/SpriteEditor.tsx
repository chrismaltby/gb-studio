import React, { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import l10n from "lib/helpers/l10n";
import { Sidebar, SidebarColumn } from "ui/sidebars/Sidebar";
import {
  MetaspriteTile,
  SpriteSheet,
  SpriteState,
} from "store/features/entities/entitiesTypes";
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
import { RootState } from "store/configureStore";
import castEventValue from "lib/helpers/castEventValue";
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
import { AnimationTypeSelect } from "../forms/AnimationTypeSelect";
import { ObjPaletteSelect } from "../forms/ObjPaletteSelect";
import { PaletteIndexSelect } from "../forms/PaletteIndexSelect";
import AnimationStateSelect from "components/forms/AnimationStateSelect";
import { SpriteSymbolsEditor } from "components/forms/symbols/SpriteSymbolsEditor";
import { SymbolEditorWrapper } from "components/forms/symbols/SymbolEditorWrapper";

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
  const colorsEnabled = useSelector(
    (state: RootState) => state.project.present.settings.customColorsEnabled
  );
  const sprite = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, id)
  );
  const spriteState = useSelector((state: RootState) =>
    spriteStateSelectors.selectById(state, spriteStateId)
  );
  const animation = useSelector((state: RootState) =>
    spriteAnimationSelectors.selectById(state, animationId)
  );
  const selectedTileIds = useSelector(
    (state: RootState) => state.editor.selectedMetaspriteTileIds
  );
  const metaspriteTile = useSelector((state: RootState) =>
    metaspriteTileSelectors.selectById(state, selectedTileIds[0])
  );
  const clipboardFormat = useSelector(
    (state: RootState) => state.clipboard.data?.format
  );
  const replaceSpriteTileMode = useSelector(
    (state: RootState) => state.editor.replaceSpriteTileMode
  );

  const selectedTileId = selectedTileIds[0];

  const [showSymbols, setShowSymbols] = useState(false);

  const dispatch = useDispatch();

  const selectSidebar = () => {};

  const onChangeFieldInput =
    <T extends keyof SpriteSheet>(key: T) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const editValue = castEventValue(e);
      dispatch(
        entitiesActions.editSpriteSheet({
          spriteSheetId: id,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeStateField =
    <T extends keyof SpriteState>(key: T) =>
    (editValue: SpriteState[T]) => {
      dispatch(
        entitiesActions.editSpriteState({
          spriteStateId,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeStateFieldInput =
    <T extends keyof SpriteState>(key: T) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const editValue = castEventValue(e);
      dispatch(
        entitiesActions.editSpriteState({
          spriteStateId,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeTilesFields =
    <T extends keyof MetaspriteTile>(key: T) =>
    (editValue: MetaspriteTile[T]) => {
      dispatch(
        entitiesActions.editMetaspriteTiles({
          spriteSheetId: id,
          metaspriteTileIds: selectedTileIds,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeTilesFieldInput =
    <T extends keyof MetaspriteTile>(key: T) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const editValue = castEventValue(e);
      dispatch(
        entitiesActions.editMetaspriteTiles({
          spriteSheetId: id,
          metaspriteTileIds: selectedTileIds,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

  const onChangeTileFieldInput =
    <T extends keyof MetaspriteTile>(key: T) =>
    (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      const editValue = castEventValue(e);
      dispatch(
        entitiesActions.editMetaspriteTile({
          spriteSheetId: id,
          metaspriteTileId: selectedTileId,
          changes: {
            [key]: editValue,
          },
        })
      );
    };

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
                onChange={onChangeFieldInput("name")}
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
                    onChange={onChangeTileFieldInput("x")}
                  />
                  <CoordinateInput
                    name="y"
                    coordinate="y"
                    value={metaspriteTile.y}
                    placeholder="0"
                    min={-96}
                    max={96}
                    onChange={onChangeTileFieldInput("y")}
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
                <FormField name="objPalette" label={l10n("FIELD_OBJ_PALETTE")}>
                  <ObjPaletteSelect
                    name="objPalette"
                    value={metaspriteTile.objPalette}
                    onChange={onChangeTilesFields("objPalette")}
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
                      onChange={onChangeTilesFields("paletteIndex")}
                    />
                  </FormField>
                </FormRow>
              )}

              <FormRow>
                <CheckboxField
                  name="priority"
                  label={l10n("FIELD_DISPLAY_BEHIND_BACKGROUND")}
                  checked={metaspriteTile.priority}
                  onChange={onChangeTilesFieldInput("priority")}
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
                  onChange={onChangeFieldInput("canvasWidth")}
                />
                <CoordinateInput
                  name="canvasHeight"
                  coordinate="h"
                  value={sprite.canvasHeight}
                  placeholder="16"
                  min={16}
                  max={144}
                  step={8}
                  onChange={onChangeFieldInput("canvasHeight")}
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
                    onChange={onChangeFieldInput("boundsX")}
                  />
                  <CoordinateInput
                    name="boundsY"
                    coordinate="y"
                    value={sprite.boundsY}
                    placeholder="0"
                    min={-96}
                    max={96}
                    onChange={onChangeFieldInput("boundsY")}
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
                    onChange={onChangeFieldInput("boundsWidth")}
                  />
                  <CoordinateInput
                    name="boundsHeight"
                    coordinate="h"
                    value={sprite.boundsHeight}
                    placeholder="16"
                    min={0}
                    max={128}
                    onChange={onChangeFieldInput("boundsHeight")}
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
                      onChange={onChangeStateField("name")}
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
                    onChange={onChangeStateField("animationType")}
                  />
                </FormField>
              </FormRow>
              {spriteState.animationType &&
                spriteState.animationType !== "fixed" &&
                spriteState.animationType !== "fixed_movement" &&
                spriteState.animationType !== "cursor" && (
                  <FormRow>
                    <CheckboxField
                      name="customColorsEnabled"
                      label={l10n("FIELD_FLIP_RIGHT_TO_CREATE_LEFT")}
                      checked={!!spriteState.flipLeft}
                      onChange={onChangeStateFieldInput("flipLeft")}
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

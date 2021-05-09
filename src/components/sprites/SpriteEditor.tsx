import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DropdownButton } from "../ui/buttons/DropdownButton";
import { EditableText } from "../ui/form/EditableText";
import {
  FormContainer,
  FormDivider,
  FormField,
  FormFieldInfo,
  FormHeader,
  FormRow,
} from "../ui/form/FormLayout";
import { MenuDivider, MenuItem } from "../ui/menu/Menu";
import l10n from "../../lib/helpers/l10n";
import { Sidebar, SidebarColumn } from "../ui/sidebars/Sidebar";
import {
  MetaspriteTile,
  SpriteAnimation,
  SpriteSheet,
} from "../../store/features/entities/entitiesTypes";
import { CoordinateInput } from "../ui/form/CoordinateInput";
import { Label } from "../ui/form/Label";
import {
  metaspriteTileSelectors,
  spriteAnimationSelectors,
  spriteSheetSelectors,
} from "../../store/features/entities/entitiesState";
import entitiesActions from "../../store/features/entities/entitiesActions";
import editorActions from "../../store/features/editor/editorActions";
import spriteActions from "../../store/features/sprite/spriteActions";
import clipboardActions from "../../store/features/clipboard/clipboardActions";
import { RootState } from "../../store/configureStore";
import castEventValue from "../../lib/helpers/castEventValue";
import { Button } from "../ui/buttons/Button";
import {
  FlipHorizontalIcon,
  FlipVerticalIcon,
  SendToFrontIcon,
  SendToBackIcon,
  CheckIcon,
} from "../ui/icons/Icons";
import { FlexGrow } from "../ui/spacing/Spacing";
import { SidebarHeader } from "../ui/form/SidebarHeader";
import {
  ClipboardTypeMetasprites,
  ClipboardTypeMetaspriteTiles,
} from "../../store/features/clipboard/clipboardTypes";
import { CheckboxField } from "../ui/form/CheckboxField";
import { AnimationTypeSelect } from "../forms/AnimationTypeSelect";
import { AnimationSpeedSelect } from "../forms/AnimationSpeedSelect";
import { ObjPaletteSelect } from "../forms/ObjPaletteSelect";
import { PaletteIndexSelect } from "../forms/PaletteIndexSelect";
import styled from "styled-components";

interface SpriteEditorProps {
  id: string;
  metaspriteId: string;
  animationId: string;
}

const ButtonIcon = styled.div`
  width: 12px;
  display: inline-flex;
  justifycontent: center;
  alignitems: center;
  marginleft: -5px;
  marginright: 5px;
`;

export const SpriteEditor = ({
  id,
  metaspriteId,
  animationId,
}: SpriteEditorProps) => {
  const colorsEnabled = useSelector(
    (state: RootState) => state.project.present.settings.customColorsEnabled
  );
  const sprite = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, id)
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

  const dispatch = useDispatch();

  const selectSidebar = () => {};

  const onChangeFieldInput = <T extends keyof SpriteSheet>(key: T) => (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const editValue = castEventValue(e);
    onModifySprite();
    dispatch(
      entitiesActions.editSpriteSheet({
        spriteSheetId: id,
        changes: {
          [key]: editValue,
        },
      })
    );
  };

  const onChangeField = <T extends keyof SpriteSheet>(key: T) => (
    editValue: SpriteSheet[T]
  ) => {
    onModifySprite();
    dispatch(
      entitiesActions.editSpriteSheet({
        spriteSheetId: id,
        changes: {
          [key]: editValue,
        },
      })
    );
  };

  const onChangeAnimationField = <T extends keyof SpriteAnimation>(key: T) => (
    editValue: SpriteAnimation[T]
  ) => {
    onModifySprite();
    dispatch(
      entitiesActions.editSpriteAnimation({
        spriteAnimationId: animationId,
        changes: {
          [key]: editValue,
        },
      })
    );
  };

  const onChangeTilesFields = <T extends keyof MetaspriteTile>(key: T) => (
    editValue: MetaspriteTile[T]
  ) => {
    onModifySprite();
    dispatch(
      entitiesActions.editMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
        changes: {
          [key]: editValue,
        },
      })
    );
  };

  const onChangeTileFieldInput = <T extends keyof MetaspriteTile>(key: T) => (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const editValue = castEventValue(e);
    onModifySprite();
    dispatch(
      entitiesActions.editMetaspriteTile({
        metaspriteTileId: selectedTileId,
        changes: {
          [key]: editValue,
        },
      })
    );
  };

  const onToggleFlipX = useCallback(() => {
    onModifySprite();
    dispatch(
      entitiesActions.flipXMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
      })
    );
  }, [selectedTileIds, metaspriteTile?.flipX]);

  const onToggleFlipY = useCallback(() => {
    onModifySprite();
    dispatch(
      entitiesActions.flipYMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
      })
    );
  }, [selectedTileIds, metaspriteTile?.flipY]);

  const sendTileToBack = useCallback(() => {
    onModifySprite();
    dispatch(
      entitiesActions.sendMetaspriteTilesToBack({
        metaspriteTileIds: selectedTileIds,
        metaspriteId: metaspriteId,
      })
    );
  }, [selectedTileIds, metaspriteId]);

  const sendTileToFront = useCallback(() => {
    onModifySprite();
    dispatch(
      entitiesActions.sendMetaspriteTilesToFront({
        metaspriteTileIds: selectedTileIds,
        metaspriteId: metaspriteId,
      })
    );
  }, [selectedTileIds, metaspriteId]);

  const showBoundingBox = useCallback(() => {
    dispatch(editorActions.setShowSpriteBoundingBox(true));
  }, []);

  const hideBoundingBox = useCallback(() => {
    dispatch(editorActions.setShowSpriteBoundingBox(false));
  }, []);

  const onCopyTiles = useCallback(() => {
    dispatch(
      clipboardActions.copyMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
      })
    );
  }, [selectedTileIds]);

  const onCopyMetasprite = useCallback(() => {
    dispatch(
      clipboardActions.copyMetasprites({
        metaspriteIds: [metaspriteId],
      })
    );
  }, [metaspriteId]);

  const onPaste = useCallback(() => {
    onModifySprite();
    dispatch(
      clipboardActions.pasteSprite({
        metaspriteId,
        spriteAnimationId: animationId,
      })
    );
  }, [metaspriteId, animationId]);

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, []);

  const onRemoveSelectedTiles = useCallback(() => {
    onModifySprite();
    dispatch(
      entitiesActions.removeMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
        metaspriteId,
      })
    );
  }, [dispatch, selectedTileIds, metaspriteId]);

  const onRemoveMetasprite = useCallback(() => {
    onModifySprite();
    dispatch(
      entitiesActions.removeMetasprite({
        metaspriteId,
        spriteAnimationId: animationId,
      })
    );
  }, [dispatch, metaspriteId, animationId]);

  const toggleReplaceMode = useCallback(() => {
    dispatch(editorActions.setReplaceSpriteTileMode(!replaceSpriteTileMode));
  }, [replaceSpriteTileMode]);

  const autoDetect = sprite?.autoDetect;

  const onModifySprite = useCallback(() => {
    if (autoDetect) {
      dispatch(
        entitiesActions.editSpriteSheet({
          spriteSheetId: id,
          changes: {
            autoDetect: false,
          },
        })
      );
    }
  }, [dispatch, autoDetect, id]);

  const onAutoDetect = useCallback(() => {
    dispatch(
      entitiesActions.editSpriteSheet({
        spriteSheetId: id,
        changes: {
          autoDetect: !autoDetect,
        },
      })
    );
    if (!autoDetect) {
      dispatch(
        spriteActions.detectSprite({
          spriteSheetId: id,
        })
      );
    }
  }, [dispatch, id, autoDetect]);

  if (!sprite || !animation) {
    return null;
  }

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
                >
                  <SendToFrontIcon />
                </Button>
                <Button
                  onClick={sendTileToBack}
                  style={{ width: 28, padding: 3 }}
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
                >
                  <FlipVerticalIcon />
                </Button>
              </FormRow>

              <FormDivider />

              <FormRow>
                <FormField name="objPalette" label="Obj Palette">
                  <ObjPaletteSelect
                    name="objPalette"
                    value={metaspriteTile.objPalette}
                    onChange={onChangeTilesFields("objPalette")}
                  />
                </FormField>
              </FormRow>

              {colorsEnabled && (
                <FormRow>
                  <FormField name="paletteIndex" label="Color Palette">
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
                  onChange={onChangeTileFieldInput("priority")}
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
              <FormDivider />
              <FormRow>
                <FormField
                  name="animationType"
                  label={l10n("FIELD_ANIMATION_TYPE")}
                >
                  <AnimationTypeSelect
                    name="animationType"
                    value={sprite.animationType}
                    onChange={onChangeField("animationType")}
                  />
                </FormField>
              </FormRow>
              {sprite.animationType &&
                sprite.animationType !== "fixed" &&
                sprite.animationType !== "fixed_movement" && (
                  <FormRow>
                    <CheckboxField
                      name="customColorsEnabled"
                      label={l10n("FIELD_FLIP_RIGHT_TO_CREATE_LEFT")}
                      checked={!!sprite.flipLeft}
                      onChange={onChangeFieldInput("flipLeft")}
                    />
                  </FormRow>
                )}
              <FormRow>
                <Button
                  onClick={onAutoDetect}
                  variant={sprite.autoDetect ? "primary" : "normal"}
                >
                  {sprite.autoDetect && (
                    <ButtonIcon>
                      <CheckIcon />
                    </ButtonIcon>
                  )}
                  {l10n("FIELD_AUTODETECT_ANIMATIONS")}
                </Button>
              </FormRow>
            </>
          )}
        </FormContainer>
      </SidebarColumn>
    </Sidebar>
  );
};

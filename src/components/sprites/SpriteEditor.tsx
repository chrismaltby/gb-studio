import React, { FC, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DropdownButton } from "../ui/buttons/DropdownButton";
import { EditableText } from "../ui/form/EditableText";
import {
  FormContainer,
  FormDivider,
  FormField,
  FormHeader,
  FormRow,
  FormSectionTitle,
} from "../ui/form/FormLayout";
import { MenuItem } from "../ui/menu/Menu";
import l10n from "../../lib/helpers/l10n";
import { Sidebar, SidebarColumn } from "../ui/sidebars/Sidebar";
import {
  MetaspriteTile,
  SpriteSheet,
  SpriteSheetType,
} from "../../store/features/entities/entitiesTypes";
import { CoordinateInput } from "../ui/form/CoordinateInput";
import { Label } from "../ui/form/Label";
import { Select } from "../ui/form/Select";
import {
  metaspriteTileSelectors,
  spriteSheetSelectors,
} from "../../store/features/entities/entitiesState";
import entitiesActions from "../../store/features/entities/entitiesActions";
import editorActions from "../../store/features/editor/editorActions";
import clipboardActions from "../../store/features/clipboard/clipboardActions";
import { RootState } from "../../store/configureStore";
import castEventValue from "../../lib/helpers/castEventValue";
import { FlatList } from "../ui/lists/FlatList";
import { EntityListItem } from "../ui/lists/EntityListItem";
import { Button } from "../ui/buttons/Button";
import {
  FlipHorizontalIcon,
  FlipVerticalIcon,
  SendToFrontIcon,
  SendToBackIcon,
} from "../ui/icons/Icons";
import { FlexGrow } from "../ui/spacing/Spacing";
import { NumberField } from "../ui/form/NumberField";
import { SidebarHeader } from "../ui/form/SidebarHeader";
import {
  ClipboardTypeMetasprites,
  ClipboardTypeMetaspriteTiles,
} from "../../store/features/clipboard/clipboardTypes";

interface SpriteEditorProps {
  id: string;
  metaspriteId: string;
  animationId: string;
}

interface SpriteImportTypeOption {
  value: SpriteSheetType;
  label: string;
}

const options: SpriteImportTypeOption[] = [
  { value: "classic", label: `${l10n("FIELD_CLASSIC")}` },
  { value: "autodetect", label: `${l10n("FIELD_AUTODETECT")}` },
  { value: "manual", label: `${l10n("FIELD_MANUAL")}` },
];

export const SpriteEditor = ({
  id,
  metaspriteId,
  animationId,
}: SpriteEditorProps) => {
  const sprite = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, id)
  );
  const spriteIndex = useSelector((state: RootState) =>
    spriteSheetSelectors.selectIds(state).indexOf(id)
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
  const selectedTileId = selectedTileIds[0];

  const dispatch = useDispatch();

  const selectSidebar = () => {};

  const onChangeFieldInput = <T extends keyof SpriteSheet>(key: T) => (
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

  const onChangeField = <T extends keyof SpriteSheet>(key: T) => (
    editValue: SpriteSheet[T]
  ) => {
    dispatch(
      entitiesActions.editSpriteSheet({
        spriteSheetId: id,
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
    dispatch(
      entitiesActions.flipXMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
      })
    );
  }, [selectedTileIds, metaspriteTile?.flipX]);

  const onToggleFlipY = useCallback(() => {
    dispatch(
      entitiesActions.flipYMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
      })
    );
  }, [selectedTileIds, metaspriteTile?.flipY]);

  const sendTileToBack = useCallback(() => {
    dispatch(
      entitiesActions.sendMetaspriteTilesToBack({
        metaspriteTileIds: selectedTileIds,
        metaspriteId: metaspriteId,
      })
    );
  }, [selectedTileIds, metaspriteId]);

  const sendTileToFront = useCallback(() => {
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
    dispatch(
      clipboardActions.pasteSprite({
        metaspriteId,
        spriteAnimationId: animationId,
      })
    );
  }, []);

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, []);

  const onRemoveSelectedTiles = useCallback(() => {
    dispatch(
      entitiesActions.removeMetaspriteTiles({
        metaspriteTileIds: selectedTileIds,
        metaspriteId,
      })
    );
  }, [dispatch, selectedTileIds, metaspriteId]);

  const onRemoveMetasprite = useCallback(() => {
    dispatch(
      entitiesActions.removeMetasprite({
        metaspriteId,
        spriteAnimationId: animationId,
      })
    );
  }, [dispatch, metaspriteId, animationId]);

  if (!sprite) {
    return null;
  }

  return (
    <Sidebar onClick={selectSidebar}>
      <SidebarColumn>
        <FormContainer>
          <FormHeader>
            {metaspriteTile && selectedTileIds.length === 1 && (
              <SidebarHeader>Sprite Tile</SidebarHeader>
            )}
            {metaspriteTile && selectedTileIds.length > 1 && (
              <SidebarHeader>Sprite Tiles</SidebarHeader>
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
              <MenuItem onClick={onCopyMetasprite}>
                {l10n("MENU_SPRITE_COPY")}
              </MenuItem>
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
                  <Select
                    options={options}
                    onChange={(e: { value: SpriteSheetType }) =>
                      onChangeField("type")(e.value)
                    }
                  />
                </FormField>
              </FormRow>

              <FormRow>
                <FormField name="colorPalette" label="Color Palette">
                  <Select
                    options={options}
                    onChange={(e: { value: SpriteSheetType }) =>
                      onChangeField("type")(e.value)
                    }
                  />
                </FormField>
              </FormRow>

              {selectedTileIds.length === 1 && (
                <>
                  <FormDivider />
                  <FormRow>
                    <Button>Replace Tile</Button>
                  </FormRow>
                </>
              )}
            </>
          )}

          {!metaspriteTile && (
            <>
              <FormRow>
                <Label>Sprite Canvas</Label>
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

              {/* <FormDivider />

              <FormRow>
                <FormField
                  name="type"
                  label={l10n("FIELD_SPRITESHEET_IMPORT_TYPE")}
                >
                  <Select
                    options={options}
                    onChange={(e: { value: SpriteSheetType }) =>
                      onChangeField("type")(e.value)
                    }
                  />
                </FormField>
              </FormRow> */}

              <FormDivider />

              <div
                onMouseEnter={showBoundingBox}
                onMouseLeave={hideBoundingBox}
              >
                <FormRow>
                  <Label>Collision Bounding Box</Label>
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
              {/* <FormSectionTitle>Import</FormSectionTitle> */}

              <FormSectionTitle>Idle Right</FormSectionTitle>
              <FormRow>
                <NumberField
                  name="x"
                  label="Animation Speed"
                  value={sprite.boundsWidth}
                  placeholder="0"
                  min={-96}
                  max={96}
                  onChange={onChangeFieldInput("boundsWidth")}
                />
              </FormRow>

              {/* <FormSectionTitle>Remap Animations</FormSectionTitle>
              <FormRow>
                <FormField name="remapIdleRight" label="Idle Right">
                  <Select
                    options={options}
                    onChange={(e: { value: SpriteSheetType }) =>
                      onChangeField("type")(e.value)
                    }
                  />
                </FormField>
                <FormField name="remapIdleLeft" label="Idle Left">
                  <Select
                    options={options}
                    onChange={(e: { value: SpriteSheetType }) =>
                      onChangeField("type")(e.value)
                    }
                  />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField name="remapIdleUp" label="Idle Up">
                  <Select
                    options={options}
                    onChange={(e: { value: SpriteSheetType }) =>
                      onChangeField("type")(e.value)
                    }
                  />
                </FormField>
                <FormField name="remapIdleDown" label="Idle Down">
                  <Select
                    options={options}
                    onChange={(e: { value: SpriteSheetType }) =>
                      onChangeField("type")(e.value)
                    }
                  />
                </FormField>
              </FormRow> */}
              {/* <FormDivider />
              <FormRow>
                <FormField name="remapMovingRight" label="Moving Right">
                  <Select
                    options={options}
                    onChange={(e: { value: SpriteSheetType }) =>
                      onChangeField("type")(e.value)
                    }
                  />
                </FormField>
                <FormField name="remapMovingLeft" label="Moving Left">
                  <Select
                    options={options}
                    onChange={(e: { value: SpriteSheetType }) =>
                      onChangeField("type")(e.value)
                    }
                  />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField name="remapMovingUp" label="Moving Up">
                  <Select
                    options={options}
                    onChange={(e: { value: SpriteSheetType }) =>
                      onChangeField("type")(e.value)
                    }
                  />
                </FormField>
                <FormField name="remapMovingDown" label="Moving Down">
                  <Select
                    options={options}
                    onChange={(e: { value: SpriteSheetType }) =>
                      onChangeField("type")(e.value)
                    }
                  />
                </FormField>
              </FormRow> */}
              <FormDivider />
              <FormRow>
                <Button>Autodetect Animation Frames</Button>
              </FormRow>
            </>
          )}
        </FormContainer>
      </SidebarColumn>
    </Sidebar>
  );
};

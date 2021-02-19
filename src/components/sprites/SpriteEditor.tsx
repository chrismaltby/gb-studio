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
import { FixedSpacer, FlexGrow } from "../ui/spacing/Spacing";
import { NumberField } from "../ui/form/NumberField";

interface SpriteEditorProps {
  id: string;
  metaspriteId: string;
  centerPaneHeight: number;
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
  centerPaneHeight,
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
      entitiesActions.editMetaspriteTile({
        metaspriteTileId: selectedTileId,
        changes: {
          flipX: !metaspriteTile?.flipX,
        },
      })
    );
  }, [selectedTileId, metaspriteTile?.flipX]);

  const onToggleFlipY = useCallback(() => {
    dispatch(
      entitiesActions.editMetaspriteTile({
        metaspriteTileId: selectedTileId,
        changes: {
          flipY: !metaspriteTile?.flipY,
        },
      })
    );
  }, [selectedTileId, metaspriteTile?.flipY]);

  const sendTileToBack = useCallback(() => {
    dispatch(
      entitiesActions.sendMetaspriteTileToBack({
        metaspriteTileId: selectedTileId,
        metaspriteId: metaspriteId,
      })
    );
  }, [selectedTileId, metaspriteId]);

  const sendTileToFront = useCallback(() => {
    dispatch(
      entitiesActions.sendMetaspriteTileToFront({
        metaspriteTileId: selectedTileId,
        metaspriteId: metaspriteId,
      })
    );
  }, [selectedTileId, metaspriteId]);

  if (!sprite) {
    return null;
  }

  return (
    <Sidebar onClick={selectSidebar}>
      <SidebarColumn>
        <FormContainer>
          <FormHeader>
            {metaspriteTile ? (
              <EditableText
                name="name"
                placeholder="Sprite"
                value={"Sprite Tile"}
                onChange={() => {}}
              />
            ) : (
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
            >
              {/* <MenuItem onClick={onCopyVar}>
                {l10n("MENU_VARIABLE_COPY_EMBED")}
              </MenuItem>
              <MenuItem onClick={onCopyChar}>
                {l10n("MENU_VARIABLE_COPY_EMBED_CHAR")}
              </MenuItem> */}
            </DropdownButton>
          </FormHeader>

          {metaspriteTile && selectedTileIds.length === 1 ? (
            <>
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
                  variant={metaspriteTile.flipX ? "primary" : "normal"}
                  style={{ width: 28, padding: 3 }}
                >
                  <FlipHorizontalIcon />
                </Button>
                <Button
                  onClick={onToggleFlipY}
                  variant={metaspriteTile.flipY ? "primary" : "normal"}
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
              <FormDivider />
              <FormRow>
                <Button>Replace Tile</Button>
              </FormRow>
            </>
          ) : (
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

              <FormRow>
                <Label>Collision Bounding Box</Label>
              </FormRow>
              <FormRow>
                <CoordinateInput
                  name="x"
                  coordinate="x"
                  value={sprite.boundsX}
                  placeholder="0"
                  min={-96}
                  max={96}
                  onChange={onChangeFieldInput("boundsX")}
                />
                <CoordinateInput
                  name="y"
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
                  name="x"
                  coordinate="w"
                  value={sprite.boundsWidth}
                  placeholder="0"
                  min={-96}
                  max={96}
                  onChange={onChangeFieldInput("boundsWidth")}
                />
                <CoordinateInput
                  name="y"
                  coordinate="h"
                  value={sprite.boundsHeight}
                  placeholder="0"
                  min={-96}
                  max={96}
                  onChange={onChangeFieldInput("boundsHeight")}
                />
              </FormRow>
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

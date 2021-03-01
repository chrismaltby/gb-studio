import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DropdownButton } from "../ui/buttons/DropdownButton";
import { EditableText } from "../ui/form/EditableText";
import {
  FormContainer,
  FormDivider,
  FormHeader,
  FormRow,
  FormSectionTitle,
} from "../ui/form/FormLayout";
import l10n from "../../lib/helpers/l10n";
import { Sidebar, SidebarColumn } from "../ui/sidebars/Sidebar";
import {
  MetaspriteTile,
  SpriteSheet,
  SpriteSheetType,
} from "../../store/features/entities/entitiesTypes";
import { CoordinateInput } from "../ui/form/CoordinateInput";
import { Label } from "../ui/form/Label";
import {
  metaspriteTileSelectors,
  musicSelectors,
  spriteSheetSelectors,
} from "../../store/features/entities/entitiesState";
import entitiesActions from "../../store/features/entities/entitiesActions";
import editorActions from "../../store/features/editor/editorActions";
import { RootState } from "../../store/configureStore";
import castEventValue from "../../lib/helpers/castEventValue";
import { Button } from "../ui/buttons/Button";
import { NumberField } from "../ui/form/NumberField";
import { SidebarHeader } from "../ui/form/SidebarHeader";
import { Input } from "../ui/form/Input";

interface SongEditorProps {
  id: string;
  data?: any;
}

interface SpriteImportTypeOption {
  value: SpriteSheetType;
  label: string;
}


export const SongEditor = ({
  id,
  data,
}: SongEditorProps) => {
  const song = useSelector((state: RootState) =>
    musicSelectors.selectById(state, id)
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

  const showBoundingBox = useCallback(() => {
    dispatch(editorActions.setShowSpriteBoundingBox(true));
  }, []);

  const hideBoundingBox = useCallback(() => {
    dispatch(editorActions.setShowSpriteBoundingBox(false));
  }, []);

  if (!song) {
    return null;
  }

  return (
    <Sidebar onClick={selectSidebar}>
      <SidebarColumn>
        <FormContainer>
          <FormHeader>
            <EditableText
              name="name"
              placeholder="Song"
              value={data?.name || ""}
              onChange={onChangeFieldInput("name")}
            />

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

          <FormRow>
            <Label htmlFor="artist">Artist</Label>
          </FormRow>
          <FormRow>
            <Input
              name="artist"
              value={data?.artist}
            />
          </FormRow>
          {/* <FormRow>
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

        
          <FormDivider />
          <FormRow>
            <Button>Autodetect Animation Frames</Button>
          </FormRow> */}

        </FormContainer>
      </SidebarColumn>
    </Sidebar>
  );
};

import React, { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DropdownButton } from "../ui/buttons/DropdownButton";
import { EditableText } from "../ui/form/EditableText";
import {
  FormContainer,
  FormDivider,
  FormField,
  FormHeader,
  FormRow,
} from "../ui/form/FormLayout";
import { MenuItem } from "../ui/menu/Menu";
import l10n from "../../lib/helpers/l10n";
import { Sidebar, SidebarColumn } from "../ui/sidebars/Sidebar";
import {
  SpriteSheet,
  SpriteSheetType,
} from "../../store/features/entities/entitiesTypes";
import { CoordinateInput } from "../ui/form/CoordinateInput";
import { Label } from "../ui/form/Label";
import { Select } from "../ui/form/Select";
import { spriteSheetSelectors } from "../../store/features/entities/entitiesState";
import entitiesActions from "../../store/features/entities/entitiesActions";
import { RootState } from "../../store/configureStore";
import castEventValue from "../../lib/helpers/castEventValue";

interface SpriteEditorProps {
  id: string;
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

export const SpriteEditor: FC<SpriteEditorProps> = ({ id }) => {
  const sprite = useSelector((state: RootState) =>
    spriteSheetSelectors.selectById(state, id)
  );
  const spriteIndex = useSelector((state: RootState) =>
    spriteSheetSelectors.selectIds(state).indexOf(id)
  );

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
    console.log("ON CHANGE FIELD", key, editValue);
    dispatch(
      entitiesActions.editSpriteSheet({
        spriteSheetId: id,
        changes: {
          [key]: editValue,
        },
      })
    );
  };

  if (!sprite) {
    return null;
  }

  // const sprite = {
  //   name: "",
  //   boundsX: 0,
  //   boundsY: 0,
  //   boundsWidth: 0,
  //   boundsHeight: 0,
  // };

  return (
    <Sidebar onClick={selectSidebar}>
      <SidebarColumn>
        <FormContainer>
          <FormHeader>
            <EditableText
              name="name"
              placeholder="Sprite"
              value={sprite?.name || ""}
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
          </FormRow>

          <FormDivider />

          <FormRow>
            <Label>Bounding Box</Label>
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
          <FormDivider />
        </FormContainer>
      </SidebarColumn>
    </Sidebar>
  );
};

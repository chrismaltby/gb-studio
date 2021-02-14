import React, { FC, useState } from "react";
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
import { FlatList } from "../ui/lists/FlatList";
import { EntityListItem } from "../ui/lists/EntityListItem";
import { SplitPaneHeader } from "../ui/splitpane/SplitPaneHeader";

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

const animations = [
  {
    id: "0",
    name: "Idle Right",
  },
  {
    id: "1",
    name: "Idle Left",
  },
  {
    id: "2",
    name: "Idle Up",
  },
  {
    id: "3",
    name: "Idle Down",
  },
  {
    id: "4",
    name: "Moving Right",
  },
  {
    id: "5",
    name: "Moving Left",
  },
  {
    id: "6",
    name: "Moving Up",
  },
  {
    id: "7",
    name: "Moving Down",
  },
];

export const SpriteEditor: FC<SpriteEditorProps> = ({ id }) => {
  const [selectedAnimation, setSelectedAnimation] = useState("0");
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

          <FormSectionTitle> {l10n("FIELD_ANIMATIONS")}</FormSectionTitle>

          <FlatList
            selectedId={selectedAnimation}
            items={animations}
            setSelectedId={setSelectedAnimation}
            height={200}
          >
            {({ item }) => <EntityListItem type="sprite" item={item} />}
          </FlatList>
        </FormContainer>
      </SidebarColumn>
    </Sidebar>
  );
};

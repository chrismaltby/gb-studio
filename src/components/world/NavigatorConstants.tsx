import React, { FC, useCallback, useEffect, useState } from "react";
import { constantSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import { EntityListItem } from "ui/lists/EntityListItem";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import l10n from "shared/lib/lang/l10n";
import entitiesActions from "store/features/entities/entitiesActions";
import { Constant } from "shared/lib/resources/types";
import { constantName } from "shared/lib/entities/entitiesHelpers";
import { FlexRow, FlexGrow } from "ui/spacing/Spacing";
import styled from "styled-components";

interface NavigatorConstantsProps {
  height: number;
  searchTerm: string;
}

interface NavigatorItem {
  id: string;
  name: string;
}

const constantToNavigatorItem = (
  constant: Constant,
  index: number
): NavigatorItem => ({
  id: constant.id,
  name: constantName(constant, index),
});

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: NavigatorItem, b: NavigatorItem) => {
  return collator.compare(a.name, b.name);
};

const ConstantValueLabel = styled.span`
  opacity: 0.5;
`;

export const NavigatorConstants: FC<NavigatorConstantsProps> = ({
  height,
  searchTerm,
}) => {
  const constants = useAppSelector(constantSelectors.selectAll);
  const constantsLookup = useAppSelector(constantSelectors.selectEntities);
  const [items, setItems] = useState<NavigatorItem[]>([]);

  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const selectedId = editorType === "constant" ? entityId : "";
  const dispatch = useAppDispatch();

  useEffect(() => {
    const searchTermUpperCase = searchTerm.toLocaleUpperCase();
    setItems(
      constants
        .map((constant, index) => constantToNavigatorItem(constant, index))
        .filter(
          (value) =>
            searchTermUpperCase.length === 0 ||
            value.name.toLocaleUpperCase().includes(searchTermUpperCase)
        )
        .sort(sortByName)
    );
  }, [searchTerm, constants]);

  const setSelectedId = (id: string) => {
    dispatch(editorActions.selectConstant({ constantId: id }));
  };

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
      }
    },
    [selectedId]
  );

  const onRenameComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.renameConstant({
            constantId: renameId,
            name,
          })
        );
      }
      setRenameId("");
    },
    [dispatch, renameId]
  );

  const onRenameCancel = useCallback(() => {
    setRenameId("");
  }, []);

  const renderContextMenu = useCallback(
    (item: NavigatorItem) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuDivider key="div-delete" />,
        <MenuItem
          key="delete"
          onClick={() =>
            dispatch(entitiesActions.removeConstant({ constantId: item.id }))
          }
        >
          {l10n("MENU_DELETE_CONSTANT")}
        </MenuItem>,
      ];
    },
    [dispatch]
  );

  const renderLabel = useCallback(
    (item: NavigatorItem) => {
      return (
        <FlexRow>
          <FlexGrow style={{ overflow: "hidden", flexShrink: 0 }}>
            {item.name}
          </FlexGrow>
          <ConstantValueLabel>
            {constantsLookup[item.id]?.value ?? 0}
          </ConstantValueLabel>
        </FlexRow>
      );
    },
    [constantsLookup]
  );

  return (
    <FlatList
      selectedId={selectedId}
      items={items}
      setSelectedId={setSelectedId}
      height={height}
      onKeyDown={listenForRenameStart}
      children={({ item }) => (
        <EntityListItem
          type="constant"
          item={item}
          rename={renameId === item.id}
          onRename={onRenameComplete}
          onRenameCancel={onRenameCancel}
          renderContextMenu={renderContextMenu}
          renderLabel={renderLabel}
        />
      )}
    />
  );
};

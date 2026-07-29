import React, { useCallback, useMemo, useState } from "react";
import { selectGlobalVariablesAll } from "store/features/entities/entitiesSelectors";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import l10n from "shared/lib/lang/l10n";
import entitiesActions from "store/features/entities/entitiesActions";
import { Variable } from "shared/lib/resources/types";
import useToggleableList from "ui/hooks/use-toggleable-list";
import { variableName } from "shared/lib/entities/entitiesHelpers";
import {
  buildEntityNavigatorItems,
  EntityNavigatorItem,
} from "shared/lib/entities/buildEntityNavigatorItems";
import { EntityListItemDnD } from "ui/lists/EntityListItemDnD";
import ItemTypes from "renderer/lib/dnd/itemTypes";
import { assertUnreachable } from "shared/lib/helpers/assert";
import { useFlatListReparentDnD } from "ui/hooks/use-flatlist-reparent-dnd";
import { getParentPath } from "shared/lib/helpers/virtualFilesystem";
import { variableDisplayName } from "shared/lib/variables/variableNames";

interface VariableNavigatorPaneProps {
  height: number;
  searchTerm: string;
}

const ACCEPT_TYPES = [ItemTypes.VARIABLE, ItemTypes.VARIABLE_FOLDER];

export const VariableNavigatorPane = ({
  height,
  searchTerm,
}: VariableNavigatorPaneProps) => {
  const variables = useAppSelector(selectGlobalVariablesAll);

  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const selectedId = editorType === "variable" ? entityId : "";
  const dispatch = useAppDispatch();

  const {
    values: openFolders,
    isSet: isFolderOpen,
    toggle: toggleFolderOpen,
  } = useToggleableList<string>([], "variableNavigator");

  const nestedVariableItems = useMemo(() => {
    const userVariables = variables.map((variable, index) => ({
      ...variable,
      name: variableName(variable, index),
    }));

    if (searchTerm.length > 0) {
      const searchTermUpperCase = searchTerm.toLocaleUpperCase();

      const matchingUserVariables = userVariables.filter((variable) =>
        variableDisplayName(
          variable.name,
          variable.type === "array" ? variable.size : undefined,
        )
          .toLocaleUpperCase()
          .includes(searchTermUpperCase),
      );

      const items: EntityNavigatorItem<Variable>[] = [];

      items.push(
        ...matchingUserVariables.map((constant) => ({
          id: constant.id,
          type: "entity" as const,
          name: constant.name,
          filename: constant.name,
          nestLevel: 0,
          entity: constant,
        })),
      );

      return items;
    }

    const items = buildEntityNavigatorItems(
      userVariables,
      openFolders,
      searchTerm,
      undefined,
      0,
    );

    return items;
  }, [variables, openFolders, searchTerm]);

  const setSelectedId = (id: string) => {
    dispatch(editorActions.selectVariable({ variableId: id }));
  };

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
      }
    },
    [selectedId],
  );

  const onRenameComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.renameVariable({
            variableId: renameId,
            name,
          }),
        );
      }
      setRenameId("");
    },
    [dispatch, renameId],
  );

  const onRenameCancel = useCallback(() => {
    setRenameId("");
  }, []);

  const renderContextMenu = useCallback(
    (item: EntityNavigatorItem<Variable>) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuDivider key="div-delete" />,
        <MenuItem
          key="delete"
          onClick={() =>
            dispatch(entitiesActions.confirmRemoveVariable(item.id))
          }
        >
          {l10n("MENU_DELETE_VARIABLE")}
        </MenuItem>,
      ];
    },
    [dispatch],
  );

  const renderLabel = useCallback(
    (item: EntityNavigatorItem<Variable>) => {
      if (item.type === "folder") {
        return (
          <div onClick={() => toggleFolderOpen(item.id)}>{item.filename}</div>
        );
      }
      return variableDisplayName(
        item.filename,
        item.entity?.type === "array" ? item.entity.size : undefined,
      );
    },
    [toggleFolderOpen],
  );

  const { onDropOntoItem } = useFlatListReparentDnD<
    EntityNavigatorItem<Variable>
  >({
    onReparent: (item, { dropFolder }) => {
      if (item.type === "folder") {
        dispatch(
          entitiesActions.reparentVariablesFolder({
            fromPath: item.name,
            toPath: dropFolder,
          }),
        );
      } else if (item.type === "entity") {
        dispatch(
          entitiesActions.reparentVariable({
            constantId: item.id,
            toPath: dropFolder,
          }),
        );
      } else {
        assertUnreachable(item.type);
      }
    },
    acceptTypes: ACCEPT_TYPES,
    getName: (item) => item.name,
    getDropFolder: (target) =>
      target.type === "folder" ? target.name : getParentPath(target.name),
  });

  return (
    <FlatList
      selectedId={selectedId}
      items={nestedVariableItems}
      setSelectedId={setSelectedId}
      cacheKey="variableNavigator"
      height={height}
      onKeyDown={(e: KeyboardEvent, item) => {
        listenForRenameStart(e);
        if (item?.type === "folder") {
          if (e.key === "ArrowRight" && !isFolderOpen(item.id)) {
            toggleFolderOpen(item.id);
          } else if (e.key === "ArrowLeft" && isFolderOpen(item.id)) {
            toggleFolderOpen(item.id);
          }
        }
      }}
      children={({ item }) => {
        return (
          <EntityListItemDnD
            type={item.type === "folder" ? "folder" : "variable"}
            item={item}
            rename={item.type === "entity" && renameId === item.id}
            onRename={onRenameComplete}
            onRenameCancel={onRenameCancel}
            renderContextMenu={
              item.type === "entity" ? renderContextMenu : undefined
            }
            collapsable={item.type === "folder"}
            collapsed={!isFolderOpen(item.id) && searchTerm.length === 0}
            onToggleCollapse={() => toggleFolderOpen(item.id)}
            nestLevel={item.nestLevel}
            renderLabel={renderLabel}
            dragType={
              item.type === "folder"
                ? ItemTypes.VARIABLE_FOLDER
                : ItemTypes.VARIABLE
            }
            acceptTypes={ACCEPT_TYPES}
            onDrop={onDropOntoItem}
          />
        );
      }}
    />
  );
};

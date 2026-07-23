import React, { useCallback, useMemo, useState } from "react";
import { variableSelectors } from "store/features/entities/entitiesSelectors";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import { EntityListItemDnD } from "ui/lists/EntityListItemDnD";
import {
  globalVariableDefaultName,
  isGlobalVariableId,
  nextAvailableVariableIds,
} from "shared/lib/variables/variableNames";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import l10n from "shared/lib/lang/l10n";
import entitiesActions from "store/features/entities/entitiesActions";
import { Variable } from "shared/lib/resources/types";
import { FlexRow, FlexGrow } from "ui/spacing/Spacing";
import styled from "styled-components";
import {
  EntityNavigatorItem,
  buildEntityNavigatorItems,
} from "shared/lib/entities/buildEntityNavigatorItems";
import useToggleableList from "ui/hooks/use-toggleable-list";
import ItemTypes from "renderer/lib/dnd/itemTypes";
import { useFlatListReparentDnD } from "ui/hooks/use-flatlist-reparent-dnd";
import { assertUnreachable } from "shared/lib/helpers/assert";
import { getParentPath } from "shared/lib/helpers/virtualFilesystem";
import { selectScriptEventDefs } from "store/features/scriptEventDefs/scriptEventDefsState";
import { AddVariableArrayDialog } from "components/forms/AddVariableArrayDialog";

interface VariableNavigatorPaneProps {
  height: number;
  searchTerm: string;
}

const VariableIndexLabel = styled.span`
  opacity: 0.5;
`;

const ACCEPT_TYPES = [ItemTypes.VARIABLE, ItemTypes.VARIABLE_FOLDER];

// Display path for a variable — unnamed variables (and unnamed variables
// within folders, stored with a trailing slash) fall back to the default
// "Variable N" name
const variableDisplayPath = (variable: Variable): string => {
  if (!variable.name) {
    return globalVariableDefaultName(variable.id);
  }
  if (variable.name.endsWith("/") || variable.name.endsWith("\\")) {
    return variable.name + globalVariableDefaultName(variable.id);
  }
  return variable.name;
};

// Variables keep their project order (which also determines their runtime
// allocation order) rather than being sorted alphabetically
const keepOrder = () => 0;

export const VariableNavigatorPane = ({
  height,
  searchTerm,
}: VariableNavigatorPaneProps) => {
  const allVariableEntities = useAppSelector(variableSelectors.selectAll);

  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const selectedId = editorType === "variable" ? entityId : "";
  const scriptEventDefs = useAppSelector(selectScriptEventDefs);
  const dispatch = useAppDispatch();

  const {
    values: manuallyOpenedFolders,
    isSet: isFolderOpen,
    toggle: toggleFolderOpen,
  } = useToggleableList<string>([], "variableNavigator");

  const openFolders = useMemo(() => {
    return [...manuallyOpenedFolders];
  }, [manuallyOpenedFolders]);

  // Runtime allocation index for each global variable — all defined
  // variables are allocated in project order at compile time
  const variableIndexLookup = useMemo(() => {
    const lookup: Record<string, number> = {};
    let index = 0;
    for (const variable of allVariableEntities) {
      if (isGlobalVariableId(variable.id)) {
        lookup[variable.id] = index++;
      }
    }
    return lookup;
  }, [allVariableEntities]);

  const nestedVariableItems = useMemo(() => {
    const globalVariables = allVariableEntities
      .filter((variable) => isGlobalVariableId(variable.id))
      .map((variable) => ({
        ...variable,
        name: variableDisplayPath(variable),
      }));
    return buildEntityNavigatorItems(
      globalVariables,
      openFolders,
      searchTerm,
      searchTerm.length > 0 ? undefined : keepOrder,
      0,
    );
  }, [allVariableEntities, openFolders, searchTerm]);

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
    (name: string, item: EntityNavigatorItem<Variable>) => {
      if (renameId) {
        if (item.type === "folder") {
          dispatch(
            entitiesActions.renameVariablesFolder({
              fromPath: item.name,
              toPath: name,
              scriptEventDefs,
            }),
          );
        } else {
          dispatch(
            entitiesActions.renameVariable({
              variableId: renameId,
              name,
            }),
          );
        }
      }
      setRenameId("");
    },
    [dispatch, renameId, scriptEventDefs],
  );

  const onRenameCancel = useCallback(() => {
    setRenameId("");
  }, []);

  const onAddVariableToFolder = useCallback(
    (folderPath: string) => {
      const variableIds = allVariableEntities.map((variable) => variable.id);
      const newId = nextAvailableVariableIds(variableIds, 1)[0];
      if (newId === undefined) {
        return;
      }
      dispatch(
        entitiesActions.addVariable({
          variableId: newId,
          name: `${folderPath}/${globalVariableDefaultName(newId)}`,
        }),
      );
    },
    [allVariableEntities, dispatch],
  );

  const [addArrayFolder, setAddArrayFolder] = useState<string | undefined>(
    undefined,
  );

  const renderContextMenu = useCallback(
    (item: EntityNavigatorItem<Variable>) => {
      if (item.type === "folder") {
        return [
          <MenuItem
            key="add-variable"
            onClick={() => onAddVariableToFolder(item.name)}
          >
            {l10n("SIDEBAR_ADD_VARIABLE")}
          </MenuItem>,
          <MenuItem
            key="add-array"
            onClick={() => setAddArrayFolder(item.name)}
          >
            {l10n("SIDEBAR_ADD_VARIABLE_ARRAY")}
          </MenuItem>,
          <MenuDivider key="div-rename" />,
          <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
            {l10n("FIELD_RENAME")}
          </MenuItem>,
          <MenuDivider key="div-delete" />,
          <MenuItem
            key="delete"
            onClick={() =>
              dispatch(
                entitiesActions.removeVariablesFolder({ path: item.name }),
              )
            }
          >
            {l10n("MENU_DELETE_VARIABLE_FOLDER")}
          </MenuItem>,
        ];
      }
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuItem
          key="move-up"
          onClick={() =>
            dispatch(
              entitiesActions.moveVariable({
                variableId: item.id,
                direction: "up",
              }),
            )
          }
        >
          {l10n("FIELD_MOVE_UP")}
        </MenuItem>,
        <MenuItem
          key="move-down"
          onClick={() =>
            dispatch(
              entitiesActions.moveVariable({
                variableId: item.id,
                direction: "down",
              }),
            )
          }
        >
          {l10n("FIELD_MOVE_DOWN")}
        </MenuItem>,
        <MenuDivider key="div-delete" />,
        <MenuItem
          key="delete"
          onClick={() =>
            dispatch(entitiesActions.removeVariable({ variableId: item.id }))
          }
        >
          {l10n("MENU_DELETE_VARIABLE")}
        </MenuItem>,
      ];
    },
    [dispatch, onAddVariableToFolder],
  );

  const renderLabel = useCallback(
    (item: EntityNavigatorItem<Variable>) => {
      if (item.type === "folder") {
        return (
          <div onClick={() => toggleFolderOpen(item.id)}>{item.filename}</div>
        );
      }
      return (
        <FlexRow>
          <FlexGrow style={{ overflow: "hidden", flexShrink: 0 }}>
            {item.filename}
          </FlexGrow>
          <VariableIndexLabel>
            {variableIndexLookup[item.id]}
          </VariableIndexLabel>
        </FlexRow>
      );
    },
    [toggleFolderOpen, variableIndexLookup],
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
            scriptEventDefs,
          }),
        );
      } else if (item.type === "entity") {
        dispatch(
          entitiesActions.reparentVariable({
            variableId: item.id,
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
    <>
      {addArrayFolder !== undefined && (
        <AddVariableArrayDialog
          folderPath={addArrayFolder}
          onClose={() => setAddArrayFolder(undefined)}
        />
      )}
      <FlatList
        selectedId={selectedId}
        items={nestedVariableItems}
        setSelectedId={setSelectedId}
        cacheKey="variableNavigator"
        height={height}
        onKeyDown={(e: KeyboardEvent, item) => {
          listenForRenameStart(e);
          if (item?.type === "folder") {
            if (e.key === "ArrowRight") {
              toggleFolderOpen(item.id);
            } else if (e.key === "ArrowLeft") {
              toggleFolderOpen(item.id);
            }
          }
        }}
        children={({ item }) => (
          <EntityListItemDnD
            type={item.type === "folder" ? "folder" : "variable"}
            item={item}
            rename={renameId === item.id}
            onRename={onRenameComplete}
            onRenameCancel={onRenameCancel}
            renderContextMenu={renderContextMenu}
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
        )}
      />
    </>
  );
};

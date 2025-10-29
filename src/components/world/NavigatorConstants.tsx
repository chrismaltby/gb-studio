import React, { FC, useCallback, useMemo, useState } from "react";
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
import {
  EntityNavigatorItem,
  buildEntityNavigatorItems,
} from "shared/lib/entities/buildEntityNavigatorItems";
import useToggleableList from "ui/hooks/use-toggleable-list";

interface NavigatorConstantsProps {
  height: number;
  searchTerm: string;
}

interface ConstantItem extends Constant {
  name: string;
}

const ConstantValueLabel = styled.span`
  opacity: 0.5;
`;

const isEngineConstantId = (id: string) => id.startsWith("engine::");

export const NavigatorConstants: FC<NavigatorConstantsProps> = ({
  height,
  searchTerm,
}) => {
  const constants = useAppSelector(constantSelectors.selectAll);
  const constantsLookup = useAppSelector(constantSelectors.selectEntities);
  const engineConstantsLookup = useAppSelector((state) => state.engine.consts);

  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const selectedId = editorType === "constant" ? entityId : "";
  const dispatch = useAppDispatch();

  const {
    values: manuallyOpenedFolders,
    isSet: isFolderOpen,
    toggle: toggleFolderOpen,
  } = useToggleableList<string>([]);

  const openFolders = useMemo(() => {
    return [...manuallyOpenedFolders];
  }, [manuallyOpenedFolders]);

  const nestedConstantItems = useMemo(() => {
    const userConstants = constants.map((constant, index) => ({
      ...constant,
      name: constantName(constant, index),
    }));

    const engineConstants = engineConstantsLookup
      ? Object.entries(engineConstantsLookup).map(([name, value]) => ({
          id: `engine::${name}`,
          name,
          symbol: name,
          value: typeof value === "string" ? parseInt(value, 10) : value,
        }))
      : [];

    if (searchTerm.length > 0) {
      const searchTermUpperCase = searchTerm.toLocaleUpperCase();

      const matchingUserConstants = userConstants.filter((constant) =>
        constant.name.toLocaleUpperCase().includes(searchTermUpperCase),
      );

      const matchingEngineConstants = engineConstants.filter((constant) =>
        constant.name.toLocaleUpperCase().includes(searchTermUpperCase),
      );

      const items: EntityNavigatorItem<ConstantItem>[] = [];

      items.push(
        ...matchingUserConstants.map((constant) => ({
          id: constant.id,
          type: "entity" as const,
          name: constant.name,
          filename: constant.name,
          nestLevel: 0,
          entity: constant,
        })),
      );

      if (matchingEngineConstants.length > 0) {
        items.push({
          id: "engine_constants",
          type: "folder",
          name: l10n("FIELD_ENGINE_CONSTANTS"),
          filename: l10n("FIELD_ENGINE_CONSTANTS"),
          nestLevel: 0,
        });

        items.push(
          ...matchingEngineConstants.map((constant) => ({
            id: constant.id,
            type: "entity" as const,
            name: constant.name,
            filename: constant.name,
            nestLevel: 1,
            entity: constant,
          })),
        );
      }

      return items;
    }

    const items = ([] as EntityNavigatorItem<ConstantItem>[]).concat(
      buildEntityNavigatorItems(
        userConstants,
        openFolders,
        searchTerm,
        undefined,
        0,
      ),
      {
        id: "engine_constants",
        type: "folder",
        name: l10n("FIELD_ENGINE_CONSTANTS"),
        filename: l10n("FIELD_ENGINE_CONSTANTS"),
        nestLevel: 0,
      },
    );

    if (isFolderOpen("engine_constants")) {
      items.push(
        ...buildEntityNavigatorItems(
          engineConstants,
          openFolders,
          searchTerm,
          undefined,
          1,
        ),
      );
    }

    return items;
  }, [constants, engineConstantsLookup, openFolders, searchTerm, isFolderOpen]);

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
    [selectedId],
  );

  const onRenameComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.renameConstant({
            constantId: renameId,
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
    (item: EntityNavigatorItem<ConstantItem>) => {
      if (isEngineConstantId(item.id)) {
        return [];
      }
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
    [dispatch],
  );

  const renderLabel = useCallback(
    (item: EntityNavigatorItem<ConstantItem>) => {
      if (item.type === "folder") {
        return (
          <div onClick={() => toggleFolderOpen(item.id)}>{item.filename}</div>
        );
      }

      const value = isEngineConstantId(item.id)
        ? item.entity?.value
        : (constantsLookup[item.id]?.value ?? 0);

      return (
        <FlexRow>
          <FlexGrow style={{ overflow: "hidden", flexShrink: 0 }}>
            {item.filename}
          </FlexGrow>
          <ConstantValueLabel>{value}</ConstantValueLabel>
        </FlexRow>
      );
    },
    [constantsLookup, toggleFolderOpen],
  );

  return (
    <FlatList
      selectedId={selectedId}
      items={nestedConstantItems}
      setSelectedId={setSelectedId}
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
        <EntityListItem
          type={item.type === "folder" ? "folder" : "constant"}
          item={item}
          rename={
            item.type === "entity" &&
            renameId === item.id &&
            !isEngineConstantId(item.id)
          }
          onRename={onRenameComplete}
          onRenameCancel={onRenameCancel}
          renderContextMenu={
            item.type === "entity" && !isEngineConstantId(item.id)
              ? renderContextMenu
              : undefined
          }
          collapsable={item.type === "folder"}
          collapsed={!isFolderOpen(item.id) && searchTerm.length === 0}
          onToggleCollapse={() => toggleFolderOpen(item.id)}
          nestLevel={item.nestLevel}
          renderLabel={renderLabel}
        />
      )}
    />
  );
};

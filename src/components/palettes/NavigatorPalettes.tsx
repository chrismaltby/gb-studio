import React, { useCallback, useMemo, useState } from "react";
import { paletteSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import { Palette } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import styled from "styled-components";
import navigationActions from "store/features/navigation/navigationActions";
import { Button } from "ui/buttons/Button";
import { PlusIcon } from "ui/icons/Icons";
import entitiesActions from "store/features/entities/entitiesActions";
import { FlexGrow, FlexRow } from "ui/spacing/Spacing";
import PaletteBlock from "components/forms/PaletteBlock";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { EntityListItem } from "ui/lists/EntityListItem";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import useToggleableList from "ui/hooks/use-toggleable-list";
import {
  EntityNavigatorItem,
  buildEntityNavigatorItems,
} from "shared/lib/entities/buildEntityNavigatorItems";
import { paletteName } from "shared/lib/entities/entitiesHelpers";

interface NavigatorPalettesProps {
  height: number;
  selectedId: string;
}

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (
  a: { id: string; name: string },
  b: { id: string; name: string }
) => {
  // Push default palettes to top of list
  const aName = a.id.startsWith("default") ? `_${a.name}` : a.name;
  const bName = b.id.startsWith("default") ? `_${b.name}` : b.name;
  return collator.compare(aName, bName);
};

const Pane = styled.div`
  overflow: hidden;
`;

export const NavigatorPalettes = ({
  height,
  selectedId,
}: NavigatorPalettesProps) => {
  const allPalettes = useAppSelector((state) =>
    paletteSelectors.selectAll(state)
  );

  const {
    values: openFolders,
    isSet: isFolderOpen,
    toggle: toggleFolderOpen,
    set: openFolder,
    unset: closeFolder,
  } = useToggleableList<string>([]);

  const nestedPaletteItems = useMemo(
    () =>
      buildEntityNavigatorItems(
        allPalettes.map((palette, index) => ({
          ...palette,
          name: paletteName(palette, index),
        })),
        openFolders,
        sortByName
      ),
    [allPalettes, openFolders]
  );

  const dispatch = useAppDispatch();

  const setSelectedId = useCallback(
    (id: string) => {
      dispatch(navigationActions.setNavigationId(id));
    },
    [dispatch]
  );

  const addNewPalette = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.stopPropagation();
      dispatch(entitiesActions.addPalette());
    },
    [dispatch]
  );

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
      }
    },
    [selectedId]
  );

  const onRenamePaletteComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editPalette({
            paletteId: renameId,
            changes: {
              name,
            },
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
    (item: EntityNavigatorItem<Palette>) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        ...(!item.entity?.defaultColors
          ? [
              <MenuDivider key="div-delete" />,
              <MenuItem
                key="delete"
                onClick={() =>
                  dispatch(
                    entitiesActions.removePalette({
                      paletteId: item.id,
                    })
                  )
                }
              >
                {l10n("MENU_DELETE_PALETTE")}
              </MenuItem>,
            ]
          : []),
      ];
    },
    [dispatch]
  );

  const renderLabel = useCallback(
    (item: EntityNavigatorItem<Palette>) => {
      if (item.type === "folder") {
        return (
          <div onClick={() => toggleFolderOpen(item.id)}>{item.filename}</div>
        );
      }
      return (
        <FlexRow>
          {item.filename}
          <FlexGrow />
          <PaletteBlock colors={item.entity?.colors ?? []} size={16} />
        </FlexRow>
      );
    },
    [toggleFolderOpen]
  );

  return (
    <Pane style={{ height }}>
      <SplitPaneHeader
        collapsed={false}
        buttons={
          <Button
            variant="transparent"
            size="small"
            title={l10n("FIELD_ADD_PALETTE")}
            onClick={addNewPalette}
          >
            <PlusIcon />
          </Button>
        }
      >
        {l10n("NAV_PALETTES")}
      </SplitPaneHeader>

      <FlatList
        selectedId={selectedId}
        items={nestedPaletteItems}
        setSelectedId={setSelectedId}
        height={height - 30}
        onKeyDown={(e: KeyboardEvent, item) => {
          listenForRenameStart(e);
          if (item?.type === "folder") {
            if (e.key === "ArrowRight") {
              openFolder(selectedId);
            } else if (e.key === "ArrowLeft") {
              closeFolder(selectedId);
            }
          }
        }}
      >
        {({ item }) => (
          <EntityListItem
            item={item}
            type={item.type === "folder" ? "folder" : "palette"}
            rename={
              item.type === "entity" &&
              renameId === item.id &&
              !renameId.startsWith("default")
            }
            onRename={onRenamePaletteComplete}
            onRenameCancel={onRenameCancel}
            renderContextMenu={
              item.type === "entity" && !item.id.startsWith("default")
                ? renderContextMenu
                : undefined
            }
            collapsable={item.type === "folder"}
            collapsed={!isFolderOpen(item.name)}
            onToggleCollapse={() => toggleFolderOpen(item.name)}
            nestLevel={item.nestLevel}
            renderLabel={renderLabel}
          />
        )}
      </FlatList>
    </Pane>
  );
};

import React, { useCallback, useMemo, useState } from "react";
import {
  backgroundSelectors,
  tilesetSelectors,
} from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import { Background, Tileset } from "shared/lib/entities/entitiesTypes";
import { EntityListItem } from "ui/lists/EntityListItem";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import styled from "styled-components";
import navigationActions from "store/features/navigation/navigationActions";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SplitPaneVerticalDivider } from "ui/splitpane/SplitPaneDivider";
import useSplitPane from "ui/hooks/use-split-pane";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import { stripInvalidPathCharacters } from "shared/lib/helpers/stripInvalidFilenameCharacters";
import projectActions from "store/features/project/projectActions";
import {
  FileSystemNavigatorItem,
  buildAssetNavigatorItems,
} from "shared/lib/assets/buildAssetNavigatorItems";
import useToggleableList from "ui/hooks/use-toggleable-list";

interface NavigatorBackgroundsProps {
  height: number;
  selectedId: string;
}

const Pane = styled.div`
  overflow: hidden;
`;

const COLLAPSED_SIZE = 30;

export const NavigatorBackgrounds = ({
  height,
  selectedId,
}: NavigatorBackgroundsProps) => {
  const allBackgrounds = useAppSelector((state) =>
    backgroundSelectors.selectAll(state)
  );
  const allTilesets = useAppSelector((state) =>
    tilesetSelectors.selectAll(state)
  );

  const {
    values: openFolders,
    isSet: isFolderOpen,
    toggle: toggleFolderOpen,
    set: openFolder,
    unset: closeFolder,
  } = useToggleableList<string>([]);

  const dispatch = useAppDispatch();

  const nestedBackgroundItems = useMemo(
    () => buildAssetNavigatorItems(allBackgrounds, openFolders),
    [allBackgrounds, openFolders]
  );
  const nestedTilesetItems = useMemo(
    () => buildAssetNavigatorItems(allTilesets, openFolders),
    [allTilesets, openFolders]
  );

  const setSelectedId = useCallback(
    (id: string) => {
      dispatch(navigationActions.setNavigationId(id));
    },
    [dispatch]
  );

  const [splitSizes, setSplitSizes] = useState([window.innerHeight / 2, 200]);
  const [onDragStart, togglePane] = useSplitPane({
    sizes: splitSizes,
    setSizes: setSplitSizes,
    minSizes: [COLLAPSED_SIZE, COLLAPSED_SIZE],
    collapsedSize: COLLAPSED_SIZE,
    reopenSize: 200,
    maxTotal: height,
    direction: "vertical",
  });

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
      }
    },
    [selectedId]
  );

  const onRenameBackgroundComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          projectActions.renameBackgroundAsset({
            backgroundId: renameId,
            newFilename: stripInvalidPathCharacters(name),
          })
        );
      }
      setRenameId("");
    },
    [dispatch, renameId]
  );

  const onRenameTilesetComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          projectActions.renameTilesetAsset({
            tilesetId: renameId,
            newFilename: stripInvalidPathCharacters(name),
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

  const renderTilesetContextMenu = useCallback(
    (item: FileSystemNavigatorItem<Tileset>) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuDivider key="div-delete" />,
        <MenuItem
          key="delete"
          onClick={() =>
            dispatch(
              projectActions.removeTilesetAsset({
                tilesetId: item.id,
              })
            )
          }
        >
          {l10n("MENU_DELETE_TILESET")}
        </MenuItem>,
      ];
    },
    [dispatch]
  );

  const renderContextMenu = useCallback(
    (item: FileSystemNavigatorItem<Background>) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuDivider key="div-delete" />,
        <MenuItem
          key="delete"
          onClick={() =>
            dispatch(
              projectActions.removeBackgroundAsset({
                backgroundId: item.id,
              })
            )
          }
        >
          {l10n("MENU_DELETE_BACKGROUND")}
        </MenuItem>,
      ];
    },
    [dispatch]
  );

  const renderLabel = useCallback(
    (item: FileSystemNavigatorItem<Background | Tileset>) => {
      if (item.type === "folder") {
        return (
          <div onClick={() => toggleFolderOpen(item.id)}>{item.filename}</div>
        );
      }
      return item.filename;
    },
    [toggleFolderOpen]
  );

  return (
    <>
      <Pane style={{ height: splitSizes[0] }}>
        <SplitPaneHeader collapsed={false} onToggle={() => togglePane(0)}>
          {l10n("NAV_BACKGROUNDS")}
        </SplitPaneHeader>

        <FlatList
          selectedId={selectedId}
          items={nestedBackgroundItems}
          setSelectedId={setSelectedId}
          height={splitSizes[0] - 30}
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
              type={item.type === "folder" ? "folder" : "background"}
              item={item}
              rename={item.type === "file" && renameId === item.id}
              onRename={onRenameBackgroundComplete}
              onRenameCancel={onRenameCancel}
              renderContextMenu={renderContextMenu}
              collapsable={item.type === "folder"}
              collapsed={!isFolderOpen(item.name)}
              onToggleCollapse={() => toggleFolderOpen(item.name)}
              nestLevel={item.nestLevel}
              renderLabel={renderLabel}
            />
          )}
        </FlatList>
      </Pane>
      <SplitPaneVerticalDivider onMouseDown={onDragStart(0)} />

      <Pane style={{ height: splitSizes[1] }}>
        <SplitPaneHeader collapsed={false} onToggle={() => togglePane(1)}>
          {l10n("FIELD_TILESETS")}
        </SplitPaneHeader>
        <FlatList
          selectedId={selectedId}
          items={nestedTilesetItems}
          setSelectedId={setSelectedId}
          height={splitSizes[1] - 30}
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
              type={item.type === "folder" ? "folder" : "background"}
              item={item}
              rename={item.type === "file" && renameId === item.id}
              onRename={onRenameTilesetComplete}
              onRenameCancel={onRenameCancel}
              renderContextMenu={renderTilesetContextMenu}
              collapsable={item.type === "folder"}
              collapsed={!isFolderOpen(item.name)}
              onToggleCollapse={() => toggleFolderOpen(item.name)}
              nestLevel={item.nestLevel}
              renderLabel={renderLabel}
            />
          )}
        </FlatList>
      </Pane>
    </>
  );
};

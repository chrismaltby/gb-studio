import React, { useCallback, useMemo, useState } from "react";
import { spriteSheetSelectors } from "store/features/entities/entitiesSelectors";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import { SpriteSheetNormalized } from "shared/lib/entities/entitiesTypes";
import { EntityListItem, EntityListSearch } from "ui/lists/EntityListItem";
import l10n from "shared/lib/lang/l10n";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import { Button } from "ui/buttons/Button";
import { SearchIcon } from "ui/icons/Icons";
import styled from "styled-components";
import useToggleableList from "ui/hooks/use-toggleable-list";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import { stripInvalidPathCharacters } from "shared/lib/helpers/stripInvalidFilenameCharacters";
import projectActions from "store/features/project/projectActions";
import {
  FileSystemNavigatorItem,
  buildAssetNavigatorItems,
} from "shared/lib/assets/buildAssetNavigatorItems";
import { useNavigatorSearch } from "store/features/editor/hooks/useNavigatorSearch";
import { FlexGrow, FlexRow } from "ui/spacing/Spacing";
import { SplitPaneChildProps } from "ui/splitpane/SplitPaneVerticalContainer";

interface SpriteNavigatorItem {
  id: string;
  name: string;
}

const Pane = styled.div`
  overflow: hidden;
`;

const SpriteModeLabel = styled.span`
  opacity: 0.5;
`;

const COLLAPSED_SIZE = 30;

interface SpriteNavigatorPaneProps extends SplitPaneChildProps {
  viewSpriteId: string;
}

export const SpriteNavigatorPane = ({
  viewSpriteId,
  height,
  onToggle,
}: SpriteNavigatorPaneProps) => {
  const dispatch = useAppDispatch();

  const selectedId = useAppSelector(
    (state) => state.editor.selectedSpriteSheetId,
  );
  const allSprites = useAppSelector((state) =>
    spriteSheetSelectors.selectAll(state),
  );
  const defaultSpriteMode = useAppSelector(
    (state) => state.project.present.settings.spriteMode,
  );

  const {
    values: openFolders,
    isSet: isFolderOpen,
    toggle: toggleFolderOpen,
    set: openFolder,
    unset: closeFolder,
  } = useToggleableList<string>([], "spriteNavigator");

  const {
    searchEnabled: spritesSearchEnabled,
    searchTerm: spritesSearchTerm,
    setSearchTerm: setSpritesSearchTerm,
    toggleSearchEnabled: toggleSpritesSearchEnabled,
  } = useNavigatorSearch("sprites");

  const nestedSpriteItems = useMemo(
    () => buildAssetNavigatorItems(allSprites, openFolders, spritesSearchTerm),
    [allSprites, openFolders, spritesSearchTerm],
  );

  const highlightedSpriteId = useMemo(() => {
    const selectedExists = nestedSpriteItems.some(
      (item) => item.id === selectedId,
    );

    return selectedExists ? selectedId : viewSpriteId;
  }, [nestedSpriteItems, selectedId, viewSpriteId]);

  const setSelectedId = useCallback(
    (id: string) => {
      dispatch(editorActions.setSelectedSpriteSheetId(id));
    },
    [dispatch],
  );

  const [renameId, setRenameId] = useState("");

  const onRenameSpriteComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          projectActions.renameSpriteAsset({
            spriteSheetId: renameId,
            newFilename: stripInvalidPathCharacters(name),
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
    (item: SpriteNavigatorItem) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuDivider key="div-delete" />,
        <MenuItem
          key="delete"
          onClick={() =>
            dispatch(
              projectActions.removeSpriteAsset({
                spriteSheetId: item.id,
              }),
            )
          }
        >
          {l10n("MENU_DELETE_SPRITE")}
        </MenuItem>,
      ];
    },
    [dispatch],
  );

  const renderLabel = useCallback(
    (item: FileSystemNavigatorItem<SpriteSheetNormalized>) => {
      if (item.type === "folder") {
        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              toggleFolderOpen(item.id);
            }}
          >
            {item.filename}
          </div>
        );
      }

      const spriteModeLabel =
        item.asset?.spriteMode !== defaultSpriteMode
          ? item.asset?.spriteMode
          : "";

      if (spriteModeLabel) {
        return (
          <FlexRow>
            <FlexGrow style={{ overflow: "hidden", flexShrink: 0 }}>
              {item.name}
            </FlexGrow>
            <SpriteModeLabel>{spriteModeLabel}</SpriteModeLabel>
          </FlexRow>
        );
      }

      return item.filename;
    },
    [defaultSpriteMode, toggleFolderOpen],
  );

  const showSpritesSearch = spritesSearchEnabled && (height ?? 0) > 60;

  const onKeyDown = useCallback(
    (
      e: KeyboardEvent,
      item?: FileSystemNavigatorItem<SpriteSheetNormalized>,
    ) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
        return;
      }

      if (item?.type !== "folder") {
        return;
      }

      if (e.key === "ArrowRight") {
        openFolder(item.id);
      } else if (e.key === "ArrowLeft") {
        closeFolder(item.id);
      }
    },
    [closeFolder, openFolder, selectedId],
  );

  const onSpritesSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSpritesSearchTerm(e.currentTarget.value);
    },
    [setSpritesSearchTerm],
  );

  const listHeight = (height ?? 0) - (showSpritesSearch ? 60 : 30);

  return (
    <Pane style={{ height }}>
      <SplitPaneHeader
        onToggle={onToggle}
        collapsed={Math.floor(height ?? 0) <= COLLAPSED_SIZE}
        buttons={
          <Button
            variant={spritesSearchEnabled ? "primary" : "transparent"}
            size="small"
            title={l10n("TOOLBAR_SEARCH")}
            onClick={toggleSpritesSearchEnabled}
          >
            <SearchIcon />
          </Button>
        }
      >
        {l10n("FIELD_SPRITES")}
      </SplitPaneHeader>

      {showSpritesSearch && (
        <EntityListSearch
          type="search"
          value={spritesSearchTerm}
          onChange={onSpritesSearchChange}
          placeholder={l10n("TOOLBAR_SEARCH")}
          autoFocus
        />
      )}

      <FlatList
        selectedId={highlightedSpriteId}
        items={nestedSpriteItems}
        setSelectedId={setSelectedId}
        cacheKey="spriteNavigator"
        height={listHeight}
        onKeyDown={onKeyDown}
      >
        {({ item }) => (
          <EntityListItem
            type={item.type === "folder" ? "folder" : "sprite"}
            item={item}
            rename={item.type === "file" && renameId === item.id}
            onRename={onRenameSpriteComplete}
            onRenameCancel={onRenameCancel}
            renderContextMenu={
              item.type === "file" && !item.asset?.plugin
                ? renderContextMenu
                : undefined
            }
            collapsable={item.type === "folder"}
            collapsed={!isFolderOpen(item.id)}
            onToggleCollapse={() => toggleFolderOpen(item.id)}
            nestLevel={item.nestLevel}
            renderLabel={renderLabel}
          />
        )}
      </FlatList>
    </Pane>
  );
};

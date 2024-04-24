import React, { useCallback, useEffect, useState } from "react";
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
import entitiesActions from "store/features/entities/entitiesActions";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SplitPaneVerticalDivider } from "ui/splitpane/SplitPaneDivider";
import useSplitPane from "ui/hooks/use-split-pane";
import { MenuItem } from "ui/menu/Menu";
import { stripInvalidPathCharacters } from "shared/lib/helpers/stripInvalidFilenameCharacters";

interface NavigatorBackgroundsProps {
  height: number;
  selectedId: string;
}

interface ImageNavigatorItem {
  id: string;
  name: string;
}

const imageToNavigatorItem = (
  background: Background | Tileset
): ImageNavigatorItem => ({
  id: background.id,
  name: background.name || background.filename,
});

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: { name: string }, b: { name: string }) => {
  return collator.compare(a.name, b.name);
};

const Pane = styled.div`
  overflow: hidden;
`;

const COLLAPSED_SIZE = 30;

export const NavigatorBackgrounds = ({
  height,
  selectedId,
}: NavigatorBackgroundsProps) => {
  const [backgroundItems, setBackgroundItems] = useState<ImageNavigatorItem[]>(
    []
  );
  const [tilesetItems, setTilesetItems] = useState<ImageNavigatorItem[]>([]);

  const allBackgrounds = useAppSelector((state) =>
    backgroundSelectors.selectAll(state)
  );
  const allTilesets = useAppSelector((state) =>
    tilesetSelectors.selectAll(state)
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    setBackgroundItems(
      allBackgrounds
        .map((background) => imageToNavigatorItem(background))
        .sort(sortByName)
    );
  }, [allBackgrounds]);

  useEffect(() => {
    setTilesetItems(
      allTilesets
        .map((tileset) => imageToNavigatorItem(tileset))
        .sort(sortByName)
    );
  }, [allTilesets]);

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

  const onRenameComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.renameBackground({
            backgroundId: renameId,
            name: stripInvalidPathCharacters(name),
          })
        );
      }
      setRenameId("");
    },
    [dispatch, renameId]
  );

  const renderContextMenu = useCallback((item: ImageNavigatorItem) => {
    return [
      <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
        {l10n("FIELD_RENAME")}
      </MenuItem>,
    ];
  }, []);

  return (
    <>
      <Pane style={{ height: splitSizes[0] }}>
        <SplitPaneHeader collapsed={false} onToggle={() => togglePane(0)}>
          {l10n("NAV_BACKGROUNDS")}
        </SplitPaneHeader>

        <FlatList
          selectedId={selectedId}
          items={backgroundItems}
          setSelectedId={setSelectedId}
          height={splitSizes[0] - 30}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setRenameId(selectedId);
            }
          }}
        >
          {({ item }) => (
            <EntityListItem
              type="background"
              item={item}
              rename={renameId === item.id}
              onRename={onRenameComplete}
              renderContextMenu={renderContextMenu}
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
          items={tilesetItems}
          setSelectedId={setSelectedId}
          height={splitSizes[1] - 30}
        >
          {({ item }) => (
            <EntityListItem
              type="background"
              item={item}
              renderContextMenu={renderContextMenu}
            />
          )}
        </FlatList>
      </Pane>
    </>
  );
};

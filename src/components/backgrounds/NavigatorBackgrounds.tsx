import React, { useCallback, useEffect, useState } from "react";
import { backgroundSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import { Background } from "shared/lib/entities/entitiesTypes";
import { EntityListItem } from "ui/lists/EntityListItem";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import styled from "styled-components";
import navigationActions from "store/features/navigation/navigationActions";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface NavigatorBackgroundsProps {
  height: number;
  selectedId: string;
}

interface BackgroundNavigatorItem {
  id: string;
  name: string;
}

const backgroundToNavigatorItem = (
  background: Background
): BackgroundNavigatorItem => ({
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

export const NavigatorBackgrounds = ({
  height,
  selectedId,
}: NavigatorBackgroundsProps) => {
  const [items, setItems] = useState<BackgroundNavigatorItem[]>([]);
  const allBackgrounds = useAppSelector((state) =>
    backgroundSelectors.selectAll(state)
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    setItems(
      allBackgrounds
        .map((background) => backgroundToNavigatorItem(background))
        .sort(sortByName)
    );
  }, [allBackgrounds]);

  const setSelectedId = useCallback(
    (id: string) => {
      dispatch(navigationActions.setNavigationId(id));
    },
    [dispatch]
  );

  return (
    <Pane style={{ height }}>
      <SplitPaneHeader collapsed={false}>
        {l10n("NAV_BACKGROUNDS")}
      </SplitPaneHeader>

      <FlatList
        selectedId={selectedId}
        items={items}
        setSelectedId={setSelectedId}
        height={height - 30}
      >
        {({ item }) => <EntityListItem type="background" item={item} />}
      </FlatList>
    </Pane>
  );
};

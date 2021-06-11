import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { backgroundSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import { Background } from "store/features/entities/entitiesTypes";
import { EntityListItem } from "ui/lists/EntityListItem";
import l10n from "lib/helpers/l10n";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import styled from "styled-components";
import navigationActions from "store/features/navigation/navigationActions";

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
  const allBackgrounds = useSelector((state: RootState) =>
    backgroundSelectors.selectAll(state)
  );
  const dispatch = useDispatch();

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

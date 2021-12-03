import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "store/configureStore";
import { paletteSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import { Palette } from "store/features/entities/entitiesTypes";
import l10n from "lib/helpers/l10n";
import { SplitPaneHeader } from "ui/splitpane/SplitPaneHeader";
import styled from "styled-components";
import navigationActions from "store/features/navigation/navigationActions";
import { Button } from "ui/buttons/Button";
import { PaletteIcon, PlusIcon } from "ui/icons/Icons";
import entitiesActions from "store/features/entities/entitiesActions";
import { FlexGrow } from "ui/spacing/Spacing";
import PaletteBlock from "components/library/PaletteBlock";

interface NavigatorPalettesProps {
  height: number;
  selectedId: string;
}

interface PaletteNavigatorItem {
  id: string;
  name: string;
  colors: string[];
}

const paletteToNavigatorItem = (palette: Palette): PaletteNavigatorItem => ({
  id: palette.id,
  name: palette.name,
  colors: palette.colors,
});

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

const NavigatorEntityRow = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  display: flex;
  align-items: center;
  width: 100%;
  & > svg {
    fill: ${(props) => props.theme.colors.text};
    width: 10px;
    height: 10px;
    margin-right: 5px;
    opacity: 0.5;
  }
  button {
    padding: 0;
    height: 17px;
    svg {
      width: 12px;
      height: 12px;
      min-height: 12px;
      min-width: 12px;
    }
  }
`;

export const NavigatorPalettes = ({
  height,
  selectedId,
}: NavigatorPalettesProps) => {
  const [items, setItems] = useState<PaletteNavigatorItem[]>([]);
  const allPalettes = useSelector((state: RootState) =>
    paletteSelectors.selectAll(state)
  );

  const dispatch = useDispatch();

  useEffect(() => {
    setItems(
      allPalettes
        .map((palette) => paletteToNavigatorItem(palette))
        .sort(sortByName)
    );
  }, [allPalettes]);

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
        items={items}
        setSelectedId={setSelectedId}
        height={height - 30}
      >
        {({ item }) => (
          <NavigatorEntityRow>
            <PaletteIcon />
            {item.name}
            <FlexGrow />
            <PaletteBlock colors={item.colors} size={16} />
          </NavigatorEntityRow>
        )}
      </FlatList>
    </Pane>
  );
};

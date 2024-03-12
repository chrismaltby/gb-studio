import React, { FC, useEffect, useState } from "react";
import { variableSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import { Variable } from "shared/lib/entities/entitiesTypes";
import { allVariables } from "renderer/lib/variables";
import { EntityListItem } from "ui/lists/EntityListItem";
import { globalVariableDefaultName } from "shared/lib/variables/variableNames";
import { useAppDispatch, useAppSelector } from "store/hooks";

interface NavigatorVariablesProps {
  height: number;
}

interface NavigatorItem {
  id: string;
  name: string;
}

const variableToNavigatorItem = (
  variable: Variable | undefined,
  variableCode: string
): NavigatorItem => ({
  id: variableCode,
  name: variable?.name
    ? variable.name
    : globalVariableDefaultName(variableCode),
});

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: NavigatorItem, b: NavigatorItem) => {
  return collator.compare(a.name, b.name);
};

export const NavigatorVariables: FC<NavigatorVariablesProps> = ({ height }) => {
  const [items, setItems] = useState<NavigatorItem[]>([]);
  const variablesLookup = useAppSelector((state) =>
    variableSelectors.selectEntities(state)
  );
  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const selectedId = editorType === "variable" ? entityId : "";
  const dispatch = useAppDispatch();

  useEffect(() => {
    setItems(
      allVariables
        .map((value) => variableToNavigatorItem(variablesLookup[value], value))
        .sort(sortByName)
    );
  }, [variablesLookup]);

  const setSelectedId = (id: string) => {
    dispatch(editorActions.selectVariable({ variableId: id }));
  };

  return (
    <FlatList
      selectedId={selectedId}
      items={items}
      setSelectedId={setSelectedId}
      height={height}
      children={({ item }) => <EntityListItem type="variable" item={item} />}
    />
  );
};

import React, { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/configureStore";
import {
  customEventSelectors,
  variableSelectors,
} from "../../store/features/entities/entitiesState";
import { FlatList } from "../ui/lists/FlatList";
import editorActions from "../../store/features/editor/editorActions";
import {
  CustomEvent,
  Variable,
} from "../../store/features/entities/entitiesTypes";
import styled from "styled-components";
import { CodeIcon } from "../library/Icons";
import { allVariables } from "../../lib/helpers/variables";
import { VariableIcon } from "../ui/icons/Icons";

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
    : `Variable ${parseInt(variableCode, 10) + 1}`,
});

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

const sortByName = (a: NavigatorItem, b: NavigatorItem) => {
  return collator.compare(a.name, b.name);
};

const NavigatorEntityRow = styled.div`
  text-overflow: ellipsis;
  overflow: hidden;
  svg {
    fill: ${(props) => props.theme.colors.text};
    width: 10px;
    height: 10px;
    margin-right: 5px;
    opacity: 0.5;
  }
`;

export const NavigatorVariables: FC<NavigatorVariablesProps> = ({ height }) => {
  const [items, setItems] = useState<NavigatorItem[]>([]);
  const variablesLookup = useSelector((state: RootState) =>
    variableSelectors.selectEntities(state)
  );
  const entityId = useSelector((state: RootState) => state.editor.entityId);
  const editorType = useSelector((state: RootState) => state.editor.type);
  const selectedId = editorType === "variable" ? entityId : "";
  const dispatch = useDispatch();

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
      children={({ selected, item }) => (
        <NavigatorEntityRow>
          <VariableIcon />
          {item.name}
        </NavigatorEntityRow>
      )}
    />
  );
};

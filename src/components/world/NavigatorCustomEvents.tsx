import React, { FC, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { customEventSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import { CustomEventNormalized } from "shared/lib/entities/entitiesTypes";
import styled from "styled-components";
import { CodeIcon } from "ui/icons/Icons";
import l10n from "shared/lib/lang/l10n";
import { useAppSelector } from "store/hooks";

interface NavigatorCustomEventsProps {
  height: number;
}

interface NavigatorItem {
  id: string;
  name: string;
}

const customEventToNavigatorItem = (
  customEvent: CustomEventNormalized,
  customEventIndex: number
): NavigatorItem => ({
  id: customEvent.id,
  name: customEvent.name
    ? customEvent.name
    : `${l10n("CUSTOM_EVENT")} ${customEventIndex + 1}`,
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

export const NavigatorCustomEvents: FC<NavigatorCustomEventsProps> = ({
  height,
}) => {
  const [items, setItems] = useState<NavigatorItem[]>([]);
  const customEvents = useAppSelector((state) =>
    customEventSelectors.selectAll(state)
  );
  const entityId = useAppSelector((state) => state.editor.entityId);
  const editorType = useAppSelector((state) => state.editor.type);
  const selectedId = editorType === "customEvent" ? entityId : "";
  const dispatch = useDispatch();

  useEffect(() => {
    setItems(customEvents.map(customEventToNavigatorItem).sort(sortByName));
  }, [customEvents]);

  const setSelectedId = (id: string) => {
    dispatch(editorActions.selectCustomEvent({ customEventId: id }));
  };

  return (
    <FlatList
      selectedId={selectedId}
      items={items}
      setSelectedId={setSelectedId}
      height={height}
      children={({ item }) => (
        <NavigatorEntityRow>
          <CodeIcon />
          {item.name}
        </NavigatorEntityRow>
      )}
    />
  );
};

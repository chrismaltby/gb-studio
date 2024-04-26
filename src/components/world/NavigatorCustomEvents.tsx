import React, { FC, useCallback, useEffect, useState } from "react";
import { customEventSelectors } from "store/features/entities/entitiesState";
import { FlatList } from "ui/lists/FlatList";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { CustomEventNormalized } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { EntityListItem } from "ui/lists/EntityListItem";
import { MenuDivider, MenuItem } from "ui/menu/Menu";

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
  const dispatch = useAppDispatch();

  useEffect(() => {
    setItems(customEvents.map(customEventToNavigatorItem).sort(sortByName));
  }, [customEvents]);

  const setSelectedId = (id: string) => {
    dispatch(editorActions.selectCustomEvent({ customEventId: id }));
  };

  const [renameId, setRenameId] = useState("");

  const listenForRenameStart = useCallback(
    (e) => {
      if (e.key === "Enter") {
        setRenameId(selectedId);
      }
    },
    [selectedId]
  );

  const onRenameComplete = useCallback(
    (name: string) => {
      if (renameId) {
        dispatch(
          entitiesActions.editCustomEvent({
            customEventId: renameId,
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
    (item: NavigatorItem) => {
      return [
        <MenuItem key="rename" onClick={() => setRenameId(item.id)}>
          {l10n("FIELD_RENAME")}
        </MenuItem>,
        <MenuDivider key="div-delete" />,
        <MenuItem
          key="delete"
          onClick={() =>
            dispatch(
              entitiesActions.removeCustomEvent({ customEventId: item.id })
            )
          }
        >
          {l10n("MENU_DELETE_CUSTOM_EVENT")}
        </MenuItem>,
      ];
    },
    [dispatch]
  );

  return (
    <FlatList
      selectedId={selectedId}
      items={items}
      setSelectedId={setSelectedId}
      height={height}
      onKeyDown={listenForRenameStart}
      children={({ item }) => (
        <EntityListItem
          item={item}
          type="script"
          rename={renameId === item.id}
          onRename={onRenameComplete}
          onRenameCancel={onRenameCancel}
          renderContextMenu={renderContextMenu}
        />
      )}
    />
  );
};

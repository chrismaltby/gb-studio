import React, { useCallback } from "react";
import l10n from "lib/helpers/l10n";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import { useDispatch, useSelector } from "react-redux";
import clipboardActions from "store/features/clipboard/clipboardActions";
import entitiesActions from "store/features/entities/entitiesActions";
import { RootState } from "store/configureStore";
import { ClipboardTypeScriptEvents } from "store/features/clipboard/clipboardTypes";
import { ScriptEventParentType } from "store/features/entities/entitiesTypes";

interface ScriptEditorDropdownButtonProps {
  value: string[];
  type: ScriptEventParentType;
  entityId: string;
  scriptKey: string;
}

const ScriptEditorDropdownButton = ({
  value,
  type,
  entityId,
  scriptKey,
}: ScriptEditorDropdownButtonProps) => {
  const dispatch = useDispatch();

  const clipboardFormat = useSelector(
    (state: RootState) => state.clipboard.data?.format
  );

  const onFetchClipboard = useCallback(() => {
    dispatch(clipboardActions.fetchClipboard());
  }, [dispatch]);

  const onCopyScript = useCallback(() => {
    dispatch(
      clipboardActions.copyScriptEvents({
        scriptEventIds: value,
      })
    );
  }, [dispatch, value]);

  const onReplaceScript = useCallback(() => {
    dispatch(
      entitiesActions.resetScript({
        entityId,
        type,
        key: scriptKey,
      })
    );
    dispatch(
      clipboardActions.pasteScriptEvents({
        entityId,
        type,
        key: scriptKey,
        insertId: "",
        before: false,
      })
    );
  }, [dispatch, entityId, scriptKey, type]);

  const onPasteScript = useCallback(
    (before: boolean) => {
      dispatch(
        clipboardActions.pasteScriptEvents({
          entityId,
          type,
          key: scriptKey,
          insertId: before ? value[0] : value[value.length - 1],
          before,
        })
      );
    },
    [dispatch, entityId, scriptKey, type, value]
  );

  const onRemoveScript = useCallback(() => {
    dispatch(
      entitiesActions.resetScript({
        entityId,
        type,
        key: scriptKey,
      })
    );
  }, [dispatch, entityId, scriptKey, type]);

  return (
    <DropdownButton
      size="small"
      variant="transparent"
      menuDirection="right"
      onMouseDown={onFetchClipboard}
    >
      <MenuItem onClick={onCopyScript}>{l10n("MENU_COPY_SCRIPT")}</MenuItem>
      {clipboardFormat === ClipboardTypeScriptEvents && <MenuDivider />}
      {clipboardFormat === ClipboardTypeScriptEvents && (
        <MenuItem onClick={onReplaceScript}>
          {l10n("MENU_REPLACE_SCRIPT")}
        </MenuItem>
      )}
      {clipboardFormat === ClipboardTypeScriptEvents &&
        value &&
        value.length > 1 && (
          <MenuItem onClick={() => onPasteScript(true)}>
            {l10n("MENU_PASTE_SCRIPT_BEFORE")}
          </MenuItem>
        )}
      {clipboardFormat === ClipboardTypeScriptEvents &&
        value &&
        value.length > 1 && (
          <MenuItem onClick={() => onPasteScript(false)}>
            {l10n("MENU_PASTE_SCRIPT_AFTER")}
          </MenuItem>
        )}
      <MenuDivider />
      <MenuItem onClick={onRemoveScript}>{l10n("MENU_DELETE_SCRIPT")}</MenuItem>
    </DropdownButton>
  );
};

export default ScriptEditorDropdownButton;

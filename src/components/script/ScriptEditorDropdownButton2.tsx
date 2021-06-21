import React, { useCallback } from "react";
// import PropTypes from "prop-types";
// import { clipboard } from "electron";
// import { connect } from "react-redux";
// import uuid from "uuid/v4";
// import { EVENT_END } from "lib/compiler/eventTypes";
// import { regenerateEventIds } from "lib/helpers/eventSystem";
import l10n from "lib/helpers/l10n";
import { DropdownButton } from "ui/buttons/DropdownButton";
import { MenuDivider, MenuItem } from "ui/menu/Menu";
import { useDispatch } from "react-redux";
import clipboardActions from "store/features/clipboard/clipboardActions";
import entitiesActions from "store/features/entities/entitiesActions";

interface ScriptEditorDropdownButtonProps {
  value: string[];
  type: "scene";
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
  const clipboardEvent = false;

  const onCopyScript = useCallback(() => {
    dispatch(
      clipboardActions.copyScriptEvents({
        scriptEventIds: value,
      })
    );
  }, [dispatch, value]);

  const onReplaceScript = useCallback(() => {}, []);

  const onPasteScript = useCallback((before: boolean) => {}, []);

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
      // onMouseDown={readClipboard}
    >
      <MenuItem onClick={onCopyScript}>{l10n("MENU_COPY_SCRIPT")}</MenuItem>
      {clipboardEvent && <MenuDivider />}
      {clipboardEvent && (
        <MenuItem onClick={onReplaceScript}>
          {l10n("MENU_REPLACE_SCRIPT")}
        </MenuItem>
      )}
      {clipboardEvent && value && value.length > 1 && (
        <MenuItem onClick={() => onPasteScript(true)}>
          {l10n("MENU_PASTE_SCRIPT_BEFORE")}
        </MenuItem>
      )}
      {clipboardEvent && value && value.length > 1 && (
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

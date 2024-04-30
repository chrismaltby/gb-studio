import { EVENT_CALL_CUSTOM_EVENT } from "consts";
import React, { Dispatch } from "react";
import { AnyAction } from "redux";
import { ScriptEventParentType } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import settingsActions from "store/features/settings/settingsActions";
import { MenuDivider, MenuItem, MenuItemIcon } from "ui/menu/Menu";
import { ScriptEditorCtx } from "shared/lib/scripts/context";
import { CheckIcon } from "ui/icons/Icons";
import clipboardActions from "store/features/clipboard/clipboardActions";
import {
  ClipboardFormat,
  ClipboardTypeScriptEvents,
} from "store/features/clipboard/clipboardTypes";

interface ScriptEventContextMenuProps {
  dispatch: Dispatch<AnyAction>;
  scriptEventId: string;
  command: string;
  args?: Record<string, unknown>;
  additionalScriptEventIds: string[];
  context: ScriptEditorCtx;
  breakpointEnabled: boolean;
  parentType: ScriptEventParentType;
  parentId: string;
  parentKey: string;
  commented?: boolean;
  hasElse?: boolean;
  disabledElse?: boolean;
  clipboardFormat?: ClipboardFormat;
  onRename?: () => void;
  onViewSymbols?: () => void;
  onInsert?: (before: boolean) => void;
}

const renderScriptEventContextMenu = ({
  scriptEventId,
  additionalScriptEventIds,
  command,
  args,
  context,
  breakpointEnabled,
  onRename,
  dispatch,
  parentType,
  parentId,
  parentKey,
  commented,
  hasElse,
  disabledElse,
  clipboardFormat,
  onViewSymbols,
  onInsert,
}: ScriptEventContextMenuProps) => {
  const multiSelection = additionalScriptEventIds.length > 1;
  return [
    ...(multiSelection
      ? [
          <MenuItem
            key="group"
            onClick={() => {
              dispatch(
                entitiesActions.groupScriptEvents({
                  scriptEventIds: additionalScriptEventIds,
                  parentId,
                  parentKey,
                  parentType,
                })
              );
            }}
          >
            {l10n("MENU_GROUP_EVENTS")}
          </MenuItem>,
          <MenuDivider key="div-group" />,
        ]
      : []),

    ...(command === EVENT_CALL_CUSTOM_EVENT
      ? [
          <MenuItem
            key="0"
            onClick={() => {
              const customEventId = args?.customEventId;
              if (customEventId && typeof customEventId === "string") {
                dispatch(editorActions.selectCustomEvent({ customEventId }));
              }
            }}
          >
            {l10n("MENU_EDIT_CUSTOM_EVENT")}
          </MenuItem>,
          <MenuDivider key="1" />,
        ]
      : []),
    ...(onViewSymbols
      ? [
          <MenuItem key="gbvm" onClick={onViewSymbols}>
            {l10n("FIELD_VIEW_GBVM_SYMBOLS")}
          </MenuItem>,
        ]
      : []),
    ...(onRename
      ? [
          <MenuItem key="rename" onClick={onRename}>
            {l10n("MENU_RENAME_EVENT")}
          </MenuItem>,
        ]
      : []),
    <MenuItem
      key="disable"
      onClick={() => {
        dispatch(
          entitiesActions.toggleScriptEventComment({
            scriptEventId,
            additionalScriptEventIds,
          })
        );
      }}
    >
      {l10n(
        commented
          ? multiSelection
            ? "MENU_ENABLE_EVENTS"
            : "MENU_ENABLE_EVENT"
          : multiSelection
          ? "MENU_DISABLE_EVENTS"
          : "MENU_DISABLE_EVENT"
      )}
    </MenuItem>,

    ...(hasElse
      ? [
          <MenuItem
            onClick={() => {
              dispatch(
                entitiesActions.toggleScriptEventDisableElse({ scriptEventId })
              );
            }}
          >
            {disabledElse
              ? l10n("MENU_ENABLE_ELSE")
              : l10n("MENU_DISABLE_ELSE")}
          </MenuItem>,
        ]
      : []),

    <MenuItem
      onClick={() => {
        dispatch(
          settingsActions.toggleBreakpoint({
            scriptEventId,
            context,
          })
        );
      }}
    >
      <span>{l10n("MENU_SET_BREAKPOINT")}</span>
      {breakpointEnabled && (
        <MenuItemIcon>
          <CheckIcon />
        </MenuItemIcon>
      )}
    </MenuItem>,

    ...(onInsert
      ? [
          <MenuDivider key="div-insert" />,
          <MenuItem key="insert-before" onClick={() => onInsert(true)}>
            {l10n("MENU_INSERT_EVENT_BEFORE")}
          </MenuItem>,
          <MenuItem key="insert-after" onClick={() => onInsert(false)}>
            {l10n("MENU_INSERT_EVENT_AFTER")}
          </MenuItem>,
        ]
      : []),

    <MenuDivider key="div-copy" />,

    <MenuItem
      key="copy"
      onClick={() => {
        dispatch(
          clipboardActions.copyScriptEvents({
            scriptEventIds: multiSelection
              ? additionalScriptEventIds
              : [scriptEventId],
          })
        );
      }}
    >
      {l10n("MENU_COPY_EVENT")}
    </MenuItem>,

    ...(clipboardFormat === ClipboardTypeScriptEvents
      ? [
          <MenuDivider key="div-paste" />,
          <MenuItem
            onClick={() => {
              dispatch(
                clipboardActions.pasteScriptEventValues({
                  scriptEventId,
                })
              );
            }}
          >
            {l10n("MENU_PASTE_VALUES")}
          </MenuItem>,
          <MenuItem
            onClick={() => {
              dispatch(
                clipboardActions.pasteScriptEvents({
                  entityId: parentId,
                  type: parentType,
                  key: parentKey,
                  insertId: scriptEventId,
                  before: true,
                })
              );
            }}
          >
            {l10n("MENU_PASTE_EVENT_BEFORE")}
          </MenuItem>,
          <MenuItem
            onClick={() => {
              dispatch(
                clipboardActions.pasteScriptEvents({
                  entityId: parentId,
                  type: parentType,
                  key: parentKey,
                  insertId: scriptEventId,
                  before: false,
                })
              );
            }}
          >
            {l10n("MENU_PASTE_EVENT_AFTER")}
          </MenuItem>,
        ]
      : []),

    <MenuDivider key="div-delete" />,
    <MenuItem
      key="delete"
      onClick={() =>
        additionalScriptEventIds.length > 1
          ? dispatch(
              entitiesActions.removeScriptEvents({
                scriptEventIds: additionalScriptEventIds,
                entityId: parentId,
                type: parentType,
                key: parentKey,
              })
            )
          : dispatch(
              entitiesActions.removeScriptEvent({
                scriptEventId,
                entityId: parentId,
                type: parentType,
                key: parentKey,
              })
            )
      }
    >
      {l10n(
        additionalScriptEventIds.length > 1
          ? "MENU_DELETE_EVENTS"
          : "MENU_DELETE_EVENT"
      )}
    </MenuItem>,
  ];
};

export default renderScriptEventContextMenu;

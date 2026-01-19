import { EVENT_CALL_CUSTOM_EVENT, EVENT_GROUP } from "consts";
import React, { Dispatch } from "react";
import { UnknownAction } from "redux";
import { ScriptEventParentType } from "shared/lib/entities/entitiesTypes";
import l10n from "shared/lib/lang/l10n";
import editorActions from "store/features/editor/editorActions";
import entitiesActions from "store/features/entities/entitiesActions";
import settingsActions from "store/features/settings/settingsActions";
import {
  MenuAccelerator,
  MenuDivider,
  MenuItem,
  MenuItemIcon,
} from "ui/menu/Menu";
import { ScriptEditorCtx } from "shared/lib/scripts/context";
import { CheckIcon } from "ui/icons/Icons";
import clipboardActions from "store/features/clipboard/clipboardActions";
import {
  ClipboardFormat,
  ClipboardTypeScriptEvents,
} from "store/features/clipboard/clipboardTypes";

interface ScriptEventContextMenuProps {
  dispatch: Dispatch<UnknownAction>;
  scriptEventId: string;
  command: string;
  args?: Record<string, unknown>;
  additionalScriptEventIds: string[];
  context: ScriptEditorCtx;
  breakpointEnabled: boolean;
  parentType: ScriptEventParentType;
  parentId: string;
  parentKey: string;
  isDisabled?: boolean;
  hasElse?: boolean;
  hasOverride: boolean;
  disabledElse?: boolean;
  clipboardFormat?: ClipboardFormat;
  onRename?: () => void;
  onViewSymbols?: () => void;
  onInsert?: (before: boolean) => void;
  onApplyOverrides: () => void;
  onRevertOverrides: () => void;
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
  isDisabled,
  hasElse,
  hasOverride,
  disabledElse,
  clipboardFormat,
  onViewSymbols,
  onInsert,
  onApplyOverrides,
  onRevertOverrides,
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
                }),
              );
            }}
          >
            {l10n("MENU_GROUP_EVENTS")}
            <MenuAccelerator accelerator="CommandOrControl+G" />
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
    ...(command === EVENT_GROUP
      ? [
          <MenuItem
            key="ungroup"
            onClick={() => {
              dispatch(
                entitiesActions.ungroupScriptEvent({
                  scriptEventId,
                  parentId,
                  parentKey,
                  parentType,
                }),
              );
            }}
          >
            {l10n("MENU_UNGROUP_EVENTS")}
          </MenuItem>,
          <MenuDivider key="div-ungroup" />,
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
          }),
        );
      }}
    >
      {l10n(
        isDisabled
          ? multiSelection
            ? "MENU_ENABLE_EVENTS"
            : "MENU_ENABLE_EVENT"
          : multiSelection
            ? "MENU_DISABLE_EVENTS"
            : "MENU_DISABLE_EVENT",
      )}
      <MenuAccelerator accelerator="CommandOrControl+/" />
    </MenuItem>,

    ...(hasElse
      ? [
          <MenuItem
            key="toggle-else"
            onClick={() => {
              dispatch(
                entitiesActions.toggleScriptEventDisableElse({ scriptEventId }),
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
      key="set-breakpoint"
      onClick={() => {
        dispatch(
          settingsActions.toggleBreakpoint({
            scriptEventId,
            context,
          }),
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

    ...(hasOverride
      ? [
          <MenuDivider key="div-changes" />,
          <MenuItem key="changes-apply" onClick={() => onApplyOverrides()}>
            {l10n("FIELD_APPLY_CHANGES")}
          </MenuItem>,
          <MenuItem key="changes-revert" onClick={() => onRevertOverrides()}>
            {l10n("FIELD_REVERT_CHANGES")}
          </MenuItem>,
        ]
      : []),

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
          }),
        );
      }}
    >
      {l10n("MENU_COPY_EVENT")}
      <MenuAccelerator accelerator="CommandOrControl+C" />
    </MenuItem>,

    ...(clipboardFormat === ClipboardTypeScriptEvents
      ? [
          <MenuDivider key="div-paste" />,
          <MenuItem
            key="paste-values"
            onClick={() => {
              dispatch(
                clipboardActions.pasteScriptEventValues({
                  scriptEventId,
                }),
              );
            }}
          >
            {l10n("MENU_PASTE_VALUES")}
          </MenuItem>,
          <MenuItem
            key="paste-before"
            onClick={() => {
              dispatch(
                clipboardActions.pasteScriptEvents({
                  entityId: parentId,
                  type: parentType,
                  key: parentKey,
                  insertId: scriptEventId,
                  before: true,
                }),
              );
            }}
          >
            {l10n("MENU_PASTE_EVENT_BEFORE")}
            <MenuAccelerator accelerator="CommandOrControl+Shift+V" />
          </MenuItem>,
          <MenuItem
            key="paste-after"
            onClick={() => {
              dispatch(
                clipboardActions.pasteScriptEvents({
                  entityId: parentId,
                  type: parentType,
                  key: parentKey,
                  insertId: scriptEventId,
                  before: false,
                }),
              );
            }}
          >
            {l10n("MENU_PASTE_EVENT_AFTER")}
            <MenuAccelerator accelerator="CommandOrControl+V" />
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
              }),
            )
          : dispatch(
              entitiesActions.removeScriptEvent({
                scriptEventId,
                entityId: parentId,
                type: parentType,
                key: parentKey,
              }),
            )
      }
    >
      {l10n(
        additionalScriptEventIds.length > 1
          ? "MENU_DELETE_EVENTS"
          : "MENU_DELETE_EVENT",
      )}
    </MenuItem>,
  ];
};

export default renderScriptEventContextMenu;

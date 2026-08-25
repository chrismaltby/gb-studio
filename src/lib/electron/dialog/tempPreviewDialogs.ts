import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";
import type { TempPreviewRecord } from "lib/tempPreview/tempMdClient";

export type ExistingTempPreviewAction =
  "update" | "copy" | "open" | "revoke" | "cancel";

export type ReadyTempPreviewAction = "copy" | "open" | "done";

const expiryText = (record: TempPreviewRecord): string =>
  record.expiresAt
    ? new Date(record.expiresAt).toLocaleString()
    : l10n("DIALOG_TEMP_PREVIEW_NO_EXPIRY");

export const confirmCreateTempPreview = (): boolean =>
  dialog.showMessageBoxSync({
    type: "warning",
    buttons: [l10n("DIALOG_TEMP_PREVIEW_SHARE"), l10n("DIALOG_CANCEL")],
    defaultId: 0,
    cancelId: 1,
    title: l10n("DIALOG_TEMP_PREVIEW_TITLE"),
    message: l10n("DIALOG_TEMP_PREVIEW_CREATE_MESSAGE"),
    detail: l10n("DIALOG_TEMP_PREVIEW_CREATE_DESCRIPTION"),
  }) === 0;

export const chooseExistingTempPreviewAction = (
  record: TempPreviewRecord,
): ExistingTempPreviewAction => {
  const response = dialog.showMessageBoxSync({
    type: "info",
    buttons: [
      l10n("DIALOG_TEMP_PREVIEW_UPDATE"),
      l10n("DIALOG_TEMP_PREVIEW_COPY"),
      l10n("DIALOG_TEMP_PREVIEW_OPEN"),
      l10n("DIALOG_TEMP_PREVIEW_STOP"),
      l10n("DIALOG_CANCEL"),
    ],
    defaultId: 0,
    cancelId: 4,
    title: l10n("DIALOG_TEMP_PREVIEW_TITLE"),
    message: l10n("DIALOG_TEMP_PREVIEW_EXISTS_MESSAGE"),
    detail: l10n("DIALOG_TEMP_PREVIEW_EXISTS_DESCRIPTION", {
      url: record.canonicalUrl,
      expires: expiryText(record),
    }),
  });
  return ["update", "copy", "open", "revoke", "cancel"][
    response
  ] as ExistingTempPreviewAction;
};

export const confirmRevokeTempPreview = (): boolean =>
  dialog.showMessageBoxSync({
    type: "warning",
    buttons: [l10n("DIALOG_TEMP_PREVIEW_STOP"), l10n("DIALOG_CANCEL")],
    defaultId: 1,
    cancelId: 1,
    title: l10n("DIALOG_TEMP_PREVIEW_TITLE"),
    message: l10n("DIALOG_TEMP_PREVIEW_STOP_MESSAGE"),
    detail: l10n("DIALOG_TEMP_PREVIEW_STOP_DESCRIPTION"),
  }) === 0;

export const showTempPreviewReady = (
  record: TempPreviewRecord,
  persistent: boolean,
): ReadyTempPreviewAction => {
  const detail = `${l10n("DIALOG_TEMP_PREVIEW_READY_DESCRIPTION", {
    url: record.canonicalUrl,
    expires: expiryText(record),
  })}${persistent ? "" : `\n\n${l10n("DIALOG_TEMP_PREVIEW_STORAGE_WARNING")}`}`;
  const response = dialog.showMessageBoxSync({
    type: "info",
    buttons: [
      l10n("DIALOG_TEMP_PREVIEW_COPY"),
      l10n("DIALOG_TEMP_PREVIEW_OPEN"),
      l10n("DIALOG_OK"),
    ],
    defaultId: 0,
    cancelId: 2,
    title: l10n("DIALOG_TEMP_PREVIEW_TITLE"),
    message: l10n("DIALOG_TEMP_PREVIEW_READY_MESSAGE"),
    detail,
  });
  return ["copy", "open", "done"][response] as ReadyTempPreviewAction;
};

export const showTempPreviewError = (error: unknown): void => {
  const message = error instanceof Error ? error.message : String(error);
  dialog.showErrorBox(
    l10n("DIALOG_TEMP_PREVIEW_ERROR"),
    l10n("DIALOG_TEMP_PREVIEW_ERROR_DESCRIPTION", { message }),
  );
};

export const showTempPreviewRevoked = (): void => {
  dialog.showMessageBoxSync({
    type: "info",
    buttons: [l10n("DIALOG_OK")],
    title: l10n("DIALOG_TEMP_PREVIEW_TITLE"),
    message: l10n("DIALOG_TEMP_PREVIEW_REVOKED_MESSAGE"),
  });
};

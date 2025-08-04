import { dialog } from "electron";
import l10n from "shared/lib/lang/l10n";

const MAX_SCENE_NAMES = 5;

export enum DeleteScriptConfirmButton {
  delete = 0,
  deleteReferences,
  cancel,
}

const confirmDeleteCustomEvent = (
  name: string,
  sceneNames: string[],
  count: number,
) => {
  const foundReferences =
    sceneNames.length > 0
      ? sceneNames.slice(0, MAX_SCENE_NAMES).join(", ") +
        (sceneNames.length > MAX_SCENE_NAMES ? "..." : "")
      : l10n("FIELD_SCRIPT");
  return dialog.showMessageBoxSync({
    type: "info",
    buttons: [
      l10n("MENU_DELETE_SCRIPT"),
      l10n("DIALOG_DELETE_SCRIPT_AND_REFERENCES"),
      l10n("DIALOG_CANCEL"),
    ],
    defaultId: 0,
    cancelId: 2,
    title: l10n("DIALOG_DELETE_CUSTOM_EVENT", { name }),
    message: l10n("DIALOG_DELETE_CUSTOM_EVENT", { name }),
    detail: l10n(
      count === 1
        ? "DIALOG_DELETE_CUSTOM_EVENT_USED_SINGLAR"
        : "DIALOG_DELETE_CUSTOM_EVENT_USED",
      { count, sceneNames: foundReferences },
    ),
  });
};

export default confirmDeleteCustomEvent;

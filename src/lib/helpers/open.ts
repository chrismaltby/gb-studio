import { shell } from "electron";
import openApp from "open";

export const open = async (filename: string, app?: string) => {
  if (app) {
    await openApp(filename, {
      app: {
        name: app,
      },
    });
    return;
  }

  const error = await shell.openPath(filename);

  if (error) {
    throw new Error(error);
  }
};

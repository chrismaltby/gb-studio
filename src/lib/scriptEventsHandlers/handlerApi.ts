import * as l10n from "shared/lib/lang/l10n";
import type { FileReaderFn } from "lib/scriptEventsHandlers/handlerTypes";

export const createScriptEventHandlerAPI = (
  readFile: FileReaderFn,
): Record<string, unknown> => {
  return {
    /* l10n(key: string, args?: Record<string, string | number>): string
     *
     * @param key - The localization key to translate
     * @param args - Optional arguments to format the translation
     * @return The translated string
     */
    l10n: l10n.default,

    /* readFile (filePath: string, encoding?: string): string
     *
     * @param filePath - The path to the file to read
     * @param encoding - The encoding to use when reading the file e.g "utf8" (optional)
     * @return The contents of the file in the specified encoding
     */
    readFile,

    /* readText (filePath: string): string
     *
     * @param filePath - The path to the file to read
     * @return The contents of the file as a string
     */
    readText: (filePath: string): string => {
      return readFile(filePath, "utf8");
    },

    /* readJSON (filePath: string): unknown
     *
     * @param filePath - The path to the file to read
     * @return The contents of the file as a JSON object
     */
    readJSON: (filePath: string): unknown => {
      return JSON.parse(readFile(filePath, "utf8"));
    },
  };
};

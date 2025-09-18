import { ScriptEventFieldSchema } from "shared/lib/entities/entitiesTypes";

export type ScriptEventHelperDef =
  | {
      type: "position";
      x: string;
      y: string;
      units?: string;
      tileSize?: string;
      tileWidth?: number;
      tileHeight?: number;
    }
  | {
      type: "camera";
      x: string;
      y: string;
      width?: string;
      height?: string;
      units?: string;
    }
  | {
      type: "overlay";
      x: string;
      y: string;
      color?: string;
      units?: string;
    }
  | {
      type: "scanline";
      y: string;
      units?: string;
    }
  | {
      type: "distance";
      actorId: string;
      distance: string;
      operator: string;
    }
  | {
      type: "bounds";
      actorId: string;
      x: string;
      y: string;
      width: string;
      height: string;
    }
  | {
      type: "text";
      text: string;
      avatarId: string;
      minHeight: string;
      maxHeight: string;
      showFrame: string;
      clearPrevious: string;
      textX: string;
      textY: string;
      textHeight: string;
    }
  | {
      type: "textdraw";
      text: string;
      x: string;
      y: string;
      location: string;
    };

export type ScriptEventPresetValue = {
  id: string;
  name: string;
  description?: string;
  groups?: string[] | string;
  subGroups?: Record<string, string>;
  values: Record<string, unknown>;
};

export type UserPresetsGroup = {
  id: string;
  label: string;
  fields: string[];
  selected?: boolean;
};

export interface ScriptEventDef {
  id: string;
  fields: ScriptEventFieldSchema[];
  name?: string;
  description?: string;
  groups?: string[] | string;
  subGroups?: Record<string, string>;
  deprecated?: boolean;
  isConditional?: boolean;
  editableSymbol?: boolean;
  allowChildrenBeforeInitFade?: boolean;
  waitUntilAfterInitFade?: boolean;
  hasAutoLabel: boolean;
  helper?: ScriptEventHelperDef;
  presets?: ScriptEventPresetValue[];
  userPresetsGroups?: UserPresetsGroup[];
  userPresetsIgnore?: string[];
  fieldsLookup: Record<string, ScriptEventFieldSchema>;
}

export type ScriptEventHandlerFieldSchema = ScriptEventFieldSchema & {
  postUpdateFn?: (
    newArgs: Record<string, unknown>,
    prevArgs: Record<string, unknown>,
  ) => void | Record<string, unknown>;
};

export type ScriptEventHandler = ScriptEventDef & {
  autoLabel?: (
    lookup: (key: string) => string,
    args: Record<string, unknown>,
  ) => string;
  compile: (input: unknown, helpers: unknown) => void;
  fields: ScriptEventHandlerFieldSchema[];
  fieldsLookup: Record<string, ScriptEventHandlerFieldSchema>;
};

export type ScriptEventHandlerWithCleanup = ScriptEventHandler & {
  cleanup: () => void;
};

export type ScriptEventHandlers = Record<string, ScriptEventHandler>;

export type FileReaderFn = {
  (filePath: string, encoding: "utf8"): string;
  (filePath: string, encoding?: BufferEncoding): string | Buffer;
};

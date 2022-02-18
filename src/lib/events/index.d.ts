import { Dictionary } from "@reduxjs/toolkit";

export interface EventField {
  key: string;
  type: string;
  checkboxLabel?: string;
  types?: string[];
  defaultType?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  options?: Array<[string | number, string]>;
  defaultValue?: Record<string, unknown> | unknown;
  width?: string;
  fields?: EventField[];
}

export interface EventHandler {
  id: string;
  autoLabel?: (
    lookup: (key: string) => string,
    args: Record<string, unknown>
  ) => string;
  fields: EventField[];
  name?: string;
  groups?: string[];
  deprecated?: boolean;
  isConditional?: boolean;
  editableSymbol?: boolean;
  compile: (input: unknown, helpers: unknown) => void;
}

declare const eventHandlers: Dictionary<EventHandler>;
declare const engineFieldUpdateEvents: Dictionary<EventHandler>;
declare const engineFieldStoreEvents: Dictionary<EventHandler>;

export default eventHandlers;

export { engineFieldUpdateEvents, engineFieldStoreEvents };

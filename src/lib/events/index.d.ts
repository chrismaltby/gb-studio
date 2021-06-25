import { Dictionary } from "@reduxjs/toolkit";

export interface EventField {
  key: string;
  type: string;
  checkboxLabel?: string;
  types?: string[];
  defaultType?: string;
  min?: number;
  max?: number;
  options?: Array<[string | number, string]>;
  defaultValue?: Record<string, unknown> | unknown;
  width?: string;
}

export interface EventHandler {
  id: string;
  fields: EventField[];
  name?: string;
  groups?: string[];
  deprecated?: boolean;
  compile: (input: unknown, helpers: unknown) => void;
}

declare const eventHandlers: Dictionary<EventHandler>;
declare const engineFieldUpdateEvents: Dictionary<EventHandler>;
declare const engineFieldStoreEvents: Dictionary<EventHandler>;

export default eventHandlers;

export { engineFieldUpdateEvents, engineFieldStoreEvents };

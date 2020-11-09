import { Dictionary } from "@reduxjs/toolkit";

interface EventHandler {
  id: string;
  fields: any[];
  name?: string;
  compile: (input: any, helpers: any) => void;
}

declare const eventHandlers: Dictionary<EventHandler>;
declare const engineFieldUpdateEvents: Dictionary<EventHandler>;
declare const engineFieldStoreEvents: Dictionary<EventHandler>;

export default eventHandlers;

export { engineFieldUpdateEvents, engineFieldStoreEvents };

import type { VariableMapData } from "lib/compiler/compileData";
import type { EntityType } from "shared/lib/scripts/context";

export type DebuggerScriptContext = {
  address: number;
  bank: number;
  current: boolean;
  closestSymbol: string;
  closestGBVMSymbol?: {
    scriptSymbol: string;
    scriptEventId: string;
    sceneId: string;
    entityType: EntityType;
    entityId: string;
    scriptKey: string;
  };
  stackString: string;
};

export type DebuggerDataPacket =
  | {
      action: "initialized";
    }
  | {
      action: "update-globals";
      data: number[];
      vram: string;
      isPaused: boolean;
      scriptContexts: DebuggerScriptContext[];
      currentSceneSymbol: string;
      currentScriptSymbol: string;
      currentScriptAddr: number;
      currentScriptPCAddr: number;
    };

export type DebuggerInitData = {
  memoryMap: Record<string, number>;
  globalVariables: Record<string, number>;
  pauseOnScriptChanged: boolean;
  pauseOnWatchedVariableChanged: boolean;
  breakpoints: string[];
  watchedVariables: string[];
  variableMap: Record<string, VariableMapData>;
};

export type DebuggerScriptContext = {
  address: number;
  bank: number;
  current: boolean;
  closestSymbol: string;
  closestGBVMSymbol?: {
    scriptSymbol: string;
    scriptEventId: string;
  };
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
};

export type DebuggerScriptContext = {
  address: number;
  bank: number;
  current: boolean;
};

export type DebuggerDataPacket =
  | {
      action: "initialized";
    }
  | {
      action: "update-globals";
      data: number[];
      vram: string;
      paused: boolean;
      scriptContexts: DebuggerScriptContext[];
      currentSceneSymbol: string;
      currentScriptSymbol: string;
    };

export type DebuggerInitData = {
  memoryMap: Record<string, number>;
  globalVariables: Record<string, number>;
};

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
      currentAddr: number;
      currentBank: number;
      scriptContexts: DebuggerScriptContext[];
    };

export type DebuggerInitData = {
  variablesStartAddr: number;
  variablesLength: number;
  executingCtxAddr: number;
  firstCtxAddr: number;
};

import { createContext } from "react";
import { SceneCtx } from "shared/lib/scripts/context";

export const SceneContext = createContext<SceneCtx>({
  spriteMode: undefined,
});

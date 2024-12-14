import type { EngineFieldSchema } from "store/features/engine/engineState";
import type {
  ActorDirection,
  EngineFieldValue,
} from "shared/lib/entities/entitiesTypes";
import {
  avatarFontSymbol,
  PrecompiledFontData,
  PrecompiledScene,
} from "./generateGBVMData";
import { dirEnum } from "./helpers";
import { PrecompiledAvatarData } from "./compileAvatars";

interface InitialState {
  startX: number;
  startY: number;
  startDirection: ActorDirection;
  startScene: PrecompiledScene;
  startMoveSpeed: number;
  startAnimSpeed: number;
  fonts: PrecompiledFontData[];
  avatarFonts: PrecompiledAvatarData[][];
  engineFields: EngineFieldSchema[];
  engineFieldValues: EngineFieldValue[];
  usedSceneTypeIds: string[];
}

export const compileScriptEngineInit = ({
  startX,
  startY,
  startDirection,
  startScene,
  startMoveSpeed,
  startAnimSpeed,
  fonts,
  avatarFonts,
  engineFields,
  engineFieldValues,
  usedSceneTypeIds,
}: InitialState) => {
  const usedEngineFields = engineFields.filter(
    (engineField: EngineFieldSchema) =>
      engineField.cType !== "define" &&
      (!engineField.sceneType ||
        usedSceneTypeIds.includes(engineField.sceneType))
  );

  return `.include "vm.i"
.include "macro.i"
.include "data/game_globals.i"

; define constants in rom bank 0
.area _CODE

_start_scene_x:: 
        .dw ${(startX || 0) * 8 * 16}
_start_scene_y:: 
        .dw ${(startY || 0) * 8 * 16} 
_start_scene_dir:: 
        .db .${dirEnum(startDirection)}
_start_scene::
        IMPORT_FAR_PTR_DATA _${startScene.symbol}
_start_player_move_speed:: 
        .db ${Math.round(startMoveSpeed * 16)}
_start_player_anim_tick:: 
        .db ${startAnimSpeed}
_ui_fonts:: 
${fonts.map((font) => `        IMPORT_FAR_PTR_DATA _${font.symbol}`).join("\n")}
${avatarFonts
  .map(
    (_, avatarFontIndex) =>
      `        IMPORT_FAR_PTR_DATA _${avatarFontSymbol(avatarFontIndex)}`
  )
  .join("\n")}

; define engine init VM routine which will be packed into some bank
.area _CODE_255

___bank_script_engine_init = 255
.globl ___bank_script_engine_init

${usedEngineFields
  .map((engineField) => {
    return `.globl _${engineField.key}`;
  })
  .join("\n")}

_script_engine_init::
${usedEngineFields
  .map((engineField) => {
    const engineValue = engineFieldValues.find((v) => v.id === engineField.key);
    const value =
      engineValue && engineValue.value !== undefined
        ? engineValue.value
        : engineField.defaultValue;
    if(engineField.cType === "WORD" || engineField.cType === "UWORD")
        return `        VM_SET_CONST_INT16      _${engineField.key}, ${value}`;
    else
        return `        VM_SET_CONST_INT8       _${engineField.key}, ${value}`;
  })
  .join("\n")}

        ; return from init routine
        VM_RET_FAR
`;
};

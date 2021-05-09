import { EngineFieldSchema } from "../../store/features/engine/engineState";
import {
  ActorDirection,
  Font,
  EngineFieldValue,
} from "../../store/features/entities/entitiesTypes";
import { avatarFontSymbol, fontSymbol, sceneSymbol } from "./compileData2";
import { dirEnum } from "./helpers";

interface InitialState {
  startX: number;
  startY: number;
  startDirection: ActorDirection;
  startSceneIndex: number;
  startMoveSpeed: number;
  startAnimSpeed: number;
  fonts: Font[];
  avatarFonts: undefined[];
  isCGB: boolean;
  engineFields: EngineFieldSchema[];
  engineFieldValues: EngineFieldValue[];
}

export const compileScriptEngineInit = ({
  startX,
  startY,
  startDirection,
  startSceneIndex,
  startMoveSpeed,
  startAnimSpeed,
  fonts,
  avatarFonts,
  isCGB,
  engineFields,
  engineFieldValues,
}: InitialState) => `.include "vm.i"
.include "macro.i"

; define constants in rom bank 0
.area _CODE

_start_scene_x:: 
        .dw ${(startX || 0) * 8 * 16}
_start_scene_y:: 
        .dw ${(startY || 0) * 8 * 16} 
_start_scene_dir:: 
        .db .${dirEnum(startDirection)}
_start_scene::
        IMPORT_FAR_PTR_DATA _${sceneSymbol(startSceneIndex)}
_start_player_move_speed:: 
        .db ${Math.round(startMoveSpeed * 16)}
_start_player_anim_tick:: 
        .db ${startAnimSpeed}
_ui_fonts:: 
${fonts
  .map(
    (_, fontIndex) => `        IMPORT_FAR_PTR_DATA _${fontSymbol(fontIndex)}`
  )
  .join("\n")}
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

${engineFields
  .map((engineField) => {
    return `.globl _${engineField.key}`;
  })
  .join("\n")}

_script_engine_init::
${engineFields
  .map((engineField) => {
    const engineValue = engineFieldValues.find((v) => v.id === engineField.key);
    const value =
      engineValue && engineValue.value !== undefined
        ? engineValue.value
        : engineField.defaultValue;
    return `        VM_SET_CONST_INT16      _${engineField.key}, ${value}`;
  })
  .join("\n")}

        ; return from init routine
        VM_RET_FAR
`;

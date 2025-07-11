import type {
  EngineFieldCType,
  EngineFieldSchema,
} from "store/features/engine/engineState";
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
import { gbvmSetConstForCType } from "shared/lib/engineFields/engineFieldToCType";
import { pxToSubpx, tileToSubpx } from "shared/lib/helpers/subpixels";

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

const roundValue = (
  value: string | number | boolean | undefined,
): string | number | boolean | undefined => {
  if (typeof value === "number") {
    return Math.floor(value);
  }
  return value;
};

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
      engineField.key?.length > 0 &&
      (!engineField.sceneType ||
        usedSceneTypeIds.includes(engineField.sceneType)),
  );
  const engineFieldInitialValues = usedEngineFields.reduce(
    (memo, engineField) => {
      if (engineField.cType === "define" || engineField.runtimeOnly) {
        return memo;
      }
      const engineValue = engineFieldValues.find(
        (v) => v.id === engineField.key,
      );
      const value = roundValue(
        engineValue && engineValue.value !== undefined
          ? engineValue.value
          : engineField.defaultValue,
      );
      memo.push({
        cType: engineField.cType,
        key: engineField.key,
        value,
      });
      return memo;
    },
    [] as Array<{
      cType: EngineFieldCType;
      key: string;
      value: string | number | boolean | undefined;
    }>,
  );
  const engineFieldInitRPN =
    engineFieldInitialValues.length === 0
      ? ""
      : "VM_RPN\n" +
        engineFieldInitialValues
          .map(({ cType, key, value }) => {
            if (cType === "WORD" || cType === "UWORD") {
              return `            .R_INT16 ${value}\n            .R_REF_MEM_SET .MEM_I16, _${key}\n`;
            } else if (cType === "BYTE" || cType === "UBYTE") {
              return `            .R_INT8 ${value}\n            .R_REF_MEM_SET .MEM_I8, _${key}\n`;
            }
            return "";
          })
          .join("") +
        "            .R_STOP";

  return `.include "vm.i"
.include "macro.i"
.include "data/game_globals.i"

; define constants in rom bank 0
.area _CODE

_start_scene_x:: 
        .dw ${tileToSubpx(startX || 0)}
_start_scene_y:: 
        .dw ${tileToSubpx(startY || 0)} 
_start_scene_dir:: 
        .db .${dirEnum(startDirection)}
_start_scene::
        IMPORT_FAR_PTR_DATA _${startScene.symbol}
_start_player_move_speed:: 
        .db ${pxToSubpx(startMoveSpeed)}
_start_player_anim_tick:: 
        .db ${startAnimSpeed}
_ui_fonts:: 
${fonts.map((font) => `        IMPORT_FAR_PTR_DATA _${font.symbol}`).join("\n")}
${avatarFonts
  .map(
    (_, avatarFontIndex) =>
      `        IMPORT_FAR_PTR_DATA _${avatarFontSymbol(avatarFontIndex)}`,
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
        ${engineFieldInitRPN}

        ; return from init routine
        VM_RET_FAR
`;
};

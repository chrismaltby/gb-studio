import {
  ActorDirection,
  Font,
} from "../../store/features/entities/entitiesTypes";
import { fontSymbol, sceneSymbol } from "./compileData2";
import { dirEnum } from "./helpers";

interface InitialState {
  startX: number;
  startY: number;
  startDirection: ActorDirection;
  startSceneIndex: number;
  startMoveSpeed: number;
  startAnimSpeed: number;
  fonts: Font[];
  isCGB: boolean;
}

export const compileScriptEngineInit = ({
  startX,
  startY,
  startDirection,
  startSceneIndex,
  startMoveSpeed,
  startAnimSpeed,
  fonts,
  isCGB,
}: InitialState) => `.include "vm.i"
.include "macro.i"

; define constants in rom bank 0
.area _CODE

_start_scene_x:: 
        .dw ${(startX || 0) * 8 * 16}
_start_scene_y:: 
        .dw ${(startY + 1 || 0) * 8 * 16} 
_start_scene_dir:: 
        .db .${dirEnum(startDirection)}
_start_scene::
        IMPORT_FAR_PTR_DATA _${sceneSymbol(startSceneIndex)}
${
  isCGB
    ? `_start_player_palette:: 
        IMPORT_FAR_PTR_DATA _palette_0
`
    : ""
}_start_player_move_speed:: 
        .db ${Math.round(startMoveSpeed * 16)}
_start_player_anim_tick:: 
        .db ${startAnimSpeed}
_ui_fonts:: 
${fonts
  .map(
    (_, fontIndex) => `        IMPORT_FAR_PTR_DATA _${fontSymbol(fontIndex)}`
  )
  .join("\n")}

; define engine init VM routine which will be packed into some bank
.area _CODE_255

___bank_script_engine_init = 255
.globl ___bank_script_engine_init

.globl _plat_min_vel, _plat_walk_vel, _plat_climb_vel, _plat_run_vel, _plat_walk_acc, _plat_run_acc, _plat_dec, _plat_jump_vel, _plat_grav, _plat_hold_grav, _plat_max_fall_vel
.globl  _topdown_grid
.globl _fade_style

_script_engine_init::
        ; platformer fields 
        VM_SET_CONST_INT16      _plat_min_vel, 304
        VM_SET_CONST_INT16      _plat_walk_vel, 6400
        VM_SET_CONST_INT16      _plat_climb_vel, 4000
        VM_SET_CONST_INT16      _plat_run_vel, 10496
        VM_SET_CONST_INT16      _plat_walk_acc, 152
        VM_SET_CONST_INT16      _plat_run_acc, 228
        VM_SET_CONST_INT16      _plat_dec, 208
        VM_SET_CONST_INT16      _plat_jump_vel, 16384
        VM_SET_CONST_INT16      _plat_grav, 1792
        VM_SET_CONST_INT16      _plat_hold_grav, 512
        VM_SET_CONST_INT16      _plat_max_fall_vel, 20000
        
        ; topdown fields
        VM_SET_CONST_INT8       _topdown_grid, 8
        
        ; other common fields
        VM_SET_CONST_INT8       _fade_style, 1    

        ; return from init routine
        VM_RET_FAR
`;

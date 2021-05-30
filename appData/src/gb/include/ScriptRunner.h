#ifndef SCRIPT_RUNNER_H
#define SCRIPT_RUNNER_H

#include <gb/gb.h>

#include "BankData.h"
#include "Math.h"

#define SCRIPT_RUNNER_BANK 4
#define MAX_SCENE_STATES 8
#define MAX_BG_SCRIPT_CONTEXTS 11
#define MAX_SCRIPT_CONTEXTS 12

typedef void (*SCRIPT_CMD_FN)();
typedef UBYTE (*SCRIPT_UPDATE_FN)();

typedef enum { MOVE_HORIZONTAL = 0, MOVE_VERTICAL, MOVE_DIAGONAL } MOVEMENT_TYPE;

typedef struct _SCRIPT_CMD {
  SCRIPT_CMD_FN fn;
  UBYTE args_len;
} SCRIPT_CMD;

typedef struct _SCENE_STATE {
  UWORD scene_index;
  Pos player_pos;
  Vector2D player_dir;
} SCENE_STATE;

typedef struct {
  UINT16 actor_move_dest_x;
  UINT16 actor_move_dest_y;
  SCRIPT_UPDATE_FN script_update_fn;
  UBYTE* script_start_ptr;
  UBYTE* script_ptr;
  UWORD script_ptr_x;
  UWORD script_ptr_y;
  UBYTE script_ptr_bank;
  UBYTE wait_time;
  UBYTE script_await_next_frame;
  UBYTE script_actor;
  UBYTE owner;
  UBYTE actor_move_cols;
  MOVEMENT_TYPE actor_move_type;
  UBYTE tmp_1;
  UBYTE tmp_2;
  UBYTE dummy24byte; // even struct faster index multiplication
} ScriptContext;

extern ScriptContext script_ctxs[MAX_SCRIPT_CONTEXTS];
extern ScriptContext active_script_ctx;
extern UBYTE active_script_ctx_index;

extern UINT8 script_ctx_pool[];
extern UBYTE script_cmd_args[7];
extern UBYTE script_cmd_args_len;
extern const SCRIPT_CMD script_cmds[];
extern UBYTE script_main_ctx_actor;

// Max call stack depth
#define STACK_SIZE 8
extern UBYTE* script_stack[STACK_SIZE];
extern UBYTE script_bank_stack[STACK_SIZE];
extern UBYTE* script_start_stack[STACK_SIZE];
extern UBYTE script_stack_ptr;

// Timer script
extern UBYTE timer_script_duration;
extern UBYTE timer_script_time;
extern BankPtr timer_script_ptr;

void ScriptRunnerInit();
void ScriptStart(BankPtr* events_ptr);
UBYTE ScriptStartBg(BankPtr* events_ptr, UBYTE owner);
void ScriptRunnerUpdate();
void ScriptTimerUpdate();
void ScriptRestoreCtx(UBYTE i);
void ScriptSaveCtx();
UINT8 ScriptCtxPoolNext();
void ScriptCtxPoolReturn(UINT8 ctx, UBYTE owner);
void ScriptCtxPoolReset();

// Banked functions - don't call directly
void Script_Noop_b();
void Script_End_b();
void Script_Text_b();
void Script_Goto_b();
void Script_IfFlag_b();
void Script_SetFlag_b();
void Script_ClearFlag_b();
void Script_ActorSetDir_b();
void Script_ActorActivate_b();
void Script_CameraMoveTo_b();
void Script_CameraLock_b();
void Script_Wait_b();
void Script_FadeOut_b();
void Script_FadeIn_b();
void Script_LoadScene_b();
void Script_ActorSetPos_b();
void Script_ActorMoveTo_b();
void Script_ShowSprites_b();
void Script_HideSprites_b();
void Script_ActorShow_b();
void Script_ActorHide_b();
void Script_ActorSetEmote_b();
void Script_CameraShake_b();
void Script_ShowOverlay_b();
void Script_HideOverlay_b();
void Script_OverlaySetPos_b();
void Script_OverlayMoveTo_b();
void Script_AwaitInput_b();
void Script_MusicPlay_b();
void Script_MusicStop_b();
void Script_ResetVariables_b();
void Script_NextFrame_b();
void Script_IncFlag_b();
void Script_DecFlag_b();
void Script_SetFlagValue_b();
void Script_SetFlagProperty_b();
void Script_IfValue_b();
void Script_IfInput_b();
void Script_Choice_b();
void Script_PlayerSetSprite_b();
void Script_ActorPush_b();
void Script_IfActorPos_b();
void Script_LoadData_b();
void Script_SaveData_b();
void Script_ClearData_b();
void Script_IfSavedData_b();
void Script_IfActorDirection_b();
void Script_SetFlagRandomValue_b();
void Script_ActorGetPos_b();
void Script_ActorSetPosToVal_b();
void Script_ActorMoveToVal_b();
void Script_ActorMoveRel_b();
void Script_ActorSetPosRel_b();
void Script_MathAdd_b();
void Script_MathSub_b();
void Script_MathMul_b();
void Script_MathDiv_b();
void Script_MathMod_b();
void Script_MathAddVal_b();
void Script_MathSubVal_b();
void Script_MathMulVal_b();
void Script_MathDivVal_b();
void Script_MathModVal_b();
void Script_CopyVal_b();
void Script_IfValueCompare_b();
void Script_LoadVectors_b();
void Script_ActorSetMoveSpeed_b();
void Script_ActorSetAnimSpeed_b();
void Script_TextSetAnimSpeed_b();
void Script_ScenePushState_b();
void Script_ScenePopState_b();
void Script_ActorInvoke_b();
void Script_StackPush_b();
void Script_StackPop_b() __banked;
void Script_SceneResetStack_b();
void Script_ScenePopAllState_b();
void Script_SetInputScript_b();
void Script_RemoveInputScript_b();
void Script_ActorSetFrame_b();
void Script_ActorSetFlip_b();
void Script_TextMulti_b();
void Script_ActorSetFrameToVal_b();
void Script_VariableAddFlags_b();
void Script_VariableClearFlags_b();
void Script_SoundPlayTone_b();
void Script_SoundStopTone_b();
void Script_SoundPlayBeep_b();
void Script_SoundPlayCrash_b();
void Script_SetTimerScript_b();
void Script_ResetTimer_b();
void Script_RemoveTimerScript_b();
void Script_TextWithAvatar_b();
void Script_TextMenu_b();
void Script_ActorSetCollisions_b();
void Script_LaunchProjectile_b();
void Script_ActorSetSprite_b();
void Script_IfActorRelActor_b();
void Script_PlayerBounce_b();
void Script_WeaponAttack_b();
void Script_PalSetBackground_b();
void Script_PalSetSprite_b();
void Script_PalSetUI_b();
void Script_ActorStopUpdate_b();
void Script_ActorSetAnimate_b();
void Script_IfColorSupported_b();
void Script_EngFieldSet_b();
void Script_EngFieldSetWord_b();
void Script_EngFieldSetVar_b();
void Script_EngFieldSetWordVar_b();
void Script_EngFieldStore_b();
void Script_EngFieldStoreWord_b();

#endif

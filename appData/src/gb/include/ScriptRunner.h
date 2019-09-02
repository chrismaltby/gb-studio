#ifndef SCRIPT_RUNNER_H
#define SCRIPT_RUNNER_H

#include <gb/gb.h>
#include "game.h"

extern UINT8 scriptrunner_bank;
extern UBYTE script_ptr_bank;
extern UWORD script_start_ptr;
extern UBYTE script_cmd_args[6];
extern UBYTE script_cmd_args_len;

extern UWORD script_ptr;
extern UWORD script_ptr_x;
extern UWORD script_ptr_y;
extern UBYTE script_action_complete;
extern UBYTE script_continue;
extern UBYTE script_actor;

// Max call stack depth
#define STACK_SIZE 8
extern UWORD script_stack[STACK_SIZE];
extern UWORD script_start_stack[STACK_SIZE];
extern UBYTE script_stack_ptr;

void ScriptStart(BANK_PTR *events_ptr);
void ScriptRunnerUpdate();

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
void Script_StackPop_b();
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
void Script_SoundStartTone_b();
void Script_SoundStopTone_b();
void Script_SoundPlayBeep_b();
void Script_SoundPlayCrash_b();

#endif

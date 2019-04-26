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
extern UBYTE script_action_complete;
extern UBYTE script_continue;
extern UBYTE script_actor;

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
#endif

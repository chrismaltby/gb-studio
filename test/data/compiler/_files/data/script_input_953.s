.module script_input_953

.include "vm.i"
.include "data/game_globals.i"

.globl _pl_vel_x, b_wait_frames, _wait_frames

.area _CODE_255

.LOCAL_ACTOR = -4
.LOCAL_TMP1_WAIT_ARGS = -5

___bank_script_input_953 = 255
.globl ___bank_script_input_953

_script_input_953::
        VM_RESERVE              5

GBVM$script_input_953$e667609e_f386_42c5_baf9_7302acaec0c3$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_input_953$e667609e_f386_42c5_baf9_7302acaec0c3$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Actor Set Active
        VM_SET_CONST            .LOCAL_ACTOR, 0

        ; Actor Set Animation Tick
        VM_ACTOR_SET_ANIM_TICK  .LOCAL_ACTOR, 3

GBVM$script_input_953$ed208842_89f5_4e58_90ba_0bab2fbaada7$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_input_953$ed208842_89f5_4e58_90ba_0bab2fbaada7$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Sound Play
        VM_SFX_PLAY             ___bank_sound_glug, _sound_glug, ___mute_mask_sound_glug, .SFX_PRIORITY_NORMAL

GBVM$script_input_953$9f95209a_76b1_43b0_9fd0_f76d43637b14$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_input_953$9f95209a_76b1_43b0_9fd0_f76d43637b14$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Player Field Set To Value
        VM_SET_CONST_INT16      _pl_vel_x, 3500

GBVM$script_input_953$a72efba4_7fe8_4b8b_8c23_99e41a63ed40$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_input_953$a72efba4_7fe8_4b8b_8c23_99e41a63ed40$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Wait 18 Frames
        VM_SET_CONST            .LOCAL_TMP1_WAIT_ARGS, 18
        VM_INVOKE               b_wait_frames, _wait_frames, 0, .LOCAL_TMP1_WAIT_ARGS

GBVM$script_input_953$de40314c_39fa_4d32_9fa9_95b93f284ac4$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_input_953$de40314c_39fa_4d32_9fa9_95b93f284ac4$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; If
        ; -- If Truthy
        VM_IF_CONST             .NE, VAR_PBJ, 0, 1$, 0
        VM_JUMP                 2$
1$:
GBVM$script_input_953$b9708e56_35b1_41d6_acad_2266d7a3886f$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_input_953$b9708e56_35b1_41d6_acad_2266d7a3886f$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Actor Set Active
        VM_SET_CONST            .LOCAL_ACTOR, 0

        ; Actor Set Animation Tick
        VM_ACTOR_SET_ANIM_TICK  .LOCAL_ACTOR, 15

2$:

GBVM_END$script_input_953$de40314c_39fa_4d32_9fa9_95b93f284ac4 = .
.globl GBVM_END$script_input_953$de40314c_39fa_4d32_9fa9_95b93f284ac4
        ; Stop Script
        VM_STOP

.module script_input_954

.include "vm.i"
.include "data/game_globals.i"

.globl _pl_vel_x, b_wait_frames, _wait_frames

.area _CODE_255

.LOCAL_ACTOR = -4
.LOCAL_TMP1_WAIT_ARGS = -5

___bank_script_input_954 = 255
.globl ___bank_script_input_954

_script_input_954::
        VM_RESERVE              5

GBVM$script_input_954$d1a52cf0_f66f_4a14_9bc8_e544ccf78d10$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_input_954$d1a52cf0_f66f_4a14_9bc8_e544ccf78d10$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Actor Set Active
        VM_SET_CONST            .LOCAL_ACTOR, 0

        ; Actor Set Animation Tick
        VM_ACTOR_SET_ANIM_TICK  .LOCAL_ACTOR, 3

GBVM$script_input_954$6a49c0d3_d198_4bcb_81a9_b931d8e5f2eb$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_input_954$6a49c0d3_d198_4bcb_81a9_b931d8e5f2eb$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Sound Play
        VM_SFX_PLAY             ___bank_sound_glug, _sound_glug, ___mute_mask_sound_glug, .SFX_PRIORITY_NORMAL

GBVM$script_input_954$94d37025_cf02_4b75_993b_2fc43272959d$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_input_954$94d37025_cf02_4b75_993b_2fc43272959d$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Player Field Set To Value
        VM_SET_CONST_INT16      _pl_vel_x, 3500

GBVM$script_input_954$17dc64ed_7a2e_4883_880d_a451c38aff6a$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_input_954$17dc64ed_7a2e_4883_880d_a451c38aff6a$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Wait 18 Frames
        VM_SET_CONST            .LOCAL_TMP1_WAIT_ARGS, 18
        VM_INVOKE               b_wait_frames, _wait_frames, 0, .LOCAL_TMP1_WAIT_ARGS

GBVM$script_input_954$59e2b37c_e300_48c0_975f_ea74df7dce7b$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_input_954$59e2b37c_e300_48c0_975f_ea74df7dce7b$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; If
        ; -- If Truthy
        VM_IF_CONST             .NE, VAR_PBJ, 0, 1$, 0
        VM_JUMP                 2$
1$:
GBVM$script_input_954$947db3fc_65eb_4ef3_874e_f1676e00d8ca$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_input_954$947db3fc_65eb_4ef3_874e_f1676e00d8ca$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Actor Set Active
        VM_SET_CONST            .LOCAL_ACTOR, 0

        ; Actor Set Animation Tick
        VM_ACTOR_SET_ANIM_TICK  .LOCAL_ACTOR, 15

2$:

GBVM_END$script_input_954$59e2b37c_e300_48c0_975f_ea74df7dce7b = .
.globl GBVM_END$script_input_954$59e2b37c_e300_48c0_975f_ea74df7dce7b
        ; Stop Script
        VM_STOP

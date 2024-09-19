.module script_timer_54

.include "vm.i"
.include "data/game_globals.i"

.globl _pl_vel_y

.area _CODE_255


___bank_script_timer_54 = 255
.globl ___bank_script_timer_54

_script_timer_54::
GBVM$script_timer_54$f886b333_1987_497d_872e_44366e09e01c$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_timer_54$f886b333_1987_497d_872e_44366e09e01c$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; If
        ; -- If Truthy
        VM_IF_CONST             .NE, VAR_PBJ, 0, 1$, 0
        VM_JUMP                 2$
1$:
GBVM$script_timer_54$fd2cb89d_323c_44b4_98ac_cac59f8cbd80$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_timer_54$fd2cb89d_323c_44b4_98ac_cac59f8cbd80$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Store player field in variable
        VM_GET_INT16 VAR_PLAYER_VELOCITY_Y, _pl_vel_y

GBVM$script_timer_54$e328454e_bbc7_4fc8_85a2_b2b8eb25a576$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_timer_54$e328454e_bbc7_4fc8_85a2_b2b8eb25a576$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; If
        ; -- Calculate value
        VM_RPN
            .R_REF      VAR_PLAYER_VELOCITY_Y
            .R_INT16    1000
            .R_OPERATOR .GTE
            .R_STOP
        ; -- If Truthy
        VM_IF_CONST             .NE, .ARG0, 0, 3$, 1
GBVM$script_timer_54$9d2f1a99_97ab_4608_9f6f_add82ad57622$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_timer_54$9d2f1a99_97ab_4608_9f6f_add82ad57622$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; If
        ; -- Calculate value
        VM_RPN
            .R_REF      VAR_PLAYER_VELOCITY_Y
            .R_INT16    -1000
            .R_OPERATOR .LTE
            .R_STOP
        ; -- If Truthy
        VM_IF_CONST             .NE, .ARG0, 0, 5$, 1
GBVM$script_timer_54$c1340720_edb4_488a_99e9_c3eb436c1f16$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_timer_54$c1340720_edb4_488a_99e9_c3eb436c1f16$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Player Field Set To Value
        VM_SET_CONST_INT16      _pl_vel_y, 0

        VM_JUMP                 6$
5$:
GBVM$script_timer_54$9ed27cd3_4536_4a51_a414_9d1f325b1e96$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_timer_54$9ed27cd3_4536_4a51_a414_9d1f325b1e96$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Variables .ADD Value
        VM_RPN
            .R_REF      VAR_PLAYER_VELOCITY_Y
            .R_INT16    1000
            .R_OPERATOR .ADD
            .R_REF_SET  VAR_PLAYER_VELOCITY_Y
            .R_STOP

GBVM$script_timer_54$cb0db07b_16b1_4e3b_972c_b7e5bcdd8adf$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_timer_54$cb0db07b_16b1_4e3b_972c_b7e5bcdd8adf$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Player Field Set To Variable
        VM_SET_INT16            _pl_vel_y, VAR_PLAYER_VELOCITY_Y

6$:

GBVM_END$script_timer_54$9d2f1a99_97ab_4608_9f6f_add82ad57622 = .
.globl GBVM_END$script_timer_54$9d2f1a99_97ab_4608_9f6f_add82ad57622
        VM_JUMP                 4$
3$:
GBVM$script_timer_54$14f3a0b6_777c_4755_943f_9b8448af3601$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_timer_54$14f3a0b6_777c_4755_943f_9b8448af3601$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Variables .SUB Value
        VM_RPN
            .R_REF      VAR_PLAYER_VELOCITY_Y
            .R_INT16    1000
            .R_OPERATOR .SUB
            .R_REF_SET  VAR_PLAYER_VELOCITY_Y
            .R_STOP

GBVM$script_timer_54$17a8e64e_2edb_407f_9914_f0e98881a27c$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script = .
.globl GBVM$script_timer_54$17a8e64e_2edb_407f_9914_f0e98881a27c$d6878db2_1b2e_4566_91fd_2ecb3514f4a2$trigger$b1581bb0_ed66_4ca6_ac4c_34f11cc08593$script
        ; Player Field Set To Variable
        VM_SET_INT16            _pl_vel_y, VAR_PLAYER_VELOCITY_Y

4$:

GBVM_END$script_timer_54$e328454e_bbc7_4fc8_85a2_b2b8eb25a576 = .
.globl GBVM_END$script_timer_54$e328454e_bbc7_4fc8_85a2_b2b8eb25a576
2$:

GBVM_END$script_timer_54$f886b333_1987_497d_872e_44366e09e01c = .
.globl GBVM_END$script_timer_54$f886b333_1987_497d_872e_44366e09e01c
        ; Stop Script
        VM_STOP

.module script_timer_40

.include "vm.i"
.include "data/game_globals.i"

.globl _pl_vel_y

.area _CODE_255


___bank_script_timer_40 = 255
.globl ___bank_script_timer_40

_script_timer_40::
GBVM$script_timer_40$c4b3c9fa_165f_42d2_8769_b0cbb372a4ee$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script = .
.globl GBVM$script_timer_40$c4b3c9fa_165f_42d2_8769_b0cbb372a4ee$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script
        ; If
        ; -- If Truthy
        VM_IF_CONST             .NE, VAR_PBJ, 0, 1$, 0
        VM_JUMP                 2$
1$:
GBVM$script_timer_40$ee5c1a5b_a649_4996_bac8_75e5ece39dc5$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script = .
.globl GBVM$script_timer_40$ee5c1a5b_a649_4996_bac8_75e5ece39dc5$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script
        ; Store player field in variable
        VM_GET_INT16 VAR_PLAYER_VELOCITY_Y, _pl_vel_y

GBVM$script_timer_40$a4758415_6832_4f31_8725_36a667baa63f$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script = .
.globl GBVM$script_timer_40$a4758415_6832_4f31_8725_36a667baa63f$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script
        ; If
        ; -- Calculate value
        VM_RPN
            .R_REF      VAR_PLAYER_VELOCITY_Y
            .R_INT16    1000
            .R_OPERATOR .GTE
            .R_STOP
        ; -- If Truthy
        VM_IF_CONST             .NE, .ARG0, 0, 3$, 1
GBVM$script_timer_40$ef040f57_6839_4f8a_a3d1_2312e3d87d5f$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script = .
.globl GBVM$script_timer_40$ef040f57_6839_4f8a_a3d1_2312e3d87d5f$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script
        ; If
        ; -- Calculate value
        VM_RPN
            .R_REF      VAR_PLAYER_VELOCITY_Y
            .R_INT16    -1000
            .R_OPERATOR .LTE
            .R_STOP
        ; -- If Truthy
        VM_IF_CONST             .NE, .ARG0, 0, 5$, 1
GBVM$script_timer_40$d5ca3699_6d48_4fa4_81e6_fb0ddc613a04$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script = .
.globl GBVM$script_timer_40$d5ca3699_6d48_4fa4_81e6_fb0ddc613a04$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script
        ; Player Field Set To Value
        VM_SET_CONST_INT16      _pl_vel_y, 0

        VM_JUMP                 6$
5$:
GBVM$script_timer_40$3f3d0fa4_480c_4189_bdde_e804b83d6a97$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script = .
.globl GBVM$script_timer_40$3f3d0fa4_480c_4189_bdde_e804b83d6a97$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script
        ; Variables .ADD Value
        VM_RPN
            .R_REF      VAR_PLAYER_VELOCITY_Y
            .R_INT16    1000
            .R_OPERATOR .ADD
            .R_REF_SET  VAR_PLAYER_VELOCITY_Y
            .R_STOP

GBVM$script_timer_40$fbf7b402_b8ec_4f63_98c1_2bf64acd5bc3$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script = .
.globl GBVM$script_timer_40$fbf7b402_b8ec_4f63_98c1_2bf64acd5bc3$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script
        ; Player Field Set To Variable
        VM_SET_INT16            _pl_vel_y, VAR_PLAYER_VELOCITY_Y

6$:

GBVM_END$script_timer_40$ef040f57_6839_4f8a_a3d1_2312e3d87d5f = .
.globl GBVM_END$script_timer_40$ef040f57_6839_4f8a_a3d1_2312e3d87d5f
        VM_JUMP                 4$
3$:
GBVM$script_timer_40$505e2b80_fe03_4832_a5ab_fe7606e9d661$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script = .
.globl GBVM$script_timer_40$505e2b80_fe03_4832_a5ab_fe7606e9d661$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script
        ; Variables .SUB Value
        VM_RPN
            .R_REF      VAR_PLAYER_VELOCITY_Y
            .R_INT16    1000
            .R_OPERATOR .SUB
            .R_REF_SET  VAR_PLAYER_VELOCITY_Y
            .R_STOP

GBVM$script_timer_40$a0e9c13f_96e5_4b65_af14_d9fffe0187fc$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script = .
.globl GBVM$script_timer_40$a0e9c13f_96e5_4b65_af14_d9fffe0187fc$401c4930_00c4_41aa_8046_55b9014eead3$trigger$190705a9_3692_4593_b3cf_35c9338c9a8d$script
        ; Player Field Set To Variable
        VM_SET_INT16            _pl_vel_y, VAR_PLAYER_VELOCITY_Y

4$:

GBVM_END$script_timer_40$a4758415_6832_4f31_8725_36a667baa63f = .
.globl GBVM_END$script_timer_40$a4758415_6832_4f31_8725_36a667baa63f
2$:

GBVM_END$script_timer_40$c4b3c9fa_165f_42d2_8769_b0cbb372a4ee = .
.globl GBVM_END$script_timer_40$c4b3c9fa_165f_42d2_8769_b0cbb372a4ee
        ; Stop Script
        VM_STOP

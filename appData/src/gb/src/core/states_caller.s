.include "global.s"

.area _CODE

.globl _state_start_fns, _state_update_fns

.globl _scene_type
.globl __current_bank

_state_init::
        ld hl, #_state_start_fns
        jr state_call

_state_update::
        ld hl, #_state_update_fns

state_call:
        ld a, (#_scene_type)
        ld e, a
        add a
        add e                   ; a *= sizeof(far_ptr)

        ADD_A_REG16 h, l        ; hl = far_ptr_array[a]
        
        ldh a, (#__current_bank)
        push af                 ; save current bank
        
        ld a, (hl+)             ; load bank
        ldh (#__current_bank), a
        ld (#rROMB0), a         ; switch to routine bank
        
        ld a, (hl+)
        ld h, (hl)
        ld l, a                 ; load offset
        rst 0x20                ; call hl

        pop af       
        ldh (#__current_bank), a
        ld (#rROMB0), a         ; restore bank
        ret
        
.include "asm.macros.s"

_UpdateCamera::

        ld hl, #_camera_settings
        ld a, (hl)
        bit 4, a
        jr nz, handle_x
        ret

    handle_x:

    ; Load player x into de
        ld hl, #_actors
        ld e, (hl)
        inc hl
        ld d, (hl)
        
    ; Add camera offset x to de and store on stack
        ld hl, #_camera_offset
        ld b, (hl)
        ld a, #8
        sub a, b
        _signed_add_a d, e

    check_x_no_deadzone:

    ; Load deadzone into a
        ld hl, #_camera_deadzone
        ld a, (hl)

    ; If no deadzone x set to new pos
        cp a, #0
        jp nz, check_x_gt
        
    ; Set camera x to new position
        ld hl, #_camera_pos
        ld (hl), e
        inc hl
        ld (hl), d
        jp handle_y

    check_x_gt:

    ; Keep new pos x on stack
        push de

    ; Load camera pos x into de
        ld hl, #_camera_pos
        ld e, (hl)
        inc hl
        ld d, (hl)

    ; Add deadzone to camera pos x
        _signed_add_a d, e

    ; Load new pos into hl
        pop hl
        
        _if_lt_16 h, l, d, e, b, check_x_lt

    handle_x_gt:

    ; Load new camera pos into de
        ld d, h
        ld e, l

    ; Sub camera deadzone x from de
        ld hl, #_camera_deadzone
        ld b, (hl)
        ld a, #0
        sub a, b
        _signed_add_a d, e

    ; Set camera x to new position
        ld hl, #_camera_pos
        ld (hl), e
        inc hl
        ld (hl), d
        jp handle_y

    check_x_lt:

    ; Save new pos to stack
        push hl

    ; Load camera pos x into de
        ld hl, #_camera_pos
        ld e, (hl)
        inc hl
        ld d, (hl)

    ; Add camera deadzone x to de
        ld hl, #_camera_deadzone
        ld b, (hl)
        ld a, #0
        sub a, b
        _signed_add_a d, e

    ; Load new pos into hl
        pop hl
        
        _if_gt_16 h, l, d, e, b, handle_y

    handle_x_lt:

    ; Load new camera pos into de
        ld d, h
        ld e, l

    ; Add camera deadzone x to de
        ld hl, #_camera_deadzone
        ld b, (hl)
        ld a, b
        _signed_add_a d, e

    ; Set camera x to new position
        ld hl, #_camera_pos
        ld (hl), e
        inc hl
        ld (hl), d
        
    handle_y:

    ; Load player y into de
        ld hl, #(_actors + 2)
        ld e, (hl)
        inc hl
        ld d, (hl)
        
    ; Add camera offset y to de and store on stack
        ld hl, #(_camera_offset + 1)
        ld b, (hl)
        ld a, #8
        sub a, b
        _signed_add_a d, e

    check_y_no_deadzone:

    ; Load deadzone into a
        ld hl, #(_camera_deadzone + 1)
        ld a, (hl)

    ; If no deadzone x set to new pos
        cp a, #0
        jp nz, check_y_gt
        
    ; Set camera y to new position
        ld hl, #(_camera_pos + 2)
        ld (hl), e
        inc hl
        ld (hl), d
        ret

    check_y_gt:

    ; Keep new pos y on stack
        push de

    ; Load camera pos y into de
        ld hl, #(_camera_pos + 2)
        ld e, (hl)
        inc hl
        ld d, (hl)

    ; Add deadzone to camera pos y
        _signed_add_a d, e

    ; Load new pos into hl
        pop hl

        _if_lt_16 h, l, d, e, b, check_y_lt

    handle_y_gt:

    ; Load new camera pos into de
        ld d, h
        ld e, l

    ; Sub camera deadzone y from de
        ld hl, #(_camera_deadzone + 1)
        ld b, (hl)
        ld a, #0
        sub a, b
        _signed_add_a d, e

    ; Set camera y to new position
        ld hl, #(_camera_pos + 2)
        ld (hl), e
        inc hl
        ld (hl), d
        ret

    check_y_lt:

    ; Save new pos to stack
        push hl

    ; Load camera pos y into de
        ld hl, #(_camera_pos + 2)
        ld e, (hl)
        inc hl
        ld d, (hl)

    ; Add camera deadzone y to de
        ld hl, #(_camera_deadzone + 1)
        ld b, (hl)
        ld a, #0
        sub a, b
        _signed_add_a d, e

    ; Load new pos into hl
        pop hl
        
        _if_lt_16 h, l, d, e, b, handle_y_lt
        ret

    handle_y_lt:

    ; Load new camera pos into de
        ld d, h
        ld e, l

    ; Add camera deadzone y to de
        ld hl, #(_camera_deadzone + 1)
        ld b, (hl)
        ld a, b
        _signed_add_a d, e

    ; Set camera y to new position
        ld hl, #(_camera_pos + 2)
        ld (hl), e
        inc hl
        ld (hl), d

        ret

.area _CODE_1

.include "asm.macros.s"

_MoveActors_b::
    ; b=loop index
        ld b, #0                                ;; b = 0
    loop_cond:
    ; If b == actors_active_size * 2 (each array item is 2 byte addr)
        ld hl, #_actors_active_size             ;; hl = *actors_active_size
        ld a, (hl)                              ;; a = actors_active_size
        add a, a                                ;; a = actors_active_size * 2
        cp b                                    ;; compare a and b
        jp z, loop_exit                         ;; if b == a goto loop_exit
        push bc                                 ;; store loop index

    ; Set hl to actor_ptrs
        ld hl, #_actor_ptrs

    ; Add index offset to hl
        ld a, b
        _add_a h l 

    ; Load current actor addr into bc
        ld b, (hl)
        inc hl
        ld c, (hl)

    ; Set hl to current actor addr and store on stack
        ld h, c
        ld l, b
        push hl

    ; Load moving into a
        ld a, #7
        _add_a h l
        ld a, (hl)

    ; If not moving skip to next active actor
        cp a, #0
        jp z, next_actor

    ; Load movespeed into a
        pop hl
        push hl

        ld a, #4
        _add_a h l
        ld a, (hl)

    ; If movespeed isn't zero carry on to movement
        cp a, #0
        jp nz, move_start

    ; If move speed is 0 and not frame 2 skip this movement
        ld hl, #_is_frame_2
        add a, (hl)
        cp a, #0
        jp nz, next_actor

    ; Set move speed to 1 if moving this frame
        ld a, #1

    move_start:
    ; Store current move speed in c
        ld c, a

    move_x:
    ; Reset hl to struct start
        pop hl
        push hl

    ; Load dirx into a
        inc hl      
        inc hl  
        inc hl  
        inc hl  
        inc hl
        ld a, (hl)        

    ; If not moving x skip to y
        cp a, #0
        jp z, move_y

    ; Load current pos x into de
        pop hl
        push hl
        ld e, (hl)
        inc hl
        ld d, (hl)

    ; Add dirx to posx
        _signed_add_a d e

    ; Set player x position from de
        ld (hl), d
        dec hl
        ld (hl), e

    move_y:
    ; Reset hl to struct start
        pop hl
        push hl

    ; Load diry into a
        ld a, #6
        _add_a h l
        ld a, (hl)   

    ; If not moving y skip to end
        cp a, #0
        jp z, move_check

    ; Load current pos y into de
        pop hl
        push hl

        inc hl
        inc hl        
        ld e, (hl)
        inc hl
        ld d, (hl)

    ; Add diry to posy
        _signed_add_a d e

    ; Set player y position from de
        ld (hl), d
        dec hl
        ld (hl), e

    move_check:
    ; If move speed (in c) was > 1 repeat move cmds until c reaches 0
        dec c
        ld a, c
        cp a, #0
        jp nz, move_x

    next_actor:
    ; Clear current actor from stack
        pop hl
    ; Restore loop index from stack
        pop bc                                  ;; retreive b as loop index
        inc b                                   ;; b++
        inc b                                   ;; b++
        jp loop_cond                            ;; goto loop_cond
    loop_exit:
        ret

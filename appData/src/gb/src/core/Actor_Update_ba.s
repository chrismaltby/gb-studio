.include "asm.macros.s"

    .PINNED_OFFSET = 0x16
    .SPRITE_INDEX_OFFSET = 0x09
    .RERENDER_OFFSET = 0x14

_UpdateActors_b::

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

    check_if_pinned:
        ld a, #.PINNED_OFFSET
        _add_a h, l
        ld a, (hl)
        cp a, #0
        jp z, handle_unpinned

    handle_pinned:
    
    ; Load current pos in de (only lowest bytes)
        pop hl
        push hl
        ld a, (hl)
        add a, #8
        ld e, a
        inc hl
        inc hl
        ld a, (hl)
        add a, #8
        ld d, a
        push de

    ; Get sprite index into a
        ld a, #(.SPRITE_INDEX_OFFSET - 2) ; ptr currently at actor.pos.y(2)
        _add_a h, l
        ld a, (hl)
        push	af
        inc	sp

        jp move_sprite_pair

    handle_unpinned:

        pop hl
        push hl

    ; Load current pos y in e (only lowest byte)
        inc hl
        inc hl
        ld e, (hl)

    ; Get scroll_offset_y
        push hl
        ld hl, #(_scroll_y)
        ld b, (hl) ; Only need lowest bit as screen wraps at 256px
        pop hl

    ; Calculate screen y and push
        ld	a, e
        add a, #8
        sub a, b
        push	af  
        inc	sp

    ; Load current pos x into e (only lowest byte)
        dec hl
        dec hl
        ld e, (hl)

    ; Get scroll_offset_x
        push hl
        ld hl, #(_scroll_x)
        ld b, (hl) ; Only need lowest bit as screen wraps at 256px
        pop hl

    ; Calculate screen x and push
        ld	a, e
        add a, #8
        sub a, b        
        push	af
        inc	sp

    ; Get sprite index into a
        ld a, #.SPRITE_INDEX_OFFSET
        _add_a h, l
        ld a, (hl)
        push	af
        inc	sp

    move_sprite_pair:

    ; Move sprite (left) using gbdk fn
        call	_move_sprite

    ; Move sprite (right) using gbdk fn
    ; Reuse y from previous call
        add sp, #2

    ; Reuse previous x value adding 8px
    ; and previous sprite value incrementing by 1
        ldhl sp, #-1
        ld	a, (hl)
        add a, #8
        ld b, a
        dec hl
        ld	c, (hl)
        inc c
        push	bc
        call	_move_sprite
        add	sp, #3

    handle_anim_update:

        ; pop hl
        ; push hl

    ; Check if frame is 8 
        ld hl, #_is_frame_8
        ld a, (hl)
        cp a, #0
        jp nz, check_rerender
    
    ; Handle animation update

    ; =======
    ; @todo update frame here
    ; ========

    check_rerender:

        pop hl
        push hl

    ; Get rerender value into a
        ld a, #.RERENDER_OFFSET
        _add_a h, l
        ld a, (hl)  
        cp a, #1
        jp nz, skip_rerender

    ; Clear rerender value
        ld (hl), #0

    handle_rerender:

        pop hl
        push hl

    ; Get sprite index into c
        ld a, #.SPRITE_INDEX_OFFSET
        _add_a h, l
        ld c, (hl)

    ; Get tile_index into b
        dec hl
        ld a, (hl)
    ; =======
    ; @todo also include frame offsets here
    ; ========
        add a, a
        add a, a        
        ld b, a

    ; Set sprite tile left b=tile_index c=sprite_index
        push bc
        call _set_sprite_tile
        pop bc

    ; Set sprite tile right
        inc b
        inc b
        inc c
        push bc
        call _set_sprite_tile
        add	sp, #2

    ; =======
    ; @todo set sprite props
    ; ========

    skip_rerender:


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

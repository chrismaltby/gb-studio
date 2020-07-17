.include "asm.macros.s"

    .POS_Y_OFFSET = 0x02
    .DIR_X_OFFSET = 0x05
    .DIR_Y_OFFSET = 0x06
    .MOVING_OFFSET = 0x07
    .PINNED_OFFSET = 0x16
    .SPRITE_OFFSET = 0x08
    .SPRITE_INDEX_OFFSET = 0x09
    .FRAME_OFFSET = 0x0F
    .FRAMES_LEN_OFFSET = 0x10
    .ANIMATE_OFFSET = 0x11
    .RERENDER_OFFSET = 0x14
    .ANIM_SPEED_OFFSET = 0x15
    .SPRITE_TYPE_OFFSET = 0x19

    .SPRITE_STATIC = 0x0
    .SPRITE_ACTOR = 0x1
    .SPRITE_ACTOR_ANIMATED = 0x2

    .FLIP_BIT = 0x5

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
        ld a, #(.SPRITE_INDEX_OFFSET - .POS_Y_OFFSET) ; ptr currently at actor.pos.y(2)
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
        ld b, (hl)
    
    ; Add frame offset
        ld a, #(.FRAME_OFFSET - .SPRITE_OFFSET)
        _add_a h, l
        ld a, (hl)
        add a, b
        ld b, a

    ; Store flipped value in e
        ld e, #0

    ; Check sprite type - if static skip direction offset
        ld a, #(.SPRITE_TYPE_OFFSET - .FRAME_OFFSET)
        _add_a h, l
        ld a, (hl)
        cp a, #.SPRITE_STATIC
        jp z, update_tile

    ; If sprite type is actor only add 1 frame per dir
        ld d, #1
        cp a, #.SPRITE_ACTOR
        jp z, check_dir_offset

    ; If sprite type is actor animated add two frames per dir
        inc d

    check_dir_offset:

    ; check y dir - if positive, just update tile
        pop hl
        push hl
        ld a, #.DIR_Y_OFFSET
        _add_a h, l
        ld a, (hl)
        cp a, #0
        jr z, add_dir_offset
        bit 7, a
        jr z, update_tile

    add_dir_offset:

    ; add tile offset to frame - for upwards or sideways movement
        ld a, d
        add a, b
        ld b, a

    ; check x dir - if zero, just update tile
        dec hl
        ld a, (hl)
        cp a, #0
        jr z, update_tile

    ;if positive don't set flip value 
        bit 7, a
        jr z, add_dir_x_offset

    ; x was negative so set e (flip) to true
        set .FLIP_BIT, e

    add_dir_x_offset:

    ; add tile offset to frame - for sideways movement
        ld a, d
        add a, b
        ld b, a

    ; ========

    update_tile:

    ; Load frame offset back into a
        ld a, b

    ; Multiply tile_index by 4 to get memory offset
        add a, a
        add a, a        
        ld b, a

    ; Render reversed if flipped
        bit .FLIP_BIT, e
        jp nz, update_tile_flipped

    ; Set sprite tile left b=tile_index*4 c=sprite_index
        push bc
        call _set_sprite_tile
        pop bc

    ; Set sprite props left
        push bc    
        ld b, e
        push bc
        call _set_sprite_prop
        pop bc
        pop bc

    ; Set sprite tile right
        inc b
        inc b
        inc c
        push bc
        call _set_sprite_tile
        pop bc

    ; Set sprite props right
        push bc    
        ld b, e
        push bc
        call _set_sprite_prop
        pop bc
        pop bc

        jp finished_rerender

    update_tile_flipped:
    ; Set sprite tile right
        inc b
        inc b
        push bc
        call _set_sprite_tile
        pop bc

    ; Set sprite props right
        push bc    
        ld b, e
        push bc
        call _set_sprite_prop
        pop bc
        pop bc

    ; Set sprite tile left
        dec b
        dec b
        inc c
        push bc
        call _set_sprite_tile
        pop bc

    ; Set sprite props left
        push bc    
        ld b, e
        push bc
        call _set_sprite_prop
        pop bc
        pop bc

    finished_rerender:
    skip_rerender:

    handle_anim_update:

    ; Check if frame is 8 (- 1)
        ld hl, #_game_time
        ld a, (hl)
        and a, #0x7
        cp a, #7
        jp nz, next_actor
    
    ; If is moving
        pop hl
        push hl     
        ld a, #.MOVING_OFFSET
        _add_a h, l
        ld a, (hl) 
        cp a, #0
        jp nz, check_anim_speed

    ; Or if is animating
        ld a, #(.ANIMATE_OFFSET - .MOVING_OFFSET)
        _add_a h, l
        ld a, (hl) 
        cp a, #0
        jp nz, check_anim_speed

    ; Else not animating right now so skip
        jp next_actor

    check_anim_speed:

        pop hl
        push hl
        ld a, #(.ANIM_SPEED_OFFSET)
        _add_a h, l
        ld a, (hl)     

    ; Anim speed == 3
        cp a, #3
        jp z, check_is_frame_16

    ; Anim speed == 4
        cp a, #4
        jp z, update_anim_frames

    ; Anim speed == 2
        cp a, #2
        jp z, check_is_frame_32

    ; Anim speed == 1
        cp a, #1
        jp z, check_is_frame_64

    ; Anim speed == 0
        jp check_is_frame_128

    check_is_frame_16:
        ld hl, #_game_time
        ld a, (hl)
        and a, #0xF
        cp a, #0xF
        jp z, update_anim_frames
        jp next_actor

    check_is_frame_32:
        ld hl, #_game_time
        ld a, (hl)
        and a, #0x1F
        cp a, #0x1F
        jp z, update_anim_frames
        jp next_actor

    check_is_frame_64:
        ld hl, #_game_time
        ld a, (hl)
        and a, #0x3F
        cp a, #0x3F
        jp z, update_anim_frames
        jp next_actor

    check_is_frame_128:
        ld hl, #_game_time
        ld a, (hl)
        and a, #0x7F
        cp a, #0x7F
        jp z, update_anim_frames
        jp next_actor

    update_anim_frames:

    ; Handle animation update
        pop hl
        push hl

    ; Load frame offset into b
        ld a, #.FRAME_OFFSET
        _add_a h, l
        ld b, (hl)

    ; Load frames_len into a
        inc hl
        ld a, (hl)

    ; If frame != frames_len - 1
        dec a
        cp a, b
        jp nz, inc_frame

    reset_frame_to_zero:
        dec hl
        ld (hl), #0
        jp set_rerender_next_frame

    inc_frame:
        dec hl
        inc (hl)
        
    set_rerender_next_frame:
    ; Set rerender flag for next frame
        pop hl
        push hl
        ld a, #.RERENDER_OFFSET
        _add_a h, l        
        ld (hl), #1

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

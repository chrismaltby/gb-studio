.include "asm.macros.s"

    GBC = 1

    .POS_Y_OFFSET = 0x02
    .DIR_X_OFFSET = 0x05
    .DIR_Y_OFFSET = 0x06
    .MOVING_OFFSET = 0x07
    .PINNED_OFFSET = 0x16
    .SPRITE_OFFSET = 0x08
    .SPRITE_INDEX_OFFSET = 0x09
    .PALETTE_INDEX_OFFSET = 0x0A
    .FRAME_OFFSET = 0x0F
    .FRAMES_LEN_OFFSET = 0x10
    .ANIMATE_OFFSET = 0x11
    .ENABLED_OFFSET = 0x12
    .RERENDER_OFFSET = 0x14
    .ANIM_SPEED_OFFSET = 0x15
    .SPRITE_TYPE_OFFSET = 0x19

    .SCRIPT_ACTOR_OFFSET = 0x11

    .SPRITE_STATIC = 0x0
    .SPRITE_ACTOR = 0x1
    .SPRITE_ACTOR_ANIMATED = 0x2

    .FLIP_BIT = 0x5

    .SCREENWIDTH_PLUS_64 = 224
    .SCREENHEIGHT_PLUS_64 = 208

.set_spr_prop:                                  ;; c - sprite no, e - value, preserves bc, spoils hl
        push bc
        ld hl, #_shadow_OAM+3 
        sla c
        sla c
        ld b, #0
        add hl, bc
        ld (hl), e
        pop bc
        ret

.set_spr_tile:                                  ;; c - sprite no, b - value, preserves bc, spoils hl
        push bc
        ld hl, #_shadow_OAM+2 
        sla c
        sla c
        ld a, b
        ld b, #0
        add hl, bc
        ld (hl), a
        pop bc
        ret
.mv_spr:                                        ;; a - spr no, b - Y, c - X, preserves a, bc, spoils hl 
        push af
        ld hl, #_shadow_OAM
        add a
        add a 
        _add_a h, l
        ld a, b
        ld (hl+), a
        ld (hl), c
        pop af
        ret

_UpdateActors::

    ; Reset delete counter
        xor a
        ld (#_actors_active_delete_count), a

    ; b=loop index
        ld b, #0                                ;; b = 0
    loop_cond:
    ; If b == actors_active_size
        ld hl, #_actors_active_size             ;; hl = *actors_active_size
        ld a, (hl)                              ;; a = actors_active_size
        cp b                                    ;; compare a and b
        jp z, loop_exit                         ;; if b == a goto loop_exit
        push bc                                 ;; store loop index

    ; Load actor index into a
        ld hl, #_actors_active
        ld a, b
        _add_a h l         
        ld a, (hl)

    ; Set hl to actor_ptrs
        ld hl, #_actor_ptrs

    ; Add index offset to hl
        add a, a ; each item is 2 bytes
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
        jr z, handle_unpinned

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
        pop bc  ; Restore bc from stack so x can be incremented by 8 for second call

        jp move_sprite_pair

    handle_unpinned:

        pop hl
        push hl

    check_is_onscreen_y:

    ; Load current pos y in de
        inc hl
        inc hl
        ld a, (hl+)
        ld e, a
        ld d, (hl)

    ; Load scroll y in hl
        ld hl, #(_draw_scroll_y)
        ld a, (hl+)
        ld h, (hl)
        ld l, a
        
    ; sub scroll_y from pos_y
        _sub16 d e h l

    ; Set dc to scroll_y + 32 for onscreen check
        ld c, e
        ld a, #32
        _add_a d, c

    ; If screen y > max_y hide
        _if_lt_u16 d, c, #0, #.SCREENHEIGHT_PLUS_64, is_onscreen_y

        jp queue_deactivate_actor

    is_onscreen_y: 

    ; Add y pos to stack ready for move call
        ld	a, e
        add a, #8
        push	af 
        inc	sp

    ; Restore hl to actor memory offset
        ldhl sp, #1
        ld a, (hl+)
        ld h, (hl)
        ld l, a

    check_is_onscreen_x:

    ; Load current pos x in de
        ld a, (hl+)
        ld e, a
        ld d, (hl)

    ; Load scroll x in hl
        ld hl, #(_draw_scroll_x)
        ld a, (hl+)
        ld h, (hl)
        ld l, a

    ; sub scroll_x from pos_x
        _sub16 d e h l

    ; Set dc to scroll_x + 32 for onscreen check
        ld c, e
        ld a, #32
        _add_a d, c    

    ; If screen x > max_x hide
        _if_lt_u16 d, c, #0, #.SCREENWIDTH_PLUS_64, is_onscreen_x

    ; Remove y value from stack
        inc	sp

        jp queue_deactivate_actor

    is_onscreen_x: 

    ; Add x pos to stack ready for move call
        ld	a, e
        add a, #8
        push	af 
        inc	sp

    ; Restore hl to actor memory offset
        ldhl sp, #2
        ld a, (hl+)
        ld h, (hl)
        ld l, a

    check_enabled:
        push hl
        ld a, #.ENABLED_OFFSET
        _add_a h, l
        ld a, (hl)
        pop hl
        cp a, #0
        jr z, hide_sprite

    check_under_win:

    ; If WX_REG == 7 - Move sprite
        push hl
        ld hl, #0xFF4B ; WX_REG
        ld a, (hl)
        pop hl
        cp a, #0x7
        jr z, move_sprite

    ; If WX_REG > screen_x - Move sprite
        push hl
        ldhl sp, #2 ; screen_x in stack
        ld e, a
        ld a, (hl)
        pop hl
        cp a, e
        jr c, move_sprite

    ; If WY_REG < screen_y - 16px - Move sprite
        push hl
        ld hl, #0xFF4A ; WY_REG
        ld e, (hl)
        ldhl sp, #3; screen_y in stack
        ld a, (hl)
        sub a, #16; screen_y - 16px
        pop hl
        cp a, e
        jr c, move_sprite

    hide_sprite:
    ; Reset stack
        add	sp, #2

    ; Get sprite index into a
        ld a, #.SPRITE_INDEX_OFFSET
        _add_a h, l
        ld a, (hl)
        jp hide_sprite_pair

    move_sprite:

    ; Get sprite index into a
        ld a, #.SPRITE_INDEX_OFFSET
        _add_a h, l
        ld a, (hl)
        pop bc  ; Restore bc from stack so x can be incremented by 8 for second call

    move_sprite_pair:

    ; Move sprite (left)
        call	.mv_spr

    ; Build second call data
        ld d, a
        inc d       ; sprite_index + 1
        ld a, c
        add a, #8   ; x + 8
        ld c, a
        ld a, d

    ; Move sprite (right)
        call	.mv_spr

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

    ; Get tile_index into b - .SPRITE_OFFSET
        dec hl
        ld b, (hl)

.if GBC
    ; Store sprite props in e
        ld a, #(.PALETTE_INDEX_OFFSET - .SPRITE_OFFSET)
        _add_a h, l
        ld e, (hl)

    ; Add frame offset
        ld a, #(.FRAME_OFFSET - .PALETTE_INDEX_OFFSET)
        _add_a h, l
        ld a, (hl)
        add a, b
        ld b, a
.else
    ; Store sprite props in e
        ld e, #0

    ; Add frame offset
        ld a, #(.FRAME_OFFSET - .SPRITE_OFFSET)
        _add_a h, l
        ld a, (hl)
        add a, b
        ld b, a
.endif 

    ; Check sprite type - if static skip direction offset
        ld a, #(.SPRITE_TYPE_OFFSET - .FRAME_OFFSET)
        _add_a h, l
        ld a, (hl)
        cp a, #.SPRITE_STATIC
        jr z, update_tile

    ; If sprite type is actor only add 1 frame per dir
        ld d, #1
        cp a, #.SPRITE_ACTOR
        jr z, check_dir_offset

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

    update_tile:

    ; Load frame offset back into a
        ld a, b

    ; Multiply tile_index by 4 to get memory offset
        add a, a
        add a, a        
        ld b, a

    ; Render reversed if flipped
        bit .FLIP_BIT, e
        jr nz, update_tile_flipped

    ; Set sprite tile left b=tile_index*4 c=sprite_index
        call .set_spr_tile

    ; Set sprite props left
        call .set_spr_prop    

    ; Set sprite tile right
        inc b
        inc b
        inc c
        call .set_spr_tile

    ; Set sprite props right
        call .set_spr_prop    

        jr finished_rerender

    update_tile_flipped:
    ; Set sprite tile right
        inc b
        inc b
        call .set_spr_tile

    ; Set sprite props right
        call .set_spr_prop    

    ; Set sprite tile left
        dec b
        dec b
        inc c
        call .set_spr_tile

    ; Set sprite props left
        call .set_spr_prop    

    finished_rerender:
    skip_rerender:

    handle_anim_update:

    ; Check if frame is 8 (- 1)
        ld hl, #_game_time
        ld a, (hl)
        and a, #0x7
        cp a, #7
        jp nz, next_actor
    
    ; If is animating
        pop hl
        push hl    
        ld a, #.ANIMATE_OFFSET
        _add_a h, l
        ld a, (hl) 
        cp a, #0
        jr nz, check_anim_speed

    ; Or if is moving
        pop hl
        push hl     
        ld a, #.MOVING_OFFSET
        _add_a h, l
        ld a, (hl) 
        cp a, #0
        jr nz, check_anim_speed

    not_animating:
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
        jr z, check_is_frame_16

    ; Anim speed == 255 (None)
        cp a, #255
        jp z, next_actor

    ; Anim speed == 4
        cp a, #4
        jr z, update_anim_frames

    ; Anim speed == 2
        cp a, #2
        jr z, check_is_frame_32

    ; Anim speed == 1
        cp a, #1
        jr z, check_is_frame_64

    ; Anim speed == 0
        jr check_is_frame_128

    check_is_frame_16:
        ld hl, #_game_time
        ld a, (hl)
        and a, #0xF
        cp a, #0xF
        jr z, update_anim_frames
        jr next_actor

    check_is_frame_32:
        ld hl, #_game_time
        ld a, (hl)
        and a, #0x1F
        cp a, #0x1F
        jr z, update_anim_frames
        jr next_actor

    check_is_frame_64:
        ld hl, #_game_time
        ld a, (hl)
        and a, #0x3F
        cp a, #0x3F
        jr z, update_anim_frames
        jr next_actor

    check_is_frame_128:
        ld hl, #_game_time
        ld a, (hl)
        and a, #0x7F
        cp a, #0x7F
        jr z, update_anim_frames
        jr next_actor

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
        jr nz, inc_frame

    reset_frame_to_zero:
        dec hl
        ld (hl), #0
        jr set_rerender_next_frame

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
        jr next_actor

    queue_deactivate_actor:
        
    ; Load current main script actor into a
        ld hl, #(_script_ctxs + .SCRIPT_ACTOR_OFFSET)
        ld a, (hl)

    ; Load active actor index into b
        ldhl sp, #3
        ld b, (hl)

    ; If main script actor is active actor then don't deactivate
        cp a, b
        jr z, next_actor

    ; Load delete counter into c
        ld hl, #_actors_active_delete_count
        ld c, (hl)

    ; Add current active actor index into delete list
        ld hl, #_actors_active_delete
        ld a, c
        _add_a h, l
        ld (hl), b

    ; Increment delete counter
        ld hl, #_actors_active_delete_count
        inc (hl)

        jr next_actor

    hide_sprite_pair:
        ld bc, #0
    ; Move sprite (left)
        call .mv_spr

    ; sprite value incrementing by 1
        inc a

    ; Move sprite (right)
        call .mv_spr

    next_actor:
    ; Clear current actor from stack
        pop hl
    ; Restore loop index from stack
        pop bc                                  ;; retreive b as loop index
        inc b                                   ;; b++
        jp loop_cond                            ;; goto loop_cond

    loop_exit:

    ;; Deactivate Offscreen Actors ----------------------------------------------

    ; b=loop index
        ld b, #0                                ;; b = 0
    delete_loop_cond:
    ; If b == actors_active_size
        ld hl, #_actors_active_delete_count    
        ld a, (hl)                              ;; a = actors_active_delete_count
        cp b                                    ;; compare a and b
        jr z, delete_loop_exit                  ;; if b == a goto loop_exit
        push bc                                 ;; store loop index

    ; Load actor index into a
        ld hl, #_actors_active_delete
        ld a, b
        _add_a h l         
        ld a, (hl)

    ; Call DeactivateActiveActor(a)
        push af
        inc sp
        call _DeactivateActiveActor
        inc sp

    ; Restore loop index from stack
        pop bc                                  ;; retreive b as loop index
        inc b                                   ;; b++
        jr delete_loop_cond                     ;; goto loop_cond

    delete_loop_exit:

        ret

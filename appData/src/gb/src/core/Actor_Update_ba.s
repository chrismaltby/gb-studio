.include "asm.macros.s"

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

        ; load pos y push to stack
        ; load pos x push to stack
        ; jp move_sprite_pair

    handle_unpinned:

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
        ld a, #9
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



    handle_rerender:


    skip_rerender:



        ; ldhl sp, #0
        ; ld	a, (hl)






    ; ldhl	sp,	#4
    ; ld	a, (hl)
    ; push	af
    ; inc	sp
    ; dec	hl
    ; ld	a, (hl)
    ; push	af
    ; inc	sp
    ; dec	hl
    ; ld	a, (hl)
    ; push	af
    ; inc	sp
    ; call	_move_sprite
    ; add	sp, #3




        ; ldhl	sp,	#-3
        ; ld a, (hl)
        ; ld a, #0x50

        ; push	af
        ; inc	sp
        ; dec hl

        ; ld a, (hl)
        ; ld a, #0x20
        ; push	af
        ; inc	sp
        ; dec hl

        ; ld a, (hl)
        ; ; inc a
        ; ; add a, #2
        ; ; ld a, #2
        ; push	af
        ; inc	sp        
        ; dec hl

        ; call	_move_sprite
        ; add	sp, #3


        ; ld hl, #0x0000
        ; dec sp
        ; pop af
        ; dec sp
        ; pop af
        ; dec sp
        ; dec sp
        ; dec sp
        ; pop af        
        ; pop a

        


        ; ; lda hl, (sp)
        ; ; lda	hl,1(sp)
        ; ; add	sp, #1
        ; ; Increase sprite offset by 1
        ; inc sp
        ; ; lda hl, (sp)
        ; ; lda 
        ; ld hl, #0x0030
        ; ld (sp), hl

        ; inc sp


        ; inc sp
        

    ; ; Move sprite (right) using gbdk fn
    ;     ld	a, #0x60
    ;     push	af
    ;     inc	sp
    ;     ld	a, c
    ;     add a, #0x08        
    ;     push	af
    ;     inc	sp
    ;     ld	a, #0x02
    ;     push	af
    ;     inc	sp
    ;     call	_move_sprite
    ;     add	sp, #3

        ; pop hl




    ; Move sprite manually - doesn't work because need to be in vblank
    ; https://www.chibiakumas.com/z80/platform3.php#LessonP30
        ; ld hl, #(0xFE00 + 36)
        ; ld (hl), #0x30
        ; inc hl
        ; ld (hl), #0x20


        ; ld	a, #0x09
        ; push	af
        ; inc	sp
        ; ld	a, #0x20
        ; push	af
        ; inc	sp
        ; ld	a, #0x20
        ; push	af
        ; inc	sp
        ; call	_move_sprite
        ; add	sp, #3


;    0000 3E 07                77 	ld	a, #0x07
;    0002 F5                   78 	push	af
;    0003 33                   79 	inc	sp
;    0004 3E 05                80 	ld	a, #0x05
;    0006 F5                   81 	push	af
;    0007 33                   82 	inc	sp
;    0008 3E 09                83 	ld	a, #0x09
;    000A F5                   84 	push	af
;    000B 33                   85 	inc	sp
;    000C CDr00r00             86 	call	_move_sprite
;    000F E8 03                87 	add	sp, #3


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

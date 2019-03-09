; font.ms
;
;	Michael Hope, 1999
;	michaelh@earthling.net
;	Distrubuted under the Artistic License - see www.opensource.org
;
	.include        "global.s"
	INCLUDE		"wait_hbl.mh"

	.globl	.cr_curs
	.globl	.adv_curs
	.globl	.cury, .curx
	.globl	.display_off

	; Structure offsets
	sfont_handle_sizeof	=	3
	sfont_handle_font	=	1
	sfont_handle_first_tile	=	0

	; Encoding types - lower 2 bits of font
	FONT_256ENCODING	=	0
	FONT_128ENCODING	=	1
	FONT_NOENCODING		=	2

	; Other bits
	FONT_BCOMPRESSED	=	2
	
	.CR     		= 	0x0A          ; Unix
	.SPACE			=	0x00

	; Maximum number of fonts
	.MAX_FONTS		= 	6

	.area	_HEADER (ABS)

	.org	.MODE_TABLE+4*.T_MODE
	JP	.tmode

	.module font.ms

	; Globals from drawing.s
	; FIXME: Hmmm... check the linkage of these
	.globl	.fg_colour
	.globl	.bg_colour

	.area	_BSS
	; The current font
font_current::
	.ds	sfont_handle_sizeof
	; Cached copy of the first free tile
font_first_free_tile::
	.ds	1
	; Table containing descriptors for all of the fonts
font_table::
	.ds	sfont_handle_sizeof*.MAX_FONTS
	
	.area   _BASE
	; Copy uncompressed 16 byte tiles from (BC) to (HL), length = DE*2
	; Note: HL must be aligned on a UWORD boundry
font_copy_uncompressed::
	ld	a,d
	or	e
	ret	z

	ld	a,h
	cp	#0x98
	jr	c,4$
	sub	#0x98-0x88
	ld	h,a
4$:
	xor	a
	cp	e		; Special for when e=0 you will get another loop
	jr	nz,1$
	dec	d
1$:
	WAIT_HBL
	ld	a,(bc)
	ld	(hl+),a
	inc	bc
	
	WAIT_HBL
	ld	a,(bc)
	ld	(hl),a
	inc	bc

	inc	l
	jr	nz,2$
	inc	h
	ld	a,h		; Special wrap-around
	cp	#0x98
	jr	nz,2$
	ld	h,#0x88
2$:
	dec	e
	jr	nz,1$
	dec	d
	bit	7,d		; -1?
	jr	z,1$
	ret

	; Copy a set of compressed (8 bytes/cell) tiles to VRAM
	; Sets the foreground and background colours based on the current
	; font colours
	; Entry:
	;	From (BC) to (HL), length (DE) where DE = #cells * 8
	;	Uses the current fg_colour and bg_colour fields
font_copy_compressed::
	ld	a,d
	or	e
	ret	z		; Do nothing

	ld	a,h
	cp	#0x98		; Take care of the 97FF -> 8800 wrap around
	jr	c,font_copy_compressed_loop
	sub	#0x98-0x88
	ld	h,a
font_copy_compressed_loop:
	push	de
	ld	a,(bc)
	ld	e,a
	inc	bc
	push	bc

	ld	bc,#0
				; Do the background colour first
	ld	a,(.bg_colour)
	bit	0,a
	jr	z,font_copy_compressed_bg_grey1
	ld	b,#0xFF
font_copy_compressed_bg_grey1:
	bit	1,a
	jr	z,font_copy_compressed_bg_grey2
	ld	c,#0xFF
font_copy_compressed_bg_grey2:
	; BC contains the background colour
	; Compute what xoring we need to do to get the correct fg colour
	ld	d,a
	ld	a,(.fg_colour)
	xor	d
	ld	d,a

	bit	0,d
	jr	z,font_copy_compressed_grey1
	ld	a,e
	xor	b
	ld	b,a
font_copy_compressed_grey1:
	bit	1,d
	jr	z,font_copy_compressed_grey2
	ld	a,e
	xor	c
	ld	c,a
font_copy_compressed_grey2:
	WAIT_HBL
	ld	(hl),b
	inc	hl
	WAIT_HBL
	ld	(hl),c
	inc	hl
	ld	a,h		; Take care of the 97FFF -> 8800 wrap around
	cp	#0x98
	jr	nz,1$
	ld	h,#0x88
1$:
	pop	bc
	pop	de
	dec	de
	ld	a,d
	or	e
	jr	nz,font_copy_compressed_loop
	ret
	
; Load the font HL
font_load::
	call	.display_off
	push	hl

	; Find the first free font entry
	ld	hl,#font_table+sfont_handle_font
	ld	b,#.MAX_FONTS
font_load_find_slot:
	ld	a,(hl)		; Check to see if this entry is free
	inc	hl		; Free is 0000 for the font pointer
	or	(hl)
	cp	#0
	jr	z,font_load_found

	inc	hl
	inc	hl
	dec	b
	jr	nz,font_load_find_slot
	pop	hl
	ld	hl,#0
	jr	font_load_exit	; Couldn't find a free space
font_load_found:
				; HL points to the end of the free font table entry
	pop	de
	ld	(hl),d		; Copy across the font struct pointer
	dec	hl
	ld	(hl),e

	ld	a,(font_first_free_tile)
	dec	hl
	ld	(hl),a		

	push	hl
	call	font_set	; Set this new font to be the default
	
	; Only copy the tiles in if were in text mode
	ld	a,(.mode)
	and	#.T_MODE
	
	call	nz,font_copy_current

				; Increase the 'first free tile' counter
	ld	hl,#font_current+sfont_handle_font
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a

	inc	hl		; Number of tiles used
	ld	a,(font_first_free_tile)
	add	a,(hl)
	ld	(font_first_free_tile),a

	pop	hl		; Return font setup in HL
font_load_exit:
	;; Turn the screen on
	LDH     A,(.LCDC)
	OR      #0b10000001     ; LCD           = On
				; BG            = On
	AND     #0b11100111     ; BG Chr        = 0x8800
				; BG Bank       = 0x9800
	LDH     (.LCDC),A

	RET

	; Copy the tiles from the current font into VRAM
font_copy_current::	
				; Find the current font data
	ld	hl,#font_current+sfont_handle_font
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a

	inc	hl		; Points to the 'tiles required' entry
	ld	e,(hl)
	ld	d,#0
	rl	e		; Multiple DE by 8
	rl	d
	rl	e
	rl	d
	rl	e
	rl	d		; DE has the length of the tile data
	dec	hl

	ld	a,(hl)		; Get the flags
	push	af		
	and	#3			; Only lower 2 bits set encoding table size

	ld	bc,#128
	cp	#FONT_128ENCODING	; 0 for 256 char encoding table, 1 for 128 char
	jr	z,font_copy_current_copy

	ld	bc,#0
	cp	#FONT_NOENCODING
	jr	z,font_copy_current_copy

	ld	bc,#256			; Must be 256 element encoding
font_copy_current_copy:
	inc	hl
	inc	hl		; Points to the start of the encoding table
	add	hl,bc		
	ld	c,l
	ld	b,h		; BC points to the start of the tile data		

	; Find the offset in VRAM for this font
	ld	a,(font_current+sfont_handle_first_tile)	; First tile used for this font
	ld	l,a		
	ld	h,#0
	add	hl,hl
	add	hl,hl
	add	hl,hl
	add	hl,hl

	ld	a,#0x90		; Tile 0 is at 9000h
	add	a,h
	ld	h,a
				; Is this font compressed?
	pop	af		; Recover flags
	bit	FONT_BCOMPRESSED,a
				; Do the jump in a mildly different way
	jp	z,font_copy_uncompressed
	jp	font_copy_compressed

	; Set the current font to HL
font_set::
	ld	a,(hl+)
	ld	(font_current),a
	ld	a,(hl+)
	ld	(font_current+1),a
	ld	a,(hl+)
	ld	(font_current+2),a
	ret
	
	;; Print a character with interpretation
.put_char::
	; See if it's a special char
	cp	#.CR
	jr	nz,1$

	; Now see if were checking special chars
	push	af
	ld	a,(.mode)
	and	#.M_NO_INTERP
	jr	nz,2$
	call	.cr_curs
	pop	af
	ret
2$:
	pop	af
1$:
	CALL    .set_char
	CALL    .adv_curs
	RET

	;; Print a character without interpretation
.out_char::
	CALL	.set_char
	CALL	.adv_curs
	RET

	;; Delete a character
.del_char::
	CALL	.rew_curs
	LD	A,#.SPACE
	CALL	.set_char
	RET

	;; Print the character in A
.set_char:
	push	af
	ld	a,(font_current+2)
	; Must be non-zero if the font system is setup (cant have a font in page zero)
	or	a
	jr	nz,3$

	; Font system is not yet setup - init it and copy in the ibm font
	; Kind of a compatibility mode
	call	_font_init
	
	; Need all of the tiles
	xor	a
	ld	(font_first_free_tile),a

	.globl	_font_load_ibm_fixed
	call	banked_call
	.dw	_font_load_ibm_fixed
	.if __RGBDS__
	.dw	BANK(_font_load_ibm_fixed);
	.else
	.dw	0
	.endif
3$:
	pop	af
	push	bc
	push	de
	push	hl
				; Compute which tile maps to this character
	ld	e,a
	ld	hl,#font_current+sfont_handle_font
	ld	a,(hl+)
	ld	h,(hl)
	ld	l,a
	ld	a,(hl+)
	and	#3
	cp	#FONT_NOENCODING
	jr	z,set_char_no_encoding
	inc	hl
				; Now at the base of the encoding table
				; E is set above
	ld	d,#0
	add	hl,de
	ld	e,(hl)		; That's the tile!
set_char_no_encoding:
	ld	a,(font_current+0)
	add	a,e
	ld	e,a

	LD      A,(.cury)       ; Y coordinate
	LD      L,A
	LD      H,#0x00
	ADD     HL,HL
	ADD     HL,HL
	ADD     HL,HL
	ADD     HL,HL
	ADD     HL,HL
	LD      A,(.curx)       ; X coordinate
	LD      C,A
	LD      B,#0x00
	ADD     HL,BC
	LD      BC,#0x9800
	ADD     HL,BC

	WAIT_HBL
	LD      (HL),E
	POP     HL
	POP     DE
	POP     BC
	RET

	.area	_CODE
_putchar::			; Banked
	PUSH	BC
	LDA     HL,.BANKOV+2(SP); Skip return address
	LD      A,(HL)          ; A = c
	CALL    .put_char
	POP	BC
	RET

_setchar::			; Banked
	PUSH	BC
	LDA     HL,.BANKOV+2(SP); Skip return address
	LD      A,(HL)          ; A = c
	CALL    .set_char
	POP	BC
	RET

	.area	_BASE
_font_load::
	push	bc
	LDA     HL,4(SP)        ; Skip return address and bc
	LD      A,(HL)          ; A = c
	inc	hl
	ld	h,(hl)
	ld	l,a
	call    font_load
	push	hl
	pop	de		; Return in DE
	pop	bc
	RET

_font_set::
	push	bc
	LDA     HL,4(SP)        ; Skip return address
	LD      A,(HL)          ; A = c
	inc	hl
	ld	h,(hl)
	ld	l,a
	call	font_set
	pop	bc
	ld	de,#0		; Always good...
	RET

_font_init::
	push	bc
	.globl	.tmode

	call	.tmode

	ld	a,#1		; We use the first tile as a space _always_
	ld	(font_first_free_tile),a

	; Clear the font table
	xor	a
	ld	hl,#font_table
	ld	b,#sfont_handle_sizeof*.MAX_FONTS
1$:
	ld	(hl+),a
	dec	b
	jr	nz,1$
	ld	a,#3
	ld	(.fg_colour),a
	ld	a,#0
	ld	(.bg_colour),a

	call	.cls
	pop	bc
	ret
	
_cls::
.cls::	
	PUSH	DE
	PUSH	HL
	LD	HL,#0x9800
	LD	E,#0x20		; E = height
1$:
	LD	D,#0x20		; D = width
2$:
	WAIT_HBL

	LD	(HL),#.SPACE	; Always clear
	INC	HL
	DEC	D
	JR	NZ,2$
	DEC	E
	JR	NZ,1$
	POP	HL
	POP	DE
	RET

	.area	_CODE
	; Support routines
_gotoxy::			; Banked
	lda	hl,.BANKOV(sp)
	ld	a,(hl+)
	ld	(.curx),a
	ld	a,(hl)
	ld	(.cury),a
	ret

_posx::
	LD	A,(.mode)	; Banked
	AND	#.T_MODE
	JR	NZ,1$
	PUSH	BC
	CALL	.tmode
	POP	BC
1$:
	LD	A,(.curx)
	LD	E,A
	RET

_posy::				; Banked
	LD	A,(.mode)
	AND	#.T_MODE
	JR	NZ,1$
	PUSH	BC
	CALL	.tmode
	POP	BC
1$:
	LD	A,(.cury)
	LD	E,A
	RET

	.area	_BASE
	;; Rewind the cursor
.rew_curs:
	PUSH	HL
	LD	HL,#.curx	; X coordinate
	XOR	A
	CP	(HL)
	JR	Z,1$
	DEC	(HL)
	JR	99$
1$:
	LD	(HL),#.MAXCURSPOSX
	LD	HL,#.cury	; Y coordinate
	XOR	A
	CP	(HL)
	JR	Z,99$
	DEC	(HL)
99$:
	POP	HL
	RET

.cr_curs::
	PUSH	HL
	XOR	A
	LD	(.curx),A
	LD	HL,#.cury	; Y coordinate
	LD	A,#.MAXCURSPOSY
	CP	(HL)
	JR	Z,2$
	INC	(HL)
	JR	99$
2$:
	CALL	.scroll
99$:
	POP	HL
	RET

.adv_curs::
	PUSH	HL
	LD	HL,#.curx	; X coordinate
	LD	A,#.MAXCURSPOSX
	CP	(HL)
	JR	Z,1$
	INC	(HL)
	JR	99$
1$:
	LD	(HL),#0x00
	LD	HL,#.cury	; Y coordinate
	LD	A,#.MAXCURSPOSY
	CP	(HL)
	JR	Z,2$
	INC	(HL)
	JR	99$
2$:
	;; See if scrolling is disabled
	LD	A,(.mode)
	AND	#.M_NO_SCROLL
	JR	Z,3$
	;; Nope - reset the cursor to (0,0)
	XOR	A
	LD	(.cury),A
	LD	(.curx),A
	JR	99$
3$:	
	CALL	.scroll
99$:
	POP	HL
	RET

	;; Scroll the whole screen
.scroll:
	PUSH	BC
	PUSH	DE
	PUSH	HL
	LD	HL,#0x9800
	LD	BC,#0x9800+0x20 ; BC = next line
	LD	E,#0x20-0x01	; E = height - 1
1$:
	LD	D,#0x20		; D = width
2$:
	LDH	A,(.STAT)
	AND	#0x02
	JR	NZ,2$

	LD	A,(BC)
	LD	(HL+),A
	INC	BC
	DEC	D
	JR	NZ,2$
	DEC	E
	JR	NZ,1$

	LD	D,#0x20
3$:
	LDH	A,(.STAT)
	AND	#0x02
	JR	NZ,3$

	LD	A,#.SPACE
	LD	(HL+),A
	DEC	D
	JR	NZ,3$
	POP	HL
	POP	DE
	POP	BC
	RET

	.area	_BSS
.curx::				; Cursor position
	.ds	0x01
.cury::
	.ds	0x01

	.area	_BASE

	.globl	.vbl
	.globl	.lcd
	.globl	.int_0x40
	.globl	.int_0x48
	.globl	.remove_int

	;; Enter text mode
.tmode::
	DI			; Disable interrupts

	;; Turn the screen off
	LDH	A,(.LCDC)
	BIT	7,A
	JR	Z,1$

	;; Turn the screen off
	CALL	.display_off

	;; Remove any interrupts setup by the drawing routine
	LD	BC,#.vbl
	LD	HL,#.int_0x40
	CALL	.remove_int
	LD	BC,#.lcd
	LD	HL,#.int_0x48
	CALL	.remove_int
1$:

	CALL	.tmode_out

	;; Turn the screen on
	LDH	A,(.LCDC)
	OR	#0b10000001	; LCD		= On
				; BG		= On
	AND	#0b11100111	; BG Chr	= 0x8800
				; BG Bank	= 0x9800
	LDH	(.LCDC),A

	EI			; Enable interrupts

	RET

	;; Text mode (out only)
.tmode_out::
	XOR	A
	LD	(.curx),A
	LD	(.cury),A

	;; Clear screen
	CALL	.cls

	LD	A,#.T_MODE
	LD	(.mode),A

	RET

	.include	"global.s"

	;; Note that while gets uses a pointer, the pointer had better
	;; be in non-banked RAM else bad things will happen.
	;; BANKED:	checked, imperfect
	
	.globl	.copy_vram
	.globl	.set_xy_wtt
	.globl	.mv_sprite
	.globl	.set_sprite_prop
	.globl	.set_sprite_tile
	.globl	.jpad
	.globl	.padup

	.MINMSPOSX	= 0x02	; In tiles
	.MINMSPOSY	= 0x0A
	.MAXMSPOSX	= 0x11
	.MAXMSPOSY	= 0x0F
	.INIMSPOSX	= .MINMSPOSX
	.INIMSPOSY	= .MINMSPOSY

	.KBDWINPOSY	= 0x08	; In tiles
	.KBDSIZE	= 0x1006

	.MSOFFSETX	= 0x0C	; In pixels
	.MSOFFSETY	= 0x14

	.MINACCEL	= 0x0800
	.MAXACCEL	= 0x0100

	.CR	= 0x0A		; Unix
;	.CR	= 0x0D		; Dos

	.globl	.tmode_out	; From 'output.s'
	.globl	.put_char
	.globl	.del_char
	.globl	.cury

	.area	_HEADER (ABS)

	.org	.MODE_TABLE+4*.T_MODE_INOUT
	JP	.tmode_inout

	.module Terminal

	.area	_BSS

.msx:				; Mouse position
	.ds	0x01
.msy:
	.ds	0x01
.msacc:				; Mouse acceleration
	.ds	0x02
.msstate:			; Mouse state
	.ds	0x01
.mschanged:			; Did the mouse move?
	.ds	0x01
.string_len:			; Used length of input buffer
	.ds	0x01

	.area	_BASE

	;; Enter text mode with input
.tmode_inout::
	DI			; Disable interrupts

	;; Turn the screen off
	LDH	A,(.LCDC)
	BIT	7,A
	JR	Z,1$

	;; Turn the screen off
	CALL	.display_off
1$:

	LD	A,(.mode)
	AND	#.T_MODE
	CALL	Z,.tmode_out

	LD	BC,#.tp1	; Move pointer
	LD	HL,#0x8000
	LD	DE,#.endtp1-.tp1
	CALL	.copy_vram

	LD	A,#<.MINACCEL	; Acceleration
	LD	(.msacc),A
	LD	A,#>.MINACCEL
	LD	(.msacc+1),A

	;; Initialize window
	LD	BC,#.frame_tiles
	LD	DE,#0x0000	; Place image at (0x00,0x00) tiles
	LD	HL,#0x140A	; Image size is 0x14 x 0x0A tiles
	CALL	.set_xy_wtt
	LD	BC,#.kbdtable
	LD	DE,#0x0202	; Place image at (0x02,0x02) tiles
	LD	HL,#.KBDSIZE	; Image size is 0x10 x 0x06 tiles
	CALL	.set_xy_wtt
	XOR	A
	LD	A,#.MINWNDPOSX
	LDH	(.WX),A
	LD	A,#.MAXWNDPOSY	; Hide window
	LDH	(.WY),A

	;; Initialize sprite
	LD	C,#0x00		; Sprite 0x00
	LD	D,#0x00		; Default sprite properties
	CALL	.set_sprite_prop
	LD	C,#0x00		; Sprite 0x00
	LD	D,#0x00		; Tile 0x00
	CALL	.set_sprite_tile
	LD	A,#0b00101100
	LDH	(.OBP0),A

	;; Turn the screen on
	LD	A,#0b11000001	; LCD		= On
				; WindowBank	= 0x9C00
				; Window	= Off
				; BG Chr	= 0x8800
				; BG Bank	= 0x9800
				; OBJ		= 8x8
				; OBJ		= Off
				; BG		= On
	LDH	(.LCDC),A

	LD	A,#.T_MODE_INOUT
	LD	(.mode),A

	EI			; Enable interrupts

	RET

	.area	_CODE
	;; Prompt the user for a char and return it in A
.get_char:
	PUSH	BC
	PUSH	DE
	PUSH	HL
	CALL	.show_kbd
	CALL	.show_mouse
1$:
	CALL	.track_mouse
	CALL	.update_mouse
	CALL	.jpad
	LD	D,A
	AND	#.A		; Is A pressed ?
	JP	Z,1$

	LD	A,(.msy)	; Look for char under the mouse
	SUB	#.MINMSPOSY
	JR	Z,12$
	LD	E,A
	XOR	A
11$:
	ADD	#.MAXMSPOSX-.MINMSPOSX+1
	DEC	E
	JR	NZ,11$
12$:
	LD	E,A
	LD	A,(.msx)
	SUB	#.MINMSPOSX
	ADD	E
	LD	HL,#.kbdtable
	LD	B,#0x00
	LD	C,A
	ADD	HL,BC
	LD	B,(HL)

	CALL	.hide_mouse
	CALL	.hide_kbd
	LD	A,B

	POP	HL
	POP	DE
	POP	BC
	RET

	;; Prompt the user for a string and store it in (HL)
.get_string:
	PUSH	BC
	PUSH	DE
	PUSH	HL
	CALL	.show_kbd
	CALL	.show_bkg
	CALL	.show_mouse
	XOR	A
	LD	(.string_len),A
1$:
	CALL	.track_mouse
	CALL	.update_mouse
	CALL	.jpad
	LD	D,A
	AND	#.A		; Is A pressed ?
	JP	NZ,10$
	LD	A,D
	AND	#.B		; Is B pressed ?
	JP	NZ,20$
	LD	A,D
	AND	#.SELECT	; Is SELECT pressed ?
	JP	NZ,30$
	LD	A,D
	AND	#.START		; Is START pressed ?
	JR	Z,1$
	CALL	.padup		; Wait for button to be depressed

	LD	A,#.CR
	CALL	.put_char
	LD	(HL),#0x00
	CALL	.hide_mouse
	CALL	.hide_bkg
	CALL	.hide_kbd
	POP	HL
	POP	DE
	POP	BC
	RET

10$:
	;; Insert a character at cursor position
	LD	A,(.string_len) ; Check buffer length
;	CP	#.BUFLEN-1	; Keep 1 char for EOS
;	JR	Z,13$
	INC	A
	LD	(.string_len),A ; Update it
	LD	A,(.msy)	; Look for char under the mouse
	SUB	#.MINMSPOSY
	JR	Z,12$
	LD	E,A
	XOR	A
11$:
	ADD	#.MAXMSPOSX-.MINMSPOSX+1
	DEC	E
	JR	NZ,11$
12$:
	LD	E,A
	LD	A,(.msx)
	SUB	#.MINMSPOSX
	ADD	E
	PUSH	HL
	LD	HL,#.kbdtable
	LD	B,#0x00
	LD	C,A
	ADD	HL,BC
	LD	A,(HL)
	POP	HL
	LD	(HL+),A		; Add it into input buffer
	CALL	.put_char	; Print it
	CALL	.show_bkg	; Ensure the text is not hidden
13$:
	CALL	.padup		; Wait for button to be depressed
	JP	1$

20$:
	;; Delete a character at cursor position
	LD	A,(.string_len) ; Is there any char in the buffer ?
	OR	A
	JR	Z,21$
	DEC	A		; Yes
	LD	(.string_len),A ; Update buffer length
	DEC	HL
	CALL	.del_char
21$:
	CALL	.padup		; Wait for button to be depressed
	JP	1$

30$:
	CALL	.hide_mouse
	CALL	.hide_bkg
	CALL	.hide_kbd
	CALL	.padup		; Wait for button to be depressed
	CALL	.show_kbd
	CALL	.show_bkg
	CALL	.show_mouse
	JP	1$

.show_kbd:
	PUSH	BC
	PUSH	DE
	LDH	A,(.LCDC)
	OR	#0b00100000	; Window = On
	LDH	(.LCDC),A
	LD	A,#.MAXWNDPOSY	; Show window
1$:
	BIT	0,A		; Wait for VBL every 2 pixels (slow down)
	JR	NZ,2$
	LD	B,A
	CALL	.wait_vbl_done
	LD	A,B
2$:
	LDH	(.WY),A
	CP	#.KBDWINPOSY*0x08
	JR	Z,99$
	DEC	A
	JR	1$
99$:
	POP	DE
	POP	BC
	RET

.hide_kbd:
	PUSH	BC
	PUSH	DE
	LD	A,#.KBDWINPOSY*0x08+1
1$:				; Hide window
	BIT	0,A		; Wait for VBL every 2 pixels (slow down)
	JR	Z,2$
	LD	B,A
	CALL	.wait_vbl_done
	LD	A,B
2$:
	LDH	(.WY),A
	CP	#.MAXWNDPOSY
	JR	Z,3$
	INC	A
	JR	1$
3$:
	LDH	A,(.LCDC)
	AND	#0b11011111	; Window = Off
	LDH	(.LCDC),A
	POP	DE
	POP	BC
	RET

.show_bkg:
	PUSH	BC
	PUSH	DE
	LDH	A,(.SCY)
	LD	D,A
	LD	A,(.cury)
	SUB	#.KBDWINPOSY-1
	JR	C,99$
	JR	Z,99$
	SLA	A		; A = A * 8
	SLA	A
	SLA	A
	SUB	D
	JR	C,99$
	JR	Z,99$
	LD	C,A
	LDH	A,(.SCY)
1$:
	BIT	0,A		; Wait for VBL every 2 pixels (slow down)
	JR	Z,2$
	LD	B,A
	CALL	.wait_vbl_done
	LD	A,B
2$:
	INC	A
	LDH	(.SCY),A
	DEC	C
	JR	Z,99$
	JR	1$
99$:
	POP	DE
	POP	BC
	RET

.hide_bkg:
	LDH	A,(.SCY)
	OR	A
	RET	Z
	PUSH	BC
	PUSH	DE
1$:
	BIT	0,A		; Wait for VBL every 2 pixels (slow down)
	JR	Z,2$
	LD	B,A
	CALL	.wait_vbl_done
	LD	A,B
2$:
	DEC	A
	LDH	(.SCY),A
	JR	Z,99$
	JR	1$
99$:
	POP	DE
	POP	BC
	RET

.show_mouse:
	LD	A,#.INIMSPOSX
	LD	(.msx),A
	LD	A,#.INIMSPOSY
	LD	(.msy),A
	CALL	.set_mouse
	LDH	A,(.LCDC)
	OR	#0b00000010	; OBJ = On
	LDH	(.LCDC),A
	RET

.hide_mouse:
	LDH	A,(.LCDC)
	AND	#0b11111101	; OBJ = Off
	LDH	(.LCDC),A
	RET

.track_mouse:
	PUSH	BC
	PUSH	DE
	PUSH	HL
	XOR	A
	LD	(.mschanged),A	; Default to no change
	CALL	.jpad
	LD	D,A

	LD	HL,#.msstate
	AND	#.UP+.DOWN+.LEFT+.RIGHT
	JR	NZ,1$
	LD	(HL),#0x00	; Reset state
	JP	99$
1$:
	LD	A,(HL)
	LD	(HL),#0x01	; Set state
	OR	A		; Was it 0 ?
	LD	HL,#.msacc	; Acceleration
	JR	NZ,2$
				; Yes
	LD	(HL),#<.MINACCEL
	INC	HL
	LD	(HL),#>.MINACCEL
	JR	4$		; Update position
2$:
	LD	C,(HL)
	INC	HL
	LD	B,(HL)
	DEC	BC
	LD	A,B
	OR	C
	JR	Z,3$
	LD	(HL),B
	DEC	HL
	LD	(HL),C
	JP	99$
3$:				; Set new acceleration to maximum
	LD	(HL),#>.MAXACCEL
	DEC	HL
	LD	(HL),#<.MAXACCEL
4$:				; Update position
	LD	A,#0x01
	LD	(.mschanged),A
	LD	A,D
	AND	#.UP		; Is UP pressed ?
	JR	Z,6$
	LD	A,(.msy)
	CP	#.MINMSPOSY
	JR	Z,5$
	DEC	A
	LD	(.msy),A
	JR	6$
5$:
	LD	A,#.MAXMSPOSY
	LD	(.msy),A
6$:
	LD	A,D
	AND	#.DOWN		; Is DOWN pressed ?
	JR	Z,8$
	LD	A,(.msy)
	CP	#.MAXMSPOSY
	JR	Z,7$
	INC	A
	LD	(.msy),A
	JR	8$
7$:
	LD	A,#.MINMSPOSY
	LD	(.msy),A
8$:
	LD	A,D
	AND	#.LEFT		; Is LEFT pressed ?
	JR	Z,10$
	LD	A,(.msx)
	CP	#.MINMSPOSX
	JR	Z,9$
	DEC	A
	LD	(.msx),A
	JR	10$
9$:
	LD	A,#.MAXMSPOSX
	LD	(.msx),A
10$:
	LD	A,D
	AND	#.RIGHT		; Is RIGHT pressed ?
	JR	Z,99$
	LD	A,(.msx)
	CP	#.MAXMSPOSX
	JR	Z,11$
	INC	A
	LD	(.msx),A
	JR	99$
11$:
	LD	A,#.MINMSPOSX
	LD	(.msx),A
99$:
	POP	HL
	POP	DE
	POP	BC
	RET

.update_mouse:
	LD	A,(.mschanged)	; Did it change ?
	OR	A
	RET	Z		; No
.set_mouse:
	PUSH	BC
	PUSH	DE
	PUSH	HL
	LD	C,#0x00		; Sprite 0x00
	LD	A,(.msx)
	SLA	A		; A = A * 8
	SLA	A
	SLA	A
	ADD	#.MSOFFSETX
	LD	D,A
	LD	A,(.msy)
	SLA	A		; A = A * 8
	SLA	A
	SLA	A
	ADD	#.MSOFFSETY
	LD	E,A
	CALL	.mv_sprite
	POP	HL
	POP	DE
	POP	BC
	RET

_getchar::			; Banked
	LD	A,(.mode)
	CP	#.T_MODE_INOUT
	JR	Z,1$
	PUSH	BC
	CALL	.tmode_inout
	POP	BC
1$:
	CALL	.get_char
	LD	E,A
	RET

_gets::				; Banked
	LD	A,(.mode)
	CP	#.T_MODE_INOUT
	JR	Z,1$
	PUSH	BC
	CALL	.tmode_inout
	POP	BC
1$:
	LDA	HL,.BANKOV(SP)	; Skip return address
	LD	A,(HL+)
	LD	H,(HL)		; HL = s
	LD	L,A
	PUSH	HL
	CALL	.get_string
	POP	DE
	RET

	;; PENDING: this is unfortunate.  Refed from .tmode_inout
	.area	_BASE
.tp1:

.pointers:

	; Tile 0x00
	.byte	0xFF,0xFF,0xFE,0x82,0xFC,0x84,0xFC,0x84,0xFE,0x82,0xFF,0xB1,0xCF,0xC9,0x87,0x87

.endtp1:

.frame_tiles:
	.byte	0x1C,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x1D
	.byte	0x0F,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x0F
	.byte	0x0F,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x0F
	.byte	0x0F,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x0F
	.byte	0x0F,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x0F
	.byte	0x0F,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x0F
	.byte	0x0F,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x0F
	.byte	0x0F,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x0F
	.byte	0x0F,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x20,0x0F
	.byte	0x1E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x0E,0x1F

.kbdtable:
	;; This is unfortunate.  astorgb and rgbasm cant interpert:
	;;	.ascii	" !\"#$%&'()*+,-./"
	;; so we have to use the hex form here.
	.db	0x20,0x21,0x22,0x23,0x24,0x25,0x26,0x27
	.db	0x28,0x29,0x2A,0x2B,0x2C,0x2D,0x2E,0x2F
	.ascii	"0123456789:"
	;; astorgb recognises the embedded ; as a comment :)
	.db	0x3B		
	.ascii	"<=>?"
	.ascii	"@ABCDEFGHIJKLMNO"
	.ascii	"PQRSTUVWXYZ[\\]^_"
	.ascii	"`abcdefghijklmno"
	.ascii	"pqrstuvwxyz\{\|\}~ "

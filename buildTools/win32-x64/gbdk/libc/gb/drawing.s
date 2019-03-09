;; Optimised Drawing library 
;; By Jon Fuge (jonny@q-continuum.demon.co.uk) based on original file
;; Updates
;;   990223 Michael	Removed mod_col, splitting it up into 
;;			fg_colour, bg_colour, and draw_mode
;; Note: some optimisations are available with unneded PUSH DE/POP DE's

	;; BANKED: checked
	.include        "global.s"

	.globl  .init_vram
	.globl  .copy_vram

	.M_SOLID	=	0x00
	.M_OR	=	0x01
	.M_XOR	=	0x02
	.M_AND	=	0x03

	.if	0
	.M_SOLID	=	0x10
	.M_OR	=	0x20
	.M_XOR	=	0x40
	.M_AND	=	0x80
	.endif

	;;  Format of mod_col
	;; 7 6 5 4 3 2 1 0
	;;   mode  fg  bg

	.area   _HEADER (ABS)

	.org    .MODE_TABLE+4*.G_MODE
	JP      .gmode

	.module Drawing1

	;; Data
	.area	_BSS
	;; Foreground drawing colour
.fg_colour::	
	.ds	1
	;; Background drawing colour
.bg_colour::	
	.ds	1
	;; Drawing mode (.SOILD etc)
.draw_mode:
	.ds	1
	;; Fill style
.style:	
	.ds	0x01
	;; Various varibles
.x_s:	
	.ds	2
.y_s:	
	.ds	2
.delta_x:	
	.ds	1
.delta_y:	
	.ds	1
.l_inc:	
	.ds	1
.l_d:	
	.ds	2
.dinc1:	
	.ds	2
.dinc2:	
	.ds	2
.tx:	
	.ds	1
.ty:	
	.ds	1
	
	.area   _BASE
	;; Enter graphic mode
.gmode::
	DI			; Disable interrupts

	;; Turn the screen off
	LDH	A,(.LCDC)
	BIT	7,A
	JR	Z,1$

	;; Turn the screen off
	CALL	.display_off
1$:
	LD	HL,#0x8000+0x10*0x10
	LD	DE,#0x1800-0x18*0x10
	LD	B,#0x00
	CALL	.init_vram	; Init the charset at 0x8000

	;; Install interrupt routines
	LD	BC,#.vbl
	CALL	.add_VBL
	LD	BC,#.lcd
	CALL	.add_LCD

	LD	A,#72		; Set line at which LCD interrupt occurs
	LDH	(.LYC),A

	LD	A,#0b01000100	; Set LCD interrupt to occur when LY = LCY
	LDH	(.STAT),A

	LDH	A,(.IE)
	OR	#0b00000010	; Enable LCD interrupt
	LDH	(.IE),A

	;; (9*20) = 180 tiles are used in the upper part of the screen
	;; (9*20) = 180 tiles are used in the lower part of the screen
	;; => We have 24 tiles free
	;; We keep 16 at 0x8000->0x80FF, and 8 at 0x9780->97FF

	LD	HL,#0x9800
	LD	A,#0x10		; Keep 16 tiles free
	LD	BC,#12		; 12 unused columns
	LD	E,#18		; 18 lines
2$:
	LD	D,#20		; 20 used columns
3$:
	LD	(HL+),A
	INC	A
	DEC	D
	JR	NZ,3$
	ADD	HL,BC
	DEC	E
	JR	NZ,2$

	;; Turn the screen on
	LDH	A,(.LCDC)
	OR	#0b10010001	; LCD		= On
				; BG Chr	= 0x8000
				; BG		= On
	AND	#0b11110111	; BG Bank	= 0x9800
	LDH	(.LCDC),A

	LD	A,#.G_MODE
	LD	(.mode),A

	;; Setup the default colours and draw modes
	LD	A,#.M_SOLID
	LD	(.draw_mode),A
	LD	A,#0x03		; Black
	LD	(.fg_colour),A
	LD	A,#0x00		; White
	LD	(.bg_colour),A
	
	EI			; Enable interrupts

	RET

.vbl::
	LDH	A,(.LCDC)
	OR	#0b00010000	; Set BG Chr to 0x8000
	LDH	(.LCDC),A

	LD	A,#72		; Set line at which LCD interrupt occurs
	LDH	(.LYC),A

	RET

	;; Is the STAT check required, as we are already in the HBL?
.lcd::
1$:
	LDH	A,(.STAT)
	BIT	1,A
	JR	NZ,1$

	LDH	A,(.LCDC)
	AND	#0b11101111	; Set BG Chr to 0x8800
	LDH	(.LCDC),A

	RET

	;; Draw a full-screen image at (BC)
.draw_image::
	LD      HL,#0x8000+0x10*0x10
	LD      DE,#0x1680
	CALL    .copy_vram      ; Move the charset
	RET

	;; Replace tile data at (B,C) with data at DE and store old value at HL
.switch_data::
	PUSH    DE              ; Save src
	PUSH    HL              ; Save dst
	LD      L,B
	SLA     L
	SLA     L
	SLA     L
	LD      H,#0x00
	ADD     HL,HL
	LD      D,H
	LD      E,L

	LD      HL,#.y_table
	SLA     C
	SLA     C
	SLA     C
	LD      B,#0x00
	ADD     HL,BC
	ADD     HL,BC
	LD      B,(HL)
	INC     HL
	LD      H,(HL)
	LD      L,B
	ADD     HL,DE

	LD      B,H             ; BC = src
	LD      C,L
	POP     HL              ; HL = dst
	PUSH    BC              ; Save dst
	LD      A,H
	OR      L
	JR      Z,1$
	LD      DE,#0x10
	CALL    .copy_vram
1$:
	POP     HL              ; HL = dst
	POP     BC              ; BC = src
	LD      DE,#0x10
	CALL    .copy_vram

	RET

	.area	_CODE
	;; Advance the cursor
.adv_gcurs::
	PUSH	HL
	LD	HL,#.tx	; X coordinate
	LD	A,#.MAXCURSPOSX
	CP	(HL)
	JR	Z,1$
	INC	(HL)
	JR	99$
1$:
	LD	(HL),#0x00
	LD	HL,#.ty	; Y coordinate
	LD	A,#.MAXCURSPOSY
	CP	(HL)
	JR	Z,2$
	INC	(HL)
	JR	99$
2$:
	LD	(HL),#0x00
99$:
	POP	HL
	RET

	;; Draw a circle from (B,C) with radius D
.circle::
	LD	A,B	;Store center values
	LD	(.x_s),A
	LD	A,C
	LD	(.y_s),A

	XOR	A
	LD	(.x_s+1),A 
	LD	A,D
	LD	(.y_s+1),A 
	CPL
	LD	L,A
	LD	H,#0xFF
	INC	HL
	LD	BC,#0
	ADD	HL,BC
	LD	A,L
	LD	(.l_d+1),A
	LD	A,H
	LD	(.l_d),A

cloop$:
	LD	A,(.x_s+1)
	LD	B,A
	LD	A,(.y_s+1)
	SUB	B
	RET	C

	LD	A,(.style)
	OR	A
	CALL	Z,.circplot

	LD	A,(.l_d)
	BIT	7,A
	JR	Z,ycirc$

	LD	A,(.style)
	OR	A
	CALL	NZ,.horlin
	LD	A,(.x_s+1)
	INC	A
	LD	(.x_s+1),A
	LD	A,(.l_d)
	LD	B,A
	LD	A,(.l_d+1)
	LD	C,A
	LD	H,#0
	LD	A,(.x_s+1)
	LD	L,A
	ADD	HL,HL
	ADD	HL,HL
	ADD	HL,BC
	LD	BC,#6
	ADD	HL,BC
	LD	A,H
	LD	(.l_d),A
	LD	A,L
	LD	(.l_d+1),A
	JR	cloop$
ycirc$:	
	LD	A,(.style)
	OR	A
	CALL	NZ,.verlin
	LD	A,(.x_s+1)
	INC	A
	LD	(.x_s+1),A
	LD	B,#0
	LD	A,(.x_s+1)
	LD	C,A
	LD	H,#0xFF
	LD	A,(.y_s+1)
	CPL
	LD	L,A
	INC	HL
	ADD	HL,BC
	LD	A,(.l_d)
	LD	B,A
	LD	A,(.l_d+1)
	LD	C,A
	ADD	HL,HL
	ADD	HL,HL
	ADD	HL,BC
	LD	BC,#10
	ADD	HL,BC
	LD	A,H
	LD	(.l_d),A
	LD	A,L
	LD	(.l_d+1),A
	LD	A,(.y_s+1)
	DEC	A
	LD	(.y_s+1),A
	JP	cloop$

.horlin::
	LD	A,(.x_s)
	LD	B,A
	LD	A,(.y_s)
	LD	C,A
	LD	A,(.x_s+1)
	LD	D,A
	LD	A,(.y_s+1)
	LD	E,A
	PUSH	BC
	PUSH	DE
	LD	A,B
	SUB	E
	LD	H,A
	LD	A,B
	ADD	E
	LD	B,A
	LD	A,C
	ADD	D
	LD	C,A
	LD	D,H
	LD	E,C
	CALL	.line
	POP	DE
	POP	BC
	LD	A,D
	OR	A
	RET	Z
	PUSH	BC
	PUSH	DE
	LD	A,B
	SUB	E
	LD	H,A
	LD	A,B
	ADD	E
	LD	B,A
	LD	A,C
	SUB	D
	LD	C,A
	LD	D,H
	LD	E,C
	CALL	.line
	POP	DE
	POP	BC
	RET

.verlin::
	LD	A,(.x_s)
	LD	B,A
	LD	A,(.y_s)
	LD	C,A
	LD	A,(.x_s+1)
	LD	D,A
	LD	A,(.y_s+1)
	LD	E,A
	PUSH	BC
	PUSH	DE
	LD	A,B
	SUB	E
	LD	H,A
	LD	A,B
	ADD	E
	LD	B,A
	LD	A,C
	ADD	D
	LD	C,A
	LD	D,H
	LD	E,C
	CALL	.line
	POP	DE
	POP	BC
	PUSH	BC
	PUSH	DE
	LD	A,B
	SUB	E
	LD	H,A
	LD	A,B
	ADD	E
	LD	B,A
	LD	A,C
	SUB	D
	LD	C,A
	LD	D,H
	LD	E,C
	CALL	.line
	POP	DE
	POP	BC
	LD	A,D
	SUB	E
	RET	Z
	PUSH	BC
	PUSH	DE
	LD	A,B
	SUB	D
	LD	H,A
	LD	A,B
	ADD	D
	LD	B,A
	LD	A,C
	SUB	E
	LD	C,A
	LD	D,H
	LD	E,C
	CALL	.line
	POP	DE
	POP	BC
	PUSH	BC
	PUSH	DE
	LD	A,B
	SUB	D
	LD	H,A
	LD	A,B
	ADD	D
	LD	B,A
	LD	A,C
	ADD	E
	LD	C,A
	LD	D,H
	LD	E,C
	CALL	.line
	POP	DE
	POP	BC
	RET

.circplot::
	LD	A,(.x_s)
	LD	B,A
	LD	A,(.y_s)
	LD	C,A
	LD	A,(.x_s+1)
	LD	D,A
	LD	A,(.y_s+1)
	LD	E,A
	PUSH	BC
	PUSH	DE
	LD	A,B
	ADD	D
	LD	B,A
	LD	A,C
	SUB	E
	LD	C,A
	CALL	.plot
	POP	DE
	POP	BC
	PUSH	BC
	PUSH	DE
	LD	A,B
	SUB	E
	LD	B,A
	LD	A,C
	SUB	D
	LD	C,A
	CALL	.plot
	POP	DE
	POP	BC
	PUSH	BC
	PUSH	DE
	LD	A,B
	SUB	D
	LD	B,A
	LD	A,C
	ADD	E
	LD	C,A
	CALL	.plot
	POP	DE
	POP	BC
	PUSH	BC
	PUSH	DE
	LD	A,B
	ADD	E
	LD	B,A
	LD	A,C
	ADD	D
	LD	C,A
	CALL	.plot
	POP	DE
	POP	BC
	
	LD	A,D
	OR	A
	RET	Z
	SUB	E
	RET	Z

	PUSH	BC
	PUSH	DE
	LD	A,B
	SUB	D
	LD	B,A
	LD	A,C
	SUB	E
	LD	C,A
	CALL	.plot
	POP	DE
	POP	BC
	PUSH	BC
	PUSH	DE
	LD	A,B
	SUB	E
	LD	B,A
	LD	A,C
	ADD	D
	LD	C,A
	CALL	.plot
	POP	DE
	POP	BC
	PUSH	BC
	PUSH	DE
	LD	A,B
	ADD	D
	LD	B,A
	LD	A,C
	ADD	E
	LD	C,A
	CALL	.plot
	POP	DE
	POP	BC
	PUSH	BC
	PUSH	DE
	LD	A,B
	ADD	E
	LD	B,A
	LD	A,C
	SUB	D
	LD	C,A
	CALL	.plot
	POP	DE
	POP	BC
	RET

	;; Draw a box between (B,C) and (D,E)
.box::
	LD	A,(.x_s)
	LD	B,A
	LD	A,(.x_s+1)
	LD	C,A
	SUB	B
	JR	NC,ychk$
	LD	A,C
	LD	(.x_s),A
	LD	A,B
	LD	(.x_s+1),A
ychk$:
	LD	A,(.y_s)
	LD	B,A
	LD	A,(.y_s+1)
	LD	C,A
	SUB	B
	JR	NC,dbox$
	LD	A,C
	LD	(.y_s),A
	LD	A,B
	LD	(.y_s+1),A
dbox$:
	LD	A,(.x_s)
	LD	B,A
	LD	D,A
	LD	A,(.y_s)
	LD	C,A
	LD	A,(.y_s+1)
	LD	E,A
	CALL	.line
	LD	A,(.x_s+1)
	LD	B,A
	LD	D,A
	LD	A,(.y_s)
	LD	C,A
	LD	A,(.y_s+1)
	LD	E,A
	CALL	.line
	LD	A,(.x_s)
	INC	A
	LD	(.x_s),A
	LD	A,(.x_s+1)
	DEC	A
	LD	(.x_s+1),A
	LD	A,(.x_s)
	LD	B,A
	LD	A,(.x_s+1)
	LD	D,A
	LD	A,(.y_s)
	LD	C,A
	LD	E,A
	CALL	.line
	LD	A,(.x_s)
	LD	B,A
	LD	A,(.x_s+1)
	LD	D,A
	LD	A,(.y_s+1)
	LD	C,A
	LD	E,A
	CALL	.line
	LD	A,(.style)
	OR	A
	RET	Z
	LD	A,(.x_s)
	LD	B,A
	LD	A,(.x_s+1)
	SUB	B
	RET	C
	LD	A,(.y_s)
	INC	A
	LD	(.y_s),A
	LD	A,(.y_s+1)
	DEC	A
	LD	(.y_s+1),A
	LD	A,(.y_s)
	LD	B,A
	LD	A,(.y_s+1)
	SUB	B
	RET	C

	.if	0
	LD	A,(.mod_col)	;Swap fore + back colours.
	LD	D,A
	AND	#0xF0
	LD	C,A		;Preserve Style
	LD	A,D
	AND	#0x0C
	RRCA
	RRCA
	OR	C		;Foreground->background + style
	LD	C,A
	LD	A,D
	AND	#0x03
	RLCA
	RLCA
	OR	C
	LD	(.mod_col),A
	.else
	LD	A,(.fg_colour)
	LD	C,A
	LD	A,(.bg_colour)
	LD	(.fg_colour),A
	LD	A,C
	LD	(.bg_colour),A
	.endif 
filllp$:
	LD	A,(.x_s)
	LD	B,A
	LD	A,(.x_s+1)
	LD	D,A
	LD	A,(.y_s)
	LD	C,A
	LD	E,A
	CALL	.line
	LD	A,(.y_s+1)
	LD	B,A
	LD	A,(.y_s)
	CP	B
	JR	Z,swap$
	INC	A
	LD	(.y_s),A
	JR	filllp$
swap$:	
	.if	0
	LD	A,(.mod_col)	;Swap fore + back colours.
	LD	D,A
	AND	#0xF0
	LD	C,A		;Preserve Style
	LD	A,D
	AND	#0x0C
	RRCA
	RRCA
	OR	C		;Foreground->background + style
	LD	C,A
	LD	A,D
	AND	#0x03
	RLCA
	RLCA
	OR	C
	LD	(.mod_col),A
	.else
	LD	A,(.fg_colour)
	LD	C,A
	LD	A,(.bg_colour)
	LD	(.fg_colour),A
	LD	A,C
	LD	(.bg_colour),A
	.endif
	RET

	;; Draw a line between (B,C) and (D,E)
.line::
	LD	A,C	;Calculate Delta Y
	SUB	E
	JR	NC,s1$
	CPL
	INC	A
s1$:	LD	(.delta_y),A
	LD	H,A

	LD	A,B	;Calculate Delta X
	SUB	D
	JR	NC,s2$
	CPL
	INC	A
s2$:	LD	(.delta_x),A

	SUB	H
	JP	C,y1

	;; Use Delta X

	LD	A,B
	SUB	D
	JP	NC,x2$

	LD	A,C
	SUB	E
	JR	Z,x3$
	LD	A,#0x00
	JR	NC,x3$
	LD	A,#0xFF
	JR	x3$

x2$:
	LD	A,E
	SUB	C
	JR	Z,x2a$
	LD	A,#0x00
	JR	NC,x2a$
	LD	A,#0xFF

x2a$:
	LD	B,D
	LD	C,E	;BC holds start X,Y
x3$:
	LD	(.l_inc),A	;Store Y increment
	LD	HL,#.y_table
	LD	D,#0x00
	LD	E,C
	ADD	HL,DE
	ADD	HL,DE
	LD	A,(HL+)
	LD	H,(HL)
	LD	L,A

	LD	A,B
	AND	#0xf8
	LD	E,A
	ADD	HL,DE
	ADD	HL,DE

	LD	A,(.delta_y)
	OR	A
	JP	Z,.xonly

	;;	Got to do it the hard way.

	;	Calculate (2*deltay) -> dinc1

	PUSH	HL
	LD	H,#0x00
	LD	L,A
	ADD	HL,HL
	LD	A,H
	LD	(.dinc1),A
	LD	A,L
	LD	(.dinc1+1),A

	;	Calculate (2*deltay)-deltax -> d


	LD	D,H
	LD	E,L
	LD	A,(.delta_x)
	CPL
	LD	L,A
	LD	H,#0xFF
	INC	HL
dx1$:
	ADD	HL,DE
	LD	A,H
	LD	(.l_d),A
	LD	A,L
	LD	(.l_d+1),A

	;	Calculate (deltay-deltax)*2 -> dinc2

	LD	A,(.delta_x)
	CPL
	LD	L,A
	LD	H,#0xFF
	INC	HL
	LD	A,(.delta_y)
	LD	D,#0x00
	LD	E,A
	ADD	HL,DE
	ADD	HL,HL

	LD	A,H
	LD	(.dinc2),A
	LD	A,L
	LD	(.dinc2+1),A

	POP	HL

	.if	0
	LD	A,(.mod_col)
	LD	D,A
	.endif
	
	LD	A,(.delta_x)
	LD	E,A

	LD	A,B
	AND	#7
	ADD	#0x10	; Table of bits is located at 0x0010
	LD	C,A
	LD	B,#0x00
	LD	A,(BC)	; Get start bit
	LD	B,A
	LD	C,A

xloop$:
	RRC	C
	LD	A,(.l_d)
	BIT	7,A
	JR	Z,ychg$
	PUSH	DE
	BIT	7,C
	JR	Z,nbit$
	LD	A,B
	CPL
	LD	C,A
	CALL	.wrbyte
	DEC	HL
	LD	C,#0x80
	LD	B,C
nbit$:
	LD	A,(.l_d+1)
	LD	D,A
	LD	A,(.dinc1+1)
	ADD	D
	LD	(.l_d+1),A
	LD	A,(.l_d)
	LD	D,A
	LD	A,(.dinc1)
	ADC	D
	LD	(.l_d),A
	POP	DE
	JR	nchg$
ychg$:
	PUSH	DE
	PUSH	BC
	LD	A,B
	CPL
	LD	C,A
	CALL	.wrbyte
	LD	A,(.l_inc)
	OR	A
	JR	Z,ydown$
	INC	HL
	LD	A,L
	AND	#0x0F
	JR	NZ,bound$
	LD	DE,#0x0130
	ADD	HL,DE	;Correct screen address
	JR	bound$
ydown$:
	DEC	HL
	DEC	HL
	DEC	HL
	LD	A,L
	AND	#0x0F
	XOR	#0x0E
	JR	NZ,bound$
	LD	DE,#0xFED0
	ADD	HL,DE	;Correct screen address
bound$:
	LD	A,(.l_d+1)
	LD	D,A
	LD	A,(.dinc2+1)
	ADD	D
	LD	(.l_d+1),A
	LD	A,(.l_d)
	LD	D,A
	LD	A,(.dinc2)
	ADC	D
	LD	(.l_d),A
	POP	BC
	LD	B,C
	POP	DE
nchg$:
	BIT	7,C
	JR	Z,nadj$
	PUSH	DE
	LD	DE,#0x0010
	ADD	HL,DE	;Correct screen address
	POP	DE
	LD	B,C
nadj$:
	LD	A,B
	OR	C
	LD	B,A
	DEC	E
	JP	NZ,xloop$
	LD	A,B
	CPL
	LD	C,A
	JP	.wrbyte

.xonly::
	;; Draw accelerated horizontal line
	.if	0
	;; xxx needed?
	LD	A,(.mod_col)	
	LD	D,A
	.endif

	LD	A,(.delta_x)
	LD	E,A
	INC	E

	LD	A,B	;check X
	AND	#7	;just look at bottom 3 bits
	JR	Z,2$
	PUSH	HL
	ADD	#0x10	;Table of bits is located at 0x0010
	LD	L,A
	LD	H,#0x00
	LD	C,(HL)
	POP	HL
	XOR	A	;Clear A
1$:	RRCA		;Shift data right 1
	OR	C
	DEC	E
	JR	Z,3$
	BIT	0,A
	JR	Z,1$
	JR	3$
2$:
	LD	A,E
	DEC	A
	AND	#0xF8
	JR	Z,4$
	JR	8$
3$:
	LD	B,A
	CPL
	LD	C,A
	PUSH	DE
	CALL	.wrbyte
	LD	DE,#0x0F
	ADD	HL,DE	;Correct screen address
	POP	DE

8$:	LD	A,E
	OR	A
	RET	Z
	AND	#0xF8
	JR	Z,4$

	XOR	A
	LD	C,A
	CPL
	LD	B,A

	PUSH	DE
	CALL	.wrbyte
	LD	DE,#0x0F
	ADD	HL,DE	;Correct screen address
	POP	DE
	LD	A,E
	SUB	#8
	RET	Z
	LD	E,A
	JR	8$

4$:	LD	A,#0x80
5$:	DEC	E
	JR	Z,6$
	SRA	A
	JR	5$
6$:	LD	B,A
	CPL
	LD	C,A
	JP	.wrbyte

	;; Use Delta Y
y1:
	LD	A,C
	SUB	E
	JP	NC,y2$

	LD	A,B
	SUB	D
	JR	Z,y3$
	LD	A,#0x00
	JR	NC,y3$
	LD	A,#0xFF
	JR	y3$

y2$:
	LD	A,C
	SUB	E
	JR	Z,y2a$
	LD	A,#0x00
	JR	NC,y2a$
	LD	A,#0xFF

y2a$:
	LD	B,D
	LD	C,E	;BC holds start X,Y

y3$:
	LD	(.l_inc),A	;Store X increment
	LD	HL,#.y_table
	LD	D,#0x00
	LD	E,C
	ADD	HL,DE
	ADD	HL,DE
	LD	A,(HL+)
	LD	H,(HL)
	LD	L,A

	LD	A,B
	AND	#0xf8
	LD	E,A
	ADD	HL,DE
	ADD	HL,DE

	.if	0
	;; Trashed by later instructions
	LD	A,(.mod_col)
	LD	D,A
	.endif
	
	LD	A,(.delta_y)
	LD	E,A
	INC	E

	LD	A,(.delta_x)
	OR	A
	JP	Z,.yonly

	;;	Got to do it the hard way.

	;	Calculate (2*deltax) -> dinc1

	PUSH	HL
	LD	H,#0x00
	LD	L,A
	ADD	HL,HL
	LD	A,H
	LD	(.dinc1),A
	LD	A,L
	LD	(.dinc1+1),A

	;	Calculate (2*deltax)-deltay -> d


	LD	D,H
	LD	E,L
	LD	A,(.delta_y)
	CPL
	LD	L,A
	LD	H,#0xFF
	INC	HL
dy1$:
	ADD	HL,DE
	LD	A,H
	LD	(.l_d),A
	LD	A,L
	LD	(.l_d+1),A

	;	Calculate (deltax-deltay)*2 -> dinc2

	LD	A,(.delta_y)
	CPL
	LD	L,A
	LD	H,#0xFF
	INC	HL
	LD	A,(.delta_x)
	LD	D,#0x00
	LD	E,A
	ADD	HL,DE
	ADD	HL,HL

	LD	A,H
	LD	(.dinc2),A
	LD	A,L
	LD	(.dinc2+1),A

	POP	HL

	.if	0
	;; xxx Not used?
	LD	A,(.mod_col)
	LD	D,A
	.endif

	LD	A,(.delta_y)
	LD	E,A

	LD	A,B
	AND	#7
	ADD	#0x10	; Table of bits is located at 0x0010
	LD	C,A
	LD	B,#0x00
	LD	A,(BC)	; Get start bit
	LD	B,A
	LD	C,A

yloop$:
	PUSH	DE
	PUSH	BC
	LD	A,B
	CPL
	LD	C,A
	CALL	.wrbyte
	INC	HL
	LD	A,L
	AND	#0x0F
	JR	NZ,nybound$
	LD	DE,#0x0130
	ADD	HL,DE	;Correct screen address
nybound$:
	POP	BC
	LD	A,(.l_d)
	BIT	7,A
	JR	Z,xchg$
	LD	A,(.l_d+1)
	LD	D,A
	LD	A,(.dinc1+1)
	ADD	D
	LD	(.l_d+1),A
	LD	A,(.l_d)
	LD	D,A
	LD	A,(.dinc1)
	ADC	D
	LD	(.l_d),A
	JR	nchgy$
xchg$:
	LD	A,(.l_inc)
	OR	A
	JR	NZ,yright$
	RLC	B
	BIT	0,B
	JR	Z,boundy$
	LD	DE,#0xFFF0
	ADD	HL,DE	;Correct screen address
	JR	boundy$
yright$:
	RRC	B
	BIT	7,B
	JR	Z,boundy$
	LD	DE,#0x0010
	ADD	HL,DE	;Correct screen address
boundy$:
	LD	A,(.l_d+1)
	LD	D,A
	LD	A,(.dinc2+1)
	ADD	D
	LD	(.l_d+1),A
	LD	A,(.l_d)
	LD	D,A
	LD	A,(.dinc2)
	ADC	D
	LD	(.l_d),A
nchgy$:
	POP	DE
	DEC	E
	JR	NZ,yloop$
	LD	A,B
	CPL
	LD	C,A
	JP	.wrbyte

.yonly::
	;; Draw accelerated vertical line
	LD	A,B	;check X
	AND	#7	;just look at bottom 3 bits
	PUSH	HL
	ADD	#0x10	;Table of bits is located at 0x0010
	LD	L,A
	LD	H,#0x00
	LD	A,(HL)	;Get mask bit
	POP	HL
	LD	B,A
	CPL
	LD	C,A

1$:	PUSH	DE
	CALL	.wrbyte
	INC	HL	;Correct screen address
	LD	A,L
	AND	#0x0F
	JR	NZ,2$
	LD	DE,#0x0130
	ADD	HL,DE
2$:	POP	DE
	DEC	E
	RET	Z
	JR	1$

	;; Draw a point at (B,C) with mode and color D
.plot::

	LD	HL,#.y_table
	LD	D,#0x00
	LD	E,C
	ADD	HL,DE
	ADD	HL,DE
	LD	A,(HL+)
	LD	H,(HL)
	LD	L,A

	LD	A,B
	AND	#0xf8
	LD	E,A
	ADD	HL,DE
	ADD	HL,DE

	LD	A,B

	AND     #7
	ADD     #0x10		; Table of bits is located at 0x0010
	LD      C,A
	LD      B,#0x00
	LD      A,(BC)
	LD      B,A
	CPL
	LD      C,A

.wrbyte::
	.if	0
	LD	A,(.mod_col)	; Restore color and mode
	LD	D,A

	BIT	5,D
	JR	NZ,10$
	BIT	6,D
	JR	NZ,20$
	BIT	7,D
	JR	NZ,30$
	.else
	LD	A,(.fg_colour)
	LD	D,A
	LD	A,(.draw_mode)
	CP	#.M_OR
	JR	Z,10$
	CP	#.M_XOR
	JR	Z,20$
	CP	#.M_AND
	JR	Z,30$		
	.endif

	; Fall through to SOLID by default
1$:
	;; Solid
	LD	E,B
	.if	0
	BIT	2,D
	.else
	BIT	0,D
	.endif
	JR	NZ,2$
	PUSH	BC
	LD	B,#0x00
2$:
	.if	0
	BIT	3,D
	.else
	BIT	1,D
	.endif
	JR	NZ,3$
	LD	E,#0x00
3$:
	LDH	A,(.STAT)
	BIT	1,A
	JR	NZ,3$

	LD	A,(HL)
	AND	C
	OR	B
	LD	(HL+),A

	LD	A,(HL)
	AND	C
	OR	E
	LD	(HL),A
	LD	A,B
	OR	A
	RET	NZ
	POP	BC
	RET

10$:
	;; Or
	LD      C,B
	.if	0
	BIT     2,D
	.else
	BIT	0,D
	.endif
	JR      NZ,11$
	LD      B,#0x00
11$:
	.if	0
	BIT     3,D
	.else
	BIT	1,D
	.endif
	JR      NZ,12$
	LD      C,#0x00
12$:
	LDH     A,(.STAT)
	BIT     1,A
	JR      NZ,12$

	LD      A,(HL)
	OR      B
	LD      (HL+),A

	LD      A,(HL)
	OR      C
	LD      (HL),A
	RET

20$:
	;; Xor
	LD      C,B
	.if	0
	BIT     2,D
	.else
	BIT	0,D
	.endif
	JR      NZ,21$
	LD      B,#0x00
21$:
	.if	0
	BIT     3,D
	.else
	BIT	1,D
	.endif
	JR      NZ,22$
	LD      C,#0x00
22$:
	LDH     A,(.STAT)
	BIT     1,A
	JR      NZ,22$

	LD      A,(HL)
	XOR     B
	LD      (HL+),A

	LD      A,(HL)
	XOR     C
	LD      (HL),A
	RET

30$:
	;; And
	LD      B,C
	.if	0
	BIT     2,D
	.else
	BIT	0,D
	.endif
	JR      Z,31$
	LD      B,#0xFF
31$:
	.if	0
	BIT     3,D
	.else
	BIT	1,D
	.endif
	JR      Z,32$
	LD      C,#0xFF
32$:
	LDH     A,(.STAT)
	BIT     1,A
	JR      NZ,32$

	LD      A,(HL)
	AND     B
	LD      (HL+),A

	LD      A,(HL)
	AND     C
	LD      (HL),A
	RET

	;; Get color of pixel at point (B,C) returns in A
.getpix::
	LD	HL,#.y_table
	LD	D,#0x00
	LD	E,C
	ADD	HL,DE
	ADD	HL,DE
	LD	A,(HL+)
	LD	H,(HL)
	LD	L,A

	LD	A,B
	AND	#0xf8
	LD	E,A
	ADD	HL,DE
	ADD	HL,DE

	LD	A,B

	AND     #7
	ADD     #0x10		; Table of bits is located at 0x0010
	LD      C,A
	LD      B,#0x00
	LD      A,(BC)
	LD      C,A

gp$:
	LDH	A,(.STAT)
	BIT	1,A
	JR	NZ,gp$

	LD	A,(HL+)
	LD	D,A
	LD	A,(HL+)
	LD	E,A
	LD	B,#0
	LD	A,D
	AND	C
	JR	Z,npix$
	SET	0,B
npix$:	LD	A,E
	AND	C
	JR	Z,end$
	SET	1,B
end$:	LD	E,B
	RET

	;; Write character C
.wrtchr::
	LD	HL,#.y_table
	LD	D,#0x00
	LD	A,(.ty)
	RLCA
	RLCA
	RLCA
	LD	E,A
	ADD	HL,DE
	ADD	HL,DE
	LD	B,(HL)
	INC	HL
	LD	H,(HL)
	LD	L,B

	LD	A,(.tx)
	RLCA
	RLCA
	RLCA
	LD	E,A
	ADD	HL,DE
	ADD	HL,DE

	LD	A,C
	LD	B,H
	LD	C,L

	LD	H,D
	LD	L,A
	ADD	HL,HL
	ADD	HL,HL
	ADD	HL,HL

	.if	0
	LD	DE,#.tp1
	.else
	.globl	_font_ibm_fixed_tiles

	LD	DE,#_font_ibm_fixed_tiles
	.endif
	
	ADD	HL,DE

	LD	D,H
	LD	E,L
	LD	H,B
	LD	L,C

	.if	0
	LD	A,(.mod_col)
	LD	C,A
	.else
	LD	A,(.fg_colour)
	LD	C,A
	.endif
chrloop$:
	LD	A,(DE)
	INC	DE
	PUSH	DE

	.if	1
	PUSH	HL
	LD	HL,#.bg_colour
	LD	L,(HL)
	.endif

	LD	B,A
	XOR	A
	.if	0
	BIT	0,C
	.else
	BIT	0,L
	.endif
	JR	Z,a0$
	CPL
a0$:	OR	B
	.if	0
	BIT	2,C
	.else
	BIT	0,C
	.endif
	JR	NZ,a1$
	XOR	B
a1$:	LD	D,A
	XOR	A
	.if	0
	BIT	1,C
	.else
	BIT	1,L
	.endif
	JR	Z,b0$
	CPL
b0$:	OR	B
	.if	0
	BIT	3,C
	.else
	BIT	1,C
	.endif
	JR	NZ,b1$
	XOR	B
b1$:	
	LD	E,A
	.if	1
	POP	HL
	.endif
chrwait$:
	LDH	A,(.STAT)
	BIT	1,A
	JR	NZ,chrwait$

	LD	A,D
	LD	(HL+),A
	LD	A,E
	LD	(HL+),A
	POP	DE
	LD	A,L
	AND	#0x0F
	JR	NZ,chrloop$
	RET

	.area	_CODE
_gotogxy::			; Banked
	LDA	HL,.BANKOV(SP)	; Skip return address
	LD	A,(HL+)		; A = x
	LD	(.tx),A
	LD	A,(HL+)		; A = y
	LD	(.ty),A

	RET

_wrtchr::			; Banked
	PUSH    BC

	LD	A,(.mode)
	CP	#.G_MODE
	CALL	NZ,.gmode

	LDA	HL,.BANKOV+2(SP)	; Skip return address and registers
	LD	A,(HL)
	LD	C,A	; C = Char to print

	CALL	.wrtchr
	CALL	.adv_gcurs

	POP	BC
	RET

_getpix::			; Banked
	PUSH    BC

	LDA	HL,.BANKOV+2(SP)	; Skip return address and registers
	LD	A,(HL+)	; B = x
	LD	B,A
	LD	A,(HL+)	; C = y
	LD	C,A

	CALL	.getpix

	POP	BC
	RET

_color::			; Banked
	LDA	HL,.BANKOV(SP)	; Skip return address and registers
	LD	A,(HL+)	; A = Foreground
	LD	(.fg_colour),a
	LD	A,(HL+)
	LD	(.bg_colour),a
	LD	A,(HL)
	LD	(.draw_mode),a
	RET

_circle::			; Banked
	PUSH    BC

	LD	A,(.mode)
	CP	#.G_MODE
	CALL	NZ,.gmode

	LDA	HL,.BANKOV+2(SP)	; Skip return address and registers
	LD	A,(HL+)	; B = x
	LD	B,A
	LD	A,(HL+)	; C = y
	LD	C,A
	LD	A,(HL+)	; D = Radius
	LD	D,A
	LD	A,(HL)
	LD	(.style),A

	CALL	.circle

	POP	BC
	RET

_box::				; Banked
	PUSH    BC

	LD      A,(.mode)
	CP      #.G_MODE
	CALL	NZ,.gmode

	LDA	HL,.BANKOV+2(SP)	; Skip return address and registers
	LD	A,(HL+)	; B = x1
	LD	(.x_s),A
	LD	A,(HL+)	; C = y1
	LD	(.y_s),A
	LD	A,(HL+)	; D = x2
	LD	(.x_s+1),A
	LD	A,(HL+)	; E = y2
	LD	(.y_s+1),A
	LD	A,(HL)
	LD	(.style),A
	CALL	.box
	POP	BC
	RET

_line::				; Banked
	PUSH    BC

	LD      A,(.mode)
	CP      #.G_MODE
	CALL	NZ,.gmode

	LDA	HL,.BANKOV+2(SP)	; Skip return address and registers
	LD	A,(HL+)	; B = x1
	LD	B,A
	LD	A,(HL+)	; C = y1
	LD	C,A
	LD	A,(HL+)	; D = x2
	LD	D,A
	LD	A,(HL+)	; E = y2
	LD	E,A

	CALL	.line

	POP     BC
	RET

_plot_point::			; Banked
	PUSH    BC

	LD	A,(.mode)
	CP	#.G_MODE
	CALL	NZ,.gmode

	LDA	HL,.BANKOV+2(SP)	; Skip return address and registers
	LD	A,(HL+)	; B = x
	LD	B,A
	LD	A,(HL+)	; C = y
	LD	C,A

	CALL	.plot

	POP	BC
	RET

	;; Old, compatible version of plot()
_plot::				; Banked
	PUSH    BC

	LD	A,(.mode)
	CP	#.G_MODE
	CALL	NZ,.gmode

	LDA	HL,.BANKOV+2(SP)	; Skip return address and registers
	LD	A,(HL+)		; B = x
	LD	B,A
	LD	A,(HL+)		; C = y
	LD	C,A
	LD	A,(HL+)		; colour
	LD	(.fg_colour),A
	LD	A,(HL+)		; mode
	LD	(.draw_mode),A
	
	CALL	.plot

	POP	BC
	RET

	.area	_BASE
_switch_data::			; Non Banked as pointer
	PUSH    BC

	LD	A,(.mode)
	CP	#.G_MODE
	CALL	NZ,.gmode

	LDA	HL,4(SP)	; Skip return address and registers
	LD	A,(HL+)	; B = x
	LD	B,A
	LD	A,(HL+)	; C = y
	LD	C,A
	LD	A,(HL+)	; DE = src
	LD	E,A
	LD	A,(HL+)
	LD	D,A
	LD	A,(HL+)	; HL = dst
	LD	H,(HL)
	LD	L,A

	CALL    .switch_data

	POP     BC
	RET


_draw_image::			; Non banked as pointer
	PUSH    BC

	LD	A,(.mode)
	CP	#.G_MODE
	CALL	NZ,.gmode

	LDA	HL,4(SP)	; Skip return address and registers
	LD	A,(HL+)	; HL = data
	LD	C,A
	LD	B,(HL)

	CALL	.draw_image

	POP	BC
	RET

	.area	_BASE
.y_table::
	.word   0x8100,0x8102,0x8104,0x8106,0x8108,0x810A,0x810C,0x810E
	.word   0x8240,0x8242,0x8244,0x8246,0x8248,0x824A,0x824C,0x824E
	.word   0x8380,0x8382,0x8384,0x8386,0x8388,0x838A,0x838C,0x838E
	.word   0x84C0,0x84C2,0x84C4,0x84C6,0x84C8,0x84CA,0x84CC,0x84CE
	.word   0x8600,0x8602,0x8604,0x8606,0x8608,0x860A,0x860C,0x860E
	.word   0x8740,0x8742,0x8744,0x8746,0x8748,0x874A,0x874C,0x874E
	.word   0x8880,0x8882,0x8884,0x8886,0x8888,0x888A,0x888C,0x888E
	.word   0x89C0,0x89C2,0x89C4,0x89C6,0x89C8,0x89CA,0x89CC,0x89CE
	.word   0x8B00,0x8B02,0x8B04,0x8B06,0x8B08,0x8B0A,0x8B0C,0x8B0E
	.word   0x8C40,0x8C42,0x8C44,0x8C46,0x8C48,0x8C4A,0x8C4C,0x8C4E
	.word   0x8D80,0x8D82,0x8D84,0x8D86,0x8D88,0x8D8A,0x8D8C,0x8D8E
	.word   0x8EC0,0x8EC2,0x8EC4,0x8EC6,0x8EC8,0x8ECA,0x8ECC,0x8ECE
	.word   0x9000,0x9002,0x9004,0x9006,0x9008,0x900A,0x900C,0x900E
	.word   0x9140,0x9142,0x9144,0x9146,0x9148,0x914A,0x914C,0x914E
	.word   0x9280,0x9282,0x9284,0x9286,0x9288,0x928A,0x928C,0x928E
	.word   0x93C0,0x93C2,0x93C4,0x93C6,0x93C8,0x93CA,0x93CC,0x93CE
	.word   0x9500,0x9502,0x9504,0x9506,0x9508,0x950A,0x950C,0x950E
	.word   0x9640,0x9642,0x9644,0x9646,0x9648,0x964A,0x964C,0x964E

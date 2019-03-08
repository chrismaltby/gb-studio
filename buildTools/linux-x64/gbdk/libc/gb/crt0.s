	.include	"global.s"

	;; ****************************************
	;; Beginning of module
	;; BANKED: checked
	.title	"Runtime"
	.module	Runtime
	.area	_HEADER (ABS)

	;; Standard header for the GB
	.org	0x00
	RET			; Empty function (default for interrupts)

	.org	0x10
	.byte	0x80,0x40,0x20,0x10,0x08,0x04,0x02,0x01
	.byte	0x01,0x02,0x04,0x08,0x10,0x20,0x40,0x80

	;; Interrupt vectors
	.org	0x40		; VBL
.int_VBL:
	PUSH	HL
	LD	HL,#.int_0x40
	JP	.int

	.org	0x48		; LCD
.int_LCD:
	PUSH	HL
	LD	HL,#.int_0x48
	JP	.int

	.org	0x50		; TIM
.int_TIM:
	PUSH	HL
	LD	HL,#.int_0x50
	JP	.int

	.org	0x58		; SIO
.int_SIO:
	PUSH	HL
	LD	HL,#.int_0x58
	JP	.int

	.org	0x60		; JOY
.int_JOY:
	PUSH	HL
	LD	HL,#.int_0x60
	JP	.int

.int:
	PUSH	AF
	PUSH	BC
	PUSH	DE
1$:
	LD	A,(HL+)
	OR	(HL)
	JR	Z,2$
	PUSH	HL
	LD	A,(HL-)
	LD	L,(HL)
	LD	H,A
	CALL	3$
	POP	HL
	INC	HL
	JR	1$
2$:
	POP	DE
	POP	BC
	POP	AF
	POP	HL
	RETI

3$:
	JP	(HL)

	;; GameBoy Header

	;; DO NOT CHANGE...
	.org	0x100
.header:
	NOP
	JP	0x150
	.byte	0xCE,0xED,0x66,0x66
	.byte	0xCC,0x0D,0x00,0x0B
	.byte	0x03,0x73,0x00,0x83
	.byte	0x00,0x0C,0x00,0x0D
	.byte	0x00,0x08,0x11,0x1F
	.byte	0x88,0x89,0x00,0x0E
	.byte	0xDC,0xCC,0x6E,0xE6
	.byte	0xDD,0xDD,0xD9,0x99
	.byte	0xBB,0xBB,0x67,0x63
	.byte	0x6E,0x0E,0xEC,0xCC
	.byte	0xDD,0xDC,0x99,0x9F
	.byte	0xBB,0xB9,0x33,0x3E

	;; Title of the game
	.org	0x134
	.asciz	"Title"

	.org	0x144
	.byte	0,0,0

	;; Cartridge type is ROM only
	.org	0x147
	.byte	0

	;; ROM size is 32kB
	.org	0x148
	.byte	0

	;; RAM size is 0kB
	.org	0x149
	.byte	0

	;; Maker ID
	.org	0x14A
	.byte	0x00,0x00

	;; Version number
	.org	0x14C
	.byte	0x01

	;; Complement check
	.org	0x14D
	.byte	0x00

	;; Checksum
	.org	0x14E
	.byte	0x00,0x00

	;; ****************************************
	.org	0x150
.code_start:
	;; Beginning of the code
	DI			; Disable interrupts
	LD	D,A		; Store CPU type in D
	XOR	A
	;; Initialize the stack
	LD	SP,#.STACK
	;; Clear from 0xC000 to 0xDFFF
	LD	HL,#0xDFFF
	LD	C,#0x20
	LD	B,#0x00
1$:
	LD	(HL-),A
	DEC	B
	JR	NZ,1$
	DEC	C
	JR	NZ,1$
	;; Clear from 0xFE00 to 0xFEFF
	LD	HL,#0xFEFF
	LD	B,#0x00
2$:
	LD	(HL-),A
	DEC	B
	JR	NZ,2$
	;; Clear from 0xFF80 to 0xFFFF
	LD	HL,#0xFFFF
	LD	B,#0x80
3$:
	LD	(HL-),A
	DEC	B
	JR	NZ,3$
; 	LD	(.mode),A	; Clearing (.mode) is performed when clearing RAM
	;; Store CPU type
	LD	A,D
	LD	(__cpu),A

	;; Turn the screen off
	CALL	.display_off

	;; Initialize the display
	XOR	A
	LDH	(.SCY),A
	LDH	(.SCX),A
	LDH	(.STAT),A
	LDH	(.WY),A
	LD	A,#0x07
	LDH	(.WX),A

	;; Copy refresh_OAM routine to HIRAM
	LD	BC,#.refresh_OAM
	LD	HL,#.start_refresh_OAM
	LD	B,#.end_refresh_OAM-.start_refresh_OAM
4$:
	LD	A,(HL+)
	LDH	(C),A
	INC	C
	DEC	B
	JR	NZ,4$

	;; Install interrupt routines
	LD	BC,#.vbl
	CALL	.add_VBL
	LD	BC,#.serial_IO
	CALL	.add_SIO

	;; Standard color palettes
	LD	A,#0b11100100	; Grey 3 = 11 (Black)
				; Grey 2 = 10 (Dark grey)
				; Grey 1 = 01 (Light grey)
				; Grey 0 = 00 (Transparent)
	LDH	(.BGP),A
	LDH	(.OBP0),A
	LD	A,#0b00011011
	LDH	(.OBP1),A

	;; Turn the screen on
	LD	A,#0b11000000	; LCD		= On
				; WindowBank	= 0x9C00
				; Window	= Off
				; BG Chr	= 0x8800
				; BG Bank	= 0x9800
				; OBJ		= 8x8
				; OBJ		= Off
				; BG		= Off
	LDH	(.LCDC),A
	XOR	A
	LDH	(.IF),A
	LD	A,#0b00001001	; Pin P10-P13	=   Off
				; Serial I/O	=   On
				; Timer Ovfl	=   Off
				; LCDC		=   Off
				; V-Blank	=   On
	LDH	(.IE),A

	XOR	A
	LDH	(.NR52),A	; Turn sound off
	LDH	(.SC),A		; Use external clock
	LD	A,#.DT_IDLE
	LDH	(.SB),A		; Send IDLE byte
	LD	A,#0x80
	LDH	(.SC),A		; Use external clock

	XOR	A		; Erase the malloc list
;	LD	(_malloc_heap_start+0),A
;	LD	(_malloc_heap_start+1),A
;	LD	(.sys_time+0),A	; Zero the system clock
;	LD	(.sys_time+1),A	

	call	gsinit

;	CALL	.init		

	EI			; Enable interrupts

	;; Call the main function
	CALL	banked_call
	.dw	_main
	.if __RGBDS__
	.dw	BANK(_main)
	.else
	.dw	1
	.endif
_exit::	
99$:
	HALT
	JR	99$		; Wait forever

	.org	.MODE_TABLE
	;; Jump table for modes
	RET

	;; ****************************************

	;; Ordering of segments for the linker
	;; Code that really needs to be in bank 0
	.area	_HOME
	;; Similar to _HOME
	.area	_BASE
	;; Code
	.area	_CODE
	;; Constant data
	.area	_LIT
	;; Constant data used to init _DATA
	.area	_GSINIT
	.area	_GSINITTAIL
	.area	_GSFINAL
	;; Initialised in ram data
	.area	_DATA
	;; Uninitialised ram data
	.area	_BSS
	;; For malloc
	.area	_HEAP

	.area	_BSS
__cpu::
	.ds	0x01		; GB type (GB, PGB, CGB)
.mode::
	.ds	0x01		; Current mode
__io_out::
	.ds	0x01		; Byte to send
__io_in::
	.ds	0x01		; Received byte
__io_status::
	.ds	0x01		; Status of serial IO
.vbl_done::
	.ds	0x01		; Is VBL interrupt finished?
__current_bank::
	.ds	0x01		; Current MBC1 style bank.
.sys_time::
_sys_time::
	.ds	0x02		; System time in VBL units
.int_0x40::
	.blkw	0x08
.int_0x48::
	.blkw	0x08
.int_0x50::
	.blkw	0x08
.int_0x58::
	.blkw	0x08
.int_0x60::
	.blkw	0x08

	;; Runtime library
	.area	_GSINIT
gsinit::
	.area	_GSINITTAIL
	ret
	
	.area	_HOME
	;; Call the initialization function for the mode specified in HL
.set_mode::
	LD	A,L
	LD	(.mode),A

	;; AND to get rid of the extra flags
	AND	#0x03
	LD	L,A
	LD	BC,#.MODE_TABLE
	SLA	L		; Multiply mode by 4
	SLA	L
	ADD	HL,BC
	JP	(HL)		; Jump to initialization routine

	;; Add interrupt routine in BC to the interrupt list
.remove_VBL::
	LD	HL,#.int_0x40
	JP	.remove_int
.remove_LCD::
	LD	HL,#.int_0x48
	JP	.remove_int
.remove_TIM::
	LD	HL,#.int_0x50
	JP	.remove_int
.remove_SIO::
	LD	HL,#.int_0x58
	JP	.remove_int
.remove_JOY::
	LD	HL,#.int_0x60
	JP	.remove_int
.add_VBL::
	LD	HL,#.int_0x40
	JP	.add_int
.add_LCD::
	LD	HL,#.int_0x48
	JP	.add_int
.add_TIM::
	LD	HL,#.int_0x50
	JP	.add_int
.add_SIO::
	LD	HL,#.int_0x58
	JP	.add_int
.add_JOY::
	LD	HL,#.int_0x60
	JP	.add_int

	;; Remove interrupt BC from interrupt list HL if it exists
	;; Abort if a 0000 is found (end of list)
	;; Will only remove last int on list
.remove_int::
1$:
	LD	A,(HL+)
	LD	E,A
	LD	D,(HL)
	OR	D
	RET	Z		; No interrupt found

	LD	A,E
	CP	C
	JR	NZ,1$
	LD	A,D
	CP	B
	JR	NZ,1$

	XOR	A
	LD	(HL-),A
	LD	(HL),A
	INC	A		; Clear Z flag

	;; Now do a memcpy from here until the end of the list
	LD	D,H
	LD	E,L
	DEC	DE

	INC	HL
2$:
	LD	A,(HL+)
	LD	(DE),A
	LD	B,A
	INC	DE
	LD	A,(HL+)
	LD	(DE),A
	INC	DE
	OR	B
	RET	Z
	JR	2$
	
	;; Add interrupt routine in BC to the interrupt list in HL
.add_int::
1$:
	LD	A,(HL+)
	OR	(HL)
	JR	Z,2$
	INC	HL
	JR	1$
2$:
	LD	(HL),B
	DEC	HL
	LD	(HL),C
	RET

	
	;; VBlank interrupt
.vbl:
	LD	HL,#.sys_time
	INC	(HL)
	JR	NZ,2$
	INC	HL
	INC	(HL)
2$:	
	CALL	.refresh_OAM

	LD	A,#0x01
	LD	(.vbl_done),A
	RET

	;; Wait for VBL interrupt to be finished
.wait_vbl_done::
_wait_vbl_done::
	;; Check if the screen is on
	LDH	A,(.LCDC)
	ADD	A
	RET	NC		; Return if screen is off
	XOR	A
	DI
	LD	(.vbl_done),A	; Clear any previous sets of vbl_done
	EI
1$:
	HALT			; Wait for any interrupt
	NOP			; HALT sometimes skips the next instruction
	LD	A,(.vbl_done)	; Was it a VBlank interrupt?
	;; Warning: we may lose a VBlank interrupt, if it occurs now
	OR	A
	JR	Z,1$		; No: back to sleep!

	XOR	A
	LD	(.vbl_done),A
	RET

.display_off::
_display_off::
	;; Check if the screen is on
	LDH	A,(.LCDC)
	ADD	A
	RET	NC		; Return if screen is off
1$:				; We wait for the *NEXT* VBL 
	LDH	A,(.LY)
	CP	#0x92		; Smaller than or equal to 0x91?
	JR	NC,1$		; Loop until smaller than or equal to 0x91
2$:
	LDH	A,(.LY)
	CP	#0x91		; Bigger than 0x90?
	JR	C,2$		; Loop until bigger than 0x90

	LDH	A,(.LCDC)
	AND	#0b01111111
	LDH	(.LCDC),A	; Turn off screen
	RET

	;; Copy OAM data to OAM RAM
.start_refresh_OAM:
	LD	A,#>.OAM
	LDH	(.DMA),A	; Put A into DMA registers
	LD	A,#0x28		; We need to wait 160 ns
1$:
	DEC	A
	JR	NZ,1$
	RET
.end_refresh_OAM:

	;; Serial interrupt
.serial_IO::
	LD	A,(__io_status) ; Get status

	CP	#.IO_RECEIVING
	JR	NZ,10$

	;; Receiving data
	LDH	A,(.SB)		; Get data byte
	LD	(__io_in),A	; Store it
	LD	A,#.IO_IDLE
	JR	11$

10$:

	CP	#.IO_SENDING
	JR	NZ,99$

	;; Sending data
	LDH	A,(.SB)		; Get data byte
	CP	#.DT_RECEIVING
	JR	Z,11$
	LD	A,#.IO_ERROR
	JR	12$
11$:
	LD	A,#.IO_IDLE
12$:
	LD	(__io_status),A ; Store status

	XOR	A
	LDH	(.SC),A		; Use external clock
	LD	A,#.DT_IDLE
	LDH	(.SB),A		; Reply with IDLE byte
99$:
	LD	A,#0x80
	LDH	(.SC),A		; Enable transfer with external clock
	RET

_mode::
	LDA	HL,2(SP)	; Skip return address
	LD	L,(HL)
	LD	H,#0x00
	CALL	.set_mode
	RET

_get_mode::
	LD	HL,#.mode
	LD	E,(HL)
	RET
	
_enable_interrupts::
	EI
	RET

_disable_interrupts::
	DI
	RET

.reset::
_reset::
	LD	A,(__cpu)
	JP	.code_start

_set_interrupts::
	DI
	LDA	HL,2(SP)	; Skip return address
	XOR	A
	LDH	(.IF),A		; Clear pending interrupts
	LD	A,(HL)
	LDH	(.IE),A
	EI			; Enable interrupts
	RET

_remove_VBL::
	PUSH	BC
	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)
	INC	HL
	LD	B,(HL)
	CALL	.remove_VBL
	POP	BC
	RET

_remove_LCD::
	PUSH	BC
	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)
	INC	HL
	LD	B,(HL)
	CALL	.remove_LCD
	POP	BC
	RET

_remove_TIM::
	PUSH	BC
	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)
	INC	HL
	LD	B,(HL)
	CALL	.remove_TIM
	POP	BC
	RET

_remove_SIO::
	PUSH	BC
	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)
	INC	HL
	LD	B,(HL)
	CALL	.remove_SIO
	POP	BC
	RET

_remove_JOY::
	PUSH	BC
	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)
	INC	HL
	LD	B,(HL)
	CALL	.remove_JOY
	POP	BC
	RET
	
_add_VBL::
	PUSH	BC
	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)
	INC	HL
	LD	B,(HL)
	CALL	.add_VBL
	POP	BC
	RET

_add_LCD::
	PUSH	BC
	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)
	INC	HL
	LD	B,(HL)
	CALL	.add_LCD
	POP	BC
	RET

_add_TIM::
	PUSH	BC
	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)
	INC	HL
	LD	B,(HL)
	CALL	.add_TIM
	POP	BC
	RET

_add_SIO::
	PUSH	BC
	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)
	INC	HL
	LD	B,(HL)
	CALL	.add_SIO
	POP	BC
	RET

_add_JOY::
	PUSH	BC
	LDA	HL,4(SP)	; Skip return address and registers
	LD	C,(HL)
	INC	HL
	LD	B,(HL)
	CALL	.add_JOY
	POP	BC
	RET

_clock::
	ld	hl,#.sys_time
	di
	ld	a,(hl+)
	ei
	;; Interrupts are disabled for the next instruction...
	ld	d,(hl)
	ld	e,a
	ret

__printTStates::
	ret

	;; Performs a long call.
	;; Basically:
	;;   call banked_call
	;;   .dw low
	;;   .dw bank
	;;   remainder of the code
	;; Total m-cycles:
	;;	3+4+4 + 2+2+2+2+2+2 + 4+4+ 3+4+1+1+1
	;;      = 41 for the call
	;;	3+3+4+4+1
	;;	= 15 for the ret
banked_call::
	pop	hl		; Get the return address
	ld	a,(__current_bank)
	push	af		; Push the current bank onto the stack
	ld	e,(hl)		; Fetch the call address
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	a,(hl+)		; ...and page
	inc	hl		; Yes this should be here
	push	hl		; Push the real return address
	ld	(__current_bank),a
	ld	(.MBC1_ROM_PAGE),a	; Perform the switch
	ld	hl,#banked_ret	; Push the fake return address
	push	hl
	ld	l,e
	ld	h,d
	jp	(hl)

banked_ret::
	pop	hl		; Get the return address
	pop	af		; Pop the old bank
	ld	(.MBC1_ROM_PAGE),a
	ld	(__current_bank),a
	jp	(hl)
		
	.area	_HEAP
_malloc_heap_start::

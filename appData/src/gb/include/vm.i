; bytecode
; calling convention 
;      args: big-endian
;      order: left-to-right (leftmost argument pushed first)

; exception ID's
EXCEPTION_RESET	        = 1
EXCEPTION_CHANGE_SCENE	= 2
EXCEPTION_SAVE          = 3
EXCEPTION_LOAD          = 4

; aliases
.ARG0 = -1
.ARG1 = -2
.ARG2 = -3
.ARG3 = -4
.ARG4 = -5
.ARG5 = -6
.ARG6 = -7
.ARG7 = -8
.ARG8 = -9
.ARG9 = -10
.ARG10 = -11
.ARG11 = -12
.ARG12 = -13
.ARG13 = -14
.ARG14 = -15
.ARG15 = -16
.ARG16 = -17

.PARAM0 = .ARG2
.PARAM1 = .ARG3
.PARAM2 = .ARG4
.PARAM3 = .ARG5
.PARAM4 = .ARG6
.PARAM5 = .ARG7
.PARAM6 = .ARG8
.PARAM7 = .ARG9
.PARAM8 = .ARG10
.PARAM9 = .ARG11
.PARAM10 = .ARG12
.PARAM11 = .ARG13
.PARAM12 = .ARG14
.PARAM13 = .ARG15
.PARAM14 = .ARG16
.PARAM15 = -18
.PARAM16 = -19


; stops execution of context
OP_VM_STOP         = 0x00
.macro VM_STOP
        .db OP_VM_STOP 
.endm

; push immediate value onto VM stack
OP_VM_PUSH_CONST   = 0x01
.macro VM_PUSH_CONST ARG0
        .db OP_VM_PUSH_CONST, #>ARG0, #<ARG0
.endm

; removes ARG0 values from VM stack
OP_VM_POP          = 0x02
.macro VM_POP ARG0
        .db OP_VM_POP, #ARG0
.endm

; call by relative (one-byte) offset
OP_VM_CALL_REL     = 0x03
.macro VM_CALL_REL ARG0
        .db OP_VM_CALL_REL, #(ARG0 - . - 1)
.endm

; call by near address
OP_VM_CALL         = 0x04
.macro VM_CALL ARG0
        .db OP_VM_CALL, #>ARG0, #<ARG0
.endm

; return from relative or near call
OP_VM_RET          = 0x05
.macro VM_RET
        .db OP_VM_RET, 0 
.endm

; return from relative or near call and clear n arguments on stack
.macro VM_RET_N ARG0
        .db OP_VM_RET, #<ARG0 
.endm

; loop by relative (one-byte) offset, counter is on stack, counter is removed on exit
OP_VM_LOOP_REL     = 0x06
.macro VM_LOOP_REL IDX, LABEL, NPOP
        .db OP_VM_LOOP_REL, #<NPOP, #(LABEL - . - 3), #>IDX, #<IDX
.endm

; loop by near address, counter is on stack, counter is removed on exit
OP_VM_LOOP         = 0x07
.macro VM_LOOP IDX, LABEL, NPOP
        .db OP_VM_LOOP, #<NPOP, #>LABEL, #<LABEL, #>IDX, #<IDX
.endm

; loop by relative (one-byte) offset
OP_VM_JUMP_REL     = 0x08
.macro VM_JUMP_REL ARG0
        .db OP_VM_JUMP_REL, #(ARG0 - . - 1)
.endm

; loop by near address
OP_VM_JUMP         = 0x09
.macro VM_JUMP ARG0
        .db OP_VM_JUMP, #>ARG0, #<ARG0
.endm

; call far (inter-bank call)
OP_VM_CALL_FAR     = 0x0A
.macro VM_CALL_FAR ARG0, ARG1
        .db OP_VM_CALL_FAR, #>ARG1, #<ARG1, #<ARG0
.endm

; rerurn from far call and clear n arguments on stack
OP_VM_RET_FAR      = 0x0B
.macro VM_RET_FAR
        .db OP_VM_RET_FAR, 0 
.endm

; rerurn from far call and clear n arguments on stack
.macro VM_RET_FAR_N ARG0
        .db OP_VM_RET_FAR, #<ARG0 
.endm

; returns game boy system time on VM stack
OP_VM_GET_SYSTIME  = 0x0C
.macro VM_GET_SYSTIME IDX
        .db OP_VM_GET_SYSTIME, #>IDX, #<IDX
.endm

; invokes <bank>:<address> C function until it returns true
OP_VM_INVOKE       = 0x0D
.macro VM_INVOKE ARG0, ARG1, ARG2, ARG3
        .db OP_VM_INVOKE, #>ARG3, #<ARG3, #<ARG2, #>ARG1, #<ARG1, #<ARG0
.endm

; spawns a thread in a separate context
OP_VM_BEGINTHREAD  = 0x0E
.macro VM_BEGINTHREAD BANK, THREADPROC, HTHREAD, NARGS
        .db OP_VM_BEGINTHREAD, #<NARGS, #>HTHREAD, #<HTHREAD, #>THREADPROC, #<THREADPROC, #<BANK
.endm

; condition
OP_VM_IF           = 0x0F
.EQ                = 1
.LT                = 2
.LTE               = 3
.GT                = 4
.GTE               = 5
.NE                = 6
.AND               = 7
.OR                = 8
.macro VM_IF CONDITION, IDXA, IDXB, LABEL, N
        .db OP_VM_IF, #<N, #>LABEL, #<LABEL, #>IDXB, #<IDXB, #>IDXA, #<IDXA, #<CONDITION
.endm

; pushes a value on VM stack or a global indirectly from an index in the variable on VM stack or in a global onto VM stack
OP_VM_PUSH_VALUE_IND = 0x10
.macro VM_PUSH_VALUE_IND ARG0
        .db OP_VM_PUSH_VALUE_IND, #>ARG0, #<ARG0
.endm

; pushes a value on VM stack or a global onto VM stack
OP_VM_PUSH_VALUE   = 0x11
.macro VM_PUSH_VALUE ARG0
        .db OP_VM_PUSH_VALUE, #>ARG0, #<ARG0
.endm

; similar to pop
OP_VM_RESERVE      = 0x12
.macro VM_RESERVE ARG0
        .db OP_VM_RESERVE, #<ARG0
.endm

; assignes a value on VM stack or a global to a value on VM stack or a global 
OP_VM_SET         = 0x13
.macro VM_SET IDXA, IDXB
        .db OP_VM_SET, #>IDXB, #<IDXB, #>IDXA, #<IDXA
.endm

; assignes a value on VM stack or a global to immediate
OP_VM_SET_CONST   = 0x14
.macro VM_SET_CONST IDX, VAL
        .db OP_VM_SET_CONST, #>VAL, #<VAL, #>IDX, #<IDX
.endm

; rpn calculator, returns result on VM stack
OP_VM_RPN          = 0x15
.ADD               = '+'
.SUB               = '-'
.MUL               = '*'
.DIV               = '/'
.MOD               = '%'
.B_AND             = '&'
.B_OR              = '|'
.B_XOR             = '^'
.B_NOT             = '~' 
.ABS               = '@'
.MIN               = 'm'
.MAX               = 'M'
.ISQRT             = 'Q'
;.EQ                = 1
;.LT                = 2
;.LTE               = 3
;.GT                = 4
;.GTE               = 5
;.NE                = 6
;.AND               = 7
;.OR                = 8
.NOT               = 9
.macro VM_RPN
        .db OP_VM_RPN
.endm
.macro .R_INT8 ARG0
        .db -1, #<ARG0
.endm
.macro .R_INT16 ARG0
        .db -2
        .dw #ARG0
.endm
.macro .R_REF ARG0
        .db -3
        .dw #ARG0
.endm
.macro .R_REF_IND ARG0
        .db -4
        .dw #ARG0
.endm
.macro .R_OPERATOR ARG0
        .db ARG0
.endm
.macro .R_STOP
        .db 0
.endm

; joins a thread
OP_VM_JOIN       = 0x16
.macro VM_JOIN IDX
        .db OP_VM_JOIN, #>IDX, #<IDX
.endm

; kills a thread
OP_VM_TERMINATE  = 0x17
.macro VM_TERMINATE IDX
        .db OP_VM_TERMINATE, #>IDX, #<IDX
.endm

; signals runner that context in a waitable state
OP_VM_IDLE      = 0x18
.macro VM_IDLE
        .db OP_VM_IDLE
.endm

; gets thread local variable. non-negative index of second argument points to
; a thread local variable (parameters, passed into thread)
OP_VM_GET_TLOCAL= 0x19
.macro VM_GET_TLOCAL IDXA, IDXB
        .db OP_VM_GET_TLOCAL, #>IDXB, #<IDXB, #>IDXA, #<IDXA
.endm

; compares variable or value on stack with a constant
OP_VM_IF_CONST  = 0x1A
.macro VM_IF_CONST CONDITION, IDXA, B, LABEL, N
        .db OP_VM_IF_CONST, #<N, #>LABEL, #<LABEL, #>B, #<B, #>IDXA, #<IDXA, #<CONDITION
.endm

; gets unsigned int8 from WRAM. second argument is an address of unsigned int8
OP_VM_GET_UINT8 = 0x1B
.macro VM_GET_UINT8 IDXA, ADDR
        .db OP_VM_GET_UINT8, #>ADDR, #<ADDR, #>IDXA, #<IDXA
.endm

; gets int8 from WRAM. second argument is an address of int8
OP_VM_GET_INT8  = 0x1C
.macro VM_GET_INT8 IDXA, ADDR
        .db OP_VM_GET_INT8, #>ADDR, #<ADDR, #>IDXA, #<IDXA
.endm

; gets int16 from WRAM. second argument is an address of int16
OP_VM_GET_INT16  = 0x1D
.macro VM_GET_INT16 IDXA, ADDR
        .db OP_VM_GET_INT16, #>ADDR, #<ADDR, #>IDXA, #<IDXA
.endm

; sets unsigned int8 in WRAM. first argument is an address of unsigned int8
OP_VM_SET_UINT8 = 0x1E
.macro VM_SET_UINT8 ADDR, IDXA
        .db OP_VM_SET_UINT8, #>IDXA, #<IDXA, #>ADDR, #<ADDR
.endm

; sets int8 in WRAM. first argument is an address of int8
OP_VM_SET_INT8  = 0x1F
.macro VM_SET_INT8 ADDR, IDXA
        .db OP_VM_SET_INT8, #>IDXA, #<IDXA, #>ADDR, #<ADDR
.endm

; sets int16 in WRAM. first argument is an address of int16
OP_VM_SET_INT16  = 0x20
.macro VM_SET_INT16 ADDR, IDXA
        .db OP_VM_SET_INT16, #>IDXA, #<IDXA, #>ADDR, #<ADDR
.endm

; sets int8 in WRAM to a const. first argument is an address of int8
OP_VM_SET_CONST_INT8 = 0x21
.macro VM_SET_CONST_INT8 ADDR, V
        .db OP_VM_SET_CONST_INT8, #<V, #>ADDR, #<ADDR
.endm

; sets unsigned int8 in WRAM to a const. first argument is an address of unsigned int8
.macro VM_SET_CONST_UINT8 ADDR, V
        .db OP_VM_SET_CONST_INT8, #<V, #>ADDR, #<ADDR
.endm

; sets int16 in WRAM to a const. first argument is an address of int16
OP_VM_SET_CONST_INT16 = 0x22
.macro VM_SET_CONST_INT16 ADDR, V
        .db OP_VM_SET_CONST_INT16, #>V, #<V, #>ADDR, #<ADDR
.endm

; Initializes RNG seed
OP_VM_RANDOMIZE       = 0x23
.macro VM_RANDOMIZE
        .db OP_VM_RANDOMIZE
.endm

; Returns random value between MIN and MIN+LIMIT
OP_VM_RAND            = 0x24
.macro VM_RAND IDX, MIN, LIMIT
        .db OP_VM_RAND 
        .db #>(LIMIT | (LIMIT >> 1) | (LIMIT >> 2) | (LIMIT >> 3) | (LIMIT >> 4) | (LIMIT >> 5) | (LIMIT >> 6) | (LIMIT >> 7) | (LIMIT >> 8) | (LIMIT >> 9) | (LIMIT >> 10) | (LIMIT >> 11) | (LIMIT >> 12) | (LIMIT >> 13) | (LIMIT >> 14) | (LIMIT >> 15))  
        .db #<(LIMIT | (LIMIT >> 1) | (LIMIT >> 2) | (LIMIT >> 3) | (LIMIT >> 4) | (LIMIT >> 5) | (LIMIT >> 6) | (LIMIT >> 7) | (LIMIT >> 8) | (LIMIT >> 9) | (LIMIT >> 10) | (LIMIT >> 11) | (LIMIT >> 12) | (LIMIT >> 13) | (LIMIT >> 14) | (LIMIT >> 15))  
        .db #>LIMIT, #<LIMIT, #>MIN, #<MIN, #>IDX, #<IDX
.endm

; Locks VM
OP_VM_LOCK            = 0x25
.macro VM_LOCK
        .db OP_VM_LOCK
.endm

; Unlocks VM
OP_VM_UNLOCK          = 0x26
.macro VM_UNLOCK
        .db OP_VM_UNLOCK
.endm

; Raises VM exception
OP_VM_RAISE           = 0x27
.macro VM_RAISE CODE, SIZE
        .db OP_VM_RAISE, #<SIZE, #<CODE
.endm

; assignes a value on VM stack or a global indirectly to a value on VM stack ar a global 
OP_VM_SET_INDIRECT    = 0x28
.macro VM_SET_INDIRECT IDXA, IDXB
        .db OP_VM_SET_INDIRECT, #>IDXB, #<IDXB, #>IDXA, #<IDXA
.endm

; assignes a value on VM stack or a global to a value on VM stack ar a global indirectly
OP_VM_GET_INDIRECT    = 0x29
.macro VM_GET_INDIRECT IDXA, IDXB
        .db OP_VM_GET_INDIRECT, #>IDXB, #<IDXB, #>IDXA, #<IDXA
.endm

; Terminates unit-testing immediately
OP_VM_TEST_TERMINATE  = 0x2A
.TEST_WAIT_VBL        = 1
.macro VM_TEST_TERMINATE FLAGS
        .db OP_VM_TEST_TERMINATE, #<FLAGS
.endm

; Checks that VM state was restored and reset the restore flag
OP_VM_POLL_LOADED     = 0x2B
.macro VM_POLL_LOADED IDX
        .db OP_VM_POLL_LOADED, #>IDX, #<IDX
.endm

; Translates idx into absolute index and pushes result to VM stack
OP_VM_PUSH_REFERENCE  = 0x2C 
.macro VM_PUSH_REFERENCE IDX
        .db OP_VM_PUSH_REFERENCE, #>IDX, #<IDX
.endm

; call native code by far pointer
OP_VM_CALL_NATIVE     = 0x2D 
.macro VM_CALL_NATIVE BANK, PTR
        .db OP_VM_CALL_NATIVE, #>PTR, #<PTR, #<BANK
.endm

; clear VM memory
OP_VM_MEMSET          = 0x76
.macro VM_MEMSET DEST, VALUE, COUNT
        .db OP_VM_MEMSET, #>COUNT, #<COUNT, #>VALUE, #<VALUE, #>DEST, #<DEST
.endm

; copy VM memory
OP_VM_MEMCPY          = 0x77
.macro VM_MEMCPY DEST, SOUR, COUNT
        .db OP_VM_MEMCPY, #>COUNT, #<COUNT, #>SOUR, #<SOUR, #>DEST, #<DEST
.endm

; --- engine-specific instructions ------------------------------------------

; --- LOAD/SAVE --------------------------------------

.macro .SAVE_SLOT SLOT
        .db #<SLOT
.endm
; Reads count variables from save slot into dest and puts result of the operation into res
OP_VM_SAVE_PEEK         = 0x2E
.macro VM_SAVE_PEEK RES, DEST, SOUR, COUNT, SLOT
        .db OP_VM_SAVE_PEEK, #<SLOT, #<COUNT, #>SOUR, #<SOUR, #>DEST, #<DEST, #>RES, #<RES
.endm

; Erases data in save slot
OP_VM_SAVE_CLEAR         = 0x2F
.macro VM_SAVE_CLEAR SLOT
        .db OP_VM_SAVE_CLEAR, #<SLOT
.endm

; --- ACTOR ------------------------------------------

OP_VM_ACTOR_MOVE_TO     = 0x30
.ACTOR_ATTR_H_FIRST     = 0x01
.ACTOR_ATTR_CHECK_COLL  = 0x02
.ACTOR_ATTR_DIAGONAL    = 0x04
.macro VM_ACTOR_MOVE_TO IDX
        .db OP_VM_ACTOR_MOVE_TO, #>IDX, #<IDX
.endm

OP_VM_ACTOR_ACTIVATE    = 0x31
.macro VM_ACTOR_ACTIVATE ACTOR
        .db OP_VM_ACTOR_ACTIVATE, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_DIR     = 0x32
.DIR_DOWN               = 0
.DIR_RIGHT              = 1
.DIR_UP                 = 2
.DIR_LEFT               = 3
.macro VM_ACTOR_SET_DIR ACTOR, DIR
        .db OP_VM_ACTOR_SET_DIR, #<DIR, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_DEACTIVATE  = 0x33
.macro VM_ACTOR_DEACTIVATE ACTOR
        .db OP_VM_ACTOR_DEACTIVATE, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_ANIM    = 0x34
.macro VM_ACTOR_SET_ANIM ACTOR, ANIM
        .db OP_VM_ACTOR_SET_ANIM, #>ANIM, #<ANIM, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_POS     = 0x35
.macro VM_ACTOR_SET_POS IDX
        .db OP_VM_ACTOR_SET_POS, #>IDX, #<IDX
.endm

OP_VM_ACTOR_EMOTE       = 0x36
.macro VM_ACTOR_EMOTE ACTOR, AVATAR_BANK, AVATAR
        .db OP_VM_ACTOR_EMOTE, #>AVATAR, #<AVATAR, #<AVATAR_BANK, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_BOUNDS  = 0x37
.macro VM_ACTOR_SET_BOUNDS ACTOR, LEFT, RIGHT, TOP, BOTTOM
        .db OP_VM_ACTOR_SET_BOUNDS, #<BOTTOM, #<TOP, #<RIGHT, #<LEFT, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_SPRITESHEET     = 0x38
.macro VM_ACTOR_SET_SPRITESHEET ACTOR, SHEET_BANK, SHEET
        .db OP_VM_ACTOR_SET_SPRITESHEET, #>SHEET, #<SHEET, #<SHEET_BANK, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_SPRITESHEET_BY_REF     = 0x87
.macro VM_ACTOR_SET_SPRITESHEET_BY_REF ACTOR, FAR_PTR
        .db OP_VM_ACTOR_SET_SPRITESHEET_BY_REF, #>FAR_PTR, #<FAR_PTR, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_REPLACE_TILE        = 0x39
.macro VM_ACTOR_REPLACE_TILE ACTOR, TARGET_TILE, TILEDATA_BANK, TILEDATA, START, LEN
        .db OP_VM_ACTOR_REPLACE_TILE, #<LEN, #<START, #>TILEDATA, #<TILEDATA, #<TILEDATA_BANK, #<TARGET_TILE, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_GET_POS     = 0x3A
.macro VM_ACTOR_GET_POS IDX
        .db OP_VM_ACTOR_GET_POS, #>IDX, #<IDX
.endm

OP_VM_ACTOR_SET_HIDDEN     = 0x3B
.macro VM_ACTOR_SET_HIDDEN ACTOR, HIDDEN
        .db OP_VM_ACTOR_SET_HIDDEN, #<HIDDEN, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_GET_DIR     = 0x3C
.macro VM_ACTOR_GET_DIR IDX, DEST
        .db OP_VM_ACTOR_GET_DIR, #>DEST, #<DEST, #>IDX, #<IDX
.endm

OP_VM_ACTOR_GET_ANGLE     = 0x86
.macro VM_ACTOR_GET_ANGLE IDX, DEST
        .db OP_VM_ACTOR_GET_ANGLE, #>DEST, #<DEST, #>IDX, #<IDX
.endm

OP_VM_ACTOR_SET_ANIM_TICK     = 0x3D
.macro VM_ACTOR_SET_ANIM_TICK ACTOR, TICK
        .db OP_VM_ACTOR_SET_ANIM_TICK, #<TICK, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_MOVE_SPEED     = 0x3E
.macro VM_ACTOR_SET_MOVE_SPEED ACTOR, SPEED
        .db OP_VM_ACTOR_SET_MOVE_SPEED, #<SPEED, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_COLL_ENABLED     = 0x3F
.macro VM_ACTOR_SET_COLL_ENABLED ACTOR, ENABLED
        .db OP_VM_ACTOR_SET_COLL_ENABLED, #<ENABLED, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_TERMINATE_UPDATE  = 0x74
.macro VM_ACTOR_TERMINATE_UPDATE ACTOR
        .db OP_VM_ACTOR_TERMINATE_UPDATE, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_ANIM_FRAME     = 0x75
.macro VM_ACTOR_SET_ANIM_FRAME ACTOR
        .db OP_VM_ACTOR_SET_ANIM_FRAME, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_GET_ANIM_FRAME     = 0x83
.macro VM_ACTOR_GET_ANIM_FRAME ACTOR
        .db OP_VM_ACTOR_GET_ANIM_FRAME, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_ANIM_SET       = 0x84
.macro VM_ACTOR_SET_ANIM_SET ACTOR, OFFSET
        .db OP_VM_ACTOR_SET_ANIM_SET, #>OFFSET, #<OFFSET, #>ACTOR, #<ACTOR
.endm

; --- UI ------------------------------------------

OP_VM_LOAD_TEXT         = 0x40
.macro VM_LOAD_TEXT ARG0
        .db OP_VM_LOAD_TEXT, #<ARG0
.endm

OP_VM_DISPLAY_TEXT      = 0x41
.macro VM_DISPLAY_TEXT
        .db OP_VM_DISPLAY_TEXT
.endm

OP_VM_SWITCH_TEXT_LAYER = 0x85
.TEXT_LAYER_BKG         = 0
.TEXT_LAYER_WIN         = 1
.macro VM_SWITCH_TEXT_LAYER LAYER
        .db OP_VM_SWITCH_TEXT_LAYER, #<LAYER
.endm


OP_VM_OVERLAY_SETPOS    = 0x42
.macro VM_OVERLAY_SETPOS X, Y
        .db OP_VM_OVERLAY_SETPOS, #<Y, #<X
.endm

OP_VM_OVERLAY_HIDE      = 0x43
.macro VM_OVERLAY_HIDE
        .db OP_VM_OVERLAY_HIDE
.endm

OP_VM_OVERLAY_WAIT      = 0x44
.UI_NONMODAL            = 0
.UI_MODAL               = 1
.UI_WAIT_NONE           = 0
.UI_WAIT_WINDOW         = 1
.UI_WAIT_TEXT           = 2
.UI_WAIT_BTN_A          = 4
.UI_WAIT_BTN_B          = 8
.UI_WAIT_BTN_ANY        = 16
.macro VM_OVERLAY_WAIT IS_MODAL, WAIT_FLAGS
        .db OP_VM_OVERLAY_WAIT, #<WAIT_FLAGS, #<IS_MODAL
.endm

OP_VM_OVERLAY_MOVE_TO   = 0x45
.OVERLAY_IN_SPEED       = -1
.OVERLAY_TEXT_IN_SPEED  = -1    ; obsolete
.OVERLAY_OUT_SPEED      = -2
.OVERLAY_TEXT_OUT_SPEED = -2    ; obsolete
.OVERLAY_SPEED_INSTANT  = -3
.macro VM_OVERLAY_MOVE_TO X, Y, SPEED
        .db OP_VM_OVERLAY_MOVE_TO, #<SPEED, #<Y, #<X
.endm

OP_VM_OVERLAY_SHOW      = 0x46
.UI_COLOR_BLACK         = 0
.UI_COLOR_WHITE         = 1
.UI_DRAW_FRAME          = 1
.UI_AUTO_SCROLL         = 2
.macro VM_OVERLAY_SHOW X, Y, COLOR, OPTIONS
        .db OP_VM_OVERLAY_SHOW, #<OPTIONS, #<COLOR, #<Y, #<X
.endm

OP_VM_OVERLAY_CLEAR     = 0x47
.macro VM_OVERLAY_CLEAR X, Y, W, H, COLOR, OPTIONS
        .db OP_VM_OVERLAY_CLEAR, #<OPTIONS, #<COLOR, #<H, #<W, #<Y, #<X 
.endm

OP_VM_CHOICE            = 0x48
.UI_MENU_STANDARD       = 0
.UI_MENU_LAST_0         = 1
.UI_MENU_CANCEL_B       = 2
.macro VM_CHOICE IDX, OPTIONS, COUNT
        .db OP_VM_CHOICE, #<COUNT, #<OPTIONS, #>IDX, #<IDX
.endm
.macro .MENUITEM X, Y, iL, iR, iU, iD
        .db #<X, #<Y, #<iL, #<iR, #<iU, #<iD
.endm

OP_VM_LOAD_FRAME        = 0x49
.macro VM_LOAD_FRAME BANK, ADDR
        .db OP_VM_LOAD_FRAME, #>ADDR, #<ADDR, #<BANK
.endm

OP_VM_LOAD_CURSOR       = 0x4A
.macro VM_LOAD_CURSOR BANK, ADDR
        .db OP_VM_LOAD_CURSOR, #>ADDR, #<ADDR, #<BANK
.endm

OP_VM_SET_FONT          = 0x4B
.macro VM_SET_FONT FONT_INDEX
        .db OP_VM_SET_FONT, #<FONT_INDEX
.endm

OP_VM_SET_PRINT_DIR     = 0x4C
.UI_PRINT_LEFTTORIGHT   = 0
.UI_PRINT_RIGHTTOLEFT   = 1
.macro VM_SET_PRINT_DIR DIRECTION
        .db OP_VM_SET_PRINT_DIR, #<DIRECTION
.endm

OP_VM_OVERLAY_SCROLL    = 0x4D
.macro VM_OVERLAY_SCROLL X, Y, W, H, COLOR
        .db OP_VM_OVERLAY_SCROLL, #<COLOR, #<H, #<W, #<Y, #<X 
.endm

OP_VM_OVERLAY_SET_SCROLL = 0x4E
.macro VM_OVERLAY_SET_SCROLL X, Y, W, H, COLOR
        .db OP_VM_OVERLAY_SET_SCROLL, #<COLOR, #<H, #<W, #<Y, #<X 
.endm

OP_VM_OVERLAY_SET_SUBMAP = 0x4F
.macro VM_OVERLAY_SET_SUBMAP X, Y, W, H, SX, SY
        .db OP_VM_OVERLAY_SET_SUBMAP, #<SY, #<SX, #<H, #<W, #<Y, #<X 
.endm

; --- GAMEBOY ------------------------------------------

OP_VM_SHOW_SPRITES      = 0x50
.macro VM_SHOW_SPRITES
        .db OP_VM_SHOW_SPRITES
.endm

OP_VM_HIDE_SPRITES      = 0x51
.macro VM_HIDE_SPRITES
        .db OP_VM_HIDE_SPRITES
.endm

OP_VM_INPUT_WAIT        = 0x52
.macro VM_INPUT_WAIT MASK
        .db OP_VM_INPUT_WAIT, #<MASK
.endm

OP_VM_INPUT_ATTACH      = 0x53
.OVERRIDE_DEFAULT       = 0x80
.macro VM_INPUT_ATTACH MASK, SLOT
        .db OP_VM_INPUT_ATTACH, #<SLOT, #<MASK
.endm

OP_VM_INPUT_GET         = 0x54
.JOY0                   = 0
.JOY1                   = 1
.JOY2                   = 2
.JOY3                   = 3
.macro VM_INPUT_GET IDX, JOYID
        .db OP_VM_INPUT_GET, #<JOYID, #>IDX, #<IDX
.endm

OP_VM_CONTEXT_PREPARE   = 0x55
.macro VM_CONTEXT_PREPARE SLOT, BANK, ADDR
        .db OP_VM_CONTEXT_PREPARE, #>ADDR, #<ADDR, #<BANK, #<SLOT
.endm

OP_VM_FADE_IN           = 0x56
.macro VM_FADE_IN IS_MODAL
        .db OP_VM_FADE_IN, #<IS_MODAL
.endm

OP_VM_FADE_OUT          = 0x57
.macro VM_FADE_OUT IS_MODAL
        .db OP_VM_FADE_OUT, #<IS_MODAL
.endm

; Load script into timer context
OP_VM_TIMER_PREPARE     = 0x58
.macro VM_TIMER_PREPARE TIMER, BANK, ADDR
        .db OP_VM_TIMER_PREPARE, #>ADDR, #<ADDR, #<BANK, #<TIMER
.endm

; Start a timer calling once every interval*16 frames
OP_VM_TIMER_SET         = 0x59
.macro VM_TIMER_SET TIMER, INTERVAL
        .db OP_VM_TIMER_SET, #<INTERVAL, #<TIMER 
.endm

; Stop a timer
OP_VM_TIMER_STOP         = 0x72
.macro VM_TIMER_STOP TIMER
        .db OP_VM_TIMER_STOP, #<TIMER 
.endm

; Reset a timers countdown to 0
OP_VM_TIMER_RESET         = 0x73
.macro VM_TIMER_RESET TIMER
        .db OP_VM_TIMER_RESET, #<TIMER 
.endm

OP_VM_GET_TILE_XY       = 0x5A
.macro VM_GET_TILE_XY TILE_IDX, X_IDX, Y_IDX
        .db OP_VM_GET_TILE_XY, #>Y_IDX, #<Y_IDX, #>X_IDX, #<X_IDX, #>TILE_IDX, #<TILE_IDX
.endm

OP_VM_REPLACE_TILE      = 0x5B
.macro VM_REPLACE_TILE TARGET_TILE_IDX, TILEDATA_BANK, TILEDATA, START_IDX, LEN
        .db OP_VM_REPLACE_TILE, #<LEN, #>START_IDX, #<START_IDX, #>TILEDATA, #<TILEDATA, #<TILEDATA_BANK, #>TARGET_TILE_IDX, #<TARGET_TILE_IDX
.endm

OP_VM_POLL              = 0x5C
.macro VM_POLL IDX_EVENT, IDX_VALUE, MASK
        .db OP_VM_POLL, #<MASK, #>IDX_VALUE, #<IDX_VALUE, #>IDX_EVENT, #<IDX_EVENT 
.endm

OP_VM_SET_SPRITE_MODE   = 0x5D
.MODE_8X8               = 0
.MODE_8X16              = 1
.macro VM_SET_SPRITE_MODE MODE
        .db OP_VM_SET_SPRITE_MODE, #<MODE 
.endm

OP_VM_REPLACE_TILE_XY   = 0x5E
.macro VM_REPLACE_TILE_XY X, Y, TILEDATA_BANK, TILEDATA, START_IDX
        .db OP_VM_REPLACE_TILE_XY, #>START_IDX, #<START_IDX, #>TILEDATA, #<TILEDATA, #<TILEDATA_BANK, #<Y, #<X
.endm

OP_VM_INPUT_DETACH      = 0x5F
.macro VM_INPUT_DETACH MASK
        .db OP_VM_INPUT_DETACH, #<MASK
.endm

; --- MUSIC AND SOUND -------------------------------

; Starts playing of music track
OP_VM_MUSIC_PLAY        = 0x60
.MUSIC_NO_LOOP          = 0
.MUSIC_LOOP             = 1
.macro VM_MUSIC_PLAY TRACK_BANK, TRACK, LOOP
        .db OP_VM_MUSIC_PLAY, #<LOOP, #>TRACK, #<TRACK, #<TRACK_BANK
.endm

; Stops playing of music track
OP_VM_MUSIC_STOP        = 0x61
.macro VM_MUSIC_STOP
        .db OP_VM_MUSIC_STOP
.endm

; Mutes/unmutes channels by mask
OP_VM_MUSIC_MUTE        = 0x62
.macro VM_MUSIC_MUTE MASK
        .db OP_VM_MUSIC_MUTE, #<MASK
.endm

; Sets master volume
OP_VM_SOUND_MASTERVOL   = 0x63
.macro VM_SOUND_MASTERVOL VOL
        .db OP_VM_SOUND_MASTERVOL, #<VOL
.endm

; Plays sound effect
OP_VM_SOUND_PLAY        = 0x64
.macro VM_SOUND_PLAY FRAMES, CH, ?A, ?B, ?C, ?D, ?E
        .db OP_VM_SOUND_PLAY, #<CH, #<FRAMES
        .db #<A, #<B, #<C, #<D, #<E    
.endm

; Attach script to music event
OP_VM_MUSIC_ROUTINE     = 0x65
.macro VM_MUSIC_ROUTINE ROUTINE, BANK, ADDR
        .db OP_VM_MUSIC_ROUTINE, #>ADDR, #<ADDR, #<BANK, #<ROUTINE
.endm

; Plays waveform record
OP_VM_WAVE_PLAY         = 0x66
.macro VM_WAVE_PLAY FRAMES, BANK, ADDR, SIZE
        .db OP_VM_WAVE_PLAY, #>SIZE, #<SIZE, #>ADDR, #<ADDR, #<BANK, #<FRAMES
.endm

; Sets music playback position
OP_VM_MUSIC_SETPOS      = 0x67
.macro VM_MUSIC_SETPOS PATTERN, ROW
        .db OP_VM_MUSIC_SETPOS, #<ROW, #<PATTERN
.endm

; --- SCENES -------------------------------

OP_VM_SCENE_PUSH        = 0x68
.macro VM_SCENE_PUSH
        .db OP_VM_SCENE_PUSH
.endm

OP_VM_SCENE_POP         = 0x69
.macro VM_SCENE_POP
        .db OP_VM_SCENE_POP
.endm

OP_VM_SCENE_POP_ALL     = 0x6A
.macro VM_SCENE_POP_ALL
        .db OP_VM_SCENE_POP_ALL
.endm

OP_VM_SCENE_STACK_RESET = 0x6B
.macro VM_SCENE_STACK_RESET
        .db OP_VM_SCENE_STACK_RESET
.endm

; --- SIO ----------------------------------

OP_VM_SIO_SET_MODE      = 0x6C
.SIO_MODE_NONE          = 0
.SIO_MODE_MASTER        = 1
.SIO_MODE_SLAVE         = 2
.macro VM_SIO_SET_MODE MODE
        .db OP_VM_SIO_SET_MODE, #<MODE
.endm

OP_VM_SIO_EXCHANGE      = 0x6D
.macro VM_SIO_EXCHANGE SOUR, DEST, SIZE
        .db OP_VM_SIO_EXCHANGE, #<(SIZE << 1), #>DEST, #<DEST, #>SOUR, #<SOUR
.endm

; --- CAMERA -------------------------------

OP_VM_CAMERA_MOVE_TO     = 0x70
.macro VM_CAMERA_MOVE_TO IDX, SPEED, AFTER_LOCK
        .db OP_VM_CAMERA_MOVE_TO, #<AFTER_LOCK, #<SPEED, #>IDX, #<IDX
.endm

.CAMERA_LOCK             = 0b00000011
.CAMERA_LOCK_X           = 0b00000001
.CAMERA_LOCK_Y           = 0b00000010
.CAMERA_UNLOCK           = 0b00000000

OP_VM_CAMERA_SET_POS     = 0x71
.macro VM_CAMERA_SET_POS IDX
        .db OP_VM_CAMERA_SET_POS, #>IDX, #<IDX
.endm

.CAMERA_SHAKE_X          = 1
.CAMERA_SHAKE_Y          = 2

; --- RTC ----------------------------------

; Latch RTC value for access
OP_VM_RTC_LATCH          = 0x78
.macro VM_RTC_LATCH
        .db OP_VM_RTC_LATCH
.endm

; Read RTC value
OP_VM_RTC_GET            = 0x79
.RTC_SECONDS             = 0x00
.RTC_MINUTES             = 0x01
.RTC_HOURS               = 0x02
.RTC_DAYS                = 0x03
.macro VM_RTC_GET IDX, WHAT
        .db OP_VM_RTC_GET, #<WHAT, #>IDX, #<IDX
.endm

; Write RTC value
OP_VM_RTC_SET            = 0x7A
.macro VM_RTC_SET IDX, WHAT
        .db OP_VM_RTC_SET, #<WHAT, #>IDX, #<IDX
.endm

; Start or stop RTC
OP_VM_RTC_START          = 0x7B
.RTC_STOP                = 0
.RTC_START               = 1
.macro VM_RTC_START START
        .db OP_VM_RTC_START, #<START
.endm

; --- COLOR ---------------------------------------

OP_VM_LOAD_PALETTE       = 0x7C
.PALETTE_COMMIT          = 1
.PALETTE_BKG             = 2
.PALETTE_SPRITE          = 4
.macro .DMG_PAL COL1, COL2, COL3, COL4
        .dw #((COL1 & 0x03) | ((COL2 & 0x03) << 2) | ((COL2 & 0x03) << 4) | ((COL4 & 0x03) << 6))
        .dw 0,0,0 
.endm
.macro .CGB_PAL R1,G1,B1 R2,G2,B2 R3,G3,B3 R4,G4,B4
        .dw #((R1 & 0x1F) | ((G1 & 0x1F) << 5) | ((B1 & 0x1F) << 10))
        .dw #((R2 & 0x1F) | ((G2 & 0x1F) << 5) | ((B2 & 0x1F) << 10))
        .dw #((R3 & 0x1F) | ((G3 & 0x1F) << 5) | ((B3 & 0x1F) << 10))
        .dw #((R4 & 0x1F) | ((G4 & 0x1F) << 5) | ((B4 & 0x1F) << 10))
.endm

.macro VM_LOAD_PALETTE MASK, OPTIONS
        .db OP_VM_LOAD_PALETTE, #<OPTIONS, #<MASK
.endm

; --- SGB -----------------------------------------

; transfers SGB packet(s)
OP_VM_SGB_TRANSFER       = 0x7E
.macro VM_SGB_TRANSFER 
        .db OP_VM_SGB_TRANSFER
.endm

; --- RUMBLE --------------------------------------

OP_VM_RUMBLE             = 0x7F
.macro VM_RUMBLE ENABLE
        .db OP_VM_RUMBLE, #<ENABLE
.endm

; --- PROJECTILES ---------------------------------

OP_VM_PROJECTILE_LAUNCH  = 0x80
.macro VM_PROJECTILE_LAUNCH TYPE, IDX
        .db OP_VM_PROJECTILE_LAUNCH, #>IDX, #<IDX, #<TYPE
.endm

; --- MATH -------------------------------------------

OP_VM_SIN_SCALE         = 0x89
.macro VM_SIN_SCALE IDX, IDX_ANGLE, SCALE
        .db OP_VM_SIN_SCALE, #<SCALE, #>IDX_ANGLE, #<IDX_ANGLE, #>IDX, #<IDX
.endm

OP_VM_COS_SCALE         = 0x8A
.macro VM_COS_SCALE IDX, IDX_ANGLE, SCALE
        .db OP_VM_COS_SCALE, #<SCALE, #>IDX_ANGLE, #<IDX_ANGLE, #>IDX, #<IDX
.endm

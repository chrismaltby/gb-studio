; bytecode
; calling convention 
;      args: big-endian
;      order: left-to-right (leftmost argument pushed first)

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

; stops execution of context
OP_VM_STOP         = 0x00
.macro VM_STOP
        .db OP_VM_STOP 
.endm

; push immediate value onto VM stack
OP_VM_PUSH         = 0x01
.macro VM_PUSH ARG0
        .db OP_VM_PUSH, #>ARG0, #<ARG0
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

; printf()
OP_VM_DEBUG        = 0x10
.macro VM_DEBUG ARG0
        .db OP_VM_DEBUG, #<ARG0
.endm

; pushes a value on VM stack or a global onto VM stack
OP_VM_PUSHVALUE    = 0x11
.macro VM_PUSHVALUE ARG0
        .db OP_VM_PUSHVALUE, #>ARG0, #<ARG0
.endm

; similar to pop
OP_VM_RESERVE    = 0x12
.macro VM_RESERVE ARG0
        .db OP_VM_RESERVE, #<ARG0
.endm

; assignes a value on VM stack or a global to a value on VM stack ar a global 
OP_VM_SET        = 0x13
.macro VM_SET IDXA, IDXB
        .db OP_VM_SET, #>IDXB, #<IDXB, #>IDXA, #<IDXA
.endm

; assignes a value on VM stack or a global to immediate
OP_VM_SET_CONST  = 0x14
.macro VM_SET_CONST IDX, VAL
        .db OP_VM_SET_CONST, #>VAL, #<VAL, #>IDX, #<IDX
.endm

; rpn calculator, returns result on VM stack
OP_VM_RPN        = 0x15
.ADD             = '+'
.SUB             = '-'
.MUL             = '*'
.DIV             = '/'
.MOD             = '%'
.B_AND           = '&'
.B_OR            = '|'
.B_XOR           = '^'
.ABS             = '@' 
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

; gets unsigned int8 from VM RAM. second argument is a VM RAM address of unsigned int8
OP_VM_GET_UINT8 = 0x1B
.macro VM_GET_UINT8 IDXA, ADDR
        .db OP_VM_GET_UINT8, #>ADDR, #<ADDR, #>IDXA, #<IDXA
.endm

; gets int8 from VM RAM. second argument is a VM RAM address of int8
OP_VM_GET_INT8  = 0x1C
.macro VM_GET_INT8 IDXA, ADDR
        .db OP_VM_GET_INT8, #>ADDR, #<ADDR, #>IDXA, #<IDXA
.endm

; gets int8 from VM RAM. second argument is a VM RAM address of int8
OP_VM_GET_INT16  = 0x1D
.macro VM_GET_INT16 IDXA, ADDR
        .db OP_VM_GET_INT16, #>ADDR, #<ADDR, #>IDXA, #<IDXA
.endm

; --- engine-specific instructions ------------------------------------------

OP_VM_ACTOR_MOVE_TO     = 0x1E
.macro VM_ACTOR_MOVE_TO IDX
        .db OP_VM_ACTOR_MOVE_TO, #>IDX, #<IDX
.endm

OP_VM_LOAD_TEXT         = 0x1F
.macro VM_LOAD_TEXT ARG0
        .db OP_VM_LOAD_TEXT, #<ARG0
.endm

OP_VM_DISPLAY_TEXT      = 0x20
.macro VM_DISPLAY_TEXT AVATAR_BANK, AVATAR
        .db OP_VM_DISPLAY_TEXT, #>AVATAR, #<AVATAR, #<AVATAR_BANK
.endm

OP_VM_OVERLAY_SETPOS    = 0x21
.macro VM_OVERLAY_SETPOS X, Y
        .db OP_VM_OVERLAY_SETPOS, #<Y, #<X
.endm

OP_VM_OVERLAY_HIDE      = 0x22
.macro VM_OVERLAY_HIDE
        .db OP_VM_OVERLAY_HIDE
.endm

OP_VM_OVERLAY_WAIT      = 0x23
.UI_NONMODAL            = 0
.UI_MODAL               = 1
.macro VM_OVERLAY_WAIT IS_MODAL
        .db OP_VM_OVERLAY_WAIT, #<IS_MODAL
.endm

OP_VM_OVERLAY_MOVE_TO   = 0x24
.macro VM_OVERLAY_MOVE_TO X, Y, SPEED
        .db OP_VM_OVERLAY_MOVE_TO, #<SPEED, #<Y, #<X
.endm

OP_VM_OVERLAY_SHOW      = 0x25
.UI_COLOR_BLACK         = 0
.UI_COLOR_WHITE         = 1
.macro VM_OVERLAY_SHOW X, Y, COLOR
        .db OP_VM_OVERLAY_SHOW, #<COLOR, #<Y, #<X
.endm

OP_VM_OVERLAY_CLEAR     = 0x26
.macro VM_OVERLAY_CLEAR COLOR
        .db OP_VM_OVERLAY_CLEAR, #<COLOR
.endm
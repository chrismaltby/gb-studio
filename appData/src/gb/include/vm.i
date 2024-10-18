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

; ------------------------------------------------------
; @section Core

OP_VM_STOP         = 0x00
;-- Stops execution of context.
.macro VM_STOP
        .db OP_VM_STOP
.endm

OP_VM_PUSH_CONST   = 0x01
;-- Pushes immediate value to the top of the VM stack.
; @param VAL Immediate value to be pushed.
.macro VM_PUSH_CONST VAL
        .db OP_VM_PUSH_CONST, #>VAL, #<VAL
.endm

OP_VM_POP          = 0x02
;-- Removes the top values from the VM stack.
; @param N Number of values to be removed from the stack.
.macro VM_POP N
        .db OP_VM_POP, #N
.endm

OP_VM_CALL         = 0x04
;-- Calls script by near address.
; @param ADDR Address of the script subroutine.
.macro VM_CALL ADDR
        .db OP_VM_CALL, #>ADDR, #<ADDR
.endm

OP_VM_RET          = 0x05
;-- Returns from the near call.
.macro VM_RET
        .db OP_VM_RET, 0
.endm

;-- Returns from the near call and clears N arguments on stack.
; @param N Number of arguments to be removed from the stack.
.macro VM_RET_N N
        .db OP_VM_RET, #<N
.endm

OP_VM_GET_FAR      = 0x06
.GET_BYTE          = 0
.GET_WORD          = 1
;-- Gets byte or word by the far pointer into variable.
; @param IDX Target variable.
; @param SIZE Size of the object to be acquired:
;   `.GET_BYTE` - Get 8-bit value.
;   `.GET_WORD` - Get 16-bit value.
; @param BANK Bank number of the object
; @param ADDR Address of the object
.macro VM_GET_FAR IDX, SIZE, BANK, ADDR
        .db OP_VM_GET_FAR, #>ADDR, #<ADDR, #<BANK, #<SIZE, #>IDX, #<IDX
.endm

OP_VM_LOOP         = 0x07
;-- Loops while variable is not zero, by the near address.
; @param IDX Loop counter variable.
; @param LABEL Jump label for the next iteration.
; @param N Amount of values to be removed from stack on exit.
.macro VM_LOOP IDX, LABEL, N
        .db OP_VM_LOOP, #<N, #>LABEL, #<LABEL, #>IDX, #<IDX
.endm

OP_VM_SWITCH       = 0x08
.macro .CASE VAL, LABEL
        .dw #VAL, #LABEL
.endm
;-- Compares variable with a set of values, and if equal, jumps to the specified label.
; Values for testing may be defined with the .CASE macro, where VAL parameter is a value for testing and LABEL is a jump label.
; @param IDX Variable for compare.
; @param SIZE Amount of entries for test.
; @param N Amount of values to be cleaned from stack on exit.
.macro VM_SWITCH IDX, SIZE, N
        .db OP_VM_SWITCH, #<N, #<SIZE, #>IDX, #<IDX
.endm

OP_VM_JUMP         = 0x09
;-- Jumps to near address.
; @param ARG0 Jump label.
.macro VM_JUMP LABEL
        .db OP_VM_JUMP, #>LABEL, #<LABEL
.endm

OP_VM_CALL_FAR     = 0x0A
;-- Calls far routine (inter-bank call).
; @param BANK Bank number of the routine.
; @param ADDR Address of the routine.
.macro VM_CALL_FAR BANK, ADDR
        .db OP_VM_CALL_FAR, #>ADDR, #<ADDR, #<BANK
.endm

OP_VM_RET_FAR      = 0x0B
;-- Returns from the far call.
.macro VM_RET_FAR
        .db OP_VM_RET_FAR, 0
.endm

;-- Returns from the far call and removes N arguments from stack.
; @param N Number of arguments to be removed from stack.
.macro VM_RET_FAR_N N
        .db OP_VM_RET_FAR, #<N
.endm

OP_VM_INVOKE       = 0x0D
;-- Invokes C function until it returns true.
; @param BANK Bank number of the function.
; @param ADDR Address of the function, currently 2 functions are implemented:
;   `_wait_frames`  - Wait for N vblank intervals.
;   `_camera_shake` - Shake camera N times.
; @param N Number of arguments to be removed from stack on return.
; @param PARAMS Points the first parameter to be passed into the C function.
.macro VM_INVOKE BANK, ADDR, N, PARAMS
        .db OP_VM_INVOKE, #>PARAMS, #<PARAMS, #<N, #>ADDR, #<ADDR, #<BANK
.endm

OP_VM_BEGINTHREAD  = 0x0E
;-- Spawns a thread in a separate context.
; @param BANK Bank number of a thread function.
; @param THREADPROC Address of a thread function.
; @param HTHREAD Variable that receives the thread handle.
; @param NARGS Amount of values from the stack to be copied into the stack of the new context.
.macro VM_BEGINTHREAD BANK, THREADPROC, HTHREAD, NARGS
        .db OP_VM_BEGINTHREAD, #<NARGS, #>HTHREAD, #<HTHREAD, #>THREADPROC, #<THREADPROC, #<BANK
.endm


OP_VM_IF           = 0x0F
.EQ                = 1
.LT                = 2
.LTE               = 3
.GT                = 4
.GTE               = 5
.NE                = 6
;-- Compares two variables using for condition.
; @param CONDITION Condition for test:
;   `.EQ`   - Variables are equal.
;   `.LT`   - A is lower than B.
;   `.LTE`  - A is lower or equal than B.
;   `.GT`   - A is greater than B.
;   `.GTE`  - A is greater or equal than B.
;   `.NE`   - A is not equal to B.
; @param IDXA A variable.
; @param IDXB B variable.
; @param LABEL Jump label when result is TRUE.
; @param N Number of values to be removed from stack after evaluating the condition.
.macro VM_IF CONDITION, IDXA, IDXB, LABEL, N
        .db OP_VM_IF, #<N, #>LABEL, #<LABEL, #>IDXB, #<IDXB, #>IDXA, #<IDXA, #<CONDITION
.endm

OP_VM_PUSH_VALUE_IND = 0x10
;-- Pushes a value on VM stack or a global indirectly from an index in the variable.
; @param IDX Variable that contains the index of the variable to be pushed on stack.
.macro VM_PUSH_VALUE_IND IDX
        .db OP_VM_PUSH_VALUE_IND, #>IDX, #<IDX
.endm

OP_VM_PUSH_VALUE   = 0x11
;-- Pushes a value of the variable onto stack.
; @param IDX Variable to be pushed.
.macro VM_PUSH_VALUE IDX
        .db OP_VM_PUSH_VALUE, #>IDX, #<IDX
.endm

OP_VM_RESERVE      = 0x12
;-- Reserves or disposes amount of values on stack.
; @param N Positive value - amount of variables to be reserved on stack, negative value - amount of variables to be popped from stack.
.macro VM_RESERVE N
        .db OP_VM_RESERVE, #<N
.endm

OP_VM_SET         = 0x13
;-- Assigns variable B to variable A.
; @param IDXA Variable A.
; @param IDXB Variable B.
.macro VM_SET IDXA, IDXB
        .db OP_VM_SET, #>IDXB, #<IDXB, #>IDXA, #<IDXA
.endm

OP_VM_SET_CONST   = 0x14
;-- Assigns immediate value to the variable.
; @param IDX Target variable.
; @param VAL Source immediate value.
.macro VM_SET_CONST IDX, VAL
        .db OP_VM_SET_CONST, #>VAL, #<VAL, #>IDX, #<IDX
.endm

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
.SHL               = 'L'
.SHR               = 'R'
.ABS               = '@'
.MIN               = 'm'
.MAX               = 'M'
.ISQRT             = 'Q'
.ATAN2             = 'T'
.RND               = 'r'
;.EQ                = 1
;.LT                = 2
;.LTE               = 3
;.GT                = 4
;.GTE               = 5
;.NE                = 6
.AND               = 7
.OR                = 8
.NOT               = 9
;-- Reverse Polish Notation (RPN) calculator, returns result(s) on the VM stack.
.macro VM_RPN
        .db OP_VM_RPN
.endm
.macro .R_INT8 ARG0
        .db -1
        .db #<ARG0
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
.macro .R_REF_SET ARG0
        .db -5
        .dw #ARG0
.endm
.macro .R_REF_SET_IND ARG0
        .db -6
        .dw #ARG0
.endm
.MEM_I8            = 'i'
.MEM_U8            = 'u'
.MEM_I16           = 'I'
.macro .R_REF_MEM TYP, ADDR
        .db -7
        .db #<TYP
        .dw #ADDR
.endm
.macro .R_REF_MEM_SET TYP, ADDR
        .db -8
        .db #<TYP
        .dw #ADDR
.endm
.macro .R_OPERATOR ARG0
        .db ARG0
.endm
.macro .R_STOP
        .db 0
.endm

OP_VM_JOIN       = 0x16
;-- Joins a thread.
; @param IDX Thread handle for joining.
.macro VM_JOIN IDX
        .db OP_VM_JOIN, #>IDX, #<IDX
.endm

OP_VM_TERMINATE  = 0x17
;-- Kills a thread.
; @param IDX Thread handle for killing.
.macro VM_TERMINATE IDX
        .db OP_VM_TERMINATE, #>IDX, #<IDX
.endm

OP_VM_IDLE      = 0x18
;-- Signals thread runner that context is in a waitable state.
.macro VM_IDLE
        .db OP_VM_IDLE
.endm

OP_VM_GET_TLOCAL= 0x19
;-- Gets thread local variable.
; @param IDXA Target variable.
; @param IDXB Thread local variable index.
.macro VM_GET_TLOCAL IDXA, IDXB
        .db OP_VM_GET_TLOCAL, #>IDXB, #<IDXB, #>IDXA, #<IDXA
.endm

OP_VM_IF_CONST  = 0x1A
;-- Compares a variable to an immediate value.
; @param CONDITION Condition for test:
;   `.EQ`   - Variables are equal.
;   `.LT`   - A is lower than B.
;   `.LTE`  - A is lower or equal than B.
;   `.GT`   - A is greater than B.
;   `.GTE`  - A is greater or equal than B.
;   `.NE`   - A is not equal to B.
; @param IDXA A variable.
; @param B Immediate value to be compared with.
; @param LABEL Jump label when result is TRUE.
; @param N Number of values to be removed from stack after evaluating the condition.
.macro VM_IF_CONST CONDITION, IDXA, B, LABEL, N
        .db OP_VM_IF_CONST, #<N, #>LABEL, #<LABEL, #>B, #<B, #>IDXA, #<IDXA, #<CONDITION
.endm

;-- Gets unsigned int8 from WRAM.
; @param IDXA Target variable.
; @param ADDR Address of the unsigned 8-bit value in WRAM.
.macro VM_GET_UINT8 IDXA, ADDR
        VM_RPN
            .R_REF_MEM .MEM_U8, ^!ADDR!
            .R_REF_SET ^!IDXA!
            .R_STOP
.endm

;-- Gets signed int8 from WRAM.
; @param IDXA Target variable.
; @param ADDR Address of the signed 8-bit value in WRAM.
.macro VM_GET_INT8 IDXA, ADDR
        VM_RPN
            .R_REF_MEM .MEM_I8, ^!ADDR!
            .R_REF_SET ^!IDXA!
            .R_STOP
.endm

;-- Gets signed int16 from WRAM.
; @param IDXA Target variable.
; @param ADDR Address of the signed 16-bit value in WRAM.
.macro VM_GET_INT16 IDXA, ADDR
        VM_RPN
            .R_REF_MEM .MEM_I16, ^!ADDR!
            .R_REF_SET ^!IDXA!
            .R_STOP
.endm

;-- Sets unsigned int8 in WRAM from variable.
; @param ADDR Address of the unsigned 8-bit value in WRAM.
; @param IDXA Source variable.
.macro VM_SET_UINT8 ADDR, IDXA
        VM_RPN
            .R_REF ^!IDXA!
            .R_REF_MEM_SET .MEM_U8, ^!ADDR!
            .R_STOP
.endm

;-- Sets signed int8 in WRAM from variable.
; @param ADDR Address of the signed 8-bit value in WRAM.
; @param IDXA Source variable.
.macro VM_SET_INT8 ADDR, IDXA
        VM_RPN
            .R_REF ^!IDXA!
            .R_REF_MEM_SET .MEM_I8, ^!ADDR!
            .R_STOP
.endm

;-- Sets signed int16 in WRAM from variable.
; @param ADDR Address of the signed 16-bit value in WRAM.
; @param IDXA Source variable.
.macro VM_SET_INT16 ADDR, IDXA
        VM_RPN
            .R_REF ^!IDXA!
            .R_REF_MEM_SET .MEM_I16, ^!ADDR!
            .R_STOP
.endm

;-- Sets signed int8 in WRAM to the immediate value.
; @param ADDR Address of the signed 8-bit value in WRAM.
; @param VAL Immediate value.
.macro VM_SET_CONST_INT8 ADDR, VAL
        VM_RPN
            .R_INT8 ^!VAL!
            .R_REF_MEM_SET .MEM_I8, ^!ADDR!
            .R_STOP
.endm

;-- Sets unsigned int8 in WRAM to the immediate value.
; @param ADDR Address of the unsigned 8-bit value in WRAM.
; @param VAL Immediate value.
.macro VM_SET_CONST_UINT8 ADDR, VAL
        VM_RPN
            .R_INT8 ^!VAL!
            .R_REF_MEM_SET .MEM_U8, ^!ADDR!
            .R_STOP
.endm

;-- Sets signed int16 in WRAM to the immediate value.
; @param ADDR Address of the signed 16-bit value in WRAM.
; @param VAL Immediate value.
.macro VM_SET_CONST_INT16 ADDR, VAL
        VM_RPN
            .R_INT16 ^!VAL!
            .R_REF_MEM_SET .MEM_I16, ^!ADDR!
            .R_STOP
.endm

OP_VM_INIT_RNG        = 0x23
;-- Initializes RNG seed with the value from the variable.
; @param IDX Seed value.
.macro VM_INIT_RNG IDX
        .db OP_VM_INIT_RNG, #>IDX, #<IDX
.endm

;-- Initializes RNG seed.
.macro VM_RANDOMIZE
        VM_RPN
            .R_REF_MEM .MEM_U8, _DIV_REG
            .R_REF_MEM .MEM_U8, _game_time
            .R_INT16    256
            .R_OPERATOR .MUL
            .R_OPERATOR .ADD
            .R_STOP
        VM_INIT_RNG     .ARG0
        VM_POP          1
.endm

OP_VM_RAND            = 0x24
;-- Returns random value between MIN and MIN + LIMIT.
; @param IDX Target variable.
; @param MIN Minimal random value.
; @param LIMIT Range of the random values.
.macro VM_RAND IDX, MIN, LIMIT
        .db OP_VM_RAND
        .db #>LIMIT, #<LIMIT, #>MIN, #<MIN, #>IDX, #<IDX
.endm

OP_VM_LOCK            = 0x25
;-- Disables switching of VM threads.
.macro VM_LOCK
        .db OP_VM_LOCK
.endm

OP_VM_UNLOCK          = 0x26
;-- Enables switching of VM threads.
.macro VM_UNLOCK
        .db OP_VM_UNLOCK
.endm

;-- Raises an exception.
; @param CODE Exception code:
;   `EXCEPTION_RESET`        - Resets the device.
;   `EXCEPTION_CHANGE_SCENE` - Changes to a new scene.
;   `EXCEPTION_SAVE`         - Saves the state of the game.
;   `EXCEPTION_LOAD`         - Loads the saved state of the game.
; @param SIZE Length of the parameters to be passed into the exception handler.
OP_VM_RAISE           = 0x27
.macro VM_RAISE CODE, SIZE
        .db OP_VM_RAISE, #<SIZE, #<CODE
.endm

OP_VM_SET_INDIRECT    = 0x28
;-- Assigns variable that is addressed indirectly to the other variable.
; @param IDXA Variable that contains the index of the target variable.
; @param IDXB Source variable that contains the value to be assigned.
.macro VM_SET_INDIRECT IDXA, IDXB
        .db OP_VM_SET_INDIRECT, #>IDXB, #<IDXB, #>IDXA, #<IDXA
.endm

OP_VM_GET_INDIRECT    = 0x29
;-- Assigns a variable to the value of variable that is addressed indirectly.
; @param IDXA Target variable.
; @param IDXB Variable that contains the index of the source variable.
.macro VM_GET_INDIRECT IDXA, IDXB
        .db OP_VM_GET_INDIRECT, #>IDXB, #<IDXB, #>IDXA, #<IDXA
.endm

OP_VM_TEST_TERMINATE  = 0x2A
.TEST_WAIT_VBL        = 1
;-- Terminates unit-testing immediately.
; @param FLAGS Terminate flags:
;   `.TEST_WAIT_VBL` - Wait for VBlank before terminating.
.macro VM_TEST_TERMINATE FLAGS
        .db OP_VM_TEST_TERMINATE, #<FLAGS
.endm

OP_VM_POLL_LOADED     = 0x2B
;-- Checks that VM state was restored and resets the restore flag.
; @param IDX Target result variable.
.macro VM_POLL_LOADED IDX
        .db OP_VM_POLL_LOADED, #>IDX, #<IDX
.endm

OP_VM_PUSH_REFERENCE  = 0x2C
;-- Translates IDX into absolute index and pushes result to VM stack.
; @param IDX Index of the variable.
.macro VM_PUSH_REFERENCE IDX
        .db OP_VM_PUSH_REFERENCE, #>IDX, #<IDX
.endm

OP_VM_CALL_NATIVE     = 0x2D
;-- Calls native code by the far pointer.
; @param BANK Bank number of the native routine.
; @param PTR Address of the native routine.
.macro VM_CALL_NATIVE BANK, PTR
        .db OP_VM_CALL_NATIVE, #>PTR, #<PTR, #<BANK
.endm

OP_VM_MEMSET          = 0x76
;-- Clears VM memory.
; @param DEST First variable to be cleared.
; @param VALUE Variable containing the value to be filled with.
; @param COUNT Number of variables to be filled.
.macro VM_MEMSET DEST, VALUE, COUNT
        .db OP_VM_MEMSET, #>COUNT, #<COUNT, #>VALUE, #<VALUE, #>DEST, #<DEST
.endm

OP_VM_MEMCPY          = 0x77
;-- Copies VM memory.
; @param DEST First destination variable.
; @param SOUR First source variable.
; @param COUNT Number of variables to be copied.
.macro VM_MEMCPY DEST, SOUR, COUNT
        .db OP_VM_MEMCPY, #>COUNT, #<COUNT, #>SOUR, #<SOUR, #>DEST, #<DEST
.endm

; --- engine-specific instructions ------------------------------------------

; --- LOAD/SAVE --------------------------------------
; @section Load and Save

.macro .SAVE_SLOT SLOT
        .db #<SLOT
.endm
OP_VM_SAVE_PEEK         = 0x2E
;-- Reads variables from a save slot.
; @param RES Result of the operation.
; @param DEST First destination variable to be read into.
; @param SOUR First source variable in the save slot.
; @param COUNT Number of variables to be read.
; @param SLOT Save slot number.
.macro VM_SAVE_PEEK RES, DEST, SOUR, COUNT, SLOT
        .db OP_VM_SAVE_PEEK, #<SLOT, #>COUNT, #<COUNT, #>SOUR, #<SOUR, #>DEST, #<DEST, #>RES, #<RES
.endm

OP_VM_SAVE_CLEAR         = 0x2F
;-- Erases data in save slot.
; @param SLOT Slot number.
.macro VM_SAVE_CLEAR SLOT
        .db OP_VM_SAVE_CLEAR, #<SLOT
.endm

; --- ACTOR ------------------------------------------
; @section Actor

OP_VM_ACTOR_MOVE_TO             = 0x30
.ACTOR_ATTR_H_FIRST             = 0x01
.ACTOR_ATTR_CHECK_COLL          = 0x02
.ACTOR_ATTR_DIAGONAL            = 0x04
;-- Moves actor to a new position.
; @param IDX points to the beginning of the pseudo-structure that contains these members:
;    `ID`   - Actor number.
;    `X`    - New X-coordinate of the actor.
;    `Y`    - New Y-coordinate of the actor.
;    `ATTR` - Bit flags:
;       `.ACTOR_ATTR_H_FIRST`    - Move horizontal first.
;       `.ACTOR_ATTR_CHECK_COLL` - Respect collisions.
;       `.ACTOR_ATTR_DIAGONAL`   - Allow diagonal movement
.macro VM_ACTOR_MOVE_TO IDX
        .db OP_VM_ACTOR_MOVE_TO, #>IDX, #<IDX
.endm

OP_VM_ACTOR_MOVE_CANCEL         = 0x88
;-- Cancels movement of actor.
; @param ACTOR Variable that contains the actor number.
.macro VM_ACTOR_MOVE_CANCEL ACTOR
        .db OP_VM_ACTOR_MOVE_CANCEL, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_ACTIVATE            = 0x31
;-- Activates actor.
; @param ACTOR Variable that contains the actor number.
.macro VM_ACTOR_ACTIVATE ACTOR
        .db OP_VM_ACTOR_ACTIVATE, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_DIR             = 0x32
.DIR_DOWN                       = 0
.DIR_RIGHT                      = 1
.DIR_UP                         = 2
.DIR_LEFT                       = 3
;-- Sets direction of actor.
; @param ACTOR Variable that contains the actor number.
; @param DIR One of these directions:
;   `.DIR_DOWN`   - Actor faces down.
;   `.DIR_RIGHT`  - Actor faces right.
;   `.DIR_UP`     - Actor faces up.
;   `.DIR_LEFT`   - Actor faces left.
.macro VM_ACTOR_SET_DIR ACTOR, DIR
        .db OP_VM_ACTOR_SET_DIR, #<DIR, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_DEACTIVATE          = 0x33
;-- Deactivates actor.
; @param ACTOR Variable that contains the actor number.
.macro VM_ACTOR_DEACTIVATE ACTOR
        .db OP_VM_ACTOR_DEACTIVATE, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_ANIM            = 0x34
;-- Sets actor animation.
; @param ACTOR Variable that contains the actor number.
; @param ANIM Animation number.
.macro VM_ACTOR_SET_ANIM ACTOR, ANIM
        .db OP_VM_ACTOR_SET_ANIM, #>ANIM, #<ANIM, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_POS             = 0x35
;-- Sets actor position.
; @param IDX points to the beginning of the pseudo-structure that contains these members:
;    `ID`   - Actor number.
;    `X`    - New X-coordinate of the actor.
;    `Y`    - New Y-coordinate of the actor.
.macro VM_ACTOR_SET_POS IDX
        .db OP_VM_ACTOR_SET_POS, #>IDX, #<IDX
.endm

OP_VM_ACTOR_EMOTE               = 0x36
;-- Sets actor emotion.
; @param ACTOR Variable that contains the actor number.
; @param AVATAR_BANK Bank of the avatar image.
; @param AVATAR Address of the avatar image.
.macro VM_ACTOR_EMOTE ACTOR, AVATAR_BANK, AVATAR
        .db OP_VM_ACTOR_EMOTE, #>AVATAR, #<AVATAR, #<AVATAR_BANK, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_BOUNDS          = 0x37
;-- Sets actor bounding box.
; @param ACTOR Variable that contains the actor number.
; @param LEFT Left boundary of the bounding box.
; @param RIGHT Right boundary of the bounding box.
; @param TOP Top boundary of the bounding box.
; @param BOTTOM Bottom boundary of the bounding box.
.macro VM_ACTOR_SET_BOUNDS ACTOR, LEFT, RIGHT, TOP, BOTTOM
        .db OP_VM_ACTOR_SET_BOUNDS, #<BOTTOM, #<TOP, #<RIGHT, #<LEFT, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_SPRITESHEET     = 0x38
;-- Sets actor spritesheet.
; @param ACTOR Variable that contains the actor number.
; @param SHEET_BANK Bank of the sprite sheet.
; @param SHEET Address of the sprite sheet.
.macro VM_ACTOR_SET_SPRITESHEET ACTOR, SHEET_BANK, SHEET
        .db OP_VM_ACTOR_SET_SPRITESHEET, #>SHEET, #<SHEET, #<SHEET_BANK, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_SPRITESHEET_BY_REF     = 0x87
;-- Sets actor spritesheet using far pointer in variables.
; @param ACTOR Variable that contains the actor number
; @param FAR_PTR points to the pseudo-struct that contains the address of the sprite sheet:
;   `BANK` - Bank of the sprite sheet
;   `DATA` - Address of the sprite sheet
.macro VM_ACTOR_SET_SPRITESHEET_BY_REF ACTOR, FAR_PTR
        .db OP_VM_ACTOR_SET_SPRITESHEET_BY_REF, #>FAR_PTR, #<FAR_PTR, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_REPLACE_TILE        = 0x39
;-- Replaces tile in the actor spritesheet.
; @param ACTOR Variable that contains the actor number.
; @param TARGET_TILE Tile number for replacement.
; @param TILEDATA_BANK Bank of the tile data.
; @param TILEDATA Address of the tile data.
; @param START Start tile in the tile data array.
; @param LEN Amount of tiles to be replaced.
.macro VM_ACTOR_REPLACE_TILE ACTOR, TARGET_TILE, TILEDATA_BANK, TILEDATA, START, LEN
        .db OP_VM_ACTOR_REPLACE_TILE, #<LEN, #<START, #>TILEDATA, #<TILEDATA, #<TILEDATA_BANK, #<TARGET_TILE, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_GET_POS             = 0x3A
;-- Gets actor position.
; @param IDX points to the beginning of the pseudo-structure that contains these members:
;    `ID`   - Actor number.
;    `X`    - X-coordinate of the actor.
;    `Y`    - Y-coordinate of the actor.
.macro VM_ACTOR_GET_POS IDX
        .db OP_VM_ACTOR_GET_POS, #>IDX, #<IDX
.endm

OP_VM_ACTOR_GET_DIR             = 0x3C
;-- Gets actor direction.
; @param IDX Variable that contains the actor number.
; @param DEST Target variable that receive the actor direction.
.macro VM_ACTOR_GET_DIR IDX, DEST
        .db OP_VM_ACTOR_GET_DIR, #>DEST, #<DEST, #>IDX, #<IDX
.endm

OP_VM_ACTOR_GET_ANGLE           = 0x86
;-- Gets actor angle.
; @param IDX Variable that contains the actor number.
; @param DEST Target variable to receive the actor angle.
.macro VM_ACTOR_GET_ANGLE IDX, DEST
        .db OP_VM_ACTOR_GET_ANGLE, #>DEST, #<DEST, #>IDX, #<IDX
.endm

OP_VM_ACTOR_SET_ANIM_TICK       = 0x3D
;-- Sets actor animation tick.
; @param ACTOR Variable that contains the actor number.
; @param TICK Animation tick.
.macro VM_ACTOR_SET_ANIM_TICK ACTOR, TICK
        .db OP_VM_ACTOR_SET_ANIM_TICK, #<TICK, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_MOVE_SPEED      = 0x3E
;-- Sets actor move speed.
; @param ACTOR Variable that contains the actor number.
; @param SPEED Actor move speed.
.macro VM_ACTOR_SET_MOVE_SPEED ACTOR, SPEED
        .db OP_VM_ACTOR_SET_MOVE_SPEED, #<SPEED, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_FLAGS           = 0x3F
.ACTOR_FLAG_PINNED              = 0x01
.ACTOR_FLAG_HIDDEN              = 0x02
.ACTOR_FLAG_ANIM_NOLOOP         = 0x04
.ACTOR_FLAG_COLLISION           = 0x08
.ACTOR_FLAG_PERSISTENT          = 0x10
;-- Sets actor flags.
; @param ACTOR Variable that contains the actor number.
; @param FLAGS Bit values to be set or cleared:
;   `.ACTOR_FLAG_PINNED`      - Pin/unpin the actor.
;   `.ACTOR_FLAG_HIDDEN`      - Hide/show actor.
;   `.ACTOR_FLAG_ANIM_NOLOOP` - Disable animation loop.
;   `.ACTOR_FLAG_COLLISION`   - Disable/enable collision.
;   `.ACTOR_FLAG_PERSISTENT`  - Set persistent actor flag.
; @param MASK Bit mask of values to be set or cleared.
.macro VM_ACTOR_SET_FLAGS ACTOR, FLAGS, MASK
        .db OP_VM_ACTOR_SET_FLAGS, #<MASK, #<FLAGS, #>ACTOR, #<ACTOR
.endm

.ACTOR_VISIBLE                  = 0
.ACTOR_HIDDEN                   = 1
;-- Hides or shows actor.
; @param ACTOR Variable that contains the actor number.
; @param HIDDEN `.ACTOR_VISIBLE` shows actor, `.ACTOR_HIDDEN` hides actor.
.macro VM_ACTOR_SET_HIDDEN ACTOR, HIDDEN
        VM_ACTOR_SET_FLAGS ACTOR, ^/(HIDDEN << 1)/, .ACTOR_FLAG_HIDDEN
.endm

.ACTOR_COLLISION_DISABLED       = 0
.ACTOR_COLLISION_ENABLED        = 1
;-- Enables or disables actor collisions.
; @param ACTOR Variable that contains the actor number.
; @param ENABLED `.ACTOR_COLLISION_DISABLED` disables actor collision, `.ACTOR_COLLISION_ENABLED` enables actor collision.
.macro VM_ACTOR_SET_COLL_ENABLED ACTOR, ENABLED
        VM_ACTOR_SET_FLAGS ACTOR, ^/(ENABLED << 3)/, .ACTOR_FLAG_COLLISION
.endm

OP_VM_ACTOR_BEGIN_UPDATE        = 0x8E
;-- Begins actor update script.
; @param ACTOR Variable that contains the actor number.
.macro VM_ACTOR_BEGIN_UPDATE ACTOR
        .db OP_VM_ACTOR_BEGIN_UPDATE, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_TERMINATE_UPDATE    = 0x74
;-- Terminates actor update script.
; @param ACTOR Variable that contains the actor number.
.macro VM_ACTOR_TERMINATE_UPDATE ACTOR
        .db OP_VM_ACTOR_TERMINATE_UPDATE, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_ANIM_FRAME      = 0x75
;-- Sets actor animation frame.
; @param ACTOR Pseudo-struct that contains these members:
;    `ID`    - Actor number.
;    `FRAME` - Animation frame.
.macro VM_ACTOR_SET_ANIM_FRAME ACTOR
        .db OP_VM_ACTOR_SET_ANIM_FRAME, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_GET_ANIM_FRAME      = 0x83
;-- Gets actor animation frame.
; @param ACTOR Pseudo-struct that contains these members:
;    `ID`    - Actor number.
;    `FRAME` - Animation frame.
.macro VM_ACTOR_GET_ANIM_FRAME ACTOR
        .db OP_VM_ACTOR_GET_ANIM_FRAME, #>ACTOR, #<ACTOR
.endm

OP_VM_ACTOR_SET_ANIM_SET        = 0x84
;-- Sets actor animation set.
; @param ACTOR Variable that contains the actor number.
; @param OFFSET Animation set number.
.macro VM_ACTOR_SET_ANIM_SET ACTOR, OFFSET
        .db OP_VM_ACTOR_SET_ANIM_SET, #>OFFSET, #<OFFSET, #>ACTOR, #<ACTOR
.endm

; --- UI ------------------------------------------
; @section UI

;-- Loads text in memory.
; @param NARGS Amount of arguments that are passed before the null-terminated string.
;
; The text string is defined using the `.asciz` command:
;
; ```
; VM_LOAD_TEXT   0
;   .asciz "text to render"
; ```
;
; #### Displaying variables:
; The following format specifiers allow variables to be rendered as part of the text:
; * `%d`  Render a variable value.
; * `%Dn` Render a variable value with `n` length.
; * `%c`  Render a character based on the variable value.

; The variables need to be defined before the `.asciz` call using `.dw` followed by a list of `N` variables in the order they'll be rendered.

; ```
; VM_LOAD_TEXT   3
;   .dw VAR_0, VAR_1, VAR_1
;   .asciz "Var 0 is %d, Var 1 is %d, Var 2 is %d"
; ```

; #### Escape Sequences:

; The text string can contain escape sequences that modify the behavior or appearance of the text.

; * `\001\x` Sets the text speed for the next characters in the current text. `x` is a value between `1` and `8` that represents the number of frames between the render of a character using `2^(x-2)`.
; * `\002\x` Sets the text font.
; * `\003\x\y` Sets the position for the next character.
; * `\004\x\y` Sets the position for the next character relative to the last character.
; * `\005` Escapes the next character.
; * `\006\mask` Waits for input to continue to the next character.
; * `\007\n` Inverts the colors of the following characters. `\007\002` enables inverted colors, `\007\001` disables them.
; * `\010\x` Switches between left to right (`x` = `01`) and right to left (`x` = `02`) printing.
; * `\011` Zero width symbol.
; * `\n` Next line.
; * `\013\x` Sets UI palette number to `x`.
; * `\r` Scrolls text one line up.
OP_VM_LOAD_TEXT         = 0x40
.macro VM_LOAD_TEXT NARGS
        .db OP_VM_LOAD_TEXT, #<NARGS
.endm

OP_VM_DISPLAY_TEXT      = 0x41
.DISPLAY_DEFAULT        = 0
.DISPLAY_PRESERVE_POS   = 1
.TEXT_TILE_CONTINUE     = 0xFF
;-- Renders text in the defined layer (overlay by default).
; @param OPTIONS Text rendering options:
;   `.DISPLAY_DEFAULT`      - Default behavior.
;   `.DISPLAY_PRESERVE_POS` - Preserve text position.
; @param START_TILE Tile number within the text rendering area to be rendered from; use .TEXT_TILE_CONTINUE to proceed from the current position.
.macro VM_DISPLAY_TEXT_EX OPTIONS, START_TILE
        .db OP_VM_DISPLAY_TEXT, #<START_TILE, #<OPTIONS
.endm
;-- Renders text in the defined layer (obsolete).
.macro VM_DISPLAY_TEXT
        VM_DISPLAY_TEXT_EX .DISPLAY_DEFAULT, .TEXT_TILE_CONTINUE
.endm

OP_VM_SWITCH_TEXT_LAYER = 0x85
.TEXT_LAYER_BKG         = 0
.TEXT_LAYER_WIN         = 1
;-- Changes the `LAYER` where text will be rendered.
; @param LAYER
;   `.TEXT_LAYER_BKG`    - Render text in the background layer.
;   `.TEXT_LAYER_WIN`    - Render text in the overlay layer.
.macro VM_SWITCH_TEXT_LAYER LAYER
        .db OP_VM_SWITCH_TEXT_LAYER, #<LAYER
.endm

OP_VM_OVERLAY_SETPOS    = 0x42
;-- Sets position of the overlay window in tiles.
; @param X X-coordinate of the overlay window in tiles.
; @param Y Y-coordinate of the overlay window in tiles.
.macro VM_OVERLAY_SETPOS X, Y
        .db OP_VM_OVERLAY_SETPOS, #<Y, #<X
.endm

.MENU_CLOSED_Y          = 0x12
;-- Hides the overlay window.
.macro VM_OVERLAY_HIDE
        VM_OVERLAY_SETPOS 0, .MENU_CLOSED_Y
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
;-- Waits for the completion of one or more UI operations.
; @param IS_MODAL Indicates whether the operation is modal: .UI_MODAL, or not: .UI_NONMODAL.
; @param WAIT_FLAGS Bit field, set of events to be waited for:
;   `.UI_WAIT_NONE`     - No wait.
;   `.UI_WAIT_WINDOW`   - Wait until the window moved to its final position.
;   `.UI_WAIT_TEXT`     - Wait until all the text finished rendering.
;   `.UI_WAIT_BTN_A`    - Wait until "A" is pressed.
;   `.UI_WAIT_BTN_B`    - Wait until "B" is pressed.
;   `.UI_WAIT_BTN_ANY`  - Wait until any button is pressed.
.macro VM_OVERLAY_WAIT IS_MODAL, WAIT_FLAGS
        .db OP_VM_OVERLAY_WAIT, #<WAIT_FLAGS, #<IS_MODAL
.endm

OP_VM_OVERLAY_MOVE_TO   = 0x45
.OVERLAY_IN_SPEED       = -1
.OVERLAY_TEXT_IN_SPEED  = -1    ; obsolete
.OVERLAY_OUT_SPEED      = -2
.OVERLAY_TEXT_OUT_SPEED = -2    ; obsolete
.OVERLAY_SPEED_INSTANT  = -3
;-- Triggers animated movement of the overlay window to a new position.
; @param X X-coordinate of the new position.
; @param Y Y-coordinate of the new position.
; @param SPEED speed of the movement:
;   `.OVERLAY_IN_SPEED`       - Default speed for appearing of the overlay.
;   `.OVERLAY_OUT_SPEED`      - Default speed for disappearing of the overlay.
;   `.OVERLAY_SPEED_INSTANT`  - Instant movement.
.macro VM_OVERLAY_MOVE_TO X, Y, SPEED
        .db OP_VM_OVERLAY_MOVE_TO, #<SPEED, #<Y, #<X
.endm

OP_VM_OVERLAY_SHOW      = 0x46
.UI_COLOR_BLACK         = 0
.UI_COLOR_WHITE         = 1
.UI_DRAW_FRAME          = 1
.UI_AUTO_SCROLL         = 2
;-- Shows the overlay window.
; @param X X-coordinate of the new position.
; @param Y Y-coordinate of the new position.
; @param COLOR Initial color of the overlay window:
;   `.UI_COLOR_BLACK`     - Black overlay window.
;   `.UI_COLOR_WHITE`     - White overlay window.
; @param OPTIONS Display options:
;   `.UI_DRAW_FRAME`      - Draw overlay frame.
;   `.UI_AUTO_SCROLL`     - Set automatic text scroll area; text will be scrolled up when printing more lines than the overlay height.
.macro VM_OVERLAY_SHOW X, Y, COLOR, OPTIONS
        .db OP_VM_OVERLAY_SHOW, #<OPTIONS, #<COLOR, #<Y, #<X
.endm

OP_VM_OVERLAY_CLEAR     = 0x47
;-- Clears a rectangular area of the overlay window.
; @param X X-coordinate in tiles of the upper left corner.
; @param Y Y-coordinate in tiles of the upper left corner.
; @param W Width in tiles of the rectangle area.
; @param H Height in tiles of the rectangle area.
; @param COLOR initial color of the overlay window:
;   `.UI_COLOR_BLACK`     - Black overlay window.
;   `.UI_COLOR_WHITE`     - White overlay window.
; @param OPTIONS Display options:
;   `.UI_DRAW_FRAME`      - Draw overlay frame.
;   `.UI_AUTO_SCROLL`     - Set automatic text scroll area; text will be scrolled up when printing more lines than the overlay height.
.macro VM_OVERLAY_CLEAR X, Y, W, H, COLOR, OPTIONS
        .db OP_VM_OVERLAY_CLEAR, #<OPTIONS, #<COLOR, #<H, #<W, #<Y, #<X
.endm

OP_VM_CHOICE            = 0x48
.UI_MENU_STANDARD       = 0
.UI_MENU_LAST_0         = 1
.UI_MENU_CANCEL_B       = 2
.UI_MENU_SET_START      = 4
.macro .MENUITEM X, Y, iL, iR, iU, iD
        .db #<X, #<Y, #<iL, #<iR, #<iU, #<iD
.endm
;-- Executes menu.
; @param IDX Variable that receives the result of the menu execution.
; @param OPTIONS Bit field, set of the possible menu options:
;   `.UI_MENU_STANDARD`    - Default menu behavior.
;   `.UI_MENU_LAST_0`      - Last item returns result of 0
;   `.UI_MENU_CANCEL_B`    - B button cancels the menu execution.
;   `.UI_MENU_SET_START`   - If set IDX may contain the initial item index.
; @param COUNT Number of menu items.
;
; Instruction must be followed by the COUNT of .MENUITEM definitions:
; .MENUITEM X, Y, iL, iR, iU, iD
; where:
;   `X` - X-coordinate of the cursor pointer in tiles.
;   `Y` - Y-coordinate of the cursor pointer in tiles.
;   `iL` - Menu item number where the cursor must move when you press LEFT.
;   `iR` - Menu item number where the cursor must move when you press RIGHT.
;   `iU` - Menu item number where the cursor must move when you press UP.
;   `iD` - Menu item number where the cursor must move when you press DOWN.
.macro VM_CHOICE IDX, OPTIONS, COUNT
        .db OP_VM_CHOICE, #<COUNT, #<OPTIONS, #>IDX, #<IDX
.endm

OP_VM_SET_FONT          = 0x4B
;-- Sets active font.
; @param FONT_INDEX The index of the font to be activated.
.macro VM_SET_FONT FONT_INDEX
        .db OP_VM_SET_FONT, #<FONT_INDEX
.endm

.UI_PRINT_LEFTTORIGHT   = 0
.UI_PRINT_RIGHTTOLEFT   = 1
;-- Sets print direction.
; @param DIRECTION Direction of the text rendering:
;   `.UI_PRINT_LEFTTORIGHT`  - Text is rendered from left to right (left justify).
;   `.UI_PRINT_RIGHTTOLEFT`  - Text is rendered from right to left (right justify).
.macro VM_SET_PRINT_DIR DIRECTION
        VM_SET_CONST_UINT8 _vwf_direction, ^/DIRECTION & 1/
.endm

OP_VM_OVERLAY_SET_SUBMAP_EX = 0x4C
;-- Copies rectangular area of the background map onto the overlay window.
; @param PARAMS_IDX Points to the beginning of the pseudo-structure that contains these members:
;    `x`       - X-coordinate within the overlay window in tiles.
;    `y`       - Y-coordinate within the overlay window in tiles.
;    `w`       - Width of the copied area in tiles.
;    `h`       - Height of the copied area in tiles.
;    `scene_x` - X-Coordinate within the background map in tiles.
;    `scene_y` - Y-Coordinate within the background map in tiles.
.macro VM_OVERLAY_SET_SUBMAP_EX PARAMS_IDX
        .db OP_VM_OVERLAY_SET_SUBMAP_EX, #>PARAMS_IDX, #<PARAMS_IDX
.endm

OP_VM_OVERLAY_SCROLL    = 0x4D
;-- Scrolls a rectangular area of the overlay window.
; @param X X-coordinate of the upper left corner in tiles.
; @param Y Y-coordinate of the upper left corner in tiles.
; @param W Width of the area in tiles.
; @param H Height of the area in tiles.
; @param COLOR Color of the empty row of tiles that appear at the bottom of the scroll area.
.macro VM_OVERLAY_SCROLL X, Y, W, H, COLOR
        .db OP_VM_OVERLAY_SCROLL, #<COLOR, #<H, #<W, #<Y, #<X
.endm

OP_VM_OVERLAY_SET_SCROLL = 0x4E
;-- Defines the scroll area for the overlay. When the text overflows that area, it scrolls up by 1 row.
; @param X X-coordinate of the upper left corner in tiles.
; @param Y Y-coordinate of the upper left corner in tiles.
; @param W Width of the area in tiles.
; @param H Height of the area in tiles.
; @param COLOR Color of the empty row of tiles that appear at the bottom of the scroll area.
.macro VM_OVERLAY_SET_SCROLL X, Y, W, H, COLOR
        .db OP_VM_OVERLAY_SET_SCROLL, #<COLOR, #<H, #<W, #<Y, #<X
.endm

OP_VM_OVERLAY_SET_SUBMAP = 0x4F
;-- Copies a rectangular area of tiles from the scene background to the overlay window.
; @param X X-coordinate within the overlay window of the upper left corner in tiles.
; @param Y Y-coordinate within the overlay window of the upper left corner in tiles.
; @param W Width of the area in tiles.
; @param H Height of the area in tiles.
; @param SX X-coordinate within the level background map.
; @param SY Y-coordinate within the level background map.
.macro VM_OVERLAY_SET_SUBMAP X, Y, W, H, SX, SY
        .db OP_VM_OVERLAY_SET_SUBMAP, #<SY, #<SX, #<H, #<W, #<Y, #<X
.endm

; --- GAMEBOY ------------------------------------------
; @section Game Boy

; Loads a new tileset into the background VRAM tiles starting at a given tile id (`IDX`).
OP_VM_LOAD_TILESET      = 0x50
.macro VM_LOAD_TILESET IDX, BANK, BKG
        .db OP_VM_LOAD_TILESET, #>BKG, #<BKG, #<BANK, #>IDX, #<IDX
.endm

OP_VM_SET_SPRITE_VISIBLE = 0x51
.SPRITES_SHOW           = 0
.SPRITES_HIDE           = 1
;-- Sets visibility of sprite layer. Has priority over VM_ACTOR_SET_HIDDEN.
; @param MODE Mode:
;   `.SPRITES_SHOW` - Show sprite layer.
;   `.SPRITES_HIDE` - Hide sprite layer.
.macro VM_SET_SPRITE_VISIBLE MODE
        .db OP_VM_SET_SPRITE_VISIBLE, #<MODE
.endm

;-- Macro for SET_SPRITES_VISIBLE .SPRITES_SHOW.
.macro VM_SHOW_SPRITES
        VM_SET_SPRITE_VISIBLE .SPRITES_SHOW
.endm
;-- Macro for SET_SPRITES_VISIBLE .SPRITES_HIDE.
.macro VM_HIDE_SPRITES
        VM_SET_SPRITE_VISIBLE .SPRITES_HIDE
.endm

OP_VM_INPUT_WAIT        = 0x52
;-- Waits to receive an input.
; @param MASK Input mask.
.macro VM_INPUT_WAIT MASK
        .db OP_VM_INPUT_WAIT, #<MASK
.endm

OP_VM_INPUT_ATTACH      = 0x53
.OVERRIDE_DEFAULT       = 0x80
;-- Attaches a script to an input.
; @param MASK Input mask.
; @param SLOT Slot containing script to attach.
.macro VM_INPUT_ATTACH MASK, SLOT
        .db OP_VM_INPUT_ATTACH, #<SLOT, #<MASK
.endm

OP_VM_INPUT_GET         = 0x54
.JOY0                   = 0
.JOY1                   = 1
.JOY2                   = 2
.JOY3                   = 3
;-- Gets input from joypad. Up to 4 joypads are supported when using SGB.
; @param IDX Target variable that receives result.
; @param JOYID Joypad to get input from:
;   `.JOY0` - Joypad 0.
;   `.JOY1` - Joypad 1.
;   `.JOY2` - Joypad 2.
;   `.JOY3` - Joypad 3.
.macro VM_INPUT_GET IDX, JOYID
        .db OP_VM_INPUT_GET, #<JOYID, #>IDX, #<IDX
.endm

OP_VM_CONTEXT_PREPARE   = 0x55
;-- Assigns a script to a slot for VM_INPUT_ATTACH.
; @param SLOT Slot to assign to.
; @param BANK Bank number of the script.
; @param ADDR Address of the script.
.macro VM_CONTEXT_PREPARE SLOT, BANK, ADDR
        .db OP_VM_CONTEXT_PREPARE, #>ADDR, #<ADDR, #<BANK, #<SLOT
.endm

OP_VM_OVERLAY_SET_MAP   = 0x56
;-- Copies a tilemap starting at a given tile ID (`IDX`) to the overlay at a position.
; @param IDX Tile ID where tilemap starts.
; @param X_IDX X position on the overlay.
; @param Y_IDX Y position on the overlay.
; @param BANK Bank number of tilemap.
; @param BKG Tilemap.
.macro VM_OVERLAY_SET_MAP IDX, X_IDX, Y_IDX, BANK, BKG
        .db OP_VM_OVERLAY_SET_MAP, #>BKG, #<BKG, #<BANK, #>Y_IDX, #<Y_IDX, #>X_IDX, #<X_IDX, #>IDX, #<IDX
.endm

; ------------------------------------------------------
; @section Screen Fade

OP_VM_FADE              = 0x57
.FADE_NONMODAL          = 0x00
.FADE_MODAL             = 0x01
.FADE_OUT               = 0x00
.FADE_IN                = 0x02
;-- Fades screen in or out.
; @param FLAGS Options for screen fade:
;   `.FADE_NONMODAL` - Nonmodal fade.
;   `.FADE_MODAL`    - Modal fade.
;   `.FADE_OUT`      - Fade out.
;   `.FADE_IN`       - Fade in.
.macro VM_FADE FLAGS
        .db OP_VM_FADE, #<FLAGS
.endm

;-- Fades screen in. Macro for VM_FADE ^/(.FADE_IN)/ or VM_FADE ^/(.FADE_IN | .FADE_MODAL)/.
; @param IS_MODAL
;   `0` - Nonmodal fade.
;   `1` - Modal fade.
.macro VM_FADE_IN IS_MODAL
        .if IS_MODAL
                VM_FADE ^/(.FADE_IN | .FADE_MODAL)/
        .else
                VM_FADE ^/(.FADE_IN)/
        .endif
.endm
;-- Fades screen out. Macro for VM_FADE ^/(.FADE_OUT)/ or VM_FADE ^/(.FADE_OUT | .FADE_MODAL)/.
; @param IS_MODAL
;   `0` - Nonmodal fade.
;   `1` - Modal fade.
.macro VM_FADE_OUT IS_MODAL
        .if IS_MODAL
                VM_FADE ^/(.FADE_OUT | .FADE_MODAL)/
        .else
                VM_FADE ^/(.FADE_OUT)/
        .endif
.endm

; ------------------------------------------------------
; @section Timer

; Loads script into timer context.
OP_VM_TIMER_PREPARE     = 0x58
.macro VM_TIMER_PREPARE TIMER, BANK, ADDR
        .db OP_VM_TIMER_PREPARE, #>ADDR, #<ADDR, #<BANK, #<TIMER
.endm

; Starts a timer calling once every `INTERVAL` * 16 frames.
OP_VM_TIMER_SET         = 0x59
.macro VM_TIMER_SET TIMER, INTERVAL
        .db OP_VM_TIMER_SET, #<INTERVAL, #<TIMER
.endm

; Stops a timer.
OP_VM_TIMER_STOP         = 0x72
.macro VM_TIMER_STOP TIMER
        .db OP_VM_TIMER_STOP, #<TIMER
.endm

; Resets a timer countdown to 0.
OP_VM_TIMER_RESET         = 0x73
.macro VM_TIMER_RESET TIMER
        .db OP_VM_TIMER_RESET, #<TIMER
.endm

; ------------------------------------------------------
; @section Game Boy

OP_VM_GET_TILE_XY       = 0x5A
;-- Gets the tile ID of background tile at a position.
; @param TILE_IDX Target variable that receives the tile ID.
; @param X_IDX X position of background tile.
; @param Y_IDX Y position of background tile.
.macro VM_GET_TILE_XY TILE_IDX, X_IDX, Y_IDX
        .db OP_VM_GET_TILE_XY, #>Y_IDX, #<Y_IDX, #>X_IDX, #<X_IDX, #>TILE_IDX, #<TILE_IDX
.endm

OP_VM_REPLACE_TILE      = 0x5B
.FRAME_TILE_ID          = 0xC0
.FRAME_LENGTH           = 9
.CURSOR_TILE_ID         = 0xCB
.CURSOR_LENGTH          = 1
;-- Replaces one or more background tiles with background tiles from a tileset.
; @param TARGET_TILE_IDX Tile ID of starting old tile.
; @param TILEDATA_BANK Bank number of tileset containing new tiles.
; @param TILEDATA Tileset containing new tiles.
; @param START_IDX Tile ID of starting new tile.
; @param LEN Number of tiles to replace.
.macro VM_REPLACE_TILE TARGET_TILE_IDX, TILEDATA_BANK, TILEDATA, START_IDX, LEN
        .db OP_VM_REPLACE_TILE, #<LEN, #>START_IDX, #<START_IDX, #>TILEDATA, #<TILEDATA, #<TILEDATA_BANK, #>TARGET_TILE_IDX, #<TARGET_TILE_IDX
.endm

OP_VM_POLL              = 0x5C
.POLL_EVENT_INPUT       = 0x01
.POLL_EVENT_MUSIC       = 0x02
;-- Waits for an input event, music routine event or both.
; @param IDX_EVENT Target variable that receives event flag (either 1 for input or 2 for music routine).
; @param IDX_VALUE Target variable that receives the value of the event.
; @param MASK Which event(s) to wait for:
;   `.POLL_EVENT_INPUT` - Wait for input event.
;   `.POLL_EVENT_MUSIC` - Wait for music routine event.
.macro VM_POLL IDX_EVENT, IDX_VALUE, MASK
        .db OP_VM_POLL, #<MASK, #>IDX_VALUE, #<IDX_VALUE, #>IDX_EVENT, #<IDX_EVENT
.endm

OP_VM_SET_SPRITE_MODE   = 0x5D
.MODE_8X8               = 0
.MODE_8X16              = 1
;-- Sets sprite mode.
; @param MODE Sprite mode to set:
;   `.MODE_8X8`  - 8*8 sprites
;   `.MODE_8X16` - 8*16 sprites
.macro VM_SET_SPRITE_MODE MODE
        .db OP_VM_SET_SPRITE_MODE, #<MODE
.endm

OP_VM_REPLACE_TILE_XY   = 0x5E
;-- Replaces a single background tile at a position with a background tile from a tileset.
; @param X X position of old background tile.
; @param Y Y position of old background tile.
; @param TILEDATA_BANK Bank number of tileset containing new tile.
; @param TILEDATA Tileset containing new tile.
; @param START_IDX Tile ID of new tile.
.macro VM_REPLACE_TILE_XY X, Y, TILEDATA_BANK, TILEDATA, START_IDX
        .db OP_VM_REPLACE_TILE_XY, #>START_IDX, #<START_IDX, #>TILEDATA, #<TILEDATA, #<TILEDATA_BANK, #<Y, #<X
.endm

OP_VM_INPUT_DETACH      = 0x5F
;-- Removes an attached script from an input.
; @param MASK Input mask
.macro VM_INPUT_DETACH MASK
        .db OP_VM_INPUT_DETACH, #<MASK
.endm

; --- MUSIC AND SOUND -------------------------------
; @section Music and Sound

OP_VM_MUSIC_PLAY        = 0x60
.MUSIC_NO_LOOP          = 0
.MUSIC_LOOP             = 1
;-- Starts playing of music track.
; @param BANK Bank number of the track.
; @param ADDR Address of the track.
; @param LOOP Obsolete, has no effect.
.macro VM_MUSIC_PLAY TRACK_BANK, TRACK, LOOP
        .db OP_VM_MUSIC_PLAY, #>TRACK, #<TRACK, #<TRACK_BANK
.endm

OP_VM_MUSIC_STOP        = 0x61
;-- Stops playing of music track.
.macro VM_MUSIC_STOP
        .db OP_VM_MUSIC_STOP
.endm

OP_VM_MUSIC_MUTE        = 0x62
;-- Mutes/unmutes music channels.
; @param MASK Mute Mask. The 4 lower bits represent the 4 audio channels.
;
; | `MASK`   | Channel 1 | Channel 2 | Channel 3 | Channel 4 |
; | -------- | --------- | --------- | --------- | --------- |
; | `0b0000` | Muted     | Muted     | Muted     | Muted     |
; | `0b0001` | Muted     | Muted     | Muted     | Not Muted |
; | `0b0010` | Muted     | Muted     | Not Muted | Muted     |
; | `0b0011` | Muted     | Muted     | Not Muted | Not Muted |
; | `0b0100` | Muted     | Not Muted | Muted     | Muted     |
; | `0b0101` | Muted     | Not Muted | Muted     | Not Muted |
; | `0b0110` | Muted     | Not Muted | Not Muted | Muted     |
; | `0b0111` | Muted     | Not Muted | Not Muted | Not Muted |
; | `0b1000` | Not Muted | Muted     | Muted     | Muted     |
; | `0b1001` | Not Muted | Muted     | Muted     | Not Muted |
; | `0b1010` | Not Muted | Muted     | Not Muted | Muted     |
; | `0b1011` | Not Muted | Muted     | Not Muted | Not Muted |
; | `0b1100` | Not Muted | Not Muted | Muted     | Muted     |
; | `0b1101` | Not Muted | Not Muted | Muted     | Not Muted |
; | `0b1110` | Not Muted | Not Muted | Not Muted | Muted     |
; | `0b1111` | Not Muted | Not Muted | Not Muted | Not Muted |
.macro VM_MUSIC_MUTE MASK
        .db OP_VM_MUSIC_MUTE, #<MASK
.endm

OP_VM_SOUND_MASTERVOL   = 0x63
;-- Sets master volume.
; @param VOL The volume value.
.macro VM_SOUND_MASTERVOL VOL
        .db OP_VM_SOUND_MASTERVOL, #<VOL
.endm

OP_VM_MUSIC_ROUTINE     = 0x65
;-- Attaches script to music event.
; @param ROUTINE The routine ID. An integer between 0 and 3.
; @param BANK Bank number of the routine.
; @param ADDR Address of the routine.
.macro VM_MUSIC_ROUTINE ROUTINE, BANK, ADDR
        .db OP_VM_MUSIC_ROUTINE, #>ADDR, #<ADDR, #<BANK, #<ROUTINE
.endm

OP_VM_SFX_PLAY          = 0x66
.SFX_PRIORITY_MINIMAL   = 0
.SFX_PRIORITY_NORMAL    = 4
.SFX_PRIORITY_HIGH      = 8
;-- Plays a sound effect asset.
; @param BANK Bank number of the effect.
; @param ADDR Address of the effect.
; @param MASK Mute mask of the effect.
; @param PRIO Priority of the sound effect. Effects with higher priority will cancel the ones with less priority:
;   `.SFX_PRIORITY_MINIMAL` - Minmium priority for playback.
;   `.SFX_PRIORITY_NORMAL`  - Normal priority for playback.
;   `.SFX_PRIORITY_HIGH`    - High priority for playback.
.macro VM_SFX_PLAY BANK, ADDR, MASK, PRIO
        .db OP_VM_SFX_PLAY, #<PRIO, #<MASK, #>ADDR, #<ADDR, #<BANK
.endm

OP_VM_MUSIC_SETPOS      = 0x67
;-- Sets playback position for the current song.
; @param PATTERN    - The pattern to set the song position to.
; @param ROW        - The row to set the song position to.
.macro VM_MUSIC_SETPOS PATTERN, ROW
        .db OP_VM_MUSIC_SETPOS, #<ROW, #<PATTERN
.endm

; --- SCENES -------------------------------
; @section Scenes

OP_VM_SCENE_PUSH        = 0x68
;-- Pushes the current scene to the scene stack.
.macro VM_SCENE_PUSH
        .db OP_VM_SCENE_PUSH
.endm

OP_VM_SCENE_POP         = 0x69
;-- Removes the last scene from the scene stack and loads it.
.macro VM_SCENE_POP
        .db OP_VM_SCENE_POP
.endm

OP_VM_SCENE_POP_ALL     = 0x6A
;-- Removes all scenes from the scene stack and loads the first one.
.macro VM_SCENE_POP_ALL
        .db OP_VM_SCENE_POP_ALL
.endm

OP_VM_SCENE_STACK_RESET = 0x6B
;-- Removes all the scenes from the scene stack.
.macro VM_SCENE_STACK_RESET
        .db OP_VM_SCENE_STACK_RESET
.endm

; --- SIO ----------------------------------
; @section SIO

OP_VM_SIO_SET_MODE      = 0x6C
.SIO_MODE_NONE          = 0
.SIO_MODE_MASTER        = 1
.SIO_MODE_SLAVE         = 2
;-- Sets SIO mode.
; @param MODE Mode:
;   `.SIO_MODE_NONE` - Close SIO session.
;   `.SIO_MODE_MASTER` - Host SIO session.
;   `.SIO_MODE_SLAVE` - Join SIO session.
.macro VM_SIO_SET_MODE MODE
        .db OP_VM_SIO_SET_MODE, #<MODE
.endm

OP_VM_SIO_EXCHANGE      = 0x6D
;-- Exchanges data via SIO.
; @param SOUR Source variable to send data from.
; @param DEST Destination variable to receive data to.
; @param SIZE Packet size.
.macro VM_SIO_EXCHANGE SOUR, DEST, SIZE
        .db OP_VM_SIO_EXCHANGE, #<(SIZE << 1), #>DEST, #<DEST, #>SOUR, #<SOUR
.endm

; --- CAMERA -------------------------------
; @section Camera

OP_VM_CAMERA_MOVE_TO     = 0x70
;-- Moves the camera to a new position.
; @param IDX Start of the pseudo-structure which contains the new camera position:
;    `X` - X-coordinate of the camera position.
;    `Y` - Y-coordinate of the camera position.
; @param SPEED Speed of the camera movement.
; @param AFTER_LOCK Lock status of the camera after the movement:
;   `.CAMERA_LOCK`   - Lock camera by X and Y.
;   `.CAMERA_LOCK_X` - Lock camera by X.
;   `.CAMERA_LOCK_Y` - Lock camera by Y.
;   `.CAMERA_UNLOCK` - Unlock camera.
.macro VM_CAMERA_MOVE_TO IDX, SPEED, AFTER_LOCK
        .db OP_VM_CAMERA_MOVE_TO, #<AFTER_LOCK, #<SPEED, #>IDX, #<IDX
.endm

.CAMERA_LOCK             = 0b00000011
.CAMERA_LOCK_X           = 0b00000001
.CAMERA_LOCK_Y           = 0b00000010
.CAMERA_UNLOCK           = 0b00000000

OP_VM_CAMERA_SET_POS     = 0x71
;-- Sets the camera position.
; @param IDX Start of the pseudo-structure which contains the new camera position:
;    `X` - X-coordinate of the camera position.
;    `Y` - Y-coordinate of the camera position.
.macro VM_CAMERA_SET_POS IDX
        .db OP_VM_CAMERA_SET_POS, #>IDX, #<IDX
.endm

.CAMERA_SHAKE_X          = 1
.CAMERA_SHAKE_Y          = 2

; --- RTC ----------------------------------
; @section RTC

OP_VM_RTC_LATCH          = 0x78
;-- Latches RTC value for access.
.macro VM_RTC_LATCH
        .db OP_VM_RTC_LATCH
.endm

OP_VM_RTC_GET            = 0x79
.RTC_SECONDS             = 0x00
.RTC_MINUTES             = 0x01
.RTC_HOURS               = 0x02
.RTC_DAYS                = 0x03
;-- Reads RTC value.
; @param IDX Target variable.
; @param WHAT RTC value to be read:
;   `.RTC_SECONDS` - Seconds.
;   `.RTC_MINUTES` - Minutes.
;   `.RTC_HOURS`   - Hours.
;   `.RTC_DAYS`    - Days.
.macro VM_RTC_GET IDX, WHAT
        .db OP_VM_RTC_GET, #<WHAT, #>IDX, #<IDX
.endm

OP_VM_RTC_SET            = 0x7A
;-- Writes RTC value.
; @param IDX Source variable.
; @param WHAT RTC value to be written:
;   `.RTC_SECONDS` - Seconds.
;   `.RTC_MINUTES` - Minutes.
;   `.RTC_HOURS`   - Hours.
;   `.RTC_DAYS`    - Days.
.macro VM_RTC_SET IDX, WHAT
        .db OP_VM_RTC_SET, #<WHAT, #>IDX, #<IDX
.endm

OP_VM_RTC_START          = 0x7B
.RTC_STOP                = 0
.RTC_START               = 1
;-- Starts or stops RTC.
; @param START Start or stop flag:
;   `.RTC_STOP`    - Stop RTC.
;   `.RTC_START`   - Start RTC.
.macro VM_RTC_START START
        .db OP_VM_RTC_START, #<START
.endm

; --- COLOR ---------------------------------------
; @section Color

OP_VM_LOAD_PALETTE       = 0x7C
.PALETTE_COMMIT          = 1
.PALETTE_BKG             = 2
.PALETTE_SPRITE          = 4
.macro .DMG_PAL COL1, COL2, COL3, COL4
        .dw #((COL1 & 0x03) | ((COL2 & 0x03) << 2) | ((COL3 & 0x03) << 4) | ((COL4 & 0x03) << 6))
        .dw 0,0,0
.endm
.macro .CGB_PAL R1,G1,B1 R2,G2,B2 R3,G3,B3 R4,G4,B4
        .dw #((R1 & 0x1F) | ((G1 & 0x1F) << 5) | ((B1 & 0x1F) << 10))
        .dw #((R2 & 0x1F) | ((G2 & 0x1F) << 5) | ((B2 & 0x1F) << 10))
        .dw #((R3 & 0x1F) | ((G3 & 0x1F) << 5) | ((B3 & 0x1F) << 10))
        .dw #((R4 & 0x1F) | ((G4 & 0x1F) << 5) | ((B4 & 0x1F) << 10))
.endm

.macro VM_LOAD_PALETTE MASK, OPTIONS
;-- Loads sprite or background palettes.
; @param MASK Bit mask of palettes to be set.
; @param OPTIONS Options:
;   `.PALETTE_COMMIT` - Apply immediately, even if screen is faded out.
;   `.PALETTE_BKG`    - Set background palettes.
;   `.PALETTE_SPRITE` - Set sprite palettes.
        .db OP_VM_LOAD_PALETTE, #<OPTIONS, #<MASK
.endm

; --- SGB -----------------------------------------
; @section SGB

;-- Transfers SGB packet(s). Data of variable length is placed after this instruction, for example:
;
; ```
; VM_SGB_TRANSFER
;     .db ((0x04 << 3) | 1), 1, 0x07, ((0x01 << 4) | (0x02 << 2) | 0x03), 5,5, 10,10,  0, 0, 0, 0, 0, 0, 0, 0 ; ATTR_BLK packet
; ```
;
; SGB packet size is a multiple of 16 bytes and encoded in the packet itself.
OP_VM_SGB_TRANSFER       = 0x7E
.macro VM_SGB_TRANSFER
        .db OP_VM_SGB_TRANSFER
.endm

; --- RUMBLE --------------------------------------
; @section Rumble

OP_VM_RUMBLE             = 0x7F
;-- Enables or disables rumble on a cart that has that function.
; @param ENABLE 1 - enable or 0 - disable.
.macro VM_RUMBLE ENABLE
        .db OP_VM_RUMBLE, #<ENABLE
.endm

; --- PROJECTILES ---------------------------------
; @section Projectiles

OP_VM_PROJECTILE_LAUNCH  = 0x80
;-- Launches an instance of a projectile loaded in a slot.
; @param TYPE Slot number of projectile to launch.
; @param IDX Points to the beginning of the pseudo-structure that contains these members:
;    `pos.x` - X position to launch from.
;    `pos.y` - Y position to launch from.
;    `angle` - Projectile angle or direction.
.macro VM_PROJECTILE_LAUNCH TYPE, IDX
        .db OP_VM_PROJECTILE_LAUNCH, #>IDX, #<IDX, #<TYPE
.endm

OP_VM_PROJECTILE_LOAD_TYPE = 0x81
;-- Loads projectile into a slot for VM_PROJECTILE_LAUNCH.
; @param DEST_TYPE Slot number to load into.
; @param SRC_TYPE Slot number to load from.
; @param BANK Bank number of projectile data to load.
; @param ADDR Projectile data to load.
.macro VM_PROJECTILE_LOAD_TYPE DEST_TYPE, SRC_TYPE, BANK, ADDR
        .db OP_VM_PROJECTILE_LOAD_TYPE, #>ADDR, #<ADDR, #<BANK, #<SRC_TYPE, #<DEST_TYPE
.endm

; --- MATH -------------------------------------------
; @section Math

OP_VM_SIN_SCALE         = 0x89
;-- Returns result of sine function.
; @param IDX Sine scale (multiplies result) and also target variable that receives result.
; @param IDX_ANGLE Angle to pass into function. This value starts at 0 (pointing up) and increments 64 every 90 degrees clockwise.
; @param SCALE Accuracy between 0 and 7.
.macro VM_SIN_SCALE IDX, IDX_ANGLE, SCALE
        .db OP_VM_SIN_SCALE, #<SCALE, #>IDX_ANGLE, #<IDX_ANGLE, #>IDX, #<IDX
.endm

OP_VM_COS_SCALE         = 0x8A
;-- Returns result of cosine function.
; @param IDX Cosine scale (multiplies result) and also target variable that receives result.
; @param IDX_ANGLE Angle to pass into function. This value starts at 0 (pointing up) and increments 64 every 90 degrees clockwise.
; @param SCALE Accuracy between 0 and 7.
.macro VM_COS_SCALE IDX, IDX_ANGLE, SCALE
        .db OP_VM_COS_SCALE, #<SCALE, #>IDX_ANGLE, #<IDX_ANGLE, #>IDX, #<IDX
.endm

; --- TEXT SOUND -------------------------------------
; @section Text Sound

OP_VM_SET_TEXT_SOUND    = 0x8B
;-- Sets the sound effect for the text output.
; @param BANK Bank number of the effect.
; @param ADDR Address of the effect.
; @param MASK Mute mask of the effect.
.macro VM_SET_TEXT_SOUND BANK, ADDR, MASK
        .db OP_VM_SET_TEXT_SOUND, #<MASK, #>ADDR, #<ADDR, #<BANK
.endm

; --- GB PRINTER -------------------------------------
; @section GB Printer

OP_VM_PRINTER_DETECT    = 0x8C
;-- Detects printer.
; @param ERROR Target variable that receives the result of detection.
; @param DELAY Detection timeout.
.macro VM_PRINTER_DETECT ERROR, DELAY
        .db OP_VM_PRINTER_DETECT, #<DELAY, #>ERROR, #<ERROR
.endm

OP_VM_PRINT_OVERLAY     = 0x8D
;-- Prints up to HEIGHT rows of the overlay window (must be multiple of 2).
; @param ERROR Target variable that receives the result of printing.
; @param START Start line of the overlay window.
; @param HEIGHT Amount of lines to print.
; @param MARGIN Lines to feed after the printing is finished.
.macro VM_PRINT_OVERLAY ERROR, START, HEIGHT, MARGIN
        .db OP_VM_PRINT_OVERLAY, #<MARGIN, #<HEIGHT, #<START, #>ERROR, #<ERROR
.endm

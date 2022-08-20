#pragma bank 255

#include <string.h>
#include <stdlib.h>
#include <stdarg.h>
#include <stdbool.h>
#include <rand.h>

#include "vm.h"
#include "math.h"

BANKREF(VM_MAIN)

// instructions global registry
extern const SCRIPT_CMD script_cmds[];

// contexts for executing scripts
// ScriptRunnerInit(), ExecuteScript(), ScriptRunnerUpdate() manipulate these contexts
SCRIPT_CTX CTXS[VM_MAX_CONTEXTS];
SCRIPT_CTX * first_ctx, * free_ctxs;
// context pointers for script_runner
SCRIPT_CTX * old_executing_ctx, * executing_ctx;

// lock state
UBYTE vm_lock_state;
// loaded state
UBYTE vm_loaded_state;
// exception flsg
UBYTE vm_exception_code;
UBYTE vm_exception_params_length;
UBYTE vm_exception_params_bank;
const void * vm_exception_params_offset;

// we need BANKED functions here to have two extra words before arguments
// we will put VM stuff there
// plus we get an ability to call them from wherever we want in native code
// you can manipulate context (THIS) within VM functions
// if VM function has no parameters and does not manipulate context
// then you may declare it without params at all bacause caller clears stack - that is safe

// call absolute instruction
void vm_call(SCRIPT_CTX * THIS, UBYTE * pc) OLDCALL BANKED {
    *(THIS->stack_ptr++) = (UWORD)THIS->PC;
    THIS->PC = pc;
}
// return instruction returns to a point where call was invoked
void vm_ret(SCRIPT_CTX * THIS, UBYTE n) OLDCALL BANKED {
    // pop VM PC from VM stack
    THIS->stack_ptr--;
    THIS->PC = (const UBYTE *)*(THIS->stack_ptr);
    if (n) THIS->stack_ptr -= n;
}

// far call to another bank
void vm_call_far(SCRIPT_CTX * THIS, UBYTE bank, UBYTE * pc) OLDCALL BANKED {
    *(THIS->stack_ptr++) = (UWORD)THIS->PC;
    *(THIS->stack_ptr++) = THIS->bank;
    THIS->PC = pc;
    THIS->bank = bank;
}
// ret from far call
void vm_ret_far(SCRIPT_CTX * THIS, UBYTE n) OLDCALL BANKED {
    THIS->stack_ptr--;
    THIS->bank = (UBYTE)(*(THIS->stack_ptr));
    THIS->stack_ptr--;
    THIS->PC = (const UBYTE *)*(THIS->stack_ptr);
    if (n) THIS->stack_ptr -= n;
}

// you can also invent calling convention and pass parameters to scripts on VM stack,
// make a library of scripts and so on
// pushes word onto VM stack
void vm_push(SCRIPT_CTX * THIS, UWORD value) OLDCALL BANKED {
    *(THIS->stack_ptr++) = value;
}
// cleans up to n words from stack and returns last one
 UWORD vm_pop(SCRIPT_CTX * THIS, UBYTE n) OLDCALL BANKED {
    if (n) THIS->stack_ptr -= n;
    return *(THIS->stack_ptr);
}

// loop absolute, callee cleanups stack
void vm_loop(SCRIPT_CTX * THIS, INT16 idx, UINT8 * pc, UBYTE n) OLDCALL BANKED {
    UWORD * counter;
    if (idx < 0) counter = THIS->stack_ptr + idx; else counter = script_memory + idx;
    if (*counter) {
        THIS->PC = pc, (*counter)--;
    } else {
        if (n) THIS->stack_ptr -= n;
    }
}

// switch
void vm_switch(DUMMY0_t dummy0, DUMMY1_t dummy1, SCRIPT_CTX * THIS, INT16 idx, UBYTE size, UBYTE n) OLDCALL NONBANKED {
    dummy0; dummy1; // suppress warnings
    INT16 value, * table;

    if (idx < 0) value = *(THIS->stack_ptr + idx); else value = *(script_memory + idx);
    if (n) THIS->stack_ptr -= n;        // dispose values on VM stack if required

    UBYTE _save = _current_bank;        // we must preserve current bank,
    SWITCH_ROM(THIS->bank);             // then switch to bytecode bank

    table = (INT16 *)(THIS->PC);
    while (size) {
        if (value == *table++) {
            THIS->PC = (UBYTE *)(*table);   // condition met, perform jump
            SWITCH_ROM(_save);              // restore bank
            return;
        } else table++;
        size--;
    }

    SWITCH_ROM(_save);                  // restore bank
    THIS->PC = (UBYTE *)table;          // make PC point to the next instruction command
}

// jump absolute
void vm_jump(SCRIPT_CTX * THIS, UBYTE * pc) OLDCALL BANKED {
    THIS->PC = pc;
}

UBYTE wait_frames(void * THIS, UBYTE start, UWORD * stack_frame) OLDCALL BANKED {
    // we allocate one local variable (just write ahead of VM stack pointer, we have no interrupts, our local variables won't get spoiled)
    if (start) *((SCRIPT_CTX *)THIS)->stack_ptr = sys_time;
    // check wait condition
    return (((UWORD)sys_time - *((SCRIPT_CTX *)THIS)->stack_ptr) < stack_frame[0]) ? ((SCRIPT_CTX *)THIS)->waitable = TRUE, (UBYTE)FALSE : (UBYTE)TRUE;
}
// calls C handler until it returns true; callee cleanups stack
void vm_invoke(SCRIPT_CTX * THIS, UBYTE bank, UBYTE * fn, UBYTE nparams, INT16 idx) OLDCALL BANKED {
    UWORD * stack_frame = (idx < 0) ? THIS->stack_ptr + idx : script_memory + idx;
    // update function pointer
    UBYTE start = ((THIS->update_fn != fn) || (THIS->update_fn_bank != bank)) ? THIS->update_fn = fn, THIS->update_fn_bank = bank, (UBYTE)TRUE : (UBYTE)FALSE;
    // call handler
    if (FAR_CALL_EX(fn, bank, SCRIPT_UPDATE_FN, THIS, start, stack_frame)) {
        if (nparams) THIS->stack_ptr -= nparams;
        THIS->update_fn = 0, THIS->update_fn_bank = 0;
        return;
    }
    // call handler again, wait condition is not met
    THIS->PC -= (INSTRUCTION_SIZE + sizeof(bank) + sizeof(fn) + sizeof(nparams) + sizeof(idx));
}

// runs script in a new thread
void vm_beginthread(DUMMY0_t dummy0, DUMMY1_t dummy1, SCRIPT_CTX * THIS, UBYTE bank, UBYTE * pc, INT16 idx, UBYTE nargs) OLDCALL NONBANKED {
    dummy0; dummy1;
    UWORD * A;
    if (idx < 0) A = THIS->stack_ptr + idx; else A = script_memory + idx;
    SCRIPT_CTX * ctx = script_execute(bank, pc, A, 0);
    // initialize thread locals if any
    if (!(nargs)) return;
    if (ctx) {
        UBYTE _save = _current_bank;        // we must preserve current bank,
        SWITCH_ROM(THIS->bank);             // then switch to bytecode bank
        for (UBYTE i = nargs; i != 0; i--) {
            INT16 A = *((INT16 *)THIS->PC);
            A = (A < 0) ? *(THIS->stack_ptr + idx) : *(script_memory + idx);
            *(ctx->stack_ptr++) = (UWORD)A;
            THIS->PC += 2;
        }
        SWITCH_ROM(_save);
    }
}
//
void vm_join(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    UWORD * A;
    if (idx < 0) A = THIS->stack_ptr + idx; else A = script_memory + idx;
    if (!(*A >> 8)) THIS->PC -= (INSTRUCTION_SIZE + sizeof(idx)), THIS->waitable = TRUE;
}
//
void vm_terminate(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    UWORD * A;
    if (idx < 0) A = THIS->stack_ptr + idx; else A = script_memory + idx;
    script_terminate((UBYTE)(*A));
}

// if condition; compares two arguments on VM stack
// idxA, idxB point to arguments to compare
// negative indexes are parameters on the top of VM stack, positive - absolute indexes in stack[] array
void vm_if(SCRIPT_CTX * THIS, UBYTE condition, INT16 idxA, INT16 idxB, UBYTE * pc, UBYTE n) OLDCALL BANKED {
    INT16 A, B;
    if (idxA < 0) A = *(THIS->stack_ptr + idxA); else A = script_memory[idxA];
    if (idxB < 0) B = *(THIS->stack_ptr + idxB); else B = script_memory[idxB];
    UBYTE res = FALSE;
    switch (condition) {
        case VM_OP_EQ: res = (A == B); break;
        case VM_OP_LT: res = (A <  B); break;
        case VM_OP_LE: res = (A <= B); break;
        case VM_OP_GT: res = (A >  B); break;
        case VM_OP_GE: res = (A >= B); break;
        case VM_OP_NE: res = (A != B); break;
    }
    if (res) THIS->PC = pc;
    if (n) THIS->stack_ptr -= n;
}
// if condition; compares argument on VM stack with an immediate value
// idxA point to arguments to compare, B is a value
// negative indexes are parameters on the top of VM stack, positive - absolute indexes in stack[] array
void vm_if_const(SCRIPT_CTX * THIS, UBYTE condition, INT16 idxA, INT16 B, UBYTE * pc, UBYTE n) OLDCALL BANKED {
    INT16 A;
    if (idxA < 0) A = *(THIS->stack_ptr + idxA); else A = script_memory[idxA];
    UBYTE res = FALSE;
    switch (condition) {
        case VM_OP_EQ: res = (A == B); break;
        case VM_OP_LT: res = (A <  B); break;
        case VM_OP_LE: res = (A <= B); break;
        case VM_OP_GT: res = (A >  B); break;
        case VM_OP_GE: res = (A >= B); break;
        case VM_OP_NE: res = (A != B); break;
    }
    if (res) THIS->PC = pc;
    if (n) THIS->stack_ptr -= n;
}
// pushes value from VM stack onto VM stack
// if idx >= 0 then idx is absolute, else idx is relative to VM stack pointer
void vm_push_value(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    *(THIS->stack_ptr) = *((idx < 0) ? (THIS->stack_ptr + idx) : (script_memory + idx));
    THIS->stack_ptr++;
}
// pushes a value on VM stack or a global indirectly from an index in the variable on VM stack or in a global onto VM stack
void vm_push_value_ind(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    idx = *((idx < 0) ? (THIS->stack_ptr + idx) : (script_memory + idx));
    *(THIS->stack_ptr) = *((idx < 0) ? (THIS->stack_ptr + idx) : (script_memory + idx));
    THIS->stack_ptr++;
}
// translates idx into absolute index and pushes result to VM stack
// if idx >= 0 then idx it is pushed as is, else idx is translated into the absolute index from the beginning of script_memory[]
void vm_push_reference(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    *(THIS->stack_ptr) = ((idx < 0) ? ((((UWORD)(THIS->stack_ptr) - (UWORD)script_memory) >> 1) + idx) : idx);
    THIS->stack_ptr++;
}
// manipulates VM stack pointer
void vm_reserve(SCRIPT_CTX * THIS, INT8 ofs) OLDCALL BANKED {
    THIS->stack_ptr += ofs;
}
// sets value on stack indexed by idxA to value on stack indexed by idxB
void vm_set(SCRIPT_CTX * THIS, INT16 idxA, INT16 idxB) OLDCALL BANKED {
    INT16 * A, * B;
    if (idxA < 0) A = THIS->stack_ptr + idxA; else A = script_memory + idxA;
    if (idxB < 0) B = THIS->stack_ptr + idxB; else B = script_memory + idxB;
    *A = *B;
}
// sets value on stack indexed by idx to value
void vm_set_const(SCRIPT_CTX * THIS, INT16 idx, UWORD value) OLDCALL BANKED {
    UWORD * A;
    if (idx < 0) A = THIS->stack_ptr + idx; else A = script_memory + idx;
    *A = value;
}
// sets value on stack indexed by idxA to value on stack indexed by idxB
void vm_get_tlocal(SCRIPT_CTX * THIS, INT16 idxA, INT16 idxB) OLDCALL BANKED {
    INT16 * A, * B;
    if (idxA < 0) A = THIS->stack_ptr + idxA; else A = script_memory + idxA;
    if (idxB < 0) B = THIS->stack_ptr + idxB; else B = THIS->base_addr + idxB;
    *A = *B;
}
// rpn calculator; must be NONBANKED because we access VM bytecode
// dummy parameters are needed to make nonbanked function to be compatible with banked call
void vm_rpn(DUMMY0_t dummy0, DUMMY1_t dummy1, SCRIPT_CTX * THIS) OLDCALL NONBANKED {
    dummy0; dummy1; // suppress warnings
    INT16 * A, * B, * ARGS;
    INT16 idx;

    UBYTE _save = _current_bank;        // we must preserve current bank,
    SWITCH_ROM(THIS->bank);             // then switch to bytecode bank

    ARGS = THIS->stack_ptr;
    while (TRUE) {
        INT8 op = *(THIS->PC++);
        if (op < 0) {
            switch (op) {
                case -5:
                // set by reference
                    idx = *((INT16 *)(THIS->PC));
                    *((idx < 0) ? ARGS + idx : script_memory + idx) = *(--(THIS->stack_ptr));
                    THIS->PC += 2;
                    continue;
                // indirect reference
                case -4:
                    idx = *((INT16 *)(THIS->PC));
                    idx = *((idx < 0) ? ARGS + idx : script_memory + idx);
                    *(THIS->stack_ptr) = *((idx < 0) ? ARGS + idx : script_memory + idx);
                    THIS->PC += 2;
                    break;
                // reference
                case -3:
                    idx = *((INT16 *)(THIS->PC));
                    *(THIS->stack_ptr) = *((idx < 0) ? ARGS + idx : script_memory + idx);
                    THIS->PC += 2;
                    break;
                // int16
                case -2:
                    *(THIS->stack_ptr) = *((UWORD *)(THIS->PC));
                    THIS->PC += 2;
                    break;
                // int8
                case -1:
                    op = *(THIS->PC++);
                    *(THIS->stack_ptr) = op;
                    break;
                default:
                    SWITCH_ROM(_save);             // restore bank
                    return;
            }
            THIS->stack_ptr++;
        } else {
            A = THIS->stack_ptr - 2; B = A + 1;
            switch (op) {
                // arithmetics
                case '+': *A = *A  +  *B; break;
                case '-': *A = *A  -  *B; break;
                case '*': *A = *A  *  *B; break;
                case '/': *A = *A  /  *B; break;
                case '%': *A = *A  %  *B; break;
                // logical
                case VM_OP_EQ:  *A = (*A  ==  *B); break;
                case VM_OP_LT:  *A = (*A  <   *B); break;
                case VM_OP_LE:  *A = (*A  <=  *B); break;
                case VM_OP_GT:  *A = (*A  >   *B); break;
                case VM_OP_GE:  *A = (*A  >=  *B); break;
                case VM_OP_NE:  *A = (*A  !=  *B); break;
                case VM_OP_AND: *A = ((bool)(*A)  &&  (bool)(*B)); break;
                case VM_OP_OR:  *A = ((bool)(*A)  ||  (bool)(*B)); break;
                case VM_OP_NOT: *B = !(*B); continue;
                // bit
                case '&': *A = *A  &  *B; break;
                case '|': *A = *A  |  *B; break;
                case '^': *A = *A  ^  *B; break;
                // funcs
                case 'm': *A = (*A < *B) ? *A : *B; break;  // min
                case 'M': *A = (*A > *B) ? *A : *B; break;  // max
                // unary
                case '@': *B = abs(*B); continue;
                case '~': *B = ~(*B);   continue;
                case 'Q': *B = isqrt((UWORD)*B); continue;
                // terminator
                default:
                    SWITCH_ROM(_save);             // restore bank
                    return;
            }
            THIS->stack_ptr--;
        }
    }
}

void vm_test_terminate(SCRIPT_CTX * THIS, UBYTE flags) OLDCALL BANKED {
    THIS;
    if (flags & 1) wait_vbl_done();
#if defined(__SDCC)
__asm
        ld b, b
__endasm;
#endif
}

// puts context into a waitable state
void vm_idle(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS->waitable = TRUE;
}

// gets unsigned int8 by address
void vm_get_uint8(SCRIPT_CTX * THIS, INT16 idxA, UINT8 * addr) OLDCALL BANKED {
    INT16 * A;
    if (idxA < 0) A = THIS->stack_ptr + idxA; else A = script_memory + idxA;
    *A = *addr;
}
// gets int8 by address
void vm_get_int8(SCRIPT_CTX * THIS, INT16 idxA, INT8 * addr) OLDCALL BANKED {
    INT16 * A;
    if (idxA < 0) A = THIS->stack_ptr + idxA; else A = script_memory + idxA;
    *A = *addr;
}
// gets int16 by address
void vm_get_int16(SCRIPT_CTX * THIS, INT16 idxA, INT16 * addr) OLDCALL BANKED {
    INT16 * A;
    if (idxA < 0) A = THIS->stack_ptr + idxA; else A = script_memory + idxA;
    *A = *addr;
}
// gets int8 or int16 by far address
void vm_get_far(DUMMY0_t dummy0, DUMMY1_t dummy1, SCRIPT_CTX * THIS, INT16 idxA, UBYTE size, UBYTE bank, UBYTE * addr) OLDCALL NONBANKED {
    dummy0; dummy1;
    UINT16 * A;
    if (idxA < 0) A = THIS->stack_ptr + idxA; else A = script_memory + idxA;
    UBYTE _save = _current_bank;        // we must preserve current bank,
    SWITCH_ROM(bank);             // then switch to bytecode bank
    *A = (size == 0) ? *((UBYTE *)addr) : *((UINT16 *)addr);
    SWITCH_ROM(_save);
}
// sets unsigned int8 in RAM by address
void vm_set_uint8(SCRIPT_CTX * THIS, UINT8 * addr, INT16 idxA) OLDCALL BANKED {
    INT16 * A;
    if (idxA < 0) A = THIS->stack_ptr + idxA; else A = script_memory + idxA;
    *addr = *A;
}
// sets int8 in RAM by address
void vm_set_int8(SCRIPT_CTX * THIS, INT8 * addr, INT16 idxA) OLDCALL BANKED {
    INT16 * A;
    if (idxA < 0) A = THIS->stack_ptr + idxA; else A = script_memory + idxA;
    *addr = *A;
}
// sets int16 in RAM by address
void vm_set_int16(SCRIPT_CTX * THIS, INT16 * addr, INT16 idxA) OLDCALL BANKED {
    INT16 * A;
    if (idxA < 0) A = THIS->stack_ptr + idxA; else A = script_memory + idxA;
    *addr = *A;
}
// sets unsigned int8 in RAM by address
void vm_set_const_int8(SCRIPT_CTX * THIS, UINT8 * addr, UINT8 v) OLDCALL BANKED {
    THIS;
    *addr = v;
}
// sets int16 in RAM by address
void vm_set_const_int16(SCRIPT_CTX * THIS, INT16 * addr, INT16 v) OLDCALL BANKED {
    THIS;
    *addr = v;
}

// initializes random number generator
void vm_init_rng(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    UINT16 * A;
    if (idx < 0) A = THIS->stack_ptr + idx; else A = script_memory + idx;
    initrand(*A);
}

// sets value on stack indexed by idx to random value from given range 0 <= n < limit, mask is calculated by macro
void vm_rand(SCRIPT_CTX * THIS, INT16 idx, UINT16 min, UINT16 limit, UINT16 mask) OLDCALL BANKED {
    UINT16 value = randw() & mask;
    if (value >= limit) value -= limit;
    if (value >= limit) value -= limit;
    UINT16 * A;
    if (idx < 0) A = THIS->stack_ptr + idx; else A = script_memory + idx;
    *A = value + min;
}

// sets lock flag for current context
void vm_lock(SCRIPT_CTX * THIS) OLDCALL BANKED {
    THIS->lock_count++;
    vm_lock_state++;
}

// resets lock flag for current context
void vm_unlock(SCRIPT_CTX * THIS) OLDCALL BANKED {
    if (THIS->lock_count == 0) return;
    THIS->lock_count--;
    vm_lock_state--;
}

// raises VM exception
void vm_raise(SCRIPT_CTX * THIS, UBYTE code, UBYTE size) OLDCALL BANKED {
    vm_exception_code = code;
    vm_exception_params_length = size;
    vm_exception_params_bank = THIS->bank;
    vm_exception_params_offset = THIS->PC;
    THIS->PC += size;
}

// sets variable indirect
void vm_set_indirect(SCRIPT_CTX * THIS, INT16 idxA, INT16 idxB) OLDCALL BANKED {
    INT16 * A, * B;
    // get target address indirect
    if (idxA < 0) A = THIS->stack_ptr + idxA; else A = script_memory + idxA;
    if (*A < 0) A = THIS->stack_ptr + *A; else A = script_memory + *A;
    // get source address
    if (idxB < 0) B = THIS->stack_ptr + idxB; else B = script_memory + idxB;
    // assign
    *A = *B;
}
// sets variable indirect
void vm_get_indirect(SCRIPT_CTX * THIS, INT16 idxA, INT16 idxB) OLDCALL BANKED {
    INT16 * A, * B;
    // get target address
    if (idxA < 0) A = THIS->stack_ptr + idxA; else A = script_memory + idxA;
    // get source address indirect
    if (idxB < 0) B = THIS->stack_ptr + idxB; else B = script_memory + idxB;
    if (*B < 0) B = THIS->stack_ptr + *B; else B = script_memory + *B;
    // assign
    *A = *B;
}
// returns "loaded" flag and reset it
void vm_poll_loaded(SCRIPT_CTX * THIS, INT16 idx) OLDCALL BANKED {
    UWORD * A;
    if (idx < 0) A = THIS->stack_ptr + idx; else A = script_memory + idx;
    *A = vm_loaded_state;
    vm_loaded_state = FALSE;
}
// call native function by far pointer;
void vm_call_native(DUMMY0_t dummy0, DUMMY1_t dummy1, SCRIPT_CTX * THIS, UINT8 bank, const void * ptr) OLDCALL NONBANKED NAKED {
    dummy0; dummy1; THIS; bank; ptr; // suppress warnings
#if defined(__SDCC) && defined(NINTENDO)
__asm
        ldhl sp, #6
        ld a, (hl+)
        ld h, (hl)
        ld l, a
        push hl

        ldhl sp, #10
        ld a, (hl+)
        ld e, a
        ld a, (hl+)
        ld h, (hl)
        ld l, a
        call ___sdcc_bcall_ehl
        add sp, #2
        ret
__endasm;
#endif
}
// memset for VM variables
void vm_memset(SCRIPT_CTX * THIS, INT16 idx, INT16 value, INT16 count) OLDCALL BANKED {
    memset(VM_REF_TO_PTR(idx), value, count << 1);
}
// memcpy for VM variables
void vm_memcpy(SCRIPT_CTX * THIS, INT16 idxA, INT16 idxB, INT16 count) OLDCALL BANKED {
    memcpy(VM_REF_TO_PTR(idxA), VM_REF_TO_PTR(idxB), count << 1);
}

// executes one step in the passed context
// return zero if script end
// bank with VM code must be active
static UBYTE current_fn_bank;
UBYTE VM_STEP(SCRIPT_CTX * CTX) NAKED NONBANKED STEP_FUNC_ATTR {
    CTX;
#if defined(__SDCC) && defined(NINTENDO)
__asm
        lda hl, 2(sp)
        ld a, (hl+)
        ld h, (hl)
        ld l, a

        inc hl
        inc hl

        ld a, (hl-)
        ld e, a
        ld a, (hl-)
        ld l, (hl)
        ld h, a

        ldh a, (__current_bank)
        push af

        ld a, e
        ldh (__current_bank), a
        ld (_rROMB0), a         ; switch bank with vm code

        ld a, (hl+)             ; load current command and return if terminator
        ld e, a
        or a
        jr z, 3$

        push bc                 ; store bc
        push hl

        ld h, #0
        ld l, e
        add hl, hl
        add hl, hl              ; hl = de * sizeof(SCRIPT_CMD)
        dec hl
        ld de, #_script_cmds
        add hl, de              ; hl = &script_cmds[command].args_len

        ld a, (hl-)
        ld e, a                 ; e = args_len
        ld a, (hl-)
        ld (_current_fn_bank), a
        ld a, (hl-)
        ld b, a
        ld c, (hl)              ; bc = fn

        pop hl                  ; hl points to the next VM instruction or a first byte of the args
        ld d, e                 ; d = arg count
        srl d
        jr nc, 4$               ; d is even?
        ld a, (hl+)             ; copy one arg onto stack
        push af
        inc sp
4$:
        jr z, 1$                ; only one arg?
2$:
        ld a, (hl+)
        push af
        inc sp
        ld a, (hl+)
        push af
        inc sp
        dec d
        jr nz, 2$               ; loop through remaining args, copy 2 bytes at a time
1$:
        push bc                 ; save function pointer

        ld b, h
        ld c, l                 ; bc points to the next VM instruction

        lda hl, 8(sp)
        add hl, de              ; add correction
        ld a, (hl+)
        ld h, (hl)
        ld l, a
        ld (hl), c
        ld c, l
        ld a, h
        inc hl
        ld (hl), b              ; PC = PC + sizeof(instruction) + args_len
        ld b, a                 ; bc = THIS

        pop hl                  ; restore function pointer
        push bc                 ; pushing THIS

        push de                 ; not used
        push de                 ; de: args_len

        ld a, (_current_fn_bank)    ; a = script_bank
        ldh (__current_bank), a
        ld (_rROMB0), a         ; switch bank with functions

        rst 0x20                ; call hl

        pop hl                  ; hl: args_len
        add hl, sp
        ld sp, hl               ; deallocate args_len bytes from the stack
        add sp, #4              ; deallocate dummy word and THIS

        pop bc                  ; restore bc

        ld e, #1                ; command executed
3$:
        pop af
        ldh (__current_bank), a
        ld (_rROMB0), a         ; restore bank

        ret
__endasm;
#endif
}

// global shared script memory
UWORD script_memory[VM_HEAP_SIZE + (VM_MAX_CONTEXTS * VM_CONTEXT_STACK_SIZE)];

// initialize script runner contexts
// resets whole VM engine
void script_runner_init(UBYTE reset) BANKED {
    if (reset) {
        memset(script_memory, 0, sizeof(script_memory));
        memset(CTXS, 0, sizeof(CTXS));
    }
    UWORD * base_addr = &script_memory[VM_HEAP_SIZE];
    free_ctxs = CTXS, first_ctx = 0;
    SCRIPT_CTX * nxt = 0;
    SCRIPT_CTX * tmp = CTXS + (VM_MAX_CONTEXTS - 1);
    for (UBYTE i = VM_MAX_CONTEXTS; i != 0; i--) {
        tmp->next = nxt;
        tmp->base_addr = base_addr;
        tmp->ID = i;
        base_addr += VM_CONTEXT_STACK_SIZE;
        nxt = tmp--;
    }
    vm_lock_state = 0;
    vm_loaded_state = FALSE;
    // reset script_runner
    old_executing_ctx = 0, executing_ctx = first_ctx;
}

// execute a script in the new allocated context
// actually, it initializes free context with bytecode and moves it into the active context chain
SCRIPT_CTX * script_execute(UBYTE bank, UBYTE * pc, UWORD * handle, UBYTE nargs, ...) BANKED {
    if (free_ctxs == NULL) return NULL;
#ifdef SAFE_SCRIPT_EXECUTE
    if (pc == NULL) return NULL;
#endif

    SCRIPT_CTX * tmp = free_ctxs;
    // remove context from free list
    free_ctxs = free_ctxs->next;
    // initialize context
    tmp->PC = pc, tmp->bank = bank, tmp->stack_ptr = tmp->base_addr;
    // set thread handle by reference
    tmp->hthread = handle;
    if (handle) *handle = tmp->ID;
    // clear termination flag
    tmp->terminated = FALSE;
    // clear lock count
    tmp->lock_count = 0;
    // clear flags
    tmp->flags = 0;
    // Clear update fn
    tmp->update_fn_bank = 0;
    // append context to active list
    tmp->next = NULL;
    if (first_ctx) {
         SCRIPT_CTX * idx = first_ctx;
         while (idx->next) idx = idx->next;
         idx->next = tmp;
    } else first_ctx = tmp;
    // push threadlocals
    if (nargs) {
        va_list va;
        va_start(va, nargs);
        for (UBYTE i = nargs; i != 0; i--) {
            *(tmp->stack_ptr++) = va_arg(va, INT16);
        }
    }
    // return thread ID
    return tmp;
}

// terminate script by ID
UBYTE script_terminate(UBYTE ID) BANKED {
    static SCRIPT_CTX * ctx;
    ctx = first_ctx;
    while (ctx) {
        if (ctx->ID == ID) {
            if (ctx->hthread) {
                *(ctx->hthread) |= SCRIPT_TERMINATED;
                ctx->hthread = 0;
            }
            return ctx->terminated = TRUE;
        } else ctx = ctx->next;
    }
    return FALSE;
}

// detach script from the monitoring handle
UBYTE script_detach_hthread(UBYTE ID) BANKED {
    static SCRIPT_CTX * ctx;
    ctx = first_ctx;
    while (ctx) {
        if (ctx->ID == ID) {
            ctx->hthread = 0;
            return TRUE;
        } else ctx = ctx->next;
    }
    return FALSE;
}

// process all contexts
// executes one command in each active context
UBYTE script_runner_update() NONBANKED {
    static UBYTE waitable;
    static UBYTE counter;

    // if locked then execute last context until it is unlocked or terminated
    if (!vm_lock_state) old_executing_ctx = 0, executing_ctx = first_ctx;

    waitable = TRUE;
    counter = INSTRUCTIONS_PER_QUANT;
    while (executing_ctx) {
        vm_exception_code = EXCEPTION_CODE_NONE;
        executing_ctx->waitable = FALSE;
        if ((executing_ctx->terminated != FALSE) || (!VM_STEP(executing_ctx))) {
            // update lock state
            vm_lock_state -= executing_ctx->lock_count;
            // update handle if present
            if (executing_ctx->hthread) *(executing_ctx->hthread) |= SCRIPT_TERMINATED;
            // script is finished, remove from linked list
            if (old_executing_ctx) old_executing_ctx->next = executing_ctx->next;
            if (first_ctx == executing_ctx) first_ctx = executing_ctx->next;
            // add terminated context to free contexts list
            executing_ctx->next = free_ctxs, free_ctxs = executing_ctx;
            // next context
            if (old_executing_ctx) executing_ctx = old_executing_ctx->next; else executing_ctx = first_ctx;
        } else {
            // check exception
            if (vm_exception_code) return RUNNER_EXCEPTION;
            // loop until waitable state or quant is expired
            if (!(executing_ctx->waitable) && (counter--)) continue;
            // exit while loop if context switching is locked
            if (vm_lock_state) break;
            // switch to the next context
            waitable &= executing_ctx->waitable;
            old_executing_ctx = executing_ctx, executing_ctx = executing_ctx->next;
            counter = INSTRUCTIONS_PER_QUANT;
        }
    }
    // return 0 if all threads are finished
    if (first_ctx == 0) return RUNNER_DONE;
    // return 1 if all threads in waitable state else return 2
    if (waitable) return RUNNER_IDLE; else return RUNNER_BUSY;
}

/** @file izt/aop.c
    Assembler Operand support.
*/
#include "izt.h"

asmop *_new(int type)
{
    return NULL;
}

asmop *_newForLiteral(operand *op)
{
    asmop *aop = _new(AOP_TYPE_LITERAL);
    aop->u.literal = op->operand.valOperand;
    aop->size = getSize(operandType(op));

    return aop;
}

asmop *_newForSymbol(symbol *sym, iCode *ic)
{
    memmap *space;
    asmop *aop;

    wassert(ic);
    wassert(sym);
    wassert(sym->etype);

    space = SPEC_OCLS(sym->etype);

    if (sym->aop != NULL) {
	// Already has one.
	aop = sym->aop;
    }
    else if (sym->onStack || sym->iaccess) {
	// On the stack or only available by indirect access.
	aop = _new(AOP_TYPE_STACK);
	aop->size = getSize(sym->type);

	aop->u.stack = sym->stack;
    }
    else if (IS_FUNC(sym->type)) {
	// Functions are special.  The symbol is constant and available.
	aop = _new(AOP_TYPE_IMMEDIATE);
	aop->u.immediate = Safe_strdup(sym->rname);
	// PENDING: Size of a function pointer.
	aop->size = 2;
    }
    else {
	// Somewhere in 'far' space.  ie only accessable through a pointer register.
	aop = _new(AOP_TYPE_SCRATCH_PTR);
	aop->size = getSize(sym->type);
	aop->u.scratch = sym->rname;
    }
    
    // Attach the asmop to the symbol.
    sym->aop = aop;

    return aop;     
}

asmop *_newForRemat(symbol *sym)
{
    char *s = buffer;
    iCode *ic = sym->rematiCode;
    asmop *aop = _new(AOP_TYPE_IMMEDIATE);

    // Terminate the string first up.
    *s = '\0';

    // Combine up any offsets.
    while (ic->op == '+' || ic->op == '-') {
	sprintf(s, "0x%04X %c ", (int)operandLitValue(IC_RIGHT(ic)), ic->op);
	s += strlen(s);

	ic = OP_SYMBOL(IC_LEFT(ic))->rematiCode;
    }
	
    sprintf(s, "%s", OP_SYMBOL(IC_LEFT(ic))->rname);

    aop->size = getSize(sym->type);
    aop->u.immediate = Safe_strdup(buffer);
    
    return aop;
};

asmop *_newForTemporary(operand *op, iCode *ic)
{
    symbol *sym = OP_SYMBOL(op);
    asmop *aop = NULL;

    if (sym->regType == REG_TYPE_CND) {
	// Conditionals have no size due to being stored in carry.
	aop = _new(AOP_TYPE_CARRY);
	aop->size = 0;
    }
    else if (sym->isspilt || sym->nRegs == 0) {
	// No registers so it must be somewhere on the stack or remat.
	if (sym->remat) {
	    aop = _newForRemat(sym);
	}
	else if (sym->accuse) {
	    // Packed into one of the normally unavailable registers.
	    wassert(0);
	}
	else if (sym->ruonly) {
	    // Only used in the return.
	    wassert(0);
	}
	else {
	    // Must be spilt.
	    aop = _newForSymbol(sym->usl.spillLoc, ic);
	}
    }
    else {
	// Must be in registers.
	aop = _new(AOP_TYPE_REG);
	aop->size = sym->nRegs;
	aop->u.reg = sym->regs[0];
    }
    // Attach to the op and symbol.
    op->aop = aop;
    sym->aop = aop;

    return aop;
}

/** Bind a new AOP to the given operand.
 */
void izt_bindAop(operand *op, iCode *ic)
{
    if (op == NULL) {
	// Do nothing.  Just return.
    }
    else if (IS_OP_LITERAL(op)) {
	op->aop = _newForLiteral(op);
    }
    else if (op->aop != NULL) {
	// It already has one allocated.  Use it.
	// Do nothing.
    }
    else if (IS_SYMOP(op) && OP_SYMBOL(op)->aop != NULL) {
	// The attached symbol already has an asmop.  Reuse it.
	op->aop = OP_SYMBOL(op)->aop;
    }
    else if (IS_TRUE_SYMOP(op)) {
	// Its a true symbol, so bind in a symbol asmop.
	op->aop = _newForSymbol(OP_SYMBOL(op), ic);
    }
    else {
	// A temporary.  Find where the temporary is stored and setup an asmop for it.
	op->aop = _newForTemporary(op, ic);
    }
}

/** Creates a new asmop that wraps the return value registers.
 */
asmop *izt_getAopForReturn(int size)
{
    asmop *aop = _new(AOP_TYPE_REG);
    aop->size = size;
    aop->u.reg = izt_port->returnRegs[izt_util_binLog(size)];

    return aop;
}

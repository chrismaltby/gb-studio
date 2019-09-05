#include "izt.h"
#include "gen.h"

static void _setupPointer(REG *reg, asmop *into, int offset)
{
    iemit("; _setupPointer for %s", reg->name);
}

void izt_putAop(asmop *into, const char *sz, int size, int offset)
{
    wassert(offset == 0);

    switch (into->type) {
    case AOP_TYPE_REG:
	iemit("mov %s,%s", into->u.reg->name, sz);
	break;
    case AOP_TYPE_CARRY:
	// Should support.
	wassert(0);
	break;

    case AOP_TYPE_SCRATCH_PTR:
	_setupPointer(izt_port->scratch, into, offset);
	iemit("mov a,%s", sz);
	iemit("mov %s,a", izt_port->scratch->name);
	break;

    case AOP_TYPE_STACK:
	iemit("mov a,%s", sz);
	iemit("mov (%s+%d),a", izt_port->base_ptr->name, into->u.stack);
	break;

    case AOP_TYPE_LITERAL:
    case AOP_TYPE_IMMEDIATE:
    default:
	wassert(0);
    }
}

char *izt_getAop(asmop *from, int size, int offset)
{
    return "blah";
}

/** Perform a generic move operation.
 */
static void _mov(asmop *into, asmop *from)
{
    int size = into->size;
    izt_putAop(into, izt_getAop(from, size, 0), size, 0);
}

static void _genLabel(iCode *ic)
{
    iemit("!tlabeldef", IC_LABEL(ic)->key + 100);
}

static void _genGoto(iCode *ic)
{
    iemit("jp !tlabel", IC_LABEL(ic)->key+100);
}

static void _genFunction(iCode *ic)
{
    symbol *sym = OP_SYMBOL(IC_LEFT(ic));

    // Create the function header
    iemit("!functionheader", sym->name);
    iemit("!functionlabeldef", sym->rname);

    if (sym->stack) {
	iemit("!enterx", sym->stack);
    }
  else
    {
      iemit ("!enter");
    }
}

static void _genEndFunction(iCode *ic)
{
    //    symbol *sym = OP_SYMBOL(IC_LEFT(ic));

    /* PENDING: calleeSave */

    iemit("!leave");
    iemit("ret");
}

static void
_genReturn (iCode * ic)
{
    if (IC_LEFT(ic)) {
	// Has a return value.  Load it up.
	izt_bindAop(IC_LEFT(ic), ic);
	_mov(izt_getAopForReturn(AOP_SIZE(IC_LEFT(ic))), AOP(IC_LEFT(ic)));
    }

  if (ic->next && ic->next->op == LABEL && IC_LABEL (ic->next) == returnLabel)
    {
      // The next label is the return label.  Dont bother emitting a jump.
    }
  else
    {
      iemit ("jp !tlabel", returnLabel->key + 100);
    }
}

static EMITTER _base_emitters[] = {
    { LABEL,		_genLabel },
    { GOTO,		_genGoto },
    { FUNCTION,		_genFunction },
    { RETURN,		_genReturn },
    { ENDFUNCTION,	_genEndFunction },
    { 0,		NULL }
};

void
izt_initBaseEmitters (hTab ** into)
{
  izt_addEmittersToHTab (into, _base_emitters);
}

/*-------------------------------------------------------------------------
  gen.c - Z80 specific code generator.
     
  Michael Hope <michaelh@juju.net.nz> 2000
  Based on the mcs51 generator -
      Sandeep Dutta . sandeep.dutta@usa.net (1998)
   and -  Jean-Louis VERN.jlvern@writeme.com (1999)

  This program is free software; you can redistribute it and/or modify it
  under the terms of the GNU General Public License as published by the
  Free Software Foundation; either version 2, or (at your option) any
  later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.


  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software
  Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.

  In other words, you are welcome to use, share and improve this program.
  You are forbidden to forbid anyone else to use, share and improve
  what you give them.   Help stamp out software-hoarding!

-------------------------------------------------------------------------*/

/*
  Benchmarks on dhry.c 2.1 with 32766 loops and a 10ms clock:
                                       ticks dhry  size
  Base with asm strcpy / strcmp / memcpy: 23198 141 1A14
  Improved WORD push                    22784 144 19AE
  With label1 on                        22694 144 197E
  With label2 on                        22743 144 198A
  With label3 on                        22776 144 1999
  With label4 on                        22776 144 1999
  With all 'label' on                   22661 144 196F
  With loopInvariant on                 20919 156 19AB
  With loopInduction on                 Breaks    198B
  With all working on                   20796 158 196C
  Slightly better genCmp(signed)        20597 159 195B
  Better reg packing, first peephole    20038 163 1873
  With assign packing                   19281 165 1849
  5/3/00                                17741 185 17B6
  With reg params for mul and div       16234 202 162D

  1. Starting again at 3 Aug 01         34965  93 219C
   No asm strings
   Includes long mul/div in code
  2. Optimised memcpy for acc use       32102 102 226B
  3. Optimised strcpy for acc use	27819 117 2237
  3a Optimised memcpy fun
  4. Optimised strcmp fun		21999 149 2294
  5. Optimised strcmp further		21660 151 228C
  6. Optimised memcpy by unroling	20885 157 2201
  7. After turning loop induction on	19862 165 236D
  8. Same as 7 but with more info	
  9. With asm optimised strings		17030 192 2223

  10 and below are with asm strings off.
  
  Apparent advantage of turning on regparams:
  1.  Cost of push
        Decent case is push of a constant 
          - ld hl,#n; push hl: (10+11)*nargs
  2.  Cost of pull from stack
        Using asm with ld hl, etc
          - ld hl,#2; add hl,sp; (ld bc,(hl); hl+=2)*nargs
            10+11+(7+6+7+6)*nargs
  3.  Cost of fixing stack
          - pop hl*nargs
            10*nargs
  
  So cost is (10+11+7+6+7+10)*nargs+10+11 
      = 51*nargs+21
      = 123 for mul, div, strcmp, strcpy
  Saving of (98298+32766+32766+32766)*123 = 24181308
  At 192 d/s for 682411768t, speed up to 199.  Hmm.
*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#ifdef HAVE_SYS_ISA_DEFS_H
#include <sys/isa_defs.h>
#endif

#include "z80.h"
#include "SDCCglobl.h"
#include "SDCCpeeph.h"
#include "gen.h"
#include "SDCCglue.h"
#include "newalloc.h"

/* This is the down and dirty file with all kinds of kludgy & hacky
   stuff. This is what it is all about CODE GENERATION for a specific MCU.
   Some of the routines may be reusable, will have to see */

/* Z80 calling convention description.
   Parameters are passed right to left.  As the stack grows downwards,
   the parameters are arranged in left to right in memory.
   Parameters may be passed in the HL and DE registers with one
   parameter per pair.
   PENDING: What if the parameter is a long?
   Everything is caller saves. i.e. the caller must save any registers
   that it wants to preserve over the call.
   GB: The return value is returned in DEHL.  DE is normally used as a
   working register pair.  Caller saves allows it to be used for a
   return value.
   va args functions do not use register parameters.  All arguments
   are passed on the stack.
   IX is used as an index register to the top of the local variable
   area.  ix-0 is the top most local variable.
*/

enum 
{
  /* Set to enable debugging trace statements in the output assembly code. */
  DISABLE_DEBUG = 0
};

static char *_z80_return[] =
{"l", "h", "e", "d"};
static char *_gbz80_return[] =
{"e", "d", "l", "h"};
static char *_fReceive[] =
  { "c", "b", "e", "d" };

static char **_fReturn;
static char **_fTmp;

extern FILE *codeOutFile;

enum
  {
    INT8MIN = -128,
    INT8MAX = 127
  };

/** Enum covering all the possible register pairs.
 */
typedef enum
  {
    PAIR_INVALID,
    PAIR_AF,
    PAIR_BC,
    PAIR_DE,
    PAIR_HL,
    PAIR_IY,
    PAIR_IX,
    NUM_PAIRS
  } PAIR_ID;

static struct
{
  const char *name;
  const char *l;
  const char *h;
} _pairs[NUM_PAIRS] = {
  {    "??1", "?2", "?3" },
  {    "af", "f", "a" },
  {    "bc", "c", "b" },
  {    "de", "e", "d" },
  {    "hl", "l", "h" },
  {    "iy", "iy.l?", "iy.h?" },
  {    "ix", "ix.l?", "ix.h?" }
};

// PENDING
#define ACC_NAME	_pairs[PAIR_AF].h

enum 
  {
    LSB,
    MSB16,
    MSB24,
    MSB32
  };

/** Code generator persistent data.
 */
static struct 
{
  /** Used to optimised setting up of a pair by remebering what it
      contains and adjusting instead of reloading where possible.
  */
  struct 
  {
    AOP_TYPE last_type;
    const char *base;
    int offset;
  } pairs[NUM_PAIRS];
  struct 
  {
    int last;
    int pushed;
    int param_offset;
    int offset;
    int pushedBC;
    int pushedDE;
  } stack;
  int frameId;
  int receiveOffset;
  bool flushStatics;
  bool in_home;
  const char *lastFunctionName;

  set *sendSet;

  struct
  {
    /** TRUE if the registers have already been saved. */
    bool saved;
  } saves;

  struct 
  {
    lineNode *head;
    lineNode *current;
    int isInline;
    allocTrace trace;
  } lines;

  struct
  {
    allocTrace aops;
  } trace;
} _G;

static const char *aopGet (asmop * aop, int offset, bool bit16);

static PAIR_ID
_getTempPairId(void)
{
  if (IS_GB)
    {
      return PAIR_DE;
    }
  else
    {
      return PAIR_HL;
    }
}

static const char *
_getTempPairName(void)
{
  return _pairs[_getTempPairId()].name;
}

static void
_tidyUp (char *buf)
{
  /* Clean up the line so that it is 'prettier' */
  if (strchr (buf, ':'))
    {
      /* Is a label - cant do anything */
      return;
    }
  /* Change the first (and probably only) ' ' to a tab so
     everything lines up.
  */
  while (*buf)
    {
      if (*buf == ' ')
        {
          *buf = '\t';
          break;
        }
      buf++;
    }
}

static lineNode *
_newLineNode (char *line)
{
  lineNode *pl;

  pl = traceAlloc(&_G.lines.trace, Safe_alloc ( sizeof (lineNode)));
  pl->line = traceAlloc(&_G.lines.trace, Safe_strdup (line));

  return pl;
}

static void
_vemit2 (const char *szFormat, va_list ap)
{
  char buffer[256];

  tvsprintf (buffer, szFormat, ap);

  _tidyUp (buffer);
  _G.lines.current = (_G.lines.current ?
	      connectLine (_G.lines.current, _newLineNode (buffer)) :
	      (_G.lines.head = _newLineNode (buffer)));

  _G.lines.current->isInline = _G.lines.isInline;
}

static void
emit2 (const char *szFormat,...)
{
  va_list ap;

  va_start (ap, szFormat);

  _vemit2 (szFormat, ap);

  va_end (ap);
}

static void
emitDebug (const char *szFormat,...)
{
  if (!DISABLE_DEBUG)
    {
      va_list ap;
      
      va_start (ap, szFormat);
      
      _vemit2 (szFormat, ap);
      
      va_end (ap);
    }
}

/*-----------------------------------------------------------------*/
/* emit2 - writes the code into a file : for now it is simple    */
/*-----------------------------------------------------------------*/
void
_emit2 (const char *inst, const char *fmt,...)
{
  va_list ap;
  char lb[INITIAL_INLINEASM];
  char *lbp = lb;

  va_start (ap, fmt);

  if (*inst != '\0')
    {
      sprintf (lb, "%s\t", inst);
      vsprintf (lb + (strlen (lb)), fmt, ap);
    }
  else
    vsprintf (lb, fmt, ap);

  while (isspace (*lbp))
    lbp++;

  if (lbp && *lbp)
    {
      _G.lines.current = (_G.lines.current ?
                  connectLine (_G.lines.current, _newLineNode (lb)) :
                  (_G.lines.head = _newLineNode (lb)));
    }
  _G.lines.current->isInline = _G.lines.isInline;
  va_end (ap);
}

static void
_emitMove(const char *to, const char *from)
{
  if (strcasecmp(to, from) != 0) 
    {
      emit2("ld %s,%s", to, from);
    }
  else 
    {
      // Optimise it out.
      // Could leave this to the peephole, but sometimes the peephole is inhibited.
    }
}

static void
_moveA(const char *moveFrom)
{
    // Let the peephole optimiser take care of redundent loads
    _emitMove(ACC_NAME, moveFrom);
}

static void
_clearCarry(void)
{
    emit2("xor a,a");
}

const char *
getPairName (asmop * aop)
{
  if (aop->type == AOP_REG)
    {
      switch (aop->aopu.aop_reg[0]->rIdx)
	{
	case C_IDX:
	  return "bc";
	  break;
	case E_IDX:
	  return "de";
	  break;
	case L_IDX:
	  return "hl";
	  break;
	}
    }
  else if (aop->type == AOP_STR || aop->type == AOP_HLREG)
    {
      switch (*aop->aopu.aop_str[0])
	{
	case 'c':
	  return "bc";
	  break;
	case 'e':
	  return "de";
	  break;
	case 'l':
	  return "hl";
	  break;
	}
    }
  wassertl (0, "Tried to get the pair name of something that isn't a pair");
  return NULL;
}

static PAIR_ID
getPairId (asmop * aop)
{
  if (aop->size == 2)
    {
      if (aop->type == AOP_REG)
	{
	  if ((aop->aopu.aop_reg[0]->rIdx == C_IDX) && (aop->aopu.aop_reg[1]->rIdx == B_IDX))
	    {
	      return PAIR_BC;
	    }
	  if ((aop->aopu.aop_reg[0]->rIdx == E_IDX) && (aop->aopu.aop_reg[1]->rIdx == D_IDX))
	    {
	      return PAIR_DE;
	    }
	  if ((aop->aopu.aop_reg[0]->rIdx == L_IDX) && (aop->aopu.aop_reg[1]->rIdx == H_IDX))
	    {
	      return PAIR_HL;
	    }
	}
      if (aop->type == AOP_STR || aop->type == AOP_HLREG)
	{
	  if (!strcmp (aop->aopu.aop_str[0], "c") && !strcmp (aop->aopu.aop_str[1], "b"))
	    {
	      return PAIR_BC;
	    }
	  if (!strcmp (aop->aopu.aop_str[0], "e") && !strcmp (aop->aopu.aop_str[1], "d"))
	    {
	      return PAIR_DE;
	    }
	  if (!strcmp (aop->aopu.aop_str[0], "l") && !strcmp (aop->aopu.aop_str[1], "h"))
	    {
	      return PAIR_HL;
	    }
	}
    }
  return PAIR_INVALID;
}

/** Returns TRUE if the registers used in aop form a pair (BC, DE, HL) */
bool
isPair (asmop * aop)
{
  return (getPairId (aop) != PAIR_INVALID);
}

bool
isPtrPair (asmop * aop)
{
  PAIR_ID pairId = getPairId (aop);
  switch (pairId)
    {
    case PAIR_HL:
    case PAIR_IY:
    case PAIR_IX:
      return TRUE;
    default:
      return FALSE;
    }
}

static void
spillPair (PAIR_ID pairId)
{
  _G.pairs[pairId].last_type = AOP_INVALID;
  _G.pairs[pairId].base = NULL;
}

/** Push a register pair onto the stack */
void
genPairPush (asmop * aop)
{
  emit2 ("push %s", getPairName (aop));
}

static void
_push (PAIR_ID pairId)
{
  emit2 ("push %s", _pairs[pairId].name);
  _G.stack.pushed += 2;
}

static void
_pop (PAIR_ID pairId)
{
  emit2 ("pop %s", _pairs[pairId].name);
  _G.stack.pushed -= 2;
  spillPair (pairId);
}

/*-----------------------------------------------------------------*/
/* newAsmop - creates a new asmOp                                  */
/*-----------------------------------------------------------------*/
static asmop *
newAsmop (short type)
{
  asmop *aop;

  aop = traceAlloc(&_G.trace.aops, Safe_alloc (sizeof (asmop)));
  aop->type = type;
  return aop;
}

/*-----------------------------------------------------------------*/
/* aopForSym - for a true symbol                                   */
/*-----------------------------------------------------------------*/
static asmop *
aopForSym (iCode * ic, symbol * sym, bool result, bool requires_a)
{
  asmop *aop;
  memmap *space;

  wassert (ic);
  wassert (sym);
  wassert (sym->etype);

  space = SPEC_OCLS (sym->etype);

  /* if already has one */
  if (sym->aop)
    return sym->aop;

  /* Assign depending on the storage class */
  if (sym->onStack || sym->iaccess)
    {
      /* The pointer that is used depends on how big the offset is.
         Normally everything is AOP_STK, but for offsets of < -128 or
         > 127 on the Z80 an extended stack pointer is used.
      */
      if (IS_Z80 && (options.ommitFramePtr || sym->stack < INT8MIN || sym->stack > (int)(INT8MAX-getSize (sym->type))))
        {
          emitDebug ("; AOP_EXSTK for %s", sym->rname);
          sym->aop = aop = newAsmop (AOP_EXSTK);
        }
      else
        {
          emitDebug ("; AOP_STK for %s", sym->rname);
          sym->aop = aop = newAsmop (AOP_STK);
        }

      aop->size = getSize (sym->type);
      aop->aopu.aop_stk = sym->stack;
      return aop;
    }

  /* special case for a function */
  if (IS_FUNC (sym->type))
    {
      sym->aop = aop = newAsmop (AOP_IMMD);
      aop->aopu.aop_immd = traceAlloc(&_G.trace.aops, Safe_strdup (sym->rname));
      aop->size = 2;
      return aop;
    }

  if (IS_GB)
    {
      /* if it is in direct space */
      if (IN_REGSP (space) && !requires_a)
	{
	  sym->aop = aop = newAsmop (AOP_SFR);
	  aop->aopu.aop_dir = sym->rname;
	  aop->size = getSize (sym->type);
	  emitDebug ("; AOP_SFR for %s", sym->rname);
	  return aop;
	}
    }

  /* only remaining is far space */
  /* in which case DPTR gets the address */
  if (IS_GB)
    {
      emitDebug ("; AOP_HL for %s", sym->rname);
      sym->aop = aop = newAsmop (AOP_HL);
    }
  else
    {
      sym->aop = aop = newAsmop (AOP_IY);
    }
  aop->size = getSize (sym->type);
  aop->aopu.aop_dir = sym->rname;

  /* if it is in code space */
  if (IN_CODESPACE (space))
    aop->code = 1;

  return aop;
}

/*-----------------------------------------------------------------*/
/* aopForRemat - rematerialzes an object                           */
/*-----------------------------------------------------------------*/
static asmop *
aopForRemat (symbol * sym)
{
  char *s = buffer;
  iCode *ic = sym->rematiCode;
  asmop *aop = newAsmop (AOP_IMMD);

  while (1)
    {
      /* if plus or minus print the right hand side */
      if (ic->op == '+' || ic->op == '-')
	{
	  /* PENDING: for re-target */
	  sprintf (s, "0x%04x %c ", (int) operandLitValue (IC_RIGHT (ic)),
		   ic->op);
	  s += strlen (s);
	  ic = OP_SYMBOL (IC_LEFT (ic))->rematiCode;
	  continue;
	}
      /* we reached the end */
      sprintf (s, "%s", OP_SYMBOL (IC_LEFT (ic))->rname);
      break;
    }

  aop->aopu.aop_immd = traceAlloc(&_G.trace.aops, Safe_strdup(buffer));
  return aop;
}

/*-----------------------------------------------------------------*/
/* regsInCommon - two operands have some registers in common       */
/*-----------------------------------------------------------------*/
bool
regsInCommon (operand * op1, operand * op2)
{
  symbol *sym1, *sym2;
  int i;

  /* if they have registers in common */
  if (!IS_SYMOP (op1) || !IS_SYMOP (op2))
    return FALSE;

  sym1 = OP_SYMBOL (op1);
  sym2 = OP_SYMBOL (op2);

  if (sym1->nRegs == 0 || sym2->nRegs == 0)
    return FALSE;

  for (i = 0; i < sym1->nRegs; i++)
    {
      int j;
      if (!sym1->regs[i])
	continue;

      for (j = 0; j < sym2->nRegs; j++)
	{
	  if (!sym2->regs[j])
	    continue;

	  if (sym2->regs[j] == sym1->regs[i])
	    return TRUE;
	}
    }

  return FALSE;
}

/*-----------------------------------------------------------------*/
/* operandsEqu - equivalent                                        */
/*-----------------------------------------------------------------*/
bool
operandsEqu (operand * op1, operand * op2)
{
  symbol *sym1, *sym2;

  /* if they not symbols */
  if (!IS_SYMOP (op1) || !IS_SYMOP (op2))
    return FALSE;

  sym1 = OP_SYMBOL (op1);
  sym2 = OP_SYMBOL (op2);

  /* if both are itemps & one is spilt
     and the other is not then false */
  if (IS_ITEMP (op1) && IS_ITEMP (op2) &&
      sym1->isspilt != sym2->isspilt)
    return FALSE;

  /* if they are the same */
  if (sym1 == sym2)
    return 1;

  if (strcmp (sym1->rname, sym2->rname) == 0)
    return 2;


  /* if left is a tmp & right is not */
  if (IS_ITEMP (op1) &&
      !IS_ITEMP (op2) &&
      sym1->isspilt &&
      (sym1->usl.spillLoc == sym2))
    return 3;

  if (IS_ITEMP (op2) &&
      !IS_ITEMP (op1) &&
      sym2->isspilt &&
      sym1->level > 0 &&
      (sym2->usl.spillLoc == sym1))
    return 4;

  return FALSE;
}

/*-----------------------------------------------------------------*/
/* sameRegs - two asmops have the same registers                   */
/*-----------------------------------------------------------------*/
bool
sameRegs (asmop * aop1, asmop * aop2)
{
  int i;

  if (aop1->type == AOP_SFR ||
      aop2->type == AOP_SFR)
    return FALSE;

  if (aop1 == aop2)
    return TRUE;

  if (aop1->type != AOP_REG ||
      aop2->type != AOP_REG)
    return FALSE;

  if (aop1->size != aop2->size)
    return FALSE;

  for (i = 0; i < aop1->size; i++)
    if (aop1->aopu.aop_reg[i] !=
	aop2->aopu.aop_reg[i])
      return FALSE;

  return TRUE;
}

/*-----------------------------------------------------------------*/
/* aopOp - allocates an asmop for an operand  :                    */
/*-----------------------------------------------------------------*/
static void
aopOp (operand * op, iCode * ic, bool result, bool requires_a)
{
  asmop *aop;
  symbol *sym;
  int i;

  if (!op)
    return;

  /* if this a literal */
  if (IS_OP_LITERAL (op))
    {
      op->aop = aop = newAsmop (AOP_LIT);
      aop->aopu.aop_lit = op->operand.valOperand;
      aop->size = getSize (operandType (op));
      return;
    }

  /* if already has a asmop then continue */
  if (op->aop)
    return;

  /* if the underlying symbol has a aop */
  if (IS_SYMOP (op) && OP_SYMBOL (op)->aop)
    {
      op->aop = OP_SYMBOL (op)->aop;
      return;
    }

  /* if this is a true symbol */
  if (IS_TRUE_SYMOP (op))
    {
      op->aop = aopForSym (ic, OP_SYMBOL (op), result, requires_a);
      return;
    }

  /* this is a temporary : this has
     only four choices :
     a) register
     b) spillocation
     c) rematerialize
     d) conditional
     e) can be a return use only */

  sym = OP_SYMBOL (op);

  /* if the type is a conditional */
  if (sym->regType == REG_CND)
    {
      aop = op->aop = sym->aop = newAsmop (AOP_CRY);
      aop->size = 0;
      return;
    }

  /* if it is spilt then two situations
     a) is rematerialize
     b) has a spill location */
  if (sym->isspilt || sym->nRegs == 0)
    {
      /* rematerialize it NOW */
      if (sym->remat)
	{
	  sym->aop = op->aop = aop =
	    aopForRemat (sym);
	  aop->size = getSize (sym->type);
	  return;
	}

      if (sym->accuse)
	{
	  if (sym->accuse == ACCUSE_A)
	    {
	      aop = op->aop = sym->aop = newAsmop (AOP_ACC);
	      aop->size = getSize (sym->type);
              wassertl(aop->size == 1, "Internal error: Caching in A, but too big to fit in A");

              aop->aopu.aop_str[0] = _pairs[PAIR_AF].h;
	    }
	  else if (sym->accuse == ACCUSE_SCRATCH)
	    {
	      aop = op->aop = sym->aop = newAsmop (AOP_HLREG);
	      aop->size = getSize (sym->type);
              wassertl(aop->size <= 2, "Internal error: Caching in HL, but too big to fit in HL");
              aop->aopu.aop_str[0] = _pairs[PAIR_HL].l;
              aop->aopu.aop_str[1] = _pairs[PAIR_HL].h;
	    }
	  else 
              {
                  wassertl (0, "Marked as being allocated into A or HL but is actually in neither");
              }
	  return;
	}

      if (sym->ruonly)
	{
	  int i;
	  aop = op->aop = sym->aop = newAsmop (AOP_STR);
	  aop->size = getSize (sym->type);
	  for (i = 0; i < 4; i++)
	    aop->aopu.aop_str[i] = _fReturn[i];
	  return;
	}

      /* else spill location  */
      sym->aop = op->aop = aop =
	aopForSym (ic, sym->usl.spillLoc, result, requires_a);
      aop->size = getSize (sym->type);
      return;
    }

  /* must be in a register */
  sym->aop = op->aop = aop = newAsmop (AOP_REG);
  aop->size = sym->nRegs;
  for (i = 0; i < sym->nRegs; i++)
    aop->aopu.aop_reg[i] = sym->regs[i];
}

/*-----------------------------------------------------------------*/
/* freeAsmop - free up the asmop given to an operand               */
/*----------------------------------------------------------------*/
static void
freeAsmop (operand * op, asmop * aaop, iCode * ic)
{
  asmop *aop;

  if (!op)
    aop = aaop;
  else
    aop = op->aop;

  if (!aop)
    return;

  if (aop->freed)
    goto dealloc;

  aop->freed = 1;

  if (aop->type == AOP_PAIRPTR && IS_Z80 && aop->aopu.aop_pairId == PAIR_DE)
    {
      _pop (aop->aopu.aop_pairId);
    }

dealloc:
  /* all other cases just dealloc */
  if (op)
    {
      op->aop = NULL;
      if (IS_SYMOP (op))
	{
	  OP_SYMBOL (op)->aop = NULL;
	  /* if the symbol has a spill */
	  if (SPIL_LOC (op))
	    SPIL_LOC (op)->aop = NULL;
	}
    }

}

bool
isLitWord (asmop * aop)
{
  /*    if (aop->size != 2)
     return FALSE; */
  switch (aop->type)
    {
    case AOP_IMMD:
    case AOP_LIT:
      return TRUE;
    default:
      return FALSE;
    }
}

char *
aopGetLitWordLong (asmop * aop, int offset, bool with_hash)
{
  char *s = buffer;
  char *rs;

  /* depending on type */
  switch (aop->type)
    {
    case AOP_HL:
    case AOP_IY:
    case AOP_IMMD:
      /* PENDING: for re-target */
      if (with_hash)
        {
          tsprintf (s, "!hashedstr + %d", aop->aopu.aop_immd, offset);
        }
      else if (offset == 0)
        {
          tsprintf (s, "%s", aop->aopu.aop_immd);
        }
      else
        {
          tsprintf (s, "%s + %d", aop->aopu.aop_immd, offset);
        }
      return traceAlloc(&_G.trace.aops, Safe_strdup(s));

    case AOP_LIT:
      {
	value *val = aop->aopu.aop_lit;
	/* if it is a float then it gets tricky */
	/* otherwise it is fairly simple */
	if (!IS_FLOAT (val->type))
	  {
	    unsigned long v = (unsigned long) floatFromVal (val);

	    if (offset == 2)
              {
                v >>= 16;
              }
            else if (offset == 0)
              {
                // OK
              }
            else 
              {
                wassertl(0, "Encountered an invalid offset while fetching a literal");
              }

	    if (with_hash)
	      tsprintf (buffer, "!immedword", v);
	    else
	      tsprintf (buffer, "!constword", v);

            return traceAlloc(&_G.trace.aops, Safe_strdup(buffer));
	  }
	else
	  {
	    /* A float */
	    Z80_FLOAT f;
	    convertFloat (&f, floatFromVal (val));
	    if (with_hash)
	      tsprintf (buffer, "!immedword", f.w[offset / 2]);
	    else
	      tsprintf (buffer, "!constword", f.w[offset / 2]);
	    rs = Safe_calloc (1, strlen (buffer) + 1);
	    return strcpy (rs, buffer);
	  }
      }
    default:
      return NULL;
    }
}

char *
aopGetWord (asmop * aop, int offset)
{
  return aopGetLitWordLong (aop, offset, TRUE);
}

bool
isPtr (const char *s)
{
  if (!strcmp (s, "hl"))
    return TRUE;
  if (!strcmp (s, "ix"))
    return TRUE;
  if (!strcmp (s, "iy"))
    return TRUE;
  return FALSE;
}

static void
adjustPair (const char *pair, int *pold, int new)
{
  wassert (pair);

  while (*pold < new)
    {
      emit2 ("inc %s", pair);
      (*pold)++;
    }
  while (*pold > new)
    {
      emit2 ("dec %s", pair);
      (*pold)--;
    }
}

static void
spillCached (void)
{
  spillPair (PAIR_HL);
  spillPair (PAIR_IY);
}

static bool
requiresHL (asmop * aop)
{
  switch (aop->type)
    {
    case AOP_IY:
    case AOP_HL:
    case AOP_STK:
    case AOP_EXSTK:
    case AOP_HLREG:
      return TRUE;
    default:
      return FALSE;
    }
}

static void
fetchLitPair (PAIR_ID pairId, asmop * left, int offset)
{
  const char *l, *base;
  const char *pair = _pairs[pairId].name;
  l = aopGetLitWordLong (left, offset, FALSE);
  base = aopGetLitWordLong (left, 0, FALSE);
  wassert (l && pair && base);

  if (isPtr (pair))
    {
      if (pairId == PAIR_HL || pairId == PAIR_IY)
	{
	  if (_G.pairs[pairId].last_type == left->type)
	    {
	      if (_G.pairs[pairId].base && !strcmp (_G.pairs[pairId].base, base))
		{
		  if (pairId == PAIR_HL && abs (_G.pairs[pairId].offset - offset) < 3)
		    {
		      adjustPair (pair, &_G.pairs[pairId].offset, offset);
		      return;
		    }
		  if (pairId == PAIR_IY && (offset >= INT8MIN && offset <= INT8MAX))
		    {
		      return;
		    }
		}
	    }
	}
      _G.pairs[pairId].last_type = left->type;
      _G.pairs[pairId].base = traceAlloc(&_G.trace.aops, Safe_strdup (base));
      _G.pairs[pairId].offset = offset;
    }
  /* Both a lit on the right and a true symbol on the left */
  emit2 ("ld %s,!hashedstr", pair, l);
}

static void
fetchPairLong (PAIR_ID pairId, asmop * aop, int offset)
{
    /* if this is remateriazable */
    if (isLitWord (aop)) {
        fetchLitPair (pairId, aop, offset);
    }
    else {
        /* we need to get it byte by byte */
        if (pairId == PAIR_HL && IS_GB && requiresHL (aop)) {
            aopGet (aop, offset, FALSE);
            switch (aop->size - offset) {
            case 1:
                emit2 ("ld l,!*hl");
                emit2 ("ld h,!immedbyte", 0);
                            break;
            case 2:
              // PENDING: Requires that you are only fetching two bytes.
            case 4:
                emit2 ("!ldahli");
                emit2 ("ld h,!*hl");
                emit2 ("ld l,a");
                break;
            default:
              wassertl (0, "Attempted to fetch too much data into HL");
              break;
            }
        }
        else if (IS_Z80 && aop->type == AOP_IY) {
            /* Instead of fetching relative to IY, just grab directly
               from the address IY refers to */
            char *l = aopGetLitWordLong (aop, offset, FALSE);
            wassert (l);
            emit2 ("ld %s,(%s)", _pairs[pairId].name, l);

            if (aop->size < 2) {
                emit2("ld %s,!zero", _pairs[pairId].h);
            }
        }
        else {
            emit2 ("ld %s,%s", _pairs[pairId].l, aopGet (aop, offset, FALSE));
            emit2 ("ld %s,%s", _pairs[pairId].h, aopGet (aop, offset + 1, FALSE));
        }
        /* PENDING: check? */
        if (pairId == PAIR_HL)
            spillPair (PAIR_HL);
    }
}

static void
fetchPair (PAIR_ID pairId, asmop * aop)
{
  fetchPairLong (pairId, aop, 0);
}

static void
fetchHL (asmop * aop)
{
  fetchPair (PAIR_HL, aop);
}

static void
setupPairFromSP (PAIR_ID id, int offset)
{
  wassertl (id == PAIR_HL, "Setup relative to SP only implemented for HL");

  if (offset < INT8MIN || offset > INT8MAX)
    {
      emit2 ("ld hl,!immedword", offset);
      emit2 ("add hl,sp");
    }
  else
    {
      emit2 ("!ldahlsp", offset);
    }
}

static void
setupPair (PAIR_ID pairId, asmop * aop, int offset)
{
  switch (aop->type)
    {
    case AOP_IY:
      wassertl (pairId == PAIR_IY || pairId == PAIR_HL, "AOP_IY must be in IY or HL");
      fetchLitPair (pairId, aop, 0);
      break;

    case AOP_HL:
      wassertl (pairId == PAIR_HL, "AOP_HL must be in HL");
      
      fetchLitPair (pairId, aop, offset);
      _G.pairs[pairId].offset = offset;
      break;

    case AOP_EXSTK:
      wassertl (IS_Z80, "Only the Z80 has an extended stack");
      wassertl (pairId == PAIR_IY || pairId == PAIR_HL, "The Z80 extended stack must be in IY or HL");

      {
	int offset = aop->aopu.aop_stk + _G.stack.offset;

        if (_G.pairs[pairId].last_type == aop->type &&
            _G.pairs[pairId].offset == offset)
          {
            /* Already setup */
          }
        else
          {
            /* PENDING: Do this better. */
            sprintf (buffer, "%d", offset + _G.stack.pushed);
            emit2 ("ld %s,!hashedstr", _pairs[pairId].name, buffer);
            emit2 ("add %s,sp", _pairs[pairId].name);
            _G.pairs[pairId].last_type = aop->type;
            _G.pairs[pairId].offset = offset;
          }
      }
      break;

    case AOP_STK:
      {
	/* Doesnt include _G.stack.pushed */
	int abso = aop->aopu.aop_stk + offset + _G.stack.offset;
	if (aop->aopu.aop_stk > 0)
	  {
	    abso += _G.stack.param_offset;
	  }
	assert (pairId == PAIR_HL);
	/* In some cases we can still inc or dec hl */
	if (_G.pairs[pairId].last_type == AOP_STK && abs (_G.pairs[pairId].offset - abso) < 3)
	  {
	    adjustPair (_pairs[pairId].name, &_G.pairs[pairId].offset, abso);
	  }
	else
	  {
            setupPairFromSP (PAIR_HL, abso + _G.stack.pushed);
	  }
	_G.pairs[pairId].offset = abso;
	break;
      }

    case AOP_PAIRPTR:
      adjustPair (_pairs[pairId].name, &_G.pairs[pairId].offset, offset);
      break;
      
    default:
      wassert (0);
    }
  _G.pairs[pairId].last_type = aop->type;
}

static void
emitLabel (int key)
{
  emit2 ("!tlabeldef", key);
  spillCached ();
}

/*-----------------------------------------------------------------*/
/* aopGet - for fetching value of the aop                          */
/*-----------------------------------------------------------------*/
static const char *
aopGet (asmop * aop, int offset, bool bit16)
{
  char *s = buffer;

  /* offset is greater than size then zero */
  /* PENDING: this seems a bit screwed in some pointer cases. */
  if (offset > (aop->size - 1) &&
      aop->type != AOP_LIT) 
    {
      tsprintf (s, "!zero");
      return traceAlloc(&_G.trace.aops, Safe_strdup(s));
    }

  /* depending on type */
  switch (aop->type)
    {
    case AOP_IMMD:
      /* PENDING: re-target */
      if (bit16)
	tsprintf (s, "!immedwords", aop->aopu.aop_immd);
      else
	switch (offset)
	  {
	  case 2:
	    tsprintf (s, "!bankimmeds", aop->aopu.aop_immd);
	    break;
	  case 1:
	    tsprintf (s, "!msbimmeds", aop->aopu.aop_immd);
	    break;
	  case 0:
	    tsprintf (s, "!lsbimmeds", aop->aopu.aop_immd);
	    break;
	  default:
	    wassertl (0, "Fetching from beyond the limits of an immediate value.");
	  }

      return traceAlloc(&_G.trace.aops, Safe_strdup(s));

    case AOP_DIR:
      wassert (IS_GB);
      emit2 ("ld a,(%s+%d)", aop->aopu.aop_dir, offset);
      sprintf (s, "a");

      return traceAlloc(&_G.trace.aops, Safe_strdup(s));

    case AOP_SFR:
      wassert (IS_GB);
      emit2 ("ldh a,(%s+%d)", aop->aopu.aop_dir, offset);
      sprintf (s, "a");

      return traceAlloc(&_G.trace.aops, Safe_strdup(s));

    case AOP_REG:
      return aop->aopu.aop_reg[offset]->name;

    case AOP_HL:
      wassert (IS_GB);
      setupPair (PAIR_HL, aop, offset);
      tsprintf (s, "!*hl");

      return traceAlloc(&_G.trace.aops, Safe_strdup (s));

    case AOP_IY:
      wassert (IS_Z80);
      setupPair (PAIR_IY, aop, offset);
      tsprintf (s, "!*iyx", offset);

      return traceAlloc(&_G.trace.aops, Safe_strdup(s));

    case AOP_EXSTK:
      wassert (IS_Z80);
      setupPair (PAIR_IY, aop, offset);
      tsprintf (s, "!*iyx", offset, offset);

      return traceAlloc(&_G.trace.aops, Safe_strdup(s));

    case AOP_STK:
      if (IS_GB)
	{
	  setupPair (PAIR_HL, aop, offset);
	  tsprintf (s, "!*hl");
	}
      else
	{
	  if (aop->aopu.aop_stk >= 0)
	    offset += _G.stack.param_offset;
	  tsprintf (s, "!*ixx", aop->aopu.aop_stk + offset);
	}

      return traceAlloc(&_G.trace.aops, Safe_strdup(s));

    case AOP_CRY:
      wassertl (0, "Tried to fetch from a bit variable");

    case AOP_ACC:
      if (!offset)
	{
	  return "a";
	}
      else
        {
          tsprintf(s, "!zero");
          return traceAlloc(&_G.trace.aops, Safe_strdup(s));
        }

    case AOP_HLREG:
      wassert (offset < 2);
      return aop->aopu.aop_str[offset];

    case AOP_LIT:
      return aopLiteral (aop->aopu.aop_lit, offset);

    case AOP_SIMPLELIT:
      {
        unsigned long v = aop->aopu.aop_simplelit;
        
        v >>= (offset * 8);
        tsprintf (s, "!immedbyte", (unsigned int) v & 0xff);
        
        return traceAlloc(&_G.trace.aops, Safe_strdup(s));
      }
    case AOP_STR:
      aop->coff = offset;
      return aop->aopu.aop_str[offset];

    case AOP_PAIRPTR:
      setupPair (aop->aopu.aop_pairId, aop, offset);
      sprintf (s, "(%s)", _pairs[aop->aopu.aop_pairId].name);

      return traceAlloc(&_G.trace.aops, Safe_strdup(s));

    default:
      break;
    }
  wassertl (0, "aopget got unsupported aop->type");
  exit (0);
}

bool
isRegString (const char *s)
{
  if (!strcmp (s, "b") ||
      !strcmp (s, "c") ||
      !strcmp (s, "d") ||
      !strcmp (s, "e") ||
      !strcmp (s, "a") ||
      !strcmp (s, "h") ||
      !strcmp (s, "l"))
    return TRUE;
  return FALSE;
}

bool
isConstant (const char *s)
{
  /* This is a bit of a hack... */
  return (*s == '#' || *s == '$');
}

bool
canAssignToPtr (const char *s)
{
  if (isRegString (s))
    return TRUE;
  if (isConstant (s))
    return TRUE;
  return FALSE;
}

/*-----------------------------------------------------------------*/
/* aopPut - puts a string for a aop                                */
/*-----------------------------------------------------------------*/
static void
aopPut (asmop * aop, const char *s, int offset)
{
  char buffer2[256];

  if (aop->size && offset > (aop->size - 1))
    {
      werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
	      "aopPut got offset > aop->size");
      exit (0);
    }

  // PENDING
  tsprintf(buffer2, s);
  s = buffer2;

  /* will assign value to value */
  /* depending on where it is ofcourse */
  switch (aop->type)
    {
    case AOP_DIR:
      /* Direct.  Hmmm. */
      wassert (IS_GB);
      if (strcmp (s, "a"))
	emit2 ("ld a,%s", s);
      emit2 ("ld (%s+%d),a", aop->aopu.aop_dir, offset);
      break;

    case AOP_SFR:
      wassert (IS_GB);
      if (strcmp (s, "a"))
	emit2 ("ld a,%s", s);
      emit2 ("ldh (%s+%d),a", aop->aopu.aop_dir, offset);
      break;

    case AOP_REG:
      if (!strcmp (s, "!*hl"))
	emit2 ("ld %s,!*hl", aop->aopu.aop_reg[offset]->name);
      else
	emit2 ("ld %s,%s",
	       aop->aopu.aop_reg[offset]->name, s);
      break;

    case AOP_IY:
      wassert (!IS_GB);
      if (!canAssignToPtr (s))
	{
	  emit2 ("ld a,%s", s);
          setupPair (PAIR_IY, aop, offset);
	  emit2 ("ld !*iyx,a", offset);
	}
      else
        {
          setupPair (PAIR_IY, aop, offset);
          emit2 ("ld !*iyx,%s", offset, s);
        }
      break;

    case AOP_HL:
      wassert (IS_GB);
      /* PENDING: for re-target */
      if (!strcmp (s, "!*hl") || !strcmp (s, "(hl)") || !strcmp (s, "[hl]"))
	{
	  emit2 ("ld a,!*hl");
	  s = "a";
	}
      setupPair (PAIR_HL, aop, offset);

      emit2 ("ld !*hl,%s", s);
      break;

    case AOP_EXSTK:
      wassert (!IS_GB);
      if (!canAssignToPtr (s))
	{
	  emit2 ("ld a,%s", s);
          setupPair (PAIR_IY, aop, offset);
	  emit2 ("ld !*iyx,a", offset);
	}
      else
        {
          setupPair (PAIR_IY, aop, offset);
          emit2 ("ld !*iyx,%s", offset, s);
        }
      break;

    case AOP_STK:
      if (IS_GB)
	{
	  /* PENDING: re-target */
	  if (!strcmp (s, "!*hl") || !strcmp (s, "(hl)") || !strcmp (s, "[hl]"))
	    {
	      emit2 ("ld a,!*hl");
	      s = "a";
	    }
	  setupPair (PAIR_HL, aop, offset);
	  if (!canAssignToPtr (s))
	    {
	      emit2 ("ld a,%s", s);
	      emit2 ("ld !*hl,a");
	    }
	  else
	    emit2 ("ld !*hl,%s", s);
	}
      else
	{
	  if (aop->aopu.aop_stk >= 0)
	    offset += _G.stack.param_offset;
	  if (!canAssignToPtr (s))
	    {
	      emit2 ("ld a,%s", s);
	      emit2 ("ld !*ixx,a", aop->aopu.aop_stk + offset);
	    }
	  else
	    emit2 ("ld !*ixx,%s", aop->aopu.aop_stk + offset, s);
	}
      break;

    case AOP_CRY:
      /* if bit variable */
      if (!aop->aopu.aop_dir)
	{
	  emit2 ("ld a,#0");
	  emit2 ("rla");
	}
      else
	{
	  /* In bit space but not in C - cant happen */
	  wassertl (0, "Tried to write into a bit variable");
	}
      break;

    case AOP_STR:
      aop->coff = offset;
      if (strcmp (aop->aopu.aop_str[offset], s))
	{
	  emit2 ("ld %s,%s", aop->aopu.aop_str[offset], s);
	}
      break;

    case AOP_ACC:
      aop->coff = offset;
      if (!offset && (strcmp (s, "acc") == 0))
	break;
      if (offset > 0)
	{
          wassertl (0, "Tried to access past the end of A");
	}
      else
	{
	  if (strcmp (aop->aopu.aop_str[offset], s))
	    emit2 ("ld %s,%s", aop->aopu.aop_str[offset], s);
	}
      break;

    case AOP_HLREG:
      wassert (offset < 2);
      emit2 ("ld %s,%s", aop->aopu.aop_str[offset], s);
      break;

    case AOP_PAIRPTR:
      setupPair (aop->aopu.aop_pairId, aop, offset);
      emit2 ("ld (%s),%s", _pairs[aop->aopu.aop_pairId].name, s);
      break;

    default:
      werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
	      "aopPut got unsupported aop->type");
      exit (0);
    }
}

#define AOP(op) op->aop
#define AOP_TYPE(op) AOP(op)->type
#define AOP_SIZE(op) AOP(op)->size
#define AOP_NEEDSACC(x) (AOP(x) && (AOP_TYPE(x) == AOP_CRY))

static void
commitPair (asmop * aop, PAIR_ID id)
{
  if (id == PAIR_HL && requiresHL (aop))
    {
      emit2 ("ld a,l");
      emit2 ("ld d,h");
      aopPut (aop, "a", 0);
      aopPut (aop, "d", 1);
    }
  else
    {
      aopPut (aop, _pairs[id].l, 0);
      aopPut (aop, _pairs[id].h, 1);
    }
}

/*-----------------------------------------------------------------*/
/* getDataSize - get the operand data size                         */
/*-----------------------------------------------------------------*/
int
getDataSize (operand * op)
{
  int size;
  size = AOP_SIZE (op);
  if (size == 3)
    {
      /* pointer */
      wassertl (0, "Somehow got a three byte data pointer");
    }
  return size;
}

/*-----------------------------------------------------------------*/
/* movLeft2Result - move byte from left to result                  */
/*-----------------------------------------------------------------*/
static void
movLeft2Result (operand * left, int offl,
		operand * result, int offr, int sign)
{
  const char *l;

  if (!sameRegs (AOP (left), AOP (result)) || (offl != offr))
    {
      l = aopGet (AOP (left), offl, FALSE);

      if (!sign)
	{
	  aopPut (AOP (result), l, offr);
	}
      else
	{
          if (getDataSize (left) == offl + 1)
            {
              emit2 ("ld a,%s", l);
              aopPut (AOP (result), "a", offr);
            }
	}
    }
}

static void
movLeft2ResultLong (operand * left, int offl,
		operand * result, int offr, int sign,
                int size)
{
  if (size == 1)
    {
      movLeft2Result (left, offl, result, offr, sign);
    }
  else
    {
      wassertl (offl == 0 && offr == 0, "Only implemented for zero offset");
      wassertl (size == 2, "Only implemented for two bytes or one");

      if ( IS_GB && requiresHL ( AOP (left)) && getPairId ( AOP (result)) == PAIR_HL)
        {
          emit2 ("ld a,%s", aopGet (AOP (left), LSB, FALSE));
          emit2 ("ld h,%s", aopGet (AOP (left), MSB16, FALSE));
          emit2 ("ld l,a");
        }
      else
        {
          movLeft2Result (left, offl, result, offr, sign);
          movLeft2Result (left, offl+1, result, offr+1, sign);
        }
    }
}

/** Put Acc into a register set
 */
void
outAcc (operand * result)
{
  int size, offset;
  size = getDataSize (result);
  if (size)
    {
      aopPut (AOP (result), "a", 0);
      size--;
      offset = 1;
      /* unsigned or positive */
      while (size--)
	{
	  aopPut (AOP (result), "!zero", offset++);
	}
    }
}

/** Take the value in carry and put it into a register
 */
void
outBitCLong (operand * result, bool swap_sense)
{
  /* if the result is bit */
  if (AOP_TYPE (result) == AOP_CRY)
    {
      wassertl (0, "Tried to write carry to a bit");
    }
  else
    {
      emit2 ("ld a,!zero");
      emit2 ("rla");
      if (swap_sense)
	emit2 ("xor a,!immedbyte", 1);
      outAcc (result);
    }
}

void
outBitC (operand * result)
{
  outBitCLong (result, FALSE);
}

/*-----------------------------------------------------------------*/
/* toBoolean - emit code for orl a,operator(sizeop)                */
/*-----------------------------------------------------------------*/
void
_toBoolean (operand * oper)
{
  int size = AOP_SIZE (oper);
  int offset = 0;
  if (size > 1)
    {
      emit2 ("ld a,%s", aopGet (AOP (oper), offset++, FALSE));
      size--;
      while (size--)
	emit2 ("or a,%s", aopGet (AOP (oper), offset++, FALSE));
    }
  else
    {
      if (AOP (oper)->type != AOP_ACC)
	{
	  _clearCarry();
	  emit2 ("or a,%s", aopGet (AOP (oper), 0, FALSE));
	}
    }
}

/*-----------------------------------------------------------------*/
/* genNot - generate code for ! operation                          */
/*-----------------------------------------------------------------*/
static void
genNot (iCode * ic)
{
  sym_link *optype = operandType (IC_LEFT (ic));

  /* assign asmOps to operand & result */
  aopOp (IC_LEFT (ic), ic, FALSE, TRUE);
  aopOp (IC_RESULT (ic), ic, TRUE, FALSE);

  /* if in bit space then a special case */
  if (AOP_TYPE (IC_LEFT (ic)) == AOP_CRY)
    {
      wassertl (0, "Tried to negate a bit");
    }

  /* if type float then do float */
  if (IS_FLOAT (optype))
    {
      wassertl (0, "Tried to negate a float");
    }

  _toBoolean (IC_LEFT (ic));

  /* Not of A:
     If A == 0, !A = 1
     else A = 0
     So if A = 0, A-1 = 0xFF and C is set, rotate C into reg. */
  emit2 ("sub a,!one");
  outBitC (IC_RESULT (ic));

  /* release the aops */
  freeAsmop (IC_LEFT (ic), NULL, ic);
  freeAsmop (IC_RESULT (ic), NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genCpl - generate code for complement                           */
/*-----------------------------------------------------------------*/
static void
genCpl (iCode * ic)
{
  int offset = 0;
  int size;


  /* assign asmOps to operand & result */
  aopOp (IC_LEFT (ic), ic, FALSE, FALSE);
  aopOp (IC_RESULT (ic), ic, TRUE, FALSE);

  /* if both are in bit space then
     a special case */
  if (AOP_TYPE (IC_RESULT (ic)) == AOP_CRY &&
      AOP_TYPE (IC_LEFT (ic)) == AOP_CRY)
    {
      wassertl (0, "Left and the result are in bit space");
    }

  size = AOP_SIZE (IC_RESULT (ic));
  while (size--)
    {
      const char *l = aopGet (AOP (IC_LEFT (ic)), offset, FALSE);
      _moveA (l);
      emit2("cpl");
      aopPut (AOP (IC_RESULT (ic)), "a", offset++);
    }

  /* release the aops */
  freeAsmop (IC_LEFT (ic), NULL, ic);
  freeAsmop (IC_RESULT (ic), NULL, ic);
}

static void
_gbz80_emitAddSubLongLong (iCode *ic, asmop *left, asmop *right, bool isAdd)
{
  /* Logic:
       ld de,right.lw
       setup hl to left
       de = hl - de
       push flags
       store de into result
       pop flags
       ld de,right.hw
       setup hl
       de = hl -de
       store de into result
  */
  const char *first = isAdd ? "add" : "sub";
  const char *later = isAdd ? "adc" : "sbc";

  wassertl (IS_GB, "Code is only relevent to the gbz80");
  wassertl (AOP( IC_RESULT (ic))->size == 4, "Only works for four bytes");

  fetchPair (PAIR_DE, left);

  emit2 ("ld a,e");
  emit2 ("%s a,%s", first, aopGet( right, LSB, FALSE));
  emit2 ("ld e,a");
  emit2 ("ld a,d");
  emit2 ("%s a,%s", later, aopGet( right, MSB16, FALSE));

  _push (PAIR_AF);
  aopPut ( AOP (IC_RESULT (ic)), "a", MSB16);
  aopPut ( AOP (IC_RESULT (ic)), "e", LSB);

  fetchPairLong (PAIR_DE, left, MSB24);
  aopGet (right, MSB24, FALSE);

  _pop (PAIR_AF);
  emit2 ("ld a,e");
  emit2 ("%s a,%s", later, aopGet( right, MSB24, FALSE));
  emit2 ("ld e,a");
  emit2 ("ld a,d");
  emit2 ("%s a,%s", later, aopGet( right, MSB32, FALSE));

  aopPut ( AOP (IC_RESULT (ic)), "a", MSB32);
  aopPut ( AOP (IC_RESULT (ic)), "e", MSB24);
}

static void
_gbz80_emitAddSubLong (iCode *ic, bool isAdd)
{
  _gbz80_emitAddSubLongLong (ic, AOP (IC_LEFT (ic)), AOP (IC_RIGHT (ic)), isAdd);
}

/*-----------------------------------------------------------------*/
/* genUminus - unary minus code generation                         */
/*-----------------------------------------------------------------*/
static void
genUminus (iCode * ic)
{
  int offset, size;
  sym_link *optype, *rtype;

  /* assign asmops */
  aopOp (IC_LEFT (ic), ic, FALSE, FALSE);
  aopOp (IC_RESULT (ic), ic, TRUE, FALSE);

  /* if both in bit space then special
     case */
  if (AOP_TYPE (IC_RESULT (ic)) == AOP_CRY &&
      AOP_TYPE (IC_LEFT (ic)) == AOP_CRY)
    {
      wassertl (0, "Left and right are in bit space");
      goto release;
    }

  optype = operandType (IC_LEFT (ic));
  rtype = operandType (IC_RESULT (ic));

  /* if float then do float stuff */
  if (IS_FLOAT (optype))
    {
      wassertl (0, "Tried to do a unary minus on a float");
      goto release;
    }

  /* otherwise subtract from zero */
  size = AOP_SIZE (IC_LEFT (ic));

  if (AOP_SIZE (IC_RESULT (ic)) == 4 && IS_GB)
    {
      /* Create a new asmop with value zero */
      asmop *azero = newAsmop (AOP_SIMPLELIT);
      azero->aopu.aop_simplelit = 0;
      azero->size = size;
      _gbz80_emitAddSubLongLong (ic, azero, AOP (IC_LEFT (ic)), FALSE);
      goto release;
    }

  offset = 0;
  _clearCarry();
  while (size--)
    {
      const char *l = aopGet (AOP (IC_LEFT (ic)), offset, FALSE);
      emit2 ("ld a,!zero");
      emit2 ("sbc a,%s", l);
      aopPut (AOP (IC_RESULT (ic)), "a", offset++);
    }

  /* if any remaining bytes in the result */
  /* we just need to propagate the sign   */
  if ((size = (AOP_SIZE (IC_RESULT (ic)) - AOP_SIZE (IC_LEFT (ic)))))
    {
      emit2 ("rlc a");
      emit2 ("sbc a,a");
      while (size--)
	aopPut (AOP (IC_RESULT (ic)), "a", offset++);
    }

release:
  /* release the aops */
  freeAsmop (IC_LEFT (ic), NULL, ic);
  freeAsmop (IC_RESULT (ic), NULL, ic);
}

/*-----------------------------------------------------------------*/
/* assignResultValue -               */
/*-----------------------------------------------------------------*/
void
assignResultValue (operand * oper)
{
  int size = AOP_SIZE (oper);
  bool topInA = 0;

  wassertl (size <= 4, "Got a result that is bigger than four bytes");
  topInA = requiresHL (AOP (oper));

  if (IS_GB && size == 4 && requiresHL (AOP (oper)))
    {
      /* We do it the hard way here. */
      _push (PAIR_HL);
      aopPut (AOP (oper), _fReturn[0], 0);
      aopPut (AOP (oper), _fReturn[1], 1);
      _pop (PAIR_DE);
      aopPut (AOP (oper), _fReturn[0], 2);
      aopPut (AOP (oper), _fReturn[1], 3);
    }
  else
    {
      while (size--)
	{
	  aopPut (AOP (oper), _fReturn[size], size);
	}
    }
}

/** Simple restore that doesn't take into account what is used in the
    return.
*/
static void
_restoreRegsAfterCall(void)
{
  if (_G.stack.pushedDE)
    {
      _pop ( PAIR_DE);
      _G.stack.pushedDE = FALSE;
    }
  if (_G.stack.pushedBC)
    {
      _pop ( PAIR_BC);
      _G.stack.pushedBC = FALSE;
    }
  _G.saves.saved = FALSE;
}

static void
_saveRegsForCall(iCode *ic, int sendSetSize)
{
  /* Rules:
      o Stack parameters are pushed before this function enters
      o DE and BC may be used in this function.
      o HL and DE may be used to return the result.
      o HL and DE may be used to send variables.
      o DE and BC may be used to store the result value.
      o HL may be used in computing the sent value of DE
      o The iPushes for other parameters occur before any addSets

     Logic: (to be run inside the first iPush or if none, before sending)
      o Compute if DE and/or BC are in use over the call
      o Compute if DE is used in the send set
      o Compute if DE and/or BC are used to hold the result value
      o If (DE is used, or in the send set) and is not used in the result, push.
      o If BC is used and is not in the result, push
      o 
      o If DE is used in the send set, fetch
      o If HL is used in the send set, fetch
      o Call
      o ...
  */
  if (_G.saves.saved == FALSE) {
    bool deInUse, bcInUse;
    bool deSending;
    bool bcInRet = FALSE, deInRet = FALSE;
    bitVect *rInUse;

    rInUse = bitVectCplAnd (bitVectCopy (ic->rMask), ic->rUsed);

    deInUse = bitVectBitValue (rInUse, D_IDX) || bitVectBitValue(rInUse, E_IDX);
    bcInUse = bitVectBitValue (rInUse, B_IDX) || bitVectBitValue(rInUse, C_IDX);

    deSending = (sendSetSize > 1);

    emitDebug ("; _saveRegsForCall: sendSetSize: %u deInUse: %u bcInUse: %u deSending: %u", sendSetSize, deInUse, bcInUse, deSending);

    if (bcInUse && bcInRet == FALSE) {
      _push(PAIR_BC);
      _G.stack.pushedBC = TRUE;
    }
    if (deInUse && deInRet == FALSE) {
      _push(PAIR_DE);
      _G.stack.pushedDE = TRUE;
    }

    _G.saves.saved = TRUE;
  }
  else {
    /* Already saved. */
  }
}

/*-----------------------------------------------------------------*/
/* genIpush - genrate code for pushing this gets a little complex  */
/*-----------------------------------------------------------------*/
static void
genIpush (iCode * ic)
{
  int size, offset = 0;
  const char *l;

  /* if this is not a parm push : ie. it is spill push
     and spill push is always done on the local stack */
  if (!ic->parmPush)
    {
      wassertl(0, "Encountered an unsupported spill push.");
      return;
    }

  if (_G.saves.saved == FALSE) {
    /* Caller saves, and this is the first iPush. */
    /* Scan ahead until we find the function that we are pushing parameters to.
       Count the number of addSets on the way to figure out what registers
       are used in the send set.
    */
    int nAddSets = 0;
    iCode *walk = ic->next;
    
    while (walk) {
      if (walk->op == SEND) {
        nAddSets++;
      }
      else if (walk->op == CALL || walk->op == PCALL) {
        /* Found it. */
        break;
      }
      else {
        /* Keep looking. */
      }
      walk = walk->next;
    }
    _saveRegsForCall(walk, nAddSets);
  }
  else {
    /* Already saved by another iPush. */
  }

  /* then do the push */
  aopOp (IC_LEFT (ic), ic, FALSE, FALSE);

  size = AOP_SIZE (IC_LEFT (ic));

  if (isPair (AOP (IC_LEFT (ic))))
    {
      _G.stack.pushed += 2;
      emit2 ("push %s", getPairName (AOP (IC_LEFT (ic))));
    }
  else
    {
      if (size == 2)
	{
	  fetchHL (AOP (IC_LEFT (ic)));
	  emit2 ("push hl");
	  spillPair (PAIR_HL);
	  _G.stack.pushed += 2;
	  goto release;
	}
      if (size == 4)
	{
	  fetchPairLong (PAIR_HL, AOP (IC_LEFT (ic)), 2);
	  emit2 ("push hl");
	  spillPair (PAIR_HL);
	  _G.stack.pushed += 2;
	  fetchPairLong (PAIR_HL, AOP (IC_LEFT (ic)), 0);
	  emit2 ("push hl");
	  spillPair (PAIR_HL);
	  _G.stack.pushed += 2;
	  goto release;
	}
      offset = size;
      while (size--)
	{
	  if (AOP (IC_LEFT (ic))->type == AOP_IY)
	    {
	      char *l = aopGetLitWordLong (AOP (IC_LEFT (ic)), --offset, FALSE);
	      wassert (l);
	      emit2 ("ld a,(%s)", l);
	    }
	  else
	    {
	      l = aopGet (AOP (IC_LEFT (ic)), --offset, FALSE);
	      emit2 ("ld a,%s", l);
	    }
	  emit2 ("push af");
	  emit2 ("inc sp");
	  _G.stack.pushed++;
	}
    }
release:
  freeAsmop (IC_LEFT (ic), NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genIpop - recover the registers: can happen only for spilling   */
/*-----------------------------------------------------------------*/
static void
genIpop (iCode * ic)
{
  int size, offset;


  /* if the temp was not pushed then */
  if (OP_SYMBOL (IC_LEFT (ic))->isspilt)
    return;

  aopOp (IC_LEFT (ic), ic, FALSE, FALSE);
  size = AOP_SIZE (IC_LEFT (ic));
  offset = (size - 1);
  if (isPair (AOP (IC_LEFT (ic))))
    {
      emit2 ("pop %s", getPairName (AOP (IC_LEFT (ic))));
    }
  else
    {
      while (size--)
	{
	  emit2 ("dec sp");
	  emit2 ("pop hl");
	  spillPair (PAIR_HL);
	  aopPut (AOP (IC_LEFT (ic)), "l", offset--);
	}
    }

  freeAsmop (IC_LEFT (ic), NULL, ic);
}

/* This is quite unfortunate */
static void
setArea (int inHome)
{
  /*
    static int lastArea = 0;

     if (_G.in_home != inHome) {
     if (inHome) {
     const char *sz = port->mem.code_name;
     port->mem.code_name = "HOME";
     emit2("!area", CODE_NAME);
     port->mem.code_name = sz;
     }
     else
     emit2("!area", CODE_NAME); */
  _G.in_home = inHome;
  //    }
}

static bool
isInHome (void)
{
  return _G.in_home;
}

static int
_opUsesPair (operand * op, iCode * ic, PAIR_ID pairId)
{
  int ret = 0;
  asmop *aop;
  symbol *sym = OP_SYMBOL (op);

  if (sym->isspilt || sym->nRegs == 0)
    return 0;

  aopOp (op, ic, FALSE, FALSE);

  aop = AOP (op);
  if (aop->type == AOP_REG)
    {
      int i;
      for (i = 0; i < aop->size; i++)
	{
	  if (pairId == PAIR_DE)
	    {
	      emitDebug ("; name %s", aop->aopu.aop_reg[i]->name);
	      if (!strcmp (aop->aopu.aop_reg[i]->name, "e"))
		ret++;
	      if (!strcmp (aop->aopu.aop_reg[i]->name, "d"))
		ret++;
	    }
          else if (pairId == PAIR_BC)
            {
	      emitDebug ("; name %s", aop->aopu.aop_reg[i]->name);
	      if (!strcmp (aop->aopu.aop_reg[i]->name, "c"))
		ret++;
	      if (!strcmp (aop->aopu.aop_reg[i]->name, "b"))
		ret++;
            }
	  else
	    {
	      wassert (0);
	    }
	}
    }

  freeAsmop (IC_LEFT (ic), NULL, ic);
  return ret;
}

/** Emit the code for a call statement
 */
static void
emitCall (iCode * ic, bool ispcall)
{
  sym_link *dtype = operandType (IC_LEFT (ic));

  bitVect *rInUse = bitVectCplAnd (bitVectCopy (ic->rMask), ic->rUsed);

  /* if caller saves & we have not saved then */
  if (!ic->regsSaved)
    {
      /* PENDING */
    }

  _saveRegsForCall(ic, _G.sendSet ? elementsInSet(_G.sendSet) : 0);

  /* if send set is not empty then assign */
  if (_G.sendSet)
    {
      iCode *sic;
      int send = 0;
      int nSend = elementsInSet(_G.sendSet);
      bool swapped = FALSE;

      int _z80_sendOrder[] = {
        PAIR_BC, PAIR_DE
      };

      if (nSend > 1) {
        /* Check if the parameters are swapped.  If so route through hl instead. */
        wassertl (nSend == 2, "Pedantic check.  Code only checks for the two send items case.");

        sic = setFirstItem(_G.sendSet);
        sic = setNextItem(_G.sendSet);

        if (_opUsesPair (IC_LEFT(sic), sic, _z80_sendOrder[0])) {
          /* The second send value is loaded from one the one that holds the first
             send, i.e. it is overwritten. */
          /* Cache the first in HL, and load the second from HL instead. */
          emit2 ("ld h,%s", _pairs[_z80_sendOrder[0]].h);
          emit2 ("ld l,%s", _pairs[_z80_sendOrder[0]].l);

          swapped = TRUE;
        }
      }

      for (sic = setFirstItem (_G.sendSet); sic;
           sic = setNextItem (_G.sendSet))
        {
          int size;
          aopOp (IC_LEFT (sic), sic, FALSE, FALSE);

          size = AOP_SIZE (IC_LEFT (sic));
          wassertl (size <= 2, "Tried to send a parameter that is bigger than two bytes");
          wassertl (_z80_sendOrder[send] != PAIR_INVALID, "Tried to send more parameters than we have registers for");

          // PENDING: Mild hack
          if (swapped == TRUE && send == 1) {
            if (size > 1) {
              emit2 ("ld %s,h", _pairs[_z80_sendOrder[send]].h);
            }
            else {
              emit2 ("ld %s,!zero", _pairs[_z80_sendOrder[send]].h);
            }
            emit2 ("ld %s,l", _pairs[_z80_sendOrder[send]].l);
          }
          else {
            fetchPair(_z80_sendOrder[send], AOP (IC_LEFT (sic)));
          }

          send++;
          freeAsmop (IC_LEFT (sic), NULL, sic);
        }
      _G.sendSet = NULL;
    }

  if (ispcall)
    {
      if (IFFUNC_ISBANKEDCALL (dtype) && !SPEC_STAT(getSpec(dtype)))
	{
	  werror (W_INDIR_BANKED);
	}
      aopOp (IC_LEFT (ic), ic, FALSE, FALSE);

      if (isLitWord (AOP (IC_LEFT (ic))))
	{
	  emit2 ("call %s", aopGetLitWordLong (AOP (IC_LEFT (ic)), 0, FALSE));
	}
      else
	{
	  symbol *rlbl = newiTempLabel (NULL);
	  spillPair (PAIR_HL);
	  emit2 ("ld hl,!immed!tlabel", (rlbl->key + 100));
	  emit2 ("push hl");
	  _G.stack.pushed += 2;

	  fetchHL (AOP (IC_LEFT (ic)));
	  emit2 ("jp !*hl");
	  emit2 ("!tlabeldef", (rlbl->key + 100));
	  _G.stack.pushed -= 2;
	}
      freeAsmop (IC_LEFT (ic), NULL, ic);
    }
  else
    {
      char *name = OP_SYMBOL (IC_LEFT (ic))->rname[0] ?
      OP_SYMBOL (IC_LEFT (ic))->rname :
      OP_SYMBOL (IC_LEFT (ic))->name;
      if (IFFUNC_ISBANKEDCALL (dtype) && !SPEC_STAT(getSpec(dtype)))
	{
	  emit2 ("call banked_call");
	  emit2 ("!dws", name);
	  emit2 ("!dw !bankimmeds", name);
	}
      else
	{
	  /* make the call */
	  emit2 ("call %s", name);
	}
    }
  spillCached ();

  /* Mark the regsiters as restored. */
  _G.saves.saved = FALSE;

  /* if we need assign a result value */
  if ((IS_ITEMP (IC_RESULT (ic)) &&
       (OP_SYMBOL (IC_RESULT (ic))->nRegs ||
	OP_SYMBOL (IC_RESULT (ic))->spildir)) ||
      IS_TRUE_SYMOP (IC_RESULT (ic)))
    {

      aopOp (IC_RESULT (ic), ic, FALSE, FALSE);

      assignResultValue (IC_RESULT (ic));

      freeAsmop (IC_RESULT (ic), NULL, ic);
    }

  /* adjust the stack for parameters if required */
  if (ic->parmBytes)
    {
      int i = ic->parmBytes;

      _G.stack.pushed -= i;
      if (IS_GB)
	{
	  emit2 ("!ldaspsp", i);
	}
      else
	{
	  spillCached ();
	  if (i > 6)
	    {
	      emit2 ("ld hl,#%d", i);
	      emit2 ("add hl,sp");
	      emit2 ("ld sp,hl");
	    }
	  else
	    {
	      while (i > 1)
		{
		  emit2 ("pop hl");
		  i -= 2;
		}
	      if (i)
		emit2 ("inc sp");
	    }
	}
    }

  spillCached ();

  if (_G.stack.pushedDE) 
    {
      bool dInUse = bitVectBitValue(rInUse, D_IDX);
      bool eInUse = bitVectBitValue(rInUse, E_IDX);

      if (dInUse && eInUse) 
        {
          _pop (PAIR_DE);
        }
      else if (dInUse)
        {
          _pop(PAIR_HL);
          emit2 ("ld d,h");
        }
      else if (eInUse)
        {
          _pop(PAIR_HL);
          emit2 ("ld e,l");
        }
      else
        {
          wassertl (0, "Neither D or E were in use but it was pushed.");
        }
      _G.stack.pushedDE = FALSE;
    }
  
  if (_G.stack.pushedBC) 
    {
      bool bInUse = bitVectBitValue(rInUse, B_IDX);
      bool cInUse = bitVectBitValue(rInUse, C_IDX);

      // If both B and C are used in the return value, then we won't get
      // here.
      if (bInUse && cInUse) 
        {
          _pop (PAIR_BC);
        }
      else if (bInUse)
        {
          _pop(PAIR_HL);
          emit2 ("ld b,h");
        }
      else if (cInUse)
        {
          _pop(PAIR_HL);
          emit2 ("ld c,l");
        }
      else
        {
          wassertl (0, "Neither B or C were in use but it was pushed.");
        }
      _G.stack.pushedBC = FALSE;
    }
}

/*-----------------------------------------------------------------*/
/* genCall - generates a call statement                            */
/*-----------------------------------------------------------------*/
static void
genCall (iCode * ic)
{
  emitCall (ic, FALSE);
}

/*-----------------------------------------------------------------*/
/* genPcall - generates a call by pointer statement                */
/*-----------------------------------------------------------------*/
static void
genPcall (iCode * ic)
{
  emitCall (ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* resultRemat - result  is rematerializable                       */
/*-----------------------------------------------------------------*/
static int
resultRemat (iCode * ic)
{
  if (SKIP_IC (ic) || ic->op == IFX)
    return 0;

  if (IC_RESULT (ic) && IS_ITEMP (IC_RESULT (ic)))
    {
      symbol *sym = OP_SYMBOL (IC_RESULT (ic));
      if (sym->remat && !POINTER_SET (ic))
	return 1;
    }

  return 0;
}

extern set *publics;

/*-----------------------------------------------------------------*/
/* genFunction - generated code for function entry                 */
/*-----------------------------------------------------------------*/
static void
genFunction (iCode * ic)
{
  symbol *sym = OP_SYMBOL (IC_LEFT (ic));
  sym_link *ftype;

#if CALLEE_SAVES
  bool bcInUse = FALSE;
  bool deInUse = FALSE;
#endif

  setArea (IFFUNC_NONBANKED (sym->type));

  /* PENDING: Reset the receive offset as it doesn't seem to get reset anywhere
     else.
  */
  _G.receiveOffset = 0;

  /* Record the last function name for debugging. */
  _G.lastFunctionName = sym->rname;
  
  /* Create the function header */
  emit2 ("!functionheader", sym->name);
  /* PENDING: portability. */
  emit2 ("__%s_start:", sym->rname);
  emit2 ("!functionlabeldef", sym->rname);

  if (options.profile) 
    {
      emit2 ("!profileenter");
    }

  ftype = operandType (IC_LEFT (ic));

  /* if critical function then turn interrupts off */
  if (IFFUNC_ISCRITICAL (ftype))
    emit2 ("!di");

  /* if this is an interrupt service routine then save all potentially used registers. */
  if (IFFUNC_ISISR (sym->type))
    {
      emit2 ("!pusha");
    }

  /* PENDING: callee-save etc */

  _G.stack.param_offset = 0;

#if CALLEE_SAVES
  /* Detect which registers are used. */
  if (sym->regsUsed)
    {
      int i;
      for (i = 0; i < sym->regsUsed->size; i++)
	{
	  if (bitVectBitValue (sym->regsUsed, i))
	    {
	      switch (i)
		{
		case C_IDX:
		case B_IDX:
                  bcInUse = TRUE;
		  break;
		case D_IDX:
		case E_IDX:
		  if (IS_Z80) {
                    deInUse = TRUE;
                  }
                  else {
                    /* Other systems use DE as a temporary. */
                  }
		  break;
		}
	    }
	}
    }

  if (bcInUse) 
    {
      emit2 ("push bc");
      _G.stack.param_offset += 2;
    }

  _G.stack.pushedBC = bcInUse;

  if (deInUse)
    {
      emit2 ("push de");
      _G.stack.param_offset += 2;
    }

  _G.stack.pushedDE = deInUse;
#endif

  /* adjust the stack for the function */
  _G.stack.last = sym->stack;

  if (sym->stack && IS_GB && sym->stack > -INT8MIN)
    emit2 ("!enterxl", sym->stack);
  else if (sym->stack)
    emit2 ("!enterx", sym->stack);
  else
    emit2 ("!enter");
  _G.stack.offset = sym->stack;
}

/*-----------------------------------------------------------------*/
/* genEndFunction - generates epilogue for functions               */
/*-----------------------------------------------------------------*/
static void
genEndFunction (iCode * ic)
{
  symbol *sym = OP_SYMBOL (IC_LEFT (ic));

  if (IFFUNC_ISISR (sym->type))
    {
      wassertl (0, "Tried to close an interrupt support function");
    }
  else
    {
      if (IFFUNC_ISCRITICAL (sym->type))
	emit2 ("!ei");

      /* PENDING: calleeSave */

      if (_G.stack.offset && IS_GB && _G.stack.offset > INT8MAX)
        {
          emit2 ("!leavexl", _G.stack.offset);
        }
      else if (_G.stack.offset)
        {
          emit2 ("!leavex", _G.stack.offset);
        }
      else
        {
          emit2 ("!leave");
        }

#if CALLEE_SAVES
      if (_G.stack.pushedDE) 
        {
          emit2 ("pop de");
          _G.stack.pushedDE = FALSE;
        }

      if (_G.stack.pushedDE) 
        {
          emit2 ("pop bc");
          _G.stack.pushedDE = FALSE;
        }
#endif

      if (options.profile) 
        {
          emit2 ("!profileexit");
        }


      /* Both baned and non-banked just ret */
      emit2 ("ret");

      /* PENDING: portability. */
      emit2 ("__%s_end:", sym->rname);
    }
  _G.flushStatics = 1;
  _G.stack.pushed = 0;
  _G.stack.offset = 0;
}

/*-----------------------------------------------------------------*/
/* genRet - generate code for return statement                     */
/*-----------------------------------------------------------------*/
static void
genRet (iCode * ic)
{
    const char *l;
  /* Errk.  This is a hack until I can figure out how
     to cause dehl to spill on a call */
  int size, offset = 0;

  /* if we have no return value then
     just generate the "ret" */
  if (!IC_LEFT (ic))
    goto jumpret;

  /* we have something to return then
     move the return value into place */
  aopOp (IC_LEFT (ic), ic, FALSE, FALSE);
  size = AOP_SIZE (IC_LEFT (ic));

  if ((size == 2) && ((l = aopGetWord (AOP (IC_LEFT (ic)), 0))))
    {
      if (IS_GB)
	{
	  emit2 ("ld de,%s", l);
	}
      else
	{
	  emit2 ("ld hl,%s", l);
	}
    }
  else
    {
      if (IS_GB && size == 4 && requiresHL (AOP (IC_LEFT (ic))))
	{
	  fetchPair (PAIR_DE, AOP (IC_LEFT (ic)));
	  fetchPairLong (PAIR_HL, AOP (IC_LEFT (ic)), 2);
	}
      else
	{
	  while (size--)
	    {
	      l = aopGet (AOP (IC_LEFT (ic)), offset,
			  FALSE);
	      if (strcmp (_fReturn[offset], l))
		emit2 ("ld %s,%s", _fReturn[offset++], l);
	    }
	}
    }
  freeAsmop (IC_LEFT (ic), NULL, ic);

jumpret:
  /* generate a jump to the return label
     if the next is not the return statement */
  if (!(ic->next && ic->next->op == LABEL &&
	IC_LABEL (ic->next) == returnLabel))

    emit2 ("jp !tlabel", returnLabel->key + 100);
}

/*-----------------------------------------------------------------*/
/* genLabel - generates a label                                    */
/*-----------------------------------------------------------------*/
static void
genLabel (iCode * ic)
{
  /* special case never generate */
  if (IC_LABEL (ic) == entryLabel)
    return;

  emitLabel (IC_LABEL (ic)->key + 100);
}

/*-----------------------------------------------------------------*/
/* genGoto - generates a ljmp                                      */
/*-----------------------------------------------------------------*/
static void
genGoto (iCode * ic)
{
  emit2 ("jp !tlabel", IC_LABEL (ic)->key + 100);
}

/*-----------------------------------------------------------------*/
/* genPlusIncr :- does addition with increment if possible         */
/*-----------------------------------------------------------------*/
static bool
genPlusIncr (iCode * ic)
{
  unsigned int icount;
  unsigned int size = getDataSize (IC_RESULT (ic));
  PAIR_ID resultId = getPairId (AOP (IC_RESULT (ic)));

  /* will try to generate an increment */
  /* if the right side is not a literal
     we cannot */
  if (AOP_TYPE (IC_RIGHT (ic)) != AOP_LIT)
    return FALSE;

  emitDebug ("; genPlusIncr");

  icount = (unsigned int) floatFromVal (AOP (IC_RIGHT (ic))->aopu.aop_lit);

  /* If result is a pair */
  if (resultId != PAIR_INVALID)
    {
      if (isLitWord (AOP (IC_LEFT (ic))))
	{
          fetchLitPair (getPairId (AOP (IC_RESULT (ic))), AOP (IC_LEFT (ic)), icount);
	  return TRUE;
	}
      if (isPair (AOP (IC_LEFT (ic))) && resultId == PAIR_HL && icount > 2)
	{
	  fetchPair (resultId, AOP (IC_RIGHT (ic)));
	  emit2 ("add hl,%s", getPairName (AOP (IC_LEFT (ic))));
	  return TRUE;
	}
      if (icount > 5)
	return FALSE;
      /* Inc a pair */
      if (!sameRegs (AOP (IC_LEFT (ic)), AOP (IC_RESULT (ic))))
	{
	  if (icount > 2)
	    return FALSE;
	  movLeft2ResultLong (IC_LEFT (ic), 0, IC_RESULT (ic), 0, 0, 2);
	}
      while (icount--)
	{
	  emit2 ("inc %s", getPairName (AOP (IC_RESULT (ic))));
	}
      return TRUE;
    }

  /* if the literal value of the right hand side
     is greater than 4 then it is not worth it */
  if (icount > 4)
    return FALSE;

  /* if increment 16 bits in register */
  if (sameRegs (AOP (IC_LEFT (ic)), AOP (IC_RESULT (ic))) &&
      size > 1 &&
      icount == 1
    )
    {
      int offset = 0;
      symbol *tlbl = NULL;
      tlbl = newiTempLabel (NULL);
      while (size--)
	{
	  emit2 ("inc %s", aopGet (AOP (IC_RESULT (ic)), offset++, FALSE));
	  if (size)
	    {
	      emit2 ("!shortjp nz,!tlabel", tlbl->key + 100);
	    }
	}
      emitLabel (tlbl->key + 100);
      return TRUE;
    }

  /* if the sizes are greater than 1 then we cannot */
  if (AOP_SIZE (IC_RESULT (ic)) > 1 ||
      AOP_SIZE (IC_LEFT (ic)) > 1)
    return FALSE;

  /* If the result is in a register then we can load then increment.
   */
  if (AOP_TYPE (IC_RESULT (ic)) == AOP_REG)
    {
      aopPut (AOP (IC_RESULT (ic)), aopGet (AOP (IC_LEFT (ic)), LSB, FALSE), LSB);
      while (icount--)
        {
          emit2 ("inc %s", aopGet (AOP (IC_RESULT (ic)), LSB, FALSE));
        }
      return TRUE;
    }

  /* we can if the aops of the left & result match or
     if they are in registers and the registers are the
     same */
  if (sameRegs (AOP (IC_LEFT (ic)), AOP (IC_RESULT (ic))))
    {
      while (icount--)
        {
          emit2 ("inc %s", aopGet (AOP (IC_LEFT (ic)), 0, FALSE));
        }
      return TRUE;
    }

  return FALSE;
}

/*-----------------------------------------------------------------*/
/* outBitAcc - output a bit in acc                                 */
/*-----------------------------------------------------------------*/
void
outBitAcc (operand * result)
{
  symbol *tlbl = newiTempLabel (NULL);
  /* if the result is a bit */
  if (AOP_TYPE (result) == AOP_CRY)
    {
      wassertl (0, "Tried to write A into a bit");
    }
  else
    {
      emit2 ("!shortjp z,!tlabel", tlbl->key + 100);
      emit2 ("ld a,!one");
      emitLabel (tlbl->key + 100);
      outAcc (result);
    }
}

bool
couldDestroyCarry (asmop *aop)
{
  if (aop)
    {
      if (aop->type == AOP_EXSTK || aop->type == AOP_IY)
        {
          return TRUE;
        }
    }
  return FALSE;
}

static void
shiftIntoPair (int idx, asmop *aop)
{
  PAIR_ID id = PAIR_INVALID;

  wassertl (IS_Z80, "Only implemented for the Z80");
  //  wassertl (aop->type == AOP_EXSTK, "Only implemented for EXSTK");

  switch (idx) 
    {
    case 0:
      id = PAIR_HL;
      break;
    case 1:
      id = PAIR_DE;
      _push (PAIR_DE);
      break;
    default:
      wassertl (0, "Internal error - hit default case");
    }

  emitDebug ("; Shift into pair idx %u", idx);

  if (id == PAIR_HL)
    {
      setupPair (PAIR_HL, aop, 0);
    }
  else
    {
      setupPair (PAIR_IY, aop, 0);
      emit2 ("push iy");
      emit2 ("pop %s", _pairs[id].name);
    }

  aop->type = AOP_PAIRPTR;
  aop->aopu.aop_pairId = id;
  _G.pairs[id].offset = 0;
  _G.pairs[id].last_type = aop->type;
}

static void 
setupToPreserveCarry (asmop *result, asmop *left, asmop *right)
{
  wassert (left && right);

  if (IS_Z80)
    {
      if (couldDestroyCarry (right) && couldDestroyCarry (result))
        {
          shiftIntoPair (0, right);
          shiftIntoPair (1, result);
        }
      else if (couldDestroyCarry (right))
        {
          shiftIntoPair (0, right);
        }
      else if (couldDestroyCarry (result))
        {
          shiftIntoPair (0, result);
        }
      else
        {
          /* Fine */
        }
    }
}

/*-----------------------------------------------------------------*/
/* genPlus - generates code for addition                           */
/*-----------------------------------------------------------------*/
static void
genPlus (iCode * ic)
{
  int size, offset = 0;

  /* special cases :- */

  aopOp (IC_LEFT (ic), ic, FALSE, FALSE);
  aopOp (IC_RIGHT (ic), ic, FALSE, FALSE);
  aopOp (IC_RESULT (ic), ic, TRUE, FALSE);

  /* Swap the left and right operands if:

     if literal, literal on the right or
     if left requires ACC or right is already
     in ACC */

  if ((AOP_TYPE (IC_LEFT (ic)) == AOP_LIT) ||
      (AOP_NEEDSACC (IC_LEFT (ic))) ||
      AOP_TYPE (IC_RIGHT (ic)) == AOP_ACC)
    {
      operand *t = IC_RIGHT (ic);
      IC_RIGHT (ic) = IC_LEFT (ic);
      IC_LEFT (ic) = t;
    }

  /* if both left & right are in bit
     space */
  if (AOP_TYPE (IC_LEFT (ic)) == AOP_CRY &&
      AOP_TYPE (IC_RIGHT (ic)) == AOP_CRY)
    {
      /* Cant happen */
      wassertl (0, "Tried to add two bits");
    }

  /* if left in bit space & right literal */
  if (AOP_TYPE (IC_LEFT (ic)) == AOP_CRY &&
      AOP_TYPE (IC_RIGHT (ic)) == AOP_LIT)
    {
      /* Can happen I guess */
      wassertl (0, "Tried to add a bit to a literal");
    }

  /* if I can do an increment instead
     of add then GOOD for ME */
  if (genPlusIncr (ic) == TRUE)
    goto release;

  emitDebug ("; Can't optimise plus by inc, falling back to the normal way");

  size = getDataSize (IC_RESULT (ic));

  /* Special case when left and right are constant */
  if (isPair (AOP (IC_RESULT (ic))))
    {
      char *left, *right;
      left = aopGetLitWordLong (AOP (IC_LEFT (ic)), 0, FALSE);
      right = aopGetLitWordLong (AOP (IC_RIGHT (ic)), 0, FALSE);

      if (AOP_TYPE(IC_LEFT(ic)) == AOP_LIT && AOP_TYPE(IC_RIGHT(ic)) == AOP_LIT &&
          left && right)
	{
	  /* It's a pair */
	  /* PENDING: fix */
	  char buffer[100];
	  sprintf (buffer, "#(%s + %s)", left, right);
	  emit2 ("ld %s,%s", getPairName (AOP (IC_RESULT (ic))), buffer);
	  goto release;
	}
    }

  if (isPair (AOP (IC_RIGHT (ic))) && getPairId (AOP (IC_RESULT (ic))) == PAIR_HL)
    {
      /* Fetch into HL then do the add */
      spillPair (PAIR_HL);
      fetchPair (PAIR_HL, AOP (IC_LEFT (ic)));
      emit2 ("add hl,%s", getPairName (AOP (IC_RIGHT (ic))));
      goto release;
    }

  if (isPair (AOP (IC_RIGHT (ic))) && AOP_TYPE (IC_LEFT (ic)) == AOP_IMMD)
    {
      fetchPair (PAIR_HL, AOP (IC_LEFT (ic)));
      emit2 ("add hl,%s", getPairName (AOP (IC_RIGHT (ic))));
      spillCached();
      commitPair ( AOP (IC_RESULT (ic)), PAIR_HL);
      goto release;
    }

  /* Special case:
     ld hl,sp+n trashes C so we cant afford to do it during an
     add with stack based varibles.  Worst case is:
     ld  hl,sp+left
     ld  a,(hl)
     ld  hl,sp+right
     add (hl)
     ld  hl,sp+result
     ld  (hl),a
     ld  hl,sp+left+1
     ld  a,(hl)
     ld  hl,sp+right+1
     adc (hl)
     ld  hl,sp+result+1
     ld  (hl),a
     So you cant afford to load up hl if either left, right, or result
     is on the stack (*sigh*)  The alt is:
     ld  hl,sp+left
     ld  de,(hl)
     ld  hl,sp+right
     ld  hl,(hl)
     add hl,de
     ld  hl,sp+result
     ld  (hl),hl
     Combinations in here are:
     * If left or right are in bc then the loss is small - trap later
     * If the result is in bc then the loss is also small
   */
  if (IS_GB)
    {
      if (AOP_TYPE (IC_LEFT (ic)) == AOP_STK ||
	  AOP_TYPE (IC_RIGHT (ic)) == AOP_STK ||
	  AOP_TYPE (IC_RESULT (ic)) == AOP_STK)
	{
	  if ((AOP_SIZE (IC_LEFT (ic)) == 2 ||
	       AOP_SIZE (IC_RIGHT (ic)) == 2) &&
	      (AOP_SIZE (IC_LEFT (ic)) <= 2 &&
	       AOP_SIZE (IC_RIGHT (ic)) <= 2))
	    {
	      if (getPairId (AOP (IC_RIGHT (ic))) == PAIR_BC)
		{
		  /* Swap left and right */
		  operand *t = IC_RIGHT (ic);
		  IC_RIGHT (ic) = IC_LEFT (ic);
		  IC_LEFT (ic) = t;
		}
	      if (getPairId (AOP (IC_LEFT (ic))) == PAIR_BC)
		{
		  fetchPair (PAIR_HL, AOP (IC_RIGHT (ic)));
		  emit2 ("add hl,bc");
		}
	      else
		{
		  fetchPair (PAIR_DE, AOP (IC_LEFT (ic)));
		  fetchPair (PAIR_HL, AOP (IC_RIGHT (ic)));
		  emit2 ("add hl,de");
		}
	      commitPair (AOP (IC_RESULT (ic)), PAIR_HL);
	      goto release;
	    }
	}
      if (size == 4)
        {
          /* Be paranoid on the GB with 4 byte variables due to how C
             can be trashed by lda hl,n(sp).
          */
          _gbz80_emitAddSubLong (ic, TRUE);
          goto release;
        }
    }

  setupToPreserveCarry (AOP (IC_RESULT (ic)), AOP (IC_LEFT (ic)), AOP (IC_RIGHT (ic)));

  while (size--)
    {
      if (AOP_TYPE (IC_LEFT (ic)) == AOP_ACC)
	{
	  _moveA (aopGet (AOP (IC_LEFT (ic)), offset, FALSE));
	  if (offset == 0)
	    emit2 ("add a,%s",
		   aopGet (AOP (IC_RIGHT (ic)), offset, FALSE));
	  else
	    emit2 ("adc a,%s",
		   aopGet (AOP (IC_RIGHT (ic)), offset, FALSE));
	}
      else
	{
	  _moveA (aopGet (AOP (IC_LEFT (ic)), offset, FALSE));
	  if (offset == 0)
	    emit2 ("add a,%s",
		   aopGet (AOP (IC_RIGHT (ic)), offset, FALSE));
	  else
	    emit2 ("adc a,%s",
		   aopGet (AOP (IC_RIGHT (ic)), offset, FALSE));
	}
      aopPut (AOP (IC_RESULT (ic)), "a", offset++);
    }

release:
  freeAsmop (IC_LEFT (ic), NULL, ic);
  freeAsmop (IC_RIGHT (ic), NULL, ic);
  freeAsmop (IC_RESULT (ic), NULL, ic);

}

/*-----------------------------------------------------------------*/
/* genMinusDec :- does subtraction with deccrement if possible     */
/*-----------------------------------------------------------------*/
static bool
genMinusDec (iCode * ic)
{
  unsigned int icount;
  unsigned int size = getDataSize (IC_RESULT (ic));

  /* will try to generate an increment */
  /* if the right side is not a literal we cannot */
  if (AOP_TYPE (IC_RIGHT (ic)) != AOP_LIT)
    return FALSE;

  /* if the literal value of the right hand side
     is greater than 4 then it is not worth it */
  if ((icount = (unsigned int) floatFromVal (AOP (IC_RIGHT (ic))->aopu.aop_lit)) > 2)
    return FALSE;

  size = getDataSize (IC_RESULT (ic));

  /* if decrement 16 bits in register */
  if (sameRegs (AOP (IC_LEFT (ic)), AOP (IC_RESULT (ic))) &&
      (size > 1) && isPair (AOP (IC_RESULT (ic))))
    {
      while (icount--)
	emit2 ("dec %s", getPairName (AOP (IC_RESULT (ic))));
      return TRUE;
    }

  /* If result is a pair */
  if (isPair (AOP (IC_RESULT (ic))))
    {
      movLeft2ResultLong (IC_LEFT (ic), 0, IC_RESULT (ic), 0, 0, 2);
      while (icount--)
	emit2 ("dec %s", getPairName (AOP (IC_RESULT (ic))));
      return TRUE;
    }

  /* if increment 16 bits in register */
  if (sameRegs (AOP (IC_LEFT (ic)), AOP (IC_RESULT (ic))) &&
      (size == 2)
      )
    {
      fetchPair (_getTempPairId(), AOP (IC_RESULT (ic)));

      while (icount--) {
        emit2 ("dec %s", _getTempPairName());
      }

      commitPair (AOP (IC_RESULT (ic)), _getTempPairId());

      return TRUE;
    }


  /* if the sizes are greater than 1 then we cannot */
  if (AOP_SIZE (IC_RESULT (ic)) > 1 ||
      AOP_SIZE (IC_LEFT (ic)) > 1)
    return FALSE;

  /* we can if the aops of the left & result match or if they are in
     registers and the registers are the same */
  if (sameRegs (AOP (IC_LEFT (ic)), AOP (IC_RESULT (ic))))
    {
      while (icount--)
	emit2 ("dec %s", aopGet (AOP (IC_RESULT (ic)), 0, FALSE));
      return TRUE;
    }

  return FALSE;
}

/*-----------------------------------------------------------------*/
/* genMinus - generates code for subtraction                       */
/*-----------------------------------------------------------------*/
static void
genMinus (iCode * ic)
{
  int size, offset = 0;
  unsigned long lit = 0L;

  aopOp (IC_LEFT (ic), ic, FALSE, FALSE);
  aopOp (IC_RIGHT (ic), ic, FALSE, FALSE);
  aopOp (IC_RESULT (ic), ic, TRUE, FALSE);

  /* special cases :- */
  /* if both left & right are in bit space */
  if (AOP_TYPE (IC_LEFT (ic)) == AOP_CRY &&
      AOP_TYPE (IC_RIGHT (ic)) == AOP_CRY)
    {
      wassertl (0, "Tried to subtract two bits");
      goto release;
    }

  /* if I can do an decrement instead of subtract then GOOD for ME */
  if (genMinusDec (ic) == TRUE)
    goto release;

  size = getDataSize (IC_RESULT (ic));

  if (AOP_TYPE (IC_RIGHT (ic)) != AOP_LIT)
    {
    }
  else
    {
      lit = (unsigned long) floatFromVal (AOP (IC_RIGHT (ic))->aopu.aop_lit);
      lit = -(long) lit;
    }

  /* Same logic as genPlus */
  if (IS_GB)
    {
      if (AOP_TYPE (IC_LEFT (ic)) == AOP_STK ||
	  AOP_TYPE (IC_RIGHT (ic)) == AOP_STK ||
	  AOP_TYPE (IC_RESULT (ic)) == AOP_STK)
	{
	  if ((AOP_SIZE (IC_LEFT (ic)) == 2 ||
	       AOP_SIZE (IC_RIGHT (ic)) == 2) &&
	      (AOP_SIZE (IC_LEFT (ic)) <= 2 &&
	       AOP_SIZE (IC_RIGHT (ic)) <= 2))
	    {
	      PAIR_ID left = getPairId (AOP (IC_LEFT (ic)));
	      PAIR_ID right = getPairId (AOP (IC_RIGHT (ic)));

	      if (left == PAIR_INVALID && right == PAIR_INVALID)
		{
		  left = PAIR_DE;
		  right = PAIR_HL;
		}
	      else if (right == PAIR_INVALID)
		right = PAIR_DE;
	      else if (left == PAIR_INVALID)
		left = PAIR_DE;

	      fetchPair (left, AOP (IC_LEFT (ic)));
	      /* Order is important.  Right may be HL */
	      fetchPair (right, AOP (IC_RIGHT (ic)));

	      emit2 ("ld a,%s", _pairs[left].l);
	      emit2 ("sub a,%s", _pairs[right].l);
	      emit2 ("ld e,a");
	      emit2 ("ld a,%s", _pairs[left].h);
	      emit2 ("sbc a,%s", _pairs[right].h);

              if ( AOP_SIZE (IC_RESULT (ic)) > 1)
                {
                  aopPut (AOP (IC_RESULT (ic)), "a", 1);
                }
	      aopPut (AOP (IC_RESULT (ic)), "e", 0);
	      goto release;
	    }
	}
      if (size == 4)
        {
          /* Be paranoid on the GB with 4 byte variables due to how C
             can be trashed by lda hl,n(sp).
          */
          _gbz80_emitAddSubLong (ic, FALSE);
          goto release;
        }
    }

  setupToPreserveCarry (AOP (IC_RESULT (ic)), AOP (IC_LEFT (ic)), AOP (IC_RIGHT (ic)));

  /* if literal, add a,#-lit, else normal subb */
  while (size--)
    {
      _moveA (aopGet (AOP (IC_LEFT (ic)), offset, FALSE));
      if (AOP_TYPE (IC_RIGHT (ic)) != AOP_LIT)
	{
	  if (!offset)
	    emit2 ("sub a,%s",
		      aopGet (AOP (IC_RIGHT (ic)), offset, FALSE));
	  else
	    emit2 ("sbc a,%s",
		      aopGet (AOP (IC_RIGHT (ic)), offset, FALSE));
	}
      else
	{
	  /* first add without previous c */
	  if (!offset)
	    emit2 ("add a,!immedbyte", (unsigned int) (lit & 0x0FFL));
	  else
	    emit2 ("adc a,!immedbyte", (unsigned int) ((lit >> (offset * 8)) & 0x0FFL));
	}
      aopPut (AOP (IC_RESULT (ic)), "a", offset++);
    }

  if (AOP_SIZE (IC_RESULT (ic)) == 3 &&
      AOP_SIZE (IC_LEFT (ic)) == 3 &&
      !sameRegs (AOP (IC_RESULT (ic)), AOP (IC_LEFT (ic))))
    {
      wassertl (0, "Tried to subtract on a long pointer");
    }

release:
  freeAsmop (IC_LEFT (ic), NULL, ic);
  freeAsmop (IC_RIGHT (ic), NULL, ic);
  freeAsmop (IC_RESULT (ic), NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genMult - generates code for multiplication                     */
/*-----------------------------------------------------------------*/
static void
genMult (iCode * ic)
{
  int val;
  int count, i;
  /* If true then the final operation should be a subtract */
  bool active = FALSE;

  /* Shouldn't occur - all done through function calls */
  aopOp (IC_LEFT (ic), ic, FALSE, FALSE);
  aopOp (IC_RIGHT (ic), ic, FALSE, FALSE);
  aopOp (IC_RESULT (ic), ic, TRUE, FALSE);

  if (AOP_SIZE (IC_LEFT (ic)) > 2 ||
      AOP_SIZE (IC_RIGHT (ic)) > 2 ||
      AOP_SIZE (IC_RESULT (ic)) > 2)
    {
      wassertl (0, "Multiplication is handled through support function calls");
    }

  /* Swap left and right such that right is a literal */
  if ((AOP_TYPE (IC_LEFT (ic)) == AOP_LIT))
    {
      operand *t = IC_RIGHT (ic);
      IC_RIGHT (ic) = IC_LEFT (ic);
      IC_LEFT (ic) = t;
    }

  wassertl (AOP_TYPE (IC_RIGHT (ic)) == AOP_LIT, "Right must be a literal");

  val = (int)floatFromVal ( AOP (IC_RIGHT (ic))->aopu.aop_lit);
  //  wassertl (val > 0, "Multiply must be positive");
  wassertl (val != 1, "Can't multiply by 1");

  if (IS_Z80) {
    _push (PAIR_DE);
  }

  if ( AOP_SIZE (IC_LEFT (ic)) == 1 && !SPEC_USIGN (getSpec (operandType ( IC_LEFT (ic)))))
    {
      emit2 ("ld e,%s", aopGet (AOP (IC_LEFT (ic)), LSB, FALSE));
      emit2 ("ld a,e");
      emit2 ("rlc a");
      emit2 ("sbc a,a");
      emit2 ("ld d,a");
    }
  else
    {
      fetchPair (PAIR_DE, AOP (IC_LEFT (ic)));
    }

  i = val;

  /* Fully unroled version of mul.s.  Not the most efficient.
   */
  for (count = 0; count < 16; count++)
    {
      if (count != 0 && active)
        {
          emit2 ("add hl,hl");
        }
      if (i & 0x8000U)
        {
          if (active == FALSE)
            {
              emit2 ("ld l,e");
              emit2 ("ld h,d");
            }
          else
            {
              emit2 ("add hl,de");
            }
          active = TRUE;
        }
      i <<= 1;
    }

  spillCached();

  if (IS_Z80)
    {
      _pop (PAIR_DE);
    }

  commitPair ( AOP (IC_RESULT (ic)), PAIR_HL);

  freeAsmop (IC_LEFT (ic), NULL, ic);
  freeAsmop (IC_RIGHT (ic), NULL, ic);
  freeAsmop (IC_RESULT (ic), NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genDiv - generates code for division                            */
/*-----------------------------------------------------------------*/
static void
genDiv (iCode * ic)
{
  /* Shouldn't occur - all done through function calls */
  wassertl (0, "Division is handled through support function calls");
}

/*-----------------------------------------------------------------*/
/* genMod - generates code for division                            */
/*-----------------------------------------------------------------*/
static void
genMod (iCode * ic)
{
  /* Shouldn't occur - all done through function calls */
  wassert (0);
}

/*-----------------------------------------------------------------*/
/* genIfxJump :- will create a jump depending on the ifx           */
/*-----------------------------------------------------------------*/
static void
genIfxJump (iCode * ic, char *jval)
{
  symbol *jlbl;
  const char *inst;

  /* if true label then we jump if condition
     supplied is true */
  if (IC_TRUE (ic))
    {
      jlbl = IC_TRUE (ic);
      if (!strcmp (jval, "a"))
	{
	  inst = "nz";
	}
      else if (!strcmp (jval, "c"))
	{
	  inst = "c";
	}
      else if (!strcmp (jval, "nc"))
	{
	  inst = "nc";
	}
      else
	{
	  /* The buffer contains the bit on A that we should test */
	  inst = "nz";
	}
    }
  else
    {
      /* false label is present */
      jlbl = IC_FALSE (ic);
      if (!strcmp (jval, "a"))
	{
	  inst = "z";
	}
      else if (!strcmp (jval, "c"))
	{
	  inst = "nc";
	}
      else if (!strcmp (jval, "nc"))
	{
	  inst = "c";
	}
      else
	{
	  /* The buffer contains the bit on A that we should test */
	  inst = "z";
	}
    }
  /* Z80 can do a conditional long jump */
  if (!strcmp (jval, "a"))
    {
      emit2 ("or a,a");
    }
  else if (!strcmp (jval, "c"))
    {
    }
  else if (!strcmp (jval, "nc"))
    {
    }
  else
    {
      emit2 ("bit %s,a", jval);
    }
  emit2 ("jp %s,!tlabel", inst, jlbl->key + 100);

  /* mark the icode as generated */
  ic->generated = 1;
}

#if DISABLED
static const char *
_getPairIdName (PAIR_ID id)
{
  return _pairs[id].name;
}
#endif

/** Generic compare for > or <
 */
static void
genCmp (operand * left, operand * right,
	operand * result, iCode * ifx, int sign)
{
  int size, offset = 0;
  unsigned long lit = 0L;
  bool swap_sense = FALSE;

  /* if left & right are bit variables */
  if (AOP_TYPE (left) == AOP_CRY &&
      AOP_TYPE (right) == AOP_CRY)
    {
      /* Cant happen on the Z80 */
      wassertl (0, "Tried to compare two bits");
    }
  else
    {
      /* subtract right from left if at the
         end the carry flag is set then we know that
         left is greater than right */
      size = max (AOP_SIZE (left), AOP_SIZE (right));

      /* if unsigned char cmp with lit, just compare */
      if ((size == 1) &&
	  (AOP_TYPE (right) == AOP_LIT && AOP_TYPE (left) != AOP_DIR))
	{
	  emit2 ("ld a,%s", aopGet (AOP (left), offset, FALSE));
	  if (sign)
	    {
	      emit2 ("xor a,!immedbyte", 0x80);
	      emit2 ("cp %s^!constbyte", aopGet (AOP (right), offset, FALSE), 0x80);
	    }
	  else
	    emit2 ("cp %s", aopGet (AOP (right), offset, FALSE));
	}
      else if (size == 4 && IS_GB && requiresHL(AOP(right)) && requiresHL(AOP(left)))
        {
          // On the Gameboy we can't afford to adjust HL as it may trash the carry.
          // Pull left into DE and right into HL
          aopGet (AOP(left), LSB, FALSE);
          emit2 ("ld d,h");
          emit2 ("ld e,l");
          aopGet (AOP(right), LSB, FALSE);

          while (size--)
            {
              if (size == 0 && sign)
                {
                  // Highest byte when signed needs the bits flipped
                  // Save the flags
                  emit2 ("push af");
                  emit2 ("ld a,(de)");
                  emit2 ("xor #0x80");
                  emit2 ("ld e,a");
                  emit2 ("ld a,(hl)");
                  emit2 ("xor #0x80");
                  emit2 ("ld d,a");
                  emit2 ("pop af");
                  emit2 ("ld a,e");
                  emit2 ("%s a,d", offset == 0 ? "sub" : "sbc");
                }
              else
                {
                  emit2 ("ld a,(de)");
                  emit2 ("%s a,(hl)", offset == 0 ? "sub" : "sbc");
                }
              
              if (size != 0)
                {
                  emit2 ("inc hl");
                  emit2 ("inc de");
                }
              offset++;
            }
          spillPair (PAIR_HL);
        }
      else if (size == 4 && IS_Z80 && couldDestroyCarry(AOP(right)) && couldDestroyCarry(AOP(left)))
        {
          setupPair (PAIR_HL, AOP (left), 0);
          aopGet (AOP(right), LSB, FALSE);

          while (size--)
            {
              if (size == 0 && sign)
                {
                  // Highest byte when signed needs the bits flipped
                  // Save the flags
                  emit2 ("push af");
                  emit2 ("ld a,(hl)");
                  emit2 ("xor #0x80");
                  emit2 ("ld l,a");
                  emit2 ("ld a,%d(iy)", offset);
                  emit2 ("xor #0x80");
                  emit2 ("ld h,a");
                  emit2 ("pop af");
                  emit2 ("ld a,l");
                  emit2 ("%s a,h", offset == 0 ? "sub" : "sbc");
                }
              else
                {
                  emit2 ("ld a,(hl)");
                  emit2 ("%s a,%d(iy)", offset == 0 ? "sub" : "sbc", offset);
                }
              
              if (size != 0)
                {
                  emit2 ("inc hl");
                }
              offset++;
            }
          spillPair (PAIR_HL);
          spillPair (PAIR_IY);
        }
      else
	{
	  if (AOP_TYPE (right) == AOP_LIT)
	    {
	      lit = (unsigned long) floatFromVal (AOP (right)->aopu.aop_lit);
	      /* optimize if(x < 0) or if(x >= 0) */
	      if (lit == 0L)
		{
		  if (!sign)
		    {
		      /* No sign so it's always false */
		      _clearCarry();
		    }
		  else
		    {
		      /* Just load in the top most bit */
		      _moveA (aopGet (AOP (left), AOP_SIZE (left) - 1, FALSE));
		      if (!(AOP_TYPE (result) == AOP_CRY && AOP_SIZE (result)) && ifx)
			{
			  genIfxJump (ifx, "7");
			  return;
			}
		      else
			emit2 ("rlc a");
		    }
		  goto release;
		}
	    }
          
	  if (sign)
	    {
	      /* First setup h and l contaning the top most bytes XORed */
	      bool fDidXor = FALSE;
	      if (AOP_TYPE (left) == AOP_LIT)
		{
		  unsigned long lit = (unsigned long)
		  floatFromVal (AOP (left)->aopu.aop_lit);
		  emit2 ("ld %s,!immedbyte", _fTmp[0],
			 0x80 ^ (unsigned int) ((lit >> ((size - 1) * 8)) & 0x0FFL));
		}
	      else
		{
		  emit2 ("ld a,%s", aopGet (AOP (left), size - 1, FALSE));
		  emit2 ("xor a,!immedbyte", 0x80);
		  emit2 ("ld %s,a", _fTmp[0]);
		  fDidXor = TRUE;
		}
	      if (AOP_TYPE (right) == AOP_LIT)
		{
		  unsigned long lit = (unsigned long)
		  floatFromVal (AOP (right)->aopu.aop_lit);
		  emit2 ("ld %s,!immedbyte", _fTmp[1],
			 0x80 ^ (unsigned int) ((lit >> ((size - 1) * 8)) & 0x0FFL));
		}
	      else
		{
		  emit2 ("ld a,%s", aopGet (AOP (right), size - 1, FALSE));
		  emit2 ("xor a,!immedbyte", 0x80);
		  emit2 ("ld %s,a", _fTmp[1]);
		  fDidXor = TRUE;
		}
	    }
	  while (size--)
	    {
	      /* Do a long subtract */
	      if (!sign || size)
		{
		  _moveA (aopGet (AOP (left), offset, FALSE));
		}
	      if (sign && size == 0)
		{
		  emit2 ("ld a,%s", _fTmp[0]);
		  emit2 ("%s a,%s", offset == 0 ? "sub" : "sbc", _fTmp[1]);
		}
	      else
		{
		  /* Subtract through, propagating the carry */
		  emit2 ("%s a,%s", offset == 0 ? "sub" : "sbc", aopGet (AOP (right), offset, FALSE));
		  offset++;
		}
	    }
	}
    }

release:
  if (AOP_TYPE (result) == AOP_CRY && AOP_SIZE (result))
    {
      outBitCLong (result, swap_sense);
    }
  else
    {
      /* if the result is used in the next
         ifx conditional branch then generate
         code a little differently */
      if (ifx)
	genIfxJump (ifx, swap_sense ? "nc" : "c");
      else
	outBitCLong (result, swap_sense);
      /* leave the result in acc */
    }
}

/*-----------------------------------------------------------------*/
/* genCmpGt :- greater than comparison                             */
/*-----------------------------------------------------------------*/
static void
genCmpGt (iCode * ic, iCode * ifx)
{
  operand *left, *right, *result;
  sym_link *letype, *retype;
  int sign;

  left = IC_LEFT (ic);
  right = IC_RIGHT (ic);
  result = IC_RESULT (ic);

  letype = getSpec (operandType (left));
  retype = getSpec (operandType (right));
  sign = !(SPEC_USIGN (letype) | SPEC_USIGN (retype));
  /* assign the amsops */
  aopOp (left, ic, FALSE, FALSE);
  aopOp (right, ic, FALSE, FALSE);
  aopOp (result, ic, TRUE, FALSE);

  genCmp (right, left, result, ifx, sign);

  freeAsmop (left, NULL, ic);
  freeAsmop (right, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genCmpLt - less than comparisons                                */
/*-----------------------------------------------------------------*/
static void
genCmpLt (iCode * ic, iCode * ifx)
{
  operand *left, *right, *result;
  sym_link *letype, *retype;
  int sign;

  left = IC_LEFT (ic);
  right = IC_RIGHT (ic);
  result = IC_RESULT (ic);

  letype = getSpec (operandType (left));
  retype = getSpec (operandType (right));
  sign = !(SPEC_USIGN (letype) | SPEC_USIGN (retype));

  /* assign the amsops */
  aopOp (left, ic, FALSE, FALSE);
  aopOp (right, ic, FALSE, FALSE);
  aopOp (result, ic, TRUE, FALSE);

  genCmp (left, right, result, ifx, sign);

  freeAsmop (left, NULL, ic);
  freeAsmop (right, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* gencjneshort - compare and jump if not equal                    */
/*-----------------------------------------------------------------*/
static void
gencjneshort (operand * left, operand * right, symbol * lbl)
{
  int size = max (AOP_SIZE (left), AOP_SIZE (right));
  int offset = 0;
  unsigned long lit = 0L;

  /* Swap the left and right if it makes the computation easier */
  if (AOP_TYPE (left) == AOP_LIT)
    {
      operand *t = right;
      right = left;
      left = t;
    }

  if (AOP_TYPE (right) == AOP_LIT)
    lit = (unsigned long) floatFromVal (AOP (right)->aopu.aop_lit);

  /* if the right side is a literal then anything goes */
  if (AOP_TYPE (right) == AOP_LIT &&
      AOP_TYPE (left) != AOP_DIR)
    {
      if (lit == 0)
	{
	  emit2 ("ld a,%s", aopGet (AOP (left), offset, FALSE));
	  if (size > 1)
	    {
	      while (--size)
		{
		  emit2 ("or a,%s", aopGet (AOP (left), ++offset, FALSE));
		}
	    }
	  else
	    {
	      emit2 ("or a,a");
	    }
	  emit2 ("jp nz,!tlabel", lbl->key + 100);
	}
      else
	{
	  while (size--)
	    {
	      emit2 ("ld a,%s", aopGet (AOP (left), offset, FALSE));
	      if ((AOP_TYPE (right) == AOP_LIT) && lit == 0)
		emit2 ("or a,a");
	      else
		emit2 ("cp a,%s", aopGet (AOP (right), offset, FALSE));
	      emit2 ("jp nz,!tlabel", lbl->key + 100);
	      offset++;
	    }
	}
    }
  /* if the right side is in a register or in direct space or
     if the left is a pointer register & right is not */
  else if (AOP_TYPE (right) == AOP_REG ||
	   AOP_TYPE (right) == AOP_DIR ||
	   (AOP_TYPE (left) == AOP_DIR && AOP_TYPE (right) == AOP_LIT))
    {
      while (size--)
	{
	  _moveA (aopGet (AOP (left), offset, FALSE));
	  if ((AOP_TYPE (left) == AOP_DIR && AOP_TYPE (right) == AOP_LIT) &&
	      ((unsigned int) ((lit >> (offset * 8)) & 0x0FFL) == 0))
	    /* PENDING */
	    emit2 ("jp nz,!tlabel", lbl->key + 100);
	  else
	    {
	      emit2 ("cp %s", aopGet (AOP (right), offset, FALSE));
	      emit2 ("jp nz,!tlabel", lbl->key + 100);
	    }
	  offset++;
	}
    }
  else
    {
      /* right is a pointer reg need both a & b */
      /* PENDING: is this required? */
      while (size--)
	{
	  _moveA (aopGet (AOP (right), offset, FALSE));
	  emit2 ("cp %s", aopGet (AOP (left), offset, FALSE));
	  emit2 ("!shortjp nz,!tlabel", lbl->key + 100);
	  offset++;
	}
    }
}

/*-----------------------------------------------------------------*/
/* gencjne - compare and jump if not equal                         */
/*-----------------------------------------------------------------*/
static void
gencjne (operand * left, operand * right, symbol * lbl)
{
  symbol *tlbl = newiTempLabel (NULL);

  gencjneshort (left, right, lbl);

  /* PENDING: ?? */
  emit2 ("ld a,!one");
  emit2 ("!shortjp !tlabel", tlbl->key + 100);
  emitLabel (lbl->key + 100);
  emit2 ("xor a,a");
  emitLabel (tlbl->key + 100);
}

/*-----------------------------------------------------------------*/
/* genCmpEq - generates code for equal to                          */
/*-----------------------------------------------------------------*/
static void
genCmpEq (iCode * ic, iCode * ifx)
{
  operand *left, *right, *result;

  aopOp ((left = IC_LEFT (ic)), ic, FALSE, FALSE);
  aopOp ((right = IC_RIGHT (ic)), ic, FALSE, FALSE);
  aopOp ((result = IC_RESULT (ic)), ic, TRUE, FALSE);

  emitDebug ("; genCmpEq: left %u, right %u, result %u", AOP_SIZE(IC_LEFT(ic)), AOP_SIZE(IC_RIGHT(ic)), AOP_SIZE(IC_RESULT(ic)));

  /* Swap operands if it makes the operation easier. ie if:
     1.  Left is a literal.
   */
  if (AOP_TYPE (IC_LEFT (ic)) == AOP_LIT)
    {
      operand *t = IC_RIGHT (ic);
      IC_RIGHT (ic) = IC_LEFT (ic);
      IC_LEFT (ic) = t;
    }

  if (ifx && !AOP_SIZE (result))
    {
      symbol *tlbl;
      /* if they are both bit variables */
      if (AOP_TYPE (left) == AOP_CRY &&
	  ((AOP_TYPE (right) == AOP_CRY) || (AOP_TYPE (right) == AOP_LIT)))
	{
	  wassertl (0, "Tried to compare two bits");
	}
      else
	{
	  tlbl = newiTempLabel (NULL);
	  gencjneshort (left, right, tlbl);
	  if (IC_TRUE (ifx))
	    {
	      emit2 ("jp !tlabel", IC_TRUE (ifx)->key + 100);
	      emitLabel (tlbl->key + 100);
	    }
	  else
	    {
	      /* PENDING: do this better */
	      symbol *lbl = newiTempLabel (NULL);
	      emit2 ("!shortjp !tlabel", lbl->key + 100);
	      emitLabel (tlbl->key + 100);
	      emit2 ("jp !tlabel", IC_FALSE (ifx)->key + 100);
	      emitLabel (lbl->key + 100);
	    }
	}
      /* mark the icode as generated */
      ifx->generated = 1;
      goto release;
    }

  /* if they are both bit variables */
  if (AOP_TYPE (left) == AOP_CRY &&
      ((AOP_TYPE (right) == AOP_CRY) || (AOP_TYPE (right) == AOP_LIT)))
    {
      wassertl (0, "Tried to compare a bit to either a literal or another bit");
    }
  else
    {
      gencjne (left, right, newiTempLabel (NULL));
      if (AOP_TYPE (result) == AOP_CRY && AOP_SIZE (result))
	{
	  wassert (0);
	}
      if (ifx)
	{
	  genIfxJump (ifx, "a");
	  goto release;
	}
      /* if the result is used in an arithmetic operation
         then put the result in place */
      if (AOP_TYPE (result) != AOP_CRY)
	{
	  outAcc (result);
	}
      /* leave the result in acc */
    }

release:
  freeAsmop (left, NULL, ic);
  freeAsmop (right, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* ifxForOp - returns the icode containing the ifx for operand     */
/*-----------------------------------------------------------------*/
static iCode *
ifxForOp (operand * op, iCode * ic)
{
  /* if true symbol then needs to be assigned */
  if (IS_TRUE_SYMOP (op))
    return NULL;

  /* if this has register type condition and
     the next instruction is ifx with the same operand
     and live to of the operand is upto the ifx only then */
  if (ic->next &&
      ic->next->op == IFX &&
      IC_COND (ic->next)->key == op->key &&
      OP_SYMBOL (op)->liveTo <= ic->next->seq)
    return ic->next;

  return NULL;
}

/*-----------------------------------------------------------------*/
/* genAndOp - for && operation                                     */
/*-----------------------------------------------------------------*/
static void
genAndOp (iCode * ic)
{
  operand *left, *right, *result;
  symbol *tlbl;

  /* note here that && operations that are in an if statement are
     taken away by backPatchLabels only those used in arthmetic
     operations remain */
  aopOp ((left = IC_LEFT (ic)), ic, FALSE, TRUE);
  aopOp ((right = IC_RIGHT (ic)), ic, FALSE, TRUE);
  aopOp ((result = IC_RESULT (ic)), ic, FALSE, FALSE);

  /* if both are bit variables */
  if (AOP_TYPE (left) == AOP_CRY &&
      AOP_TYPE (right) == AOP_CRY)
    {
      wassertl (0, "Tried to and two bits");
    }
  else
    {
      tlbl = newiTempLabel (NULL);
      _toBoolean (left);
      emit2 ("!shortjp z,!tlabel", tlbl->key + 100);
      _toBoolean (right);
      emitLabel (tlbl->key + 100);
      outBitAcc (result);
    }

  freeAsmop (left, NULL, ic);
  freeAsmop (right, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genOrOp - for || operation                                      */
/*-----------------------------------------------------------------*/
static void
genOrOp (iCode * ic)
{
  operand *left, *right, *result;
  symbol *tlbl;

  /* note here that || operations that are in an
     if statement are taken away by backPatchLabels
     only those used in arthmetic operations remain */
  aopOp ((left = IC_LEFT (ic)), ic, FALSE, TRUE);
  aopOp ((right = IC_RIGHT (ic)), ic, FALSE, TRUE);
  aopOp ((result = IC_RESULT (ic)), ic, FALSE, FALSE);

  /* if both are bit variables */
  if (AOP_TYPE (left) == AOP_CRY &&
      AOP_TYPE (right) == AOP_CRY)
    {
      wassertl (0, "Tried to OR two bits");
    }
  else
    {
      tlbl = newiTempLabel (NULL);
      _toBoolean (left);
      emit2 ("!shortjp nz,!tlabel", tlbl->key + 100);
      _toBoolean (right);
      emitLabel (tlbl->key + 100);
      outBitAcc (result);
    }

  freeAsmop (left, NULL, ic);
  freeAsmop (right, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* isLiteralBit - test if lit == 2^n                               */
/*-----------------------------------------------------------------*/
int
isLiteralBit (unsigned long lit)
{
  unsigned long pw[32] =
  {1L, 2L, 4L, 8L, 16L, 32L, 64L, 128L,
   0x100L, 0x200L, 0x400L, 0x800L,
   0x1000L, 0x2000L, 0x4000L, 0x8000L,
   0x10000L, 0x20000L, 0x40000L, 0x80000L,
   0x100000L, 0x200000L, 0x400000L, 0x800000L,
   0x1000000L, 0x2000000L, 0x4000000L, 0x8000000L,
   0x10000000L, 0x20000000L, 0x40000000L, 0x80000000L};
  int idx;

  for (idx = 0; idx < 32; idx++)
    if (lit == pw[idx])
      return idx + 1;
  return 0;
}

/*-----------------------------------------------------------------*/
/* jmpTrueOrFalse -                                                */
/*-----------------------------------------------------------------*/
static void
jmpTrueOrFalse (iCode * ic, symbol * tlbl)
{
  // ugly but optimized by peephole
  if (IC_TRUE (ic))
    {
      symbol *nlbl = newiTempLabel (NULL);
      emit2 ("jp !tlabel", nlbl->key + 100);
      emitLabel (tlbl->key + 100);
      emit2 ("jp !tlabel", IC_TRUE (ic)->key + 100);
      emitLabel (nlbl->key + 100);
    }
  else
    {
      emit2 ("jp !tlabel", IC_FALSE (ic)->key + 100);
      emitLabel (tlbl->key + 100);
    }
  ic->generated = 1;
}

/*-----------------------------------------------------------------*/
/* genAnd  - code for and                                          */
/*-----------------------------------------------------------------*/
static void
genAnd (iCode * ic, iCode * ifx)
{
  operand *left, *right, *result;
  int size, offset = 0;
  unsigned long lit = 0L;
  int bytelit = 0;

  aopOp ((left = IC_LEFT (ic)), ic, FALSE, FALSE);
  aopOp ((right = IC_RIGHT (ic)), ic, FALSE, FALSE);
  aopOp ((result = IC_RESULT (ic)), ic, TRUE, FALSE);

  /* if left is a literal & right is not then exchange them */
  if ((AOP_TYPE (left) == AOP_LIT && AOP_TYPE (right) != AOP_LIT) ||
      AOP_NEEDSACC (left))
    {
      operand *tmp = right;
      right = left;
      left = tmp;
    }

  /* if result = right then exchange them */
  if (sameRegs (AOP (result), AOP (right)))
    {
      operand *tmp = right;
      right = left;
      left = tmp;
    }

  /* if right is bit then exchange them */
  if (AOP_TYPE (right) == AOP_CRY &&
      AOP_TYPE (left) != AOP_CRY)
    {
      operand *tmp = right;
      right = left;
      left = tmp;
    }
  if (AOP_TYPE (right) == AOP_LIT)
    lit = (unsigned long) floatFromVal (AOP (right)->aopu.aop_lit);

  size = AOP_SIZE (result);

  if (AOP_TYPE (left) == AOP_CRY)
    {
      wassertl (0, "Tried to perform an AND with a bit as an operand");
      goto release;
    }

  // if(val & 0xZZ)       - size = 0, ifx != FALSE  -
  // bit = val & 0xZZ     - size = 1, ifx = FALSE -
  if ((AOP_TYPE (right) == AOP_LIT) &&
      (AOP_TYPE (result) == AOP_CRY) &&
      (AOP_TYPE (left) != AOP_CRY))
    {
      symbol *tlbl = newiTempLabel (NULL);
      int sizel = AOP_SIZE (left);
      if (size)
        {
          /* PENDING: Test case for this. */
          emit2 ("scf");
        }
      while (sizel--)
        {
          if ((bytelit = ((lit >> (offset * 8)) & 0x0FFL)) != 0x0L)
            {
              _moveA (aopGet (AOP (left), offset, FALSE));
              if (bytelit != 0x0FFL)
                {
                  emit2 ("and a,%s", aopGet (AOP (right), offset, FALSE));
                }
              else
                {
                  /* For the flags */
                  emit2 ("or a,a");
                }
              emit2 ("!shortjp nz,!tlabel", tlbl->key + 100);
            }
	      offset++;
        }
      // bit = left & literal
      if (size)
        {
          emit2 ("clr c");
          emit2 ("!tlabeldef", tlbl->key + 100);
        }
      // if(left & literal)
      else
        {
          if (ifx)
            {
              jmpTrueOrFalse (ifx, tlbl);
            }
          goto release;
        }
      outBitC (result);
      goto release;
    }

  /* if left is same as result */
  if (sameRegs (AOP (result), AOP (left)))
    {
      for (; size--; offset++)
	{
	  if (AOP_TYPE (right) == AOP_LIT)
	    {
	      if ((bytelit = (int) ((lit >> (offset * 8)) & 0x0FFL)) == 0x0FF)
		continue;
	      else
		{
		  if (bytelit == 0)
		    aopPut (AOP (result), "!zero", offset);
		  else
		    {
		      _moveA (aopGet (AOP (left), offset, FALSE));
		      emit2 ("and a,%s",
				aopGet (AOP (right), offset, FALSE));
		      aopPut (AOP (left), "a", offset);
		    }
		}

	    }
	  else
	    {
	      if (AOP_TYPE (left) == AOP_ACC)
		{
		  wassertl (0, "Tried to perform an AND where the left operand is allocated into A");
		}
	      else
		{
		  _moveA (aopGet (AOP (left), offset, FALSE));
		  emit2 ("and a,%s",
			    aopGet (AOP (right), offset, FALSE));
		  aopPut (AOP (left), "a", offset);
		}
	    }
	}
    }
  else
    {
      // left & result in different registers
      if (AOP_TYPE (result) == AOP_CRY)
	{
	  wassertl (0, "Tried to AND where the result is in carry");
	}
      else
	{
	  for (; (size--); offset++)
	    {
	      // normal case
	      // result = left & right
	      if (AOP_TYPE (right) == AOP_LIT)
		{
		  if ((bytelit = (int) ((lit >> (offset * 8)) & 0x0FFL)) == 0x0FF)
		    {
		      aopPut (AOP (result),
			      aopGet (AOP (left), offset, FALSE),
			      offset);
		      continue;
		    }
		  else if (bytelit == 0)
		    {
		      aopPut (AOP (result), "!zero", offset);
		      continue;
		    }
		}
	      // faster than result <- left, anl result,right
	      // and better if result is SFR
	      if (AOP_TYPE (left) == AOP_ACC)
		emit2 ("and a,%s", aopGet (AOP (right), offset, FALSE));
	      else
		{
		  _moveA (aopGet (AOP (left), offset, FALSE));
		  emit2 ("and a,%s",
			    aopGet (AOP (right), offset, FALSE));
		}
	      aopPut (AOP (result), "a", offset);
	    }
	}

    }

release:
  freeAsmop (left, NULL, ic);
  freeAsmop (right, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genOr  - code for or                                            */
/*-----------------------------------------------------------------*/
static void
genOr (iCode * ic, iCode * ifx)
{
  operand *left, *right, *result;
  int size, offset = 0;
  unsigned long lit = 0L;
  int bytelit = 0;

  aopOp ((left = IC_LEFT (ic)), ic, FALSE, FALSE);
  aopOp ((right = IC_RIGHT (ic)), ic, FALSE, FALSE);
  aopOp ((result = IC_RESULT (ic)), ic, TRUE, FALSE);

  /* if left is a literal & right is not then exchange them */
  if ((AOP_TYPE (left) == AOP_LIT && AOP_TYPE (right) != AOP_LIT) ||
      AOP_NEEDSACC (left))
    {
      operand *tmp = right;
      right = left;
      left = tmp;
    }

  /* if result = right then exchange them */
  if (sameRegs (AOP (result), AOP (right)))
    {
      operand *tmp = right;
      right = left;
      left = tmp;
    }

  /* if right is bit then exchange them */
  if (AOP_TYPE (right) == AOP_CRY &&
      AOP_TYPE (left) != AOP_CRY)
    {
      operand *tmp = right;
      right = left;
      left = tmp;
    }
  if (AOP_TYPE (right) == AOP_LIT)
    lit = (unsigned long) floatFromVal (AOP (right)->aopu.aop_lit);

  size = AOP_SIZE (result);

  if (AOP_TYPE (left) == AOP_CRY)
    {
      wassertl (0, "Tried to OR where left is a bit");
      goto release;
    }

  // if(val | 0xZZ)       - size = 0, ifx != FALSE  -
  // bit = val | 0xZZ     - size = 1, ifx = FALSE -
  if ((AOP_TYPE (right) == AOP_LIT) &&
      (AOP_TYPE (result) == AOP_CRY) &&
      (AOP_TYPE (left) != AOP_CRY))
    {
      symbol *tlbl = newiTempLabel (NULL);
      int sizel = AOP_SIZE (left);

      if (size)
        {
          wassertl (0, "Result is assigned to a bit");
        }
      /* PENDING: Modeled after the AND code which is inefficent. */
      while (sizel--)
        {
          bytelit = (lit >> (offset * 8)) & 0x0FFL;

          _moveA (aopGet (AOP (left), offset, FALSE));
          /* OR with any literal is the same as OR with itself. */
          emit2 ("or a,a");
          emit2 ("!shortjp nz,!tlabel", tlbl->key + 100);

          offset++;
        }
      if (ifx)
        {
          jmpTrueOrFalse (ifx, tlbl);
        }
      goto release;
    }

  /* if left is same as result */
  if (sameRegs (AOP (result), AOP (left)))
    {
      for (; size--; offset++)
	{
	  if (AOP_TYPE (right) == AOP_LIT)
	    {
	      if (((lit >> (offset * 8)) & 0x0FFL) == 0x00L)
		continue;
	      else
		{
		  _moveA (aopGet (AOP (left), offset, FALSE));
		  emit2 ("or a,%s",
			    aopGet (AOP (right), offset, FALSE));
		  aopPut (AOP (result), "a", offset);
		}
	    }
	  else
	    {
	      if (AOP_TYPE (left) == AOP_ACC)
		emit2 ("or a,%s", aopGet (AOP (right), offset, FALSE));
	      else
		{
		  _moveA (aopGet (AOP (left), offset, FALSE));
		  emit2 ("or a,%s",
			    aopGet (AOP (right), offset, FALSE));
		  aopPut (AOP (result), "a", offset);
		}
	    }
	}
    }
  else
    {
      // left & result in different registers
      if (AOP_TYPE (result) == AOP_CRY)
	{
	  wassertl (0, "Result of OR is in a bit");
	}
      else
	for (; (size--); offset++)
	  {
	    // normal case
	    // result = left & right
	    if (AOP_TYPE (right) == AOP_LIT)
	      {
		if (((lit >> (offset * 8)) & 0x0FFL) == 0x00L)
		  {
		    aopPut (AOP (result),
			    aopGet (AOP (left), offset, FALSE),
			    offset);
		    continue;
		  }
	      }
	    // faster than result <- left, anl result,right
	    // and better if result is SFR
	    if (AOP_TYPE (left) == AOP_ACC)
	      emit2 ("or a,%s", aopGet (AOP (right), offset, FALSE));
	    else
	      {
		_moveA (aopGet (AOP (left), offset, FALSE));
		emit2 ("or a,%s",
			  aopGet (AOP (right), offset, FALSE));
	      }
	    aopPut (AOP (result), "a", offset);
	    /* PENDING: something weird is going on here.  Add exception. */
	    if (AOP_TYPE (result) == AOP_ACC)
	      break;
	  }
    }

release:
  freeAsmop (left, NULL, ic);
  freeAsmop (right, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genXor - code for xclusive or                                   */
/*-----------------------------------------------------------------*/
static void
genXor (iCode * ic, iCode * ifx)
{
  operand *left, *right, *result;
  int size, offset = 0;
  unsigned long lit = 0L;

  aopOp ((left = IC_LEFT (ic)), ic, FALSE, FALSE);
  aopOp ((right = IC_RIGHT (ic)), ic, FALSE, FALSE);
  aopOp ((result = IC_RESULT (ic)), ic, TRUE, FALSE);

  /* if left is a literal & right is not then exchange them */
  if ((AOP_TYPE (left) == AOP_LIT && AOP_TYPE (right) != AOP_LIT) ||
      AOP_NEEDSACC (left))
    {
      operand *tmp = right;
      right = left;
      left = tmp;
    }

  /* if result = right then exchange them */
  if (sameRegs (AOP (result), AOP (right)))
    {
      operand *tmp = right;
      right = left;
      left = tmp;
    }

  /* if right is bit then exchange them */
  if (AOP_TYPE (right) == AOP_CRY &&
      AOP_TYPE (left) != AOP_CRY)
    {
      operand *tmp = right;
      right = left;
      left = tmp;
    }
  if (AOP_TYPE (right) == AOP_LIT)
    lit = (unsigned long) floatFromVal (AOP (right)->aopu.aop_lit);

  size = AOP_SIZE (result);

  if (AOP_TYPE (left) == AOP_CRY)
    {
      wassertl (0, "Tried to XOR a bit");
      goto release;
    }

  // if(val & 0xZZ)       - size = 0, ifx != FALSE  -
  // bit = val & 0xZZ     - size = 1, ifx = FALSE -
  if ((AOP_TYPE (right) == AOP_LIT) &&
      (AOP_TYPE (result) == AOP_CRY) &&
      (AOP_TYPE (left) != AOP_CRY))
    {
      symbol *tlbl = newiTempLabel (NULL);
      int sizel = AOP_SIZE (left);

      if (size)
        {
          /* PENDING: Test case for this. */
          wassertl (0, "Tried to XOR left against a literal with the result going into a bit");
        }
      while (sizel--)
        {
          _moveA (aopGet (AOP (left), offset, FALSE));
          emit2 ("xor a,%s", aopGet (AOP (right), offset, FALSE));
          emit2 ("!shortjp nz,!tlabel", tlbl->key + 100);
          offset++;
        }
      if (ifx)
        {
          jmpTrueOrFalse (ifx, tlbl);
        }
      else
        {
          wassertl (0, "Result of XOR was destined for a bit");
        }
      goto release;
    }

  /* if left is same as result */
  if (sameRegs (AOP (result), AOP (left)))
    {
      for (; size--; offset++)
	{
	  if (AOP_TYPE (right) == AOP_LIT)
	    {
	      if (((lit >> (offset * 8)) & 0x0FFL) == 0x00L)
		continue;
	      else
		{
		  _moveA (aopGet (AOP (right), offset, FALSE));
		  emit2 ("xor a,%s",
			    aopGet (AOP (left), offset, FALSE));
		  aopPut (AOP (result), "a", offset);
		}
	    }
	  else
	    {
	      if (AOP_TYPE (left) == AOP_ACC)
                {
                  emit2 ("xor a,%s", aopGet (AOP (right), offset, FALSE));
                }
	      else
		{
		  _moveA (aopGet (AOP (right), offset, FALSE));
		  emit2 ("xor a,%s",
			    aopGet (AOP (left), offset, FALSE));
		  aopPut (AOP (result), "a", 0);
		}
	    }
	}
    }
  else
    {
      // left & result in different registers
      if (AOP_TYPE (result) == AOP_CRY)
	{
	  wassertl (0, "Result of XOR is in a bit");
	}
      else
	for (; (size--); offset++)
	  {
	    // normal case
	    // result = left & right
	    if (AOP_TYPE (right) == AOP_LIT)
	      {
		if (((lit >> (offset * 8)) & 0x0FFL) == 0x00L)
		  {
		    aopPut (AOP (result),
			    aopGet (AOP (left), offset, FALSE),
			    offset);
		    continue;
		  }
	      }
	    // faster than result <- left, anl result,right
	    // and better if result is SFR
	    if (AOP_TYPE (left) == AOP_ACC) 
              {
                emit2 ("xor a,%s", aopGet (AOP (right), offset, FALSE));
              }
	    else
	      {
		_moveA (aopGet (AOP (right), offset, FALSE));
		emit2 ("xor a,%s",
			  aopGet (AOP (left), offset, FALSE));
	      }
	    aopPut (AOP (result), "a", offset);
	  }
    }

release:
  freeAsmop (left, NULL, ic);
  freeAsmop (right, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genInline - write the inline code out                           */
/*-----------------------------------------------------------------*/
static void
genInline (iCode * ic)
{
  char *buffer, *bp, *bp1;

  _G.lines.isInline += (!options.asmpeep);

  buffer = bp = bp1 = Safe_calloc(1, strlen(IC_INLINE(ic))+1);
  strcpy (buffer, IC_INLINE (ic));

  /* emit each line as a code */
  while (*bp)
    {
      if (*bp == '\n')
	{
	  *bp++ = '\0';
	  emit2 (bp1);
	  bp1 = bp;
	}
      else
	{
	  if (*bp == ':')
	    {
	      bp++;
	      *bp = '\0';
	      bp++;
	      emit2 (bp1);
	      bp1 = bp;
	    }
	  else
	    bp++;
	}
    }
  if (bp1 != bp)
    emit2 (bp1);
  _G.lines.isInline -= (!options.asmpeep);

}

/*-----------------------------------------------------------------*/
/* genRRC - rotate right with carry                                */
/*-----------------------------------------------------------------*/
static void
genRRC (iCode * ic)
{
  wassert (0);
}

/*-----------------------------------------------------------------*/
/* genRLC - generate code for rotate left with carry               */
/*-----------------------------------------------------------------*/
static void
genRLC (iCode * ic)
{
  wassert (0);
}

/*-----------------------------------------------------------------*/
/* genGetHbit - generates code get highest order bit               */
/*-----------------------------------------------------------------*/
static void
genGetHbit (iCode * ic)
{
  operand *left, *result;
  left = IC_LEFT (ic);
  result = IC_RESULT (ic);
  aopOp (left, ic, FALSE, FALSE);
  aopOp (result, ic, FALSE, FALSE);

  /* get the highest order byte into a */
  emit2("ld a,%s", aopGet (AOP (left), AOP_SIZE (left) - 1, FALSE));

  if (AOP_TYPE (result) == AOP_CRY)
    {
      emit2 ("rl a");
      outBitC (result);
    }
  else
    {
      emit2 ("rlc a");
      /* PENDING: For re-target. */
      emit2 ("and a,#1");
      outAcc (result);
    }


  freeAsmop (left, NULL, ic);
  freeAsmop (result, NULL, ic);
}

static void
emitRsh2 (asmop *aop, int size, int is_signed)
{
  int offset = 0;

  while (size--)
    {
      const char *l = aopGet (aop, size, FALSE);
      if (offset == 0)
        {
          emit2 ("%s %s", is_signed ? "sra" : "srl", l);
        }
      else
        {
          emit2 ("rr %s", l);
        }
      offset++;
    }
}

/*-----------------------------------------------------------------*/
/* shiftR2Left2Result - shift right two bytes from left to result  */
/*-----------------------------------------------------------------*/
static void
shiftR2Left2Result (operand * left, int offl,
		    operand * result, int offr,
		    int shCount, int is_signed)
{
  int size = 2;
  symbol *tlbl, *tlbl1;

  movLeft2Result (left, offl, result, offr, 0);
  movLeft2Result (left, offl + 1, result, offr + 1, 0);

  /*  if (AOP(result)->type == AOP_REG) { */
  
  tlbl = newiTempLabel (NULL);
  tlbl1 = newiTempLabel (NULL);

  /* Left is already in result - so now do the shift */
  if (shCount <= 4)
    {
      while (shCount--)
        {
          emitRsh2 (AOP (result), size, is_signed);
        }
    }
  else
    {
      emit2 ("ld a,!immedbyte+1", shCount);
      emit2 ("!shortjp !tlabel", tlbl1->key + 100);
      emitLabel (tlbl->key + 100);

      emitRsh2 (AOP (result), size, is_signed);

      emitLabel (tlbl1->key + 100);
      emit2 ("dec a");
      emit2 ("!shortjp nz,!tlabel", tlbl->key + 100);
    }
}

/*-----------------------------------------------------------------*/
/* shiftL2Left2Result - shift left two bytes from left to result   */
/*-----------------------------------------------------------------*/
static void
shiftL2Left2Result (operand * left, int offl,
		    operand * result, int offr, int shCount)
{
  if (sameRegs (AOP (result), AOP (left)) &&
      ((offl + MSB16) == offr))
    {
      wassert (0);
    }
  else
    {
      /* Copy left into result */
      movLeft2Result (left, offl, result, offr, 0);
      movLeft2Result (left, offl + 1, result, offr + 1, 0);
    }
  /* PENDING: for now just see if it'll work. */
  /*if (AOP(result)->type == AOP_REG) { */
  {
    int size = 2;
    int offset = 0;
    symbol *tlbl, *tlbl1;
    const char *l;

    tlbl = newiTempLabel (NULL);
    tlbl1 = newiTempLabel (NULL);

    /* Left is already in result - so now do the shift */
    if (shCount > 1)
      {
	emit2 ("ld a,!immedbyte+1", shCount);
	emit2 ("!shortjp !tlabel", tlbl1->key + 100);
	emitLabel (tlbl->key + 100);
      }

    while (size--)
      {
	l = aopGet (AOP (result), offset, FALSE);

        if (offset == 0)
          {
            emit2 ("sla %s", l);
          }
        else
          {
            emit2 ("rl %s", l);
          }

        offset++;
      }
    if (shCount > 1)
      {
	emitLabel (tlbl1->key + 100);
	emit2 ("dec a");
	emit2 ("!shortjp nz,!tlabel", tlbl->key + 100);
      }
  }
}

/*-----------------------------------------------------------------*/
/* AccRol - rotate left accumulator by known count                 */
/*-----------------------------------------------------------------*/
static void
AccRol (int shCount)
{
  shCount &= 0x0007;		// shCount : 0..7

  switch (shCount)
    {
    case 0:
      break;
    case 1:
      emit2 ("sla a");
      break;
    case 2:
      emit2 ("sla a");
      emit2 ("rl a");
      break;
    case 3:
      emit2 ("sla a");
      emit2 ("rl a");
      emit2 ("rl a");
      break;
    case 4:
      emit2 ("sla a");
      emit2 ("rl a");
      emit2 ("rl a");
      emit2 ("rl a");
      break;
    case 5:
      emit2 ("srl a");
      emit2 ("rr a");
      emit2 ("rr a");
      break;
    case 6:
      emit2 ("srl a");
      emit2 ("rr a");
      break;
    case 7:
      emit2 ("srl a");
      break;
    }
}

/*-----------------------------------------------------------------*/
/* AccLsh - left shift accumulator by known count                  */
/*-----------------------------------------------------------------*/
static void
AccLsh (int shCount)
{
  static const unsigned char SLMask[] =
    {
      0xFF, 0xFE, 0xFC, 0xF8, 0xF0, 0xE0, 0xC0, 0x80, 0x00
    };

  if (shCount != 0)
    {
      if (shCount == 1)
	{
	  emit2 ("add a,a");
	}
      else if (shCount == 2)
	{
	  emit2 ("add a,a");
	  emit2 ("add a,a");
	}
      else
	{
	  /* rotate left accumulator */
	  AccRol (shCount);
	  /* and kill the lower order bits */
	  emit2 ("and a,!immedbyte", SLMask[shCount]);
	}
    }
}

/*-----------------------------------------------------------------*/
/* shiftL1Left2Result - shift left one byte from left to result    */
/*-----------------------------------------------------------------*/
static void
shiftL1Left2Result (operand * left, int offl,
		    operand * result, int offr, int shCount)
{
  const char *l;
  l = aopGet (AOP (left), offl, FALSE);
  _moveA (l);
  /* shift left accumulator */
  AccLsh (shCount);
  aopPut (AOP (result), "a", offr);
}


/*-----------------------------------------------------------------*/
/* genlshTwo - left shift two bytes by known amount != 0           */
/*-----------------------------------------------------------------*/
static void
genlshTwo (operand * result, operand * left, int shCount)
{
  int size = AOP_SIZE (result);

  wassert (size == 2);

  /* if shCount >= 8 */
  if (shCount >= 8)
    {
      shCount -= 8;
      if (size > 1)
	{
	  if (shCount)
	    {
	      movLeft2Result (left, LSB, result, MSB16, 0);
	      aopPut (AOP (result), "!zero", 0);
	      shiftL1Left2Result (left, LSB, result, MSB16, shCount);
	    }
	  else
	    {
	      movLeft2Result (left, LSB, result, MSB16, 0);
	      aopPut (AOP (result), "!zero", 0);
	    }
	}
      else
	{
	  aopPut (AOP (result), "!zero", LSB);
	}
    }
  /*  1 <= shCount <= 7 */
  else
    {
      if (size == 1)
	{
	  wassert (0);
	}
      else
	{
	  shiftL2Left2Result (left, LSB, result, LSB, shCount);
	}
    }
}

/*-----------------------------------------------------------------*/
/* genlshOne - left shift a one byte quantity by known count       */
/*-----------------------------------------------------------------*/
static void
genlshOne (operand * result, operand * left, int shCount)
{
  shiftL1Left2Result (left, LSB, result, LSB, shCount);
}

/*-----------------------------------------------------------------*/
/* genLeftShiftLiteral - left shifting by known count              */
/*-----------------------------------------------------------------*/
static void
genLeftShiftLiteral (operand * left,
		     operand * right,
		     operand * result,
		     iCode * ic)
{
  int shCount = (int) floatFromVal (AOP (right)->aopu.aop_lit);
  int size;

  freeAsmop (right, NULL, ic);

  aopOp (left, ic, FALSE, FALSE);
  aopOp (result, ic, FALSE, FALSE);

  size = getSize (operandType (result));

  /* I suppose that the left size >= result size */
  if (shCount == 0)
    {
      wassert (0);
    }

  else if (shCount >= (size * 8)) 
    {
      while (size--)
        {
          aopPut (AOP (result), "!zero", size);
        }
    }
  else
    {
      switch (size)
	{
	case 1:
	  genlshOne (result, left, shCount);
	  break;
	case 2:
	  genlshTwo (result, left, shCount);
	  break;
	case 4:
	  wassertl (0, "Shifting of longs is currently unsupported");
	  break;
	default:
	  wassert (0);
	}
    }
  freeAsmop (left, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genLeftShift - generates code for left shifting                 */
/*-----------------------------------------------------------------*/
static void
genLeftShift (iCode * ic)
{
  int size, offset;
  const char *l;
  symbol *tlbl, *tlbl1;
  operand *left, *right, *result;

  right = IC_RIGHT (ic);
  left = IC_LEFT (ic);
  result = IC_RESULT (ic);

  aopOp (right, ic, FALSE, FALSE);

  /* if the shift count is known then do it
     as efficiently as possible */
  if (AOP_TYPE (right) == AOP_LIT)
    {
      genLeftShiftLiteral (left, right, result, ic);
      return;
    }

  /* shift count is unknown then we have to form a loop get the loop
     count in B : Note: we take only the lower order byte since
     shifting more that 32 bits make no sense anyway, ( the largest
     size of an object can be only 32 bits ) */
  emit2 ("ld a,%s", aopGet (AOP (right), 0, FALSE));
  emit2 ("inc a");
  freeAsmop (right, NULL, ic);
  aopOp (left, ic, FALSE, FALSE);
  aopOp (result, ic, FALSE, FALSE);

  /* now move the left to the result if they are not the
     same */

  if (!sameRegs (AOP (left), AOP (result)))
    {

      size = AOP_SIZE (result);
      offset = 0;
      while (size--)
	{
	  l = aopGet (AOP (left), offset, FALSE);
	  aopPut (AOP (result), l, offset);
	  offset++;
	}
    }

  tlbl = newiTempLabel (NULL);
  size = AOP_SIZE (result);
  offset = 0;
  tlbl1 = newiTempLabel (NULL);

  emit2 ("!shortjp !tlabel", tlbl1->key + 100);
  emitLabel (tlbl->key + 100);
  l = aopGet (AOP (result), offset, FALSE);

  while (size--)
    {
      l = aopGet (AOP (result), offset, FALSE);

      if (offset == 0)
        {
          emit2 ("sla %s", l);
        }
      else
        {
          emit2 ("rl %s", l);
        }
      offset++;
    }
  emitLabel (tlbl1->key + 100);
  emit2 ("dec a");
  emit2 ("!shortjp nz,!tlabel", tlbl->key + 100);

  freeAsmop (left, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genrshOne - left shift two bytes by known amount != 0           */
/*-----------------------------------------------------------------*/
static void
genrshOne (operand * result, operand * left, int shCount, int is_signed)
{
  /* Errk */
  int size = AOP_SIZE (result);
  const char *l;

  wassert (size == 1);
  wassert (shCount < 8);

  l = aopGet (AOP (left), 0, FALSE);

  if (AOP (result)->type == AOP_REG)
    {
      aopPut (AOP (result), l, 0);
      l = aopGet (AOP (result), 0, FALSE);
      while (shCount--)
        {
          emit2 ("%s %s", is_signed ? "sra" : "srl", l);
        }
    }
  else
    {
      _moveA (l);
      while (shCount--)
	{
	  emit2 ("%s a", is_signed ? "sra" : "srl");
	}
      aopPut (AOP (result), "a", 0);
    }
}

/*-----------------------------------------------------------------*/
/* AccRsh - right shift accumulator by known count                 */
/*-----------------------------------------------------------------*/
static void
AccRsh (int shCount)
{
  static const unsigned char SRMask[] =
    {
      0xFF, 0x7F, 0x3F, 0x1F, 0x0F, 0x07, 0x03, 0x01, 0x00
    };

  if (shCount != 0)
    {
      /* rotate right accumulator */
      AccRol (8 - shCount);
      /* and kill the higher order bits */
      emit2 ("and a,!immedbyte", SRMask[shCount]);
    }
}

/*-----------------------------------------------------------------*/
/* shiftR1Left2Result - shift right one byte from left to result   */
/*-----------------------------------------------------------------*/
static void
shiftR1Left2Result (operand * left, int offl,
		    operand * result, int offr,
		    int shCount, int sign)
{
  _moveA (aopGet (AOP (left), offl, FALSE));
  if (sign)
    {
      while (shCount--)
	{
	  emit2 ("%s a", sign ? "sra" : "srl");
	}
    }
  else
    {
      AccRsh (shCount);
    }
  aopPut (AOP (result), "a", offr);
}

/*-----------------------------------------------------------------*/
/* genrshTwo - right shift two bytes by known amount != 0          */
/*-----------------------------------------------------------------*/
static void
genrshTwo (operand * result, operand * left,
	   int shCount, int sign)
{
  /* if shCount >= 8 */
  if (shCount >= 8)
    {
      shCount -= 8;
      if (shCount)
	{
	  shiftR1Left2Result (left, MSB16, result, LSB,
			      shCount, sign);
	}
      else
	{
	  movLeft2Result (left, MSB16, result, LSB, sign);
	}
      if (sign)
        {
          /* Sign extend the result */
          _moveA(aopGet (AOP (result), 0, FALSE));
          emit2 ("rlc a");
          emit2 ("sbc a,a");

          aopPut (AOP (result), ACC_NAME, MSB16);
        }
      else
        {
          aopPut (AOP (result), "!zero", 1);
        }
    }
  /*  1 <= shCount <= 7 */
  else
    {
      shiftR2Left2Result (left, LSB, result, LSB, shCount, sign);
    }
}

/*-----------------------------------------------------------------*/
/* genRightShiftLiteral - left shifting by known count              */
/*-----------------------------------------------------------------*/
static void
genRightShiftLiteral (operand * left,
		      operand * right,
		      operand * result,
		      iCode * ic,
                      int sign)
{
  int shCount = (int) floatFromVal (AOP (right)->aopu.aop_lit);
  int size;

  freeAsmop (right, NULL, ic);

  aopOp (left, ic, FALSE, FALSE);
  aopOp (result, ic, FALSE, FALSE);

  size = getSize (operandType (result));

  /* I suppose that the left size >= result size */
  if (shCount == 0)
    {
      wassert (0);
    }

  else if (shCount >= (size * 8))
    while (size--)
      aopPut (AOP (result), "!zero", size);
  else
    {
      switch (size)
	{
	case 1:
	  genrshOne (result, left, shCount, sign);
	  break;
	case 2:
	  genrshTwo (result, left, shCount, sign);
	  break;
	case 4:
	  wassertl (0, "Asked to shift right a long which should be a function call");
	  break;
	default:
	  wassertl (0, "Entered default case in right shift delegate");
	}
    }
  freeAsmop (left, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genRightShift - generate code for right shifting                */
/*-----------------------------------------------------------------*/
static void
genRightShift (iCode * ic)
{
  operand *right, *left, *result;
  sym_link *retype;
  int size, offset, first = 1;
  const char *l;
  bool is_signed;

  symbol *tlbl, *tlbl1;

  /* if signed then we do it the hard way preserve the
     sign bit moving it inwards */
  retype = getSpec (operandType (IC_RESULT (ic)));

  is_signed = !SPEC_USIGN (retype);

  /* signed & unsigned types are treated the same : i.e. the
     signed is NOT propagated inwards : quoting from the
     ANSI - standard : "for E1 >> E2, is equivalent to division
     by 2**E2 if unsigned or if it has a non-negative value,
     otherwise the result is implementation defined ", MY definition
     is that the sign does not get propagated */

  right = IC_RIGHT (ic);
  left = IC_LEFT (ic);
  result = IC_RESULT (ic);

  aopOp (right, ic, FALSE, FALSE);

  /* if the shift count is known then do it
     as efficiently as possible */
  if (AOP_TYPE (right) == AOP_LIT)
    {
      genRightShiftLiteral (left, right, result, ic, is_signed);
      return;
    }

  aopOp (left, ic, FALSE, FALSE);
  aopOp (result, ic, FALSE, FALSE);

  /* now move the left to the result if they are not the
     same */
  if (!sameRegs (AOP (left), AOP (result)) &&
      AOP_SIZE (result) > 1)
    {

      size = AOP_SIZE (result);
      offset = 0;
      while (size--)
	{
	  l = aopGet (AOP (left), offset, FALSE);
	  aopPut (AOP (result), l, offset);
	  offset++;
	}
    }

  emit2 ("ld a,%s", aopGet (AOP (right), 0, FALSE));
  emit2 ("inc a");
  freeAsmop (right, NULL, ic);

  tlbl = newiTempLabel (NULL);
  tlbl1 = newiTempLabel (NULL);
  size = AOP_SIZE (result);
  offset = size - 1;

  emit2 ("!shortjp !tlabel", tlbl1->key + 100);
  emitLabel (tlbl->key + 100);
  while (size--)
    {
      l = aopGet (AOP (result), offset--, FALSE);
      if (first)
	{
          emit2 ("%s %s", is_signed ? "sra" : "srl", l);
	  first = 0;
	}
      else
        {
          emit2 ("rr %s", l);
        }
    }
  emitLabel (tlbl1->key + 100);
  emit2 ("dec a");
  emit2 ("!shortjp nz,!tlabel", tlbl->key + 100);

  freeAsmop (left, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genGenPointerGet -  get value from generic pointer space        */
/*-----------------------------------------------------------------*/
static void
genGenPointerGet (operand * left,
		  operand * result, iCode * ic)
{
  int size, offset;
  sym_link *retype = getSpec (operandType (result));
  int pair = PAIR_HL;

  if (IS_GB)
    pair = PAIR_DE;

  aopOp (left, ic, FALSE, FALSE);
  aopOp (result, ic, FALSE, FALSE);

  if (isPair (AOP (left)) && AOP_SIZE (result) == 1)
    {
      /* Just do it */
      if (isPtrPair (AOP (left)))
	{
	  tsprintf (buffer, "!*pair", getPairName (AOP (left)));
	  aopPut (AOP (result), buffer, 0);
	}
      else
	{
	  emit2 ("ld a,!*pair", getPairName (AOP (left)));
	  aopPut (AOP (result), "a", 0);
	}
      freeAsmop (left, NULL, ic);
      goto release;
    }

  /* For now we always load into IY */
  /* if this is remateriazable */
  fetchPair (pair, AOP (left));

  /* so iy now contains the address */
  freeAsmop (left, NULL, ic);

  /* if bit then unpack */
  if (IS_BITVAR (retype))
    {
      wassert (0);
    }
  else
    {
      size = AOP_SIZE (result);
      offset = 0;

      while (size--)
	{
	  /* PENDING: make this better */
	  if (!IS_GB && AOP (result)->type == AOP_REG)
	    {
	      aopPut (AOP (result), "!*hl", offset++);
	    }
	  else
	    {
	      emit2 ("ld a,!*pair", _pairs[pair].name);
	      aopPut (AOP (result), "a", offset++);
	    }
	  if (size)
	    {
	      emit2 ("inc %s", _pairs[pair].name);
	      _G.pairs[pair].offset++;
	    }
	}
    }

release:
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genPointerGet - generate code for pointer get                   */
/*-----------------------------------------------------------------*/
static void
genPointerGet (iCode * ic)
{
  operand *left, *result;
  sym_link *type, *etype;

  left = IC_LEFT (ic);
  result = IC_RESULT (ic);

  /* depending on the type of pointer we need to
     move it to the correct pointer register */
  type = operandType (left);
  etype = getSpec (type);

  genGenPointerGet (left, result, ic);
}

bool
isRegOrLit (asmop * aop)
{
  if (aop->type == AOP_REG || aop->type == AOP_LIT || aop->type == AOP_IMMD)
    return TRUE;
  return FALSE;
}

/*-----------------------------------------------------------------*/
/* genGenPointerSet - stores the value into a pointer location        */
/*-----------------------------------------------------------------*/
static void
genGenPointerSet (operand * right,
		  operand * result, iCode * ic)
{
  int size, offset;
  sym_link *retype = getSpec (operandType (right));
  PAIR_ID pairId = PAIR_HL;

  aopOp (result, ic, FALSE, FALSE);
  aopOp (right, ic, FALSE, FALSE);

  if (IS_GB)
    pairId = PAIR_DE;

  /* Handle the exceptions first */
  if (isPair (AOP (result)) && (AOP_SIZE (right) == 1))
    {
      /* Just do it */
      const char *l = aopGet (AOP (right), 0, FALSE);
      const char *pair = getPairName (AOP (result));
      if (canAssignToPtr (l) && isPtr (pair))
	{
	  emit2 ("ld !*pair,%s", pair, l);
	}
      else
	{
	  _moveA (l);
	  emit2 ("ld !*pair,a", pair);
	}
      goto release;
    }

  /* if the operand is already in dptr
     then we do nothing else we move the value to dptr */
  if (AOP_TYPE (result) != AOP_STR)
    {
      fetchPair (pairId, AOP (result));
    }
  /* so hl know contains the address */
  freeAsmop (result, NULL, ic);

  /* if bit then unpack */
  if (IS_BITVAR (retype))
    {
      wassert (0);
    }
  else
    {
      size = AOP_SIZE (right);
      offset = 0;

      while (size--)
	{
	  const char *l = aopGet (AOP (right), offset, FALSE);
	  if (isRegOrLit (AOP (right)) && !IS_GB)
	    {
	      emit2 ("ld !*pair,%s", _pairs[pairId].name, l);
	    }
	  else
	    {
	      _moveA (l);
	      emit2 ("ld !*pair,a", _pairs[pairId].name);
	    }
	  if (size)
	    {
	      emit2 ("inc %s", _pairs[pairId].name);
	      _G.pairs[pairId].offset++;
	    }
	  offset++;
	}
    }
release:
  freeAsmop (right, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genPointerSet - stores the value into a pointer location        */
/*-----------------------------------------------------------------*/
static void
genPointerSet (iCode * ic)
{
  operand *right, *result;
  sym_link *type, *etype;

  right = IC_RIGHT (ic);
  result = IC_RESULT (ic);

  /* depending on the type of pointer we need to
     move it to the correct pointer register */
  type = operandType (result);
  etype = getSpec (type);

  genGenPointerSet (right, result, ic);
}

/*-----------------------------------------------------------------*/
/* genIfx - generate code for Ifx statement                        */
/*-----------------------------------------------------------------*/
static void
genIfx (iCode * ic, iCode * popIc)
{
  operand *cond = IC_COND (ic);
  int isbit = 0;

  aopOp (cond, ic, FALSE, TRUE);

  /* get the value into acc */
  if (AOP_TYPE (cond) != AOP_CRY)
    _toBoolean (cond);
  else
    isbit = 1;
  /* the result is now in the accumulator */
  freeAsmop (cond, NULL, ic);

  /* if there was something to be popped then do it */
  if (popIc)
    genIpop (popIc);

  /* if the condition is  a bit variable */
  if (isbit && IS_ITEMP (cond) &&
      SPIL_LOC (cond))
    genIfxJump (ic, SPIL_LOC (cond)->rname);
  else if (isbit && !IS_ITEMP (cond))
    genIfxJump (ic, OP_SYMBOL (cond)->rname);
  else
    genIfxJump (ic, "a");

  ic->generated = 1;
}

/*-----------------------------------------------------------------*/
/* genAddrOf - generates code for address of                       */
/*-----------------------------------------------------------------*/
static void
genAddrOf (iCode * ic)
{
  symbol *sym = OP_SYMBOL (IC_LEFT (ic));

  aopOp (IC_RESULT (ic), ic, FALSE, FALSE);

  /* if the operand is on the stack then we
     need to get the stack offset of this
     variable */
  if (IS_GB)
    {
      if (sym->onStack)
	{
	  spillCached ();
	  if (sym->stack <= 0)
	    {
              setupPairFromSP (PAIR_HL, sym->stack + _G.stack.pushed + _G.stack.offset);
	    }
	  else
	    {
              setupPairFromSP (PAIR_HL, sym->stack + _G.stack.pushed + _G.stack.offset + _G.stack.param_offset);
	    }
          commitPair (AOP (IC_RESULT (ic)), PAIR_HL);
	}
      else
	{
	  emit2 ("ld de,!hashedstr", sym->rname);
          commitPair (AOP (IC_RESULT (ic)), PAIR_DE);
	}
    }
  else
    {
      spillCached ();
      if (sym->onStack)
	{
	  /* if it has an offset  then we need to compute it */
	  if (sym->stack > 0)
	    emit2 ("ld hl,#%d+%d+%d+%d", sym->stack, _G.stack.pushed, _G.stack.offset, _G.stack.param_offset);
	  else
	    emit2 ("ld hl,#%d+%d+%d", sym->stack, _G.stack.pushed, _G.stack.offset);
	  emit2 ("add hl,sp");
	}
      else
	{
	  emit2 ("ld hl,#%s", sym->rname);
	}
      commitPair (AOP (IC_RESULT (ic)), PAIR_HL);
    }
  freeAsmop (IC_RESULT (ic), NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genAssign - generate code for assignment                        */
/*-----------------------------------------------------------------*/
static void
genAssign (iCode * ic)
{
  operand *result, *right;
  int size, offset;
  unsigned long lit = 0L;

  result = IC_RESULT (ic);
  right = IC_RIGHT (ic);

  /* Dont bother assigning if they are the same */
  if (operandsEqu (IC_RESULT (ic), IC_RIGHT (ic)))
    {
      emitDebug ("; (operands are equal %u)", operandsEqu (IC_RESULT (ic), IC_RIGHT (ic)));
      return;
    }

  aopOp (right, ic, FALSE, FALSE);
  aopOp (result, ic, TRUE, FALSE);

  /* if they are the same registers */
  if (sameRegs (AOP (right), AOP (result)))
    {
      emitDebug ("; (registers are the same)");
      goto release;
    }

  /* if the result is a bit */
  if (AOP_TYPE (result) == AOP_CRY)
    {
      wassertl (0, "Tried to assign to a bit");
    }

  /* general case */
  size = AOP_SIZE (result);
  offset = 0;

  if (AOP_TYPE (right) == AOP_LIT)
    lit = (unsigned long) floatFromVal (AOP (right)->aopu.aop_lit);
  if (isPair (AOP (result)))
    {
      fetchPair (getPairId (AOP (result)), AOP (right));
    }
  else if ((size > 1) &&
	   (AOP_TYPE (result) != AOP_REG) &&
	   (AOP_TYPE (right) == AOP_LIT) &&
	   !IS_FLOAT (operandType (right)) &&
	   (lit < 256L))
    {
      bool fXored = FALSE;
      offset = 0;
      /* Work from the top down.
         Done this way so that we can use the cached copy of 0
         in A for a fast clear */
      while (size--)
	{
	  if ((unsigned int) ((lit >> (offset * 8)) & 0x0FFL) == 0)
	    {
	      if (!fXored && size > 1)
		{
		  emit2 ("xor a,a");
		  fXored = TRUE;
		}
	      if (fXored)
		{
		  aopPut (AOP (result), "a", offset);
		}
	      else
		{
		  aopPut (AOP (result), "!zero", offset);
		}
	    }
	  else
	    aopPut (AOP (result),
		    aopGet (AOP (right), offset, FALSE),
		    offset);
	  offset++;
	}
    }
  else if (size == 2 && requiresHL (AOP (right)) && requiresHL (AOP (result)) && IS_GB)
    {
      /* Special case.  Load into a and d, then load out. */
      _moveA (aopGet (AOP (right), 0, FALSE));
      emit2 ("ld e,%s", aopGet (AOP (right), 1, FALSE));
      aopPut (AOP (result), "a", 0);
      aopPut (AOP (result), "e", 1);
    }
  else if (size == 4 && requiresHL (AOP (right)) && requiresHL (AOP (result)) && IS_GB)
    {
      /* Special case - simple memcpy */
      aopGet (AOP (right), LSB, FALSE);
      emit2 ("ld d,h");
      emit2 ("ld e,l");
      aopGet (AOP (result), LSB, FALSE);

      while (size--)
        {
          emit2 ("ld a,(de)");
          /* Peephole will optimise this. */
          emit2 ("ld (hl),a");

          if (size != 0)
            {
              emit2 ("inc hl");
              emit2 ("inc de");
            }
        }
      spillPair (PAIR_HL);
    }
  else
    {
      while (size--)
	{
	  /* PENDING: do this check better */
	  if (requiresHL (AOP (right)) && requiresHL (AOP (result)))
	    {
	      _moveA (aopGet (AOP (right), offset, FALSE));
	      aopPut (AOP (result), "a", offset);
	    }
	  else
	    aopPut (AOP (result),
		    aopGet (AOP (right), offset, FALSE),
		    offset);
	  offset++;
	}
    }

release:
  freeAsmop (right, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genJumpTab - genrates code for jump table                       */
/*-----------------------------------------------------------------*/
static void
genJumpTab (iCode * ic)
{
  symbol *jtab;
  const char *l;

  aopOp (IC_JTCOND (ic), ic, FALSE, FALSE);
  /* get the condition into accumulator */
  l = aopGet (AOP (IC_JTCOND (ic)), 0, FALSE);
  if (!IS_GB)
    emit2 ("push de");
  emit2 ("ld e,%s", l);
  emit2 ("ld d,!zero");
  jtab = newiTempLabel (NULL);
  spillCached ();
  emit2 ("ld hl,!immed!tlabel", jtab->key + 100);
  emit2 ("add hl,de");
  emit2 ("add hl,de");
  emit2 ("add hl,de");
  freeAsmop (IC_JTCOND (ic), NULL, ic);
  if (!IS_GB)
    emit2 ("pop de");
  emit2 ("jp !*hl");
  emitLabel (jtab->key + 100);
  /* now generate the jump labels */
  for (jtab = setFirstItem (IC_JTLABELS (ic)); jtab;
       jtab = setNextItem (IC_JTLABELS (ic)))
    emit2 ("jp !tlabel", jtab->key + 100);
}

/*-----------------------------------------------------------------*/
/* genCast - gen code for casting                                  */
/*-----------------------------------------------------------------*/
static void
genCast (iCode * ic)
{
  operand *result = IC_RESULT (ic);
  sym_link *ctype = operandType (IC_LEFT (ic));
  operand *right = IC_RIGHT (ic);
  int size, offset;

  /* if they are equivalent then do nothing */
  if (operandsEqu (IC_RESULT (ic), IC_RIGHT (ic)))
    return;

  aopOp (right, ic, FALSE, FALSE);
  aopOp (result, ic, FALSE, FALSE);

  /* if the result is a bit */
  if (AOP_TYPE (result) == AOP_CRY)
    {
      wassertl (0, "Tried to cast to a bit");
    }

  /* if they are the same size : or less */
  if (AOP_SIZE (result) <= AOP_SIZE (right))
    {

      /* if they are in the same place */
      if (sameRegs (AOP (right), AOP (result)))
	goto release;

      /* if they in different places then copy */
      size = AOP_SIZE (result);
      offset = 0;
      while (size--)
	{
	  aopPut (AOP (result),
		  aopGet (AOP (right), offset, FALSE),
		  offset);
	  offset++;
	}
      goto release;
    }

  /* So we now know that the size of destination is greater
     than the size of the source */
  /* we move to result for the size of source */
  size = AOP_SIZE (right);
  offset = 0;
  while (size--)
    {
      aopPut (AOP (result),
	      aopGet (AOP (right), offset, FALSE),
	      offset);
      offset++;
    }

  /* now depending on the sign of the destination */
  size = AOP_SIZE (result) - AOP_SIZE (right);
  /* Unsigned or not an integral type - right fill with zeros */
  if (SPEC_USIGN (ctype) || !IS_SPEC (ctype))
    {
      while (size--)
	aopPut (AOP (result), "!zero", offset++);
    }
  else
    {
      /* we need to extend the sign :{ */
        const char *l = aopGet (AOP (right), AOP_SIZE (right) - 1,
			FALSE);
      _moveA (l);
      emit2 ("rla ");
      emit2 ("sbc a,a");
      while (size--)
	aopPut (AOP (result), "a", offset++);
    }

release:
  freeAsmop (right, NULL, ic);
  freeAsmop (result, NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genReceive - generate code for a receive iCode                  */
/*-----------------------------------------------------------------*/
static void
genReceive (iCode * ic)
{
  if (isOperandInFarSpace (IC_RESULT (ic)) &&
      (OP_SYMBOL (IC_RESULT (ic))->isspilt ||
       IS_TRUE_SYMOP (IC_RESULT (ic))))
    {
      wassert (0);
    }
  else
    {
        // PENDING: HACK
        int size;
        int i;

        aopOp (IC_RESULT (ic), ic, FALSE, FALSE);
        size = AOP_SIZE(IC_RESULT(ic));

        for (i = 0; i < size; i++) {
            aopPut(AOP(IC_RESULT(ic)), _fReceive[_G.receiveOffset++], i);
	}
    }

  freeAsmop (IC_RESULT (ic), NULL, ic);
}

enum
  {
    /** Maximum number of bytes to emit per line. */
    DBEMIT_MAX_RUN = 8
  };

/** Context for the byte output chunker. */
typedef struct
{
  unsigned char buffer[DBEMIT_MAX_RUN];
  int pos;
} DBEMITCTX;


/** Flushes a byte chunker by writing out all in the buffer and
    reseting. 
*/
static void
_dbFlush(DBEMITCTX *self)
{
  char line[256];

  if (self->pos > 0)
    {
      int i;
      sprintf(line, ".db 0x%02X", self->buffer[0]);

      for (i = 1; i < self->pos; i++)
        {
          sprintf(line + strlen(line), ", 0x%02X", self->buffer[i]);
        }
      emit2(line);
    }
  self->pos = 0;
}

/** Write out another byte, buffering until a decent line is
    generated.
*/
static void
_dbEmit(DBEMITCTX *self, int c)
{
  if (self->pos == DBEMIT_MAX_RUN)
    {
      _dbFlush(self);
    }
  self->buffer[self->pos++] = c;
}

/** Context for a simple run length encoder. */
typedef struct
{
  unsigned last;
  unsigned char buffer[128];
  int pos;
  /** runLen may be equivalent to pos. */
  int runLen;
} RLECTX;

enum
  {
    RLE_CHANGE_COST = 4,
    RLE_MAX_BLOCK = 127
  };

/** Flush the buffer of a run length encoder by writing out the run or
    data that it currently contains.
*/
static void
_rleCommit(RLECTX *self)
{
  int i;
  if (self->pos != 0)
    {
      DBEMITCTX db;
      memset(&db, 0, sizeof(db));
          
      emit2(".db %u", self->pos);
      
      for (i = 0; i < self->pos; i++)
        {
          _dbEmit(&db, self->buffer[i]);
        }
      _dbFlush(&db);
    }
  /* Reset */
  self->pos = 0;
}

/* Encoder design:
   Can get either a run or a block of random stuff.
   Only want to change state if a good run comes in or a run ends.
   Detecting run end is easy.
   Initial state?

   Say initial state is in run, len zero, last zero.  Then if you get a
   few zeros then something else then a short run will be output.
   Seems OK.  While in run mode, keep counting.  While in random mode,
   keep a count of the run.  If run hits margin, output all up to run,
   restart, enter run mode.
*/

/** Add another byte into the run length encoder, flushing as
    required.  The run length encoder uses the Amiga IFF style, where
    a block is prefixed by its run length.  A positive length means
    the next n bytes pass straight through.  A negative length means
    that the next byte is repeated -n times.  A zero terminates the
    chunks.
*/
static void
_rleAppend(RLECTX *self, int c)
{
  int i;

  if (c != self->last)
    {
      /* The run has stopped.  See if it is worthwhile writing it out
         as a run.  Note that the random data comes in as runs of
         length one.
      */
      if (self->runLen > RLE_CHANGE_COST)
        {
          /* Yes, worthwhile. */
          /* Commit whatever was in the buffer. */
          _rleCommit(self);
          emit2(".db -%u,0x%02X", self->runLen, self->last);
        }
      else
        {
          /* Not worthwhile.  Append to the end of the random list. */
          for (i = 0; i < self->runLen; i++)
            {
              if (self->pos >= RLE_MAX_BLOCK)
                {
                  /* Commit. */
                  _rleCommit(self);
                }
              self->buffer[self->pos++] = self->last;
            }
        }
      self->runLen = 1;
      self->last = c;
    }
  else
    {
      if (self->runLen >= RLE_MAX_BLOCK)
        {
          /* Commit whatever was in the buffer. */
          _rleCommit(self);

          emit2 (".db -%u,0x%02X", self->runLen, self->last);
          self->runLen = 0;
        }
      self->runLen++;
    }
}

static void
_rleFlush(RLECTX *self)
{
  _rleAppend(self, -1);
  _rleCommit(self);
  self->pos = 0;
  self->last = 0;
  self->runLen = 0;
}

/** genArrayInit - Special code for initialising an array with constant
   data.
*/
static void
genArrayInit (iCode * ic)
{
  literalList *iLoop;
  int         ix;
  int         elementSize = 0, eIndex, i;
  unsigned    val, lastVal;
  sym_link    *type;
  RLECTX      rle;

  memset(&rle, 0, sizeof(rle));

  aopOp (IC_LEFT(ic), ic, FALSE, FALSE);

  _saveRegsForCall(ic, 0);

  fetchPair (PAIR_HL, AOP (IC_LEFT (ic)));
  emit2 ("call __initrleblock");
    
  type = operandType(IC_LEFT(ic));
    
  if (type && type->next)
    {
      elementSize = getSize(type->next);
    }
  else
    {
      wassertl (0, "Can't determine element size in genArrayInit.");
    }

  iLoop = IC_ARRAYILIST(ic);
  lastVal = (unsigned)-1;

  /* Feed all the bytes into the run length encoder which will handle
     the actual output.
     This works well for mixed char data, and for random int and long
     data.
  */
  while (iLoop)
    {
      ix = iLoop->count;

      if (ix != 0)
        {
          for (i = 0; i < ix; i++)
            {
              for (eIndex = 0; eIndex < elementSize; eIndex++)
                {
                  val = (((int)iLoop->literalValue) >> (eIndex * 8)) & 0xff;
                  _rleAppend(&rle, val);
                }
            }
	}
	
      iLoop = iLoop->next;
    }

  _rleFlush(&rle);
  /* Mark the end of the run. */
  emit2(".db 0");

  _restoreRegsAfterCall();

  spillCached ();

  freeAsmop (IC_LEFT(ic), NULL, ic);
}

/*-----------------------------------------------------------------*/
/* genZ80Code - generate code for Z80 based controllers            */
/*-----------------------------------------------------------------*/
void
genZ80Code (iCode * lic)
{
  iCode *ic;
  int cln = 0;

  /* Hack */
  if (IS_GB)
    {
      _fReturn = _gbz80_return;
      _fTmp = _gbz80_return;
    }
  else
    {
      _fReturn = _z80_return;
      _fTmp = _z80_return;
    }

  _G.lines.head = _G.lines.current = NULL;

  for (ic = lic; ic; ic = ic->next)
    {

      if (cln != ic->lineno)
	{
	  emit2 ("; %s %d", ic->filename, ic->lineno);
	  cln = ic->lineno;
	}
      /* if the result is marked as
         spilt and rematerializable or code for
         this has already been generated then
         do nothing */
      if (resultRemat (ic) || ic->generated)
	continue;

      /* depending on the operation */
      switch (ic->op)
	{
	case '!':
	  emitDebug ("; genNot");
	  genNot (ic);
	  break;

	case '~':
	  emitDebug ("; genCpl");
	  genCpl (ic);
	  break;

	case UNARYMINUS:
	  emitDebug ("; genUminus");
	  genUminus (ic);
	  break;

	case IPUSH:
	  emitDebug ("; genIpush");
	  genIpush (ic);
	  break;

	case IPOP:
	  /* IPOP happens only when trying to restore a
	     spilt live range, if there is an ifx statement
	     following this pop then the if statement might
	     be using some of the registers being popped which
	     would destory the contents of the register so
	     we need to check for this condition and handle it */
	  if (ic->next &&
	      ic->next->op == IFX &&
	      regsInCommon (IC_LEFT (ic), IC_COND (ic->next)))
	    {
              emitDebug ("; genIfx");
	      genIfx (ic->next, ic);
	    }
	  else
	    {
	      emitDebug ("; genIpop");
	      genIpop (ic);
	    }
	  break;

	case CALL:
	  emitDebug ("; genCall");
	  genCall (ic);
	  break;

	case PCALL:
	  emitDebug ("; genPcall");
	  genPcall (ic);
	  break;

	case FUNCTION:
	  emitDebug ("; genFunction");
	  genFunction (ic);
	  break;

	case ENDFUNCTION:
	  emitDebug ("; genEndFunction");
	  genEndFunction (ic);
	  break;

	case RETURN:
	  emitDebug ("; genRet");
	  genRet (ic);
	  break;

	case LABEL:
	  emitDebug ("; genLabel");
	  genLabel (ic);
	  break;

	case GOTO:
	  emitDebug ("; genGoto");
	  genGoto (ic);
	  break;

	case '+':
	  emitDebug ("; genPlus");
	  genPlus (ic);
	  break;

	case '-':
	  emitDebug ("; genMinus");
	  genMinus (ic);
	  break;

	case '*':
	  emitDebug ("; genMult");
	  genMult (ic);
	  break;

	case '/':
	  emitDebug ("; genDiv");
	  genDiv (ic);
	  break;

	case '%':
	  emitDebug ("; genMod");
	  genMod (ic);
	  break;

	case '>':
	  emitDebug ("; genCmpGt");
	  genCmpGt (ic, ifxForOp (IC_RESULT (ic), ic));
	  break;

	case '<':
	  emitDebug ("; genCmpLt");
	  genCmpLt (ic, ifxForOp (IC_RESULT (ic), ic));
	  break;

	case LE_OP:
	case GE_OP:
	case NE_OP:

	  /* note these two are xlated by algebraic equivalence
	     during parsing SDCC.y */
	  werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
		  "got '>=' or '<=' shouldn't have come here");
	  break;

	case EQ_OP:
	  emitDebug ("; genCmpEq");
	  genCmpEq (ic, ifxForOp (IC_RESULT (ic), ic));
	  break;

	case AND_OP:
	  emitDebug ("; genAndOp");
	  genAndOp (ic);
	  break;

	case OR_OP:
	  emitDebug ("; genOrOp");
	  genOrOp (ic);
	  break;

	case '^':
	  emitDebug ("; genXor");
	  genXor (ic, ifxForOp (IC_RESULT (ic), ic));
	  break;

	case '|':
	  emitDebug ("; genOr");
	  genOr (ic, ifxForOp (IC_RESULT (ic), ic));
	  break;

	case BITWISEAND:
	  emitDebug ("; genAnd");
	  genAnd (ic, ifxForOp (IC_RESULT (ic), ic));
	  break;

	case INLINEASM:
	  emitDebug ("; genInline");
	  genInline (ic);
	  break;

	case RRC:
	  emitDebug ("; genRRC");
	  genRRC (ic);
	  break;

	case RLC:
	  emitDebug ("; genRLC");
	  genRLC (ic);
	  break;

	case GETHBIT:
	  emitDebug ("; genGetHBIT");
	  genGetHbit (ic);
          break;

	case LEFT_OP:
	  emitDebug ("; genLeftShift");
	  genLeftShift (ic);
	  break;

	case RIGHT_OP:
	  emitDebug ("; genRightShift");
	  genRightShift (ic);
	  break;

	case GET_VALUE_AT_ADDRESS:
	  emitDebug ("; genPointerGet");
	  genPointerGet (ic);
	  break;

	case '=':

	  if (POINTER_SET (ic))
	    {
	      emitDebug ("; genAssign (pointer)");
	      genPointerSet (ic);
	    }
	  else
	    {
	      emitDebug ("; genAssign");
	      genAssign (ic);
	    }
	  break;

	case IFX:
          emitDebug ("; genIfx");
	  genIfx (ic, NULL);
	  break;

	case ADDRESS_OF:
	  emitDebug ("; genAddrOf");
	  genAddrOf (ic);
	  break;

	case JUMPTABLE:
	  emitDebug ("; genJumpTab");
	  genJumpTab (ic);
	  break;

	case CAST:
	  emitDebug ("; genCast");
	  genCast (ic);
	  break;

	case RECEIVE:
	  emitDebug ("; genReceive");
	  genReceive (ic);
	  break;

	case SEND:
	  emitDebug ("; addSet");
	  addSet (&_G.sendSet, ic);
	  break;

	case ARRAYINIT:
	  emitDebug ("; genArrayInit");
          genArrayInit(ic);
          break;
	    
	default:
	  ic = ic;
	}
    }


  /* now we are ready to call the
     peep hole optimizer */
  if (!options.nopeep)
    peepHole (&_G.lines.head);

  /* This is unfortunate */
  /* now do the actual printing */
  {
    FILE *fp = codeOutFile;
    if (isInHome () && codeOutFile == code->oFile)
      codeOutFile = home->oFile;
    printLine (_G.lines.head, codeOutFile);
    if (_G.flushStatics)
      {
	flushStatics ();
	_G.flushStatics = 0;
      }
    codeOutFile = fp;
  }

  freeTrace(&_G.lines.trace);
  freeTrace(&_G.trace.aops);
}

/*
  Attic
static int
_isPairUsed (iCode * ic, PAIR_ID pairId)
{
  int ret = 0;
  switch (pairId)
    {
    case PAIR_DE:
      if (bitVectBitValue (ic->rMask, D_IDX))
	ret++;
      if (bitVectBitValue (ic->rMask, E_IDX))
	ret++;
      break;
    default:
      wassert (0);
    }
  return ret;
}

static char *
fetchLitSpecial (asmop * aop, bool negate, bool xor)
{
  unsigned long v;
  value *val = aop->aopu.aop_lit;

  wassert (aop->type == AOP_LIT);
  wassert (!IS_FLOAT (val->type));

  v = (unsigned long) floatFromVal (val);

  if (xor)
    v ^= 0x8000;
  if (negate)
    v = 0-v;
  v &= 0xFFFF;

  tsprintf (buffer, "!immedword", v);
  return traceAlloc(&_G.trace.aops, Safe_strdup (buffer));
}


*/

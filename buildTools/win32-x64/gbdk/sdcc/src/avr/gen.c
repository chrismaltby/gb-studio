/*-------------------------------------------------------------------------
  avrgen.c - source file for code generation for ATMEL AVR

  Written By -  Sandeep Dutta . sandeep.dutta@usa.net (2000)

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

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "SDCCglobl.h"
#include "newalloc.h"

#ifdef HAVE_SYS_ISA_DEFS_H
#include <sys/isa_defs.h>
#else
#ifdef HAVE_MACHINE_ENDIAN_H
#include <machine/endian.h>
#else
#ifdef HAVE_ENDIAN_H
#include <endian.h>
#else
#if !defined(__BORLANDC__) && !defined(_MSC_VER) && !defined(__MINGW32__) && !defined(__CYGWIN__)
#warning "Cannot determine ENDIANESS of this machine assuming LITTLE_ENDIAN"
#warning "If you running sdcc on an INTEL 80x86 Platform you are okay"
#endif
#endif
#endif
#endif

#include "common.h"
#include "SDCCpeeph.h"
#include "ralloc.h"
#include "gen.h"

char *aopLiteral (value * val, int offset);
extern int allocInfo;

/* this is the down and dirty file with all kinds of
   kludgy & hacky stuff. This is what it is all about
   CODE GENERATION for a specific MCU . some of the
   routines may be reusable, will have to see */

static char *zero = "0x00";
static char *one = "0x01";
static char *spname;

char *fReturnAVR[] = { "r16", "r17", "r18", "r19" };
unsigned fAVRReturnSize = 4;	/* shared with ralloc.c */
char **fAVRReturn = fReturnAVR;
static char *larray[4] = { "lo8", "hi8", "hlo8", "hhi8" };

#if 0
// PENDING: Unused
static short rbank = -1;
static char *tscr[4] = { "r0", "r1", "r24", "r25" };
static unsigned char SLMask[] = { 0xFF, 0xFE, 0xFC, 0xF8, 0xF0,
	0xE0, 0xC0, 0x80, 0x00
};
static unsigned char SRMask[] = { 0xFF, 0x7F, 0x3F, 0x1F, 0x0F,
	0x07, 0x03, 0x01, 0x00
};

#endif

static struct {
	short xPushed;
	short zPushed;
	short accInUse;
	short inLine;
	short debugLine;
	short nRegsSaved;
	set *sendSet;
} _G;

extern int avr_ptrRegReq;
extern int avr_nRegs;
extern FILE *codeOutFile;
#define RESULTONSTACK(x) \
                         (IC_RESULT(x) && IC_RESULT(x)->aop && \
                         IC_RESULT(x)->aop->type == AOP_STK )

#define MOVR0(x) if (strcmp(x,"r0")) emitcode("mov","r0,%s",x);
#define MOVR24(x) if (strcmp(x,"r24")) emitcode("mov","r24,%s",x);
#define AOP_ISHIGHREG(a,n) (a->type == AOP_REG && a->aopu.aop_reg[n] && a->aopu.aop_reg[n]->rIdx >= R16_IDX)
#define CLRC    emitcode("clc","")
#define SETC    emitcode("stc","")
#define MOVA(x)
#define IS_REGIDX(a,r) (a->type == AOP_REG && a->aopu.aop_reg[0]->rIdx == r)

static lineNode *lineHead = NULL;
static lineNode *lineCurr = NULL;

#define LSB     0
#define MSB16   1
#define MSB24   2
#define MSB32   3

#if 0
// PENDING: Unused.
/*-----------------------------------------------------------------*/
/* reAdjustPreg - points a register back to where it should        */
/*-----------------------------------------------------------------*/
static void
reAdjustPreg (asmop * aop)
{
	int size;

	aop->coff = 0;
	if ((size = aop->size) <= 1)
		return;
	size--;
	switch (aop->type) {
	case AOP_X:
	case AOP_Z:
		emitcode ("sbiw", "%s,%d", aop->aopu.aop_ptr->name, size);
		break;
	}

}

/*-----------------------------------------------------------------*/
/* outBitC - output a bit C                                        */
/*-----------------------------------------------------------------*/
static void
outBitC (operand * result)
{
	emitcode ("clr", "r0");
	emitcode ("rol", "r0");
	outAcc (result);
}

/*-----------------------------------------------------------------*/
/* inExcludeList - return 1 if the string is in exclude Reg list   */
/*-----------------------------------------------------------------*/
static bool
inExcludeList (char *s)
{
	int i = 0;

	if (options.excludeRegs[i] &&
	    STRCASECMP (options.excludeRegs[i], "none") == 0)
		return FALSE;

	for (i = 0; options.excludeRegs[i]; i++) {
		if (options.excludeRegs[i] &&
		    STRCASECMP (s, options.excludeRegs[i]) == 0)
			return TRUE;
	}
	return FALSE;
}

/*-----------------------------------------------------------------*/
/* findLabelBackwards: walks back through the iCode chain looking  */
/* for the given label. Returns number of iCode instructions     */
/* between that label and given ic.          */
/* Returns zero if label not found.          */
/*-----------------------------------------------------------------*/
static int
findLabelBackwards (iCode * ic, int key)
{
	int count = 0;

	while (ic->prev) {
		ic = ic->prev;
		count++;

		if (ic->op == LABEL && IC_LABEL (ic)->key == key) {
			/* printf("findLabelBackwards = %d\n", count); */
			return count;
		}
	}

	return 0;
}

/*-----------------------------------------------------------------*/
/* addSign - complete with sign                                    */
/*-----------------------------------------------------------------*/
static void
addSign (operand * result, int offset, int sign)
{
	int size = (getDataSize (result) - offset);
	if (size > 0) {
		if (sign) {
			emitcode ("rlc", "a");
			emitcode ("subb", "a,acc");
			while (size--)
				aopPut (AOP (result), "a", offset++);
		}
		else
			while (size--)
				aopPut (AOP (result), zero, offset++);
	}
}

/*-----------------------------------------------------------------*/
/* isLiteralBit - test if lit == 2^n                               */
/*-----------------------------------------------------------------*/
static int
isLiteralBit (unsigned long lit)
{
	unsigned long pw[32] = { 1L, 2L, 4L, 8L, 16L, 32L, 64L, 128L,
		0x100L, 0x200L, 0x400L, 0x800L,
		0x1000L, 0x2000L, 0x4000L, 0x8000L,
		0x10000L, 0x20000L, 0x40000L, 0x80000L,
		0x100000L, 0x200000L, 0x400000L, 0x800000L,
		0x1000000L, 0x2000000L, 0x4000000L, 0x8000000L,
		0x10000000L, 0x20000000L, 0x40000000L, 0x80000000L
	};
	int idx;

	for (idx = 0; idx < 32; idx++)
		if (lit == pw[idx])
			return idx + 1;
	return 0;
}

/*-----------------------------------------------------------------*/
/* outAcc - output Acc                                             */
/*-----------------------------------------------------------------*/
static void
outAcc (operand * result)
{
	int size, offset;
	size = getDataSize (result);
	if (size) {
		aopPut (AOP (result), "r0", 0);
		size--;
		offset = 1;
		/* unsigned or positive */
		while (size--) {
			aopPut (AOP (result), zero, offset++);
		}
	}
}

#endif	// End Unused code section

/*-----------------------------------------------------------------*/
/* emitcode - writes the code into a file : for now it is simple    */
/*-----------------------------------------------------------------*/
static void
emitcode (char *inst, char *fmt, ...)
{
	va_list ap;
	char lb[INITIAL_INLINEASM];
	char *lbp = lb;

	va_start (ap, fmt);

	if (inst && *inst) {
		if (fmt && *fmt)
			sprintf (lb, "%s\t", inst);
		else
			sprintf (lb, "%s", inst);
		vsprintf (lb + (strlen (lb)), fmt, ap);
	}
	else
		vsprintf (lb, fmt, ap);

	while (isspace (*lbp))
		lbp++;

	if (lbp && *lbp)
		lineCurr = (lineCurr ?
			    connectLine (lineCurr, newLineNode (lb)) :
			    (lineHead = newLineNode (lb)));
	lineCurr->isInline = _G.inLine;
	lineCurr->isDebug = _G.debugLine;
	va_end (ap);
}

/*-----------------------------------------------------------------*/
/* hasInc - operand is incremented before any other use            */
/*-----------------------------------------------------------------*/
static iCode *
hasInc (operand *op, iCode *ic)
{
	sym_link *type = operandType(op);
	sym_link *retype = getSpec (type);
	iCode *lic = ic->next;
	int isize ;
  
	if (IS_BITVAR(retype)||!IS_PTR(type)) return NULL;
	isize = getSize(type->next);
	while (lic) {
		/* if operand of the form op = op + <sizeof *op> */
		if (lic->op == '+' && isOperandEqual(IC_LEFT(lic),op) &&
		    isOperandEqual(IC_RESULT(lic),op) && 
		    isOperandLiteral(IC_RIGHT(lic)) &&
		    operandLitValue(IC_RIGHT(lic)) == isize) {
			return lic;
		}
		/* if the operand used or deffed */
		if (bitVectBitValue(OP_USES(op),lic->key) || ((unsigned) lic->defKey == op->key)) {
			return NULL;
		}
		lic = lic->next;
	}
	return NULL;
}

/*-----------------------------------------------------------------*/
/* getFreePtr - returns X or Z whichever is free or can be pushed  */
/*-----------------------------------------------------------------*/
static regs *
getFreePtr (iCode * ic, asmop ** aopp, bool result, bool zonly)
{
	bool xiu = FALSE, ziu = FALSE;
	bool xou = FALSE, zou = FALSE;

	/* the logic: if x & z used in the instruction
	   then we are in trouble otherwise */

	/* first check if x & z are used by this
	   instruction, in which case we are in trouble */
	if ((xiu = bitVectBitValue (ic->rUsed, X_IDX)) &&
	    (ziu = bitVectBitValue (ic->rUsed, Z_IDX))) {
		goto endOfWorld;
	}

	xou = bitVectBitValue (ic->rMask, X_IDX);
	zou = bitVectBitValue (ic->rMask, Z_IDX);

	/* if no usage of Z then return it */
	if (!ziu && !zou) {
		ic->rUsed = bitVectSetBit (ic->rUsed, Z_IDX);
		(*aopp)->type = AOP_Z;

		(*aopp)->aop_ptr2 = avr_regWithIdx (R31_IDX);
		return (*aopp)->aopu.aop_ptr = avr_regWithIdx (R30_IDX);
	}

	/* if no usage of X then return it */
	if (!xiu && !xou && !zonly) {
		ic->rUsed = bitVectSetBit (ic->rUsed, X_IDX);
		(*aopp)->type = AOP_X;

		(*aopp)->aop_ptr2 = avr_regWithIdx (R27_IDX);
		return (*aopp)->aopu.aop_ptr = avr_regWithIdx (R26_IDX);
	}

	/* if z not used then */

	if (!ziu) {
		/* push it if not already pushed */
		if (!_G.zPushed) {
			emitcode ("push", "%s",
				  avr_regWithIdx (R30_IDX)->dname);
			emitcode ("push", "%s",
				  avr_regWithIdx (R31_IDX)->dname);
			_G.zPushed++;
		}

		ic->rUsed = bitVectSetBit (ic->rUsed, Z_IDX);
		(*aopp)->type = AOP_Z;
		(*aopp)->aop_ptr2 = avr_regWithIdx (R31_IDX);
		return (*aopp)->aopu.aop_ptr = avr_regWithIdx (R30_IDX);
	}

	/* now we know they both have usage */
	/* if x not used in this instruction */
	if (!xiu && !zonly) {
		/* push it if not already pushed */
		if (!_G.xPushed) {
			emitcode ("push", "%s",
				  avr_regWithIdx (R26_IDX)->dname);
			emitcode ("push", "%s",
				  avr_regWithIdx (R27_IDX)->dname);
			_G.xPushed++;
		}

		ic->rUsed = bitVectSetBit (ic->rUsed, X_IDX);
		(*aopp)->type = AOP_X;

		(*aopp)->aop_ptr2 = avr_regWithIdx (R27_IDX);
		return (*aopp)->aopu.aop_ptr = avr_regWithIdx (R26_IDX);
	}


      endOfWorld:
	/* I said end of world but not quite end of world yet */
	/* if this is a result then we can push it on the stack */
	if (result) {
		(*aopp)->type = AOP_STK;
		return NULL;
	}

	/* other wise this is true end of the world */
	werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
		"getFreePtr should never reach here");
	exit (0);
}

/*-----------------------------------------------------------------*/
/* newAsmop - creates a new asmOp                                  */
/*-----------------------------------------------------------------*/
static asmop *
newAsmop (short type)
{
	asmop *aop;

	aop = Safe_calloc (1, sizeof (asmop));
	aop->type = type;
	return aop;
}

/*-----------------------------------------------------------------*/
/* pointerCode - returns the code for a pointer type               */
/*-----------------------------------------------------------------*/
static int
pointerCode (sym_link * etype)
{

	return PTR_TYPE (SPEC_OCLS (etype));

}

/*-----------------------------------------------------------------*/
/* aopForSym - for a true symbol                                   */
/*-----------------------------------------------------------------*/
static asmop *
aopForSym (iCode * ic, symbol * sym, bool result)
{
	asmop *aop;
	memmap *space = SPEC_OCLS (sym->etype);

	/* if already has one */
	if (sym->aop)
		return sym->aop;

	/* assign depending on the storage class */
	/* if it is on the stack */
	if (sym->onStack) {
		sym->aop = aop = newAsmop (0);
		aop->size = getSize (sym->type);

		/* we can use std / ldd instruction */
		if (sym->stack > 0
		    && (sym->stack + getSize (sym->type) - 1) <= 63) {
			aop->type = AOP_STK_D;
			aop->aopu.aop_stk = sym->stack;
			return aop;
		}

		/* otherwise get a free pointer register X/Z */
		aop->aopu.aop_ptr = getFreePtr (ic, &aop, result, FALSE);

		/* now assign the address of the variable to
		   the pointer register */
		if (aop->type != AOP_STK) {
			emitcode ("movw", "%s,r28", aop->aopu.aop_ptr->name);
			if (sym->stack < 0) {
				if ((sym->stack - _G.nRegsSaved) > -63) {
					emitcode ("sbiw", "%s,0x%02x",
						  aop->aopu.aop_ptr->name,
						  (sym->stack -
						   _G.nRegsSaved));
				}
				else {
					emitcode ("subi", "%s,<(%d)",
						  aop->aopu.aop_ptr->name,
						  sym->stack - _G.nRegsSaved);
					emitcode ("sbci", "%s,>(%d)",
						  aop->aop_ptr2->name,
						  sym->stack - _G.nRegsSaved);
				}
			}
			else {
				if (sym->stack <= 63) {
					emitcode ("adiw", "%s,0x%02x",
						  aop->aopu.aop_ptr->name,
						  sym->stack);
				}
				else {
					emitcode ("subi", "%s,<(-%d)",
						  aop->aopu.aop_ptr->name,
						  sym->stack);
					emitcode ("sbci", "%s,>(-%d)",
						  aop->aop_ptr2->name,
						  sym->stack);
				}
			}
		}
		return aop;
	}

	/* if in bit space */
	if (IN_BITSPACE (space)) {
		sym->aop = aop = newAsmop (AOP_CRY);
		aop->aopu.aop_dir = sym->rname;
		aop->size = getSize (sym->type);
		return aop;
	}
	/* if it is in direct space */
	if (IN_DIRSPACE (space)) {
		sym->aop = aop = newAsmop (AOP_DIR);
		aop->aopu.aop_dir = sym->rname;
		aop->size = getSize (sym->type);
		return aop;
	}

	/* special case for a function */
	if (IS_FUNC (sym->type)) {
		sym->aop = aop = newAsmop (AOP_IMMD);
		aop->aopu.aop_immd = Safe_calloc (1, strlen (sym->rname) + 1);
		strcpy (aop->aopu.aop_immd, sym->rname);
		aop->size = FPTRSIZE;
		return aop;
	}

	/* only remaining is code / eeprom which will need pointer reg */
	/* if it is in code space */

	sym->aop = aop = newAsmop (0);

	if (IN_CODESPACE (space))
		aop->code = 1;

	aop->aopu.aop_ptr = getFreePtr (ic, &aop, result, aop->code);
	aop->size = getSize (sym->type);
	emitcode ("ldi", "%s,<(%s)", aop->aopu.aop_ptr->name, sym->rname);
	emitcode ("ldi", "%s,>(%s)", aop->aop_ptr2);

	return aop;
}

/*-----------------------------------------------------------------*/
/* aopForRemat - rematerialzes an object                           */
/*-----------------------------------------------------------------*/
static asmop *
aopForRemat (symbol * sym)
{
	iCode *ic = sym->rematiCode;
	asmop *aop = newAsmop (AOP_IMMD);
	int val = 0;

	for (;;) {
		if (ic->op == '+')
			val += (int) operandLitValue (IC_RIGHT (ic));
		else if (ic->op == '-')
			val -= (int) operandLitValue (IC_RIGHT (ic));
		else
			break;

		ic = OP_SYMBOL (IC_LEFT (ic))->rematiCode;
	}

	if (val)
		sprintf (buffer, "(%s %c 0x%04x)",
			 OP_SYMBOL (IC_LEFT (ic))->rname,
			 val >= 0 ? '+' : '-', abs (val) & 0xffff);
	else
		strcpy (buffer, OP_SYMBOL (IC_LEFT (ic))->rname);

	aop->aopu.aop_immd = Safe_calloc (1, strlen (buffer) + 1);
	strcpy (aop->aopu.aop_immd, buffer);
	return aop;
}

/*-----------------------------------------------------------------*/
/* regsInCommon - two operands have some registers in common       */
/*-----------------------------------------------------------------*/
static bool
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

	for (i = 0; i < sym1->nRegs; i++) {
		int j;
		if (!sym1->regs[i])
			continue;

		for (j = 0; j < sym2->nRegs; j++) {
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
static bool
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
	    sym1->isspilt != sym2->isspilt) return FALSE;

	/* if they are the same */
	if (sym1 == sym2)
		return TRUE;

	if (strcmp (sym1->rname, sym2->rname) == 0)
		return TRUE;


	/* if left is a tmp & right is not */
	if (IS_ITEMP (op1) &&
	    !IS_ITEMP (op2) && sym1->isspilt && (sym1->usl.spillLoc == sym2))
		return TRUE;

	if (IS_ITEMP (op2) &&
	    !IS_ITEMP (op1) &&
	    sym2->isspilt && sym1->level > 0 && (sym2->usl.spillLoc == sym1))
		return TRUE;

	return FALSE;
}

/*-----------------------------------------------------------------*/
/* sameRegs - two asmops have the same registers                   */
/*-----------------------------------------------------------------*/
static bool
sameRegs (asmop * aop1, asmop * aop2)
{
	int i;

	if (aop1 == aop2)
		return TRUE;

	if (aop1->type != AOP_REG || aop2->type != AOP_REG)
		return FALSE;

	if (aop1->size != aop2->size)
		return FALSE;

	for (i = 0; i < aop1->size; i++)
		if (aop1->aopu.aop_reg[i] != aop2->aopu.aop_reg[i])
			return FALSE;

	return TRUE;
}

/*-----------------------------------------------------------------*/
/* isRegPair - for size 2 if this operand has a register pair      */
/*-----------------------------------------------------------------*/
static int
isRegPair (asmop * aop)
{
	if (!aop || aop->size < 2)
		return 0;
	if (aop->type == AOP_X || aop->type == AOP_Z)
		return 1;
	if (aop->type != AOP_REG)
		return 0;
	if ( ((aop->aopu.aop_reg[1]->rIdx - aop->aopu.aop_reg[0]->rIdx) == 1) &&
	     (aop->aopu.aop_reg[0]->rIdx & 1) == 0)
	     
		return 1;
	return 0;
}

/*-----------------------------------------------------------------*/
/* aopOp - allocates an asmop for an operand  :                    */
/*-----------------------------------------------------------------*/
static void
aopOp (operand * op, iCode * ic, bool result)
{
	asmop *aop;
	symbol *sym;
	int i;

	if (!op)
		return;

	/* if this a literal */
	if (IS_OP_LITERAL (op)) {
		op->aop = aop = newAsmop (AOP_LIT);
		aop->aopu.aop_lit = op->operand.valOperand;
		aop->size = getSize (operandType (op));
		return;
	}

	/* if already has a asmop then continue */
	if (op->aop)
		return;

	/* if the underlying symbol has a aop */
	if (IS_SYMOP (op) && OP_SYMBOL (op)->aop) {
		op->aop = OP_SYMBOL (op)->aop;
		return;
	}

	/* if this is a true symbol */
	if (IS_TRUE_SYMOP (op)) {
		op->aop = aopForSym (ic, OP_SYMBOL (op), result);
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
	if (sym->regType & REG_CND) {
		aop = op->aop = sym->aop = newAsmop (AOP_CRY);
		aop->size = 0;
		return;
	}

	/* if it is spilt then two situations
	   a) is rematerialize
	   b) has a spill location */
	if (sym->isspilt || sym->nRegs == 0) {

		/* rematerialize it NOW */
		if (sym->remat) {
			sym->aop = op->aop = aop = aopForRemat (sym);
			aop->size = getSize (sym->type);
			return;
		}

		if (sym->accuse) {
			assert ("ACC_USE cannot happen in AVR\n");
		}

		if (sym->ruonly) {
			int i;
			aop = op->aop = sym->aop = newAsmop (AOP_STR);
			aop->size = getSize (sym->type);
			for (i = 0; i < (int) fAVRReturnSize; i++)
				aop->aopu.aop_str[i] = fAVRReturn[i];
			return;
		}

		/* else spill location  */
		sym->aop = op->aop = aop =
			aopForSym (ic, sym->usl.spillLoc, result);
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
freeAsmop (operand * op, asmop * aaop, iCode * ic, bool pop)
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

	/* depending on the asmop type only three cases need work AOP_RO
	   , AOP_R1 && AOP_STK */
	switch (aop->type) {
	case AOP_X:
		if (_G.xPushed) {
			if (pop) {
				emitcode ("pop", "r26");
				emitcode ("pop", "r27");
				_G.xPushed--;
			}
		}
		bitVectUnSetBit (ic->rUsed, X_IDX);
		break;

	case AOP_Z:
		if (_G.zPushed) {
			if (pop) {
				emitcode ("pop", "r30");
				emitcode ("pop", "r31");
				_G.zPushed--;
			}
		}
		bitVectUnSetBit (ic->rUsed, Z_IDX);
		break;

	case AOP_STK:
		{
			int sz = aop->size;
			int stk = aop->aopu.aop_stk + aop->size;
			bitVectUnSetBit (ic->rUsed, X_IDX);
			bitVectUnSetBit (ic->rUsed, Z_IDX);

			getFreePtr (ic, &aop, FALSE, 0);

			emitcode ("movw", "%s,r28");
			if (stk) {
				if (stk <= 63 && stk > 0) {
					emitcode ("adiw", "%s,0x%02x",
						  aop->aopu.aop_ptr->name,
						  stk + 1);
				}
				else {
					emitcode ("subi", "%s,<(%d)",
						  aop->aopu.aop_ptr->name,
						  -(stk + 1));
					emitcode ("sbci", "%s,>(%d)",
						  aop->aop_ptr2->name,
						  -(stk + 1));
				}
			}

			while (sz--) {
				emitcode ("pop", "r24");
				emitcode ("st", "-%s,r24",
					  aop->type == AOP_X ? "X" : "Z");
				if (!sz)
					break;
			}
			op->aop = aop;
			freeAsmop (op, NULL, ic, TRUE);
			if (_G.xPushed) {
				emitcode ("pop", "r26");
				emitcode ("pop", "r27");
				_G.xPushed--;
			}

			if (_G.zPushed) {
				emitcode ("pop", "r30");
				emitcode ("pop", "r31");
				_G.zPushed--;
			}
		}
	}

      dealloc:
	/* all other cases just dealloc */
	if (op) {
		op->aop = NULL;
		if (IS_SYMOP (op)) {
			OP_SYMBOL (op)->aop = NULL;
			/* if the symbol has a spill */
			if (SPIL_LOC (op))
				SPIL_LOC (op)->aop = NULL;
		}
	}
}

/*-----------------------------------------------------------------*/
/* aopGet - for fetching value of the aop                          */
/*-----------------------------------------------------------------*/
static char *
aopGet (asmop * aop, int offset)
{
	char *s = buffer;
	char *rs;

	/* offset is greater than
	   size then zero */
	if (offset > (aop->size - 1) && aop->type != AOP_LIT)
		return zero;

	/* depending on type */
	switch (aop->type) {

	case AOP_X:
		if (offset > aop->coff) {
			emitcode ("adiw", "%s,%d", aop->aopu.aop_ptr->name,
				  offset - aop->coff);
		}

		if (offset < aop->coff) {
			emitcode ("sbiw", "%s,%d", aop->aopu.aop_ptr->name,
				  aop->coff - offset);
		}

		aop->coff = offset;
		emitcode ("ld", "%s,x",
			  (rs = ((offset & 1) ? "r25" : "r24")));
		return rs;

	case AOP_Z:
		if (aop->code) {
			if (offset > aop->coff) {
				emitcode ("adiw", "r30,%d",
					  offset - aop->coff);
			}
			else {
				emitcode ("sbiw", "r30,%d",
					  aop->coff - offset);
			}
			emitcode ("lpm", "%s,z",
				  (rs = ((offset & 1) ? "r25" : "r24")));
		}
		else {
			/* we can use lds */
			if (offset > aop->coff) {
				emitcode ("ldd", "%s,z+%d",
					  (rs =
					   ((offset & 1) ? "r25" : "r24")),
					  offset - aop->coff);
			}
			else {
				emitcode ("sbiw", "%s,%d",
					  aop->aopu.aop_ptr->name,
					  aop->coff - offset);
				aop->coff = offset;
				emitcode ("ld", "%s,z",
					  (rs =
					   ((offset & 1) ? "r25" : "r24")));
			}
		}
		return rs;

	case AOP_IMMD:

		emitcode ("lds", "%s,(%s)+%d",
			  (rs = ((offset & 1) ? "r25" : "r24")),
			  aop->aopu.aop_immd, offset);
		return rs;

	case AOP_DIR:
		emitcode ("lds", "%s,(%s)+%d",
			  (rs = ((offset & 1) ? "r25" : "r24")),
			  aop->aopu.aop_dir, offset);
		return rs;

	case AOP_REG:
		return aop->aopu.aop_reg[offset]->name;

	case AOP_CRY:
		assert ("cannot be in bit space AOP_CRY\n");
		break;

	case AOP_LIT:
		s = aopLiteral (aop->aopu.aop_lit, offset);
		emitcode ("ldi", "%s,<(%s)",
			  (rs = ((offset & 1) ? "r24" : "r25")), s);
		return rs;

	case AOP_STR:
		aop->coff = offset;
		return aop->aopu.aop_str[offset];

	case AOP_STK_D:
		emitcode ("ldd", "%s,Y+%d",
			  (rs = ((offset & 1) ? "r25" : "r24")),
			  aop->aopu.aop_stk + offset);
		return rs;
	}

	werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
		"aopget got unsupported aop->type");
	exit (0);
}

/*-----------------------------------------------------------------*/
/* aopPut - puts a string for a aop                                */
/*-----------------------------------------------------------------*/
static void
aopPut (asmop * aop, char *s, int offset)
{
	char *d = buffer;

	if (aop->size && offset > (aop->size - 1)) {
		werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
			"aopPut got offset > aop->size");
		exit (0);
	}

	/* will assign value to value */
	/* depending on where it is ofcourse */
	switch (aop->type) {
	case AOP_DIR:
		if (offset) {
			sprintf (d, "(%s)+%d", aop->aopu.aop_dir, offset);
		}
		else {
			sprintf (d, "%s", aop->aopu.aop_dir);
		}

		emitcode ("sts", "%s,%s", d, s);
		break;

	case AOP_REG:
		if (toupper (*s) != 'R') {
			if (s == zero) {
				emitcode ("clr", "%s",
					  aop->aopu.aop_reg[offset]->name);
			}
			else {
				emitcode ("ldi", "r25,%s", s);
				emitcode ("mov", "%s,r35",
					  aop->aopu.aop_reg[offset]->name);
			}
		}
		else {
			if (strcmp (aop->aopu.aop_reg[offset]->name, s)) {
				emitcode ("mov", "%s,%s",
					  aop->aopu.aop_reg[offset]->name, s);
			}
		}
		break;

	case AOP_X:
		if (offset > aop->coff) {
			emitcode ("adiw", "%s,%d", aop->aopu.aop_ptr->name,
				  offset - aop->coff);
		}

		if (offset < aop->coff) {
			emitcode ("sbiw", "%s,%d", aop->aopu.aop_ptr->name,
				  aop->coff - offset);
		}

		aop->coff = offset;
		emitcode ("st", "x,%s", s);
		break;

	case AOP_Z:
		if (aop->code) {
			if (offset > aop->coff) {
				emitcode ("adiw", "r30,%d",
					  offset - aop->coff);
			}
			else {
				emitcode ("sbiw", "r30,%d",
					  aop->coff - offset);
			}
			emitcode ("lpm", "%s,z", s);
		}
		else {
			/* we can use lds */
			if (offset > aop->coff) {
				emitcode ("sdd", "z+%d,%s",
					  offset - aop->coff, s);
			}
			else {
				emitcode ("sbiw", "%s,%d",
					  aop->aopu.aop_ptr->name,
					  aop->coff - offset);
				aop->coff = offset;
				emitcode ("ld", "%s,z", s);
			}
		}
		break;

	case AOP_STK:
		emitcode ("push", "%s", s);
		break;

	case AOP_CRY:
		/* if used only for a condition code check */
		assert (toupper (*s) == 'R');
		if (offset == 0) {
			emitcode ("xrl", "r0,r0");
			emitcode ("cpi", "%s,0", s);
		}
		else {
			emitcode ("cpc", "r0,%s", s);
		}
		break;

	case AOP_STR:
		aop->coff = offset;
		if (strcmp (aop->aopu.aop_str[offset], s))
			emitcode ("mov", "%s,%s", aop->aopu.aop_str[offset],
				  s);
		break;

	case AOP_STK_D:
		emitcode ("std", "y+%d,%s", offset, s);
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
#define IS_AOP_PREG(x) (AOP(x) && (AOP_TYPE(x) == AOP_X || \
                       AOP_TYPE(x) == AOP_Z))
#define AOP_INPREG(x) (x && (x->type == AOP_REG &&                      \
                      ((x->aopu.aop_reg[0] == avr_regWithIdx(R26_IDX) && x->aopu.aop_reg[1] == avr_regWithIdx(R27_IDX)) || \
                       (x->aopu.aop_reg[0] == avr_regWithIdx(R30_IDX) && x->aopu.aop_reg[1] == avr_regWithIdx(R31_IDX)) )))
#define AOP_ISX(x) (x && (x->type == AOP_REG &&                      \
                      ((x->aopu.aop_reg[0] == avr_regWithIdx(R26_IDX) && x->aopu.aop_reg[1] == avr_regWithIdx(R27_IDX)))))
#define AOP_ISZ(x) (x && (x->type == AOP_REG &&                      \
                      ((x->aopu.aop_reg[0] == avr_regWithIdx(R30_IDX) && x->aopu.aop_reg[1] == avr_regWithIdx(R31_IDX)))))

/*-----------------------------------------------------------------*/
/* genNotFloat - generates not for float operations                */
/*-----------------------------------------------------------------*/
static void
genNotFloat (operand * op, operand * res)
{
	int size, offset;
	char *l;
	symbol *tlbl;

	/* we will put 127 in the first byte of
	   the result */
	aopPut (AOP (res), "127", 0);
	size = AOP_SIZE (op) - 1;
	offset = 1;

	l = aopGet (op->aop, offset++);
	MOVR0 (l);

	while (size--) {
		emitcode ("or", "R0,%s", aopGet (op->aop, offset++));
	}
	tlbl = newiTempLabel (NULL);

	tlbl = newiTempLabel (NULL);
	aopPut (res->aop, zero, 1);
	emitcode ("cpi", "r0,0");
	emitcode ("breq", "L%05d", tlbl->key);
	aopPut (res->aop, one, 1);
	emitcode ("", "L%05d:", tlbl->key);

	size = res->aop->size - 2;
	offset = 2;
	/* put zeros in the rest */
	while (size--)
		aopPut (res->aop, zero, offset++);
}

/*-----------------------------------------------------------------*/
/* opIsGptr: returns non-zero if the passed operand is       */
/* a generic pointer type.             */
/*-----------------------------------------------------------------*/
static int
opIsGptr (operand * op)
{
	sym_link *type = operandType (op);

	if ((AOP_SIZE (op) == GPTRSIZE) && IS_GENPTR (type)) {
		return 1;
	}
	return 0;
}

/*-----------------------------------------------------------------*/
/* getDataSize - get the operand data size                         */
/*-----------------------------------------------------------------*/
static int
getDataSize (operand * op)
{
	int size;
	size = AOP_SIZE (op);
	if (size == GPTRSIZE) {
		sym_link *type = operandType (op);
		if (IS_GENPTR (type)) {
			/* generic pointer; arithmetic operations
			 * should ignore the high byte (pointer type).
			 */
			size--;
		}
	}
	return size;
}

/*-----------------------------------------------------------------*/
/* toBoolean - emit code for orl a,operator(sizeop)                */
/*-----------------------------------------------------------------*/
static void
toBoolean (operand * oper, char *r, bool clr)
{
	int size = AOP_SIZE (oper);
	int offset = 0;
	if (clr) {
		emitcode ("clr", "%s", r);
		while (size--)
			emitcode ("or", "%s,%s", r, aopGet (AOP (oper), offset++));
	} else {
		size--;
		emitcode("mov","%s,%s",r,aopGet (AOP (oper), offset++));
		if (size) while (size--) emitcode ("or", "%s,%s", r, aopGet (AOP (oper), offset++));
	}
}


/*-----------------------------------------------------------------*/
/* genNot - generate code for ! operation                          */
/*-----------------------------------------------------------------*/
static void
genNot (iCode * ic)
{
	symbol *tlbl;
	sym_link *optype = operandType (IC_LEFT (ic));
	int size, offset = 1;

	/* assign asmOps to operand & result */
	aopOp (IC_LEFT (ic), ic, FALSE);
	aopOp (IC_RESULT (ic), ic, TRUE);

	/* if type float then do float */
	if (IS_FLOAT (optype)) {
		genNotFloat (IC_LEFT (ic), IC_RESULT (ic));
		goto release;
	}
	emitcode ("clr", "r24");
	tlbl = newiTempLabel (NULL);
	size = AOP_SIZE (IC_LEFT (ic));
	offset = 0;
	if (size == 1) {
		emitcode ("cpse", "%s,r24", aopGet (AOP (IC_LEFT (ic)), 0));
	}
	else {
		while (size--) {
			if (offset)
				emitcode ("cpc", "%s,r24",
					  aopGet (AOP (IC_LEFT (ic)),
						  offset));
			else
				emitcode ("cpi", "%s,0",
					  aopGet (AOP (IC_LEFT (ic)),
						  offset));
			offset++;
		}
		emitcode ("bne", "L%05d", tlbl->key);
	}
	emitcode ("ldi", "r24,1");
	emitcode ("", "L%05d:", tlbl->key);
	aopPut (AOP (IC_RESULT (ic)), "r24", 0);
	size = AOP_SIZE (IC_RESULT (ic)) - 1;
	offset = 1;
	while (size--)
		aopPut (AOP (IC_RESULT (ic)), zero, offset++);


      release:
	/* release the aops */
	freeAsmop (IC_LEFT (ic), NULL, ic, (RESULTONSTACK (ic) ? 0 : 1));
	freeAsmop (IC_RESULT (ic), NULL, ic, TRUE);
}


/*-----------------------------------------------------------------*/
/* genCpl - generate code for complement                           */
/*-----------------------------------------------------------------*/
static void
genCpl (iCode * ic)
{
	int offset = 0;
	int size;
	int samer;

	/* assign asmOps to operand & result */
	aopOp (IC_LEFT (ic), ic, FALSE);
	aopOp (IC_RESULT (ic), ic, TRUE);
	samer = sameRegs (AOP (IC_LEFT (ic)), AOP (IC_RESULT (ic)));
	size = AOP_SIZE (IC_RESULT (ic));
	while (size--) {
		char *l = aopGet (AOP (IC_LEFT (ic)), offset);
		if (samer) {
			emitcode ("com", "%s", l);
		}
		else {
			aopPut (AOP (IC_RESULT (ic)), l, offset);
			emitcode ("com", "%s",
				  aopGet (AOP (IC_RESULT (ic)), offset));
		}
		offset++;
	}

	/* release the aops */
	freeAsmop (IC_LEFT (ic), NULL, ic, (RESULTONSTACK (ic) ? 0 : 1));
	freeAsmop (IC_RESULT (ic), NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genUminusFloat - unary minus for floating points                */
/*-----------------------------------------------------------------*/
static void
genUminusFloat (operand * op, operand * result)
{
	int size, offset = 0;
	char *l;
	/* for this we just need to flip the
	   first it then copy the rest in place */
	size = AOP_SIZE (op) - 1;
	l = aopGet (AOP (op), 3);

	emitcode ("ldi", "r24,0x80");
	if (sameRegs (AOP (op), AOP (result))) {
		emitcode ("eor", "%s,r24", l);
	}
	else {
		aopPut (AOP (result), l, 3);
		emitcode ("eor", "%s,r24", aopGet (AOP (result), 3));
	}
	while (size--) {
		aopPut (AOP (result), aopGet (AOP (op), offset), offset);
		offset++;
	}
}

/*-----------------------------------------------------------------*/
/* genUminus - unary minus code generation                         */
/*-----------------------------------------------------------------*/
static void
genUminus (iCode * ic)
{
	int offset, size;
	sym_link *optype, *rtype;
	int samer;

	/* assign asmops */
	aopOp (IC_LEFT (ic), ic, FALSE);
	aopOp (IC_RESULT (ic), ic, TRUE);

	optype = operandType (IC_LEFT (ic));
	rtype = operandType (IC_RESULT (ic));

	/* if float then do float stuff */
	if (IS_FLOAT (optype)) {
		genUminusFloat (IC_LEFT (ic), IC_RESULT (ic));
		goto release;
	}

	/* otherwise subtract from zero */
	size = AOP_SIZE (IC_LEFT (ic));
	offset = 0;
	samer = sameRegs (AOP (IC_LEFT (ic)), AOP (IC_RESULT (ic)));
	if (size == 1) {
		if (samer) {
			emitcode ("neg", "%s",
				  aopGet (AOP (IC_LEFT (ic)), 0));
		}
		else {
			aopPut (AOP (IC_RESULT (ic)),
				aopGet (AOP (IC_LEFT (ic)), 0), 0);
			emitcode ("neg", "%s",
				  aopGet (AOP (IC_RESULT (ic)), 0));
		}
	}
	else {
		offset = size - 1;
		while (size--) {
			char *l = aopGet (AOP (IC_LEFT (ic)), offset);
			if (!samer) {
				aopPut (AOP (IC_RESULT (ic)), l, offset);
				l = aopGet (AOP (IC_RESULT (ic)), offset);
			}
			if (offset)
				emitcode ("com", "%s", l);
			else
				emitcode ("neg", "%s", l);
			offset--;
		}
		size = AOP_SIZE (IC_LEFT (ic)) - 1;
		offset = 1;
		while (size--) {
			emitcode ("sbci", "%s,0xff",
				  aopGet (AOP (IC_RESULT (ic)), offset++));
		}
	}

	/* if any remaining bytes in the result */
	/* we just need to propagate the sign   */
	if ((size = (AOP_SIZE (IC_RESULT (ic)) - AOP_SIZE (IC_LEFT (ic))))) {
		symbol *tlbl = newiTempLabel (NULL);
		emitcode ("clr", "r0");
		emitcode ("brcc", "L%05d", tlbl->key);
		emitcode ("com", "r0");
		emitcode ("", "L%05d:", tlbl->key);
		while (size--)
			aopPut (AOP (IC_RESULT (ic)), "r0", offset++);
	}

      release:
	/* release the aops */
	freeAsmop (IC_LEFT (ic), NULL, ic, (RESULTONSTACK (ic) ? 0 : 1));
	freeAsmop (IC_RESULT (ic), NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* assignResultValue -               */
/*-----------------------------------------------------------------*/
static void
assignResultValue (operand * oper)
{
	int offset = 0;
	int size = AOP_SIZE (oper);
	while (size--) {
		aopPut (AOP (oper), fAVRReturn[offset], offset);
		offset++;
	}
}

/*-----------------------------------------------------------------*/
/* saveZreg - if indirect call then save z-pointer register        */
/*-----------------------------------------------------------------*/
static void
saveZreg (iCode * ic)
{
	/* only if live accross this call */
	if (ic->regsSaved == 0 &&
	    (bitVectBitValue (ic->rMask, R30_IDX) ||
	     bitVectBitValue (ic->rMask, R31_IDX))) {
		ic->regsSaved = 1;
		emitcode ("push", "r30");
		emitcode ("push", "r31");
	}
}

/*-----------------------------------------------------------------*/
/* popZreg - restore values of zreg                                */
/*-----------------------------------------------------------------*/
static void
popZreg (iCode * ic)
{
	if (ic->regsSaved) {
		emitcode ("pop", "r31");
		emitcode ("pop", "r30");
	}
}

/*-----------------------------------------------------------------*/
/* genIpush - genrate code for pushing this gets a little complex  */
/*-----------------------------------------------------------------*/
static void
genIpush (iCode * ic)
{
	int size, offset = 0;
	char *l;


	if (!ic->parmPush) {
		/* and the item is spilt then do nothing */
		if (OP_SYMBOL (IC_LEFT (ic))->isspilt)
			return;
	}
	else {
		iCode *lic;
		for (lic = ic->next; lic; lic = lic->next)
			if (lic->op == PCALL)
				break;
		if (lic)
			saveZreg (lic);
	}

	/* this is a paramter push */
	aopOp (IC_LEFT (ic), ic, FALSE);
	size = AOP_SIZE (IC_LEFT (ic));
	while (size--) {
		l = aopGet (AOP (IC_LEFT (ic)), offset++);
		emitcode ("push", "%s", l);
	}

	freeAsmop (IC_LEFT (ic), NULL, ic, TRUE);
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

	aopOp (IC_LEFT (ic), ic, FALSE);
	size = AOP_SIZE (IC_LEFT (ic));
	offset = (size - 1);
	while (size--)
		emitcode ("pop", "%s", aopGet (AOP (IC_LEFT (ic)), offset--));

	freeAsmop (IC_LEFT (ic), NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genCall - generates a call statement                            */
/*-----------------------------------------------------------------*/
static void
genCall (iCode * ic)
{

	/* if send set is not empty the assign */
	if (_G.sendSet) {
		iCode *sic;
		int rnum = 16;
		for (sic = setFirstItem (_G.sendSet); sic;
		     sic = setNextItem (_G.sendSet)) {
			int size, offset = 0;
			aopOp (IC_LEFT (sic), sic, FALSE);
			size = AOP_SIZE (IC_LEFT (sic));
			while (size--) {
				char *l =
					aopGet (AOP (IC_LEFT (sic)), offset);
				char *b = buffer;
				sprintf (buffer, "r%d", rnum++);
				if (strcmp (l, b))
					emitcode ("mov", "%s,%s", b, l);
				offset++;
			}
			freeAsmop (IC_LEFT (sic), NULL, sic, TRUE);
		}
		_G.sendSet = NULL;
	}
	/* make the call */
	emitcode ("call", "%s", (OP_SYMBOL (IC_LEFT (ic))->rname[0] ?
				 OP_SYMBOL (IC_LEFT (ic))->rname :
				 OP_SYMBOL (IC_LEFT (ic))->name));

	/* if we need assign a result value */
	if ((IS_ITEMP (IC_RESULT (ic)) &&
	     (OP_SYMBOL (IC_RESULT (ic))->nRegs ||
	      OP_SYMBOL (IC_RESULT (ic))->spildir)) ||
	    IS_TRUE_SYMOP (IC_RESULT (ic))) {

		aopOp (IC_RESULT (ic), ic, FALSE);
		assignResultValue (IC_RESULT (ic));
		freeAsmop (IC_RESULT (ic), NULL, ic, TRUE);
	}

	/* adjust the stack for parameters if required */
	if (ic->parmBytes) {
		if (ic->parmBytes > 63) {
			emitcode ("sbiw", "r28,%d", ic->parmBytes);
		}
		else {
			emitcode ("subi", "r28,<(%d)",
				  ic->parmBytes);
			emitcode ("sbci", "r29,>(%d)",
				  ic->parmBytes);
		}
	}

}

/*-----------------------------------------------------------------*/
/* genPcall - generates a call by pointer statement                */
/*-----------------------------------------------------------------*/
static void
genPcall (iCode * ic)
{

	if (!ic->regsSaved)
		saveZreg (ic);

	aopOp (IC_LEFT (ic), ic, FALSE);
	emitcode ("mov", "r30", aopGet (AOP (IC_LEFT (ic)), 0));
	emitcode ("mov", "r31", aopGet (AOP (IC_RIGHT (ic)), 0));
	freeAsmop (IC_LEFT (ic), NULL, ic, TRUE);

	/* if send set is not empty the assign */
	if (_G.sendSet) {
		iCode *sic;
		int rnum = 16;
		for (sic = setFirstItem (_G.sendSet); sic;
		     sic = setNextItem (_G.sendSet)) {
			int size, offset = 0;
			aopOp (IC_LEFT (sic), sic, FALSE);
			size = AOP_SIZE (IC_LEFT (sic));
			while (size--) {
				char *l =
					aopGet (AOP (IC_LEFT (sic)), offset);
				char *b = buffer;
				sprintf (b, "r%d", rnum++);
				if (strcmp (l, b))
					emitcode ("mov", "%s,%s", b, l);
				offset++;
			}
			freeAsmop (IC_LEFT (sic), NULL, sic, TRUE);
		}
		_G.sendSet = NULL;
	}

	emitcode ("icall", "");

	/* if we need assign a result value */
	if ((IS_ITEMP (IC_RESULT (ic)) &&
	     (OP_SYMBOL (IC_RESULT (ic))->nRegs ||
	      OP_SYMBOL (IC_RESULT (ic))->spildir)) ||
	    IS_TRUE_SYMOP (IC_RESULT (ic))) {

		aopOp (IC_RESULT (ic), ic, FALSE);

		assignResultValue (IC_RESULT (ic));
		freeAsmop (IC_RESULT (ic), NULL, ic, TRUE);
	}

	/* adjust the stack for parameters if
	   required */
	if (ic->parmBytes) {
		int i;
		if (ic->parmBytes > 3) {
			emitcode ("mov", "a,%s", spname);
			emitcode ("add", "a,#0x%02x",
				  (-ic->parmBytes) & 0xff);
			emitcode ("mov", "%s,a", spname);
		}
		else
			for (i = 0; i < ic->parmBytes; i++)
				emitcode ("dec", "%s", spname);

	}

	/* adjust the stack for parameters if required */
	if (ic->parmBytes) {
		if (ic->parmBytes > 63) {
			emitcode ("sbiw", "r28,%d", ic->parmBytes);
		}
		else {
			emitcode ("subi", "r28,<(%d)",
				  ic->parmBytes);
			emitcode ("sbci", "r29,>(%d)",
				  ic->parmBytes);
		}
	}
	if (ic->regsSaved)
		popZreg (ic);
}

/*-----------------------------------------------------------------*/
/* resultRemat - result  is rematerializable                       */
/*-----------------------------------------------------------------*/
static int
resultRemat (iCode * ic)
{
	if (SKIP_IC (ic) || ic->op == IFX)
		return 0;

	if (IC_RESULT (ic) && IS_ITEMP (IC_RESULT (ic))) {
		symbol *sym = OP_SYMBOL (IC_RESULT (ic));
		if (sym->remat && !POINTER_SET (ic))
			return 1;
	}

	return 0;
}

#if defined(__BORLANDC__) || defined(_MSC_VER)
#define STRCASECMP stricmp
#else
#define STRCASECMP strcasecmp
#endif

/*-----------------------------------------------------------------*/
/* genFunction - generated code for function entry                 */
/*-----------------------------------------------------------------*/
static void
genFunction (iCode * ic)
{
	symbol *sym;
	sym_link *ftype;
	int i = 0;

	_G.nRegsSaved = 0;
	/* create the function header */
	emitcode (";", "-----------------------------------------");
	emitcode (";", " function %s",
		  (sym = OP_SYMBOL (IC_LEFT (ic)))->name);
	emitcode (";", "-----------------------------------------");

	emitcode ("", "%s:", sym->rname);
	ftype = operandType (IC_LEFT (ic));

	/* if critical function then turn interrupts off */
	if (IFFUNC_ISCRITICAL (ftype))
		emitcode ("cli", "");

	if (IFFUNC_ISISR (sym->type)) {
	}

	/* save the preserved registers that are used in this function */
	for (i = R2_IDX; i <= R15_IDX; i++) {
		if (bitVectBitValue (sym->regsUsed, i)) {
			_G.nRegsSaved++;
			emitcode ("push", "%s", avr_regWithIdx (i)->name);
		}
	}
	/* now for the pointer registers */
	if (bitVectBitValue (sym->regsUsed, R26_IDX)) {
		_G.nRegsSaved++;
		emitcode ("push", "r26");
	}
	if (bitVectBitValue (sym->regsUsed, R27_IDX)) {
		_G.nRegsSaved++;
		emitcode ("push", "r27");
	}
	if (bitVectBitValue (sym->regsUsed, R30_IDX)) {
		_G.nRegsSaved++;
		emitcode ("push", "r30");
	}
	if (bitVectBitValue (sym->regsUsed, R31_IDX)) {
		_G.nRegsSaved++;
		emitcode ("push", "r31");
	}
	/* adjust the stack for the function */
	if (sym->stack) {
		emitcode ("push", "r28");
		emitcode ("push", "r29");
		emitcode ("in", "r28,__SP_L__");
		emitcode ("in", "r29,__SP_H__");
		if (sym->stack <= 63) {
			emitcode ("sbiw", "r28,%d", sym->stack);
		}
		else {
			emitcode ("subi", "r28,<(%d)", sym->stack);
			emitcode ("sbci", "r29,>(%d)", sym->stack);
		}
		emitcode ("out", "__SP_L__,r28");
		emitcode ("out", "__SP_H__,r29");
	}
}

/*-----------------------------------------------------------------*/
/* genEndFunction - generates epilogue for functions               */
/*-----------------------------------------------------------------*/
static void
genEndFunction (iCode * ic)
{
	symbol *sym = OP_SYMBOL (IC_LEFT (ic));
	int i;

	/* restore stack pointer */
	if (sym->stack) {
		if (sym->stack <= 63) {
			emitcode ("adiw", "r28,%d", sym->stack);
		}
		else {
			emitcode ("subi", "r28,<(-%d)", sym->stack);
			emitcode ("sbci", "r29,>(-%d)", sym->stack);
		}
		emitcode ("out", "__SP_L__,r28");
		emitcode ("out", "__SP_H__,r29");

		/* pop frame pointer */
		emitcode ("pop", "r29");
		emitcode ("pop", "r28");
	}
	/* restore preserved registers */
	if (bitVectBitValue (sym->regsUsed, R31_IDX)) {
		_G.nRegsSaved--;
		emitcode ("pop", "r31");
	}
	if (bitVectBitValue (sym->regsUsed, R30_IDX)) {
		_G.nRegsSaved--;
		emitcode ("pop", "r30");
	}
	if (bitVectBitValue (sym->regsUsed, R27_IDX)) {
		_G.nRegsSaved--;
		emitcode ("pop", "r27");
	}
	if (bitVectBitValue (sym->regsUsed, R26_IDX)) {
		_G.nRegsSaved--;
		emitcode ("pop", "r26");
	}
	for (i = R15_IDX; i >= R2_IDX; i--) {
		if (bitVectBitValue (sym->regsUsed, i)) {
			_G.nRegsSaved--;
			emitcode ("pop", "%s", avr_regWithIdx (i)->name);
		}
	}

	if (IFFUNC_ISCRITICAL (sym->type))
		emitcode ("sti", "");

	if (IFFUNC_ISISR (sym->type)) {
		emitcode ("rti", "");
	}
	else {
		emitcode ("ret", "");
	}

}

/*-----------------------------------------------------------------*/
/* genRet - generate code for return statement                     */
/*-----------------------------------------------------------------*/
static void
genRet (iCode * ic)
{
	int size, offset = 0;

	/* if we have no return value then
	   just generate the "ret" */
	if (!IC_LEFT (ic))
		goto jumpret;

	/* we have something to return then
	   move the return value into place */
	aopOp (IC_LEFT (ic), ic, FALSE);
	size = AOP_SIZE (IC_LEFT (ic));

	while (size--) {
		if (AOP_TYPE (IC_LEFT (ic)) == AOP_LIT) {
			emitcode ("ldi", "%s,%s(%d)", fAVRReturn[offset],
				  larray[offset],
				  (int) floatFromVal (AOP (IC_LEFT (ic))->
						      aopu.aop_lit), offset);
		}
		else {
			char *l;
			l = aopGet (AOP (IC_LEFT (ic)), offset);
			if (strcmp (fAVRReturn[offset], l))
				emitcode ("mov", "%s,%s", fAVRReturn[offset],
					  l);
		}
		offset++;
	}

	freeAsmop (IC_LEFT (ic), NULL, ic, TRUE);

      jumpret:
	/* generate a jump to the return label
	   if the next is not the return statement */
	if (!(ic->next && ic->next->op == LABEL &&
	      IC_LABEL (ic->next) == returnLabel))

		emitcode ("rjmp", "L%05d", returnLabel->key);

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

	emitcode ("", "L%05d:", IC_LABEL (ic)->key);
}

/*-----------------------------------------------------------------*/
/* genGoto - generates a ljmp                                      */
/*-----------------------------------------------------------------*/
static void
genGoto (iCode * ic)
{
	emitcode ("rjmp", "L%05d", (IC_LABEL (ic)->key));
}

/*-----------------------------------------------------------------*/
/* genPlusIncr :- does addition with increment if possible         */
/*-----------------------------------------------------------------*/
static bool
genPlusIncr (iCode * ic)
{
	unsigned int icount;
	int offset = 0;

	/* will try to generate an increment */
	/* if the right side is not a literal
	   we cannot */
	if (AOP_TYPE (IC_RIGHT (ic)) != AOP_LIT)
		return FALSE;

	icount = (unsigned int) floatFromVal (AOP (IC_RIGHT (ic))->aopu.
					     aop_lit);

	/* if the sizes are greater than 2 or they are not the same regs
	   then we cannot */
	if (!sameRegs (AOP (IC_LEFT (ic)), AOP (IC_RESULT (ic))))
		return FALSE;

	/* so we know LEFT & RESULT in the same registers and add
	   amount <= 63 */
	/* for short & char types */
	if (AOP_SIZE (IC_RESULT (ic)) < 2) {
		if (icount == 1) {
			emitcode ("inc", "%s",
				  aopGet (AOP (IC_LEFT (ic)), 0));
			return TRUE;
		}
		if (AOP_ISHIGHREG( AOP (IC_LEFT (ic)),0)) {
			emitcode ("subi", "%s,<(%d)",
				  aopGet (AOP (IC_LEFT (ic)), 0), 0-icount);
			return TRUE;
		}
	}

	for (offset = 0 ; offset < AOP_SIZE(IC_RESULT(ic)) ; offset++) {
		if (!(AOP_ISHIGHREG(AOP(IC_RESULT(ic)),offset))) return FALSE;
	}

	if (AOP_SIZE (IC_RESULT (ic)) <= 3) {
		/* if register pair and starts with 26/30 then adiw */
		if (isRegPair (AOP (IC_RESULT (ic))) && icount > 0
		    && icount < 64
		    && (IS_REGIDX (AOP (IC_RESULT (ic)), R26_IDX) || 
			IS_REGIDX (AOP (IC_RESULT (ic)), R24_IDX) || 
			IS_REGIDX (AOP (IC_RESULT (ic)), R30_IDX))) {
			emitcode ("adiw", "%s,%d",
				  aopGet (AOP (IC_RESULT (ic)), 0), icount);
			return TRUE;
		}

		/* use subi */
		emitcode ("subi", "%s,<(%d)",
			  aopGet (AOP (IC_RESULT (ic)), 0), 0-icount);
		emitcode ("sbci", "%s,>(%d)",
			  aopGet (AOP (IC_RESULT (ic)), 1), 0-icount);
		return TRUE;
	}

	/* for 32 bit longs */
	emitcode ("subi", "%s,<(%d)", aopGet (AOP (IC_RESULT (ic)), 0),
		  0-icount);
	emitcode ("sbci", "%s,>(%d)", aopGet (AOP (IC_RESULT (ic)), 1),
		  0-icount);
	emitcode ("sbci", "%s,hlo8(%d)", aopGet (AOP (IC_RESULT (ic)), 2),
		  0-icount);
	emitcode ("sbci", "%s,hhi8(%d)", aopGet (AOP (IC_RESULT (ic)), 3),
		  0-icount);
	return TRUE;

}

/* This is the pure and virtuous version of this code.
 * I'm pretty certain it's right, but not enough to toss the old
 * code just yet...
 */
static void
adjustArithmeticResult (iCode * ic)
{
	if (opIsGptr (IC_RESULT (ic)) &&
	    opIsGptr (IC_LEFT (ic)) &&
	    !sameRegs (AOP (IC_RESULT (ic)), AOP (IC_LEFT (ic)))) {
		aopPut (AOP (IC_RESULT (ic)),
			aopGet (AOP (IC_LEFT (ic)), GPTRSIZE - 1),
			GPTRSIZE - 1);
	}

	if (opIsGptr (IC_RESULT (ic)) &&
	    opIsGptr (IC_RIGHT (ic)) &&
	    !sameRegs (AOP (IC_RESULT (ic)), AOP (IC_RIGHT (ic)))) {
		aopPut (AOP (IC_RESULT (ic)),
			aopGet (AOP (IC_RIGHT (ic)), GPTRSIZE - 1),
			GPTRSIZE - 1);
	}

	if (opIsGptr (IC_RESULT (ic)) &&
	    AOP_SIZE (IC_LEFT (ic)) < GPTRSIZE &&
	    AOP_SIZE (IC_RIGHT (ic)) < GPTRSIZE &&
	    !sameRegs (AOP (IC_RESULT (ic)), AOP (IC_LEFT (ic))) &&
	    !sameRegs (AOP (IC_RESULT (ic)), AOP (IC_RIGHT (ic)))) {
		char buffer[5];
		sprintf (buffer, "%d",
			 pointerCode (getSpec (operandType (IC_LEFT (ic)))));
		aopPut (AOP (IC_RESULT (ic)), buffer, GPTRSIZE - 1);
	}
}

/*-----------------------------------------------------------------*/
/* genPlus - generates code for addition                           */
/*-----------------------------------------------------------------*/
static void
genPlus (iCode * ic)
{
	int size, offset = 0;
	int samer;
	char *l;

	/* special cases :- */

	aopOp (IC_LEFT (ic), ic, FALSE);
	aopOp (IC_RIGHT (ic), ic, FALSE);
	aopOp (IC_RESULT (ic), ic, TRUE);

	/* if I can do an increment instead
	   of add then GOOD for ME */
	if (genPlusIncr (ic) == TRUE)
		goto release;

	size = getDataSize (IC_RESULT (ic));
	samer = sameRegs (AOP (IC_RESULT (ic)), AOP (IC_LEFT (ic)));

	while (size--) {
		if (!samer)
			aopPut (AOP (IC_RESULT (ic)),
				aopGet (AOP (IC_LEFT (ic)), offset), offset);

		if (AOP_TYPE (IC_RIGHT (ic)) != AOP_LIT) {

			if (offset == 0)
				l = "add";
			else
				l = "adc";

			emitcode (l, "%s,%s",
				  aopGet (AOP (IC_RESULT (ic)), offset),
				  aopGet (AOP (IC_RIGHT (ic)), offset));
		}
		else {
			if (AOP_ISHIGHREG( AOP( IC_RESULT(ic)),offset)) {
				if (offset == 0)
					l = "subi";
				else
					l = "sbci";
				
				emitcode (l, "%s,%s(-%d)",
					  aopGet (AOP (IC_RESULT (ic)), offset),
					  larray[offset],
					  (int) floatFromVal (AOP (IC_RIGHT (ic))->
							      aopu.aop_lit));
			} else {
				if (offset == 0)
					l = "add";
				else
					l = "adc";
				
				emitcode (l, "%s,%s",
					  aopGet (AOP (IC_RESULT (ic)), offset),
					  aopGet (AOP (IC_RIGHT (ic)), offset));
			}
		}
		offset++;
	}

	adjustArithmeticResult (ic);

      release:
	freeAsmop (IC_LEFT (ic), NULL, ic,
		   (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (IC_RIGHT (ic), NULL, ic,
		   (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (IC_RESULT (ic), NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genMinusDec :- does subtraction with deccrement if possible     */
/*-----------------------------------------------------------------*/
static bool
genMinusDec (iCode * ic)
{
	unsigned int icount;
	int offset ;

	/* will try to generate an increment */
	/* if the right side is not a literal
	   we cannot */
	if (AOP_TYPE (IC_RIGHT (ic)) != AOP_LIT)
		return FALSE;

	icount =
		(unsigned int) floatFromVal (AOP (IC_RIGHT (ic))->aopu.
					     aop_lit);

	/* if the sizes are greater than 2 or they are not the same regs
	   then we cannot */
	if (!sameRegs (AOP (IC_LEFT (ic)), AOP (IC_RIGHT (ic))))
		return FALSE;

	/* so we know LEFT & RESULT in the same registers and add
	   amount <= 63 */
	/* for short & char types */
	if (AOP_SIZE (IC_RESULT (ic)) < 2) {
		if (icount == 1) {
			emitcode ("dec", "%s",
				  aopGet (AOP (IC_LEFT (ic)), 0));
			return TRUE;
		}
		if (AOP_ISHIGHREG( AOP ( IC_LEFT(ic)),0)) {
			emitcode ("subi", "%s,<(%d)",
				  aopGet (AOP (IC_LEFT (ic)), 0), icount);
			return TRUE;
		}
	}

	for (offset = 0 ; offset < AOP_SIZE(IC_RESULT(ic)) ; offset++) {
		if (!(AOP_ISHIGHREG(AOP(IC_RESULT(ic)),offset))) return FALSE;
	}

	if (AOP_SIZE (IC_RESULT (ic)) <= 3) {
		/* if register pair and starts with 26/30 then adiw */
		if (isRegPair (AOP (IC_RESULT (ic))) && icount > 0
		    && icount < 64
		    && (IS_REGIDX (AOP (IC_RESULT (ic)), R26_IDX) || 
			IS_REGIDX (AOP (IC_RESULT (ic)), R24_IDX) || 
			IS_REGIDX (AOP (IC_RESULT (ic)), R30_IDX))) {
			emitcode ("sbiw", "%s,%d",
				  aopGet (AOP (IC_RESULT (ic)), 0), icount);
			return TRUE;
		}

		/* use subi */
		emitcode ("subi", "%s,<(%d)",
			  aopGet (AOP (IC_RESULT (ic)), 0), icount);
		emitcode ("sbci", "%s,>(%d)",
			  aopGet (AOP (IC_RESULT (ic)), 1), icount);
		return TRUE;
	}
	/* for 32 bit longs */
	emitcode ("subi", "%s,<(%d)", aopGet (AOP (IC_RESULT (ic)), 0),
		  icount);
	emitcode ("sbci", "%s,>(%d)", aopGet (AOP (IC_RESULT (ic)), 1),
		  icount);
	emitcode ("sbci", "%s,hlo8(%d)", aopGet (AOP (IC_RESULT (ic)), 2),
		  icount);
	emitcode ("sbci", "%s,hhi8(%d)", aopGet (AOP (IC_RESULT (ic)), 3),
		  icount);
	return TRUE;

}

/*-----------------------------------------------------------------*/
/* genMinus - generates code for subtraction                       */
/*-----------------------------------------------------------------*/
static void
genMinus (iCode * ic)
{
	int size, offset = 0, samer;
	char *l;

	aopOp (IC_LEFT (ic), ic, FALSE);
	aopOp (IC_RIGHT (ic), ic, FALSE);
	aopOp (IC_RESULT (ic), ic, TRUE);

	/* if I can do an decrement instead
	   of subtract then GOOD for ME */
	if (genMinusDec (ic) == TRUE)
		goto release;

	size = getDataSize (IC_RESULT (ic));
	samer = sameRegs (AOP (IC_RESULT (ic)), AOP (IC_LEFT (ic)));
	while (size--) {
		if (!samer)
			aopPut (AOP (IC_RESULT (ic)),
				aopGet (AOP (IC_LEFT (ic)), offset), offset);

		if (AOP_TYPE (IC_RIGHT (ic)) != AOP_LIT) {

			if (offset == 0)
				l = "sub";
			else
				l = "sbc";

			emitcode (l, "%s,%s",
				  aopGet (AOP (IC_RESULT (ic)), offset),
				  aopGet (AOP (IC_RIGHT (ic)), offset));
		}
		else {
			if (AOP_ISHIGHREG(AOP (IC_RESULT (ic)),offset)) {
				if (offset == 0)
					l = "subi";
				else
					l = "sbci";
				
				emitcode (l, "%s,%s(%d)",
					  aopGet (AOP (IC_RESULT (ic)), offset),
					  larray[offset],
					  (int) floatFromVal (AOP (IC_RIGHT (ic))->
							      aopu.aop_lit));
			} else {
				if (offset == 0)
					l = "sub";
				else
					l = "sbc";
				
				emitcode (l, "%s,%s",
					  aopGet (AOP (IC_RESULT (ic)), offset),
					  aopGet (AOP (IC_RIGHT (ic)), offset));
			}
		}
		offset++;
	}

	adjustArithmeticResult (ic);

      release:
	freeAsmop (IC_LEFT (ic), NULL, ic,
		   (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (IC_RIGHT (ic), NULL, ic,
		   (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (IC_RESULT (ic), NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genMultOneByte : 8 bit multiplication & division                */
/*-----------------------------------------------------------------*/
static void
genMultOneByte (operand * left, operand * right, operand * result)
{
	sym_link *opetype = operandType (result);
	symbol *lbl;
	int size, offset;

	/* (if two literals, the value is computed before) */
	/* if one literal, literal on the right */
	if (AOP_TYPE (left) == AOP_LIT) {
		operand *t = right;
		right = left;
		left = t;
	}

	size = AOP_SIZE (result);

	if (SPEC_USIGN (opetype)) {
		emitcode ("mul", "%s,%s", aopGet (AOP (left), 0),
			  aopGet (AOP (right), 0));
	}
	else {
		emitcode ("muls", "%s,%s", aopGet (AOP (left), 0),
			  aopGet (AOP (right), 0));
	}
	aopPut (AOP (result), "r0", 0);
	if (size > 1) {
		aopPut (AOP (result), "r1", 1);
		offset = 2;
		size -= 2;
		if (SPEC_USIGN (opetype)) {
			while (size--) {
				aopPut (AOP (result), zero, offset++);
			}
		}
		else {
			if (size) {
				lbl = newiTempLabel (NULL);
				emitcode ("ldi", "r24,0");
				emitcode ("brcc", "L%05d", lbl->key);
				emitcode ("ldi", "r24,0xff)");
				emitcode ("", "L%05d:", lbl->key);
				while (size--)
					aopPut (AOP (result), "r24",
						offset++);
			}
		}
	}
	return;
}

/*-----------------------------------------------------------------*/
/* genMult - generates code for multiplication                     */
/*-----------------------------------------------------------------*/
static void
genMult (iCode * ic)
{
	operand *left = IC_LEFT (ic);
	operand *right = IC_RIGHT (ic);
	operand *result = IC_RESULT (ic);

	/* assign the amsops */
	aopOp (left, ic, FALSE);
	aopOp (right, ic, FALSE);
	aopOp (result, ic, TRUE);

	/* if both are of size == 1 */
	if (AOP_SIZE (left) == 1 && AOP_SIZE (right) == 1) {
		genMultOneByte (left, right, result);
		goto release;
	}

	/* should have been converted to function call */
	assert (0);

      release:
	freeAsmop (left, NULL, ic, (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (right, NULL, ic, (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genDiv - generates code for division                            */
/*-----------------------------------------------------------------*/
static void
genDiv (iCode * ic)
{
	/* should have been converted to function call */
	assert (0);
}

/*-----------------------------------------------------------------*/
/* genMod - generates code for division                            */
/*-----------------------------------------------------------------*/
static void
genMod (iCode * ic)
{
	/* should have been converted to function call */
	assert (0);

}

enum {
	AVR_EQ = 0,
	AVR_NE,
	AVR_LT,
	AVR_GE
};

/*-----------------------------------------------------------------*/
/* revavrcnd - reverse a conditional for avr                       */
/*-----------------------------------------------------------------*/
static int
revavrcnd (int type)
{
	static struct {
		int type, rtype;
	} rar[] = {
		{
		AVR_EQ, AVR_NE}
		, {
		AVR_LT, AVR_GE}
	};
	int i;

	for (i = 0; i < (sizeof (rar) / sizeof (rar[0])); i++) {
		if (rar[i].type == type)
			return rar[i].rtype;
		if (rar[i].rtype == type)
			return rar[i].type;
	}
	assert (0);		/* cannot happen */
	return 0;		/* makes the compiler happy */
}

static char *br_name[4] = { "breq", "brne", "brlt", "brge" };
static char *br_uname[4] = { "breq", "brne", "brlo", "brcc" };

/*-----------------------------------------------------------------*/
/* genBranch - generate the branch instruction                     */
/*-----------------------------------------------------------------*/
static void
genBranch (iCode * ifx, int br_type, int sign)
{
	int tj = (IC_TRUE (ifx) ? 1 : 0);

	if (tj) {		/* if true jump */
		char *nm = (sign ? br_name[br_type] : br_uname[br_type]);
		emitcode (nm, "L%05d", IC_TRUE (ifx)->key);
	}
	else {			/* if false jump */
		int rtype = revavrcnd (br_type);
		char *nm = (sign ? br_name[rtype] : br_uname[rtype]);
		emitcode (nm, "L%05d", IC_FALSE (ifx)->key);
	}
	ifx->generated = 1;
}

/*-----------------------------------------------------------------*/
/* genCmp - compare & jump                                         */
/*-----------------------------------------------------------------*/
static void
genCmp (iCode * ic, iCode * ifx, int br_type)
{
	operand *left, *right, *result;
	sym_link *letype, *retype;
	symbol *lbl;
	int sign, size, offset = 0;

	left = IC_LEFT (ic);
	right = IC_RIGHT (ic);
	result = IC_RESULT (ic);

	letype = getSpec (operandType (left));
	retype = getSpec (operandType (right));
	sign = !(SPEC_USIGN (letype) | SPEC_USIGN (retype));

	/* assign the amsops */
	aopOp (left, ic, FALSE);
	aopOp (right, ic, FALSE);
	aopOp (result, ic, TRUE);
	size = AOP_SIZE (left);

	if (ifx) {
		if (size == 1) {
			if (AOP_TYPE (right) == AOP_LIT) {
				emitcode ("cpi", "%s,<(%d)",
					  aopGet (AOP (left), 0),
					  (int)
					  floatFromVal (AOP (IC_RIGHT (ic))->
							aopu.aop_lit));
				genBranch (ifx, br_type, sign);
			}
			else {	/* right != literal */
				emitcode ("cp", "%s,%s",
					  aopGet (AOP (left), 0),
					  aopGet (AOP (right), 0));
				genBranch (ifx, br_type, sign);
			}
		}
		else {		/* size != 1 */
			while (size--) {
				if (offset == 0)
					emitcode ("cp", "%s,%s",
						  aopGet (AOP (left), 0),
						  aopGet (AOP (right), 0));
				else
					emitcode ("cpc", "%s,%s",
						  aopGet (AOP (left), offset),
						  aopGet (AOP (right),
							  offset));
				offset++;
			}
			genBranch (ifx, br_type, sign);
		}
	}
	else {			/* no ifx */
		emitcode ("clr", "r0");
		while (size--) {
			if (offset == 0)
				emitcode ("cp", "%s,%s",
					  aopGet (AOP (left), 0),
					  aopGet (AOP (right), 0));
			else
				emitcode ("cpc", "%s,%s",
					  aopGet (AOP (left), offset),
					  aopGet (AOP (right), offset));
			offset++;
		}
		lbl = newiTempLabel (NULL);
		br_type = revavrcnd (br_type);
		if (sign)
			emitcode (br_uname[br_type], "L%05d", lbl->key);
		else
			emitcode (br_name[br_type], "L%05d", lbl->key);
		emitcode ("inc", "r0");
		emitcode ("", "L%05d:", lbl->key);
		aopPut (AOP (result), "r0", 0);
		size = AOP_SIZE (result) - 1;
		offset = 1;
		while (size--)
			aopPut (AOP (result), zero, offset++);
	}

	freeAsmop (left, NULL, ic, (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (right, NULL, ic, (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genCmpGt :- greater than comparison                             */
/*-----------------------------------------------------------------*/
static void
genCmpGt (iCode * ic, iCode * ifx)
{
	/* should have transformed by the parser */
	assert (0);
}

/*-----------------------------------------------------------------*/
/* genCmpLt - less than comparisons                                */
/*-----------------------------------------------------------------*/
static void
genCmpLt (iCode * ic, iCode * ifx)
{
	genCmp (ic, ifx, AVR_LT);
}

/*-----------------------------------------------------------------*/
/* genCmpEq - generates code for equal to                          */
/*-----------------------------------------------------------------*/
static void
genCmpEq (iCode * ic, iCode * ifx)
{
	genCmp (ic, ifx, AVR_EQ);
}

/*-----------------------------------------------------------------*/
/* genCmpNe - generates code for not equal to                      */
/*-----------------------------------------------------------------*/
static void
genCmpNe (iCode * ic, iCode * ifx)
{
	genCmp (ic, ifx, AVR_NE);
}

/*-----------------------------------------------------------------*/
/* genCmpGe - generates code for greater than equal to             */
/*-----------------------------------------------------------------*/
static void
genCmpGe (iCode * ic, iCode * ifx)
{
	genCmp (ic, ifx, AVR_GE);
}

/*-----------------------------------------------------------------*/
/* genCmpLe - generates code for less than equal to                */
/*-----------------------------------------------------------------*/
static void
genCmpLe (iCode * ic, iCode * ifx)
{
	operand *left = IC_LEFT (ic);
	operand *right = IC_RIGHT (ic);

	IC_RIGHT (ic) = left;
	IC_LEFT (ic) = right;
	genCmp (ic, ifx, AVR_GE);
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
	    OP_SYMBOL (op)->liveTo <= ic->next->seq) return ic->next;

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
	int size, offset;

	/* note here that && operations that are in an
	   if statement are taken away by backPatchLabels
	   only those used in arthmetic operations remain */
	aopOp ((left = IC_LEFT (ic)), ic, FALSE);
	aopOp ((right = IC_RIGHT (ic)), ic, FALSE);
	aopOp ((result = IC_RESULT (ic)), ic, FALSE);

	tlbl = newiTempLabel (NULL);
	toBoolean (left, "r0", TRUE);
	toBoolean (right, "r1", TRUE);
	emitcode ("and", "r0,r1");
	emitcode ("ldi", "r24,1");
	emitcode ("breq", "L%05d", tlbl->key);
	emitcode ("dec", "r24");
	emitcode ("", "L%05d:", tlbl->key);
	aopPut (AOP (result), "r24", 0);
	size = AOP_SIZE (result) - 1;
	offset = 1;
	while (size--)
		aopPut (AOP (result), zero, offset++);

	freeAsmop (left, NULL, ic, (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (right, NULL, ic, (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (result, NULL, ic, TRUE);
}


/*-----------------------------------------------------------------*/
/* genOrOp - for || operation                                      */
/*-----------------------------------------------------------------*/
static void
genOrOp (iCode * ic)
{
	operand *left, *right, *result;
	symbol *tlbl;
	int size, offset;

	/* note here that || operations that are in an
	   if statement are taken away by backPatchLabels
	   only those used in arthmetic operations remain */
	aopOp ((left = IC_LEFT (ic)), ic, FALSE);
	aopOp ((right = IC_RIGHT (ic)), ic, FALSE);
	aopOp ((result = IC_RESULT (ic)), ic, FALSE);

	tlbl = newiTempLabel (NULL);
	toBoolean (left, "r0", TRUE);
	toBoolean (right, "r0", FALSE);
	emitcode ("ldi", "r24,1");
	emitcode ("breq", "L%05d", tlbl->key);
	emitcode ("dec", "r24");
	emitcode ("", "L%05d:", tlbl->key);
	aopPut (AOP (result), "r24", 0);
	size = AOP_SIZE (result) - 1;
	offset = 1;
	while (size--)
		aopPut (AOP (result), zero, offset++);

	freeAsmop (left, NULL, ic, (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (right, NULL, ic, (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (result, NULL, ic, TRUE);
}

enum {
	AVR_AND = 0, AVR_OR, AVR_XOR
};
static char *bopnames_lit[] = { "andi", "ori" };
static char *bopnames[] = { "and", "or", "eor" };
/*-----------------------------------------------------------------*/
/* genBitWise - generate bitwise operations                        */
/*-----------------------------------------------------------------*/
static void
genBitWise (iCode * ic, iCode * ifx, int bitop)
{
	operand *left, *right, *result;
	int size, offset = 0;
	char *l;
	symbol *lbl, *lbl1;
	int samerl, samerr;

	aopOp ((left = IC_LEFT (ic)), ic, FALSE);
	aopOp ((right = IC_RIGHT (ic)), ic, FALSE);
	aopOp ((result = IC_RESULT (ic)), ic, TRUE);

	size = AOP_SIZE (left);
	offset = 0;
	if (ifx) {		/* used only for jumps */
		if (AOP_TYPE (right) == AOP_LIT &&
		    (bitop == AVR_AND || bitop == AVR_OR)) {
			int lit =
				(int) floatFromVal (AOP (right)->aopu.
						    aop_lit);
			int p2 = powof2 (lit);
			if (bitop == AVR_AND && p2) {	/* right side is a power of 2 */
				l = aopGet (AOP (left), p2 / 8);
				if (IC_TRUE (ifx)) {
					emitcode ("sbrc", "%s,%d", l,
						  (p2 % 8));
					emitcode ("rjmp", "L%05d",
						  IC_TRUE (ifx)->key);
				}
				else {
					emitcode ("sbrs", "%s,%d", l,
						  (p2 % 8));
					emitcode ("rjmp", "L%05d",
						  IC_FALSE (ifx)->key);
				}
			}
			else {	/* right not power of two */
				int eh = OP_SYMBOL (left)->liveTo <= ic->seq;
				if (size == 1) {
					if (eh && AOP_ISHIGHREG(AOP(IC_LEFT(ic)),0)) {
						emitcode (bopnames_lit[bitop],
							  "%s,<(%d)",
							  aopGet (AOP (IC_LEFT (ic)), 0), lit);
					}
					else {
						MOVR24 (aopGet (AOP (IC_LEFT (ic)), 0));
						emitcode (bopnames_lit[bitop], "r24,<(%d)", lit);
					}
					lbl = newiTempLabel (NULL);
					if (IC_TRUE (ifx)) {
						emitcode ("breq", "L%05d", lbl->key);
						emitcode ("rjmp", "L%05d", IC_TRUE (ifx)->key);
					}
					else {
						emitcode ("brne", "L%05d", lbl->key);
						emitcode ("rjmp", "L%05d", IC_FALSE (ifx)-> key);
					}
					emitcode ("", "L%05d:", lbl->key);
				}
				else if (size == 2) {
					emitcode ("mov", "r24,%s", aopGet (AOP (IC_LEFT (ic)), 0));
					emitcode ("mov", "r25,%s", aopGet (AOP (IC_LEFT (ic)), 1));
					emitcode (bopnames_lit[bitop], "r24,<(%d)", lit);
					emitcode (bopnames_lit[bitop], "r25,>(%d)", lit);
					emitcode ("sbiw", "r24,0");
					lbl = newiTempLabel (NULL);
					if (IC_TRUE (ifx)) {
						emitcode ("breq", "L%05d", lbl->key);
						emitcode ("rjmp", "L%05d", IC_TRUE (ifx)->key);
					}
					else {
						emitcode ("brne", "L%05d", lbl->key);
						emitcode ("rjmp", "L%05d", IC_FALSE (ifx)->key);
					}
					emitcode ("", "L%05d:", lbl->key);
				}
				else {
					lbl = newiTempLabel (NULL);
					lbl1 = newiTempLabel (NULL);
					while (size--) {
						if (eh && AOP_ISHIGHREG(AOP(IC_LEFT(ic)),offset)) {
							emitcode (bopnames_lit [bitop], "%s,<(%d)",
								  aopGet (AOP (IC_LEFT (ic)), offset),
								  lit);
						}
						else {
							char *l = aopGet (AOP (IC_LEFT (ic)), offset);
							MOVR24 (l);
							emitcode ("andi", "r24,<(%d)", lit);
						}
						emitcode ("brne", "L%05d", lbl->key);
						offset++;
					}
					/* all are zero */
					if (IC_FALSE (ifx))
						emitcode ("rjmp", "L%05d", IC_FALSE (ifx)-> key);
					else
						emitcode ("rjmp", "L%05d", lbl1->key);
					emitcode ("", "L%05d:", lbl->key);
					/* not zero */
					if (IC_TRUE (ifx))
						emitcode ("rjmp", "L%05d", IC_TRUE (ifx)->key);
					emitcode ("", "L%05d:", lbl1->key);

				}
			}
		}
		else {		/* right is not a literal */
			int eh = OP_SYMBOL (left)->liveTo <= ic->seq;
			int reh = OP_SYMBOL (right)->liveTo <= ic->seq;
			if (size == 1) {
				if (eh) {
					emitcode (bopnames[bitop], "%s,%s", aopGet (AOP (IC_LEFT (ic)), 0),
						  aopGet (AOP (IC_RIGHT (ic)), 0));
				}
				else if (reh) {
					emitcode (bopnames[bitop], "%s,%s",
						  aopGet (AOP (IC_RIGHT (ic)), 0),
						  aopGet (AOP (IC_LEFT (ic)), 0));
				}
				else {
					MOVR0 (aopGet (AOP (IC_LEFT (ic)), 0));
					emitcode (bopnames[bitop], "r0,%s",
						  aopGet (AOP (IC_RIGHT (ic)), 0));
				}
				lbl = newiTempLabel (NULL);
				if (IC_TRUE (ifx)) {
					emitcode ("breq", "L%05d", lbl->key);
					emitcode ("rjmp", "L%05d",
						  IC_TRUE (ifx)->key);
				}
				else {
					emitcode ("brne", "L%05d", lbl->key);
					emitcode ("rjmp", "L%05d",
						  IC_FALSE (ifx)->key);
				}
				emitcode ("", "L%05d:", lbl->key);
			}
			else if (size == 2) {
				emitcode ("mov", "r24,%s",
					  aopGet (AOP (IC_LEFT (ic)), 0));
				emitcode ("mov", "r25,%s",
					  aopGet (AOP (IC_LEFT (ic)), 1));
				emitcode (bopnames[bitop], "r24,%s",
					  aopGet (AOP (IC_RIGHT (ic)), 0));
				emitcode (bopnames[bitop], "r25,%s",
					  aopGet (AOP (IC_RIGHT (ic)), 1));
				emitcode ("sbiw", "r24,0");
				lbl = newiTempLabel (NULL);
				if (IC_TRUE (ifx)) {
					emitcode ("breq", "L%05d", lbl->key);
					emitcode ("rjmp", "L%05d", IC_TRUE (ifx)->key);
				}
				else {
					emitcode ("brne", "L%05d", lbl->key);
					emitcode ("rjmp", "L%05d", IC_FALSE (ifx)->key);
				}
				emitcode ("", "L%05d:", lbl->key);
			}
			else {
				lbl = newiTempLabel (NULL);
				lbl1 = newiTempLabel (NULL);
				while (size--) {
					if (eh) {
						emitcode (bopnames[bitop], "%s,%s",
							  aopGet (AOP (IC_LEFT (ic)), offset),
							  aopGet (AOP (IC_RIGHT (ic)), offset));
					}
					else if (reh) {
						emitcode (bopnames[bitop], "%s,%s",
							  aopGet (AOP (IC_RIGHT (ic)), offset),
							  aopGet (AOP (IC_LEFT (ic)), offset));
					}
					else {
						MOVR0 (aopGet (AOP (IC_LEFT (ic)), offset));
						emitcode (bopnames[bitop], "r0,%s",
							  aopGet (AOP (IC_RIGHT (ic)), offset));
					}
					emitcode ("brne", "L%05d", lbl->key);
					offset++;
				}
				/* all are zero */
				if (IC_FALSE (ifx))
					emitcode ("rjmp", "L%05d", IC_FALSE (ifx)->key);
				else
					emitcode ("rjmp", "L%05d", lbl1->key);
				emitcode ("", "L%05d:", lbl->key);
				/* not zero */
				if (IC_TRUE (ifx))
					emitcode ("rjmp", "L%05d", IC_TRUE (ifx)->key);
				emitcode ("", "L%05d:", lbl1->key);

			}
		}
		goto release;
	}

	/* result needs to go a register */
	samerl = sameRegs (AOP (IC_RESULT (ic)), AOP (IC_LEFT (ic)));
	samerr = sameRegs (AOP (IC_RESULT (ic)), AOP (IC_RIGHT (ic)));
	while (size--) {
		if (AOP_TYPE (right) == AOP_LIT) {
			unsigned int lit =
				(int) floatFromVal (AOP (right)->aopu.
						    aop_lit);
			if (((lit >> (8 * offset)) & 0xff) == 0) {
				if (bitop == AVR_AND) {
					aopPut (AOP (result), zero, offset++);
					continue;
				}
				else if (bitop == AVR_OR) {
					if (!samerl)
						aopPut (AOP (result),
							aopGet (AOP (left),
								offset),
							offset);
					offset++;
					continue;
				}
			}
		}
		if (samerl) {
			if (AOP_TYPE (IC_RIGHT (ic)) == AOP_LIT && 
			    AOP_ISHIGHREG(AOP(IC_LEFT(ic)),offset) &&
			    (bitop == AVR_AND || bitop == AVR_OR)) {
				emitcode (bopnames_lit[bitop], "%s,%s(%d)",
					  aopGet (AOP (IC_LEFT (ic)), offset),
					  larray[offset],
					  (int) floatFromVal (AOP (right)-> aopu.aop_lit));
			}
			else {
				emitcode (bopnames[bitop], "%s,%s",
					  aopGet (AOP (IC_LEFT (ic)), offset),
					  aopGet (AOP (IC_RIGHT (ic)), offset));
			}
		}
		else if (samerr) {
			emitcode (bopnames[bitop], "%s,%s",
				  aopGet (AOP (IC_RIGHT (ic)), offset),
				  aopGet (AOP (IC_LEFT (ic)), offset));
		}
		else {
			aopPut (AOP (IC_RESULT (ic)),
				aopGet (AOP (IC_LEFT (ic)), offset), offset);
			emitcode (bopnames[bitop],
				  aopGet (AOP (IC_RESULT (ic)), offset),
				  aopGet (AOP (IC_RIGHT (ic)), offset));
		}
		offset++;
	}
      release:
	freeAsmop (left, NULL, ic, (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (right, NULL, ic, (RESULTONSTACK (ic) ? FALSE : TRUE));
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genAnd  - code for and                                          */
/*-----------------------------------------------------------------*/
static void
genAnd (iCode * ic, iCode * ifx)
{
	genBitWise (ic, ifx, AVR_AND);
}

/*-----------------------------------------------------------------*/
/* genOr  - code for or                                            */
/*-----------------------------------------------------------------*/
static void
genOr (iCode * ic, iCode * ifx)
{
	genBitWise (ic, ifx, AVR_OR);
}

/*-----------------------------------------------------------------*/
/* genXor - code for xclusive or                                   */
/*-----------------------------------------------------------------*/
static void
genXor (iCode * ic, iCode * ifx)
{
	genBitWise (ic, ifx, AVR_XOR);
}

/*-----------------------------------------------------------------*/
/* genInline - write the inline code out                           */
/*-----------------------------------------------------------------*/
static void
genInline (iCode * ic)
{
	char *buffer, *bp, *bp1;

	_G.inLine += (!options.asmpeep);

	buffer = bp = bp1 = Safe_calloc(1, strlen(IC_INLINE(ic))+1);
	strcpy (buffer, IC_INLINE (ic));

	/* emit each line as a code */
	while (*bp) {
		if (*bp == '\n') {
			*bp++ = '\0';
			emitcode (bp1, "");
			bp1 = bp;
		}
		else {
			if (*bp == ':') {
				bp++;
				*bp = '\0';
				bp++;
				emitcode (bp1, "");
				bp1 = bp;
			}
			else
				bp++;
		}
	}
	if (bp1 != bp)
		emitcode (bp1, "");
	/*     emitcode("",buffer); */
	_G.inLine -= (!options.asmpeep);
}

/*-----------------------------------------------------------------*/
/* genRotC - rotate right/left with carry , lr = 1 rotate right    */
/*-----------------------------------------------------------------*/
static void
genRotC (iCode * ic, int lr)
{
	operand *left, *result;
	int size, offset = 0;

	/* rotate right with carry */
	left = IC_LEFT (ic);
	result = IC_RESULT (ic);
	aopOp (left, ic, FALSE);
	aopOp (result, ic, FALSE);

	/* move it to the result */
	size = AOP_SIZE (result);
	if (!sameRegs (AOP (left), AOP (result))) {
		offset = 0;
		while (size--) {
			aopPut (AOP (result),
				aopGet (AOP (left), offset), offset);
			offset++;
		}
		size = AOP_SIZE (result);
	}
	if (lr)
		offset = size - 1;
	else
		offset = 0;

	CLRC;
	emitcode ("sbrc", "%s,%d", aopGet (AOP (result), offset),
		  (lr ? 0 : 7));
	emitcode ("sec", "");

	while (size--) {
		emitcode ((lr ? "ror" : "rol"), "%s",
			  aopGet (AOP (result), offset));
		if (lr)
			offset--;
		else
			offset++;
	}
	freeAsmop (left, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genRRC - rotate right with carry                                */
/*-----------------------------------------------------------------*/
static void
genRRC (iCode * ic)
{
	genRotC (ic, 1);
}

/*-----------------------------------------------------------------*/
/* genRLC - generate code for rotate left with carry               */
/*-----------------------------------------------------------------*/
static void
genRLC (iCode * ic)
{
	genRotC (ic, 0);
}

/*-----------------------------------------------------------------*/
/* genGetHbit - generates code get highest order bit               */
/*-----------------------------------------------------------------*/
static void
genGetHbit (iCode * ic)
{
	operand *left, *result;
	int size, offset;

	left = IC_LEFT (ic);
	result = IC_RESULT (ic);
	aopOp (left, ic, FALSE);
	aopOp (result, ic, FALSE);

	size = AOP_SIZE (result);
	if (!sameRegs (AOP (left), AOP (result))) {
		emitcode ("clr", "%s", aopGet (AOP (result), size - 1));
		emitcode ("sbrc", "%s,7", aopGet (AOP (left), size - 1));
		emitcode ("subi", "%s,<(-1)",
			  aopGet (AOP (result), size - 1));
	}
	else {
		emitcode ("clr", "r0");
		emitcode ("sbrc", "%s,7", aopGet (AOP (left), size - 1));
		emitcode ("subi", "r0,<(-1)");
		aopPut (AOP (result), "r0", 0);
	}
	offset = 1;
	size--;
	while (size--) {
		emitcode ("clr", aopGet (AOP (result), offset++));
	}
	freeAsmop (left, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genShiftLeftLit - shift left by a known amount                  */
/*-----------------------------------------------------------------*/
static void
genShiftLeftLit (iCode * ic)
{
	operand *left, *right, *result;
	int size, shCount, offset = 0;
	int lByteZ = 0;

	right = IC_RIGHT (ic);
	left = IC_LEFT (ic);
	result = IC_RESULT (ic);

	aopOp (left, ic, FALSE);
	aopOp (result, ic, FALSE);
	size = AOP_SIZE (result);
	shCount = (int) floatFromVal (AOP (right)->aopu.aop_lit);

	if (shCount > (size * 8 - 1)) {
		while (size--)
			aopPut (AOP (result), zero, offset++);
		goto release;
	}
	switch (size) {
	case 1:
		if (!sameRegs (AOP (left), AOP (result)))
			aopPut (AOP (result), aopGet (AOP (left), 0), 0);
		if (shCount >= 4) {
			if (AOP_ISHIGHREG(AOP(result),0)) {
				emitcode ("swap", "%s", aopGet (AOP (result), 0));
				emitcode ("andi", "%s,0xf0");
			} else {
				emitcode ("ldi","r24,0xf0");
				emitcode ("swap", "%s", aopGet (AOP (result), 0));
				emitcode ("and", "%s,r24");
			}
			shCount -= 4;
		}
		if (shCount == 1) {
			emitcode ("add", "%s,%s", aopGet (AOP (result), 0),
				  aopGet (AOP (result), 0));
			shCount--;
		}
		while (shCount--)
			emitcode ("lsl", "%s", aopGet (AOP (result), 0));
		break;
	case 2:
		if (shCount >= 12) {
			aopPut (AOP (result), aopGet (AOP (left), 0), 1);
			aopPut (AOP (result), zero, 0);			
			emitcode ("swap", "%s", aopGet (AOP (result), 1));
			if (AOP_ISHIGHREG(AOP(result),1)) {
				emitcode ("andi", "%s,0xf0", aopGet (AOP (result), 1));
			} else {
				emitcode ("ldi","r24,0xf0");
				emitcode ("and", "%s,r24", aopGet (AOP (result), 1));
			}
			shCount -= 12;
			lByteZ = 1;
		}
		if (shCount >= 8) {
			aopPut (AOP (result), aopGet (AOP (left), 0), 1);
			aopPut (AOP (result), zero, 0);
			shCount -= 8;
			lByteZ = 1;
		}
		if (shCount >= 4) {
			shCount -= 4;
			if (!sameRegs (AOP (left), AOP (result))) {
				aopPut (AOP (result), aopGet (AOP (left), 0),
					0);
				aopPut (AOP (result), aopGet (AOP (left), 1),
					1);
			}
			emitcode ("mov", "r24,%s", aopGet (AOP (result), 0));
			emitcode ("andi", "r24,0x0f");
			if (!(AOP_ISHIGHREG(AOP(result),0) && AOP_ISHIGHREG(AOP(result),1))) {
				emitcode("ldi","r25,0xf0");
			}
			emitcode ("swap", "%s", aopGet (AOP (result), 0));
			if (AOP_ISHIGHREG(AOP(result),0)) {
				emitcode ("andi", "%s,0xf0", aopGet (AOP (result), 0));
			} else {
				emitcode ("and", "%s,r25", aopGet (AOP (result), 0));
			}
			emitcode ("swap", "%s", aopGet (AOP (result), 1));
			if (AOP_ISHIGHREG(AOP(result),1)) {
				emitcode ("andi", "%s,0xf0", aopGet (AOP (result), 1));
			} else {
				emitcode ("and", "%s,r25", aopGet (AOP (result), 1));
			}
			emitcode ("or", "%s,r24", aopGet (AOP (result), 1));
			while (shCount--) {
				emitcode ("lsl", "%s", aopGet (AOP (result), 0));
				emitcode ("rol", "%s", aopGet (AOP (result), 1));
			}
		}
		if (!lByteZ && !sameRegs (AOP (result), AOP (left))
		    && shCount) {
			offset = 0;
			while (size--) {
				aopPut (AOP (result),
					aopGet (AOP (left), offset), offset);
				offset++;
			}
		}
		while (shCount--) {
			if (lByteZ) {
				emitcode ("lsl", "%s", aopGet (AOP (result), 1));
			}
			else {
				emitcode ("lsl", "%s", aopGet (AOP (result), 0));
				emitcode ("rol", "%s", aopGet (AOP (result), 1));
			}
		}
		break;
	case 3:
		assert ("shifting generic pointer ?\n");
		break;
	case 4:
		/* 32 bits we do only byte boundaries */
		if (shCount >= 24) {
			aopPut (AOP (result), aopGet (AOP (left), 0), 3);
			aopPut (AOP (result), zero, 2);
			aopPut (AOP (result), zero, 1);
			aopPut (AOP (result), zero, 0);
			lByteZ = 3;
			shCount -= 24;
		}
		if (shCount >= 16) {
			aopPut (AOP (result), aopGet (AOP (left), 0), 3);
			aopPut (AOP (result), aopGet (AOP (left), 1), 2);
			aopPut (AOP (result), zero, 1);
			aopPut (AOP (result), zero, 0);
			lByteZ = 2;
			shCount -= 16;
		}
		if (shCount >= 8) {
			aopPut (AOP (result), aopGet (AOP (left), 0), 3);
			aopPut (AOP (result), aopGet (AOP (left), 1), 2);
			aopPut (AOP (result), aopGet (AOP (left), 2), 1);
			aopPut (AOP (result), zero, 0);
			shCount -= 8;
			lByteZ = 1;
		}
		if (!lByteZ && !sameRegs (AOP (left), AOP (right))) {
			offset = 0;
			while (size--) {
				aopPut (AOP (result),
					aopGet (AOP (left), offset), offset);
				offset++;
			}
			offset = 0;
			size = AOP_SIZE (result);
		}
		if (shCount) {
			switch (lByteZ) {
			case 0:
				while (shCount--) {
					emitcode ("lsl", "%s", aopGet (AOP (result), 0));
					emitcode ("rol", "%s", aopGet (AOP (result), 1));
					emitcode ("rol", "%s", aopGet (AOP (result), 2));
					emitcode ("rol", "%s", aopGet (AOP (result), 3));
				}
				break;
			case 1:
				while (shCount--) {
					emitcode ("lsl", "%s", aopGet (AOP (result), 1));
					emitcode ("rol", "%s", aopGet (AOP (result), 2));
					emitcode ("rol", "%s", aopGet (AOP (result), 3));
				}
				break;
			case 2:
				while (shCount--) {
					emitcode ("lsl", "%s", aopGet (AOP (result), 2));
					emitcode ("rol", "%s", aopGet (AOP (result), 3));
				}
				break;
			case 3:
				while (shCount--) {
					emitcode ("lsl", "%s", aopGet (AOP (result), 3));
				}
				break;
			}
		}
	}

      release:
	freeAsmop (left, NULL, ic, TRUE);
	freeAsmop (right, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genLeftShift - generates code for left shifting                 */
/*-----------------------------------------------------------------*/
static void
genLeftShift (iCode * ic)
{
	operand *left, *right, *result;
	int size, offset;
	symbol *tlbl;

	right = IC_RIGHT (ic);
	left = IC_LEFT (ic);
	result = IC_RESULT (ic);

	aopOp (right, ic, FALSE);

	if (AOP_TYPE (right) == AOP_LIT) {
		genShiftLeftLit (ic);
		return;
	}

	/* unknown count */
	aopOp (left, ic, FALSE);
	aopOp (result, ic, FALSE);
	size = AOP_SIZE (result);
	offset = 0;
	if (AOP_SIZE (right) > 1) {
		if (isRegPair (AOP (right))) {
			emitcode ("movw", "r24,%s", aopGet (AOP (right), 0));
		}
		else {
			emitcode ("mov", "r24,%s", aopGet (AOP (right), 0));
			emitcode ("mov", "r25,%s", aopGet (AOP (right), 1));
		}
	}
	else {
		emitcode ("mov", "r24,%s", aopGet (AOP (right), 0));
	}
	if (!sameRegs (AOP (left), AOP (result))) {
		while (size--) {
			aopPut (AOP (result), aopGet (AOP (left), offset),
				offset);
			offset++;
		}
		size = AOP_SIZE (result);
	}
	tlbl = newiTempLabel (NULL);
	emitcode ("", "L%05d:", tlbl->key);
	offset = 0;
	while (size--) {
		if (offset)
			emitcode ("rol", "%s", aopGet (AOP (result), offset));
		else
			emitcode ("lsl", "%s", aopGet (AOP (result), 0));
		offset++;
	}
	if (AOP_SIZE (right) > 1)
		emitcode ("sbiw", "r24,1");
	else
		emitcode ("dec", "r24");
	emitcode ("brne", "L%05d", tlbl->key);

	freeAsmop (left, NULL, ic, TRUE);
	freeAsmop (right, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genShiftRightLit - generate for right shift with known count    */
/*-----------------------------------------------------------------*/
static void
genShiftRightLit (iCode * ic)
{
	operand *left = IC_LEFT (ic)
	, *right = IC_RIGHT (ic)
	, *result = IC_RESULT (ic);
	int size, shCount, offset = 0;
	int hByteZ = 0;
	sym_link *letype = getSpec (operandType (left));
	int sign = !SPEC_USIGN (letype);

	right = IC_RIGHT (ic);
	left = IC_LEFT (ic);
	result = IC_RESULT (ic);

	aopOp (left, ic, FALSE);
	aopOp (result, ic, FALSE);
	size = AOP_SIZE (result);
	shCount = (int) floatFromVal (AOP (right)->aopu.aop_lit);

	/* if signed then give up and use a loop to shift */
	if (sign) {
		symbol *tlbl;
		if (!sameRegs (AOP (left), AOP (result))) {
			while (size--) {
				aopPut (AOP (result),
					aopGet (AOP (left), offset), offset);
				offset++;
			}
			size = AOP_SIZE (result);
			offset = 0;
		}
		/* be as economical as possible */
		if (shCount <= 4) {
			while (shCount--) {
				size = AOP_SIZE (result);
				offset = size - 1;
				while (size--) {
					/* highest order byte */
					if (offset == (AOP_SIZE(result)-1)) 
						emitcode ("asr", "%s", aopGet (AOP (result), offset));
					else
						emitcode ("ror", "%s", aopGet (AOP (result), offset));
					offset--;						
				}
			}
		}
		else {
			emitcode ("ldi", "r24,<(%d)", shCount);
			tlbl = newiTempLabel (NULL);
			emitcode ("", "L%05d:", tlbl->key);
			offset = size - 1;
			while (size--) {
				if (offset == (AOP_SIZE(result) - 1))
					emitcode ("asr", "%s", aopGet (AOP (result), offset));
				else
					emitcode ("ror", "%s", aopGet (AOP (result), offset));
				offset--;
			}
			emitcode ("dec", "r24");
			emitcode ("brne", "L%05d", tlbl->key);
		}
		goto release;
	}
	if (shCount > (size * 8 - 1)) {
		while (size--)
			aopPut (AOP (result), zero, offset++);
		goto release;
	}
	/* for unsigned we can much more efficient */
	switch (size) {
	case 1:
		if (!sameRegs (AOP (left), AOP (result)))
			aopPut (AOP (result), aopGet (AOP (left), 0), 0);
		if (shCount >= 4) {
			emitcode ("swap", "%s", aopGet (AOP (result), 0));
			if (AOP_ISHIGHREG(AOP(result),0)) {
				emitcode ("andi", "%s,0x0f",aopGet(AOP(result),0));
			} else {
				emitcode ("ldi","r24,0x0f");
				emitcode ("and", "%s,r24",aopGet(AOP(result),0));
			}
			shCount -= 4;
		}
		while (shCount--)
			emitcode ("lsr", "%s", aopGet (AOP (result), 0));
		break;
	case 2:
		if (shCount >= 12) {
			aopPut (AOP (result), aopGet (AOP (left), 1), 0);
			aopPut (AOP (result), zero, 1);
			emitcode ("swap", "%s", aopGet (AOP (result), 0));
			if (AOP_ISHIGHREG(AOP(result),0)) {
				emitcode ("andi", "%s,0x0f", aopGet (AOP (result), 0));
			} else {
				emitcode ("ldi","r24,0x0f");
				emitcode ("and", "%s,r24",aopGet(AOP(result),0));
			}
			shCount -= 12;
			hByteZ = 1;
		}
		if (shCount >= 8) {
			aopPut (AOP (result), aopGet (AOP (left), 1), 0);
			aopPut (AOP (result), zero, 1);
			shCount -= 8;
			hByteZ = 1;
		}
		if (shCount >= 4) {
			shCount -= 4;
			if (!sameRegs (AOP (left), AOP (result))) {
				aopPut (AOP (result), aopGet (AOP (left), 0), 0);
				aopPut (AOP (result), aopGet (AOP (left), 1), 1);
			}
			if (!(AOP_ISHIGHREG(AOP(result),0) && AOP_ISHIGHREG(AOP(result),1))) {
				emitcode("ldi","r25,0x0f");
			}
			emitcode ("mov", "r24,%s", aopGet (AOP (result), 1));
			emitcode ("andi", "r24,0xf0");
			emitcode ("swap", "%s", aopGet (AOP (result), 0));
			if (AOP_ISHIGHREG(AOP(result),0)) {
				emitcode ("andi", "%s,0x0f", aopGet (AOP (result), 0));
			} else {
				emitcode ("and", "%s,r25", aopGet (AOP (result), 0));
			}
			emitcode ("or", "%s,r24", aopGet (AOP (result), 0));
			emitcode ("swap", "%s", aopGet (AOP (result), 1));
			if (AOP_ISHIGHREG(AOP(result),1)) {
				emitcode ("andi", "%s,0x0f", aopGet (AOP (result), 1));
			} else {
				emitcode ("and", "%s,r24", aopGet (AOP (result), 1));				
			}
			while (shCount--) {
				emitcode ("lsr", "%s", aopGet (AOP (result), 1));
				emitcode ("ror", "%s", aopGet (AOP (result), 0));
			}

		}
		if (!hByteZ && !sameRegs (AOP (result), AOP (left))
		    && shCount) {
			offset = 0;
			while (size--) {
				aopPut (AOP (result), aopGet (AOP (left), offset), offset);
				offset++;
			}
		}
		while (shCount--) {
			if (hByteZ) {
				emitcode ("lsr", "%s", aopGet (AOP (result), 0));
			}
			else {
				emitcode ("lsr", "%s", aopGet (AOP (result), 1));
				emitcode ("ror", "%s", aopGet (AOP (result), 0));
			}
		}
		break;

	case 3:
		assert ("shifting generic pointer ?\n");
		break;
	case 4:
		/* 32 bits we do only byte boundaries */
		if (shCount >= 24) {
			aopPut (AOP (result), aopGet (AOP (left), 3), 0);
			aopPut (AOP (result), zero, 1);
			aopPut (AOP (result), zero, 2);
			aopPut (AOP (result), zero, 3);
			hByteZ = 3;
			shCount -= 24;
		}
		if (shCount >= 16) {
			aopPut (AOP (result), aopGet (AOP (left), 3), 1);
			aopPut (AOP (result), aopGet (AOP (left), 2), 0);
			aopPut (AOP (result), zero, 2);
			aopPut (AOP (result), zero, 3);
			hByteZ = 2;
			shCount -= 16;
		}
		if (shCount >= 8) {
			aopPut (AOP (result), aopGet (AOP (left), 1), 0);
			aopPut (AOP (result), aopGet (AOP (left), 2), 1);
			aopPut (AOP (result), aopGet (AOP (left), 3), 2);
			aopPut (AOP (result), zero, 3);
			shCount -= 8;
			hByteZ = 1;
		}
		if (!hByteZ && !sameRegs (AOP (left), AOP (right))) {
			offset = 0;
			while (size--) {
				aopPut (AOP (result),
					aopGet (AOP (left), offset), offset);
				offset++;
			}
			offset = 0;
			size = AOP_SIZE (result);
		}
		if (shCount) {
			switch (hByteZ) {
			case 0:
				while (shCount--) {
					emitcode ("lsr", "%s", aopGet (AOP (result), 3));
					emitcode ("ror", "%s", aopGet (AOP (result), 2));
					emitcode ("ror", "%s", aopGet (AOP (result), 1));
					emitcode ("ror", "%s", aopGet (AOP (result), 0));
				}
				break;
			case 1:
				while (shCount--) {
					emitcode ("lsr", "%s", aopGet (AOP (result), 2));
					emitcode ("ror", "%s", aopGet (AOP (result), 1));
					emitcode ("ror", "%s", aopGet (AOP (result), 0));
				}
				break;
			case 2:
				while (shCount--) {
					emitcode ("lsr", "%s", aopGet (AOP (result), 1));
					emitcode ("ror", "%s", aopGet (AOP (result), 0));
				}
				break;
			case 3:
				while (shCount--) {
					emitcode ("lsr", "%s", aopGet (AOP (result), 0));
				}
				break;
			}
		}
	}
      release:
	freeAsmop (left, NULL, ic, TRUE);
	freeAsmop (right, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genRightShift - generate code for right shifting                */
/*-----------------------------------------------------------------*/
static void
genRightShift (iCode * ic)
{
	operand *right, *left, *result;
	sym_link *letype;
	int size, offset;
	int sign = 0, first = 1;
	symbol *tlbl;

	aopOp (right = IC_RIGHT (ic), ic, FALSE);

	if (AOP_TYPE (right) == AOP_LIT) {
		genShiftRightLit (ic);
		return;
	}
	/* unknown count */
	if (AOP_SIZE (right) > 1) {
		if (isRegPair (AOP (right))) {
			emitcode ("movw", "r24,%s", aopGet (AOP (right), 0));
		}
		else {
			emitcode ("mov", "r24,%s", aopGet (AOP (right), 0));
			emitcode ("mov", "r25,%s", aopGet (AOP (right), 1));
		}
	}
	else {
		emitcode ("mov", "r24,%s", aopGet (AOP (right), 0));
	}
	aopOp (left = IC_LEFT (ic), ic, FALSE);
	aopOp (result = IC_RESULT (ic), ic, FALSE);
	size = AOP_SIZE (result);
	tlbl = newiTempLabel (NULL);
	emitcode ("", "L%05d:", tlbl->key);
	offset = size - 1;
	letype = getSpec (operandType (left));
	sign = !SPEC_USIGN (letype);
	if (!sameRegs (AOP (left), AOP (result))) {
		while (size--) {
			aopPut (AOP (result), aopGet (AOP (left), offset), offset);
			offset++;
		}
		size = AOP_SIZE (result);
	}
	size = AOP_SIZE (result);
	while (size--) {
		if (first) {
			if (sign)
				emitcode ("asr", "%s", aopGet (AOP (result), offset));
			else
				emitcode ("lsr", "%s", aopGet (AOP (result), offset));
			first = 0;
		}
		else
			emitcode ("ror", "%s", aopGet (AOP (result), offset));
		offset--;
	}
	if (AOP_SIZE (right) > 1)
		emitcode ("sbiw", "r24,1");
	else
		emitcode ("dec", "r24");
	emitcode ("brne", "L%05d", tlbl->key);

	freeAsmop (left, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* RRsh - shift right rn by known count                            */
/*-----------------------------------------------------------------*/
static void
RRsh (int shCount,int reg)
{
	shCount &= 0x0007;	// shCount : 0..7

	switch (shCount) {
	case 0:
		break;
	case 1:
		emitcode ("lsr", "r%d",reg);
		break;
	case 2:
		emitcode ("lsr", "r%d",reg);
		emitcode ("lsr", "r%d",reg);
		break;
	case 3:
		emitcode ("swap", "r%d",reg);
		emitcode ("lsl", "r%d",reg);
		break;
	case 4:
		emitcode ("swap", "r%d",reg);
		break;
	case 5:
		emitcode ("swap", "r%d",reg);
		emitcode ("lsr", "r%d",reg);
		break;
	case 6:
		emitcode ("swap","r%d",reg);
		emitcode ("lsr", "r%d",reg);
		emitcode ("lsr", "r%d",reg);
		break;
	case 7:
		emitcode ("swap","r%d",reg);
		emitcode ("lsr", "r%d",reg);
		emitcode ("lsr", "r%d",reg);
		emitcode ("lsr", "r%d",reg);
		break;
	}
}

/*-----------------------------------------------------------------*/
/* RLsh - shift left rn by known count                             */
/*-----------------------------------------------------------------*/
static void
RLsh (int shCount, int reg)
{
	shCount &= 0x0007;	// shCount : 0..7

	switch (shCount) {
	case 0:
		break;
	case 1:
		emitcode ("lsl", "r%d",reg);
		break;
	case 2:
		emitcode ("lsl", "r%d",reg);
		emitcode ("lsl", "r%d",reg);
		break;
	case 3:
		emitcode ("swap","r%d",reg);
		emitcode ("lsr", "r%d",reg);
		break;
	case 4:
		emitcode ("swap", "r%d",reg);
		break;
	case 5:
		emitcode ("swap","r%d",reg);
		emitcode ("lsl", "r%d",reg);
		break;
	case 6:
		emitcode ("swap","r%d",reg);
		emitcode ("lsl", "r%d",reg);
		emitcode ("lsl", "r%d",reg);
		break;
	case 7:
		emitcode ("swap","r%d",reg);
		emitcode ("lsl", "r%d",reg);
		emitcode ("lsl", "r%d",reg);
		emitcode ("lsl", "r%d",reg);
		break;
	}
}

/*-----------------------------------------------------------------*/
/* genUnpackBits - generates code for unpacking bits               */
/*-----------------------------------------------------------------*/
static void
genUnpackBits (operand * result, char *rname, int ptype)
{
	int shCnt;
	int rlen = 0;
	sym_link *etype;
	int offset = 0;
	int rsize;

	etype = getSpec (operandType (result));
	rsize = getSize (operandType (result));
	/* read the first byte  */
	switch (ptype) {

	case POINTER:
	case IPOINTER:
	case PPOINTER:
	case FPOINTER:
		emitcode ("ld", "r24,%s+", rname);
		break;

	case CPOINTER:
		emitcode ("lpm", "r24,%s+", rname);
		break;

	case GPOINTER:
		emitcode ("call","__gptrget_pi");
		emitcode ("mov","r24,r0");
		break;
	}

	rlen = SPEC_BLEN (etype);

	/* if we have bitdisplacement then it fits   */
	/* into this byte completely or if length is */
	/* less than a byte                          */
	if ((shCnt = SPEC_BSTR (etype)) || (SPEC_BLEN (etype) <= 8)) {

		/* shift right acc */
		RRsh (shCnt,24);

		emitcode ("andi", "r24,lo(0x%x)",
			  ((unsigned char) -1) >> (8 - SPEC_BLEN (etype)));
		aopPut (AOP (result), "r24", offset++);
		goto finish;
	}

	/* bit field did not fit in a byte  */
	aopPut (AOP (result), "r24", offset++);

	while (1) {

		switch (ptype) {

		case POINTER:
		case IPOINTER:
		case PPOINTER:
		case FPOINTER:
			emitcode ("ld", "r24,%s+");
			break;

		case CPOINTER:
			emitcode ("lpm", "r24,%s+");
			break;

		case GPOINTER:
			emitcode ("call", "__gptrget_pi");
			break;
		}

		rlen -= 8;
		/* if we are done */
		if (rlen < 8)
			break;

		aopPut (AOP (result), "r24", offset++);

  	}

	if (rlen) {
		aopPut (AOP (result), "r24", offset++);
	}

      finish:
	if (offset < rsize) {
		rsize -= offset;
		while (rsize--)
			aopPut (AOP (result), zero, offset++);
	}
	return;
}

/*-----------------------------------------------------------------*/
/* genDataPointerGet - generates code when ptr offset is known     */
/*-----------------------------------------------------------------*/
static void
genDataPointerGet (operand * left, operand * result, iCode * ic)
{
	char *l;
	char buffer[256];
	int size, offset = 0;
	aopOp (result, ic, TRUE);

	/* get the string representation of the name */
	l = aopGet (AOP (left), 0);
	size = AOP_SIZE (result);
	while (size--) {
		if (offset)
			sprintf (buffer, "(%s + %d)", l, offset);
		else
			sprintf (buffer, "%s", l);
		emitcode ("lds", "%s,%s", aopGet (AOP (result), offset++),
			  buffer);
	}

	freeAsmop (left, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genNearPointerGet - emitcode for near pointer fetch             */
/*-----------------------------------------------------------------*/
static void
genMemPointerGet (operand * left, operand * result, iCode * ic, iCode *pi)
{
	asmop *aop = NULL;
	regs *preg = NULL;
	int gotFreePtr = 0;
	char *rname, *frname = NULL;
	sym_link *rtype, *retype;
	sym_link *ltype = operandType (left);

	rtype = operandType (result);
	retype = getSpec (rtype);

	aopOp (left, ic, FALSE);

	/* if left is rematerialisable and
	   result is not bit variable type and
	   the left is pointer to data space i.e
	   lower 128 bytes of space */
	if (AOP_TYPE (left) == AOP_IMMD &&
	    !IS_BITVAR (retype) && DCL_TYPE (ltype) == POINTER) {
		genDataPointerGet (left, result, ic);
		return;
	}

	/* if the value is already in a pointer register
	   then don't need anything more */
	if (!AOP_INPREG (AOP (left))) {
		/* otherwise get a free pointer register */
		aop = newAsmop (0);
		preg = getFreePtr (ic, &aop, FALSE, 0);
		if (isRegPair (AOP (left) )) {
			emitcode ("movw", "%s,%s",
				  aop->aopu.aop_ptr->name,
				  aopGet(AOP(left),0));
		} else {
			emitcode ("mov", "%s,%s", aop->aopu.aop_ptr->name, 
				  aopGet (AOP (left), 0));
			emitcode ("mov", "%s,%s", aop->aop_ptr2->name,
				  aopGet (AOP (left), 1));
		}
		gotFreePtr = 1;
	}
	else {
		aop = AOP(left);
		frname = aopGet(aop,0);
	}
	if (AOP_ISX(aop)) {
		rname = "X";
	} else if (AOP_ISZ(aop)) {
		rname = "Z";
	} else {
		werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
			"pointer not in correct register");
		exit (0);
	}

	aopOp (result, ic, FALSE);

	/* if bitfield then unpack the bits */
	if (IS_BITVAR (retype))
		genUnpackBits (result, rname, POINTER);
	else {
		/* we have can just get the values */
		int size = AOP_SIZE (result);
		int offset = 0;

		while (size--) {
			if (size || pi) {
				emitcode ("ld","%s,%s+",aopGet(AOP(result),offset), rname);
			} else {
				emitcode ("ld","%s,%s",aopGet(AOP(result),offset), rname);
			}
		}
	}

	/* now some housekeeping stuff */
	if (gotFreePtr) {
		/* we had to allocate for this iCode */
		if (pi) {
			if (isRegPair (AOP (left) )) {
				emitcode ("movw", "%s,%s",
					  aopGet (AOP(left),0),
					  aop->aopu.aop_ptr->name);
			} else {
				emitcode ("mov", "%s,%s", 
					  aopGet (AOP (left), 0),
					  aop->aopu.aop_ptr->name);
				emitcode ("mov", "%s,%s", 
					  aopGet (AOP (left), 1),
					  aop->aop_ptr2->name);
			}
		}
		freeAsmop (NULL, aop, ic, TRUE);
	} else {

		/* we did not allocate which means left
		   already in a pointer register, then
		   if size > 0 && this could be used again
		   we have to point it back to where it
		   belongs */
		if ((AOP_SIZE (result) > 1 &&
		     !OP_SYMBOL (left)->remat &&
		     (OP_SYMBOL (left)->liveTo > ic->seq || ic->depth)) && !pi) {
			int size = AOP_SIZE (result) - 1;
			emitcode ("sbiw", "%s,%d",frname,size);
		}
	}

	/* done */
	if (pi) pi->generated = 1;
	freeAsmop (left, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);

}

/*-----------------------------------------------------------------*/
/* genCodePointerGet - gget value from code space                  */
/*-----------------------------------------------------------------*/
static void
genCodePointerGet (operand * left, operand * result, iCode * ic, iCode *pi)
{
	int size, offset;
	sym_link *retype = getSpec (operandType (result));	
	asmop *aop = NULL;
	int gotFreePtr = 0;

	aopOp (left, ic, FALSE);

	/* if the operand is already in Z register
	   then we do nothing else we move the value to Z register */
	if (AOP_ISZ(AOP(left))) {
		aop = AOP (left);
	} else {
		aop = newAsmop(0);
		getFreePtr(ic,&aop,FALSE,TRUE);
		if (isRegPair(AOP (left))) {
			emitcode ("movw","r30,%s",aopGet (AOP (left), 0));
		} else {			
			emitcode ("mov", "r30,%s", aopGet (AOP (left), 0));
			emitcode ("mov", "r31,%s", aopGet (AOP (left), 1));
		}
		gotFreePtr = 1;
	} 

	aopOp (result, ic, FALSE);

	/* if bit then unpack */
	if (IS_BITVAR (retype))
		genUnpackBits (result, "Z", CPOINTER);
	else {
		size = AOP_SIZE (result);
		offset = 0;

		while (size--) {
			if (size || pi) {
				emitcode ("lpm","%s,Z+",aopGet(AOP(result),offset++));
			} else {
				emitcode ("lpm","%s,Z",aopGet(AOP(result),offset++));
			}
		}
	}

	/* now some housekeeping stuff */
	if (gotFreePtr) {
		/* we had to allocate for this iCode */
		if (pi) {
			if (isRegPair(AOP (left))) {
				emitcode ("movw","%s,r30",aopGet (AOP (left), 0));
			} else {			
				emitcode ("mov", "%s,r30", aopGet (AOP (left), 0));
				emitcode ("mov", "%s,r31", aopGet (AOP (left), 1));
			}
		}
		freeAsmop (NULL, aop, ic, TRUE);
	} else {

		/* we did not allocate which means left
		   already in a pointer register, then
		   if size > 0 && this could be used again
		   we have to point it back to where it
		   belongs */
		if ((AOP_SIZE (result) > 1 &&
		     !OP_SYMBOL (left)->remat &&
		     (OP_SYMBOL (left)->liveTo > ic->seq || ic->depth)) &&
		    !pi) {
			int size = AOP_SIZE (result) - 1;
			emitcode ("sbiw", "r30,%d",size);
		}
	}

	/* done */
	if (pi) pi->generated=1;
	freeAsmop (left, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);

}

/*-----------------------------------------------------------------*/
/* genGenPointerGet - gget value from generic pointer space        */
/*-----------------------------------------------------------------*/
static void
genGenPointerGet (operand * left, operand * result, iCode * ic, iCode *pi)
{
	int size, offset;
	int gotFreePtr = 0;
	sym_link *retype = getSpec (operandType (result));
	asmop *aop = NULL;

	aopOp (left, ic, FALSE);

	/* if the operand is already in dptr
	   then we do nothing else we move the value to dptr */
	if (AOP_ISZ(AOP(left))) {
		aop = AOP(left);
	} else {
		aop = newAsmop(0);
		getFreePtr(ic,&aop,FALSE,TRUE);
		if (isRegPair(AOP(left))) {
			emitcode ("movw", "r30,%s", aopGet (AOP (left), 0));
		} else {
			emitcode ("mov", "r30,%s", aopGet (AOP (left), 0));
			emitcode ("mov", "r31,%s", aopGet (AOP (left), 1));
		}
		emitcode ("mov", "r24,%s", aopGet (AOP (left), 2));
		gotFreePtr=1;
	}

	/* so Z register now contains the address */

	aopOp (result, ic, FALSE);

	/* if bit then unpack */
	if (IS_BITVAR (retype))
		genUnpackBits (result, "Z", GPOINTER);
	else {
		size = AOP_SIZE (result);
		offset = 0;

		while (size--) {
			if (size || pi) 
				emitcode ("call", "__gptrget_pi");
			else
				emitcode ("call", "__gptrget");
			aopPut (AOP (result), "r0", offset++);
		}
	}


	/* now some housekeeping stuff */
	if (gotFreePtr) {
		/* we had to allocate for this iCode */
		if (pi) {
			if (isRegPair(AOP (left))) {
				emitcode ("movw","%s,r30",aopGet (AOP (left), 0));
			} else {			
				emitcode ("mov", "%s,r30", aopGet (AOP (left), 0));
				emitcode ("mov", "%s,r31", aopGet (AOP (left), 1));
			}
		}
		freeAsmop (NULL, aop, ic, TRUE);
	} else {

		/* we did not allocate which means left
		   already in a pointer register, then
		   if size > 0 && this could be used again
		   we have to point it back to where it
		   belongs */
		if ((AOP_SIZE (result) > 1 &&
		     !OP_SYMBOL (left)->remat &&
		     (OP_SYMBOL (left)->liveTo > ic->seq || ic->depth)) &&
		    !pi) {
			int size = AOP_SIZE (result) - 1;
			emitcode ("sbiw", "r30,%d",size);
		}
	}
	if (pi) pi->generated=1;
	freeAsmop (left, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genPointerGet - generate code for pointer get                   */
/*-----------------------------------------------------------------*/
static void
genPointerGet (iCode * ic, iCode *pi)
{
	operand *left, *result;
	sym_link *type, *etype;
	int p_type;

	left = IC_LEFT (ic);
	result = IC_RESULT (ic);

	/* depending on the type of pointer we need to
	   move it to the correct pointer register */
	type = operandType (left);
	etype = getSpec (type);
	/* if left is of type of pointer then it is simple */
	if (IS_PTR (type) && !IS_FUNC (type->next))
		p_type = DCL_TYPE (type);
	else {
		/* we have to go by the storage class */
		p_type = PTR_TYPE (SPEC_OCLS (etype));


	}

	/* now that we have the pointer type we assign
	   the pointer values */
	switch (p_type) {

	case POINTER:
	case IPOINTER:
	case PPOINTER:
	case FPOINTER:
		genMemPointerGet (left, result, ic, pi);
		break;

	case CPOINTER:
		genCodePointerGet (left, result, ic, pi);
		break;

	case GPOINTER:
		genGenPointerGet (left, result, ic, pi);
		break;
	}

}

/*-----------------------------------------------------------------*/
/* genPackBits - generates code for packed bit storage             */
/*-----------------------------------------------------------------*/
static void
genPackBits (sym_link * etype,
	     operand * right,
	     char *rname, int p_type)
{
	int shCount = 0;
	int offset = 0;
	int rLen = 0;
	int blen, bstr;
	char *l;

	blen = SPEC_BLEN (etype);
	bstr = SPEC_BSTR (etype);

	l = aopGet (AOP (right), offset++);
	MOVR24 (l);

	/* if the bit lenth is less than or    */
	/* it exactly fits a byte then         */
	if (SPEC_BLEN (etype) <= 8) {
		shCount = SPEC_BSTR (etype);

		/* shift left acc */
		RLsh (shCount,24);

		if (SPEC_BLEN (etype) < 8) {			/* if smaller than a byte */

			switch (p_type) {
			case POINTER:
			case IPOINTER:
			case PPOINTER:
			case FPOINTER:
				emitcode ("ld", "r1,%s",rname);
				break;

			case GPOINTER:
				emitcode ("push", "r1");
				emitcode ("push", "r24");
				emitcode ("call", "__gptrget");
				emitcode ("pop", "r1");
				emitcode ("mov","r24,r0");
				break;
			}

			emitcode ("andi", "r24,#0x%02x", (unsigned char)
				  ((unsigned char) (0xFF << (blen + bstr)) |
				   (unsigned char) (0xFF >> (8 - bstr))));
			emitcode ("or", "r24,r1");
			if (p_type == GPOINTER)
				emitcode ("pop", "r1");
		}
	}

	switch (p_type) {
	case POINTER:
	case IPOINTER:
	case PPOINTER:
	case FPOINTER:
		emitcode("st","%s+,r24");
		break;

	case GPOINTER:
		emitcode("mov","r0,r24");
		emitcode ("call", "__gptrput_pi");
		break;
	}

	/* if we r done */
	if (SPEC_BLEN (etype) <= 8)
		return;

	rLen = SPEC_BLEN (etype);

	/* now generate for lengths greater than one byte */
	while (1) {

		l = aopGet (AOP (right), offset++);

		rLen -= 8;
		if (rLen < 8)
			break;

		switch (p_type) {
		case POINTER:
		case IPOINTER:
		case PPOINTER:
		case FPOINTER:
			emitcode ("st", "%s+,%s",rname,l);
			break;

		case GPOINTER:
			MOVR0 (l);
			emitcode ("lcall", "__gptrput_pi");
			break;
		}
	}

	MOVR24 (l);

	/* last last was not complete */
	if (rLen) {
		/* save the byte & read byte */
		switch (p_type) {
		case POINTER:
		case IPOINTER:
		case PPOINTER:
		case FPOINTER:
			emitcode ("st","%s+,r24",rname);
			break;
		case GPOINTER:
			emitcode ("push", "r1");
			emitcode ("push", "r24");
			emitcode ("lcall", "__gptrget");
			emitcode ("mov","r24,r0");
			emitcode ("pop", "r1");
			break;
		}

		emitcode ("andi", "r24,0x%02x", (((unsigned char) -1 << rLen) & 0xff));
		emitcode ("or", "r24,r1");
	}

	if (p_type == GPOINTER)
		emitcode ("pop", "r1");

	switch (p_type) {

	case POINTER:
	case IPOINTER:
	case PPOINTER:
	case FPOINTER:
		emitcode ("st", "%s,r24", rname);
		break;

	case GPOINTER:
		emitcode ("mov","r0,r24");
		emitcode ("call", "__gptrput");
		break;
	}
}

/*-----------------------------------------------------------------*/
/* genDataPointerSet - remat pointer to data space                 */
/*-----------------------------------------------------------------*/
static void
genDataPointerSet (operand * right, operand * result, iCode * ic)
{
	int size, offset = 0;
	char *l, buffer[256];

	aopOp (right, ic, FALSE);

	l = aopGet (AOP (result), 0);
	size = AOP_SIZE (right);
	while (size--) {
		if (offset)
			sprintf (buffer, "(%s + %d)", l, offset);
		else
			sprintf (buffer, "%s", l);
		emitcode ("sts", "%s,%s", buffer,
			  aopGet (AOP (right), offset++));
	}

	freeAsmop (right, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genNearPointerSet - emitcode for near pointer put               */
/*-----------------------------------------------------------------*/
static void
genMemPointerSet (operand * right, operand * result, iCode * ic, iCode *pi)
{
	asmop *aop = NULL;
	char *frname = NULL, *rname, *l;
	int gotFreePtr = 0;
	sym_link *retype;
	sym_link *ptype = operandType (result);
	
	retype = getSpec (operandType (right));
	
	aopOp (result, ic, FALSE);
	
	/* if the result is rematerializable &
	   in data space & not a bit variable */
	if (AOP_TYPE (result) == AOP_IMMD &&
	    DCL_TYPE (ptype) == POINTER && !IS_BITVAR (retype)) {
		genDataPointerSet (right, result, ic);
		return;
	}
	if (!AOP_INPREG(AOP(result))) {
		/* otherwise get a free pointer register */
		aop = newAsmop (0);
		getFreePtr (ic, &aop, FALSE, 0);
		if (isRegPair (AOP (result) )) {
			emitcode ("movw", "%s,%s",aop->aopu.aop_ptr->name,
				  aopGet(AOP (result), 0));
		} else {
			emitcode ("mov", "%s,%s", aop->aopu.aop_ptr->name, 
				  aopGet (AOP (result), 0));
			emitcode ("mov", "%s,%s", aop->aop_ptr2->name,
				  aopGet (AOP (result), 1));
		}
		gotFreePtr = 1;		
	} else {
		aop = AOP(result);
		frname = aopGet(aop,0);
	}
	
	aopOp (right, ic, FALSE);
	if (AOP_ISX(aop)) {
		rname = "X";
	} else if (AOP_ISZ(aop)) {
		rname = "Z";
	} else {
		werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
			"pointer not in correct register");
		exit (0);
	}
	/* if bitfield then unpack the bits */
	if (IS_BITVAR (retype))
		genPackBits (retype, right, rname, POINTER);
	else {
		/* we have can just get the values */
		int size = AOP_SIZE (right);
		int offset = 0;

		while (size--) {
			l = aopGet (AOP (right), offset);
			if (size || pi)
				emitcode ("st", "%s+,%s", rname,l);
			else
				emitcode ("st", "%s,%s", rname,l);				
			offset++;
		}
	}
	
	/* now some housekeeping stuff */
	if (gotFreePtr) {
		/* we had to allocate for this iCode */
		if (pi) {
			if (isRegPair (AOP (result) )) {
				emitcode ("movw", "%s,%s",
					  aopGet(AOP(result),0),
					  aop->aopu.aop_ptr->name);
			} else {
				emitcode ("mov", "%s,%s", aop->aopu.aop_ptr->name, 
					  aopGet (AOP (result), 0));
				emitcode ("mov", "%s,%s", aop->aop_ptr2->name,
					  aopGet (AOP (result), 1));
			}
		}
		freeAsmop (NULL, aop, ic, TRUE);
	} else {

		/* we did not allocate which means left
		   already in a pointer register, then
		   if size > 0 && this could be used again
		   we have to point it back to where it
		   belongs */
		if ((AOP_SIZE (right) > 1 &&
		     !OP_SYMBOL (result)->remat &&
		     (OP_SYMBOL (right)->liveTo > ic->seq || ic->depth)) && !pi) {
			int size = AOP_SIZE (right) - 1;
			emitcode ("sbiw", "%s,%d",frname,size);
		}
	}

	/* done */
	if (pi) pi->generated = 1;
	freeAsmop (result, NULL, ic, TRUE);
	freeAsmop (right, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genGenPointerSet - set value from generic pointer space         */
/*-----------------------------------------------------------------*/
static void
genGenPointerSet (operand * right, operand * result, iCode * ic, iCode *pi)
{
	int size, offset;
	int gotFreePtr = 0;
	sym_link *retype = getSpec (operandType (right));
	asmop *aop = NULL;       
	
	aopOp (result, ic, FALSE);
	
	/* if the operand is already in dptr
	   then we do nothing else we move the value to dptr */
	if (AOP_ISZ(AOP(result))) {
		aop = AOP(right);
	} else {
		aop = newAsmop(0);
		getFreePtr(ic,&aop,FALSE,TRUE);
		if (isRegPair(AOP(result))) {
			emitcode ("movw", "r30,%s", aopGet (AOP (result), 0));
		} else {
			emitcode ("mov", "r30,%s", aopGet (AOP (result), 0));
			emitcode ("mov", "r31,%s", aopGet (AOP (result), 1));
		}
		emitcode ("mov", "r24,%s",  aopGet (AOP (result), 2));
		gotFreePtr=1;
	}
	
	/* so Z register now contains the address */
	aopOp (right, ic, FALSE);
	
	/* if bit then unpack */
	if (IS_BITVAR (retype))
		genUnpackBits (result, "Z", GPOINTER);
	else {
		size = AOP_SIZE (right);
		offset = 0;
		
		while (size--) {
			char *l = aopGet(AOP (right), offset++);
			MOVR0(l);
			
			if (size || pi) 
				emitcode ("call", "__gptrput_pi");
			else
				emitcode ("call", "__gptrput");
		}
	}

	/* now some housekeeping stuff */
	if (gotFreePtr) {
		/* we had to allocate for this iCode */
		if (pi) {
			if (isRegPair(AOP(result))) {
				emitcode ("movw", "%s,r30", aopGet (AOP (result), 0));
			} else {
				emitcode ("mov", "%s,r30", aopGet (AOP (result), 0));
				emitcode ("mov", "%s,r31", aopGet (AOP (result), 1));
			}
		}
		freeAsmop (NULL, aop, ic, TRUE);
	} else {

		/* we did not allocate which means left
		   already in a pointer register, then
		   if size > 0 && this could be used again
		   we have to point it back to where it
		   belongs */
		if ((AOP_SIZE (right) > 1 &&
		     !OP_SYMBOL (result)->remat &&
		     (OP_SYMBOL (result)->liveTo > ic->seq || ic->depth)) && !pi) {
			int size = AOP_SIZE (right) - 1;
			emitcode ("sbiw", "r30,%d",size);
		}
	}
	if (pi) pi->generated = 1;
	freeAsmop (right, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genPointerSet - stores the value into a pointer location        */
/*-----------------------------------------------------------------*/
static void
genPointerSet (iCode * ic, iCode *pi)
{
	operand *right, *result;
	sym_link *type, *etype;
	int p_type;

	right = IC_RIGHT (ic);
	result = IC_RESULT (ic);

	/* depending on the type of pointer we need to
	   move it to the correct pointer register */
	type = operandType (result);
	etype = getSpec (type);
	/* if left is of type of pointer then it is simple */
	if (IS_PTR (type) && !IS_FUNC (type->next)) {
		p_type = DCL_TYPE (type);
	}
	else {
		/* we have to go by the storage class */
		p_type = PTR_TYPE (SPEC_OCLS (etype));

	}

	/* now that we have the pointer type we assign
	   the pointer values */
	switch (p_type) {

	case POINTER:
	case IPOINTER:
	case PPOINTER:
	case FPOINTER:
		genMemPointerSet (right, result, ic, pi);
		break;

	case GPOINTER:
		genGenPointerSet (right, result, ic, pi);
		break;
	}

}

/*-----------------------------------------------------------------*/
/* genIfx - generate code for Ifx statement                        */
/*-----------------------------------------------------------------*/
static void
genIfx (iCode * ic, iCode * popIc)
{
	operand *cond = IC_COND (ic);
	char *cname ;
	symbol *lbl;
	int tob = 0;

	aopOp (cond, ic, FALSE);

	/* get the value into acc */	
	if (AOP_SIZE(cond) == 1 && AOP_ISHIGHREG(AOP(cond),0)) {
		cname = aopGet(AOP(cond),0);
	} else {
		toBoolean (cond, "r24", 0);
		tob = 1;
		cname = "r24";
	}
	/* the result is now in the accumulator */
	freeAsmop (cond, NULL, ic, TRUE);

	/* if there was something to be popped then do it */
	if (popIc) {
		genIpop (popIc);
		emitcode("cpi","%s,0",cname);
	} else if (!tob) emitcode("cpi","%s,0",cname);

	lbl = newiTempLabel(NULL);
	if (IC_TRUE(ic)) {
		if (tob)
			emitcode ("breq","L%05d",lbl->key);
		else
			emitcode ("brne","L%05d",lbl->key);
		emitcode ("jmp","L%05d",IC_TRUE(ic)->key);
		emitcode ("","L%05d:",lbl->key);
	} else {
		if (tob)
			emitcode ("brne","L%05d",lbl->key);
		else
			emitcode ("breq","L%05d",lbl->key);
		emitcode ("jmp","L%05d",IC_FALSE(ic)->key);
		emitcode ("","L%05d:",lbl->key);
	}
	ic->generated = 1;
}
/* here */
/*-----------------------------------------------------------------*/
/* genAddrOf - generates code for address of                       */
/*-----------------------------------------------------------------*/
static void
genAddrOf (iCode * ic)
{
	symbol *sym = OP_SYMBOL (IC_LEFT (ic));
	int size, offset;

	aopOp (IC_RESULT (ic), ic, FALSE);
	assert(AOP_SIZE(IC_RESULT(ic)) >= 2);
	/* if the operand is on the stack then we
	   need to get the stack offset of this
	   variable */
	if (sym->onStack) {
		/* if it has an offset then we need to compute it */
		if (sym->stack) {
#if 0
			if (AOP_ISHIGHREG(AOP(
				  ((char) sym->stack & 0xff));
#endif
			aopPut (AOP (IC_RESULT (ic)), "a", 0);
		}
		else {
			/* we can just move _bp */
			aopPut (AOP (IC_RESULT (ic)), "_bp", 0);
		}
		/* fill the result with zero */
		size = AOP_SIZE (IC_RESULT (ic)) - 2;
		offset = 2;
		while (size--) {
			aopPut (AOP (IC_RESULT (ic)), zero, offset++);
		}

		goto release;
	}

	/* object not on stack then we need the name */
	size = AOP_SIZE (IC_RESULT (ic));
	offset = 0;

	while (size--) {
		char s[SDCC_NAME_MAX];
		if (offset)
			sprintf (s, "(%s >> %d)", sym->rname, offset * 8);
		else
			sprintf (s, "%s", sym->rname);
		aopPut (AOP (IC_RESULT (ic)), s, offset++);
	}

      release:
	freeAsmop (IC_RESULT (ic), NULL, ic, TRUE);

}

/*-----------------------------------------------------------------*/
/* genFarFarAssign - assignment when both are in far space         */
/*-----------------------------------------------------------------*/
static void
genFarFarAssign (operand * result, operand * right, iCode * ic)
{
	int size = AOP_SIZE (right);
	int offset = 0;
	char *l;
	/* first push the right side on to the stack */
	while (size--) {
		l = aopGet (AOP (right), offset++);
		MOVA (l);
		emitcode ("push", "acc");
	}

	freeAsmop (right, NULL, ic, FALSE);
	/* now assign DPTR to result */
	aopOp (result, ic, FALSE);
	size = AOP_SIZE (result);
	while (size--) {
		emitcode ("pop", "acc");
		aopPut (AOP (result), "a", --offset);
	}
	freeAsmop (result, NULL, ic, FALSE);

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

	/* if they are the same */
	if (operandsEqu (IC_RESULT (ic), IC_RIGHT (ic)))
		return;

	aopOp (right, ic, FALSE);

	/* special case both in far space */
	if (AOP_TYPE (right) == AOP_DPTR &&
	    IS_TRUE_SYMOP (result) && isOperandInFarSpace (result)) {

		genFarFarAssign (result, right, ic);
		return;
	}

	aopOp (result, ic, TRUE);

	/* if they are the same registers */
	if (sameRegs (AOP (right), AOP (result)))
		goto release;

	/* if the result is a bit */
	if (AOP_TYPE (result) == AOP_CRY) {

		/* if the right size is a literal then
		   we know what the value is */
		if (AOP_TYPE (right) == AOP_LIT) {
			if (((int) operandLitValue (right)))
				aopPut (AOP (result), one, 0);
			else
				aopPut (AOP (result), zero, 0);
			goto release;
		}

		/* the right is also a bit variable */
		if (AOP_TYPE (right) == AOP_CRY) {
			emitcode ("mov", "c,%s", AOP (right)->aopu.aop_dir);
			aopPut (AOP (result), "c", 0);
			goto release;
		}

		/* we need to or */
		toBoolean (right, "", 0);
		aopPut (AOP (result), "a", 0);
		goto release;
	}

	/* bit variables done */
	/* general case */
	size = AOP_SIZE (result);
	offset = 0;
	if (AOP_TYPE (right) == AOP_LIT)
		lit =
			(unsigned long) floatFromVal (AOP (right)->aopu.
						      aop_lit);
	if ((size > 1) && (AOP_TYPE (result) != AOP_REG)
	    && (AOP_TYPE (right) == AOP_LIT)
	    && !IS_FLOAT (operandType (right)) && (lit < 256L)) {
		emitcode ("clr", "a");
		while (size--) {
			if ((unsigned int) ((lit >> (size * 8)) & 0x0FFL) ==
			    0) aopPut (AOP (result), "a", size);
			else
				aopPut (AOP (result),
					aopGet (AOP (right), size), size);
		}
	}
	else {
		while (size--) {
			aopPut (AOP (result),
				aopGet (AOP (right), offset), offset);
			offset++;
		}
	}

      release:
	freeAsmop (right, NULL, ic, FALSE);
	freeAsmop (result, NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* genJumpTab - genrates code for jump table                       */
/*-----------------------------------------------------------------*/
static void
genJumpTab (iCode * ic)
{
	symbol *jtab;
	char *l;

	aopOp (IC_JTCOND (ic), ic, FALSE);
	/* get the condition into accumulator */
	l = aopGet (AOP (IC_JTCOND (ic)), 0);
	MOVA (l);
	/* multiply by three */
	emitcode ("add", "a,acc");
	emitcode ("add", "a,%s", aopGet (AOP (IC_JTCOND (ic)), 0));
	freeAsmop (IC_JTCOND (ic), NULL, ic, TRUE);

	jtab = newiTempLabel (NULL);
	emitcode ("mov", "dptr,#%05d$", jtab->key + 100);
	emitcode ("jmp", "@a+dptr");
	emitcode ("", "%05d$:", jtab->key + 100);
	/* now generate the jump labels */
	for (jtab = setFirstItem (IC_JTLABELS (ic)); jtab;
	     jtab = setNextItem (IC_JTLABELS (ic)))
		emitcode ("ljmp", "%05d$", jtab->key + 100);

}

/*-----------------------------------------------------------------*/
/* genCast - gen code for casting                                  */
/*-----------------------------------------------------------------*/
static void
genCast (iCode * ic)
{
	operand *result = IC_RESULT (ic);
	sym_link *ctype = operandType (IC_LEFT (ic));
	sym_link *rtype = operandType (IC_RIGHT (ic));
	operand *right = IC_RIGHT (ic);
	int size, offset;

	/* if they are equivalent then do nothing */
	if (operandsEqu (IC_RESULT (ic), IC_RIGHT (ic)))
		return;

	aopOp (right, ic, FALSE);
	aopOp (result, ic, FALSE);

	/* if the result is a bit */
	if (AOP_TYPE (result) == AOP_CRY) {
		/* if the right size is a literal then
		   we know what the value is */
		if (AOP_TYPE (right) == AOP_LIT) {
			if (((int) operandLitValue (right)))
				aopPut (AOP (result), one, 0);
			else
				aopPut (AOP (result), zero, 0);

			goto release;
		}

		/* the right is also a bit variable */
		if (AOP_TYPE (right) == AOP_CRY) {
			emitcode ("mov", "c,%s", AOP (right)->aopu.aop_dir);
			aopPut (AOP (result), "c", 0);
			goto release;
		}

		/* we need to or */
		toBoolean (right, "", 0);
		aopPut (AOP (result), "a", 0);
		goto release;
	}

	/* if they are the same size : or less */
	if (AOP_SIZE (result) <= AOP_SIZE (right)) {

		/* if they are in the same place */
		if (sameRegs (AOP (right), AOP (result)))
			goto release;

		/* if they in different places then copy */
		size = AOP_SIZE (result);
		offset = 0;
		while (size--) {
			aopPut (AOP (result),
				aopGet (AOP (right), offset), offset);
			offset++;
		}
		goto release;
	}


	/* if the result is of type pointer */
	if (IS_PTR (ctype)) {

		int p_type;
		sym_link *type = operandType (right);
		sym_link *etype = getSpec (type);

		/* pointer to generic pointer */
		if (IS_GENPTR (ctype)) {
			char *l = zero;

			if (IS_PTR (type))
				p_type = DCL_TYPE (type);
			else {
				/* we have to go by the storage class */
				p_type = PTR_TYPE (SPEC_OCLS (etype));
			}

			/* the first two bytes are known */
			size = GPTRSIZE - 1;
			offset = 0;
			while (size--) {
				aopPut (AOP (result),
					aopGet (AOP (right), offset), offset);
				offset++;
			}
			/* the last byte depending on type */
			switch (p_type) {
			case IPOINTER:
			case POINTER:
				l = zero;
				break;
			case FPOINTER:
				l = one;
				break;
			case CPOINTER:
				l = "0x02";
				break;
			case PPOINTER:
				l = "0x03";
				break;

			default:
				/* this should never happen */
				werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
					"got unknown pointer type");
				exit (1);
			}
			aopPut (AOP (result), l, GPTRSIZE - 1);
			goto release;
		}

		/* just copy the pointers */
		size = AOP_SIZE (result);
		offset = 0;
		while (size--) {
			aopPut (AOP (result),
				aopGet (AOP (right), offset), offset);
			offset++;
		}
		goto release;
	}

	/* so we now know that the size of destination is greater
	   than the size of the source */
	/* we move to result for the size of source */
	size = AOP_SIZE (right);
	offset = 0;
	while (size--) {
		aopPut (AOP (result), aopGet (AOP (right), offset), offset);
		offset++;
	}

	/* now depending on the sign of the source && destination */
	size = AOP_SIZE (result) - AOP_SIZE (right);
	/* if unsigned or not an integral type */
	if (SPEC_USIGN (rtype) || !IS_SPEC (rtype)) {
		while (size--)
			aopPut (AOP (result), zero, offset++);
	}
	else {
		/* we need to extend the sign :{ */
                // PENDING: Does nothing on avr
#if 0
		char *l = aopGet (AOP (right), AOP_SIZE (right) - 1);
		MOVA (l);
#endif
		emitcode ("rlc", "a");
		emitcode ("subb", "a,acc");
		while (size--)
			aopPut (AOP (result), "a", offset++);
	}

	/* we are done hurray !!!! */

      release:
	freeAsmop (right, NULL, ic, TRUE);
	freeAsmop (result, NULL, ic, TRUE);

}

/*-----------------------------------------------------------------*/
/* genDjnz - generate decrement & jump if not zero instrucion      */
/*-----------------------------------------------------------------*/
static int
genDjnz (iCode * ic, iCode * ifx)
{
	symbol *lbl, *lbl1;
	if (!ifx)
		return 0;

	/* if the if condition has a false label
	   then we cannot save */
	if (IC_FALSE (ifx))
		return 0;

	/* if the minus is not of the form
	   a = a - 1 */
	if (!isOperandEqual (IC_RESULT (ic), IC_LEFT (ic)) ||
	    !IS_OP_LITERAL (IC_RIGHT (ic)))
		return 0;

	if (operandLitValue (IC_RIGHT (ic)) != 1)
		return 0;

	/* if the size of this greater than one then no
	   saving */
	if (getSize (operandType (IC_RESULT (ic))) > 1)
		return 0;

	/* otherwise we can save BIG */
	lbl = newiTempLabel (NULL);
	lbl1 = newiTempLabel (NULL);

	aopOp (IC_RESULT (ic), ic, FALSE);

	if (IS_AOP_PREG (IC_RESULT (ic))) {
		emitcode ("dec", "%s", aopGet (AOP (IC_RESULT (ic)), 0));
		emitcode ("mov", "a,%s", aopGet (AOP (IC_RESULT (ic)), 0));
		emitcode ("jnz", "%05d$", lbl->key + 100);
	}
	else {
		emitcode ("djnz", "%s,%05d$",
			  aopGet (AOP (IC_RESULT (ic)), 0), lbl->key + 100);
	}
	emitcode ("sjmp", "%05d$", lbl1->key + 100);
	emitcode ("", "%05d$:", lbl->key + 100);
	emitcode ("ljmp", "%05d$", IC_TRUE (ifx)->key + 100);
	emitcode ("", "%05d$:", lbl1->key + 100);

	freeAsmop (IC_RESULT (ic), NULL, ic, TRUE);
	ifx->generated = 1;
	return 1;
}

static char *recvregs[8] = {
	"r16", "r17", "r18", "r19", "r20", "r21", "r22", "r23"
};

static int recvCnt = 0;

/*-----------------------------------------------------------------*/
/* genReceive - generate code for a receive iCode                  */
/*-----------------------------------------------------------------*/
static void
genReceive (iCode * ic)
{
	int size, offset = 0;
	aopOp (IC_RESULT (ic), ic, FALSE);
	size = AOP_SIZE (IC_RESULT (ic));
	while (size--) {
		aopPut (AOP (IC_RESULT (ic)), recvregs[recvCnt++], offset);
		offset++;
	}
	freeAsmop (IC_RESULT (ic), NULL, ic, TRUE);
}

/*-----------------------------------------------------------------*/
/* gen51Code - generate code for 8051 based controllers            */
/*-----------------------------------------------------------------*/
void
genAVRCode (iCode * lic)
{
	iCode *ic;
	int cln = 0;

	lineHead = lineCurr = NULL;
	recvCnt = 0;
	/* print the allocation information */
	if (allocInfo)
		printAllocInfo (currFunc, codeOutFile);
	/* if debug information required */
	/*     if (options.debug && currFunc) { */
	if (currFunc) {
		cdbSymbol (currFunc, cdbFile, FALSE, TRUE);
		_G.debugLine = 1;
/* 		emitcode ("", ".type %s,@function", currFunc->name); */
		_G.debugLine = 0;
	}
	/* stack pointer name */
	spname = "sp";


	for (ic = lic; ic; ic = ic->next) {

		if (cln != ic->lineno) {
			if (options.debug) {
				_G.debugLine = 1;
				emitcode ("", "C$%s$%d$%d$%d ==.",
					  FileBaseName (ic->filename),
					  ic->lineno, ic->level, ic->block);
				_G.debugLine = 0;
			}
			emitcode (";", "%s %d", ic->filename, ic->lineno);
			cln = ic->lineno;
		}
		/* if the result is marked as
		   spilt and rematerializable or code for
		   this has already been generated then
		   do nothing */
		if (resultRemat (ic) || ic->generated)
			continue;

		/* depending on the operation */
		switch (ic->op) {
		case '!':
			genNot (ic);
			break;

		case '~':
			genCpl (ic);
			break;

		case UNARYMINUS:
			genUminus (ic);
			break;

		case IPUSH:
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
				genIfx (ic->next, ic);
			else
				genIpop (ic);
			break;

		case CALL:
			genCall (ic);
			break;

		case PCALL:
			genPcall (ic);
			break;

		case FUNCTION:
			genFunction (ic);
			break;

		case ENDFUNCTION:
			genEndFunction (ic);
			break;

		case RETURN:
			genRet (ic);
			break;

		case LABEL:
			genLabel (ic);
			break;

		case GOTO:
			genGoto (ic);
			break;

		case '+':
			genPlus (ic);
			break;

		case '-':
			if (!genDjnz (ic, ifxForOp (IC_RESULT (ic), ic)))
				genMinus (ic);
			break;

		case '*':
			genMult (ic);
			break;

		case '/':
			genDiv (ic);
			break;

		case '%':
			genMod (ic);
			break;

		case '>':
			genCmpGt (ic, ifxForOp (IC_RESULT (ic), ic));
			break;

		case '<':
			genCmpLt (ic, ifxForOp (IC_RESULT (ic), ic));
			break;

		case LE_OP:
			genCmpLe (ic, ifxForOp (IC_RESULT (ic), ic));
			break;

		case GE_OP:
			genCmpGe (ic, ifxForOp (IC_RESULT (ic), ic));
			break;

		case NE_OP:
			genCmpNe (ic, ifxForOp (IC_RESULT (ic), ic));
			break;

		case EQ_OP:
			genCmpEq (ic, ifxForOp (IC_RESULT (ic), ic));
			break;

		case AND_OP:
			genAndOp (ic);
			break;

		case OR_OP:
			genOrOp (ic);
			break;

		case '^':
			genXor (ic, ifxForOp (IC_RESULT (ic), ic));
			break;

		case '|':
			genOr (ic, ifxForOp (IC_RESULT (ic), ic));
			break;

		case BITWISEAND:
			genAnd (ic, ifxForOp (IC_RESULT (ic), ic));
			break;

		case INLINEASM:
			genInline (ic);
			break;

		case RRC:
			genRRC (ic);
			break;

		case RLC:
			genRLC (ic);
			break;

		case GETHBIT:
			genGetHbit (ic);
			break;

		case LEFT_OP:
			genLeftShift (ic);
			break;

		case RIGHT_OP:
			genRightShift (ic);
			break;

		case GET_VALUE_AT_ADDRESS:
			genPointerGet (ic, hasInc(IC_LEFT(ic),ic));
			break;

		case '=':
			if (POINTER_SET (ic))
				genPointerSet (ic, hasInc(IC_RESULT(ic),ic));
			else
				genAssign (ic);
			break;

		case IFX:
			genIfx (ic, NULL);
			break;

		case ADDRESS_OF:
			genAddrOf (ic);
			break;

		case JUMPTABLE:
			genJumpTab (ic);
			break;

		case CAST:
			genCast (ic);
			break;

		case RECEIVE:
			genReceive (ic);
			break;

		case SEND:
			addSet (&_G.sendSet, ic);
			break;

		default:
			ic = ic;
		}
	}


	/* now we are ready to call the
	   peep hole optimizer */
	if (!options.nopeep)
		peepHole (&lineHead);

	/* now do the actual printing */
	printLine (lineHead, codeOutFile);
	return;
}

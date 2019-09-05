/*------------------------------------------------------------------------

  SDCCralloc.c - source file for register allocation. (ATMEL AVR) specific

                Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1998)

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

#include "common.h"
#include "ralloc.h"
#include "gen.h"

/*-----------------------------------------------------------------*/
/* At this point we start getting processor specific although      */
/* some routines are non-processor specific & can be reused when   */
/* targetting other processors. The decision for this will have    */
/* to be made on a routine by routine basis                        */
/* routines used to pack registers are most definitely not reusable */
/* since the pack the registers depending strictly on the MCU      */
/*-----------------------------------------------------------------*/

extern void genAVRCode (iCode *);

/* Global data */
static struct {
	bitVect *spiltSet;
	set *stackSpil;
	bitVect *regAssigned;
	short blockSpil;
	int slocNum;
	bitVect *funcrUsed;	/* registers used in a function */
	int stackExtend;
	int dataExtend;
} _G;

/* Shared with gen.c */
int avr_ptrRegReq;		/* pointer register required */

/* AVR registers */
regs regsAVR[] = {
	{REG_GPR|REG_PAIR, R0_IDX, REG_GPR|REG_PAIR, "r0", "r0", "", 0, 0, 0},	/* scratch */
	{REG_GPR, R1_IDX, REG_GPR	  , "r1", "r1", "", 0, 0, 0},		/* scratch */
	{REG_GPR|REG_PAIR, R2_IDX, REG_GPR|REG_PAIR, "r2", "r2", "", 0, 1, 1},	/* gpr */
	{REG_GPR, R3_IDX, REG_GPR	  , "r3", "r3", "", 0, 1, 1},		/* gpr */
	{REG_GPR|REG_PAIR, R4_IDX, REG_GPR|REG_PAIR, "r4", "r4", "", 0, 1, 1},	/* gpr */
	{REG_GPR, R5_IDX, REG_GPR	  , "r5", "r5", "", 0, 1, 1},		/* gpr */
	{REG_GPR|REG_PAIR, R6_IDX, REG_GPR|REG_PAIR, "r6", "r6", "", 0, 1, 1},	/* gpr */
	{REG_GPR, R7_IDX, REG_GPR	  , "r7", "r7", "", 0, 1, 1},		/* gpr */
	{REG_GPR|REG_PAIR, R8_IDX, REG_GPR|REG_PAIR, "r8", "r8", "", 0, 1, 1},	/* gpr */
	{REG_GPR, R9_IDX, REG_GPR	  , "r9", "r9", "", 0, 1, 1},		/* gpr */
	{REG_GPR|REG_PAIR, R10_IDX,REG_GPR|REG_PAIR, "r10", "r10","",0, 1, 1},	/* gpr */
	{REG_GPR, R11_IDX,REG_GPR	  , "r11", "r11","",0, 1, 1},		/* gpr */
	{REG_GPR|REG_PAIR, R12_IDX,REG_GPR|REG_PAIR, "r12", "r12","",0, 1, 1},	/* gpr */
	{REG_GPR, R13_IDX,REG_GPR	  , "r13", "r13","",0, 1, 1},		/* gpr */
	{REG_GPR|REG_PAIR, R14_IDX,REG_GPR|REG_PAIR, "r14", "r14","",0, 1, 1},	/* gpr */
	{REG_GPR, R15_IDX,REG_GPR	  , "r15", "r15","",0, 1, 1},		/* gpr */
	{REG_GPR|REG_PAIR, R16_IDX,REG_GPR|REG_PAIR, "r16", "r16","",0, 1, 0},	/* parm/gpr */
	{REG_GPR, R17_IDX,REG_GPR	  , "r17", "r17","",0, 1, 0},		/* parm/gpr */
	{REG_GPR|REG_PAIR, R18_IDX,REG_GPR|REG_PAIR, "r18", "r18","",0, 1, 0},	/* parm/gpr */
	{REG_GPR, R19_IDX,REG_GPR	  , "r19", "r19","",0, 1, 0},		/* parm/gpr */
	{REG_GPR|REG_PAIR, R20_IDX,REG_GPR|REG_PAIR, "r20", "r20","",0, 1, 0},	/* parm/gpr */
	{REG_GPR, R21_IDX,REG_GPR	  , "r21", "r21","",0, 1, 0},		/* parm/gpr */
	{REG_GPR|REG_PAIR, R22_IDX,REG_GPR|REG_PAIR, "r22", "r22","",0, 1, 0},	/* parm/gpr */
	{REG_GPR, R23_IDX,REG_GPR	  , "r23", "r23","",0, 1, 0},		/* parm/gpr */
	{REG_GPR|REG_PAIR, R24_IDX,REG_GPR|REG_PAIR, "r24", "r24","",0, 0, 0},	/* scratch  */
	{REG_GPR, R25_IDX,REG_GPR	  , "r25", "r25","",0, 0, 0},		/* scratch */
	{REG_GPR|REG_PAIR, R26_IDX,REG_GPR|REG_PAIR, "r26", "r26","",0, 1, 1},	/* used as pointer reg X */
	{REG_GPR, R27_IDX,REG_GPR	  , "r27", "r27","",0, 1, 1},		/* used as pointer reg X */
	{REG_GPR|REG_PAIR, R28_IDX,REG_GPR|REG_PAIR, "r28", "r28","",0, 1, 0},	/* stack frame Y */
	{REG_GPR, R29_IDX,REG_GPR	  , "r29", "r29","",0, 1, 0},		/* stack frame Y */
	{REG_GPR|REG_PAIR, R30_IDX,REG_GPR|REG_PAIR, "r30", "r30","",0, 1, 1},	/* used as pointer reg Z */
	{REG_GPR, R31_IDX,REG_GPR	  , "r31", "r31","",0, 1, 1},		/* used as pointer reg Z */
	{REG_PTR, X_IDX, REG_PTR, "X", "X", "", 0, 1, 0},
	{REG_PTR, Z_IDX, REG_PTR, "Z", "Z", "", 0, 1, 0},
};
int avr_nRegs = 32;
int avr_fReg = 0;		/* first allocatable register */

static void spillThis (symbol *);

#if 0
// PENDING: Unused
/*-----------------------------------------------------------------*/
/* findAssignToSym : scanning backwards looks for first assig found */
/*-----------------------------------------------------------------*/
static iCode *
findAssignToSym (operand * op, iCode * ic)
{
	iCode *dic;

	for (dic = ic->prev; dic; dic = dic->prev) {

		/* if definition by assignment */
		if (dic->op == '=' &&
		    !POINTER_SET (dic) && IC_RESULT (dic)->key == op->key
/*          &&  IS_TRUE_SYMOP(IC_RIGHT(dic)) */
			) {

			/* we are interested only if defined in far space */
			/* or in stack space in case of + & - */

			/* if assigned to a non-symbol then return
			   true */
			if (!IS_SYMOP (IC_RIGHT (dic)))
				break;

			/* if the symbol is in far space then
			   we should not */
			if (isOperandInFarSpace (IC_RIGHT (dic)))
				return NULL;

			/* for + & - operations make sure that
			   if it is on the stack it is the same
			   as one of the three operands */
			if ((ic->op == '+' || ic->op == '-') &&
			    OP_SYMBOL (IC_RIGHT (dic))->onStack) {

				if (IC_RESULT (ic)->key != IC_RIGHT (dic)->key
				    && IC_LEFT (ic)->key !=
				    IC_RIGHT (dic)->key
				    && IC_RIGHT (ic)->key !=
				    IC_RIGHT (dic)->key) return NULL;
			}

			break;

		}

		/* if we find an usage then we cannot delete it */
		if (IC_LEFT (dic) && IC_LEFT (dic)->key == op->key)
			return NULL;

		if (IC_RIGHT (dic) && IC_RIGHT (dic)->key == op->key)
			return NULL;

		if (POINTER_SET (dic) && IC_RESULT (dic)->key == op->key)
			return NULL;
	}

	/* now make sure that the right side of dic
	   is not defined between ic & dic */
	if (dic) {
		iCode *sic = dic->next;

		for (; sic != ic; sic = sic->next)
			if (IC_RESULT (sic) &&
			    IC_RESULT (sic)->key == IC_RIGHT (dic)->key)
				return NULL;
	}

	return dic;


}

/*-----------------------------------------------------------------*/
/* packForPush - hueristics to reduce iCode for pushing            */
/*-----------------------------------------------------------------*/
static void
packForPush (iCode * ic, eBBlock * ebp)
{
	iCode *dic;

	if (ic->op != IPUSH || !IS_ITEMP (IC_LEFT (ic)))
		return;

	/* must have only definition & one usage */
	if (bitVectnBitsOn (OP_DEFS (IC_LEFT (ic))) != 1 ||
	    bitVectnBitsOn (OP_USES (IC_LEFT (ic))) != 1)
		return;

	/* find the definition */
	if (!(dic = hTabItemWithKey (iCodehTab,
				     bitVectFirstBit (OP_DEFS
						      (IC_LEFT (ic))))))
			return;

	if (dic->op != '=' || POINTER_SET (dic))
		return;

	/* we now we know that it has one & only one def & use
	   and the that the definition is an assignment */
	IC_LEFT (ic) = IC_RIGHT (dic);

	remiCodeFromeBBlock (ebp, dic);
	hTabDeleteItem (&iCodehTab, dic->key, dic, DELETE_ITEM, NULL);
}

/*-----------------------------------------------------------------*/
/* packRegsForSupport :- reduce some registers for support calls   */
/*-----------------------------------------------------------------*/
static int
packRegsForSupport (iCode * ic, eBBlock * ebp)
{
	int change = 0;
	/* for the left & right operand :- look to see if the
	   left was assigned a true symbol in far space in that
	   case replace them */
	if (IS_ITEMP (IC_LEFT (ic)) &&
	    OP_SYMBOL (IC_LEFT (ic))->liveTo <= ic->seq) {
		iCode *dic = findAssignToSym (IC_LEFT (ic), ic);
		iCode *sic;

		if (!dic)
			goto right;

		/* found it we need to remove it from the
		   block */
		for (sic = dic; sic != ic; sic = sic->next)
			bitVectUnSetBit (sic->rlive, IC_LEFT (ic)->key);

		IC_LEFT (ic)->operand.symOperand =
			IC_RIGHT (dic)->operand.symOperand;
		IC_LEFT (ic)->key = IC_RIGHT (dic)->operand.symOperand->key;
		remiCodeFromeBBlock (ebp, dic);
		hTabDeleteItem (&iCodehTab, dic->key, dic, DELETE_ITEM, NULL);
		change++;
	}

	/* do the same for the right operand */
      right:
	if (!change &&
	    IS_ITEMP (IC_RIGHT (ic)) &&
	    OP_SYMBOL (IC_RIGHT (ic))->liveTo <= ic->seq) {
		iCode *dic = findAssignToSym (IC_RIGHT (ic), ic);
		iCode *sic;

		if (!dic)
			return change;

		/* if this is a subtraction & the result
		   is a true symbol in far space then don't pack */
		if (ic->op == '-' && IS_TRUE_SYMOP (IC_RESULT (dic))) {
			sym_link *etype =
				getSpec (operandType (IC_RESULT (dic)));
			if (IN_FARSPACE (SPEC_OCLS (etype)))
				return change;
		}
		/* found it we need to remove it from the
		   block */
		for (sic = dic; sic != ic; sic = sic->next)
			bitVectUnSetBit (sic->rlive, IC_RIGHT (ic)->key);

		IC_RIGHT (ic)->operand.symOperand =
			IC_RIGHT (dic)->operand.symOperand;
		IC_RIGHT (ic)->key = IC_RIGHT (dic)->operand.symOperand->key;

		remiCodeFromeBBlock (ebp, dic);
		hTabDeleteItem (&iCodehTab, dic->key, dic, DELETE_ITEM, NULL);
		change++;
	}

	return change;
}

/*-----------------------------------------------------------------*/
/* farSpacePackable - returns the packable icode for far variables */
/*-----------------------------------------------------------------*/
static iCode *
farSpacePackable (iCode * ic)
{
	iCode *dic;

	/* go thru till we find a definition for the
	   symbol on the right */
	for (dic = ic->prev; dic; dic = dic->prev) {

		/* if the definition is a call then no */
		if ((dic->op == CALL || dic->op == PCALL) &&
		    IC_RESULT (dic)->key == IC_RIGHT (ic)->key) {
			return NULL;
		}

		/* if shift by unknown amount then not */
		if ((dic->op == LEFT_OP || dic->op == RIGHT_OP) &&
		    IC_RESULT (dic)->key == IC_RIGHT (ic)->key)
			return NULL;

		/* if pointer get and size > 1 */
		if (POINTER_GET (dic) &&
		    getSize (aggrToPtr (operandType (IC_LEFT (dic)), FALSE)) >
		    1) return NULL;

		if (POINTER_SET (dic) &&
		    getSize (aggrToPtr (operandType (IC_RESULT (dic)), FALSE))
		    > 1)
			return NULL;

		/* if any three is a true symbol in far space */
		if (IC_RESULT (dic) &&
		    IS_TRUE_SYMOP (IC_RESULT (dic)) &&
		    isOperandInFarSpace (IC_RESULT (dic)))
			return NULL;

		if (IC_RIGHT (dic) &&
		    IS_TRUE_SYMOP (IC_RIGHT (dic)) &&
		    isOperandInFarSpace (IC_RIGHT (dic)) &&
		    !isOperandEqual (IC_RIGHT (dic), IC_RESULT (ic)))
			return NULL;

		if (IC_LEFT (dic) &&
		    IS_TRUE_SYMOP (IC_LEFT (dic)) &&
		    isOperandInFarSpace (IC_LEFT (dic)) &&
		    !isOperandEqual (IC_LEFT (dic), IC_RESULT (ic)))
			return NULL;

		if (isOperandEqual (IC_RIGHT (ic), IC_RESULT (dic))) {
			if ((dic->op == LEFT_OP ||
			     dic->op == RIGHT_OP ||
			     dic->op == '-') &&
			    IS_OP_LITERAL (IC_RIGHT (dic))) return NULL;
			else
				return dic;
		}
	}

	return NULL;
}

/*-----------------------------------------------------------------*/
/* rematStr - returns the rematerialized string for a remat var    */
/*-----------------------------------------------------------------*/
static char *
rematStr (symbol * sym)
{
	char *s = buffer;
	iCode *ic = sym->rematiCode;

	while (1) {

		/* if plus or minus print the right hand side */
		if (ic->op == '+' || ic->op == '-') {
			sprintf (s, "0x%04x %c ",
				 (int) operandLitValue (IC_RIGHT (ic)),
				 ic->op);
			s += strlen (s);
			ic = OP_SYMBOL (IC_LEFT (ic))->rematiCode;
			continue;
		}

		/* we reached the end */
		sprintf (s, "%s", OP_SYMBOL (IC_LEFT (ic))->rname);
		break;
	}

	return buffer;
}

/*-----------------------------------------------------------------*/
/* isSpiltOnStack - returns true if the spil location is on stack  */
/*-----------------------------------------------------------------*/
static bool
isSpiltOnStack (symbol * sym)
{
	sym_link *etype;

	if (!sym)
		return FALSE;

	if (!sym->isspilt)
		return FALSE;


	if (!sym->usl.spillLoc)
		return FALSE;

	etype = getSpec (sym->usl.spillLoc->type);
	if (IN_STACK (etype))
		return TRUE;

	return FALSE;
}

/*-----------------------------------------------------------------*/
/* spillLRWithPtrReg :- will spil those live ranges which use PTR  */
/*-----------------------------------------------------------------*/
static void
spillLRWithPtrReg (symbol * forSym)
{
	symbol *lrsym;
	regs *X, *Z, *X1, *Z1;
	int k;

	if (!_G.regAssigned || bitVectIsZero (_G.regAssigned))
		return;

	X = avr_regWithIdx (R26_IDX);
	X1= avr_regWithIdx (R27_IDX);
	Z = avr_regWithIdx (R30_IDX);
	Z1= avr_regWithIdx (R31_IDX);

	/* for all live ranges */
	for (lrsym = hTabFirstItem (liveRanges, &k); lrsym;
	     lrsym = hTabNextItem (liveRanges, &k)) {
		int j;

		/* if no registers assigned to it or
		   spilt */
		/* if it does not overlap with this then 
		   not need to spill it */

		if (lrsym->isspilt || !lrsym->nRegs ||
		    (lrsym->liveTo < forSym->liveFrom)) continue;

		/* go thru the registers : if it is either
		   r0 or r1 then spil it */
		for (j = 0; j < lrsym->nRegs; j++)
			if (lrsym->regs[j] == X || lrsym->regs[j] == Z ||
			    lrsym->regs[j] == X1 || lrsym->regs[j] == Z1) {
				spillThis (lrsym);
				break;
			}
	}

}
#endif

/*-----------------------------------------------------------------*/
/* allocReg - allocates register of given type                     */
/*-----------------------------------------------------------------*/
static regs *
allocReg (short type)
{
	int i;

	for (i = avr_fReg; i < avr_nRegs; i++) {

		/* if type is given as 0 then any
		   free register will do */
		if (!type && regsAVR[i].isFree) {
			regsAVR[i].isFree = 0;
			if (currFunc)
				currFunc->regsUsed =
					bitVectSetBit (currFunc->regsUsed, i);
			return &regsAVR[i];
		}

		/* other wise look for specific type
		   of register */
		if (regsAVR[i].isFree && (regsAVR[i].type & type)) {
			regsAVR[i].isFree = 0;
			if (currFunc)
				currFunc->regsUsed =
					bitVectSetBit (currFunc->regsUsed, i);
			return &regsAVR[i];
		}
	}
	return NULL;
}

/*-----------------------------------------------------------------*/
/* allocRegPair - allocates register pair of given                 */
/*-----------------------------------------------------------------*/
static regs *
allocRegPair (short type)
{
	int i;

	for (i = avr_fReg; i < avr_nRegs; i++) {

		/* look for specific type of register pair */
		if (regsAVR[i].isFree && (regsAVR[i].type & type) 
		    && (regsAVR[i].type & REG_PAIR) && regsAVR[i+1].isFree) {

			regsAVR[i].isFree = 0;
			regsAVR[i+1].isFree = 0;
			if (currFunc) {
				currFunc->regsUsed =
					bitVectSetBit (currFunc->regsUsed, i);
				currFunc->regsUsed =
					bitVectSetBit (currFunc->regsUsed, i+1);
			}
			return &regsAVR[i];
		}
	}
	return NULL;
}

/*-----------------------------------------------------------------*/
/* avr_regWithIdx - returns pointer to register wit index number   */
/*-----------------------------------------------------------------*/
regs *
avr_regWithIdx (int idx)
{
	int i;

	for (i = 0; i < avr_nRegs; i++)
		if (regsAVR[i].rIdx == idx)
			return &regsAVR[i];

	werror (E_INTERNAL_ERROR, __FILE__, __LINE__, "regWithIdx not found");
	exit (1);
}

/*-----------------------------------------------------------------*/
/* freeReg - frees a register                                      */
/*-----------------------------------------------------------------*/
static void
freeReg (regs * reg)
{
	reg->isFree = 1;
}


/*-----------------------------------------------------------------*/
/* nFreeRegs - returns number of free registers                    */
/*-----------------------------------------------------------------*/
static int
nFreeRegs (int type)
{
	int i;
	int nfr = 0;

	for (i = avr_fReg; i < avr_nRegs; i++)
		if (regsAVR[i].isFree && regsAVR[i].type & type)
			nfr++;
	return nfr;
}

/*-----------------------------------------------------------------*/
/* nfreeRegsType - free registers with type                         */
/*-----------------------------------------------------------------*/
static int
nfreeRegsType (int type)
{
	int nfr;
	if (type == REG_PTR) {
		if ((nfr = nFreeRegs (type)) == 0)
			return nFreeRegs (REG_GPR);
	}

	return nFreeRegs (type);
}


/*-----------------------------------------------------------------*/
/* allDefsOutOfRange - all definitions are out of a range          */
/*-----------------------------------------------------------------*/
static bool
allDefsOutOfRange (bitVect * defs, int fseq, int toseq)
{
	int i;

	if (!defs)
		return TRUE;

	for (i = 0; i < defs->size; i++) {
		iCode *ic;

		if (bitVectBitValue (defs, i) &&
		    (ic = hTabItemWithKey (iCodehTab, i)) &&
		    (ic->seq >= fseq && ic->seq <= toseq))

			return FALSE;
	}

	return TRUE;
}

/*-----------------------------------------------------------------*/
/* computeSpillable - given a point find the spillable live ranges */
/*-----------------------------------------------------------------*/
static bitVect *
computeSpillable (iCode * ic)
{
	bitVect *spillable;

	/* spillable live ranges are those that are live at this 
	   point . the following categories need to be subtracted
	   from this set. 
	   a) - those that are already spilt
	   b) - if being used by this one
	   c) - defined by this one */

	spillable = bitVectCopy (ic->rlive);
	spillable = bitVectCplAnd (spillable, _G.spiltSet);	/* those already spilt */
	spillable = bitVectCplAnd (spillable, ic->uses);	/* used in this one */
	bitVectUnSetBit (spillable, ic->defKey);
	spillable = bitVectIntersect (spillable, _G.regAssigned);
	return spillable;

}

/*-----------------------------------------------------------------*/
/* noSpilLoc - return true if a variable has no spil location      */
/*-----------------------------------------------------------------*/
static int
noSpilLoc (symbol * sym, eBBlock * ebp, iCode * ic)
{
	return (sym->usl.spillLoc ? 0 : 1);
}

/*-----------------------------------------------------------------*/
/* hasSpilLoc - will return 1 if the symbol has spil location      */
/*-----------------------------------------------------------------*/
static int
hasSpilLoc (symbol * sym, eBBlock * ebp, iCode * ic)
{
	return (sym->usl.spillLoc ? 1 : 0);
}

/*-----------------------------------------------------------------*/
/* hasSpilLocnoUptr - will return 1 if the symbol has spil location */
/*                    but is not used as a pointer                 */
/*-----------------------------------------------------------------*/
static int
hasSpilLocnoUptr (symbol * sym, eBBlock * ebp, iCode * ic)
{
	return ((sym->usl.spillLoc && !sym->uptr) ? 1 : 0);
}

/*-----------------------------------------------------------------*/
/* rematable - will return 1 if the remat flag is set              */
/*-----------------------------------------------------------------*/
static int
rematable (symbol * sym, eBBlock * ebp, iCode * ic)
{
	return sym->remat;
}

/*-----------------------------------------------------------------*/
/* notUsedInBlock - not used in this block                         */
/*-----------------------------------------------------------------*/
static int
notUsedInBlock (symbol * sym, eBBlock * ebp, iCode * ic)
{
	return (!bitVectBitsInCommon (sym->defs, ebp->usesDefs) &&
		allDefsOutOfRange (sym->defs, ebp->fSeq, ebp->lSeq));
}

/*-----------------------------------------------------------------*/
/* notUsedInRemaining - not used or defined in remain of the block */
/*-----------------------------------------------------------------*/
static int
notUsedInRemaining (symbol * sym, eBBlock * ebp, iCode * ic)
{
	return ((usedInRemaining (operandFromSymbol (sym), ic) ? 0 : 1) &&
		allDefsOutOfRange (sym->defs, ic->seq, ebp->lSeq));
}

/*-----------------------------------------------------------------*/
/* allLRs - return true for all                                    */
/*-----------------------------------------------------------------*/
static int
allLRs (symbol * sym, eBBlock * ebp, iCode * ic)
{
	return 1;
}

/*-----------------------------------------------------------------*/
/* liveRangesWith - applies function to a given set of live range  */
/*-----------------------------------------------------------------*/
static set *
liveRangesWith (bitVect * lrs,
		int (func) (symbol *, eBBlock *, iCode *),
		eBBlock * ebp, iCode * ic)
{
	set *rset = NULL;
	int i;

	if (!lrs || !lrs->size)
		return NULL;

	for (i = 1; i < lrs->size; i++) {
		symbol *sym;
		if (!bitVectBitValue (lrs, i))
			continue;

		/* if we don't find it in the live range 
		   hash table we are in serious trouble */
		if (!(sym = hTabItemWithKey (liveRanges, i))) {
			werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
				"liveRangesWith could not find liveRange");
			exit (1);
		}

		if (func (sym, ebp, ic)
		    && bitVectBitValue (_G.regAssigned,
					sym->key)) addSetHead (&rset, sym);
	}

	return rset;
}


/*-----------------------------------------------------------------*/
/* leastUsedLR - given a set determines which is the least used    */
/*-----------------------------------------------------------------*/
static symbol *
leastUsedLR (set * sset)
{
	symbol *sym = NULL, *lsym = NULL;

	sym = lsym = setFirstItem (sset);

	if (!lsym)
		return NULL;

	for (; lsym; lsym = setNextItem (sset)) {

		/* if usage is the same then prefer
		   the spill the smaller of the two */
		if (lsym->used == sym->used)
			if (getSize (lsym->type) < getSize (sym->type))
				sym = lsym;

		/* if less usage */
		if (lsym->used < sym->used)
			sym = lsym;

	}

	setToNull ((void **) &sset);
	sym->blockSpil = 0;
	return sym;
}

/*-----------------------------------------------------------------*/
/* noOverLap - will iterate through the list looking for over lap  */
/*-----------------------------------------------------------------*/
static int
noOverLap (set * itmpStack, symbol * fsym)
{
	symbol *sym;


	for (sym = setFirstItem (itmpStack); sym;
	     sym = setNextItem (itmpStack)) {
		if (sym->liveTo > fsym->liveFrom)
			return 0;

	}

	return 1;
}

/*-----------------------------------------------------------------*/
/* isFree - will return 1 if the a free spil location is found     */
/*-----------------------------------------------------------------*/
static
DEFSETFUNC (isFree)
{
	symbol *sym = item;
	V_ARG (symbol **, sloc);
	V_ARG (symbol *, fsym);

	/* if already found */
	if (*sloc)
		return 0;

	/* if it is free && and the itmp assigned to
	   this does not have any overlapping live ranges
	   with the one currently being assigned and
	   the size can be accomodated  */
	if (sym->isFree &&
	    noOverLap (sym->usl.itmpStack, fsym) &&
	    getSize (sym->type) >= getSize (fsym->type)) {
		*sloc = sym;
		return 1;
	}

	return 0;
}

/*-----------------------------------------------------------------*/
/* createStackSpil - create a location on the stack to spil        */
/*-----------------------------------------------------------------*/
static symbol *
createStackSpil (symbol * sym)
{
	symbol *sloc = NULL;
	int useXstack, model, noOverlay;
	int stackAuto;

	char slocBuffer[30];

	/* first go try and find a free one that is already 
	   existing on the stack */
	if (applyToSet (_G.stackSpil, isFree, &sloc, sym)) {
		/* found a free one : just update & return */
		sym->usl.spillLoc = sloc;
		sym->stackSpil = 1;
		sloc->isFree = 0;
		addSetHead (&sloc->usl.itmpStack, sym);
		return sym;
	}

	/* could not then have to create one , this is the hard part
	   we need to allocate this on the stack : this is really a
	   hack!! but cannot think of anything better at this time */

	if (sprintf (slocBuffer, "sloc%d", _G.slocNum++) >=
	    sizeof (slocBuffer)) {
		fprintf (stderr,
			 "***Internal error: slocBuffer overflowed: %s:%d\n",
			 __FILE__, __LINE__);
		exit (1);
	}

	sloc = newiTemp (slocBuffer);

	/* set the type to the spilling symbol */
	sloc->type = copyLinkChain (sym->type);
	sloc->etype = getSpec (sloc->type);
	SPEC_SCLS (sloc->etype) = S_AUTO;
	SPEC_EXTR (sloc->etype) = 0;

	/* we don't allow it to be allocated`
	   onto the external stack since : so we
	   temporarily turn it off ; we also
	   turn off memory model to prevent
	   the spil from going to the external storage
	   and turn off overlaying 
	 */

	useXstack = options.useXstack;
	model = options.model;
	noOverlay = options.noOverlay;
	stackAuto = options.stackAuto;
	options.noOverlay = 1;
	options.model = options.useXstack = 0;

	allocLocal (sloc);

	options.useXstack = useXstack;
	options.model = model;
	options.noOverlay = noOverlay;
	options.stackAuto = stackAuto;
	sloc->isref = 1;	/* to prevent compiler warning */

	/* if it is on the stack then update the stack */
	if (IN_STACK (sloc->etype)) {
		currFunc->stack += getSize (sloc->type);
		_G.stackExtend += getSize (sloc->type);
	}
	else
		_G.dataExtend += getSize (sloc->type);

	/* add it to the _G.stackSpil set */
	addSetHead (&_G.stackSpil, sloc);
	sym->usl.spillLoc = sloc;
	sym->stackSpil = 1;

	/* add it to the set of itempStack set 
	   of the spill location */
	addSetHead (&sloc->usl.itmpStack, sym);
	return sym;
}

/*-----------------------------------------------------------------*/
/* spillThis - spils a specific operand                            */
/*-----------------------------------------------------------------*/
static void
spillThis (symbol * sym)
{
	int i;
	/* if this is rematerializable or has a spillLocation
	   we are okay, else we need to create a spillLocation
	   for it */
	if (!(sym->remat || sym->usl.spillLoc))
		createStackSpil (sym);


	/* mark it has spilt & put it in the spilt set */
	sym->isspilt = 1;
	_G.spiltSet = bitVectSetBit (_G.spiltSet, sym->key);

	bitVectUnSetBit (_G.regAssigned, sym->key);

	for (i = 0; i < sym->nRegs; i++)

		if (sym->regs[i]) {
			freeReg (sym->regs[i]);
			sym->regs[i] = NULL;
		}

	if (sym->usl.spillLoc && !sym->remat)
		sym->usl.spillLoc->allocreq = 1;
	return;
}

/*-----------------------------------------------------------------*/
/* selectSpil - select a iTemp to spil : rather a simple procedure */
/*-----------------------------------------------------------------*/
static symbol *
selectSpil (iCode * ic, eBBlock * ebp, symbol * forSym)
{
	bitVect *lrcs = NULL;
	set *selectS;
	symbol *sym;

	/* get the spillable live ranges */
	lrcs = computeSpillable (ic);

	/* get all live ranges that are rematerizable */
	if ((selectS = liveRangesWith (lrcs, rematable, ebp, ic))) {

		/* return the least used of these */
		return leastUsedLR (selectS);
	}

	/* if the symbol is local to the block then */
	if (forSym->liveTo < ebp->lSeq) {

		/* check if there are any live ranges allocated
		   to registers that are not used in this block */
		if (!_G.blockSpil &&
		    (selectS =
		     liveRangesWith (lrcs, notUsedInBlock, ebp, ic))) {
			sym = leastUsedLR (selectS);
			/* if this is not rematerializable */
			if (!sym->remat) {
				_G.blockSpil++;
				sym->blockSpil = 1;
			}
			return sym;
		}

		/* check if there are any live ranges that not
		   used in the remainder of the block */
		if (!_G.blockSpil &&
		    (selectS =
		     liveRangesWith (lrcs, notUsedInRemaining, ebp, ic))) {
			sym = leastUsedLR (selectS);
			if (sym != forSym) {
				if (!sym->remat) {
					sym->remainSpil = 1;
					_G.blockSpil++;
				}
				return sym;
			}
		}
	}

	/* find live ranges with spillocation && not used as pointers */
	if ((selectS = liveRangesWith (lrcs, hasSpilLocnoUptr, ebp, ic))) {

		sym = leastUsedLR (selectS);
		/* mark this as allocation required */
		sym->usl.spillLoc->allocreq = 1;
		return sym;
	}

	/* find live ranges with spillocation */
	if ((selectS = liveRangesWith (lrcs, hasSpilLoc, ebp, ic))) {

		sym = leastUsedLR (selectS);
		sym->usl.spillLoc->allocreq = 1;
		return sym;
	}

	/* couldn't find then we need to create a spil
	   location on the stack , for which one? the least
	   used ofcourse */
	if ((selectS = liveRangesWith (lrcs, noSpilLoc, ebp, ic))) {

		/* return a created spil location */
		sym = createStackSpil (leastUsedLR (selectS));
		sym->usl.spillLoc->allocreq = 1;
		return sym;
	}

	/* this is an extreme situation we will spill
	   this one : happens very rarely but it does happen */
	spillThis (forSym);
	return forSym;

}

/*-----------------------------------------------------------------*/
/* spilSomething - spil some variable & mark registers as free     */
/*-----------------------------------------------------------------*/
static bool
spilSomething (iCode * ic, eBBlock * ebp, symbol * forSym)
{
	symbol *ssym;
	int i;

	/* get something we can spil */
	ssym = selectSpil (ic, ebp, forSym);

	/* mark it as spilt */
	ssym->isspilt = 1;
	_G.spiltSet = bitVectSetBit (_G.spiltSet, ssym->key);

	/* mark it as not register assigned &
	   take it away from the set */
	bitVectUnSetBit (_G.regAssigned, ssym->key);

	/* mark the registers as free */
	for (i = 0; i < ssym->nRegs; i++)
		if (ssym->regs[i])
			freeReg (ssym->regs[i]);

	/* if this was a block level spil then insert push & pop 
	   at the start & end of block respectively */
	if (ssym->blockSpil) {
		iCode *nic = newiCode (IPUSH, operandFromSymbol (ssym), NULL);
		/* add push to the start of the block */
		addiCodeToeBBlock (ebp, nic, (ebp->sch->op == LABEL ?
					      ebp->sch->next : ebp->sch));
		nic = newiCode (IPOP, operandFromSymbol (ssym), NULL);
		/* add pop to the end of the block */
		addiCodeToeBBlock (ebp, nic, NULL);
	}

	/* if spilt because not used in the remainder of the
	   block then add a push before this instruction and
	   a pop at the end of the block */
	if (ssym->remainSpil) {

		iCode *nic = newiCode (IPUSH, operandFromSymbol (ssym), NULL);
		/* add push just before this instruction */
		addiCodeToeBBlock (ebp, nic, ic);

		nic = newiCode (IPOP, operandFromSymbol (ssym), NULL);
		/* add pop to the end of the block */
		addiCodeToeBBlock (ebp, nic, NULL);
	}

	if (ssym == forSym)
		return FALSE;
	else
		return TRUE;
}

/*-----------------------------------------------------------------*/
/* getRegPtr - will try for PTR if not a GPR type if not spil      */
/*-----------------------------------------------------------------*/
static regs *
getRegPtr (iCode * ic, eBBlock * ebp, symbol * sym)
{
	regs *reg;

      tryAgain:
	/* try for a ptr type */
	if ((reg = allocReg (REG_PTR|REG_PAIR)))
		return reg;

	/* try for gpr type / pair */
	if ((reg = allocReg (REG_GPR|REG_PAIR)))
		return reg;

	/* try for gpr type  */
	if ((reg = allocReg (REG_GPR)))
		return reg;

	/* we have to spil */
	if (!spilSomething (ic, ebp, sym))
		return NULL;

	/* this looks like an infinite loop but 
	   in reality selectSpil will abort  */
	goto tryAgain;
}

/*-----------------------------------------------------------------*/
/* getRegScr - will try for SCR if not a GPR type if not spil      */
/*-----------------------------------------------------------------*/
static regs *
getRegScr (iCode * ic, eBBlock * ebp, symbol * sym)
{
	regs *reg;

      tryAgain:

	/* try for a scratch non-pair */	
	if ((reg = allocReg (REG_SCR)))
		return reg;
				
	if ((reg = allocReg (REG_GPR)))
		return reg;

	/* we have to spil */
	if (!spilSomething (ic, ebp, sym))
		return NULL;

	/* this looks like an infinite loop but 
	   in really selectSpil will abort  */
	goto tryAgain;
}

/*-----------------------------------------------------------------*/
/* getRegGpr - will try for GPR if not spil                        */
/*-----------------------------------------------------------------*/
static regs *
getRegGpr (iCode * ic, eBBlock * ebp, symbol * sym )
{
	regs *reg;

      tryAgain:
	/* try for gpr type */
	if ((reg = allocReg (REG_GPR)))
		return reg;

	if (!avr_ptrRegReq)
		if ((reg = allocReg (REG_PTR)))
			return reg;

	/* we have to spil */
	if (!spilSomething (ic, ebp, sym))
		return NULL;

	/* this looks like an infinite loop but 
	   in reality selectSpil will abort  */
	goto tryAgain;
}

/*-----------------------------------------------------------------*/
/* symHasReg - symbol has a given register                         */
/*-----------------------------------------------------------------*/
static bool
symHasReg (symbol * sym, regs * reg)
{
	int i;

	for (i = 0; i < sym->nRegs; i++)
		if (sym->regs[i] == reg)
			return TRUE;

	return FALSE;
}

/*-----------------------------------------------------------------*/
/* deassignLRs - check the live to and if they have registers & are */
/*               not spilt then free up the registers              */
/*-----------------------------------------------------------------*/
static void
deassignLRs (iCode * ic, eBBlock * ebp)
{
	symbol *sym;
	int k;
	symbol *result;

	for (sym = hTabFirstItem (liveRanges, &k); sym;
	     sym = hTabNextItem (liveRanges, &k)) {

		symbol *psym = NULL;
		/* if it does not end here */
		if (sym->liveTo > ic->seq)
			continue;

		/* if it was spilt on stack then we can 
		   mark the stack spil location as free */
		if (sym->isspilt) {
			if (sym->stackSpil) {
				sym->usl.spillLoc->isFree = 1;
				sym->stackSpil = 0;
			}
			continue;
		}

		if (!bitVectBitValue (_G.regAssigned, sym->key))
			continue;

		/* special case check if this is an IFX &
		   the privious one was a pop and the 
		   previous one was not spilt then keep track
		   of the symbol */
		if (ic->op == IFX && ic->prev &&
		    ic->prev->op == IPOP &&
		    !ic->prev->parmPush &&
		    !OP_SYMBOL (IC_LEFT (ic->prev))->isspilt)
			psym = OP_SYMBOL (IC_LEFT (ic->prev));

		if (sym->nRegs) {
			int i = 0;

			bitVectUnSetBit (_G.regAssigned, sym->key);

			/* if the result of this one needs registers
			   and does not have it then assign it right
			   away */
			if (IC_RESULT (ic) && !(SKIP_IC2 (ic) ||	/* not a special icode */
						ic->op == JUMPTABLE ||
						ic->op == IFX ||
						ic->op == IPUSH ||
						ic->op == IPOP ||
						ic->op == RETURN ||
						POINTER_SET (ic)) &&
			    (result = OP_SYMBOL (IC_RESULT (ic))) &&	/* has a result */
			    result->liveTo > ic->seq &&	/* and will live beyond this */
			    result->liveTo <= ebp->lSeq &&	/* does not go beyond this block */
			    result->regType == sym->regType &&	/* same register types */
			    result->nRegs &&	/* which needs registers */
			    !result->isspilt &&	/* and does not already have them */
			    !result->remat &&
			    !bitVectBitValue (_G.regAssigned, result->key) &&
			    /* the number of free regs + number of regs in this LR
			       can accomodate the what result Needs */
			    ((nfreeRegsType (result->regType) + sym->nRegs) >= result->nRegs)) {

				for (i = 0; i < result->nRegs; i++) {
					if (i < sym->nRegs) 
						result->regs[i] = sym->regs[i];
					else if (result->regType == REG_SCR) 
						result->regs[i] = getRegScr (ic, ebp, result);
					else
						result->regs[i] = getRegGpr (ic, ebp, result);
				}
				_G.regAssigned = bitVectSetBit (_G.regAssigned, result->key);

			}

			/* free the remaining */
			for (; i < sym->nRegs; i++) {
				if (psym) {
					if (!symHasReg (psym, sym->regs[i]))
						freeReg (sym->regs[i]);
				}
				else freeReg (sym->regs[i]);
			}
		}
	}
}


/*-----------------------------------------------------------------*/
/* reassignLR - reassign this to registers                         */
/*-----------------------------------------------------------------*/
static void
reassignLR (operand * op)
{
	symbol *sym = OP_SYMBOL (op);
	int i;

	/* not spilt any more */
	sym->isspilt = sym->blockSpil = sym->remainSpil = 0;
	bitVectUnSetBit (_G.spiltSet, sym->key);

	_G.regAssigned = bitVectSetBit (_G.regAssigned, sym->key);

	_G.blockSpil--;

	for (i = 0; i < sym->nRegs; i++)
		sym->regs[i]->isFree = 0;
}

/*-----------------------------------------------------------------*/
/* willCauseSpill - determines if allocating will cause a spill    */
/*-----------------------------------------------------------------*/
static int
willCauseSpill (int nr, int rt)
{
	/* first check if there are any avlb registers
	   of te type required */
	if (rt == REG_PTR) {
		/* special case for pointer type 
		   if pointer type not avlb then 
		   check for type gpr */
		if (nFreeRegs (rt) >= nr)
			return 0;
		if (nFreeRegs (REG_GPR) >= nr)
			return 0;
	}
	else {
		if (avr_ptrRegReq) {
			if (nFreeRegs (rt) >= nr)
				return 0;
		}
		else {
			if (nFreeRegs (REG_PTR) + nFreeRegs (REG_GPR) >= nr)
				return 0;
		}
	}

	/* it will cause a spil */
	return 1;
}

/*-----------------------------------------------------------------*/
/* positionRegs - the allocator can allocate same registers to res- */
/* ult and operand, if this happens make sure they are in the same */
/* position as the operand otherwise chaos results                 */
/*-----------------------------------------------------------------*/
static void
positionRegs (symbol * result, symbol * opsym, int lineno)
{
	int count = min (result->nRegs, opsym->nRegs);
	int i, j = 0, shared = 0;
	
	/* if the result has been spilt then cannot share */
	if (opsym->isspilt)
		return;	
 again:
	shared = 0;
	/* first make sure that they actually share */
	for (i = 0; i < count; i++) {
		for (j = 0; j < count; j++) {
			if (result->regs[i] == opsym->regs[j] && i != j) {
				shared = 1;
				goto xchgPositions;
			}
		}
	}
 xchgPositions:
	if (shared) {
		regs *tmp = result->regs[i];
		result->regs[i] = result->regs[j];
		result->regs[j] = tmp;
		goto again;
	}	
}

/*-----------------------------------------------------------------*/
/* needsPair - heuristic to determine if a pair would be good      */
/*-----------------------------------------------------------------*/
static int needsPair (iCode *ic)
{
	symbol *sym = OP_SYMBOL(IC_RESULT(ic));
	bitVect *uses_defs = 
		bitVectUnion(OP_USES (IC_RESULT(ic)),OP_DEFS(IC_RESULT(ic)));
	
	/* if size is less than 2 then NO */
	if (sym->nRegs < 2) return 0;
	/* if type Pointer then YES */
	if (IS_PTR(sym->type)) return 1;
	
	/* go thru the usages of this operand if used with 
	   a constant then yes */
	while (!bitVectIsZero(uses_defs)) {
		int ikey = bitVectFirstBit(uses_defs);
		iCode *uic = hTabItemWithKey(iCodehTab,ikey);
		sym_link *otype = NULL; 
		bitVectUnSetBit(uses_defs,ikey);
		if (!uic) continue;		
		otype = (IC_RIGHT(uic) ? operandType(IC_RIGHT(uic)) : NULL);
		if (otype && IS_LITERAL(otype)) return 1;
	}
	return 0;	
}

/*-----------------------------------------------------------------*/
/* serialRegAssign - serially allocate registers to the variables  */
/*-----------------------------------------------------------------*/
static void
serialRegAssign (eBBlock ** ebbs, int count)
{
	int i;

	/* for all blocks */
	for (i = 0; i < count; i++) {

		iCode *ic;

		if (ebbs[i]->noPath &&
		    (ebbs[i]->entryLabel != entryLabel &&
		     ebbs[i]->entryLabel != returnLabel))
			continue;

		/* of all instructions do */
		for (ic = ebbs[i]->sch; ic; ic = ic->next) {

			/* if this is an ipop that means some live
			   range will have to be assigned again */
			if (ic->op == IPOP)
				reassignLR (IC_LEFT (ic));

			/* if result is present && is a true symbol */
			if (IC_RESULT (ic) && ic->op != IFX &&
			    IS_TRUE_SYMOP (IC_RESULT (ic)))
				OP_SYMBOL (IC_RESULT (ic))->allocreq = 1;

			/* take away registers from live
			   ranges that end at this instruction */
			deassignLRs (ic, ebbs[i]);

			/* some don't need registers */
			if (SKIP_IC2 (ic) ||
			    ic->op == JUMPTABLE ||
			    ic->op == IFX ||
			    ic->op == IPUSH ||
			    ic->op == IPOP ||
			    (IC_RESULT (ic) && POINTER_SET (ic))) continue;

			/* now we need to allocate registers
			   only for the result */
			if (IC_RESULT (ic)) {
				symbol *sym = OP_SYMBOL (IC_RESULT (ic));
				bitVect *spillable;
				int willCS;
				int j=0;

				/* if it does not need or is spilt 
				   or is already assigned to registers
				   or will not live beyond this instructions */
				if (!sym->nRegs ||
				    sym->isspilt ||
				    bitVectBitValue (_G.regAssigned, sym->key)
				    || sym->liveTo <= ic->seq)
					continue;

				/* if some liverange has been spilt at the block level
				   and this one live beyond this block then spil this
				   to be safe */
				if (_G.blockSpil
				    && sym->liveTo > ebbs[i]->lSeq) {
					spillThis (sym);
					continue;
				}
				/* if trying to allocate this will cause
				   a spill and there is nothing to spill 
				   or this one is rematerializable then
				   spill this one */
				willCS =
					willCauseSpill (sym->nRegs,
							sym->regType);
				spillable = computeSpillable (ic);
				if (sym->remat || (willCS && bitVectIsZero (spillable))) {
					spillThis (sym);
					continue;
				}

				/* if it has a spillocation & is used less than
				   all other live ranges then spill this */
				if (willCS) {
					if (sym->usl.spillLoc) {
						symbol *leastUsed = leastUsedLR (liveRangesWith (spillable,
												 allLRs, ebbs[i], ic));
						if (leastUsed && leastUsed->used > sym->used) {
							spillThis (sym);
							continue;
						}
					} else {
						/* if none of the liveRanges have a spillLocation then better
						   to spill this one than anything else already assigned to registers */
						if (liveRangesWith(spillable,noSpilLoc,ebbs[i],ic)) {
							spillThis (sym);
							continue;
						}
					}
				}

				/* we assign registers to it */
				_G.regAssigned = bitVectSetBit (_G.regAssigned, sym->key);
				if (needsPair(ic)) {
					short regtype ;
					regs *preg;
					if (sym->regType == REG_PTR) regtype = REG_PTR;
					else if (sym->regType == REG_SCR) regtype = REG_SCR;
					else regtype = REG_GPR;
					preg = allocRegPair(regtype);
					if (preg) {
						sym->regs[j++] = preg;
						sym->regs[j++] = &regsAVR[preg->rIdx+1];
					}
				}
				for (; j < sym->nRegs; j++) {
					if (sym->regType == REG_PTR)
						sym->regs[j] = getRegPtr (ic, ebbs[i], sym);
					else if (sym->regType == REG_SCR)
						sym->regs[j] = getRegScr (ic, ebbs[i], sym);
					else
						sym->regs[j] = getRegGpr (ic, ebbs[i], sym);
					/* if the allocation falied which means
					   this was spilt then break */
					if (!sym->regs[j]) break;
				}

				/* if it shares registers with operands make sure
				   that they are in the same position */
				if (IC_LEFT (ic) && IS_SYMOP (IC_LEFT (ic)) &&
				    OP_SYMBOL (IC_LEFT (ic))->nRegs
				    && ic->op != '=')
					positionRegs (OP_SYMBOL (IC_RESULT (ic)),
						      OP_SYMBOL (IC_LEFT (ic)), ic->lineno);
				/* do the same for the right operand */
				if (IC_RIGHT (ic) && IS_SYMOP (IC_RIGHT (ic))
				    && OP_SYMBOL (IC_RIGHT (ic))->nRegs)
					positionRegs (OP_SYMBOL (IC_RESULT (ic)),
						      OP_SYMBOL (IC_RIGHT (ic)), ic->lineno);

			}
		}
	}
}

/*-----------------------------------------------------------------*/
/* rUmaskForOp :- returns register mask for an operand             */
/*-----------------------------------------------------------------*/
static bitVect *
rUmaskForOp (operand * op)
{
	bitVect *rumask;
	symbol *sym;
	int j;

	/* only temporaries are assigned registers */
	if (!IS_ITEMP (op))
		return NULL;

	sym = OP_SYMBOL (op);

	/* if spilt or no registers assigned to it
	   then nothing */
	if (sym->isspilt || !sym->nRegs)
		return NULL;

	rumask = newBitVect (avr_nRegs);

	for (j = 0; j < sym->nRegs; j++) {
		rumask = bitVectSetBit (rumask, sym->regs[j]->rIdx);
	}

	return rumask;
}

/*-----------------------------------------------------------------*/
/* regsUsedIniCode :- returns bit vector of registers used in iCode */
/*-----------------------------------------------------------------*/
static bitVect *
regsUsedIniCode (iCode * ic)
{
	bitVect *rmask = newBitVect (avr_nRegs);

	/* do the special cases first */
	if (ic->op == IFX) {
		rmask = bitVectUnion (rmask, rUmaskForOp (IC_COND (ic)));
		goto ret;
	}

	/* for the jumptable */
	if (ic->op == JUMPTABLE) {
		rmask = bitVectUnion (rmask, rUmaskForOp (IC_JTCOND (ic)));

		goto ret;
	}

	/* of all other cases */
	if (IC_LEFT (ic))
		rmask = bitVectUnion (rmask, rUmaskForOp (IC_LEFT (ic)));


	if (IC_RIGHT (ic))
		rmask = bitVectUnion (rmask, rUmaskForOp (IC_RIGHT (ic)));

	if (IC_RESULT (ic))
		rmask = bitVectUnion (rmask, rUmaskForOp (IC_RESULT (ic)));

      ret:
	return rmask;
}

/*-----------------------------------------------------------------*/
/* createRegMask - for each instruction will determine the regsUsed */
/*-----------------------------------------------------------------*/
static void
createRegMask (eBBlock ** ebbs, int count)
{
	int i;

	/* for all blocks */
	for (i = 0; i < count; i++) {
		iCode *ic;

		if (ebbs[i]->noPath &&
		    (ebbs[i]->entryLabel != entryLabel &&
		     ebbs[i]->entryLabel != returnLabel))
			continue;

		/* for all instructions */
		for (ic = ebbs[i]->sch; ic; ic = ic->next) {

			int j;

			if (SKIP_IC2 (ic) || !ic->rlive)
				continue;

			/* first mark the registers used in this
			   instruction */
			ic->rUsed = regsUsedIniCode (ic);
			_G.funcrUsed = bitVectUnion (_G.funcrUsed, ic->rUsed);

			/* now create the register mask for those 
			   registers that are in use : this is a
			   super set of ic->rUsed */
			ic->rMask = newBitVect (avr_nRegs + 1);

			/* for all live Ranges alive at this point */
			for (j = 1; j < ic->rlive->size; j++) {
				symbol *sym;
				int k;

				/* if not alive then continue */
				if (!bitVectBitValue (ic->rlive, j))
					continue;

				/* find the live range we are interested in */
				if (!(sym = hTabItemWithKey (liveRanges, j))) {
					werror (E_INTERNAL_ERROR, __FILE__,
						__LINE__,
						"createRegMask cannot find live range");
					exit (0);
				}

				/* if no register assigned to it */
				if (!sym->nRegs || sym->isspilt)
					continue;

				/* for all the registers allocated to it */
				for (k = 0; k < sym->nRegs; k++) {
					if (sym->regs[k]) {
						ic->rMask = bitVectSetBit (ic-> rMask, sym->regs[k]->rIdx);
						/* special case for X & Z registers */
						if (k == R26_IDX || k == R27_IDX) 
							ic->rMask = bitVectSetBit (ic->rMask, X_IDX);
						if (k == R30_IDX || k == R31_IDX) 
							ic->rMask = bitVectSetBit (ic->rMask, Z_IDX);
					}
				}
			}
		}
	}
}


/*-----------------------------------------------------------------*/
/* regTypeNum - computes the type & number of registers required   */
/*-----------------------------------------------------------------*/
static void
regTypeNum ()
{
	symbol *sym;
	int k;
	iCode *ic;

	/* for each live range do */
	for (sym = hTabFirstItem (liveRanges, &k); sym;
	     sym = hTabNextItem (liveRanges, &k)) {

		/* if used zero times then no registers needed */
		if ((sym->liveTo - sym->liveFrom) == 0)
			continue;


		/* if the live range is a temporary */
		if (sym->isitmp) {

			/* if the type is marked as a conditional */
			if (sym->regType == REG_CND)
				continue;

			/* if used in return only then we don't 
			   need registers */
			if (sym->ruonly || sym->accuse) {
				if (IS_AGGREGATE (sym->type) || sym->isptr)
					sym->type =
						aggrToPtr (sym->type, FALSE);
				continue;
			}

			/* if the symbol has only one definition &
			   that definition is a get_pointer and the
			   pointer we are getting is rematerializable and
			   in "data" space */

			if (bitVectnBitsOn (sym->defs) == 1 &&
			    (ic = hTabItemWithKey (iCodehTab, bitVectFirstBit (sym-> defs)))
			    && POINTER_GET (ic) && !IS_BITVAR (sym->etype)) {

				/* if in data space or idata space then try to
				   allocate pointer register */

			}

			/* if not then we require registers */
			sym->nRegs =
				((IS_AGGREGATE (sym->type) || sym->isptr) ?
				 getSize (sym->type =
					  aggrToPtr (sym->type,
						     FALSE)) : getSize (sym->
									type));

			if (sym->nRegs > 4) {
				fprintf (stderr,
					 "allocated more than 4 or 0 registers for type ");
				printTypeChain (sym->type, stderr);
				fprintf (stderr, "\n");
			}

			/* determine the type of register required */
			if (sym->nRegs == 2 &&	/* size is two */
			    IS_PTR (sym->type) &&	/* is a pointer */
			    sym->uptr) {	/* has pointer usage i.e. get/set pointer */
				sym->regType = REG_PTR;
				avr_ptrRegReq++;
			}
			else {
				/* live accross a function call then gpr else scratch */
				if (sym->isLiveFcall)
					sym->regType = REG_GPR;
				else
					sym->regType = REG_SCR;
			}
		}
		else
			/* for the first run we don't provide */
			/* registers for true symbols we will */
			/* see how things go                  */
			sym->nRegs = 0;
	}

}

/*-----------------------------------------------------------------*/
/* deallocStackSpil - this will set the stack pointer back         */
/*-----------------------------------------------------------------*/
static
DEFSETFUNC (deallocStackSpil)
{
	symbol *sym = item;

	deallocLocal (sym);
	return 0;
}

/*-----------------------------------------------------------------*/
/* packRegsForAssign - register reduction for assignment           */
/*-----------------------------------------------------------------*/
static int
packRegsForAssign (iCode * ic, eBBlock * ebp)
{
	iCode *dic, *sic;

	if (!IS_ITEMP (IC_RIGHT (ic)) ||
	    OP_SYMBOL (IC_RIGHT (ic))->isind ||
	    OP_LIVETO (IC_RIGHT (ic)) > ic->seq) {
		return 0;
	}

	/* find the definition of iTempNN scanning backwards if we find a 
	   a use of the true symbol in before we find the definition then 
	   we cannot */
	for (dic = ic->prev; dic; dic = dic->prev) {

		/* if there is a function call and this is
		   a parameter & not my parameter then don't pack it */
		if ((dic->op == CALL || dic->op == PCALL) &&
		    (OP_SYMBOL (IC_RESULT (ic))->_isparm &&
		     !OP_SYMBOL (IC_RESULT (ic))->ismyparm)) {
			dic = NULL;
			break;
		}

		if (SKIP_IC2 (dic))
			continue;

		if (IS_TRUE_SYMOP (IC_RESULT (dic)) &&
		    IS_OP_VOLATILE (IC_RESULT (dic))) {
			dic = NULL;
			break;
		}

		if (IS_SYMOP (IC_RESULT (dic)) &&
		    IC_RESULT (dic)->key == IC_RIGHT (ic)->key) {
			if (POINTER_SET (dic))
				dic = NULL;

			break;
		}

		if (IS_SYMOP (IC_RIGHT (dic)) &&
		    (IC_RIGHT (dic)->key == IC_RESULT (ic)->key ||
		     IC_RIGHT (dic)->key == IC_RIGHT (ic)->key)) {
			dic = NULL;
			break;
		}

		if (IS_SYMOP (IC_LEFT (dic)) &&
		    (IC_LEFT (dic)->key == IC_RESULT (ic)->key ||
		     IC_LEFT (dic)->key == IC_RIGHT (ic)->key)) {
			dic = NULL;
			break;
		}

		if (POINTER_SET (dic) &&
		    IC_RESULT (dic)->key == IC_RESULT (ic)->key) {
			dic = NULL;
			break;
		}
	}

	if (!dic)
		return 0;	/* did not find */

	/* if the result is on stack or iaccess then it must be
	   the same atleast one of the operands */
	if (OP_SYMBOL (IC_RESULT (ic))->onStack ||
	    OP_SYMBOL (IC_RESULT (ic))->iaccess) {

		/* the operation has only one symbol
		   operator then we can pack */
		if ((IC_LEFT (dic) && !IS_SYMOP (IC_LEFT (dic))) ||
		    (IC_RIGHT (dic) && !IS_SYMOP (IC_RIGHT (dic))))
			goto pack;

		if (!((IC_LEFT (dic) &&
		       IC_RESULT (ic)->key == IC_LEFT (dic)->key) ||
		      (IC_RIGHT (dic) &&
		       IC_RESULT (ic)->key == IC_RIGHT (dic)->key))) return 0;
	}
      pack:
	/* if in far space & tru symbol then don't */
	if ((IS_TRUE_SYMOP (IC_RESULT (ic)))
	    && isOperandInFarSpace (IC_RESULT (ic))) return 0;
	/* found the definition */
	/* replace the result with the result of */
	/* this assignment and remove this assignment */
	IC_RESULT (dic) = IC_RESULT (ic);

	if (IS_ITEMP (IC_RESULT (dic))
	    && OP_SYMBOL (IC_RESULT (dic))->liveFrom > dic->seq) {
		OP_SYMBOL (IC_RESULT (dic))->liveFrom = dic->seq;
	}
	/* delete from liverange table also 
	   delete from all the points inbetween and the new
	   one */
	for (sic = dic; sic != ic; sic = sic->next) {
		bitVectUnSetBit (sic->rlive, IC_RESULT (ic)->key);
		if (IS_ITEMP (IC_RESULT (dic)))
			bitVectSetBit (sic->rlive, IC_RESULT (dic)->key);
	}

	remiCodeFromeBBlock (ebp, ic);
	hTabDeleteItem (&iCodehTab, ic->key, ic, DELETE_ITEM, NULL);
	return 1;

}

#define IS_OP_RUONLY(x) (x && IS_SYMOP(x) && OP_SYMBOL(x)->ruonly)


/*-----------------------------------------------------------------*/
/* packRegsForOneuse : - will reduce some registers for single Use */
/*-----------------------------------------------------------------*/
static iCode *
packRegsForOneuse (iCode * ic, operand * op, eBBlock * ebp)
{
	bitVect *uses;
	iCode *dic, *sic;

	/* if returning a literal then do nothing */
	if (!IS_SYMOP (op))
		return NULL;

	/* returns only */
	if (ic->op != RETURN)
		return NULL;

	/* this routine will mark the a symbol as used in one 
	   instruction use only && if the defintion is local 
	   (ie. within the basic block) && has only one definition &&
	   that definiion is either a return value from a 
	   function or does not contain any variables in
	   far space */
	uses = bitVectCopy (OP_USES (op));
	bitVectUnSetBit (uses, ic->key);	/* take away this iCode */
	if (!bitVectIsZero (uses))	/* has other uses */
		return NULL;

	/* if it has only one defintion */
	if (bitVectnBitsOn (OP_DEFS (op)) > 1)
		return NULL;	/* has more than one definition */

	/* get the that definition */
	if (!(dic =
	      hTabItemWithKey (iCodehTab,
			       bitVectFirstBit (OP_DEFS (op))))) return NULL;

	/* found the definition now check if it is local */
	if (dic->seq < ebp->fSeq || dic->seq > ebp->lSeq)
		return NULL;	/* non-local */

	/* now check if it is the return from
	   a function call */
	if (dic->op == CALL || dic->op == PCALL) {
		if (ic->op != SEND && ic->op != RETURN) {
			OP_SYMBOL (op)->ruonly = 1;
			return dic;
		}
		dic = dic->next;
	}


	/* otherwise check that the definition does
	   not contain any symbols in far space */
	if (IS_OP_RUONLY (IC_LEFT (ic)) || IS_OP_RUONLY (IC_RIGHT (ic))) {
		return NULL;
	}

	/* if pointer set then make sure the pointer
	   is one byte */
	if (POINTER_SET (dic) &&
	    !IS_DATA_PTR (aggrToPtr (operandType (IC_RESULT (dic)), FALSE)))
		return NULL;

	if (POINTER_GET (dic) &&
	    !IS_DATA_PTR (aggrToPtr (operandType (IC_LEFT (dic)), FALSE)))
		return NULL;

	sic = dic;

	/* also make sure the intervenening instructions
	   don't have any thing in far space */
	for (dic = dic->next; dic && dic != ic; dic = dic->next) {

		/* if there is an intervening function call then no */
		if (dic->op == CALL || dic->op == PCALL)
			return NULL;
		/* if pointer set then make sure the pointer
		   is one byte */
		if (POINTER_SET (dic) &&
		    !IS_DATA_PTR (aggrToPtr
				  (operandType (IC_RESULT (dic)),
				   FALSE))) return NULL;

		if (POINTER_GET (dic) &&
		    !IS_DATA_PTR (aggrToPtr
				  (operandType (IC_LEFT (dic)),
				   FALSE))) return NULL;

		/* if address of & the result is remat the okay */
		if (dic->op == ADDRESS_OF &&
		    OP_SYMBOL (IC_RESULT (dic))->remat) continue;

		/* if operand has size of three or more & this
		   operation is a '*','/' or '%' then 'b' may
		   cause a problem */
		if ((dic->op == '%' || dic->op == '/' || dic->op == '*') &&
		    getSize (operandType (op)) >= 3)
			return NULL;

		/* if left or right or result is in far space */
		if (IS_OP_RUONLY (IC_LEFT (dic)) ||
		    IS_OP_RUONLY (IC_RIGHT (dic)) ||
		    IS_OP_RUONLY (IC_RESULT (dic))) {
			return NULL;
		}
	}

	OP_SYMBOL (op)->ruonly = 1;
	return sic;

}

/*-----------------------------------------------------------------*/
/* isBitwiseOptimizable - requirements of JEAN LOUIS VERN          */
/*-----------------------------------------------------------------*/
static bool
isBitwiseOptimizable (iCode * ic)
{
	sym_link *ltype = getSpec (operandType (IC_LEFT (ic)));
	sym_link *rtype = getSpec (operandType (IC_RIGHT (ic)));

	/* bitwise operations are considered optimizable
	   under the following conditions (Jean-Louis VERN) 

	   x & lit
	   bit & bit
	   bit & x
	   bit ^ bit
	   bit ^ x
	   x   ^ lit
	   x   | lit
	   bit | bit
	   bit | x
	 */
	if (IS_LITERAL (rtype) ||
	    (IS_BITVAR (ltype) && IN_BITSPACE (SPEC_OCLS (ltype))))
			return TRUE;
	else
		return FALSE;
}

/*-----------------------------------------------------------------*/
/* packRegisters - does some transformations to reduce register    */
/*                   pressure                                      */
/*-----------------------------------------------------------------*/
static void
packRegisters (eBBlock * ebp)
{
	iCode *ic;
	int change = 0;

	while (1) {

		change = 0;

		/* look for assignments of the form */
		/* iTempNN = TRueSym (someoperation) SomeOperand */
		/*       ....                       */
		/* TrueSym := iTempNN:1             */
		for (ic = ebp->sch; ic; ic = ic->next) {


			/* find assignment of the form TrueSym := iTempNN:1 */
			if (ic->op == '=' && !POINTER_SET (ic))
				change += packRegsForAssign (ic, ebp);
		}

		if (!change)
			break;
	}

	for (ic = ebp->sch; ic; ic = ic->next) {

		/* if this is an itemp & result of a address of a true sym 
		   then mark this as rematerialisable   */
		if (ic->op == ADDRESS_OF &&
		    IS_ITEMP (IC_RESULT (ic)) &&
		    IS_TRUE_SYMOP (IC_LEFT (ic)) &&
		    bitVectnBitsOn (OP_DEFS (IC_RESULT (ic))) == 1 &&
		    !OP_SYMBOL (IC_LEFT (ic))->onStack) {

			OP_SYMBOL (IC_RESULT (ic))->remat = 1;
			OP_SYMBOL (IC_RESULT (ic))->rematiCode = ic;
			OP_SYMBOL (IC_RESULT (ic))->usl.spillLoc = NULL;

		}

		/* if straight assignment then carry remat flag if
		   this is the only definition */
		if (ic->op == '=' &&
		    !POINTER_SET (ic) &&
		    IS_SYMOP (IC_RIGHT (ic)) &&
		    OP_SYMBOL (IC_RIGHT (ic))->remat &&
		    bitVectnBitsOn (OP_SYMBOL (IC_RESULT (ic))->defs) <= 1) {

			OP_SYMBOL (IC_RESULT (ic))->remat =
				OP_SYMBOL (IC_RIGHT (ic))->remat;
			OP_SYMBOL (IC_RESULT (ic))->rematiCode =
				OP_SYMBOL (IC_RIGHT (ic))->rematiCode;
		}

		/* if this is a +/- operation with a rematerizable 
		   then mark this as rematerializable as well only
		   if the literal value is within the range -255 and + 255
		   the assembler cannot handle it other wise */
		if ((ic->op == '+' || ic->op == '-') &&
		    (IS_SYMOP (IC_LEFT (ic)) &&
		     IS_ITEMP (IC_RESULT (ic)) &&
		     OP_SYMBOL (IC_LEFT (ic))->remat &&
		     bitVectnBitsOn (OP_DEFS (IC_RESULT (ic))) == 1 &&
		     IS_OP_LITERAL (IC_RIGHT (ic)))) {

			int i = (int) operandLitValue (IC_RIGHT (ic));
			if (i < 255 && i > -255) {
				OP_SYMBOL (IC_RESULT (ic))->remat = 1;
				OP_SYMBOL (IC_RESULT (ic))->rematiCode = ic;
				OP_SYMBOL (IC_RESULT (ic))->usl.spillLoc =
					NULL;
			}
		}

		/* mark the pointer usages */
		if (POINTER_SET (ic))
			OP_SYMBOL (IC_RESULT (ic))->uptr = 1;

		if (POINTER_GET (ic)) {
			OP_SYMBOL (IC_LEFT (ic))->uptr = 1;
			if (OP_SYMBOL (IC_LEFT(ic))->remat) 
				OP_SYMBOL (IC_RESULT (ic))->usl.spillLoc = NULL;
		}

		/* if the condition of an if instruction
		   is defined in the previous instruction then
		   mark the itemp as a conditional */
		if ((IS_CONDITIONAL (ic) ||
		     ((ic->op == BITWISEAND ||
		       ic->op == '|' ||
		       ic->op == '^') &&
		      isBitwiseOptimizable (ic))) &&
		    ic->next && ic->next->op == IFX &&
		    isOperandEqual (IC_RESULT (ic), IC_COND (ic->next)) &&
		    OP_SYMBOL (IC_RESULT (ic))->liveTo <= ic->next->seq) {

			OP_SYMBOL (IC_RESULT (ic))->regType = REG_CND;
			continue;
		}

		/* some cases the redundant moves can
		   can be eliminated for return statements */
		if ((ic->op == RETURN || ic->op == SEND))
			packRegsForOneuse (ic, IC_LEFT (ic), ebp);

		/* if this is cast for intergral promotion then
		   check if only use of  the definition of the 
		   operand being casted/ if yes then replace
		   the result of that arithmetic operation with 
		   this result and get rid of the cast */
		if (ic->op == CAST) {
			sym_link *fromType = operandType (IC_RIGHT (ic));
			sym_link *toType = operandType (IC_LEFT (ic));

			if (IS_INTEGRAL (fromType) && IS_INTEGRAL (toType) &&
			    getSize (fromType) != getSize (toType) &&
			    SPEC_USIGN (fromType) == SPEC_USIGN (toType)) {

				iCode *dic =
					packRegsForOneuse (ic, IC_RIGHT (ic),
							   ebp);
				if (dic) {
					if (IS_ARITHMETIC_OP (dic)) {
						IC_RESULT (dic) =
							IC_RESULT (ic);
						remiCodeFromeBBlock (ebp, ic);
						hTabDeleteItem (&iCodehTab,
								ic->key, ic,
								DELETE_ITEM,
								NULL);
						ic = ic->prev;
					}
					else
						OP_SYMBOL (IC_RIGHT (ic))->
							ruonly = 0;
				}
			}
			else {

				/* if the type from and type to are the same
				   then if this is the only use then packit */
				if (compareType (operandType (IC_RIGHT (ic)),
					       operandType (IC_LEFT (ic))) ==
				    1) {
					iCode *dic =
						packRegsForOneuse (ic,
								   IC_RIGHT
								   (ic), ebp);
					if (dic) {
						IC_RESULT (dic) =
							IC_RESULT (ic);
						remiCodeFromeBBlock (ebp, ic);
						hTabDeleteItem (&iCodehTab,
								ic->key, ic,
								DELETE_ITEM,
								NULL);
						ic = ic->prev;
					}
				}
			}
		}
	}
}

/*-----------------------------------------------------------------*/
/* preAssignParms - we have a leaf function preassign registers    */
/*-----------------------------------------------------------------*/
static void
preAssignParms (iCode * ic)
{
	int i = R16_IDX;
	/* look for receives and assign registers
	   to the result of the receives */
	while (ic) {
		/* if it is a receive */
		if (ic->op == RECEIVE) {
			symbol *r = OP_SYMBOL (IC_RESULT (ic));
			int size = getSize (r->type);
			if (r->regType == REG_GPR || r->regType == REG_SCR) {
				int j = 0;
				while (size--) {
					r->regs[j++] = &regsAVR[i++];
					regsAVR[i - 1].isFree = 0;
				}
				/* put in the regassigned vector */
				_G.regAssigned =
					bitVectSetBit (_G.regAssigned,
						       r->key);
			}
			else {
				/* not a GPR then we should mark as free */
				while (size--) {
					regsAVR[i++].isFree = 1;
				}
			}
		}
		ic = ic->next;
	}
	/* mark anything remaining as free */
	while (i <= R23_IDX)
		regsAVR[i++].isFree = 1;
}

/*-----------------------------------------------------------------*/
/* setdefaultRegs - do setup stuff for register allocation         */
/*-----------------------------------------------------------------*/
static void
setDefaultRegs (eBBlock ** ebbs, int count)
{
	int i;

	/* if no pointer registers required in this function
	   then mark r26-27 & r30-r31 as GPR & free */
	regsAVR[R26_IDX].isFree =
		regsAVR[R27_IDX].isFree =
		regsAVR[R30_IDX].isFree = regsAVR[R31_IDX].isFree = 1;

	if (!avr_ptrRegReq) {
		regsAVR[R26_IDX].type = (regsAVR[R26_IDX].type & ~REG_MASK) | REG_GPR;
		regsAVR[R27_IDX].type = (regsAVR[R27_IDX].type & ~REG_MASK) | REG_GPR;
		regsAVR[R28_IDX].type = (regsAVR[R28_IDX].type & ~REG_MASK) | REG_GPR;
		regsAVR[R29_IDX].type = (regsAVR[R29_IDX].type & ~REG_MASK) | REG_GPR;
	}
	else {
		regsAVR[R26_IDX].type = (regsAVR[R26_IDX].type & ~REG_MASK) | REG_PTR;
		regsAVR[R27_IDX].type = (regsAVR[R27_IDX].type & ~REG_MASK) | REG_PTR;
		regsAVR[R30_IDX].type = (regsAVR[R30_IDX].type & ~REG_MASK) | REG_PTR;
		regsAVR[R31_IDX].type = (regsAVR[R31_IDX].type & ~REG_MASK) | REG_PTR;
	}

	/* registers 0-1 / 24-25 used as scratch */
	regsAVR[R0_IDX].isFree =
		regsAVR[R1_IDX].isFree =
		regsAVR[R24_IDX].isFree = regsAVR[R25_IDX].isFree = 0;

	/* if this has no function calls then we need
	   to do something special 
	   a) pre-assign registers to parameters RECEIVE
	   b) mark the remaining parameter regs as free */
		/* mark the parameter regs as SCRACH */
	for (i = R16_IDX; i <= R23_IDX; i++) {
		regsAVR[i].type = (regsAVR[i].type & ~REG_MASK) | REG_SCR;
		regsAVR[i].isFree = 1;
	}
	if (!IFFUNC_HASFCALL(currFunc->type)) {
		preAssignParms (ebbs[0]->sch);
	}
	/* Y - is not allocated (it is the stack frame) */
	regsAVR[R28_IDX].isFree = regsAVR[R28_IDX].isFree = 0;
}

/*-----------------------------------------------------------------*/
/* assignRegisters - assigns registers to each live range as need  */
/*-----------------------------------------------------------------*/
void
avr_assignRegisters (eBBlock ** ebbs, int count)
{
	iCode *ic;
	int i;

	setToNull ((void *) &_G.funcrUsed);
	avr_ptrRegReq = _G.stackExtend = _G.dataExtend = 0;

	/* change assignments this will remove some
	   live ranges reducing some register pressure */
	for (i = 0; i < count; i++)
		packRegisters (ebbs[i]);

	if (options.dump_pack)
		dumpEbbsToFileExt (DUMP_PACK, ebbs, count);

	/* first determine for each live range the number of 
	   registers & the type of registers required for each */
	regTypeNum ();

	/* setup the default registers */
	setDefaultRegs (ebbs, count);

	/* and serially allocate registers */
	serialRegAssign (ebbs, count);

	/* if stack was extended then tell the user */
	if (_G.stackExtend) {
		/*      werror(W_TOOMANY_SPILS,"stack", */
		/*             _G.stackExtend,currFunc->name,""); */
		_G.stackExtend = 0;
	}

	if (_G.dataExtend) {
		/*      werror(W_TOOMANY_SPILS,"data space", */
		/*             _G.dataExtend,currFunc->name,""); */
		_G.dataExtend = 0;
	}

	/* after that create the register mask
	   for each of the instruction */
	createRegMask (ebbs, count);

	/* redo that offsets for stacked automatic variables */
	redoStackOffsets ();

	if (options.dump_rassgn)
		dumpEbbsToFileExt (DUMP_RASSGN, ebbs, count);

	/* now get back the chain */
	ic = iCodeLabelOptimize (iCodeFromeBBlock (ebbs, count));


	genAVRCode (ic);
	/*     for (; ic ; ic = ic->next) */
	/*          piCode(ic,stdout); */
	/* free up any _G.stackSpil locations allocated */
	applyToSet (_G.stackSpil, deallocStackSpil);
	_G.slocNum = 0;
	setToNull ((void **) &_G.stackSpil);
	setToNull ((void **) &_G.spiltSet);
	/* mark all registers as free */

	return;
}

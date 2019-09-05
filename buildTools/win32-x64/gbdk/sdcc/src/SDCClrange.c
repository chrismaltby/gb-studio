/*-------------------------------------------------------------------------

  SDCClrange.c - source file for live range computations

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
#include "limits.h"

int iCodeSeq = 0;
hTab *liveRanges = NULL;
hTab *iCodehTab = NULL;

/*-----------------------------------------------------------------*/
/* sequenceiCode - creates a sequence number for the iCode & add   */
/*-----------------------------------------------------------------*/
void 
sequenceiCode (eBBlock ** ebbs, int count)
{
  int i;

  for (i = 0; i < count; i++)
    {

      iCode *ic;
      ebbs[i]->fSeq = iCodeSeq + 1;
      for (ic = ebbs[i]->sch; ic; ic = ic->next)
	{
	  ic->seq = ++iCodeSeq;
	  ic->depth = ebbs[i]->depth;
	  hTabAddItem (&iCodehTab, ic->key, ic);
	}
      ebbs[i]->lSeq = iCodeSeq;
    }
}

/*-----------------------------------------------------------------*/
/* markVisited - will set the visited flag for the given Block     */
/*-----------------------------------------------------------------*/
DEFSETFUNC (markVisited)
{
  eBBlock *ebp = item;

  if (ebp->visited)
    return 0;
  ebp->visited = 1;
  applyToSet (ebp->succList, markVisited);
  return 0;
}

/*-----------------------------------------------------------------*/
/* isOpAlive - checks to see if the usage in this block is the     */
/*             uses the same definitions as this one               */
/*-----------------------------------------------------------------*/
DEFSETFUNC (isOpAlive)
{
  eBBlock *ebp = item;
  V_ARG (operand *, op);
  V_ARG (eBBlock *, orig);
  V_ARG (iCode *, ic);

  if (ebp->visited)
    return 0;

  ebp->visited = 1;

  /* if we have reached the originating block */
  /* or this block has some definiton for it  */
  /* then check if it is used between start & */
  /* this point */
  if (ebp == orig ||
      bitVectBitsInCommon (OP_DEFS (op), ebp->defSet))
    if (usedBetweenPoints (op, ebp->sch, ic))
      return 1;
    else
      {
	applyToSet (ebp->succList, markVisited);
	return 0;
      }
  else
    /* choosing this more expensive one since 
       killDeadCode will take away some definitions
       but there is not way right now to take away
       the usage information for the corresponding
       usages, this will lead to longer live ranges */
  if (usedInRemaining (op, ebp->sch))
    return 1;


  return (applyToSet (ebp->succList, isOpAlive, op, orig, ic));
}

/*-----------------------------------------------------------------*/
/* isLastUse - return TRUE if no usage of this operand after this  */
/*-----------------------------------------------------------------*/
int 
isLastUse (operand * op, eBBlock * ebp, iCode * ic,
	   eBBlock ** ebbs, int count)
{
  int i;

  /* if this is used in the remaining */
  if (usedInRemaining (op, ic))
    return 0;

  /* if not then check any of the successor blocks use it */
  for (i = 0; i < count; ebbs[i++]->visited = 0);
  if (applyToSet (ebp->succList, isOpAlive, op, ebp, ic))
    return 0;

  /* this is the last use */
  return 1;
}

/*-----------------------------------------------------------------*/
/* unionDefsUsed - unions the defsUsed in a block                  */
/*-----------------------------------------------------------------*/
DEFSETFUNC (unionDefsUsed)
{
  eBBlock *ebp = item;
  V_ARG (bitVect **, bvp);

  if (ebp->visited)
    return 0;

  ebp->visited = 1;

  *bvp = bitVectUnion (*bvp, ebp->usesDefs);
  applyToSet (ebp->succList, unionDefsUsed, bvp);
  return 0;
}

/*-----------------------------------------------------------------*/
/* setFromRange - sets the from range of a given operand           */
/*-----------------------------------------------------------------*/
void 
setFromRange (operand * op, int from)
{
  /* only for compiler defined temporaries */
  if (!IS_ITEMP (op))
    return;

  hTabAddItemIfNotP (&liveRanges, op->key, OP_SYMBOL (op));

  if (op->isaddr)
    OP_SYMBOL (op)->isptr = 1;

  if (!OP_LIVEFROM (op) ||
      OP_LIVEFROM (op) > from)
    OP_LIVEFROM (op) = from;
}

/*-----------------------------------------------------------------*/
/* setToRange - set the range to for an operand                    */
/*-----------------------------------------------------------------*/
void 
setToRange (operand * op, int to, bool check)
{
  /* only for compiler defined temps */
  if (!IS_ITEMP (op))
    return;

  OP_SYMBOL (op)->key = op->key;
  hTabAddItemIfNotP (&liveRanges, op->key, OP_SYMBOL (op));

  if (op->isaddr)
    OP_SYMBOL (op)->isptr = 1;

  if (check)
    if (!OP_LIVETO (op))
      OP_LIVETO (op) = to;
    else;
  else
    OP_LIVETO (op) = to;
}

/*-----------------------------------------------------------------*/
/* firstDeOf - finds the first definition in seq for op            */
/*-----------------------------------------------------------------*/
static iCode *
firstDefOf (operand * op)
{
  int i;
  iCode *ric = NULL, *lic = NULL;
  int fSeq = INT_MAX;

  if (!OP_DEFS (op))
    return NULL;

  for (i = 0; i < OP_DEFS (op)->size; i++)
    {
      if (bitVectBitValue (OP_DEFS (op), i) &&
	  (lic = hTabItemWithKey (iCodehTab, i)) &&
	  lic->seq < fSeq)
	{

	  fSeq = lic->seq;
	  ric = lic;
	}
    }
  return ric;
}
/*-----------------------------------------------------------------*/
/* useDefLoopCheck - check for uses before init inside loops       */
/*-----------------------------------------------------------------*/
static void 
useDefLoopCheck (operand * op, iCode * ic)
{
  /* this is for situations like the following
     int a,b;

     while (...) {
     a = ... ;
     ...
     _some_usage_of_b_;
     ...
     b = ... ;
     } 
     in this case the definition of 'b' will flow to the usages
     but register allocator cannot handle these situations.so
     will mark as spilt */

  int i = 0, fdSeq;
  int er = 0;
  iCode *tic;

  /* get the first definition */
  if (!(tic = firstDefOf (op)))
    return;

  fdSeq = tic->seq;
  /* now go thru the usages & make sure they follow
     the first definition */
  for (i = 0; i <= OP_USES (op)->size; i++)
    {
      if (bitVectBitValue (OP_USES (op), i) &&
	  (tic = hTabItemWithKey (iCodehTab, i)) &&
	  tic->seq < fdSeq)
	{
	  er = 1;
	  break;
	}
    }

  /* found a usage without definition */
  if (er)
    {
      if (OP_SYMBOL (op)->isreqv && SPIL_LOC (op))
	{

	  werror (W_LOCAL_NOINIT,
		  SPIL_LOC (op)->name,
		  ic->filename, ic->lineno);
	}
      else
	{

	  werror (W_LOCAL_NOINIT,
		  OP_SYMBOL (op)->name,
		  ic->filename, ic->lineno);
	}
      OP_SYMBOL (op)->isspilt = 1;
    }
}


/*-----------------------------------------------------------------*/
/* operandLUse - check and set the last use for a given operand    */
/*-----------------------------------------------------------------*/
operand *
operandLUse (operand * op, eBBlock ** ebbs,
	     int count, iCode * ic, eBBlock * ebp)
{
  setFromRange (op, ic->seq);
  if (ic->depth)
    OP_SYMBOL (op)->used += (((unsigned int) 1 << ic->depth) + 1);
  else
    OP_SYMBOL (op)->used += 1;

  if (isLastUse (op, ebp, ic->next, ebbs, count) ||
      (OP_LIVETO (op) && OP_LIVETO (op) < ic->seq))
    {
      int torange = ic->seq;
      /* if this is the last use then if this block belongs 
         to a  loop &  some definition  comes into the loop 
         then extend the live range to  the end of the loop */
      if (ebp->partOfLoop 
	  && hasIncomingDefs (ebp->partOfLoop, op))
	{
	  torange = findLoopEndSeq (ebp->partOfLoop);
	}
      op = operandFromOperand (op);
      setToRange (op, torange, FALSE);
    }
  ic->uses = bitVectSetBit (ic->uses, op->key);

  if (!OP_SYMBOL (op)->udChked)
    {
      sym_link *type = operandType (op);
      sym_link *etype = getSpec (type);

      OP_SYMBOL (op)->udChked = 1;
      /* good place to check if unintialised */
      if ((IS_TRUE_SYMOP (op) || OP_SYMBOL (op)->isreqv) &&
	  OP_SYMBOL (op)->islocal &&
	  !IS_AGGREGATE (type) &&
	  !IS_FUNC (type) &&
	  ic->op != ADDRESS_OF &&
	  !IS_STATIC (etype))
	{

	  if (bitVectIsZero (op->usesDefs))
	    {
	      OP_SYMBOL (op)->isspilt = 1;

	      if (OP_SYMBOL (op)->isreqv &&
		  !OP_SYMBOL (op)->_isparm && SPIL_LOC (op))
		{

		  werror (W_LOCAL_NOINIT,
			  SPIL_LOC (op)->name,
			  ic->filename, ic->lineno);
		}
	      else
		{

		  werror (W_LOCAL_NOINIT,
			  OP_SYMBOL (op)->name,
			  ic->filename, ic->lineno);
		}
	    }
	  else
	    {
	      if (ebp->depth && op->usesDefs &&
		  !OP_SYMBOL (op)->_isparm)
		{
		  /* check non-inits inside loops */
		  useDefLoopCheck (op, ic);
		}
	    }
	}
    }
  return op;
}

/*-----------------------------------------------------------------*/
/* killAllAlive - mark all the definitions living with this seq    */
/*-----------------------------------------------------------------*/
void 
killAllAlive (int seq)
{
  symbol *sym;
  int k;

  for (sym = hTabFirstItem (liveRanges, &k); sym;
       sym = hTabNextItem (liveRanges, &k))
    if (!sym->liveTo || (sym->liveTo < sym->liveFrom))
      sym->liveTo = seq;
}
/*-----------------------------------------------------------------*/
/* defUsedAfterLoop - all definitions & usages before sequence num */
/*-----------------------------------------------------------------*/
bool 
defUsedAfterLoop (operand * op, int seq)
{
  int i;
  iCode *ic;

  /* check for the usages first */
  if (OP_SYMBOL (op)->uses && !bitVectIsZero (OP_SYMBOL (op)->uses))
    {
      for (i = 0; i < OP_SYMBOL (op)->uses->size; i++)
	{

	  if (bitVectBitValue (OP_SYMBOL (op)->uses, i) &&	/* usage found */
	      (ic = hTabItemWithKey (iCodehTab, i)) &&	/*    ""       */
	      ic->seq > seq)	/* & is after the seq */
	    return TRUE;
	}
    }

  return FALSE;
}

/*-----------------------------------------------------------------*/
/* markLiveRanges - for each operand mark the liveFrom & liveTo    */
/*-----------------------------------------------------------------*/
void 
markLiveRanges (eBBlock * ebp, eBBlock ** ebbs, int count)
{
  iCode *ic;
  bitVect *defsUsed = NULL;
  bitVect *defsNotUsed = NULL;
  int i;
  /* for all the instructions */
  for (ic = ebp->sch; ic; ic = ic->next)
    {

      if (ic->op == CALL || ic->op == PCALL)
	{
	  setFromRange (IC_RESULT (ic), ic->seq);
	  /* if the result has no usage then 
	     mark this as the end of its life too 
	     and take it away from the defs for the block */
	  if (bitVectIsZero (OP_SYMBOL (IC_RESULT (ic))->uses))
	    {
	      setToRange (IC_RESULT (ic), ic->seq, FALSE);
	      bitVectUnSetBit (ebp->defSet, ic->key);
	    }
	}

      if (SKIP_IC2 (ic))
	continue;

      /* take care of the special icodes first */
      if (ic->op == JUMPTABLE && IS_SYMOP (IC_JTCOND (ic)))
	{
	  operandLUse (IC_JTCOND (ic), ebbs, count, ic, ebp);
	  continue;
	}

      if (ic->op == IFX && IS_SYMOP (IC_COND (ic)))
	{
	  operandLUse (IC_COND (ic), ebbs, count, ic, ebp);
	  continue;
	}

      if (IS_SYMOP (IC_LEFT (ic)))
	operandLUse (IC_LEFT (ic), ebbs, count, ic, ebp);

      if (IS_SYMOP (IC_RIGHT (ic)))
	operandLUse (IC_RIGHT (ic), ebbs, count, ic, ebp);

      if (POINTER_SET (ic))
	operandLUse (IC_RESULT (ic), ebbs, count, ic, ebp);
      else if (IC_RESULT (ic))
	ic->defKey = IC_RESULT (ic)->key;
    }


  /* for all the definitions in the block */
  /* compute and set the live from        */
  if (ebp->ldefs && !bitVectIsZero (ebp->ldefs))
    {
      for (i = 0; i < ebp->ldefs->size; i++)
	{
	  iCode *dic;

	  if (bitVectBitValue (ebp->ldefs, i) &&
	      (dic = hTabItemWithKey (iCodehTab, i)))
	    {

	      /* if the definition has a from & it is greater */
	      /* than the defininng iCode->seq then change it */
	      setFromRange (IC_RESULT (dic), dic->seq);
	    }
	}
    }

  /* special case for lastBlock in a loop: here we
     mark the end of all the induction variables for the
     loop */
  if (ebp->isLastInLoop && !bitVectIsZero (ebp->linds))
    {
      for (i = 0; i <= ebp->linds->size; i++)
	{
	  iCode *dic;

	  if (bitVectBitValue (ebp->linds, i) &&
	      (dic = hTabItemWithKey (iCodehTab, i)))
	    {

	      /* if this is a register equvalent make sure
	         it is not defined or used anywhere after the loop */
	      if (OP_SYMBOL (IC_RESULT (dic))->isreqv &&
		  defUsedAfterLoop (IC_RESULT (dic), ebp->lSeq))
		continue;

	      setToRange (IC_RESULT (dic), (ebp->lSeq), FALSE);
	    }
	}
    }

  /* for defnitions coming into the block if they */
  /* not used by itself & any of its successors   */
  /* they are dead */
  /* first union the definitions used in all successors
     and itself */
  for (i = 0; i < count; ebbs[i++]->visited = 0);
  applyToSet (ebp->succList, unionDefsUsed, &defsUsed);
  defsUsed = bitVectUnion (defsUsed, ebp->usesDefs);

  /* now subract the result of these unions from */
  /* the incoming definitions this will give the */
  /* definitions that are never used in the future */
  defsNotUsed = bitVectCplAnd (bitVectCopy (ebp->inDefs),
			       defsUsed);

  /* mark the end of the defintions */
  if (!bitVectIsZero (defsNotUsed) && ebp->sch)
    {
      for (i = 0; i < defsNotUsed->size; i++)
	{
	  iCode *dic;

	  if (bitVectBitValue (defsNotUsed, i) &&
	      (dic = hTabItemWithKey (iCodehTab, i)))
	    {

	      setToRange (IC_RESULT (dic), (ebp->fSeq - 1), TRUE);
	    }
	}
    }


  /* if we reach a lock with noPath to it then kill all
     the live ranges alive at this point */
/*     if (ebp->noPath || ebp->entryLabel == returnLabel) */
  if (ebp->entryLabel == returnLabel)
    killAllAlive (ebp->fSeq);
}

/*-----------------------------------------------------------------*/
/* rlivePoint - for each point compute the ranges that are alive   */
/*-----------------------------------------------------------------*/
void 
rlivePoint (eBBlock ** ebbs, int count)
{
	int i;

	/* for all blocks do */
	for (i = 0; i < count; i++) {
		iCode *ic;

		/* for all instruction in the block do */
		for (ic = ebbs[i]->sch; ic; ic = ic->next) {
			symbol *lrange;
			int k;

			ic->rlive = newBitVect (operandKey);
			/* for all symbols in the liverange table */
			for (lrange = hTabFirstItem (liveRanges, &k); lrange;
			     lrange = hTabNextItem (liveRanges, &k)) {

				/* if it is live then add the lrange to ic->rlive */
				if (lrange->liveFrom <= ic->seq &&
				    lrange->liveTo >= ic->seq) {
					lrange->isLiveFcall |= (ic->op == CALL || ic->op == PCALL || ic->op == SEND);
					ic->rlive = bitVectSetBit (ic->rlive, lrange->key);
				}
			}
			/* overlapping live ranges should be eliminated */
			if (ASSIGN_ITEMP_TO_ITEMP (ic)) {

				if (SPIL_LOC(IC_RIGHT(ic)) == SPIL_LOC(IC_RESULT(ic)) 	&& /* left & right share the same spil location */
				    OP_SYMBOL(IC_RESULT(ic))->isreqv 			&& /* left of assign is a register requivalent */
				    !OP_SYMBOL(IC_RIGHT(ic))->isreqv 			&& /* right side is not */
				    OP_SYMBOL(IC_RIGHT(ic))->liveTo > ic->key 		&& /* right side live beyond this point */
				    bitVectnBitsOn(OP_DEFS(IC_RESULT(ic))) > 1 ) 	{  /* left has multiple definitions */
					SPIL_LOC(IC_RIGHT(ic)) = NULL; /* then cannot share */
				}
			}
		}
	}
}


/*-----------------------------------------------------------------*/
/* computeLiveRanges - computes the live ranges for variables      */
/*-----------------------------------------------------------------*/
void 
computeLiveRanges (eBBlock ** ebbs, int count)
{
  int i = 0;
  /* sequence the code the live ranges are computed 
     in terms of this sequence additionally the   
     routine will also create a hashtable of instructions */
  iCodeSeq = 0;
  setToNull ((void **) &iCodehTab);
  iCodehTab = newHashTable (iCodeKey);
  sequenceiCode (ebbs, count);

  /* call routine to mark the from & to live ranges for
     variables used */
  setToNull ((void **) &liveRanges);
  for (i = 0; i < count; i++)
    markLiveRanges (ebbs[i], ebbs, count);

  /* mark the ranges live for each point */
  rlivePoint (ebbs, count);
}

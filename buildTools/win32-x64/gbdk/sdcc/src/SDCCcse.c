/*-------------------------------------------------------------------------
  SDCCcse.c - source file for Common Subexpressions and other utility

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
#include "newalloc.h"

/*-----------------------------------------------------------------*/
/* newCseDef - new cseDef                                          */
/*-----------------------------------------------------------------*/
cseDef *
newCseDef (operand * sym, iCode * ic)
{
  cseDef *cdp;

  assert (sym);
  cdp = Safe_alloc (sizeof (cseDef));

  cdp->sym = sym;
  cdp->diCode = ic;
  cdp->key = sym->key;

  return cdp;
}



/*-----------------------------------------------------------------*/
/* int isCseDefEqual - two definitions are equal                   */
/*-----------------------------------------------------------------*/
int 
isCseDefEqual (void *vsrc, void *vdest)
{
  cseDef *src = vsrc;
  cseDef *dest = vdest;

  if (src == dest)
    return 1;

  return (src->key == dest->key &&
	  src->diCode == dest->diCode);

}

/*-----------------------------------------------------------------*/
/* pcseDef - in the cseDef                                         */
/*-----------------------------------------------------------------*/
int 
pcseDef (void *item, va_list ap)
{
  cseDef *cdp = item;
  iCodeTable *icTab;

  (void) ap;

  if (!cdp->sym)
    fprintf (stdout, "**null op**");
  printOperand (cdp->sym, stdout);
  icTab = getTableEntry (cdp->diCode->op);
  icTab->iCodePrint (stdout, cdp->diCode, icTab->printName);
  return 1;
}

/*-----------------------------------------------------------------*/
/* replaceAllSymBySym - replaces all operands by operand in an     */
/*                      instruction chain                          */
/*-----------------------------------------------------------------*/
void 
replaceAllSymBySym (iCode * ic, operand * from, operand * to, bitVect ** ndpset)
{
  iCode *lic;

  for (lic = ic; lic; lic = lic->next)
    {
      int siaddr;

      /* do the special cases first */
      if (lic->op == IFX)
	{
	  if (IS_SYMOP (to) &&
	      IC_COND (lic)->key == from->key)
	    {

	      bitVectUnSetBit (OP_USES (from), lic->key);
	      OP_USES (to) = bitVectSetBit (OP_USES (to), lic->key);
	      siaddr = IC_COND (lic)->isaddr;
	      IC_COND (lic) = operandFromOperand (to);
	      IC_COND (lic)->isaddr = siaddr;

	    }
	  continue;
	}

      if (lic->op == JUMPTABLE)
	{
	  if (IS_SYMOP (to) &&
	      IC_JTCOND (lic)->key == from->key)
	    {

	      bitVectUnSetBit (OP_USES (from), lic->key);
	      OP_USES (to) = bitVectSetBit (OP_USES (to), lic->key);
	      siaddr = IC_COND (lic)->isaddr;
	      IC_JTCOND (lic) = operandFromOperand (to);
	      IC_JTCOND (lic)->isaddr = siaddr;

	    }
	  continue;
	}

      if (IC_RESULT (lic) && IC_RESULT (lic)->key == from->key)
	{
	  /* maintain du chains */
	  if (POINTER_SET (lic))
	    {
	      bitVectUnSetBit (OP_USES (from), lic->key);
	      OP_USES (to) = bitVectSetBit (OP_USES (to), lic->key);

	      /* also check if the "from" was in the non-dominating
	         pointer sets and replace it with "to" in the bitVector */
	      if (bitVectBitValue (*ndpset, from->key))
		{
		  bitVectUnSetBit (*ndpset, from->key);
		  bitVectSetBit (*ndpset, to->key);
		}

	    }
	  else
	    {
	      bitVectUnSetBit (OP_DEFS (from), lic->key);
	      OP_DEFS (to) = bitVectSetBit (OP_DEFS (to), lic->key);
	    }
	  siaddr = IC_RESULT (lic)->isaddr;
	  IC_RESULT (lic) = operandFromOperand (to);
	  IC_RESULT (lic)->isaddr = siaddr;
	}

      if (IS_SYMOP (to) &&
	  IC_RIGHT (lic) && IC_RIGHT (lic)->key == from->key)
	{
	  bitVectUnSetBit (OP_USES (from), lic->key);
	  OP_USES (to) = bitVectSetBit (OP_USES (to), lic->key);
	  siaddr = IC_RIGHT (lic)->isaddr;
	  IC_RIGHT (lic) = operandFromOperand (to);
	  IC_RIGHT (lic)->isaddr = siaddr;
	}

      if (IS_SYMOP (to) &&
	  IC_LEFT (lic) && IC_LEFT (lic)->key == from->key)
	{
	  bitVectUnSetBit (OP_USES (from), lic->key);
	  OP_USES (to) = bitVectSetBit (OP_USES (to), lic->key);
	  siaddr = IC_LEFT (lic)->isaddr;
	  IC_LEFT (lic) = operandFromOperand (to);
	  IC_LEFT (lic)->isaddr = siaddr;
	}
    }
}

/*-----------------------------------------------------------------*/
/* iCodeKeyIs - if the icode keys match then return 1              */
/*-----------------------------------------------------------------*/
DEFSETFUNC (iCodeKeyIs)
{
  cseDef *cdp = item;
  V_ARG (int, key);

  if (cdp->diCode->key == key)
    return 1;
  else
    return 0;
}

/*-----------------------------------------------------------------*/
/* removeFromInExprs - removes an icode from inexpressions         */
/*-----------------------------------------------------------------*/
DEFSETFUNC (removeFromInExprs)
{
  eBBlock *ebp = item;
  V_ARG (iCode *, ic);
  V_ARG (operand *, from);
  V_ARG (operand *, to);
  V_ARG (eBBlock *, cbp);

  if (ebp->visited)
    return 0;

  ebp->visited = 1;
  deleteItemIf (&ebp->inExprs, iCodeKeyIs, ic->key);
  if (ebp != cbp && !bitVectBitValue (cbp->domVect, ebp->bbnum))
    replaceAllSymBySym (ebp->sch, from, to, &ebp->ndompset);

  applyToSet (ebp->succList, removeFromInExprs, ic, from, to, cbp);
  return 0;
}

/*-----------------------------------------------------------------*/
/* isGlobalInNearSpace - return TRUE if valriable is a globalin data */
/*-----------------------------------------------------------------*/
static bool 
isGlobalInNearSpace (operand * op)
{
  sym_link *type = getSpec (operandType (op));
  /* this is 8051 specific: optimization
     suggested by Jean-Louis VERN, with 8051s we have no
     advantage of putting variables in near space into
     registers */
  if (isOperandGlobal (op) && !IN_FARSPACE (SPEC_OCLS (type)) &&
      IN_DIRSPACE (SPEC_OCLS (type)))
    return TRUE;
  else
    return FALSE;
}

/*-----------------------------------------------------------------*/
/* findCheaperOp - cseBBlock support routine, will check to see if */
/*              we have a operand previously defined               */
/*-----------------------------------------------------------------*/
DEFSETFUNC (findCheaperOp)
{
  cseDef *cdp = item;
  V_ARG (operand *, cop);
  V_ARG (operand **, opp);

  /* if we have already found it */
  if (*opp)
    return 1;

  /* not found it yet check if this is the one */
  /* and this is not the defining one          */
  if (cop->key == cdp->key)
    {

      /* do a special check this will help in */
      /* constant propagation & dead code elim */
      /* for assignments only                 */
      if (cdp->diCode->op == '=') {
	/* if the result is volatile then return result */
	if (IS_OP_VOLATILE (IC_RESULT (cdp->diCode)))
	  *opp = IC_RESULT (cdp->diCode);
	else 
	  /* if this is a straight assignment and
	     left is a temp then prefer the temporary to the
	     true symbol */
	  if (!POINTER_SET (cdp->diCode) &&
	      IS_ITEMP (IC_RESULT (cdp->diCode)) &&
	      IS_TRUE_SYMOP (IC_RIGHT (cdp->diCode)))
	    *opp = IC_RESULT (cdp->diCode);
	  else {
	    /* if straight assignement && and both
	       are temps then prefer the one that
	       will not need extra space to spil, also
	       take into consideration if right side
	       an induction variable
	    */
	    if (!POINTER_SET (cdp->diCode) &&
		IS_ITEMP (IC_RESULT (cdp->diCode)) &&
		IS_ITEMP (IC_RIGHT (cdp->diCode)) &&
		!OP_SYMBOL (IC_RIGHT (cdp->diCode))->isind &&
		((!SPIL_LOC (IC_RIGHT (cdp->diCode)) &&
		  SPIL_LOC (IC_RESULT (cdp->diCode))) ||
		 (SPIL_LOC (IC_RESULT (cdp->diCode)) &&
		  SPIL_LOC (IC_RESULT (cdp->diCode)) ==
		  SPIL_LOC (IC_RIGHT (cdp->diCode)))))
	      *opp = IC_RESULT (cdp->diCode);
	    else
	      *opp = IC_RIGHT (cdp->diCode);
	  }
      }
      else
	*opp = IC_RESULT (cdp->diCode);
    }

  /* if this is an assign to a temp. then check
     if the right side is this then return this */
  if (IS_TRUE_SYMOP (cop) &&
      cdp->diCode->op == '=' &&
      !POINTER_SET (cdp->diCode) &&
      cop->key == IC_RIGHT (cdp->diCode)->key &&
      !isGlobalInNearSpace (IC_RIGHT (cdp->diCode)) &&
      IS_ITEMP (IC_RESULT (cdp->diCode)))
    *opp = IC_RESULT (cdp->diCode);

  if ((*opp) && 
      (isOperandLiteral(*opp) ||
       (SPEC_USIGN(operandType (cop))==SPEC_USIGN(operandType (*opp)) &&
	(SPEC_LONG(operandType (cop))==SPEC_LONG(operandType (*opp))))))
    {

      if ((isGlobalInNearSpace (cop) &&
	   !isOperandLiteral (*opp)) ||
	  isOperandVolatile (*opp, FALSE)
	)
	{
	  *opp = NULL;
	  return 0;
	}

      if (cop->key == (*opp)->key)
	{
	  *opp = NULL;
	  return 0;
	}

      if ((*opp)->isaddr != cop->isaddr && IS_ITEMP (cop))
	{
	  *opp = operandFromOperand (*opp);
	  (*opp)->isaddr = cop->isaddr;
	}

      return 1;

    }
  *opp=NULL;
  return 0;
}

/*-----------------------------------------------------------------*/
/* findPointerSet - finds the right side of a pointer set op       */
/*-----------------------------------------------------------------*/
DEFSETFUNC (findPointerSet)
{
  cseDef *cdp = item;
  V_ARG (operand *, op);
  V_ARG (operand **, opp);
  V_ARG (operand *, rop);

  if (POINTER_SET (cdp->diCode) &&
      IC_RESULT (cdp->diCode)->key == op->key &&
      !isOperandVolatile (IC_RESULT (cdp->diCode), TRUE) &&
      !isOperandVolatile (IC_RIGHT (cdp->diCode), TRUE) &&
      getSize (operandType (IC_RIGHT (cdp->diCode))) ==
      getSize (operandType (rop)))
    {
      *opp = IC_RIGHT (cdp->diCode);
      return 1;
    }

  return 0;
}

/*-----------------------------------------------------------------*/
/* findPrevIc - cseBBlock support function will return the iCode   */
/*              which matches the current one                      */
/*-----------------------------------------------------------------*/
DEFSETFUNC (findPrevIc)
{
  cseDef *cdp = item;
  V_ARG (iCode *, ic);
  V_ARG (iCode **, icp);

  /* if already found */
  if (*icp)
    return 1;

  /* if the iCodes are the same */
  if (isiCodeEqual (ic, cdp->diCode) &&
      isOperandEqual (cdp->sym, IC_RESULT (cdp->diCode)))
    {
      *icp = cdp->diCode;
      return 1;
    }

  /* if iCodes are not the same */
  /* see the operands maybe interchanged */
  if (ic->op == cdp->diCode->op &&
      (ic->op == '+' || ic->op == '*') &&
      isOperandEqual (IC_LEFT (ic), IC_RIGHT (cdp->diCode)) &&
      isOperandEqual (IC_RIGHT (ic), IC_LEFT (cdp->diCode)))
    {
      *icp = cdp->diCode;
      return 1;
    }

  return 0;
}

/*-------------------------------------------------------------------*/
/* ifAssignedFromGlobal - if definition is an assignment from global */
/*-------------------------------------------------------------------*/
DEFSETFUNC (ifAssignedFromGlobal)
{
  cseDef *cdp = item;
  iCode *dic=cdp->diCode;

  if (dic->op=='=' && isOperandGlobal(IC_RIGHT(dic))) {
    return 1;
  }
  return 0;
}

/*-----------------------------------------------------------------*/
/* ifDefGlobal - if definition is global                           */
/*-----------------------------------------------------------------*/
DEFSETFUNC (ifDefGlobal)
{
  cseDef *cdp = item;

  return (isOperandGlobal (cdp->sym));
}

/*-----------------------------------------------------------------*/
/* ifAnyGetPointer - if get pointer icode                          */
/*-----------------------------------------------------------------*/
DEFSETFUNC (ifAnyGetPointer)
{
  cseDef *cdp = item;

  if (cdp->diCode && POINTER_GET (cdp->diCode))
    return 1;
  return 0;
}

/*-----------------------------------------------------------------*/
/* ifOperandsHave - if any of the operand are the same as this     */
/*-----------------------------------------------------------------*/
DEFSETFUNC (ifOperandsHave)
{
  cseDef *cdp = item;
  V_ARG (operand *, op);


  if (IC_LEFT (cdp->diCode) &&
      IS_SYMOP (IC_LEFT (cdp->diCode)) &&
      IC_LEFT (cdp->diCode)->key == op->key)
    return 1;

  if (IC_RIGHT (cdp->diCode) &&
      IS_SYMOP (IC_RIGHT (cdp->diCode)) &&
      IC_RIGHT (cdp->diCode)->key == op->key)
    return 1;

  /* or if any of the operands are volatile */
  if (IC_LEFT (cdp->diCode) &&
      IS_OP_VOLATILE (IC_LEFT (cdp->diCode)))
    return 1;

  if (IC_RIGHT (cdp->diCode) &&
      IS_OP_VOLATILE (IC_RIGHT (cdp->diCode)))
    return 1;


  if (IC_RESULT (cdp->diCode) &&
      IS_OP_VOLATILE (IC_RESULT (cdp->diCode)))
    return 1;

  return 0;
}

/*-----------------------------------------------------------------*/
/* ifDefSymIs - if a definition is found in the set                */
/*-----------------------------------------------------------------*/
int 
ifDefSymIs (set * cseSet, operand * sym)
{
  cseDef *loop;
  set *sl;

  if (!sym || !IS_SYMOP (sym))
    return 0;
  for (sl = cseSet; sl; sl = sl->next)
    {
      loop = sl->item;
      if (loop->sym->key == sym->key)
	return 1;
    }
  return 0;
}


/*-----------------------------------------------------------------*/
/* ifDefSymIsX - will return 1 if the symbols match                */
/*-----------------------------------------------------------------*/
DEFSETFUNC (ifDefSymIsX)
{
  cseDef *cdp = item;
  V_ARG (operand *, op);

  if (op && cdp->sym)
    return cdp->sym->key == op->key;
  else
    return (isOperandEqual (cdp->sym, op));

}


/*-----------------------------------------------------------------*/
/* ifDiCodeIs - returns truw if diCode is same                     */
/*-----------------------------------------------------------------*/
int 
ifDiCodeIs (set * cseSet, iCode * ic)
{
  cseDef *loop;
  set *sl;

  if (!ic)
    return 0;

  for (sl = cseSet; sl; sl = sl->next)
    {
      loop = sl->item;
      if (loop->diCode == ic)
	return 1;
    }
  return 0;

}

/*-----------------------------------------------------------------*/
/* ifPointerGet - returns true if the icode is pointer get sym     */
/*-----------------------------------------------------------------*/
DEFSETFUNC (ifPointerGet)
{
  cseDef *cdp = item;
  V_ARG (operand *, op);
  iCode *dic = cdp->diCode;
  operand *left = IC_LEFT (cdp->diCode);

  if (POINTER_GET (dic) && left->key == op->key)
    return 1;

  return 0;
}

/*-----------------------------------------------------------------*/
/* ifPointerSet - returns true if the icode is pointer set sym     */
/*-----------------------------------------------------------------*/
DEFSETFUNC (ifPointerSet)
{
  cseDef *cdp = item;
  V_ARG (operand *, op);

  if (POINTER_SET (cdp->diCode) &&
      IC_RESULT (cdp->diCode)->key == op->key)
    return 1;

  return 0;
}

/*-----------------------------------------------------------------*/
/* ifDiCodeIsX - will return 1 if the symbols match                 */
/*-----------------------------------------------------------------*/
DEFSETFUNC (ifDiCodeIsX)
{
  cseDef *cdp = item;
  V_ARG (iCode *, ic);

  return cdp->diCode == ic;

}

/*-----------------------------------------------------------------*/
/* algebraicOpts - does some algebraic optimizations               */
/*-----------------------------------------------------------------*/
void 
algebraicOpts (iCode * ic)
{
  /* we don't deal with the following iCodes
     here */
  if (ic->op == IFX ||
      ic->op == IPUSH ||
      ic->op == IPOP ||
      ic->op == CALL ||
      ic->op == PCALL ||
      ic->op == RETURN ||
      POINTER_GET (ic))
    return;

  /* if both operands present & ! IFX */
  /* then if they are both literal we */
  /* perform the operation right now  */
  if (IC_RESULT (ic) &&
      IC_RIGHT (ic) &&
      IC_LEFT (ic) &&
      IS_OP_LITERAL (IC_LEFT (ic)) &&
      IS_OP_LITERAL (IC_RIGHT (ic)))
    {

      IC_RIGHT (ic) = operandOperation (IC_LEFT (ic),
					IC_RIGHT (ic),
					ic->op,
					operandType (IC_RESULT (ic)));
      ic->op = '=';
      IC_LEFT (ic) = NULL;
      SET_RESULT_RIGHT (ic);
      return;

    }
  /* if not ifx & only one operand present */
  if (IC_RESULT (ic) &&
      IC_LEFT (ic) &&
      IS_OP_LITERAL (IC_LEFT (ic)) &&
      !IC_RIGHT (ic))
    {

      IC_RIGHT (ic) = operandOperation (IC_LEFT (ic),
					IC_RIGHT (ic),
					ic->op,
					operandType (IC_RESULT (ic)));
      ic->op = '=';
      IC_LEFT (ic) = NULL;
      SET_RESULT_RIGHT (ic);
      return;
    }


  /* a special case : or in short a kludgy solution will think
     about a better solution over a glass of wine someday */
  if (ic->op == GET_VALUE_AT_ADDRESS)
    {

      if (IS_ITEMP (IC_RESULT (ic)) &&
	  IS_TRUE_SYMOP (IC_LEFT (ic)))
	{

	  ic->op = '=';
	  IC_RIGHT (ic) = operandFromOperand (IC_LEFT (ic));
	  IC_RIGHT (ic)->isaddr = 0;
	  IC_LEFT (ic) = NULL;
	  IC_RESULT (ic) = operandFromOperand (IC_RESULT (ic));
	  IC_RESULT (ic)->isaddr = 0;
	  setOperandType (IC_RESULT (ic), operandType (IC_RIGHT (ic)));
	  return;
	}

      if (IS_ITEMP (IC_LEFT (ic)) &&
	  IS_ITEMP (IC_RESULT (ic)) &&
/*      !OP_SYMBOL(IC_RESULT(ic))->isreqv && */
/*      !OP_SYMBOL(IC_LEFT(ic))->isreqv && */
	  !IC_LEFT (ic)->isaddr)
	{
	  ic->op = '=';
	  IC_RIGHT (ic) = operandFromOperand (IC_LEFT (ic));
	  IC_RIGHT (ic)->isaddr = 0;
	  IC_RESULT (ic) = operandFromOperand (IC_RESULT (ic));
	  IC_RESULT (ic)->isaddr = 0;
	  IC_LEFT (ic) = NULL;
	  return;
	}

    }


  /* depending on the operation */
  switch (ic->op)
    {
    case '+':
      /* if adding the same thing change to left shift by 1 */
      if (IC_LEFT (ic)->key == IC_RIGHT (ic)->key &&
	  !IS_FLOAT (operandType (IC_RESULT (ic))))
	{
	  ic->op = LEFT_OP;
	  IC_RIGHT (ic) = operandFromLit (1);
	  return;
	}
      /* if addition then check if one of them is a zero */
      /* if yes turn it  into assignmnt */
      if (IS_OP_LITERAL (IC_LEFT (ic)) &&
	  operandLitValue (IC_LEFT (ic)) == 0.0)
	{

	  ic->op = '=';
	  IC_LEFT (ic) = NULL;
	  SET_ISADDR (IC_RESULT (ic), 0);
	  SET_ISADDR (IC_RIGHT (ic), 0);
	  return;
	}
      if (IS_OP_LITERAL (IC_RIGHT (ic)) &&
	  operandLitValue (IC_RIGHT (ic)) == 0.0)
	{

	  ic->op = '=';
	  IC_RIGHT (ic) = IC_LEFT (ic);
	  IC_LEFT (ic) = 0;
	  SET_ISADDR (IC_RIGHT (ic), 0);
	  SET_ISADDR (IC_RESULT (ic), 0);
	  return;
	}
      break;
    case '-':
      /* if subtracting the the same thing then zero     */
      if (IC_LEFT (ic)->key == IC_RIGHT (ic)->key)
	{
	  ic->op = '=';
	  IC_RIGHT (ic) = operandFromLit (0);
	  IC_LEFT (ic) = NULL;
	  IC_RESULT (ic) = operandFromOperand (IC_RESULT (ic));
	  IC_RESULT (ic)->isaddr = 0;
	  return;
	}

      /* if subtraction then check if one of the operand */
      /* is zero then depending on which operand change  */
      /* to assignment or unary minus                    */
      if (IS_OP_LITERAL (IC_RIGHT (ic)) &&
	  operandLitValue (IC_RIGHT (ic)) == 0.0)
	{
	  /* right size zero change to assignment */
	  ic->op = '=';
	  IC_RIGHT (ic) = IC_LEFT (ic);
	  IC_LEFT (ic) = NULL;
	  SET_ISADDR (IC_RIGHT (ic), 0);
	  SET_ISADDR (IC_RESULT (ic), 0);
	  return;
	}
      if (IS_OP_LITERAL (IC_LEFT (ic)) &&
	  operandLitValue (IC_LEFT (ic)) == 0.0)
	{
	  /* left zero turn into an unary minus */
	  ic->op = UNARYMINUS;
	  IC_LEFT (ic) = IC_RIGHT (ic);
	  IC_RIGHT (ic) = NULL;
	  return;
	}
      break;
      /* if multiplication then check if either of */
      /* them is zero then the result is zero      */
      /* if either of them is one then result is   */
      /* the other one                             */
    case '*':
      if (IS_OP_LITERAL (IC_LEFT (ic)))
	{

	  if (operandLitValue (IC_LEFT (ic)) == 0.0)
	    {
	      ic->op = '=';
	      IC_RIGHT (ic) = IC_LEFT (ic);
	      IC_LEFT (ic) = NULL;
	      SET_RESULT_RIGHT (ic);
	      return;
	    }
	  if (operandLitValue (IC_LEFT (ic)) == 1.0)
	    {
	      ic->op = '=';
	      IC_LEFT (ic) = NULL;
	      SET_RESULT_RIGHT (ic);
	      return;
	    }
	}

      if (IS_OP_LITERAL (IC_RIGHT (ic)))
	{

	  if (operandLitValue (IC_RIGHT (ic)) == 0.0)
	    {
	      ic->op = '=';
	      IC_LEFT (ic) = NULL;
	      SET_RESULT_RIGHT (ic);
	      return;
	    }

	  if (operandLitValue (IC_RIGHT (ic)) == 1.0)
	    {
	      ic->op = '=';
	      IC_RIGHT (ic) = IC_LEFT (ic);
	      IC_LEFT (ic) = NULL;
	      SET_RESULT_RIGHT (ic);
	      return;
	    }
	}
      break;
    case '/':
      /* if division by self then 1 */
      if (IC_LEFT (ic)->key == IC_RIGHT (ic)->key)
	{
	  ic->op = '=';
	  IC_RIGHT (ic) = operandFromLit (1);
	  IC_LEFT (ic) = NULL;
	  IC_RESULT (ic) = operandFromOperand (IC_RESULT (ic));
	  IC_RESULT (ic)->isaddr = 0;
	}
      /* if this is a division then check if right */
      /* is one then change it to an assignment    */
      if (IS_OP_LITERAL (IC_RIGHT (ic)) &&
	  operandLitValue (IC_RIGHT (ic)) == 1.0)
	{

	  ic->op = '=';
	  IC_RIGHT (ic) = IC_LEFT (ic);
	  IC_LEFT (ic) = NULL;
	  SET_RESULT_RIGHT (ic);
	  return;
	}
      break;
      /* if both are the same for an comparison operators */
    case EQ_OP:
    case LE_OP:
    case GE_OP:
      if (isOperandEqual (IC_LEFT (ic), IC_RIGHT (ic)))
	{
	  ic->op = '=';
	  IC_RIGHT (ic) = operandFromLit (1);
	  IC_LEFT (ic) = NULL;
	  SET_RESULT_RIGHT (ic);
	}
      break;
    case NE_OP:
    case '>':
    case '<':
      if (isOperandEqual (IC_LEFT (ic), IC_RIGHT (ic)))
	{
	  ic->op = '=';
	  IC_RIGHT (ic) = operandFromLit (0);
	  IC_LEFT (ic) = NULL;
	  SET_RESULT_RIGHT (ic);
	}
      break;
    case CAST:
	    {
		    sym_link *otype = operandType(IC_RIGHT(ic));
		    sym_link *ctype = operandType(IC_LEFT(ic));
		    /* if this is a cast of a literal value */
		    if (IS_OP_LITERAL (IC_RIGHT (ic)) &&
			!(IS_GENPTR(ctype) && (IS_PTR(otype) && !IS_GENPTR(otype)))) {
			    ic->op = '=';
			    IC_RIGHT (ic) =
				    operandFromValue (valCastLiteral (operandType (IC_LEFT (ic)),
								      operandLitValue (IC_RIGHT (ic))));
			    IC_LEFT (ic) = NULL;
			    SET_ISADDR (IC_RESULT (ic), 0);
		    }
		    /* if casting to the same */
		    if (compareType (operandType (IC_RESULT (ic)),
				     operandType (IC_RIGHT (ic))) == 1) {
			    ic->op = '=';
			    IC_LEFT (ic) = NULL;
			    SET_ISADDR (IC_RESULT (ic), 0);
		    }
	    }
	    break;
    case '!':
      if (IS_OP_LITERAL (IC_LEFT (ic)))
	{
	  ic->op = '=';
	  IC_RIGHT (ic) =
	    (operandLitValue (IC_LEFT (ic)) == 0 ?
	     operandFromLit (1) : operandFromLit (0));
	  IC_LEFT (ic) = NULL;
	  SET_ISADDR (IC_RESULT (ic), 0);
	}
    }

  return;
}
#define OTHERS_PARM(s) (s->_isparm && !s->ismyparm)
/*-----------------------------------------------------------------*/
/* updateSpillLocation - keeps track of register spill location    */
/*-----------------------------------------------------------------*/
void 
updateSpillLocation (iCode * ic, int induction)
{

	sym_link *setype;

	if (POINTER_SET (ic))
		return;

	if (ic->nosupdate)
		return;

	/* for the form true_symbol := iTempNN */
	if (ASSIGN_ITEMP_TO_SYM (ic) && 
	    !SPIL_LOC (IC_RIGHT (ic))) {

		setype = getSpec (operandType (IC_RESULT (ic)));

		if (!OP_SYMBOL(IC_RIGHT (ic))->noSpilLoc &&
		    !IS_VOLATILE (setype) &&
		    !IN_FARSPACE (SPEC_OCLS (setype)) &&
		    !OTHERS_PARM (OP_SYMBOL (IC_RESULT (ic))))

			SPIL_LOC (IC_RIGHT (ic)) =
				IC_RESULT (ic)->operand.symOperand;
	}

	if (ASSIGN_ITEMP_TO_ITEMP (ic)) {
	  
		if (!SPIL_LOC (IC_RIGHT (ic)) &&
		    !bitVectBitsInCommon (OP_DEFS (IC_RIGHT (ic)), OP_USES (IC_RESULT (ic))) &&
		    OP_SYMBOL (IC_RESULT (ic))->isreqv) {

			setype = getSpec (operandType (IC_RESULT (ic)));
	      
			if (!OP_SYMBOL(IC_RIGHT (ic))->noSpilLoc &&
			    !IS_VOLATILE (setype) &&
			    !IN_FARSPACE (SPEC_OCLS (setype)) &&
			    !OTHERS_PARM (OP_SYMBOL (IC_RESULT (ic))))

				SPIL_LOC (IC_RIGHT (ic)) =
					SPIL_LOC (IC_RESULT (ic));
		}
		/* special case for inductions */
		if (induction && 
		    OP_SYMBOL(IC_RIGHT(ic))->isreqv && 
		    !OP_SYMBOL(IC_RESULT (ic))->noSpilLoc &&
		    !SPIL_LOC(IC_RESULT(ic))) {
			SPIL_LOC (IC_RESULT (ic)) = SPIL_LOC (IC_RIGHT (ic));
		}
	}
}
/*-----------------------------------------------------------------*/
/* setUsesDef - sets the uses def bitvector for a given operand    */
/*-----------------------------------------------------------------*/
void 
setUsesDefs (operand * op, bitVect * bdefs,
	     bitVect * idefs, bitVect ** oud)
{
  /* compute the definitions alive at this point */
  bitVect *adefs = bitVectUnion (bdefs, idefs);

  /* of these definitions find the ones that are */
  /* for this operand */
  adefs = bitVectIntersect (adefs, OP_DEFS (op));

  /* these are the definitions that this operand can use */
  op->usesDefs = adefs;

  /* the out defs is an union */
  *oud = bitVectUnion (*oud, adefs);
}

/*-----------------------------------------------------------------*/
/* unsetDefsAndUses - clear this operation for the operands        */
/*-----------------------------------------------------------------*/
void 
unsetDefsAndUses (iCode * ic)
{
  if (ic->op == JUMPTABLE)
    return;

  /* take away this definition from the def chain of the */
  /* result & take away from use set of the operands */
  if (ic->op != IFX)
    {
      /* turn off def set */
      if (IS_SYMOP (IC_RESULT (ic)))
	{
	  if (!POINTER_SET (ic))
	    bitVectUnSetBit (OP_DEFS (IC_RESULT (ic)), ic->key);
	  else
	    bitVectUnSetBit (OP_USES (IC_RESULT (ic)), ic->key);
	}
      /* turn off the useSet for the operands */
      if (IS_SYMOP (IC_LEFT (ic)))
	bitVectUnSetBit (OP_USES (IC_LEFT (ic)), ic->key);

      if (IS_SYMOP (IC_RIGHT (ic)))
	bitVectUnSetBit (OP_USES (IC_RIGHT (ic)), ic->key);
    }
  else
    /* must be ifx turn off the use */ if (IS_SYMOP (IC_COND (ic)))
    bitVectUnSetBit (OP_USES (IC_COND (ic)), ic->key);
}

/*-----------------------------------------------------------------*/
/* ifxOptimize - changes ifx conditions if it can                  */
/*-----------------------------------------------------------------*/
void 
ifxOptimize (iCode * ic, set * cseSet,
	     int computeOnly,
	     eBBlock * ebb, int *change,
	     eBBlock ** ebbs, int count)
{
  operand *pdop;
  symbol *label;

  /* if the condition can be replaced */
  if (!computeOnly)
    {
      pdop = NULL;
      applyToSetFTrue (cseSet, findCheaperOp, IC_COND (ic), &pdop);
      if (pdop)
	{
	  IC_COND (ic) = pdop;
	  (*change)++;
	}
    }

  /* if the conditional is a literal then */
  if (IS_OP_LITERAL (IC_COND (ic)))
    {

      if ((operandLitValue (IC_COND (ic)) != 0.0) && IC_TRUE (ic))
	{

	  /* change to a goto */
	  ic->op = GOTO;
	  IC_LABEL (ic) = IC_TRUE (ic);
	  (*change)++;

	}
      else
	{

	  if (!operandLitValue (IC_COND (ic)) && IC_FALSE (ic))
	    {
	      ic->op = GOTO;
	      IC_LABEL (ic) = IC_FALSE (ic);
	      (*change)++;

	    }
	  else
	    {
	      /* then kill this if condition */
	      remiCodeFromeBBlock (ebb, ic);
	    }
	}

      /* now we need to recompute the control flow */
      /* since the control flow has changed        */
      /* this is very expensive but it does not happen */
      /* too often, if it does happen then the user pays */
      /* the price */
      computeControlFlow (ebbs, count, 1);
      if (!options.lessPedantic) {
	werror (W_CONTROL_FLOW, ic->filename, ic->lineno);
      }
      return;
    }

  /* if there is only one successor and that successor
     is the same one we are conditionally going to then
     we can remove this conditional statement */
  label = (IC_TRUE (ic) ? IC_TRUE (ic) : IC_FALSE (ic));
  if (elementsInSet (ebb->succList) == 1 &&
      isinSet (ebb->succList, eBBWithEntryLabel (ebbs, label, count)))
    {

      remiCodeFromeBBlock (ebb, ic);
      computeControlFlow (ebbs, count, 1);
      if (!options.lessPedantic) {
	werror (W_CONTROL_FLOW, ic->filename, ic->lineno);
      }
      return;
    }


  /* if it remains an IFX the update the use Set */
  OP_USES (IC_COND (ic)) = bitVectSetBit (OP_USES (IC_COND (ic)), ic->key);
  setUsesDefs (IC_COND (ic), ebb->defSet, ebb->outDefs, &ebb->usesDefs);
  return;
}

/*-----------------------------------------------------------------*/
/* diCodeForSym - finds the definiting instruction for a symbol    */
/*-----------------------------------------------------------------*/
DEFSETFUNC (diCodeForSym)
{
  cseDef *cdp = item;
  V_ARG (operand *, sym);
  V_ARG (iCode **, dic);

  /* if already found */
  if (*dic)
    return 0;

  /* if not if this is the defining iCode */
  if (sym->key == cdp->key)
    {
      *dic = cdp->diCode;
      return 1;
    }

  return 0;
}

/*-----------------------------------------------------------------*/
/* constFold - does some constant folding                          */
/*-----------------------------------------------------------------*/
int 
constFold (iCode * ic, set * cseSet)
{
  iCode *dic = NULL;
  iCode *ldic = NULL;
  /* this routine will change
     a = b + 10;
     c = a + 10;
     to
     c = b + 20; */

  /* deal with only + & - */
  if (ic->op != '+' &&
      ic->op != '-')
    return 0;

  /* this check is a hueristic to prevent live ranges
     from becoming too long */
  if (IS_PTR (operandType (IC_RESULT (ic))))
    return 0;

  /* check if operation with a literal */
  if (!IS_OP_LITERAL (IC_RIGHT (ic)))
    return 0;

  /* check if we can find a definition for the
     right hand side */
  if (!(applyToSet (cseSet, diCodeForSym, IC_LEFT (ic), &dic)))
    return 0;

  /* check that this is also a +/-  */
  if (dic->op != '+' && dic->op != '-')
    return 0;

  /* with a literal */
  if (!IS_OP_LITERAL (IC_RIGHT (dic)))
    return 0;

  /* find the definition of the left operand
     of dic.then check if this defined with a
     get_pointer return 0 if the pointer size is
     less than 2 (MCS51 specific) */
  if (!(applyToSet (cseSet, diCodeForSym, IC_LEFT (dic), &ldic)))
    return 0;

  if (POINTER_GET (ldic) && getSize (operandType (IC_LEFT (ldic))) <= 1)
    return 0;

  /* it is if the operations are the same */
  /* the literal parts need to be added  */
  IC_LEFT (ic) = operandFromOperand (IC_LEFT (dic));
  if (ic->op == dic->op)
    IC_RIGHT (ic) = operandFromLit (operandLitValue (IC_RIGHT (ic)) +
				    operandLitValue (IC_RIGHT (dic)));
  else
    IC_RIGHT (ic) = operandFromLit (operandLitValue (IC_RIGHT (ic)) -
				    operandLitValue (IC_RIGHT (dic)));

  if (IS_ITEMP (IC_RESULT (ic)))
    {
      SPIL_LOC (IC_RESULT (ic)) = NULL;
      OP_SYMBOL(IC_RESULT (ic))->noSpilLoc = 1;
    }


  return 1;
}

/*-----------------------------------------------------------------*/
/* deleteGetPointers - called when a pointer is passed as parm     */
/* will delete from cseSet all get pointers computed from this     */
/* pointer. A simple ifOperandsHave is not good enough here        */
/*-----------------------------------------------------------------*/
static void 
deleteGetPointers (set ** cseSet, set ** pss, operand * op, eBBlock * ebb)
{
  set *compItems = NULL;
  cseDef *cdp;
  operand *cop;

  /* easy return */
  if (!*cseSet && !*pss)
    return;

  /* first find all items computed from this operand .
     This done fairly simply go thru the list and find
     those that are computed by arthimetic with this
     op */
  for (cdp = setFirstItem (*cseSet); cdp; cdp = setNextItem (*cseSet))
    {
      if (IS_ARITHMETIC_OP (cdp->diCode))
	{
	  if (isOperandEqual (IC_LEFT (cdp->diCode), op) ||
	      isOperandEqual (IC_RIGHT (cdp->diCode), op))
	    {
	      /* save it in our list of items */
	      addSet (&compItems, IC_RESULT (cdp->diCode));
	    }
	  /* also check for those computed from our computed
	     list . This will take care of situations like
	     iTemp1 = iTemp0 + 8;
	     iTemp2 = iTemp1 + 8; */
	  if (isinSetWith (compItems, (void*)IC_LEFT (cdp->diCode), 
			   (insetwithFunc)isOperandEqual) ||
	      isinSetWith (compItems, (void*)IC_RIGHT (cdp->diCode), 
			   (insetwithFunc)isOperandEqual))
	    {
	      addSet (&compItems, IC_RESULT (cdp->diCode));
	    }
	}
    }

  /* now delete all pointer gets with this op */
  deleteItemIf (cseSet, ifPointerGet, op);
  deleteItemIf (pss, ifPointerSet, op);

  /* set the bit vector used by dataFlow computation later */
  ebb->ptrsSet = bitVectSetBit (ebb->ptrsSet, op->key);
  /* now for the computed items */
  for (cop = setFirstItem (compItems); cop; cop = setNextItem (compItems))
    {
      ebb->ptrsSet = bitVectSetBit (ebb->ptrsSet, cop->key);
      deleteItemIf (cseSet, ifPointerGet, cop);
      deleteItemIf (pss, ifPointerSet, cop);
    }
}

/*-----------------------------------------------------------------*/
/* delGetPointerSucc - delete get pointer from inExprs of succ with */
/*                     dfnum > supplied                            */
/*-----------------------------------------------------------------*/
DEFSETFUNC (delGetPointerSucc)
{
  eBBlock *ebp = item;
  V_ARG (operand *, op);
  V_ARG (int, dfnum);

  if (ebp->visited)
    return 0;

  ebp->visited = 1;
  if (ebp->dfnum > dfnum)
    {
      deleteItemIf (&ebp->inExprs, ifPointerGet, op);
    }

  return applyToSet (ebp->succList, delGetPointerSucc, op, dfnum);
}

/*-----------------------------------------------------------------*/
/* fixUpTypes - KLUGE HACK fixup a lowering problem                */
/*-----------------------------------------------------------------*/
static void 
fixUpTypes (iCode * ic)
{
  sym_link *t1 = operandType (IC_LEFT (ic)), *t2;

  /* if (TARGET_IS_DS390) */
  if (options.model == MODEL_FLAT24)
    {
      /* hack-o-matic! */
      return;
    }

  /* for pointer_gets if the types of result & left r the
     same then change it type of result to next */
  if (IS_PTR (t1) &&
      compareType (t2 = operandType (IC_RESULT (ic)), t1) == 1)
    {
      setOperandType (IC_RESULT (ic), t2->next);
    }
}

/*-----------------------------------------------------------------*/
/* cseBBlock - common subexpression elimination for basic blocks   */
/*             this is the hackiest kludgiest routine in the whole */
/*             system. also the most important, since almost all   */
/*             data flow related information is computed by it     */
/*-----------------------------------------------------------------*/
int 
cseBBlock (eBBlock * ebb, int computeOnly,
	   eBBlock ** ebbs, int count)
{
  set *cseSet;
  iCode *ic;
  int change = 0;
  int i;
  set *ptrSetSet = NULL;

  /* if this block is not reachable */
  if (ebb->noPath)
    return change;

  /* set of common subexpressions */
  cseSet = setFromSet (ebb->inExprs);

  /* these will be computed by this routine */
  setToNull ((void **) &ebb->outDefs);
  setToNull ((void **) &ebb->defSet);
  setToNull ((void **) &ebb->usesDefs);
  setToNull ((void **) &ebb->ptrsSet);
  setToNull ((void **) &ebb->addrOf);
  setToNull ((void **) &ebb->ldefs);

  ebb->outDefs = bitVectCopy (ebb->inDefs);
  bitVectDefault = iCodeKey;
  ebb->defSet = newBitVect (iCodeKey);
  ebb->usesDefs = newBitVect (iCodeKey);

  /* for all the instructions in this block do */
  for (ic = ebb->sch; ic; ic = ic->next)
    {

      iCode *pdic;
      operand *pdop;
      iCode *defic;

      if (SKIP_IC2 (ic))
	continue;

      /* if this is an assignment from true symbol
         to a temp then do pointer post inc/dec optimzation */
      if (ic->op == '=' && !POINTER_SET (ic) &&
	  IS_PTR (operandType (IC_RESULT (ic))))
	{
	  ptrPostIncDecOpt (ic);
	}

      /* clear the def & use chains for the operands involved */
      /* in this operation . since it can change due to opts  */
      unsetDefsAndUses (ic);

      if (ic->op == PCALL || ic->op == CALL || ic->op == RECEIVE)
	{
	  /* add to defSet of the symbol */
	  OP_DEFS (IC_RESULT (ic)) =
	    bitVectSetBit (OP_DEFS (IC_RESULT (ic)), ic->key);
	  /* add to the definition set of this block */
	  ebb->defSet = bitVectSetBit (ebb->defSet, ic->key);
	  ebb->ldefs = bitVectSetBit (ebb->ldefs, ic->key);
	  ebb->outDefs = bitVectCplAnd (ebb->outDefs, OP_DEFS (IC_RESULT (ic)));
	  setUsesDefs (IC_RESULT (ic), ebb->defSet, ebb->outDefs, &ebb->usesDefs);
	  /* delete global variables from the cseSet
	     since they can be modified by the function call */
	  deleteItemIf (&cseSet, ifDefGlobal);

	  /* and also itemps assigned from globals */
	  deleteItemIf (&cseSet, ifAssignedFromGlobal);

	  /* delete all getpointer iCodes from cseSet, this should
	     be done only for global arrays & pointers but at this
	     point we don't know if globals, so to be safe do all */
	  deleteItemIf (&cseSet, ifAnyGetPointer);
	}

      /* for pcall & ipush we need to add to the useSet */
      if ((ic->op == PCALL ||
	   ic->op == IPUSH ||
	   ic->op == IPOP ||
	   ic->op == SEND) &&
	  IS_SYMOP (IC_LEFT (ic)))
	{

	  /* check if they can be replaced */
	  if (!computeOnly)
	    {
	      pdop = NULL;
	      applyToSetFTrue (cseSet, findCheaperOp, IC_LEFT (ic), &pdop);
	      if (pdop)
		IC_LEFT (ic) = pdop;
	    }
	  /* the lookup could have changed it */
	  if (IS_SYMOP (IC_LEFT (ic)))
	    {
	      OP_USES (IC_LEFT (ic)) =
		bitVectSetBit (OP_USES (IC_LEFT (ic)), ic->key);
	      setUsesDefs (IC_LEFT (ic), ebb->defSet,
			   ebb->outDefs, &ebb->usesDefs);
	    }


	  /* if we a sending a pointer as a parameter
	     then kill all cse since the pointed to item
	     might be changed in the function being called */
	  if ((ic->op == IPUSH || ic->op == SEND) &&
	      IS_PTR (operandType (IC_LEFT (ic))))
	    {
	      deleteGetPointers (&cseSet, &ptrSetSet, IC_LEFT (ic), ebb);
	      ebb->ptrsSet = bitVectSetBit (ebb->ptrsSet, IC_LEFT (ic)->key);
	      for (i = 0; i < count; ebbs[i++]->visited = 0);
	      applyToSet (ebb->succList, delGetPointerSucc,
			  IC_LEFT (ic), ebb->dfnum);
	    }
	  continue;
	}

      /* if jumptable then mark the usage */
      if (ic->op == JUMPTABLE)
	{
	  OP_USES (IC_JTCOND (ic)) =
	    bitVectSetBit (OP_USES (IC_JTCOND (ic)), ic->key);
	  setUsesDefs (IC_JTCOND (ic), ebb->defSet,
		       ebb->outDefs, &ebb->usesDefs);
	  continue;
	}

      if (SKIP_IC (ic))
	continue;

      /* do some algebraic optimizations if possible */
      algebraicOpts (ic);
      while (constFold (ic, cseSet));

      /* small klugde */
      if (POINTER_GET (ic) && !IS_PTR (operandType (IC_LEFT (ic))))
	{
	  setOperandType (IC_LEFT (ic),
			  aggrToPtr (operandType (IC_LEFT (ic)), FALSE));
	  fixUpTypes (ic);

	}
      if (POINTER_SET (ic) && !IS_PTR (operandType (IC_RESULT (ic))))
	{
	  setOperandType (IC_RESULT (ic),
			  aggrToPtr (operandType (IC_RESULT (ic)), FALSE));
	}

      /* if this is a condition statment then */
      /* check if the condition can be replaced */
      if (ic->op == IFX)
	{
	  ifxOptimize (ic, cseSet, computeOnly,
		       ebb, &change,
		       ebbs, count);
	  continue;
	}

      /* if the assignment & result is a temp */
      /* see if we can replace it             */
      if (ic->op == '=')
	{

	  /* update the spill location for this */
	  updateSpillLocation (ic,0);

	  if (POINTER_SET (ic) &&
	      !(IS_BITFIELD (OP_SYMBOL (IC_RESULT (ic))->etype)))
	    {
	      pdop = NULL;
	      applyToSetFTrue (cseSet, findCheaperOp, IC_RESULT (ic), &pdop);
	      if (pdop && IS_ITEMP (pdop) && !computeOnly)
		IC_RESULT (ic) = pdop;
	    }
	}

      /* do the operand lookup i.e. for both the */
      /* right & left operand : check the cseSet */
      /* to see if they have been replaced if yes */
      /* then replace them with those from cseSet */
      /* left operand */
      /* and left is a symbol  */
      if (IS_SYMOP (IC_LEFT (ic)) &&
	  !computeOnly && ic->op != ADDRESS_OF)
	{

	  pdop = NULL;
	  applyToSetFTrue (cseSet, findCheaperOp, IC_LEFT (ic), &pdop);
	  if (pdop)
	    {
	      if (POINTER_GET (ic))
		{
		  if (IS_ITEMP (pdop) || IS_OP_LITERAL (pdop))
		    {
		      IC_LEFT (ic) = pdop;
		      change = 1;
		    }
		  /* check if there is a pointer set
		     for the same pointer visible if yes
		     then change this into an assignment */
		  pdop = NULL;
		  if (applyToSetFTrue (cseSet, findPointerSet, IC_LEFT (ic), &pdop, IC_RESULT (ic)) &&
		      !bitVectBitValue (ebb->ptrsSet, pdop->key))
		    {
		      ic->op = '=';
		      IC_LEFT (ic) = NULL;
		      IC_RIGHT (ic) = pdop;
		      SET_ISADDR (IC_RESULT (ic), 0);
		    }

		}
	      else
		{
		  IC_LEFT (ic) = pdop;
		  change = 1;
		}
	    }
	}

      /*right operand */
      if (IS_SYMOP (IC_RIGHT (ic)) && !computeOnly)
	{

	  pdop = NULL;
	  applyToSetFTrue (cseSet, findCheaperOp, IC_RIGHT (ic), &pdop);
	  if (pdop)
	    {
	      IC_RIGHT (ic) = pdop;
	      change = 1;
	    }
	}

      /* if left or right changed then do algebraic */
      if (change)
	{
	  algebraicOpts (ic);
	  while (constFold (ic, cseSet));
	}

      /* if after all this it becomes a assignment to self
         then delete it and continue */
      if (ASSIGNMENT_TO_SELF (ic))
	{
	  remiCodeFromeBBlock (ebb, ic);
	  continue;
	}

      /* now we will check to see if the entire */
      /* operation has been performed before    */
      /* and is available                       */
      /* don't do assignments they will be killed */
      /* by dead code elimination if required  do */
      /* it only if result is a temporary         */
      pdic = NULL;
      if (!(POINTER_GET (ic) &&
	    (IS_BITFIELD (OP_SYMBOL (IC_RESULT (ic))->etype) ||
	     isOperandVolatile (IC_LEFT (ic), TRUE) ||
	     bitVectBitValue (ebb->ndompset, IC_LEFT (ic)->key))) &&
	  !ASSIGNMENT (ic) &&
	  IS_ITEMP (IC_RESULT (ic)) &&
	  !computeOnly)
	{
	  applyToSet (cseSet, findPrevIc, ic, &pdic);
	  if (pdic && compareType (operandType (IC_RESULT (pdic)),
				 operandType (IC_RESULT (ic))) != 1)
	    pdic = NULL;
	}

#if 0
      /* if found then eliminate this and add to */
      /* to cseSet an element containing result */
      /* of this with previous opcode           */
      if (pdic)
	{
	  if (IS_ITEMP (IC_RESULT (ic)))
	    {
	      
	      /* replace in the remaining of this block */
	      replaceAllSymBySym (ic->next, IC_RESULT (ic), IC_RESULT (pdic), &ebb->ndompset);
	      /* remove this iCode from inexpressions of all
	         its successors, it cannot be in the in expressions
	         of any of the predecessors */
	      for (i = 0; i < count; ebbs[i++]->visited = 0);
	      applyToSet (ebb->succList, removeFromInExprs, ic, IC_RESULT (ic),
			  IC_RESULT (pdic), ebb);

	      /* if this was moved from another block */
	      /* then replace in those blocks too     */
	      if (ic->movedFrom)
		{
		  eBBlock *owner;
		  for (owner = setFirstItem (ic->movedFrom); owner;
		       owner = setNextItem (ic->movedFrom))
		    replaceAllSymBySym (owner->sch, IC_RESULT (ic), IC_RESULT (pdic), &owner->ndompset);
		}
	      pdic->movedFrom = unionSets (pdic->movedFrom, ic->movedFrom, THROW_NONE);
	    }
	  else
	    addSetHead (&cseSet, newCseDef (IC_RESULT (ic), pdic));

	  if (!computeOnly)
	    /* eliminate this */
	    remiCodeFromeBBlock (ebb, ic);

	  defic = pdic;
	  change++;

	  if (IS_ITEMP (IC_RESULT (ic)))
	    continue;

	}
      else
	{

	  /* just add this as a previous expression except in */
	  /* case of a pointer access in which case this is a */
	  /* usage not a definition                           */
	  if (!(POINTER_SET (ic)) && IC_RESULT (ic))
	    {
	      deleteItemIf (&cseSet, ifDefSymIsX, IC_RESULT (ic));
	      addSetHead (&cseSet, newCseDef (IC_RESULT (ic), ic));
	    }
	  defic = ic;

	}
#else
      /* Alternate code */
      if (pdic && IS_ITEMP(IC_RESULT(ic))) {
	  /* if previous definition found change this to an assignment */
	  ic->op = '=';
	  IC_LEFT(ic) = NULL;
	  IC_RIGHT(ic) = operandFromOperand(IC_RESULT(pdic));
	  SET_ISADDR(IC_RESULT(ic),0);
	  SET_ISADDR(IC_RIGHT (ic),0);	  
      }

      if (!(POINTER_SET (ic)) && IC_RESULT (ic)) {
	  deleteItemIf (&cseSet, ifDefSymIsX, IC_RESULT (ic));
	  addSetHead (&cseSet, newCseDef (IC_RESULT (ic), ic));
      }
      defic = ic;
#endif
      /* if assignment to a parameter which is not
         mine and type is a pointer then delete
         pointerGets to take care of aliasing */
      if (ASSIGNMENT (ic) &&
	  OTHERS_PARM (OP_SYMBOL (IC_RESULT (ic))) &&
	  IS_PTR (operandType (IC_RESULT (ic))))
	{
	  deleteGetPointers (&cseSet, &ptrSetSet, IC_RIGHT (ic), ebb);
	  for (i = 0; i < count; ebbs[i++]->visited = 0);
	  applyToSet (ebb->succList, delGetPointerSucc, IC_RIGHT (ic), ebb->dfnum);
	  ebb->ptrsSet = bitVectSetBit (ebb->ptrsSet, IC_RIGHT (ic)->key);
	}

      /* if this is a pointerget then see if we can replace
         this with a previously assigned pointer value */
      if (POINTER_GET (ic) &&
	  !(IS_BITFIELD (OP_SYMBOL (IC_RESULT (ic))->etype) ||
	    isOperandVolatile (IC_LEFT (ic), TRUE)))
	{
	  pdop = NULL;
	  applyToSet (ptrSetSet, findPointerSet, IC_LEFT (ic), &pdop, IC_RESULT (ic));
	  /* if we find it then locally replace all
	     references to the result with what we assigned */
	  if (pdop)
	    {
	      replaceAllSymBySym (ic->next, IC_RESULT (ic), pdop, &ebb->ndompset);
	    }
	}

      /* delete from the cseSet anything that has */
      /* operands matching the result of this     */
      /* except in case of pointer access         */
      if (!(POINTER_SET (ic)) && IC_RESULT (ic))
	{
	  deleteItemIf (&cseSet, ifOperandsHave, IC_RESULT (ic));
	  /* delete any previous definitions */
	  ebb->defSet = bitVectCplAnd (ebb->defSet, OP_DEFS (IC_RESULT (ic)));

	}

      /* add the left & right to the defUse set */
      if (IC_LEFT (ic) && IS_SYMOP (IC_LEFT (ic)))
	{
	  OP_USES (IC_LEFT (ic)) =
	    bitVectSetBit (OP_USES (IC_LEFT (ic)), ic->key);
	  setUsesDefs (IC_LEFT (ic), ebb->defSet, ebb->outDefs, &ebb->usesDefs);

	}

      if (IC_RIGHT (ic) && IS_SYMOP (IC_RIGHT (ic)))
	{
	  OP_USES (IC_RIGHT (ic)) =
	    bitVectSetBit (OP_USES (IC_RIGHT (ic)), ic->key);
	  setUsesDefs (IC_RIGHT (ic), ebb->defSet, ebb->outDefs, &ebb->usesDefs);

	}

      /* for the result it is special case, put the result */
      /* in the defuseSet if it a pointer or array access  */
      if (POINTER_SET (defic))
	{
	  OP_USES (IC_RESULT (ic)) =
	    bitVectSetBit (OP_USES (IC_RESULT (ic)), ic->key);
	  setUsesDefs (IC_RESULT (ic), ebb->defSet, ebb->outDefs, &ebb->usesDefs);
	  deleteItemIf (&cseSet, ifPointerGet, IC_RESULT (ic));
	  ebb->ptrsSet = bitVectSetBit (ebb->ptrsSet, IC_RESULT (ic)->key);
	  /* delete from inexpressions of all successors which
	     have dfNum > than this block */
	  for (i = 0; i < count; ebbs[i++]->visited = 0);
	  applyToSet (ebb->succList, delGetPointerSucc, IC_RESULT (ic), ebb->dfnum);

	  /* delete from cseSet all other pointer sets
	     for this operand */
	  deleteItemIf (&ptrSetSet, ifPointerSet, IC_RESULT (ic));
	  /* add to the local pointerset set */
	  addSetHead (&ptrSetSet, newCseDef (IC_RESULT (ic), ic));
	}
      else
	/* add the result to defintion set */ if (IC_RESULT (ic))
	{
	  OP_DEFS (IC_RESULT (ic)) =
	    bitVectSetBit (OP_DEFS (IC_RESULT (ic)), ic->key);
	  ebb->defSet = bitVectSetBit (ebb->defSet, ic->key);
	  ebb->outDefs = bitVectCplAnd (ebb->outDefs, OP_DEFS (IC_RESULT (ic)));
	  ebb->ldefs = bitVectSetBit (ebb->ldefs, ic->key);
	}


      /* if this is an addressof instruction then */
      /* put the symbol in the address of list &  */
      /* delete it from the cseSet                */
      if (defic->op == ADDRESS_OF)
	{
	  addSetHead (&ebb->addrOf, IC_LEFT (ic));
	  deleteItemIf (&cseSet, ifDefSymIsX, IC_LEFT (ic));
	}
    }

  setToNull ((void **) &ebb->outExprs);
  ebb->outExprs = cseSet;
  ebb->outDefs = bitVectUnion (ebb->outDefs, ebb->defSet);
  ebb->ptrsSet = bitVectUnion (ebb->ptrsSet, ebb->inPtrsSet);
  return change;
}

/*-----------------------------------------------------------------*/
/* cseAllBlocks - will sequentially go thru & do cse for all blocks */
/*-----------------------------------------------------------------*/
int 
cseAllBlocks (eBBlock ** ebbs, int count)
{
  int i;
  int change = 0;

  /* if optimization turned off */

  for (i = 0; i < count; i++)
    change += cseBBlock (ebbs[i], FALSE, ebbs, count);

  return change;
}

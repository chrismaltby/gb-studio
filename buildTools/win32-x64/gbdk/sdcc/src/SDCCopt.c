/*-------------------------------------------------------------------------
  SDCCopt.c - calls all the optimizations routines and does some of the
              hackier transformations, these include translating iCodes
	      to function calls and replacing local variables with their
	      register equivalents etc. Also contains the driver routine
	      for dead code elimination

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

/*-----------------------------------------------------------------*/
/* global variables */
int cseDefNum = 0;

char flowChanged = 0;


/*-----------------------------------------------------------------*/
/* printSymName - prints the symbol names                          */
/*-----------------------------------------------------------------*/
int 
printSymName (void *vsym)
{
  symbol *sym = vsym;
  fprintf (stdout, " %s ", sym->name);
  return 0;
}

/*-----------------------------------------------------------------*/
/* cnvToFcall - does the actual conversion to function call        */
/*-----------------------------------------------------------------*/
static void 
cnvToFcall (iCode * ic, eBBlock * ebp)
{
  iCode *ip;
  iCode *newic;
  operand *left;
  operand *right;
  symbol *func = NULL;
  int lineno = ic->lineno;
  int bytesPushed=0;

  ip = ic->next;		/* insertion point */
  /* remove it from the iCode */
  remiCodeFromeBBlock (ebp, ic);

  left = IC_LEFT (ic);
  right = IC_RIGHT (ic);

  switch (ic->op)
    {
    case '+':
      func = __fsadd;
      break;
    case '-':
      func = __fssub;
      break;
    case '/':
      func = __fsdiv;
      break;
    case '*':
      func = __fsmul;
      break;
    case EQ_OP:
      func = __fseq;
      break;
    case NE_OP:
      func = __fsneq;
      break;
    case '<':
      func = __fslt;
      break;
    case '>':
      func = __fsgt;
      break;
    case LE_OP:
      func = __fslteq;
      break;
    case GE_OP:
      func = __fsgteq;
      break;
    }

  /* if float support routines NOT compiled as reentrant */
  if (!options.float_rent)
    {

      /* first one */
      if (IS_REGPARM (FUNC_ARGS(func->type)->etype))
	{
	  newic = newiCode (SEND, IC_LEFT (ic), NULL);
	}
      else
	{
	  newic = newiCode ('=', NULL, IC_LEFT (ic));
	  IC_RESULT (newic) = operandFromValue (FUNC_ARGS(func->type));
	}

      addiCodeToeBBlock (ebp, newic, ip);
      newic->lineno = lineno;

      /* second one */
      if (IS_REGPARM (FUNC_ARGS(func->type)->next->etype))
	{
	  newic = newiCode (SEND, IC_LEFT (ic), NULL);
	}
      else
	{
	  newic = newiCode ('=', NULL, IC_RIGHT (ic));
	  IC_RESULT (newic) = operandFromValue (FUNC_ARGS(func->type)->next);
	}
      addiCodeToeBBlock (ebp, newic, ip);
      newic->lineno = lineno;

    }
  else
    {

      /* push right */
      if (IS_REGPARM (FUNC_ARGS(func->type)->next->etype))
	{
	  newic = newiCode (SEND, right, NULL);
	}
      else
	{
	  newic = newiCode (IPUSH, right, NULL);
	  newic->parmPush = 1;
	  bytesPushed+=4;
	}

      addiCodeToeBBlock (ebp, newic, ip);
      newic->lineno = lineno;

      /* insert push left */
      if (IS_REGPARM (FUNC_ARGS(func->type)->etype))
	{
	  newic = newiCode (SEND, left, NULL);
	}
      else
	{
	  newic = newiCode (IPUSH, left, NULL);
	  newic->parmPush = 1;
	  bytesPushed+=4;
	}
      addiCodeToeBBlock (ebp, newic, ip);
      newic->lineno = lineno;
    }
  /* insert the call */
  newic = newiCode (CALL, operandFromSymbol (func), NULL);
  IC_RESULT (newic) = IC_RESULT (ic);
  newic->lineno = lineno;
  newic->parmBytes+=bytesPushed;
  addiCodeToeBBlock (ebp, newic, ip);
}

/*-----------------------------------------------------------------*/
/* cnvToFloatCast - converts casts to floats to function calls     */
/*-----------------------------------------------------------------*/
static void 
cnvToFloatCast (iCode * ic, eBBlock * ebp)
{
  iCode *ip, *newic;
  symbol *func;
  sym_link *type = operandType (IC_RIGHT (ic));
  int linenno = ic->lineno;
  int bwd, su;

  ip = ic->next;
  /* remove it from the iCode */
  remiCodeFromeBBlock (ebp, ic);
  /* depending on the type */
  for (bwd = 0; bwd < 3; bwd++)
    {
      for (su = 0; su < 2; su++)
	{
	  if (compareType (type, __multypes[bwd][su]) == 1)
	    {
	      func = __conv[0][bwd][su];
	      goto found;
	    }
	}
    }
  assert (0);
found:

  /* if float support routines NOT compiled as reentrant */
  if (!options.float_rent)
    {
      /* first one */
      if (IS_REGPARM (FUNC_ARGS(func->type)->etype))
	newic = newiCode (SEND, IC_RIGHT (ic), NULL);
      else
	{
	  newic = newiCode ('=', NULL, IC_RIGHT (ic));
	  IC_RESULT (newic) = operandFromValue (FUNC_ARGS(func->type));
	}
      addiCodeToeBBlock (ebp, newic, ip);
      newic->lineno = linenno;

    }
  else
    {
      /* push the left */
      if (IS_REGPARM (FUNC_ARGS(func->type)->etype))
	newic = newiCode (SEND, IC_RIGHT (ic), NULL);
      else
	{
	  newic = newiCode (IPUSH, IC_RIGHT (ic), NULL);
	  newic->parmPush = 1;
	}
      addiCodeToeBBlock (ebp, newic, ip);
      newic->lineno = linenno;

    }

  /* make the call */
  newic = newiCode (CALL, operandFromSymbol (func), NULL);
  IC_RESULT (newic) = IC_RESULT (ic);
  addiCodeToeBBlock (ebp, newic, ip);
  newic->lineno = linenno;

}

/*-----------------------------------------------------------------*/
/* cnvFromFloatCast - converts casts From floats to function calls */
/*-----------------------------------------------------------------*/
static void 
cnvFromFloatCast (iCode * ic, eBBlock * ebp)
{
  iCode *ip, *newic;
  symbol *func;
  sym_link *type = operandType (IC_LEFT (ic));
  int lineno = ic->lineno;
  int bwd, su;

  ip = ic->next;
  /* remove it from the iCode */
  remiCodeFromeBBlock (ebp, ic);

  /* depending on the type */
  for (bwd = 0; bwd < 3; bwd++)
    {
      for (su = 0; su < 2; su++)
	{
	  if (compareType (type, __multypes[bwd][su]) == 1)
	    {
	      func = __conv[1][bwd][su];
	      goto found;
	    }
	}
    }
  assert (0);
found:

  /* if float support routines NOT compiled as reentrant */
  if (!options.float_rent)
    {
      /* first one */
      if (IS_REGPARM (FUNC_ARGS(func->type)->etype))
	newic = newiCode (SEND, IC_RIGHT (ic), NULL);
      else
	{
	  newic = newiCode ('=', NULL, IC_RIGHT (ic));
	  IC_RESULT (newic) = operandFromValue (FUNC_ARGS(func->type));
	}
      addiCodeToeBBlock (ebp, newic, ip);
      newic->lineno = lineno;

    }
  else
    {

      /* push the left */
      if (IS_REGPARM (FUNC_ARGS(func->type)->etype))
	newic = newiCode (SEND, IC_RIGHT (ic), NULL);
      else
	{
	  newic = newiCode (IPUSH, IC_RIGHT (ic), NULL);
	  newic->parmPush = 1;
	}
      addiCodeToeBBlock (ebp, newic, ip);
      newic->lineno = lineno;

    }

  /* make the call */
  newic = newiCode (CALL, operandFromSymbol (func), NULL);
  IC_RESULT (newic) = IC_RESULT (ic);
  addiCodeToeBBlock (ebp, newic, ip);
  newic->lineno = lineno;

}

/*-----------------------------------------------------------------*/
/* convilong - converts int or long mults or divs to fcalls        */
/*-----------------------------------------------------------------*/
static void 
convilong (iCode * ic, eBBlock * ebp, sym_link * type, int op)
{
  symbol *func = NULL;
  iCode *ip = ic->next;
  iCode *newic;
  int lineno = ic->lineno;
  int bwd;
  int su;
  int bytesPushed=0;

  remiCodeFromeBBlock (ebp, ic);

  /* depending on the type */
  for (bwd = 0; bwd < 3; bwd++)
    {
      for (su = 0; su < 2; su++)
	{
	  if (compareType (type, __multypes[bwd][su]) == 1)
	    {
	      if (op == '*')
		func = __muldiv[0][bwd][su];
	      else if (op == '/')
		func = __muldiv[1][bwd][su];
	      else if (op == '%')
		func = __muldiv[2][bwd][su];
              else if (op == RRC)
		func = __rlrr[1][bwd][su];
              else if (op == RLC)
		func = __rlrr[0][bwd][su];
              else if (op == RIGHT_OP)
		func = __rlrr[1][bwd][su];
              else if (op == LEFT_OP)
		func = __rlrr[0][bwd][su];
	      else
		assert (0);
	      goto found;
	    }
	}
    }
  assert (0);
found:
  /* if int & long support routines NOT compiled as reentrant */
  if (!options.intlong_rent)
    {
      /* first one */
      if (IS_REGPARM (FUNC_ARGS(func->type)->etype))
	newic = newiCode (SEND, IC_LEFT (ic), NULL);
      else
	{
	  newic = newiCode ('=', NULL, IC_LEFT (ic));
	  IC_RESULT (newic) = operandFromValue (FUNC_ARGS(func->type));
	}
      addiCodeToeBBlock (ebp, newic, ip);
      newic->lineno = lineno;

      /* second one */
      if (IS_REGPARM (FUNC_ARGS(func->type)->next->etype))
	newic = newiCode (SEND, IC_RIGHT (ic), NULL);
      else
	{
	  newic = newiCode ('=', NULL, IC_RIGHT (ic));
	  IC_RESULT (newic) = operandFromValue (FUNC_ARGS(func->type)->next);
	}
      addiCodeToeBBlock (ebp, newic, ip);
      newic->lineno = lineno;

    }
  else
    {
      /* compiled as reentrant then push */
      /* push right */
      if (IS_REGPARM (FUNC_ARGS(func->type)->next->etype))
        {
          newic = newiCode (SEND, IC_RIGHT (ic), NULL);
        }
      else
	{
	  newic = newiCode (IPUSH, IC_RIGHT (ic), NULL);
	  newic->parmPush = 1;

	  bytesPushed += getSize(operandType(IC_RIGHT(ic)));
	}
      addiCodeToeBBlock (ebp, newic, ip);
      newic->lineno = lineno;

      /* insert push left */
      if (IS_REGPARM (FUNC_ARGS(func->type)->etype))
        {
          newic = newiCode (SEND, IC_LEFT (ic), NULL);
        }
      else
	{
	  newic = newiCode (IPUSH, IC_LEFT (ic), NULL);
	  newic->parmPush = 1;

	  bytesPushed += getSize(operandType(IC_LEFT(ic)));
	}
      addiCodeToeBBlock (ebp, newic, ip);
      newic->lineno = lineno;

    }

  /* for the result */
  newic = newiCode (CALL, operandFromSymbol (func), NULL);
  IC_RESULT (newic) = IC_RESULT (ic);
  newic->lineno = lineno;
  newic->parmBytes+=bytesPushed; // to clear the stack after the call
  addiCodeToeBBlock (ebp, newic, ip);
}

/*-----------------------------------------------------------------*/
/* convertToFcall - converts some operations to fcalls             */
/*-----------------------------------------------------------------*/
static void 
convertToFcall (eBBlock ** ebbs, int count)
{
  int i;

  /* for all blocks do */
  for (i = 0; i < count; i++)
    {
      iCode *ic;

      /* for all instructions in the block do */
      for (ic = ebbs[i]->sch; ic; ic = ic->next)
	{

	  /* floating point operations are
	     converted to function calls */
	  if ((IS_CONDITIONAL (ic) ||
	       IS_ARITHMETIC_OP (ic)) &&
	      (IS_FLOAT (operandType (IC_RIGHT (ic)))))
	    {

	      cnvToFcall (ic, ebbs[i]);
	    }

	  /* casting is a little different */
	  if (ic->op == CAST)
	    {
	      if (IS_FLOAT (operandType (IC_RIGHT (ic))))
		cnvFromFloatCast (ic, ebbs[i]);
	      else if (IS_FLOAT (operandType (IC_LEFT (ic))))
		cnvToFloatCast (ic, ebbs[i]);
	    }

	  /* if long / int mult or divide or mod */
	  if (ic->op == '*' || ic->op == '/' || ic->op == '%')
	    {
	      sym_link *leftType = operandType (IC_LEFT (ic));

	      if (IS_INTEGRAL (leftType) && getSize (leftType) > port->support.muldiv)
                {
                  sym_link *rightType = operandType (IC_RIGHT (ic));

                  if (port->hasNativeMulFor != NULL &&
                      port->hasNativeMulFor (ic, leftType, rightType))
                    {
                      /* Leave as native */
                    }
                  else
                    {
                      convilong (ic, ebbs[i], leftType, ic->op);
                    }
                }
	    }
          
          if (ic->op == RRC || ic->op == RLC || ic->op == LEFT_OP || ic->op == RIGHT_OP)
            {
	      sym_link *type = operandType (IC_LEFT (ic));

	      if (IS_INTEGRAL (type) && getSize (type) > port->support.shift && port->support.shift >= 0)
                {
                  convilong (ic, ebbs[i], type, ic->op);
                }
            }
	}
    }
}

/*-----------------------------------------------------------------*/
/* replaceRegEqv - replace all local variables with their reqv     */
/*-----------------------------------------------------------------*/
static void 
replaceRegEqv (eBBlock ** ebbs, int count)
{
  int i;

  for (i = 0; i < count; i++)
    {

      iCode *ic;

      for (ic = ebbs[i]->sch; ic; ic = ic->next)
	{

	  if (SKIP_IC2 (ic))
	    continue;

	  if (ic->op == IFX)
	    {

	      if (IS_TRUE_SYMOP (IC_COND (ic)) &&
		  OP_REQV (IC_COND (ic)))
		IC_COND (ic) = opFromOpWithDU (OP_REQV (IC_COND (ic)),
					     OP_SYMBOL (IC_COND (ic))->defs,
					    OP_SYMBOL (IC_COND (ic))->uses);

	      continue;
	    }

	  if (ic->op == JUMPTABLE)
	    {
	      if (IS_TRUE_SYMOP (IC_JTCOND (ic)) &&
		  OP_REQV (IC_JTCOND (ic)))
		IC_JTCOND (ic) = opFromOpWithDU (OP_REQV (IC_JTCOND (ic)),
					   OP_SYMBOL (IC_JTCOND (ic))->defs,
					  OP_SYMBOL (IC_JTCOND (ic))->uses);
	      continue;
	    }

	  if (ic->op == RECEIVE)
	    {
	      if (OP_SYMBOL (IC_RESULT (ic))->addrtaken)
		OP_SYMBOL (IC_RESULT (ic))->isspilt = 1;
	    }

	  /* general case */
	  if (IC_RESULT (ic) &&
	      IS_TRUE_SYMOP (IC_RESULT (ic)) &&
	      OP_REQV (IC_RESULT (ic)))
	    {
	      if (POINTER_SET (ic))
		{
		  IC_RESULT (ic) = opFromOpWithDU (OP_REQV (IC_RESULT (ic)),
					   OP_SYMBOL (IC_RESULT (ic))->defs,
					  OP_SYMBOL (IC_RESULT (ic))->uses);
		  IC_RESULT (ic)->isaddr = 1;
		}
	      else
		IC_RESULT (ic) = opFromOpWithDU (OP_REQV (IC_RESULT (ic)),
					   OP_SYMBOL (IC_RESULT (ic))->defs,
					  OP_SYMBOL (IC_RESULT (ic))->uses);
	    }

	  if (IC_RIGHT (ic) &&
	      IS_TRUE_SYMOP (IC_RIGHT (ic)) &&
	      OP_REQV (IC_RIGHT (ic)))
	    {
	      IC_RIGHT (ic) = opFromOpWithDU (OP_REQV (IC_RIGHT (ic)),
					    OP_SYMBOL (IC_RIGHT (ic))->defs,
					   OP_SYMBOL (IC_RIGHT (ic))->uses);
	      IC_RIGHT (ic)->isaddr = 0;
	    }

	  if (IC_LEFT (ic) &&
	      IS_TRUE_SYMOP (IC_LEFT (ic)) &&
	      OP_REQV (IC_LEFT (ic)))
	    {
	      IC_LEFT (ic) = opFromOpWithDU (OP_REQV (IC_LEFT (ic)),
					     OP_SYMBOL (IC_LEFT (ic))->defs,
					     OP_SYMBOL (IC_LEFT (ic))->uses);
	      IC_LEFT (ic)->isaddr = 0;
	    }
	}
    }
}

/*-----------------------------------------------------------------*/
/* killDeadCode - eliminates dead assignments                      */
/*-----------------------------------------------------------------*/
int 
killDeadCode (eBBlock ** ebbs, int count)
{
  int change = 1;
  int gchange = 0;
  int i = 0;


  /* basic algorithm :-                                          */
  /* first the exclusion rules :-                                */
  /*  1. if result is a global or volatile then skip             */
  /*  2. if assignment and result is a temp & isaddr  then skip  */
  /*     since this means array & pointer access, will be taken  */
  /*     care of by alias analysis.                              */
  /*  3. if the result is used in the remainder of the block skip */
  /*  4. if this definition does not reach the end of the block  */
  /*     i.e. the result is not present in the outExprs then KILL */
  /*  5. if it reaches the end of block & is used by some success */
  /*     or then skip                                            */
  /*     else            KILL                                    */
  /* this whole process is carried on iteratively till no change */
  while (1)
    {

      change = 0;
      /* for all blocks do */
      for (i = 0; i < count; i++)
	{
	  iCode *ic;

	  /* for all instructions in the block do */
	  for (ic = ebbs[i]->sch; ic; ic = ic->next)
	    {
	      int kill, j;
	      kill = 0;

	      if (SKIP_IC (ic) ||
		  ic->op == IFX ||
		  ic->op == RETURN)
		continue;

	      /* if the result is volatile then continue */
	      if (IC_RESULT (ic) && isOperandVolatile (IC_RESULT (ic), FALSE))
		continue;

	      /* if the result is a temp & isaddr then skip */
	      if (IC_RESULT (ic) && POINTER_SET (ic))
		continue;

	      /* if the result is used in the remainder of the */
	      /* block then skip */
	      if (usedInRemaining (IC_RESULT (ic), ic->next))
		continue;

	      /* does this definition reach the end of the block 
	         or the usage is zero then we can kill */
	      if (!bitVectBitValue (ebbs[i]->outDefs, ic->key))
		kill = 1;	/* if not we can kill it */
	      else
		{
		  /* if this is a global variable or function parameter */
		  /* we cannot kill anyway             */
		  if (isOperandGlobal (IC_RESULT (ic)) ||
		      (OP_SYMBOL (IC_RESULT (ic))->_isparm &&
		       !OP_SYMBOL (IC_RESULT (ic))->ismyparm))
		    continue;

		  /* if we are sure there are no usages */
		  if (bitVectIsZero (OP_USES (IC_RESULT (ic))))
		    {
		      kill = 1;
		      goto kill;
		    }

		  /* reset visited flag */
		  for (j = 0; j < count; ebbs[j++]->visited = 0);

		  /* find out if this definition is alive */
		  if (applyToSet (ebbs[i]->succList,
				  isDefAlive,
				  ic))
		    continue;

		  kill = 1;
		}

	    kill:
	      /* kill this one if required */
	      if (kill)
		{
		  change = 1;
		  gchange++;
		  /* eliminate this */
		  remiCodeFromeBBlock (ebbs[i], ic);

		  /* now delete from defUseSet */
		  deleteItemIf (&ebbs[i]->outExprs, ifDiCodeIsX, ic);
		  bitVectUnSetBit (ebbs[i]->outDefs, ic->key);

		  /* and defset of the block */
		  bitVectUnSetBit (ebbs[i]->defSet, ic->key);

		  /* for the left & right remove the usage */
		  if (IS_SYMOP (IC_LEFT (ic)))
		    bitVectUnSetBit (OP_USES (IC_LEFT (ic)), ic->key);

		  if (IS_SYMOP (IC_RIGHT (ic)))
		    bitVectUnSetBit (OP_USES (IC_RIGHT (ic)), ic->key);
		}

	    }			/* end of all instructions */

	  if (!ebbs[i]->sch && !ebbs[i]->noPath)
	    disconBBlock (ebbs[i], ebbs, count);

	}			/* end of for all blocks */

      if (!change)
	break;
    }				/* end of while(1) */

  return gchange;
}

/*-----------------------------------------------------------------*/
/* printCyclomatic - prints the cyclomatic information             */
/*-----------------------------------------------------------------*/
static void 
printCyclomatic (eBBlock ** ebbs, int count)
{
  int nEdges = elementsInSet (graphEdges);
  int i, nNodes = 0;

  for (i = 0; i < count; i++)
    nNodes += (!ebbs[i]->noPath);

  /* print the information */
  werror (I_CYCLOMATIC, currFunc->name, nEdges, nNodes, nEdges - nNodes + 2);
}

/*-----------------------------------------------------------------*/
/* discardDeadParamReceives - remove any RECEIVE opcodes which     */
/* refer to dead variables.                                        */
/*-----------------------------------------------------------------*/
static void 
discardDeadParamReceives (eBBlock ** ebbs, int count)
{
  int i;
  iCode *ic;
  iCode dummyIcode;

  for (i = 0; i < count; i++)
    {
      for (ic = ebbs[i]->sch; ic; ic = ic->next)
	{
	  if (ic->op == RECEIVE)
	    {
	      if (IC_RESULT (ic) && OP_SYMBOL (IC_RESULT (ic))
		  && !OP_SYMBOL (IC_RESULT (ic))->used)
		{
#if 0
		  fprintf (stderr, "discarding dead receive for %s\n",
			   OP_SYMBOL (IC_RESULT (ic))->name);
#endif
		  dummyIcode.next = ic->next;
		  remiCodeFromeBBlock (ebbs[i], ic);
		  ic = &dummyIcode;
		}
	    }
	}
    }
}

/*-----------------------------------------------------------------*/
/* eBBlockFromiCode - creates extended basic blocks from iCode     */
/*                    will return an array of eBBlock pointers     */
/*-----------------------------------------------------------------*/
eBBlock **
eBBlockFromiCode (iCode * ic)
{
  eBBlock **ebbs = NULL;
  int count = 0;
  int saveCount = 0;
  int change = 1;
  int lchange = 0;
  int kchange = 0;
  hTab *loops;

  /* if nothing passed then return nothing */
  if (!ic)
    return NULL;

  count = 0;
  eBBNum = 0;

  /* optimize the chain for labels & gotos 
     this will eliminate redundant labels and
     will change jump to jumps by jumps */
  ic = iCodeLabelOptimize (ic);

  /* break it down into basic blocks */
  ebbs = iCodeBreakDown (ic, &count);
  saveCount = count;

  /* compute the control flow */
  computeControlFlow (ebbs, count, 0);

  /* dumpraw if asked for */
  if (options.dump_raw)
    dumpEbbsToFileExt (DUMP_RAW0, ebbs, count);

  /* replace the local variables with their
     register equivalents : the liveRange computation
     along with the register allocation will determine
     if it finally stays in the registers */
  replaceRegEqv (ebbs, count);

  /* create loop regions */
  loops = createLoopRegions (ebbs, count);

  /* dumpraw if asked for */
  if (options.dump_raw)
    dumpEbbsToFileExt (DUMP_RAW1, ebbs, count);

  /* do common subexpression elimination for each block */
  change = cseAllBlocks (ebbs, saveCount);

  /* dumpraw if asked for */
  if (options.dump_raw)
    dumpEbbsToFileExt (DUMP_CSE, ebbs, count);

  /* compute the data flow */
  computeDataFlow (ebbs, saveCount);

  /* dumpraw if asked for */
  if (options.dump_raw)
    dumpEbbsToFileExt (DUMP_DFLOW, ebbs, count);

  /* global common subexpression elimination  */
  if (optimize.global_cse)
    {
      change += cseAllBlocks (ebbs, saveCount);
      if (options.dump_gcse)
	dumpEbbsToFileExt (DUMP_GCSE, ebbs, saveCount);
    }
  /* kill dead code */
  kchange = killDeadCode (ebbs, saveCount);

  if (options.dump_kill)
    dumpEbbsToFileExt (DUMP_DEADCODE, ebbs, count);

  /* do loop optimizations */
  change += (lchange = loopOptimizations (loops, ebbs, count));
  if (options.dump_loop)
    dumpEbbsToFileExt (DUMP_LOOP, ebbs, count);

  /* recompute the data flow and apply global cse again 
     if loops optimizations or dead code caused a change:
     loops will brings out of the loop which then may be
     available for use in the later blocks: dead code
     elimination could potentially disconnect some blocks
     conditional flow may be efected so we need to apply
     subexpression once more */
  if (lchange || kchange)
    {
      computeDataFlow (ebbs, saveCount);
      change += cseAllBlocks (ebbs, saveCount);
      if (options.dump_loop)
	dumpEbbsToFileExt (DUMP_LOOPG, ebbs, count);

      /* if loop optimizations caused a change then do
         dead code elimination once more : this will
         get rid of the extra assignments to the induction
         variables created during loop optimizations */
      killDeadCode (ebbs, saveCount);

      if (options.dump_loop)
	dumpEbbsToFileExt (DUMP_LOOPD, ebbs, count);

    }

  /* sort it back by block number */
  qsort (ebbs, saveCount, sizeof (eBBlock *), bbNumCompare);

  /* if cyclomatic info requested then print it */
  if (options.cyclomatic)
    printCyclomatic (ebbs, saveCount);

  /* convert operations with support routines
     written in C to function calls : Iam doing
     this at this point since I want all the
     operations to be as they are for optimzations */
  convertToFcall (ebbs, count);

  /* compute the live ranges */
  computeLiveRanges (ebbs, count);

  if (options.dump_range)
    dumpEbbsToFileExt (DUMP_RANGE, ebbs, count);

  /* Now that we have the live ranges, discard parameter
   * receives for unused parameters.
   */
  discardDeadParamReceives (ebbs, count);

  /* allocate registers & generate code */
  port->assignRegisters (ebbs, count);

  /* throw away blocks */
  setToNull ((void **) &graphEdges);
  ebbs = NULL;

  return NULL;
}


/* (add-hook 'c-mode-hook (lambda () (setq c-basic-offset 4))) */

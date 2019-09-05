/*-------------------------------------------------------------------------

  SDCCcflow.c - source file for control flow analysis

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
/* domSetFromVect - creates a domset from the vector               */
/*-----------------------------------------------------------------*/
set *
domSetFromVect (eBBlock ** ebbs, bitVect * domVect)
{
  int i = 0;
  set *domSet = NULL;

  if (!domVect)
    return NULL;

  for (i = 0; i < domVect->size; i++)
    if (bitVectBitValue (domVect, i))
      addSet (&domSet, ebbs[i]);
  return domSet;
}


/*-----------------------------------------------------------------*/
/* addSuccessor - will add bb to succ also add it to the pred of   */
/*                the next one :                                   */
/*-----------------------------------------------------------------*/
void 
addSuccessor (eBBlock * thisBlock, eBBlock * succ)
{
  /* check for boundary conditions */
  if (!thisBlock || !succ)
    return;

  /* add it to the succ of thisBlock */
  addSetIfnotP (&thisBlock->succList, succ);

  thisBlock->succVect =
    bitVectSetBit (thisBlock->succVect, succ->bbnum);
  /* add this edge to the list of edges */
  addSet (&graphEdges, newEdge (thisBlock, succ));

}

/*-----------------------------------------------------------------*/
/* eBBPredecessors - find the predecessors for each block          */
/*-----------------------------------------------------------------*/
void 
eBBPredecessors (eBBlock ** ebbs, int count)
{
  int i = 0, j;

  /* for each block do */
  for (i = 0; i < count; i++)
    {

      /* if there is no path to this then continue */
      if (ebbs[i]->noPath)
	continue;

      /* for each successor of this block if */
      /* it has depth first number > this block */
      /* then this block precedes the successor  */
      for (j = 0; j < ebbs[i]->succVect->size; j++)

	if (bitVectBitValue (ebbs[i]->succVect, j) &&
	    ebbs[j]->dfnum > ebbs[i]->dfnum)

	  addSet (&ebbs[j]->predList, ebbs[i]);
    }
}

/*-----------------------------------------------------------------*/
/* eBBSuccessors- find out the successors of all the nodes         */
/*-----------------------------------------------------------------*/
void 
eBBSuccessors (eBBlock ** ebbs, int count)
{
  int i = 0;

  /* for all the blocks do */
  for (; i < count; i++)
    {
      iCode *ic;

      if (ebbs[i]->noPath)
	continue;

      ebbs[i]->succVect = newBitVect (count);

      /* if the next on exists & this one does not */
      /* end in a GOTO or RETURN then the next is  */
      /* a natural successor of this. Note we have */
      /* consider eBBlocks with no instructions    */
      if (ebbs[i + 1])
	{

	  if (ebbs[i]->ech)
	    {

	      if (ebbs[i]->ech->op != GOTO &&
		  ebbs[i]->ech->op != RETURN &&
		  ebbs[i]->ech->op != JUMPTABLE)
		{
		  int j = i + 1;

		  while (ebbs[j] && ebbs[j]->noPath)
		    j++;

		  addSuccessor (ebbs[i], ebbs[j]);	/* add it */
		}
	    }			/* no instructions in the block */
	  /* could happen for dummy blocks */
	  else
	    addSuccessor (ebbs[i], ebbs[i + 1]);
	}

      /* go thru all the instructions: if we find a */
      /* goto or ifx or a return then we have a succ */
      if ((ic = ebbs[i]->ech))
	{
	  eBBlock *succ;

	  /* special case for jumptable */
	  if (ic->op == JUMPTABLE)
	    {
	      symbol *lbl;
	      for (lbl = setFirstItem (IC_JTLABELS (ic)); lbl;
		   lbl = setNextItem (IC_JTLABELS (ic)))
		addSuccessor (ebbs[i],
			      eBBWithEntryLabel (ebbs, lbl, count));
	    }
	  else
	    {

	      succ = NULL;
	      /* depending on the instruction operator */
	      switch (ic->op)
		{
		case GOTO:	/* goto has edge to label */
		  succ = eBBWithEntryLabel (ebbs, ic->argLabel.label, count);
		  break;

		case IFX:	/* conditional jump */
		  /* if true label is present */
		  if (IC_TRUE (ic))
		    succ = eBBWithEntryLabel (ebbs, IC_TRUE (ic), count);
		  else
		    succ = eBBWithEntryLabel (ebbs, IC_FALSE (ic), count);
		  break;

		case RETURN:	/* block with return */
		  succ = eBBWithEntryLabel (ebbs, returnLabel, count);
		  break;
		}

	      /* if there is a successor add to the list */
	      /* if it is not already present in the list */
	      if (succ)
		addSuccessor (ebbs[i], succ);
	    }
	}
    }
}

/*-----------------------------------------------------------------*/
/* computeDominance - computes the dominance graph                 */
/* for algorithm look at Dragon book section 10.10, algo 10.16     */
/*-----------------------------------------------------------------*/
void 
computeDominance (eBBlock ** ebbs, int count)
{
  int i, j;

  /* now do the initialisation */
  /* D(n0) := { n0 } */
  ebbs[0]->domVect =
    bitVectSetBit (ebbs[0]->domVect = newBitVect (count), ebbs[0]->bbnum);


  /* for n in N - { n0 } do D(n) = N */
  for (i = 1; i < count; i++)
    {
      ebbs[i]->domVect = newBitVect (count);
      for (j = 0; j < count; j++)
	{
	  ebbs[i]->domVect =
	    bitVectSetBit (ebbs[i]->domVect, ebbs[j]->bbnum);
	}
    }

  /* end of initialisation */

  /* while changes to any D(n) occur do */
  /*   for n in N - { n0 } do           */
  /*       D(n) := { n } U  (intersection of D( all predecessors of n)) */
  while (1)
    {
      int change;

      change = 0;
      for (i = 1; i < count; i++)
	{
	  bitVect *cDomVect;
	  eBBlock *pred;

	  cDomVect = NULL;

	  /* get the intersection of the dominance of all predecessors */
	  for (pred = setFirstItem (ebbs[i]->predList),
	       cDomVect = (pred ? bitVectCopy (pred->domVect) : NULL);
	       pred;
	       pred = setNextItem (ebbs[i]->predList))
	    {
	      cDomVect = bitVectIntersect (cDomVect, pred->domVect);
	    }
	  if (!cDomVect)
	    cDomVect = newBitVect (count);
	  /* this node to the list */
	  cDomVect = bitVectSetBit (cDomVect, ebbs[i]->bbnum);


	  if (!bitVectEqual (cDomVect, ebbs[i]->domVect))
	    {
	      ebbs[i]->domVect = cDomVect;
	      change = 1;
	    }
	}

      /* if no change then exit */
      if (!change)
	break;
    }
}

/*-----------------------------------------------------------------*/
/* immedDom - returns the immediate dominator of a block           */
/*-----------------------------------------------------------------*/
eBBlock *
immedDom (eBBlock ** ebbs, eBBlock * ebp)
{
  /* first delete self from the list */
  set *iset = domSetFromVect (ebbs, ebp->domVect);
  eBBlock *loop;
  eBBlock *idom = NULL;

  deleteSetItem (&iset, ebp);
  /* then just return the one with the greatest */
  /* depthfirst number, this will be the immed dominator */
  if ((loop = setFirstItem (iset)))
    idom = loop;
  for (; loop; loop = setNextItem (iset))
    if (loop->dfnum > idom->dfnum)
      idom = loop;

  setToNull ((void **) &iset);
  return idom;

}

/*-----------------------------------------------------------------*/
/* DFOrdering - is visited then nothing else call DFOrdering this  */
/*-----------------------------------------------------------------*/
DEFSETFUNC (DFOrdering)
{
  eBBlock *ebbp = item;
  V_ARG (int *, count);

  if (ebbp->visited)
    return 0;

  computeDFOrdering (ebbp, count);	/* depthfirst */

  return 0;
}

/*-----------------------------------------------------------------*/
/* computeDFOrdering - computes the depth first ordering of the    */
/*                     flowgraph                                   */
/*-----------------------------------------------------------------*/
void 
computeDFOrdering (eBBlock * ebbp, int *count)
{

  ebbp->visited = 1;
  /* for each successor that is not visited */
  applyToSet (ebbp->succList, DFOrdering, count);

  /* set the depth first number */
  ebbp->dfnum = *count;
  *count -= 1;
}

/*-----------------------------------------------------------------*/
/* disconBBlock - removes all control flow links for a block       */
/*-----------------------------------------------------------------*/
void 
disconBBlock (eBBlock * ebp, eBBlock ** ebbs, int count)
{
  /* mark this block as noPath & recompute control flow */
  ebp->noPath = 1;
  computeControlFlow (ebbs, count, TRUE);
}

/*-----------------------------------------------------------------*/
/* markNoPath - marks those blocks which cannot be reached from top */
/*-----------------------------------------------------------------*/
void 
markNoPath (eBBlock ** ebbs, int count)
{
  int i;


  /* for all blocks if the visited flag is not set : then there */
  /* is no path from _entry to this block push them down in the */
  /* depth first order */
  for (i = 0; i < count; i++)
    if (!ebbs[i]->visited)
      ebbs[i]->noPath = 1;
}
/*-----------------------------------------------------------------*/
/* dfNumCompare - used by qsort to sort by dfNumber                */
/*-----------------------------------------------------------------*/
int 
dfNumCompare (const void *a, const void *b)
{
  const eBBlock *const *i = a;
  const eBBlock *const *j = b;

  if ((*i)->dfnum > (*j)->dfnum)
    return 1;

  if ((*i)->dfnum < (*j)->dfnum)
    return -1;

  return 0;
}

/*-----------------------------------------------------------------*/
/* bbNumCompare - used by qsort to sort by bbNumber                */
/*-----------------------------------------------------------------*/
int 
bbNumCompare (const void *a, const void *b)
{
  const eBBlock *const *i = a;
  const eBBlock *const *j = b;

  if ((*i)->bbnum > (*j)->bbnum)
    return 1;

  if ((*i)->bbnum < (*j)->bbnum)
    return -1;

  return 0;
}


/*-----------------------------------------------------------------*/
/* computeControlFlow - does the control flow computation          */
/*-----------------------------------------------------------------*/
void 
computeControlFlow (eBBlock ** ebbs, int count, int reSort)
{
  int saveCount = count;
  int i;

  /* initialise some things */

  for (i = 0; i < count; i++)
    {
      setToNull ((void **) &ebbs[i]->predList);
      setToNull ((void **) &ebbs[i]->domVect);
      setToNull ((void **) &ebbs[i]->succList);
      setToNull ((void **) &ebbs[i]->succVect);
      ebbs[i]->visited = 0;
      ebbs[i]->dfnum = 0;
    }

  if (reSort)
    /* sort it back by block number */
    qsort (ebbs, saveCount, sizeof (eBBlock *), bbNumCompare);

  setToNull ((void **) &graphEdges);
  /* this will put in the  */
  /* successor information for each blk */
  eBBSuccessors (ebbs, count);

  /* compute the depth first ordering */
  computeDFOrdering (ebbs[0], &count);

  /* mark blocks with no paths to them */
  markNoPath (ebbs, saveCount);

  /* with the depth first info in place */
  /* add the predecessors for the blocks */
  eBBPredecessors (ebbs, saveCount);

  /* compute the dominance graph */
  computeDominance (ebbs, saveCount);

  /* sort it by dfnumber */
  qsort (ebbs, saveCount, sizeof (eBBlock *), dfNumCompare);

}

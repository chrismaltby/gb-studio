/*-----------------------------------------------------------------
    SDCClabel.c - label optimizations on iCode (intermediate code)

    Written By - Sandeep Dutta . sandeep.dutta@usa.net (1998)

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

hTab *labelRef = NULL;
hTab *labelDef = NULL;

/*-----------------------------------------------------------------*/
/* buildLabelRefTable - creates an hashTable of label referneces   */
/*-----------------------------------------------------------------*/
void 
buildLabelRefTable (iCode * ic)
{
  iCode *lic;

  setToNull ((void **) &labelRef);
  setToNull ((void **) &labelDef);
  labelRef = newHashTable (labelKey + 1);
  labelDef = newHashTable (labelKey + 1);

  for (lic = ic; lic; lic = lic->next)
    {
      if (lic->op == GOTO)
	hTabAddItem (&labelRef, (IC_LABEL (lic))->key, lic);

      if (lic->op == JUMPTABLE)
	{
	  symbol *lbl;
	  for (lbl = setFirstItem (IC_JTLABELS (lic)); lbl;
	       lbl = setNextItem (IC_JTLABELS (lic)))
	    {
	      hTabAddItem (&labelRef, lbl->key, lic);
	    }
	}

      if (lic->op == IFX)
	{
	  if (IC_TRUE (lic))
	    hTabAddItem (&labelRef, (IC_TRUE (lic))->key, lic);
	  else
	    hTabAddItem (&labelRef, (IC_FALSE (lic))->key, lic);
	}
      if (lic->op == LABEL)
	hTabAddItem (&labelDef, (IC_LABEL (lic))->key, lic);

    }
}

/*-----------------------------------------------------------------*/
/* labelGotoNext - kills gotos to next statement                   */
/*-----------------------------------------------------------------*/
int 
labelGotoNext (iCode * ic)
{
  iCode *loop;
  int change = 0;

  for (loop = ic; loop; loop = loop->next)
    {

      if (loop->op == GOTO &&	/* if this is a goto */
	  loop->next &&		/* and we have a next one */
	  loop->next->op == LABEL &&	/* next one is a label */
	  loop->next->argLabel.label->key == loop->argLabel.label->key)		/* same label */
	{
	  loop->prev->next = loop->next;	/* get this out of the chain */
	  loop->next->prev = loop->prev;
	  hTabDeleteItem (&labelRef, (IC_LABEL (loop))->key, loop, DELETE_ITEM, NULL);
	  change++;
	}
    }

  return change;
}

/*-----------------------------------------------------------------*/
/* labelIfx - special case Ifx elimination                         */
/*-----------------------------------------------------------------*/
int 
labelIfx (iCode * ic)
{
  iCode *loop;
  int change = 0;


  for (loop = ic; loop; loop = loop->next)
    {
      /*   if  condition  goto label */
      /*   goto label                */
      /* i.e. the flow is going to the same location 
         regardless of the condition in this case the 
         condition can be eliminated with a WARNING ofcource */
      if (loop->op == IFX &&
	  loop->next &&
	  loop->next->op == GOTO)
	{
	  if (IC_TRUE (loop) &&
	      IC_TRUE (loop)->key == IC_LABEL (loop->next)->key)
	    {

	      /* get rid of this if */
	      if (!options.lessPedantic) {
		werror (W_CONTROL_FLOW, loop->filename, loop->lineno);
	      }
	      loop->prev->next = loop->next;
	      loop->next->prev = loop->prev;
	      hTabDeleteItem (&labelRef,
			      (IC_TRUE (loop))->key,
			      loop, DELETE_ITEM, NULL);
	      change++;
	      continue;
	    }
	  else
	    {
	      if (IC_FALSE (loop) &&
		  IC_FALSE (loop)->key == IC_LABEL (loop->next)->key)
		{
		  /* get rid of this if */
		  if (!options.lessPedantic) {
		    werror (W_CONTROL_FLOW, loop->filename, loop->lineno);
		  }
		  loop->prev->next = loop->next;
		  loop->next->prev = loop->prev;
		  hTabDeleteItem (&labelRef,
				  (IC_FALSE (loop))->key,
				  loop, DELETE_ITEM, NULL);
		  change++;
		  continue;
		}
	    }
	}
      /* same as above but with a twist */
      /* if condition goto label */
      /* label:                  */
      if (loop->op == IFX &&
	  loop->next &&
	  loop->next->op == LABEL &&
	  ((IC_TRUE (loop) && IC_TRUE (loop)->key == IC_LABEL (loop->next)->key) ||
	   (IC_FALSE (loop) && IC_FALSE (loop)->key == IC_LABEL (loop->next)->key)))
	{
	  if (!options.lessPedantic) {
	    werror (W_CONTROL_FLOW, loop->filename, loop->lineno);
	  }
	  loop->prev->next = loop->next;
	  loop->next->prev = loop->prev;
	  hTabDeleteItem (&labelRef,
			  IC_LABEL (loop->next)->key,
			  loop, DELETE_ITEM, NULL);
	  change++;
	  continue;
	}

      /* we will eliminate certain special case situations */
      /* of the conditional statement :-                  */
      /*       if cond != 0 goto _trueLabel               */
      /*       goto _falseLabel                           */
      /* _trueLabel :                                     */
      /*       ...                                        */
      /* in these cases , if this is the only reference   */
      /* to the _trueLabel, we can change it to :-        */
      /*       if cond == 0 goto _falseLabel              */
      /*       ...                                        */
      /* similarly if we have a situation like :-         */
      /*       if cond == 0 goto _falseLabel              */
      /*       goto _someLabel                            */
      /* _falseLabel :                                    */
      /* we can change this to                            */
      /*       if cond != 0 goto _someLabel               */
      /*       ...                                        */
      if (loop->op == IFX &&
	  loop->next &&
	  loop->next->op == GOTO &&
	  loop->next->next &&
	  loop->next->next->op == LABEL)
	{


	  /* now check that the last label is the */
	  /* same as the _trueLabel of this       */
	  if (IC_TRUE (loop))
	    if ((IC_TRUE (loop))->key != (IC_LABEL (loop->next->next))->key)
	      continue;
	    else;
	  else if ((IC_FALSE (loop))->key != (IC_LABEL (loop->next->next))->key)
	    continue;

	  /* now make sure that this is the only */
	  /* referenece to the _trueLabel        */
	  if (IC_TRUE (loop) && hTabItemWithKey (labelRef, (IC_TRUE (loop))->key))
	    {

	      /* we just change the falseLabel */
	      /* to the next goto statement    */
	      /* unreferenced label will take  */
	      /* care of removing the label    */
	      /* delete reference to the true label */

	      hTabDeleteItem (&labelRef, (IC_TRUE (loop))->key, loop, DELETE_ITEM, NULL);
	      IC_TRUE (loop) = NULL;
	      IC_FALSE (loop) = IC_LABEL (loop->next);
	      /* add reference to the LABEL */
	      hTabAddItem (&labelRef, (IC_FALSE (loop))->key, loop);
	      /* next remove the goto */
	      hTabDeleteItem (&labelRef,
	       (IC_LABEL (loop->next))->key, loop->next, DELETE_ITEM, NULL);
	      loop->next = loop->next->next;
	      loop->next->prev = loop;
	      change++;
	      continue;
	    }

	  /* now do the same with the false labels */
	  if (IC_FALSE (loop) &&
	      hTabItemWithKey (labelRef, (IC_FALSE (loop))->key))
	    {

	      hTabDeleteItem (&labelRef, (IC_FALSE (loop))->key, loop, DELETE_ITEM, NULL);
	      IC_FALSE (loop) = NULL;
	      IC_TRUE (loop) = IC_LABEL (loop->next);
	      hTabAddItem (&labelRef, (IC_TRUE (loop))->key, loop);
	      hTabDeleteItem (&labelRef, (IC_LABEL (loop->next))->key, loop->next, DELETE_ITEM, NULL);
	      loop->next = loop->next->next;
	      loop->next->prev = loop;
	      change++;
	      continue;
	    }
	}
    }

  return change;
}

/*-----------------------------------------------------------------*/
/* labelGotoGoto - target of a goto is a goto                      */
/*-----------------------------------------------------------------*/
int 
labelGotoGoto (iCode * ic)
{
  iCode *loop;
  int change = 0;

  for (loop = ic; loop; loop = loop->next)
    {
      iCode *stat;
      symbol *sLabel = NULL;
      stat = NULL;
      switch (loop->op)
	{
	case GOTO:		/* for a goto statement */
	  stat = hTabItemWithKey (labelDef, (sLabel = IC_LABEL (loop))->key);
	  break;
	case IFX:		/* for a conditional jump */
	  if (IC_TRUE (loop))
	    stat = hTabItemWithKey (labelDef, (sLabel = IC_TRUE (loop))->key);
	  else
	    stat = hTabItemWithKey (labelDef, (sLabel = IC_FALSE (loop))->key);
	}

      /* if we have a target statement then check if the next */
      /* one is a goto: this means target of goto is a goto   */
      if (stat && stat->next &&
	  (stat->next->op == GOTO ||
	   stat->next->op == LABEL) &&
	  stat->next != loop)
	{

	  symbol *repLabel = stat->next->argLabel.label;	/* replace with label */

	  /* if they are the same then continue */
	  if (repLabel->key == sLabel->key)
	    continue;

	  /* replacement depends on the statement type */
	  switch (loop->op)
	    {

	    case GOTO:		/* for a goto statement */

	      hTabDeleteItem (&labelRef, (IC_LABEL (loop))->key, loop, DELETE_ITEM, NULL);
	      loop->argLabel.label = repLabel;
	      hTabAddItem (&labelRef, repLabel->key, loop);
	      break;

	    case IFX:		/* for a conditional jump */
	      if (IC_TRUE (loop))
		{

		  hTabDeleteItem (&labelRef, (IC_TRUE (loop))->key, loop, DELETE_ITEM, NULL);
		  IC_TRUE (loop) = repLabel;
		}
	      else
		{

		  hTabDeleteItem (&labelRef, (IC_FALSE (loop))->key, loop, DELETE_ITEM, NULL);
		  IC_FALSE (loop) = repLabel;
		}
	      hTabAddItem (&labelRef, repLabel->key, loop);

	    }
	  change++;
	}
    }

  return change;
}

/*-----------------------------------------------------------------*/
/* labelUnrefLabel - remove unreferneced labels                    */
/*-----------------------------------------------------------------*/
int 
labelUnrefLabel (iCode * ic)
{
  iCode *loop;
  int change = 0;

  for (loop = ic; loop; loop = loop->next)
    {

      /* if this is a label */
      if (loop->op == LABEL)
	{
	  set *refs;

	  refs = NULL;
	  if (((IC_LABEL (loop))->key == returnLabel->key) ||
	      ((IC_LABEL (loop))->key == entryLabel->key))
	    continue;

	  if (hTabItemWithKey (labelRef, (IC_LABEL (loop))->key))
	    continue;

	  /* else eliminitate this one */
	  loop->prev->next = loop->next;	/* get this out of the chain */
	  loop->next->prev = loop->prev;
	  change++;
	}
    }

  return change;
}

/*-----------------------------------------------------------------*/
/* labelUnreach - remove unreachable code                          */
/*-----------------------------------------------------------------*/
int 
labelUnreach (iCode * ic)
{
  iCode *loop;
  iCode *tic;
  int change = 0;

  /* if we hit a return statement or a goto statement */
  /* remove all statements till we hit the next label */
  for (loop = ic; loop; loop = loop->next)
    {
      iCode *loop2;

      /* found a goto || return && the next */
      /* statement is not a label           */
      if (loop->op == GOTO || loop->op == RETURN)
	{

	  if (loop->next &&
	      (loop->next->op == LABEL ||
	       loop->next->op == ENDFUNCTION))
	    continue;

	  /* loop till we find a label */
	  loop2 = loop->next;
	  while (loop2 && loop2->op != LABEL)
	    loop2 = loop2->next;

	  /* throw away those in between */
	  for (tic = loop->next; tic && tic != loop2; tic = tic->next)
	    {
	      /* remove label references if any */
	      switch (tic->op)
		{
		case GOTO:
		  hTabDeleteItem (&labelRef, IC_LABEL (tic)->key, tic, DELETE_ITEM, NULL);
		  break;
		case IFX:
		  if (IC_TRUE (tic))
		    hTabDeleteItem (&labelRef, IC_TRUE (tic)->key, tic, DELETE_ITEM, NULL);
		  else
		    hTabDeleteItem (&labelRef, IC_FALSE (tic)->key, tic, DELETE_ITEM, NULL);
		  break;

		}
	    }

	  /* now set up the pointers */
	  loop->next = loop2;
	  if (loop2)
	    loop2->prev = loop;
	  change++;
	}
    }
  return change;
}

/*-----------------------------------------------------------------*/
/* iCodeLabelOptimize - some obvious & general optimizations       */
/*-----------------------------------------------------------------*/
iCode *
iCodeLabelOptimize (iCode * ic)
{
  if (!optimize.label1 &&
      !optimize.label2 &&
      !optimize.label3 &&
      !optimize.label4)
    return ic;

  /* build labelreferences */
  buildLabelRefTable (ic);

  /* the following transformations need to ne done */
  /* repeatedly till a fixed point is reached      */
  while (1)
    {
      int change;
      change = 0;

      /* first eliminate any goto statement */
      /* that goes to the next statement    */
      if (optimize.label1)
	change += labelGotoNext (ic);

      if (optimize.label2)
	change += labelIfx (ic);

      /* target of a goto is a goto then rename this goto */
      if (optimize.label3)
	change += labelGotoGoto (ic);

      /* remove unreference labels */
      if (optimize.label4)
	change += labelUnrefLabel (ic);

      /* remove unreachable code */
      change += labelUnreach (ic);

      if (!change)		/* fixed point reached */
	break;
    }

  return ic;
}

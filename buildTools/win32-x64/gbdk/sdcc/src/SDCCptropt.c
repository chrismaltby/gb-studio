/*-------------------------------------------------------------------------

  SDCCptropt.c - source file for pointer arithmetic Optimizations

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

/*-----------------------------------------------------------------------*/
/* findPointerGetSet - find the pointer get or set for a operand         */
/*-----------------------------------------------------------------------*/
static iCode *
findPointerGetSet (iCode * sic, operand * op)
{
  iCode *ic = sic;

  for (; ic; ic = ic->next)
    {
      if ((POINTER_SET (ic) && isOperandEqual (op, IC_RESULT (ic))) ||
	  (POINTER_GET (ic) && isOperandEqual (op, IC_LEFT (ic))))
	return ic;

      /* if we find any other usage or definition of op null */
      if (IC_RESULT (ic) && isOperandEqual (IC_RESULT (ic), op))
	return NULL;

      if (IC_RIGHT (ic) && isOperandEqual (IC_RIGHT (ic), op))
	return NULL;

      if (IC_LEFT (ic) && isOperandEqual (IC_LEFT (ic), op))
	return NULL;

    }

  return NULL;
}

/*-----------------------------------------------------------------------*/
/* ptrPostIncDecOpts - will do some pointer post increment optimizations */
/*                     this will help register allocation amongst others */
/*-----------------------------------------------------------------------*/
void 
ptrPostIncDecOpt (iCode * sic)
{
  /* this is what we do. look for sequences like

     iTempX := _SOME_POINTER_;
     iTempY := _SOME_POINTER_ + nn ;   nn  = sizeof (pointed to object)
     _SOME_POINTER_ := iTempY;
     either       
     iTempZ := @[iTempX];
     or
     *(iTempX) := ..something..
     if we find this then transform this to
     iTempX := _SOME_POINTER_;
     either       
     iTempZ := @[iTempX];
     or 
     *(iTempX) := ..something..
     iTempY := _SOME_POINTER_ + nn ;   nn  = sizeof (pointed to object)
     _SOME_POINTER_ := iTempY; */

  /* sounds simple enough so lets start , here I use -ve
     tests all the way to return if any test fails */
  iCode *pgs, *sh, *st;

  if (!(sic->next && sic->next->next && sic->next->next->next))
    return;
  if (sic->next->op != '+' && sic->next->op != '-')
    return;
  if (!(sic->next->next->op == '=' &&
	!POINTER_SET (sic->next->next)))
    return;
  if (!isOperandEqual (IC_LEFT (sic->next), IC_RIGHT (sic)) ||
      !IS_OP_LITERAL (IC_RIGHT (sic->next)))
    return;
  if (operandLitValue (IC_RIGHT (sic->next)) !=
      getSize (operandType (IC_RIGHT (sic))->next))
    return;
  if (!isOperandEqual (IC_RESULT (sic->next->next),
		       IC_RIGHT (sic)))
    return;
  if (!isOperandEqual (IC_RESULT (sic->next), IC_RIGHT (sic->next->next)))
    return;
  if (!(pgs = findPointerGetSet (sic->next->next, IC_RESULT (sic))))
    return;

  /* found the patter .. now do the transformation */
  sh = sic->next;
  st = sic->next->next;

  /* take the two out of the chain */
  sic->next = st->next;
  st->next->prev = sic;

  /* and put them after the pointer get/set icode */
  if ((st->next = pgs->next))
    st->next->prev = st;
  pgs->next = sh;
  sh->prev = pgs;

}

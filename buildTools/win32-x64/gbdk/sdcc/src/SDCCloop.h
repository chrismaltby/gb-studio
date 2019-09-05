/*-------------------------------------------------------------------------

  SDCCloop.h - header file for loop detection & optimizations

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
#include "SDCCBBlock.h"
#include "SDCCcse.h"

#ifndef SDCCLOOP_H
#define SDCCLOOP_H 1

typedef struct region
  {

    unsigned int merged:1;
    eBBlock *entry;		/* entry Block */
    int containsLoops;		/* contains other loops */
    set *regBlocks;		/* set of all blocks */
    set *exits;			/* set of exits */
  }
region;

typedef struct induction
  {

    operand *sym;
    operand *asym;
    unsigned int op;
    long cval;
    iCode *ic;
  }
induction;

DEFSETFUNC (backEdges);
DEFSETFUNC (pregion);
DEFSETFUNC (pinduction);
int loopOptimizations (hTab *, eBBlock **, int);
int addressTaken (set *, operand *);
hTab *createLoopRegions (eBBlock **, int);
iCode *findDefInRegion (set *, operand *, eBBlock **);
int hasIncomingDefs (region *, operand *);
int findLoopEndSeq (region *);


#endif

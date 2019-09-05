/*-------------------------------------------------------------------------

  SDCCdflow.h - header file for data flow analysis & utility routines
                related to data flow.

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

#include "SDCCset.h"

#ifndef SDCCDFLOW_H
#define SDCCDFLOW_H 1

DEFSETFUNC (mergeInExprs);
DEFSETFUNC (ifKilledInBlock);
void computeDataFlow (eBBlock **, int);
DEFSETFUNC (mergeInDefs);
DEFSETFUNC (isDefAlive);
iCode *usedInRemaining (operand *, iCode *);
int usedBetweenPoints (operand *, iCode *, iCode *);
#endif

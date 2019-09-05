/*-------------------------------------------------------------------------

  SDCCcse.h - header file for Common Subexpressions

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

#include "SDCCicode.h"

#ifndef SDCCCSE_H
#define SDCCCSE_H 1

typedef struct cseDef
  {

    unsigned int key;
    operand *sym;		/* defining symbol */
    iCode *diCode;		/* defining instruction */

  }
cseDef;


cseDef *newCseDef (operand *, iCode *);
int isCseDefEqual (void *, void *);
int pcseDef (void *, va_list);
void algebraicOpts (iCode *);
DEFSETFUNC (ifDiCodeIsX);
int ifDiCodeIs (set *, iCode *);
DEFSETFUNC (ifDefSymIsX);
int ifDefSymIs (set *, operand *);
DEFSETFUNC (findPrevIc);
DEFSETFUNC (ifOperandsHave);
DEFSETFUNC (findCheaperOp);
int cseBBlock (eBBlock *, int, eBBlock **, int);
int cseAllBlocks (eBBlock **, int);
void ifxOptimize (iCode *, set *, int, eBBlock *, int *, eBBlock **, int);
void unsetDefsAndUses (iCode *);
void updateSpillLocation (iCode * ic,int);
void setUsesDefs (operand *, bitVect *, bitVect *, bitVect **);
void replaceAllSymBySym (iCode *, operand *, operand *, bitVect **);
#endif

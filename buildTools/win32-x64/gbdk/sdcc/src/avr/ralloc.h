/*-------------------------------------------------------------------------

  SDCCralloc.h - header file register allocation

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
#include "SDCCBBlock.h"
#ifndef SDCCRALLOC_H
#define SDCCRALLOC_H 1

enum
  {
    R0_IDX = 0, R1_IDX, R2_IDX, R3_IDX, R4_IDX,
    R5_IDX, R6_IDX, R7_IDX, R8_IDX, R9_IDX,
    R10_IDX, R11_IDX, R12_IDX, R13_IDX, R14_IDX,
    R15_IDX, R16_IDX, R17_IDX, R18_IDX, R19_IDX,
    R20_IDX, R21_IDX, R22_IDX, R23_IDX, R24_IDX,
    R25_IDX, R26_IDX, R27_IDX, R28_IDX, R29_IDX,
    R30_IDX, R31_IDX, X_IDX, Z_IDX, CND_IDX
  };


#define REG_PTR 0x01
#define REG_GPR 0x02
#define REG_SCR 0x04
#define REG_CND 0x08
#define REG_MASK 0x0f
#define REG_PAIR 0x10

/* definition for the registers */
typedef struct regs
  {
    short type;			/* can have value 
				   REG_GPR, REG_PTR or REG_CND */
    short rIdx;			/* index into register table */
    short otype;
    char *name;			/* name */
    char *dname;		/* name when direct access needed */
    char *base;			/* base address */
    short offset;		/* offset from the base */
    unsigned isFree:1;		/* is currently unassigned  */
    unsigned saveReq:1;		/* save required @ function entry ? */
  }
regs;
extern regs regsAVR[];

regs *avr_regWithIdx (int);

#endif

/*
 * Simulator of microcontrollers (uc390.cc)
 *
 * Copyright (C) 1999,99 Drotos Daniel, Talker Bt.
 * 
 * To contact author send email to drdani@mazsola.iit.uni-miskolc.hu
 *
 * uc390.cc - module created by Karl Bongers 2001, karl@turbobit.com
 */

/* This file is part of microcontroller simulator: ucsim.

UCSIM is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

UCSIM is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with UCSIM; see the file COPYING.  If not, write to the Free
Software Foundation, 59 Temple Place - Suite 330, Boston, MA
02111-1307, USA. */
/*@1@*/

#include "ddconfig.h"

#include <stdio.h>
#include <stdlib.h>
#include "i_string.h"

#include "glob.h"
#include "uc390cl.h"
#include "regs51.h"

/*
 * Names of instructions
 */
 
struct dis_entry disass_390f[]= {
  { 0x00, 0xff, ' ', 1, "NOP"},
   { 0x01, 0xff, 'A', 3, "AJMP %A"},
   { 0x02, 0xff, 'L', 4, "LJMP %l"},
  { 0x03, 0xff, ' ', 1, "RR A"},
  { 0x04, 0xff, ' ', 1, "INC A"},
  { 0x05, 0xff, ' ', 2, "INC %a"},
  { 0x06, 0xff, ' ', 1, "INC @R0"},
  { 0x07, 0xff, ' ', 1, "INC @R1"},
  { 0x08, 0xff, ' ', 1, "INC R0"},
  { 0x09, 0xff, ' ', 1, "INC R1"},
  { 0x0a, 0xff, ' ', 1, "INC R2"},
  { 0x0b, 0xff, ' ', 1, "INC R3"},
  { 0x0c, 0xff, ' ', 1, "INC R4"},
  { 0x0d, 0xff, ' ', 1, "INC R5"},
  { 0x0e, 0xff, ' ', 1, "INC R6"},
  { 0x0f, 0xff, ' ', 1, "INC R7"},
  { 0x10, 0xff, 'R', 3, "JBC %b,%R"},
   { 0x11, 0xff, 'a', 3, "ACALL %A"},
   { 0x12, 0xff, 'l', 4, "LCALL %l"},
  { 0x13, 0xff, ' ', 1, "RRC A"},
  { 0x14, 0xff, ' ', 1, "DEC A"},
  { 0x15, 0xff, ' ', 2, "DEC %a"},
  { 0x16, 0xff, ' ', 1, "DEC @R0"},
  { 0x17, 0xff, ' ', 1, "DEC @R1"},
  { 0x18, 0xff, ' ', 1, "DEC R0"},
  { 0x19, 0xff, ' ', 1, "DEC R1"},
  { 0x1a, 0xff, ' ', 1, "DEC R2"},
  { 0x1b, 0xff, ' ', 1, "DEC R3"},
  { 0x1c, 0xff, ' ', 1, "DEC R4"},
  { 0x1d, 0xff, ' ', 1, "DEC R5"},
  { 0x1e, 0xff, ' ', 1, "DEC R6"},
  { 0x1f, 0xff, ' ', 1, "DEC R7"},
  { 0x20, 0xff, 'R', 3, "JB %b,%R"},
   { 0x21, 0xff, 'A', 3, "AJMP %A"},
  { 0x22, 0xff, '_', 1, "RET"},
  { 0x23, 0xff, ' ', 1, "RL A"},
  { 0x24, 0xff, ' ', 2, "ADD A,#%d"},
  { 0x25, 0xff, ' ', 2, "ADD A,%a"},
  { 0x26, 0xff, ' ', 1, "ADD A,@R0"},
  { 0x27, 0xff, ' ', 1, "ADD A,@R1"},
  { 0x28, 0xff, ' ', 1, "ADD A,R0"},
  { 0x29, 0xff, ' ', 1, "ADD A,R1"},
  { 0x2a, 0xff, ' ', 1, "ADD A,R2"},
  { 0x2b, 0xff, ' ', 1, "ADD A,R3"},
  { 0x2c, 0xff, ' ', 1, "ADD A,R4"},
  { 0x2d, 0xff, ' ', 1, "ADD A,R5"},
  { 0x2e, 0xff, ' ', 1, "ADD A,R6"},
  { 0x2f, 0xff, ' ', 1, "ADD A,R7"},
  { 0x30, 0xff, 'R', 3, "JNB %b,%R"},
   { 0x31, 0xff, 'a', 3, "ACALL %A"},
  { 0x32, 0xff, '_', 1, "RETI"},
  { 0x33, 0xff, ' ', 1, "RLC A"},
  { 0x34, 0xff, ' ', 2, "ADDC A,#%d"},
  { 0x35, 0xff, ' ', 2, "ADDC A,%a"},
  { 0x36, 0xff, ' ', 1, "ADDC A,@R0"},
  { 0x37, 0xff, ' ', 1, "ADDC A,@R1"},
  { 0x38, 0xff, ' ', 1, "ADDC A,R0"},
  { 0x39, 0xff, ' ', 1, "ADDC A,R1"},
  { 0x3a, 0xff, ' ', 1, "ADDC A,R2"},
  { 0x3b, 0xff, ' ', 1, "ADDC A,R3"},
  { 0x3c, 0xff, ' ', 1, "ADDC A,R4"},
  { 0x3d, 0xff, ' ', 1, "ADDC A,R5"},
  { 0x3e, 0xff, ' ', 1, "ADDC A,R6"},
  { 0x3f, 0xff, ' ', 1, "ADDC A,R7"},
  { 0x40, 0xff, 'r', 2, "JC %r"},
   { 0x41, 0xff, 'A', 3, "AJMP %A"},
  { 0x42, 0xff, ' ', 2, "ORL %a,A"},
  { 0x43, 0xff, ' ', 3, "ORL %a,#%D"},
  { 0x44, 0xff, ' ', 2, "ORL A,#%d"},
  { 0x45, 0xff, ' ', 2, "ORL A,%a"},
  { 0x46, 0xff, ' ', 1, "ORL A,@R0"},
  { 0x47, 0xff, ' ', 1, "ORL A,@R1"},
  { 0x48, 0xff, ' ', 1, "ORL A,R0"},
  { 0x49, 0xff, ' ', 1, "ORL A,R1"},
  { 0x4a, 0xff, ' ', 1, "ORL A,R2"},
  { 0x4b, 0xff, ' ', 1, "ORL A,R3"},
  { 0x4c, 0xff, ' ', 1, "ORL A,R4"},
  { 0x4d, 0xff, ' ', 1, "ORL A,R5"},
  { 0x4e, 0xff, ' ', 1, "ORL A,R6"},
  { 0x4f, 0xff, ' ', 1, "ORL A,R7"},
  { 0x50, 0xff, 'r', 2, "JNC %r"},
   { 0x51, 0xff, 'a', 3, "ACALL %A"},
  { 0x52, 0xff, ' ', 2, "ANL %a,A"},
  { 0x53, 0xff, ' ', 3, "ANL %a,#%D"},
  { 0x54, 0xff, ' ', 2, "ANL A,#%d"},
  { 0x55, 0xff, ' ', 2, "ANL A,%a"},
  { 0x56, 0xff, ' ', 1, "ANL A,@R0"},
  { 0x57, 0xff, ' ', 1, "ANL A,@R1"},
  { 0x58, 0xff, ' ', 1, "ANL A,R0"},
  { 0x59, 0xff, ' ', 1, "ANL A,R1"},
  { 0x5a, 0xff, ' ', 1, "ANL A,R2"},
  { 0x5b, 0xff, ' ', 1, "ANL A,R3"},
  { 0x5c, 0xff, ' ', 1, "ANL A,R4"},
  { 0x5d, 0xff, ' ', 1, "ANL A,R5"},
  { 0x5e, 0xff, ' ', 1, "ANL A,R6"},
  { 0x5f, 0xff, ' ', 1, "ANL A,R7"},
  { 0x60, 0xff, 'r', 2, "JZ %r"},
   { 0x61, 0xff, 'A', 3, "AJMP %A"},
  { 0x62, 0xff, ' ', 2, "XRL %a,A"},
  { 0x63, 0xff, ' ', 3, "XRL %a,#%D"},
  { 0x64, 0xff, ' ', 2, "XRL A,#%d"},
  { 0x65, 0xff, ' ', 2, "XRL A,%a"},
  { 0x66, 0xff, ' ', 1, "XRL A,@R0"},
  { 0x67, 0xff, ' ', 1, "XRL A,@R1"},
  { 0x68, 0xff, ' ', 1, "XRL A,R0"},
  { 0x69, 0xff, ' ', 1, "XRL A,R1"},
  { 0x6a, 0xff, ' ', 1, "XRL A,R2"},
  { 0x6b, 0xff, ' ', 1, "XRL A,R3"},
  { 0x6c, 0xff, ' ', 1, "XRL A,R4"},
  { 0x6d, 0xff, ' ', 1, "XRL A,R5"},
  { 0x6e, 0xff, ' ', 1, "XRL A,R6"},
  { 0x6f, 0xff, ' ', 1, "XRL A,R7"},
  { 0x70, 0xff, 'r', 2, "JNZ %r"},
   { 0x71, 0xff, 'a', 3, "ACALL %A"},
  { 0x72, 0xff, ' ', 2, "ORL C,%b"},
  { 0x73, 0xff, '_', 1, "JMP @A+DPTR"},
  { 0x74, 0xff, ' ', 2, "MOV A,#%d"},
  { 0x75, 0xff, ' ', 3, "MOV %a,#%D"},
  { 0x76, 0xff, ' ', 2, "MOV @R0,#%d"},
  { 0x77, 0xff, ' ', 2, "MOV @R1,#%d"},
  { 0x78, 0xff, ' ', 2, "MOV R0,#%d"},
  { 0x79, 0xff, ' ', 2, "MOV R1,#%d"},
  { 0x7a, 0xff, ' ', 2, "MOV R2,#%d"},
  { 0x7b, 0xff, ' ', 2, "MOV R3,#%d"},
  { 0x7c, 0xff, ' ', 2, "MOV R4,#%d"},
  { 0x7d, 0xff, ' ', 2, "MOV R5,#%d"},
  { 0x7e, 0xff, ' ', 2, "MOV R6,#%d"},
  { 0x7f, 0xff, ' ', 2, "MOV R7,#%d"},
  { 0x80, 0xff, 's', 2, "SJMP %r"},
   { 0x81, 0xff, 'A', 3, "AJMP %A"},
  { 0x82, 0xff, ' ', 2, "ANL C,%b"},
  { 0x83, 0xff, ' ', 1, "MOVC A,@A+PC"},
  { 0x84, 0xff, ' ', 1, "DIV AB"},
  { 0x85, 0xff, ' ', 3, "MOV %8,%a"},
  { 0x86, 0xff, ' ', 2, "MOV %a,@R0"},
  { 0x87, 0xff, ' ', 2, "MOV %a,@R1"},
  { 0x88, 0xff, ' ', 2, "MOV %a,R0"},
  { 0x89, 0xff, ' ', 2, "MOV %a,R1"},
  { 0x8a, 0xff, ' ', 2, "MOV %a,R2"},
  { 0x8b, 0xff, ' ', 2, "MOV %a,R3"},
  { 0x8c, 0xff, ' ', 2, "MOV %a,R4"},
  { 0x8d, 0xff, ' ', 2, "MOV %a,R5"},
  { 0x8e, 0xff, ' ', 2, "MOV %a,R6"},
  { 0x8f, 0xff, ' ', 2, "MOV %a,R7"},
   { 0x90, 0xff, ' ', 4, "MOV DPTR,#%6"},
   { 0x91, 0xff, 'a', 3, "ACALL %A"},
  { 0x92, 0xff, ' ', 2, "MOV %b,C"},
  { 0x93, 0xff, ' ', 1, "MOVC A,@A+DPTR"},
  { 0x94, 0xff, ' ', 2, "SUBB A,#%d"},
  { 0x95, 0xff, ' ', 2, "SUBB A,%a"},
  { 0x96, 0xff, ' ', 1, "SUBB A,@R0"},
  { 0x97, 0xff, ' ', 1, "SUBB A,@R1"},
  { 0x98, 0xff, ' ', 1, "SUBB A,R0"},
  { 0x99, 0xff, ' ', 1, "SUBB A,R1"},
  { 0x9a, 0xff, ' ', 1, "SUBB A,R2"},
  { 0x9b, 0xff, ' ', 1, "SUBB A,R3"},
  { 0x9c, 0xff, ' ', 1, "SUBB A,R4"},
  { 0x9d, 0xff, ' ', 1, "SUBB A,R5"},
  { 0x9e, 0xff, ' ', 1, "SUBB A,R6"},
  { 0x9f, 0xff, ' ', 1, "SUBB A,R7"},
  { 0xa0, 0xff, ' ', 2, "ORL C,/%b"},
   { 0xa1, 0xff, 'A', 3, "AJMP %A"},
  { 0xa2, 0xff, ' ', 2, "MOV C,%b"},
  { 0xa3, 0xff, ' ', 1, "INC DPTR"},
  { 0xa4, 0xff, ' ', 1, "MUL AB"},
  { 0xa5, 0xff, '_', 1, "-"},
  { 0xa6, 0xff, ' ', 2, "MOV @R0,%a"},
  { 0xa7, 0xff, ' ', 2, "MOV @R1,%a"},
  { 0xa8, 0xff, ' ', 2, "MOV R0,%a"},
  { 0xa9, 0xff, ' ', 2, "MOV R1,%a"},
  { 0xaa, 0xff, ' ', 2, "MOV R2,%a"},
  { 0xab, 0xff, ' ', 2, "MOV R3,%a"},
  { 0xac, 0xff, ' ', 2, "MOV R4,%a"},
  { 0xad, 0xff, ' ', 2, "MOV R5,%a"},
  { 0xae, 0xff, ' ', 2, "MOV R6,%a"},
  { 0xaf, 0xff, ' ', 2, "MOV R7,%a"},
  { 0xb0, 0xff, ' ', 2, "ANL C,/%b"},
   { 0xb1, 0xff, 'a', 3, "ACALL %A"},
  { 0xb2, 0xff, ' ', 2, "CPL %b"},
  { 0xb3, 0xff, ' ', 1, "CPL C"},
  { 0xb4, 0xff, 'R', 3, "CJNE A,#%d,%R"},
  { 0xb5, 0xff, 'R', 3, "CJNE A,%a,%R"},
  { 0xb6, 0xff, 'R', 3, "CJNE @R0,#%d,%R"},
  { 0xb7, 0xff, 'R', 3, "CJNE @R1,#%d,%R"},
  { 0xb8, 0xff, 'R', 3, "CJNE R0,#%d,%R"},
  { 0xb9, 0xff, 'R', 3, "CJNE R1,#%d,%R"},
  { 0xba, 0xff, 'R', 3, "CJNE R2,#%d,%R"},
  { 0xbb, 0xff, 'R', 3, "CJNE R3,#%d,%R"},
  { 0xbc, 0xff, 'R', 3, "CJNE R4,#%d,%R"},
  { 0xbd, 0xff, 'R', 3, "CJNE R5,#%d,%R"},
  { 0xbe, 0xff, 'R', 3, "CJNE R6,#%d,%R"},
  { 0xbf, 0xff, 'R', 3, "CJNE R7,#%d,%R"},
  { 0xc0, 0xff, ' ', 2, "PUSH %a"},
   { 0xc1, 0xff, 'A', 3, "AJMP %A"},
  { 0xc2, 0xff, ' ', 2, "CLR %b"},
  { 0xc3, 0xff, ' ', 1, "CLR C"},
  { 0xc4, 0xff, ' ', 1, "SWAP A"},
  { 0xc5, 0xff, ' ', 2, "XCH A,%a"},
  { 0xc6, 0xff, ' ', 1, "XCH A,@R0"},
  { 0xc7, 0xff, ' ', 1, "XCH A,@R1"},
  { 0xc8, 0xff, ' ', 1, "XCH A,R0"},
  { 0xc9, 0xff, ' ', 1, "XCH A,R1"},
  { 0xca, 0xff, ' ', 1, "XCH A,R2"},
  { 0xcb, 0xff, ' ', 1, "XCH A,R3"},
  { 0xcc, 0xff, ' ', 1, "XCH A,R4"},
  { 0xcd, 0xff, ' ', 1, "XCH A,R5"},
  { 0xce, 0xff, ' ', 1, "XCH A,R6"},
  { 0xcf, 0xff, ' ', 1, "XCH A,R7"},
  { 0xd0, 0xff, ' ', 2, "POP %a"},
   { 0xd1, 0xff, 'a', 3, "ACALL %A"},
  { 0xd2, 0xff, ' ', 2, "SETB %b"},
  { 0xd3, 0xff, ' ', 1, "SETB C"},
  { 0xd4, 0xff, ' ', 1, "DA A"},
  { 0xd5, 0xff, 'R', 3, "DJNZ %a,%R"},
  { 0xd6, 0xff, ' ', 1, "XCHD A,@R0"},
  { 0xd7, 0xff, ' ', 1, "XCHD A,@R1"},
  { 0xd8, 0xff, 'r', 2, "DJNZ R0,%r"},
  { 0xd9, 0xff, 'r', 2, "DJNZ R1,%r"},
  { 0xda, 0xff, 'r', 2, "DJNZ R2,%r"},
  { 0xdb, 0xff, 'r', 2, "DJNZ R3,%r"},
  { 0xdc, 0xff, 'r', 2, "DJNZ R4,%r"},
  { 0xdd, 0xff, 'r', 2, "DJNZ R5,%r"},
  { 0xde, 0xff, 'r', 2, "DJNZ R6,%r"},
  { 0xdf, 0xff, 'r', 2, "DJNZ R7,%r"},
  { 0xe0, 0xff, ' ', 1, "MOVX A,@DPTR"},
   { 0xe1, 0xff, 'A', 3, "AJMP %A"},
  { 0xe2, 0xff, ' ', 1, "MOVX A,@R0"},
  { 0xe3, 0xff, ' ', 1, "MOVX A,@R1"},
  { 0xe4, 0xff, ' ', 1, "CLR A"},
  { 0xe5, 0xff, ' ', 2, "MOV A,%a"},
  { 0xe6, 0xff, ' ', 1, "MOV A,@R0"},
  { 0xe7, 0xff, ' ', 1, "MOV A,@R1"},
  { 0xe8, 0xff, ' ', 1, "MOV A,R0"},
  { 0xe9, 0xff, ' ', 1, "MOV A,R1"},
  { 0xea, 0xff, ' ', 1, "MOV A,R2"},
  { 0xeb, 0xff, ' ', 1, "MOV A,R3"},
  { 0xec, 0xff, ' ', 1, "MOV A,R4"},
  { 0xed, 0xff, ' ', 1, "MOV A,R5"},
  { 0xee, 0xff, ' ', 1, "MOV A,R6"},
  { 0xef, 0xff, ' ', 1, "MOV A,R7"},
  { 0xf0, 0xff, ' ', 1, "MOVX @DPTR,A"},
   { 0xf1, 0xff, 'a', 3, "ACALL %A"},
  { 0xf2, 0xff, ' ', 1, "MOVX @R0,A"},
  { 0xf3, 0xff, ' ', 1, "MOVX @R1,A"},
  { 0xf4, 0xff, ' ', 1, "CPL A"},
  { 0xf5, 0xff, ' ', 2, "MOV %a,A"},
  { 0xf6, 0xff, ' ', 1, "MOV @R0,A"},
  { 0xf7, 0xff, ' ', 1, "MOV @R1,A"},
  { 0xf8, 0xff, ' ', 1, "MOV R0,A"},
  { 0xf9, 0xff, ' ', 1, "MOV R1,A"},
  { 0xfa, 0xff, ' ', 1, "MOV R2,A"},
  { 0xfb, 0xff, ' ', 1, "MOV R3,A"},
  { 0xfc, 0xff, ' ', 1, "MOV R4,A"},
  { 0xfd, 0xff, ' ', 1, "MOV R5,A"},
  { 0xfe, 0xff, ' ', 1, "MOV R6,A"},
  { 0xff, 0xff, ' ', 1, "MOV R7,A"},
  { 0, 0, 0, 0, NULL }
};

/*
 * Making an 390 CPU object
 */

t_uc390::t_uc390(int Itype, int Itech, class cl_sim *asim):
  t_uc52(Itype, Itech, asim)
{
  if (Itype == CPU_DS390F) {
    printf("FLAT24 MODE SET, warning: experimental code\n");
    flat24_flag = 1;
  }
}


/*
 * 0x05 2 12 INC addr
 *____________________________________________________________________________
 *
 */
int
t_uc390::inst_inc_addr(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);

  /* mask off the 2Hex bit adjacent to the 1H bit which selects
     which DPTR we use.  This is a feature of 80C390.
     You can do INC DPS and it only effects bit 1. */
  if (code  == DPS)
    (*addr) ^= 1;  /* just toggle */
  else {
    (*addr)++;
  }

  proc_write(addr);
  return(resGO);
}

/*
 * 0xa3 1 24 INC DPTR
 *____________________________________________________________________________
 *
 */

int
t_uc390::inst_inc_dptr(uchar code)
{
  uint dptr;

  unsigned char pl,ph,dps;

  dps = sfr->get(DPS);
  if (dps & 1) {
    pl = DPL1;
    ph = DPH1;
  } else {
    pl = DPL;
    ph = DPH;
  }

  if (dps & 1) { /* alternate DPTR */
    if (dps & 0x80)  /* decr set */
      dptr= sfr->get(ph)*256 + sfr->get(pl) - 1;
    else
      dptr= sfr->get(ph)*256 + sfr->get(pl) + 1;
  } else {
    if (dps & 0x40)  /* decr set */
      dptr= sfr->get(ph)*256 + sfr->get(pl) - 1;
    else
      dptr= sfr->get(ph)*256 + sfr->get(pl) + 1;
  }

  sfr->set(event_at.ws= ph, (dptr >> 8) & 0xff);
  sfr->set(pl, dptr & 0xff);

  if (dps & 0x20) {                  /* auto-switch dptr */
    sfr->set(DPS, (dps ^ 1));  /* toggle dual-dptr switch */
  }
  tick(1);
  return(resGO);
}

/*
 * 0x73 1 24 JMP @A+DPTR
 *____________________________________________________________________________
 *
 */

int
t_uc390::inst_jmp_$a_dptr(uchar code)
{
    unsigned char pl,ph,dps;

    dps = sfr->get(DPS);
    if (dps & 1) {
      pl = DPL1;
      ph = DPH1;
    } else {
      pl = DPL;
      ph = DPH;
    }

    PC= (sfr->get(ph)*256 + sfr->get(pl) +
         read_mem(MEM_SFR, ACC)) &
      (EROM_SIZE - 1);

  tick(1);
  return(resGO);
}

/*
 * 0x90 3 24 MOV DPTR,#data
 *____________________________________________________________________________
 *
 */

int
t_uc390::inst_mov_dptr_$data(uchar code)
{
    unsigned char pl,ph,dps;

    dps = sfr->get(DPS);
    if (dps & 1) {
      pl = DPL1;
      ph = DPH1;
    } else {
      pl = DPL;
      ph = DPH;
    }

    //if ((sfr->get(ACON) & 0x3) == 2)
    if (flat24_flag) {
      fetch();  /* throw away msb of address for now */
    }

    sfr->set(event_at.ws= ph, fetch());
    sfr->set(pl, fetch());

    if (dps & 0x20) {                  /* auto-switch dptr */
      sfr->set(DPS, (dps ^ 1));  /* toggle dual-dptr switch */
    }

  tick(1);
  return(resGO);
}


/*
 * 0x93 1 24 MOVC A,@A+DPTR
 *____________________________________________________________________________
 *
 */

int
t_uc390::inst_movc_a_$a_dptr(uchar code)
{
    unsigned char pl,ph,dps;

    dps = sfr->get(DPS);
    if (dps & 1) {
      pl = DPL1;
      ph = DPH1;
    } else {
      pl = DPL;
      ph = DPH;
    }

    sfr->set(ACC, get_mem(MEM_ROM, event_at.rc=
          			(sfr->get(ph)*256+sfr->get(pl) +
         			 sfr->get(ACC)) & (EROM_SIZE-1)));

    if (dps & 0x20) {                  /* auto-switch dptr */
      sfr->set(DPS, (dps ^ 1));  /* toggle dual-dptr switch */
    }

  tick(1);
  return(resGO);
}

/*
 * 0xe0 1 24 MOVX A,@DPTR
 *____________________________________________________________________________
 *
 */

int
t_uc390::inst_movx_a_$dptr(uchar code)
{
    unsigned char pl,ph,dps;

    dps = sfr->get(DPS);
    if (dps & 1) {
      pl = DPL1;
      ph = DPH1;
    } else {
      pl = DPL;
      ph = DPH;
    }

    sfr->set(event_at.ws= ACC,
  	   get_mem(MEM_XRAM, event_at.rx=sfr->get(ph)*256+sfr->get(pl)));

    if (dps & 0x20) {                  /* auto-switch dptr */
      sfr->set(DPS, (dps ^ 1));  /* toggle dual-dptr switch */
    }
  tick(1);
  return(resGO);
}

/*
 * 0xf0 1 24 MOVX @DPTR,A
 *____________________________________________________________________________
 *
 */

int
t_uc390::inst_movx_$dptr_a(uchar code)
{
    unsigned char pl,ph,dps;

    dps = sfr->get(DPS);
    if (dps & 1) {
      pl = DPL1;
      ph = DPH1;
    } else {
      pl = DPL;
      ph = DPH;
    }

    set_mem(MEM_XRAM, event_at.wx= sfr->get(ph)*256+sfr->get(pl),
  	  sfr->get(event_at.rs= ACC));

    if (dps & 0x20) {                  /* auto-switch dptr */
      sfr->set(DPS, (dps ^ 1));  /* toggle dual-dptr switch */
    }
  tick(1);
  return(resGO);
}

/*
 * 0x[02468ace]1 2 24 AJMP addr
 *____________________________________________________________________________
 *
 */

int
t_uc390::inst_ajmp_addr(uchar code)
{
  uchar h, l;

  if (flat24_flag) {
    /* throw away high address byte for now... */
    h= (code >> 5) & 0x07;
    h= fetch();
    l= fetch();
    PC= (PC & 0xf800) | (h*256 + l);
  } else
  {
    h= (code >> 5) & 0x07;
    l= fetch();
    PC= (PC & 0xf800) | (h*256 + l);
  }
  tick(1);

  return(resGO);
}

/*
 * 0x02 3 24 LJMP addr
 *____________________________________________________________________________
 *
 */

int
t_uc390::inst_ljmp(uchar code)
{
  if (flat24_flag) {
    fetch(); /* throw away msb of address for now */

    PC= fetch()*256 + fetch();
  } else {
    PC= fetch()*256 + fetch();
  }
  tick(1);
  return(resGO);
}

/*
 * 0x[13579bdf]1 2 24 ACALL addr
 *____________________________________________________________________________
 *
 */

int
t_uc390::inst_acall_addr(uchar code)
{
  uchar h, l, *sp, *aof_SP;
  int res;

  if (flat24_flag) {
    /* throw away msb of address for now */
    h= (code >> 5) & 0x07;

    h= fetch();
    l= fetch();

    aof_SP= &((sfr->umem8)[SP]);
    //MEM(MEM_SFR)[SP]++;
    (*aof_SP)++;
    proc_write_sp(*aof_SP);
    sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
    if (res != resGO)
      res= resSTACK_OV;
    (*sp)= PC & 0xff; // push low byte

    //MEM(MEM_SFR)[SP]++;
    (*aof_SP)++;
    proc_write_sp(*aof_SP);
    sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
    if (res != resGO)
      res= resSTACK_OV;
    (*sp)= (PC >> 8) & 0xff; // push high byte
    PC= (PC & 0xf800) | (h*256 + l);

    // need to push msb, skip for now...

  } else {
    /* stock mcs51 mode */
    h= (code >> 5) & 0x07;
    l= fetch();
    aof_SP= &((sfr->umem8)[SP]);
    //MEM(MEM_SFR)[SP]++;
    (*aof_SP)++;
    proc_write_sp(*aof_SP);
    sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
    if (res != resGO)
      res= resSTACK_OV;
    (*sp)= PC & 0xff; // push low byte

    //MEM(MEM_SFR)[SP]++;
    (*aof_SP)++;
    proc_write_sp(*aof_SP);
    sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
    if (res != resGO)
      res= resSTACK_OV;
    (*sp)= (PC >> 8) & 0xff; // push high byte
    PC= (PC & 0xf800) | (h*256 + l);
  }

  tick(1);
  return(res);
}


/*
 * 0x12 3 24 LCALL addr
 *____________________________________________________________________________
 *
 */

int
t_uc390::inst_lcall(uchar code, uint addr)
{
  uchar h= 0, l= 0, *sp, *aof_SP;
  int res;

  if (!addr)
    {
      /* this is a normal lcall */
      if (flat24_flag) {
        fetch();  /* drop for now */
        h= fetch();
        l= fetch();
      } else {
        h= fetch();
        l= fetch();
      }
    }
    /* else, this is interrupt processing */

  aof_SP= &((sfr->umem8)[SP]);
  //MEM(MEM_SFR)[SP]++;
  (*aof_SP)++;
  proc_write_sp(*aof_SP);
  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  (*sp)= PC & 0xff; // push low byte
  if (!addr)
    tick(1);

  //MEM(MEM_SFR)[SP]++;
  (*aof_SP)++;
  proc_write_sp(*aof_SP);
  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  (*sp)= (PC >> 8) & 0xff; // push high byte
  if (addr)
    PC= addr;
  else
    PC= h*256 + l;


  return(res);
}

/*
 * 0x22 1 24 RET
 *____________________________________________________________________________
 *
 */

int
t_uc390::inst_ret(uchar code)
{
  uchar h, l, *sp, *aof_SP;
  int res;

  aof_SP= &((sfr->umem8)[SP]);
  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  h= *sp;
  //MEM(MEM_SFR)[SP]--;
  (*aof_SP)--;
  proc_write_sp(*aof_SP);
  tick(1);

  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  l= *sp;
  //MEM(MEM_SFR)[SP]--;
  (*aof_SP)--;
  proc_write_sp(*aof_SP);
  PC= h*256 + l;

  if (flat24_flag) {
    tick(1);
  }

  return(res);
}

/*
 * 0x32 1 24 RETI
 *____________________________________________________________________________
 *
 */

int
t_uc390::inst_reti(uchar code)
{
  uchar h, l, *sp, *aof_SP;
  int res;

  aof_SP= &((sfr->umem8)[SP]);
  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  h= *sp;
  //MEM(MEM_SFR)[SP]--;
  (*aof_SP)--;
  proc_write_sp(*aof_SP);
  tick(1);

  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  l= *sp;
  //MEM(MEM_SFR)[SP]--;
  (*aof_SP)--;
  proc_write_sp(*aof_SP);
  PC= h*256 + l;

  if (flat24_flag) {
    tick(1);
  }

  was_reti= DD_TRUE;
  class it_level *il= (class it_level *)(it_levels->top());
  if (il &&
      il->level >= 0)
    {
      il= (class it_level *)(it_levels->pop());
      delete il;
    }

  return(res);
}

/*
 * Disassembling an instruction
 */

struct dis_entry *
t_uc390::dis_tbl(void)
{
  if (!flat24_flag) {
    return(disass_51);
    //t_uc51::dis_tbl();
  }

  return(disass_390f);
}

char *
t_uc390::disass(t_addr addr, char *sep)
{
  char work[256], temp[20], c[2];
  char *buf, *p, *b, *t;
  t_mem code;

  if (!flat24_flag) {
    t_uc51::disass(addr, sep);
  }

  code= get_mem(MEM_ROM, addr);
  p= work;
  b= dis_tbl()[code].mnemonic;
  while (*b)
    {
      if (*b == '%')
	{
	  b++;
	  switch (*(b++))
	    {
	    case 'A': // absolute address
       // stock:
	      //sprintf(temp, "%04lx",
		     // (addr&0xf800)|
		     // (((code>>5)&0x07)*256 +
		     //  get_mem(MEM_ROM, addr+1)));

	      sprintf(temp, "%06lx",
		      (addr&0xf80000)|
		      (((code>>5)&0x07)*(256*256) +
		       (get_mem(MEM_ROM, addr+1) * 256) +
 		       get_mem(MEM_ROM, addr+2)));
	      break;
	    case 'l': // long address
	      sprintf(temp, "%06lx",
		      get_mem(MEM_ROM, addr+1)*(256*256) + get_mem(MEM_ROM, addr+1)*256
        + get_mem(MEM_ROM, addr+2));
		      //get_mem(MEM_ROM, addr+1)*256 + get_mem(MEM_ROM, addr+2));
	      break;
	    case 'a': // addr8 (direct address) at 2nd byte
 	      if (!get_name(get_mem(MEM_ROM, addr+1), sfr_tbl(), temp))
		sprintf(temp, "%02lx", get_mem(MEM_ROM, addr+1));
	      break;
	    case '8': // addr8 (direct address) at 3rd byte
 	      if (!get_name(get_mem(MEM_ROM, addr+2), sfr_tbl(), temp))
		sprintf(temp, "%02lx", get_mem(MEM_ROM, addr+1));
	      sprintf(temp, "%02lx", get_mem(MEM_ROM, addr+2));
	      break;
	    case 'b': // bitaddr at 2nd byte
	      if (get_name(get_mem(MEM_ROM, addr+1), bit_tbl(), temp))
		break;
	      if (get_name(get_bitidx(get_mem(MEM_ROM, addr+1)),
			   sfr_tbl(), temp))
		{
		  strcat(temp, ".");
		  sprintf(c, "%1ld", get_mem(MEM_ROM, addr+1)&0x07);
		  strcat(temp, c);
		  break;
		}
	      sprintf(temp, "%02x.%ld",
		      get_bitidx(get_mem(MEM_ROM, addr+1)),
		      get_mem(MEM_ROM, addr+1)&0x07);
	      break;
	    case 'r': // rel8 address at 2nd byte
	      sprintf(temp, "%04lx",
		      addr+2+(signed char)(get_mem(MEM_ROM, addr+1)));
	      break;
	    case 'R': // rel8 address at 3rd byte
	      sprintf(temp, "%04lx",
		      addr+3+(signed char)(get_mem(MEM_ROM, addr+2)));
	      break;
	    case 'd': // data8 at 2nd byte
	      sprintf(temp, "%02lx", get_mem(MEM_ROM, addr+1));
	      break;
	    case 'D': // data8 at 3rd byte
	      sprintf(temp, "%02lx", get_mem(MEM_ROM, addr+2));
	      break;
	    case '6': // data24 at 2nd(HH)-3rd(H)-4th(L) byte
	      sprintf(temp, "%06lx",
		      get_mem(MEM_ROM, addr+1)*256*256 + get_mem(MEM_ROM, addr+2)*256 +
                get_mem(MEM_ROM, addr+3));
	    default:
	      strcpy(temp, "?");
	      break;
	    }
	  t= temp;
	  while (*t)
	    *(p++)= *(t++);
	}
      else
	*(p++)= *(b++);
    }
  *p= '\0';

  p= strchr(work, ' ');
  if (!p)
    {
      buf= strdup(work);
      return(buf);
    }
  if (sep == NULL)
    buf= (char *)malloc(6+strlen(p)+1);
  else
    buf= (char *)malloc((p-work)+strlen(sep)+strlen(p)+1);
  for (p= work, b= buf; *p != ' '; p++, b++)
    *b= *p;
  p++;
  *b= '\0';
  if (sep == NULL)
    {
      while (strlen(buf) < 6)
	strcat(buf, " ");
    }
  else
    strcat(buf, sep);
  strcat(buf, p);
  return(buf);
}

/* End of s51.src/uc390.cc */

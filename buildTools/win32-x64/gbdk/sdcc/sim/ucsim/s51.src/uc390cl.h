/*
 * Simulator of microcontrollers (uc390cl.h)
 *
 * Copyright (C) 1999,99 Drotos Daniel, Talker Bt.
 * 
 * To contact author send email to drdani@mazsola.iit.uni-miskolc.hu
 *
 * uc390cl.h - implemented by Karl Bongers, karl@turbobit.com
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

#ifndef UC390CL_HEADER
#define UC390CL_HEADER

#include "ddconfig.h"

#include "uc52cl.h"

class t_uc390: public t_uc52
{
public:
  t_uc390(int Itype, int Itech, class cl_sim *asim);
  int flat24_flag; /* true if flat24 mode code: ((ACON:9Dh & 3) == 0x2) */

/* mods for dual-dptr */
virtual int inst_inc_addr(uchar code);
virtual int inst_inc_dptr(uchar code);
virtual int inst_jmp_$a_dptr(uchar code);
virtual int inst_mov_dptr_$data(uchar code);
virtual int inst_movc_a_$a_dptr(uchar code);
virtual int inst_movx_a_$dptr(uchar code);
virtual int inst_movx_$dptr_a(uchar code);

/* mods for flat24 */
virtual int inst_ajmp_addr(uchar code);
virtual int inst_ljmp(uchar code);
virtual int inst_acall_addr(uchar code);
virtual int inst_lcall(uchar code, uint addr);
virtual int inst_ret(uchar code);
virtual int inst_reti(uchar code);

/* mods for disassembly of flat24 */
virtual struct dis_entry *dis_tbl(void);
virtual char * disass(t_addr addr, char *sep);

};

#endif
/* End of s51.src/uc390cl.h */

/*
 * Simulator of microcontrollers (timer1cl.h)
 *
 * Copyright (C) 1999,99 Drotos Daniel, Talker Bt.
 * 
 * To contact author send email to drdani@mazsola.iit.uni-miskolc.hu
 *
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

#ifndef TIMER1CL_HEADER
#define TIMER1CL_HEADER

#include "stypes.h"
#include "pobjcl.h"
#include "uccl.h"

#include "newcmdcl.h"


class cl_timer1: public cl_hw
{
public:
  cl_timer1(class cl_uc *auc);
  //virtual int init(void);

  //virtual ulong read(class cl_mem *mem, long addr);
  //virtual void write(class cl_mem *mem, long addr, ulong *val);

  //virtual int tick(int cycles);
  virtual void print_info(class cl_console *con);
};


#endif

/* End of s51.src/timer1cl.h */

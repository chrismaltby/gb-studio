/*
 * Simulator of microcontrollers (sim.src/stackcl.h)
 *
 * Copyright (C) 2000,00 Drotos Daniel, Talker Bt.
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

#ifndef SIM_STACKCL_HEADER
#define SIM_STACKCL_HEADER

#include "stypes.h"
#include "pobjcl.h"


enum stack_op {
  stack_call,
  stack_push,
  stack_ret,
  stack_pop
};

class cl_stack_op: public cl_base
{
public:
  enum stack_op type;
  t_addr PC;	// of instruction
  t_addr addr;	// called routine
  t_mem  data;	// pushed data
  t_addr SP_before;
  t_addr SP_after;
public:
  cl_stack_op(enum stack_op itype,
	      t_addr iPC, t_addr iaddr, t_mem idata,
	      t_addr iSP_before, t_addr iSP_after);
  ~cl_stack_op(void);
};


#endif

/* End of sim.src/stackcl.h */

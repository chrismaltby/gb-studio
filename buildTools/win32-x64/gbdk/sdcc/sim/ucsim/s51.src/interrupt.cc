/*
 * Simulator of microcontrollers (interrupt.cc)
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

// sim
#include "itsrccl.h"

// local
#include "interruptcl.h"
#include "regs51.h"


cl_interrupt::cl_interrupt(class cl_uc *auc):
  cl_hw(auc, HW_INTERRUPT, 0, "irq")
{}

/*int
cl_interrupt::init(void)
{
  return(0);
}*/

void
cl_interrupt::print_info(class cl_console *con)
{
  int ie= uc->get_mem(MEM_SFR, IE);
  int i;

  con->printf("Interrupts are %s. Interrupt sources:\n",
	      (ie&bmEA)?"enabled":"disabled");
  con->printf("  Handler  En  Pr Req Act Name\n");
  for (i= 0; i < uc->it_sources->count; i++)
    {
      class cl_it_src *is= (class cl_it_src *)(uc->it_sources->at(i));
      con->printf("  0x%06x", is->addr);
      con->printf(" %-3s", (ie&(is->ie_mask))?"en":"dis");
      con->printf(" %2d", uc->it_priority(is->ie_mask));
      con->printf(" %-3s",
		  (uc->get_mem(MEM_SFR, is->src_reg)&(is->src_mask))?
		  "YES":"no");
      con->printf(" %-3s", (is->active)?"act":"no");
      con->printf(" %s", is->name);
      con->printf("\n");
    }
  con->printf("Active interrupt service(s):\n");
  con->printf("  Pr Handler  PC       Source\n");
  for (i= 0; i < uc->it_levels->count; i++)
    {
      class it_level *il= (class it_level *)(uc->it_levels->at(i));
      if (il->level >= 0)
	{
	  con->printf("  %2d", il->level);
	  con->printf(" 0x%06x", il->addr);
	  con->printf(" 0x%06x", il->PC);
	  con->printf(" %s", (il->source)?(il->source->name):"nothing");
	  con->printf("\n");
	}
    }
}


/* End of s51.src/interrupt.cc */

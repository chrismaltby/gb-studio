/*
 * Simulator of microcontrollers (cmd.src/info.cc)
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

#include <stdlib.h>
#include "i_string.h"

// sim.src
#include "simcl.h"
 
// local
#include "infocl.h"


/*
 * INFO BREAKPOINTS command
 */

//int
//cl_info_bp_cmd::do_work(class cl_sim *sim,
//			class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_info_bp_cmd)
{
  int i;
  char *s;

  con->printf("Num Type       Disp Hit   Cnt   Address  What\n");
  for (i= 0; i < uc->fbrk->count; i++)
    {
      class cl_brk *fb= (class cl_brk *)(uc->fbrk->at(i));
      s= uc->disass(fb->addr, NULL);
      con->printf("%-3d %-10s %s %-5d %-5d 0x%06x %s\n", fb->nr,
		  "fetch", (fb->perm==brkFIX)?"keep":"del ",
		  fb->hit, fb->cnt,
		  fb->addr, s);
      free(s);
    }
  for (i= 0; i < uc->ebrk->count; i++)
    {
      class cl_ev_brk *eb= (class cl_ev_brk *)(uc->ebrk->at(i));
      con->printf("%-3d %-10s %s %-5d %-5d 0x%06x %s\n", eb->nr,
		  "event", (eb->perm==brkFIX)?"keep":"del ",
		  eb->hit, eb->cnt,
		  eb->addr, eb->id);
    }
  /*t_addr a;
  class cl_rom *r= (class cl_rom *)(sim->uc->mem(MEM_ROM));
  for (a= 0; a < sim->uc->get_mem_size(MEM_ROM); a++)
    {
      if (r->bp_map->get(a))
	con->printf("0x%06x\n", a);
	}*/
  return(0);
}


/*
 * INFO REGISTERS command
 */

//int
//cl_info_reg_cmd::do_work(class cl_sim *sim,
//			 class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_info_reg_cmd)
{
  uc->print_regs(con);
  return(0);
}


/*
 * INFO HW command
 */

//int
//cl_info_hw_cmd::do_work(class cl_sim *sim,
//			class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_info_hw_cmd)
{
  class cl_hw *hw;
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };

  if (cmdline->syntax_match(uc, HW)) {
    hw= params[0]->value.hw;
    hw->print_info(con);
  }
  else
    con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");

  return(DD_FALSE);
}


/* End of cmd.src/info.cc */

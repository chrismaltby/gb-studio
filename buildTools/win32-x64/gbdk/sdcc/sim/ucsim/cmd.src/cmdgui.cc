/*
 * Simulator of microcontrollers (cmd.src/cmdgui.cc)
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

#include "ddconfig.h"

// prj
#include "globals.h"

// sim
#include "simcl.h"

// local
#include "cmdguicl.h"


/*
 * Command: gui start
 *----------------------------------------------------------------------------
 */

//int
//cl_gui_start_cmd::do_work(class cl_sim *sim,
//			  class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_gui_start_cmd)
{
  class cl_hw *hw;
  class cl_mem *mem;
  t_addr start, end;
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };

  if (cmdline->syntax_match(uc, HW)) {
    hw= params[0]->value.hw;
  }
  else if (cmdline->syntax_match(uc, MEMORY ADDRESS ADDRESS)) {
    mem= params[0]->value.memory;
    start= params[1]->value.address;
    end= params[2]->value.address;
  }
  else
    {
      con->printf("Error: wrong syntax\n"
		  "%s\n", short_help?short_help:"no help");
    }

  return(DD_FALSE);;
}


/*
 * Command: gui stop
 *----------------------------------------------------------------------------
 */

//int
//cl_gui_stop_cmd::do_work(class cl_sim *sim,
//			 class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_gui_stop_cmd)
{
  return(DD_FALSE);;
}


/* End of cmd.src/cmdgui.cc */

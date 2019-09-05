/*
 * Simulator of microcontrollers (cmd.src/get.cc)
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

#include <ctype.h>
#include "i_string.h"

// sim
#include "simcl.h"
#include "optioncl.h"

// local
#include "cmdsetcl.h"
#include "getcl.h"
#include "cmdutil.h"


/*
 * Command: get sfr
 *----------------------------------------------------------------------------
 */

//int
//cl_get_sfr_cmd::do_work(class cl_sim *sim,
//			class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_get_sfr_cmd)
{
  class cl_mem *mem= uc->mem(MEM_SFR);
  class cl_cmd_arg *parm;
  int i;

  if (!mem)
    {
      con->printf("Error: No SFR\n");
      return(DD_FALSE);
    }
  for (i= 0, parm= cmdline->param(i);
       parm;
       i++, parm= cmdline->param(i))
    {
      if (!parm->as_address(uc))
	con->printf("Warning: Invalid address %s\n",
		    (char*)cmdline->tokens->at(i+1));
      else
	mem->dump(parm->value.address, parm->value.address, 1, con);
    }

  return(DD_FALSE);;
}


/*
 * Command: get option
 *----------------------------------------------------------------------------
 */

//int
//cl_get_option_cmd::do_work(class cl_sim *sim,
//			   class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_get_option_cmd)
{
  class cl_cmd_arg *parm= cmdline->param(0);
  char *s= 0;

  if (!parm)
    ;
  else if (cmdline->syntax_match(uc, STRING)) {
    s= parm->value.string.string;
  }
  else
    con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");

  int i;
  for (i= 0; i < uc->options->count; i++)
    {
      class cl_option *o= (class cl_option *)(uc->options->at(i));
      if (!s ||
	  !strcmp(s, o->id))
	{
	  con->printf("%s ", o->id);
	  o->print(con);
	  con->printf(" %s\n", o->help);
	}
    }
  
  return(DD_FALSE);;
}


/* End of cmd.src/get.cc */

/*
 * Simulator of microcontrollers (cmd.src/cmdconf.cc)
 *
 * Copyright (C) 2001,01 Drotos Daniel, Talker Bt.
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

// prj
#include "globals.h"
#include "utils.h"

// sim
#include "simcl.h"

// local
#include "cmdconfcl.h"


/*
 * Command: conf
 *----------------------------------------------------------------------------
 */

//int
//cl_conf_cmd::do_work(class cl_sim *sim,
//		     class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_conf_cmd)
{
  int i;

  con->printf("ucsim version %s\n", VERSIONSTR);
  con->printf("Type of microcontroller: %s\n", uc->id_string());
  con->printf("Controller has %d hardware element(s).\n",
	      uc->hws->count);
  for (i= 0; i < uc->hws->count; i++)
    {
      class cl_hw *hw= (class cl_hw *)(uc->hws->at(i));
      con->printf("  %s[%d]\n", hw->id_string, hw->id);
    }
  con->printf("Memories:\n");
  for (i= MEM_ROM; i < MEM_TYPES; i++)
    {
      class cl_mem *mem= (class cl_mem *)(uc->mems->at(i));
      if (mem)
	con->printf("  %s size= 0x%06x %6d width= %2d class= \"%s\"\n",
		    mem->id_string(), mem->size, mem->size, mem->width,
		    (mem->class_name)?(mem->class_name):"unknown");
    }
  return(0);
}

/*
 * Command: conf addmem
 *----------------------------------------------------------------------------
 */

//int
//cl_conf_addmem_cmd::do_work(class cl_sim *sim,
//			    class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_conf_addmem_cmd)
{
  class cl_mem *mem= 0;
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };
  char *mem_class;

  if (cmdline->syntax_match(uc, STRING)) {
    mem_class= params[0]->value.string.string;
    enum mem_class type;
    type= (enum mem_class)get_string_id(mem_classes, mem_class, -1);
    mem= uc->mk_mem(type, mem_class);
    if (mem)
      {
	class cl_mem *m= uc->mem(type);
	if (m)
	  delete m;
	uc->mems->put_at(type, mem);
      }
    else
      con->printf("Can not make memory \"%s\"\n", mem_class);
  }
  return(DD_FALSE);
}


/* End of cmd.src/cmdconf.cc */

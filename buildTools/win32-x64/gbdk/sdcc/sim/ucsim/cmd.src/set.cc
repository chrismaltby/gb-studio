/*
 * Simulator of microcontrollers (cmd.src/set.cc)
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
#include "setcl.h"
#include "cmdutil.h"


/*
 * Command: set memory
 *----------------------------------------------------------------------------
 */

//int
//cl_set_mem_cmd::do_work(class cl_sim *sim,
//			class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_set_mem_cmd)
{
  class cl_mem *mem= 0;
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };

  if (cmdline->syntax_match(uc, MEMORY ADDRESS DATALIST)) {
    mem= params[0]->value.memory;
    t_addr start= params[1]->value.address;
    t_mem *array= params[2]->value.data_list.array;
    int len= params[2]->value.data_list.len;
    
    if (len == 0)
      con->printf("Error: no data\n");
    else
      {
	int i;
	t_addr addr;
	for (i= 0, addr= start;
	     i < len && addr < mem->size;
	     i++, addr++)
	  mem->write(addr, &(array[i]));
	mem->dump(start, start+len-1, 8, con);
      }
  }
  else
    con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");
  
  return(DD_FALSE);;
}


/*
 * Command: set bit
 *----------------------------------------------------------------------------
 */

//int
//cl_set_bit_cmd::do_work(class cl_sim *sim,
//			class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_set_bit_cmd)
{
  class cl_mem *mem;
  t_addr mem_addr= 0;
  t_mem bit_mask= 0;
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };
  
  if (cmdline->syntax_match(uc, BIT NUMBER)) {
    mem= params[0]->value.bit.mem;
    mem_addr= params[0]->value.bit.mem_address;
    bit_mask= params[0]->value.bit.mask;
    if (params[1]->value.number)
      mem->set_bit1(mem_addr, bit_mask);
    else
      mem->set_bit0(mem_addr, bit_mask);
    mem->dump(mem_addr, mem_addr, 1, con);
  }
  else
    con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");

  return(DD_FALSE);;
}


/*
 * Command: set port
 *----------------------------------------------------------------------------
 */

//int
//cl_set_port_cmd::do_work(class cl_sim *sim,
//			 class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_set_port_cmd)
{
  class cl_hw *hw;
  long l= 0, pn= -1;
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };
  
  if (cmdline->syntax_match(uc, HW NUMBER)) {
    hw= params[0]->value.hw;
    pn= hw->id;
    l= params[1]->value.number;
  }
  else if (cmdline->syntax_match(uc, NUMBER NUMBER)) {
    pn= params[0]->value.number;
    l= params[1]->value.number;
  }
  else
    con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");
  if (pn < 0 ||
      pn > 3)
    con->printf("Error: wrong port\n");
  else
    uc->port_pins[pn]= l;
  return(DD_FALSE);;
}


/*
 * Command: set option
 *----------------------------------------------------------------------------
 */

//int
//cl_set_option_cmd::do_work(class cl_sim *sim,
//			   class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_set_option_cmd)
{
  char *id= 0, *s= 0;
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };
  
  if (cmdline->syntax_match(uc, STRING STRING)) {
    id= params[0]->value.string.string;
    s= params[1]->value.string.string;
  }
  else
    con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");
  if (!id ||
      !s)
    {
      con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");
      return(DD_FALSE);
    }

  int i;
  for (i= 0; i < uc->options->count; i++)
    {
      class cl_option *o= (class cl_option *)(uc->options->at(i));
      if (!strcmp(id, o->id))
	{
	  o->set_value(s);
	  break;
	}
    }
  return(DD_FALSE);;
}


/* End of cmd.src/set.cc */

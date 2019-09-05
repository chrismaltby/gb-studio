/*
 * Simulator of microcontrollers (cmd.src/bp.cc)
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

#include "stdlib.h"

// sim
#include "brkcl.h"
#include "argcl.h"
#include "simcl.h"

// cmd
#include "cmdsetcl.h"
#include "bpcl.h"


/*
 * BREAK command
 */

//int
//cl_break_cmd::do_work(class cl_sim *sim,
//		      class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_break_cmd)
{
  t_addr addr= 0;
  int hit= 1;
  char op;
  class cl_mem *mem;
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };

  if (cmdline->syntax_match(uc, ADDRESS)) {
    addr= params[0]->value.address;
    hit= 1;
    do_fetch(uc, addr, hit, con);
  }
  else if (cmdline->syntax_match(uc, ADDRESS NUMBER)) {
    addr= params[0]->value.address;
    hit= params[1]->value.number;
    do_fetch(uc, addr, hit, con);
  }
  else if (cmdline->syntax_match(uc, MEMORY STRING ADDRESS)) {
    mem= params[0]->value.memory;
    op= *(params[1]->get_svalue());
    addr= params[2]->value.address;
    hit= 1;
    do_event(uc, mem, op, addr, hit, con);
  }
  else if (cmdline->syntax_match(uc, MEMORY STRING ADDRESS NUMBER)) {
    mem= params[0]->value.memory;
    op= *(params[1]->get_svalue());
    addr= params[2]->value.address;
    hit= params[3]->value.number;
    do_event(uc, mem, op, addr, hit, con);
  }
  else
    {
      con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");
      return(DD_FALSE);
    }
  return(DD_FALSE);
}

void
cl_break_cmd::do_fetch(class cl_uc *uc,
		       t_addr addr, int hit, class cl_console *con)
{
  if (hit > 99999)
    {
      con->printf("Hit value %d is too big.\n", hit);
      return;
    }
  if (uc->fbrk->bp_at(addr))
    con->printf("Breakpoint at 0x%06x is already set.\n", addr);
  else
    {
      class cl_brk *b= new cl_fetch_brk(uc->make_new_brknr(),
					addr, perm, hit);
      b->init();
      uc->fbrk->add_bp(b);
      char *s= uc->disass(addr, NULL);
      con->printf("Breakpoint %d at 0x%06x: %s\n", b->nr, addr, s);
      free(s);
    }
}

void
cl_break_cmd::do_event(class cl_uc *uc,
		       class cl_mem *mem, char op, t_addr addr, int hit,
		       class cl_console *con)
{
  class cl_ev_brk *b= NULL;

  b= uc->mk_ebrk(perm, mem, op, addr, hit);
  if (b)
    uc->ebrk->add_bp(b);
  else
    con->printf("Couldn't make event breakpoint\n");
}


/*
 * CLEAR address
 */

//int
//cl_clear_cmd::do_work(class cl_sim *sim,
//		      class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_clear_cmd)
{
  int idx;
  class cl_brk *brk= uc->fbrk->get_bp(uc->PC, &idx);

  if (cmdline->param(0) == 0)
    {
      if (!brk)
	{
	  con->printf("No breakpoint at this address.\n");
	  return(0);
	}
      uc->fbrk->del_bp(uc->PC);
      return(0);
    }

  int i= 0;
  class cl_cmd_arg *param;
  while ((param= cmdline->param(i++)))
    {
      t_addr addr;
      if (!param->as_address(uc))
	return(DD_FALSE);
      addr= param->value.address;
      if (uc->fbrk->bp_at(addr) == 0)
	con->printf("No breakpoint at 0x%06x\n", addr);
      else
	uc->fbrk->del_bp(addr);
    }

  return(DD_FALSE);
}


/*
 * DELETE nr nr ...
 */

//int
//cl_delete_cmd::do_work(class cl_sim *sim,
//		       class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_delete_cmd)
{
  if (cmdline->param(0) == 0)
    {
      // delete all
      uc->remove_all_breaks();
    }
  else
    {
      int i= 0;
      class cl_cmd_arg *param;
      while ((param= cmdline->param(i++)))
	{
	  long num;
	  if (param->get_ivalue(&num))
	    uc->rm_brk(num);
	}
    }
  return(DD_FALSE);
}


/* End of cmd.src/bp.cc */

/*
 * Simulator of microcontrollers (cmd.src/cmdset.cc)
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
#include "i_string.h"
#include "utils.h"
#include "globals.h"

// sim.src
#include "simcl.h"

// local, cmd.src
#include "cmdsetcl.h"
#include "cmdutil.h"


/*
 * Command: run
 *----------------------------------------------------------------------------
 */

//int
//cl_run_cmd::do_work(class cl_sim *sim,
//		    class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_SIM(cl_run_cmd)
{
  class cl_brk *b;
  t_addr start, end;
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };

  if (params[0])
    if (!(params[0]->get_address(sim->uc, &start)))
      {
	con->printf("Error: wrong start address\n");
	return(DD_FALSE);
      }
  if (params[1])
    if (!(params[1]->get_address(sim->uc, &end)))
      {
	con->printf("Error: wromg end address\n");
	return(DD_FALSE);
      }
  if (params[0])
    {
      if (!sim->uc->inst_at(start))
	con->printf("Warning: maybe not instruction at 0x%06lx\n", start);
      sim->uc->PC= start;
      if (params[1])
	{
	  if (start == end)
	    {
	      con->printf("Addresses must be different.\n");
	      return(DD_FALSE);
	    }
	  if ((b= sim->uc->fbrk_at(end)))
	    {
	    }
	  else
	    {
	      b= new cl_fetch_brk(sim->uc->make_new_brknr(), end,
				  brkDYNAMIC, 1);
	      sim->uc->fbrk->add_bp(b);
	    }
	}
    }
  con->printf("Simulation started, PC=0x%06x\n", sim->uc->PC);
  if (sim->uc->fbrk_at(start))
    sim->uc->do_inst(1);
  sim->start(con);
  return(DD_FALSE);
}


/*
 * Command: stop
 *----------------------------------------------------------------------------
 */

//int
//cl_stop_cmd::do_work(class cl_sim *sim,
//		     class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_SIM(cl_stop_cmd)
{
  sim->stop(resUSER);
  sim->uc->print_disass(sim->uc->PC, con);
  return(DD_FALSE);
}


/*
 * Command: step
 *----------------------------------------------------------------------------
 */

//int
//cl_step_cmd::do_work(class cl_sim *sim,
//		     class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_step_cmd)
{
  uc->do_inst(1);
  uc->print_regs(con);
  return(0);
}


/*
 * Command: next
 *----------------------------------------------------------------------------
 */

//int
//cl_next_cmd::do_work(class cl_sim *sim,
//		     class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_SIM(cl_next_cmd)
{
  class cl_brk *b;
  t_addr next;
  struct dis_entry *de;

  t_mem code= sim->uc->get_mem(MEM_ROM, sim->uc->PC);
  int i= 0;
  de= &(sim->uc->dis_tbl()[i]);
  while ((code & de->mask) != de->code &&
	 de->mnemonic)
    {
      i++;
      de= &(sim->uc->dis_tbl()[i]);
    }
  if ((de->branch == 'a') ||
      (de->branch == 'l'))
    {
      next= sim->uc->PC + de->length;
      if (!sim->uc->fbrk_at(next))
	{
	  b= new cl_fetch_brk(sim->uc->make_new_brknr(),
			      next, brkDYNAMIC, 1);
	  sim->uc->fbrk->add(b);
	}
      sim->start(con);
      //sim->uc->do_inst(-1);
    }
  else
    sim->uc->do_inst(1);
  sim->uc->print_regs(con);
  return(DD_FALSE);
}


/*
 * Command: help
 *----------------------------------------------------------------------------
 */

//int
//cl_help_cmd::do_work(class cl_sim *sim,
//		     class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_APP(cl_help_cmd)
{
  class cl_sim *sim;
  class cl_commander *cmd;
  class cl_cmdset *cmdset= 0;
  class cl_cmd *c;
  int i;
  class cl_cmd_arg *parm= cmdline->param(0);

  sim= app->get_sim();
  if ((cmd= app->get_commander()) != 0)
    cmdset= cmd->cmdset;
  if (!cmdset)
    return(DD_FALSE);
  if (!parm) {
    for (i= 0; i < cmdset->count; i++)
      {
	c= (class cl_cmd *)(cmdset->at(i));
	if (c->short_help)
	  con->printf("%s\n", c->short_help);
	else
	  con->printf("%s\n", (char*)(c->names->at(0)));
      }
  }
  else if (cmdline->syntax_match(/*sim*/0, STRING)) {
    int matches= 0;
    for (i= 0; i < cmdset->count; i++)
      {
	c= (class cl_cmd *)(cmdset->at(i));
	if (c->name_match(parm->value.string.string, DD_FALSE))
	  matches++;
      }
    if (!matches)
      con->printf("No such command\n");
    else if (matches > 1)
      for (i= 0; i < cmdset->count; i++)
	{
	  c= (class cl_cmd *)(cmdset->at(i));
	  if (!c->name_match(parm->value.string.string, DD_FALSE))
	    continue;
	  if (c->short_help)
	    con->printf("%s\n", c->short_help);
	  else
	    con->printf("%s\n", (char*)(c->names->at(0)));
	}
    else
      for (i= 0; i < cmdset->count; i++)
	{
	  c= (class cl_cmd *)(cmdset->at(i));
	  if (!c->name_match(parm->value.string.string, DD_FALSE))
	    continue;
	  if (c->short_help)
	    con->printf("%s\n", c->short_help);
	  else
	    con->printf("%s\n", (char*)(c->names->at(0)));
	  int names;
	  con->printf("Names of command:");
	  for (names= 0; names < c->names->count; names++)
	    con->printf(" %s", (char*)(c->names->at(names)));
	  con->printf("\n");
	  if (c->long_help)
	    con->printf("%s\n", c->long_help);
	  else
	    con->printf("%s\n", (char*)(c->names->at(0)));
	}
  }
  else
    con->printf("%s\n", short_help?short_help:"Error: wrong syntax");

  return(0);
}


/*
 * Command: quit
 *----------------------------------------------------------------------------
 */

//int
//cl_quit_cmd::do_work(class cl_sim *sim,
//		     class cl_cmdline */*cmdline*/, class cl_console */*con*/)
COMMAND_DO_WORK(cl_quit_cmd)
{
  return(1);
}


/*
 * Command: kill
 *----------------------------------------------------------------------------
 */

//int
//cl_kill_cmd::do_work(class cl_sim *sim,
//		     class cl_cmdline */*cmdline*/, class cl_console */*con*/)
COMMAND_DO_WORK_APP(cl_kill_cmd)
{
  app->going= 0;
  if (app->sim)
    app->sim->state|= SIM_QUIT;
  return(1);
}


/* End of cmd.src/cmdset.cc */

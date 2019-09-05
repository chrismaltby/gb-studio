/*
 * Simulator of microcontrollers (cmd.src/timer.cc)
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

#include "stdio.h"
#include "i_string.h"

// sim
#include "simcl.h"

// local
#include "timercl.h"


/*
 * Command: timer
 *----------------------------------------------------------------------------
 */

//int
//cl_timer_cmd::do_work(class cl_sim *sim,
//		      class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_timer_cmd)
{
  char *s;

  if (cmdline->param(0) == 0)
    {
      if (long_help)
	con->printf("%s\n", long_help);
      else
	con->printf("What to do?\n");
      return(0);
    }
  if ((s= cmdline->param(0)->get_svalue()))
    {
      if (cmdline->param(1) == 0)
	{
	  con->printf("Timer number is missing\n");
	  return(0);
	}
      set_ticker(uc, cmdline->param(1));
      if (strstr(s, "c") == s ||
	  strstr(s, "m") == s ||
	  strstr(s, "a") == s)
	return(add(uc, cmdline, con));
      else if (strstr(s, "d") == s)
	return(del(uc, cmdline, con));
      else if (strstr(s, "g") == s)
	return(get(uc, cmdline, con));
      else if (strstr(s, "r") == s)
	return(run(uc, cmdline, con));
      else if (strstr(s, "s") == s)
	return(stop(uc, cmdline, con));
      else if (strstr(s, "v") == s)
	return(val(uc, cmdline, con));
      else
	con->printf("Undefined timer command: \"%s\". Try \"help timer\"\n",
		    s);
    }
  return(0);
}

void
cl_timer_cmd::set_ticker(class cl_uc *uc,
			 class cl_cmd_arg *param)
{
  if ((name= param->get_svalue()))
    ticker= uc->get_counter(name);
  else
    if (param->get_ivalue(&what))
      ticker= uc->get_counter(what);
}

/*
 * Add a new timer to the list
 */

int
cl_timer_cmd::add(class cl_uc *uc,
		  class cl_cmdline *cmdline, class cl_console *con)
{
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };
  long dir= +1, in_isr= 0;
  
  if (!name &&
      what < 1)
    {
      con->printf("Error: Timer id must be greater then zero or a string\n");
      return(DD_FALSE);
    }
  if (ticker)
    {
      if (name)
	con->printf("Error: Timer \"%s\" already exists\n", name);
      else
	con->printf("Error: Timer %d already exists\n", what);
      return(0);
    }
  if (params[2])
    if (!params[2]->get_ivalue(&dir))
      {
	con->printf("Error: Wrong direction\n");
	return(DD_FALSE);
      }
  if (params[3])
    if (!params[3]->get_ivalue(&in_isr))
      {
	con->printf("Error: Wrong parameter\n");
	return(DD_FALSE);
      }

  if (name)
    {
      ticker= new cl_ticker(dir, in_isr, name);
      uc->add_counter(ticker, name);
    }
  else
    {
      ticker= new cl_ticker(dir, in_isr, 0);
      uc->add_counter(ticker, what);
    }

  return(DD_FALSE);
}

/*
 * Delete a timer from the list
 */

int
cl_timer_cmd::del(class cl_uc *uc,
		  class cl_cmdline *cmdline, class cl_console *con)
{
  if (!ticker)
    {
      if (name)
	con->printf("Timer \"%s\" does not exist\n", name);
      else
	con->printf("Timer %d does not exist\n", what);
      return(0);
    }
  if (name)
    uc->del_counter(name);
  else
    uc->del_counter(what);

  return(0);
}

/*
 * Get the value of just one timer or all of them
 */

int
cl_timer_cmd::get(class cl_uc *uc,
		  class cl_cmdline *cmdline, class cl_console *con)
{
  if (ticker)
    ticker->dump(what, uc->xtal, con);
  else
    {
      uc->ticks->dump(0, uc->xtal, con);
      uc->isr_ticks->dump(0, uc->xtal, con);
      uc->idle_ticks->dump(0, uc->xtal, con);
      for (what= 0; what < uc->counters->count; what++)
	{
	  ticker= uc->get_counter(what);
	  if (ticker)
	    ticker->dump(what, uc->xtal, con);
	}
    }

  return(0);
}

/*
 * Allow a timer to run
 */

int
cl_timer_cmd::run(class cl_uc *uc,
		  class cl_cmdline *cmdline, class cl_console *con)
{
  if (!ticker)
    {
      if (name)
	con->printf("Timer %d does not exist\n", name);
      else
	con->printf("Timer %d does not exist\n", what);
      return(0);
    }
  ticker->options|= TICK_RUN;

  return(0);
}

/*
 * Stop a timer
 */

int
cl_timer_cmd::stop(class cl_uc *uc,
		   class cl_cmdline *cmdline, class cl_console *con)
{
  if (!ticker)
    {
      if (name)
	con->printf("Timer %d does not exist\n", name);
      else
	con->printf("Timer %d does not exist\n", what);
      return(0);
    }
  ticker->options&= ~TICK_RUN;

  return(0);
}


/*
 * Set a timer to a specified value
 */

int
cl_timer_cmd::val(class cl_uc *uc,
		  class cl_cmdline *cmdline, class cl_console *con)
{
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };
  
  if (!ticker)
    {
      if (name)
	con->printf("Error: Timer %d does not exist\n", name);
      else
	con->printf("Error: Timer %d does not exist\n", what);
      return(0);
    }
  if (params[2])
    {
      con->printf("Error: Value is missing\n");
      return(DD_FALSE);
    }
  long val;
  if (!params[2]->get_ivalue(&val))
    {
      con->printf("Error: Wrong parameter\n");
      return(DD_FALSE);
    }
  ticker->ticks= val;

  return(DD_FALSE);
}


/* End of cmd.src/timer.cc */

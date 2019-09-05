/*
 * Simulator of microcontrollers (option.cc)
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

#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include "i_string.h"

#include "stypes.h"

#include "optioncl.h"
#include "simcl.h"


/*
 * Base class for option's objects
 *____________________________________________________________________________
 *
 */

cl_option::cl_option(void *opt, char *Iid, char *Ihelp):
  cl_base()
{
  option= opt;
  id    = strdup(Iid);
  help  = strdup(Ihelp);
}

cl_option::~cl_option(void)
{
  free(id);
  free(help);
}


/*
 * BOOL type of option
 *____________________________________________________________________________
 *
 */

cl_bool_opt::cl_bool_opt(bool *opt, char *Iid, char *Ihelp):
  cl_option(opt, Iid, Ihelp)
{}

void
cl_bool_opt::print(class cl_console *con)
{
  if (*(bool *)option)
    con->printf("TRUE");
  else
    con->printf("FALSE");
}

bool
cl_bool_opt::get_value(void)
{
  return(*((bool *)option));
}

void
cl_bool_opt::set_value(bool opt)
{
  *((bool *)option)= opt;
}

void
cl_bool_opt::set_value(char *s)
{
  char c;

  if (s)
    {
      c= toupper(*s);
      if (c == '1' ||
	  c == 'T' ||
	  c == 'Y')
	*(bool *)option= DD_TRUE;
      else
	*(bool *)option= DD_FALSE;
    }
};


/*
 * Debug on console
 */

cl_cons_debug_opt::cl_cons_debug_opt(class cl_app *the_app,
				     char *Iid,
				     char *Ihelp):
  cl_option(0, Iid, Ihelp)
{
  app= the_app;
}

void
cl_cons_debug_opt::print(class cl_console *con)
{
  if (/*sim->cmd->actual_console &&
	sim->cmd->actual_console*/con->flags & CONS_DEBUG)
    con->printf("TRUE");
  else
    con->printf("FALSE");
}

bool
cl_cons_debug_opt::get_value(void)
{
  return(app->get_commander()->actual_console?
	 (app->get_commander()->actual_console->flags & CONS_DEBUG):
	 0);
}

void
cl_cons_debug_opt::set_value(bool opt)
{
  if (app->get_commander()->actual_console)
    {
      if (opt)
	app->get_commander()->actual_console->flags|= CONS_DEBUG;
      else
	app->get_commander()->actual_console->flags&= ~CONS_DEBUG;
    }
    
}

void
cl_cons_debug_opt::set_value(char *s)
{
  char c;

  if (s &&
      app->get_commander()->actual_console)
    {
      c= toupper(*s);
      if (c == '1' ||
	  c == 'T' ||
	  c == 'Y')
	app->get_commander()->actual_console->flags|= CONS_DEBUG;
      else
	app->get_commander()->actual_console->flags&= ~CONS_DEBUG;
    }
}


/* End of option.cc */

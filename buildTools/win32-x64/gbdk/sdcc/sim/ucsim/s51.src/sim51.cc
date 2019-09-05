/*
 * Simulator of microcontrollers (sim51.cc)
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
#include <errno.h>
#include "i_string.h"

#include "globals.h"
#include "utils.h"
#include "cmdutil.h"

#include "sim51cl.h"
//#include "cmd51cl.h"
#include "uc51cl.h"
#include "uc52cl.h"
#include "uc51rcl.h"
#include "uc89c51rcl.h"
#include "uc251cl.h"
#include "uc390cl.h"
#include "glob.h"


cl_sim51::cl_sim51(class cl_app *the_app):
  cl_sim(the_app)
{}


class cl_uc *
cl_sim51::mk_controller(void)
{
  int i;

  i= 0;
  if (app->args->get_sarg('t', 0) == NULL)
    app->args->add(new cl_prg_arg('t', 0, "C51"));
  while ((cpus_51[i].type_str != NULL) &&
	 (strcmp(app->args->get_sarg('t', 0), cpus_51[i].type_str) != 0))
    i++;
  if (cpus_51[i].type_str == NULL)
    {
      fprintf(stderr, "Unknown processor type. "
	      "Use -H option to see known types.\n");
      return(NULL);
    }
  switch (cpus_51[i].type)
    {
    case CPU_51: case CPU_31:
      return(new t_uc51(cpus_51[i].type, cpus_51[i].technology, this));
    case CPU_52: case CPU_32:
      return(new t_uc52(cpus_51[i].type, cpus_51[i].technology, this));
    case CPU_51R:
      return(new t_uc51r(cpus_51[i].type, cpus_51[i].technology, this));
    case CPU_89C51R:
      return(new t_uc89c51r(cpus_51[i].type, cpus_51[i].technology, this));
    case CPU_251:
      return(new t_uc251(cpus_51[i].type, cpus_51[i].technology, this));
    case CPU_DS390: case CPU_DS390F:
      return(new t_uc390(cpus_51[i].type, cpus_51[i].technology, this));
    }
  return(NULL);
}


/* End of s51.src/sim51.cc */

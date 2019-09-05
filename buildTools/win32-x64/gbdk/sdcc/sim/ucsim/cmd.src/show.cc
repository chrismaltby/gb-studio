/*
 * Simulator of microcontrollers (cmd.src/show.cc)
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
#include "showcl.h"


/*
 * Command: show copying
 *----------------------------------------------------------------------------
 */

//int
//cl_show_copying_cmd::do_work(class cl_sim *sim,
//			     class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK(cl_show_copying_cmd)
{
  con->printf("%s\n", copying);
  return(DD_FALSE);;
}


/*
 * Command: show warranty
 *----------------------------------------------------------------------------
 */

//int
//cl_show_warranty_cmd::do_work(class cl_sim *sim,
//			      class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK(cl_show_warranty_cmd)
{
  con->printf("%s\n", warranty);
  return(DD_FALSE);;
}


/* End of cmd.src/show.cc */

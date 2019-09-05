/*
 * Simulator of microcontrollers (cmd.src/getcl.h)
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

#ifndef CMD_GETCL_HEADER
#define CMD_GETCL_HEADER

#include "newcmdcl.h"


// GET SFR
/*class cl_get_sfr_cmd: public cl_cmd
{
public:
  cl_get_sfr_cmd(//class cl_sim *asim,
		 char *aname,
		 int  can_rep,
		 char *short_hlp,
		 char *long_hlp):
    cl_cmd(aname, can_rep, short_hlp, long_hlp) {}
  virtual int do_work(class cl_sim *sim,
		      class cl_cmdline *cmdline, class cl_console *con);
};*/
COMMAND_ON(uc,cl_get_sfr_cmd);

// GET OPTION
/*class cl_get_option_cmd: public cl_cmd
{
public:
  cl_get_option_cmd(//class cl_sim *asim,
		    char *aname,
		    int  can_rep,
		    char *short_hlp,
		    char *long_hlp):
    cl_cmd(aname, can_rep, short_hlp, long_hlp) {}
  virtual int do_work(class cl_sim *sim,
		      class cl_cmdline *cmdline, class cl_console *con);
};*/
COMMAND_ON(uc,cl_get_option_cmd);

#endif

/* End of cmd.src/getcl.h */

/*
 * Simulator of microcontrollers (cmd.src/timercl.h)
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

#ifndef CMD_TIMERCL_HEADER
#define CMD_TIMERCL_HEADER

#include "newcmdcl.h"


COMMAND_HEAD(cl_timer_cmd)
public:
  class cl_ticker *ticker;
  long what;
  char *name;
COMMAND_METHODS_ON(uc,cl_timer_cmd)
  void set_ticker(class cl_uc *uc,
		  class cl_cmd_arg *param);
  virtual int add(class cl_uc *uc,
		  class cl_cmdline *cmdline, class cl_console *con);
  virtual int del(class cl_uc *uc,
		  class cl_cmdline *cmdline, class cl_console *con);
  virtual int get(class cl_uc *uc,
		  class cl_cmdline *cmdline, class cl_console *con);
  virtual int run(class cl_uc *uc,
		  class cl_cmdline *cmdline, class cl_console *con);
  virtual int stop(class cl_uc *uc,
		   class cl_cmdline *cmdline, class cl_console *con);
  virtual int val(class cl_uc *uc,
		  class cl_cmdline *cmdline, class cl_console *con);
COMMAND_TAIL;


#endif

/* End of cmd.src/timercl.h */

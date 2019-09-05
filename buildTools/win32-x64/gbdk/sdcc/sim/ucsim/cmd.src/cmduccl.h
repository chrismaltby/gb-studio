/*
 * Simulator of microcontrollers (cmd.src/cmduccl.h)
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

#ifndef CMD_CMDUCCL_HEADER
#define CMD_CMDUCCL_HEADER

#include "newcmdcl.h"

COMMAND_ON(uc,cl_state_cmd);
COMMAND_ON(uc,cl_file_cmd);
COMMAND_ON(uc,cl_dl_cmd);
COMMAND_ON(uc,cl_pc_cmd);
COMMAND_ON(uc,cl_reset_cmd);
COMMAND_ON(uc,cl_dump_cmd);
COMMAND_ANCESTOR_ON(uc,cl_di_cmd,cl_dump_cmd);
COMMAND_ANCESTOR_ON(uc,cl_dx_cmd,cl_dump_cmd);
COMMAND_ANCESTOR_ON(uc,cl_ds_cmd,cl_dump_cmd);
COMMAND_ANCESTOR_ON(uc,cl_dch_cmd,cl_dump_cmd);
COMMAND_DATA_ON(uc,cl_dc_cmd,t_addr last);
COMMAND_DATA_ON(uc,cl_disassemble_cmd,int last);
COMMAND_DATA_ON(uc,cl_fill_cmd,int last);
COMMAND_HEAD(cl_where_cmd)
  public: int last;
COMMAND_METHODS_ON(uc,cl_where_cmd)
  virtual int do_real_work(class cl_uc *uc,
			   class cl_cmdline *cmdline, class cl_console *con,
			   bool case_sensitive);
COMMAND_TAIL;
COMMAND_DATA_ANCESTOR_ON(uc,cl_Where_cmd,cl_where_cmd,int last);

#endif

/* End of cmd.src/cmduccl.h */

/*
 * Simulator of microcontrollers (cmd.src/cmduc.cc)
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

// prj
#include "globals.h"
#include "utils.h"

// sim.src
#include "uccl.h"

// local, cmd.src
#include "cmduccl.h"


/*
 * Command: state
 *----------------------------------------------------------------------------
 */

//int
//cl_state_cmd::do_work(class cl_sim *sim,
//		      class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_state_cmd)
{
  con->printf("CPU state= %s PC= 0x%06x XTAL= %g\n",
	      get_id_string(cpu_states, uc->state),
	      uc->PC, 
	      uc->xtal);
  con->printf("Total time since last reset= %g sec (%lu clks)\n",
	      uc->get_rtime(), uc->ticks->ticks);
  con->printf("Time in isr = %g sec (%lu clks) %3.2g%%\n",
	      uc->isr_ticks->get_rtime(uc->xtal),
	      uc->isr_ticks->ticks,
	      (uc->ticks->ticks == 0)?0.0:
	      (100.0*((double)(uc->isr_ticks->ticks)/
		      (double)(uc->ticks->ticks))));
  con->printf("Time in idle= %g sec (%lu clks) %3.2g%%\n",
	      uc->idle_ticks->get_rtime(uc->xtal),
	      uc->idle_ticks->ticks,
	      (uc->ticks->ticks == 0)?0.0:
	      (100.0*((double)(uc->idle_ticks->ticks)/
		      (double)(uc->ticks->ticks))));
  con->printf("Max value of stack pointer= 0x%06x, avg= 0x%06x\n",
	      uc->sp_max, uc->sp_avg);
  return(0);
}


/*
 * Command: file
 *----------------------------------------------------------------------------
 */

//int
//cl_file_cmd::do_work(class cl_sim *sim,
//		     class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_file_cmd)
{
  char *fname= 0;
  long l;
  
  if ((cmdline->param(0) == 0) ||
      ((fname= cmdline->param(0)->get_svalue()) == NULL))
    {
      con->printf("File name is missing.\n");
      return(0);
    }
  if ((l= uc->read_hex_file(fname)) >= 0)
    con->printf("%ld words read from %s\n", l, fname);

  return(0);
}


/*
 * Command: download
 *----------------------------------------------------------------------------
 */

//int
//cl_dl_cmd::do_work(class cl_sim *sim,
//		   class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_dl_cmd)
{
  long l;
  
  if ((l= uc->read_hex_file(NULL)) >= 0)
    con->printf("%ld words loaded\n", l);

  return(0);
}


/*
 * Command: pc
 *----------------------------------------------------------------------------
 */

//int
//cl_pc_cmd::do_work(class cl_sim *sim,
//		   class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_pc_cmd)
{
  t_addr addr;
  class cl_cmd_arg *params[1]= { cmdline->param(0) };

  if (params[0])
    {
      if (!(params[0]->get_address(uc, &addr)))
	{
	  con->printf("Error: wrong parameter\n");
	  return(DD_FALSE);
	}
      if (addr >= uc->get_mem_size(MEM_ROM))
	addr= 0;
      if (!uc->inst_at(addr))
	con->printf("Warning: maybe not instruction at 0x%06x\n", addr);
      uc->PC= addr;
    }
  uc->print_disass(uc->PC, con);
  return(DD_FALSE);
}


/*
 * Command: reset
 *----------------------------------------------------------------------------
 */

//int
//cl_reset_cmd::do_work(class cl_sim *sim,
//		      class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_reset_cmd)
{
  uc->reset();
  return(0);
}


/*
 * Command: dump
 *----------------------------------------------------------------------------
 */

//int
//cl_dump_cmd::do_work(class cl_sim *sim,
//		     class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_dump_cmd)
{
  class cl_mem *mem= 0;
  long bpl= 8;
  t_addr start= 0, end;
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };

  if (params[0] &&
      params[0]->as_bit(uc))
    {
      int i= 0;
      while (params[0] &&
	     params[0]->as_bit(uc))
	{
	  t_mem m;
	  mem= params[0]->value.bit.mem;
	  m= mem->read(params[0]->value.bit.mem_address);
	  char *sn=
	    uc->symbolic_bit_name((t_addr)-1,
				  mem,
				  params[0]->value.bit.mem_address,
				  params[0]->value.bit.mask);
	  con->printf("%10s ", sn?sn:"");
	  con->printf(mem->addr_format, params[0]->value.bit.mem_address);
	  con->printf(" ");
	  con->printf(mem->data_format, m);
	  con->printf(" %c\n", (m&(params[0]->value.bit.mask))?'1':'0');
	  i++;
	  params[0]= cmdline->param(i);
	}
      if (params[0])
	con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");
    }
  else if (cmdline->syntax_match(uc, MEMORY))
    {
      mem= params[0]->value.memory;
      mem->dump(con);
    }
  else if (cmdline->syntax_match(uc, MEMORY ADDRESS)) {
    mem  = params[0]->value.memory;
    start= params[1]->value.address;
    end  = start+10*8-1;
    mem->dump(start, end, bpl, con);
  }
  else if (cmdline->syntax_match(uc, MEMORY ADDRESS ADDRESS)) {
    mem  = params[0]->value.memory;
    start= params[1]->value.address;
    end  = params[2]->value.address;
    mem->dump(start, end, bpl, con);
  }
  else if (cmdline->syntax_match(uc, MEMORY ADDRESS ADDRESS NUMBER)) {
    mem  = params[0]->value.memory;
    start= params[1]->value.address;
    end  = params[2]->value.address;
    bpl  = params[3]->value.number;
    mem->dump(start, end, bpl, con);
  }
  else
    con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");

  return(DD_FALSE);;
}


/*
 * Command: di
 *----------------------------------------------------------------------------
 */

//int
//cl_di_cmd::do_work(class cl_sim *sim,
//		   class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_di_cmd)
{
  cmdline->insert_param(0, new cl_cmd_sym_arg("i"));
  cl_dump_cmd::do_work(uc, cmdline, con);
  return(0);
}


/*
 * Command: dx
 *----------------------------------------------------------------------------
 */

//int
//cl_dx_cmd::do_work(class cl_sim *sim,
//		   class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_dx_cmd)
{
  cmdline->insert_param(0, new cl_cmd_sym_arg("x"));
  cl_dump_cmd::do_work(uc, cmdline, con);
  return(0);
}


/*
 * Command: dch
 *----------------------------------------------------------------------------
 */

//int
//cl_dch_cmd::do_work(class cl_sim *sim,
//		    class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_dch_cmd)
{
  cmdline->insert_param(0, new cl_cmd_sym_arg("r"));
  cl_dump_cmd::do_work(uc, cmdline, con);
  return(0);
}


/*
 * Command: ds
 *----------------------------------------------------------------------------
 */

//int
//cl_ds_cmd::do_work(class cl_sim *sim,
//		   class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_ds_cmd)
{
  cmdline->insert_param(0, new cl_cmd_sym_arg("s"));
  cl_dump_cmd::do_work(uc, cmdline, con);
  return(0);
}


/*
 * Command: dc
 *----------------------------------------------------------------------------
 */

//int
//cl_dc_cmd::do_work(class cl_sim *sim,
//		   class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_dc_cmd)
{
  t_addr start= last, end= last+20;
  class cl_cmd_arg *params[2]= { cmdline->param(0),
				 cmdline->param(1) };
  class cl_mem *rom= uc->mem(MEM_ROM);

  if (!rom)
    return(DD_FALSE);
  if (params[0] == 0)
    ;
  else if (cmdline->syntax_match(uc, ADDRESS)) {
    start= params[0]->value.address;
    end= start+20;
  }
  else if (cmdline->syntax_match(uc, ADDRESS ADDRESS)) {
    start= params[0]->value.address;
    end= params[1]->value.address;
  }
  if (start >= rom->size)
    {
      con->printf("Error: start address is wrong\n");
      return(DD_FALSE);
    }
  if (end >= rom->size)
    {
      con->printf("Error: end address is wrong\n");
      return(DD_FALSE);
    }

  for (;
       start <= end;
       start+= uc->inst_length(rom->get(start)))
    uc->print_disass(start, con);
  last= start;
  return(DD_FALSE);
}


/*
 * Command: disassemble
 *----------------------------------------------------------------------------
 */

static int disass_last_stop= 0;

//int
//cl_disassemble_cmd::do_work(class cl_sim *sim,
//			    class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_disassemble_cmd)
{
  t_addr start, realstart;
  int offset= -1, dir, lines= 20;
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };

  start= disass_last_stop;
  if (params[0] == 0) ;
  else if (cmdline->syntax_match(uc, ADDRESS)) {
    start= params[0]->value.address;
  }
  else if (cmdline->syntax_match(uc, ADDRESS NUMBER)) {
    start= params[0]->value.address;
    offset= params[1]->value.number;
  }
  else if (cmdline->syntax_match(uc, ADDRESS NUMBER NUMBER)) {
    start= params[0]->value.address;
    offset= params[1]->value.number;
    lines= params[2]->value.number;
  }
  else
    {
      con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");    
      return(DD_FALSE);
    }

  if (lines < 1)
    {
      con->printf("Error: wrong `lines' parameter\n");
      return(DD_FALSE);
    }
  if (!uc->there_is_inst())
    return(DD_FALSE);
  realstart= start;
  class cl_mem *rom= uc->mem(MEM_ROM);
  if (!rom)
    return(DD_FALSE);
  while (realstart < rom->size &&
	 !uc->inst_at(realstart))
    realstart= realstart+1;
  if (offset)
    {
      dir= (offset < 0)?-1:+1;
      while (offset)
	{
	  realstart= (realstart+dir) % rom->size;
	  while (!uc->inst_at(realstart))
	    realstart= (realstart+dir) % rom->size;
	  offset+= -dir;
	}
    }
  
  while (lines)
    {
      uc->print_disass(realstart, con);
      realstart= (realstart+1) % rom->size;
      while (!uc->inst_at(realstart))
	realstart= (realstart+1) % rom->size;
      lines--;
    }

  disass_last_stop= realstart;

  return(DD_FALSE);;
}


/*
 * Command: fill
 *----------------------------------------------------------------------------
 */

//int
//cl_fill_cmd::do_work(class cl_sim *sim,
//		     class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_fill_cmd)
{
  class cl_mem *mem= 0;
  t_mem what= 0;
  t_addr start= 0, end;
  class cl_cmd_arg *params[4]= { cmdline->param(0),
				 cmdline->param(1),
				 cmdline->param(2),
				 cmdline->param(3) };

  if (cmdline->syntax_match(uc, MEMORY ADDRESS ADDRESS NUMBER)) {
    mem  = params[0]->value.memory;
    start= params[1]->value.address;
    end  = params[2]->value.address;
    what = params[3]->value.number;
    t_addr i;
    for (i= start; i <= end; i++)
      {
	t_mem d;
	d= what;
	mem->write(i, &d);
      }
  }
  else
    con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");

  return(DD_FALSE);;
}


/*
 * Command: where
 *----------------------------------------------------------------------------
 */

int
cl_where_cmd::do_real_work(class cl_uc *uc,
			   class cl_cmdline *cmdline, class cl_console *con,
			   bool case_sensitive)
{
  class cl_mem *mem= 0;
  class cl_cmd_arg *params[2]= { cmdline->param(0),
				 cmdline->param(1) };

  if (cmdline->syntax_match(uc, MEMORY DATALIST)) {
    mem= params[0]->value.memory;
    t_mem *array= params[1]->value.data_list.array;
    int len= params[1]->value.data_list.len;
    if (!len)
      {
	con->printf("Error: nothing to search for\n");
	return(DD_FALSE);
      }
    t_addr addr= 0;
    bool found= mem->search_next(case_sensitive, array, len, &addr);
    while (found)
      {
	mem->dump(addr, addr+len-1, 8, con);
	addr++;
	found= mem->search_next(case_sensitive, array, len, &addr);
      }
  }
  else
    con->printf("%s\n", short_help?short_help:"Error: wrong syntax\n");

  return(DD_FALSE);
}

//int
//cl_where_cmd::do_work(class cl_sim *sim,
//		      class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_where_cmd)
{
  return(do_real_work(uc, cmdline, con, DD_FALSE));
}

//int
//cl_Where_cmd::do_work(class cl_sim *sim,
//		      class cl_cmdline *cmdline, class cl_console *con)
COMMAND_DO_WORK_UC(cl_Where_cmd)
{
  return(do_real_work(uc, cmdline, con, DD_TRUE));
}


/* End of cmd.src/cmduc.cc */

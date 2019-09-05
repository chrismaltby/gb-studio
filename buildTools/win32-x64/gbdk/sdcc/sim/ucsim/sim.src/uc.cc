/*
 * Simulator of microcontrollers (uc.cc)
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
#include <errno.h>
#include <ctype.h>
#include "i_string.h"

// prj
#include "globals.h"
#include "utils.h"

// cmd.src
#include "newcmdcl.h"
#include "cmduccl.h"
#include "bpcl.h"
#include "getcl.h"
#include "setcl.h"
#include "infocl.h"
#include "timercl.h"

// local, sim.src
#include "uccl.h"
#include "hwcl.h"
#include "memcl.h"
#include "simcl.h"
#include "itsrccl.h"


/*
 * Clock counter
 */

cl_ticker::cl_ticker(int adir, int in_isr, char *aname)
{
  options= TICK_RUN;
  if (in_isr)
    options|= TICK_INISR;
  dir= adir;
  ticks= 0;
  name= aname?strdup(aname):0;
}

cl_ticker::~cl_ticker(void)
{
  if (name)
    free(name);
}

int
cl_ticker::tick(int nr)
{
  if (options&TICK_RUN)
    ticks+= dir*nr;
  return(ticks);
}

double
cl_ticker::get_rtime(double xtal)
{
  double d;

  d= (double)ticks/xtal;
  return(d);
}

void
cl_ticker::dump(int nr, double xtal, class cl_console *con)
{
  con->printf("timer #%d(\"%s\") %s%s: %g sec (%lu clks)\n",
	      nr, name?name:"unnamed",
	      (options&TICK_RUN)?"ON":"OFF",
	      (options&TICK_INISR)?",ISR":"",
	      get_rtime(xtal), ticks);
}


/*
 * Abstract microcontroller
 ******************************************************************************
 */

cl_uc::cl_uc(class cl_sim *asim):
  cl_base()
{
  int i;
  sim = asim;
  mems= new cl_list(MEM_TYPES, 1);
  hws = new cl_hws();
  options= new cl_list(2, 2);
  for (i= MEM_ROM; i < MEM_TYPES; i++)
    mems->add(0);
  ticks= new cl_ticker(+1, 0, "time");
  isr_ticks= new cl_ticker(+1, TICK_INISR, "isr");
  idle_ticks= new cl_ticker(+1, TICK_IDLE, "idle");
  counters= new cl_list(2, 2);
  it_levels= new cl_list(2, 2);
  it_sources= new cl_list(2, 2);
  class it_level *il= new it_level(-1, 0, 0, 0);
  it_levels->push(il);
  st_ops= new cl_list(2, 2);
  sp_max= 0;
  sp_avg= 0;
}


cl_uc::~cl_uc(void)
{
  delete mems;
  delete hws;
  delete options;
  delete ticks;
  delete isr_ticks;
  delete idle_ticks;
  delete counters;
  delete fbrk;
  delete ebrk;
  delete it_levels;
  delete it_sources;
  delete st_ops;
}


int
cl_uc::init(void)
{
  int mc, i;

  cl_base::init();
  if (!(sim->app->args->arg_avail('X')) ||
      sim->app->args->get_farg('X', 0) == 0)
    xtal= 11059200;
  else
    xtal= sim->app->args->get_farg('X', 0);
  for (mc= MEM_ROM; mc < MEM_TYPES; mc++)
    {
      class cl_mem *m= mk_mem((enum mem_class)mc,
			      get_id_string(mem_classes, mc));
      mems->put_at(mc, m);
    }
  ebrk= new brk_coll(2, 2, (class cl_rom *)mem(MEM_ROM));
  fbrk= new brk_coll(2, 2, (class cl_rom *)mem(MEM_ROM));
  fbrk->Duplicates= DD_FALSE;
  brk_counter= 0;
  mk_hw_elements();
  reset();
  class cl_cmdset *cs= sim->app->get_commander()->cmdset;
  build_cmdset(cs);

  for (i= 0; i < sim->app->in_files->count; i++)
    {
      char *fname= (char *)(sim->app->in_files->at(i));
      long l;
      if ((l= read_hex_file(fname)) >= 0)
	{
	  sim->app->get_commander()->all_printf("%ld words read from %s\n",
						l, fname);
	}
    }
  return(0);
}

char *
cl_uc::id_string(void)
{
  return("unknown microcontroller");
}

void
cl_uc::reset(void)
{
  class it_level *il;

  PC= 0;
  state = stGO;
  ticks->ticks= 0;
  isr_ticks->ticks= 0;
  idle_ticks->ticks= 0;
  /*FIXME should we clear user counters?*/
  il= (class it_level *)(it_levels->top());
  while (il &&
	 il->level >= 0)
    {
      il= (class it_level *)(it_levels->pop());
      delete il;
      il= (class it_level *)(it_levels->top());
    }
  sp_max= 0;
  sp_avg= 0;
}

/*
 * Making elements
 */

class cl_mem *
cl_uc::mk_mem(enum mem_class type, char *class_name)
{
  class cl_mem *m;

  if (get_mem_size(type) <= 0)
    return(0);
  if (type == MEM_ROM)
    m= new cl_rom(get_mem_size(type), get_mem_width(type));
  else
    m= new cl_mem(type, get_id_string(mem_classes, type),
		  get_mem_size(type), get_mem_width(type));
  m->init();
  return(m);
}

t_addr
cl_uc::get_mem_size(enum mem_class type)
{
  switch (type)
    {
    case MEM_ROM: return(0x10000);
    case MEM_XRAM: return(0x10000);
    case MEM_IRAM: return(0x100);
    case MEM_SFR: return(0x100);
    case MEM_TYPES:
    default: return(0);
    }
  return(0);
}

int
cl_uc::get_mem_width(enum mem_class type)
{
  return(8);
}

void
cl_uc::mk_hw_elements(void)
{
}

void
cl_uc::build_cmdset(class cl_cmdset *cmdset)
{
  class cl_cmd *cmd;
  class cl_cmdset *cset;

  cmdset->add(cmd= new cl_state_cmd("state", 0,
"state              State of microcontroller",
"long help of state"));
  cmd->init();

  cmdset->add(cmd= new cl_file_cmd("file", 0,
"file \"FILE\"        Load FILE into ROM",
"long help of file"));
  cmd->init();
  cmd->add_name("load");

  cmdset->add(cmd= new cl_dl_cmd("download", 0,
"download,dl          Load (intel.hex) data",
"long help of download"));
  cmd->init();
  cmd->add_name("dl");

  cmdset->add(cmd= new cl_pc_cmd("pc", 0,
"pc [addr]          Set/get PC",
"long help of pc"));
  cmd->init();

  cmdset->add(cmd= new cl_reset_cmd("reset", 0,
"reset              Reset",
"long help of reset"));
  cmd->init();

  cmdset->add(cmd= new cl_dump_cmd("dump", 0,
"dump memory_type [start [stop [bytes_per_line]]]\n"
"                   Dump memory of specified type\n"
"dump bit...        Dump bits",
"long help of dump"));
  cmd->init();

  cmdset->add(cmd= new cl_di_cmd("di", 0,
"di [start [stop]]  Dump Internal RAM",
"long help of di"));
  cmd->init();

  cmdset->add(cmd= new cl_dx_cmd("dx", 0,
"dx [start [stop]]  Dump External RAM",
"long help of dx"));
  cmd->init();

  cmdset->add(cmd= new cl_ds_cmd("ds", 0,
"ds [start [stop]]  Dump SFR",
"long help of ds"));
  cmd->init();

  cmdset->add(cmd= new cl_dch_cmd("dch", 0,
"dch [start [stop]] Dump code in hex form",
"long help of dch"));
  cmd->init();

  cmdset->add(cmd= new cl_dc_cmd("dc", 0,
"dc [start [stop]]  Dump code in disass form",
"long help of dc"));
  cmd->init();

  cmdset->add(cmd= new cl_disassemble_cmd("disassemble", 0,
"disassemble [start [offset [lines]]]\n"
"                   Disassemble code",
"long help of disassemble"));
  cmd->init();

  cmdset->add(cmd= new cl_fill_cmd("fill", 0,
"fill memory_type start end data\n"
"                   Fill memory region with data",
"long help of fill"));
  cmd->init();

  cmdset->add(cmd= new cl_where_cmd("where", 0,
"where memory_type data...\n"
"                   Case unsensitive search for data",
"long help of where"));
  cmd->init();

  cmdset->add(cmd= new cl_Where_cmd("Where", 0,
"Where memory_type data...\n"
"                   Case sensitive search for data",
"long help of Where"));
  cmd->init();

  cmdset->add(cmd= new cl_break_cmd("break", 0,
"break addr [hit]   Set fix breakpoint\n"
"break mem_type r|w addr [hit]\n"
"                   Set fix event breakpoint",
"long help of break"));
  cmd->init();

  cmdset->add(cmd= new cl_tbreak_cmd("tbreak", 0,
"tbreak addr [hit]  Set temporary breakpoint\n"
"tbreak mem_type r|w addr [hit]\n"
"                   Set temporary event breakpoint",
"long help of tbreak"));
  cmd->init();

  cmdset->add(cmd= new cl_clear_cmd("clear", 0,
"clear [addr...]    Clear fix breakpoint",
"long help of clear"));
  cmd->init();

  cmdset->add(cmd= new cl_delete_cmd("delete", 0,
"delete [nr...]     Delete breakpoint(s)",
"long help of clear"));
  cmd->init();

  {
    cset= new cl_cmdset();
    cset->init();
    cset->add(cmd= new cl_get_sfr_cmd("sfr", 0,
"get sfr address...\n"
"                   Get value of addressed SFRs",
"long help of get sfr"));
    cmd->init();
    cset->add(cmd= new cl_get_option_cmd("option", 0,
"get option name\n"
"                   Get value of an option",
"long help of get option"));
    cmd->init();
  }
  cmdset->add(cmd= new cl_super_cmd("get", 0,
"get subcommand     Get, see `get' command for more help",
"long help of get", cset));
  cmd->init();

  {
    cset= new cl_cmdset();
    cset->init();
    cset->add(cmd= new cl_set_mem_cmd("memory", 0,
"set memory memory_type address data...\n"
"                   Place list of data into memory",
"long help of set memory"));
    cmd->init();
    cset->add(cmd= new cl_set_bit_cmd("bit", 0,
"set bit addr 0|1   Set specified bit to 0 or 1",
"long help of set bit"));
    cmd->init();
    cset->add(cmd= new cl_set_port_cmd("port", 0,
"set port hw data   Set data connected to port",
"long help of set port"));
    cmd->init();
    cset->add(cmd= new cl_set_option_cmd("option", 0,
"set option name value\n"
"                   Set value of an option",
"long help of set option"));
    cmd->init();
  }
  cmdset->add(cmd= new cl_super_cmd("set", 0,
"set subcommand     Set, see `set' command for more help",
"long help of set", cset));
  cmd->init();

  {
    cset= new cl_cmdset();
    cset->init();
    cset->add(cmd= new cl_info_bp_cmd("breakpoints", 0, 
"info breakpoints   Status of user-settable breakpoints",
"long help of info breakpoints"));
    cmd->add_name("bp");
    cmd->init();
    cset->add(cmd= new cl_info_reg_cmd("registers", 0, 
"info registers     List of integer registers and their contents",
"long help of info registers"));
    cmd->init();
    cset->add(cmd= new cl_info_hw_cmd("hardware", 0, 
"info hardware cathegory\n"
"                   Status of hardware elements of the CPU",
"long help of info hardware"));
    cmd->add_name("h	w");
    cmd->init();
  }
  cmdset->add(cmd= new cl_super_cmd("info", 0,
"info subcommand    Information, see `info' command for more help",
"long help of info", cset));
  cmd->init();

  cmdset->add(cmd= new cl_timer_cmd("timer", 0,
"timer a|d|g|r|s|v id [direction|value]\n"
"                   Timer add|del|get|run|stop|value",
"timer add|create|make id [direction] -- create a new timer\n"
"timer del id -- delete a timer\n"
"timer get id -- list timers\n"
"timer run id -- turn a timer ON\n"
"timer stop id -- turn a timer OFF\n"
"timer value id val -- set value of a timer to `val'"));
  cmd->init();
}


/*
 * Read/write simulated memory
 */

ulong
cl_uc::read_mem(enum mem_class type, t_mem addr)
{
  class cl_mem *m;

  if ((m= (class cl_mem*)mems->at(type)))
    return(m->read(addr));
  //FIXME
fprintf(stderr, "cl_uc::read_mem(type= %d, 0x%06lx) TROUBLE\n", type, addr);
  return(0);
}

ulong
cl_uc::get_mem(enum mem_class type, t_addr addr)
{
  class cl_mem *m;

  if ((m= (class cl_mem*)mems->at(type)))
    return(m->get(addr));
  //FIXME
printf("cl_uc::get_mem(type= %d, 0x%06lx) TROUBLE\n", type, addr);
  return(0);
}

void
cl_uc::write_mem(enum mem_class type, t_addr addr, t_mem val)
{
  class cl_mem *m;

  if ((m= (class cl_mem*)mems->at(type)))
    {
      m->write(addr, &val);
      //m->mem[addr]= val;
    }
  //FIXME
else printf("cl_uc::write_mem(type= %d, 0x%06lx, 0x%lx) TROUBLE\n", type, addr, val);
}

void
cl_uc::set_mem(enum mem_class type, t_addr addr, t_mem val)
{
  class cl_mem *m;

  if ((m= (class cl_mem*)mems->at(type)))
    m->set(addr, val);
  //FIXME
else printf("cl_uc::set_mem(type= %d, 0x%06lx, 0x%lx) TROUBLE\n", type, addr, val);
}

class cl_mem *
cl_uc::mem(enum mem_class type)
{
  if (mems->count < type)
    //FIXME
{printf("TROUBLE\n");    return(0);
}
  return((class cl_mem *)(mems->at(type)));
}

class cl_mem *
cl_uc::mem(char *class_name)
{
  int i, found= 0;
  char *mcn, *n, *s;

  if (!class_name)
    return(0);
  s= n= strdup(class_name);
  while (*s)
    {
      *s= toupper(*s);
      s++;
    }
  if (!class_name ||
      !(*class_name))
    return(0);
  for (i= 0; !found && i < mems->count; i++)
    {
      cl_mem *m= (cl_mem *)(mems->at(i));
      if (!m ||
	  !m->class_name ||
	  !(*(m->class_name)))
	continue;
      s= mcn= strdup(m->class_name);
      while (*s)
	{
	  *s= toupper(*s);
	  s++;
	}
      if (strstr(/*m->class_name*/mcn,/*class_name*/n) == /*m->class_name*/mcn)
	found= 1;
      free(mcn);
      if (found)
	{
	  free(n);
	  return(m);
	}
    }
  free(n);
  return(0);
}

/*TYPE_UBYTE *
cl_uc::MEM(enum mem_class type)
{
  class cl_mem *m;

  if ((m= mem(type)) == 0)
    //FIXME
{printf("TROUBLE\n");    return(0);
}
  return((TYPE_UBYTE *)(m->mem));
}*/


/* Local function for `read_hex_file' method to read some bytes */

static long
ReadInt(FILE *f, bool *ok, int bytes)
{
  char s2[3];
  long l= 0;

  *ok= DD_FALSE;
  while (bytes)
    {
      if (fscanf(f, "%2c", &s2[0]) == EOF)
	return(0);
      s2[2]= '\0';
      l= l*256 + strtol(s2, NULL, 16);
      bytes--;
    }
  *ok= DD_TRUE;
  return(l);
}


/* 
 * Reading intel hexa file into EROM
 *____________________________________________________________________________
 *
 * If parameter is a NULL pointer, this function reads data from `cmd_in'
 *
 */

long
cl_uc::read_hex_file(const char *name)
{
  FILE *f;
  int c;
  long written= 0, recnum= 0;

  uchar dnum;     // data number
  uchar rtyp=0;   // record type
  uint  addr= 0;  // address
  uchar rec[300]; // data record
  uchar sum ;     // checksum
  uchar chk ;     // check
  int  i;
  bool ok, get_low= 1;
  uchar low= 0, high;

  if (!name)
    {
      sim->app->get_commander()->
	printf("cl_uc::read_hex_file File name not specified\n");
      return(-1);
    }
  else
    if ((f= fopen(name, "r")) == NULL)
      {
	fprintf(stderr, "Can't open `%s': %s\n", name, strerror(errno));
	return(-1);
      }

  //memset(inst_map, '\0', sizeof(inst_map));
  ok= DD_TRUE;
  while (ok &&
	 rtyp != 1)
    {
      while (((c= getc(f)) != ':') &&
	     (c != EOF)) ;
      if (c != ':')
	{fprintf(stderr, ": not found\n");break;}
      recnum++;
      dnum= ReadInt(f, &ok, 1);//printf("dnum=%02x",dnum);
      chk = dnum;
      addr= ReadInt(f, &ok, 2);//printf("addr=%04x",addr);
      chk+= (addr & 0xff);
      chk+= ((addr >> 8) & 0xff);
      rtyp= ReadInt(f, &ok, 1);//printf("rtyp=%02x ",rtyp);
      chk+= rtyp;
      for (i= 0; ok && (i < dnum); i++)
	{
	  rec[i]= ReadInt(f, &ok, 1);//printf("%02x",rec[i]);
	  chk+= rec[i];
	}
      if (ok)
	{
	  sum= ReadInt(f, &ok, 1);//printf(" sum=%02x\n",sum);
	  if (ok)
	    {
	      if (((sum + chk) & 0xff) == 0)
		{
		  if (rtyp == 0)
		    {
		      if (get_mem_width(MEM_ROM) > 8)
			addr/= 2;
		      for (i= 0; i < dnum; i++)
			{
			  if (get_mem_width(MEM_ROM) <= 8)
			    {
			      set_mem(MEM_ROM, addr, rec[i]);
			      addr++;
			      written++;
			    }
			  else if (get_mem_width(MEM_ROM) <= 16)
			    {
			      if (get_low)
				{
				  low= rec[i];
				  get_low= 0;
				}
			      else
				{
				  high= rec[i];
				  set_mem(MEM_ROM, addr, (high*256)+low);
				  addr++;
				  written++;
				  get_low= 1;
				}
			    }
			}
		    }
		  else
		    if (sim->app->args->get_iarg('V', 0) &&
			rtyp != 1)
		      sim->app->get_commander()->
			printf("Unknown record type %d(0x%x)\n", rtyp, rtyp);
		}
	      else
		if (sim->app->args->get_iarg('V', 0))
		  sim->app->get_commander()->
		    printf("Checksum error (%x instead of %x) in "
			   "record %ld.\n", chk, sum, recnum);
	    }
	  else
	    if (sim->app->args->get_iarg('V', 0))
	      sim->app->get_commander()->
		printf("Read error in record %ld.\n", recnum);
	}
    }
  if (get_mem_width(MEM_ROM) > 8 &&
      !get_low)
    set_mem(MEM_ROM, addr, low);

  if (name)
    fclose(f);
  if (sim->app->args->get_iarg('V', 0))
    sim->app->get_commander()->printf("%ld records have been read\n", recnum);
  analyze(0);
  return(written);
}


/*
 * Handling instruction map
 *
 * `inst_at' is checking if the specified address is in instruction
 * map and `set_inst_at' marks the address in the map and
 * `del_inst_at' deletes the mark. `there_is_inst' cheks if there is
 * any mark in the map
 */

bool
cl_uc::inst_at(t_addr addr)
{
  class cl_rom *rom= (class cl_rom *)mem(MEM_ROM);
  
  if (!rom)
    return(0);
  return(rom->inst_map->get(addr));
}

void
cl_uc::set_inst_at(t_addr addr)
{
  class cl_rom *rom= (class cl_rom *)mem(MEM_ROM);
  
  if (rom)
    rom->inst_map->set(addr);
}

void
cl_uc::del_inst_at(t_addr addr)
{
  class cl_rom *rom= (class cl_rom *)mem(MEM_ROM);
  
  if (rom)
    rom->inst_map->clear(addr);
}

bool
cl_uc::there_is_inst(void)
{
  class cl_rom *rom= (class cl_rom *)mem(MEM_ROM);
  
  if (!rom)
    return(0);
  return(!(rom->inst_map->empty()));
}


/*
 * Manipulating HW elements of the CPU
 *****************************************************************************
 */

/* Register callback hw objects for mem read/write */

void
cl_uc::register_hw_read(enum mem_class type, t_addr addr, class cl_hw *hw)
{
  class cl_mem *m;
  class cl_memloc *l;

  if ((m= (class cl_mem*)mems->at(type)))
    {
      if ((l= m->read_locs->get_loc(addr)) == 0)
	{
	  l= new cl_memloc(addr);
	  l->init();
	  m->read_locs->add(l);
	}
      l->hws->add(hw);
    }
  else
    printf("cl_uc::register_hw_read TROUBLE\n");
}

void
cl_uc::register_hw_write(enum mem_class type, t_addr addr, class cl_hw *hw)
{
}

/* Looking for a specific HW element */

class cl_hw *
cl_uc::get_hw(enum hw_cath cath, int *idx)
{
  class cl_hw *hw= 0;
  int i= 0;

  if (idx)
    i= *idx;
  for (; i < hws->count; i++)
    {
      hw= (class cl_hw *)(hws->at(i));
      if (hw->cathegory == cath)
	break;
    }
  if (i >= hws->count)
    return(0);
  if (idx)
    *idx= i;
  return(hw);
}

class cl_hw *
cl_uc::get_hw(char *id_string, int *idx)
{
  class cl_hw *hw= 0;
  int i= 0;

  if (idx)
    i= *idx;
  for (; i < hws->count; i++)
    {
      hw= (class cl_hw *)(hws->at(i));
      if (strstr(hw->id_string, id_string) == hw->id_string)
	break;
    }
  if (i >= hws->count)
    return(0);
  if (idx)
    *idx= i;
  return(hw);
}

class cl_hw *
cl_uc::get_hw(enum hw_cath cath, int hwid, int *idx)
{
  class cl_hw *hw;
  int i= 0;

  if (idx)
    i= *idx;
  hw= get_hw(cath, &i);
  while (hw &&
	 hw->id != hwid)
    {
      i++;
      hw= get_hw(cath, &i);
    }
  if (hw && 
      idx)
    *idx= i;
  return(hw);
}

class cl_hw *
cl_uc::get_hw(char *id_string, int hwid, int *idx)
{
  class cl_hw *hw;
  int i= 0;

  if (idx)
    i= *idx;
  hw= get_hw(id_string, &i);
  while (hw &&
	 hw->id != hwid)
    {
      i++;
      hw= get_hw(id_string, &i);
    }
  if (hw && 
      idx)
    *idx= i;
  return(hw);
}


/*
 * Help of the command interpreter
 */

struct dis_entry *
cl_uc::dis_tbl(void)
{
  static struct dis_entry empty= { 0, 0, 0, 0, NULL };
  return(&empty);
}

struct name_entry *
cl_uc::sfr_tbl(void)
{
  static struct name_entry empty= { 0, 0 };
  return(&empty);
}

struct name_entry *
cl_uc::bit_tbl(void)
{
  static struct name_entry empty= { 0, 0 };
  return(&empty);
}

char *
cl_uc::disass(t_addr addr, char *sep)
{
  char *buf;

  buf= (char*)malloc(100);
  strcpy(buf, "uc::do_disass unimplemented\n");
  return(buf);
}

void
cl_uc::print_disass(t_addr addr, class cl_console *con)
{
  char *dis;
  class cl_brk *b;
  int i;
  class cl_mem *rom= mem(MEM_ROM);
  t_mem code= get_mem(MEM_ROM, addr);

  if (!rom)
    return;
  b= fbrk_at(addr);
  dis= disass(addr, NULL);
  if (b)
    con->printf("%c", (b->perm == brkFIX)?'F':'D');
  else
    con->printf(" ");
  con->printf("%c ", inst_at(addr)?' ':'?');
  con->printf(rom->addr_format, addr); con->printf(" ");
  con->printf(rom->data_format, code);
  for (i= 1; i < inst_length(code); i++)
    {
      con->printf(" ");
      con->printf(rom->data_format, get_mem(MEM_ROM, addr+i));
    }
  int li= longest_inst();
  while (i < li)
    {
      int j;
      j= rom->width/4 + ((rom->width%4)?1:0) + 1;
      while (j)
	con->printf(" "), j--;
      i++;
    }
  con->printf(" %s\n", dis);
  free(dis);
}

void
cl_uc::print_regs(class cl_console *con)
{
  con->printf("No registers\n");
}

int
cl_uc::inst_length(t_mem code)
{
  struct dis_entry *tabl= dis_tbl();
  int i;

  for (i= 0; tabl[i].mnemonic && (code & tabl[i].mask) != tabl[i].code; i++) ;
  return(tabl[i].mnemonic?tabl[i].length:1);	 
}

int
cl_uc::longest_inst(void)
{
  struct dis_entry *de= dis_tbl();
  int max= 0;

  while (de &&
	 de->mnemonic)
    {
      if (de->length > max)
	max= de->length;
      de++;
    }
  return(max);
}

bool
cl_uc::get_name(t_addr addr, struct name_entry tab[], char *buf)
{
  int i;

  i= 0;
  while (tab[i].name &&
	 (!(tab[i].cpu_type & type) ||
	 (tab[i].addr != addr)))
    i++;
  if (tab[i].name)
    strcpy(buf, tab[i].name);
  return(tab[i].name != NULL);
}

char *
cl_uc::symbolic_bit_name(t_addr bit_address,
			 class cl_mem *mem,
			 t_addr mem_addr,
			 t_mem bit_mask)
{
  char *sym_name= 0;
  int i;

  i= 0;
  while (bit_tbl()[i].name &&
	 (bit_tbl()[i].addr != bit_address))
    i++;
  if (bit_tbl()[i].name)
    {
      sym_name= strdup(bit_tbl()[i].name);
      return(sym_name);
    }

  if (mem &&
      mem->class_name &&
      strstr(mem->class_name, "sfr") == mem->class_name)
    {
      i= 0;
      while (sfr_tbl()[i].name &&
	     (sfr_tbl()[i].addr != mem_addr))
	i++;
      if (sfr_tbl()[i].name)
	sym_name= strdup(sfr_tbl()[i].name);
      else
	sym_name= 0;
    }
  if (!sym_name)
    {
      sym_name= (char *)malloc(16);
      sprintf(sym_name, mem?(mem->addr_format):"0x%06x", mem_addr);
    }
  sym_name= (char *)realloc(sym_name, strlen(sym_name)+2);
  strcat(sym_name, ".");
  i= 0;
  while (bit_mask > 1)
    {
      bit_mask>>=1;
      i++;
    }
  char bitnumstr[10];
  sprintf(bitnumstr, "%1d", i);
  strcat(sym_name, bitnumstr);
  return(sym_name);
}


/*
 * Execution
 */

int
cl_uc::tick(int cycles)
{
  class cl_hw *hw;
  int i, cpc= clock_per_cycle();

  // increase time
  ticks->tick(cycles * cpc);
  class it_level *il= (class it_level *)(it_levels->top());
  if (il->level >= 0)
    isr_ticks->tick(cycles * cpc);
  if (state == stIDLE)
    idle_ticks->tick(cycles * cpc);
  for (i= 0; i < counters->count; i++)
    {
      class cl_ticker *t= (class cl_ticker *)(counters->at(i));
      if (t)
	{
	  if ((t->options&TICK_INISR) ||
	      il->level < 0)
	    t->tick(cycles * cpc);
	}
    }

  // tick hws
  for (i= 0; i < hws->count; i++)
    {
      hw= (class cl_hw *)(hws->at(i));
      if (hw->flags & HWF_INSIDE)
	hw->tick(cycles);
    }
  return(0);
}

class cl_ticker *
cl_uc::get_counter(int nr)
{
  if (nr >= counters->count)
    return(0);
  return((class cl_ticker *)(counters->at(nr)));
}

class cl_ticker *
cl_uc::get_counter(char *name)
{
  int i;

  if (!name)
    return(0);
  for (i= 0; i < counters->count; i++)
    {
      class cl_ticker *t= (class cl_ticker *)(counters->at(i));
      if (t &&
	  t->name &&
	  strcmp(t->name, name) == 0)
	return(t);
    }
  return(0);
}

void
cl_uc::add_counter(class cl_ticker *ticker, int nr)
{
  while (counters->count <= nr)
    counters->add(0);
  counters->put_at(nr, ticker);
}

void
cl_uc::add_counter(class cl_ticker *ticker, char */*name*/)
{
  int i;

  if (counters->count < 1)
    counters->add(0);
  for (i= 1; i < counters->count; i++)
    {
      class cl_ticker *t= (class cl_ticker *)(counters->at(i));
      if (!t)
	{
	  counters->put_at(i, ticker);
	  return;
	}
    }
  counters->add(ticker);
}

void
cl_uc::del_counter(int nr)
{
  class cl_ticker *t;

  if (nr >= counters->count)
    return;
  if ((t= (class cl_ticker *)(counters->at(0))) != 0)
    delete t;
  counters->put_at(nr, 0);
}

void
cl_uc::del_counter(char *name)
{
  int i;
  
  if (!name)
    return;
  for (i= 0; i < counters->count; i++)
    {
      class cl_ticker *t= (class cl_ticker *)(counters->at(i));
      if (t &&
	  t->name &&
	  strcmp(t->name, name) == 0)
	{
	  delete t;
	  counters->put_at(i, 0);
	  return;
	}
    }
}

/*
 * Fetch without checking for breakpoint hit
 */

t_mem
cl_uc::fetch(void)
{
  ulong code;

  code= read_mem(MEM_ROM, PC);
  PC++;
  if (PC >= get_mem_size(MEM_ROM))
    PC= 0;
  return(code);
}

/*
 * Fetch but checking for breakpoint hit first
 */

bool
cl_uc::fetch(t_mem *code)
{
  class cl_brk *brk;
  int idx;

  if (!code)
    return(0);
  if (sim->state & SIM_GO)
    {
      if ((brk= fbrk->get_bp(PC, &idx)) &&
	  (brk->do_hit()))
	{
	  if (brk->perm == brkDYNAMIC)
	    fbrk->del_bp(PC);
	  return(1);
	}
    }
  *code= fetch();
  return(0);
}

int
cl_uc::do_inst(int step)
{
  int res= resGO;

  if (step < 0)
    step= 1;
  while (step-- &&
	 res == resGO)
    {
      pre_inst();
      res= exec_inst();
      post_inst();
    }
  if (res != resGO)
    sim->stop(res);
  return(res);
}

void
cl_uc::pre_inst(void)
{}

int
cl_uc::exec_inst(void)
{
  return(resGO);
}

void
cl_uc::post_inst(void)
{}


/*
 * Time related functions
 */

double
cl_uc::get_rtime(void)
{
  /*  double d;

  d= (double)ticks/xtal;
  return(d);*/
  return(ticks->get_rtime(xtal));
}

int
cl_uc::clock_per_cycle(void)
{
  return(1);
}


/*
 * Stack tracking system
 */

void
cl_uc::st_push(class cl_stack_op *op)
{
  st_ops->push(op);
}

void
cl_uc::st_call(class cl_stack_op *op)
{
  st_ops->push(op);
}

int
cl_uc::st_pop(class cl_stack_op *op)
{
  class cl_stack_op *sop= (class cl_stack_op *)(st_ops->pop());

  if (!sop)
    return(1);
  return(0);
}

int
cl_uc::st_ret(class cl_stack_op *op)
{
  class cl_stack_op *sop= (class cl_stack_op *)(st_ops->pop());

  if (!sop)
    return(1);
  return(0);
}


/*
 * Breakpoint handling
 */

class cl_fetch_brk *
cl_uc::fbrk_at(t_addr addr)
{
  int idx;
  
  return((class cl_fetch_brk *)(fbrk->get_bp(addr, &idx)));
}

class cl_ev_brk *
cl_uc::ebrk_at(t_addr addr, char *id)
{
  int i;
  class cl_ev_brk *eb;

  for (i= 0; i < ebrk->count; i++)
    {
      eb= (class cl_ev_brk *)(ebrk->at(i));
      if (eb->addr == addr &&
	  !strcmp(eb->id, id))
	return(eb);
    }
  return(0);
}

/*void
cl_uc::rm_fbrk(long addr)
{
  fbrk->del_bp(addr);
}*/

/* Get a breakpoint specified by its number */

class cl_brk *
cl_uc::brk_by_nr(int nr)
{
  class cl_brk *bp;

  if ((bp= fbrk->get_bp(nr)))
    return(bp);
  if ((bp= ebrk->get_bp(nr)))
    return(bp);
  return(0);
}

/* Get a breakpoint from the specified collection by its number */

class cl_brk *
cl_uc::brk_by_nr(class brk_coll *bpcoll, int nr)
{
  class cl_brk *bp;

  if ((bp= bpcoll->get_bp(nr)))
    return(bp);
  return(0);
}

/* Remove an event breakpoint specified by its address and id */

void
cl_uc::rm_ebrk(t_addr addr, char *id)
{
  int i;
  class cl_ev_brk *eb;

  for (i= 0; i < ebrk->count; i++)
    {
      eb= (class cl_ev_brk *)(ebrk->at(i));
      if (eb->addr == addr &&
	  !strcmp(eb->id, id))
	ebrk->free_at(i);
    }
}

/* Remove a breakpoint specified by its number */

void
cl_uc::rm_brk(int nr)
{
  class cl_brk *bp;

  if ((bp= brk_by_nr(fbrk, nr)))
    fbrk->del_bp(bp->addr);
  else if ((bp= brk_by_nr(ebrk, nr)))
    ebrk->free_at(ebrk->index_of(bp));
}

void
cl_uc::put_breaks(void)
{}

/* Remove all fetch and event breakpoints */

void
cl_uc::remove_all_breaks(void)
{
  while (fbrk->count)
    {
      class cl_brk *brk= (class cl_brk *)(fbrk->at(0));
      fbrk->del_bp(brk->addr);
    }
  while (ebrk->count)
    ebrk->free_at(ebrk->count-1);
}

int
cl_uc::make_new_brknr(void)
{
  if (brk_counter == 0)
    return(brk_counter= 1);
  if (fbrk->count == 0 &&
      ebrk->count == 0)
    return(brk_counter= 1);
  return(++brk_counter);
}

class cl_ev_brk *
cl_uc::mk_ebrk(enum brk_perm perm, class cl_mem *mem,
	       char op, t_addr addr, int hit)
{
  class cl_ev_brk *b;
  op= toupper(op);

  switch (mem->type)
    {
    case MEM_ROM:
      if (op == 'R')
	b= new cl_rc_brk(make_new_brknr(), addr, perm, hit);
      else
	return(0);
      break;
    case MEM_IRAM:
      if (op == 'R')
	b= new cl_ri_brk(make_new_brknr(), addr, perm, hit);
      else if (op == 'W')
	b= new cl_wi_brk(make_new_brknr(), addr, perm, hit);
      else
	return(0);
      break;
    case MEM_XRAM:
      if (op == 'R')
	b= new cl_rx_brk(make_new_brknr(), addr, perm, hit);
      else if (op == 'W')
	b= new cl_wx_brk(make_new_brknr(), addr, perm, hit);
      else
	return(0);
      break;
    case MEM_SFR:
      if (op == 'R')
	b= new cl_rs_brk(make_new_brknr(), addr, perm, hit);
      else if (op == 'W')
	b= new cl_ws_brk(make_new_brknr(), addr, perm, hit);
      else
	return(0);
      break;
    default:
      return(0);
    }
  b->init();
  return(b);
}


/* End of uc.cc */

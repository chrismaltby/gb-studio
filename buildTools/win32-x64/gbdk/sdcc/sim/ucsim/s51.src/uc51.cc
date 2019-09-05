/*
 * Simulator of microcontrollers (uc51.cc)
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
#include <termios.h>
#include <fcntl.h>
#include <unistd.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/time.h>
#if FD_HEADER_OK
# include HEADER_FD
#endif
#include "i_string.h"

// sim
#include "optioncl.h"

// local
#include "uc51cl.h"
#include "glob.h"
#include "regs51.h"
#include "timer0cl.h"
#include "timer1cl.h"
#include "serialcl.h"
#include "portcl.h"
#include "interruptcl.h"


/*
 * Making a new micro-controller and reset it
 */

t_uc51::t_uc51(int Itype, int Itech, class cl_sim *asim):
  cl_uc(asim)
{
  int i;
  struct termios tattr;
  
  type= Itype;
  technology= Itech;

  debug= asim->app->args->get_iarg('V', 0);
  stop_at_it= DD_FALSE;
  options->add(new cl_bool_opt(&debug, "verbose", "Verbose flag."));
  options->add(new cl_bool_opt(&stop_at_it, "stopit",
			       "Stop if interrupt accepted."));
  options->add(new cl_cons_debug_opt(asim->app, "debug",
				     "Debug messages appears on this console."));

  serial_in = (FILE*)asim->app->args->get_parg(0, "Ser_in");
  serial_out= (FILE*)asim->app->args->get_parg(0, "Ser_out");
  if (serial_in)
    {
      // making `serial' unbuffered
      if (setvbuf(serial_in, NULL, _IONBF, 0))
	perror("Unbuffer serial input channel");
      // setting O_NONBLOCK
      if ((i= fcntl(fileno(serial_in), F_GETFL, 0)) < 0)
	perror("Get flags of serial input");
      i|= O_NONBLOCK;
      if (fcntl(fileno(serial_in), F_SETFL, i) < 0)
	perror("Set flags of serial input");
      // switching terminal to noncanonical mode
      if (isatty(fileno(serial_in)))
	{
	  tcgetattr(fileno(serial_in), &saved_attributes_in);
	  tcgetattr(fileno(serial_in), &tattr);
	  tattr.c_lflag&= ~(ICANON|ECHO);
	  tattr.c_cc[VMIN] = 1;
	  tattr.c_cc[VTIME]= 0;
	  tcsetattr(fileno(serial_in), TCSAFLUSH, &tattr);
	}
      else
	fprintf(stderr, "Warning: serial input interface connected to a "
		"non-terminal file.\n");
    }
  if (serial_out)
    {
      // making `serial' unbuffered
      if (setvbuf(serial_out, NULL, _IONBF, 0))
	perror("Unbuffer serial output channel");
      // setting O_NONBLOCK
      if ((i= fcntl(fileno(serial_out), F_GETFL, 0)) < 0)
	perror("Get flags of serial output");
      i|= O_NONBLOCK;
      if (fcntl(fileno(serial_out), F_SETFL, i) < 0)
	perror("Set flags of serial output");
      // switching terminal to noncanonical mode
      if (isatty(fileno(serial_out)))
	{
	  tcgetattr(fileno(serial_out), &saved_attributes_out);
	  tcgetattr(fileno(serial_out), &tattr);
	  tattr.c_lflag&= ~(ICANON|ECHO);
	  tattr.c_cc[VMIN] = 1;
	  tattr.c_cc[VTIME]= 0;
	  tcsetattr(fileno(serial_out), TCSAFLUSH, &tattr);
	}
      else
	fprintf(stderr, "Warning: serial output interface connected to a "
		"non-terminal file.\n");
    }

  for (i= 0; i < 4; i++)
    port_pins[i]= 0xff;
  it_sources->add(new cl_it_src(bmEX0, TCON, bmIE0, 0x0003, true,
				"external #0"));
  it_sources->add(new cl_it_src(bmET0, TCON, bmTF0, 0x000b, true,
				"timer #0"));
  it_sources->add(new cl_it_src(bmEX1, TCON, bmIE1, 0x0013, true,
				"external #1"));
  it_sources->add(new cl_it_src(bmET1, TCON, bmTF1, 0x001b, true,
				"timer #1"));
  it_sources->add(new cl_it_src(bmES , SCON, bmTI , 0x0023, false,
				"serial transmit"));
  it_sources->add(new cl_it_src(bmES , SCON, bmRI , 0x0023, false,
				"serial receive"));
}


/*
 * Initializing. Virtual calls go here
 * This method must be called first after object creation.
 */

int
t_uc51::init(void)
{
  cl_uc::init();
  reset();
  return(0);
}

static char id_string_51[100];

char *
t_uc51::id_string(void)
{
  int i;

  for (i= 0; cpus_51[i].type_str != NULL && cpus_51[i].type != type; i++) ;
  sprintf(id_string_51, "%s %s",
	  cpus_51[i].type_str?cpus_51[i].type_str:"51",
	  (technology==CPU_HMOS)?"HMOS":"CMOS");
  return(id_string_51);
}

void
t_uc51::mk_hw_elements(void)
{
  class cl_hw *h;

  hws->add(h= new cl_timer0(this));
  h->init();
  hws->add(h= new cl_timer1(this));
  h->init();
  hws->add(h= new cl_serial(this));
  h->init();
  hws->add(h= new cl_port(this, 0));
  h->init();
  hws->add(h= new cl_port(this, 1));
  h->init();
  hws->add(h= new cl_port(this, 2));
  h->init();
  hws->add(h= new cl_port(this, 3));
  h->init();
  hws->add(h= new cl_interrupt(this));
  h->init();
}

class cl_mem *
t_uc51::mk_mem(enum mem_class type, char *class_name)
{
  class cl_mem *m= cl_uc::mk_mem(type, class_name);
  if (type == MEM_SFR)
    sfr= m;
  if (type == MEM_IRAM)
    iram= m;
  return(m);
}


/*
 * Destroying the micro-controller object
 */

t_uc51::~t_uc51(void)
{
  if (serial_out)
    {
      if (isatty(fileno(serial_out)))
	tcsetattr(fileno(serial_out), TCSANOW, &saved_attributes_out);
      fclose(serial_out);
    }
  if (serial_in)
    {
      if (isatty(fileno(serial_in)))
	tcsetattr(fileno(serial_in), TCSANOW, &saved_attributes_in);
      fclose(serial_in);
    }
}


/*
 * Writing data to EROM
 */

void
t_uc51::write_rom(t_addr addr, ulong data)
{
  if (addr < EROM_SIZE)
    set_mem(MEM_ROM, addr, data);
}


/*
 * Disassembling an instruction
 */

struct dis_entry *
t_uc51::dis_tbl(void)
{
  return(disass_51);
}

struct name_entry *
t_uc51::sfr_tbl(void)
{
  return(sfr_tab51);
}

struct name_entry *
t_uc51::bit_tbl(void)
{
  return(bit_tab51);
}

char *
t_uc51::disass(t_addr addr, char *sep)
{
  char work[256], temp[20], c[2];
  char *buf, *p, *b, *t;
  t_mem code= get_mem(MEM_ROM, addr);

  p= work;
  b= dis_tbl()[code].mnemonic;
  while (*b)
    {
      if (*b == '%')
	{
	  b++;
	  switch (*(b++))
	    {
	    case 'A': // absolute address
	      sprintf(temp, "%04lx",
		      (addr&0xf800)|
		      (((code>>5)&0x07)*256 +
		       get_mem(MEM_ROM, addr+1)));
	      break;
	    case 'l': // long address
	      sprintf(temp, "%04lx",
		      get_mem(MEM_ROM, addr+1)*256 + get_mem(MEM_ROM, addr+2));
	      break;
	    case 'a': // addr8 (direct address) at 2nd byte
 	      if (!get_name(get_mem(MEM_ROM, addr+1), sfr_tbl(), temp))
		sprintf(temp, "%02lx", get_mem(MEM_ROM, addr+1));
	      break;
	    case '8': // addr8 (direct address) at 3rd byte
 	      if (!get_name(get_mem(MEM_ROM, addr+2), sfr_tbl(), temp))
		sprintf(temp, "%02lx", get_mem(MEM_ROM, addr+1));
	      sprintf(temp, "%02lx", get_mem(MEM_ROM, addr+2));
	      break;
	    case 'b': // bitaddr at 2nd byte
	      if (get_name(get_mem(MEM_ROM, addr+1), bit_tbl(), temp))
		break;
	      if (get_name(get_bitidx(get_mem(MEM_ROM, addr+1)),
			   sfr_tbl(), temp))
		{
		  strcat(temp, ".");
		  sprintf(c, "%1ld", get_mem(MEM_ROM, addr+1)&0x07);
		  strcat(temp, c);
		  break;
		}
	      sprintf(temp, "%02x.%ld",
		      get_bitidx(get_mem(MEM_ROM, addr+1)),
		      get_mem(MEM_ROM, addr+1)&0x07);
	      break;
	    case 'r': // rel8 address at 2nd byte
	      sprintf(temp, "%04lx",
		      addr+2+(signed char)(get_mem(MEM_ROM, addr+1)));
	      break;
	    case 'R': // rel8 address at 3rd byte
	      sprintf(temp, "%04lx",
		      addr+3+(signed char)(get_mem(MEM_ROM, addr+2)));
	      break;
	    case 'd': // data8 at 2nd byte
	      sprintf(temp, "%02lx", get_mem(MEM_ROM, addr+1));
	      break;
	    case 'D': // data8 at 3rd byte
	      sprintf(temp, "%02lx", get_mem(MEM_ROM, addr+2));
	      break;
	    case '6': // data16 at 2nd(H)-3rd(L) byte
	      sprintf(temp, "%04lx",
		      get_mem(MEM_ROM, addr+1)*256 + get_mem(MEM_ROM, addr+2));
	      break;
	    default:
	      strcpy(temp, "?");
	      break;
	    }
	  t= temp;
	  while (*t)
	    *(p++)= *(t++);
	}
      else
	*(p++)= *(b++);
    }
  *p= '\0';

  p= strchr(work, ' ');
  if (!p)
    {
      buf= strdup(work);
      return(buf);
    }
  if (sep == NULL)
    buf= (char *)malloc(6+strlen(p)+1);
  else
    buf= (char *)malloc((p-work)+strlen(sep)+strlen(p)+1);
  for (p= work, b= buf; *p != ' '; p++, b++)
    *b= *p;
  p++;
  *b= '\0';
  if (sep == NULL)
    {
      while (strlen(buf) < 6)
	strcat(buf, " ");
    }
  else
    strcat(buf, sep);
  strcat(buf, p);
  return(buf);
}


void
t_uc51::print_regs(class cl_console *con)
{
  t_addr start;
  uchar data;

  start= sfr->get(PSW) & 0x18;
  //dump_memory(iram, &start, start+7, 8, /*sim->cmd_out()*/con, sim);
  iram->dump(start, start+7, 8, con);
  start= sfr->get(PSW) & 0x18;
  data= iram->get(iram->get(start));
  con->printf("%06x %02x %c",
	      iram->get(start), data, isprint(data)?data:'.');

  con->printf("  ACC= 0x%02x %3d %c  B= 0x%02x", sfr->get(ACC), sfr->get(ACC),
	      isprint(sfr->get(ACC))?(sfr->get(ACC)):'.', sfr->get(B)); 
  eram2xram();
  data= get_mem(MEM_XRAM, sfr->get(DPH)*256+sfr->get(DPL));
  con->printf("   DPTR= 0x%02x%02x @DPTR= 0x%02x %3d %c\n", sfr->get(DPH),
	      sfr->get(DPL), data, data, isprint(data)?data:'.');

  data= iram->get(iram->get(start+1));
  con->printf("%06x %02x %c", iram->get(start+1), data,
	      isprint(data)?data:'.');
  data= sfr->get(PSW);
  con->printf("  PSW= 0x%02x CY=%c AC=%c OV=%c P=%c\n", data,
	      (data&bmCY)?'1':'0', (data&bmAC)?'1':'0',
	      (data&bmOV)?'1':'0', (data&bmP)?'1':'0');

  print_disass(PC, con);
}


bool
t_uc51::extract_bit_address(t_addr bit_address,
			    class cl_mem **mem,
			    t_addr *mem_addr,
			    t_mem *bit_mask)
{
  if (mem)
    *mem= sfr;
  if (bit_address > 0xff)
    return(DD_FALSE);
  if (bit_mask)
    *bit_mask= 1 << (bit_address % 8);
  if (mem_addr)
    {
      if (bit_address < 0x80)
	*mem_addr= bit_address/8 + 0x20;
      else
	*mem_addr= bit_address & 0xf8;
    }
  return(DD_TRUE);
}


/*
 * Resetting the micro-controller
 */

void
t_uc51::reset(void)
{
  cl_uc::reset();

  clear_sfr();

  result= resGO;

  was_reti= DD_FALSE;

  s_tr_t1    = 0;
  s_rec_t1   = 0;
  s_tr_tick  = 0;
  s_rec_tick = 0;
  s_in       = 0;
  s_out      = 0;
  s_sending  = DD_FALSE;
  s_receiving= DD_FALSE;
  s_rec_bit  = 0;
  s_tr_bit   = 0;
}


/*
 * Setting up SFR area to reset value
 */

void
t_uc51::clear_sfr(void)
{
  int i;
  
  for (i= 0; i < SFR_SIZE; i++)
    sfr->set(i, 0);
  sfr->set(P0, 0xff);
  sfr->set(P1, 0xff);
  sfr->set(P2, 0xff);
  sfr->set(P3, 0xff);
  sfr->set(SP, 7);
  prev_p1= port_pins[1] & sfr->get(P1);
  prev_p3= port_pins[3] & sfr->get(P3);
}


/*
 * Analyzing code and settig up instruction map
 */

void
t_uc51::analyze(t_addr addr)
{
  uint code;
  struct dis_entry *tabl;

  code= get_mem(MEM_ROM, addr);
  tabl= &(dis_tbl()[code]);
  while (!inst_at(addr) &&
	 code != 0xa5 /* break point */)
    {
      set_inst_at(addr);
      switch (tabl->branch)
	{
	case 'a': // acall
	  analyze((addr & 0xf800)|
		  ((get_mem(MEM_ROM, addr+1)&0x07)*256+
		   get_mem(MEM_ROM, addr+2)));
	  analyze(addr+tabl->length);
	  break;
	case 'A': // ajmp
	  addr= (addr & 0xf800)|
	    ((get_mem(MEM_ROM, addr+1) & 0x07)*256 + get_mem(MEM_ROM, addr+2));
	  break;
	case 'l': // lcall
	  analyze(get_mem(MEM_ROM, addr+1)*256 + get_mem(MEM_ROM, addr+2));
	  analyze(addr+tabl->length);
	  break;
	case 'L': // ljmp
	  addr= get_mem(MEM_ROM, addr+1)*256 + get_mem(MEM_ROM, addr+2);
	  break;
	case 'r': // reljmp (2nd byte)
	  analyze((addr + (signed char)(get_mem(MEM_ROM, addr+1))) &
		  (EROM_SIZE - 1));
	  analyze(addr+tabl->length);
	  break;
	case 'R': // reljmp (3rd byte)
	  analyze((addr+
		   (signed char)(get_mem(MEM_ROM, addr+2)))&(EROM_SIZE-1));
	  analyze(addr+tabl->length);
	  break;
	case 's': // sjmp
	  {
	    signed char target;
	    target= get_mem(MEM_ROM, addr+1);
	    addr+= 2;
	    addr= (addr+target)&(EROM_SIZE-1);
	    break;
	  }
	case '_':
	  return;
	default:
	  addr= (addr+tabl->length) & (EROM_SIZE - 1);
	  break;
	}
      code= get_mem(MEM_ROM, addr);
      tabl= &(dis_tbl()[code]);
    }
}


/*
 * Inform hardware elements that `cycles' machine cycles have elapsed
 */

int
t_uc51::tick(int cycles)
{
  int l;

  cl_uc::tick(cycles);
  do_hardware(cycles);
  s_tr_tick+= (l= cycles * clock_per_cycle());
  s_rec_tick+= l;
  return(0);
}


/*
 * Correcting direct address
 *
 * This function returns address of addressed element which can be an IRAM
 * or an SFR.
 */

uchar *
t_uc51::get_direct(t_mem addr, t_addr *ev_i, t_addr *ev_s)
{
  if (addr < SFR_START)
    {
      return(&(iram->umem8[*ev_i= addr]));
      //return(&(MEM(MEM_IRAM)[*ev_i= addr]));
    }
  else
    {
      return(&(sfr->umem8[*ev_s= addr]));
      //return(&(MEM(MEM_SFR)[*ev_s= addr]));
    }
}

/*
 * Calculating address of indirectly addressed IRAM cell
 * If CPU is 8051 and addr is over 127, it must be illegal!
 */

uchar *
t_uc51::get_indirect(uchar addr, int *res)
{
  if (addr >= SFR_START)
    *res= resINV_ADDR;
  else
    *res= resGO;
  return(&(iram->umem8[addr]));
  //return(&(MEM(MEM_IRAM)[addr]));
}


/*
 * Calculating address of specified register cell in IRAM
 */

uchar *
t_uc51::get_reg(uchar regnum)
{
  return(&(iram->umem8[(sfr->get(PSW) & (bmRS0|bmRS1)) |
		      (regnum & 0x07)]));
  //return(&(MEM(MEM_IRAM)[(sfr->get(PSW) & (bmRS0|bmRS1)) |
  //		(regnum & 0x07)]));
}

uchar *
t_uc51::get_reg(uchar regnum, t_addr *event)
{
  return(&(iram->umem8[*event= (sfr->get(PSW) & (bmRS0|bmRS1)) |
		      (regnum & 0x07)]));
  //return(&(MEM(MEM_IRAM)[*event= (sfr->get(PSW) & (bmRS0|bmRS1)) |
  //		(regnum & 0x07)]));
}


/*
 * Calculating address of IRAM or SFR cell which contains addressed bit
 * Next function returns index of cell which contains addressed bit.
 */

uchar *
t_uc51::get_bit(uchar bitaddr)
{
  if (bitaddr < 128)
    {
      return(&(iram->umem8[(bitaddr/8)+32]));
      //return(&(MEM(MEM_IRAM)[(bitaddr/8)+32]));
    }
  return(&(iram->umem8[bitaddr & 0xf8]));
  //return(&(MEM(MEM_SFR)[bitaddr & 0xf8]));
}

uchar *
t_uc51::get_bit(uchar bitaddr, t_addr *ev_i, t_addr *ev_s)
{
  if (bitaddr < 128)
    {
      return(&(iram->umem8[*ev_i= (bitaddr/8)+32]));
      //return(&(MEM(MEM_IRAM)[*ev_i= (bitaddr/8)+32]));
    }
  return(&(sfr->umem8[*ev_s= bitaddr & 0xf8]));
  //return(&(MEM(MEM_SFR)[*ev_s= bitaddr & 0xf8]));
}

uchar
t_uc51::get_bitidx(uchar bitaddr)
{
  if (bitaddr < 128)
    return((bitaddr/8)+32);
  return(bitaddr & 0xf8);
}


/*
 * Processing write operation to IRAM
 *
 * It starts serial transmition if address is in SFR and it is
 * SBUF. Effect on IE is also checked.
 */

void
t_uc51::proc_write(uchar *addr)
{
  if (addr == &((sfr->umem8)[SBUF]))
    {
      s_out= sfr->get(SBUF);
      s_sending= DD_TRUE;
      s_tr_bit = 0;
      s_tr_tick= 0;
      s_tr_t1  = 0;
    }
  if (addr == &((sfr->umem8)[IE]))
    was_reti= DD_TRUE;
}

void
t_uc51::proc_write_sp(uchar val)
{
  if (val > sp_max)
    sp_max= val;
  sp_avg= (sp_avg+val)/2;
}


/*
 * Reading IRAM or SFR, but if address points to a port, it reads
 * port pins instead of port latches
 */

uchar
t_uc51::read(uchar *addr)
{
  //if (addr == &(MEM(MEM_SFR)[P0]))
  if (addr == &(sfr->umem8[P0]))
    return(get_mem(MEM_SFR, P0) & port_pins[0]);
  //if (addr == &(MEM(MEM_SFR)[P1]))
  if (addr == &(sfr->umem8[P1]))
    return(get_mem(MEM_SFR, P1) & port_pins[1]);
  //if (addr == &(MEM(MEM_SFR)[P2]))
  if (addr == &(sfr->umem8[P2]))
    return(get_mem(MEM_SFR, P2) & port_pins[2]);
  //if (addr == &(MEM(MEM_SFR)[P3]))
  if (addr == &(sfr->umem8[P3]))
    return(get_mem(MEM_SFR, P3) & port_pins[3]);
  return(*addr);
}


/*
 * Fetching one instruction and executing it
 */

void
t_uc51::pre_inst(void)
{
  event_at.wi= (t_addr)-1;
  event_at.ri= (t_addr)-1;
  event_at.wx= (t_addr)-1;
  event_at.rx= (t_addr)-1;
  event_at.ws= (t_addr)-1;
  event_at.rs= (t_addr)-1;
  event_at.rc= (t_addr)-1;
}

int
t_uc51::exec_inst(void)
{
  ulong code;
  int res;

  //pr_inst();
  if (fetch(&code))
    return(resBREAKPOINT);
  tick(1);
  switch (code)
    {
    case 0x00: res= inst_nop(code); break;
    case 0x01: case 0x21: case 0x41: case 0x61:
    case 0x81: case 0xa1: case 0xc1: case 0xe1:res=inst_ajmp_addr(code);break;
    case 0x02: res= inst_ljmp(code); break;
    case 0x03: res= inst_rr(code); break;
    case 0x04: res= inst_inc_a(code); break;
    case 0x05: res= inst_inc_addr(code); break;
    case 0x06: case 0x07: res= inst_inc_$ri(code); break;
    case 0x08: case 0x09: case 0x0a: case 0x0b:
    case 0x0c: case 0x0d: case 0x0e: case 0x0f: res= inst_inc_rn(code); break;
    case 0x10: res= inst_jbc_bit_addr(code); break;
    case 0x11: case 0x31: case 0x51: case 0x71:
    case 0x91: case 0xb1: case 0xd1: case 0xf1:res=inst_acall_addr(code);break;
    case 0x12: res= inst_lcall(code, 0); break;
    case 0x13: res= inst_rrc(code); break;
    case 0x14: res= inst_dec_a(code); break;
    case 0x15: res= inst_dec_addr(code); break;
    case 0x16: case 0x17: res= inst_dec_$ri(code); break;
    case 0x18: case 0x19: case 0x1a: case 0x1b:
    case 0x1c: case 0x1d: case 0x1e: case 0x1f: res= inst_dec_rn(code); break;
    case 0x20: res= inst_jb_bit_addr(code); break;
    case 0x22: res= inst_ret(code); break;
    case 0x23: res= inst_rl(code); break;
    case 0x24: res= inst_add_a_$data(code); break;
    case 0x25: res= inst_add_a_addr(code); break;
    case 0x26: case 0x27: res= inst_add_a_$ri(code); break;
    case 0x28: case 0x29: case 0x2a: case 0x2b:
    case 0x2c: case 0x2d: case 0x2e: case 0x2f:res= inst_add_a_rn(code);break;
    case 0x30: res= inst_jnb_bit_addr(code); break;
    case 0x32: res= inst_reti(code); break;
    case 0x33: res= inst_rlc(code); break;
    case 0x34: res= inst_addc_a_$data(code); break;
    case 0x35: res= inst_addc_a_addr(code); break;
    case 0x36: case 0x37: res= inst_addc_a_$ri(code); break;
    case 0x38: case 0x39: case 0x3a: case 0x3b:
    case 0x3c: case 0x3d: case 0x3e: case 0x3f:res= inst_addc_a_rn(code);break;
    case 0x40: res= inst_jc_addr(code); break;
    case 0x42: res= inst_orl_addr_a(code); break;
    case 0x43: res= inst_orl_addr_$data(code); break;
    case 0x44: res= inst_orl_a_$data(code); break;
    case 0x45: res= inst_orl_a_addr(code); break;
    case 0x46: case 0x47: res= inst_orl_a_$ri(code); break;
    case 0x48: case 0x49: case 0x4a: case 0x4b:
    case 0x4c: case 0x4d: case 0x4e: case 0x4f: res= inst_orl_a_rn(code);break;
    case 0x50: res= inst_jnc_addr(code); break;
    case 0x52: res= inst_anl_addr_a(code); break;
    case 0x53: res= inst_anl_addr_$data(code); break;
    case 0x54: res= inst_anl_a_$data(code); break;
    case 0x55: res= inst_anl_a_addr(code); break;
    case 0x56: case 0x57: res= inst_anl_a_$ri(code); break;
    case 0x58: case 0x59: case 0x5a: case 0x5b:
    case 0x5c: case 0x5d: case 0x5e: case 0x5f: res= inst_anl_a_rn(code);break;
    case 0x60: res= inst_jz_addr(code); break;
    case 0x62: res= inst_xrl_addr_a(code); break;
    case 0x63: res= inst_xrl_addr_$data(code); break;
    case 0x64: res= inst_xrl_a_$data(code); break;
    case 0x65: res= inst_xrl_a_addr(code); break;
    case 0x66: case 0x67: res= inst_xrl_a_$ri(code); break;
    case 0x68: case 0x69: case 0x6a: case 0x6b:
    case 0x6c: case 0x6d: case 0x6e: case 0x6f: res= inst_xrl_a_rn(code);break;
    case 0x70: res= inst_jnz_addr(code); break;
    case 0x72: res= inst_orl_c_bit(code); break;
    case 0x73: res= inst_jmp_$a_dptr(code); break;
    case 0x74: res= inst_mov_a_$data(code); break;
    case 0x75: res= inst_mov_addr_$data(code); break;
    case 0x76: case 0x77: res= inst_mov_$ri_$data(code); break;
    case 0x78: case 0x79: case 0x7a: case 0x7b: case 0x7c:
    case 0x7d: case 0x7e: case 0x7f: res=inst_mov_rn_$data(code); break;
    case 0x80: res= inst_sjmp(code); break;
    case 0x82: res= inst_anl_c_bit(code); break;
    case 0x83: res= inst_movc_a_$a_pc(code); break;
    case 0x84: res= inst_div_ab(code); break;
    case 0x85: res= inst_mov_addr_addr(code); break;
    case 0x86: case 0x87: res= inst_mov_addr_$ri(code); break;
    case 0x88: case 0x89: case 0x8a: case 0x8b:
    case 0x8c: case 0x8d: case 0x8e: case 0x8f:res=inst_mov_addr_rn(code);break;
    case 0x90: res= inst_mov_dptr_$data(code); break;
    case 0x92: res= inst_mov_bit_c(code); break;
    case 0x93: res= inst_movc_a_$a_dptr(code); break;
    case 0x94: res= inst_subb_a_$data(code); break;
    case 0x95: res= inst_subb_a_addr(code); break;
    case 0x96: case 0x97: res= inst_subb_a_$ri(code); break;
    case 0x98: case 0x99: case 0x9a: case 0x9b:
    case 0x9c: case 0x9d: case 0x9e: case 0x9f:res= inst_subb_a_rn(code);break;
    case 0xa2: res= inst_mov_c_bit(code); break;
    case 0xa3: res= inst_inc_dptr(code); break;
    case 0xa4: res= inst_mul_ab(code); break;
    case 0xa5: res= inst_unknown(code); break;
    case 0xa6: case 0xa7: res= inst_mov_$ri_addr(code); break;
    case 0xa8: case 0xa9: case 0xaa: case 0xab:
    case 0xac: case 0xad: case 0xae: case 0xaf:res=inst_mov_rn_addr(code);break;
    case 0xb0: res= inst_anl_c_$bit(code); break;
    case 0xb2: res= inst_cpl_bit(code); break;
    case 0xb3: res= inst_cpl_c(code); break;
    case 0xb4: res= inst_cjne_a_$data_addr(code); break;
    case 0xb5: res= inst_cjne_a_addr_addr(code); break;
    case 0xb6: case 0xb7: res= inst_cjne_$ri_$data_addr(code); break;
    case 0xb8: case 0xb9: case 0xba: case 0xbb: case 0xbc:
    case 0xbd: case 0xbe: case 0xbf: res=inst_cjne_rn_$data_addr(code); break;
    case 0xc0: res= inst_push(code); break;
    case 0xc2: res= inst_clr_bit(code); break;
    case 0xc3: res= inst_clr_c(code); break;
    case 0xc4: res= inst_swap(code); break;
    case 0xc5: res= inst_xch_a_addr(code); break;
    case 0xc6: case 0xc7: res= inst_xch_a_$ri(code); break;
    case 0xc8: case 0xc9: case 0xca: case 0xcb:
    case 0xcc: case 0xcd: case 0xce: case 0xcf: res= inst_xch_a_rn(code);break;
    case 0xd0: res= inst_pop(code); break;
    case 0xd2: res= inst_setb_bit(code); break;
    case 0xd3: res= inst_setb_c(code); break;
    case 0xd4: res= inst_da_a(code); break;
    case 0xd5: res= inst_djnz_addr_addr(code); break;
    case 0xd6: case 0xd7: res= inst_xchd_a_$ri(code); break;
    case 0xd8: case 0xd9: case 0xda: case 0xdb: case 0xdc:
    case 0xdd: case 0xde: case 0xdf: res=inst_djnz_rn_addr(code); break;
    case 0xe0: res= inst_movx_a_$dptr(code); break;
    case 0xe2: case 0xe3: res= inst_movx_a_$ri(code); break;
    case 0xe4: res= inst_clr_a(code); break;
    case 0xe5: res= inst_mov_a_addr(code); break;
    case 0xe6: case 0xe7: res= inst_mov_a_$ri(code); break;
    case 0xe8: case 0xe9: case 0xea: case 0xeb:
    case 0xec: case 0xed: case 0xee: case 0xef: res= inst_mov_a_rn(code);break;
    case 0xf0: res= inst_movx_$dptr_a(code); break;
    case 0xf2: case 0xf3: res= inst_movx_$ri_a(code); break;
    case 0xf4: res= inst_cpl_a(code); break;
    case 0xf5: res= inst_mov_addr_a(code); break;
    case 0xf6: case 0xf7: res= inst_mov_$ri_a(code); break;
    case 0xf8: case 0xf9: case 0xfa: case 0xfb:
    case 0xfc: case 0xfd: case 0xfe: case 0xff: res= inst_mov_rn_a(code);break;
    default:
      res= inst_unknown(code);
      break;
    }
  //post_inst();
  return(res);
}


/*
 * Simulating execution of next instruction
 *
 * This is an endless loop if requested number of steps is negative.
 * In this case execution is stopped if an instruction results other
 * status than GO. Execution can be stopped if `cmd_in' is not NULL
 * and there is input available on that file. It is usefull if the
 * command console is on a terminal. If input is available then a
 * complete line is read and dropped out because input is buffered
 * (inp_avail will be TRUE if ENTER is pressed) and it can confuse
 * command interepter.
 */

int
t_uc51::do_inst(int step)
{
  result= resGO;
  while ((result == resGO) &&
	 (state != stPD) &&
	 (step != 0))
    {
      if (step > 0)
	step--;
      if (state == stGO)
	{
	  was_reti= DD_FALSE;
	  pre_inst();
	  result= exec_inst();
	  post_inst();
	  if (result == resGO)
	    result= check_events();
	}
      else
	{
	  // tick hw in idle state
	  post_inst();
	  tick(1);
	}
      if (result == resGO)
	{
	  int res;
	  if ((res= do_interrupt()) != resGO)
	    result= res;
	  else
	    result= idle_pd();
	}
      if ((step < 0) &&
	  ((ticks->ticks % 100000) < 50))
	{
	  if (sim->app->get_commander()->input_avail_on_frozen())
	    {
	      result= resUSER;
	    }
	  else
	    if (sim->app->get_commander()->input_avail())
	      break;
	}
      if (((result == resINTERRUPT) &&
	   stop_at_it) ||
	  result >= resSTOP)
	{
	  sim->stop(result);
	  break;
	}
    }
  if (state == stPD)
    {
      //FIXME: tick outsiders eg. watchdog
      if (sim->app->get_commander()->input_avail_on_frozen())
	{
	  //fprintf(stderr,"uc: inp avail in PD mode, user stop\n");
          result= resUSER;
          sim->stop(result); 
	}
    }
  return(result);
}

void
t_uc51::post_inst(void)
{
  uint tcon= sfr->get(TCON);
  uint p3= sfr->get(P3);

  set_p_flag();

  // Read of SBUF must be serial input data
  sfr->set(SBUF, s_in);

  // Setting up external interrupt request bits (IEx)
  if ((tcon & bmIT0))
    {
      // IE0 edge triggered
      if ((prev_p3 & bm_INT0) &&
	  !(p3 & port_pins[3] & bm_INT0))
	// falling edge on INT0
	{
	  sim->app->get_commander()->
	    debug("%g sec (%d clks): Falling edge detected on INT0 (P3.2)\n",
			  get_rtime(), ticks->ticks);
	  sfr->set_bit1(TCON, bmIE0);
	}
    }
  else
    {
      // IE0 level triggered
      if (p3 & port_pins[3] & bm_INT0)
	sfr->set_bit0(TCON, bmIE0);
      else
	sfr->set_bit1(TCON, bmIE0);
    }
  if ((tcon & bmIT1))
    {
      // IE1 edge triggered
      if ((prev_p3 & bm_INT1) &&
	  !(p3 & port_pins[3] & bm_INT1))
	// falling edge on INT1
	sfr->set_bit1(TCON, bmIE1);
    }
  else
    {
      // IE1 level triggered
      if (p3 & port_pins[3] & bm_INT1)
	sfr->set_bit0(TCON, bmIE1);
      else
	sfr->set_bit1(TCON, bmIE1);
    }
  prev_p3= p3 & port_pins[3];
  prev_p1= p3 & port_pins[1];
}


/*
 * Setting up parity flag
 */

void
t_uc51::set_p_flag(void)
{
  bool p;
  int i;
  uchar uc;

  p = DD_FALSE;
  uc= sfr->get(ACC);
  for (i= 0; i < 8; i++)
    {
      if (uc & 1)
	p= !p;
      uc>>= 1;
    }
  SET_BIT(p, PSW, bmP);
}

/*
 * Simulating hardware elements
 */

int
t_uc51::do_hardware(int cycles)
{
  int res;

  if ((res= do_timers(cycles)) != resGO)
    return(res);
  if ((res= do_serial(cycles)) != resGO)
    return(res);
  return(do_wdt(cycles));
}


/*
 *
 */

int
t_uc51::serial_bit_cnt(int mode)
{
  int /*mode,*/ divby= 12;
  int *tr_src= 0, *rec_src= 0;

  //mode= sfr->get(SCON) >> 6;
  switch (mode)
    {
    case 0:
      divby  = 12;
      tr_src = &s_tr_tick;
      rec_src= &s_rec_tick;
      break;
    case 1:
    case 3:
      divby  = (sfr->get(PCON)&bmSMOD)?16:32;
      tr_src = &s_tr_t1;
      rec_src= &s_rec_t1;
      break;
    case 2:
      divby  = (sfr->get(PCON)&bmSMOD)?16:32;
      tr_src = &s_tr_tick;
      rec_src= &s_rec_tick;
      break;
    }
  if (s_sending)
    {
      while (*tr_src >= divby)
	{
	  (*tr_src)-= divby;
	  s_tr_bit++;
	}
    }
  if (s_receiving)
    {
      while (*rec_src >= divby)
	{
	  (*rec_src)-= divby;
	  s_rec_bit++;
	}
    }
  return(0);
}


/*
 * Simulating serial line
 */

int
t_uc51::do_serial(int cycles)
{
  int mode, bits= 8;
  char c;
  uint scon= sfr->get(SCON);

  mode= scon >> 6;
  switch (mode)
    {
    case 0:
      bits= 8;
      break;
    case 1:
      bits= 10;
      break;
    case 2:
    case 3:
      bits= 11;
      break;
    }
  serial_bit_cnt(mode);
  if (s_sending &&
      (s_tr_bit >= bits))
    {
      s_sending= DD_FALSE;
      sfr->set_bit1(SCON, bmTI);
      if (serial_out)
	{
	  putc(s_out, serial_out);
	  fflush(serial_out);
	}
      s_tr_bit-= bits;
    }
  if ((scon & bmREN) &&
      serial_in &&
      !s_receiving)
    {
      fd_set set; static struct timeval timeout= {0,0};
      FD_ZERO(&set);
      FD_SET(fileno(serial_in), &set);
      int i= select(fileno(serial_in)+1, &set, NULL, NULL, &timeout);
      if (i > 0 &&
      	  FD_ISSET(fileno(serial_in), &set))
	{
	  s_receiving= DD_TRUE;
	  s_rec_bit= 0;
	  s_rec_tick= s_rec_t1= 0;
	}
    }
  if (s_receiving &&
      (s_rec_bit >= bits))
    {
      if (::read(fileno(serial_in), &c, 1) == 1)
	{
	  s_in= c;
	  sfr->set(SBUF, s_in);
	  received(c);
	}
      s_receiving= DD_FALSE;
      s_rec_bit-= bits;
    }
  return(resGO);
}

void
t_uc51::received(int c)
{
  sfr->set_bit1(SCON, bmRI);
}


/*
 * Simulating timers
 */

int
t_uc51::do_timers(int cycles)
{
  int res;

  if ((res= do_timer0(cycles)) != resGO)
    return(res);
  return(do_timer1(cycles));
}


/*
 * Simulating timer 0
 */

int
t_uc51::do_timer0(int cycles)
{
  uint tmod= sfr->get(TMOD);
  uint tcon= sfr->get(TCON);
  uint p3= sfr->get(P3);

  if (((tmod & bmGATE0) &&
       (p3 & port_pins[3] & bm_INT0)) ||
      (tcon & bmTR0))
    {
      if (!(tmod & bmC_T0) ||
	  ((prev_p3 & bmT0) &&
	   !(p3 & port_pins[3] & bmT0)))
	{
	  if (!(tmod & bmM00) &&
	      !(tmod & bmM10))
	    {
	      if (tmod & bmC_T0)
		cycles= 1;
	      while (cycles--)
		{
		  // mod 0, TH= 8 bit t/c, TL= 5 bit precounter
		  //(MEM(MEM_SFR)[TL0])++;
		  sfr->add(TL0, 1);
		  if ((sfr->get(TL0) & 0x1f) == 0)
		    {
		      //sfr->set_bit0(TL0, ~0x1f);
		      sfr->set(TL0, 0);
		      if (!/*++(MEM(MEM_SFR)[TH0])*/sfr->add(TH0, 1))
			{
			  sfr->set_bit1(TCON, bmTF0);
			  t0_overflow();
			}
		    }
		}
	    }
	  else if ((tmod & bmM00) &&
		   !(tmod & bmM10))
	    {
	      if (tmod & bmC_T0)
		cycles= 1;
	      while (cycles--)
		{
		  // mod 1 TH+TL= 16 bit t/c
		  if (!/*++(MEM(MEM_SFR)[TL0])*/sfr->add(TL0, 1))
		    {
		      if (!/*++(MEM(MEM_SFR)[TH0])*/sfr->add(TH0, 1))
			{
			  sfr->set_bit1(TCON, bmTF0);
			  t0_overflow();
			}
		    }
		}
	    }
	  else if (!(tmod & bmM00) &&
		   (tmod & bmM10))
	    {
	      if (tmod & bmC_T0)
		cycles= 1;
	      while (cycles--)
		{
		  // mod 2 TL= 8 bit t/c auto reload from TH
		  if (!/*++(MEM(MEM_SFR)[TL0])*/sfr->add(TL0, 1))
		    {
		      sfr->set(TL0, sfr->get(TH0));
		      sfr->set_bit1(TCON, bmTF0);
		      t0_overflow();
		    }
		}
	    }
	  else
	    {
	      // mod 3 TL= 8 bit t/c
	      //       TH= 8 bit timer controlled with T1's bits
	      if (!/*++(MEM(MEM_SFR)[TL0])*/sfr->add(TL0, 1))
		{
		  sfr->set_bit1(TCON, bmTF0);
		  t0_overflow();
		}
	    }
	}
    }
  if ((tmod & bmM00) &&
      (tmod & bmM10))
    {
      if (((tmod & bmGATE1) &&
	   (p3 & port_pins[3] & bm_INT1)) ||
	  (tcon & bmTR1))
	{
	  if (!/*++(MEM(MEM_SFR)[TH0])*/sfr->add(TH0, 1))
	    {
	      sfr->set_bit1(TCON, bmTF1);
	      s_tr_t1++;
	      s_rec_t1++;
	      t0_overflow();
	    }
	}
    }
  return(resGO);
}

/*
 * Called every time when T0 overflows
 */

int
t_uc51::t0_overflow(void)
{
  return(0);
}


/*
 * Simulating timer 1
 */

int
t_uc51::do_timer1(int cycles)
{
  uint tmod= sfr->get(TMOD);
  uint tcon= sfr->get(TCON);
  uint p3= sfr->get(P3);

  if (((tmod & bmGATE1) &&
       (p3 & port_pins[3] & bm_INT1)) ||
      (tcon & bmTR1))
    {
      if (!(tmod & bmC_T1) ||
	  ((prev_p3 & bmT1) &&
	   !(p3 & port_pins[3] & bmT1)))
	{
	  if (!(tmod & bmM01) &&
	      !(tmod & bmM11))
	    {
	      if (tmod & bmC_T0)
		cycles= 1;
	      while (cycles--)
		{
		  // mod 0, TH= 8 bit t/c, TL= 5 bit precounter
		  if (/*++(MEM(MEM_SFR)[TL1])*/(sfr->add(TL1, 1) & 0x1f) == 0)
		    {
		      //sfr->set_bit0(TL1, ~0x1f);
		      sfr->set(TL1, 0);
		      if (!/*++(MEM(MEM_SFR)[TH1])*/sfr->add(TH1, 1))
			{
			  sfr->set_bit1(TCON, bmTF1);
			  s_tr_t1++;
			  s_rec_t1++;
			}
		    }
		}
	    }
	  else if ((tmod & bmM01) &&
		   !(tmod & bmM11))
	    {
	      if (tmod & bmC_T0)
		cycles= 1;
	      while (cycles--)
		{
		  // mod 1 TH+TL= 16 bit t/c
		  if (!/*++(MEM(MEM_SFR)[TL1])*/sfr->add(TL1, 1))
		    if (!/*++(MEM(MEM_SFR)[TH1])*/sfr->add(TH1, 1))
		      {
			sfr->set_bit1(TCON, bmTF1);
			s_tr_t1++;
			s_rec_t1++;
		      }
		}
	    }
	  else if (!(tmod & bmM01) &&
		   (tmod & bmM11))
	    {
	      if (tmod & bmC_T1)
		cycles= 1;
	      while (cycles--)
		{
		  // mod 2 TL= 8 bit t/c auto reload from TH
		  if (!/*++(MEM(MEM_SFR)[TL1])*/sfr->add(TL1, 1))
		    {
		      sfr->set(TL1, sfr->get(TH1));
		      sfr->set_bit1(TCON, bmTF1);
		      s_tr_t1++;
		      s_rec_t1++;
		    }
		}
	    }
	  else
	    // mod 3 stop
	    ;
	}
    }
  return(resGO);
}


/*
 * Abstract method to handle WDT
 */

int
t_uc51::do_wdt(int cycles)
{
  return(resGO);
}


/*
 * Checking for interrupt requests and accept one if needed
 */

int
t_uc51::do_interrupt(void)
{
  int i, ie= 0;

  if (was_reti)
    {
      was_reti= DD_FALSE;
      return(resGO);
    }
  if (!((ie= sfr->get(IE)) & bmEA))
    return(resGO);
  class it_level *il= (class it_level *)(it_levels->top()), *IL= 0;
  for (i= 0; i < it_sources->count; i++)
    {
      class cl_it_src *is= (class cl_it_src *)(it_sources->at(i));
      if (is->is_active() &&
	  (ie & is->ie_mask) &&
	  (sfr->get(is->src_reg) & is->src_mask))
	{
	  int pr= it_priority(is->ie_mask);
	  if (il->level >= 0 &&
	      pr <= il->level)
	    continue;
	  if (state == stIDLE)
	    {
	      state= stGO;
	      sfr->set_bit0(PCON, bmIDL);
	      was_reti= 1;
	      return(resGO);
	    }
	  if (is->clr_bit)
	    sfr->set_bit0(is->src_reg, is->src_mask);
	  sim->app->get_commander()->
	    debug("%g sec (%d clks): Accepting interrupt `%s' PC= 0x%06x\n",
			  get_rtime(), ticks->ticks, is->name, PC);
	  IL= new it_level(pr, is->addr, PC, is);
	  return(accept_it(IL));
	}
    }
  return(resGO);
}

int
t_uc51::it_priority(uchar ie_mask)
{
  if (sfr->get(IP) & ie_mask)
    return(1);
  return(0);
}


/*
 * Accept an interrupt
 */

int
t_uc51::accept_it(class it_level *il)
{
  state= stGO;
  sfr->set_bit0(PCON, bmIDL);
  it_levels->push(il);
  tick(1);
  int res= inst_lcall(0, il->addr);
  if (res != resGO)
    return(res);
  else
    return(resINTERRUPT);
}


/*
 * Checking if Idle or PowerDown mode should be activated
 */

int
t_uc51::idle_pd(void)
{
  uint pcon= sfr->get(PCON);

  if (technology != CPU_CMOS)
    return(resGO);
  if (pcon & bmIDL)
    {
      if (state != stIDLE)
	sim->app->get_commander()->
	  debug("%g sec (%d clks): CPU in Idle mode\n",
		get_rtime(), ticks->ticks);
      state= stIDLE;
      //was_reti= 1;
    }
  if (pcon & bmPD)
    {
      if (state != stPD)
	sim->app->get_commander()->
	  debug("%g sec (%d clks): CPU in PowerDown mode\n",
			get_rtime(), ticks->ticks);
      state= stPD;
    }
  return(resGO);
}


/*
 * Checking if EVENT break happened
 */

int
t_uc51::check_events(void)
{
  int i;
  class cl_ev_brk *eb;

  if (!ebrk->count)
    return(resGO);
  for (i= 0; i < ebrk->count; i++)
    {
      eb= (class cl_ev_brk *)(ebrk->at(i));
      if (eb->match(&event_at))
	return(resBREAKPOINT);
    }
  return(resGO);
}


/*
 * Simulating an unknown instruction
 *
 * Normally this function is called for unimplemented instructions, because
 * every instruction must be known!
 */

int
t_uc51::inst_unknown(uchar code)
{
  PC--;
  if (1)//debug)// && sim->cmd_out())
    sim->app->get_commander()->
      debug("Unknown instruction %02x at %06x\n", code, PC);
  return(resHALT);
}


/*
 * 0x00 1 12 NOP
 */

int
t_uc51::inst_nop(uchar code)
{
  return(resGO);
}


/*
 * 0xe4 1 12 CLR A
 */

int
t_uc51::inst_clr_a(uchar code)
{
  ulong d= 0;

  sfr->write(ACC, &d);
  return(resGO);
}


/*
 * 0xc4 1 1 SWAP A
 */

int
t_uc51::inst_swap(uchar code)
{
  uchar temp;

  temp= (sfr->read(ACC) >> 4) & 0x0f;
  sfr->set(ACC, (sfr->get(ACC) << 4) | temp);
  return(resGO);
}


/* End of s51.src/uc51.cc */

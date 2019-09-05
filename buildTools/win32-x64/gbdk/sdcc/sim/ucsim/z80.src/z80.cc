/*
 * Simulator of microcontrollers (z80.cc)
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

// prj
#include "pobjcl.h"

// sim
#include "simcl.h"

// local
#include "z80cl.h"
#include "glob.h"
#include "regsz80.h"


/*
 * Base type of Z80 controllers
 */

cl_z80::cl_z80(class cl_sim *asim):
  cl_uc(asim)
{
  type= CPU_Z80;
}

int
cl_z80::init(void)
{
  cl_uc::init(); /* Memories now exist */
  ram= mem(MEM_XRAM);
  rom= mem(MEM_ROM);
  return(0);
}

char *
cl_z80::id_string(void)
{
  return("unspecified Z80");
}


/*
 * Making elements of the controller
 */

t_addr
cl_z80::get_mem_size(enum mem_class type)
{
  switch(type)
    {
    case MEM_ROM: return(0x10000);
    case MEM_XRAM: return(0x10000);
    default: return(0);
    }
 return(cl_uc::get_mem_size(type));
}

void
cl_z80::mk_hw_elements(void)
{
  //class cl_base *o;
  /* t_uc::mk_hw() does nothing */
}


/*
 * Help command interpreter
 */

struct dis_entry *
cl_z80::dis_tbl(void)
{
  return(disass_z80);
}

/*struct name_entry *
cl_z80::sfr_tbl(void)
{
  return(0);
}*/

/*struct name_entry *
cl_z80::bit_tbl(void)
{
  //FIXME
  return(0);
}*/

char *
cl_z80::disass(t_addr addr, char *sep)
{
  char work[256], temp[20];
  char *buf, *p, *b, *t;
  uint code, data= 0;
  int i;

  p= work;
  
  code= get_mem(MEM_ROM, addr);
  i= 0;
  while ((code & dis_tbl()[i].mask) != dis_tbl()[i].code &&
	 dis_tbl()[i].mnemonic)
    i++;
  if (dis_tbl()[i].mnemonic == NULL)
    {
      buf= (char*)malloc(30);
      strcpy(buf, "UNKNOWN/INVALID");
      return(buf);
    }
  b= dis_tbl()[i].mnemonic;

  while (*b)
    {
      if (*b == '%')
	{
	  b++;
	  switch (*(b++))
	    {
	    case 'd': // Rd   .... ...d dddd ....  0<=d<=31
	      if (!get_name(data= (code&0x01f0)>>4, sfr_tbl(), temp))
		sprintf(temp, "r%d", data);
	      break;
	    case 'D': // Rd   .... .... dddd ....  16<=d<=31
	      if (!get_name(data= 16+((code&0xf0)>>4), sfr_tbl(), temp))
		sprintf(temp, "r%d", data);
	      break;
	    case 'K': // K    .... KKKK .... KKKK  0<=K<=255
	      sprintf(temp, "%d", ((code&0xf00)>>4)|(code&0xf));
	      break;
	    case 'r': // Rr   .... ..r. .... rrrr  0<=r<=31
	      if (!get_name(data= ((code&0x0200)>>5)|(code&0x000f),
			    sfr_tbl(), temp))
		sprintf(temp, "r%d", data);
	      break;
	    case '2': // Rdl  .... .... ..dd ....  dl= {24,26,28,30}
	      if (!get_name(data= 24+(2*((code&0x0030)>>4)),
			    sfr_tbl(), temp))
		sprintf(temp, "r%d", data);
	      break;
	    case '6': // K    .... .... KK.. KKKK  0<=K<=63
	      sprintf(temp, "%d", ((code&0xc0)>>2)|(code&0xf));
	      break;
	    case 's': // s    .... .... .sss ....  0<=s<=7
	      sprintf(temp, "%d", (code&0x70)>>4);
	      break;
	    case 'b': // b    .... .... .... .bbb  0<=b<=7
	      sprintf(temp, "%d", code&0x7);
	      break;
	    case 'k': // k    .... ..kk kkkk k...  -64<=k<=+63
	      {
		int k= (code&0x3f8)>>3;
		if (code&0x200)
		  k|= -128;
		sprintf(temp, "0x%06x", k+1+(signed int)addr);
		break;
	      }
	    case 'A': // k    .... ...k kkkk ...k  0<=k<=64K
	              //      kkkk kkkk kkkk kkkk  0<=k<=4M
	      sprintf(temp, "0x%06x",
		      (((code&0x1f0)>>3)|(code&1))*0x10000+
		      (uint)get_mem(MEM_ROM, addr+1));
	      break;
	    case 'P': // P    .... .... pppp p...  0<=P<=31
	      data= (code&0xf8)>>3;
	      if (!get_name(data+0x20, sfr_tbl(), temp))
		sprintf(temp, "%d", data);
	      break;
	    case 'p': // P    .... .PP. .... PPPP  0<=P<=63
	      data= ((code&0x600)>>5)|(code&0xf);
	      if (!get_name(data+0x20, sfr_tbl(), temp))
		sprintf(temp, "%d", data);
	      break;
	    case 'q': // q    ..q. qq.. .... .qqq  0<=q<=63
	      sprintf(temp, "%d",
		      ((code&0x2000)>>8)|((code&0xc00)>>7)|(code&7));
	      break;
	    case 'R': // k    SRAM address on second word 0<=k<=65535
	      sprintf(temp, "0x%06x", (uint)get_mem(MEM_ROM, addr+1));
	      break;
	    case 'a': // k    .... kkkk kkkk kkkk  -2k<=k<=2k
	      {
		int k= code&0xfff;
		if (code&0x800)
		  k|= -4096;
		sprintf(temp, "0x%06lx",
			(k+1+(signed int)addr) % rom->size);
		break;
	      }
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
cl_z80::print_regs(class cl_console *con)
{
  con->printf("SZ-A--P-C  Flags= 0x%02x %3d %c  ",
	      regs.F, regs.F, isprint(regs.F)?regs.F:'.');
  con->printf("A= 0x%02x %3d %c\n",
	      regs.A, regs.A, isprint(regs.A)?regs.A:'.');
  con->printf("%c%c-%c--%c-%c\n",
	      (regs.F&BIT_S)?'1':'0',
	      (regs.F&BIT_Z)?'1':'0',
	      (regs.F&BIT_A)?'1':'0',
	      (regs.F&BIT_P)?'1':'0',
	      (regs.F&BIT_C)?'1':'0');
  con->printf("BC= 0x%04x [BC]= %02x %3d %c  ",
	      regs.BC, ram->get(regs.BC), ram->get(regs.BC),
	      isprint(ram->get(regs.BC))?ram->get(regs.BC):'.');
  con->printf("DE= 0x%04x [DE]= %02x %3d %c  ",
	      regs.DE, ram->get(regs.DE), ram->get(regs.DE),
	      isprint(ram->get(regs.DE))?ram->get(regs.DE):'.');
  con->printf("HL= 0x%04x [HL]= %02x %3d %c\n",
	      regs.HL, ram->get(regs.HL), ram->get(regs.HL),
	      isprint(ram->get(regs.HL))?ram->get(regs.HL):'.');
  con->printf("IX= 0x%04x [IX]= %02x %3d %c  ",
	      regs.IX, ram->get(regs.IX), ram->get(regs.IX),
	      isprint(ram->get(regs.IX))?ram->get(regs.IX):'.');
  con->printf("IY= 0x%04x [IY]= %02x %3d %c  ",
	      regs.IY, ram->get(regs.IY), ram->get(regs.IY),
	      isprint(ram->get(regs.IY))?ram->get(regs.IY):'.');
  con->printf("SP= 0x%04x [SP]= %02x %3d %c\n",
	      regs.SP, ram->get(regs.SP), ram->get(regs.SP),
	      isprint(ram->get(regs.SP))?ram->get(regs.SP):'.');
  
  print_disass(PC, con);
}


/*
 * Execution
 */

int
cl_z80::exec_inst(void)
{
  t_mem code;

  if (fetch(&code))
    return(resBREAKPOINT);
  tick(1);
  switch (code)
    {
    case 0x00:
      return(nop(code));
    }
  if (PC)
    PC--;
  else
    PC= get_mem_size(MEM_ROM)-1;
  //tick(-clock_per_cycle());
  sim->stop(resINV_INST);
  return(resINV_INST);
}


/* End of z80.src/z80.cc */

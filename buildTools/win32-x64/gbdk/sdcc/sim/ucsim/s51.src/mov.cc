/*
 * Simulator of microcontrollers (mov.cc)
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

/* Bugs fixed by Sandeep Dutta:
 *	source<->dest bug in "mov direct,direct"
 *	get register in "mov @ri,address"
 */
 
#include "ddconfig.h"

#include <stdio.h>

// sim
#include "memcl.h"

// local
#include "uc51cl.h"
#include "regs51.h"


/*
 * 0x74 2 12 MOV A,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_a_$data(uchar code)
{
  sfr->set(event_at.ws= ACC, fetch());
  return(resGO);
}


/*
 * 0x75 3 24 MOV addr,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_addr_$data(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);
  (*addr)= fetch();
  proc_write(addr);
  tick(1);
  return(resGO);
}


/*
 * 0x76-0x77 2 12 MOV @Ri,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_$ri_$data(uchar code)
{
  uchar *addr;
  int res;

  addr= get_indirect(event_at.wi= *(get_reg(code & 0x01)), &res);
  (*addr)= fetch();
  proc_write(addr);
  return(res);
}


/*
 * 0x78-0x7f 2 12 MOV Rn,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_rn_$data(uchar code)
{
  uchar *reg;

  reg= get_reg(code & 0x07, &event_at.wi);
  (*reg)= fetch();
  return(resGO);
}


/*
 * 0x93 1 24 MOVC A,@A+DPTR
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_movc_a_$a_pc(uchar code)
{
  //SFR[ACC]= EROM[event_at.rc= (PC + SFR[ACC]) & (EROM_SIZE - 1)];
  sfr->set(ACC,
	   mem(MEM_ROM)->get(event_at.rc=
			     (PC + sfr->get(ACC)))&(EROM_SIZE - 1));
  tick(1);
  return(resGO);
}


/*
 * 0x85 3 24 MOV addr,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_addr_addr(uchar code)
{
  uchar *d, *s;

  /* SD reversed s & d here */
  s= get_direct(fetch(), &event_at.ri, &event_at.rs);
  d= get_direct(fetch(), &event_at.wi, &event_at.ws);
  (*d)= read(s);
  proc_write(d);
  tick(1);
  return(resGO);
}


/*
 * 0x86-0x87 2 24 MOV addr,@Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_addr_$ri(uchar code)
{
  uchar *d, *s;
  int res;

  d= get_direct(fetch(), &event_at.wi, &event_at.ws);
  s= get_indirect(event_at.ri= *(get_reg(code & 0x01)), &res);
  *d= *s;
  proc_write(d);
  tick(1);
  return(res);
}


/*
 * 0x88-0x8f 2 24 MOV addr,Rn
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_addr_rn(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);
  (*addr)= *(get_reg(code & 0x07, &event_at.ri));
  proc_write(addr);
  tick(1);
  return(resGO);
}


/*
 * 0x90 3 24 MOV DPTR,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_dptr_$data(uchar code)
{
  sfr->set(event_at.ws= DPH, fetch());
  sfr->set(DPL, fetch());
  tick(1);
  return(resGO);
}


/*
 * 0x93 1 24 MOVC A,@A+DPTR
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_movc_a_$a_dptr(uchar code)
{
  //SFR[ACC]= EROM[event_at.rc= (SFR[DPH]*256+SFR[DPL]+SFR[ACC])&(EROM_SIZE-1)];
  sfr->set(ACC, get_mem(MEM_ROM, event_at.rc=
			(sfr->get(DPH)*256+sfr->get(DPL) +
			 sfr->get(ACC)) & (EROM_SIZE-1)));
  tick(1);
  return(resGO);
}


/*
 * 0xa6-0xa7 2 24 MOV @Ri,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_$ri_addr(uchar code)
{
  uchar *d, *s;
  int res;

  d= get_indirect(event_at.wi= *(get_reg(code & 0x01)), &res);
  s= get_direct(fetch(), &event_at.ri, &event_at.rs);
  (*d)= read(s);
  tick(1);
  return(res);
}


/*
 * 0xa8-0xaf 2 24 MOV Rn,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_rn_addr(uchar code)
{
  uchar *reg, *addr;

  reg = get_reg(code & 0x07, &event_at.wi);
  addr= get_direct(fetch(), &event_at.ri, &event_at.rs);
  (*reg)= read(addr);
  tick(1);
  return(resGO);
}


/*
 * 0xc0 2 24 PUSH addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_push(uchar code)
{
  uchar *addr, *sp;
  int res;

  addr= get_direct(fetch(), &event_at.ri, &event_at.rs);
  sfr->add(SP, 1);
  sp= get_indirect(sfr->get(SP), &res);
  if (res != resGO)
    res= resSTACK_OV;
  (*sp)= read(addr);
  tick(1);
  return(res);
}


/*
 * 0xc5 2 12 XCH A,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_xch_a_addr(uchar code)
{
  uchar temp, *addr;

  addr= get_direct(fetch(), &event_at.ri, &event_at.rs);
  temp= sfr->get(ACC);
  sfr->set(event_at.ws= ACC, read(addr));
  (*addr)= temp;
  proc_write(addr);
  return(resGO);
}


/*
 * 0xc6-0xc7 1 12 XCH A,@Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_xch_a_$ri(uchar code)
{
  uchar temp, *addr;
  int res;

  addr= get_indirect(event_at.ri= *(get_reg(code & 0x01)), &res);
  temp= sfr->get(ACC);
  sfr->set(event_at.ws= ACC, *addr);
  (*addr)= temp;
  return(res);
}


/*
 * 0xc8-0xcf 1 12 XCH A,Rn
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_xch_a_rn(uchar code)
{
  uchar temp, *reg;

  reg = get_reg(code & 0x07, &event_at.ri);
  temp= sfr->get(ACC);
  sfr->set(event_at.wi= ACC, *reg);
  (*reg)= temp;
  return(resGO);
}


/*
 * 0xd0 2 24 POP addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_pop(uchar code)
{
  uchar *addr, *sp;
  int res;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);
  sp= get_indirect(get_mem(MEM_SFR, SP), &res);
  if (res != resGO)
    res= resSTACK_OV;
  sfr->add(SP, -1);
  (*addr)= *sp;
  proc_write(addr);
  tick(1);
  return(res);
}


/*
 * 0xd6-0xd7 1 12 XCHD A,@Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_xchd_a_$ri(uchar code)
{
  uchar *addr, temp;
  int res;

  addr= get_indirect(event_at.ri= *(get_reg(code & 0x01)), &res);
  temp= *addr & 0x0f;
  (*addr) = (*addr & 0xf0) | (sfr->get(ACC) & 0x0f);
  sfr->set(event_at.ws= ACC, (sfr->get(ACC) & 0xf0) | temp);
  return(res);
}


/*
 * 0xe0 1 24 MOVX A,@DPTR
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_movx_a_$dptr(uchar code)
{
  sfr->set(event_at.ws= ACC,
	   get_mem(MEM_XRAM, event_at.rx=sfr->get(DPH)*256+sfr->get(DPL)));
  tick(1);
  return(resGO);
}


/*
 * 0xe2-0xe3 1 24 MOVX A,@Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_movx_a_$ri(uchar code)
{
  uchar *addr;

  addr= get_reg(code & 0x01);
  sfr->set(event_at.ws= ACC,
	   read_mem(MEM_XRAM,
		    event_at.rx= (sfr->get(P2)&port_pins[2])*256+*addr));
  tick(1);
  return(resGO);
}


/*
 * 0xe5 2 12 MOV A,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_a_addr(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.ri, &event_at.rs);
  sfr->set(event_at.ws= ACC, read(addr));
  return(resGO);
}


/*
 * 0xe6-0xe7 1 12 MOV A,@Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_a_$ri(uchar code)
{
  uchar *addr;
  int res;

  addr= get_indirect(event_at.ri= *(get_reg(code & 0x01)), &res);
  sfr->set(event_at.ws= ACC, *addr);
  return(res);
}


/*
 * 0xe8-0xef 1 12 MOV A,Rn
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_a_rn(uchar code)
{
  sfr->set(event_at.ws= ACC, *(get_reg(code & 0x07, &event_at.ri)));
  return(resGO);
}


/*
 * 0xf0 1 24 MOVX @DPTR,A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_movx_$dptr_a(uchar code)
{
  set_mem(MEM_XRAM, event_at.wx= sfr->get(DPH)*256+sfr->get(DPL),
	  sfr->get(event_at.rs= ACC));
  tick(1);
  return(resGO);
}


/*
 * 0xf2-0xf3 1 24 MOVX @Ri,A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_movx_$ri_a(uchar code)
{
  uchar *addr;

  addr= get_reg(code & 0x01);
  set_mem(MEM_XRAM,
	  event_at.wx= (sfr->get(P2) & port_pins[2])*256 + *addr,
	  sfr->get(ACC));
  tick(1);
  return(resGO);
}


/*
 * 0xf5 2 12 MOV addr,A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_addr_a(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);
  (*addr)= sfr->get(event_at.rs= ACC);
  proc_write(addr);
  return(resGO);
}


/*
 * 0xf6-0xf7 1 12 MOV @Ri,A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_$ri_a(uchar code)
{
  uchar *addr;
  int res;

  addr= get_indirect(event_at.wi= *(get_reg(code & 0x01)), &res);
  (*addr)= sfr->get(event_at.rs= ACC);
  return(res);
}


/*
 * 0xf8-0xff 1 12 MOV Rn,A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_rn_a(uchar code)
{
  uchar *reg;

  reg= get_reg(code &0x07, &event_at.wi);
  (*reg)= sfr->get(event_at.rs= ACC);
  return(resGO);
}


/* End of s51.src/mov.cc */

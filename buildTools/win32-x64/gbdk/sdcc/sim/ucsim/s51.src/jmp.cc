/*
 * Simulator of microcontrollers (jmp.cc)
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
 *	relative<->absolute jump in "jmp @a+dptr"
 */

#include "ddconfig.h"

#include <stdio.h>
#include <stdlib.h>

// local
#include "uc51cl.h"
#include "regs51.h"


/*
 * 0x[02468ace]1 2 24 AJMP addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_ajmp_addr(uchar code)
{
  uchar h, l;

  h= (code >> 5) & 0x07;
  l= fetch();
  tick(1);
  PC= (PC & 0xf800) | (h*256 + l);
  return(resGO);
}


/*
 * 0x10 3 12 JBC bit,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_jbc_bit_addr(uchar code)
{
  uchar bitaddr, *addr, jaddr;

  bitaddr= fetch();
  jaddr  = fetch();
  addr   = get_bit(bitaddr, &event_at.ri, &event_at.rs);
  if (*addr & BIT_MASK(bitaddr))
    {
      (*addr)&= ~BIT_MASK(bitaddr);
      PC= (PC + (signed char)jaddr) & (EROM_SIZE - 1);
    }
  tick(1);
  return(resGO);
}


/*
 * 0x02 3 24 LJMP addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_ljmp(uchar code)
{
  PC= fetch()*256 + fetch();
  tick(1);
  return(resGO);
}


/*
 * 0x[13579bdf]1 2 24 ACALL addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_acall_addr(uchar code)
{
  uchar h, l, *sp, *aof_SP;
  int res;

  h= (code >> 5) & 0x07;
  l= fetch();
  aof_SP= &((sfr->umem8)[SP]);
  //MEM(MEM_SFR)[SP]++;
  (*aof_SP)++;
  proc_write_sp(*aof_SP);
  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  (*sp)= PC & 0xff; // push low byte
  tick(1);

  //MEM(MEM_SFR)[SP]++;
  (*aof_SP)++;
  proc_write_sp(*aof_SP);
  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  (*sp)= (PC >> 8) & 0xff; // push high byte
  PC= (PC & 0xf800) | (h*256 + l);
  return(res);
}


/*
 * 0x12 3 24 LCALL addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_lcall(uchar code, uint addr)
{
  uchar h= 0, l= 0, *sp, *aof_SP;
  int res;

  if (!addr)
    {
      h= fetch();
      l= fetch();
    }
  aof_SP= &((sfr->umem8)[SP]);
  //MEM(MEM_SFR)[SP]++;
  (*aof_SP)++;
  proc_write_sp(*aof_SP);
  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  (*sp)= PC & 0xff; // push low byte
  if (!addr)
    tick(1);

  //MEM(MEM_SFR)[SP]++;
  (*aof_SP)++;
  proc_write_sp(*aof_SP);
  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  (*sp)= (PC >> 8) & 0xff; // push high byte
  if (addr)
    PC= addr;
  else
    PC= h*256 + l;
  return(res);
}


/*
 * 0x20 3 24 JB bit,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_jb_bit_addr(uchar code)
{
  uchar *addr, bitaddr, jaddr;

  addr= get_bit(bitaddr= fetch(), &event_at.ri, &event_at.rs);
  tick(1);
  jaddr= fetch();
  if (read(addr) & BIT_MASK(bitaddr))
    PC= (PC + (signed char)jaddr) & (EROM_SIZE-1);
  return(resGO);
}


/*
 * 0x22 1 24 RET
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_ret(uchar code)
{
  uchar h, l, *sp, *aof_SP;
  int res;

  aof_SP= &((sfr->umem8)[SP]);
  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  h= *sp;
  //MEM(MEM_SFR)[SP]--;
  (*aof_SP)--;
  proc_write_sp(*aof_SP);
  tick(1);

  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  l= *sp;
  //MEM(MEM_SFR)[SP]--;
  (*aof_SP)--;
  proc_write_sp(*aof_SP);
  PC= h*256 + l;
  return(res);
}


/*
 * 0x30 3 24 JNB bit,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_jnb_bit_addr(uchar code)
{
  uchar *addr, bitaddr, jaddr;

  addr= get_bit(bitaddr= fetch(), &event_at.ri, &event_at.rs);
  tick(1);
  jaddr= fetch();
  if (!(read(addr) & BIT_MASK(bitaddr)))
    PC= (PC + (signed char)jaddr) & (get_mem_size(MEM_ROM)-1);
  return(resGO);
}


/*
 * 0x32 1 24 RETI
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_reti(uchar code)
{
  uchar h, l, *sp, *aof_SP;
  int res;

  aof_SP= &((sfr->umem8)[SP]);
  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  h= *sp;
  //MEM(MEM_SFR)[SP]--;
  (*aof_SP)--;
  proc_write_sp(*aof_SP);
  tick(1);

  sp= get_indirect(*aof_SP/*sfr->get(SP)*/, &res);
  if (res != resGO)
    res= resSTACK_OV;
  l= *sp;
  //MEM(MEM_SFR)[SP]--;
  (*aof_SP)--;
  proc_write_sp(*aof_SP);
  PC= h*256 + l;

  was_reti= DD_TRUE;
  class it_level *il= (class it_level *)(it_levels->top());
  if (il &&
      il->level >= 0)
    {
      il= (class it_level *)(it_levels->pop());
      delete il;
    }
  return(res);
}


/*
 * 0x40 2 24 JC addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_jc_addr(uchar code)
{
  uchar jaddr;

  jaddr= fetch();
  tick(1);
  if (GET_C)
    PC= (PC + (signed char)jaddr) & (EROM_SIZE-1);
  event_at.rs= PSW;
  return(resGO);
}


/*
 * 0x50 2 24 JNC addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_jnc_addr(uchar code)
{
  uchar jaddr;

  jaddr= fetch();
  tick(1);
  if (!GET_C)
    PC= (PC + (signed char)jaddr) & (EROM_SIZE-1);
  event_at.rs= ACC;
  return(resGO);
}


/*
 * 0x60 2 24 JZ addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_jz_addr(uchar code)
{
  uchar jaddr;

  jaddr= fetch();
  tick(1);
  if (!sfr->get(ACC))
    PC= (PC + (signed char)jaddr) & (EROM_SIZE-1);
  return(resGO);
}


/*
 * 0x70 2 24 JNZ addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_jnz_addr(uchar code)
{
  uchar jaddr;

  jaddr= fetch();
  tick(1);
  if (sfr->get(ACC))
    PC= (PC + (signed char)jaddr) & (EROM_SIZE-1);
  return(resGO);
}


/*
 * 0x73 1 24 JMP @A+DPTR
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_jmp_$a_dptr(uchar code)
{
  PC= (sfr->get(DPH)*256 + sfr->get(DPL) +
       read_mem(MEM_SFR, ACC)) &
    (EROM_SIZE - 1);
  tick(1);
  return(resGO);
}


/*
 * 0x80 2 24 SJMP addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_sjmp(uchar code)
{
  signed char target= fetch();
  PC= (PC + target) & (EROM_SIZE -1);
  tick(1);
  return(resGO);
}


/*
 * 0xb4 3 24 CJNE A,#data,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_cjne_a_$data_addr(uchar code)
{
  uchar data, jaddr;

  data = fetch();
  jaddr= fetch();
  tick(1);
  SET_C(sfr->get(ACC) < data);
  if (read_mem(MEM_SFR, event_at.rs= ACC) != data)
    PC= (PC + (signed char)jaddr) & (EROM_SIZE - 1);
  return(resGO);
}


/*
 * 0xb5 3 24 CJNE A,addr,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_cjne_a_addr_addr(uchar code)
{
  uchar data, *addr, jaddr;

  addr = get_direct(fetch(), &event_at.ri, &event_at.rs);
  jaddr= fetch();
  tick(1);
  data= read(addr);
  SET_C(sfr->get(ACC) < data);
  if (sfr->get(event_at.rs= ACC) != data)
    PC= (PC + (signed char)jaddr) & (EROM_SIZE - 1);
  return(resGO);
}


/*
 * 0xb6-0xb7 3 24 CJNE @Ri,#data,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_cjne_$ri_$data_addr(uchar code)
{
  uchar *addr, data, jaddr;
  int res;

  addr = get_indirect(event_at.ri= *(get_reg(code & 0x01)), &res);
  data = fetch();
  jaddr= fetch();
  tick(1);
  SET_C(*addr < data);
  if (*addr != data)
    PC= (PC + (signed char)jaddr) & (EROM_SIZE - 1);
  return(res);
}


/*
 * 0xb8-0xbf 3 24 CJNE Rn,#data,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_cjne_rn_$data_addr(uchar code)
{
  uchar *reg, data, jaddr;

  reg  = get_reg(code & 0x07, &event_at.ri);
  data = fetch();
  jaddr= fetch();
  tick(1);
  SET_C(*reg < data);
  if (*reg != data)
    PC= (PC + (signed char)jaddr) & (EROM_SIZE - 1);
  return(resGO);
}


/*
 * 0xd5 3 24 DJNZ addr,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_djnz_addr_addr(uchar code)
{
  uchar *addr, jaddr;
  
  addr = get_direct(fetch(), &event_at.wi, &event_at.ws);
  jaddr= fetch();
  tick(1);
  if (--(*addr))
    PC= (PC + (signed char)jaddr) & (EROM_SIZE-1);
  return(resGO);
}


/*
 * 0xd8-0xdf 2 24 DJNZ Rn,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_djnz_rn_addr(uchar code)
{
  uchar *reg, jaddr;
  
  reg  = get_reg(code & 0x07, &event_at.wi);
  jaddr= fetch();
  tick(1);
  if (--(*reg))
    PC= (PC + (signed char)jaddr) & (EROM_SIZE-1);
  return(resGO);
}


/* End of s51.src/jmp.cc */

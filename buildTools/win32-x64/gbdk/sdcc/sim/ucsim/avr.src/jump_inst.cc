/*
 * Simulator of microcontrollers (jmp_inst.cc)
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

#include "avrcl.h"
#include "regsavr.h"


/*
 * Indirect Jump
 * IJMP
 * 1001 0100 XXXX 1001
 *____________________________________________________________________________
 */

int
cl_avr::ijmp(t_mem code)
{
  t_addr z;

  z= ram->get(ZH)*256 + ram->get(ZL);
  PC= ((PC & ~0xffff) | z) % rom->size;
  //FIXME: analyze
  return(resGO);
}


int
cl_avr::eijmp(t_mem code)
{
  return(resGO);
}


/*
 * Indirect Call to Subroutine
 * ICALL
 * 1001 0101 XXXX 1001
 *____________________________________________________________________________
 */

int
cl_avr::icall(t_mem code)
{
  t_mem zl, zh;
  t_addr z;
  
  push_addr(PC);
  zl= ram->read(ZL);
  zh= ram->read(ZH);
  z= zh*256 + zl;
  PC= (PC & ~0xffff) | (z & 0xffff);
  //FIXME: analyze
  tick(2);
  return(resGO);
}


int
cl_avr::eicall(t_mem code)
{
  return(resGO);
}


/*
 * Return from Subroutine
 * RET
 * 1001 0101 0XX0 1000
 *____________________________________________________________________________
 */

int
cl_avr::ret(t_mem code)
{
  t_addr a;

  pop_addr(&a);
  PC= a % rom->size;
  tick(3);
  return(resGO);
}


/*
 * Return from Interrupt
 * RETI
 * 1001 0101 0XX1 1000
 *____________________________________________________________________________
 */

int
cl_avr::reti(t_mem code)
{
  t_addr a;

  pop_addr(&a);
  PC= a % rom->size;
  t_mem sreg= ram->read(SREG);
  sreg|= BIT_I;
  ram->write(SREG, &sreg);
  tick(3);
  return(resGO);
}


/*
 * Relative Jump
 * RJMP k -2K<=k<=2K
 * 1100 kkkk kkkk kkkk
 *____________________________________________________________________________
 */

int
cl_avr::rjmp_k(t_mem code)
{
  long k= code & 0xfff, pc;

  if (k & 0x800)
    k|= -4096;
  pc= PC+k;
  if (pc < 0)
    pc= rom->size + pc;
  PC= pc % rom->size;
  tick(1);
  return(resGO);
}


/*
 * Relative Call to Subroutine
 * RCALL k
 * 1101 kkkk kkkk kkkk -1K<=k<=+1k
 *____________________________________________________________________________
 */

int
cl_avr::rcall_k(t_mem code)
{
  t_addr k;

  push_addr(PC);
  k= code & 0xfff;
  if (k & 0x800)
    k|= ~0xfff;
  PC= (signed)PC + (signed)k;
  PC= PC % rom->size;
  tick(2);

  return(resGO);
}


/*
 * Compare Skip if Equal
 * CPSE Rd,Rr 0<=d<=31, 0<=r<=31
 * 0001 00rd dddd rrrr
 *____________________________________________________________________________
 */

int
cl_avr::cpse_Rd_Rr(t_mem code)
{
  t_addr d, r;

  d= (code&0x1f0)>>4;
  r= ((code&0x200)>>5)|(code&0xf);
  if (ram->read(r) == ram->read(d))
    {
      t_mem next_code= rom->get(PC);
      int i= 0;
      struct dis_entry *dt= dis_tbl();
      while ((next_code & dt[i].mask) != dt[i].code &&
	     dt[i].mnemonic)
	i++;
      if (dt[i].mnemonic != NULL)
	{
	  PC= (PC + dt[i].length) % get_mem_size(MEM_ROM);
	  tick(1);
	}
      else
	return(resINV_INST);
    }
  return(resGO);
}


/*
 * Jump
 * JMP k 0<=k<=4M
 * 1001 010k kkkk 110k
 * kkkk kkkk kkkk kkkk
 *____________________________________________________________________________
 */

int
cl_avr::jmp_k(t_mem code)
{
  t_addr k;

  k= ((code&0x1f0)>>3)|(code&1);
  k= (k<<16)|fetch();
  PC= k % rom->size;
  tick(2);
  return(resGO);
}


/*
 * Long Call to a Subroutine
 * CALL k 0<=k<=64k/4M
 * 1001 010k kkkk 111k
 * kkkk kkkk kkkk kkkk
 *____________________________________________________________________________
 */

int
cl_avr::call_k(t_mem code)
{
  t_addr k;

  k= (((code&0x1f0)>>3)|(code&1))*0x10000;
  k= k + fetch();
  push_addr(PC);
  PC= k % rom->size;
  tick(3);
  return(resGO);
}


/*
 * Branch if Bit in SREG is Set
 * BRBS s,k 0<=s<=7, -64<=k<=+63
 * 1111 00kk kkkk ksss
 *____________________________________________________________________________
 */

int
cl_avr::brbs_s_k(t_mem code)
{
  int s, k;

  k= (code&0x3f8)>>3;
  s= code&7;
  t_mem sreg= ram->get(SREG);
  t_mem mask= 1<<s;
  if (sreg & mask)
    {
      if (code&0x200)
	k|= -128;
      PC= (PC+k) % rom->size;
      tick(1);
    }
  return(resGO);
}


/*
 * Branch if Bit in SREG is Cleared
 * BRBC s,k 0<=s<=7, -64<=k<=+63
 * 1111 01kk kkkk ksss
 *____________________________________________________________________________
 */

int
cl_avr::brbc_s_k(t_mem code)
{
  int s, k;

  k= (code&0x3f8)>>3;
  s= code&7;
  t_mem sreg= ram->get(SREG);
  t_mem mask= 1<<s;
  if (!(sreg & mask))
    {
      if (code&0x200)
	k|= -128;
      PC= (PC+k) % rom->size;
      tick(1);
    }
  return(resGO);
}


/*
 * Skip if Bit in Register is Cleared
 * SBRC Rr,b  0<=r<=31, 0<=b<=7
 * 1111 110r rrrr Xbbb
 *____________________________________________________________________________
 */

int
cl_avr::sbrc_Rr_b(t_mem code)
{
  t_addr r= (code&0x1f0)>>4;
  int b= code&7;
  t_mem mask= 1<<b;
  if (!(ram->read(r) & mask))
    {
      t_mem next_code= rom->get(PC);
      int i= 0;
      struct dis_entry *dt= dis_tbl();
      while ((next_code & dt[i].mask) != dt[i].code &&
	     dt[i].mnemonic)
	i++;
      if (dt[i].mnemonic != NULL)
	{
	  PC= (PC + dt[i].length) % rom->size;
	  tick(1);
	}
      else
	return(resINV_INST);
    }
  return(resGO);
}


/*
 * Skip if Bit in Register is Set
 * SBRS Rr,b  0<=r<=31, 0<=b<=7
 * 1111 111r rrrr Xbbb
 *____________________________________________________________________________
 */

int
cl_avr::sbrs_Rr_b(t_mem code)
{
  t_addr r= (code&0x1f0)>>4;
  int b= code&7;
  t_mem mask= 1<<b;
  if (ram->read(r) & mask)
    {
      t_mem next_code= rom->get(PC);
      int i= 0;
      struct dis_entry *dt= dis_tbl();
      while ((next_code & dt[i].mask) != dt[i].code &&
	     dt[i].mnemonic)
	i++;
      if (dt[i].mnemonic != NULL)
	{
	  PC= (PC + dt[i].length) % rom->size;
	  tick(1);
	}
      else
	return(resINV_INST);
    }
  return(resGO);
}


/*
 * Skip if Bit in I/O Register is Clear
 * SBIC P,b 0<=P<=31 0<=b<=7
 * 1001 1001 pppp pbbb
 *____________________________________________________________________________
 */

int
cl_avr::sbic_P_b(t_mem code)
{
  uint addr, mask;
  
  addr= ((code&0xf8)>>3)+0x20;
  mask= 1 << (code&7);
  if (0 == (mask & ram->read(addr)))
    {
      code= fetch();
      int size= inst_length(code);
      while (size > 1)
	{
	  fetch();
	  size--;
	}
      tick(1);
    }
  return(resGO);
}


/*
 * Skip if Bit in I/O Register is Set
 * SBIS P,b 0<=P<=31 0<=b<=7
 * 1001 1011 pppp pbbb
 *____________________________________________________________________________
 */

int
cl_avr::sbis_P_b(t_mem code)
{
  uint addr, mask;
  
  addr= ((code&0xf8)>>3)+0x20;
  mask= 1 << (code&7);
  if (mask & ram->read(addr))
    {
      code= fetch();
      int size= inst_length(code);
      while (size > 1)
	{
	  fetch();
	  size--;
	}
      tick(1);
    }
  return(resGO);
}


/* End of avr.src/jump_inst.cc */

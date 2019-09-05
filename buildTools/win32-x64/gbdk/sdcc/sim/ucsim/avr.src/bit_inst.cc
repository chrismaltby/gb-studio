/*
 * Simulator of microcontrollers (bit_inst.cc)
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

// local
#include "avrcl.h"
#include "regsavr.h"


/*
 * Set Carry Flag
 * SEC
 * 1001 0100 0000 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::sec(t_mem code)
{
  t_mem d= BIT_C | ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Set Negative Flag
 * SEN
 * 1001 0100 0010 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::sen(t_mem code)
{
  t_mem d= BIT_N | ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Set Zero Flag
 * SEZ
 * 1001 0100 0001 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::sez(t_mem code)
{
  t_mem d= BIT_Z | ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Set Global Interrupt Flag
 * SEI
 * 1001 0100 0111 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::sei(t_mem code)
{
  t_mem d= BIT_I | ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Set Signed Flag
 * SES
 * 1001 0100 0100 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::ses(t_mem code)
{
  t_mem d= BIT_S | ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Set Overflow Flag
 * SEV
 * 1001 0100 0011 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::sev(t_mem code)
{
  t_mem d= BIT_V | ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Set T Flag
 * SET
 * 1001 0100 0110 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::set(t_mem code)
{
  t_mem d= BIT_T | ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Set Half Carry Flag
 * SEH
 * 1001 0100 0101 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::seh(t_mem code)
{
  t_mem d= BIT_H | ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Clear Carry Flag
 * CLC
 * 1001 0100 1000 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::clc(t_mem code)
{
  t_mem d= ~BIT_C & ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Clear Negative Flag
 * CLN
 * 1001 0100 1010 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::cln(t_mem code)
{
  t_mem d= ~BIT_N & ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Clear Zero Flag
 * CLZ
 * 1001 0100 1001 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::clz(t_mem code)
{
  t_mem d= ~BIT_Z & ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Global Interrupt Flag
 * CLI
 * 1001 0100 1111 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::cli(t_mem code)
{
  t_mem d= ~BIT_I & ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Clear Signed Flag
 * CLS
 * 1001 0100 1100 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::cls(t_mem code)
{
  t_mem d= ~BIT_S & ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Clear Overflow Flag
 * CLV
 * 1001 0100 1011 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::clv(t_mem code)
{
  t_mem d= ~BIT_V & ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Clear T Flag
 * CLT
 * 1001 0100 1110 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::clt(t_mem code)
{
  t_mem d= ~BIT_T & ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Clear Half Carry Flag
 * CLH
 * 1001 0100 1101 1000
 *----------------------------------------------------------------------------
 */

int
cl_avr::clh(t_mem code)
{
  t_mem d= ~BIT_H & ram->read(SREG);
  ram->write(SREG, &d);
  return(resGO);
}


/*
 * Clear Bit in I/O Register
 * CBI P,b 0<=P<=31 0<=b<=7
 * 1001 1000 pppp pbbb
 *____________________________________________________________________________
 */

int
cl_avr::cbi_A_b(t_mem code)
{
  uint addr, mask;
  t_mem d;

  addr= ((code&0xf8)>>3)+0x20;
  mask= 1 << (code&7);
  d= ~mask & ram->read(addr);
  ram->write(addr, &d);
  tick(1);
  return(resGO);
}


/*
 * Set Bit in I/O Register
 * SBI P,b 0<=P<=31 0<=b<=7
 * 1001 1010 pppp pbbb
 *____________________________________________________________________________
 */

int
cl_avr::sbi_A_b(t_mem code)
{
  uint addr, mask;
  
  addr= ((code&0xf8)>>3)+0x20;
  mask= 1 << (code&7);
  t_mem d= mask | ram->read(addr);
  ram->write(addr, &d);
  tick(1);
  return(resGO);
}


/*
 * Bit Load from the T Flag in SREG to a Bit in Register
 * BLD Rd,b 0<=d<=31, 0<=b<=7
 * 1111 100d dddd 0bbb
 *____________________________________________________________________________
 */

int
cl_avr::bld_Rd_b(t_mem code)
{
  t_addr d;
  int b, mask;
  t_mem data;

  d= (code&0x1f0)>>4;
  b= code&7;
  mask= 1<<b;
  if (ram->read(SREG) & BIT_T)
    data= ram->read(d) | mask;
  else
    data= ram->read(d) & ~mask;
  ram->write(d, &data);
  return(resGO);
}


/*
 * Bit Store from Bit in Register to T Flag in SREG
 * BST Rd,b 0<=d<=31, 0<=b<=7
 * 1111 101d dddd Xbbb
 *____________________________________________________________________________
 */

int
cl_avr::bst_Rd_b(t_mem code)
{
  t_addr d;
  int b, mask;

  d= (code&0x1f0)>>4;
  b= code&7;
  mask= 1<<b;
  t_mem data= ram->read(d);
  if (data & mask)
    ram->set_bit1(SREG, BIT_T);
  else
    ram->set_bit0(SREG, BIT_T);
  return(resGO);
}


/* End of avr.src/bit_inst.cc */

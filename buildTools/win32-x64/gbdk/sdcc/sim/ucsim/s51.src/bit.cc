/*
 * Simulator of microcontrollers (bit.cc)
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

// local
#include "uc51cl.h"
#include "regs51.h"


/*
 * 0x72 2 24 ORL C,bit
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_orl_c_bit(uchar code)
{
  uchar *addr, bitaddr;

  addr= get_bit(bitaddr= fetch(), &event_at.ri, &event_at.rs);
  SET_C(GET_C ||
	(read(addr) & BIT_MASK(bitaddr)));
  event_at.ws= PSW;
  tick(1);
  return(resGO);
}


/*
 * 0x82 2 24 ANL C,bit
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_anl_c_bit(uchar code)
{
  uchar *addr, bitaddr;

  addr= get_bit(bitaddr= fetch(), &event_at.ri, &event_at.rs);
  SET_C(GET_C &&
	(read(addr) & BIT_MASK(bitaddr)));
  event_at.ws= PSW;
  tick(1);
  return(resGO);
}


/*
 * 0x92 2 24 MOV bit,C
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_bit_c(uchar code)
{
  uchar *addr, bitaddr;

  addr= get_bit(bitaddr= fetch(), &event_at.wi, &event_at.ws);
  if (GET_C)
    (*addr)|= BIT_MASK(bitaddr);
  else
    (*addr)&= ~BIT_MASK(bitaddr);
  event_at.rs= PSW;
  proc_write(addr);
  tick(1);
  return(resGO);
}


/*
 * 0xa2 2 12 MOV C,bit
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mov_c_bit(uchar code)
{
  uchar *addr, bitaddr;

  addr= get_bit(bitaddr= fetch(), &event_at.ri, &event_at.rs);
  SET_C(read(addr) & BIT_MASK(bitaddr));
  event_at.ws= PSW;
  return(resGO);
}


/*
 * 0xb0 2 24 ANL C,/bit
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_anl_c_$bit(uchar code)
{
  uchar *addr, bitaddr;

  addr= get_bit(bitaddr= fetch(), &event_at.ri, &event_at.rs);
  SET_C(GET_C &&
	!(read(addr) & BIT_MASK(bitaddr)));
  event_at.ws= PSW;
  tick(1);
  return(resGO);
}


/*
 * 0xb2 2 12 CPL bit
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_cpl_bit(uchar code)
{
  uchar *addr, bitaddr;

  addr= get_bit(bitaddr= fetch(), &event_at.wi, &event_at.ws);
  (*addr)^= BIT_MASK(bitaddr);
  proc_write(addr);
  return(resGO);
}


/*
 * 0xb3 1 12 CPL C
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_cpl_c(uchar code)
{
  sfr->set(PSW, sfr->get(PSW) ^ bmCY);
  event_at.ws= PSW;
  return(resGO);
}


/*
 * 0xc2 2 12 CLR bit
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_clr_bit(uchar code)
{
  uchar *addr, bitaddr;

  addr= get_bit(bitaddr= fetch(), &event_at.wi, &event_at.ws);
  (*addr)&= ~BIT_MASK(bitaddr);
  proc_write(addr);
  return(resGO);
}


/*
 * 0xc3 1 12 CLR C
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_clr_c(uchar code)
{
  sfr->set(PSW, sfr->get(PSW) & ~bmCY);
  event_at.ws= PSW;
  return(resGO);
}


/*
 * 0xd2 2 12 SETB bit
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_setb_bit(uchar code)
{
  uchar *addr, bitaddr;

  addr= get_bit(bitaddr= fetch(), &event_at.wi, &event_at.ws);
  (*addr)|= BIT_MASK(bitaddr);
  proc_write(addr);
  return(resGO);
}


/*
 * 0xd3 1 12 SETB C
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_setb_c(uchar code)
{
  sfr->set(PSW, sfr->get(PSW) | bmCY);
  event_at.ws= PSW;
  return(resGO);
}


/* End of s51.src/bit.cc */

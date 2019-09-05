/*
 * Simulator of microcontrollers (logic.cc)
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

// prj
#include "stypes.h"

// local
#include "uc51cl.h"
#include "regs51.h"


/*
 * 0x42 2 12 ORL addr,A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_orl_addr_a(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);
  (*addr)|= sfr->get(event_at.rs= ACC);
  proc_write(addr);
  return(resGO);
}


/*
 * 0x43 3 24 ORL addr,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_orl_addr_$data(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);
  (*addr)|= fetch();
  proc_write(addr);
  tick(1);
  return(resGO);
}


/*
 * 0x44 2 12 ORL A,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_orl_a_$data(uchar code)
{
  uchar d;

  d= sfr->get(event_at.ws= ACC);
  sfr->set(ACC, d|= fetch());
  return(resGO);
}


/*
 * 0x45 2 12 ORL A,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_orl_a_addr(uchar code)
{
  uchar *addr, d;

  addr= get_direct(fetch(), &event_at.ri, &event_at.rs);
  d= sfr->get(event_at.ws= ACC);
  sfr->set(ACC, d|= read(addr));
  return(resGO);
}


/*
 * 0x46-0x47 1 12 ORL A,@Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_orl_a_$ri(uchar code)
{
  uchar *addr, d;
  int res;

  addr= get_indirect(event_at.ri= *(get_reg(code & 0x01)), &res);
  d= sfr->get(event_at.ws= ACC);
  sfr->set(ACC, d|= *addr);
  return(res);
}


/*
 * 0x48-0x4f 1 12 ORL A,Rn
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_orl_a_rn(uchar code)
{
  uchar d;

  d= sfr->get(event_at.ws= ACC);
  sfr->set(ACC, d|= *(get_reg(code & 0x07, &event_at.ri)));
  return(resGO);
}


/*
 * 0x52 2 12 ANL addr,A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_anl_addr_a(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);
  (*addr)&= sfr->get(event_at.rs= ACC);
  proc_write(addr);
  return(resGO);
}


/*
 * 0x53 3 24 ANL addr,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_anl_addr_$data(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);
  (*addr)&= fetch();
  proc_write(addr);
  tick(1);
  return(resGO);
}


/*
 * 0x54 2 12 ANL A,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_anl_a_$data(uchar code)
{
  uchar d;

  d= sfr->get(event_at.ws= ACC);
  sfr->set(ACC, d&= fetch());
  return(resGO);
}


/*
 * 0x55 2 12 ANL A,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_anl_a_addr(uchar code)
{
  uchar *addr, d;

  addr= get_direct(fetch(), &event_at.ri, &event_at.rs);
  d= sfr->get(event_at.ws= ACC);
  sfr->set(ACC, d&= read(addr));
  return(resGO);
}


/*
 * 0x56-0x57 1 12 ANL A,@Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_anl_a_$ri(uchar code)
{
  uchar *addr, d;
  int res;

  addr= get_indirect(event_at.ri= *(get_reg(code & 0x01)), &res);
  d= sfr->get(event_at.ws= ACC);
  sfr->set(ACC, d&= *addr);
  return(res);
}


/*
 * 0x58-0x5f 1 12 ANL A,Rn
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_anl_a_rn(uchar code)
{
  uchar d;

  d= sfr->get(event_at.ws= ACC);
  sfr->set(ACC, d&= *(get_reg(code & 0x07, &event_at.ri)));
  return(resGO);
}


/*
 * 0x62 2 12 XRL addr,A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_xrl_addr_a(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);
  (*addr)^= sfr->get(event_at.rs= ACC);
  proc_write(addr);
  return(resGO);
}


/*
 * 0x63 3 24 XRL addr,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_xrl_addr_$data(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);
  (*addr)^= fetch();
  proc_write(addr);
  tick(1);
  return(resGO);
}


/*
 * 0x64 2 12 XRL A,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_xrl_a_$data(uchar code)
{
  uchar d;

  d= sfr->get(event_at.ws= ACC);
  sfr->set(ACC, d^= fetch());
  return(resGO);
}


/*
 * 0x65 2 12 XRL A,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_xrl_a_addr(uchar code)
{
  uchar d;

  d= sfr->get(event_at.ws= ACC);
  sfr->set(ACC, d^= read(get_direct(fetch(),
				    &event_at.ri,
				    &event_at.ri)));
  return(resGO);
}


/*
 * 0x66-0x67 1 12 XRL A,@Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_xrl_a_$ri(uchar code)
{
  uchar *addr, d;
  int res;

  addr= get_indirect(event_at.ri= *(get_reg(code & 0x01)), &res);
  d= sfr->get(event_at.ws= ACC);
  sfr->set(ACC, d^= *addr);
  return(res);
}


/*
 * 0x68-0x6f 1 12 XRL A,Rn
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_xrl_a_rn(uchar code)
{
  uchar d;

  d= sfr->get(event_at.ws= ACC);
  sfr->set(ACC, d^= *(get_reg(code & 0x07, &event_at.ri)));
  return(resGO);
}


/*
 * 0xf4 1 12 CPL A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_cpl_a(uchar code)
{
  sfr->set(event_at.ws= ACC, ~(sfr->get(ACC)));
  return(resGO);
}


/* End of s51.src/logic.cc */

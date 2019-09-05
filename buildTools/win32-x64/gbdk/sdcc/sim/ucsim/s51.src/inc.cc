/*
 * Simulator of microcontrollers (inc.cc)
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
 * 0x04 1 12 INC A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_inc_a(uchar code)
{
  sfr->set(event_at.ws= ACC, sfr->get(ACC)+1);
  return(resGO);
}


/*
 * 0x05 2 12 INC addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_inc_addr(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);
  (*addr)++;
  proc_write(addr);
  return(resGO);
}


/*
 * 0x06-0x07 1 12 INC @Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_inc_$ri(uchar code)
{
  uchar *addr;
  int res;

  addr= get_indirect(event_at.wi= *(get_reg(code & 0x01)), &res);
  (*addr)++;
  proc_write(addr);
  return(res);
}


/*
 * 0x08-0x0f 1 12 INC Rn
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_inc_rn(uchar code)
{
  (*(get_reg(code & 0x07, &event_at.wi)))++;
  return(resGO);
}


/*
 * 0x14 1 12 DEC A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_dec_a(uchar code)
{
  sfr->set(event_at.ws= ACC, sfr->get(ACC)-1);
  return(resGO);
}


/*
 * 0x15 2 12 DEC addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_dec_addr(uchar code)
{
  uchar *addr;

  addr= get_direct(fetch(), &event_at.wi, &event_at.ws);
  (*addr)--;
  proc_write(addr);
  return(resGO);
}


/*
 * 0x16-0x17 1 12 DEC @Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_dec_$ri(uchar code)
{
  uchar *addr;
  int res;

  addr= get_indirect(event_at.wi= *(get_reg(code & 0x01)), &res);
  (*addr)--;
  proc_write(addr);
  return(res);
}


/*
 * 0x18-0x1f 1 12 DEC Rn
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_dec_rn(uchar code)
{
  (*(get_reg(code & 0x07, &event_at.wi)))--;
  return(resGO);
}


/*
 * 0xa3 1 24 INC DPTR
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_inc_dptr(uchar code)
{
  uint dptr;

  dptr= sfr->get(DPH)*256 + sfr->get(DPL) + 1;
  sfr->set(event_at.ws= DPH, (dptr >> 8) & 0xff);
  sfr->set(DPL, dptr & 0xff);
  tick(1);
  return(resGO);
}


/* End of s51.src/inc.cc */

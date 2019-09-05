/*
 * Simulator of microcontrollers (logic_inst.cc)
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
 * Logical OR with Immediate
 * ORI Rd,K 16<=d<=31 0<=K<=255
 * 0110 KKKK dddd KKKK
 *____________________________________________________________________________
 */

int
cl_avr::ori_Rd_K(t_mem code)
{
  t_addr d;
  t_mem K, data;

  d= (code&0xf0)>>4;
  K= ((code&0xf00)>>4)|(code&0xf);
  data= K | ram->read(d);
  ram->write(d+16, &data);
  set_zn0s(data);
  return(resGO);
}


/*
 * Logical AND with Immediate
 * ANDI Rd,K 16<=d<=31 0<=K<=255
 * 0111 KKKK dddd KKKK
 *____________________________________________________________________________
 */

int
cl_avr::andi_Rd_K(t_mem code)
{
  t_addr d;
  t_mem K, data;

  d= (code&0xf0)>>4;
  K= ((code&0xf00)>>4)|(code&0xf);
  data= K & ram->read(d);
  ram->write(d+16, &data);
  set_zn0s(data);
  return(resGO);
}


/*
 * Logical AND
 * AND Rd,Rr 0<=d<=31 0<=r<=31
 * 0010 00rd dddd rrrr
 *____________________________________________________________________________
 */

int
cl_avr::and_Rd_Rr(t_mem code)
{
  t_addr d, r;
  t_mem data;

  d= (code&0x1f0)>>4;
  r= ((code&0x200)>>5)|(code&0xf);
  data= ram->read(d) & ram->read(r);
  ram->write(d, &data);
  set_zn0s(data);
  return(resGO);
}


/*
 * Exclusive OR
 * EOR Rd,Rr 0<=d<=31 0<=r<=31
 * 0010 01rd dddd rrrr
 *____________________________________________________________________________
 */

int
cl_avr::eor_Rd_Rr(t_mem code)
{
  t_addr d, r;
  t_mem data;

  d= (code&0x1f0)>>4;
  r= ((code&0x200)>>5)|(code&0xf);
  data= ram->read(d) ^ ram->read(r);
  ram->write(d, &data);
  set_zn0s(data);
  return(resGO);
}


/*
 * Logical OR
 * OR Rd,Rr 0<=d<=31 0<=r<=31
 * 0010 10rd dddd rrrr
 *____________________________________________________________________________
 */

int
cl_avr::or_Rd_Rr(t_mem code)
{
  t_addr d, r;
  t_mem data;

  d= (code&0x1f0)>>4;
  r= ((code&0x200)>>5)|(code&0xf);
  data= ram->read(d) | ram->read(r);
  ram->write(d, &data);
  set_zn0s(data);
  return(resGO);
}


/* End of avr.src/logic_inst.cc */

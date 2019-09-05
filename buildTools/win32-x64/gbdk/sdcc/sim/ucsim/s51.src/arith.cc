/*
 * Simulator of microcontrollers (arith.cc)
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

// local
#include "uc51cl.h"
#include "regs51.h"


/*
 * 0x03 1 12 RR A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_rr(uchar code)
{
  uchar acc;

  acc= sfr->read(event_at.ws= event_at.rs= ACC); 
  if (acc & 0x01)
    sfr->set(ACC, (acc >> 1) | 0x80);
  else
    sfr->set(ACC, acc >> 1);
  return(resGO);
}


/*
 * 0x13 1 12 RRC A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_rrc(uchar code)
{
  bool cy;
  uchar acc;

  cy= SFR_GET_C;
  SET_C((acc= sfr->read(ACC)) & 0x01);
  event_at.ws= event_at.rs= ACC;
  acc>>= 1;
  if (cy)
    acc|= 0x80;
  sfr->set(ACC, acc);
  return(resGO);
}


/*
 * 0x23 1 12 RL A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_rl(uchar code)
{
  uchar acc;

  acc= sfr->read(event_at.ws= event_at.rs= ACC);
  if (acc & 0x80)
    sfr->set(ACC, (acc << 1 ) | 0x01);
  else
    sfr->set(ACC, acc << 1);
  return(resGO);
}


/*
 * 0x24 2 12 ADD A,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_add_a_$data(uchar code)
{
  uchar data, acc;
  bool newC, newA, c6;

  data= fetch();
  acc = sfr->get(ACC);
  newC= (((uint)acc+(uint)(data)) > 255)?0x80:0;
  newA= ((acc&0x0f)+(data&0x0f)) & 0xf0;
  c6  = ((acc&0x7f)+(data&0x7f)) & 0x80;
  event_at.ws= ACC;
  sfr->set(ACC, acc+data);
  SET_C(newC);
  SET_BIT(newC ^ c6, PSW, bmOV);
  SET_BIT(newA, PSW, bmAC);
  return(resGO);
}


/*
 * 0x25 2 12 ADD A,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_add_a_addr(uchar code)
{
  uchar data, acc;
  bool newC, newA, c6;

  data= read(get_direct(fetch(), &event_at.ri, &event_at.rs));
  acc = sfr->get(ACC);
  newC= (((uint)acc+(uint)(data)) > 255)?0x80:0;
  newA= ((acc&0x0f)+(data&0x0f)) & 0xf0;
  c6  = ((acc&0x7f)+(data&0x7f)) & 0x80;
  event_at.ws= ACC;
  sfr->set(ACC, acc+data);
  SET_C(newC);
  SET_BIT(newC ^ c6, PSW, bmOV);
  SET_BIT(newA, PSW, bmAC);
  return(resGO);
}


/*
 * 0x26-0x27 1 12 ADD A,@Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_add_a_$ri(uchar code)
{
  uchar data, *addr, acc;
  bool newC, newA, c6;
  int res;

  addr= get_indirect(event_at.ri= *(get_reg(code & 0x01)), &res);
  acc = sfr->get(ACC);
  data= *addr;
  newC= (((uint)acc+(uint)data) > 255)?0x80:0;
  newA= ((acc&0x0f)+(data&0x0f)) & 0xf0;
  c6  = ((acc&0x7f)+(data&0x7f)) & 0x80;
  event_at.ws= ACC;
  sfr->set(ACC, acc+data);
  SET_C(newC);
  SET_BIT(newC ^ c6, PSW, bmOV);
  SET_BIT(newA, PSW, bmAC);
  return(res);
}


/*
 * 0x28-0x2f 1 12 ADD A,Rn
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_add_a_rn(uchar code)
{
  uchar data, acc;
  bool newC, newA, c6;

  data= *(get_reg(code & 0x07, &event_at.ri));
  acc = sfr->get(ACC);
  newC= (((uint)acc+(uint)data) > 255)?0x80:0;
  newA= ((acc&0x0f)+(data&0x0f)) & 0xf0;
  c6  = ((acc&0x7f)+(data&0x7f)) & 0x80;
  event_at.ws= ACC;
  sfr->set(ACC, acc+data);
  SET_C(newC);
  SET_BIT(newC ^ c6, PSW, bmOV);
  SET_BIT(newA, PSW, bmAC);
  return(resGO);
}


/*
 * 0x33 1 12 RLC A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_rlc(uchar code)
{
  bool cy;
  uchar acc;

  cy= SFR_GET_C;
  SET_C((acc= sfr->get(event_at.rs= ACC)) & 0x80);
  acc<<= 1;
  if (cy)
    acc|= 0x01;
  sfr->set(event_at.ws= ACC, acc);
  return(resGO);
}


/*
 * 0x34 2 12 ADDC A,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_addc_a_$data(uchar code)
{
  uchar data, acc;
  bool orgC, newC, newA, c6;

  data= fetch();
  acc = sfr->get(ACC);
  newC= (((uint)acc+(uint)data+((orgC= SFR_GET_C)?1:0)) > 255)?0x80:0;
  newA= ((acc&0x0f)+(data&0x0f)+(orgC?1:0)) & 0xf0;
  c6  = ((acc&0x7f)+(data&0x7f)+(orgC?1:0)) & 0x80;
  sfr->set(event_at.ws= ACC, acc + data + (orgC?1:0));
  SET_C(newC);
  SET_BIT(newC ^ c6, PSW, bmOV);
  SET_BIT(newA, PSW, bmAC);
  return(resGO);
}


/*
 * 0x35 2 12 ADDC A,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_addc_a_addr(uchar code)
{
  uchar data, acc;
  bool orgC, newC, newA, c6;

  data= read(get_direct(fetch(), &event_at.ri, &event_at.rs));
  acc = sfr->get(ACC);
  newC= (((uint)acc+(uint)data+((orgC= SFR_GET_C)?1:0)) > 255)?0x80:0;
  newA= ((acc&0x0f)+(data&0x0f)+(orgC?1:0)) & 0xf0;
  c6  = ((acc&0x7f)+(data&0x7f)+(orgC?1:0)) & 0x80;
  sfr->set(event_at.ws= ACC, acc + data + (orgC?1:0));
  SET_C(newC);
  SET_BIT(newC ^ c6, PSW, bmOV);
  SET_BIT(newA, PSW, bmAC);
  return(resGO);
}


/*
 * 0x36-0x37 1 12 ADDC A,@Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_addc_a_$ri(uchar code)
{
  uchar data, *addr, acc;
  bool orgC, newC, newA, c6;
  int res;

  addr= get_indirect(event_at.ri= *(get_reg(code & 0x01)), &res);
  acc = sfr->get(ACC);
  data= *addr;
  newC= (((uint)acc+(uint)data+((orgC= SFR_GET_C)?1:0)) > 255)?0x80:0;
  newA= ((acc&0x0f)+(data&0x0f)+(orgC?1:0)) & 0xf0;
  c6  = ((acc&0x7f)+(data&0x7f)+(orgC?1:0)) & 0x80;
  sfr->set(event_at.ws= ACC, acc + data + (orgC?1:0));
  SET_C(newC);
  SET_BIT(newC ^ c6, PSW, bmOV);
  SET_BIT(newA, PSW, bmAC);
  return(res);
}


/*
 * 0x38-0x3f 1 12 ADDC A,Rn
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_addc_a_rn(uchar code)
{
  uchar data, acc;
  bool orgC, newC, newA, c6;

  data= *(get_reg(code & 0x07, &event_at.ri));
  acc = sfr->get(ACC);
  newC= (((uint)acc+(uint)data+((orgC= SFR_GET_C)?1:0)) > 255)?0x80:0;
  newA= ((acc&0x0f)+(data&0x0f)+(orgC?1:0)) & 0xf0;
  c6  = ((acc&0x7f)+(data&0x7f)+(orgC?1:0)) & 0x80;
  sfr->set(event_at.ws= ACC, acc + data + (orgC?1:0));
  SET_C(newC);
  SET_BIT(newC ^ c6, PSW, bmOV);
  SET_BIT(newA, PSW, bmAC);
  return(resGO);
}


/*
 * 0x84 1 48 DIV AB
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_div_ab(uchar code)
{
  uchar temp, psw, b, acc;

  psw= sfr->get(PSW);
  psw&= ~bmCY;
  if (!(b= sfr->get(event_at.rs= B)))
    psw|= bmOV;
  else
    {
      psw&= ~bmOV;
      temp= (acc= sfr->get(ACC)) / b;
      sfr->set(B, acc % b);
      sfr->set(event_at.ws= ACC, temp);
    }
  sfr->set(PSW, psw);
  tick(3);
  return(resGO);
}


/*
 * 0x94 2 12 SUBB A,#data
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_subb_a_$data(uchar code)
{
  uchar data, acc, result, psw, c;

  data= fetch();
  acc = sfr->get(ACC);
  result= acc-data;
  psw= sfr->get(PSW);
  if ((c= (psw & bmCY)?1:0))
    result--;
  sfr->set(event_at.ws= ACC, result);
  sfr->set(PSW,
	   (psw & ~(bmCY|bmOV|bmAC)) |
	   (((unsigned int)acc < (unsigned int)(data+c))?bmCY:0) |
	   (((acc<0x80 && data>0x7f && result>0x7f) ||
	     (acc>0x7f && data<0x80 && result<0x80))?bmOV:0) |
	   (((acc&0x0f) < ((data+c)&0x0f) ||
	     (c && ((data&0x0f)==0x0f)))?bmAC:0));
  return(resGO);
}


/*
 * 0x95 2 12 SUBB A,addr
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_subb_a_addr(uchar code)
{
  uchar *addr, data, acc, result, psw,c ;

  addr= get_direct(fetch(), &event_at.ri, &event_at.rs);
  acc = sfr->get(ACC);
  data= read(addr);
  result= acc-data;
  psw= sfr->get(PSW);
  if ((c= (psw & bmCY)?1:0))
    result--;
  sfr->set(event_at.ws= ACC, result);
  sfr->set(PSW,
	   (psw & ~(bmCY|bmOV|bmAC)) |
	   (((unsigned int)acc < (unsigned int)(data+c))?bmCY:0) |
	   (((acc<0x80 && data>0x7f && result>0x7f) ||
	     (acc>0x7f && data<0x80 && result<0x80))?bmOV:0) |
	   (((acc&0x0f) < ((data+c)&0x0f) ||
	     (c && ((data&0x0f)==0x0f)))?bmAC:0));
  return(resGO);
}


/*
 * 0x96-0x97 1 12 SUBB A,@Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_subb_a_$ri(uchar code)
{
  uchar data, acc, result, psw, c;
  int res;

  data= *(get_indirect(event_at.ri= *(get_reg(code & 0x01)), &res));
  acc = sfr->get(ACC);
  result= acc-data;
  psw= sfr->get(PSW);
  if ((c= (psw & bmCY)?1:0))
    result--;
  sfr->set(event_at.ws= ACC, result);
  sfr->set(PSW,
	   (psw & ~(bmCY|bmOV|bmAC)) |
	   (((unsigned int)acc < (unsigned int)(data+c))?bmCY:0) |
	   (((acc<0x80 && data>0x7f && result>0x7f) ||
	     (acc>0x7f && data<0x80 && result<0x80))?bmOV:0) |
	   (((acc&0x0f) < ((data+c)&0x0f) ||
	     (c && ((data&0x0f)==0x0f)))?bmAC:0));
  return(res);
}


/*
 * 0x98-0x9f 1 12 SUBB A,Rn
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_subb_a_rn(uchar code)
{
  uchar data, acc, result, psw, c;

  data= *(get_reg(code & 0x07, &event_at.ri));
  acc = sfr->get(ACC);
  result= acc-data;
  psw= sfr->get(PSW);
  if ((c= (psw & bmCY)?1:0))
    result--;
  sfr->set(event_at.ws= ACC, result);
  sfr->set(PSW,
	   (psw & ~(bmCY|bmOV|bmAC)) |
	   (((unsigned int)acc < (unsigned int)(data+c))?bmCY:0) |
	   (((acc<0x80 && data>0x7f && result>0x7f) ||
	     (acc>0x7f && data<0x80 && result<0x80))?bmOV:0) |
	   (((acc&0x0f) < ((data+c)&0x0f) ||
	     (c && ((data&0x0f)==0x0f)))?bmAC:0));
  return(resGO);
}


/*
 * 0xa4 1 48 MUL AB
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_mul_ab(uchar code)
{
  uint temp, psw, acc, b;

  psw= sfr->get(PSW);
  psw&= ~bmCY;
  temp= (acc= sfr->get(ACC)) * (b= sfr->get(B));
  sfr->set(event_at.ws= ACC, temp & 0xff);
  sfr->set(event_at.rs= B, (temp >> 8) & 0xff);
  SET_BIT(sfr->get(B), PSW, bmOV);
  SET_BIT(0, PSW, bmCY);
  tick(3);
  return(resGO);
}


/*
 * 0xd4 1 12 DA A
 *____________________________________________________________________________
 *
 */

int
t_uc51::inst_da_a(uchar code)
{
  uchar acc, psw;

  acc= sfr->get(ACC);
  psw= sfr->get(PSW);
  event_at.ws= ACC;
  if ((acc & 0x0f) > 9 ||
      (psw & bmAC))
    {
      if (((uint)acc+(uint)0x06) > 255)
	psw|= bmCY;
      acc+= 0x06;
    }
  if ((acc & 0xf0) > 0x90 ||
      (psw & bmCY))
    {
      if (((uint)acc+(uint)0x60) > 255)
	psw|= bmCY;
      acc+= 0x60;
    }
  sfr->set(ACC, acc);
  sfr->set(PSW, psw);
  return(resGO);
}


/* End of s51.src/arith.cc */

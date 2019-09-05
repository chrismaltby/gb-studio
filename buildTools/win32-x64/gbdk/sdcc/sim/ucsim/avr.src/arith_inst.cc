/*
 * Simulator of microcontrollers (arith_inst.cc)
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
 * Compare with Immediate
 * CPI Rd,K 16<=d<=31, 0<=K<=255
 * 0011 KKKK dddd KKKK
 *____________________________________________________________________________
 */

int
cl_avr::cpi_Rd_K(t_mem code)
{
  t_addr d;
  t_mem D, K, result, res;

  d= 16+(code&0xf0)>>4;
  K= (code&0xf) | ((code&0xf00)>>8);
  D= ram->read(d);

  if (K & 0x80)
    K|= ~0xff;
  if (D & 0x80)
    D|= ~0xff;
  t_mem sreg= ram->get(SREG);
  (signed)result= (signed)D-(signed)K;
  res= result & 0xff;
  
  sreg= sreg & ~(BIT_H|BIT_S|BIT_V|BIT_N|BIT_C|BIT_Z);
  if (0x08 & (((~D)&K) | (K&res) | (res&(~D))))
    sreg|= BIT_H;
  int n= 0, v= 0;
  if (0x80 & ((D&(~K)&(~res)) | ((~D)&K&res)))
    {
      sreg|= BIT_V;
      v= 1;
    }
  if (res & 0x80)
    {
      sreg|= BIT_N;
      n= 1;
    }
  if ((n ^ v) & 1)
    sreg|= BIT_S;
  if (!res)
    sreg|= BIT_Z;
  if (0x80 & (((~D)&K) | (K&res) | (res&(~D))))
    sreg|= BIT_C;
  ram->set(SREG, sreg);
  return(resGO);
}


/*
 * Substract Immediate with Carry
 * SBCI Rd,K 16<=d<=31, 0<=K<=255
 * 0100 KKKK dddd KKKK
 *____________________________________________________________________________
 */

int
cl_avr::sbci_Rd_K(t_mem code)
{
  t_addr d;
  t_mem D, K, result, res;

  d= 16+(code&0xf0)>>4;
  K= (code&0xf) | ((code&0xf00)>>8);
  D= ram->read(d);

  if (K & 0x80)
    K|= ~0xff;
  if (D & 0x80)
    D|= ~0xff;
  t_mem sreg= ram->get(SREG);
  (signed)result= (signed)D-(signed)K-(sreg&BIT_C)?1:0;
  res= result & 0xff;
  ram->write(d, &res);
  
  sreg= sreg & ~(BIT_H|BIT_S|BIT_V|BIT_N|BIT_C);
  if (0x08 & (((~D)&K) | (K&res) | (res&(~D))))
    sreg|= BIT_H;
  int n= 0, v= 0;
  if (0x80 & ((D&(~K)&(~res)) | ((~D)&K&res)))
    {
      sreg|= BIT_V;
      v= 1;
    }
  if (res & 0x80)
    {
      sreg|= BIT_N;
      n= 1;
    }
  if ((n ^ v) & 1)
    sreg|= BIT_S;
  if (res)
    sreg&= ~BIT_Z;
  if (0x80 & (((~D)&K) | (K&res) | (res&(~D))))
    sreg|= BIT_C;
  ram->set(SREG, sreg);
  return(resGO);
}


/*
 * Substract Immediate
 * SUBI Rd,K 16<=d<=31, 0<=K<=255
 * 0101 KKKK dddd KKKK
 *____________________________________________________________________________
 */

int
cl_avr::subi_Rd_K(t_mem code)
{
  t_addr d;
  t_mem D, K, result, res;

  d= 16+(code&0xf0)>>4;
  K= (code&0xf) | ((code&0xf00)>>8);
  D= ram->read(d);

  if (K & 0x80)
    K|= ~0xff;
  if (D & 0x80)
    D|= ~0xff;
  (signed)result= (signed)D-(signed)K;
  res= result & 0xff;
  ram->write(d, &res);
  
  t_mem sreg= ram->get(SREG) & ~(BIT_H|BIT_S|BIT_V|BIT_N|BIT_Z|BIT_C);
  if (0x08 & (((~D)&K) | (K&res) | (res&(~D))))
    sreg|= BIT_H;
  int n= 0, v= 0;
  if (0x80 & ((D&(~K)&(~res)) | ((~D)&K&res)))
    {
      sreg|= BIT_V;
      v= 1;
    }
  if (res & 0x80)
    {
      sreg|= BIT_N;
      n= 1;
    }
  if ((n ^ v) & 1)
    sreg|= BIT_S;
  if (!res)
    sreg|= BIT_Z;
  if (0x80 & (((~D)&K) | (K&res) | (res&(~D))))
    sreg|= BIT_C;
  ram->set(SREG, sreg);
  return(resGO);
}


int
cl_avr::muls_Rd_Rr(t_mem code)
{
  return(resGO);
}


int
cl_avr::mulsu_Rd_Rr(t_mem code)
{
  return(resGO);
}


int
cl_avr::fmul_Rd_Rr(t_mem code)
{
  return(resGO);
}


int
cl_avr::fmuls_Rd_Rr(t_mem code)
{
  return(resGO);
}


int
cl_avr::fmulsu_Rd_Rr(t_mem code)
{
  return(resGO);
}


/*
 * Compare with Carry
 * CPC Rd,Rr 0<=d<=31, 0<=r<=31
 * 0000 01rd dddd rrrr
 *____________________________________________________________________________
 */

int
cl_avr::cpc_Rd_Rr(t_mem code)
{
  t_addr r, d;
  t_mem R, D, result, res;

  d= (code&0x1f0)>>4;
  r= ((code&0x200)>>5)|(code&0xf);
  R= ram->read(r);
  D= ram->read(d);
  if (R & 0x80)
    R|= ~0xff;
  if (D & 0x80)
    D|= ~0xff;
  t_mem sreg= ram->get(SREG);
  (signed)result= (signed)D-(signed)R-(sreg&BIT_C)?1:0;
  res= result & 0xff;
  
  sreg= sreg & ~(BIT_H|BIT_S|BIT_V|BIT_N|BIT_C);
  if (0x08 & (((~D)&R) | (R&res) | (res&(~D))))
    sreg|= BIT_H;
  int n= 0, v= 0;
  if (0x80 & ((D&(~R)&(~res)) | ((~D)&R&res)))
    {
      sreg|= BIT_V;
      v= 1;
    }
  if (res & 0x80)
    {
      sreg|= BIT_N;
      n= 1;
    }
  if ((n ^ v) & 1)
    sreg|= BIT_S;
  if (res)
    sreg&= ~BIT_Z;
  if (0x80 & (((~D)&R) | (R&res) | (res&(~D))))
    sreg|= BIT_C;
  ram->set(SREG, sreg);
  return(resGO);
}


/*
 * Substract with Carry
 * SBC Rd,Rr 0<=d<=31, 0<=r<=31
 * 0000 10rd dddd rrrr
 *____________________________________________________________________________
 */

int
cl_avr::sbc_Rd_Rr(t_mem code)
{
  t_addr r, d;
  t_mem R, D, result, res;

  d= (code&0x1f0)>>4;
  r= ((code&0x200)>>5)|(code&0xf);
  R= ram->read(r);
  D= ram->read(d);
  if (R & 0x80)
    R|= ~0xff;
  if (D & 0x80)
    D|= ~0xff;
  t_mem sreg= ram->get(SREG);
  (signed)result= (signed)D-(signed)R-(sreg&BIT_C)?1:0;
  res= result & 0xff;
  ram->write(d, &res);
  
  sreg= sreg & ~(BIT_H|BIT_S|BIT_V|BIT_N|BIT_C);
  if (0x08 & (((~D)&R) | (R&res) | (res&(~D))))
    sreg|= BIT_H;
  int n= 0, v= 0;
  if (0x80 & ((D&(~R)&(~res)) | ((~D)&R&res)))
    {
      sreg|= BIT_V;
      v= 1;
    }
  if (res & 0x80)
    {
      sreg|= BIT_N;
      n= 1;
    }
  if ((n ^ v) & 1)
    sreg|= BIT_S;
  if (res)
    sreg&= ~BIT_Z;
  if (0x80 & (((~D)&R) | (R&res) | (res&(~D))))
    sreg|= BIT_C;
  ram->set(SREG, sreg);
  return(resGO);
}


/*
 * Add without Carry
 * ADD Rd,Rr 0<=d<=31, 0<=r<=31
 * 0000 11rd dddd rrrr
 *____________________________________________________________________________
 */

int
cl_avr::add_Rd_Rr(t_mem code)
{
  t_addr r, d;
  t_mem R, D, result, res;

  d= (code&0x1f0)>>4;
  r= ((code&0x200)>>5)|(code&0xf);
  R= ram->read(r);
  D= ram->read(d);
  result= D+R;
  res= result & 0xff;
  ram->write(d, &res);
  
  t_mem sreg= ram->get(SREG);
  if (!res)
    sreg|= BIT_Z;
  else
    sreg&= ~BIT_Z;
  if (((D&R&~res)&0x80) ||
      ((~D&~R&res)&0x80))
    sreg|= (BIT_V|BIT_S);
  else
    sreg&= ~(BIT_V|BIT_S);
  if (res & 0x80)
    {
      sreg|= BIT_N;
      sreg^= BIT_S;
    }
  else
    sreg&= ~BIT_N;
  if (result & ~0xff)
    sreg|= BIT_C;
  else
    sreg&= ~BIT_C;
  if ((R&0xf) + (D&0xf) > 15)
    sreg|= BIT_H;
  else
    sreg&= ~BIT_H;
  ram->set(SREG, sreg);

  return(resGO);
}


/*
 * Compare
 * CP Rd,Rr 0<=d<=31, 0<=r<=31
 * 0001 01rd dddd rrrr
 *____________________________________________________________________________
 */

int
cl_avr::cp_Rd_Rr(t_mem code)
{
  t_addr r, d;
  t_mem R, D, result, res;

  d= (code&0x1f0)>>4;
  r= ((code&0x200)>>5)|(code&0xf);
  R= ram->read(r);
  D= ram->read(d);
  if (R & 0x80)
    R|= ~0xff;
  if (D & 0x80)
    D|= ~0xff;
  (signed)result= (signed)D-(signed)R;
  res= result & 0xff;
  
  t_mem sreg= ram->get(SREG) & ~(BIT_H|BIT_S|BIT_V|BIT_N|BIT_Z|BIT_C);
  if (0x08 & (((~D)&R) | (R&res) | (res&(~D))))
    sreg|= BIT_H;
  int n= 0, v= 0;
  if (0x80 & ((D&(~R)&(~res)) | ((~D)&R&res)))
    {
      sreg|= BIT_V;
      v= 1;
    }
  if (res & 0x80)
    {
      sreg|= BIT_N;
      n= 1;
    }
  if ((n ^ v) & 1)
    sreg|= BIT_S;
  if (!res)
    sreg|= BIT_Z;
  if (0x80 & (((~D)&R) | (R&res) | (res&(~D))))
    sreg|= BIT_C;
  ram->set(SREG, sreg);
  return(resGO);
}


/*
 * Substract without Carry
 * SUB Rd,Rr 0<=d<=31, 0<=r<=31
 * 0001 10rd dddd rrrr
 *____________________________________________________________________________
 */

int
cl_avr::sub_Rd_Rr(t_mem code)
{
  t_addr r, d;
  t_mem R, D, result, res;

  d= (code&0x1f0)>>4;
  r= ((code&0x200)>>5)|(code&0xf);
  R= ram->read(r);
  D= ram->read(d);
  if (R & 0x80)
    R|= ~0xff;
  if (D & 0x80)
    D|= ~0xff;
  (signed)result= (signed)D-(signed)R;
  res= result & 0xff;
  ram->write(d, &res);
  
  t_mem sreg= ram->get(SREG) & ~(BIT_H|BIT_S|BIT_V|BIT_N|BIT_Z|BIT_C);
  if (0x08 & (((~D)&R) | (R&res) | (res&(~D))))
    sreg|= BIT_H;
  int n= 0, v= 0;
  if (0x80 & ((D&(~R)&(~res)) | ((~D)&R&res)))
    {
      sreg|= BIT_V;
      v= 1;
    }
  if (res & 0x80)
    {
      sreg|= BIT_N;
      n= 1;
    }
  if ((n ^ v) & 1)
    sreg|= BIT_S;
  if (!res)
    sreg|= BIT_Z;
  if (0x80 & (((~D)&R) | (R&res) | (res&(~D))))
    sreg|= BIT_C;
  ram->set(SREG, sreg);
  return(resGO);
}


/*
 * Add with Carry
 * ADC Rd,Rr 0<=d<=31, 0<=r<=31
 * 0001 11rd dddd rrrr
 *____________________________________________________________________________
 */

int
cl_avr::adc_Rd_Rr(t_mem code)
{
  t_addr r, d;
  t_mem R, D, result, res;

  d= (code&0x1f0)>>4;
  r= ((code&0x200)>>5)|(code&0xf);
  R= ram->read(r);
  D= ram->read(d);
  t_mem sreg= ram->get(SREG);
  result= D+R+((sreg&BIT_C)?1:0);
  res= result & 0xff;
  ram->write(d, &res);
  
  if (!res)
    sreg|= BIT_Z;
  else
    sreg&= ~BIT_Z;
  if (((D&R&~res)&0x80) ||
      ((~D&~R&res)&0x80))
    sreg|= (BIT_V|BIT_S);
  else
    sreg&= ~(BIT_V|BIT_S);
  if (res & 0x80)
    {
      sreg|= BIT_N;
      sreg^= BIT_S;
    }
  else
    sreg&= ~BIT_N;
  if (result & ~0xff)
    sreg|= BIT_C;
  else
    sreg&= ~BIT_C;
  if ((R&0xf) + (D&0xf) > 15)
    sreg|= BIT_H;
  else
    sreg&= ~BIT_H;
  ram->set(SREG, sreg);

  return(resGO);
}


/*
 * One's Complement
 * COM Rd 0<=d<=31
 * 1001 010d dddd 0000
 *____________________________________________________________________________
 */

int
cl_avr::com_Rd(t_mem code)
{
  t_addr d;
  t_mem D, result, res;

  d= (code&0x1f0)>>4;
  D= ram->read(d);
  result= ~D;
  res= result & 0xff;
  ram->write(d, &res);
  
  t_mem sreg= ram->get(SREG);
  if (!res)
    sreg|= BIT_Z;
  else
    sreg&= ~BIT_Z;
  sreg&= ~BIT_V;
  if (res & 0x80)
    sreg|= (BIT_N|BIT_S);
  else
    sreg&= ~(BIT_N|BIT_S);
  sreg|= BIT_C;
  ram->set(SREG, sreg);

  return(resGO);
}


/*
 * Two's Complement
 * NEG Rd 0<=d<=31
 * 1001 010d dddd 0001
 *____________________________________________________________________________
 */

int
cl_avr::neg_Rd(t_mem code)
{
  t_addr d;
  t_mem D, result, res;

  d= (code&0x1f0)>>4;
  D= ram->read(d);
  result= (~D)+1;
  res= result & 0xff;
  ram->write(d, &res);
  
  t_mem sreg= ram->get(SREG);
  if (res & (~d) & 0x08)
    sreg|= BIT_H;
  else
    sreg&= ~BIT_H;
  if (res > 0x80)
    sreg|= BIT_S;
  else
    sreg&= ~BIT_S;
  if (!res)
    {
      sreg|= BIT_Z;
      sreg&= ~BIT_C;
    }
  else
    {
      sreg&= ~BIT_Z;
      sreg|= BIT_C;
    }
  if (res == 0x80)
    sreg|= BIT_V;
  else
    sreg&= ~BIT_V;
  if (res & 0x80)
    sreg|= (BIT_N);
  else
    sreg&= ~BIT_N;
  ram->set(SREG, sreg);

  return(resGO);
}


/*
 * Increment
 * INC Rd 0<=d<=31
 * 1001 010d dddd 0011
 *____________________________________________________________________________
 */

int
cl_avr::inc_Rd(t_mem code)
{
  t_addr d;

  d= (code&0x1f0)>>4;
  t_mem data= ram->read(d)+1;
  ram->write(d, &data);

  t_mem sreg= ram->get(SREG);
  data= data&0xff;
  if (data & 0x80)
    {
      sreg|= (BIT_N);
      if (data == 0x80)
	{
	  sreg|= BIT_V;
	  sreg&= ~BIT_S;
	}
      else
	{
	  sreg&= ~BIT_V;
	  sreg|= BIT_S;
	}
      sreg&= ~BIT_Z;
    }
  else
    {
      sreg&= ~(BIT_N|BIT_V|BIT_S);
      if (!data)
	sreg|= BIT_Z;
      else
	sreg&= ~BIT_Z;
    }
  ram->set(SREG, sreg);
  return(resGO);
}


/*
 * Arithmetic Shift Right
 * ASR Rd 0<=d<=31
 * 1001 010d dddd 0101
 *____________________________________________________________________________
 */

int
cl_avr::asr_Rd(t_mem code)
{
  t_addr d;
  t_mem D, result, res;

  d= (code&0x1f0)>>4;
  D= ram->read(d);
  t_mem sreg= ram->read(SREG) & ~(BIT_S|BIT_V|BIT_N|BIT_Z|BIT_C);
  int n=0, v= 0, c= 0;
  if (D & 1)
    {
      sreg|= BIT_C;
      c= 1;
    }
  result= D>>1;
  if (result & 0x40)
    result|= 0x80;
  res= result & 0xff;
  ram->write(d, &res);
  if (res & 0x80)
    {
      sreg|= BIT_N;
      n= 1;
    }
  if ((n ^ c) & 1)
    {
      sreg|= BIT_V;
      v= 1;
    }
  if ((n ^ v) & 1)
    sreg|= BIT_S;
  if (!res)
    sreg|= BIT_Z;
  ram->write(SREG, &sreg);
  return(resGO);
}


/*
 * Logical Shift Right
 * LSR Rd 0<=d<=31
 * 1001 010d dddd 0110
 *____________________________________________________________________________
 */

int
cl_avr::lsr_Rd(t_mem code)
{
  t_addr d;
  t_mem D, result, res;

  d= (code &0x1f0)>>4;
  D= ram->read(d);
  t_mem sreg= ram->read(SREG) & ~(BIT_S|BIT_V|BIT_N|BIT_Z|BIT_C);
  if (D & 1)
    sreg|= (BIT_C|BIT_V|BIT_S);
  result= D >> 1;
  res= result & 0xff;
  ram->write(d, &res);
  if (!res)
    sreg|= BIT_Z;
  ram->write(SREG, &sreg);
  return(resGO);
}


/*
 * Rotate Right trough Carry
 * ROR Rd 0<=d<=31
 * 1001 010d dddd 0111
 *____________________________________________________________________________
 */

int
cl_avr::ror_Rd(t_mem code)
{
  t_addr d;
  t_mem D, result, res;

  d= (code&0x1f0)>>4;
  D= ram->read(d);
  t_mem sreg= ram->read(SREG);
  int oldc= sreg & BIT_C;
  sreg= sreg & ~(BIT_S|BIT_V|BIT_N|BIT_Z|BIT_C);
  int n= 0, v= 0, c= 0;
  if (D & 1)
    {
      sreg|= BIT_C;
      c= 1;
    }
  result= (D >> 1) | oldc?0x80:0;
  res= result & 0xff;
  ram->write(d, &res);
  if (res & 0x80)
    {
      sreg|= BIT_N;
      n= 1;
    }
  if ((n ^ c) & 1)
    {
      sreg|= BIT_V;
      v= 1;
    }
  if ((n ^ v) & 1)
    sreg|= BIT_S;
  if (!res)
    sreg|= BIT_Z;
  ram->write(SREG, &sreg);
  return(resGO);
}


/*
 * Decrement
 * DEC Rd 0<=d<=31
 * 1001 010d dddd 1010
 *____________________________________________________________________________
 */

int
cl_avr::dec_Rd(t_mem code)
{
  t_addr d;
  t_mem D, result, res;

  d= (code&0x1f0)>>4;
  D= ram->read(d);
  result= D-1;
  res= result & 0xff;
  ram->write(d, &res);

  t_mem sreg= ram->get(SREG);
  if (!res)
    sreg|= BIT_Z;
  else
    sreg&= ~BIT_Z;
  int n= 0, v= 0;
  if (res & 0x80)
    {
      sreg|= BIT_N;
      n= 1;
    }
  else
    sreg&= ~BIT_N;
  if (D == 0x80)
    {
      sreg|= BIT_V;
      v= 1;
    }
  else
    sreg&= ~BIT_V;
  if ((n ^ v) & 1)
    sreg|= BIT_S;
  else
    sreg&= ~BIT_S;
  ram->set(SREG, sreg);

  return(resGO);
}


/*
 * Multiply
 * MUL Rd,Rr 0<=d<=31, 0<=r<=31
 * 1001 11rd dddd rrrr
 *____________________________________________________________________________
 */

int
cl_avr::mul_Rd_Rr(t_mem code)
{
  t_addr d, r;
  t_mem D, R, result, resl, resh;

  d= (code>>4) & 0x1f;
  r= ((code&0x200)>>5) | (code&0xf);
  D= ram->read(d);
  R= ram->read(r);
  result= R*D;
  resl= result & 0xff;
  resh= (result>>8) & 0xff;
  ram->write(0, &resl);
  ram->write(1, &resh);
  t_mem sreg= ram->read(SREG) & ~BIT_C;
  if (resh & 0x80)
    sreg|= BIT_C;
  ram->write(SREG, &sreg);
  tick(1);
  return(resGO);
}


/*
 * Add Immediate to Word
 * ADIW Rdl,K dl={24,26,28,30}, 0<=K<=63
 * 1001 0110 KK dd KKKK
 *____________________________________________________________________________
 */

int
cl_avr::adiw_Rdl_K(t_mem code)
{
  t_addr dl;
  t_mem D, K, result, res;

  dl= 24+(2*((code&0x30)>>4));
  K= ((code&0xc0)>>2)|(code&0xf);
  D= ram->read(dl+1)*256 + ram->read(dl);
  result= D+K;
  res= result & 0xffff;
  t_mem resl= result&0xff, resh= (result>>8)&0xff;
  ram->write(dl+1, &resh);
  ram->write(dl, &resl);
  
  t_mem sreg= ram->get(SREG);
  if (!res)
    sreg|= BIT_Z;
  else
    sreg&= ~BIT_Z;
  if (D&res&0x8000)
    sreg|= (BIT_V|BIT_S);
  else
    sreg&= ~(BIT_V|BIT_S);
  if (res & 0x8000)
    {
      sreg|= BIT_N;
      sreg^= BIT_S;
    }
  else
    sreg&= ~BIT_N;
  if ((~res)&D&0x8000)
    sreg|= BIT_C;
  else
    sreg&= ~BIT_C;
  ram->set(SREG, sreg);
  tick(1);

  return(resGO);
}


/*
 * Substract Immediate from Word
 * SBIW Rdl,K dl={24,26,28,30}, 0<=K<=63
 * 1001 0111 KK dd KKKK
 *____________________________________________________________________________
 */

int
cl_avr::sbiw_Rdl_K(t_mem code)
{
  t_addr dl;
  t_mem D, K, result, res;

  dl= 24+(2*((code&0x30)>>4));
  K= ((code&0xc0)>>2)|(code&0xf);
  D= ram->read(dl+1)*256 + ram->read(dl);
  if (K & 0x20)
    K|= ~0x3f;
  if (D & 0x8000)
    D|= ~0xffff;
  (signed)result= (signed)D-(signed)K;
  res= result & 0xffff;
  t_mem resl= res&0xff, resh= (res>>8)&0xff;
  ram->write(dl+1, &resh);
  ram->write(dl, &resl);

  t_mem sreg= ram->get(SREG) & ~(BIT_S|BIT_V|BIT_N|BIT_Z|BIT_C);
  int n= 0, v= 0;
  if (0x8000 & D & (~res))
    {
      sreg|= BIT_V;
      v= 1;
    }
  if (res & 0x8000)
    {
      sreg|= BIT_N;
      n= 1;
    }
  if ((n ^ v) & 1)
    sreg|= BIT_S;
  if (!res)
    sreg|= BIT_Z;
  if (0x8000 & res & (~D))
    sreg|= BIT_C;
  ram->set(SREG, sreg);
  tick(1);

  return(resGO);
}


/* End of avr.src/arith_inst.cc */

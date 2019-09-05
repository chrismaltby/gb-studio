/*
 * Simulator of microcontrollers (move_inst.cc)
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
 * Load Program Memory
 * LPM
 * 1001 0101 110X 1000
 *____________________________________________________________________________
 */

int
cl_avr::lpm(t_mem code)
{
  t_addr addr;
  t_mem data;

  addr= ram->get(ZH)*256 + ram->get(ZL);
  data= rom->read(addr);
  if (addr & 1)
    ram->/*write*/set(0, (data>>8)&0xff);
  else
    ram->/*write*/set(0, data&0xff);
  tick(2);
  return(resGO);
}


int
cl_avr::elpm(t_mem code)
{
  return(resGO);
}


int
cl_avr::spm(t_mem code)
{
  return(resGO);
}


int
cl_avr::espm(t_mem code)
{
  return(resGO);
}


/*
 * Load Immediate
 * LDI Rd,K 16<=d<=31 0<=K<=255
 * 1110 KKKK dddd KKKK
 *____________________________________________________________________________
 */

int
cl_avr::ldi_Rd_K(t_mem code)
{
  t_addr d;
  t_mem K;

  d= (code&0xf0)>>4;
  K= ((code&0xf00)>>4)|(code&0xf);
  ram->write(d+16, &K);
  return(resGO);
}


int
cl_avr::movw_Rd_Rr(t_mem code)
{
  return(resGO);
}


/*
 * Load Indirect From SRAM to Register using Index Z
 * LDD Rd,Z+q 0<=d<=31, 0<=q<=63
 * 10q0 qq0d dddd 0qqq
 *____________________________________________________________________________
 */

int
cl_avr::ldd_Rd_Z_q(t_mem code)
{
  int d, q;
  t_addr z;

  d= (code&0x1f0)>>4;
  q= ((code&0x2000)>>8)|((code&0xc00)>>7)|(code&0x7);
  z= ram->get(ZH)*256 + ram->get(ZL);
  t_mem data= ram->read(z+q);
  ram->write(d, &data);
  tick(1);
  return(resGO);
}


/*
 * Load Indirect From SRAM to Register using Index Y
 * LDD Rd,Y+q 0<=d<=31, 0<=q<=63
 * 10q0 qq0d dddd 1qqq
 *____________________________________________________________________________
 */

int
cl_avr::ldd_Rd_Y_q(t_mem code)
{
  int d, q;
  t_addr y;

  d= (code&0x1f0)>>4;
  q= ((code&0x2000)>>8)|((code&0xc00)>>7)|(code&0x7);
  y= ram->get(YH)*256 + ram->get(YL);
  t_mem data= ram->read(y+q);
  ram->write(d, &data);
  tick(1);
  return(resGO);
}


/*
 * Store Indirect From Register to SRAM using Index Z
 * ST Z+q,Rr 0<=r<=31, 0<=q<=63
 * 10q0 qq1r rrrr 0qqq
 *____________________________________________________________________________
 */

int
cl_avr::std_Z_q_Rr(t_mem code)
{
  int r, q;
  t_addr z;

  r= (code&0x1f0)>>4;
  q= ((code&0x2000)>>8)|((code&0xc00)>>7)|(code&0x7);
  z= ram->get(ZH)*256 + ram->get(ZL);
  t_mem data= ram->read(r);
  ram->write(z+q, &data);
  tick(1);
  return(resGO);
}


/*
 * Store Indirect From Register to SRAM using Index Y
 * ST Y+q,Rr 0<=r<=31, 0<=q<=63
 * 10q0 qq1r rrrr 1qqq
 *____________________________________________________________________________
 */

int
cl_avr::std_Y_q_Rr(t_mem code)
{
  int r, q;
  t_addr y;

  r= (code&0x1f0)>>4;
  q= ((code&0x2000)>>8)|((code&0xc00)>>7)|(code&0x7);
  y= ram->get(YH)*256 + ram->get(YL);
  t_mem data= ram->read(r);
  ram->write(y+q, &data);
  tick(1);
  return(resGO);
}


/*
 * Load Direct from SRAM
 * LDS Rd,k 0<=d<=31, 0<=k<=65535
 * 1001 000d dddd 0000
 * kkkk kkkk kkkk kkkk
 *____________________________________________________________________________
 */

int
cl_avr::lds_Rd_k(t_mem code)
{
  t_addr d, k;

  d= (code&0x1f0)>>4;
  k= fetch();
  t_mem data= ram->read(k);
  ram->write(d, &data);
  tick(2);
  return(resGO);
}


/*
 * Load Indirect From SRAM to register using Index Z
 * LD Rd,Z+ 0<=d<=31
 * 1001 000d dddd 0001
 *____________________________________________________________________________
 */

int
cl_avr::ld_Rd_Z$(t_mem code)
{
  t_addr z, d;

  d= (code&0x1f0)>>4;
  z= ram->get(ZH)*256 + ram->get(ZL);
  t_mem data= ram->read(z);
  ram->write(d, &data);
  ram->set(ZL, data= (ram->get(ZL)+1)&0xff);
  if (!data)
    ram->set(ZH, (ram->get(ZH)+1)&0xff);
  tick(1);
  return(resGO);
}


/*
 * Load Indirect From SRAM to register using Index Z
 * LD Rd,-Z 0<=d<=31
 * 1001 000d dddd 0010
 *____________________________________________________________________________
 */

int
cl_avr::ld_Rd_$Z(t_mem code)
{
  t_addr z, d;
  t_mem data;

  d= (code&0x1f0)>>4;
  ram->set(ZL, z= (ram->get(ZL)-1)&0xff);
  if (z == 0xff)
    ram->set(ZH, (ram->get(ZH)-1)&0xff);
  z= ram->get(ZH)*256 + z;
  data= ram->read(z);
  ram->write(d, &data);
  tick(1);
  return(resGO);
}


int
cl_avr::lpm_Rd_Z(t_mem code)
{
  return(resGO);
}


int
cl_avr::lpm_Rd_Z$(t_mem code)
{
  return(resGO);
}


int
cl_avr::elpm_Rd_Z(t_mem code)
{
  return(resGO);
}


int
cl_avr::elpm_Rd_Z$(t_mem code)
{
  return(resGO);
}


/*
 * Load Indirect From SRAM to register using Index Y
 * LD Rd,Y+ 0<=d<=31
 * 1001 000d dddd 1001
 *____________________________________________________________________________
 */

int
cl_avr::ld_Rd_Y$(t_mem code)
{
  t_addr y, d;

  d= (code&0x1f0)>>4;
  y= ram->get(YH)*256 + ram->get(YL);
  t_mem data= ram->read(y);
  ram->write(d, &data);
  ram->set(YL, data= (ram->get(YL)+1)&0xff);
  if (!data)
    ram->set(YH, (ram->get(YH)+1)&0xff);
  tick(1);
  return(resGO);
}


/*
 * Load Indirect From SRAM to register using Index Y
 * LD Rd,-Y 0<=d<=31
 * 1001 000d dddd 1010
 *____________________________________________________________________________
 */

int
cl_avr::ld_Rd_$Y(t_mem code)
{
  t_addr y, d;
  t_mem data;

  d= (code&0x1f0)>>4;
  ram->set(YL, y= (ram->get(YL)-1)&0xff);
  if (y == 0xff)
    ram->set(YH, (ram->get(YH)-1)&0xff);
  y= ram->get(YH)*256 + y;
  data= ram->read(y);
  ram->write(d, &data);
  tick(1);
  return(resGO);
}


/*
 * Load Indirect From SRAM to register using Index X
 * LD Rd,X 0<=d<=31
 * 1001 000d dddd 1100
 *____________________________________________________________________________
 */

int
cl_avr::ld_Rd_X(t_mem code)
{
  t_addr x, d;

  d= (code&0x1f0)>>4;
  x= ram->get(XH)*256 + ram->get(XL);
  t_mem data= ram->read(x);
  ram->write(d, &data);
  tick(1);
  return(resGO);
}


/*
 * Load Indirect From SRAM to register using Index X
 * LD Rd,X+ 0<=d<=31
 * 1001 000d dddd 1101
 *____________________________________________________________________________
 */

int
cl_avr::ld_Rd_X$(t_mem code)
{
  t_addr x, d;

  d= (code&0x1f0)>>4;
  x= ram->get(XH)*256 + ram->get(XL);
  t_mem data= ram->read(x);
  ram->write(d, &data);
  ram->set(XL, data= (ram->get(XL)+1)&0xff);
  if (!data)
    ram->set(XH, (ram->get(XH)+1)&0xff);
  tick(1);
  return(resGO);
}


/*
 * Load Indirect From SRAM to register using Index X
 * LD Rd,-X 0<=d<=31
 * 1001 000d dddd 1110
 *____________________________________________________________________________
 */

int
cl_avr::ld_Rd_$X(t_mem code)
{
  t_addr x, d;
  t_mem data;

  d= (code&0x1f0)>>4;
  ram->set(XL, x= (ram->get(XL)-1)&0xff);
  if (x == 0xff)
    ram->set(XH, (ram->get(XH)-1)&0xff);
  x= ram->get(XH)*256 + x;
  data= ram->read(x);
  ram->write(d, &data);
  tick(1);
  return(resGO);
}


/*
 * Pop Register from Stack
 * POP Rd 0<=d<=31
 * 1001 000d dddd 1111
 *____________________________________________________________________________
 */

int
cl_avr::pop_Rd(t_mem code)
{
  t_addr d;
  t_mem D;

  d= (code&0x1f0)>>4;
  pop_data(&D);
  ram->write(d, &D);
  tick(1);
  
  return(resGO);
}


/*
 * Store Direct to SRAM
 * STS k,Rr 0<=r<=31, 0<=k<=65535
 * 1001 001r rrrr 0000
 * kkkk kkkk kkkk kkkk
 *____________________________________________________________________________
 */

int
cl_avr::sts_k_Rr(t_mem code)
{
  t_addr r, k;

  r= (code&0x1f0)>>4;
  k= fetch();
  t_mem data= ram->read(r);
  ram->write(k, &data);
  tick(2);
  return(resGO);
}


/*
 * Store Indirect From Register to SRAM using Index Z
 * ST Z+,Rr 0<=r<=63
 * 1001 001r rrrr 0001
 *____________________________________________________________________________
 */

int
cl_avr::st_Z$_Rr(t_mem code)
{ 
  t_addr z, r;

  r= (code&0x1f0)>>4;
  z= ram->get(ZH)*256 + ram->get(ZL);
  t_mem data= ram->read(r);
  ram->write(z, &data);
  ram->set(ZL, data= (ram->get(ZL)+1)&0xff);
  if (!data)
    ram->set(ZH, (ram->get(ZH)+1)&0xff);
  tick(1);
  return(resGO);
}


/*
 * Store Indirect From Register to SRAM using Index Z
 * ST -Z,Rr 0<=r<=63
 * 1001 001r rrrr 0010
 *____________________________________________________________________________
 */

int
cl_avr::st_$Z_Rr(t_mem code)
{
  t_addr z, r;
  t_mem data;

  r= (code&0x1f0)>>4;
  ram->set(ZL, z= (ram->get(ZL)-1)&0xff);
  if (z == 0xff)
    ram->set(ZH, (ram->get(ZH)-1)&0xff);
  z= ram->get(ZH)*256 + z;
  data= ram->read(r);
  ram->write(z, &data);
  tick(1);
  return(resGO);
}


/*
 * Store Indirect From Register to SRAM using Index Y
 * ST Y+,Rr 0<=r<=63
 * 1001 001r rrrr 1001
 *____________________________________________________________________________
 */

int
cl_avr::st_Y$_Rr(t_mem code)
{
  t_addr y, r;

  r= (code&0x1f0)>>4;
  y= ram->get(YH)*256 + ram->get(YL);
  t_mem data= ram->read(r);
  ram->write(y, &data);
  ram->set(YL, data= (ram->get(YL)+1)&0xff);
  if (!data)
    ram->set(YH, (ram->get(YH)+1)&0xff);
  tick(1);
  return(resGO);
}


/*
 * Store Indirect From Register to SRAM using Index Y
 * ST -Y,Rr 0<=r<=63
 * 1001 001r rrrr 1010
 *____________________________________________________________________________
 */

int
cl_avr::st_$Y_Rr(t_mem code)
{
  t_addr y, r;
  t_mem data;

  r= (code&0x1f0)>>4;
  ram->set(YL, y= (ram->get(YL)-1)&0xff);
  if (y == 0xff)
    ram->set(YH, (ram->get(YH)-1)&0xff);
  y= ram->get(YH)*256 + y;
  data= ram->read(r);
  ram->write(y, &data);
  tick(1);
  return(resGO);
}


/*
 * Store Indirect From Register to SRAM using Index X
 * ST X,Rr 0<=r<=31
 * 1001 001r rrrr 1100
 *____________________________________________________________________________
 */

int
cl_avr::st_X_Rr(t_mem code)
{
  int r;
  t_addr x;

  r= (code&0x1f0)>>4;
  x= ram->get(XH)*256 + ram->get(XL);
  t_mem data= ram->read(r);
  ram->write(x, &data);
  tick(1);
  return(resGO);
}


/*
 * Store Indirect From Register to SRAM using Index X
 * ST X+,Rr 0<=r<=63
 * 1001 001r rrrr 1101
 *____________________________________________________________________________
 */

int
cl_avr::st_X$_Rr(t_mem code)
{
  t_addr x, r;

  r= (code&0x1f0)>>4;
  x= ram->get(XH)*256 + ram->get(XL);
  t_mem data= ram->read(r);
  ram->write(x, &data);
  ram->set(XL, data= (ram->get(XL)+1)&0xff);
  if (!data)
    ram->set(XH, (ram->get(XH)+1)&0xff);
  tick(1);
  return(resGO);
}


/*
 * Store Indirect From Register to SRAM using Index X
 * ST -X,Rr 0<=r<=63
 * 1001 001r rrrr 1110
 *____________________________________________________________________________
 */

int
cl_avr::st_$X_Rr(t_mem code)
{
  t_addr x, r;
  t_mem data;

  r= (code&0x1f0)>>4;
  ram->set(XL, x= (ram->get(XL)-1)&0xff);
  if (x == 0xff)
    ram->set(XH, (ram->get(XH)-1)&0xff);
  x= ram->get(XH)*256 + x;
  data= ram->read(r);
  ram->write(x, &data);
  tick(1);
  return(resGO);
}


/*
 * Push register on Stack
 * PUSH Rr 0<=r<=31
 * 1001 001d dddd 1111
 *____________________________________________________________________________
 */

int
cl_avr::push_Rr(t_mem code)
{
  t_addr d;
  t_mem D;

  d= (code&0x1f0)>>4;
  D= ram->read(d);
  push_data(D);
  tick(1);

  return(resGO);
}


/*
 * Swap Nibbles
 * SWAP Rd 0<=d<=31
 * 1001 010d dddd 0010
 *____________________________________________________________________________
 */

int
cl_avr::swap_Rd(t_mem code)
{
  t_addr d;
  t_mem data, temp;

  d= (code&0x1f0)>>4;
  data= ram->read(d);
  temp= (data>>4)&0xf;
  data= (data<<4)|temp;
  ram->write(d, &data);
  return(resGO);
}


/*
 * Load an I/O Port to Register
 * IN Rd,P 0<=d<=31 0<=P<=63
 * 1011 0PPd dddd PPPP
 *____________________________________________________________________________
 */

int
cl_avr::in_Rd_A(t_mem code)
{
  t_mem P, data;
  t_addr d;
  
  P= ((code&0x600)>>5)|(code&0xf);
  d= (code&0x1f0)>>4;
  data= ram->read(P+0x20);
  ram->write(d, &data);
  return(resGO);
}


/*
 * Store Register to I/O Port
 * OUT P,Rr 0<=r<=31 0<=P<=63
 * 1011 1PPr rrrr PPPP
 *____________________________________________________________________________
 */

int
cl_avr::out_A_Rr(t_mem code)
{
  t_mem P, data;
  t_addr r;
  
  P= ((code&0x600)>>5)|(code&0xf);
  r= (code&0x1f0)>>4;
  data= ram->read(r);
  ram->write(P+0x20, &data);
  return(resGO);
}


/*
 * Copy Register
 * MOV Rd,Rr 0<=d<=31 0<=r<=31
 * 0010 11rd dddd rrrr
 *____________________________________________________________________________
 */

int
cl_avr::mov_Rd_Rr(t_mem code)
{
  t_addr d, r;
  
  d= (code&0x1f0)>>4;
  r= ((code&0x200)>>5)|(code&0xf);
  t_mem data= ram->read(r);
  ram->write(d, &data);
  return(resGO);
}


/* End of avr.src/move_inst.cc */

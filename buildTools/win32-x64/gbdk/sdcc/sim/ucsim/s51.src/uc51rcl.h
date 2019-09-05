/*
 * Simulator of microcontrollers (uc51rcl.h)
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

#ifndef UC51RCL_HEADER
#define UC51RCL_HEADER

#include "ddconfig.h"

#include "uc52cl.h"
#include "itsrccl.h"


class t_uc51r: public t_uc52
{
protected:
  int   clock_out;
  int   WDT; // If negative then WDT is disabled
  uchar wdtrst;

public:
  uchar ERAM[ERAM_SIZE];

public:
  t_uc51r(int Itype, int Itech, class cl_sim *asim);

  virtual void reset(void);

  virtual void eram2xram(void);
  virtual void xram2eram(void);

  virtual void proc_write(uchar *addr);

  virtual int  do_timers(int cycles);
  virtual int  do_timer2(int cycles);
  virtual int  do_t2_clockout(int cycles);
  virtual int  serial_bit_cnt(int mode);
  virtual void received(int c);
  virtual int  do_wdt(int cycles);

  virtual int inst_movx_a_$dptr(uchar code);		/* e0 */
  virtual int inst_movx_a_$ri(uchar code);		/* e2,e3 */
  virtual int inst_movx_$dptr_a(uchar code);		/* f0 */
  virtual int inst_movx_$ri_a(uchar code);		/* f2,f3 */
};


#endif

/* End of s51.src/uc52cl.h */

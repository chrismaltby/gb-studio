/*
 * Simulator of microcontrollers (uc89c51rcl.h)
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

#ifndef UC89C51RCL_HEADER
#define UC89C51RCL_HEADER

#include "ddconfig.h"

#include "uc51rcl.h"


class t_uc89c51r: public t_uc51r
{
public:
  int t0_overflows;
  uchar dpl0, dph0;
  uchar dpl1, dph1;

public:
  t_uc89c51r(int Itype, int Itech, class cl_sim *asim);

  virtual void  reset(void);
  virtual void  proc_write(uchar *addr);
  virtual uchar read(uchar *addr);
  virtual void  pre_inst(void);
  virtual void  post_inst(void);
  virtual int   it_priority(uchar ie_mask);

  virtual int   do_timers(int cycles);
  virtual int   t0_overflow(void);
  virtual int   do_pca(int cycles);
  virtual int   do_pca_counter(int cycles);
  virtual int   do_pca_module(int nr);
};


#endif

/* End of s51.src/uc89c51rcl.h */

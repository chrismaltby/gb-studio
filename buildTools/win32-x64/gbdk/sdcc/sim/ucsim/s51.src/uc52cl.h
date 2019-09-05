/*
 * Simulator of microcontrollers (uc52cl.h)
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

#ifndef UC52CL_HEADER
#define UC52CL_HEADER

#include "ddconfig.h"

#include "uc51cl.h"
#include "itsrccl.h"


class t_uc52: public t_uc51
{
protected:
  class cl_it_src *exf2it;
  int   s_rec_t2;	// T2 overflows for receiving
  int   s_tr_t2;	// T2 overflows for sending

public:
  t_uc52(int Itype, int Itech, class cl_sim *asim);
  virtual void mk_hw_elements(void);

  virtual uchar *get_indirect(uchar addr, int *res);

  virtual int  do_timers(int cycles);
  virtual int  do_timer2(int cycles);
  virtual int  do_t2_baud(int cycles);
  virtual void do_t2_capture(int *cycles, bool nocount);
  virtual void do_t2_reload(int *cycles, bool nocount);
  virtual int  serial_bit_cnt(int mode);
};


#endif

/* End of s51.src/uc52cl.h */

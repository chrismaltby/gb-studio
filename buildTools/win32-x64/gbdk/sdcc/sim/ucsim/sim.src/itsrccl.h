/*
 * Simulator of microcontrollers (sim.src/itsrccl.h)
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

#ifndef SIM_ITSRCCL_HEADER
#define SIM_ITSRCCL_HEADER

#include "pobjcl.h"
#include "stypes.h"


/*
 * Represents source of interrupt
 */

class cl_it_src: public cl_base
{
public:
  uchar ie_mask;  // Mask in IE register
  uchar src_reg;  // Register in SFR of source
  uchar src_mask; // Mask of source bit in src_reg
  uint  addr;     // Address of service routine
  bool  clr_bit;  // Request bit must be cleared when IT accepted
  char  *name;	  // For debug
  bool  active;   // Acceptance can be disabled

  cl_it_src(uchar Iie_mask,
	    uchar Isrc_reg,
	    uchar Isrc_mask,
	    uint  Iaddr,
	    bool  Iclr_bit,
	    char  *Iname);
  ~cl_it_src(void);

          bool is_active(void);
  virtual void set_active_status(bool Aactive);
  virtual void activate(void);
  virtual void deactivate(void);
};


/*
 * This class is used to follow levels of accepted interrupts
 * It used on a stack of active interrupt services (it_levels of cl_uc)
 */

class it_level: public cl_base
{
public:
  int level;
  uint addr;
  uint PC;
  class cl_it_src *source;
public:
  it_level(int alevel, uint aaddr, uint aPC, class cl_it_src *is);
};


#endif

/* End of itsrccl.h */

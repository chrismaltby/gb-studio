/*
 * Simulator of microcontrollers (avrcl.h)
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

#ifndef AVRCL_HEADER
#define AVRCL_HEADER

#include "uccl.h"


/*
 * Base type of AVR microcontrollers
 */

class cl_avr: public cl_uc
{
public:
  cl_mem *ram;
  cl_mem *rom;
  int sleep_executed;
public:
  cl_avr(class cl_sim *asim);
  virtual int init(void);
  virtual char *id_string(void);

  virtual t_addr get_mem_size(enum mem_class type);
  virtual int get_mem_width(enum mem_class type);
  virtual void mk_hw_elements(void);

  virtual struct dis_entry *dis_tbl(void);
  virtual struct name_entry *sfr_tbl(void);
  virtual struct name_entry *bit_tbl(void);
  virtual char *disass(t_addr addr, char *sep);
  virtual void print_regs(class cl_console *con);

  virtual int exec_inst(void);

  virtual int push_data(t_mem data);
  virtual int push_addr(t_addr addr);
  virtual int pop_data(t_mem *data);
  virtual int pop_addr(t_addr *addr);

  void set_zn0s(t_mem data);
#include "arith_cl.h"
#include "logic_cl.h"
#include "move_cl.h"
#include "bit_cl.h"
#include "jump_cl.h"
#include "instcl.h"
};


#endif

/* End of avr.src/avrcl.h */

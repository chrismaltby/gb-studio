/*
 * Simulator of microcontrollers (sim.src/hwcl.h)
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

/* Abstract hw element. It can be a timer, serial line or whatever */

#ifndef SIM_HWCL_HEADER
#define SIM_HWCL_HEADER

#include "stypes.h"
#include "pobjcl.h"
#include "uccl.h"
#include "guiobjcl.h"

#include "newcmdcl.h"


class cl_hw: public cl_guiobj
{
public:
  int flags;
  class cl_uc *uc;
  enum hw_cath cathegory;
  int id;
  char *id_string;

public:
  cl_hw(class cl_uc *auc, enum hw_cath cath, int aid, char *aid_string);
  ~cl_hw(void);

  virtual void adding(class cl_hw *new_hw) {}
  virtual void added(class cl_hw *new_hw) {}
  virtual t_mem read(class cl_mem *mem, t_addr addr);
  virtual void write(class cl_mem *mem, t_addr addr, t_mem *val);

  virtual int tick(int cycles);
  virtual void print_info(class cl_console *con);
};

class cl_hws: public cl_list
{
public:
  cl_hws(void): cl_list(2, 2) {}
  virtual t_index add(void *item);
};


#endif

/* End of hwcl.h */

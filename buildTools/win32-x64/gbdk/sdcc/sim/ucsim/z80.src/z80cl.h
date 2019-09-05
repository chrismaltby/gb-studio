/*
 * Simulator of microcontrollers (z80cl.h)
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

#ifndef Z80CL_HEADER
#define Z80CL_HEADER

#include "uccl.h"

#include "regsz80.h"


/*
 * Base type of Z80 microcontrollers
 */

class cl_z80: public cl_uc
{
public:
  cl_mem *ram;
  cl_mem *rom;
  struct t_regs regs;
public:
  cl_z80(class cl_sim *asim);
  virtual int init(void);
  virtual char *id_string(void);

  virtual t_addr get_mem_size(enum mem_class type);
  virtual void mk_hw_elements(void);

  virtual struct dis_entry *dis_tbl(void);
  //virtual struct name_entry *sfr_tbl(void);
  //virtual struct name_entry *bit_tbl(void);
  virtual char *disass(t_addr addr, char *sep);
  virtual void print_regs(class cl_console *con);

  virtual int exec_inst(void);
#include "instcl.h"
};


#endif

/* End of z80.src/z80cl.h */

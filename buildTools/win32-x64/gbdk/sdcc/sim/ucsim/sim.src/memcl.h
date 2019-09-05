/*
 * Simulator of microcontrollers (sim.src/memcl.h)
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

#ifndef SIM_MEMCL_HEADER
#define SIM_MEMCL_HEADER

#include "stypes.h"
#include "pobjcl.h"

#include "guiobjcl.h"


class cl_mem;

/* Memory location handled specially by a hw element */

class cl_memloc: public cl_base
{
public:
  t_addr address;
  class cl_list *hws;

public:
  cl_memloc(t_addr addr);
  ~cl_memloc(void);

  virtual ulong read(class cl_mem *mem);
  virtual void write(class cl_mem *mem, t_addr addr, t_mem *val);
};

class cl_memloc_coll: public cl_sorted_list
{
public:
  cl_memloc_coll(void);

  virtual void *key_of(void *item);
  virtual int compare(void *key1, void *key2);

  class cl_memloc *get_loc(t_addr address);
};

/* Memory */

class cl_mem: public cl_guiobj
{
public:
  enum mem_class type;
  char *class_name;
  char *addr_format, *data_format;
  t_addr size;
  ulong mask;
  int width; // in bits
  union {
    void *mem;
    uchar *umem8;
  };
  class cl_memloc_coll *read_locs, *write_locs;
  t_addr dump_finished;

public:
  cl_mem(enum mem_class atype, char *aclass_name, t_addr asize, int awidth);
  ~cl_mem(void);
  virtual int init(void);
  virtual char *id_string(void);

  virtual t_mem read(t_addr addr);
  virtual t_mem get(t_addr addr);
  virtual void write(t_addr addr, t_mem *val);
  virtual void set(t_addr addr, t_mem val);
  virtual void set_bit1(t_addr addr, t_mem bits);
  virtual void set_bit0(t_addr addr, t_mem bits);
  virtual t_mem add(t_addr addr, long what);
  virtual t_addr dump(t_addr start, t_addr stop, int bpl,
		      class cl_console *con);
  virtual t_addr dump(class cl_console *con);
  virtual bool search_next(bool case_sensitive,
			   t_mem *array, int len, t_addr *addr);
};

/* Spec for CODE */

class cl_bitmap: public cl_base
{
public:
  uchar *map;
  int size;
public:
  cl_bitmap(t_addr asize);
  ~cl_bitmap(void);
  virtual void set(t_addr pos);
  virtual void clear(t_addr pos);
  virtual bool get(t_addr pos);
  virtual bool empty(void);
};

class cl_rom: public cl_mem
{
public:
  class cl_bitmap *bp_map;
  class cl_bitmap *inst_map;
public:
  cl_rom(t_addr asize, int awidth);
  ~cl_rom(void);
};

/* New type */

class cl_cell: public cl_base
{
public:
  t_mem data;
protected:
  t_mem mask;

public:
  cl_cell(int awidth);
  virtual t_mem read(void) { return(data); }
  virtual t_mem get(void)  { return(data); }
  virtual void write(t_mem *val) { data= *val= (*val & mask); }
  virtual void set(t_mem val)    { data= val & mask; }
};

class cl_registered_cell: public cl_cell
{
protected:
  class cl_list *hws;
  class cl_hw *hardwares;
  int nuof_hws;
public:
  cl_registered_cell(int awidth);
  ~cl_registered_cell(void);
  virtual t_mem read(void);
  virtual void write(t_mem *val);
};

class cl_m: public cl_mem
{
protected:
  class cl_cell **array;
public:
  t_addr size;
  int width;

public:
  cl_m(t_addr asize, int awidth);
  ~cl_m(void);
  virtual t_mem read(t_addr addr);
  virtual t_mem get(t_addr addr);
  virtual void write(t_addr addr, t_mem *val);
  virtual void set(t_addr addr, t_mem val);
};


#endif

/* End of memcl.h */

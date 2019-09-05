/*
 * Simulator of microcontrollers (mem.cc)
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

#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include "i_string.h"

// prj
#include "utils.h"
#include "globals.h"

// cmd
#include "newcmdcl.h"

// local
#include "memcl.h"
#include "hwcl.h"


/*
 * Memory location handled specially by a hw element
 */

cl_memloc::cl_memloc(t_addr addr):
  cl_base()
{
  address= addr;
  hws= new cl_list(2, 2);
  hws->init();
}

cl_memloc::~cl_memloc(void)
{
  hws->disconn_all();
  delete hws;
}

ulong
cl_memloc::read(class cl_mem *mem)
{
  uchar ret= 0;
  class cl_hw *hw;

  if (!hws ||
      hws->count == 0)
    return(ret);
  if ((hw= (class cl_hw *)(hws->at(0))))
    ret= hw->read(mem, address);
  return(ret);
}

void
cl_memloc::write(class cl_mem *mem, t_addr addr, t_mem *val)
{
  class cl_hw *hw;
  int i;

  if (!hws)
    return;
  for (i= 0; i < hws->count; i++)
    {
      hw= (class cl_hw *)hws->at(0);
      hw->write(mem, addr, val);
    }
}


/* Sorted collection of memory locations */

cl_memloc_coll::cl_memloc_coll(void):
  cl_sorted_list(2, 2)
{
  Duplicates= DD_FALSE;
}

void *
cl_memloc_coll::key_of(void *item)
{
  return(&(((class cl_memloc *)item)->address));
}

int
cl_memloc_coll::compare(void *key1, void *key2)
{
  if (*(long*)key1 > *(long*)key2)
    return(1);
  else
    if (*(long*)key1 < *(long*)key2)
      return(-1);
    else
      return(0);
}

class cl_memloc *
cl_memloc_coll::get_loc(t_addr address)
{
  t_index i;

  if (search(&address, i))
    return((class cl_memloc*)(at(i)));
  return(0);
}


/*
 */

cl_cell::cl_cell(int awidth):
  cl_base()
{
  data= 0;
  mask= 1;
  for (; awidth; awidth--)
    {
      mask<<= 1;
      mask|= 1;
    }
}

/*t_mem
cl_cell::read(void)
{
  return(data);
}*/

/*t_mem
cl_cell::get(void)
{
  return(data);
}*/

/*void
cl_cell::write(t_mem *val)
{
  data= *val= (*val & mask);
}*/

/*void
cl_cell::set(t_mem val)
{
  data= val & mask;
}*/


cl_registered_cell::cl_registered_cell(int awidth):
  cl_cell(awidth)
{
  hws= new cl_list(1, 1);
  hardwares= 0;
  nuof_hws= 0;
}

cl_registered_cell::~cl_registered_cell(void)
{
  hws->disconn_all();
  delete hws;
}

t_mem
cl_registered_cell::read(void)
{
  int i;

  /*if (hws->count)
    for (i= 0; i < hws->count; i++)
      {
	class cl_hw *hw= (class cl_hw *)(hws->at(i));
	;
	}*/
  if (nuof_hws)
    for (i= 0; i < nuof_hws; i++)
      {
	//hardwares[i];
	;
      }
  return(data);
}

void
cl_registered_cell::write(t_mem *val)
{
  int i;

  /*if (hws->count)
    for (i= 0; i < hws->count; i++)
      {
	class cl_hw *hw= (class cl_hw *)(hws->at(i));
	;
	}*/
  if (nuof_hws)
    for (i= 0; i < nuof_hws; i++)
      {
	//hardwares[i];
	;
      }
  data= *val= (*val & mask);
}


/* 
 */

cl_m::cl_m(t_addr asize, int awidth):
  cl_mem(MEM_SFR, "sfr", 0, awidth)
{
  t_addr a;

  size= asize;
  width= awidth;
  array= (class cl_cell **)malloc(size * sizeof(class cl_cell *));
  for (a= 0; a < size; a++)
    array[a]= new cl_registered_cell(width);
}

cl_m::~cl_m(void)
{
  t_addr a;

  for (a= 0; a < size; a++)
    delete array[a];
  free(array);
}

t_mem
cl_m::read(t_addr addr)
{
  if (addr >= size)
    return(0);
  return(array[addr]->read());
}

t_mem
cl_m::get(t_addr addr)
{
  if (addr >= size)
    return(0);
  return(array[addr]->get());
}

void
cl_m::write(t_addr addr, t_mem *val)
{
  if (addr >= size)
    return;
  array[addr]->write(val);
}

void
cl_m::set(t_addr addr, t_mem val)
{
  if (addr >= size)
    return;
  array[addr]->set(val);
}


/*
 * Memory
 ******************************************************************************
 */

cl_mem::cl_mem(enum mem_class atype, char *aclass_name,
	       t_addr asize, int awidth):
  cl_guiobj()
{
  int i;

  type= atype;
  class_name= aclass_name;
  width= awidth;
  size= asize;
  mem= 0;
  for (i= width, mask= 0; i; i--)
    mask= (mask<<1) | 1;
  if (width <= 8)
    mem= (TYPE_UBYTE *)malloc(size);
  else if (width <= 16)
    mem= (TYPE_UWORD *)malloc(size*sizeof(TYPE_WORD));
  else
    mem= (TYPE_UDWORD *)malloc(size*sizeof(TYPE_DWORD));
  read_locs= new cl_memloc_coll();
  write_locs= new cl_memloc_coll();
  dump_finished= 0;
  addr_format= (char *)malloc(10);
  sprintf(addr_format, "0x%%0%dx",
	  size-1<=0xf?1:
	  (size-1<=0xff?2:
	   (size-1<=0xfff?3:
	    (size-1<=0xffff?4:
	     (size-1<=0xfffff?5:
	      (size-1<=0xffffff?6:12))))));
  data_format= (char *)malloc(10);
  sprintf(data_format, "%%0%dx", width/4+((width%4)?1:0));
}

cl_mem::~cl_mem(void)
{
  if (mem)
    free(mem);
  if (addr_format)
    free(addr_format);
  if (data_format)
    free(data_format);
  delete read_locs;
  delete write_locs;
}

int
cl_mem::init(void)
{
  t_addr i;

  for (i= 0; i < size; i++)
    set(i, (type==MEM_ROM)?(-1):0);
  return(0);
}

char *
cl_mem::id_string(void)
{
  char *s= get_id_string(mem_ids, type);

  return(s?s:(char*)"NONE");
}

t_mem
cl_mem::read(t_addr addr)
{
  class cl_memloc *loc;

  if (addr >= size)
    {
      //FIXME
      fprintf(stderr, "Address 0x%06lx is over 0x%06lx\n", addr, size);
      return(0);
    }
  if ((loc= read_locs->get_loc(addr)))
    return(loc->read(this));
  if (width <= 8)
    return((((TYPE_UBYTE*)mem)[addr])&mask);
  else if (width <= 16)
    return((((TYPE_UWORD*)mem)[addr])&mask);
  else
    return((((TYPE_UDWORD*)mem)[addr])&mask);
}

t_mem
cl_mem::get(t_addr addr)
{
  if (addr >= size)
    return(0);
  if (width <= 8)
    return((((TYPE_UBYTE*)mem)[addr])&mask);
  else if (width <= 16)
    return((((TYPE_UWORD*)mem)[addr])&mask);
  else
    return((((TYPE_UDWORD*)mem)[addr])&mask);
}


/*
 * Modify memory location
 */

/* Write calls callbacks of HW elements */

void
cl_mem::write(t_addr addr, t_mem *val)
{
  class cl_memloc *loc;

  if (addr >= size)
    return;
  if ((loc= write_locs->get_loc(addr)))
    loc->write(this, addr, val);
  if (width <= 8)
    ((TYPE_UBYTE*)mem)[addr]= (*val)&mask;
  else if (width <= 16)
    ((TYPE_UWORD*)mem)[addr]= (*val)&mask;
  else
    ((TYPE_UDWORD*)mem)[addr]= (*val)&mask;
}

/* Set doesn't call callbacks */

void
cl_mem::set(t_addr addr, t_mem val)
{
  if (addr >= size)
    return;
  if (width <= 8)
    ((TYPE_UBYTE*)mem)[addr]= val&mask;
  else if (width <= 16)
    ((TYPE_UWORD*)mem)[addr]= val&mask;
  else
    ((TYPE_UDWORD*)mem)[addr]= val&mask;
}

/* Set or clear bits, without callbacks */

void
cl_mem::set_bit1(t_addr addr, t_mem bits)
{
  if (addr >= size)
    return;
  bits&= mask;
  if (width <= 8)
    ((TYPE_UBYTE*)mem)[addr]|= bits;
  else if (width <= 16)
    ((TYPE_UWORD*)mem)[addr]|= bits;
  else
    ((TYPE_UDWORD*)mem)[addr]|= bits;
}

void
cl_mem::set_bit0(t_addr addr, t_mem bits)
{
  if (addr >= size)
    return;
  bits&= mask;
  if (width <= 8)
    ((TYPE_UBYTE*)mem)[addr]&= ~bits;
  else if (width <= 16)
    ((TYPE_UWORD*)mem)[addr]&= ~bits;
  else
    ((TYPE_UDWORD*)mem)[addr]&= ~bits;
}

t_mem
cl_mem::add(t_addr addr, long what)
{
  if (addr >= size)
    return(0);
  if (width <= 8)
    {
      ((TYPE_UBYTE*)mem)[addr]= ((TYPE_UBYTE*)mem)[addr] + what;
      return(((TYPE_UBYTE*)mem)[addr]);
    }
  else if (width <= 16)
    {
      ((TYPE_UWORD*)mem)[addr]= ((TYPE_UWORD*)mem)[addr] + what;
      return(((TYPE_UWORD*)mem)[addr]);
    }
  else
    {
      ((TYPE_UDWORD*)mem)[addr]= ((TYPE_UDWORD*)mem)[addr] + what;
      return(((TYPE_UDWORD*)mem)[addr]);
    }
}

t_addr
cl_mem::dump(t_addr start, t_addr stop, int bpl, class cl_console *con)
{
  int i;

  while ((start <= stop) &&
	 (start < size))
    {
      con->printf(addr_format, start); con->printf(" ");
      for (i= 0;
	   (i < bpl) &&
	     (start+i < size) &&
	     (start+i <= stop);
	   i++)
	{
	  con->printf(data_format, read(start+i)); con->printf(" ");
	}
      while (i < bpl)
	{
	  int j;
	  j= width/4 + ((width%4)?1:0) + 1;
	  while (j)
	    {
	      con->printf(" ");
	      j--;
	    }
	  i++;
	}
      for (i= 0; (i < bpl) &&
	     (start+i < size) &&
	     (start+i <= stop);
	   i++)
	{
	  long c= get(start+i);
	  con->printf("%c", isprint(255&c)?(255&c):'.');
	  if (width > 8)
	    con->printf("%c", isprint(255&(c>>8))?(255&(c>>8)):'.');
	  if (width > 16)
	    con->printf("%c", isprint(255&(c>>16))?(255&(c>>16)):'.');
	  if (width > 24)
	    con->printf("%c", isprint(255&(c>>24))?(255&(c>>24)):'.');
	}
      con->printf("\n");
      dump_finished= start+i;
      start+= bpl;
    }
  return(dump_finished);
}

t_addr
cl_mem::dump(class cl_console *con)
{
  return(dump(dump_finished, dump_finished+10*8-1, 8, con));
}

bool
cl_mem::search_next(bool case_sensitive, t_mem *array, int len, t_addr *addr)
{
  t_addr a;
  int i;
  bool found;

  if (addr == NULL)
    a= 0;
  else
    a= *addr;
  
  if (a+len > size)
    return(DD_FALSE);

  found= DD_FALSE;
  while (!found &&
	 a+len <= size)
    {
      bool match= DD_TRUE;
      for (i= 0; i < len && match; i++)
	{
	  t_mem d1, d2;
	  d1= get(a+i);
	  d2= array[i];
	  if (!case_sensitive)
	    {
	      if (/*d1 < 128*/isalpha(d1))
		d1= toupper(d1);
	      if (/*d2 < 128*/isalpha(d2))
		d2= toupper(d2);
	    }
	  match= d1 == d2;
	}
      found= match;
      if (!found)
	a++;
    }

  if (addr)
    *addr= a;
  return(found);
}


/*
 * Bitmap
 */

cl_bitmap::cl_bitmap(t_addr asize):
  cl_base()
{
  map= (uchar*)malloc(size= asize/(8*SIZEOF_CHAR));
  memset(map, 0, size);
}

cl_bitmap::~cl_bitmap(void)
{
  free(map);
}

void
cl_bitmap::set(t_addr pos)
{
  int i;

  if ((i= pos/(8*SIZEOF_CHAR)) < size)
    map[i]|= (1 << (pos & ((8*SIZEOF_CHAR)-1)));
}

void
cl_bitmap::clear(t_addr pos)
{
  int i;

  if ((i= pos/(8*SIZEOF_CHAR)) < size)
    map[i]&= ~(1 << (pos & ((8*SIZEOF_CHAR)-1)));
}

bool
cl_bitmap::get(t_addr pos)
{
  return(map[pos/(8*SIZEOF_CHAR)] & (1 << (pos & ((8*SIZEOF_CHAR)-1))));
}

bool
cl_bitmap::empty(void)
{
  int i;

  for (i= 0; i < size && map[i] == 0; i++) ;
  return(i == size);
}

/*
 * Special memory for code (ROM)
 */

cl_rom::cl_rom(t_addr asize, int awidth):
  cl_mem(MEM_ROM, get_id_string(mem_classes, MEM_ROM), asize, awidth)
{
  bp_map= new cl_bitmap(asize);
  inst_map= new cl_bitmap(asize);
}

cl_rom::~cl_rom(void)
{
  delete bp_map;
  delete inst_map;
}


/* End of mem.cc */

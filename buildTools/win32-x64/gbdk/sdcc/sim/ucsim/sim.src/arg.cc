/*
 * Simulator of microcontrollers (arg.cc)
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

#include "ddconfig.h"

#include <stdio.h>
#include <stdlib.h>
#include "i_string.h"

// prj
#include "globals.h"

// sim
#include "simcl.h"

// cmd
#include "cmdutil.h"

// local
#include "argcl.h"


/*
 * Making the argument
 */

cl_arg::cl_arg(long lv):
  cl_base()
{
  i_value= lv;
  s_value= 0;
}

cl_arg::cl_arg(char *sv):
  cl_base()
{
  s_value= sv?strdup(sv):0;
}

cl_arg::cl_arg(double fv):
  cl_base()
{
  f_value= fv;
  s_value= 0;
}

cl_arg::cl_arg(void *pv):
  cl_base()
{
  p_value= pv;
  s_value= 0;
}

cl_arg::~cl_arg(void)
{
  if (s_value)
    free(s_value);
}


/*
 * Getting value of the argument
 */

bool
cl_arg::get_ivalue(long *value)
{
  if (value)
    *value= i_value;
  return(DD_TRUE);
}

char *
cl_arg::get_svalue(void)
{
  return(s_value);
}

double
cl_arg::get_fvalue(void)
{
  return(f_value);
}

void *
cl_arg::get_pvalue(void)
{
  return(p_value);
}


/*
 * Command parameters
 *----------------------------------------------------------------------------
 */

cl_cmd_arg::~cl_cmd_arg(void)
{
  if (interpreted_as_string)
    {
      if (value.string.string)
	free(value.string.string);
    }
}

bool
cl_cmd_arg::as_address(class cl_uc *uc)
{
  return(get_address(uc, &(value.address)));    
}

bool
cl_cmd_arg::as_number(void)
{
  return(get_ivalue(&(value.number)));
}

bool
cl_cmd_arg::as_data(void)
{
  long l;
  bool ret= get_ivalue(&l);
  value.data= l;
  return(ret);
}

bool
cl_cmd_arg::as_memory(class cl_uc *uc)
{
  value.memory= uc->mem(s_value);
  return(value.memory != 0);
}

bool
cl_cmd_arg::as_hw(class cl_uc *uc)
{
  return(DD_FALSE);
}

bool
cl_cmd_arg::as_string(void)
{
  char *s= get_svalue();
  if (!s)
    return(DD_FALSE);
  if (is_string())
    value.string.string= proc_escape(s, &value.string.len);
  else
    {
      value.string.string= strdup(s);
      value.string.len= strlen(s);
    }
  return(interpreted_as_string= value.string.string != NULL);
}

bool
cl_cmd_arg::as_bit(class cl_uc *uc)
{
  return(get_bit_address(uc,
			 &(value.bit.mem),
			 &(value.bit.mem_address),
			 &(value.bit.mask)));
}


/* Interger number */

cl_cmd_int_arg::cl_cmd_int_arg(/*class cl_uc *iuc,*/ long addr):
  cl_cmd_arg(/*iuc,*/ addr)
{}

bool
cl_cmd_int_arg::get_address(class cl_uc *uc, t_addr *addr)
{
  long iv;

  bool b= get_ivalue(&iv);
  if (addr)
    *addr= iv;
  return(b);
}

bool
cl_cmd_int_arg::get_bit_address(class cl_uc *uc, // input
				class cl_mem **mem, // outputs
				t_addr *mem_addr,
				t_mem *bit_mask)
{
  t_addr bit_addr;

  if (!get_address(uc, &bit_addr))
    return(DD_FALSE);
  return(uc->extract_bit_address(bit_addr, mem, mem_addr, bit_mask));
}

bool
cl_cmd_int_arg::as_string(void)
{
  value.string.string= (char*)malloc(100);
  sprintf(value.string.string, "%ld", i_value);
  value.string.len= strlen(value.string.string);
  return(interpreted_as_string= value.string.string != NULL);
}


/* Symbol */

cl_cmd_sym_arg::cl_cmd_sym_arg(/*class cl_uc *iuc,*/ char *sym):
  cl_cmd_arg(/*iuc,*/ sym)
{}

bool
cl_cmd_sym_arg::as_string(void)
{
  char *s= get_svalue();
  if (!s)
    return(DD_FALSE);
  value.string.string= strdup(s);
  value.string.len= strlen(s);
  return(interpreted_as_string= value.string.string != NULL);
}

bool
cl_cmd_sym_arg::get_address(class cl_uc *uc, t_addr *addr)
{
  struct name_entry *ne;

  if ((ne= get_name_entry(uc->sfr_tbl(),
			  get_svalue(),
			  uc)) != NULL)
    {
      if (addr)
	*addr= ne->addr;
      return(1);
    }
  return(0);
}

bool
cl_cmd_sym_arg::get_bit_address(class cl_uc *uc, // input
				class cl_mem **mem, // outputs
				t_addr *mem_addr,
				t_mem *bit_mask)
{
  struct name_entry *ne;

  if ((ne= get_name_entry(uc->bit_tbl(),
			  get_svalue(),
			  uc)) == NULL)
    return(DD_FALSE);
  return(uc->extract_bit_address(ne->addr, mem, mem_addr, bit_mask));
}

bool
cl_cmd_sym_arg::as_address(class cl_uc *uc)
{
  struct name_entry *ne;
  //printf("SYM %s as addr?\n",get_svalue());
  if ((ne= get_name_entry(uc->sfr_tbl(), get_svalue(), uc)) != NULL)
    {
      value.address= ne->addr;
      return(DD_TRUE);
    }
  return(DD_FALSE);
}

bool
cl_cmd_sym_arg::as_hw(class cl_uc *uc)
{
  cl_hw *hw, *found;
  int i= 0;

  hw= found= uc->get_hw(get_svalue(), &i);
  if (!hw)
    return(DD_FALSE);
  i++;
  found= uc->get_hw(get_svalue(), &i);
  if (found)
    return(DD_FALSE);
  value.hw= hw;
  return(DD_TRUE);
}


/* String */

cl_cmd_str_arg::cl_cmd_str_arg(/*class cl_uc *iuc,*/ char *str):
  cl_cmd_arg(/*iuc,*/ str)
{}


/* Bit */

cl_cmd_bit_arg::cl_cmd_bit_arg(/*class cl_uc *iuc,*/
			       class cl_cmd_arg *asfr, class cl_cmd_arg *abit):
  cl_cmd_arg(/*iuc,*/ (long)0)
{
  sfr= asfr;
  bit= abit;
}

cl_cmd_bit_arg::~cl_cmd_bit_arg(void)
{
  if (sfr)
    delete sfr;
  if (bit)
    delete bit;
}

bool
cl_cmd_bit_arg::get_address(class cl_uc *uc, t_addr *addr)
{
  if (sfr)
    return(sfr->get_address(uc, addr));
  return(0);
}

bool
cl_cmd_bit_arg::get_bit_address(class cl_uc *uc, // input
				class cl_mem **mem, // outputs
				t_addr *mem_addr,
				t_mem *bit_mask)
{
  if (mem)
    *mem= uc->mem(MEM_SFR);
  if (mem_addr)
    {
      if (!sfr ||
	  !sfr->get_address(uc, mem_addr))
	return(DD_FALSE);
    }
  if (bit_mask)
    {
      if (!bit)
	return(DD_FALSE);
      long l;
      if (!bit->get_ivalue(&l) ||
	  l > 7)
	return(DD_FALSE);
      *bit_mask= 1 << l;
    }
  return(DD_TRUE);
}


/* Array */

cl_cmd_array_arg::cl_cmd_array_arg(/*class cl_uc *iuc,*/
				   class cl_cmd_arg *aname,
				   class cl_cmd_arg *aindex):
  cl_cmd_arg(/*iuc,*/ (long)0)
{
  name = aname;
  index= aindex;
}

cl_cmd_array_arg::~cl_cmd_array_arg(void)
{
  if (name)
    delete name;
  if (index)
    delete index;
}

bool
cl_cmd_array_arg::as_hw(class cl_uc *uc)
{
  char *n;
  t_addr a;

  if (name == 0 ||
      index == 0 ||
      (n= name->get_svalue()) == NULL ||
      !index->get_address(uc, &a))
    return(DD_FALSE);
  
  value.hw= uc->get_hw(n, a, NULL);
  return(value.hw != NULL);
}


/*
 * Program arguments
 *----------------------------------------------------------------------------
 */

cl_prg_arg::cl_prg_arg(char sn, char *ln, long lv):
  cl_arg(lv)
{
  short_name= sn;
  long_name = ln?strdup(ln):0;
}

cl_prg_arg::cl_prg_arg(char sn, char *ln, char *sv):
  cl_arg(sv)
{
  short_name= sn;
  long_name = ln?strdup(ln):0;
}

cl_prg_arg::cl_prg_arg(char sn, char *ln, double fv):
  cl_arg(fv)
{
  short_name= sn;
  long_name = ln?strdup(ln):0;
}

cl_prg_arg::cl_prg_arg(char sn, char *ln, void *pv):
  cl_arg(pv)
{
  short_name= sn;
  long_name = ln?strdup(ln):0;
}

cl_prg_arg::~cl_prg_arg(void)
{
  if (long_name)
    free(long_name);
}


/*
 * List of arguments
 *----------------------------------------------------------------------------
 */

int
cl_arguments::arg_avail(char name)
{
  class cl_prg_arg *a;
  int i;

  for (i= 0; i < count; i++)
    {
      a= (class cl_prg_arg *)(at(i));
      if (a->short_name == name)
	return(1);
    }
  return(0);
}

int
cl_arguments::arg_avail(char *name)
{
  class cl_prg_arg *a;
  int i;

  for (i= 0; i < count; i++)
    {
      a= (class cl_prg_arg *)(at(i));
      if (a->long_name &&
	  strcmp(a->long_name, name) == 0)
	return(1);
    }
  return(0);
}

long
cl_arguments::get_iarg(char sname, char *lname)
{
  class cl_prg_arg *a;
  int i;

  for (i= 0; i < count; i++)
    {
      a= (class cl_prg_arg *)(at(i));
      if ((sname && a->short_name == sname) ||
	  (lname && a->long_name && strcmp(a->long_name, lname) == 0))
	{
	  long iv;
	  if (a->get_ivalue(&iv))
	    return(iv);
	  else
	    //FIXME
	    return(0);
	}
    }
  return(0);
}

char *
cl_arguments::get_sarg(char sname, char *lname)
{
  class cl_prg_arg *a;
  int i;

  for (i= 0; i < count; i++)
    {
      a= (class cl_prg_arg *)(at(i));
      if ((sname && a->short_name == sname) ||
	  (lname && a->long_name && strcmp(a->long_name, lname) == 0))
	return(a->get_svalue());
    }
  return(0);
}


double
cl_arguments::get_farg(char sname, char *lname)
{
  class cl_prg_arg *a;
  int i;

  for (i= 0; i < count; i++)
    {
      a= (class cl_prg_arg *)(at(i));
      if ((sname && a->short_name == sname) ||
	  (lname && a->long_name && strcmp(a->long_name, lname) == 0))
	return(a->get_fvalue());
    }
  return(0);
}

void *
cl_arguments::get_parg(char sname, char *lname)
{
  class cl_prg_arg *a;
  int i;

  for (i= 0; i < count; i++)
    {
      a= (class cl_prg_arg *)(at(i));
      if ((sname && a->short_name == sname) ||
	  (lname && a->long_name && strcmp(a->long_name, lname) == 0))
	return(a->get_pvalue());
    }
  return(0);
}


/* End of arg.cc */

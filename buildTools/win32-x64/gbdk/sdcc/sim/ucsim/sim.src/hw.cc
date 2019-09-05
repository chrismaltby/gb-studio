/*
 * Simulator of microcontrollers (hw.cc)
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

#include <stdlib.h>
#include "i_string.h"

#include "stypes.h"
#include "hwcl.h"


cl_hw::cl_hw(class cl_uc *auc, enum hw_cath cath, int aid, char *aid_string):
  cl_guiobj()
{
  flags= HWF_INSIDE;
  uc= auc;
  cathegory= cath;
  id= aid;
  if (aid_string &&
      *aid_string)
    id_string= strdup(aid_string);
  else
    id_string= strdup("unknown hw element");
}

cl_hw::~cl_hw(void)
{
  free(id_string);
}


/*
 * Callback functions for changing memory locations
 */

t_mem
cl_hw::read(class cl_mem *mem, t_addr addr)
{
  // Simply return the value
  return(mem->get(addr));
}

void
cl_hw::write(class cl_mem *mem, t_addr addr, t_mem *val)
{
  // Do not change *val by default
}


/*
 * Simulating `cycles' number of machine cycle
 */

int
cl_hw::tick(int cycles)
{
  return(0);
}

void
cl_hw::print_info(class cl_console *con)
{
  con->printf("%s[%d]\n", id_string, id);
}


t_index
cl_hws::add(void *item)
{
  int i;
  t_index res;

  // pre-add
  for (i= 0; i < count; i++)
    {
      class cl_hw *hw= (class cl_hw *)(at(i));
      hw->adding((class cl_hw *)item);
    }
  // add
  res= cl_list::add(item);
  // post-add
  for (i= 0; i < count; i++)
    {
      class cl_hw *hw= (class cl_hw *)(at(i));
      hw->added((class cl_hw *)item);
    }
  return(res);
}


/* End of hw.cc */

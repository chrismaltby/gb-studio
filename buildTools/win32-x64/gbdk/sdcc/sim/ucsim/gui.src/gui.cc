/*
 * Simulator of microcontrollers (gui.cc)
 *
 * Copyright (C) 2001,01 Drotos Daniel, Talker Bt.
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

#include "guicl.h"


cl_gui::cl_gui(class cl_sim *asim):
  cl_base()
{
  sim= asim;
  ifs= new cl_list(2, 2);
}

cl_gui::~cl_gui(void)
{
  delete ifs;
}

class cl_gui_if *
cl_gui::if_by_obj(class cl_guiobj *o)
{
  int i;

  for (i= 0; i < ifs->count; i++)
    {
      class cl_gui_if *gi= (class cl_gui_if *)(ifs->at(i));
      if (gi->obj &&
	  gi->obj == o)
	return(gi);
    }
  return(0);
}


/* End of gui.src/gui.cc */

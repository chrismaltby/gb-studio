/*
 * Simulator of microcontrollers (guiifcl.h)
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

#ifndef GUISRC_IFCL_HEADER
#define GUISRC_IFCL_HEADER

#include "ddconfig.h"

// prj
#include "pobjcl.h"

// sim
#include "guiobjcl.h"


class cl_gui_if: public cl_base
{
public:
  class cl_guiobj *obj;		// Object inspected by the GUI tool
public:
  cl_gui_if(class cl_guiobj *o);
};


#endif

/* End of gui.src/ifcl.h */

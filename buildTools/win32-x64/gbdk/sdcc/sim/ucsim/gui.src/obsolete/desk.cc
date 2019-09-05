/*
 * Simulator of microcontrollers (desk.cc)
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

#include "deskcl.h"
#include "bgcl.h"


int
cl_desk::handle_event(struct t_event *event)
{
  if (cl_group::handle_event(event))
    return(1);
  if (event->what == EV_KEY &&
      event->event.key == KEY_F(6))
    {
      select_next();
      return(1);
    }
  return(0);
}

int
cl_desk::mk_views(class cl_group *ins_to)
{
  class cl_box b(*pos);

  b.move_rel(0,1);
  b.grow(0,-2);
  insert(new cl_bg(&b, "background", app));
  return(0);
}


/* End of gui.src/desk.cc */

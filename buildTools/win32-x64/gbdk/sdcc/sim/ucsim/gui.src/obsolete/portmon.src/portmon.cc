/*
 * Simulator of microcontrollers (portmon.cc)
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

#include <curses.h>

#include "pmappcl.h"


class cl_pmapp *app;

void xx(class cl_view *v)
{
  fprintf(stderr,"%s 0x%x ", v->name, v->state);
}

int
main(int argc, char *argv)
{
  app= new cl_pmapp("portmon");
  app->init();
  {
    class cl_view *v= app;
    while (v)
      {
	if (v->is_group())
	  {
	    class cl_group *g= (class cl_group *)v;
	    fprintf(stderr, "%s->%s\n", g->name,(g->current)?(g->current->name):"none");
	    g->for_each(xx);
	    fprintf(stderr, "\n");
	    v= g->current;
	  }
	else
	  v= 0;
      }
  }
  app->run();
  //getch();
  delete app;
  return(0);
}


/* End of gui.src/portmon.src/portmon.cc */

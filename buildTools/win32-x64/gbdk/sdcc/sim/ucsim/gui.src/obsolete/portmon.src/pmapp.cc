/*
 * Simulator of microcontrollers (pmapp.cc)
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

#include "wincl.h"
#include "labelcl.h"

#include "pmappcl.h"
#include "portcl.h"


int
cl_pmapp::mk_views(class cl_group *ins_to)
{
  class cl_view *v;
  //class cl_win *w;
  class cl_box *b;
  
  b= new cl_box(0,0,0,0);

  if (!ins_to)
    return(0);
  
  b->set(43,2,14,13);
  v= new cl_portw(b, 3, "Port #3", this);
  v->init();
  ins_to->insert(v);
    
  b->set(29,2,14,13);
  v= new cl_portw(b, 2, "Port #2", this);
  v->init();
  ins_to->insert(v);
  /*
  b->set(15,2,14,13);
  ins_to->insert(v= new cl_portw(b, 1, "Port #1", this));
  v->init();

  b->set(1,2,14,13);
  ins_to->insert(v= new cl_portw(b, 0, "Port #0", this));
  v->init();

  b->set(59,3,19,11);
  v= new cl_label(b, this,
"Next win: n,TAB\nPrev win: p\nCursor  : u,d,l,r,\n          arrows\nToggle  : space,CR\nQuit    : q");
  v->init();
  b->move_rel(-1,-1);
  b->grow(2,2);
  
  b->set(58,2,21,13);
  w= new cl_win(b, "Help", this);
  w->options&= ~OF_SELECTABLE;
  w->init();
  w->insert(v);
  ins_to->insert(w);
  w->draw();
  */
  delete b;

  return(0);
}

int *
cl_pmapp::mk_palette(void)
{
  return(cl_app::mk_palette());
}

int
cl_pmapp::handle_event(struct t_event *event)
{
  if (event->what == EV_KEY)
    switch (event->event.key)
      {
      case 'q':
	event->what= EV_COMMAND;
	event->event.msg.cmd= CMD_QUIT;
	return(0);
      case 'p':
	desk->select_prev();
	return(1);
      case 'n': case '\t':
	desk->select_next();
	return(1);
	
      }
  return(cl_app::handle_event(event));
}


/* End of gui.src/portmon.src/pmapp.cc */

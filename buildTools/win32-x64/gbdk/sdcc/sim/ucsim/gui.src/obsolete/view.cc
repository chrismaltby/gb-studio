/*
 * Simulator of microcontrollers (view.cc)
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

#include "appcl.h"


/*
 * Box
 */

cl_box::cl_box(int ix, int iy, int iw, int ih):
  cl_base()
{
  x= ix;
  y= iy;
  w= iw;
  h= ih;
}

void
cl_box::set(int ix, int iy, int iw, int ih)
{
  x= ix;
  y= iy;
  w= iw;
  h= ih;
}

void
cl_box::move_rel(int dx, int dy)
{
  x+= dx;
  y+= dy;
}

void
cl_box::grow(int dw, int dh)
{
  w+= dw;
  h+= dh;
}


/*
 * Astbract of a viewer
 ******************************************************************************
 */

cl_view::cl_view(class cl_box *ipos, char *iname, class cl_app *iapp):
  cl_base()
{
  pos= new cl_box(ipos->x,ipos->y, ipos->w,ipos->h);
  if ((window= newwin(pos->h,pos->w, pos->y,pos->x)))
    {
      leaveok(window, TRUE);
      panel= new_panel(window);
    }
  else
    {
      panel= 0;
      delwin(window);
      window= 0;
    }
  parent= 0;
  next= last= 0;
  app= iapp;
  state= SF_NOTHING;
  options= OF_SELECTABLE;
  if (!iname ||
      !(*iname))
    {
      name= (char*)malloc(100);
      sprintf(name, "view%p", this);
    }
  else
    name= strdup(iname);
}

cl_view::cl_view(char *iname, class cl_app *iapp):
  cl_base()
{
  window= 0;
  panel= 0;
  parent= 0;
  next= last= 0;
  app= iapp;
  state= SF_NOTHING;
  options= OF_SELECTABLE;
  if (!iname ||
      !(*iname))
    {
      name= (char*)malloc(100);
      sprintf(name, "view%p", this);
    }
  else
    name= strdup(iname);
}

cl_view::~cl_view(void)
{
  if (panel)
    del_panel(panel);
  if (window)
    delwin(window);
  if (palette)
    free(palette);
  if (name)
    free(name);
}

int
cl_view::init(void)
{
  input= mk_input();
  palette= mk_palette();
  //draw();
  return(0);
}

class cl_gin *
cl_view::mk_input(void)
{
  return(0);
}

int *
cl_view::mk_palette(void)
{
  return(0);
}

int
cl_view::ok(void)
{
  return(window && panel);
}


/*
 * Make output into the view
 */

int
cl_view::draw(void)
{
  int color, x, y;

  color= get_color(palette?0:C_WIN_NORMAL);
  
  wattrset(window, color);
  for (y= 0; y < pos->h; y++)
    for (x= 0; x < pos->w; x++)
      mvwaddch(window, y,x, ' ');
  app->drawn++;

  return(0);
}

int
cl_view::update(void)
{
  draw();
  update_panels();
  doupdate();
  return(0);
}

int
cl_view::get_color(int color)
{
  int *p;
  class cl_view *v;

  v= this;
  while (v)
    {
      p= v->get_palette();
      if (p)
	color= p[color];
      v= v->parent;
    }
  return(color);
}

int *
cl_view::get_palette(void)
{
  return(palette);
}


/*
 * Event handling
 */

int
cl_view::get_event(struct t_event *event)
{
  if (parent)
    return(parent->get_event(event));
  if (input)
    return(input->get_event(event));
  return(0);
}

int
cl_view::handle_event(struct t_event *event)
{
  return(0);
}

int
cl_view::unhandled(struct t_event *event)
{
  return(0);
}

int
cl_view::mk_event(struct t_event *event, FILE *f, int key)
{
  event->what= EV_KEY;
  event->event.key= key;
  return(1);
}


class cl_view *
cl_view::prev(void)
{
  class cl_view *v;

  v= next;
  while (v != this)
    v= v->next;
  return(v);
}

class cl_view *
cl_view::prev_view(void)
{
  if (parent &&
      parent->first() == this)
    return(0);
  else
    return(prev());    
}


int
cl_view::select(void)
{
  /*  class cl_view *v;

  if (!(options & OF_SELECTABLE))
    return(0);
  if (state & SF_SELECTED)
    return(1);
  if (parent &&
      !(parent->select()))
    return(0);
  if (parent)
    {
      v= parent->current_sub_view();
      if (v &&
	  v != this)
	v->unselect();
      parent->set_current(this);
    }
  change_state(SF_FOCUSED, 1);
  change_state(SF_SELECTED, 1);
  draw();
  return(1);*/
  if (options & OF_SELECTABLE)
    if (parent)
      parent->set_current(this);
  return(1);
}

int
cl_view::unselect(void)
{
  class cl_view *csv= current_sub_view();
  if (csv &&
      !(csv->unselect()))
    return(0);
  if (!terminal_view())
    change_state(SF_FOCUSED, 0);
  change_state(SF_SELECTED, 0);
  draw();
  return(1);
}

class cl_view *
cl_view::current_sub_view(void)
{
  return(0);
}

int
cl_view::terminal_view(void)
{
  return(1);
}

void
cl_view::change_state(unsigned int what, int enable)
{
  if (enable)
    state|= what;
  else
    state&= ~what;
  if (parent)
    {
      switch (what)
	{
	case SF_FOCUSED:
	  //reset_cursor();
	  /*message(parent, EV_BROADCAST,
	    (enable)?CM_RECEIVED_FOCUS:CM_RELEASED_FOCUS, this);*/
	  break;
	}
    }
  draw();
}


/* End of gui.src/view.cc */

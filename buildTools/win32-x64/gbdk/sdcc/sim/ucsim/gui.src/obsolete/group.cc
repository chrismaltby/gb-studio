/*
 * Simulator of microcontrollers (group.cc)
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

#include "groupcl.h"
#include "appcl.h"


cl_group::cl_group(class cl_box *ipos, char *iname, class cl_app *iapp):
  cl_view(ipos, iname, iapp)
{
  current= 0;
}

cl_group::cl_group(char *iname, class cl_app *iapp):
  cl_view(iname, iapp)
{
  current= 0;
}

cl_group::~cl_group(void)
{}

int
cl_group::init(void)
{
  cl_view::init();
  mk_views(this);
  return(0);
}

int
cl_group::mk_views(class cl_group *ins_to)
{
  return(0);
}


/*
 * Make output by drawing all subviews
 */

static void do_draw_view(class cl_view *view)
{
  view->draw();
}

int
cl_group::draw(void)
{
  /*int i;

  for (i= 0; i < views->count; i++)
    {
      class cl_view *v= (class cl_view *)(views->at(i));
      v->draw();
      app->drawn++;
      }*/
  for_each(do_draw_view);
  return(0);
}

/*int
cl_group::update(void)
{
  draw();
  update_panels();
  doupdate();
}*/


int
cl_group::handle_event(struct t_event *event)
{
  int handled= 0;

  if (event->what & (EV_KEY|EV_COMMAND))
    {
      if (current)
	handled= current->handle_event(event);
    }
  else if (event->what & EV_MESSAGE)
    {
      class cl_view *v= last;
      do 
	{
	  handled= v->handle_event(event);
	  v= v->next;
	}
      while (! handled &&
	     v != last);
    }
  return(handled);
}


/*
 * Managing views
 */

//class cl_view *
void
cl_group::insert(class cl_view *view)
{
  /*if (view &&
      view->ok())
    {
      views->add_at(0, view);
      view->parent= this;
      view->select();
      //view->draw();
      return(view);
      }
      return(0);*/
  insert_before(view, first());
  if (view->options & OF_SELECTABLE)
    view->select();
  draw();
}

void
cl_group::insert_before(class cl_view *view, class cl_view *target)
{
  unsigned int ss;

  if (view &&
      !(view->parent) &&
      (!target ||
       target->parent == this))
    {
      ss= view->state;
      //view->hide();
      insert_view(view, target);
      /*if (ss & SF_VISIBLE)
	view->show();*/
      if (state & SF_ACTIVE)
	view->change_state(SF_ACTIVE, 1);
    }
}

void
cl_group::insert_view(class cl_view *view, class cl_view *target)
{
  view->parent= this;
  if (target)
    {
      target= target->prev();
      view->next= target->next;
      target->next= view;
    }
  else
    {
      if (!last)
	view->next= view;
      else
	{
	  view->next= last->next;
	  last->next= view;
	}
      last= view;
    }
}

class cl_view *
cl_group::first(void)
{
  if (!last)
    return(0);
  return(last->next);
}


/*class cl_view *
cl_group::get_by_state(unsigned int what, int enabled)
{
  int i;

  for (i= 0; i < views->count; i++)
    {
      class cl_view *v= (class cl_view *)(views->at(i));
      if ((enabled &&
	   (state&what))
	  ||
	  (!enabled &&
	   ((~state)&what))
	  )
	return(v);
    }
  return(0);
}*/

/*int
cl_group::select(void)
{
}*/

/*int
cl_group::unselect(void)
{
}*/

int
cl_group::select_next()
{
  /*  int start, i;
  class cl_view *v;

  if (views->count <= 1)
    return(1);
  if (current)
    start= views->index_of(current);
  else
    if ((v= get_by_state(SF_SELECTED, 1)))
      start= views->index_of(v);
    else
      if ((v= get_by_state(SF_FOCUSED, 1)))
	start= views->index_of(v);
      else
	start= 0;
  i= (start+1)%(views->count);
  while (i != start)
    {
      v= (class cl_view *)(views->at(i));
      if ((v->options & OF_SELECTABLE) &&
	  v->select())
	{
	  //update();
	  return(1);
	}
      i= (i+1)%(views->count);
      }*/
  return(0);
}

int
cl_group::select_prev()
{
  /*  int start, i;
  class cl_view *v;

  if (views->count <= 1)
    return(1);
  if (current)
    start= views->index_of(current);
  else
    if ((v= get_by_state(SF_SELECTED, 1)))
      start= views->index_of(v);
    else
      if ((v= get_by_state(SF_FOCUSED, 1)))
	start= views->index_of(v);
      else
	start= 0;
  i= start-1; if (i < 0) i= views->count-1;
  while (i != start)
    {
      v= (class cl_view *)(views->at(i));
      if ((v->options & OF_SELECTABLE) &&
	  v->select())
	{
	  //update();
	  return(1);
	}
      i= start-1; if (i < 0) i= views->count-1;
      }*/
  return(0);
}

class cl_view *
cl_group::current_sub_view(void)
{
  return(current);
}

void
cl_group::for_each(void (*func)(class cl_view *view))
{
  class cl_view *v;

  if (!last)
    return;
  v= last->next;
  do
    {
      func(v);
      v= v->next;
    }
  while (v != last);
}

void
cl_group::set_current(class cl_view *view)
{
  //current= view;
  if (current == view)
    return;
  //lock();
  /*focus_view(view, 0);*/
  if ((state & SF_FOCUSED) &&
      (current != 0))
    current->change_state(SF_FOCUSED, 0);
  //if (mode!=ENTER_SELECT) select_view(current, 0);
  if (current)
    current->change_state(SF_SELECTED, 0);
  //if (mode!=LEAVE_SELECT) select_view(view, 1);
  if (view)
    view->change_state(SF_SELECTED, 1);
  //focuse_view(view, 1);
  if ((state & SF_FOCUSED) &&
      (view != 0))
    view->change_state(SF_SELECTED, 1);
  current= view;
  //unlock();
}

/*int
cl_group::terminal_view(void)
{
  return(views->count == 0);
}*/

static unsigned int grp_what, grp_en;

static void
do_set_state(class cl_view *v)
{
  v->change_state(grp_what, grp_en);
}

void
cl_group::change_state(unsigned int what, int enable)
{
  cl_view::change_state(what, enable);
  /*if (enable &&
      (what & SF_SELECTED))
    {
      class cl_view *v= get_by_state(SF_SELECTED, 1);
      if (v)
	{
	  current= v;
	  current->change_state(SF_FOCUSED, 1);
	  current->change_state(SF_SELECTED, 1);
	}
      else
	{
	  if ((v= get_by_state(SF_FOCUSED, 1)))
	    {
	      current= v;
	      current->change_state(SF_SELECTED, 1);
	    }
	}
	}*/
  switch (what)
    {
      case SF_ACTIVE:
	//lock();
	grp_what= what;
	grp_en= enable;
	for_each(do_set_state);
	//unlock();
	break;
    case SF_FOCUSED:
      if (current)
	current->change_state(SF_FOCUSED, enable);
      break;
    }
  draw();
}


/* End of gui.src/group.cc */

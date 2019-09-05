/*
 * Simulator of microcontrollers (app.cc)
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

#include <stdlib.h>

#include "appcl.h"
#include "deskcl.h"


cl_app::cl_app(char *iname):
  cl_group(iname, this)
{
  drawn= 0;
}

cl_app::~cl_app(void)
{
  endwin();
}

int
cl_app::init(void)
{
  initscr();
  keypad(stdscr, TRUE);
  nonl();
  cbreak();
  noecho();
  
  pos= new cl_box(0,0, COLS, LINES);
  cl_view::init();
  state|= SF_SELECTED;//select();
  class cl_box b(*pos);
  //b.move_rel(0,1);
  //b.grow(0,-2);
  if ((desk= mk_desk(&b)))
    insert(desk);
  desk->select();
  mk_views(desk);

  //update();
  update_panels();
  doupdate();
  return(0);
}

class cl_gin *
cl_app::mk_input(void)
{
  class cl_gin *i= new cl_gin();
  i->init();
  i->add_input(stdin, 0);
  return(i);
}

int *
cl_app::mk_palette(void)
{
  int *p, i;
  int colors;

  colors= 64;
  p= (int*)malloc(colors * sizeof(int));
  if (has_colors())
    {
      start_color();

      init_pair(i= C_WIN+C_WIN_NORMAL, COLOR_YELLOW, COLOR_BLUE);
      p[i]= COLOR_PAIR(i)|A_BOLD;
      for (i= 1; i < colors; i++)
	p[i]= p[C_WIN+C_WIN_NORMAL];
      // desktop
      init_pair(i= C_DSK_BG, COLOR_BLACK, COLOR_WHITE);
      p[i]= COLOR_PAIR(i);
      // menus and status bar
      init_pair(i= C_DSK_NORMAL, COLOR_WHITE, COLOR_BLUE);
      p[i]= COLOR_PAIR(i)|A_BOLD;
      init_pair(i= C_DSK_DISABLED, COLOR_WHITE, COLOR_BLUE);
      p[i]= COLOR_PAIR(i);
      // window
      init_pair(i= C_WIN+C_WIN_FPASSIVE, COLOR_WHITE, COLOR_BLUE);
      p[i]= COLOR_PAIR(i);
      init_pair(i= C_WIN+C_WIN_FACTIVE, COLOR_WHITE, COLOR_BLUE);
      p[i]= COLOR_PAIR(i)|A_BOLD;
      init_pair(i= C_WIN+C_WIN_SELECTED, COLOR_YELLOW, COLOR_RED);
      p[i]= COLOR_PAIR(i)|A_BOLD; 
    }
  else
    {
      for (i= 0; i < colors; i++)
	p[i]= A_NORMAL;
      p[C_WIN+C_WIN_FACTIVE]|= A_BOLD;
      p[C_WIN+C_WIN_SELECTED]|= A_REVERSE;
    }
  return(p);
}

class cl_group *
cl_app::mk_desk(class cl_box *ipos)
{
  class cl_group *d= new cl_desk(ipos, "desktop", this);
  d->init();
  return(d);
}


int
cl_app::handle_event(struct t_event *event)
{
  if (!cl_group::handle_event(event))
    {
      if (event->what == EV_KEY)
	switch (event->event.key)
	  {
	  case KEY_BREAK: case KEY_EXIT:
	    event->what= EV_COMMAND;
	    event->event.msg.cmd= CMD_QUIT;
	    break;
	  }
    }
  return(0);
}

int
cl_app::run(void)
{
  struct t_event event;
  
  drawn= 0;
  while (get_event(&event))
    {
      if (!handle_event(&event))
	{
	  if (event.what == EV_COMMAND &&
	      event.event.msg.cmd == CMD_QUIT)
	    return(0);
	  unhandled(&event);
	}
      if (drawn)
	update();
      drawn= 0;
    }
  return(0);
}


/* End of gui.src/app.cc */

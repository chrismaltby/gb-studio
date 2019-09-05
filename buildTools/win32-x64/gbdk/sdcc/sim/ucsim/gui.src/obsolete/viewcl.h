/*
 * Simulator of microcontrollers (viewcl.h)
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

#ifndef VIEWCL_HEADER
#define VIEWCL_HEADER

#include <curses.h>
#include <panel.h>

#include "pobjcl.h"

#include "palette.h"
#include "eventcl.h"


// Status flags
#define SF_NOTHING	0x0000
#define SF_SELECTED	0x0001
#define SF_FOCUSED	0x0002
#define SF_ACTIVE	0x0004

// Option flags
#define OF_NOTHING	0x0000
#define OF_SELECTABLE	0x0001


class cl_box: public cl_base
{
public:
  int x, y;
  int w, h;
public:
  cl_box(int ix, int iy, int iw, int ih);
  void set(int ix, int iy, int iw, int ih);
  void move_rel(int dx, int dy);
  void grow(int dw, int dh);
};


class cl_app;
class cl_group;

class cl_view: public cl_base
{
public:
  char *name;
  WINDOW *window;
  PANEL *panel;
  class cl_group *parent;
  class cl_view *next, *last;
  class cl_app *app;
  class cl_gin *input;
  class cl_box *pos;
  int *palette;
  unsigned int state; // See SF_XXXX
  unsigned int options; // See OF_XXXX
public:
  cl_view(class cl_box *ipos, char *iname, class cl_app *iapp);
  cl_view(char *name, class cl_app *iapp);
  ~cl_view(void);
  virtual int init(void);
  virtual class cl_gin *mk_input(void);
  virtual int *mk_palette(void);
  virtual int is_group(void) {return(0);}

  virtual int ok(void);
  virtual int draw(void);
  virtual int update(void);
  virtual int get_color(int color);
  virtual int *get_palette(void);

  virtual int get_event(struct t_event *event);
  virtual int handle_event(struct t_event *event);
  virtual int unhandled(struct t_event *event);
  virtual int mk_event(struct t_event *event, FILE *f, int key);

  virtual class cl_view *prev(void);
  virtual class cl_view *prev_view(void);

  virtual int select(void);
  virtual int unselect(void);
  virtual class cl_view *get_by_state(unsigned int what, int enabled)
    {return(0);}
  virtual int select_next() {return(0);}
  virtual class cl_view *current_sub_view(void);
  virtual void set_current(class cl_view *view) {}
  virtual int terminal_view(void);
  virtual void change_state(unsigned int what, int enable);
};


#endif

/* End of gui.src/viewcl.h */

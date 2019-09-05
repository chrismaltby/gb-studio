/*
 * Simulator of microcontrollers (groupcl.h)
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

#ifndef GROUPCL_HEADER
#define GROUPCL_HEADER

#include "viewcl.h"

class cl_group: public cl_view
{
public:
  class cl_view *current;

public:
  cl_group(class cl_box *ipos, char *iname, class cl_app *iapp);
  cl_group(char *iname, class cl_app *iapp);
  ~cl_group(void);
  virtual int init(void);
  virtual int mk_views(class cl_group *ins_to);
  virtual int is_group(void) {return(1);}

  virtual int draw(void);
  //virtual int update(void);

  virtual int handle_event(struct t_event *event);

  virtual /*class cl_view **/void insert(class cl_view *view);
  virtual void insert_before(class cl_view *view, class cl_view *target);
  virtual void insert_view(class cl_view *view, class cl_view *target);
  virtual class cl_view *first(void);
  virtual void for_each(void (*func)(class cl_view *view));
  //virtual class cl_view *get_by_state(unsigned int what, int enabled);
  //virtual int select(void);
  //virtual int unselect(void);
  virtual int select_next();
  virtual int select_prev();
  virtual class cl_view *current_sub_view(void);
  virtual void set_current(class cl_view *view);
  //virtual int terminal_view(void);
  virtual void change_state(unsigned int what, int enable);
};


#endif

/* End of gui.src/groupcl.h */

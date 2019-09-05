/*
 * Simulator of microcontrollers (wincl.h)
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

#ifndef WINCL_HEADER
#define WINCL_HEADER

#include "groupcl.h"
#include "framecl.h"


class cl_win: public cl_group
{
public:
  class cl_view *frame;
  class cl_view *intern;
  char *title;
public:
  cl_win(class cl_box *ipos, char *ititle, class cl_app *iapp);
  ~cl_win(void);
  virtual int init(void);
  virtual int *mk_palette(void);
  virtual class cl_frame *mk_frame(class cl_box *ipos);
  virtual class cl_view *mk_intern(class cl_box *ipos);

  virtual char *get_title(void);
};


#endif

/* End of gui.src/wincl.h */

/*
 * Simulator of microcontrollers (appcl.h)
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

#ifndef APPCL_HEADER
#define APPCL_HEADER

#include "groupcl.h"


class cl_app: public cl_group
{
public:
  class cl_group *desk;
  int drawn;
public:
  cl_app(char *iname);
  ~cl_app(void);
  virtual int init(void);
  virtual class cl_gin *mk_input(void);
  virtual int *mk_palette(void);
  virtual class cl_group *mk_desk(class cl_box *ipos);
  
  virtual int handle_event(struct t_event *event);
  virtual int run(void);
};


#endif

/* End of gui.src/appcl.h */

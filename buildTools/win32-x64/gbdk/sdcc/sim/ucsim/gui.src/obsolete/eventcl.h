/*
 * Simulator of microcontrollers (eventcl.h)
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

#ifndef EVENTCL_HEADER
#define EVENTCL_HEADER

#include "ddconfig.h"

#if FD_HEADER_OK
# include HEADER_FD
#endif

#include "pobjcl.h"

#include "viewcl.h"


#define EV_NOTHING	0x0000
#define EV_MOUSE_DOWN	0x0001
#define EV_MOUSE_UP	0x0002
#define EV_MOUSE_MOVE	0x0004
#define EV_MOUSE_AUTO	0x0008
#define EV_KEY		0x0010
#define EV_COMMAND	0x0100
#define EV_BROADCAST	0x0200

// cathegories
#define EV_MOUSE	(EV_MOUSE_DOWN|EV_MOUSE_UP|EV_MOUSE_MOVE|EV_MOUSE_AUTO)
#define EV_KEYBOARD	EV_KEY
#define EV_MESSAGE	0xff00

#define CMD_QUIT	0

struct t_event {
  int what;
  union {
    wchar_t key;
    struct {
      int cmd;
      long param;
    } msg;
  } event;
};


class cl_input_src: public cl_base
{
public:
  FILE *file;
  class cl_view *view;
  cl_input_src(FILE *ifile, class cl_view *iview);
};

class cl_gin: public cl_base
{
public:
  fd_set in_set;
  int max_fdes;
  cl_list *inputs;
public:
  cl_gin(void);
  ~cl_gin(void);

  virtual int add_input(FILE *ifile, class cl_view *iview);
  virtual class cl_input_src *get_input_src(int fdes);
  virtual int get_event(struct t_event *event);
};


#endif

/* End of gui.src/eventcl.h */

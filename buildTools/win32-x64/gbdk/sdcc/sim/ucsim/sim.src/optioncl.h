/*
 * Simulator of microcontrollers (sim.src/optioncl.h)
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

#ifndef SIM_OPTIONCL_HEADER
#define SIM_OPTIONCL_HEADER

#include "ddconfig.h"

#include <stdio.h>

#include "pobjcl.h"
#include "stypes.h"


class cl_option: public cl_base
{
protected:
  void *option;
public:
  char *id;
  char *help;

public:
  cl_option(void *opt, char *Iid, char *Ihelp);
  ~cl_option(void);

  virtual void print(class cl_console *con)= 0;

  virtual bool get_value(void)= 0;

  virtual void set_value(bool)= 0;
  virtual void set_value(char *s)= 0;
};


class cl_bool_opt: public cl_option
{
public:
  cl_bool_opt(bool *opt, char *Iid, char *Ihelp);

  virtual void print(class cl_console *con);
  virtual bool get_value(void);
  virtual void set_value(bool);
  virtual void set_value(char *s);
};

class cl_cons_debug_opt: public cl_option
{
public:
  class cl_app *app;
public:
  cl_cons_debug_opt(class cl_app *the_app, char *Iid, char *Ihelp);

  virtual void print(class cl_console *con);

  virtual bool get_value(void);

  virtual void set_value(bool);
  virtual void set_value(char *s);
};


#endif

/* End of optioncl.h */

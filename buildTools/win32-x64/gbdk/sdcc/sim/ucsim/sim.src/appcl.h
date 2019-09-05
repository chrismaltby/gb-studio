/*
 * Simulator of microcontrollers (sim.src/appcl.h)
 *
 * Copyright (C) 2001,01 Drotos Daniel, Talker Bt.
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

#ifndef SIM_APPCL_HEADER
#define SIM_APPCL_HEADER

#include "ddconfig.h"

// prj
#include "pobjcl.h"

// local, sim.src
#include "argcl.h"


/* Options */

#define OPT_GENERAL	0x0001
#define OPT_SIM		0x0002
#define OPT_UC		0x0004
#define OPT_PRG_OPT	(OPT_GENERAL|OPT_SIM|OPT_UC)
#define OPT_51		0x0010
#define OPT_AVR		0x0020
#define OPT_Z80		0x0040
#define OPT_TARGET	(OPT_51|OPT_AVR|OPT_Z80)

/*class cl_option: public cl_base
{
public:
  int type;	// See OPT_XXX
  char short_name;
  char *long_name;
  class cl_ustrings *values;

public:
  cl_option(int atype, char sn, char *ln);
  ~cl_option(void);

  virtual int add_value(char *value);
  virtual char *get_value(int index);
};

class cl_options: public cl_list
{
public:
  cl_options(void);
};*/


/* Application */

class cl_app: public cl_base
{
protected:
  class cl_commander *commander;
public:
  class cl_sim *sim;
  class cl_ustrings *in_files;
  class cl_arguments *args;
  int going;

public:
  cl_app(void);
  ~cl_app(void);

public:
  virtual int init(int argc , char *argv[]);
  virtual int run(void);
  virtual void done(void);

protected:
  virtual int proc_arguments(int argc, char *argv[]);

public:
  class cl_sim *get_sim(void) { return(sim); }
  class cl_commander *get_commander(void) { return(commander); }
  virtual class cl_cmd *get_cmd(class cl_cmdline *cmdline);

public:
  virtual void set_simulator(class cl_sim *simulator);
  virtual void remove_simulator(void);

protected:
  virtual void build_cmdset(class cl_cmdset *cs);
};


#endif

/* End of sim.src/appcl.h */

/*
 * Simulator of microcontrollers (cmd.src/cmdcl.h)
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

#ifndef CMD_NEWCMDCL_HEADER
#define CMD_NEWCMDCL_HEADER


#include "ddconfig.h"

#include <stdio.h>
#include <sys/types.h>	// to define fd_set
#if FD_HEADER_OK
# include HEADER_FD
#endif

// prj
#include "pobjcl.h"

// sim.src
#include "appcl.h"


#define SY_ADDR		'a'
#define ADDRESS		"a"
#define SY_NUMBER	'n'
#define NUMBER		"n"
#define SY_DATA		'd'
#define DATA		"d"
#define SY_STRING	's'
#define STRING		"s"
#define SY_MEMORY	'm'
#define MEMORY		"m"
#define SY_HW		'h'
#define HW		"h"
#define SY_DATALIST	'D'
#define DATALIST	"D"
#define SY_BIT		'b'
#define BIT		"b"

enum cmd_operate_on {
  operate_on_none,
  operate_on_app,
  operate_on_sim,
  operate_on_uc
};


/*
 * Command line with parameters
 */

class cl_cmdline: cl_base
{
public:
  class cl_app *app;
  char *cmd;
  char *name;
  class cl_list *params;
  class cl_ustrings *tokens;
  char *matched_syntax;
  class cl_console *con;

public:
  cl_cmdline(class cl_app *the_app, char *acmd, class cl_console *acon);
  virtual ~cl_cmdline(void);
  virtual int init(void);

  virtual int split(void);
  virtual int shift(void);
  virtual int repeat(void);
  virtual class cl_cmd_arg *param(int num);
  virtual void insert_param(int pos, class cl_cmd_arg *param);
  virtual bool syntax_match(class cl_uc *uc, char *syntax);
  virtual bool set_data_list(class cl_cmd_arg *parm, int *iparm);
private:
  char *skip_delims(char *start);
};


/*
 * Command and container
 */

// simple command
class cl_cmd: public cl_base
{
public:
  enum cmd_operate_on operate_on;
  class cl_strings *names;
  int  can_repeat;
  char *short_help;
  char *long_help;

public:
  cl_cmd(enum cmd_operate_on opon,
	 char *aname,
	 int  can_rep,
	 char *short_hlp,
	 char *long_hlp);
  ~cl_cmd(void);

  virtual void add_name(char *name);
  virtual int name_match(char *aname, int strict);
  virtual int name_match(class cl_cmdline *cmdline, int strict);
  virtual int syntax_ok(class cl_cmdline *cmdline);
  virtual int work(class cl_app *app,
		   class cl_cmdline *cmdline, class cl_console *con);
  virtual int do_work(class cl_cmdline *cmdline, class cl_console *con);
  virtual int do_work(class cl_app *app,
		      class cl_cmdline *cmdline, class cl_console *con);
  virtual int do_work(class cl_sim *sim,
		      class cl_cmdline *cmdline, class cl_console *con);
  virtual int do_work(class cl_uc *uc,
		      class cl_cmdline *cmdline, class cl_console *con);
};

#define COMMAND_HEAD(CLASS_NAME) \
class CLASS_NAME : public cl_cmd\
{
#define COMMAND_HEAD_ANCESTOR(CLASS_NAME,ANCESTOR) \
class CLASS_NAME : public ANCESTOR \
{

#define COMMAND_METHODS(CLASS_NAME) \
public:\
  CLASS_NAME (char *aname,\
              int  can_rep,\
              char *short_help,\
              char *long_help):\
    cl_cmd(operate_on_none, aname, can_rep, short_help, long_help) {}\
  virtual int do_work(class cl_cmdline *cmdline, class cl_console *con);

#define COMMAND_METHODS_ON(ON,CLASS_NAME) \
public:\
  CLASS_NAME (char *aname,\
              int  can_rep,\
              char *short_help,\
              char *long_help):\
    cl_cmd(operate_on_ ## ON, aname, can_rep, short_help, long_help) {}\
  virtual int do_work(class cl_ ## ON * ON ,\
		      class cl_cmdline *cmdline, class cl_console *con);

#define COMMAND_METHODS_ANCESTOR(CLASS_NAME,ANCESTOR) \
public:\
  CLASS_NAME (char *aname,\
              int  can_rep,\
              char *short_help,\
              char *long_help):\
    ANCESTOR (aname, can_rep, short_help, long_help) {}\
  virtual int do_work(class cl_cmdline *cmdline, class cl_console *con);

#define COMMAND_METHODS_ANCESTOR_ON(ON,CLASS_NAME,ANCESTOR) \
public:\
  CLASS_NAME (char *aname,\
              int  can_rep,\
              char *short_help,\
              char *long_help):\
    ANCESTOR (aname, can_rep, short_help, long_help) {}\
  virtual int do_work(class cl_ ## ON * ON ,\
		      class cl_cmdline *cmdline, class cl_console *con); \


#define COMMAND_TAIL }

#define COMMAND(CLASS_NAME) \
COMMAND_HEAD(CLASS_NAME) \
COMMAND_METHODS(CLASS_NAME) \
COMMAND_TAIL

#define COMMAND_ON(ON,CLASS_NAME) \
COMMAND_HEAD(CLASS_NAME) \
COMMAND_METHODS_ON(ON,CLASS_NAME) \
COMMAND_TAIL

#define COMMAND_DATA(CLASS_NAME,DATA) \
COMMAND_HEAD(CLASS_NAME) \
public: DATA ; \
COMMAND_METHODS(CLASS_NAME)\
COMMAND_TAIL

#define COMMAND_DATA_ON(ON,CLASS_NAME,DATA) \
COMMAND_HEAD(CLASS_NAME) \
public: DATA ; \
COMMAND_METHODS_ON(ON,CLASS_NAME)\
COMMAND_TAIL

#define COMMAND_ANCESTOR_ON(ON,CLASS_NAME,ANCESTOR) \
COMMAND_HEAD_ANCESTOR(CLASS_NAME,ANCESTOR) \
COMMAND_METHODS_ANCESTOR_ON(ON,CLASS_NAME,ANCESTOR) \
COMMAND_TAIL

#define COMMAND_DATA_ANCESTOR(CLASS_NAME,ANCESTOR,DATA) \
COMMAND_HEAD_ANCESTOR(CLASS_NAME,ANCESTOR) \
public: DATA ; \
COMMAND_METHODS_ANCESTOR(CLASS_NAME,ANCESTOR)\
COMMAND_TAIL

#define COMMAND_DATA_ANCESTOR_ON(ON,CLASS_NAME,ANCESTOR,DATA) \
COMMAND_HEAD_ANCESTOR(CLASS_NAME,ANCESTOR) \
public: DATA ; \
COMMAND_METHODS_ANCESTOR_ON(ON,CLASS_NAME,ANCESTOR)\
COMMAND_TAIL

#define COMMAND_DO_WORK(CLASS_NAME) \
int \
CLASS_NAME::do_work(class cl_cmdline *cmdline, class cl_console *con)
#define COMMAND_DO_WORK_APP(CLASS_NAME) \
int \
CLASS_NAME::do_work(class cl_app *app,\
		    class cl_cmdline *cmdline, class cl_console *con)
#define COMMAND_DO_WORK_SIM(CLASS_NAME) \
int \
CLASS_NAME::do_work(class cl_sim *sim,\
		    class cl_cmdline *cmdline, class cl_console *con)
#define COMMAND_DO_WORK_UC(CLASS_NAME) \
int \
CLASS_NAME::do_work(class cl_uc *uc,\
		    class cl_cmdline *cmdline, class cl_console *con)

// Command set is list of cl_cmd objects
class cl_cmdset: public cl_list
{
public:
  //class cl_sim *sim;
  class cl_cmd *last_command;

public:
  cl_cmdset(void);
  //cl_cmdset(class cl_sim *asim);

  virtual class cl_cmd *get_cmd(class cl_cmdline *cmdline);
  virtual class cl_cmd *get_cmd(char *cmd_name);
  virtual void del(char *name);
  virtual void replace(char *name, class cl_cmd *cmd);
};

// subset of commands
class cl_super_cmd: public cl_cmd
{
public:
  class cl_cmdset *commands;

public:
  cl_super_cmd(char *aname,
	       int  can_rep,
	       char *short_hlp,
	       char *long_hlp,
	       class cl_cmdset *acommands);
  ~cl_super_cmd(void);

  virtual int work(class cl_app *app,
		   class cl_cmdline *cmdline, class cl_console *con);
};


/*
 * Command console
 */

class cl_console: public cl_base
{
  friend class cl_commander;
protected:
  FILE *in, *out;
public:
  class cl_app *app;
  char *last_command;
  int flags; // See CONS_XXXX
  char *prompt;

public:
  cl_console(void): cl_base() { app= 0; in= out= 0; flags= 0; }
  cl_console(char *fin, char *fout, class cl_app *the_app);
  cl_console(FILE *fin, FILE *fout, class cl_app *the_app);
#ifdef SOCKET_AVAIL
  cl_console(int portnumber, class cl_app *the_app);
#endif
  ~cl_console(void);
  virtual int init(void);

  virtual void welcome(void);
  virtual void print_prompt(void);
  virtual int  printf(char *format, ...);
  virtual void print_bin(long data, int bits);
  virtual int  match(int fdnum);
  virtual int  get_in_fd(void);
  virtual int  input_avail(void);
  virtual char *read_line(void);
  virtual int  proc_input(class cl_cmdset *cmdset);
  virtual bool interpret(char *cmd);
};

#ifdef SOCKET_AVAIL
class cl_listen_console: public cl_console
{
public:
  int sock;
public:
  cl_listen_console(int serverport, class cl_app *the_app);

  virtual void welcome(void) {}
  virtual void prompt(void) {}

  virtual int match(int fdnum);
  virtual int get_in_fd(void);
  virtual int proc_input(class cl_cmdset *cmdset);
};
#endif


/*
 * Command interpreter
 */

class cl_commander: public cl_base
{
public:
  class cl_app *app;
  class cl_list *cons;
  fd_set read_set, active_set;
  int fd_num;
  //class cl_sim *sim;
  class cl_console *actual_console, *frozen_console;
  class cl_cmdset *cmdset;

public:
  cl_commander(class cl_app *the_app,
	       class cl_cmdset *acmdset/*, class cl_sim *asim*/);
  ~cl_commander(void);
  virtual int init(void);

  virtual class cl_console *mk_console(char *fin, char *fout);
  virtual class cl_console *mk_console(FILE *fin, FILE *fout);
#ifdef SOCKET_AVAIL
  virtual class cl_console *mk_console(int portnumber);
#endif
  void add_console(class cl_console *console);
  void del_console(class cl_console *console);
  void set_fd_set(void);

  int all_printf(char *format, ...);	// print to all consoles
  int all_print(char *string, int length);
  int printf(char *format, ...);	// print to actual_console
  int debug(char *format, ...);		// print consoles with debug flag set
  int flag_printf(int iflags, char *format, ...);
  int input_avail(void);
  int input_avail_on_frozen(void);
  int wait_input(void);
  int proc_input(void);
};


#endif

/* End of cmd.src/cmdcl.h */

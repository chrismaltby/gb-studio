/*
 * Simulator of microcontrollers (app.cc)
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

#include "ddconfig.h"

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#ifdef HAVE_GETOPT_H
# include <getopt.h>
#endif
#ifdef SOCKET_AVAIL
#include <sys/socket.h>
#endif
#include <ctype.h>
#include <errno.h>
#include "i_string.h"

// prj
#include "utils.h"

// local, sim.src
#include "appcl.h"
#include "simcl.h"

// cmd.src
#include "cmdsetcl.h"
#include "cmdutil.h"
#include "cmdconfcl.h"
#include "showcl.h"


/*
 * Program options
 */

/*cl_option::cl_option(int atype, char sn, char *ln)
{
  type= atype;
  short_name= sn;
  if (!ln)
    long_name= NULL;
  else
    long_name= strdup(ln);
  values= new cl_ustrings(1, 1);
}

cl_option::~cl_option(void)
{
  if (long_name)
    free(long_name);
  delete values;
}

int
cl_option::add_value(char *value)
{
  values->add(value);
  return(values->count - 1);
}

char *
cl_option::get_value(int index)
{
  if (index > values->count - 1)
    return(0);
  return((char*)(values->at(index)));
}*/

/* List of options */

/*cl_options::cl_options(void):
  cl_list(2, 2)
{
}*/


/*
 * Application
 ****************************************************************************
 */

cl_app::cl_app(void)
{
  //options= new cl_options();
  sim= 0;
  args= new cl_arguments();
  in_files= new cl_ustrings(2, 2);
  going= 1;
}

cl_app::~cl_app(void)
{
  //delete options;
  remove_simulator();
  delete commander;
  //delete cmdset;
  delete args;
  delete in_files;
}

int
cl_app::init(int argc, char *argv[])
{
  cl_base::init();
  proc_arguments(argc, argv);
  class cl_cmdset *cmdset= new cl_cmdset();
  cmdset->init();
  build_cmdset(cmdset);
  commander= new cl_commander(this, cmdset/*, sim*/);
  commander->init();
  return(0);
}

/* Main cycle */

int
cl_app::run(void)
{
  int done= 0;

  while (!done &&
	 going)
    {
      if (sim)
	{
	  if (sim->state & SIM_GO)
	    {
	      if (commander->input_avail())
		done= commander->proc_input();
	      else
		sim->step();
	    }
	  else
	    {
	      commander->wait_input();
	      done= commander->proc_input();
	    }
	}
      else
	{
	  commander->wait_input();
	  done= commander->proc_input();
	}
    }
  return(0);
}

void
cl_app::done(void)
{
}


/*
 * Interpretation of parameters
 */

static void
print_help(char *name)
{
  printf("%s: %s\n", name, VERSIONSTR);
  printf("Usage: %s [-hHVvP] [-p prompt] [-t CPU] [-X freq[k|M]]\n"
	 "       [-c file] [-s file] [-S optionlist]"
#ifdef SOCKET_AVAIL
	 " [-Z portnum] [-k portnum]"
#endif
	 "\n"
	 "       [files...]\n", name);
  printf
    (
     "Options:\n"
     "  -t CPU       Type of CPU: 51, C52, 251, etc.\n"
     "  -X freq[k|M] XTAL frequency\n"
     "  -c file      Open command console on `file'\n"
#ifdef SOCKET_AVAIL
     "  -Z portnum   Use localhost:portnumber for command console\n"
     "  -k portnum   Use localhost:portnum for serial I/O\n"
#endif
     "  -s file      Connect serial interface to `file'\n"
     "  -S options   `options' is a comma separated list of options\n"
     "               according to serial interface. Know options are:\n"
     "                  in=file   serial input will be read from file named `file'\n"
     "                  out=file  serial output will be written to `file'\n"
     "  -p prompt    Specify string for prompt\n"
     "  -P           Prompt is a null ('\\0') character\n"
     "  -V           Verbose mode\n"
     "  -v           Print out version number\n"
     "  -H           Print out types of known CPUs\n"
     "  -h           Print out this help\n"
     );
}

enum {
  SOPT_IN= 0,
  SOPT_OUT
};

static const char *S_opts[]= {
  /*[SOPT_IN]=*/ "in",
  /*[SOPT_OUT]=*/ "out",
  NULL
};

int
cl_app::proc_arguments(int argc, char *argv[])
{
  int i, c;
  char opts[100], *cp, *subopts, *value;
  char *cpu_type= NULL;

  strcpy(opts, "c:C:p:PX:vVt:s:S:hHk:");
#ifdef SOCKET_AVAIL
  strcat(opts, "Z:r:");
#endif
  //int opterr= 0;
  while((c= getopt(argc, argv, opts)) != -1)
    switch (c)
      {
      case 'c':
	args->add(new cl_prg_arg('c', 0, optarg));
	break;
      case 'C':
	args->add(new cl_prg_arg(0, "Config", optarg));
	break;
#ifdef SOCKET_AVAIL
      case 'Z':
	// By Sandeep
	args->add(new cl_prg_arg('Z', 0, (long)1));
	if (!optarg || !isdigit(*optarg))
	  fprintf(stderr, "expected portnumber to follow -Z\n");
	else {
	  char *p;
	  long l= strtol(optarg, &p, 0);
	  args->add(new cl_prg_arg(0, "Zport", l));
	}
	break;
#endif
      case 'p':
	args->add(new cl_prg_arg(0, "prompt", optarg));
	break;
      case 'P':
	args->add(new cl_prg_arg('P', 0, (long)1));
	break;
#ifdef SOCKET_AVAIL
      case 'r':
	args->add(new cl_prg_arg('r', 0,
				 (long)strtol(optarg, NULL, 0)));
	break;
#endif
      case 'X':
	{
	  double XTAL;
	  for (cp= optarg; *cp; *cp= toupper(*cp), cp++);
	  XTAL= strtod(optarg, &cp);
	  if (*cp == 'K')
	    XTAL*= 1e3;
	  if (*cp == 'M')
	    XTAL*= 1e6;
	  if (XTAL == 0)
	    {
	      fprintf(stderr, "Xtal frequency must be greather than 0\n");
	      exit(1);
	    }
	  args->add(new cl_prg_arg('X', 0, XTAL));
	  break;
	}
      case 'v':
	printf("%s: %s\n", argv[0], VERSIONSTR);
        exit(0);
        break;
      case 'V':
	args->add(new cl_prg_arg('V', 0, (long)1));
	break;
      case 't':
	if (cpu_type)
	  free(cpu_type);
	cpu_type= strdup(optarg);
	for (cp= cpu_type; *cp; *cp= toupper(*cp), cp++);
	args->add(new cl_prg_arg('t', 0, cpu_type));
	break;
      case 's':
      {
	FILE *Ser_in, *Ser_out;
	if (args->arg_avail('s'))
	  {
	    fprintf(stderr, "-s option can not be used more than once.\n");
	    break;
	  }
	args->add(new cl_prg_arg('s', 0, (long)1));
	if ((Ser_in= fopen(optarg, "r")) == NULL)
	  {
	    fprintf(stderr,
		    "Can't open `%s': %s\n", optarg, strerror(errno));
	    return(4);
	  }
	args->add(new cl_prg_arg(0, "Ser_in", Ser_in));
	if ((Ser_out= fopen(optarg, "w")) == NULL)
	  {
	    fprintf(stderr,
		    "Can't open `%s': %s\n", optarg, strerror(errno));
	    return(4);
	  }
	args->add(new cl_prg_arg(0, "Ser_out", Ser_out));
	break;
      }
#ifdef SOCKET_AVAIL
      // socket serial I/O by Alexandre Frey <Alexandre.Frey@trusted-logic.fr>
      case 'k':
	{
	  FILE *Ser_in, *Ser_out;
	  int  sock;
	  unsigned short serverport;
	  int client_sock;

	  if (args->arg_avail("Ser_in")) {
	    fprintf(stderr, "Serial input specified more than once.\n");
	  }
	  if (args->arg_avail("Ser_out")) {
	    fprintf(stderr, "Serial output specified more than once.\n");
	  }

	  serverport = atoi(optarg);
	  sock= make_server_socket(serverport);
	  if (listen(sock, 1) < 0) {
	    fprintf(stderr, "Listen on port %d: %s\n", serverport,
		    strerror(errno));
	    return (4);
	  }
	  fprintf(stderr, "Listening on port %d for a serial connection.\n",
		  serverport);
	  if ((client_sock= accept(sock, NULL, NULL)) < 0) {
	    fprintf(stderr, "accept: %s\n", strerror(errno));
	  }
	  fprintf(stderr, "Serial connection established.\n");

	  if ((Ser_in= fdopen(client_sock, "r")) == NULL) {
	    fprintf(stderr, "Can't create input stream: %s\n", strerror(errno));
	    return (4);
	  }
	  args->add(new cl_prg_arg(0, "Ser_in", Ser_in));
	  if ((Ser_out= fdopen(client_sock, "w")) == NULL) {
	    fprintf(stderr, "Can't create output stream: %s\n", strerror(errno));
	    return (4);
	  }
	  args->add(new cl_prg_arg(0, "Ser_out", Ser_out));
	  break;
	}
#endif
      case 'S':
	subopts= optarg;
	while (*subopts != '\0')
	  switch (get_sub_opt(&subopts, S_opts, &value))
	    {
	      FILE *Ser_in, *Ser_out;
	    case SOPT_IN:
	      if (value == NULL) {
		fprintf(stderr, "No value for -S in\n");
		exit(1);
	      }
	      if (args->arg_avail("Ser_in"))
		{
		  fprintf(stderr, "Serial input specified more than once.\n");
		  break;
		}
	      if ((Ser_in= fopen(value, "r")) == NULL)
		{
		  fprintf(stderr,
			  "Can't open `%s': %s\n", value, strerror(errno));
		  exit(4);
		}
	      args->add(new cl_prg_arg(0, "Ser_in", Ser_in));
	      break;
	    case SOPT_OUT:
	      if (value == NULL) {
		fprintf(stderr, "No value for -S out\n");
		exit(1);
	      }
	      if (args->arg_avail("Ser_out"))
		{
		  fprintf(stderr, "Serial output specified more than once.\n");
		  break;
		}
	      if ((Ser_out= fopen(value, "w")) == NULL)
		{
		  fprintf(stderr,
			  "Can't open `%s': %s\n", value, strerror(errno));
		  exit(4);
		}
	      args->add(new cl_prg_arg(0, "Ser_out", Ser_out));
	      break;
	    default:
	      /* Unknown suboption. */
	      fprintf(stderr, "Unknown suboption `%s' for -S\n", value);
	      exit(1);
	      break;
	    }
	break;
      case 'h':
	print_help("s51");
	exit(0);
	break;
      case 'H':
	/*i= 0;
	while (cpus_51[i].type_str != NULL)
	  {
	    printf("%s\n", cpus_51[i].type_str);
	    i++;
	    }*/
	exit(0);
	break;
      case '?':
	if (isprint(optopt))
	  fprintf(stderr, "Unknown option `-%c'.\n", optopt);
	else
	  fprintf(stderr, "Unknown option character `\\x%x'.\n", optopt);
	return(1);
	break;
      default:
	exit(c);
      }
  if (!args->arg_avail("prompt"))
    args->add(new cl_prg_arg(0, "prompt", "> "));

  for (i= optind; i < argc; i++)
    in_files->add(argv[i]);

  return(0);
}


/* Command handling */

class cl_cmd *
cl_app::get_cmd(class cl_cmdline *cmdline)
{
  return(0);
}


/* Adding and removing comonents */

void
cl_app::set_simulator(class cl_sim *simulator)
{
  if (sim)
    remove_simulator();
  sim= simulator;
  
}

void
cl_app::remove_simulator(void)
{
  if (!sim)
    return;
  delete sim;
  sim= 0;
}

void
cl_app::build_cmdset(class cl_cmdset *cmdset)
{
  class cl_cmd *cmd;
  class cl_cmdset *cset;

  {
    cset= new cl_cmdset();
    cset->init();
    cset->add(cmd= new cl_conf_cmd("_no_parameters_", 0,
"conf               Configuration",
"long help of conf"));
    cmd->init();
    cset->add(cmd= new cl_conf_addmem_cmd("addmem", 0,
"conf addmem\n"
"                   Make memory",
"long help of conf addmem"));
    cmd->init();
  }
  cmdset->add(cmd= new cl_super_cmd("conf", 0,
"conf subcommand    Information, see `conf' command for more help",
"long help of conf", cset));
  cmd->init();

  cmd= new cl_help_cmd("help", 0,
"help [command]     Help about command(s)",
"long help of help");
  cmdset->add(cmd);
  cmd->init();
  cmd->add_name("?");

  cmdset->add(cmd= new cl_quit_cmd("quit", 0,
"quit               Quit",
"long help of quit"));
  cmd->init();

  cmdset->add(cmd= new cl_kill_cmd("kill", 0,
"kill               Shutdown simulator",
"long help of kill"));
  cmd->init();

  {
    cset= new cl_cmdset();
    cset->init();
    cset->add(cmd= new cl_show_copying_cmd("copying", 0, 
"show copying       Conditions for redistributing copies of uCsim",
"long help of show copying"));
    cmd->init();
    cset->add(cmd= new cl_show_warranty_cmd("warranty", 0, 
"show warranty      Various kinds of warranty you do not have",
"long help of show warranty"));
    cmd->init();
  }
  cmdset->add(cmd= new cl_super_cmd("show", 0,
"show subcommand    Generic command for showing things about the uCsim",
"long help of show", cset));
  cmd->init();
}


/* End of sim.src/app.cc */

/*-------------------------------------------------------------------------
  SDCCmain.c - main file

             Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1999)

   This program is free software; you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation; either version 2, or (at your option) any
   later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.

   In other words, you are welcome to use, share and improve this program.
   You are forbidden to forbid anyone else to use, share and improve
   what you give them.   Help stamp out software-hoarding!
-------------------------------------------------------------------------*/

#include "common.h"
#include <ctype.h>
#include "newalloc.h"
#include "SDCCerr.h"
#include "BuildCmd.h"
#include "MySystem.h"
#include "SDCCmacro.h"
#include "SDCCutil.h"

#if NATIVE_WIN32
#include <process.h>
#else
#include "spawn.h"
#endif

#if !defined(__BORLANDC__) && !defined(_MSC_VER)
#include <sys/stat.h>
#include <unistd.h>
#endif

/** Name of the environment variable checked for other instalations. */
#define SDCCDIR_NAME "SDCCDIR"

//REMOVE ME!!!
extern int yyparse ();

FILE *srcFile;			/* source file          */
FILE *cdbFile = NULL;		/* debugger information output file */
char *fullSrcFileName;		/* full name for the source file */
char *srcFileName;		/* source file name with the .c stripped */
char *moduleName;		/* module name is srcFilename stripped of any path */
const char *preArgv[128];	/* pre-processor arguments  */
int currRegBank = 0;
struct optimize optimize;
struct options options;
char *VersionString = SDCC_VERSION_STR /*"Version 2.1.8a" */ ;
int preProcOnly = 0;
int noAssemble = 0;
char *linkOptions[128];
const char *asmOptions[128];
char *libFiles[128];
int nlibFiles = 0;
char *libPaths[128];
int nlibPaths = 0;
char *relFiles[128];
int nrelFiles = 0;
bool verboseExec = FALSE;
char *preOutName;

/* uncomment JAMIN_DS390 to always override and use ds390 port
  for mcs51 work.  This is temporary, for compatibility testing. */
/* #define JAMIN_DS390 */
#ifdef JAMIN_DS390
int ds390_jammed = 0;
#endif

// Globally accessible scratch buffer for file names.
char scratchFileName[PATH_MAX];
char buffer[PATH_MAX];

// In MSC VC6 default search path for exe's to path for this

char DefaultExePath[128];

#define OPTION_HELP	"-help"

#define LENGTH(_a)	(sizeof(_a)/sizeof(*(_a)))

#define OPTION_STACK_8BIT 	"--stack-8bit"
#define OPTION_OUT_FMT_IHX	"--out-fmt-ihx"
#define OPTION_LARGE_MODEL	"--model-large"
#define OPTION_MEDIUM_MODEL	"--model-medium"
#define OPTION_SMALL_MODEL	"--model-small"
#define OPTION_FLAT24_MODEL	"--model-flat24"
#define OPTION_DUMP_ALL		"--dumpall"
#define OPTION_PEEP_FILE	"--peep-file"
#define OPTION_LIB_PATH		"--lib-path"
#define OPTION_XSTACK_LOC	"--xstack-loc"
#define OPTION_CALLEE_SAVES	"--callee-saves"
#define OPTION_STACK_LOC	"--stack-loc"
#define OPTION_XRAM_LOC		"--xram-loc"
#define OPTION_IRAM_SIZE	"--iram-size"
#define OPTION_VERSION		"--version"
#define OPTION_DATA_LOC		"--data-loc"
#define OPTION_CODE_LOC		"--code-loc"
#define OPTION_IDATA_LOC	"--idata-loc"
#define OPTION_NO_LOOP_INV 	"--noinvariant"
#define OPTION_NO_LOOP_IND	"--noinduction"
#define OPTION_LESS_PEDANTIC	"--lesspedantic"
#define OPTION_NO_GCSE		"--nogcse"
#define OPTION_SHORT_IS_8BITS 	"--short-is-8bits"

/** Table of all options supported by all ports.
    This table provides:
      * A reference for all options.
      * An easy way to maintain help for the options.
      * Automatic support for setting flags on simple options.
*/
typedef struct {
    /** The short option character e.g. 'h' for -h.  0 for none. */
    char shortOpt;
    /** Long option e.g. "--help".  Includes the -- prefix.  NULL for
        none. */
    const char *longOpt;
    /** Pointer to an int that will be incremented every time the
        option is encountered.  May be NULL.
    */
    int *pparameter;
    /** Help text to go with this option.  May be NULL. */
    const char *help;
} OPTION;

static const OPTION 
optionsTable[] = {
    { 'm',  NULL,                   NULL, "Set the port to use e.g. -mz80." },
    { 'd',  NULL,                   NULL, NULL },
    { 'D',  NULL,                   NULL, "Define macro as in -Dmacro" },
    { 'I',  NULL,                   NULL, "Add to the include (*.h) path, as in -Ipath" },
    { 'A',  NULL,                   NULL, NULL },
    { 'U',  NULL,                   NULL, NULL },
    { 'C',  NULL,                   NULL, "Preprocessor option" },
    { 'M',  NULL,                   NULL, "Preprocessor option" },
    { 'V',  NULL,                   &verboseExec, "Execute verbosely.  Show sub commands as they are run" },
    { 'S',  NULL,                   &noAssemble, "Compile only; do not assemble or link" },
    { 'W',  NULL,                   NULL, "Pass through options to the assembler (a) or linker (l)" },
    { 'L',  NULL,                   NULL, "Add the next field to the library search path" },
    { 'l',  NULL,                   NULL, "Include the given library in the link" },
    { 0,    OPTION_LARGE_MODEL,     NULL, "external data space is used" },
    { 0,    OPTION_MEDIUM_MODEL,    NULL, "not supported" },
    { 0,    OPTION_SMALL_MODEL,     NULL, "internal data space is used (default)" },
    { 0,    OPTION_FLAT24_MODEL,    NULL, "use the flat24 model for the ds390 (default)" },
    { 0,    "--stack-auto",         &options.stackAuto, "Stack automatic variables" },
    { 0,    OPTION_STACK_8BIT,      NULL, "use the 8bit stack for the ds390 (not supported yet)" },
    { 0,    "--stack-10bit",        &options.stack10bit, "use the 10bit stack for ds390 (default)" },
    { 0,    "--xstack",             &options.useXstack, "Use external stack" },
    { 0,    "--generic",            &options.genericPtr, "All unqualified ptrs converted to '_generic'" },
    { 0,    OPTION_NO_GCSE,         NULL, "Disable the GCSE optimisation" },
    { 0,    OPTION_NO_LOOP_INV,     NULL, "Disable optimisation of invariants" },
    { 0,    OPTION_NO_LOOP_IND,     NULL, NULL },
    { 0,    "--nojtbound",          &optimize.noJTabBoundary, "Don't generate boundary check for jump tables" },
    { 0,    "--noloopreverse",      &optimize.noLoopReverse, "Disable the loop reverse optimisation" },
    { 'c',  "--compile-only",       &options.cc_only, "Compile and assemble, but do not link" },
    { 0,    "--dumpraw",            &options.dump_raw, "Dump the internal structure after the initial parse" },
    { 0,    "--dumpgcse",           &options.dump_gcse, NULL },
    { 0,    "--dumploop",           &options.dump_loop, NULL },
    { 0,    "--dumpdeadcode",       &options.dump_kill, NULL },
    { 0,    "--dumpliverange",      &options.dump_range, NULL },
    { 0,    "--dumpregpack",        &options.dump_pack, NULL },
    { 0,    "--dumpregassign",      &options.dump_rassgn, NULL },
    { 0,    "--dumptree",           &options.dump_tree, NULL },
    { 0,    OPTION_DUMP_ALL,        NULL, "Dump the internal structure at all stages" },
    { 0,    OPTION_XRAM_LOC,        NULL, "<nnnn> External Ram start location" },
    { 0,    OPTION_IRAM_SIZE,       NULL, "<nnnn> Internal Ram size" },
    { 0,    OPTION_XSTACK_LOC,      NULL, "<nnnn> External Ram start location" },
    { 0,    OPTION_CODE_LOC,        NULL, "<nnnn> Code Segment Location" },
    { 0,    OPTION_STACK_LOC,       NULL, "<nnnn> Stack pointer initial value" },
    { 0,    OPTION_DATA_LOC,        NULL, "<nnnn> Direct data start location" },
    { 0,    OPTION_IDATA_LOC,       NULL, NULL },
    { 0,    OPTION_PEEP_FILE,       NULL, "<file> use this extra peep-hole file" },
    { 0,    OPTION_LIB_PATH,        NULL, "<path> use this path to search for libraries" },
    { 0,    "--int-long-reent",     &options.intlong_rent, "Use reenterant calls on the int and long support functions" },
    { 0,    "--float-reent",        &options.float_rent, "Use reenterant calls on the floar support functions" },
    { 0,    OPTION_OUT_FMT_IHX,     NULL, NULL },
    { 0,    "--out-fmt-s19",        &options.out_fmt, NULL },
    { 0,    "--cyclomatic",         &options.cyclomatic, NULL },
    { 0,    "--nooverlay",          &options.noOverlay, NULL },
    { 0,    "--main-return",        &options.mainreturn, "Issue a return after main()" },
    { 0,    "--no-peep",            &options.nopeep, "Disable the peephole assembly file optimisation" },
    { 0,    "--no-reg-params",      &options.noRegParams, "On some ports, disable passing some parameters in registers" },
    { 0,    "--peep-asm",           &options.asmpeep, NULL },
    { 0,    "--debug",              &options.debug, "Enable debugging symbol output" },
    { 'v',  OPTION_VERSION,         NULL, "Display sdcc's version" },
    { 0,    "--stack-after-data",   &options.stackOnData, "initialize the stackpointer with the last byte use in DSEG" },
    { 'E',  "--preprocessonly",     &preProcOnly, "Preprocess only, do not compile" },
    { 0,    "--c1mode",             &options.c1mode, "Act in c1 mode.  The input is preprocessed code, the output is assembly code." },
    { 0,    "--help",               NULL, "Display this help" },
    { 0,    OPTION_CALLEE_SAVES,    NULL, "<func[,func,...]> Cause the called function to save registers insted of the caller" },
    { 0,    "--nostdlib",           &options.nostdlib, "Do not include the standard library directory in the search path" },
    { 0,    "--nostdinc",           &options.nostdinc, "Do not include the standard include directory in the search path" },
    { 0,    "--verbose",            &options.verbose, "Trace calls to the preprocessor, assembler, and linker" },
    { 0,    OPTION_LESS_PEDANTIC,   NULL, "Disable some of the more pedantic warnings" },
    { 0,    OPTION_SHORT_IS_8BITS,   NULL, "Make short 8bits (for old times sake)" },
    { 0,    "--profile",            &options.profile, "On supported ports, generate extra profiling information" },
    { 0,    "--fommit-frame-pointer", &options.ommitFramePtr, "Leave out the frame pointer." }
};

/** Table of all unsupported options and help text to display when one
    is used.
*/
typedef struct {
    /** shortOpt as in OPTIONS. */
    char shortOpt;
    /** longOpt as in OPTIONS. */
    const char *longOpt;
    /** Message to display inside W_UNSUPPORTED_OPT when this option
        is used. */
    const char *message;
} UNSUPPORTEDOPT;

static const UNSUPPORTEDOPT 
unsupportedOptTable[] = {
    { 'a',  NULL,	"use --stack-auto instead." },
    { 'g',  NULL,	"use --generic instead" },
    { 'X',  NULL,	"use --xstack-loc instead" },
    { 'x',  NULL,	"use --xstack instead" },
    { 'p',  NULL,	"use --stack-loc instead" },
    { 'P',  NULL,	"use --stack-loc instead" },
    { 'i',  NULL,	"use --idata-loc instead" },
    { 'r',  NULL,	"use --xdata-loc instead" },
    { 's',  NULL,	"use --code-loc instead" },
    { 'Y',  NULL,	"use -I instead" }
};

/** List of all default constant macros.
 */
static const char *_baseValues[] = {
  "cpp", "{bindir}{sep}sdcpp",
  "cppextraopts", "",
  /* Path seperator character */
  "sep", DIR_SEPARATOR_STRING,
  NULL
};

static const char *_preCmd = "{cpp} -Wall -lang-c++ -DSDCC=1 {cppextraopts} {fullsrcfilename} {cppoutfilename}";

PORT *port;

static PORT *_ports[] =
{
#if !OPT_DISABLE_MCS51
  &mcs51_port,
#endif
#if !OPT_DISABLE_GBZ80
  &gbz80_port,
#endif
#if !OPT_DISABLE_Z80
  &z80_port,
#endif
#if !OPT_DISABLE_AVR
  &avr_port,
#endif
#if !OPT_DISABLE_DS390
  &ds390_port,
#endif
#if !OPT_DISABLE_PIC
  &pic_port,
#endif
#if !OPT_DISABLE_I186
  &i186_port,
#endif
#if !OPT_DISABLE_TLCS900H
  &tlcs900h_port,
#endif
};

#define NUM_PORTS (sizeof(_ports)/sizeof(_ports[0]))

/**
   remove me - TSD a hack to force sdcc to generate gpasm format .asm files.
 */
extern void picglue ();

/** Sets the port to the one given by the command line option.
    @param    The name minus the option (eg 'mcs51')
    @return     0 on success.
*/
static void
_setPort (const char *name)
{
  int i;
  for (i = 0; i < NUM_PORTS; i++)
    {
      if (!strcmp (_ports[i]->target, name))
	{
	  port = _ports[i];
	  return;
	}
    }
  /* Error - didnt find */
  werror (E_UNKNOWN_TARGET, name);
  exit (1);
}

static void
_validatePorts (void)
{
  int i;
  for (i = 0; i < NUM_PORTS; i++)
    {
      if (_ports[i]->magic != PORT_MAGIC)
	{
	  wassertl (0, "Port definition structure is incomplete");
	}
    }
}

static void
_findPort (int argc, char **argv)
{
  _validatePorts ();

  while (argc--)
    {
      if (!strncmp (*argv, "-m", 2))
	{
	  _setPort (*argv + 2);
	  return;
	}
      argv++;
    }
  /* Use the first in the list */
  port = _ports[0];
}

/*-----------------------------------------------------------------*/
/* printVersionInfo - prints the version info        */
/*-----------------------------------------------------------------*/
void
printVersionInfo ()
{
  int i;

  fprintf (stderr,
	   "SDCC : ");
  for (i = 0; i < NUM_PORTS; i++)
    fprintf (stderr, "%s%s", i == 0 ? "" : "/", _ports[i]->target);

  fprintf (stderr, " %s"
#ifdef SDCC_SUB_VERSION_STR
	   "/" SDCC_SUB_VERSION_STR
#endif
           " (" __DATE__ ")"
#ifdef __CYGWIN__
	   " (CYGWIN)\n"
#else
#ifdef __DJGPP__
	   " (DJGPP) \n"
#else
#if defined(_MSC_VER)
	   " (WIN32) \n"
#else
	   " (UNIX) \n"
#endif
#endif
#endif

	   ,VersionString
    );
}

/*-----------------------------------------------------------------*/
/* printUsage - prints command line syntax         */
/*-----------------------------------------------------------------*/
void
printUsage ()
{
    int i;
    printVersionInfo();
    fprintf (stdout,
             "Usage : sdcc [options] filename\n"
             "Options :-\n"
             );
    
    for (i = 0; i < LENGTH(optionsTable); i++) {
        fprintf(stdout, "  %c%c  %-20s  %s\n", 
                optionsTable[i].shortOpt !=0 ? '-' : ' ',
                optionsTable[i].shortOpt !=0 ? optionsTable[i].shortOpt : ' ',
                optionsTable[i].longOpt != NULL ? optionsTable[i].longOpt : "",
                optionsTable[i].help != NULL ? optionsTable[i].help : ""
                );
    }
    exit (0);
}

/*-----------------------------------------------------------------*/
/* parseWithComma - separates string with comma                    */
/*-----------------------------------------------------------------*/
void
parseWithComma (char **dest, char *src)
{
  int i = 0;

  strtok (src, "\r\n \t");
  /* skip the initial white spaces */
  while (isspace (*src))
    src++;
  dest[i++] = src;
  while (*src)
    {
      if (*src == ',')
	{
	  *src = '\0';
	  src++;
	  if (*src)
	    dest[i++] = src;
	  continue;
	}
      src++;
    }
}

/*-----------------------------------------------------------------*/
/* setDefaultOptions - sets the default options                    */
/*-----------------------------------------------------------------*/
static void
setDefaultOptions ()
{
  int i;

  for (i = 0; i < 128; i++)
    preArgv[i] = asmOptions[i] =
      linkOptions[i] = relFiles[i] = libFiles[i] =
      libPaths[i] = NULL;

  /* first the options part */
  options.stack_loc = 0;	/* stack pointer initialised to 0 */
  options.xstack_loc = 0;	/* xternal stack starts at 0 */
  options.code_loc = 0;		/* code starts at 0 */
  options.data_loc = 0x0030;	/* data starts at 0x0030 */
  options.xdata_loc = 0;
  options.idata_loc = 0x80;
  options.genericPtr = 1;	/* default on */
  options.nopeep = 0;
  options.model = port->general.default_model;
  options.nostdlib = 0;
  options.nostdinc = 0;
  options.verbose = 0;
  options.shortis8bits = 0;

  options.stack10bit=0;

  /* now for the optimizations */
  /* turn on the everything */
  optimize.global_cse = 1;
  optimize.label1 = 1;
  optimize.label2 = 1;
  optimize.label3 = 1;
  optimize.label4 = 1;
  optimize.loopInvariant = 1;
  optimize.loopInduction = 1;

  /* now for the ports */
  port->setDefaultOptions ();
}

/*-----------------------------------------------------------------*/
/* processFile - determines the type of file from the extension    */
/*-----------------------------------------------------------------*/
static void
processFile (char *s)
{
  char *fext = NULL;

  /* get the file extension */
  fext = s + strlen (s);
  while ((fext != s) && *fext != '.')
    fext--;

  /* now if no '.' then we don't know what the file type is
     so give a warning and return */
  if (fext == s)
    {
      werror (W_UNKNOWN_FEXT, s);
      return;
    }

  /* otherwise depending on the file type */
  if (strcmp (fext, ".c") == 0 || strcmp (fext, ".C") == 0 || options.c1mode)
    {
      /* source file name : not if we already have a
         source file */
      if (srcFileName)
	{
	  werror (W_TOO_MANY_SRC, s);
	  return;
	}

      /* the only source file */
      if (!(srcFile = fopen ((fullSrcFileName = s), "r")))
	{
	  werror (E_FILE_OPEN_ERR, s);
	  exit (1);
 	}

      /* copy the file name into the buffer */
      strcpy (buffer, s);

      /* get rid of the "." */
      strtok (buffer, ".");
      srcFileName = Safe_alloc ( strlen (buffer) + 1);
      strcpy (srcFileName, buffer);

      /* get rid of any path information
         for the module name; do this by going
         backwards till we get to either '/' or '\' or ':'
         or start of buffer */
      fext = buffer + strlen (buffer);
      while (fext != buffer &&
	     *(fext - 1) != '\\' &&
	     *(fext - 1) != '/' &&
	     *(fext - 1) != ':')
	fext--;
      moduleName = Safe_alloc ( strlen (fext) + 1);
      strcpy (moduleName, fext);

      return;
    }

  /* if the extention is type .rel or .r or .REL or .R
     addtional object file will be passed to the linker */
  if (strcmp (fext, ".r") == 0 || strcmp (fext, ".rel") == 0 ||
      strcmp (fext, ".R") == 0 || strcmp (fext, ".REL") == 0 ||
      strcmp (fext, port->linker.rel_ext) == 0)
    {
      relFiles[nrelFiles++] = s;
      return;
    }

  /* if .lib or .LIB */
  if (strcmp (fext, ".lib") == 0 || strcmp (fext, ".LIB") == 0)
    {
      libFiles[nlibFiles++] = s;
      return;
    }

  werror (W_UNKNOWN_FEXT, s);

}

static void
_processC1Arg (char *s)
{
  if (srcFileName)
    {
      if (options.out_name)
	{
	  werror (W_TOO_MANY_SRC, s);
	  return;
	}
      options.out_name = Safe_strdup (s);
    }
  else
    {
      processFile (s);
    }
}

static void
_setModel (int model, const char *sz)
{
  if (port->general.supported_models & model)
    options.model = model;
  else
    werror (W_UNSUPPORTED_MODEL, sz, port->target);
}

/** Gets the string argument to this option.  If the option is '--opt'
    then for input of '--optxyz' or '--opt xyz' returns xyz.
*/
static char *
getStringArg(const char *szStart, char **argv, int *pi, int argc)
{
  if (argv[*pi][strlen(szStart)]) 
    {
      return &argv[*pi][strlen(szStart)];
    }
  else 
    {
      ++(*pi);
      if (*pi >= argc) 
        {
          werror (E_ARGUMENT_MISSING, szStart);
          /* Die here rather than checking for errors later. */
          exit(-1);
        }
      else 
        {
          return argv[*pi];
        }
    }
}

/** Gets the integer argument to this option using the same rules as
    getStringArg. 
*/
static int
getIntArg(const char *szStart, char **argv, int *pi, int argc)
{
    return (int)floatFromVal(constVal(getStringArg(szStart, argv, pi, argc)));
}

static void
verifyShortOption(const char *opt)
{
  if (strlen(opt) != 2)
    {
      werror (W_EXCESS_SHORT_OPTIONS, opt);
    }
}

static bool
tryHandleUnsupportedOpt(char **argv, int *pi)
{
    if (argv[*pi][0] == '-') 
        {
            const char *longOpt = "";
            char shortOpt = -1;
            int i;

            if (argv[*pi][1] == '-') 
                {
                    // Long option.
                    longOpt = argv[*pi];
                }
            else 
                {
                    shortOpt = argv[*pi][1];
                }
            for (i = 0; i < LENGTH(unsupportedOptTable); i++) 
                {
                    if (unsupportedOptTable[i].shortOpt == shortOpt || 
                        (longOpt && unsupportedOptTable[i].longOpt && !strcmp(unsupportedOptTable[i].longOpt, longOpt))) {
                        // Found an unsupported opt.
                        char buffer[100];
                        sprintf(buffer, "%s%c%c", longOpt ? longOpt : "", shortOpt ? '-' : ' ', shortOpt ? shortOpt : ' ');
                        werror (W_UNSUPP_OPTION, buffer, unsupportedOptTable[i].message);
                        return 1;
                    }
                }
            // Didn't find in the table
            return 0;
        }
    else 
        {
            // Not an option, so can't be unsupported :)
            return 0;
    }
}

static bool
tryHandleSimpleOpt(char **argv, int *pi)
{
    if (argv[*pi][0] == '-') 
        {
            const char *longOpt = "";
            char shortOpt = -1;
            int i;

            if (argv[*pi][1] == '-') 
                {
                    // Long option.
                    longOpt = argv[*pi];
                }
            else 
                {
                    shortOpt = argv[*pi][1];
                }

            for (i = 0; i < LENGTH(optionsTable); i++) 
              {
                if (optionsTable[i].shortOpt == shortOpt ||
                    (longOpt && optionsTable[i].longOpt && 
                     strcmp(optionsTable[i].longOpt, longOpt) == 0))
                  {

                    // If it is a flag then we can handle it here
                    if (optionsTable[i].pparameter != NULL) 
                      {
                        if (optionsTable[i].shortOpt == shortOpt)
                          {
                            verifyShortOption(argv[*pi]);
                          }

                        (*optionsTable[i].pparameter)++;
                        return 1;
                      }
                    else {
                      // Not a flag.  Handled manually later.
                      return 0;
                    }
                  }
              }
            // Didn't find in the table
            return 0;
        }
    else 
        {
            // Not an option, so can't be handled.
            return 0;
        }
}

/*-----------------------------------------------------------------*/
/* parseCmdLine - parses the command line and sets the options     */
/*-----------------------------------------------------------------*/
int
parseCmdLine (int argc, char **argv)
{
  int i;

  /* go thru all whole command line */
  for (i = 1; i < argc; i++)
    {
      if (i >= argc)
	break;

      if (tryHandleUnsupportedOpt(argv, &i) == TRUE) 
          {
              continue;
          }

      if (tryHandleSimpleOpt(argv, &i) == TRUE)
          {
              continue;
          }

      /* options */
      if (argv[i][0] == '-' && argv[i][1] == '-')
	{
	  if (strcmp (argv[i], OPTION_HELP) == 0)
	    {
	      printUsage ();
	      exit (0);
	    }

	  if (strcmp (argv[i], OPTION_STACK_8BIT) == 0)
	    {
	      options.stack10bit = 0;
	      continue;
	    }

	  if (strcmp (argv[i], OPTION_OUT_FMT_IHX) == 0)
	    {
	      options.out_fmt = 0;
	      continue;
	    }

	  if (strcmp (argv[i], OPTION_LARGE_MODEL) == 0)
	    {
	      _setModel (MODEL_LARGE, argv[i]);
	      continue;
	    }

	  if (strcmp (argv[i], OPTION_MEDIUM_MODEL) == 0)
	    {
	      _setModel (MODEL_MEDIUM, argv[i]);
	      continue;
	    }

	  if (strcmp (argv[i], OPTION_SMALL_MODEL) == 0)
	    {
	      _setModel (MODEL_SMALL, argv[i]);
	      continue;
	    }

	  if (strcmp (argv[i], OPTION_FLAT24_MODEL) == 0)
	    {
	      _setModel (MODEL_FLAT24, argv[i]);
	      continue;
	    }

	  if (strcmp (argv[i], OPTION_DUMP_ALL) == 0)
	    {
	      options.dump_rassgn =
		options.dump_pack =
		options.dump_range =
		options.dump_kill =
		options.dump_loop =
		options.dump_gcse =
		options.dump_raw = 1;
	      continue;
	    }

	  if (strcmp (argv[i], OPTION_PEEP_FILE) == 0)
	    {
                options.peep_file = getStringArg(OPTION_PEEP_FILE, argv, &i, argc);
                continue;
	    }

	  if (strcmp (argv[i], OPTION_LIB_PATH) == 0)
            {
		libPaths[nlibPaths++] = getStringArg(OPTION_LIB_PATH, argv, &i, argc);
                continue;
	    }

	  if (strcmp (argv[i], OPTION_VERSION) == 0)
	    {
	      printVersionInfo ();
              exit (0);
	      continue;
	    }

	  if (strcmp (argv[i], OPTION_CALLEE_SAVES) == 0)
	    {
                parseWithComma (options.calleeSaves, getStringArg(OPTION_CALLEE_SAVES, argv, &i, argc));
                continue;
	    }

	  if (strcmp (argv[i], OPTION_XSTACK_LOC) == 0)
	    {
                options.xstack_loc = getIntArg(OPTION_XSTACK_LOC, argv, &i, argc);
                continue;
	    }

	  if (strcmp (argv[i], OPTION_STACK_LOC) == 0)
	    {
                options.stack_loc = getIntArg(OPTION_STACK_LOC, argv, &i, argc);
                continue;
	    }

	  if (strcmp (argv[i], OPTION_XRAM_LOC) == 0)
	    {
                options.xdata_loc = getIntArg(OPTION_XRAM_LOC, argv, &i, argc);
                continue;
	    }

	  if (strcmp (argv[i], OPTION_IRAM_SIZE) == 0)
	    {
                options.iram_size = getIntArg(OPTION_IRAM_SIZE, argv, &i, argc);
                continue;
	    }

	  if (strcmp (argv[i], OPTION_DATA_LOC) == 0)
	    {
                options.data_loc = getIntArg(OPTION_DATA_LOC, argv, &i, argc);
                continue;
	    }

	  if (strcmp (argv[i], OPTION_IDATA_LOC) == 0)
	    {
                options.idata_loc = getIntArg(OPTION_IDATA_LOC, argv, &i, argc);
                continue;
	    }

	  if (strcmp (argv[i], OPTION_CODE_LOC) == 0)
	    {
                options.code_loc = getIntArg(OPTION_CODE_LOC, argv, &i, argc);
                continue;
	    }

	  if (strcmp (argv[i], OPTION_NO_GCSE) == 0)
	    {
	      optimize.global_cse = 0;
	      continue;
	    }

	  if (strcmp (argv[i], OPTION_NO_LOOP_INV) == 0)
	    {
	      optimize.loopInvariant = 0;
	      continue;
	    }

	  if (strcmp (argv[i], OPTION_NO_LOOP_IND) == 0)
	    {
	      optimize.loopInduction = 0;
	      continue;
	    }

          if (strcmp (argv[i], OPTION_LESS_PEDANTIC) == 0) 
            {
	      options.lessPedantic = 1;
              setErrorLogLevel(ERROR_LEVEL_WARNING);
              continue;
            }

	  if (strcmp (&argv[i][1], OPTION_SHORT_IS_8BITS) == 0) 
            {
              options.shortis8bits=1;
              continue;
            }
          
	  if (!port->parseOption (&argc, argv, &i))
	    {
	      werror (W_UNKNOWN_OPTION, argv[i]);
	    }
	  else
	    {
	      continue;
	    }
	}

      /* if preceded by  '-' then option */
      if (*argv[i] == '-')
	{
	  switch (argv[i][1])
	    {
	    case 'h':
              verifyShortOption(argv[i]);

	      printUsage ();
	      exit (0);
	      break;

	    case 'm':
	      /* Used to select the port */
	      _setPort (argv[i] + 2);
	      break;

	    case 'c':
              verifyShortOption(argv[i]);

	      options.cc_only = 1;
	      break;

	    case 'L':
                libPaths[nlibPaths++] = getStringArg("-L", argv, &i, argc);
                break;

            case 'l':
                libFiles[nlibFiles++] = getStringArg("-l", argv, &i, argc);
                break;

	    case 'W':
	      /* linker options */
	      if (argv[i][2] == 'l')
		{
                    parseWithComma(linkOptions, getStringArg("-Wl", argv, &i, argc));
		}
	      else
		{
		  /* assembler options */
		  if (argv[i][2] == 'a')
		    {
			parseWithComma ((char **) asmOptions, getStringArg("-Wa", argv, &i, argc));
		    }
		  else
		    {
		      werror (W_UNKNOWN_OPTION, argv[i]);
		    }
		}
	      break;

	    case 'v':
              verifyShortOption(argv[i]);

	      printVersionInfo ();
	      exit (0);
	      break;

	      /* preprocessor options */
	    case 'M':
	      {
		preProcOnly = 1;
		addToList (preArgv, "-M");
		break;
	      }
	    case 'C':
	      {
		addToList (preArgv, "-C");
		break;
	      }
	    case 'd':
	    case 'D':
	    case 'I':
	    case 'A':
	    case 'U':
	      {
		char sOpt = argv[i][1];
		char *rest;

		if (argv[i][2] == ' ' || argv[i][2] == '\0')
		  {
		    i++;
                    if (i >= argc) 
                      {
                          /* No argument. */
                          werror(E_ARGUMENT_MISSING, argv[i-1]);
                          break;
                      }
                    else 
                      {
                          rest = argv[i];
                      }
		  }
		else
		  rest = &argv[i][2];

		if (sOpt == 'Y')
		  sOpt = 'I';

		sprintf (buffer, "-%c%s", sOpt, rest);
		addToList (preArgv, buffer);
	      }
	      break;

	    default:
	      if (!port->parseOption (&argc, argv, &i))
		werror (W_UNKNOWN_OPTION, argv[i]);
	    }
	  continue;
	}

      if (!port->parseOption (&argc, argv, &i))
	{
	  /* no option must be a filename */
	  if (options.c1mode)
	    _processC1Arg (argv[i]);
	  else
	    processFile (argv[i]);
	}
    }

  /* set up external stack location if not explicitly specified */
  if (!options.xstack_loc)
    options.xstack_loc = options.xdata_loc;

  /* if debug option is set the open the cdbFile */
  if (options.debug && srcFileName)
    {
      sprintf (scratchFileName, "%s.cdb", srcFileName);
      if ((cdbFile = fopen (scratchFileName, "w")) == NULL)
	werror (E_FILE_OPEN_ERR, scratchFileName);
      else
	{
	  /* add a module record */
	  fprintf (cdbFile, "M:%s\n", moduleName);
	}
    }
  return 0;
}

/*-----------------------------------------------------------------*/
/* linkEdit : - calls the linkage editor  with options             */
/*-----------------------------------------------------------------*/
static void
linkEdit (char **envp)
{
  FILE *lnkfile;
  char *segName, *c;

  int i;
  if (!srcFileName)
    srcFileName = "temp";

  /* first we need to create the <filename>.lnk file */
  sprintf (scratchFileName, "%s.lnk", srcFileName);
  if (!(lnkfile = fopen (scratchFileName, "w")))
    {
      werror (E_FILE_OPEN_ERR, scratchFileName);
      exit (1);
    }

  /* now write the options */
  fprintf (lnkfile, "-mux%c\n", (options.out_fmt ? 's' : 'i'));

  /* if iram size specified */
  if (options.iram_size)
    fprintf (lnkfile, "-a 0x%04x\n", options.iram_size);

  if (options.debug)
    fprintf (lnkfile, "-z\n");

#define WRITE_SEG_LOC(N, L) \
    segName = Safe_strdup(N); \
    c = strtok(segName, " \t"); \
    fprintf (lnkfile,"-b %s = 0x%04x\n", c, L); \
    if (segName) { Safe_free(segName); }

  /* code segment start */
  WRITE_SEG_LOC (CODE_NAME, options.code_loc);

  /* data segment start */
  WRITE_SEG_LOC (DATA_NAME, options.data_loc);

  /* xdata start */
  WRITE_SEG_LOC (XDATA_NAME, options.xdata_loc);

  /* indirect data */
  WRITE_SEG_LOC (IDATA_NAME, options.idata_loc);

  /* bit segment start */
  WRITE_SEG_LOC (BIT_NAME, 0);

  /* add the extra linker options */
  for (i = 0; linkOptions[i]; i++)
    fprintf (lnkfile, "%s\n", linkOptions[i]);

  /* other library paths if specified */
  for (i = 0; i < nlibPaths; i++)
    fprintf (lnkfile, "-k %s\n", libPaths[i]);

  /* standard library path */
  if (!options.nostdlib)
    {
/****
      if (TARGET_IS_DS390)
	{
	  c = "ds390";
	}
      else
*****/
	{
	  switch (options.model)
	    {
	    case MODEL_SMALL:
	      c = "small";
	      break;
	    case MODEL_LARGE:
	      c = "large";
	      break;
	    case MODEL_FLAT24:
	      /* c = "flat24"; */
	      c = "ds390";
	      break;
	    default:
	      werror (W_UNKNOWN_MODEL, __FILE__, __LINE__);
	      c = "unknown";
	      break;
	    }
	}
      mfprintf (lnkfile, getRuntimeVariables(), "-k {libdir}{sep}%s\n", c);

      /* standard library files */
      /* if (strcmp (port->target, "ds390") == 0) */
      if (options.model == MODEL_FLAT24)
	{
	  fprintf (lnkfile, "-l %s\n", STD_DS390_LIB);
	}
      fprintf (lnkfile, "-l %s\n", STD_LIB);
      fprintf (lnkfile, "-l %s\n", STD_INT_LIB);
      fprintf (lnkfile, "-l %s\n", STD_LONG_LIB);
      fprintf (lnkfile, "-l %s\n", STD_FP_LIB);
    }

  /* additional libraries if any */
  for (i = 0; i < nlibFiles; i++)
    fprintf (lnkfile, "-l %s\n", libFiles[i]);

  /* put in the object files */
  if (strcmp (srcFileName, "temp"))
    fprintf (lnkfile, "%s ", srcFileName);

  for (i = 0; i < nrelFiles; i++)
    fprintf (lnkfile, "%s\n", relFiles[i]);

  fprintf (lnkfile, "\n-e\n");
  fclose (lnkfile);

  if (options.verbose)
    printf ("sdcc: Calling linker...\n");

  if (port->linker.cmd)
    {
      char buffer2[PATH_MAX];
      buildCmdLine (buffer2, port->linker.cmd, srcFileName, NULL, NULL, NULL);
      buildCmdLine2 (buffer, buffer2);
    }
  else
    {
      buildCmdLine2 (buffer, port->linker.mcmd);
    }

  if (my_system (buffer))
    {
      exit (1);
    }

  if (strcmp (srcFileName, "temp") == 0)
    {
      /* rename "temp.cdb" to "firstRelFile.cdb" */
      char *f = strtok (Safe_strdup (relFiles[0]), ".");
      f = strcat (f, ".cdb");
      rename ("temp.cdb", f);
      srcFileName = NULL;
    }
}

/*-----------------------------------------------------------------*/
/* assemble - spawns the assembler with arguments                  */
/*-----------------------------------------------------------------*/
static void
assemble (char **envp)
{
  if (port->assembler.cmd)
    {
      buildCmdLine (buffer, port->assembler.cmd, srcFileName, NULL,
                    options.debug ? port->assembler.debug_opts : port->assembler.plain_opts,
                    asmOptions);
    }
  else
    {
      buildCmdLine2 (buffer, port->assembler.mcmd);
    }

  if (my_system (buffer))
    {
      /* either system() or the assembler itself has reported an error
         perror ("Cannot exec assembler");
       */
      exit (1);
    }
}

/*-----------------------------------------------------------------*/
/* preProcess - spawns the preprocessor with arguments       */
/*-----------------------------------------------------------------*/
static int
preProcess (char **envp)
{
  preOutName = NULL;

  if (!options.c1mode)
    {
      /* if using external stack define the macro */
      if (options.useXstack)
	addToList (preArgv, "-DSDCC_USE_XSTACK");

      /* set the macro for stack autos  */
      if (options.stackAuto)
	addToList (preArgv, "-DSDCC_STACK_AUTO");

      /* set the macro for stack autos  */
      if (options.stack10bit)
	addToList (preArgv, "-DSDCC_STACK_TENBIT");

      /* set the macro for no overlay  */
      if (options.noOverlay)
        addToList (preArgv, "-DSDCC_NOOVERLAY");

      /* set the macro for large model  */
      switch (options.model)
	{
	case MODEL_LARGE:
	  addToList (preArgv, "-DSDCC_MODEL_LARGE");
	  break;
	case MODEL_SMALL:
	  addToList (preArgv, "-DSDCC_MODEL_SMALL");
	  break;
	case MODEL_COMPACT:
	  addToList (preArgv, "-DSDCC_MODEL_COMPACT");
	  break;
	case MODEL_MEDIUM:
	  addToList (preArgv, "-DSDCC_MODEL_MEDIUM");
	  break;
	case MODEL_FLAT24:
	  addToList (preArgv, "-DSDCC_MODEL_FLAT24");
	  break;
	default:
	  werror (W_UNKNOWN_MODEL, __FILE__, __LINE__);
	  break;
	}

      /* add port (processor information to processor */
      addToList (preArgv, "-DSDCC_{port}");
      addToList (preArgv, "-D__{port}");

      /* standard include path */
      if (!options.nostdinc) {
	addToList (preArgv, "-I{includedir}");
      }

      setMainValue ("cppextraopts", join(preArgv));
      
      if (!preProcOnly)
          preOutName = Safe_strdup (tempfilename ());

      /* Have to set cppoutfilename to something, even if just pre-processing. */
      setMainValue ("cppoutfilename", preOutName ? preOutName : "");
	
      if (options.verbose)
	printf ("sdcc: Calling preprocessor...\n");

      buildCmdLine2 (buffer, _preCmd);

      if (my_system (buffer))
	{
          // @FIX: Dario Vecchio 03-05-2001
          if (preOutName)
            {
              unlink (preOutName);
              Safe_free (preOutName);
            }
          // EndFix
	  exit (1);
	}

      if (preProcOnly)
      {
	exit (0);
      }
    }
  else
    {
      preOutName = fullSrcFileName;
    }

  yyin = fopen (preOutName, "r");
  if (yyin == NULL)
    {
      perror ("Preproc file not found\n");
      exit (1);
    }

  return 0;
}

static bool
_setPaths (const char *pprefix)
{
  /* Logic:
      Given the prefix and how the directories were layed out at
      configure time, see if the library and include directories are
      where expected.  If so, set.
  */
  getPathDifference (buffer, PREFIX, SDCC_INCLUDE_DIR);
  strcpy (scratchFileName, pprefix);
  strcat (scratchFileName, buffer);

  if (pathExists (scratchFileName))
    {
      setMainValue ("includedir", scratchFileName);
    }
  else
    {
      return FALSE;
    }

  getPathDifference (buffer, PREFIX, SDCC_LIB_DIR);
  strcpy (scratchFileName, pprefix);
  strcat (scratchFileName, buffer);

  if (pathExists (scratchFileName))
    {
      setMainValue ("libdir", scratchFileName);
    }
  else
    {
      return FALSE;
    }

  return TRUE;
}

static void
_discoverPaths (const char *argv0)
{
  /* Logic:
      1.  Try the SDCCDIR environment variable.
      2.  If (1) fails, and if the argv[0] includes a path, attempt to find the include
      and library paths with respect to that.  Note that under win32
      argv[0] is always the full path to the program.
      3.  If (1) and (2) fail, fall back to the compile time defaults.

      Detecting assumes the same layout as when configured.  If the
      directories have been further moved about then discovery will
      fail.
  */

  /* Some input cases:
        "c:\fish\sdcc\bin\sdcc"
        "../bin/sdcc"
        "/home/fish/bin/sdcc"

      Note that ./sdcc is explicitly not supported as there isn't
      enough information.
  */
  /* bindir is handled differently to the lib and include directories.
     It's rather unfortunate, but required due to the different
     install and development layouts.  Logic is different as well.
     Sigh.
   */
  if (strchr (argv0, DIR_SEPARATOR_CHAR))
    {
      strcpy (scratchFileName, argv0);
      *strrchr (scratchFileName, DIR_SEPARATOR_CHAR) = '\0';
      setMainValue ("bindir", scratchFileName);
      ExePathList[0] = Safe_strdup (scratchFileName);
    }
  else if (getenv (SDCCDIR_NAME) != NULL)
    {
      getPathDifference (buffer, PREFIX, BINDIR);
      strcpy (scratchFileName, getenv (SDCCDIR_NAME));
      strcat (scratchFileName, buffer);
      setMainValue ("bindir", scratchFileName);
      ExePathList[0] = Safe_strdup (scratchFileName);
    }
  else
    {
      setMainValue ("bindir", BINDIR);
      ExePathList[0] = BINDIR;
    }

  do 
    {
      /* Case 1 */
      if (getenv (SDCCDIR_NAME) != NULL)
        {
          if (_setPaths (getenv (SDCCDIR_NAME)))
            {
              /* Successfully set. */
              break;
            }
          else
            {
              /* Include and lib weren't where expected. */
            }
        }
      /* Case 2 */
      if (strchr (argv0, DIR_SEPARATOR_CHAR))
        {
          char *pbase = getPrefixFromBinPath (argv0);

          if (pbase == NULL)
            {
              /* A bad path.  Skip. */
            }
          else
            {
              if (_setPaths (pbase))
                {
                  /* Successfully set. */
                  break;
                }
              else
                {
                  /* Include and lib weren't where expected. */
                }
            }
        }
      /* Case 3 */
      setMainValue ("includedir", SDCC_INCLUDE_DIR);
      setMainValue ("libdir", SDCC_LIB_DIR);
    } while (0);
}

static void
initValues (void)
{
  populateMainValues (_baseValues);
  setMainValue ("port", port->target);
  setMainValue ("objext", port->linker.rel_ext);
  setMainValue ("asmext", port->assembler.file_ext);

  setMainValue ("fullsrcfilename", fullSrcFileName ? fullSrcFileName : "fullsrcfilename");
  setMainValue ("srcfilename", srcFileName ? srcFileName : "srcfilename");
}

/*
 * main routine
 * initialises and calls the parser
 */

int
main (int argc, char **argv, char **envp)
{
  /* turn all optimizations off by default */
  memset (&optimize, 0, sizeof (struct optimize));

  /*printVersionInfo (); */

  if (NUM_PORTS==0) {
    fprintf (stderr, "Build error: no ports are enabled.\n");
    exit (1);
  }

  _findPort (argc, argv);
#ifdef JAMIN_DS390
  if (strcmp(port->target, "mcs51") == 0) {
    printf("DS390 jammed in A\n");
 	  _setPort ("ds390");
    ds390_jammed = 1;
  }
#endif
  /* Initalise the port. */
  if (port->init)
    port->init ();

  // Create a default exe search path from the path to the sdcc command


  setDefaultOptions ();
#ifdef JAMIN_DS390
  if (ds390_jammed) {
    options.model = MODEL_SMALL;
    options.stack10bit=0;
  }
#endif
  parseCmdLine (argc, argv);

  /* if no input then printUsage & exit */
  if ((!options.c1mode && !srcFileName && !nrelFiles) || 
      (options.c1mode && !srcFileName && !options.out_name))
    {
      printUsage ();
      exit (0);
    }

  initValues ();
  _discoverPaths (argv[0]);

  if (srcFileName)
    {
      preProcess (envp);

      initMem ();

      port->finaliseOptions ();

      initSymt ();
      initiCode ();
      initCSupport ();
      initPeepHole ();

      if (options.verbose)
	printf ("sdcc: Generating code...\n");

      yyparse ();

      if (!fatalError)
	{
	  if (TARGET_IS_PIC) {
	    /* TSD PIC port hack - if the PIC port option is enabled
	       and SDCC is used to generate PIC code, then we will
	       generate .asm files in gpasm's format instead of SDCC's
	       assembler's format
	    */
#if !OPT_DISABLE_PIC
	    picglue ();
#endif
	  } else {
	    glue ();
	  }

	  if (fatalError)
	    {
              // @FIX: Dario Vecchio 03-05-2001
              if (preOutName)
                {
                  if (yyin && yyin != stdin)
                    fclose (yyin);
                  unlink (preOutName);
                  Safe_free (preOutName);
                }
              // EndFix
	      return 1;
	    }
	  if (!options.c1mode && !noAssemble)
	    {
	      if (options.verbose)
		printf ("sdcc: Calling assembler...\n");
	      assemble (envp);
	    }
	}
      else
	{
          // @FIX: Dario Vecchio 03-05-2001
          if (preOutName)
            {
              if (yyin && yyin != stdin)
                fclose (yyin);
              unlink (preOutName);
              Safe_free (preOutName);
            }
          // EndFix
          #if defined (__MINGW32__) || defined (__CYGWIN__) || defined (_MSC_VER)
          rm_tmpfiles();
          #endif
	  return 1;
	}

    }

  closeDumpFiles();

  if (cdbFile)
    fclose (cdbFile);

  if (preOutName && !options.c1mode)
    {
      unlink (preOutName);
      Safe_free (preOutName);
    }

  if (!options.cc_only &&
      !fatalError &&
      !noAssemble &&
      !options.c1mode &&
      (srcFileName || nrelFiles))
    {
      if (port->linker.do_link)
	port->linker.do_link ();
      else
	linkEdit (envp);
    }

  if (yyin && yyin != stdin)
    fclose (yyin);

  return 0;

}

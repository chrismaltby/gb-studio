/** @file main.c
    mcs51 specific general functions.

    Note that mlh prepended _mcs51_ on the static functions.  Makes
    it easier to set a breakpoint using the debugger.
*/
#include "common.h"
#include "main.h"
#include "ralloc.h"
#include "gen.h"

static char _defaultRules[] =
{
#include "peeph.rul"
};

/* list of key words used by msc51 */
static char *_mcs51_keywords[] =
{
  "at",
  "bit",
  "code",
  "critical",
  "data",
  "far",
  "idata",
  "interrupt",
  "near",
  "pdata",
  "reentrant",
  "sfr",
  "sbit",
  "using",
  "xdata",
  "_data",
  "_code",
  "_generic",
  "_near",
  "_xdata",
  "_pdata",
  "_idata",
  "_naked",
  NULL
};


void mcs51_assignRegisters (eBBlock ** ebbs, int count);

static int regParmFlg = 0;	/* determine if we can register a parameter */

static void
_mcs51_init (void)
{
  asm_addTree (&asm_asxxxx_mapping);
}

static void
_mcs51_reset_regparm ()
{
  regParmFlg = 0;
}

static int
_mcs51_regparm (sym_link * l)
{
  /* for this processor it is simple
     can pass only the first parameter in a register */
  if (regParmFlg)
    return 0;

  regParmFlg = 1;
  return 1;
}

static bool
_mcs51_parseOptions (int *pargc, char **argv, int *i)
{
  /* TODO: allow port-specific command line options to specify
   * segment names here.
   */
  return FALSE;
}

static void
_mcs51_finaliseOptions (void)
{
  if (options.model == MODEL_LARGE) {
      port->mem.default_local_map = xdata;
      port->mem.default_globl_map = xdata;
    }
  else
    {
      port->mem.default_local_map = data;
      port->mem.default_globl_map = data;
    }
}

static void
_mcs51_setDefaultOptions (void)
{
}

static const char *
_mcs51_getRegName (struct regs *reg)
{
  if (reg)
    return reg->name;
  return "err";
}

static void
_mcs51_genAssemblerPreamble (FILE * of)
{
}

/* Generate interrupt vector table. */
static int
_mcs51_genIVT (FILE * of, symbol ** interrupts, int maxInterrupts)
{
  return FALSE;
}

/** $1 is always the basename.
    $2 is always the output file.
    $3 varies
    $l is the list of extra options that should be there somewhere...
    MUST be terminated with a NULL.
*/
static const char *_linkCmd[] =
{
  "{bindir}{sep}aslink", "-nf", "$1", NULL
};

/* $3 is replaced by assembler.debug_opts resp. port->assembler.plain_opts */
static const char *_asmCmd[] =
{
  "asx8051", "$l", "$3", "$1.asm", NULL
};

/* Globals */
PORT mcs51_port =
{
  TARGET_ID_MCS51,
  "mcs51",
  "MCU 8051",			/* Target name */
  {
    TRUE,			/* Emit glue around main */
    MODEL_SMALL | MODEL_LARGE,
    MODEL_SMALL
  },
  {
    _asmCmd,
    NULL,
    "-plosgffc",		/* Options with debug */
    "-plosgff",			/* Options without debug */
    0,
    ".asm"
  },
  {
    _linkCmd,
    NULL,
    NULL,
    ".rel"
  },
  {
    _defaultRules
  },
  {
	/* Sizes: char, short, int, long, ptr, fptr, gptr, bit, float, max */
    1, 2, 2, 4, 1, 2, 3, 1, 4, 4
  },
  {
    "XSEG    (XDATA)",
    "STACK   (DATA)",
    "CSEG    (CODE)",
    "DSEG    (DATA)",
    "ISEG    (DATA)",
    "XSEG    (XDATA)",
    "BSEG    (BIT)",
    "RSEG    (DATA)",
    "GSINIT  (CODE)",
    "OSEG    (OVR,DATA)",
    "GSFINAL (CODE)",
    "HOME	 (CODE)",
    NULL,
    NULL,
    1
  },
  {
    +1, 1, 4, 1, 1, 0
  },
    /* mcs51 has an 8 bit mul */
  {
    1, -1
  },
  "_",
  _mcs51_init,
  _mcs51_parseOptions,
  _mcs51_finaliseOptions,
  _mcs51_setDefaultOptions,
  mcs51_assignRegisters,
  _mcs51_getRegName,
  _mcs51_keywords,
  _mcs51_genAssemblerPreamble,
  _mcs51_genIVT,
  _mcs51_reset_regparm,
  _mcs51_regparm,
  NULL,
  NULL,
  NULL,
  FALSE,
  0,				/* leave lt */
  0,				/* leave gt */
  1,				/* transform <= to ! > */
  1,				/* transform >= to ! < */
  1,				/* transform != to !(a == b) */
  0,				/* leave == */
  FALSE,                        /* No array initializer support. */
  PORT_MAGIC
};

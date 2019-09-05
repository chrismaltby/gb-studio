/** @file main.c
    pic14 specific general functions.

    Note that mlh prepended _pic14_ on the static functions.  Makes
    it easier to set a breakpoint using the debugger.
*/
#include "common.h"
#include "main.h"
#include "ralloc.h"
//#include "gen.h"


static char _defaultRules[] =
{
#include "peeph.rul"
};

/* list of key words used by msc51 */
static char *_pic14_keywords[] =
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
  NULL
};

void  pCodeInitRegisters(void);

void pic14_assignRegisters (eBBlock ** ebbs, int count);

static int regParmFlg = 0;	/* determine if we can register a parameter */

static void
_pic14_init (void)
{
  asm_addTree (&asm_asxxxx_mapping);
  pCodeInitRegisters();
}

static void
_pic14_reset_regparm ()
{
  regParmFlg = 0;
}

static int
_pic14_regparm (sym_link * l)
{
  /* for this processor it is simple
     can pass only the first parameter in a register */
  if (regParmFlg)
    return 0;

  regParmFlg = 1;
  return 1;
}

static bool
_pic14_parseOptions (int *pargc, char **argv, int *i)
{
  /* TODO: allow port-specific command line options to specify
   * segment names here.
   */
  return FALSE;
}

static void
_pic14_finaliseOptions (void)
{

      port->mem.default_local_map = data;
      port->mem.default_globl_map = data;
#if 0
  /* Hack-o-matic: if we are using the flat24 model,
   * adjust pointer sizes.
   */
  if (options.model == MODEL_FLAT24)
    {

      fprintf (stderr, "*** WARNING: you should use the '-mds390' option "
	       "for DS80C390 support. This code generator is "
	       "badly out of date and probably broken.\n");

      port->s.fptr_size = 3;
      port->s.gptr_size = 4;
      port->stack.isr_overhead++;	/* Will save dpx on ISR entry. */
#if 1
      port->stack.call_overhead++;	/* This acounts for the extra byte 
					 * of return addres on the stack.
					 * but is ugly. There must be a 
					 * better way.
					 */
#endif
      fReturn = fReturn390;
      fReturnSize = 5;
    }

  if (options.model == MODEL_LARGE)
    {
      port->mem.default_local_map = xdata;
      port->mem.default_globl_map = xdata;
    }
  else
    {
      port->mem.default_local_map = data;
      port->mem.default_globl_map = data;
    }

  if (options.stack10bit)
    {
      if (options.model != MODEL_FLAT24)
	{
	  fprintf (stderr,
		   "*** warning: 10 bit stack mode is only supported in flat24 model.\n");
	  fprintf (stderr, "\t10 bit stack mode disabled.\n");
	  options.stack10bit = 0;
	}
      else
	{
	  /* Fixup the memory map for the stack; it is now in
	   * far space and requires a FPOINTER to access it.
	   */
	  istack->fmap = 1;
	  istack->ptrType = FPOINTER;
	}
    }
#endif
}

static void
_pic14_setDefaultOptions (void)
{
}

static const char *
_pic14_getRegName (struct regs *reg)
{
  if (reg)
    return reg->name;
  return "err";
}

static void
_pic14_genAssemblerPreamble (FILE * of)
{
  fprintf (of, "\tlist\tp=16f877\n");
  fprintf (of, "\t__config _wdt_off\n");
  fprintf (of, "\ninclude \"p16f877.inc\"\n");
}

/* Generate interrupt vector table. */
static int
_pic14_genIVT (FILE * of, symbol ** interrupts, int maxInterrupts)
{
  int i;

  if (options.model != MODEL_FLAT24)
    {
      /* Let the default code handle it. */
      return FALSE;
    }

  fprintf (of, "\t;ajmp\t__sdcc_gsinit_startup\n");

  /* now for the other interrupts */
  for (i = 0; i < maxInterrupts; i++)
    {
      if (interrupts[i])
	{
	  fprintf (of, "\t;ljmp\t%s\n\t.ds\t4\n", interrupts[i]->rname);
	}
      else
	{
	  fprintf (of, "\t;reti\n\t.ds\t7\n");
	}
    }

  return TRUE;
}

/** $1 is always the basename.
    $2 is always the output file.
    $3 varies
    $l is the list of extra options that should be there somewhere...
    MUST be terminated with a NULL.
*/
static const char *_linkCmd[] =
{
  "aslink", "-nf", "$1", NULL
};

static const char *_asmCmd[] =
{
  "gpasm", NULL, NULL, NULL

};

/* Globals */
PORT pic_port =
{
  TARGET_ID_PIC,
  "pic14",
  "MCU pic",			/* Target name */
  {
    TRUE,			/* Emit glue around main */
    MODEL_SMALL | MODEL_LARGE | MODEL_FLAT24,
    MODEL_SMALL
  },
  {
    _asmCmd,
    NULL,
    NULL,
    NULL,
	//"-plosgffc",          /* Options with debug */
	//"-plosgff",           /* Options without debug */
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
    1, 2, 2, 4, 1, 2, 1, 1, 4, 4
	/* TSD - I changed the size of gptr from 3 to 1. However, it should be
	   2 so that we can accomodate the PIC's with 4 register banks (like the
	   16f877)
	 */
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
    /* pic14 has an 8 bit mul */
  {
    1, -1
  },
  "_",
  _pic14_init,
  _pic14_parseOptions,
  _pic14_finaliseOptions,
  _pic14_setDefaultOptions,
  pic14_assignRegisters,
  _pic14_getRegName,
  _pic14_keywords,
  _pic14_genAssemblerPreamble,
  _pic14_genIVT,
  _pic14_reset_regparm,
  _pic14_regparm,
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

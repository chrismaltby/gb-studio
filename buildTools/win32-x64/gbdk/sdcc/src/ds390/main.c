/** @file main.c
    ds390 specific general functions.

    Note that mlh prepended _ds390_ on the static functions.  Makes
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
static char *_ds390_keywords[] =
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


void ds390_assignRegisters (eBBlock ** ebbs, int count);

static int regParmFlg = 0;	/* determine if we can register a parameter */

static void
_ds390_init (void)
{
  asm_addTree (&asm_asxxxx_mapping);
}

static void
_ds390_reset_regparm ()
{
  regParmFlg = 0;
}

static int
_ds390_regparm (sym_link * l)
{
  /* for this processor it is simple
     can pass only the first parameter in a register */
  if (regParmFlg)
    return 0;

  regParmFlg = 1;
  return 1;
}

static bool
_ds390_parseOptions (int *pargc, char **argv, int *i)
{
  /* TODO: allow port-specific command line options to specify
   * segment names here.
   */
  return FALSE;
}

static void
_ds390_finaliseOptions (void)
{
  /* Hack-o-matic: if we are using the flat24 model,
   * adjust pointer sizes.
   */
  if (options.model != MODEL_FLAT24)  {
      fprintf (stderr,
	       "*** warning: ds390 port small and large model experimental.\n");
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
  }
  else {
    port->s.fptr_size = 3;
    port->s.gptr_size = 4;

    port->stack.isr_overhead++;	/* Will save dpx on ISR entry. */

    port->stack.call_overhead++;	/* This acounts for the extra byte 
				 * of return addres on the stack.
				 * but is ugly. There must be a 
				 * better way.
				 */

    port->mem.default_local_map = xdata;
    port->mem.default_globl_map = xdata;

    if (!options.stack10bit)
    {
    fprintf (stderr,
	     "*** error: ds390 port only supports the 10 bit stack mode.\n");
    }

     /* Fixup the memory map for the stack; it is now in
     * far space and requires a FPOINTER to access it.
     */
    istack->fmap = 1;
    istack->ptrType = FPOINTER;
  }  /* MODEL_FLAT24 */
}

static void
_ds390_setDefaultOptions (void)
{
  options.model=MODEL_FLAT24;
  options.stack10bit=1;
}

static const char *
_ds390_getRegName (struct regs *reg)
{
  if (reg)
    return reg->name;
  return "err";
}

static void
_ds390_genAssemblerPreamble (FILE * of)
{
      if (options.model == MODEL_FLAT24)
        fputs (".flat24 on\t\t; 24 bit flat addressing\n", of);

      fputs ("dpx = 0x93\t\t; dpx register unknown to assembler\n", of);
      fputs ("dps = 0x86\t\t; dps register unknown to assembler\n", of);
      fputs ("dpl1 = 0x84\t\t; dpl1 register unknown to assembler\n", of);
      fputs ("dph1 = 0x85\t\t; dph1 register unknown to assembler\n", of);
      fputs ("dpx1 = 0x95\t\t; dpx1 register unknown to assembler\n", of);
      fputs ("ap = 0x9C\t\t; ap register unknown to assembler\n", of);
      fputs ("mcnt0 = 0xD1\t\t; mcnt0 register unknown to assembler\n", of);
      fputs ("mcnt1 = 0xD2\t\t; mcnt1 register unknown to assembler\n", of);
      fputs ("ma = 0xD3\t\t; ma register unknown to assembler\n", of);
      fputs ("mb = 0xD4\t\t; mb register unknown to assembler\n", of);
      fputs ("mc = 0xD5\t\t; mc register unknown to assembler\n", of);
}

/* Generate interrupt vector table. */
static int
_ds390_genIVT (FILE * of, symbol ** interrupts, int maxInterrupts)
{
  int i;

  if (options.model != MODEL_FLAT24)
    {
      /* Let the default code handle it. */
      return FALSE;
    }

  fprintf (of, "\tajmp\t__sdcc_gsinit_startup\n");

  /* now for the other interrupts */
  for (i = 0; i < maxInterrupts; i++)
    {
      if (interrupts[i])
	{
	  fprintf (of, "\tljmp\t%s\n\t.ds\t4\n", interrupts[i]->rname);
	}
      else
	{
	  fprintf (of, "\treti\n\t.ds\t7\n");
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

/* $3 is replaced by assembler.debug_opts resp. port->assembler.plain_opts */   static const char *_asmCmd[] =
{
  "asx8051", "$l", "$3", "$1.asm", NULL
};

/* Globals */
PORT ds390_port =
{
  TARGET_ID_DS390,
  "ds390",
  "DS80C390",			/* Target name */
  {
    TRUE,			/* Emit glue around main */
    MODEL_SMALL | MODEL_LARGE | MODEL_FLAT24,
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
    /* ds390 has an 16 bit mul & div */
  {
    2, -1
  },
  "_",
  _ds390_init,
  _ds390_parseOptions,
  _ds390_finaliseOptions,
  _ds390_setDefaultOptions,
  ds390_assignRegisters,
  _ds390_getRegName,
  _ds390_keywords,
  _ds390_genAssemblerPreamble,
  _ds390_genIVT,
  _ds390_reset_regparm,
  _ds390_regparm,
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
  TRUE,                         /* we support array initializers. */
  PORT_MAGIC
};

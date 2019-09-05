/** @file izt/tlcs900h.c
    tlcs900h specific general functions.
*/
#include "izt.h"

static REG _tlcs900h_regs[] =
{
  {1, REG_ID_C, "c", 0,
   {REG_ID_BC, REG_ID_NONE, REG_ID_NONE}},
  {1, REG_ID_B, "b", 0,
   {REG_ID_BC, REG_ID_NONE, REG_ID_NONE}},
  {1, REG_ID_E, "e", 0,
   {REG_ID_DE, REG_ID_NONE, REG_ID_NONE}},
  {1, REG_ID_D, "d", 0,
   {REG_ID_DE, REG_ID_NONE, REG_ID_NONE}},
  {2, REG_ID_BC, "bc", 0,
   {REG_ID_C, REG_ID_B, REG_ID_NONE}},
  {2, REG_ID_DE, "de", 0,
   {REG_ID_E, REG_ID_D, REG_ID_NONE}},
  {4, REG_ID_XBC, "xbc", 0,
   {REG_ID_C, REG_ID_B, REG_ID_BC}},
  {4, REG_ID_XDE, "xde", 0,
   {REG_ID_E, REG_ID_D, REG_ID_DE}},
  {0, REG_ID_NONE, "??", 0,
   {REG_ID_NONE, REG_ID_NONE, REG_ID_NONE}}
};

static IZT_PORT _tlcs900h_port =
{
  _tlcs900h_regs
};

static char _defaultRules[] =
{
    //#include "peeph.rul"
    ""
};

static char *_tlcs900h_keywords[] =
{
  NULL
};

void tlcs900h_assignRegisters (eBBlock ** ebbs, int count);

static void
_tlcs900h_init (void)
{
  asm_addTree (&asm_asxxxx_mapping);
  izt_init (&_tlcs900h_port);
}

static void
_tlcs900h_reset_regparm ()
{
}

static int
_tlcs900h_regparm (sym_link * l)
{
  // PENDING: No register parameters.
  return 0;
}

static bool
_tlcs900h_parseOptions (int *pargc, char **argv, int *i)
{
  /* TODO: allow port-specific command line options to specify
   * segment names here.
   */
  return FALSE;
}

static void
_tlcs900h_finaliseOptions (void)
{
  // No options
}

static void
_tlcs900h_setDefaultOptions (void)
{
  // No options
}

static const char *
_tlcs900h_getRegName (struct regs *reg)
{
  if (reg)
    return reg->name;
  wassert (0);
  return "err";
}

static void
_tlcs900h_genAssemblerPreamble (FILE * of)
{
  // PENDING
}

/* Generate interrupt vector table. */
static int
_tlcs900h_genIVT (FILE * of, symbol ** interrupts, int maxInterrupts)
{
  // PENDING
  return 0;
}

/** $1 is always the basename.
    $2 is always the output file.
    $3 varies
    $l is the list of extra options that should be there somewhere...
    MUST be terminated with a NULL.
*/
// PENDING
static const char *_linkCmd[] =
{
  "aslink", "-nf", "$1", NULL
};

// PENDING
static const char *_asmCmd[] =
{
  "gpasm", NULL, NULL, NULL
};

void
tlcs900h_assignRegisters (eBBlock ** ebbs, int count)
{
}

/* Globals */
PORT tlcs900h_port =
{
  TARGET_ID_TLCS900H,
  "tlcs900h",
  "Toshiba TLCS-900H",		/* Target name */
  {
    TRUE,			/* Emit glue around main */
    MODEL_SMALL,
    MODEL_SMALL
  },
  {
    _asmCmd,
    NULL,
    NULL,
    NULL,
    0,
    NULL
  },
  {
    _linkCmd,
    NULL,
    NULL,
    ".o"
  },
  {
    _defaultRules
  },
  {
	/* Sizes: char, short, int, long, ptr, fptr, gptr, bit, float, max */
    1, 2, 2, 4, 2, 2, 2, 1, 4, 4
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
    /* tlcs900h has an 16 bit mul */
  {
    2, -1
  },
  "_",
  _tlcs900h_init,
  _tlcs900h_parseOptions,
  _tlcs900h_finaliseOptions,
  _tlcs900h_setDefaultOptions,
  tlcs900h_assignRegisters,
  _tlcs900h_getRegName,
  _tlcs900h_keywords,
  _tlcs900h_genAssemblerPreamble,
  _tlcs900h_genIVT,
  _tlcs900h_reset_regparm,
  _tlcs900h_regparm,
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

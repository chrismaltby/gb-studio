/** @file izt/i186.c
	i186 specific general functions.
*/
#include "izt.h"

static REG _i186_otherRegs[] = {
	{ 1, REG_ID_AL, "al", 0, { REG_ID_AX, REG_ID_NONE, REG_ID_NONE } },
	{ 1, REG_ID_AH, "ah", 0, { REG_ID_AX, REG_ID_NONE, REG_ID_NONE } },
	{ 2, REG_ID_AX, "ax", 0, { REG_ID_AL, REG_ID_AH, REG_ID_NONE } },
	{ 1, REG_ID_BL, "bl", 0, { REG_ID_BX, REG_ID_NONE, REG_ID_NONE } },
	{ 1, REG_ID_BH, "bh", 0, { REG_ID_BX, REG_ID_NONE, REG_ID_NONE } },
	{ 2, REG_ID_BX, "bx", 0, { REG_ID_BL, REG_ID_BH, REG_ID_NONE } },
	{ 2, REG_ID_BP, "bp", 0, { REG_ID_NONE, REG_ID_NONE, REG_ID_NONE } },
	{ 0, REG_ID_NONE,"??",	0, { REG_ID_NONE, REG_ID_NONE, REG_ID_NONE } }
};
	
static REG _i186_regs[] = {
	{ 1, REG_ID_CL, "cl", 0, { REG_ID_CX, REG_ID_NONE, REG_ID_NONE } },
	{ 1, REG_ID_CH, "ch", 0, { REG_ID_CX, REG_ID_NONE, REG_ID_NONE } },
	{ 1, REG_ID_DL, "dl", 0, { REG_ID_DX, REG_ID_NONE, REG_ID_NONE } },
	{ 1, REG_ID_DH, "dh", 0, { REG_ID_DX, REG_ID_NONE, REG_ID_NONE } },
	{ 2, REG_ID_CX, "cx", 0, { REG_ID_CL, REG_ID_CH, REG_ID_NONE } },
	{ 2, REG_ID_DX, "dx", 0, { REG_ID_DL, REG_ID_DH, REG_ID_NONE } },
	{ 0, REG_ID_NONE,"??",	0, { REG_ID_NONE, REG_ID_NONE, REG_ID_NONE } }
};

static IZT_PORT _i186_port = {
	_i186_regs,
	{ _i186_otherRegs + 0, _i186_otherRegs + 1, _i186_otherRegs + 2 },
	_i186_otherRegs + 5,
	_i186_otherRegs + 6
};

static char _defaultRules[] =
{
	//#include "peeph.rul"
    ""
};

/* list of key words used by i186 */
static char *_i186_keywords[] =
{
  NULL
};

#include "i186_mappings.i"

static void
_i186_init (void)
{
	asm_addTree(&_as86_i186_mappings);
	izt_init(&_i186_port);
}

static void
_i186_reset_regparm ()
{
}

static int
_i186_regparm (sym_link * l)
{
  // PENDING: No register parameters.
  return 0;
}

static bool
_i186_parseOptions (int *pargc, char **argv, int *i)
{
  /* TODO: allow port-specific command line options to specify
   * segment names here.
   */
  return FALSE;
}

static void
_i186_finaliseOptions (void)
{
  // No options
}

static void
_i186_setDefaultOptions (void)
{
  // No options
}

static const char *
_i186_getRegName (struct regs *reg)
{
  if (reg)
	return reg->name;
  wassert (0);
  return "err";
}

static void
_i186_genAssemblerPreamble (FILE * of)
{
  // PENDING
}

/* Generate interrupt vector table. */
static int
_i186_genIVT (FILE * of, symbol ** interrupts, int maxInterrupts)
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
i186_assignRegisters (eBBlock ** ebbs, int count)
{
}

/* Globals */
PORT i186_port = {
    TARGET_ID_I186,
    "i186",
    "Intel 80186",      /* Target name */
    {
        FALSE,          /* Emit glue around main */
        MODEL_SMALL,
        MODEL_SMALL
    },
    {   
        _asmCmd,
        NULL,
        NULL,
        NULL,
        0,
        ".s"
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
        ".BSS",
        ".BSS",
        ".TEXT",
        ".DATA",
        ".DATA",
        ".DATA",
        ".DATA",
        ".DATA",
        ".TEXT",
        ".DATA",
        ".TEXT",
        ".TEXT",
        NULL,
        NULL,
        1
    },
    { 
        +1, 1, 4, 1, 1, 0
    },
    /* i186 has an 16 bit mul */
    {
        2, 0
    },
    "_",
    _i186_init,
    _i186_parseOptions,
    _i186_finaliseOptions,
    _i186_setDefaultOptions,
    izt_assignRegisters,
    _i186_getRegName ,
    _i186_keywords,
    _i186_genAssemblerPreamble,
    _i186_genIVT ,
    _i186_reset_regparm,
    _i186_regparm,
    NULL,
    NULL,
    NULL,
    FALSE,
    0,  /* leave lt */
    0,  /* leave gt */
    1,  /* transform <= to ! > */
    1,  /* transform >= to ! < */
    1,  /* transform != to !(a == b) */
    0,  /* leave == */
    FALSE,                        /* No array initializer support. */
    PORT_MAGIC
};

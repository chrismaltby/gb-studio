/*-------------------------------------------------------------------------
  main.c - Z80 specific definitions.

  Michael Hope <michaelh@juju.net.nz> 2001

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

#include "z80.h"
#include "MySystem.h"
#include "BuildCmd.h"
#include "SDCCutil.h"

static char _z80_defaultRules[] =
{
#include "peeph.rul"
#include "peeph-z80.rul"
};

static char _gbz80_defaultRules[] =
{
#include "peeph.rul"
#include "peeph-gbz80.rul"
};

Z80_OPTS z80_opts;

typedef enum
  {
    /* Must be first */
    ASM_TYPE_ASXXXX,
    ASM_TYPE_RGBDS,
    ASM_TYPE_ISAS
  }
ASM_TYPE;

static struct
  {
    ASM_TYPE asmType;
    /* determine if we can register a parameter */    
    int regParams;
  }
_G;

static char *_keywords[] =
{
  "sfr",
  "nonbanked",
  "banked",
  NULL
};

extern PORT gbz80_port;
extern PORT z80_port;

#include "mappings.i"

static void
_z80_init (void)
{
  z80_opts.sub = SUB_Z80;
  asm_addTree (&_asxxxx_z80);
}

static void
_gbz80_init (void)
{
  z80_opts.sub = SUB_GBZ80;
}

static void
_reset_regparm ()
{
  _G.regParams = 0;
}

static int
_reg_parm (sym_link * l)
{
  if (options.noRegParams) 
    {
      return FALSE;
    }
  else 
    {
      if (_G.regParams == 2)
        {
          return FALSE;
        }
      else
        {
          _G.regParams++;
          return TRUE;
        }
    }
}

static int
_process_pragma (const char *sz)
{
  if (startsWith (sz, "bank="))
    {
      char buffer[128];
      strcpy (buffer, sz + 5);
      chomp (buffer);
      if (isdigit (buffer[0]))
	{

	}
      else if (!strcmp (buffer, "BASE"))
	{
	  strcpy (buffer, "HOME");
	}
      if (isdigit (buffer[0]))
	{
	  /* Arg was a bank number.  Handle in an ASM independent
	     way. */
	  char num[128];
	  strcpy (num, sz + 5);
	  chomp (num);

	  switch (_G.asmType)
	    {
	    case ASM_TYPE_ASXXXX:
	      sprintf (buffer, "CODE_%s", num);
	      break;
	    case ASM_TYPE_RGBDS:
	      sprintf (buffer, "CODE,BANK[%s]", num);
	      break;
	    case ASM_TYPE_ISAS:
	      /* PENDING: what to use for ISAS? */
	      sprintf (buffer, "CODE,BANK(%s)", num);
	      break;
	    default:
	      wassert (0);
	    }
	}
      gbz80_port.mem.code_name = Safe_strdup (buffer);
      code->sname = gbz80_port.mem.code_name;
      return 0;
    }
  return 1;
}

static const char *_gbz80_rgbasmCmd[] =
{
  "rgbasm", "-o$1.o", "$1.asm", NULL
};

static const char *_gbz80_rgblinkCmd[] =
{
  "xlink", "-tg", "-n$1.sym", "-m$1.map", "-zFF", "$1.lnk", NULL
};

static void
_gbz80_rgblink (void)
{
  FILE *lnkfile;
  const char *sz;

  int i;
  sz = srcFileName;
  if (!sz)
    sz = "a";

  /* first we need to create the <filename>.lnk file */
  sprintf (scratchFileName, "%s.lnk", sz);
  if (!(lnkfile = fopen (scratchFileName, "w")))
    {
      werror (E_FILE_OPEN_ERR, scratchFileName);
      exit (1);
    }

  fprintf (lnkfile, "[Objects]\n");

  if (srcFileName)
    fprintf (lnkfile, "%s.o\n", sz);

  for (i = 0; i < nrelFiles; i++)
    fprintf (lnkfile, "%s\n", relFiles[i]);

  fprintf (lnkfile, "\n[Libraries]\n");
  /* additional libraries if any */
  for (i = 0; i < nlibFiles; i++)
    fprintf (lnkfile, "%s\n", libFiles[i]);


  fprintf (lnkfile, "\n[Output]\n" "%s.gb", sz);

  fclose (lnkfile);

  buildCmdLine (buffer,port->linker.cmd, sz, NULL, NULL, NULL);
  /* call the linker */
  if (my_system (buffer))
    {
      perror ("Cannot exec linker");
      exit (1);
    }
}

static bool
_parseOptions (int *pargc, char **argv, int *i)
{
  if (argv[*i][0] == '-')
    {
      if (argv[*i][1] == 'b' && IS_GB)
	{
	  int bank = atoi (argv[*i] + 3);
	  char buffer[128];
	  switch (argv[*i][2])
	    {
	    case 'o':
	      /* ROM bank */
	      sprintf (buffer, "CODE_%u", bank);
	      gbz80_port.mem.code_name = Safe_strdup (buffer);
	      return TRUE;
	    case 'a':
	      /* RAM bank */
	      sprintf (buffer, "DATA_%u", bank);
	      gbz80_port.mem.data_name = Safe_strdup (buffer);
	      return TRUE;
	    }
	}
      else if (!strncmp (argv[*i], "--asm=", 6))
	{
	  if (!strcmp (argv[*i], "--asm=rgbds"))
	    {
	      asm_addTree (&_rgbds_gb);
	      gbz80_port.assembler.cmd = _gbz80_rgbasmCmd;
	      gbz80_port.linker.cmd = _gbz80_rgblinkCmd;
	      gbz80_port.linker.do_link = _gbz80_rgblink;
	      _G.asmType = ASM_TYPE_RGBDS;
	      return TRUE;
	    }
	  else if (!strcmp (argv[*i], "--asm=asxxxx"))
	    {
	      _G.asmType = ASM_TYPE_ASXXXX;
	      return TRUE;
	    }
	  else if (!strcmp (argv[*i], "--asm=isas"))
	    {
	      asm_addTree (&_isas_gb);
	      /* Munge the function prefix */
	      gbz80_port.fun_prefix = "";
	      _G.asmType = ASM_TYPE_ISAS;
	      return TRUE;
	    }
	}
    }
  return FALSE;
}

static void
_setValues(void)
{
  if (options.nostdlib == FALSE)
    {
      setMainValue ("z80libspec", "-k{libdir}{sep}{port} -l{port}.lib");
      setMainValue ("z80crt0", "{libdir}{sep}{port}{sep}crt0{objext}");
    }
  else
    {
      setMainValue ("z80libspec", "");
      setMainValue ("z80crt0", "");
    }

  setMainValue ("z80extralibfiles", joinn (libFiles, nlibFiles));
  setMainValue ("z80extralibpaths", joinn (libPaths, nlibPaths));

  if (IS_GB)
    {
      setMainValue ("z80outputtypeflag", "-z");
      setMainValue ("z80outext", ".gb");
    }
  else
    {
      setMainValue ("z80outputtypeflag", "-i");
      setMainValue ("z80outext", ".ihx");
    }

  setMainValue ("z80extraobj", joinn (relFiles, nrelFiles));
  
  sprintf (buffer, "-b_CODE=0x%04X -b_DATA=0x%04X", options.code_loc, options.data_loc);
  setMainValue ("z80bases", buffer);
}

static void
_finaliseOptions (void)
{
  port->mem.default_local_map = data;
  port->mem.default_globl_map = data;
  if (_G.asmType == ASM_TYPE_ASXXXX && IS_GB)
    asm_addTree (&_asxxxx_gb);

  _setValues();
}

static void
_setDefaultOptions (void)
{
  options.genericPtr = 1;	/* default on */
  options.nopeep = 0;
  options.stackAuto = 1;
  options.mainreturn = 1;
  /* first the options part */
  options.intlong_rent = 1;
  options.noRegParams = 1;
  /* Default code and data locations. */
  options.code_loc = 0x200;

  if (IS_GB) 
    {
      options.data_loc = 0xC000;
    }
  else
    {
      options.data_loc = 0x8000;
    }

  optimize.global_cse = 1;
  optimize.label1 = 1;
  optimize.label2 = 1;
  optimize.label3 = 1;
  optimize.label4 = 1;
  optimize.loopInvariant = 1;
  optimize.loopInduction = 1;
}

/* Mangaling format:
    _fun_policy_params
    where:
      policy is the function policy
      params is the parameter format

   policy format:
    rsp
    where:
      r is 'r' for reentrant, 's' for static functions
      s is 'c' for callee saves, 'r' for caller saves
      p is 'p' for profiling on, 'x' for profiling off
    examples:
      rr - reentrant, caller saves
   params format:
    A combination of register short names and s to signify stack variables.
    examples:
      bds - first two args appear in BC and DE, the rest on the stack
      s - all arguments are on the stack.
*/
static char *
_mangleSupportFunctionName(char *original)
{
  char buffer[128];

  sprintf(buffer, "%s_rr%s_%s", original,
          options.profile ? "f" : "x",
          options.noRegParams ? "s" : "bds"
          );

  return Safe_strdup(buffer);
}

static const char *
_getRegName (struct regs *reg)
{
  if (reg)
    {
      return reg->name;
    }
  assert (0);
  return "err";
}

static bool
_hasNativeMulFor (iCode *ic, sym_link *left, sym_link *right)
{
  sym_link *test = NULL;
  value *val;

  if ( ic->op != '*')
    {
      return FALSE;
    }

  if ( IS_LITERAL (left))
    {
      test = left;
      val = OP_VALUE (IC_LEFT (ic));
    }
  else if ( IS_LITERAL (right))
    {
      test = left;
      val = OP_VALUE (IC_RIGHT (ic));
    }
  else
    {
      return FALSE;
    }

  if ( getSize (test) <= 2)
    {
      return TRUE;
    }

  return FALSE;
}

#define LINKCMD \
    "{bindir}{sep}link-{port} -n -c -- {z80bases} -m -j" \
    " {z80libspec}" \
    " {z80extralibfiles} {z80extralibpaths}" \
    " {z80outputtypeflag} {srcfilename}{z80outext}" \
    " {z80crt0}" \
    " {srcfilename}{objext}" \
    " {z80extraobj}" 

#define ASMCMD \
    "{bindir}{sep}as-{port} -plosgff {srcfilename}{objext} {srcfilename}{asmext}"

/* Globals */
PORT z80_port =
{
  TARGET_ID_Z80,
  "z80",
  "Zilog Z80",			/* Target name */
  {
    FALSE,
    MODEL_MEDIUM | MODEL_SMALL,
    MODEL_SMALL
  },
  {
    NULL,
    ASMCMD,
    "-plosgff",			/* Options with debug */
    "-plosgff",			/* Options without debug */
    0,
    ".asm"
  },
  {
    NULL,
    LINKCMD,
    NULL,
    ".o"
  },
  {
    _z80_defaultRules
  },
  {
	/* Sizes: char, short, int, long, ptr, fptr, gptr, bit, float, max */
    1, 2, 2, 4, 2, 2, 2, 1, 4, 4
  },
  {
    "XSEG",
    "STACK",
    "CODE",
    "DATA",
    "ISEG",
    "XSEG",
    "BSEG",
    "RSEG",
    "GSINIT",
    "OVERLAY",
    "GSFINAL",
    "HOME",
    NULL,
    NULL,
    1
  },
  {
    -1, 0, 0, 4, 0, 2
  },
    /* Z80 has no native mul/div commands */
  {
    0, 2
  },
  "_",
  _z80_init,
  _parseOptions,
  _finaliseOptions,
  _setDefaultOptions,
  z80_assignRegisters,
  _getRegName,
  _keywords,
  0,				/* no assembler preamble */
  0,				/* no local IVT generation code */
  _reset_regparm,
  _reg_parm,
  _process_pragma,
  _mangleSupportFunctionName,
  _hasNativeMulFor,
  TRUE,
  0,				/* leave lt */
  0,				/* leave gt */
  1,				/* transform <= to ! > */
  1,				/* transform >= to ! < */
  1,				/* transform != to !(a == b) */
  0,				/* leave == */
  TRUE,                         /* Array initializer support. */	
  PORT_MAGIC
};

/* Globals */
PORT gbz80_port =
{
  TARGET_ID_GBZ80,
  "gbz80",
  "Gameboy Z80-like",		/* Target name */
  {
    FALSE,
    MODEL_MEDIUM | MODEL_SMALL,
    MODEL_SMALL
  },
  {
    NULL,
    ASMCMD,
    "-plosgff",			/* Options with debug */
    "-plosgff",			/* Options without debug */
    0,
    ".asm"
  },
  {
    NULL,
    LINKCMD,
    NULL,
    ".o"
  },
  {
    _gbz80_defaultRules
  },
  {
    /* Sizes: char, short, int, long, ptr, fptr, gptr, bit, float, max */
    1, 2, 2, 4, 2, 2, 2, 1, 4, 4
  },
  {
    "XSEG",
    "STACK",
    "CODE",
    "DATA",
    "ISEG",
    "XSEG",
    "BSEG",
    "RSEG",
    "GSINIT",
    "OVERLAY",
    "GSFINAL",
    "HOME",
    NULL,
    NULL,
    1
  },
  {
    -1, 0, 0, 2, 0, 4
  },
    /* gbZ80 has no native mul/div commands */
  {
    0, 2
  },
  "_",
  _gbz80_init,
  _parseOptions,
  _finaliseOptions,
  _setDefaultOptions,
  z80_assignRegisters,
  _getRegName,
  _keywords,
  0,				/* no assembler preamble */
  0,				/* no local IVT generation code */
  _reset_regparm,
  _reg_parm,
  _process_pragma,
  _mangleSupportFunctionName,
  _hasNativeMulFor,
  TRUE,
  0,				/* leave lt */
  0,				/* leave gt */
  1,				/* transform <= to ! > */
  1,				/* transform >= to ! < */
  1,				/* transform != to !(a == b) */
  0,				/* leave == */
  TRUE,                         /* Array initializer support. */
  PORT_MAGIC
};

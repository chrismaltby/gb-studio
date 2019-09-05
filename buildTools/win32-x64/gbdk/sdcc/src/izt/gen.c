#include "izt.h"
#include "gen.h"

static struct
  {
    struct
      {
	lineNode *head;
	lineNode *current;
      }
    lines;
    struct
      {
	hTab *base;
	hTab *proc;
      }
    htabs;
  }
_G;

static void
_tidyUp (char *buf)
{
  // Clean up the line so that it is 'prettier'.
  if (*buf == ';')
    {
      // If this is a comment line (starts with a ';') then indent it.
      // PENDING: The outputter does its own pretty print.  Disable for now.
    }
  else if (strchr (buf, ':'))
    {
      // Is a label - cant do anything.
    }
  else
    {
      /* Change the first (and probably only) ' ' to a tab so
         everything lines up.
       */
      while (*buf)
	{
	  if (*buf == ' ')
	    {
	      *buf = '\t';
	      return;
	    }
	  buf++;
	}
    }
}

void
iemit (const char *szFormat,...)
{
  char buffer[1024];
  va_list ap;

  va_start (ap, szFormat);

  tvsprintf (buffer, szFormat, ap);

  _tidyUp (buffer);

  if (_G.lines.current == NULL)
    {
      _G.lines.head = newLineNode (buffer);
      _G.lines.current = _G.lines.head;
    }
  else
    {
      _G.lines.current = connectLine (_G.lines.current, newLineNode (buffer));
    }

  // PENDING: Inline support.
  //    _G.lines.current->isInline = inLine;
}

// Mapping between operand type and a friendly name.
typedef struct
{
  const int op;
  const char *name;
}
OPNAME;

static OPNAME _opnames[] =
{
  {'!', "genNot"},
  {'~', "genCpl"},
  {UNARYMINUS, "genUminus"},
  {IPUSH, "genIpush"},
  {IPOP, "genIfx"},
  {CALL, "genCall"},
  {PCALL, "genPcall"},
  {FUNCTION, "genFunction"},
  {ENDFUNCTION, "genEndFunction"},
  {RETURN, "genRet"},
  {LABEL, "genLabel"},
  {GOTO, "genGoto"},
  {'+', "genPlus"},
  {'-', "genMinus"},
  {'*', "genMult"},
  {'/', "genDiv"},
  {'%', "genMod"},
  {'>', "genCmpGt"},
  {'<', "genCmpLt"},
  {EQ_OP, "genCmpEq"},
  {AND_OP, "genAndOp"},
  {OR_OP, "genOrOp"},
  {'^', "genXor"},
  {'|', "genOr"},
  {BITWISEAND, "genAnd"},
  {INLINEASM, "genInline"},
  {RRC, "genRRC"},
  {RLC, "genRLC"},
  {GETHBIT, "genHBIT"},
  {LEFT_OP, "genLeftShift"},
  {RIGHT_OP, "genRightShift"},
  {GET_VALUE_AT_ADDRESS, "genPointerGet"},
  {'=', "genAssign"},
  {IFX, "genIfx"},
  {ADDRESS_OF, "genAddrOf"},
  {JUMPTABLE, "genJumpTab"},
  {CAST, "genCast"},
  {RECEIVE, "genReceive"},
  {SEND, "addSet"},
  {0, NULL}
};

// Possible return codes for a find matcher.
enum
  {
    FIND_LESS_THAN = -1,
    // This element does match.
    FIND_MATCH = 0,
    FIND_GREATER_THAN = 1,
    // This element doesnt match.
    FIND_NO_MATCH = FIND_GREATER_THAN,
    // This element marks the end of list.
    FIND_EOL
  };

// Limits the given integer to the find result numbers.
static int
_limitToFind (int i)
{
  if (i < 0)
    {
      return FIND_LESS_THAN;
    }
  else if (i > 0)
    {
      return FIND_GREATER_THAN;
    }
  else
    {
      return FIND_MATCH;
    }
}

// Matches an opname id to the given id.
static int
_opnamesMatcher (void *pthis, void *pkey)
{
  OPNAME *name = pthis;

  if (name->name == NULL)
    {
      return FIND_EOL;
    }
  else
    {
      return _limitToFind (name->op - *(int *) pkey);
    }
}

// Find an element of an unordered list.
static void *
_find (void *base, size_t elemSize, void *pkey, int (*match) (void *pthis, void *pkey))
{
  do
    {
      switch (match (base, pkey))
	{
	case FIND_MATCH:
	  return base;
	case FIND_EOL:
	  return NULL;
	case FIND_LESS_THAN:
	case FIND_GREATER_THAN:
	  base = (char *) base + elemSize;
	  break;
	default:
	  wassert (0);
	}
    }
  while (1);
}

// Finds the friendly operation name for an op number.
static const char *
_findOpName (int op)
{
  OPNAME *name = _find (_opnames, sizeof (*_opnames), &op, _opnamesMatcher);
  if (name)
    {
      return name->name;
    }
  else
    {
      return NULL;
    }
}

// PENDING
static bool
_isResultRemat (iCode * ic)
{
  if (SKIP_IC (ic) || ic->op == IFX)
    return 0;

  if (IC_RESULT (ic) && IS_ITEMP (IC_RESULT (ic)))
    {
      symbol *sym = OP_SYMBOL (IC_RESULT (ic));
      if (sym->remat && !POINTER_SET (ic))
	return 1;
    }

  return 0;
}

// Print out the generated lines.
static void
_printLines (void)
{
  // Currently a holder function.  The Z80 needs some special mangling
  // for bank support.
  printLine (_G.lines.head, codeOutFile);
}

void
izt_initEmitters (void)
{
  _G.htabs.base = newHashTable (100);
  _G.htabs.proc = newHashTable (100);

  izt_initBaseEmitters (&_G.htabs.base);
}

static int
_emitterCompare (const void *p1, const void *p2)
{
  wassert (p1);
  wassert (p2);
  return ((EMITTER *) p1)->op == ((EMITTER *) p2)->op;
}

static bool
_tryEmittingiCode (hTab * h, iCode * ic)
{
  EMITTER key; // = {ic->op, NULL}; Borland C chokes on this; initialize below
  EMITTER *found;

  key.op = ic->op;
  key.emit = NULL;

  found = hTabFindByKey (h, ic->op, &key, _emitterCompare);

  if (found)
    {
      found->emit (ic);
      return TRUE;
    }
  else
    {
      return FALSE;
    }
}

// Add a NULL terminated array of emitters into the given hash table.
void
izt_addEmittersToHTab (hTab ** into, EMITTER _base_emitters[])
{
  while (_base_emitters->emit != NULL)
    {
      hTabAddItemLong (into, _base_emitters->op, _base_emitters, _base_emitters);
      _base_emitters++;
    }
}

void
izt_gen (iCode * iic)
{
  iCode *ic = iic;
  int cln = 0;

  _G.lines.head = NULL;
  _G.lines.current = NULL;

  // No debug info support.

  for (; ic; ic = ic->next)
    {
      const char *name;

      // Print out the source file line number.
      if (cln != ic->lineno)
	{
	  iemit ("; %s %d", ic->filename, ic->lineno);
	  cln = ic->lineno;
	}

      if (ic->generated)
	{
	  // Code has already been generated.  Skip.
	  continue;
	}
      if (_isResultRemat (ic))
	{
	  // The code is spilt and remat. - no need to generate.
	  continue;
	}

      // Print the friendly name of the operation, if it has one.
      name = _findOpName (ic->op);
      if (name)
	{
	  iemit ("; %s", name);
	}
      else
	{
	  iemit ("; warning: unrecognised operation name for %u", ic->op);
	}

      fflush (stdout);
      // Now actually call the code generator.
      // The current processor handler gets first try.
      if (_tryEmittingiCode (_G.htabs.proc, ic))
	{
	  // Yay.
	}
      else if (_tryEmittingiCode (_G.htabs.base, ic))
	{
	  // Base handler took it.
	}
      else
	{
	  // None took it.  Warn the developer.
	  iemit ("; warning: no handler for code %u", ic->op);
	}
    }

  // Pass the code through the peephole optimiser.
  if (!options.nopeep)
    {
      peepHole (&_G.lines.head);
    }

  // And emit the remainder.
  _printLines ();
}

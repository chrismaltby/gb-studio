/*-------------------------------------------------------------------------
  SDCCsymt.c - Code file for Symbols table related structures and MACRO's.
        Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1998)

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
#include "newalloc.h"

value *aggregateToPointer (value *val);

void printFromToType(sym_link *from, sym_link *to) {
  fprintf (stderr, "from type '");
  printTypeChain (from, stderr);
  fprintf (stderr, "'\nto type '");
  printTypeChain (to, stderr);
  fprintf (stderr, "'\n");
}

/* noun strings */
char *nounName(sym_link *sl) {
  switch (SPEC_NOUN(sl)) 
    {
    case V_INT: {
      if (SPEC_LONG(sl)) return "long";
      if (sl->select.s._short) return "short";
      return "int";
    }
    case V_FLOAT: return "float";
    case V_CHAR: return "char";
    case V_VOID: return "void";
    case V_STRUCT: return "struct";
    case V_LABEL: return "label";
    case V_BIT: return "bit";
    case V_SBIT: return "sbit";
    case V_DOUBLE: return "double";
    }
  return "unknown";
};

bucket *SymbolTab[256];		/* the symbol    table  */
bucket *StructTab[256];		/* the structure table  */
bucket *TypedefTab[256];	/* the typedef   table  */
bucket *LabelTab[256];		/* the Label     table  */
bucket *enumTab[256];		/* enumerated    table  */

/*------------------------------------------------------------------*/
/* initSymt () - initialises symbol table related stuff             */
/*------------------------------------------------------------------*/
void 
initSymt ()
{
  int i = 0;

  for (i = 0; i < 256; i++)
    SymbolTab[i] = StructTab[i] = (void *) NULL;


}
/*-----------------------------------------------------------------*/
/* newBucket - allocates & returns a new bucket        */
/*-----------------------------------------------------------------*/
bucket *
newBucket ()
{
  bucket *bp;

  bp = Safe_alloc ( sizeof (bucket));

  return bp;
}

/*-----------------------------------------------------------------*/
/* hashKey - computes the hashkey given a symbol name              */
/*-----------------------------------------------------------------*/
int 
hashKey (const char *s)
{
  unsigned long key = 0;

  while (*s)
    key += *s++;
  return key % 256;
}

/*-----------------------------------------------------------------*/
/* addSym - adds a symbol to the hash Table                        */
/*-----------------------------------------------------------------*/
void 
addSym (bucket ** stab,
	void *sym,
	char *sname,
	int level,
	int block,
	int checkType)
{
  int i;			/* index into the hash Table */
  bucket *bp;			/* temp bucket    *         */

  if (checkType) {
    symbol *csym = (symbol *)sym;

    if (getenv("DEBUG_SANITY")) {
      fprintf (stderr, "addSym: %s ", sname);
    }
    /* make sure the type is complete and sane */
    checkTypeSanity(csym->etype, csym->name);
  }

  /* prevent overflow of the (r)name buffers */
  if (strlen(sname)>SDCC_SYMNAME_MAX) {
    werror (W_SYMBOL_NAME_TOO_LONG, SDCC_SYMNAME_MAX);
    sname[SDCC_SYMNAME_MAX]='\0';
  }

  /* the symbols are always added at the head of the list  */
  i = hashKey (sname);
  /* get a free entry */
  bp = Safe_alloc ( sizeof (bucket));

  bp->sym = sym;		/* update the symbol pointer  */
  bp->level = level;		/* update the nest level      */
  bp->block = block;
  strcpy (bp->name, sname);	/* copy the name into place */

  /* if this is the first entry */
  if (stab[i] == NULL)
    {
      bp->prev = bp->next = (void *) NULL;	/* point to nothing */
      stab[i] = bp;
    }
  /* not first entry then add @ head of list */
  else
    {
      bp->prev = NULL;
      stab[i]->prev = bp;
      bp->next = stab[i];
      stab[i] = bp;
    }
}

/*-----------------------------------------------------------------*/
/* deleteSym - deletes a symbol from the hash Table  entry     */
/*-----------------------------------------------------------------*/
void 
deleteSym (bucket ** stab, void *sym, char *sname)
{
  int i = 0;
  bucket *bp;

  i = hashKey (sname);

  bp = stab[i];
  /* find the symbol */
  while (bp)
    {
      if (bp->sym == sym)	/* found it then break out */
	break;			/* of the loop       */
      bp = bp->next;
    }

  if (!bp)			/* did not find it */
    return;
  /* if this is the first one in the chain */
  if (!bp->prev)
    {
      stab[i] = bp->next;
      if (stab[i])		/* if chain ! empty */
	stab[i]->prev = (void *) NULL;
    }
  /* middle || end of chain */
  else
    {
      if (bp->next)		/* if not end of chain */
	bp->next->prev = bp->prev;

      bp->prev->next = bp->next;
    }

}

/*-----------------------------------------------------------------*/
/* findSym - finds a symbol in a table           */
/*-----------------------------------------------------------------*/
void *
findSym (bucket ** stab, void *sym, const char *sname)
{
  bucket *bp;

  bp = stab[hashKey (sname)];
  while (bp)
    {
      if (bp->sym == sym || strcmp (bp->name, sname) == 0)
	break;
      bp = bp->next;
    }

  return (bp ? bp->sym : (void *) NULL);
}

/*-----------------------------------------------------------------*/
/* findSymWithLevel - finds a symbol with a name & level           */
/*-----------------------------------------------------------------*/
void *
findSymWithLevel (bucket ** stab, symbol * sym)
{
  bucket *bp;

  bp = stab[hashKey (sym->name)];

  /**
   **  do the search from the head of the list since the
   **  elements are added at the head it is ensured that
   ** we will find the deeper definitions before we find
   ** the global ones. we need to check for symbols with
   ** level <= to the level given, if levels match then block
   ** numbers need to match as well
   **/
  while (bp)
    {
      if (strcmp (bp->name, sym->name) == 0 && bp->level <= sym->level)
	{
	  /* if this is parameter then nothing else need to be checked */
	  if (((symbol *) (bp->sym))->_isparm)
	    return (bp->sym);
	  /* if levels match then block numbers should also match */
	  if (bp->level && bp->level == sym->level && bp->block == sym->block)
	    return (bp->sym);
	  /* if levels don't match then we are okay */
	  if (bp->level && bp->level != sym->level && bp->block <= sym->block)
	    return (bp->sym);
	  /* if this is a global variable then we are ok too */
	  if (bp->level == 0)
	    return (bp->sym);
	}

      bp = bp->next;
    }

  return (void *) NULL;
}

/*-----------------------------------------------------------------*/
/* findSymWithBlock - finds a symbol with name in with a block     */
/*-----------------------------------------------------------------*/
void *
findSymWithBlock (bucket ** stab, symbol * sym, int block)
{
  bucket *bp;

  bp = stab[hashKey (sym->name)];
  while (bp)
    {
      if (strcmp (bp->name, sym->name) == 0 &&
	  bp->block <= block)
	break;
      bp = bp->next;
    }

  return (bp ? bp->sym : (void *) NULL);
}

/*------------------------------------------------------------------*/
/* newSymbol () - returns a new pointer to a symbol                 */
/*------------------------------------------------------------------*/
symbol *
newSymbol (char *name, int scope)
{
  symbol *sym;

  sym = Safe_alloc ( sizeof (symbol));

  strcpy (sym->name, name);	/* copy the name    */
  sym->level = scope;		/* set the level    */
  sym->block = currBlockno;
  sym->lineDef = yylineno;	/* set the line number */
  return sym;
}

/*------------------------------------------------------------------*/
/* newLink - creates a new link (declarator,specifier)              */
/*------------------------------------------------------------------*/
sym_link *
newLink ()
{
  sym_link *p;

  p = Safe_alloc ( sizeof (sym_link));

  return p;
}

/*------------------------------------------------------------------*/
/* newStruct - creats a new structdef from the free list            */
/*------------------------------------------------------------------*/
structdef *
newStruct (char *tag)
{
  structdef *s;

  s = Safe_alloc ( sizeof (structdef));

  strcpy (s->tag, tag);		/* copy the tag            */
  return s;
}

/*------------------------------------------------------------------*/
/* pointerTypes - do the computation for the pointer types          */
/*------------------------------------------------------------------*/
void 
pointerTypes (sym_link * ptr, sym_link * type)
{
  if (IS_SPEC (ptr))
    return;

  /* find the first pointer type */
  while (ptr && !IS_PTR (ptr))
    ptr = ptr->next;

  /* could not find it */
  if (!ptr || IS_SPEC (ptr))
    return;
  
  if (IS_PTR(ptr) && DCL_TYPE(ptr)!=UPOINTER) {
    pointerTypes (ptr->next, type);
    return;
  }

  /* change the pointer type depending on the
     storage class of the type */
  if (IS_SPEC (type))
    {
      DCL_PTR_CONST (ptr) = SPEC_CONST (type);
      DCL_PTR_VOLATILE (ptr) = SPEC_VOLATILE (type);
      switch (SPEC_SCLS (type))
	{
	case S_XDATA:
	  DCL_TYPE (ptr) = FPOINTER;
	  break;
	case S_IDATA:
	  DCL_TYPE (ptr) = IPOINTER;
	  break;
	case S_PDATA:
	  DCL_TYPE (ptr) = PPOINTER;
	  break;
	case S_DATA:
	  DCL_TYPE (ptr) = POINTER;
	  break;
	case S_CODE:
	  DCL_PTR_CONST (ptr) = port->mem.code_ro;
	  DCL_TYPE (ptr) = CPOINTER;
	  break;
	case S_EEPROM:
	  DCL_TYPE (ptr) = EEPPOINTER;
	  break;
	default:
	  DCL_TYPE (ptr) = GPOINTER;
	  break;
	}
      /* the storage class of type ends here */
      SPEC_SCLS (type) =
	SPEC_CONST (type) =
	SPEC_VOLATILE (type) = 0;
    }

  /* now change all the remaining unknown pointers
     to generic pointers */
  while (ptr)
    {
      if (!IS_SPEC (ptr) && DCL_TYPE (ptr) == UPOINTER)
	DCL_TYPE (ptr) = GPOINTER;
      ptr = ptr->next;
    }

  /* same for the type although it is highly unlikely that
     type will have a pointer */
  while (type)
    {
      if (!IS_SPEC (type) && DCL_TYPE (type) == UPOINTER)
	DCL_TYPE (type) = GPOINTER;
      type = type->next;
    }

}

/*------------------------------------------------------------------*/
/* addDecl - adds a declarator @ the end of a chain                 */
/*------------------------------------------------------------------*/
void 
addDecl (symbol * sym, int type, sym_link * p)
{
  sym_link *head;
  sym_link *tail;
  sym_link *t;

  if (getenv("SDCC_DEBUG_FUNCTION_POINTERS"))
    fprintf (stderr, "SDCCsymt.c:addDecl(%s,%d,%p)\n", sym->name, type, p);

  /* if we are passed a link then set head & tail */
  if (p)
    {
      tail = head = p;
      while (tail->next)
	tail = tail->next;
    }
  else
    {
      head = tail = newLink ();
      DCL_TYPE (head) = type;
    }

  /* if this is the first entry   */
  if (!sym->type)
    {
      sym->type = head;
      sym->etype = tail;
    }
  else
    {
      if (IS_SPEC (sym->etype) && IS_SPEC (head) && head == tail)
	{
	  sym->etype = mergeSpec (sym->etype, head, sym->name);
	}
      else
	{
	  if (IS_SPEC (sym->etype) && !IS_SPEC (head) && head == tail)
	    {
	      t = sym->type;
	      while (t->next != sym->etype)
		t = t->next;
	      t->next = head;
	      tail->next = sym->etype;
	    }
	  else
	    {
	      sym->etype->next = head;
	      sym->etype = tail;
	    }
	}
    }

  /* if the type is an unknown pointer and has
     a tspec then take the storage class const & volatile
     attribute from the tspec & make it those of this
     symbol */
  if (p &&
      !IS_SPEC (p) &&
      //DCL_TYPE (p) == UPOINTER &&
      DCL_TSPEC (p))
    {
      if (!IS_SPEC (sym->etype))
	{
	  sym->etype = sym->etype->next = newLink ();
	  sym->etype->class = SPECIFIER;
	}
      SPEC_SCLS (sym->etype) = SPEC_SCLS (DCL_TSPEC (p));
      SPEC_CONST (sym->etype) = SPEC_CONST (DCL_TSPEC (p));
      SPEC_VOLATILE (sym->etype) = SPEC_VOLATILE (DCL_TSPEC (p));
      DCL_TSPEC (p) = NULL;
    }

  // if there is a function in this type chain
  if (p && funcInChain(sym->type)) {
    processFuncArgs (sym);
  }

  return;
}

/*------------------------------------------------------------------
  checkTypeSanity: prevent the user from doing e.g.:
  unsigned float uf;
  ------------------------------------------------------------------*/
void checkTypeSanity(sym_link *etype, char *name) {
  char *noun;

  if (!etype) {
    if (getenv("DEBUG_SANITY")) {
      fprintf (stderr, "sanity check skipped for %s (etype==0)\n", name);
    }
    return;
  }

  if (!IS_SPEC(etype)) {
    if (getenv("DEBUG_SANITY")) {
      fprintf (stderr, "sanity check skipped for %s (!IS_SPEC)\n", name);
    }
    return;
  }

  noun=nounName(etype);

  if (getenv("DEBUG_SANITY")) {
    fprintf (stderr, "checking sanity for %s %x\n", name, (int)etype);
  }

  if ((SPEC_NOUN(etype)==V_CHAR || 
       SPEC_NOUN(etype)==V_FLOAT || 
       SPEC_NOUN(etype)==V_DOUBLE || 
       SPEC_NOUN(etype)==V_VOID) &&
      (etype->select.s._short || SPEC_LONG(etype))) {
    // long or short for char float double or void
    werror (E_LONG_OR_SHORT_INVALID, noun, name);
  }
  if ((SPEC_NOUN(etype)==V_FLOAT || 
       SPEC_NOUN(etype)==V_DOUBLE || 
       SPEC_NOUN(etype)==V_VOID) && 
      (etype->select.s._signed || SPEC_USIGN(etype))) {
    // signed or unsigned for float double or void
    werror (E_SIGNED_OR_UNSIGNED_INVALID, noun, name);
  }

  // special case for "short"
  if (etype->select.s._short) {
    SPEC_NOUN(etype) = options.shortis8bits ? V_CHAR : V_INT;
    etype->select.s._short = 0;
  }

  /* if no noun e.g. 
     "const a;" or "data b;" or "signed s" or "long l"
     assume an int */
  if (!SPEC_NOUN(etype)) {
    SPEC_NOUN(etype)=V_INT;
  }

  if (etype->select.s._signed && SPEC_USIGN(etype)) {
    // signed AND unsigned 
    werror (E_SIGNED_AND_UNSIGNED_INVALID, noun, name);
  }
  if (etype->select.s._short && SPEC_LONG(etype)) {
    // short AND long
    werror (E_LONG_AND_SHORT_INVALID, noun, name);
  }

}

/*------------------------------------------------------------------*/
/* mergeSpec - merges two specifiers and returns the new one        */
/*------------------------------------------------------------------*/
sym_link *
mergeSpec (sym_link * dest, sym_link * src, char *name)
{
  sym_link *symlink=dest;

  if (!IS_SPEC(dest) || !IS_SPEC(src)) {
#if 0
    werror (E_INTERNAL_ERROR, __FILE__, __LINE__, "cannot merge declarator");
    exit (1);
#else
    werror (E_SYNTAX_ERROR, yytext);
    // the show must go on
    return newIntLink();
#endif
  }

  if (SPEC_NOUN(src)) {
    if (!SPEC_NOUN(dest)) {
      SPEC_NOUN(dest)=SPEC_NOUN(src);
    } else {
      /* we shouldn't redeclare the type */
      if (getenv("DEBUG_SANITY")) {
	fprintf (stderr, "mergeSpec: ");
      }
      werror(E_TWO_OR_MORE_DATA_TYPES, name);
    }
  }
  
  if (SPEC_SCLS(src)) {
    /* if destination has no storage class */
    if (!SPEC_SCLS (dest) || SPEC_SCLS(dest)==S_REGISTER) {
      SPEC_SCLS (dest) = SPEC_SCLS (src);
    } else {
      if (getenv("DEBUG_SANITY")) {
	fprintf (stderr, "mergeSpec: ");
      }
      werror(E_TWO_OR_MORE_STORAGE_CLASSES, name);
    }
  }

  /* copy all the specifications  */

  // we really should do: 
#if 0
  if (SPEC_what(src)) {
    if (SPEC_what(dest)) {
      werror(W_DUPLICATE_SPEC, "what");
    }
    SPEC_what(dst)|=SPEC_what(src);
  }
#endif
  // but there are more important thing right now

  SPEC_LONG (dest) |= SPEC_LONG (src);
  dest->select.s._short|=src->select.s._short;
  SPEC_USIGN (dest) |= SPEC_USIGN (src);
  dest->select.s._signed|=src->select.s._signed;
  SPEC_STAT (dest) |= SPEC_STAT (src);
  SPEC_EXTR (dest) |= SPEC_EXTR (src);
  SPEC_CONST(dest) |= SPEC_CONST (src);
  SPEC_ABSA (dest) |= SPEC_ABSA (src);
  SPEC_VOLATILE (dest) |= SPEC_VOLATILE (src);
  SPEC_ADDR (dest) |= SPEC_ADDR (src);
  SPEC_OCLS (dest) = SPEC_OCLS (src);
  SPEC_BLEN (dest) |= SPEC_BLEN (src);
  SPEC_BSTR (dest) |= SPEC_BSTR (src);
  SPEC_TYPEDEF (dest) |= SPEC_TYPEDEF (src);

  if (IS_STRUCT (dest) && SPEC_STRUCT (dest) == NULL)
    SPEC_STRUCT (dest) = SPEC_STRUCT (src);

  /* these are the only function attributes that will be set 
     in a specifier while parsing */
  FUNC_NONBANKED(dest) |= FUNC_NONBANKED(src);
  FUNC_BANKED(dest) |= FUNC_BANKED(src);
  FUNC_ISCRITICAL(dest) |= FUNC_ISCRITICAL(src);
  FUNC_ISREENT(dest) |= FUNC_ISREENT(src);
  FUNC_ISNAKED(dest) |= FUNC_ISNAKED(src);
  FUNC_ISISR(dest) |= FUNC_ISISR(src);
  FUNC_INTNO(dest) |= FUNC_INTNO(src);
  FUNC_REGBANK(dest) |= FUNC_REGBANK(src);

  return symlink;
}

/*------------------------------------------------------------------*/
/* cloneSpec - copies the entire spec and returns a new spec        */
/*------------------------------------------------------------------*/
sym_link *
cloneSpec (sym_link * src)
{
  sym_link *spec;

  /* go thru chain till we find the specifier */
  while (src && src->class != SPECIFIER)
    src = src->next;

  spec = newLink ();
  memcpy (spec, src, sizeof (sym_link));
  return spec;
}

/*------------------------------------------------------------------*/
/* genSymName - generates and returns a name used for anonymous vars */
/*------------------------------------------------------------------*/
char *
genSymName (int level)
{
  static int gCount = 0;
  static char gname[SDCC_NAME_MAX + 1];

  sprintf (gname, "__%04d%04d", level, gCount++);
  return gname;
}

/*------------------------------------------------------------------*/
/* getSpec - returns the specifier part from a declaration chain    */
/*------------------------------------------------------------------*/
sym_link *
getSpec (sym_link * p)
{
  sym_link *loop;

  loop = p;
  while (p && !(IS_SPEC (p)))
    p = p->next;

  return p;
}

/*------------------------------------------------------------------*/
/* newCharLink() - creates an char type                             */
/*------------------------------------------------------------------*/
sym_link *
newCharLink ()
{
  sym_link *p;

  p = newLink ();
  p->class = SPECIFIER;
  SPEC_NOUN (p) = V_CHAR;

  return p;
}

/*------------------------------------------------------------------*/
/* newFloatLink - a new Float type                                  */
/*------------------------------------------------------------------*/
sym_link *
newFloatLink ()
{
  sym_link *p;

  p = newLink ();
  p->class = SPECIFIER;
  SPEC_NOUN (p) = V_FLOAT;

  return p;
}

/*------------------------------------------------------------------*/
/* newLongLink() - new long type                                    */
/*------------------------------------------------------------------*/
sym_link *
newLongLink ()
{
  sym_link *p;

  p = newLink ();
  p->class = SPECIFIER;
  SPEC_NOUN (p) = V_INT;
  SPEC_LONG (p) = 1;

  return p;
}

/*------------------------------------------------------------------*/
/* newIntLink() - creates an int type                               */
/*------------------------------------------------------------------*/
sym_link *
newIntLink ()
{
  sym_link *p;

  p = newLink ();
  p->class = SPECIFIER;
  SPEC_NOUN (p) = V_INT;

  return p;
}

/*------------------------------------------------------------------*/
/* getSize - returns size of a type chain in bits                   */
/*------------------------------------------------------------------*/
unsigned int 
getSize (sym_link * p)
{
  /* if nothing return 0 */
  if (!p)
    return 0;
  if (IS_SPEC (p))
    {				/* if this is the specifier then */
      switch (SPEC_NOUN (p))
	{			/* depending on the specifier type */
	case V_INT:
	  return (IS_LONG (p) ? LONGSIZE : INTSIZE);
	case V_FLOAT:
	  return FLOATSIZE;
	case V_CHAR:
	  return CHARSIZE;
	case V_VOID:
	  return 0;
	case V_STRUCT:
	  return SPEC_STRUCT (p)->size;
	case V_LABEL:
	  return 0;
	case V_SBIT:
	  return BITSIZE;
	case V_BIT:
	  return ((SPEC_BLEN (p) / 8) + (SPEC_BLEN (p) % 8 ? 1 : 0));
	default:
	  return 0;
	}
    }

  /* this is a specifier  */
  switch (DCL_TYPE (p))
    {
    case FUNCTION:
      return 2;
    case ARRAY:
      return DCL_ELEM (p) * getSize (p->next);
    case IPOINTER:
    case PPOINTER:
    case POINTER:
      return (PTRSIZE);
    case EEPPOINTER:
    case FPOINTER:
    case CPOINTER:
      return (FPTRSIZE);
    case GPOINTER:
      return (GPTRSIZE);

    default:
      return 0;
    }
}

/*------------------------------------------------------------------*/
/* bitsForType - returns # of bits required to store this type      */
/*------------------------------------------------------------------*/
unsigned int 
bitsForType (sym_link * p)
{
  /* if nothing return 0 */
  if (!p)
    return 0;

  if (IS_SPEC (p))
    {				/* if this is the specifier then */

      switch (SPEC_NOUN (p))
	{			/* depending on the specifier type */
	case V_INT:
	  return (IS_LONG (p) ? LONGSIZE * 8 : INTSIZE * 8);
	case V_FLOAT:
	  return FLOATSIZE * 8;
	case V_CHAR:
	  return CHARSIZE * 8;
	case V_VOID:
	  return 0;
	case V_STRUCT:
	  return SPEC_STRUCT (p)->size * 8;
	case V_LABEL:
	  return 0;
	case V_SBIT:
	  return 1;
	case V_BIT:
	  return SPEC_BLEN (p);
	default:
	  return 0;
	}
    }

  /* this is a specifier  */
  switch (DCL_TYPE (p))
    {
    case FUNCTION:
      return 2;
    case ARRAY:
      return DCL_ELEM (p) * getSize (p->next) * 8;
    case IPOINTER:
    case PPOINTER:
    case POINTER:
      return (PTRSIZE * 8);
    case EEPPOINTER:
    case FPOINTER:
    case CPOINTER:
      return (FPTRSIZE * 8);
    case GPOINTER:
      return (GPTRSIZE * 8);

    default:
      return 0;
    }
}

/*------------------------------------------------------------------*/
/* copySymbolChain - copies a symbol chain                          */
/*------------------------------------------------------------------*/
symbol *
copySymbolChain (symbol * src)
{
  symbol *dest;

  if (!src)
    return NULL;

  dest = copySymbol (src);
  dest->next = copySymbolChain (src->next);
  return dest;
}

/*------------------------------------------------------------------*/
/* copySymbol - makes a copy of a symbol                            */
/*------------------------------------------------------------------*/
symbol *
copySymbol (symbol * src)
{
  symbol *dest;

  if (!src)
    return NULL;

  dest = newSymbol (src->name, src->level);
  memcpy (dest, src, sizeof (symbol));
  dest->level = src->level;
  dest->block = src->block;
  dest->ival = copyIlist (src->ival);
  dest->type = copyLinkChain (src->type);
  dest->etype = getSpec (dest->type);
  dest->next = NULL;
  dest->key = src->key;
  dest->allocreq = src->allocreq;
  return dest;
}

/*------------------------------------------------------------------*/
/* reverseSyms - reverses the links for a symbol chain      */
/*------------------------------------------------------------------*/
symbol *
reverseSyms (symbol * sym)
{
  symbol *prev, *curr, *next;

  if (!sym)
    return NULL;

  prev = sym;
  curr = sym->next;

  while (curr)
    {
      next = curr->next;
      curr->next = prev;
      prev = curr;
      curr = next;
    }
  sym->next = (void *) NULL;
  return prev;
}

/*------------------------------------------------------------------*/
/* reverseLink - reverses the links for a type chain        */
/*------------------------------------------------------------------*/
sym_link *
reverseLink (sym_link * type)
{
  sym_link *prev, *curr, *next;

  if (!type)
    return NULL;

  prev = type;
  curr = type->next;

  while (curr)
    {
      next = curr->next;
      curr->next = prev;
      prev = curr;
      curr = next;
    }
  type->next = (void *) NULL;
  return prev;
}

/*------------------------------------------------------------------*/
/* addSymChain - adds a symbol chain to the symboltable             */
/*------------------------------------------------------------------*/
void 
addSymChain (symbol * symHead)
{
  symbol *sym = symHead;
  symbol *csym = NULL;

  for (; sym != NULL; sym = sym->next)
    {
      changePointer(sym);
      checkTypeSanity(sym->etype, sym->name);

      /* if already exists in the symbol table then check if
         one of them is an extern definition if yes then
         then check if the type match, if the types match then
         delete the current entry and add the new entry      */
      if ((csym = findSymWithLevel (SymbolTab, sym)) &&
	  csym->level == sym->level) {
	
	/* one definition extern ? */
	if (IS_EXTERN (csym->etype) || IS_EXTERN (sym->etype)) {
	  /* do types match ? */
	  if (compareType (csym->type, sym->type) != 1) {
	    /* no then error */
	    werror (E_EXTERN_MISMATCH, csym->name);
	    continue;
	  }
	  /* delete current entry */
	  deleteSym (SymbolTab, csym, csym->name);
	} else {
	  /* not extern */
	  werror (E_DUPLICATE, sym->name);
	  continue;
	}
      }

      /* add new entry */
      addSym (SymbolTab, sym, sym->name, sym->level, sym->block, 1);
    }
}


/*------------------------------------------------------------------*/
/* funcInChain - DCL Type 'FUNCTION' found in type chain            */
/*------------------------------------------------------------------*/
int 
funcInChain (sym_link * lnk)
{
  while (lnk)
    {
      if (IS_FUNC (lnk))
	return 1;
      lnk = lnk->next;
    }
  return 0;
}

/*------------------------------------------------------------------*/
/* structElemType - returns the type info of a sturct member        */
/*------------------------------------------------------------------*/
sym_link *
structElemType (sym_link * stype, value * id)
{
  symbol *fields = (SPEC_STRUCT (stype) ? SPEC_STRUCT (stype)->fields : NULL);
  sym_link *type, *etype;
  sym_link *petype = getSpec (stype);

  if (!fields || !id)
    return NULL;

  /* look for the id */
  while (fields)
    {
      if (strcmp (fields->rname, id->name) == 0)
	{
	  type = copyLinkChain (fields->type);
	  etype = getSpec (type);
	  SPEC_SCLS (etype) = (SPEC_SCLS (petype) == S_REGISTER ?
			       SPEC_SCLS (etype) : SPEC_SCLS (petype));
	  return type;
	}
      fields = fields->next;
    }
  werror (E_NOT_MEMBER, id->name);

  return NULL;
}

/*------------------------------------------------------------------*/
/* getStructElement - returns element of a tructure definition      */
/*------------------------------------------------------------------*/
symbol *
getStructElement (structdef * sdef, symbol * sym)
{
  symbol *field;

  for (field = sdef->fields; field; field = field->next)
    if (strcmp (field->name, sym->name) == 0)
      return field;

  werror (E_NOT_MEMBER, sym->name);

  return sdef->fields;
}

/*------------------------------------------------------------------*/
/* compStructSize - computes the size of a structure                */
/*------------------------------------------------------------------*/
int 
compStructSize (int su, structdef * sdef)
{
    int sum = 0, usum = 0;
    int bitOffset = 0;
    symbol *loop;

    /* for the identifiers  */
    loop = sdef->fields;
    while (loop) {

	/* create the internal name for this variable */
	sprintf (loop->rname, "_%s", loop->name);
	loop->offset = (su == UNION ? sum = 0 : sum);
	SPEC_VOLATILE (loop->etype) |= (su == UNION ? 1 : 0);

	/* if this is a bit field  */
	if (loop->bitVar) {

	    /* change it to a unsigned bit */
	    SPEC_NOUN (loop->etype) = V_BIT;
	    SPEC_USIGN (loop->etype) = 1;
	    /* check if this fit into the remaining   */
	    /* bits of this byte else align it to the */
	    /* next byte boundary                     */
	    if ((SPEC_BLEN (loop->etype) = loop->bitVar) <= (8 - bitOffset)) {
		SPEC_BSTR (loop->etype) = bitOffset;
		if ((bitOffset += (loop->bitVar % 8)) == 8)
		    sum++;
	    }
	    else /* does not fit */ {
		bitOffset = 0;
		SPEC_BSTR (loop->etype) = bitOffset;
		sum += (loop->bitVar / 8);
		bitOffset += (loop->bitVar % 8);
	    }
	    /* if this is the last field then pad */
	    if (!loop->next && bitOffset && bitOffset != 8) {
		bitOffset = 0;
		sum++;
	    }
	}
	else {
	    checkDecl (loop, 1);
	    sum += getSize (loop->type);
	}

#if 0 // jwk: this is done now in addDecl()
	/* if function then do the arguments for it */
	if (funcInChain (loop->type)) {
	    processFuncArgs (loop);
	}
#endif

	loop = loop->next;

	/* if this is not a bitfield but the */
	/* previous one was and did not take */
	/* the whole byte then pad the rest  */
	if ((loop && !loop->bitVar) && bitOffset) {
	    bitOffset = 0;
	    sum++;
	}

	/* if union then size = sizeof larget field */
	if (su == UNION)
	    usum = max (usum, sum);

    }

    return (su == UNION ? usum : sum);
}

/*------------------------------------------------------------------*/
/* checkSClass - check the storage class specification              */
/*------------------------------------------------------------------*/
static void 
checkSClass (symbol * sym, int isProto)
{
  if (getenv("DEBUG_SANITY")) {
    fprintf (stderr, "checkSClass: %s \n", sym->name);
  }
  
  /* type is literal can happen foe enums change
     to auto */
  if (SPEC_SCLS (sym->etype) == S_LITERAL && !SPEC_ENUM (sym->etype))
    SPEC_SCLS (sym->etype) = S_AUTO;
  
  /* if sfr or sbit then must also be */
  /* volatile the initial value will be xlated */
  /* to an absolute address */
  if (SPEC_SCLS (sym->etype) == S_SBIT ||
      SPEC_SCLS (sym->etype) == S_SFR)
    {
      SPEC_VOLATILE (sym->etype) = 1;
      /* if initial value given */
      if (sym->ival)
	{
	  SPEC_ABSA (sym->etype) = 1;
	  SPEC_ADDR (sym->etype) =
	    (int) list2int (sym->ival);
	  sym->ival = NULL;
	}
    }
  
  /* if absolute address given then it mark it as
     volatile */
  if (IS_ABSOLUTE (sym->etype))
    SPEC_VOLATILE (sym->etype) = 1;
  
  /* global variables declared const put into code */
  if (sym->level == 0 &&
      SPEC_CONST (sym->etype)) {
    SPEC_SCLS (sym->etype) = S_CODE;
  }
  
  /* global variable in code space is a constant */
  if (sym->level == 0 &&
      SPEC_SCLS (sym->etype) == S_CODE &&
      port->mem.code_ro)
    SPEC_CONST (sym->etype) = 1;
  

  /* if bit variable then no storage class can be */
  /* specified since bit is already a storage */
  if (IS_BITVAR (sym->etype) &&
      (SPEC_SCLS (sym->etype) != S_FIXED &&
       SPEC_SCLS (sym->etype) != S_SBIT &&
       SPEC_SCLS (sym->etype) != S_BIT)
    )
    {
      werror (E_BITVAR_STORAGE, sym->name);
      SPEC_SCLS (sym->etype) = S_FIXED;
    }

  /* extern variables cannot be initialized */
  if (IS_EXTERN (sym->etype) && sym->ival)
    {
      werror (E_EXTERN_INIT, sym->name);
      sym->ival = NULL;
    }

  /* if this is an atomatic symbol */
  if (sym->level && (options.stackAuto || reentrant)) {
    if ((SPEC_SCLS (sym->etype) == S_AUTO ||
	 SPEC_SCLS (sym->etype) == S_FIXED ||
	 SPEC_SCLS (sym->etype) == S_REGISTER ||
	 SPEC_SCLS (sym->etype) == S_STACK ||
	 SPEC_SCLS (sym->etype) == S_XSTACK)) {
      SPEC_SCLS (sym->etype) = S_AUTO;
    } else {
      /* storage class may only be specified for statics */
      if (!IS_STATIC(sym->etype)) {
	werror (E_AUTO_ASSUMED, sym->name);
      }
    }
  }
  
  /* automatic symbols cannot be given   */
  /* an absolute address ignore it      */
  if (sym->level &&
      SPEC_ABSA (sym->etype) &&
      (options.stackAuto || reentrant))
    {
      werror (E_AUTO_ABSA, sym->name);
      SPEC_ABSA (sym->etype) = 0;
    }

  /* arrays & pointers cannot be defined for bits   */
  /* SBITS or SFRs or BIT                           */
  if ((IS_ARRAY (sym->type) || IS_PTR (sym->type)) &&
      (SPEC_NOUN (sym->etype) == V_BIT ||
       SPEC_NOUN (sym->etype) == V_SBIT ||
       SPEC_SCLS (sym->etype) == S_SFR))
    werror (E_BIT_ARRAY, sym->name);

  /* if this is a bit|sbit then set length & start  */
  if (SPEC_NOUN (sym->etype) == V_BIT ||
      SPEC_NOUN (sym->etype) == V_SBIT)
    {
      SPEC_BLEN (sym->etype) = 1;
      SPEC_BSTR (sym->etype) = 0;
    }

  if (!isProto) {
    /* variables declared in CODE space must have */
    /* initializers if not an extern */
    if (SPEC_SCLS (sym->etype) == S_CODE &&
	sym->ival == NULL &&
	//!sym->level &&
	port->mem.code_ro &&
	!IS_EXTERN (sym->etype) &&
	!funcInChain (sym->type))
      werror (E_CODE_NO_INIT, sym->name);
  }

  /* if parameter or local variable then change */
  /* the storage class to reflect where the var will go */
  if (sym->level && SPEC_SCLS (sym->etype) == S_FIXED &&
      !IS_STATIC(sym->etype))
    {
      if (options.stackAuto || (currFunc && IFFUNC_ISREENT (currFunc->type)))
	{
	  SPEC_SCLS (sym->etype) = (options.useXstack ?
				    S_XSTACK : S_STACK);
	}
      else
	{
	  /* hack-o-matic! I see no reason why the useXstack option should ever
	   * control this allcoation, but the code was originally that way, and
	   * changing it for non-390 ports breaks the compiler badly.
	   */
	  bool useXdata = TARGET_IS_DS390 ? 1 : options.useXstack;
	  SPEC_SCLS (sym->etype) = (useXdata ?
				    S_XDATA : S_FIXED);
	}
    }
}

/*------------------------------------------------------------------*/
/* changePointer - change pointer to functions                      */
/*------------------------------------------------------------------*/
void 
changePointer (symbol * sym)
{
  sym_link *p;

  /* go thru the chain of declarations   */
  /* if we find a pointer to a function  */
  /* unconditionally change it to a ptr  */
  /* to code area                        */
  for (p = sym->type; p; p = p->next)
    {
      if (!IS_SPEC (p) && DCL_TYPE (p) == UPOINTER)
	DCL_TYPE (p) = GPOINTER;
      if (IS_PTR (p) && IS_FUNC (p->next))
	DCL_TYPE (p) = CPOINTER;
    }
}

/*------------------------------------------------------------------*/
/* checkDecl - does semantic validation of a declaration                   */
/*------------------------------------------------------------------*/
int 
checkDecl (symbol * sym, int isProto)
{

  checkSClass (sym, isProto);		/* check the storage class      */
  changePointer (sym);		/* change pointers if required */

  /* if this is an array without any dimension
     then update the dimension from the initial value */
  if (IS_ARRAY (sym->type) && !DCL_ELEM (sym->type))
    DCL_ELEM (sym->type) = getNelements (sym->type, sym->ival);

  return 0;
}

/*------------------------------------------------------------------*/
/* copyLinkChain - makes a copy of the link chain & rets ptr 2 head */
/*------------------------------------------------------------------*/
sym_link *
copyLinkChain (sym_link * p)
{
  sym_link *head, *curr, *loop;

  curr = p;
  head = loop = (curr ? newLink () : (void *) NULL);
  while (curr)
    {
      memcpy (loop, curr, sizeof (sym_link));	/* copy it */
      loop->next = (curr->next ? newLink () : (void *) NULL);
      loop = loop->next;
      curr = curr->next;
    }

  return head;
}


/*------------------------------------------------------------------*/
/* cleanUpBlock - cleansup the symbol table specified for all the   */
/*                symbols in the given block                        */
/*------------------------------------------------------------------*/
void 
cleanUpBlock (bucket ** table, int block)
{
  int i;
  bucket *chain;

  /* go thru the entire  table  */
  for (i = 0; i < 256; i++)
    {
      for (chain = table[i]; chain; chain = chain->next)
	{
	  if (chain->block >= block)
	    {
	      deleteSym (table, chain->sym, chain->name);
	    }
	}
    }
}

/*------------------------------------------------------------------*/
/* cleanUpLevel - cleansup the symbol table specified for all the   */
/*                symbols in the given level                        */
/*------------------------------------------------------------------*/
void 
cleanUpLevel (bucket ** table, int level)
{
  int i;
  bucket *chain;

  /* go thru the entire  table  */
  for (i = 0; i < 256; i++)
    {
      for (chain = table[i]; chain; chain = chain->next)
	{
	  if (chain->level >= level)
	    {
	      deleteSym (table, chain->sym, chain->name);
	    }
	}
    }
}

/*------------------------------------------------------------------*/
/* computeType - computes the resultant type from two types         */
/*------------------------------------------------------------------*/
sym_link *
computeType (sym_link * type1, sym_link * type2)
{
  sym_link *rType;
  sym_link *reType;
  sym_link *etype1 = getSpec (type1);
  sym_link *etype2 = getSpec (type2);

  /* if one of them is a float then result is a float */
  /* here we assume that the types passed are okay */
  /* and can be cast to one another                */
  /* which ever is greater in size */
  if (IS_FLOAT (etype1) || IS_FLOAT (etype2))
    rType = newFloatLink ();
  else
    /* if only one of them is a bit variable
       then the other one prevails */
  if (IS_BITVAR (etype1) && !IS_BITVAR (etype2))
    rType = copyLinkChain (type2);
  else if (IS_BITVAR (etype2) && !IS_BITVAR (etype1))
    rType = copyLinkChain (type1);
  else
    /* if one of them is a pointer then that
       prevails */
  if (IS_PTR (type1))
    rType = copyLinkChain (type1);
  else if (IS_PTR (type2))
    rType = copyLinkChain (type2);
  else if (getSize (type1) > getSize (type2))
    rType = copyLinkChain (type1);
  else
    rType = copyLinkChain (type2);

  reType = getSpec (rType);

  /* if either of them unsigned but not val then make this unsigned */
  if (((!IS_LITERAL(type1) && SPEC_USIGN (etype1)) || 
       (!IS_LITERAL(type2) && SPEC_USIGN (etype2))) && 
      !IS_FLOAT (reType))
    SPEC_USIGN (reType) = 1;
  else
    SPEC_USIGN (reType) = 0;
  
  /* if result is a literal then make not so */
  if (IS_LITERAL (reType))
    SPEC_SCLS (reType) = S_REGISTER;

  return rType;
}

/*--------------------------------------------------------------------*/
/* compareType - will do type check return 1 if match, -1 if castable */
/*--------------------------------------------------------------------*/
int 
compareType (sym_link * dest, sym_link * src)
{
  if (!dest && !src)
    return 1;

  if (dest && !src)
    return 0;

  if (src && !dest)
    return 0;

  /* if dest is a declarator then */
  if (IS_DECL (dest))
    {
      if (IS_DECL (src))
	{
	  if (DCL_TYPE (src) == DCL_TYPE (dest)) {
	    if (IS_FUNC(src)) {
	      //checkFunction(src,dest);
	    }
	    return compareType (dest->next, src->next);
	  }
	  if (IS_PTR (src) && IS_GENPTR (dest))
	    return -1;
	  if (IS_PTR (dest) && IS_ARRAY (src)) {
	    value *val=aggregateToPointer (valFromType(src));
	    int res=compareType (dest, val->type);
	    Safe_free(val->type);
	    Safe_free(val);
	    //return res ? -1 : 0;
	    return res;
	  }
	  if (IS_PTR (dest) && IS_FUNC (dest->next) && IS_FUNC (src))
	    return compareType (dest->next, src);
	  return 0;
	}
      else if (IS_PTR (dest) && IS_INTEGRAL (src))
	return -1;
      else
	return 0;
    }

  /* if one is a specifier and the other is not */
  if ((IS_SPEC (src) && !IS_SPEC (dest)) ||
      (IS_SPEC (dest) && !IS_SPEC (src)))
    return 0;

  /* if one of them is a void then ok */
  if (SPEC_NOUN (dest) == V_VOID &&
      SPEC_NOUN (src) != V_VOID)
    return -1;

  if (SPEC_NOUN (dest) != V_VOID &&
      SPEC_NOUN (src) == V_VOID)
    return -1;

  /* if they are both bitfields then if the lengths
     and starts don't match */
  if (IS_BITFIELD (dest) && IS_BITFIELD (src) &&
      (SPEC_BLEN (dest) != SPEC_BLEN (src) ||
       SPEC_BSTR (dest) != SPEC_BSTR (src)))
    return -1;

  /* it is a specifier */
  if (SPEC_NOUN (dest) != SPEC_NOUN (src))
    {
      if (SPEC_USIGN (dest) == SPEC_USIGN (src) &&
	  IS_INTEGRAL (dest) && IS_INTEGRAL (src) &&
	  getSize (dest) == getSize (src))
	return 1;
      else if (IS_ARITHMETIC (dest) && IS_ARITHMETIC (src))
	return -1;
      else
	return 0;
    }
  else if (IS_STRUCT (dest))
    {
      if (SPEC_STRUCT (dest) != SPEC_STRUCT (src))
	return 0;
      else
	return 1;
    }
  if (SPEC_LONG (dest) != SPEC_LONG (src))
    return -1;

  if (SPEC_USIGN (dest) != SPEC_USIGN (src))
    return -1;

  return 1;
}

/*------------------------------------------------------------------*/
/* inCalleeSaveList - return 1 if found in callee save list          */
/*------------------------------------------------------------------*/
bool 
inCalleeSaveList (char *s)
{
  int i;

  for (i = 0; options.calleeSaves[i]; i++)
    if (strcmp (options.calleeSaves[i], s) == 0)
      return 1;

  return 0;
}

/*-----------------------------------------------------------------*/
/* aggregateToPointer:  change an agggregate type function      */
/*         argument to a pointer to that type.     */
/*-----------------------------------------------------------------*/
value *
aggregateToPointer (value * val)
{
  if (IS_AGGREGATE (val->type))
    {
      /* if this is a structure */
      /* then we need to add a new link */
      if (IS_STRUCT (val->type))
	{
	  /* first lets add DECLARATOR type */
	  sym_link *p = val->type;

	  werror (W_STRUCT_AS_ARG, val->name);
	  val->type = newLink ();
	  val->type->next = p;
	}

      /* change to a pointer depending on the */
      /* storage class specified        */
      switch (SPEC_SCLS (val->etype))
	{
	case S_IDATA:
	  DCL_TYPE (val->type) = IPOINTER;
	  break;
	case S_PDATA:
	  DCL_TYPE (val->type) = PPOINTER;
	  break;
	case S_FIXED:
	    DCL_TYPE(val->type)=PTR_TYPE(SPEC_OCLS(val->etype));

	  if (TARGET_IS_DS390)
	    {
	      /* The AUTO and REGISTER classes should probably
	       * also become generic pointers, but I haven't yet
	       * devised a test case for that.
	       */
	      DCL_TYPE (val->type) = GPOINTER;
	      break;
	    }
	  if (options.model==MODEL_LARGE) {
	    DCL_TYPE (val->type) = FPOINTER;
	    break;
	  }
	  break;
	case S_AUTO:
	case S_DATA:
	case S_REGISTER:
	  DCL_TYPE (val->type) = POINTER;
	  break;
	case S_CODE:
	  DCL_TYPE (val->type) = CPOINTER;
	  break;
	case S_XDATA:
	  DCL_TYPE (val->type) = FPOINTER;
	  break;
	case S_EEPROM:
	  DCL_TYPE (val->type) = EEPPOINTER;
	  break;
	default:
	  DCL_TYPE (val->type) = GPOINTER;
	}
      
      /* is there is a symbol associated then */
      /* change the type of the symbol as well */
      if (val->sym)
	{
	  val->sym->type = copyLinkChain (val->type);
	  val->sym->etype = getSpec (val->sym->type);
	}
    }
  return val;
}
/*------------------------------------------------------------------*/
/* checkFunction - does all kinds of check on a function            */
/*------------------------------------------------------------------*/
int 
checkFunction (symbol * sym, symbol *csym)
{
  value *exargs, *acargs;
  value *checkValue;
  int argCnt = 0;

  if (getenv("DEBUG_SANITY")) {
    fprintf (stderr, "checkFunction: %s ", sym->name);
  }

  /* make sure the type is complete and sane */
  checkTypeSanity(((symbol *)sym)->etype, ((symbol *)sym)->name);

  /* if not type then some kind of error */
  if (!sym->type)
    return 0;

  /* if the function has no type then make it return int */
  if (!sym->type->next)
    sym->type->next = sym->etype = newIntLink ();

  /* function cannot return aggregate */
  if (IS_AGGREGATE (sym->type->next))
    {
      werror (E_FUNC_AGGR, sym->name);
      return 0;
    }

  /* function cannot return bit */
  if (IS_BITVAR (sym->type->next))
    {
      werror (E_FUNC_BIT, sym->name);
      return 0;
    }

  /* check if this function is defined as calleeSaves
     then mark it as such */
    FUNC_CALLEESAVES(sym->type) = inCalleeSaveList (sym->name);

  /* if interrupt service routine  */
  /* then it cannot have arguments */
  if (IFFUNC_ARGS(sym->type) && FUNC_ISISR (sym->type))
    {
      if (!IS_VOID(FUNC_ARGS(sym->type)->type)) {
	werror (E_INT_ARGS, sym->name);
	FUNC_ARGS(sym->type)=NULL;
      }
    }

  if (!csym && !(csym = findSym (SymbolTab, sym, sym->name)))
    return 1;			/* not defined nothing more to check  */

  /* check if body already present */
  if (csym && IFFUNC_HASBODY(csym->type))
    {
      werror (E_FUNC_BODY, sym->name);
      return 0;
    }

  /* check the return value type   */
  if (compareType (csym->type, sym->type) <= 0)
    {
      werror (E_PREV_DEF_CONFLICT, csym->name, "type");
      printFromToType(csym->type, sym->type);
      return 0;
    }

  if (FUNC_ISISR (csym->type) != FUNC_ISISR (sym->type))
    {
      werror (E_PREV_DEF_CONFLICT, csym->name, "interrupt");
    }

  if (FUNC_REGBANK (csym->type) != FUNC_REGBANK (sym->type))
    {
      werror (E_PREV_DEF_CONFLICT, csym->name, "using");
    }

  if (IFFUNC_ISNAKED (csym->type) != IFFUNC_ISNAKED (sym->type))
    {
      werror (E_PREV_DEF_CONFLICT, csym->name, "_naked");
    }

  /* compare expected args with actual args */
  exargs = FUNC_ARGS(csym->type);
  acargs = FUNC_ARGS(sym->type);

  /* for all the expected args do */
  for (argCnt = 1;
       exargs && acargs;
       exargs = exargs->next, acargs = acargs->next, argCnt++)
    {
      if (getenv("DEBUG_SANITY")) {
	fprintf (stderr, "checkFunction: %s ", exargs->name);
      }
      /* make sure the type is complete and sane */
      checkTypeSanity(exargs->etype, exargs->name);

      /* If the actual argument is an array, any prototype
       * will have modified it to a pointer. Duplicate that
       * change here.
       */
      if (IS_AGGREGATE (acargs->type))
	{
	  checkValue = copyValue (acargs);
	  aggregateToPointer (checkValue);
	}
      else
	{
	  checkValue = acargs;
	}

      if (compareType (exargs->type, checkValue->type) <= 0)
	{
	  werror (E_ARG_TYPE, argCnt);
	  printFromToType(exargs->type, checkValue->type);
	  return 0;
	}
    }

  /* if one them ended we have a problem */
  if ((exargs && !acargs && !IS_VOID (exargs->type)) ||
      (!exargs && acargs && !IS_VOID (acargs->type)))
    werror (E_ARG_COUNT);

  /* replace with this defition */
  sym->cdef = csym->cdef;
  deleteSym (SymbolTab, csym, csym->name);
  addSym (SymbolTab, sym, sym->name, sym->level, sym->block, 1);
  if (IS_EXTERN (csym->etype) && !
      IS_EXTERN (sym->etype))
    {
      addSet (&publics, sym);
    }
  return 1;
}

/*-----------------------------------------------------------------*/
/* processFuncArgs - does some processing with function args       */
/*-----------------------------------------------------------------*/
void 
processFuncArgs (symbol * func)
{
  value *val;
  int pNum = 1;
  sym_link *funcType=func->type;

  if (getenv("SDCC_DEBUG_FUNCTION_POINTERS"))
    fprintf (stderr, "SDCCsymt.c:processFuncArgs(%s)\n", func->name);

  // if this is a pointer to a function
  if (IS_PTR(funcType)) {
    funcType=funcType->next;
  }

  /* if this function has variable argument list */
  /* then make the function a reentrant one    */
  if (IFFUNC_HASVARARGS(funcType))
    FUNC_ISREENT(funcType)=1;

  /* check if this function is defined as calleeSaves
     then mark it as such */
  FUNC_CALLEESAVES(funcType) = inCalleeSaveList (func->name);

  /* loop thru all the arguments   */
  val = FUNC_ARGS(funcType);

  /* if it is void then remove parameters */
  if (val && IS_VOID (val->type))
    {
      FUNC_ARGS(funcType) = NULL;
      return;
    }

  /* reset regparm for the port */
  (*port->reset_regparms) ();
  /* if any of the arguments is an aggregate */
  /* change it to pointer to the same type */
  while (val)
    {
      /* mark it as a register parameter if
         the function does not have VA_ARG
         and as port dictates */
      if (!IFFUNC_HASVARARGS(funcType) &&
	  (*port->reg_parm) (val->type))
	{
	  SPEC_REGPARM (val->etype) = 1;
	}

      if (IS_AGGREGATE (val->type))
	{
	  aggregateToPointer (val);
	}

      val = val->next;
      pNum++;
    }

  /* if this is an internal generated function call */
  if (func->cdef) {
    /* ignore --stack-auto for this one, we don't know how it is compiled */
    /* simply trust on --int-long-reent or --float-reent */
    if (IFFUNC_ISREENT(funcType)) {
      return;
    }
  } else {
    /* if this function is reentrant or */
    /* automatics r 2b stacked then nothing */
    if (IFFUNC_ISREENT (funcType) || options.stackAuto)
      return;
  }

  val = FUNC_ARGS(funcType);
  pNum = 1;
  while (val)
    {

      /* if a symbolname is not given  */
      /* synthesize a variable name */
      if (!val->sym)
	{

	  sprintf (val->name, "_%s_PARM_%d", func->name, pNum++);
	  val->sym = newSymbol (val->name, 1);
	  SPEC_OCLS (val->etype) = port->mem.default_local_map;
	  val->sym->type = copyLinkChain (val->type);
	  val->sym->etype = getSpec (val->sym->type);
	  val->sym->_isparm = 1;
	  strcpy (val->sym->rname, val->name);
	  SPEC_STAT (val->etype) = SPEC_STAT (val->sym->etype) =
	    SPEC_STAT (func->etype);
	  addSymChain (val->sym);

	}
      else			/* symbol name given create synth name */
	{

	  sprintf (val->name, "_%s_PARM_%d", func->name, pNum++);
	  strcpy (val->sym->rname, val->name);
	  val->sym->_isparm = 1;
	  SPEC_OCLS (val->etype) = SPEC_OCLS (val->sym->etype) =
	    (options.model != MODEL_SMALL ? xdata : data);
	  SPEC_STAT (val->etype) = SPEC_STAT (val->sym->etype) =
	    SPEC_STAT (func->etype);
	}
      val = val->next;
    }
}

/*-----------------------------------------------------------------*/
/* isSymbolEqual - compares two symbols return 1 if they match     */
/*-----------------------------------------------------------------*/
int 
isSymbolEqual (symbol * dest, symbol * src)
{
  /* if pointers match then equal */
  if (dest == src)
    return 1;

  /* if one of them is null then don't match */
  if (!dest || !src)
    return 0;

  /* if both of them have rname match on rname */
  if (dest->rname[0] && src->rname[0])
    return (!strcmp (dest->rname, src->rname));

  /* otherwise match on name */
  return (!strcmp (dest->name, src->name));
}

void PT(sym_link *type)
{
	printTypeChain(type,0);
}
/*-----------------------------------------------------------------*/
/* printTypeChain - prints the type chain in human readable form   */
/*-----------------------------------------------------------------*/
void
printTypeChain (sym_link * start, FILE * of)
{
  int nlr = 0;
  sym_link * type, * search;

  if (!of)
    {
      of = stdout;
      nlr = 1;
    }

  if (start==NULL) {
    fprintf (of, "void");
    return;
  }

  /* print the chain as it is written in the source: */
  /* start with the last entry                       */
  for (type = start; type && type->next; type = type->next)
    ;
  while (type)
    {
      if (IS_DECL (type))
	{
	  if (DCL_PTR_VOLATILE (type)) {
	    fprintf (of, "volatile ");
	  }
	  switch (DCL_TYPE (type))
	    {
	    case FUNCTION:
	      fprintf (of, "function ");
	      break;
	    case GPOINTER:
	      if (DCL_PTR_CONST (type))
		fprintf (of, "const ");
	      fprintf (of, "generic * ");
	      break;
	    case CPOINTER:
	      if (DCL_PTR_CONST (type))
		fprintf (of, "const ");
	      fprintf (of, "code * ");
	      break;
	    case FPOINTER:
	      if (DCL_PTR_CONST (type))
		fprintf (of, "const ");
	      fprintf (of, "xdata * ");
	      break;
	    case EEPPOINTER:
	      if (DCL_PTR_CONST (type))
		fprintf (of, "const ");
	      fprintf (of, "eeprom * ");
	      break;

	    case POINTER:
	      if (DCL_PTR_CONST (type))
		fprintf (of, "const ");
	      fprintf (of, "near *");
	      break;
	    case IPOINTER:
	      if (DCL_PTR_CONST (type))
		fprintf (of, "const ");
	      fprintf (of, "idata * ");
	      break;
	    case PPOINTER:
	      if (DCL_PTR_CONST (type))
		fprintf (of, "const ");
	      fprintf (of, "pdata * ");
	      break;
	    case UPOINTER:
	      if (DCL_PTR_CONST (type))
		fprintf (of, "const ");
	      fprintf (of, "unkown * ");
	      break;
	    case ARRAY:
	      fprintf (of, "[] ");
	      break;
	    }
	}
      else
	{
	  switch (SPEC_SCLS(type)) 
	    {
	    case S_DATA: fprintf (of, "data "); break;
	    case S_XDATA: fprintf (of, "xdata "); break;
	    case S_SFR: fprintf (of, "sfr "); break;
	    case S_SBIT: fprintf (of, "sbit "); break;
	    case S_CODE: fprintf (of, "code "); break;
	    case S_IDATA: fprintf (of, "idata "); break;
	    case S_PDATA: fprintf (of, "pdata "); break;
	    case S_LITERAL: fprintf (of, "literal "); break;
	    case S_STACK: fprintf (of, "stack "); break;
	    case S_XSTACK: fprintf (of, "xstack "); break;
	    case S_BIT: fprintf (of, "bit "); break;
	    case S_EEPROM: fprintf (of, "eeprom "); break;
	    default: break;
	    }

	  if (SPEC_VOLATILE (type))
	    fprintf (of, "volatile ");
	  if (SPEC_USIGN (type))
	    fprintf (of, "unsigned ");
	  if (SPEC_CONST (type))
	    fprintf (of, "const ");

	  switch (SPEC_NOUN (type))
	    {
	    case V_INT:
	      if (IS_LONG (type))
		fprintf (of, "long ");
	      fprintf (of, "int");
	      break;

	    case V_CHAR:
	      fprintf (of, "char");
	      break;

	    case V_VOID:
	      fprintf (of, "void");
	      break;

	    case V_FLOAT:
	      fprintf (of, "float");
	      break;

	    case V_STRUCT:
	      fprintf (of, "struct %s", SPEC_STRUCT (type)->tag);
	      break;

	    case V_SBIT:
	      fprintf (of, "sbit");
	      break;

	    case V_BIT:
	      fprintf (of, "bit {%d,%d}", SPEC_BSTR (type), SPEC_BLEN (type));
	      break;

	    case V_DOUBLE:
	      fprintf (of, "double");
	      break;

	    default:
	      fprintf (of, "unknown type");
	      break;
	    }
	}
	/* search entry in list before "type" */
    for (search = start; search && search->next != type;)
       search = search->next;
    type = search;
    if (type)
      fputc (' ', of);
    }
  if (nlr)
    fprintf (of, "\n");
}

/*-----------------------------------------------------------------*/
/* cdbTypeInfo - print the type information for debugger           */
/*-----------------------------------------------------------------*/
void
cdbTypeInfo (sym_link * type, FILE * of)
{
  fprintf (of, "{%d}", getSize (type));
  while (type)
    {
      if (IS_DECL (type))
	{
	  switch (DCL_TYPE (type))
	    {
	    case FUNCTION:
	      fprintf (of, "DF,");
	      break;
	    case GPOINTER:
	      fprintf (of, "DG,");
	      break;
	    case CPOINTER:
	      fprintf (of, "DC,");
	      break;
	    case FPOINTER:
	      fprintf (of, "DX,");
	      break;
	    case POINTER:
	      fprintf (of, "DD,");
	      break;
	    case IPOINTER:
	      fprintf (of, "DI,");
	      break;
	    case PPOINTER:
	      fprintf (of, "DP,");
	      break;
	    case EEPPOINTER:
	      fprintf (of, "DA,");
	      break;
	    case ARRAY:
	      fprintf (of, "DA%d,", DCL_ELEM (type));
	      break;
	    default:
	      break;
	    }
	}
      else
	{
	  switch (SPEC_NOUN (type))
	    {
	    case V_INT:
	      if (IS_LONG (type))
		fprintf (of, "SL");
	      else
		fprintf (of, "SI");
	      break;

	    case V_CHAR:
	      fprintf (of, "SC");
	      break;

	    case V_VOID:
	      fprintf (of, "SV");
	      break;

	    case V_FLOAT:
	      fprintf (of, "SF");
	      break;

	    case V_STRUCT:
	      fprintf (of, "ST%s", SPEC_STRUCT (type)->tag);
	      break;

	    case V_SBIT:
	      fprintf (of, "SX");
	      break;

	    case V_BIT:
	      fprintf (of, "SB%d$%d", SPEC_BSTR (type), SPEC_BLEN (type));
	      break;

	    default:
	      break;
	    }
	  fputs (":", of);
	  if (SPEC_USIGN (type))
	    fputs ("U", of);
	  else
	    fputs ("S", of);
	}
      type = type->next;
    }
}
/*-----------------------------------------------------------------*/
/* cdbSymbol - prints a symbol & its type information for debugger */
/*-----------------------------------------------------------------*/
void 
cdbSymbol (symbol * sym, FILE * of, int isStructSym, int isFunc)
{
  memmap *map;

  if (!sym)
    return;
  if (!of)
    of = stdout;

  if (isFunc)
    fprintf (of, "F:");
  else
    fprintf (of, "S:");		/* symbol record */
  /* if this is not a structure symbol then
     we need to figure out the scope information */
  if (!isStructSym)
    {
      if (!sym->level)
	{
	  /* global */
	  if (IS_STATIC (sym->etype))
	    fprintf (of, "F%s$", moduleName);	/* scope is file */
	  else
	    fprintf (of, "G$");	/* scope is global */
	}
      else
	/* symbol is local */
	fprintf (of, "L%s$", (sym->localof ? sym->localof->name : "-null-"));
    }
  else
    fprintf (of, "S$");		/* scope is structure */

  /* print the name, & mangled name */
  fprintf (of, "%s$%d$%d(", sym->name,
	   sym->level, sym->block);

  cdbTypeInfo (sym->type, of);
  fprintf (of, "),");

  /* print the address space */
  map = SPEC_OCLS (sym->etype);
  fprintf (of, "%c,%d,%d",
	   (map ? map->dbName : 'Z'), sym->onStack, SPEC_STAK (sym->etype));

  /* if assigned to registers then output register names */
  /* if this is a function then print
     if is it an interrupt routine & interrupt number
     and the register bank it is using */
  if (isFunc)
    fprintf (of, ",%d,%d,%d", FUNC_ISISR (sym->type),
	     FUNC_INTNO (sym->type), FUNC_REGBANK (sym->type));
  /* alternate location to find this symbol @ : eg registers
     or spillication */

  if (!isStructSym)
    fprintf (of, "\n");
}

/*-----------------------------------------------------------------*/
/* cdbStruct - print a structure for debugger                      */
/*-----------------------------------------------------------------*/
void 
cdbStruct (structdef * sdef, int block, FILE * of,
	   int inStruct, char *tag)
{
  symbol *sym;

  fprintf (of, "T:");
  /* if block # then must have function scope */
  fprintf (of, "F%s$", moduleName);
  fprintf (of, "%s[", (tag ? tag : sdef->tag));
  for (sym = sdef->fields; sym; sym = sym->next)
    {
      fprintf (of, "({%d}", sym->offset);
      cdbSymbol (sym, of, TRUE, FALSE);
      fprintf (of, ")");
    }
  fprintf (of, "]");
  if (!inStruct)
    fprintf (of, "\n");
}

/*------------------------------------------------------------------*/
/* cdbStructBlock - calls struct printing for a blcks               */
/*------------------------------------------------------------------*/
void 
cdbStructBlock (int block, FILE * of)
{
  int i;
  bucket **table = StructTab;
  bucket *chain;
  wassert (of);

  /* go thru the entire  table  */
  for (i = 0; i < 256; i++)
    {
      for (chain = table[i]; chain; chain = chain->next)
	{
	  if (chain->block >= block)
	    {
	      cdbStruct ((structdef *) chain->sym, chain->block, of, 0, NULL);
	    }
	}
    }
}

/*-----------------------------------------------------------------*/
/* powof2 - returns power of two for the number if number is pow 2 */
/*-----------------------------------------------------------------*/
int 
powof2 (unsigned long num)
{
  int nshifts = 0;
  int n1s = 0;

  while (num)
    {
      if (num & 1)
	n1s++;
      num >>= 1;
      nshifts++;
    }

  if (n1s > 1 || nshifts == 0)
    return 0;
  return nshifts - 1;
}

symbol *__fsadd;
symbol *__fssub;
symbol *__fsmul;
symbol *__fsdiv;
symbol *__fseq;
symbol *__fsneq;
symbol *__fslt;
symbol *__fslteq;
symbol *__fsgt;
symbol *__fsgteq;

/* Dims: mul/div/mod, BYTE/WORD/DWORD, SIGNED/UNSIGNED */
symbol *__muldiv[3][3][2];
/* Dims: BYTE/WORD/DWORD SIGNED/UNSIGNED */
sym_link *__multypes[3][2];
/* Dims: to/from float, BYTE/WORD/DWORD, SIGNED/USIGNED */
symbol *__conv[2][3][2];
/* Dims: shift left/shift right, BYTE/WORD/DWORD, SIGNED/UNSIGNED */
symbol *__rlrr[2][3][2];

sym_link *floatType;

static char *
_mangleFunctionName(char *in)
{
  if (port->getMangledFunctionName) 
    {
      return port->getMangledFunctionName(in);
    }
  else
    {
      return in;
    }
}

/*-----------------------------------------------------------------*/
/* initCSupport - create functions for C support routines          */
/*-----------------------------------------------------------------*/
void 
initCSupport ()
{
  const char *smuldivmod[] =
  {
    "mul", "div", "mod"
  };
  const char *sbwd[] =
  {
    "char", "int", "long"
  };
  const char *ssu[] =
  {
    "s", "u"
  };
  const char *srlrr[] =
  {
    "rl", "rr"
  };

  int bwd, su, muldivmod, tofrom, rlrr;

  if (getenv("SDCC_NO_C_SUPPORT")) {
    /* for debugging only */
    return;
  }

  floatType = newFloatLink ();

  for (bwd = 0; bwd < 3; bwd++)
    {
      sym_link *l;
      switch (bwd)
	{
	case 0:
	  l = newCharLink ();
	  break;
	case 1:
	  l = newIntLink ();
	  break;
	case 2:
	  l = newLongLink ();
	  break;
	default:
	  assert (0);
	}
      __multypes[bwd][0] = l;
      __multypes[bwd][1] = copyLinkChain (l);
      SPEC_USIGN (__multypes[bwd][1]) = 1;
    }

  __fsadd = funcOfType ("__fsadd", floatType, floatType, 2, options.float_rent);
  __fssub = funcOfType ("__fssub", floatType, floatType, 2, options.float_rent);
  __fsmul = funcOfType ("__fsmul", floatType, floatType, 2, options.float_rent);
  __fsdiv = funcOfType ("__fsdiv", floatType, floatType, 2, options.float_rent);
  __fseq = funcOfType ("__fseq", CHARTYPE, floatType, 2, options.float_rent);
  __fsneq = funcOfType ("__fsneq", CHARTYPE, floatType, 2, options.float_rent);
  __fslt = funcOfType ("__fslt", CHARTYPE, floatType, 2, options.float_rent);
  __fslteq = funcOfType ("__fslteq", CHARTYPE, floatType, 2, options.float_rent);
  __fsgt = funcOfType ("__fsgt", CHARTYPE, floatType, 2, options.float_rent);
  __fsgteq = funcOfType ("__fsgteq", CHARTYPE, floatType, 2, options.float_rent);

  for (tofrom = 0; tofrom < 2; tofrom++)
    {
      for (bwd = 0; bwd < 3; bwd++)
	{
	  for (su = 0; su < 2; su++)
	    {
	      if (tofrom)
		{
		  sprintf (buffer, "__fs2%s%s", ssu[su], sbwd[bwd]);
		  __conv[tofrom][bwd][su] = funcOfType (_mangleFunctionName(buffer), __multypes[bwd][su], floatType, 1, options.float_rent);
		}
	      else
		{
		  sprintf (buffer, "__%s%s2fs", ssu[su], sbwd[bwd]);
		  __conv[tofrom][bwd][su] = funcOfType (_mangleFunctionName(buffer), floatType, __multypes[bwd][su], 1, options.float_rent);
		}
	    }
	}
    }

  for (muldivmod = 0; muldivmod < 3; muldivmod++)
    {
      for (bwd = 0; bwd < 3; bwd++)
	{
	  for (su = 0; su < 2; su++)
	    {
	      sprintf (buffer, "_%s%s%s",
		       smuldivmod[muldivmod],
		       ssu[su],
		       sbwd[bwd]);
              __muldiv[muldivmod][bwd][su] = funcOfType (_mangleFunctionName(buffer), __multypes[bwd][su], __multypes[bwd][su], 2, options.intlong_rent);
	      FUNC_NONBANKED (__muldiv[muldivmod][bwd][su]->type) = 1;
	    }
	}
    }

  for (rlrr = 0; rlrr < 2; rlrr++)
    {
      for (bwd = 0; bwd < 3; bwd++)
	{
	  for (su = 0; su < 2; su++)
	    {
	      sprintf (buffer, "_%s%s%s",
		       srlrr[rlrr],
		       ssu[su],
		       sbwd[bwd]);
              __rlrr[rlrr][bwd][su] = funcOfType (_mangleFunctionName(buffer), __multypes[bwd][su], __multypes[0][0], 2, options.intlong_rent);
	      FUNC_NONBANKED (__rlrr[rlrr][bwd][su]->type) = 1;
	    }
	}
    }
}

/*-------------------------------------------------------------------------

  SDCCglue.c - glues everything we have done together into one file.
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
#include "asm.h"
#include <time.h>
#include "newalloc.h"

#if !defined(__BORLANDC__) && !defined(_MSC_VER)
#include <unistd.h>
#endif

symbol *interrupts[256];

void printIval (symbol *, sym_link *, initList *, FILE *);
set *publics = NULL;		/* public variables */
set *externs = NULL;		/* Varibles that are declared as extern */

/* TODO: this should be configurable (DS803C90 uses more than 6) */
unsigned maxInterrupts = 6;
int allocInfo = 1;
symbol *mainf;
extern char *VersionString;
set *tmpfileSet = NULL;		/* set of tmp file created by the compiler */
set *tmpfileNameSet = NULL;	/* All are unlinked at close. */

/*-----------------------------------------------------------------*/
/* closeTmpFiles - closes all tmp files created by the compiler    */
/*                 because of BRAIN DEAD MS/DOS & CYGNUS Libraries */
/*-----------------------------------------------------------------*/
DEFSETFUNC (closeTmpFiles)
{
  FILE *tfile = item;

  if (tfile)
    fclose (tfile);

  return 0;
}

/*-----------------------------------------------------------------*/
/* rmTmpFiles - closes all tmp files created by the compiler    */
/*                 because of BRAIN DEAD MS/DOS & CYGNUS Libraries */
/*-----------------------------------------------------------------*/
DEFSETFUNC (rmTmpFiles)
{
  char *name = item;

  if (name)
    {
      unlink (name);
      Safe_free (name);
    }
  return 0;
}

/*-----------------------------------------------------------------*/
/* copyFile - copies source file to destination file               */
/*-----------------------------------------------------------------*/
void 
copyFile (FILE * dest, FILE * src)
{
  int ch;

  rewind (src);
  while (!feof (src))
    if ((ch = fgetc (src)) != EOF)
      fputc (ch, dest);
}

char *
aopLiteralLong (value * val, int offset, int size)
{
	char *rs;
	union {
		float f;
		unsigned char c[4];
	}
	fl;

	if (!val) {
	  // assuming we have been warned before
	  val=constVal("0");
	}

	/* if it is a float then it gets tricky */
	/* otherwise it is fairly simple */
	if (!IS_FLOAT (val->type)) {
		unsigned long v = (unsigned long) floatFromVal (val);

		v >>= (offset * 8);
		switch (size) {
		case 1:
			tsprintf (buffer, "!immedbyte", (unsigned int) v & 0xff);
			break;
		case 2:
			tsprintf (buffer, "!immedword", (unsigned int) v & 0xffff);
			break;
		default:
			/* Hmm.  Too big for now. */
			assert (0);
		}
		rs = Safe_calloc (1, strlen (buffer) + 1);
		return strcpy (rs, buffer);
	}

	/* PENDING: For now size must be 1 */
	assert (size == 1);

	/* it is type float */
	fl.f = (float) floatFromVal (val);
#ifdef _BIG_ENDIAN
	tsprintf (buffer, "!immedbyte", fl.c[3 - offset]);
#else
	tsprintf (buffer, "!immedbyte", fl.c[offset]);
#endif
	rs = Safe_calloc (1, strlen (buffer) + 1);
	return strcpy (rs, buffer);
}

/*-----------------------------------------------------------------*/
/* aopLiteral - string from a literal value                        */
/*-----------------------------------------------------------------*/
char *
aopLiteral (value * val, int offset)
{
	return aopLiteralLong (val, offset, 1);
}

/*-----------------------------------------------------------------*/
/* emitRegularMap - emit code for maps with no special cases       */
/*-----------------------------------------------------------------*/
static void 
emitRegularMap (memmap * map, bool addPublics, bool arFlag)
{
  symbol *sym, *symIval;
  ast *ival = NULL;
  memmap *segment;

  if (addPublics)
    {
      /* PENDING: special case here - should remove */
      if (!strcmp (map->sname, CODE_NAME))
	tfprintf (map->oFile, "\t!areacode\n", map->sname);
      else if (!strcmp (map->sname, DATA_NAME))
	tfprintf (map->oFile, "\t!areadata\n", map->sname);
      else if (!strcmp (map->sname, HOME_NAME))
	tfprintf (map->oFile, "\t!areahome\n", map->sname);
      else
	tfprintf (map->oFile, "\t!area\n", map->sname);
    }

  /* print the area name */
  for (sym = setFirstItem (map->syms); sym;
       sym = setNextItem (map->syms))
    {

      /* if extern then add it into the extern list */
      if (IS_EXTERN (sym->etype))
	{
	  addSetHead (&externs, sym);
	  continue;
	}

      /* if allocation required check is needed
         then check if the symbol really requires
         allocation only for local variables */

      if (arFlag && !IS_AGGREGATE (sym->type) &&
	  !(sym->_isparm && !IS_REGPARM (sym->etype)) &&
	  !sym->allocreq && sym->level)
	continue;

      /* for bitvar locals and parameters */
      if (!arFlag && !sym->allocreq && sym->level 
	  && !SPEC_ABSA (sym->etype)) {
	continue;
      }

      /* if global variable & not static or extern
         and addPublics allowed then add it to the public set */
      if ((sym->level == 0 ||
	   (sym->_isparm && !IS_REGPARM (sym->etype))) &&
	  addPublics &&
	  !IS_STATIC (sym->etype) &&
          (IS_FUNC(sym->type) ? (sym->used || IFFUNC_HASBODY(sym->type)) : 1))
	{
	  addSetHead (&publics, sym);
	}

      /* if extern then do nothing or is a function
         then do nothing */
      if (IS_FUNC (sym->type))
	continue;

      /* print extra debug info if required */
      if (options.debug) {
	cdbSymbol (sym, cdbFile, FALSE, FALSE);
	if (!sym->level) /* global */
	  if (IS_STATIC (sym->etype))
	    fprintf (map->oFile, "F%s$", moduleName); /* scope is file */
	  else
	    fprintf (map->oFile, "G$");	/* scope is global */
	else
	  /* symbol is local */
	  fprintf (map->oFile, "L%s$", (sym->localof ? sym->localof->name : "-null-"));
	fprintf (map->oFile, "%s$%d$%d", sym->name, sym->level, sym->block);
      }
      
      /* if is has an absolute address then generate
         an equate for this no need to allocate space */
      if (SPEC_ABSA (sym->etype))
	{
	  if (options.debug) {
	    fprintf (map->oFile, " == 0x%04x\n", SPEC_ADDR (sym->etype));
	  }
	  fprintf (map->oFile, "%s\t=\t0x%04x\n",
		   sym->rname,
		   SPEC_ADDR (sym->etype));
	}
      else
	{
	  /* allocate space */
	  if (options.debug) {
	    fprintf (map->oFile, "==.\n");
	  }
	  if (IS_STATIC (sym->etype))
	    tfprintf (map->oFile, "!slabeldef\n", sym->rname);
	  else
	    tfprintf (map->oFile, "!labeldef\n", sym->rname);
	  tfprintf (map->oFile, "\t!ds\n", 
		    (unsigned int) getSize (sym->type) & 0xffff);
	}

      /* if it has an initial value then do it only if
         it is a global variable */
      if (sym->ival && sym->level == 0)
	{
	  if (IS_AGGREGATE (sym->type)) {
	    ival = initAggregates (sym, sym->ival, NULL);
	  } else {
	    ival = newNode ('=', newAst_VALUE (symbolVal (sym)),
		     decorateType (resolveSymbols (list2expr (sym->ival))));
	  }
	  codeOutFile = statsg->oFile;
	  allocInfo = 0;

	  // set ival's lineno to where the symbol was defined
	  if (ival) ival->lineno=sym->lineDef;
	  eBBlockFromiCode (iCodeFromAst (ival));
	  allocInfo = 1;

	  /* if the ival is a symbol assigned to an aggregate,
	     (bug #458099 -> #462479)
	     we don't need it anymore, so delete it from its segment */
	  if (sym->ival->type == INIT_NODE &&
	      IS_AST_SYM_VALUE(sym->ival->init.node) &&
	      IS_AGGREGATE (sym->type) ) {
	    symIval=AST_SYMBOL(sym->ival->init.node);
	    segment = SPEC_OCLS (symIval->etype);
	    deleteSetItem (&segment->syms, symIval);
	  }

	  sym->ival = NULL;
	}
    }
}

/*-----------------------------------------------------------------*/
/* initPointer - pointer initialization code massaging             */
/*-----------------------------------------------------------------*/
value *
initPointer (initList * ilist)
{
	value *val;
	ast *expr = list2expr (ilist);
	
	if (!expr)
		goto wrong;
	
	/* try it the oldway first */
	if ((val = constExprValue (expr, FALSE)))
		return val;
	
	/* no then we have to do these cludgy checks */
	/* pointers can be initialized with address of
	   a variable or address of an array element */
	if (IS_AST_OP (expr) && expr->opval.op == '&') {
		/* address of symbol */
		if (IS_AST_SYM_VALUE (expr->left)) {
			val = copyValue (AST_VALUE (expr->left));
			val->type = newLink ();
			if (SPEC_SCLS (expr->left->etype) == S_CODE) {
				DCL_TYPE (val->type) = CPOINTER;
				DCL_PTR_CONST (val->type) = port->mem.code_ro;
			}
			else if (SPEC_SCLS (expr->left->etype) == S_XDATA)
				DCL_TYPE (val->type) = FPOINTER;
			else if (SPEC_SCLS (expr->left->etype) == S_XSTACK)
				DCL_TYPE (val->type) = PPOINTER;
			else if (SPEC_SCLS (expr->left->etype) == S_IDATA)
				DCL_TYPE (val->type) = IPOINTER;
			else if (SPEC_SCLS (expr->left->etype) == S_EEPROM)
				DCL_TYPE (val->type) = EEPPOINTER;
			else
				DCL_TYPE (val->type) = POINTER;
			val->type->next = expr->left->ftype;
			val->etype = getSpec (val->type);
			return val;
		}

		/* if address of indexed array */
		if (IS_AST_OP (expr->left) && expr->left->opval.op == '[')
			return valForArray (expr->left);

		/* if address of structure element then
		   case 1. a.b ; */
		if (IS_AST_OP (expr->left) &&
		    expr->left->opval.op == '.') {
			return valForStructElem (expr->left->left,
						 expr->left->right);
		}

		/* case 2. (&a)->b ;
		   (&some_struct)->element */
		if (IS_AST_OP (expr->left) &&
		    expr->left->opval.op == PTR_OP &&
		    IS_ADDRESS_OF_OP (expr->left->left))
			return valForStructElem (expr->left->left->left,
						 expr->left->right);

	}
	/* case 3. (((char *) &a) +/- constant) */
	if (IS_AST_OP (expr) &&
	    (expr->opval.op == '+' || expr->opval.op == '-') &&
	    IS_AST_OP (expr->left) && expr->left->opval.op == CAST &&
	    IS_AST_OP (expr->left->right) &&
	    expr->left->right->opval.op == '&' &&
	    IS_AST_LIT_VALUE (expr->right)) {

		return valForCastAggr (expr->left->right->left,
				       expr->left->left->opval.lnk,
				       expr->right, expr->opval.op);

	}
	
	/* case 4. (char *)(array type) */
	if (IS_CAST_OP(expr) && IS_AST_SYM_VALUE (expr->right) &&
	    IS_ARRAY(expr->right->ftype)) {

		val = copyValue (AST_VALUE (expr->right));
		val->type = newLink ();
		if (SPEC_SCLS (expr->right->etype) == S_CODE) {
			DCL_TYPE (val->type) = CPOINTER;
			DCL_PTR_CONST (val->type) = port->mem.code_ro;
		}
		else if (SPEC_SCLS (expr->right->etype) == S_XDATA)
			DCL_TYPE (val->type) = FPOINTER;
		else if (SPEC_SCLS (expr->right->etype) == S_XSTACK)
			DCL_TYPE (val->type) = PPOINTER;
		else if (SPEC_SCLS (expr->right->etype) == S_IDATA)
			DCL_TYPE (val->type) = IPOINTER;
		else if (SPEC_SCLS (expr->right->etype) == S_EEPROM)
			DCL_TYPE (val->type) = EEPPOINTER;
		else
			DCL_TYPE (val->type) = POINTER;
		val->type->next = expr->right->ftype->next;
		val->etype = getSpec (val->type);
		return val;
	}
 wrong:
	werror (W_INIT_WRONG);
	return NULL;

}

/*-----------------------------------------------------------------*/
/* printChar - formats and prints a characater string with DB      */
/*-----------------------------------------------------------------*/
void 
printChar (FILE * ofile, char *s, int plen)
{
  int i;
  int len = strlen (s);
  int pplen = 0;
  char buf[100];
  char *p = buf;

  while (len && pplen < plen)
    {
      i = 60;
      while (i && *s && pplen < plen)
	{
	  if (*s < ' ' || *s == '\"' || *s=='\\')
	    {
	      *p = '\0';
	      if (p != buf)
		tfprintf (ofile, "\t!ascii\n", buf);
	      tfprintf (ofile, "\t!db !constbyte\n", (unsigned char)*s);
	      p = buf;
	    }
	  else
	    {
	      *p = *s;
	      p++;
	    }
	  s++;
	  pplen++;
	  i--;
	}
      if (p != buf)
	{
	  *p = '\0';
	  tfprintf (ofile, "\t!ascii\n", buf);
	  p = buf;
	}

      if (len > 60)
	len -= 60;
      else
	len = 0;
    }
  tfprintf (ofile, "\t!db !constbyte\n", 0);
}

/*-----------------------------------------------------------------*/
/* return the generic pointer high byte for a given pointer type.  */
/*-----------------------------------------------------------------*/
int 
pointerTypeToGPByte (const int p_type, const char *iname, const char *oname)
{
  switch (p_type)
    {
    case IPOINTER:
    case POINTER:
      return 0;
    case GPOINTER:
      /* hack - if we get a generic pointer, we just assume
       * it's an FPOINTER (i.e. in XDATA space).
       */
      werror (E_CANNOT_USE_GENERIC_POINTER, iname, oname);
      exit (1);
      // fall through
    case FPOINTER:
      return 1;
    case CPOINTER:
      return 2;
    case PPOINTER:
      return 3;
    default:
      fprintf (stderr, "*** internal error: unknown pointer type %d in GPByte.\n",
	       p_type);
      break;
    }
  return -1;
}


/*-----------------------------------------------------------------*/
/* printPointerType - generates ival for pointer type              */
/*-----------------------------------------------------------------*/
void 
_printPointerType (FILE * oFile, const char *name)
{
  /* if (TARGET_IS_DS390) */
  if (options.model == MODEL_FLAT24)
    {
      fprintf (oFile, "\t.byte %s,(%s >> 8),(%s >> 16)", name, name, name);
    }
  else
    {
      fprintf (oFile, "\t.byte %s,(%s >> 8)", name, name);
    }
}

/*-----------------------------------------------------------------*/
/* printPointerType - generates ival for pointer type              */
/*-----------------------------------------------------------------*/
void 
printPointerType (FILE * oFile, const char *name)
{
  _printPointerType (oFile, name);
  fprintf (oFile, "\n");
}

/*-----------------------------------------------------------------*/
/* printGPointerType - generates ival for generic pointer type     */
/*-----------------------------------------------------------------*/
void 
printGPointerType (FILE * oFile, const char *iname, const char *oname,
		   const unsigned int type)
{
  _printPointerType (oFile, iname);
  fprintf (oFile, ",#0x%02x\n", pointerTypeToGPByte (type, iname, oname));
}

/*-----------------------------------------------------------------*/
/* printIvalType - generates ival for int/char                     */
/*-----------------------------------------------------------------*/
void 
printIvalType (sym_link * type, initList * ilist, FILE * oFile)
{
	value *val;

	/* if initList is deep */
	if (ilist->type == INIT_DEEP)
		ilist = ilist->init.deep;

	val = list2val (ilist);
	switch (getSize (type)) {
	case 1:
		if (!val)
			tfprintf (oFile, "\t!db !constbyte\n", 0);
		else
			tfprintf (oFile, "\t!dbs\n",
				  aopLiteral (val, 0));
		break;

	case 2:
		if (port->use_dw_for_init)
			tfprintf (oFile, "\t!dws\n", aopLiteralLong (val, 0, 2));
		else
			fprintf (oFile, "\t.byte %s,%s\n", aopLiteral (val, 0), aopLiteral (val, 1));
		break;
	case 4:
		if (!val) {
			tfprintf (oFile, "\t!dw !constword\n", 0);
			tfprintf (oFile, "\t!dw !constword\n", 0);
		}
		else {
			fprintf (oFile, "\t.byte %s,%s,%s,%s\n",
				 aopLiteral (val, 0), aopLiteral (val, 1),
				 aopLiteral (val, 2), aopLiteral (val, 3));
		}
		break;
	}
}

/*-----------------------------------------------------------------*/
/* printIvalBitFields - generate initializer for bitfields         */
/*-----------------------------------------------------------------*/
void printIvalBitFields(symbol **sym, initList **ilist, FILE * oFile)
{
	value *val ;
	symbol *lsym = *sym;
	initList *lilist = *ilist ;
	unsigned long ival = 0;
	int size =0;

	
	do {
		unsigned long i;
		val = list2val(lilist);
		if (size) {
			if (SPEC_BLEN(lsym->etype) > 8) {
				size += ((SPEC_BLEN (lsym->etype) / 8) + 
					 (SPEC_BLEN (lsym->etype) % 8 ? 1 : 0));
			}
		} else {
			size = ((SPEC_BLEN (lsym->etype) / 8) + 
				 (SPEC_BLEN (lsym->etype) % 8 ? 1 : 0));
		}
		i = (unsigned long)floatFromVal(val);
		i <<= SPEC_BSTR (lsym->etype);
		ival |= i;
		if (! ( lsym->next &&
			(IS_BITFIELD(lsym->next->type)) &&
			(SPEC_BSTR(lsym->next->etype)))) break;
		lsym = lsym->next;
		lilist = lilist->next;
	} while (1);
	switch (size) {
	case 1:
		tfprintf (oFile, "\t!db !constbyte\n",ival);
		break;

	case 2:
		tfprintf (oFile, "\t!dw !constword\n",ival);
		break;
	case 4:
		tfprintf (oFile, "\t!db  !constword,!constword\n",
			 (ival >> 8) & 0xffff, (ival & 0xffff));
		break;
	}
	*sym = lsym;
	*ilist = lilist;
}

/*-----------------------------------------------------------------*/
/* printIvalStruct - generates initial value for structures        */
/*-----------------------------------------------------------------*/
void 
printIvalStruct (symbol * sym, sym_link * type,
		 initList * ilist, FILE * oFile)
{
	symbol *sflds;
	initList *iloop;

	sflds = SPEC_STRUCT (type)->fields;
	if (ilist->type != INIT_DEEP) {
		werror (E_INIT_STRUCT, sym->name);
		return;
	}

	iloop = ilist->init.deep;

	for (; sflds; sflds = sflds->next, iloop = (iloop ? iloop->next : NULL)) {
		if (IS_BITFIELD(sflds->type)) {
			printIvalBitFields(&sflds,&iloop,oFile);
		} else {
			printIval (sflds, sflds->type, iloop, oFile);
		}
	}
	return;
}

/*-----------------------------------------------------------------*/
/* printIvalChar - generates initital value for character array    */
/*-----------------------------------------------------------------*/
int 
printIvalChar (sym_link * type, initList * ilist, FILE * oFile, char *s)
{
  value *val;
  int remain;

  if (!s)
    {

      val = list2val (ilist);
      /* if the value is a character string  */
      if (IS_ARRAY (val->type) && IS_CHAR (val->etype))
	{
	  if (!DCL_ELEM (type))
	    DCL_ELEM (type) = strlen (SPEC_CVAL (val->etype).v_char) + 1;

	  printChar (oFile, SPEC_CVAL (val->etype).v_char, DCL_ELEM (type));

	  if ((remain = (DCL_ELEM (type) - strlen (SPEC_CVAL (val->etype).v_char) - 1)) > 0)
	    while (remain--)
	      tfprintf (oFile, "\t!db !constbyte\n", 0);

	  return 1;
	}
      else
	return 0;
    }
  else
    printChar (oFile, s, strlen (s) + 1);
  return 1;
}

/*-----------------------------------------------------------------*/
/* printIvalArray - generates code for array initialization        */
/*-----------------------------------------------------------------*/
void 
printIvalArray (symbol * sym, sym_link * type, initList * ilist,
		FILE * oFile)
{
  initList *iloop;
  int lcnt = 0, size = 0;

  /* take care of the special   case  */
  /* array of characters can be init  */
  /* by a string                      */
  if (IS_CHAR (type->next))
    if (printIvalChar (type,
		       (ilist->type == INIT_DEEP ? ilist->init.deep : ilist),
		       oFile, SPEC_CVAL (sym->etype).v_char))
      return;

  /* not the special case             */
  if (ilist->type != INIT_DEEP)
    {
      werror (E_INIT_STRUCT, sym->name);
      return;
    }

  iloop = ilist->init.deep;
  lcnt = DCL_ELEM (type);

  for (;;)
    {
      size++;
      printIval (sym, type->next, iloop, oFile);
      iloop = (iloop ? iloop->next : NULL);


      /* if not array limits given & we */
      /* are out of initialisers then   */
      if (!DCL_ELEM (type) && !iloop)
	break;

      /* no of elements given and we    */
      /* have generated for all of them */
      if (!--lcnt) {
	/* if initializers left */
	if (iloop) {
	  werror (W_EXESS_ARRAY_INITIALIZERS, sym->name, sym->lineDef);
	}
	break;
      }
    }

  /* if we have not been given a size  */
  if (!DCL_ELEM (type))
    DCL_ELEM (type) = size;

  return;
}

/*-----------------------------------------------------------------*/
/* printIvalFuncPtr - generate initial value for function pointers */
/*-----------------------------------------------------------------*/
void 
printIvalFuncPtr (sym_link * type, initList * ilist, FILE * oFile)
{
  value *val;
  int dLvl = 0;

  val = list2val (ilist);
  /* check the types   */
  if ((dLvl = compareType (val->type, type->next)) <= 0)
    {
      tfprintf (oFile, "\t!dw !constword\n", 0);
      return;
    }

  /* now generate the name */
  if (!val->sym)
    {
      if (port->use_dw_for_init)
	{
	  tfprintf (oFile, "\t!dws\n", val->name);
	}
      else
	{
	  printPointerType (oFile, val->name);
	}
    }
  else if (port->use_dw_for_init)
    {
      tfprintf (oFile, "\t!dws\n", val->sym->rname);
    }
  else
    {
      printPointerType (oFile, val->sym->rname);
    }

  return;
}

/*-----------------------------------------------------------------*/
/* printIvalCharPtr - generates initial values for character pointers */
/*-----------------------------------------------------------------*/
int 
printIvalCharPtr (symbol * sym, sym_link * type, value * val, FILE * oFile)
{
  int size = 0;

  /* PENDING: this is _very_ mcs51 specific, including a magic
     number...
     It's also endin specific.
   */
  size = getSize (type);

  if (val->name && strlen (val->name))
    {
      if (size == 1)		/* This appears to be Z80 specific?? */
	{
	  tfprintf (oFile,
		    "\t!dbs\n", val->name);
	}
      else if (size == FPTRSIZE)
	{
	  if (port->use_dw_for_init)
	    {
	      tfprintf (oFile, "\t!dws\n", val->name);
	    }
	  else
	    {
	      printPointerType (oFile, val->name);
	    }
	}
      else if (size == GPTRSIZE)
	{
	  int type;
	  if (IS_PTR (val->type)) {
	    type = DCL_TYPE (val->type);
	  } else {
	    type = PTR_TYPE (SPEC_OCLS (val->etype));
	  }
	  if (val->sym && val->sym->isstrlit) {
	    // this is a literal string
	    type=CPOINTER;
	  }
	  printGPointerType (oFile, val->name, sym->name, type);
	}
      else
	{
	  fprintf (stderr, "*** internal error: unknown size in "
		   "printIvalCharPtr.\n");
	}
    }
  else
    {
      /* What is this case? Are these pointers? */
      switch (size)
	{
	case 1:
	  tfprintf (oFile, "\t!dbs\n", aopLiteral (val, 0));
	  break;
	case 2:
	  if (port->use_dw_for_init)
	    tfprintf (oFile, "\t!dws\n", aopLiteralLong (val, 0, size));
	  else
	    tfprintf (oFile, "\t.byte %s,%s\n",
		      aopLiteral (val, 0), aopLiteral (val, 1));
	  break;
	case 3:
	  /* PENDING: 0x02 or 0x%02x, CDATA? */
	  fprintf (oFile, "\t.byte %s,%s,#0x02\n",
		   aopLiteral (val, 0), aopLiteral (val, 1));
	  break;
	default:
	  assert (0);
	}
    }

  if (val->sym && val->sym->isstrlit && !isinSet(statsg->syms, val->sym)) {
    addSet (&statsg->syms, val->sym);
  }

  return 1;
}

/*-----------------------------------------------------------------*/
/* printIvalPtr - generates initial value for pointers             */
/*-----------------------------------------------------------------*/
void 
printIvalPtr (symbol * sym, sym_link * type, initList * ilist, FILE * oFile)
{
  value *val;
  int size;

  /* if deep then   */
  if (ilist->type == INIT_DEEP)
    ilist = ilist->init.deep;

  /* function pointer     */
  if (IS_FUNC (type->next))
    {
      printIvalFuncPtr (type, ilist, oFile);
      return;
    }

  if (!(val = initPointer (ilist)))
    return;

  /* if character pointer */
  if (IS_CHAR (type->next))
    if (printIvalCharPtr (sym, type, val, oFile))
      return;

  /* check the type      */
  if (compareType (type, val->type) == 0)
    werror (W_INIT_WRONG);

  /* if val is literal */
  if (IS_LITERAL (val->etype))
    {
      switch (getSize (type))
	{
	case 1:
	  tfprintf (oFile, "\t!db !constbyte\n", (unsigned int) floatFromVal (val) & 0xff);
	  break;
	case 2:
	  if (port->use_dw_for_init)
	    tfprintf (oFile, "\t!dws\n", aopLiteralLong (val, 0, 2));
	  else
	    tfprintf (oFile, "\t.byte %s,%s\n", aopLiteral (val, 0), aopLiteral (val, 1));
	  break;
	case 3:
	  fprintf (oFile, "\t.byte %s,%s,#0x02\n",
		   aopLiteral (val, 0), aopLiteral (val, 1));
	}
      return;
    }


  size = getSize (type);

  if (size == 1)		/* Z80 specific?? */
    {
      tfprintf (oFile, "\t!dbs\n", val->name);
    }
  else if (size == FPTRSIZE)
    {
      if (port->use_dw_for_init) {
	tfprintf (oFile, "\t!dws\n", val->name);
      } else {
	printPointerType (oFile, val->name);
      }
    }
  else if (size == GPTRSIZE)
    {
      printGPointerType (oFile, val->name, sym->name,
			 (IS_PTR (val->type) ? DCL_TYPE (val->type) :
			  PTR_TYPE (SPEC_OCLS (val->etype))));
    }
  return;
}

/*-----------------------------------------------------------------*/
/* printIval - generates code for initial value                    */
/*-----------------------------------------------------------------*/
void 
printIval (symbol * sym, sym_link * type, initList * ilist, FILE * oFile)
{
  if (!ilist)
    return;

  /* if structure then    */
  if (IS_STRUCT (type))
    {
      printIvalStruct (sym, type, ilist, oFile);
      return;
    }

  /* if this is a pointer */
  if (IS_PTR (type))
    {
      printIvalPtr (sym, type, ilist, oFile);
      return;
    }

  /* if this is an array   */
  if (IS_ARRAY (type))
    {
      printIvalArray (sym, type, ilist, oFile);
      return;
    }

  /* if type is SPECIFIER */
  if (IS_SPEC (type))
    {
      printIvalType (type, ilist, oFile);
      return;
    }
}

/*-----------------------------------------------------------------*/
/* emitStaticSeg - emitcode for the static segment                 */
/*-----------------------------------------------------------------*/
void 
emitStaticSeg (memmap * map, FILE * out)
{
  symbol *sym;

  /*     fprintf(map->oFile,"\t.area\t%s\n",map->sname); */
  if (!out)
    out = code->oFile;

  /* for all variables in this segment do */
  for (sym = setFirstItem (map->syms); sym;
       sym = setNextItem (map->syms))
    {

      /* if it is "extern" then do nothing */
      if (IS_EXTERN (sym->etype))
	continue;

      /* if it is not static add it to the public
         table */
      if (!IS_STATIC (sym->etype))
	addSetHead (&publics, sym);

      /* print extra debug info if required */
      if (options.debug) {
	cdbSymbol (sym, cdbFile, FALSE, FALSE);
	if (!sym->level)
	  {			/* global */
	    if (IS_STATIC (sym->etype))
	      fprintf (out, "F%s$", moduleName);	/* scope is file */
	    else
	      fprintf (out, "G$");	/* scope is global */
	  }
	else
	  /* symbol is local */
	  fprintf (out, "L%s$",
		   (sym->localof ? sym->localof->name : "-null-"));
	fprintf (out, "%s$%d$%d", sym->name, sym->level, sym->block);
      }
      
      /* if it has an absolute address */
      if (SPEC_ABSA (sym->etype))
	{
	  if (options.debug)
	    fprintf (out, " == 0x%04x\n", SPEC_ADDR (sym->etype));
	  
	  fprintf (out, "%s\t=\t0x%04x\n",
		   sym->rname,
		   SPEC_ADDR (sym->etype));
	}
      else
	{
	  if (options.debug)
	    fprintf (out, " == .\n");
	  
	  /* if it has an initial value */
	  if (sym->ival)
	    {
	      fprintf (out, "%s:\n", sym->rname);
	      noAlloc++;
	      resolveIvalSym (sym->ival);
	      printIval (sym, sym->type, sym->ival, out);
	      noAlloc--;
	    }
	  else
	    {
	      /* allocate space */
	      fprintf (out, "%s:\n", sym->rname);
	      /* special case for character strings */
	      if (IS_ARRAY (sym->type) && IS_CHAR (sym->type->next) &&
		  SPEC_CVAL (sym->etype).v_char)
		printChar (out,
			   SPEC_CVAL (sym->etype).v_char,
			   strlen (SPEC_CVAL (sym->etype).v_char) + 1);
	      else
		tfprintf (out, "\t!ds\n", (unsigned int) getSize (sym->type) & 0xffff);
	    }
	}
    }
}

/*-----------------------------------------------------------------*/
/* emitMaps - emits the code for the data portion the code         */
/*-----------------------------------------------------------------*/
void 
emitMaps ()
{
  inInitMode++;
  /* no special considerations for the following
     data, idata & bit & xdata */
  emitRegularMap (data, TRUE, TRUE);
  emitRegularMap (idata, TRUE, TRUE);
  emitRegularMap (bit, TRUE, FALSE);
  emitRegularMap (xdata, TRUE, TRUE);
  emitRegularMap (sfr, FALSE, FALSE);
  emitRegularMap (sfrbit, FALSE, FALSE);
  emitRegularMap (home, TRUE, FALSE);
  emitRegularMap (code, TRUE, FALSE);

  emitStaticSeg (statsg, code->oFile);
  inInitMode--;
}

/*-----------------------------------------------------------------*/
/* flushStatics - flush all currently defined statics out to file  */
/*  and delete.  Temporary function                                */
/*-----------------------------------------------------------------*/
void 
flushStatics (void)
{
  emitStaticSeg (statsg, codeOutFile);
  statsg->syms = NULL;
}

/*-----------------------------------------------------------------*/
/* createInterruptVect - creates the interrupt vector              */
/*-----------------------------------------------------------------*/
void 
createInterruptVect (FILE * vFile)
{
  unsigned i = 0;
  mainf = newSymbol ("main", 0);
  mainf->block = 0;

  /* only if the main function exists */
  if (!(mainf = findSymWithLevel (SymbolTab, mainf)))
    {
      if (!options.cc_only && !noAssemble)
	werror (E_NO_MAIN);
      return;
    }

  /* if the main is only a prototype ie. no body then do nothing */
  if (!IFFUNC_HASBODY(mainf->type))
    {
      /* if ! compile only then main function should be present */
      if (!options.cc_only && !noAssemble)
	werror (E_NO_MAIN);
      return;
    }

  tfprintf (vFile, "\t!areacode\n", CODE_NAME);
  fprintf (vFile, "__interrupt_vect:\n");


  if (!port->genIVT || !(port->genIVT (vFile, interrupts, maxInterrupts)))
    {
      /* "generic" interrupt table header (if port doesn't specify one).

       * Look suspiciously like 8051 code to me...
       */

      fprintf (vFile, "\tljmp\t__sdcc_gsinit_startup\n");


      /* now for the other interrupts */
      for (; i < maxInterrupts; i++)
	{
	  if (interrupts[i])
	    fprintf (vFile, "\tljmp\t%s\n\t.ds\t5\n", interrupts[i]->rname);
	  else
	    fprintf (vFile, "\treti\n\t.ds\t7\n");
	}
    }
}

char *iComments1 =
{
  ";--------------------------------------------------------\n"
  "; File Created by SDCC : FreeWare ANSI-C Compiler\n"};

char *iComments2 =
{
  ";--------------------------------------------------------\n"};


/*-----------------------------------------------------------------*/
/* initialComments - puts in some initial comments                 */
/*-----------------------------------------------------------------*/
void 
initialComments (FILE * afile)
{
  time_t t;
  time (&t);
  fprintf (afile, "%s", iComments1);
  fprintf (afile, "; Version %s %s\n", VersionString, asctime (localtime (&t)));
  fprintf (afile, "%s", iComments2);
}

/*-----------------------------------------------------------------*/
/* printPublics - generates .global for publics                    */
/*-----------------------------------------------------------------*/
void 
printPublics (FILE * afile)
{
  symbol *sym;

  fprintf (afile, "%s", iComments2);
  fprintf (afile, "; Public variables in this module\n");
  fprintf (afile, "%s", iComments2);

  for (sym = setFirstItem (publics); sym;
       sym = setNextItem (publics))
    tfprintf (afile, "\t!global\n", sym->rname);
}

/*-----------------------------------------------------------------*/
/* printExterns - generates .global for externs                    */
/*-----------------------------------------------------------------*/
void 
printExterns (FILE * afile)
{
  symbol *sym;

  fprintf (afile, "%s", iComments2);
  fprintf (afile, "; Externals used\n");
  fprintf (afile, "%s", iComments2);

  for (sym = setFirstItem (externs); sym;
       sym = setNextItem (externs))
    tfprintf (afile, "\t!global\n", sym->rname);
}

/*-----------------------------------------------------------------*/
/* emitOverlay - will emit code for the overlay stuff              */
/*-----------------------------------------------------------------*/
static void 
emitOverlay (FILE * afile)
{
  set *ovrset;

  if (!elementsInSet (ovrSetSets))
    tfprintf (afile, "\t!area\n", port->mem.overlay_name);

  /* for each of the sets in the overlay segment do */
  for (ovrset = setFirstItem (ovrSetSets); ovrset;
       ovrset = setNextItem (ovrSetSets))
    {

      symbol *sym;

      if (elementsInSet (ovrset))
	{
	  /* this dummy area is used to fool the assembler
	     otherwise the assembler will append each of these
	     declarations into one chunk and will not overlay
	     sad but true */
	  fprintf (afile, "\t.area _DUMMY\n");
	  /* output the area informtion */
	  fprintf (afile, "\t.area\t%s\n", port->mem.overlay_name);	/* MOF */
	}

      for (sym = setFirstItem (ovrset); sym;
	   sym = setNextItem (ovrset))
	{

	  /* if extern then add it to the publics tabledo nothing */
	  if (IS_EXTERN (sym->etype))
	    continue;

	  /* if allocation required check is needed
	     then check if the symbol really requires
	     allocation only for local variables */
	  if (!IS_AGGREGATE (sym->type) &&
	      !(sym->_isparm && !IS_REGPARM (sym->etype))
	      && !sym->allocreq && sym->level)
	    continue;

	  /* if global variable & not static or extern
	     and addPublics allowed then add it to the public set */
	  if ((sym->_isparm && !IS_REGPARM (sym->etype))
	      && !IS_STATIC (sym->etype))
	    addSetHead (&publics, sym);

	  /* if extern then do nothing or is a function
	     then do nothing */
	  if (IS_FUNC (sym->type))
	    continue;

	  /* print extra debug info if required */
	  if (options.debug)
	    {
	      cdbSymbol (sym, cdbFile, FALSE, FALSE);

	      if (!sym->level)
		{		/* global */
		  if (IS_STATIC (sym->etype))
		    fprintf (afile, "F%s$", moduleName);	/* scope is file */
		  else
		    fprintf (afile, "G$");	/* scope is global */
		}
	      else
		/* symbol is local */
		fprintf (afile, "L%s$",
			 (sym->localof ? sym->localof->name : "-null-"));
	      fprintf (afile, "%s$%d$%d", sym->name, sym->level, sym->block);
	    }

	  /* if is has an absolute address then generate
	     an equate for this no need to allocate space */
	  if (SPEC_ABSA (sym->etype))
	    {

	      if (options.debug)
		fprintf (afile, " == 0x%04x\n", SPEC_ADDR (sym->etype));

	      fprintf (afile, "%s\t=\t0x%04x\n",
		       sym->rname,
		       SPEC_ADDR (sym->etype));
	    }
	  else
	    {
	      if (options.debug)
		fprintf (afile, "==.\n");
	      
	      /* allocate space */
	      tfprintf (afile, "!labeldef\n", sym->rname);
	      tfprintf (afile, "\t!ds\n", (unsigned int) getSize (sym->type) & 0xffff);
	    }

	}
    }
}

/*-----------------------------------------------------------------*/
/* glue - the final glue that hold the whole thing together        */
/*-----------------------------------------------------------------*/
void 
glue ()
{
  FILE *vFile;
  FILE *asmFile;
  FILE *ovrFile = tempfile ();

  addSetHead (&tmpfileSet, ovrFile);
  /* print the global struct definitions */
  if (options.debug)
    cdbStructBlock (0, cdbFile);

  vFile = tempfile ();
  /* PENDING: this isnt the best place but it will do */
  if (port->general.glue_up_main)
    {
      /* create the interrupt vector table */
      createInterruptVect (vFile);
    }

  addSetHead (&tmpfileSet, vFile);

  /* emit code for the all the variables declared */
  emitMaps ();
  /* do the overlay segments */
  emitOverlay (ovrFile);

  /* now put it all together into the assembler file */
  /* create the assembler file name */

  if (!options.c1mode)
    {
      sprintf (scratchFileName, srcFileName);
      strcat (scratchFileName, port->assembler.file_ext);
    }
  else
    {
      strcpy (scratchFileName, options.out_name);
    }

  if (!(asmFile = fopen (scratchFileName, "w")))
    {
      werror (E_FILE_OPEN_ERR, scratchFileName);
      exit (1);
    }

  /* initial comments */
  initialComments (asmFile);

  /* print module name */
  tfprintf (asmFile, "\t!module\n", moduleName);
  tfprintf (asmFile, "\t!fileprelude\n");

  /* Let the port generate any global directives, etc. */
  if (port->genAssemblerPreamble)
    {
      port->genAssemblerPreamble (asmFile);
    }

  /* print the global variables in this module */
  printPublics (asmFile);
  if (port->assembler.externGlobal)
    printExterns (asmFile);

  /* copy the sfr segment */
  fprintf (asmFile, "%s", iComments2);
  fprintf (asmFile, "; special function registers\n");
  fprintf (asmFile, "%s", iComments2);
  copyFile (asmFile, sfr->oFile);

  /* copy the sbit segment */
  fprintf (asmFile, "%s", iComments2);
  fprintf (asmFile, "; special function bits \n");
  fprintf (asmFile, "%s", iComments2);
  copyFile (asmFile, sfrbit->oFile);

  /* copy the data segment */
  fprintf (asmFile, "%s", iComments2);
  fprintf (asmFile, "; internal ram data\n");
  fprintf (asmFile, "%s", iComments2);
  copyFile (asmFile, data->oFile);


  /* create the overlay segments */
  fprintf (asmFile, "%s", iComments2);
  fprintf (asmFile, "; overlayable items in internal ram \n");
  fprintf (asmFile, "%s", iComments2);
  copyFile (asmFile, ovrFile);

  /* create the stack segment MOF */
  if (mainf && IFFUNC_HASBODY(mainf->type))
    {
      fprintf (asmFile, "%s", iComments2);
      fprintf (asmFile, "; Stack segment in internal ram \n");
      fprintf (asmFile, "%s", iComments2);
      fprintf (asmFile, "\t.area\tSSEG\t(DATA)\n"
	       "__start__stack:\n\t.ds\t1\n\n");
    }

  /* create the idata segment */
  fprintf (asmFile, "%s", iComments2);
  fprintf (asmFile, "; indirectly addressable internal ram data\n");
  fprintf (asmFile, "%s", iComments2);
  copyFile (asmFile, idata->oFile);

  /* copy the bit segment */
  fprintf (asmFile, "%s", iComments2);
  fprintf (asmFile, "; bit data\n");
  fprintf (asmFile, "%s", iComments2);
  copyFile (asmFile, bit->oFile);

  /* if external stack then reserve space of it */
  if (mainf && IFFUNC_HASBODY(mainf->type) && options.useXstack)
    {
      fprintf (asmFile, "%s", iComments2);
      fprintf (asmFile, "; external stack \n");
      fprintf (asmFile, "%s", iComments2);
      fprintf (asmFile, "\t.area XSEG (XDATA)\n");	/* MOF */
      fprintf (asmFile, "\t.ds 256\n");
    }


  /* copy xtern ram data */
  fprintf (asmFile, "%s", iComments2);
  fprintf (asmFile, "; external ram data\n");
  fprintf (asmFile, "%s", iComments2);
  copyFile (asmFile, xdata->oFile);

  /* copy the interrupt vector table */
  if (mainf && IFFUNC_HASBODY(mainf->type))
    {
      fprintf (asmFile, "%s", iComments2);
      fprintf (asmFile, "; interrupt vector \n");
      fprintf (asmFile, "%s", iComments2);
      copyFile (asmFile, vFile);
    }

  /* copy global & static initialisations */
  fprintf (asmFile, "%s", iComments2);
  fprintf (asmFile, "; global & static initialisations\n");
  fprintf (asmFile, "%s", iComments2);

  /* Everywhere we generate a reference to the static_name area,
   * (which is currently only here), we immediately follow it with a
   * definition of the post_static_name area. This guarantees that
   * the post_static_name area will immediately follow the static_name
   * area.
   */
  tfprintf (asmFile, "\t!area\n", port->mem.static_name);	/* MOF */
  tfprintf (asmFile, "\t!area\n", port->mem.post_static_name);
  tfprintf (asmFile, "\t!area\n", port->mem.static_name);

  if (mainf && IFFUNC_HASBODY(mainf->type))
    {
      fprintf (asmFile, "__sdcc_gsinit_startup:\n");
      /* if external stack is specified then the
         higher order byte of the xdatalocation is
         going into P2 and the lower order going into
         spx */
      if (options.useXstack)
	{
	  fprintf (asmFile, "\tmov\tP2,#0x%02x\n",
		   (((unsigned int) options.xdata_loc) >> 8) & 0xff);
	  fprintf (asmFile, "\tmov\t_spx,#0x%02x\n",
		   (unsigned int) options.xdata_loc & 0xff);
	}

      /* initialise the stack pointer */
      /* if the user specified a value then use it */
      if (options.stack_loc)
	fprintf (asmFile, "\tmov\tsp,#%d\n", options.stack_loc);
      else
	/* no: we have to compute it */
      if (!options.stackOnData && maxRegBank <= 3)
	fprintf (asmFile, "\tmov\tsp,#%d\n", ((maxRegBank + 1) * 8) - 1);
      else
	fprintf (asmFile, "\tmov\tsp,#__start__stack\n");	/* MOF */

      fprintf (asmFile, "\tlcall\t__sdcc_external_startup\n");
      fprintf (asmFile, "\tmov\ta,dpl\n");
      fprintf (asmFile, "\tjz\t__sdcc_init_data\n");
      fprintf (asmFile, "\tljmp\t__sdcc_program_startup\n");
      fprintf (asmFile, "__sdcc_init_data:\n");

    }
  copyFile (asmFile, statsg->oFile);

  if (port->general.glue_up_main && mainf && IFFUNC_HASBODY(mainf->type))
    {
      /* This code is generated in the post-static area.
       * This area is guaranteed to follow the static area
       * by the ugly shucking and jiving about 20 lines ago.
       */
      tfprintf (asmFile, "\t!area\n", port->mem.post_static_name);
      fprintf (asmFile, "\tljmp\t__sdcc_program_startup\n");
    }

  fprintf (asmFile,
	   "%s"
	   "; Home\n"
	   "%s", iComments2, iComments2);
  tfprintf (asmFile, "\t!areahome\n", HOME_NAME);
  copyFile (asmFile, home->oFile);

  /* copy over code */
  fprintf (asmFile, "%s", iComments2);
  fprintf (asmFile, "; code\n");
  fprintf (asmFile, "%s", iComments2);
  tfprintf (asmFile, "\t!areacode\n", CODE_NAME);
  if (mainf && IFFUNC_HASBODY(mainf->type))
    {

      /* entry point @ start of CSEG */
      fprintf (asmFile, "__sdcc_program_startup:\n");

      /* put in the call to main */
      fprintf (asmFile, "\tlcall\t_main\n");
      if (options.mainreturn)
	{

	  fprintf (asmFile, ";\treturn from main ; will return to caller\n");
	  fprintf (asmFile, "\tret\n");

	}
      else
	{

	  fprintf (asmFile, ";\treturn from main will lock up\n");
	  fprintf (asmFile, "\tsjmp .\n");
	}
    }
  copyFile (asmFile, code->oFile);

  fclose (asmFile);
  applyToSet (tmpfileSet, closeTmpFiles);
  applyToSet (tmpfileNameSet, rmTmpFiles);
}

#if defined (__MINGW32__) || defined (__CYGWIN__) || defined (_MSC_VER)
void
rm_tmpfiles (void)
{
  applyToSet (tmpfileSet, closeTmpFiles);
  applyToSet (tmpfileNameSet, rmTmpFiles);
}
#endif

/** Creates a temporary file name a'la tmpnam which avoids the bugs
    in cygwin wrt c:\tmp.
    Scans, in order: TMP, TEMP, TMPDIR, else uses tmpfile().
*/
char *
tempfilename (void)
{
#if !defined(_MSC_VER)
  const char *tmpdir = NULL;
  if (getenv ("TMP"))
    tmpdir = getenv ("TMP");
  else if (getenv ("TEMP"))
    tmpdir = getenv ("TEMP");
  else if (getenv ("TMPDIR"))
    tmpdir = getenv ("TMPDIR");
  if (tmpdir)
    {
      char *name = tempnam (tmpdir, "sdcc");
      if (name)
	{
          return name;
        }
    }
#endif
  return tmpnam (NULL);
}

/** Creates a temporary file a'la tmpfile which avoids the bugs
    in cygwin wrt c:\tmp.
    Scans, in order: TMP, TEMP, TMPDIR, else uses tmpfile().
*/
FILE *
tempfile (void)
{
#if !defined(_MSC_VER)
  const char *tmpdir = NULL;
  if (getenv ("TMP"))
    tmpdir = getenv ("TMP");
  else if (getenv ("TEMP"))
    tmpdir = getenv ("TEMP");
  else if (getenv ("TMPDIR"))
    tmpdir = getenv ("TMPDIR");
  if (tmpdir)
    {
      char *name = Safe_strdup( tempnam (tmpdir, "sdcc"));
      if (name)
	{
	  FILE *fp = fopen (name, "w+b");
	  if (fp)
	    {
	      addSetHead (&tmpfileNameSet, name);
	    }
	  return fp;
	}
      return NULL;
    }
#endif
  return tmpfile ();
}


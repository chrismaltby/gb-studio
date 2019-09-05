/*----------------------------------------------------------------------
    SDCCval.c :- has routine to do all kinds of fun stuff with the
                value wrapper & with initialiser lists.

    Written By - Sandeep Dutta . sandeep.dutta@usa.net (1998)

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
#include <math.h>
#include <stdlib.h>
#include <limits.h>
#include "newalloc.h"

int cNestLevel;

/*-----------------------------------------------------------------*/
/* newValue - allocates and returns a new value        */
/*-----------------------------------------------------------------*/
value *
newValue ()
{
  value *val;

  val = Safe_alloc (sizeof (value));

  return val;
}

/*-----------------------------------------------------------------*/
/* newiList - new initializer list                                 */
/*-----------------------------------------------------------------*/
initList *
newiList (int type, void *ilist)
{
  initList *nilist;


  nilist = Safe_alloc (sizeof (initList));

  nilist->type = type;
  nilist->lineno = yylineno;

  switch (type)
    {
    case INIT_NODE:
      nilist->init.node = (struct ast *) ilist;
      break;

    case INIT_DEEP:
      nilist->init.deep = (struct initList *) ilist;
      break;
    }

  return nilist;
}

/*------------------------------------------------------------------*/
/* revinit   - reverses the initial values for a value  chain        */
/*------------------------------------------------------------------*/
initList *
revinit (initList * val)
{
  initList *prev, *curr, *next;

  if (!val)
    return NULL;

  prev = val;
  curr = val->next;

  while (curr)
    {
      next = curr->next;
      curr->next = prev;
      prev = curr;
      curr = next;
    }
  val->next = (void *) NULL;
  return prev;
}

bool
convertIListToConstList(initList *src, literalList **lList)
{
    initList    *iLoop;
    literalList *head, *last, *newL;
    
    head = last = NULL;
    
    if (!src || src->type != INIT_DEEP)
    {
	return FALSE;
    }
    
    iLoop =  src->init.deep;
    
    while (iLoop)
    {
	if (iLoop->type != INIT_NODE)
	{
	    return FALSE;
	}
	
	if (!IS_AST_LIT_VALUE(decorateType(resolveSymbols(iLoop->init.node))))
	{
	    return FALSE;
	}
	iLoop = iLoop->next;
    }
    
    // We've now established that the initializer list contains only literal values.
    
    iLoop = src->init.deep;
    while (iLoop)
    {
	double val = AST_LIT_VALUE(iLoop->init.node);
	
	if (last && last->literalValue == val)
	{
	    last->count++;
	}
	else
	{
	    newL = Safe_alloc(sizeof(literalList));
	    newL->literalValue = val;
	    newL->count = 1;
	    newL->next = NULL;
	    
	    if (last)
	    {
		last->next = newL;
	    }
	    else
	    {
		head = newL;
	    }
	    last = newL;
	}
	iLoop = iLoop->next;
    }
    
    if (!head)    
    {
	return FALSE;
    }
    
    *lList = head;
    return TRUE;
}

literalList *
copyLiteralList(literalList *src)
{
    literalList *head, *prev, *newL;
    
    head = prev = NULL;
    
    while (src)
    {
	newL = Safe_alloc(sizeof(literalList));
	
	newL->literalValue = src->literalValue;
	newL->count = src->count;
	newL->next = NULL;
	
	if (prev)
	{
	    prev->next = newL;
	}
	else
	{
	    head = newL;
	}
	prev = newL;
	src = src->next;
    }
    
    return head;
}



/*------------------------------------------------------------------*/
/* copyIlist - copy initializer list            */
/*------------------------------------------------------------------*/
initList *
copyIlist (initList * src)
{
  initList *dest = NULL;

  if (!src)
    return NULL;

  switch (src->type)
    {
    case INIT_DEEP:
      dest = newiList (INIT_DEEP, copyIlist (src->init.deep));
      break;
    case INIT_NODE:
      dest = newiList (INIT_NODE, copyAst (src->init.node));
      break;
    }

  if (src->next)
    dest->next = copyIlist (src->next);

  return dest;
}

/*------------------------------------------------------------------*/
/* list2int - converts the first element of the list to value       */
/*------------------------------------------------------------------*/
double 
list2int (initList * val)
{
  initList *i = val;

  if (i->type == INIT_DEEP)
    return list2int (val->init.deep);

  return floatFromVal (constExprValue (val->init.node, TRUE));
}

/*------------------------------------------------------------------*/
/* list2val - converts the first element of the list to value       */
/*------------------------------------------------------------------*/
value *
list2val (initList * val)
{
  if (!val)
    return NULL;

  if (val->type == INIT_DEEP)
    return list2val (val->init.deep);

  return constExprValue (val->init.node, TRUE);
}

/*------------------------------------------------------------------*/
/* list2expr - returns the first expression in the initializer list */
/*------------------------------------------------------------------*/
ast *
list2expr (initList * ilist)
{
  if (ilist->type == INIT_DEEP)
    return list2expr (ilist->init.deep);
  return ilist->init.node;
}

/*------------------------------------------------------------------*/
/* resolveIvalSym - resolve symbols in initial values               */
/*------------------------------------------------------------------*/
void 
resolveIvalSym (initList * ilist)
{
  if (!ilist)
    return;

  if (ilist->type == INIT_NODE)
    ilist->init.node = decorateType (resolveSymbols (ilist->init.node));

  if (ilist->type == INIT_DEEP)
    resolveIvalSym (ilist->init.deep);

  resolveIvalSym (ilist->next);
}

/*-----------------------------------------------------------------*/
/* symbolVal - creates a value for a symbol              */
/*-----------------------------------------------------------------*/
value *
symbolVal (symbol * sym)
{
  value *val;

  if (!sym)
    return NULL;

  val = newValue ();
  val->sym = sym;

  if (sym->type)
    {
      val->type = sym->type;
      val->etype = getSpec (val->type);
    }

  if (*sym->rname)
    sprintf (val->name, "%s", sym->rname);
  else
    sprintf (val->name, "_%s", sym->name);


  return val;
}

/*--------------------------------------------------------------------*/
/* cheapestVal - convert a val to the cheapest as possible value      */
/*--------------------------------------------------------------------*/
value *cheapestVal (value *val) {
  long sval=0;
  unsigned long uval=0;

  if (IS_FLOAT(val->type) || IS_CHAR(val->type))
    return val;

  if (SPEC_LONG(val->type)) {
    if (SPEC_USIGN(val->type)) {
      uval=SPEC_CVAL(val->type).v_ulong;
    } else {
      sval=SPEC_CVAL(val->type).v_long;
    }
  } else {
    if (SPEC_USIGN(val->type)) {
      uval=SPEC_CVAL(val->type).v_uint;
    } else {
      sval=SPEC_CVAL(val->type).v_int;
    }
  }

  if (SPEC_USIGN(val->type)) {
    if (uval<=0xffff) {
      SPEC_LONG(val->type)=0;
      SPEC_CVAL(val->type).v_uint = uval;
    }
    if (uval<=0xff) {
      SPEC_NOUN(val->type)=V_CHAR;
    }
  } else { // not unsigned
    if (sval<0) {
      if (sval>=-32768) {
	SPEC_LONG(val->type)=0;
	SPEC_CVAL(val->type).v_int = sval & 0xffff;
      }
      if (sval>=-128) {
	SPEC_NOUN(val->type)=V_CHAR;
	SPEC_CVAL(val->type).v_int &= 0xff;
      }
    } else { // sval>=0
      SPEC_USIGN(val->type)=1;
      if (sval<=65535) {
	SPEC_LONG(val->type)=0;
	SPEC_CVAL(val->type).v_int = sval;
      }
      if (sval<=255) {
	SPEC_NOUN(val->type)=V_CHAR;
      }
    }
  }
  return val;
}

/*-----------------------------------------------------------------*/
/* valueFromLit - creates a value from a literal                   */
/*-----------------------------------------------------------------*/
value *
valueFromLit (double lit)
{
  char buffer[50];

  if ((((long) lit) - lit) == 0)
    {
      sprintf (buffer, "%ld", (long) lit);
      return constVal (buffer);
    }

  sprintf (buffer, "%f", lit);
  return constFloatVal (buffer);
}

/*-----------------------------------------------------------------*/
/* constFloatVal - converts a FLOAT constant to value              */
/*-----------------------------------------------------------------*/
value *
constFloatVal (char *s)
{
  value *val = newValue ();
  double sval;

  if (sscanf (s, "%lf", &sval) != 1)
    {
      werror (E_INVALID_FLOAT_CONST, s);
      return constVal ("0");
    }

  val->type = val->etype = newLink ();
  val->type->class = SPECIFIER;
  SPEC_NOUN (val->type) = V_FLOAT;
  SPEC_SCLS (val->type) = S_LITERAL;
  SPEC_CVAL (val->type).v_float = sval;

  return val;
}

/*-----------------------------------------------------------------*/
/* constVal - converts an INTEGER constant into a cheapest value   */
/*-----------------------------------------------------------------*/
value *constVal (char *s)
{
  value *val;
  short hex = 0, octal = 0;
  char scanFmt[10];
  int scI = 0;
  double dval;

  val = newValue ();		/* alloc space for value   */

  val->type = val->etype = newLink ();	/* create the spcifier */
  val->type->class = SPECIFIER;
  SPEC_SCLS (val->type) = S_LITERAL;
  // let's start with an unsigned char
  SPEC_NOUN (val->type) = V_CHAR;
  SPEC_USIGN (val->type) = 1;

  hex = ((strchr (s, 'x') || strchr (s, 'X')) ? 1 : 0);

  /* set the octal flag   */
  if (!hex && *s == '0' && *(s + 1))
    octal = 1;

  /* create the scan string */
  scanFmt[scI++] = '%';

  scanFmt[scI++] = 'l';

  if (octal)
    scanFmt[scI++] = 'o';
  else if (hex)
    scanFmt[scI++] = 'x';
  else
    scanFmt[scI++] = 'f';

  scanFmt[scI++] = '\0';

  if (octal || hex) {
    unsigned long sval;
    sscanf (s, scanFmt, &sval);
    dval=sval;
  } else {
    sscanf (s, scanFmt, &dval);
  }

  /* Setup the flags first */
  /* set the _long flag if 'lL' is found */
  if (strchr (s, 'l') || strchr (s, 'L')) {
    SPEC_NOUN (val->type) = V_INT;
    SPEC_LONG (val->type) = 1;
  }

  if (dval<0) { // "-28u" will still be signed and negative
    SPEC_USIGN (val->type) = 0;
    if (dval<-128) { // check if we have to promote to int
      SPEC_NOUN (val->type) = V_INT;
    }
    if (dval<-32768) { // check if we have to promote to long int
      SPEC_LONG (val->type) = 1;
    }
  } else { // >=0
    if (dval>0xff) { // check if we have to promote to int
      SPEC_NOUN (val->type) = V_INT;
    }
    if (dval>0xffff) { // check if we have to promote to long int
      SPEC_LONG (val->type) = 1;
    }
  }

  if (SPEC_LONG (val->type))
    {
      if (SPEC_USIGN (val->type))
        {
          SPEC_CVAL (val->type).v_ulong = dval;
        }
      else
        {
          SPEC_CVAL (val->type).v_long = dval;
        }
    }
  else
    {
      if (SPEC_USIGN (val->type))
        {
          SPEC_CVAL (val->type).v_uint = dval;
        }
      else
        {
          SPEC_CVAL (val->type).v_int = dval;
        }
    }

  return val;
}

/*! /fn char hexEscape(char **src)

    /param src Pointer to 'x' from start of hex character value
*/

unsigned char hexEscape(char **src)
{
  char *s ;
  unsigned long value ;
  
  (*src)++ ;	/* Skip over the 'x' */
  s = *src ;	/* Save for error detection */
  
  value = strtol (*src, src, 16);
  
  if (s == *src) {
      // no valid hex found
      werror(E_INVALID_HEX);
  } else {
    if (value > 255) {
      werror(W_ESC_SEQ_OOR_FOR_CHAR);
    }
  }
  return (char) value;
}

/*------------------------------------------------------------------*/
/* octalEscape - process an octal constant of max three digits      */
/* return the octal value, throw a warning for illegal octal        */
/* adjust src to point at the last proccesed char                   */
/*------------------------------------------------------------------*/

unsigned char octalEscape (char **str) {
  int digits;
  unsigned value=0;

  for (digits=0; digits<3; digits++) {
    if (**str>='0' && **str<='7') {
      value = value*8 + (**str-'0');
      (*str)++;
    } else {
      break;
    }
  }
  if (digits) {
    if (value > 255 /* || (**str>='0' && **str<='7') */ ) {
      werror (W_ESC_SEQ_OOR_FOR_CHAR);
    }
  }
  return value;
}

/*! 
  /fn int copyStr (char *dest, char *src)
  
  Copies a source string to a dest buffer interpreting escape sequences
  and special characters

  /param dest Buffer to receive the resultant string
  /param src  Buffer containing the source string with escape sequecnes
  /return Number of characters in output string

*/

int 
copyStr (char *dest, char *src)

{
  char *OriginalDest = dest ;

  while (*src)
    {
      if (*src == '\"')
	src++;
      else if (*src == '\\')
	{
	  src++;
	  switch (*src)
	    {
	    case 'n':
	      *dest++ = '\n';
	      break;
	    case 't':
	      *dest++ = '\t';
	      break;
	    case 'v':
	      *dest++ = '\v';
	      break;
	    case 'b':
	      *dest++ = '\b';
	      break;
	    case 'r':
	      *dest++ = '\r';
	      break;
	    case 'f':
	      *dest++ = '\f';
	      break;
	    case 'a':
	      *dest++ = '\a';
	      break;

	    case '0':
	    case '1':
	    case '2':
	    case '3':
	    case '4':
	    case '5':
	    case '6':
	    case '7':
	      *dest++ = octalEscape(&src);
	      src-- ;
	      break;

	    case 'x': 
	      *dest++ = hexEscape(&src) ;
	      src-- ;
	      break ;

	    case '\\':
	      *dest++ = '\\';
	      break;
	    case '\?':
	      *dest++ = '\?';
	      break;
	    case '\'':
	      *dest++ = '\'';
	      break;
	    case '\"':
	      *dest++ = '\"';
	      break;
	    default:
	      *dest++ = *src;
	    }
	  src++;
	}
      else
	*dest++ = *src++;
    }

  *dest++ = '\0';

  return dest - OriginalDest ;
}

/*------------------------------------------------------------------*/
/* strVal - converts a string constant to a value       */
/*------------------------------------------------------------------*/
value *
strVal (char *s)
{
  value *val;

  val = newValue ();		/* get a new one */

  /* get a declarator */
  val->type = newLink ();
  DCL_TYPE (val->type) = ARRAY;
  val->type->next = val->etype = newLink ();
  val->etype->class = SPECIFIER;
  SPEC_NOUN (val->etype) = V_CHAR;
  SPEC_SCLS (val->etype) = S_LITERAL;

  SPEC_CVAL (val->etype).v_char = Safe_alloc (strlen (s) + 1);
  DCL_ELEM (val->type) = copyStr (SPEC_CVAL (val->etype).v_char, s);

  return val;
}


/*------------------------------------------------------------------*/
/* reverseValWithType - reverses value chain with type & etype      */
/*------------------------------------------------------------------*/
value *
reverseValWithType (value * val)
{
  sym_link *type;
  sym_link *etype;

  if (!val)
    return NULL;

  /* save the type * etype chains */
  type = val->type;
  etype = val->etype;

  /* set the current one 2b null */
  val->type = val->etype = NULL;
  val = reverseVal (val);

  /* restore type & etype */
  val->type = type;
  val->etype = etype;

  return val;
}

/*------------------------------------------------------------------*/
/* reverseVal - reverses the values for a value  chain        */
/*------------------------------------------------------------------*/
value *
reverseVal (value * val)
{
  value *prev, *curr, *next;

  if (!val)
    return NULL;

  prev = val;
  curr = val->next;

  while (curr)
    {
      next = curr->next;
      curr->next = prev;
      prev = curr;
      curr = next;
    }
  val->next = (void *) NULL;
  return prev;
}

/*------------------------------------------------------------------*/
/* copyValueChain - will copy a chain of values                     */
/*------------------------------------------------------------------*/
value *
copyValueChain (value * src)
{
  value *dest;

  if (!src)
    return NULL;

  dest = copyValue (src);
  dest->next = copyValueChain (src->next);

  return dest;
}

/*------------------------------------------------------------------*/
/* copyValue - copies contents of a value to a fresh one            */
/*------------------------------------------------------------------*/
value *
copyValue (value * src)
{
  value *dest;

  dest = newValue ();
  dest->sym = copySymbol (src->sym);
  strcpy (dest->name, src->name);
  dest->type = (src->type ? copyLinkChain (src->type) : NULL);
  dest->etype = (src->type ? getSpec (dest->type) : NULL);

  return dest;
}

/*------------------------------------------------------------------*/
/* charVal - converts a character constant to a value       */
/*------------------------------------------------------------------*/
value *
charVal (char *s)
{
  value *val;
//  unsigned uValue ;

  val = newValue ();

  val->type = val->etype = newLink ();
  val->type->class = SPECIFIER;
  SPEC_NOUN (val->type) = V_CHAR;
  SPEC_USIGN(val->type) = 1;
  SPEC_SCLS (val->type) = S_LITERAL;

  s++;				/* get rid of quotation */
  /* if \ then special processing */
  if (*s == '\\')
    {
      s++;			/* go beyond the backslash  */
      switch (*s)
	{
	case 'n':
	  SPEC_CVAL (val->type).v_int = '\n';
	  break;
	case 't':
	  SPEC_CVAL (val->type).v_int = '\t';
	  break;
	case 'v':
	  SPEC_CVAL (val->type).v_int = '\v';
	  break;
	case 'b':
	  SPEC_CVAL (val->type).v_int = '\b';
	  break;
	case 'r':
	  SPEC_CVAL (val->type).v_int = '\r';
	  break;
	case 'f':
	  SPEC_CVAL (val->type).v_int = '\f';
	  break;
	case 'a':
	  SPEC_CVAL (val->type).v_int = '\a';
	  break;
	case '\\':
	  SPEC_CVAL (val->type).v_int = '\\';
	  break;
	case '\?':
	  SPEC_CVAL (val->type).v_int = '\?';
	  break;
	case '\'':
	  SPEC_CVAL (val->type).v_int = '\'';
	  break;
	case '\"':
	  SPEC_CVAL (val->type).v_int = '\"';
	  break;

	case '0' :
	case '1' :
	case '2' :
	case '3' :
	case '4' :
	case '5' :
	case '6' :
	case '7' :
	  SPEC_CVAL (val->type).v_uint = octalEscape(&s);
	  break;

	case 'x':
	  SPEC_CVAL (val->type).v_uint = hexEscape(&s) ;
	  break;

	default:
	  SPEC_CVAL (val->type).v_uint = (unsigned char)*s;
	  break;
	}
    }
  else				/* not a backslash */
    SPEC_CVAL (val->type).v_uint = (unsigned char)*s;

  return val;
}

/*------------------------------------------------------------------*/
/* valFromType - creates a value from type given                    */
/*------------------------------------------------------------------*/
value *
valFromType (sym_link * type)
{
  value *val = newValue ();
  val->type = copyLinkChain (type);
  val->etype = getSpec (val->type);
  return val;
}

/*------------------------------------------------------------------*/
/* floatFromVal - value to unsinged integer conversion        */
/*------------------------------------------------------------------*/
double 
floatFromVal (value * val)
{
  if (!val)
    return 0;

  if (val->etype && SPEC_SCLS (val->etype) != S_LITERAL)
    {
      werror (E_CONST_EXPECTED, val->name);
      return 0;
    }

  /* if it is not a specifier then we can assume that */
  /* it will be an unsigned long                      */
  if (!IS_SPEC (val->type))
    return (double) SPEC_CVAL (val->etype).v_ulong;

  if (SPEC_NOUN (val->etype) == V_FLOAT)
    return (double) SPEC_CVAL (val->etype).v_float;

  if (SPEC_LONG (val->etype))
    {
      if (SPEC_USIGN (val->etype))
	return (double) SPEC_CVAL (val->etype).v_ulong;
      else
	return (double) SPEC_CVAL (val->etype).v_long;
    }
  
  if (SPEC_NOUN(val->etype)==V_INT) {
    if (SPEC_USIGN (val->etype))
      return (double) SPEC_CVAL (val->etype).v_uint;
    else
      return (double) SPEC_CVAL (val->etype).v_int;
  } else { // SPEC_NOUN==V_CHAR
    if (SPEC_USIGN (val->etype))
      return (double) ((unsigned char)SPEC_CVAL (val->etype).v_uint);
    else
      return (double) ((signed char)SPEC_CVAL (val->etype).v_int);
  }
}


/*------------------------------------------------------------------*/
/* valUnaryPM - does the unary +/- operation on a constant          */
/*------------------------------------------------------------------*/
value *
valUnaryPM (value * val)
{
  /* depending on type */
  if (SPEC_NOUN (val->etype) == V_FLOAT)
    SPEC_CVAL (val->etype).v_float = -1.0 * SPEC_CVAL (val->etype).v_float;
  else
    {
      if (SPEC_LONG (val->etype))
	{
	  if (SPEC_USIGN (val->etype))
	    SPEC_CVAL (val->etype).v_ulong = 0-SPEC_CVAL (val->etype).v_ulong;
	  else
	    SPEC_CVAL (val->etype).v_long = -SPEC_CVAL (val->etype).v_long;
	}
      else
	{
	  if (SPEC_USIGN (val->etype))
	    SPEC_CVAL (val->etype).v_uint = 0-SPEC_CVAL (val->etype).v_uint;
	  else
	    SPEC_CVAL (val->etype).v_int = -SPEC_CVAL (val->etype).v_int;
	  if (SPEC_NOUN (val->etype)==V_CHAR) {
	    SPEC_CVAL (val->etype).v_uint &= 0xff;
	  }
	}
    }
  // -(unsigned 3) now really is signed
  SPEC_USIGN(val->etype)=0;
  return val;
}

/*------------------------------------------------------------------*/
/* valueComplement - complements a constant                         */
/*------------------------------------------------------------------*/
value *
valComplement (value * val)
{
  /* depending on type */
  if (SPEC_LONG (val->etype))
    {
      if (SPEC_USIGN (val->etype))
	SPEC_CVAL (val->etype).v_ulong = ~SPEC_CVAL (val->etype).v_ulong;
      else
	SPEC_CVAL (val->etype).v_long = ~SPEC_CVAL (val->etype).v_long;
    }
  else
    {
      if (SPEC_USIGN (val->etype))
	SPEC_CVAL (val->etype).v_uint = ~SPEC_CVAL (val->etype).v_uint;
      else
	SPEC_CVAL (val->etype).v_int = ~SPEC_CVAL (val->etype).v_int;
      if (SPEC_NOUN (val->etype)==V_CHAR) {
	SPEC_CVAL (val->etype).v_uint &= 0xff;
      }
    }
  return val;
}

/*------------------------------------------------------------------*/
/* valueNot - complements a constant                                */
/*------------------------------------------------------------------*/
value *
valNot (value * val)
{
  /* depending on type */
  if (SPEC_LONG (val->etype))
    {
      if (SPEC_USIGN (val->etype))
	SPEC_CVAL (val->etype).v_ulong = !SPEC_CVAL (val->etype).v_ulong;
      else
	SPEC_CVAL (val->etype).v_long = !SPEC_CVAL (val->etype).v_long;
    }
  else
    {
      if (SPEC_USIGN (val->etype))
	SPEC_CVAL (val->etype).v_uint = !SPEC_CVAL (val->etype).v_uint;
      else
	SPEC_CVAL (val->etype).v_int = !SPEC_CVAL (val->etype).v_int;
      if (SPEC_NOUN (val->etype)==V_CHAR) {
	SPEC_CVAL (val->etype).v_uint &= 0xff;
      }
    }
  return val;
}

/*------------------------------------------------------------------*/
/* valMult - multiply constants                                     */
/*------------------------------------------------------------------*/
value *
valMult (value * lval, value * rval)
{
  value *val;

  /* create a new value */
  val = newValue ();
  val->type = val->etype = newLink ();
  val->type->class = SPECIFIER;
  SPEC_NOUN (val->type) = (IS_FLOAT (lval->etype) ||
			   IS_FLOAT (rval->etype) ? V_FLOAT : V_INT);
  SPEC_SCLS (val->type) = S_LITERAL;	/* will remain literal */
  SPEC_USIGN (val->type) = (SPEC_USIGN (lval->etype) & SPEC_USIGN (rval->etype));
  SPEC_LONG (val->type) = 1;

  if (IS_FLOAT (val->type))
    SPEC_CVAL (val->type).v_float = floatFromVal (lval) * floatFromVal (rval);
  else
    {
      if (SPEC_LONG (val->type))
	{
	  if (SPEC_USIGN (val->type))
	    SPEC_CVAL (val->type).v_ulong = (unsigned long) floatFromVal (lval) *
	      (unsigned long) floatFromVal (rval);
	  else
	    SPEC_CVAL (val->type).v_long = (long) floatFromVal (lval) *
	      (long) floatFromVal (rval);
	}
    }
  return cheapestVal(val);
}

/*------------------------------------------------------------------*/
/* valDiv  - Divide   constants                                     */
/*------------------------------------------------------------------*/
value *
valDiv (value * lval, value * rval)
{
  value *val;

  if (floatFromVal (rval) == 0)
    {
      werror (E_DIVIDE_BY_ZERO);
      return rval;
    }

  /* create a new value */
  val = newValue ();
  val->type = val->etype = newLink();
  val->type->class = SPECIFIER;
  SPEC_NOUN (val->type) = (IS_FLOAT (lval->etype) ||
			   IS_FLOAT (rval->etype) ? V_FLOAT : V_INT);
  SPEC_SCLS (val->etype) = S_LITERAL;
  SPEC_USIGN (val->type) = (SPEC_USIGN (lval->etype) & SPEC_USIGN (rval->etype));
  SPEC_LONG (val->type) = (SPEC_LONG (lval->etype) | SPEC_LONG (rval->etype));

  if (IS_FLOAT (val->type))
    SPEC_CVAL (val->type).v_float = floatFromVal (lval) / floatFromVal (rval);
  else
    {
      if (SPEC_LONG (val->type))
	{
	  if (SPEC_USIGN (val->type))
	    SPEC_CVAL (val->type).v_ulong = 
	      (unsigned long) floatFromVal (lval) /
	      (unsigned long) floatFromVal (rval);
	  else
	    SPEC_CVAL (val->type).v_long = (long) floatFromVal (lval) /
	      (long) floatFromVal (rval);
	}
      else
	{
	  if (SPEC_USIGN (val->type)) {
	    SPEC_CVAL (val->type).v_uint = (unsigned) floatFromVal (lval) /
	      (unsigned) floatFromVal (rval);
	  } else {
	    SPEC_CVAL (val->type).v_int = (int) floatFromVal (lval) /
	      (int) floatFromVal (rval);
	  }
	}
    }
  return cheapestVal(val);
}

/*------------------------------------------------------------------*/
/* valMod  - Modulus  constants                                     */
/*------------------------------------------------------------------*/
value *
valMod (value * lval, value * rval)
{
  value *val;

  /* create a new value */
  val = newValue ();
  val->type = val->etype = newLink ();
  val->type->class = SPECIFIER;
  SPEC_NOUN (val->type) = V_INT;	/* type is int */
  SPEC_SCLS (val->type) = S_LITERAL;	/* will remain literal */
  SPEC_USIGN (val->type) = (SPEC_USIGN (lval->etype) & SPEC_USIGN (rval->etype));
  SPEC_LONG (val->type) = (SPEC_LONG (lval->etype) | SPEC_LONG (rval->etype));

  if (SPEC_LONG (val->type))
    {
      if (SPEC_USIGN (val->type))
	SPEC_CVAL (val->type).v_ulong = (unsigned long) floatFromVal (lval) %
	  (unsigned long) floatFromVal (rval);
      else
	SPEC_CVAL (val->type).v_long = (unsigned long) floatFromVal (lval) %
	  (unsigned long) floatFromVal (rval);
    }
  else
    {
      if (SPEC_USIGN (val->type)) {
	SPEC_CVAL (val->type).v_uint = (unsigned) floatFromVal (lval) %
	  (unsigned) floatFromVal (rval);
      } else {
	SPEC_CVAL (val->type).v_int = (unsigned) floatFromVal (lval) %
	  (unsigned) floatFromVal (rval);
      }
    }

  return cheapestVal(val);
}

/*------------------------------------------------------------------*/
/* valPlus - Addition constants                                     */
/*------------------------------------------------------------------*/
value *
valPlus (value * lval, value * rval)
{
  value *val;

  /* create a new value */
  val = newValue ();
  val->type = val->etype = newLink ();
  val->type->class = SPECIFIER;
  SPEC_NOUN (val->type) = (IS_FLOAT (lval->etype) ||
			   IS_FLOAT (rval->etype) ? V_FLOAT : V_INT);
  SPEC_SCLS (val->type) = S_LITERAL;	/* will remain literal */
  SPEC_USIGN (val->type) = 
    SPEC_USIGN (lval->etype) &&
    SPEC_USIGN (rval->etype) &&
    (floatFromVal(lval)+floatFromVal(rval))>=0;
    
  SPEC_LONG (val->type) = 1;

  if (IS_FLOAT (val->type))
    SPEC_CVAL (val->type).v_float = floatFromVal (lval) + floatFromVal (rval);
  else
    {
      if (SPEC_LONG (val->type))
	{
	  if (SPEC_USIGN (val->type))
	    SPEC_CVAL (val->type).v_ulong = (unsigned long) floatFromVal (lval) +
	      (unsigned long) floatFromVal (rval);
	  else
	    SPEC_CVAL (val->type).v_long = (long) floatFromVal (lval) +
	      (long) floatFromVal (rval);
	}
    }
  return cheapestVal(val);
}

/*------------------------------------------------------------------*/
/* valMinus - Addition constants                                    */
/*------------------------------------------------------------------*/
value *
valMinus (value * lval, value * rval)
{
  value *val;

  /* create a new value */
  val = newValue ();
  val->type = val->etype = newLink ();
  val->type->class = SPECIFIER;
  SPEC_NOUN (val->type) = (IS_FLOAT (lval->etype) ||
			   IS_FLOAT (rval->etype) ? V_FLOAT : V_INT);
  SPEC_SCLS (val->type) = S_LITERAL;	/* will remain literal */
  SPEC_USIGN (val->type) = 
    SPEC_USIGN (lval->etype) &&
    SPEC_USIGN (rval->etype) &&
    (floatFromVal(lval)-floatFromVal(rval))>=0;

  SPEC_LONG (val->type) = (SPEC_LONG (lval->etype) | SPEC_LONG (rval->etype));

  if (IS_FLOAT (val->type))
    SPEC_CVAL (val->type).v_float = floatFromVal (lval) - floatFromVal (rval);
  else
    {
      if (SPEC_LONG (val->type))
	{
	  if (SPEC_USIGN (val->type)) {
	    SPEC_CVAL (val->type).v_ulong = 
	      (unsigned long) floatFromVal (lval) -
	      (unsigned long) floatFromVal (rval);
	  } else {
	    SPEC_CVAL (val->type).v_long = (long) floatFromVal (lval) -
	      (long) floatFromVal (rval);
	  }
	}
      else
	{
	  if (SPEC_USIGN (val->type)) {
	    SPEC_CVAL (val->type).v_uint = (unsigned) floatFromVal (lval) -
	      (unsigned) floatFromVal (rval);
	  } else {
	    SPEC_CVAL (val->type).v_int = (int) floatFromVal (lval) - 
	      (int) floatFromVal (rval);
	  }
	}
    }
  return cheapestVal(val);
}

/*------------------------------------------------------------------*/
/* valShift - Shift left or right                                   */
/*------------------------------------------------------------------*/
value *
valShift (value * lval, value * rval, int lr)
{
  value *val;

  /* create a new value */
  val = newValue ();
  val->type = val->etype = newIntLink ();
  SPEC_SCLS (val->type) = S_LITERAL;	/* will remain literal */
  SPEC_USIGN (val->type) = (SPEC_USIGN (lval->etype) & SPEC_USIGN (rval->etype));
  SPEC_LONG (val->type) = 1;

  if (SPEC_LONG (val->type))
    {
      if (SPEC_USIGN (val->type))
	SPEC_CVAL (val->type).v_ulong = lr ? 
	  (unsigned long) floatFromVal (lval) << (unsigned long) floatFromVal (rval) : \
	  (unsigned long) floatFromVal (lval) >> (unsigned long) floatFromVal (rval);
      else
	SPEC_CVAL (val->type).v_long = lr ?
	  (long) floatFromVal (lval) << (long) floatFromVal (rval) : \
	  (long) floatFromVal (lval) >> (long) floatFromVal (rval);
    }

  return cheapestVal(val);
}

/*------------------------------------------------------------------*/
/* valCompare- Compares two literal                                 */
/*------------------------------------------------------------------*/
value *
valCompare (value * lval, value * rval, int ctype)
{
  value *val;

  /* create a new value */
  val = newValue ();
  val->type = val->etype = newCharLink ();
  val->type->class = SPECIFIER;
  SPEC_NOUN (val->type) = V_CHAR;	/* type is char */
  SPEC_USIGN (val->type) = 1;
  SPEC_SCLS (val->type) = S_LITERAL;	/* will remain literal */

  switch (ctype)
    {
    case '<':
      SPEC_CVAL (val->type).v_int = floatFromVal (lval) < floatFromVal (rval);
      break;

    case '>':
      SPEC_CVAL (val->type).v_int = floatFromVal (lval) > floatFromVal (rval);
      break;

    case LE_OP:
      SPEC_CVAL (val->type).v_int = floatFromVal (lval) <= floatFromVal (rval);
      break;

    case GE_OP:
      SPEC_CVAL (val->type).v_int = floatFromVal (lval) >= floatFromVal (rval);
      break;

    case EQ_OP:
      SPEC_CVAL (val->type).v_int = floatFromVal (lval) == floatFromVal (rval);
      break;

    case NE_OP:
      SPEC_CVAL (val->type).v_int = floatFromVal (lval) != floatFromVal (rval);
      break;

    }

  return val;
}

/*------------------------------------------------------------------*/
/* valBitwise - Bitwise operation                                   */
/*------------------------------------------------------------------*/
value *
valBitwise (value * lval, value * rval, int op)
{
  value *val;

  /* create a new value */
  val = newValue ();
  val->type = copyLinkChain (lval->type);
  val->etype = getSpec (val->type);

  switch (op)
    {
    case '&':
      if (SPEC_LONG (val->type))
	{
	  if (SPEC_USIGN (val->type))
	    SPEC_CVAL (val->type).v_ulong = (unsigned long) floatFromVal (lval) &
	      (unsigned long) floatFromVal (rval);
	  else
	    SPEC_CVAL (val->type).v_long = (long) floatFromVal (lval) &
	      (long) floatFromVal (rval);
	}
      else
	{
	  if (SPEC_USIGN (val->type))
	    SPEC_CVAL (val->type).v_uint = (unsigned) floatFromVal (lval) &
	      (unsigned) floatFromVal (rval);
	  else
	    SPEC_CVAL (val->type).v_int = (int) floatFromVal (lval) & (int) floatFromVal (rval);
	}
      break;

    case '|':
      if (SPEC_LONG (val->type))
	{
	  if (SPEC_USIGN (val->type))
	    SPEC_CVAL (val->type).v_ulong = (unsigned long) floatFromVal (lval) |
	      (unsigned long) floatFromVal (rval);
	  else
	    SPEC_CVAL (val->type).v_long = (long) floatFromVal (lval) |
	      (long) floatFromVal (rval);
	}
      else
	{
	  if (SPEC_USIGN (val->type))
	    SPEC_CVAL (val->type).v_uint = (unsigned) floatFromVal (lval) |
	      (unsigned) floatFromVal (rval);
	  else
	    SPEC_CVAL (val->type).v_int =
	      (int) floatFromVal (lval) | (int) floatFromVal (rval);
	}

      break;

    case '^':
      if (SPEC_LONG (val->type))
	{
	  if (SPEC_USIGN (val->type))
	    SPEC_CVAL (val->type).v_ulong = (unsigned long) floatFromVal (lval) ^
	      (unsigned long) floatFromVal (rval);
	  else
	    SPEC_CVAL (val->type).v_long = (long) floatFromVal (lval) ^
	      (long) floatFromVal (rval);
	}
      else
	{
	  if (SPEC_USIGN (val->type))
	    SPEC_CVAL (val->type).v_uint = (unsigned) floatFromVal (lval) ^
	      (unsigned) floatFromVal (rval);
	  else
	    SPEC_CVAL (val->type).v_int =
	      (int) floatFromVal (lval) ^ (int) floatFromVal (rval);
	}
      break;
    }

  return cheapestVal(val);
}

/*------------------------------------------------------------------*/
/* valAndOr   - Generates code for and / or operation               */
/*------------------------------------------------------------------*/
value *
valLogicAndOr (value * lval, value * rval, int op)
{
  value *val;

  /* create a new value */
  val = newValue ();
  val->type = val->etype = newCharLink ();
  val->type->class = SPECIFIER;
  SPEC_SCLS (val->type) = S_LITERAL;	/* will remain literal */
  SPEC_USIGN (val->type) = 0;

  switch (op)
    {
    case AND_OP:
      SPEC_CVAL (val->type).v_int = floatFromVal (lval) && floatFromVal (rval);
      break;

    case OR_OP:
      SPEC_CVAL (val->type).v_int = floatFromVal (lval) || floatFromVal (rval);
      break;
    }


  return val;
}

/*------------------------------------------------------------------*/
/* valCastLiteral - casts a literal value to another type           */
/*------------------------------------------------------------------*/
value *
valCastLiteral (sym_link * dtype, double fval)
{
  value *val;

  if (!dtype)
    return NULL;

  val = newValue ();
  val->etype = getSpec (val->type = copyLinkChain (dtype));
  SPEC_SCLS (val->etype) = S_LITERAL;
  /* if it is not a specifier then we can assume that */
  /* it will be an unsigned long                      */
  if (!IS_SPEC (val->type))
    {
      SPEC_CVAL (val->etype).v_ulong = (unsigned long) fval;
      return val;
    }

  if (SPEC_NOUN (val->etype) == V_FLOAT)
    SPEC_CVAL (val->etype).v_float = fval;
  else
    {
      if (SPEC_LONG (val->etype))
	{
	  if (SPEC_USIGN (val->etype))
	    SPEC_CVAL (val->etype).v_ulong = (unsigned long) fval;
	  else
	    SPEC_CVAL (val->etype).v_long = (long) fval;
	}
      else
	{
	  if (SPEC_USIGN (val->etype))
	    SPEC_CVAL (val->etype).v_uint = (unsigned short)fval;
	  else
	    SPEC_CVAL (val->etype).v_int = (short)fval;
	  if (SPEC_NOUN (val->etype)==V_CHAR) {
	    SPEC_CVAL (val->etype).v_uint &= 0xff; 
	  }
	}
    }
  return val;
}

/*------------------------------------------------------------------*/
/* getNelements - determines # of elements from init list           */
/*------------------------------------------------------------------*/
int 
getNelements (sym_link * type, initList * ilist)
{
  sym_link *etype = getSpec (type);
  int i;

  if (!ilist)
    return 0;

  if (ilist->type == INIT_DEEP)
    ilist = ilist->init.deep;

  /* if type is a character array and there is only one
     (string) initialiser then get the length of the string */
  if (IS_ARRAY (type) && IS_CHAR (etype) && !ilist->next)
    {
      ast *iast = ilist->init.node;
      value *v = (iast->type == EX_VALUE ? iast->opval.val : NULL);
      if (!v)
	{
	  werror (W_INIT_WRONG);
	  return 0;
	}

      if (IS_ARRAY (v->type) && IS_CHAR (v->etype))
	// yep, it's a string
	{
	  return DCL_ELEM (v->type);
	}
    }

  i = 0;
  while (ilist)
    {
      i++;
      ilist = ilist->next;
    }

  return i;
}

/*-----------------------------------------------------------------*/
/* valForArray - returns a value with name of array index          */
/*-----------------------------------------------------------------*/
value *
valForArray (ast * arrExpr)
{
  value *val, *lval = NULL;
  char buffer[128];
  int size = getSize (arrExpr->left->ftype->next);
  /* if the right or left is an array
     resolve it first */
  if (IS_AST_OP (arrExpr->left))
    {
      if (arrExpr->left->opval.op == '[')
	lval = valForArray (arrExpr->left);
      else if (arrExpr->left->opval.op == '.')
	lval = valForStructElem (arrExpr->left->left,
				 arrExpr->left->right);
      else if (arrExpr->left->opval.op == PTR_OP &&
	       IS_ADDRESS_OF_OP (arrExpr->left->left))
	lval = valForStructElem (arrExpr->left->left->left,
				 arrExpr->left->right);
      else
	return NULL;

    }
  else if (!IS_AST_SYM_VALUE (arrExpr->left))
    return NULL;

  if (!IS_AST_LIT_VALUE (arrExpr->right))
    return NULL;

  val = newValue ();
  if (!lval)
    sprintf (buffer, "%s", AST_SYMBOL (arrExpr->left)->rname);
  else
    sprintf (buffer, "%s", lval->name);

  sprintf (val->name, "(%s + %d)", buffer,
	   (int) AST_LIT_VALUE (arrExpr->right) * size);

  val->type = newLink ();
  if (SPEC_SCLS (arrExpr->left->etype) == S_CODE)
    {
      DCL_TYPE (val->type) = CPOINTER;
      DCL_PTR_CONST (val->type) = port->mem.code_ro;
    }
  else if (SPEC_SCLS (arrExpr->left->etype) == S_XDATA)
    DCL_TYPE (val->type) = FPOINTER;
  else if (SPEC_SCLS (arrExpr->left->etype) == S_XSTACK)
    DCL_TYPE (val->type) = PPOINTER;
  else if (SPEC_SCLS (arrExpr->left->etype) == S_IDATA)
    DCL_TYPE (val->type) = IPOINTER;
  else if (SPEC_SCLS (arrExpr->left->etype) == S_EEPROM)
    DCL_TYPE (val->type) = EEPPOINTER;
  else
    DCL_TYPE (val->type) = POINTER;
  val->type->next = arrExpr->left->ftype;
  val->etype = getSpec (val->type);
  return val;
}

/*-----------------------------------------------------------------*/
/* valForStructElem - returns value with name of struct element    */
/*-----------------------------------------------------------------*/
value *
valForStructElem (ast * structT, ast * elemT)
{
  value *val, *lval = NULL;
  char buffer[128];
  symbol *sym;

  /* left could be furthur derefed */
  if (IS_AST_OP (structT))
    {
      if (structT->opval.op == '[')
	lval = valForArray (structT);
      else if (structT->opval.op == '.')
	lval = valForStructElem (structT->left, structT->right);
      else if (structT->opval.op == PTR_OP &&
	       IS_ADDRESS_OF_OP (structT->left))
	lval = valForStructElem (structT->left->left,
				 structT->right);
      else
	return NULL;
    }

  if (!IS_AST_SYM_VALUE (elemT))
    return NULL;

  if (!IS_STRUCT (structT->etype))
    return NULL;

  if ((sym = getStructElement (SPEC_STRUCT (structT->etype),
			       AST_SYMBOL (elemT))) == NULL)
    {
      return NULL;
    }

  val = newValue ();
  if (!lval)
    sprintf (buffer, "%s", AST_SYMBOL (structT)->rname);
  else
    sprintf (buffer, "%s", lval->name);

  sprintf (val->name, "(%s + %d)", buffer,
	   (int) sym->offset);

  val->type = newLink ();
  if (SPEC_SCLS (structT->etype) == S_CODE)
    {
      DCL_TYPE (val->type) = CPOINTER;
      DCL_PTR_CONST (val->type) = port->mem.code_ro;
    }
  else if (SPEC_SCLS (structT->etype) == S_XDATA)
    DCL_TYPE (val->type) = FPOINTER;
  else if (SPEC_SCLS (structT->etype) == S_XSTACK)
    DCL_TYPE (val->type) = PPOINTER;
  else if (SPEC_SCLS (structT->etype) == S_IDATA)
    DCL_TYPE (val->type) = IPOINTER;
  else if (SPEC_SCLS (structT->etype) == S_EEPROM)
    DCL_TYPE (val->type) = EEPPOINTER;
  else
    DCL_TYPE (val->type) = POINTER;
  val->type->next = sym->type;
  val->etype = getSpec (val->type);
  return val;
}

/*-----------------------------------------------------------------*/
/* valForCastAggr - will return value for a cast of an aggregate   */
/*                  plus minus a constant                          */
/*-----------------------------------------------------------------*/
value *
valForCastAggr (ast * aexpr, sym_link * type, ast * cnst, int op)
{
  value *val;

  if (!IS_AST_SYM_VALUE (aexpr))
    return NULL;
  if (!IS_AST_LIT_VALUE (cnst))
    return NULL;

  val = newValue ();

  sprintf (val->name, "(%s %c %d)",
	   AST_SYMBOL (aexpr)->rname, op,
	   getSize (type->next) * (int) AST_LIT_VALUE (cnst));

  val->type = type;
  val->etype = getSpec (val->type);
  return val;
}

/*-----------------------------------------------------------------*/
/* valForCastAggr - will return value for a cast of an aggregate   */
/*                  with no constant                               */
/*-----------------------------------------------------------------*/
value *
valForCastArr (ast * aexpr, sym_link * type)
{
  value *val;

  if (!IS_AST_SYM_VALUE (aexpr))
    return NULL;

  val = newValue ();

  sprintf (val->name, "(%s)",
	   AST_SYMBOL (aexpr)->rname);

  val->type = type;
  val->etype = getSpec (val->type);
  return val;
}

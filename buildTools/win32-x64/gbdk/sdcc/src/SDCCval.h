/*----------------------------------------------------------------------
  SDCCval.h - value wrapper related header information
  Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1997)

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
#include "SDCCsymt.h"
#ifndef SDCCVAL_H
#define SDCCVAL_H

/* value wrapper */
typedef struct value
  {
    char name[SDCC_NAME_MAX + 1];	/* operand accessing this value */
    sym_link *type;		/* start of type chain     */
    sym_link *etype;		/* end of type chain       */
    symbol *sym;		/* Original Symbol         */
    struct value *next;		/* used in initializer list */
    unsigned vArgs:1;		/* arg list ended with variable arg           */

  }
value;

typedef struct literalList
{
    double    literalValue;
    unsigned  count;
    struct literalList *next;
} literalList;


enum
  {
    INIT_NODE,
    INIT_DEEP,
    INIT_HOLE
  };

/* initializer lists use this structure */
typedef struct initList
  {
    int type;
    int lineno;
    union
      {
	struct ast *node;
	struct initList *deep;
      }
    init;

    struct initList *next;
  }
initList;

#define  IS_VARG(x)		(x->vArgs)

/* forward definitions for the symbol table related functions */
void initValue ();
value *newValue ();
value *constVal (char *);
value *reverseVal (value *);
value *reverseValWithType (value *);
value *copyValue (value *);
value *copyValueChain (value *);
value *strVal (char *);
value *charVal (char *);
value *symbolVal (symbol *);
void printVal (value *);
double floatFromVal (value *);
value *array2Ptr (value *);
value *valUnaryPM (value *);
value *valComplement (value *);
value *valNot (value *);
value *valMult (value *, value *);
value *valDiv (value *, value *);
value *valMod (value *, value *);
value *valPlus (value *, value *);
value *valMinus (value *, value *);
value *valShift (value *, value *, int);
value *valCompare (value *, value *, int);
value *valBitwise (value *, value *, int);
value *valLogicAndOr (value *, value *, int);
value *valCastLiteral (sym_link *, double);
value *valueFromLit (double);
initList *newiList (int, void *);
initList *revinit (initList *);
initList *copyIlist (initList *);
double list2int (initList *);
value *list2val (initList *);
struct ast *list2expr (initList *);
void resolveIvalSym (initList *);
value *valFromType (sym_link *);
value *constFloatVal (char *);
int getNelements (sym_link *, initList *);
value *valForArray (struct ast *);
value *valForStructElem (struct ast *, struct ast *);
value *valForCastAggr (struct ast *, sym_link *, struct ast *, int);
value *valForCastArr (struct ast * , sym_link *);
bool convertIListToConstList(initList *src, literalList **lList);
literalList *copyLiteralList(literalList *src);
#endif

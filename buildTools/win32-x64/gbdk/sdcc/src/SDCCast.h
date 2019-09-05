/*-------------------------------------------------------------------------
  SDCCast.h - header file for parser support & all ast related routines

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

#ifndef SDCCEXPR_H
#define SDCCEXPR_H

#include "SDCCglobl.h"
#include "SDCCsymt.h"
#include "SDCCval.h"
#include "SDCCset.h"
#include "SDCCmem.h"

#define  EX_OP       0
#define  EX_VALUE    1
#define  EX_LINK     2
#define  EX_STMNT    3
#define  EX_OPERAND  4

/* expression tree   */
typedef struct ast
  {

    unsigned type:3;
    unsigned decorated:1;
    unsigned isError:1;
    unsigned funcName:1;
    unsigned rvalue:1;
    unsigned lvalue:1;
    unsigned initMode:1;
    int level;			/* level for expr */
    int block;			/* block number   */
    /* union of values expression can have */
    union
      {
	value *val;		/* value if type = EX_VALUE */
	sym_link *lnk;		/* sym_link * if type= EX_LINK  */
	struct operand *oprnd;	/* used only for side effecting function calls */
	unsigned stmnt;		/* statement if type=EX_STMNT */
	unsigned op;		/* operator if type= EX_OP  */
      }
    opval;

    /* union for special processing */
    union
      {
	char *inlineasm;	/* pointer to inline assembler code */
	literalList *constlist; /* init list for array initializer. */
	symbol *sym;		/* if block then -> symbols */
	value *args;		/* if function then args    */
	/* if switch then switch values */
	struct
	  {
	    value *swVals;	/* switch comparison values */
	    int swDefault;	/* default if present       */
	    int swNum;		/* switch number            */
	  }
	switchVals;
	/* if for then for values */
	struct
	  {
	    struct ast *initExpr;	/* init portion */
	    struct ast *condExpr;	/* conditional portion */
	    struct ast *loopExpr;	/* iteration portion   */
	    symbol *trueLabel;	/* entry point into body */
	    symbol *falseLabel;	/* exit point */
	    symbol *continueLabel;	/* conditional check   */
	    symbol *condLabel;	/* conditional label   */
	  }
	forVals;
	unsigned literalFromCast;	/* true if this is an EX_VALUE of LITERAL 
					 * type resulting from a typecast.
					 */
      }
    values;

    int lineno;			/* source file line number     */
    char *filename;		/* filename of the source file */

    sym_link *ftype;		/* start of type chain for this subtree */
    sym_link *etype;		/* end of type chain for this subtree   */

    struct ast *left;		/* pointer to left tree        */
    struct ast *right;		/* pointer to right tree       */
    symbol *trueLabel;		/* if statement trueLabel */
    symbol *falseLabel;		/* if statement falseLabel */
  }
ast;


/* easy access macros   */
#define  IS_AST_OP(x)			(x && x->type == EX_OP)
#define IS_CALLOP(x)   (IS_AST_OP(x) && x->opval.op == CALL)
#define IS_BITOR(x) (IS_AST_OP(x) && x->opval.op == '|')
#define IS_BITAND(x) (IS_AST_OP(x) && x->opval.op == '&' && \
		      x->left && x->right )
#define IS_FOR_STMT(x) (IS_AST_OP(x) && x->opval.op == FOR)
#define IS_LEFT_OP(x) (IS_AST_OP(x) && x->opval.op == LEFT_OP)
#define IS_RIGHT_OP(x) (IS_AST_OP(x) && x->opval.op == RIGHT_OP)
#define  IS_AST_VALUE(x)	(x && x->type == EX_VALUE && x->opval.val)
#define  IS_AST_LINK(x)		(x->type == EX_LINK)
#define  IS_AST_NOT_OPER(x)	(x && IS_AST_OP(x) && x->opval.op == '!')
#define  IS_ARRAY_OP(x) (IS_AST_OP(x) && x->opval.op == '[')
#define  IS_COMPARE_OP(x)	(IS_AST_OP(x)		&&		\
				  (x->opval.op == '>'	||		\
				   x->opval.op == '<'	||		\
				   x->opval.op == LE_OP	||		\
				   x->opval.op == GE_OP	||		\
				   x->opval.op == EQ_OP	||		\
				   x->opval.op == NE_OP	))
#define IS_CAST_OP(x) (IS_AST_OP(x) && x->opval.op == CAST)
#define IS_TERNARY_OP(x) (IS_AST_OP(x) && x->opval.op == '?')
#define IS_COLON_OP(x) (IS_AST_OP(x) && x->opval.op == ':')
#define IS_ADDRESS_OF_OP(x)    (IS_AST_OP(x)            &&              \
				x->opval.op == '&'      &&              \
				x->right == NULL )
#define IS_AST_LIT_VALUE(x) (IS_AST_VALUE(x) && \
                             IS_LITERAL(x->opval.val->etype))
#define IS_AST_SYM_VALUE(x)     (IS_AST_VALUE(x) && x->opval.val->sym)
#define AST_LIT_VALUE(x)        (floatFromVal(x->opval.val))
#define AST_SYMBOL(x)           (x->opval.val->sym)
#define AST_VALUE(x)            (x->opval.val)
#define AST_VALUES(x,y)	(x->values.y)
#define AST_FOR(x,y) x->values.forVals.y
#define  IS_AST_PARAM(x)	(IS_AST_OP(x) && x->opval.op == PARAM)

#define  CAN_EVAL(x)	(     x	==  '[' || x == '.' || x == PTR_OP ||	\
	      x	==  '&'	|| x ==	'|' || x == '^'	   || x	== '*' || \
	      x	==  '-'	|| x ==	'+' || x == '~'	   ||	\
	      x	==  '!'	|| x ==	LEFT_OP	|| x ==	RIGHT_OP ||	  \
	      x	==  '/'	|| x ==	'%' || x == '>'	|| x ==	'<'    || \
              x	== LE_OP || x == GE_OP || x == EQ_OP ||	x == NE_OP || \
	      x	== AND_OP || x == OR_OP	|| x ==	'='  )

#define	 LEFT_FIRST(x) ( x  ==  AND_OP	||	x	==	OR_OP	)

#define SIDE_EFFECTS_CHECK(op,rVal)  if (!sideEffects)	{	        \
				         werror(W_NO_SIDE_EFFECTS,op);	\
					 return rVal	;	        \
				     }
#define IS_MODIFYING_OP(x) ( x == INC_OP || x == DEC_OP || x == '=' ||  \
			x == AND_ASSIGN || x== OR_ASSIGN || x == XOR_ASSIGN )

#define IS_ASSIGN_OP(x) ( x == '=' || x == ADD_ASSIGN || x == SUB_ASSIGN ||\
			  x == MUL_ASSIGN || x == DIV_ASSIGN || x == XOR_ASSIGN ||\
			  x == AND_ASSIGN || x == OR_ASSIGN || x == INC_OP || x == DEC_OP)
#define IS_DEREF_OP(x) (( x->opval.op == '*' && x->right == NULL) || x->opval.op == '.')

/* forward declarations for global variables */
extern ast *staticAutos;
extern FILE *codeOutFile;
extern struct memmap *GcurMemmap;

/* forward definitions for functions   */
ast *newAst_VALUE (value * val);
ast *newAst_OP (unsigned op);
ast *newAst_LINK (sym_link * val);
ast *newAst_STMNT (unsigned val);

void initAst ();
ast *newNode (long, ast *, ast *);
ast *copyAst (ast *);
value *sizeofOp (sym_link *);
value *evalStmnt (ast *);
ast *createFunction (symbol *, ast *);
ast *createBlock (symbol *, ast *);
ast *createLabel (symbol *, ast *);
ast *createCase (ast *, ast *, ast *);
ast *createDefault (ast *, ast *);
ast *optimizeCompare (ast *);
ast *forLoopOptForm (ast *);
ast *argAst (ast *);
ast *resolveSymbols (ast *);
ast *decorateType (ast *);
ast *createWhile (symbol *, symbol *, symbol *, ast *, ast *);
ast *createIf (ast *, ast *, ast *);
ast *createDo (symbol *, symbol *, symbol *, ast *, ast *);
ast *createFor (symbol *, symbol *, symbol *, symbol *, ast *, ast *, ast *, ast *);
void eval2icode (ast *);
value *constExprValue (ast *, int);
symbol *funcOfType (char *, sym_link *, sym_link *, int, int);
ast *initAggregates (symbol *, initList *, ast *);
bool hasSEFcalls (ast *);
void addSymToBlock (symbol *, ast *);

// exported variables 
extern set *operKeyReset;
extern int noAlloc;
extern int inInitMode;

#endif

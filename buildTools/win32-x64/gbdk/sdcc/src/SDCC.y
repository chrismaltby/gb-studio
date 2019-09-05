/*-----------------------------------------------------------------------

  SDCC.y - parser definition file for sdcc :
          Written By : Sandeep Dutta . sandeep.dutta@usa.net (1997)

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
%{
#include <stdio.h>
#include <stdarg.h> 
#include <string.h>
#include "SDCCglobl.h"
#include "SDCCsymt.h"
#include "SDCChasht.h"
#include "SDCCval.h"
#include "SDCCmem.h"
#include "SDCCast.h"
#include "port.h"
#include "newalloc.h"
#include "SDCCerr.h"

extern int yyerror (char *);
extern FILE	*yyin;
int NestLevel = 0 ;     /* current NestLevel       */
int stackPtr  = 1 ;     /* stack pointer           */
int xstackPtr = 0 ;     /* xstack pointer          */
int reentrant = 0 ; 
int blockNo   = 0 ;     /* sequential block number  */
int currBlockno=0 ;
extern int yylex();
int yyparse(void);
extern int noLineno ;
char lbuff[1024];      /* local buffer */

/* break & continue stacks */
STACK_DCL(continueStack  ,symbol *,MAX_NEST_LEVEL)
STACK_DCL(breakStack  ,symbol *,MAX_NEST_LEVEL)
STACK_DCL(forStack  ,symbol *,MAX_NEST_LEVEL)
STACK_DCL(swStk   ,ast   *,MAX_NEST_LEVEL)
STACK_DCL(blockNum,int,MAX_NEST_LEVEL*3)

value *cenum = NULL  ;  /* current enumeration  type chain*/

%}
%expect 6

%union {
    symbol     *sym ;      /* symbol table pointer       */
    structdef  *sdef;      /* structure definition       */
    char       yychar[SDCC_NAME_MAX+1];
    sym_link       *lnk ;      /* declarator  or specifier   */
    int        yyint;      /* integer value returned     */
    value      *val ;      /* for integer constant       */
    initList   *ilist;     /* initial list               */
    char       *yyinline; /* inlined assembler code */
    ast       *asts;     /* expression tree            */
}

%token <yychar> IDENTIFIER TYPE_NAME
%token <val>   CONSTANT   STRING_LITERAL
%token SIZEOF 
%token PTR_OP INC_OP DEC_OP LEFT_OP RIGHT_OP LE_OP GE_OP EQ_OP NE_OP
%token AND_OP OR_OP 
%token <yyint> MUL_ASSIGN DIV_ASSIGN MOD_ASSIGN ADD_ASSIGN
%token <yyint> SUB_ASSIGN LEFT_ASSIGN RIGHT_ASSIGN AND_ASSIGN
%token <yyint> XOR_ASSIGN OR_ASSIGN
%token TYPEDEF EXTERN STATIC AUTO REGISTER CODE EEPROM INTERRUPT SFR AT SBIT
%token REENTRANT USING  XDATA DATA IDATA PDATA VAR_ARGS CRITICAL NONBANKED BANKED
%token CHAR SHORT INT LONG SIGNED UNSIGNED FLOAT DOUBLE CONST VOLATILE VOID BIT
%token STRUCT UNION ENUM ELIPSIS RANGE FAR
%token CASE DEFAULT IF ELSE SWITCH WHILE DO FOR GOTO CONTINUE BREAK RETURN
%token NAKED
%token <yyinline> INLINEASM
%token IFX ADDRESS_OF GET_VALUE_AT_ADDRESS SPIL UNSPIL GETHBIT
%token BITWISEAND UNARYMINUS IPUSH IPOP PCALL  ENDFUNCTION JUMPTABLE
%token RRC RLC 
%token CAST CALL PARAM NULLOP BLOCK LABEL RECEIVE SEND ARRAYINIT

%type <yyint>  Interrupt_storage
%type <sym> identifier  declarator  declarator2 enumerator_list enumerator
%type <sym> struct_declarator
%type <sym> struct_declarator_list  struct_declaration   struct_declaration_list
%type <sym> declaration init_declarator_list init_declarator
%type <sym> declaration_list identifier_list parameter_identifier_list
%type <sym> declarator2_function_attributes while do for
%type <lnk> pointer type_specifier_list type_specifier type_name
%type <lnk> storage_class_specifier struct_or_union_specifier
%type <lnk> declaration_specifiers  sfr_reg_bit type_specifier2
%type <lnk> function_attribute function_attributes enum_specifier
%type <lnk> abstract_declarator abstract_declarator2 unqualified_pointer
%type <val> parameter_type_list parameter_list parameter_declaration opt_assign_expr
%type <sdef> stag opt_stag
%type <asts> primary_expr
%type <asts> postfix_expr unary_expr cast_expr multiplicative_expr
%type <asts> additive_expr shift_expr relational_expr equality_expr
%type <asts> and_expr exclusive_or_expr inclusive_or_expr logical_or_expr
%type <asts> logical_and_expr conditional_expr assignment_expr constant_expr
%type <asts> expr argument_expr_list function_definition expr_opt
%type <asts> statement_list statement labeled_statement compound_statement
%type <asts> expression_statement selection_statement iteration_statement
%type <asts> jump_statement function_body else_statement string_literal
%type <ilist> initializer initializer_list
%type <yyint> unary_operator  assignment_operator struct_or_union

%start file

%%

file
   : external_definition       
   | file external_definition
   ;

external_definition
   : function_definition     { 
                               blockNo=0;
                             }
   | declaration             { 
			       if ($1 && $1->type
				&& IS_FUNC($1->type))
			       {
 				   /* The only legal storage classes for 
				    * a function prototype (declaration)
				    * are extern and static. extern is the
				    * default. Thus, if this function isn't
				    * explicitly marked static, mark it
				    * extern.
				    */
				   if ($1->etype 
				    && IS_SPEC($1->etype)
				    && !SPEC_STAT($1->etype))
				   {
				   	SPEC_EXTR($1->etype) = 1;
				   }
			       }
                               addSymChain ($1);
                               allocVariables ($1) ;
			       cleanUpLevel (SymbolTab,1);
                             }
   ;

function_definition
   : declarator function_body  {   /* function type not specified */
                                   /* assume it to be 'int'       */
                                   addDecl($1,0,newIntLink());
				   $$ = createFunction($1,$2); 
                               } 
   | declaration_specifiers declarator function_body  
                                {   
				    pointerTypes($2->type,copyLinkChain($1));
				    addDecl($2,0,$1); 
				    $$ = createFunction($2,$3);   
				}
   ;

function_attribute
   : function_attributes
   | function_attributes function_attribute { $$ = mergeSpec($1,$2,"function_attribute"); }
   ;

function_attributes
   :  USING CONSTANT {
                        $$ = newLink() ;
                        $$->class = SPECIFIER   ;
			FUNC_REGBANK($$) = (int) floatFromVal($2);
                     }
   |  REENTRANT      {  $$ = newLink ();
                        $$->class = SPECIFIER   ;
			FUNC_ISREENT($$)=1;
                     }
   |  CRITICAL       {  $$ = newLink ();
                        $$->class = SPECIFIER   ;
			FUNC_ISCRITICAL($$) = 1;
                     }
   |  NAKED          {  $$ = newLink ();
                        $$->class = SPECIFIER   ;
			FUNC_ISNAKED($$)=1;
                     }
   |  NONBANKED      {$$ = newLink ();
                        $$->class = SPECIFIER   ;
                        FUNC_NONBANKED($$) = 1;
			if (FUNC_BANKED($$)) {
			    werror(W_BANKED_WITH_NONBANKED);
			}
                     }
   |  BANKED         {$$ = newLink ();
                        $$->class = SPECIFIER   ;
                        FUNC_BANKED($$) = 1;
			if (FUNC_NONBANKED($$)) {
			    werror(W_BANKED_WITH_NONBANKED);
			}
			if (SPEC_STAT($$)) {
			    werror(W_BANKED_WITH_STATIC);
			}
                     }
   |  Interrupt_storage
                     {
                        $$ = newLink () ;
                        $$->class = SPECIFIER ;
                        FUNC_INTNO($$) = $1 ;
                        FUNC_ISISR($$) = 1;
                     }
   ;

function_body
   : compound_statement                   
   | declaration_list compound_statement
         {
            werror(E_OLD_STYLE,($1 ? $1->name: "")) ;
	    exit(1);
         }
   ;

primary_expr
   : identifier      {  $$ = newAst_VALUE(symbolVal($1));  }
   | CONSTANT        {  $$ = newAst_VALUE($1);  }
   | string_literal  
   | '(' expr ')'    {  $$ = $2 ;                   }
   ;
         
string_literal
    : STRING_LITERAL			{ $$ = newAst_VALUE($1); }
    ;

postfix_expr
   : primary_expr
   | postfix_expr '[' expr ']'          { $$ = newNode	('[', $1, $3) ; }
   | postfix_expr '(' ')'               { $$ = newNode  (CALL,$1,NULL); 
                                          $$->left->funcName = 1;}
   | postfix_expr '(' argument_expr_list ')'
          { 	   
	    $$ = newNode  (CALL,$1,$3) ; $$->left->funcName = 1;
	  }
   | postfix_expr '.' identifier       
		      {    
			$3 = newSymbol($3->name,NestLevel);
			$3->implicit = 1;
			$$ = newNode(PTR_OP,newNode('&',$1,NULL),newAst_VALUE(symbolVal($3)));
/* 			$$ = newNode('.',$1,newAst(EX_VALUE,symbolVal($3))) ;		        */
		      }
   | postfix_expr PTR_OP identifier    
                      { 
			$3 = newSymbol($3->name,NestLevel);
			$3->implicit = 1;			
			$$ = newNode(PTR_OP,$1,newAst_VALUE(symbolVal($3)));
		      }
   | postfix_expr INC_OP   
                      {	$$ = newNode(INC_OP,$1,NULL);}
   | postfix_expr DEC_OP
                      {	$$ = newNode(DEC_OP,$1,NULL); }
   ;

argument_expr_list
   : assignment_expr 
   | assignment_expr ',' argument_expr_list { $$ = newNode(PARAM,$1,$3); }
   ;

unary_expr
   : postfix_expr
   | INC_OP unary_expr        { $$ = newNode(INC_OP,NULL,$2);  }
   | DEC_OP unary_expr        { $$ = newNode(DEC_OP,NULL,$2);  }
   | unary_operator cast_expr { $$ = newNode($1,$2,NULL)    ;  }
   | SIZEOF unary_expr        { $$ = newNode(SIZEOF,NULL,$2);  }
   | SIZEOF '(' type_name ')' { $$ = newAst_VALUE(sizeofOp($3)); }
   ;
              
unary_operator
   : '&'    { $$ = '&' ;}
   | '*'    { $$ = '*' ;}
   | '+'    { $$ = '+' ;}
   | '-'    { $$ = '-' ;}
   | '~'    { $$ = '~' ;}
   | '!'    { $$ = '!' ;}
   ;

cast_expr
   : unary_expr
   | '(' type_name ')' cast_expr { $$ = newNode(CAST,newAst_LINK($2),$4); }
   ;

multiplicative_expr
   : cast_expr
   | multiplicative_expr '*' cast_expr { $$ = newNode('*',$1,$3);}
   | multiplicative_expr '/' cast_expr { $$ = newNode('/',$1,$3);}
   | multiplicative_expr '%' cast_expr { $$ = newNode('%',$1,$3);}
   ;

additive_expr
   : multiplicative_expr
   | additive_expr '+' multiplicative_expr { $$=newNode('+',$1,$3);}
   | additive_expr '-' multiplicative_expr { $$=newNode('-',$1,$3);}
   ;

shift_expr
   : additive_expr
   | shift_expr LEFT_OP additive_expr  { $$ = newNode(LEFT_OP,$1,$3); }
   | shift_expr RIGHT_OP additive_expr { $$ = newNode(RIGHT_OP,$1,$3); }
   ;

relational_expr
   : shift_expr
   | relational_expr '<' shift_expr    { 
	$$ = (port->lt_nge ? 
	      newNode('!',newNode(GE_OP,$1,$3),NULL) :
	      newNode('<', $1,$3));
   }
   | relational_expr '>' shift_expr    { 
	   $$ = (port->gt_nle ? 
		 newNode('!',newNode(LE_OP,$1,$3),NULL) :
		 newNode('>',$1,$3));
   }
   | relational_expr LE_OP shift_expr  { 
	   $$ = (port->le_ngt ? 
		 newNode('!', newNode('>', $1 , $3 ), NULL) :
		 newNode(LE_OP,$1,$3));
   }
   | relational_expr GE_OP shift_expr  { 
	   $$ = (port->ge_nlt ? 
		 newNode('!', newNode('<', $1 , $3 ), NULL) :
		 newNode(GE_OP,$1,$3));
   }
   ;

equality_expr
   : relational_expr
   | equality_expr EQ_OP relational_expr  { 
    $$ = (port->eq_nne ? 
	  newNode('!',newNode(NE_OP,$1,$3),NULL) : 
	  newNode(EQ_OP,$1,$3));
   }
   | equality_expr NE_OP relational_expr { 
       $$ = (port->ne_neq ? 
	     newNode('!', newNode(EQ_OP,$1,$3), NULL) : 
	     newNode(NE_OP,$1,$3));
   }       
   ;

and_expr
   : equality_expr
   | and_expr '&' equality_expr  { $$ = newNode('&',$1,$3);}
   ;

exclusive_or_expr
   : and_expr
   | exclusive_or_expr '^' and_expr { $$ = newNode('^',$1,$3);}
   ;

inclusive_or_expr
   : exclusive_or_expr
   | inclusive_or_expr '|' exclusive_or_expr { $$ = newNode('|',$1,$3);}
   ;

logical_and_expr
   : inclusive_or_expr
   | logical_and_expr AND_OP inclusive_or_expr 
                                 { $$ = newNode(AND_OP,$1,$3);}
   ;

logical_or_expr
   : logical_and_expr
   | logical_or_expr OR_OP logical_and_expr  
                                 { $$ = newNode(OR_OP,$1,$3); }
   ;

conditional_expr
   : logical_or_expr
   | logical_or_expr '?' logical_or_expr ':' conditional_expr  
                     {
                        $$ = newNode(':',$3,$5) ;
                        $$ = newNode('?',$1,$$) ;
                     }                        
   ;

assignment_expr
   : conditional_expr
   | unary_expr assignment_operator assignment_expr   
                     { 
				 
			     switch ($2) {
			     case '=':
				     $$ = newNode($2,$1,$3);
				     break;
			     case MUL_ASSIGN:
				     $$ = newNode('=',$1,newNode('*',copyAst($1),$3));
				     break;
			     case DIV_ASSIGN:
				     $$ = newNode('=',$1,newNode('/',copyAst($1),$3));
				     break;
			     case MOD_ASSIGN:
			     	     $$ = newNode('=',$1,newNode('%',copyAst($1),$3));
				     break;
			     case ADD_ASSIGN:
				     $$ = newNode('=',$1,newNode('+',copyAst($1),$3));
				     break;
			     case SUB_ASSIGN:
				     $$ = newNode('=',$1,newNode('-',copyAst($1),$3));
				     break;
			     case LEFT_ASSIGN:
				     $$ = newNode('=',$1,newNode(LEFT_OP,copyAst($1),$3));
				     break;
			     case RIGHT_ASSIGN:
				     $$ = newNode('=',$1,newNode(RIGHT_OP,copyAst($1),$3));
				     break;
			     case AND_ASSIGN:
				     $$ = newNode('=',$1,newNode('&',copyAst($1),$3));
				     break;
			     case XOR_ASSIGN:
				     $$ = newNode('=',$1,newNode('^',copyAst($1),$3));
				     break;
			     case OR_ASSIGN:
				     $$ = newNode('=',$1,newNode('|',copyAst($1),$3));
				     break;
			     default :
				     $$ = NULL;
			     }
				     
                     }
;

assignment_operator
   : '='             { $$ = '=' ;}
   | MUL_ASSIGN
   | DIV_ASSIGN
   | MOD_ASSIGN
   | ADD_ASSIGN
   | SUB_ASSIGN
   | LEFT_ASSIGN
   | RIGHT_ASSIGN
   | AND_ASSIGN
   | XOR_ASSIGN
   | OR_ASSIGN
   ;

expr
   : assignment_expr
   | expr ',' assignment_expr { $$ = newNode(',',$1,$3);}
   ;

constant_expr
   : conditional_expr 
   ;

declaration
   : declaration_specifiers ';'  { $$ = NULL ; }
   | declaration_specifiers init_declarator_list ';'
      {
         /* add the specifier list to the id */
         symbol *sym , *sym1;

         for (sym1 = sym = reverseSyms($2);sym != NULL;sym = sym->next) {
	     sym_link *lnk = copyLinkChain($1);
	     /* do the pointer stuff */
	     pointerTypes(sym->type,lnk);
	     addDecl (sym,0,lnk) ;
	 }
        
	 $$ = sym1 ;
      }
   ;

declaration_specifiers
   : storage_class_specifier						{ $$ = $1; }
   | storage_class_specifier declaration_specifiers { 
     /* if the decl $2 is not a specifier */
     /* find the spec and replace it      */
     if ( !IS_SPEC($2)) {
       sym_link *lnk = $2 ;
       while (lnk && !IS_SPEC(lnk->next))
	 lnk = lnk->next;
       lnk->next = mergeSpec($1,lnk->next, yytext);
       $$ = $2 ;
     }
     else
       $$ = mergeSpec($1,$2, yytext);
   }
   | type_specifier				    { $$ = $1; }
   | type_specifier declaration_specifiers          { 
     /* if the decl $2 is not a specifier */
     /* find the spec and replace it      */
     if ( !IS_SPEC($2)) {
       sym_link *lnk = $2 ;
       while (lnk && !IS_SPEC(lnk->next))
	 lnk = lnk->next;
       lnk->next = mergeSpec($1,lnk->next, yytext);
       $$ = $2 ;
     }
     else
       $$ = mergeSpec($1,$2, yytext);
   }
   ;

init_declarator_list
   : init_declarator
   | init_declarator_list ',' init_declarator      { $3->next = $1 ; $$ = $3;}
   ;

init_declarator
   : declarator                  { $1->ival = NULL ; }
   | declarator '=' initializer  { $1->ival = $3   ; }
   ;


storage_class_specifier
   : TYPEDEF   {
                  $$ = newLink () ;
                  $$->class = SPECIFIER ;
                  SPEC_TYPEDEF($$) = 1 ;
               }
   | EXTERN    {
                  $$ = newLink();
                  $$->class = SPECIFIER ;
                  SPEC_EXTR($$) = 1 ;
               }
   | STATIC    {
                  $$ = newLink ();
                  $$->class = SPECIFIER ;
                  SPEC_STAT($$) = 1 ;
               }
   | AUTO      {
                  $$ = newLink () ;
                  $$->class = SPECIFIER ;
                  SPEC_SCLS($$) = S_AUTO  ;
               }
   | REGISTER  {
                  $$ = newLink ();
                  $$->class = SPECIFIER ;
                  SPEC_SCLS($$) = S_REGISTER ;
               }
   ;

Interrupt_storage
   : INTERRUPT CONSTANT  { $$ = (int) floatFromVal($2) ;  }
   ;

type_specifier
   : type_specifier2
   | type_specifier2 AT constant_expr
        {
           /* add this to the storage class specifier  */
           SPEC_ABSA($1) = 1;   /* set the absolute addr flag */
           /* now get the abs addr from value */
           SPEC_ADDR($1) = (int) floatFromVal(constExprValue($3,TRUE)) ;
        }
   ;

type_specifier2
   : CHAR   {
               $$=newLink();
               $$->class = SPECIFIER   ;
               SPEC_NOUN($$) = V_CHAR  ;
            }
   | SHORT  {
               $$=newLink();
               $$->class = SPECIFIER   ;
	       $$->select.s._short = 1 ;
            }
   | INT    {
               $$=newLink();
               $$->class = SPECIFIER   ;
               SPEC_NOUN($$) = V_INT   ;
            }
   | LONG   {
               $$=newLink();
               $$->class = SPECIFIER   ;
	       SPEC_LONG($$) = 1       ;
            }
   | SIGNED {
               $$=newLink();
               $$->class = SPECIFIER   ;
               $$->select.s._signed = 1;
            }
   | UNSIGNED  {
               $$=newLink();
               $$->class = SPECIFIER   ;
               SPEC_USIGN($$) = 1      ;
            }
   | VOID   {
               $$=newLink();
               $$->class = SPECIFIER   ;
               SPEC_NOUN($$) = V_VOID  ;
            }
   | CONST  {
               $$=newLink();
	       $$->class = SPECIFIER ;
	       SPEC_CONST($$) = 1;
            }
   | VOLATILE  {
               $$=newLink();
	       $$->class = SPECIFIER ;
	       SPEC_VOLATILE($$) = 1 ;
            }
   | FLOAT  {
               $$=newLink();
	       SPEC_NOUN($$) = V_FLOAT;
	       $$->class = SPECIFIER ;
            }
   | XDATA     {
                  $$ = newLink ();
                  $$->class = SPECIFIER ;
                  SPEC_SCLS($$) = S_XDATA  ;
               }
   | CODE      {
                  $$ = newLink () ;
                  $$->class = SPECIFIER  ;
                  SPEC_SCLS($$) = S_CODE ;                 
               }
   | EEPROM      {
                  $$ = newLink () ;
                  $$->class = SPECIFIER  ;
                  SPEC_SCLS($$) = S_EEPROM ;
               }
   | DATA      {
                  $$ = newLink ();
                  $$->class = SPECIFIER ;
                  SPEC_SCLS($$) = S_DATA   ;
               }
   | IDATA     {
                  $$ = newLink ();
                  $$->class = SPECIFIER ;
                  SPEC_SCLS($$) = S_IDATA  ;
               }
   | PDATA     { 
                  $$ = newLink ();
                  $$->class = SPECIFIER ;
                  SPEC_SCLS($$) = S_PDATA  ;
               }
   | BIT    {
               $$=newLink();
               $$->class = SPECIFIER   ;
               SPEC_NOUN($$) = V_BIT   ;
	       SPEC_SCLS($$) = S_BIT   ;
	       SPEC_BLEN($$) = 1;
	       SPEC_BSTR($$) = 0;
            }

   | struct_or_union_specifier
   | enum_specifier     {                           
                           cenum = NULL ;
                           $$ = $1 ;                              
                        }
   | TYPE_NAME    
         {
            symbol *sym;
            sym_link   *p  ;
            sym = findSym(TypedefTab,NULL,$1) ;
            $$ = p = copyLinkChain(sym->type);
	    SPEC_TYPEDEF(getSpec(p)) = 0;
         }
   | sfr_reg_bit
   ;

sfr_reg_bit
   :  SBIT  {
               $$ = newLink() ;
               $$->class = SPECIFIER ;
               SPEC_NOUN($$) = V_SBIT;
               SPEC_SCLS($$) = S_SBIT;
            }
   |  SFR   {
               $$ = newLink() ;
               $$->class = SPECIFIER ;
               SPEC_NOUN($$) = V_CHAR;
               SPEC_SCLS($$) = S_SFR ;
	       SPEC_USIGN($$) = 1 ;
            }
   ;

struct_or_union_specifier
   : struct_or_union opt_stag '{' struct_declaration_list '}'
        {
           structdef *sdef ;

           /* Create a structdef   */
           sdef = $2 ;
           sdef->fields   = reverseSyms($4) ;   /* link the fields */
           sdef->size  = compStructSize($1,sdef);   /* update size of  */

           /* Create the specifier */
           $$ = newLink () ;
           $$->class = SPECIFIER   ;
           SPEC_NOUN($$) = V_STRUCT;
           SPEC_STRUCT($$)= sdef ;
        }
   | struct_or_union stag
         {
            $$ = newLink() ;
            $$->class = SPECIFIER   ;
            SPEC_NOUN($$) = V_STRUCT;
            SPEC_STRUCT($$) = $2 ;
         }
   ;

struct_or_union
   : STRUCT          { $$ = STRUCT ; }
   | UNION           { $$ = UNION  ; }
   ;

opt_stag
: stag
|  {  /* synthesize a name add to structtable */
     $$ = newStruct(genSymName(NestLevel)) ;
     $$->level = NestLevel ;
     addSym (StructTab, $$, $$->tag,$$->level,currBlockno, 0);
};

stag
:  identifier  {  /* add name to structure table */
     $$ = findSymWithBlock (StructTab,$1,currBlockno);
     if (! $$ ) {
       $$ = newStruct($1->name) ;
       $$->level = NestLevel ;
       addSym (StructTab, $$, $$->tag,$$->level,currBlockno,0);
     }
};


struct_declaration_list
   : struct_declaration
   | struct_declaration_list struct_declaration
       {
	   symbol *sym = $2;
	   /* go to the end of the chain */
	   while (sym->next) sym = sym->next;

           sym->next = $1 ;
           $$ = $2;
       }
   ;

struct_declaration
   : type_specifier_list struct_declarator_list ';'
       {
           /* add this type to all the symbols */
           symbol *sym ;
           for ( sym = $2 ; sym != NULL ; sym = sym->next ) {
	       
	       /* make the symbol one level up */
	       sym->level-- ;

	       pointerTypes(sym->type,copyLinkChain($1));
	       if (!sym->type) {
		   sym->type = copyLinkChain($1);
		   sym->etype = getSpec(sym->type);
	       }
	       else
		   addDecl (sym,0,cloneSpec($1));   	       
	       /* make sure the type is complete and sane */
	       checkTypeSanity(sym->etype, sym->name);
	   }
           $$ = $2;
       }
   ;

struct_declarator_list
   : struct_declarator
   | struct_declarator_list ',' struct_declarator
       {
           $3->next  = $1 ;
           $$ = $3 ;
       }
   ;

struct_declarator
   : declarator 
   | ':' constant_expr  {  
                           $$ = newSymbol (genSymName(NestLevel),NestLevel) ; 
                           $$->bitVar = (int) floatFromVal(constExprValue($2,TRUE));
                        }                        
   | declarator ':' constant_expr 
                        { 
			  $1->bitVar = (int) floatFromVal(constExprValue($3,TRUE));			
                        }
   ;

enum_specifier
   : ENUM            '{' enumerator_list '}' {
                                                addSymChain ($3);
                                                allocVariables(reverseSyms($3)) ;
                                                $$ = copyLinkChain(cenum->type);
                                             }
   | ENUM identifier '{' enumerator_list '}' {
                                                symbol *csym ;

                                                $2->type = copyLinkChain(cenum->type);
                                                $2->etype = getSpec($2->type);
                                                /* add this to the enumerator table */
                                                if (!(csym=findSym(enumTab,$2,$2->name)) && 
						    (csym && csym->level == $2->level))
                                                   werror(E_DUPLICATE_TYPEDEF,csym->name);

                                                addSym ( enumTab,$2,$2->name,$2->level,$2->block, 0);
						addSymChain ($4);
                                                allocVariables (reverseSyms($4));
                                                $$ = copyLinkChain(cenum->type);
                                                SPEC_SCLS(getSpec($$)) = 0 ;
                                             }
   | ENUM identifier                         {
                                                symbol *csym ;

                                                /* check the enumerator table */
                                                if ((csym = findSym(enumTab,$2,$2->name)))
                                                   $$ = copyLinkChain(csym->type);
                                                else  {
                                                   $$ = newLink() ;
                                                   $$->class = SPECIFIER   ;
                                                   SPEC_NOUN($$) = V_INT   ;
                                                }

                                                SPEC_SCLS(getSpec($$)) = 0 ;
                                             }
   ;

enumerator_list
   : enumerator
   | enumerator_list ',' {
                         }
   | enumerator_list ',' enumerator {
                                       $3->next = $1 ;
                                       $$ = $3  ;
                                    }
   ;

enumerator
   : identifier opt_assign_expr  {
                                    /* make the symbol one level up */
                                    $1->level-- ;
                                    $1->type = copyLinkChain($2->type); 
                                    $1->etype= getSpec($1->type);
				    SPEC_ENUM($1->etype) = 1;
                                    $$ = $1 ;

                                 }
   ;

opt_assign_expr
   :  '='   constant_expr  {
                              value *val ;
							
                              val = constExprValue($2,TRUE);                         
                              $$ = cenum = val ;
                           }                           
   |                       {                              
                              if (cenum)  {
                                 sprintf(lbuff,"%d",(int) floatFromVal(cenum)+1);
                                 $$ = cenum = constVal(lbuff);
                              }
                              else {
                                 sprintf(lbuff,"%d",0);
                                 $$ = cenum = constVal(lbuff);
                              }   
                           }
   ;

declarator
   : declarator2_function_attributes	{ $$ = $1; }
   | pointer declarator2_function_attributes
         {
	     addDecl ($2,0,reverseLink($1));
	     $$ = $2 ;
         }
   ;

declarator2_function_attributes
   : declarator2		  { $$ = $1 ; } 
   | declarator2 function_attribute  { 
       // copy the functionAttributes (not the args and hasVargs !!)
       sym_link *funcType=$1->etype;
       struct value *args=FUNC_ARGS(funcType);
       unsigned hasVargs=FUNC_HASVARARGS(funcType);

       memcpy (&funcType->funcAttrs, &$2->funcAttrs, 
	       sizeof($2->funcAttrs));

       FUNC_ARGS(funcType)=args;
       FUNC_HASVARARGS(funcType)=hasVargs;

       // just to be sure
       memset (&$2->funcAttrs, 0,
	       sizeof($2->funcAttrs));
       
       addDecl ($1,0,$2); 
   }     
   ;

declarator2
   : identifier
   | '(' declarator ')'     { $$ = $2; }
   | declarator2 '[' ']'
         {
            sym_link   *p;

            p = newLink ();
            DCL_TYPE(p) = ARRAY ;
            DCL_ELEM(p) = 0     ;
            addDecl($1,0,p);
         }
   | declarator2 '[' constant_expr ']'
         {
            sym_link   *p ;
			value *tval;
			
            p = (tval = constExprValue($3,TRUE))->etype;
            /* if it is not a constant then Error  */
            if ( SPEC_SCLS(p) != S_LITERAL)
               werror(E_CONST_EXPECTED) ;
            else {
               p = newLink ();
               DCL_TYPE(p) = ARRAY ;
               DCL_ELEM(p) = (int) floatFromVal(tval) ;
               addDecl($1,0,p);
            }		                
         }
   | declarator2 '('  ')'	{  addDecl ($1,FUNCTION,NULL) ;   }
   | declarator2 '(' { NestLevel++ ; currBlockno++; } parameter_type_list ')'
         {
	   
	     addDecl ($1,FUNCTION,NULL) ;
	   
	     FUNC_HASVARARGS($1->type) = IS_VARG($4);
	     FUNC_ARGS($1->type) = reverseVal($4);
	     
	     /* nest level was incremented to take care of the parms  */
	     NestLevel-- ;
	     currBlockno--;

	     // if this was a pointer (to a function)
	     if (IS_PTR($1->type)) {
	       // move the args and hasVargs to the function
	       FUNC_ARGS($1->etype)=FUNC_ARGS($1->type);
	       FUNC_HASVARARGS($1->etype)=FUNC_HASVARARGS($1->type);
	       memset (&$1->type->funcAttrs, 0,
		       sizeof($1->type->funcAttrs));
	       // remove the symbol args (if any)
	       cleanUpLevel(SymbolTab,NestLevel+1);
	     }
	     
	     $$ = $1;
         }
   | declarator2 '(' parameter_identifier_list ')'
         {	   
	   werror(E_OLD_STYLE,$1->name) ;	  
	   
	   /* assume it returns an int */
	   $1->type = $1->etype = newIntLink();
	   $$ = $1 ;
         }
   ;

pointer
   : unqualified_pointer { $$ = $1 ;}
   | unqualified_pointer type_specifier_list   
         {
	     $$ = $1  ;		
	     DCL_TSPEC($1) = $2;
	 }
   | unqualified_pointer pointer         
         {
	     $$ = $1 ;		
	     $$->next = $2 ;
	     DCL_TYPE($2)=GPOINTER;
	 }
   | unqualified_pointer type_specifier_list pointer
         {
	     $$ = $1 ;  	     
	     if (IS_SPEC($2) && DCL_TYPE($3) == UPOINTER) {
		 DCL_PTR_CONST($1) = SPEC_CONST($2);
		 DCL_PTR_VOLATILE($1) = SPEC_VOLATILE($2);
		 switch (SPEC_SCLS($2)) {
		 case S_XDATA:
		     DCL_TYPE($3) = FPOINTER;
		     break;
		 case S_IDATA:
		     DCL_TYPE($3) = IPOINTER ;
		     break;
		 case S_PDATA:
		     DCL_TYPE($3) = PPOINTER ;
		     break;
		 case S_DATA:
		     DCL_TYPE($3) = POINTER ;
		     break;
		 case S_CODE:
		     DCL_PTR_CONST($3) = 1;
		     DCL_TYPE($3) = CPOINTER ;
		     break;
		 case S_EEPROM:
		     DCL_TYPE($3) = EEPPOINTER;
		     break;
		 default:
		   // this could be just "constant" 
		   // werror(W_PTR_TYPE_INVALID);
		     ;
		     break;
		 }
	     }
	     else 
		 werror (W_PTR_TYPE_INVALID);
	     $$->next = $3 ;
	 }
   ;

unqualified_pointer
   :  '*'   
      {
	$$ = newLink();
	DCL_TYPE($$)=UPOINTER;
      }
   ;

type_specifier_list
   : type_specifier
   //| type_specifier_list type_specifier         {  $$ = mergeSpec ($1,$2, "type_specifier_list"); }
   | type_specifier_list type_specifier {
     /* if the decl $2 is not a specifier */
     /* find the spec and replace it      */
     if ( !IS_SPEC($2)) {
       sym_link *lnk = $2 ;
       while (lnk && !IS_SPEC(lnk->next))
	 lnk = lnk->next;
       lnk->next = mergeSpec($1,lnk->next, "type_specifier_list");
       $$ = $2 ;
     }
     else
       $$ = mergeSpec($1,$2, "type_specifier_list");
   }
   ;

parameter_identifier_list
   : identifier_list
   | identifier_list ',' ELIPSIS
   ;

identifier_list
   : identifier
   | identifier_list ',' identifier         
         {            
	   $3->next = $1;
	   $$ = $3 ;
         }
   ;

parameter_type_list
	: parameter_list
	| parameter_list ',' VAR_ARGS { $1->vArgs = 1;}
	;

parameter_list
   : parameter_declaration 
   | parameter_list ',' parameter_declaration
         {
            $3->next = $1 ;
            $$ = $3 ;	    
         }
   ;

parameter_declaration
   : type_specifier_list declarator 
               {	
		  symbol *loop ;
		  pointerTypes($2->type,$1);
                  addDecl ($2,0,$1);		  
		  for (loop=$2;loop;loop->_isparm=1,loop=loop->next);
		  addSymChain ($2);
		  $$ = symbolVal($2);
               }
   | type_name { 
                  $$ = newValue() ; 
                  $$->type = $1;
                  $$->etype = getSpec($$->type);
               }
   ;

type_name
   : type_specifier_list  { $$ = $1 ;}
   | type_specifier_list abstract_declarator 
               {
		 /* go to the end of the list */
		 sym_link *p;
		 pointerTypes($2,$1);
		 for ( p = $2 ; p->next ; p=p->next);
                  p->next = $1 ;
                  $$ = $2 ;
               }   
   ;

abstract_declarator
   : pointer { $$ = reverseLink($1); }
   | abstract_declarator2
   | pointer abstract_declarator2   { $1 = reverseLink($1); $1->next = $2 ; $$ = $1;} 
   ;

abstract_declarator2
   : '(' abstract_declarator ')'    { $$ = $2 ; }
   | '[' ']'                        {             
                                       $$ = newLink ();
                                       DCL_TYPE($$) = ARRAY ;
                                       DCL_ELEM($$) = 0     ;
                                    }
   | '[' constant_expr ']'          { 
                                       value *val ;
                                       $$ = newLink ();
                                       DCL_TYPE($$) = ARRAY ;
                                       DCL_ELEM($$) = (int) floatFromVal(val = constExprValue($2,TRUE));
                                    }
   | abstract_declarator2 '[' ']'   {
                                       $$ = newLink ();
                                       DCL_TYPE($$) = ARRAY ;
                                       DCL_ELEM($$) = 0     ;
                                       $$->next = $1 ;
                                    }
   | abstract_declarator2 '[' constant_expr ']'
                                    {
                                       value *val ;
                                       $$ = newLink ();
                                       DCL_TYPE($$) = ARRAY ;
                                       DCL_ELEM($$) = (int) floatFromVal(val = constExprValue($3,TRUE));
                                       $$->next = $1 ;
                                    }
   | '(' ')'                        { $$ = NULL;}
   | '(' parameter_type_list ')'    { $$ = NULL;}   
   | abstract_declarator2 '(' ')' {
     // $1 must be a pointer to a function
     sym_link *p=newLink();
     DCL_TYPE(p) = FUNCTION;
     $1->next=p;
   }
   | abstract_declarator2 '(' parameter_type_list ')' {
     if (!IS_VOID($3->type)) {
       // this is nonsense, so let's just burp something
       werror(E_TOO_FEW_PARMS);
     } else {
       // $1 must be a pointer to a function
       sym_link *p=newLink();
       DCL_TYPE(p) = FUNCTION;
       $1->next=p;
     }
   }

initializer
   : assignment_expr                { $$ = newiList(INIT_NODE,$1); }
   | '{'  initializer_list '}'      { $$ = newiList(INIT_DEEP,revinit($2)); }
   | '{'  initializer_list ',' '}'  { $$ = newiList(INIT_DEEP,revinit($2)); }
   ;

initializer_list
   : initializer
   | initializer_list ',' initializer  {  $3->next = $1; $$ = $3; }
   ;

statement
   : labeled_statement
   | compound_statement
   | expression_statement
   | selection_statement
   | iteration_statement
   | jump_statement
   | INLINEASM  ';'      {
                            ast *ex = newNode(INLINEASM,NULL,NULL);
			    ex->values.inlineasm = malloc(strlen($1)+1);
			    strcpy(ex->values.inlineasm,$1);			    
			    $$ = ex;
                         } 
   ;

labeled_statement
//   : identifier ':' statement          {  $$ = createLabel($1,$3);  }   
   : identifier ':'                    {  $$ = createLabel($1,NULL);  }   
   | CASE constant_expr ':' statement  {  $$ = createCase(STACK_PEEK(swStk),$2,$4); }
   | DEFAULT ':' statement             {  $$ = createDefault(STACK_PEEK(swStk),$3); }
   ;

start_block : '{' { STACK_PUSH(blockNum,currBlockno); currBlockno = ++blockNo ;  }
            ;

end_block   : '}'     { currBlockno = STACK_POP(blockNum); }           
            ;

compound_statement
   : start_block end_block                    { $$ = createBlock(NULL,NULL); }
   | start_block statement_list end_block     { $$ = createBlock(NULL,$2) ;  }
   | start_block 
          declaration_list                    { addSymChain($2); }
     end_block                                { $$ = createBlock($2,NULL) ;  }
   | start_block 
          declaration_list                    {  addSymChain ($2); }
          statement_list   
     end_block                                {$$ = createBlock($2,$4)   ;  }
   | error ';'			              { $$ = NULL ; }
   ;

declaration_list
   : declaration	
     {
       /* if this is typedef declare it immediately */
       if ( $1 && IS_TYPEDEF($1->etype)) {
	 allocVariables ($1);
	 $$ = NULL ;
       }
       else
	 $$ = $1 ;
     }

   | declaration_list declaration
     {
       symbol   *sym;
       
       /* if this is a typedef */
       if ($2 && IS_TYPEDEF($2->etype)) {
	 allocVariables ($2);
	 $$ = $1 ;
       }
       else {
				/* get to the end of the previous decl */
	 if ( $1 ) {
	   $$ = sym = $1 ;
	   while (sym->next)
	     sym = sym->next ;
	   sym->next = $2;
	 } 
	 else
	   $$ = $2 ;
       }
     }
   ;

statement_list
   : statement
   | statement_list statement          {  $$ = newNode(NULLOP,$1,$2) ;}
   ;

expression_statement
   : ';'                { $$ = NULL;}
   | expr ';' 
   ;

else_statement
   :  ELSE  statement   { $$ = $2  ; }
   |                    { $$ = NULL;}
   ;

  
selection_statement
   : IF '(' expr ')'  statement else_statement { noLineno++ ; $$ = createIf ($3, $5, $6 ); noLineno--;}
   | SWITCH '(' expr ')'   { 
                              ast *ex ;                              
                              static   int swLabel = 0 ;

                              /* create a node for expression  */
                              ex = newNode(SWITCH,$3,NULL);
                              STACK_PUSH(swStk,ex);   /* save it in the stack */
                              ex->values.switchVals.swNum = swLabel ;
                                 
                              /* now create the label */
                              sprintf(lbuff,"_swBrk_%d",swLabel++);
                              $<sym>$  =  newSymbol(lbuff,NestLevel);
                              /* put label in the break stack  */
                              STACK_PUSH(breakStack,$<sym>$);   
                           }
     statement             {  
                              /* get back the switch form the stack  */
                              $$ = STACK_POP(swStk)  ;
                              $$->right = newNode (NULLOP,$6,createLabel($<sym>5,NULL));
                              STACK_POP(breakStack);   
                           }
	;

while : WHILE  {  /* create and push the continue , break & body labels */
                  static int Lblnum = 0 ;
		  /* continue */
                  sprintf (lbuff,"_whilecontinue_%d",Lblnum);
		  STACK_PUSH(continueStack,newSymbol(lbuff,NestLevel));
		  /* break */
		  sprintf (lbuff,"_whilebreak_%d",Lblnum);
		  STACK_PUSH(breakStack,newSymbol(lbuff,NestLevel));
		  /* body */
		  sprintf (lbuff,"_whilebody_%d",Lblnum++);
		  $$ = newSymbol(lbuff,NestLevel);
               }

do : DO {  /* create and push the continue , break & body Labels */
           static int Lblnum = 0 ;

	   /* continue */
	   sprintf(lbuff,"_docontinue_%d",Lblnum);
	   STACK_PUSH(continueStack,newSymbol(lbuff,NestLevel));
	   /* break */
	   sprintf (lbuff,"_dobreak_%d",Lblnum);
	   STACK_PUSH(breakStack,newSymbol(lbuff,NestLevel));
	   /* do body */
	   sprintf (lbuff,"_dobody_%d",Lblnum++);
	   $$ = newSymbol (lbuff,NestLevel);	   
        }
for : FOR { /* create & push continue, break & body labels */
            static int Lblnum = 0 ;
         
            /* continue */
	    sprintf (lbuff,"_forcontinue_%d",Lblnum);
	    STACK_PUSH(continueStack,newSymbol(lbuff,NestLevel));
	    /* break    */
	    sprintf (lbuff,"_forbreak_%d",Lblnum);
	    STACK_PUSH(breakStack,newSymbol(lbuff,NestLevel));
	    /* body */
	    sprintf (lbuff,"_forbody_%d",Lblnum);
	    $$ = newSymbol(lbuff,NestLevel);
	    /* condition */
	    sprintf (lbuff,"_forcond_%d",Lblnum++);
	    STACK_PUSH(forStack,newSymbol(lbuff,NestLevel));
          }

iteration_statement  
   : while '(' expr ')'  statement 
                         { 
			   noLineno++ ;
			   $$ = createWhile ( $1, STACK_POP(continueStack),
					      STACK_POP(breakStack), $3, $5 ); 
			   $$->lineno = $1->lineDef ;
			   noLineno-- ;
			 }
   | do statement   WHILE '(' expr ')' ';' 
                        { 
			  noLineno++ ; 
			  $$ = createDo ( $1 , STACK_POP(continueStack), 
					  STACK_POP(breakStack), $5, $2);
			  $$->lineno = $1->lineDef ;
			  noLineno-- ;
			}						  
   | for '(' expr_opt	';' expr_opt ';' expr_opt ')'  statement   
                        {
			  noLineno++ ;	
			  
			  /* if break or continue statement present
			     then create a general case loop */
			  if (STACK_PEEK(continueStack)->isref ||
			      STACK_PEEK(breakStack)->isref) {
			      $$ = createFor ($1, STACK_POP(continueStack),
					      STACK_POP(breakStack) ,
					      STACK_POP(forStack)   ,
					      $3 , $5 , $7, $9 );
			  } else {
			      $$ = newNode(FOR,$9,NULL);
			      AST_FOR($$,trueLabel) = $1;
			      AST_FOR($$,continueLabel) =  STACK_POP(continueStack);
			      AST_FOR($$,falseLabel) = STACK_POP(breakStack);
			      AST_FOR($$,condLabel)  = STACK_POP(forStack)  ;
			      AST_FOR($$,initExpr)   = $3;
			      AST_FOR($$,condExpr)   = $5;
			      AST_FOR($$,loopExpr)   = $7;
			  }
			  
			  noLineno-- ;
			}
;

expr_opt
	:			{ $$ = NULL ; }
	|	expr
	;

jump_statement          
   : GOTO identifier ';'   { 
                              $2->islbl = 1;
                              $$ = newAst_VALUE(symbolVal($2)); 
                              $$ = newNode(GOTO,$$,NULL);
                           }
   | CONTINUE ';'          {  
       /* make sure continue is in context */
       if (STACK_PEEK(continueStack) == NULL) {
	   werror(E_BREAK_CONTEXT);
	   $$ = NULL;
       }
       else {
	   $$ = newAst_VALUE(symbolVal(STACK_PEEK(continueStack)));      
	   $$ = newNode(GOTO,$$,NULL);
	   /* mark the continue label as referenced */
	   STACK_PEEK(continueStack)->isref = 1;
       }
   }
   | BREAK ';'             { 
       if (STACK_PEEK(breakStack) == NULL) {
	   werror(E_BREAK_CONTEXT);
	   $$ = NULL;
       } else {
	   $$ = newAst_VALUE(symbolVal(STACK_PEEK(breakStack)));
	   $$ = newNode(GOTO,$$,NULL);
	   STACK_PEEK(breakStack)->isref = 1;
       }
   }
   | RETURN ';'            { $$ = newNode(RETURN,NULL,NULL)    ; }
   | RETURN expr ';'       { $$ = newNode(RETURN,NULL,$2) ; } 
   ;

identifier
   : IDENTIFIER   { $$ = newSymbol ($1,NestLevel) ; }
   ;
%%


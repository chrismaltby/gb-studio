/*-------------------------------------------------------------------------
  symtab.h - Header file for symbol table for sdcdb ( debugger )
	      Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1999)

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

#ifndef  SYMTAB_H
#define  SYMTAB_H

#define MAX_NEST_LEVEL  256
#define SDCC_NAME_MAX    64

typedef struct structdef {
    char           *tag      ;  /* tag part of structure      */
    unsigned char  level     ;  /* Nesting level         */
    struct symbol  *fields   ;  /* pointer to fields     */
    unsigned       size      ;  /* sizeof the table in bytes  */
    char           *sname    ;  /* scope name */
    char           scopetype ;  /* scope type 'G' or 'F' */
} structdef ;

/* noun definitions */
enum  { V_INT   =  0,
	V_FLOAT     ,
        V_CHAR      ,
        V_VOID      ,
        V_STRUCT    ,
        V_LABEL     ,
        V_BIT       ,
        V_SBIT      };

/* storage class    */
enum  { S_FIXED  =  0,
        S_AUTO       ,
        S_REGISTER   ,        
        S_CONSTANT   ,
        S_SFR        ,
        S_SBIT       ,
        S_CODE       ,
        S_XDATA      ,
        S_DATA       ,
        S_IDATA      ,
        S_PDATA      ,
        S_LITERAL    ,
        S_STACK      ,
        S_XSTACK     ,
        S_BIT        };

/* specifier is the last in the type-chain */
typedef struct specifier {
    unsigned    noun        ;  /* CHAR INT STRUCTURE LABEL   */
    unsigned    sclass      ;  /* REGISTER,AUTO,FIX,CONSTANT */
    unsigned    _long : 1   ;  /* 1=long            */
    unsigned    _short: 1	;	/* 1=short int	  */
    unsigned _unsigned: 1   ;  /* 1=unsigned, 0=signed       */
    unsigned   _static: 1   ;  /* 1=static keyword found     */
    unsigned   _extern: 1   ;  /* 1=extern found             */
    unsigned   _absadr: 1   ;  /* absolute address specfied  */
    unsigned   _reent : 1   ;  /* function is reentrant      */
    unsigned   _intrtn: 1   ;  /* this is an interrupt routin*/
    unsigned   _rbank : 1   ;  /* seperate register bank     */
    unsigned   _volatile : 1;  /* is marked as volatile      */
    unsigned   _const:1     ;  /* is a constant              */
    unsigned   _critical:1  ;  /* critical function          */
    unsigned   _typedef :1  ;  /* is typedefed               */
    unsigned   _IntNo       ;  /* 1=Interrupt svc routine    */
    short      _regbank     ;  /* register bank 2b used      */
    unsigned   _addr        ;  /* address of symbol          */
    unsigned   _stack       ;  /* stack offset for stacked v */
    unsigned   _bitStart    ;  /* bit start position         */
    int        _bitLength   ;  /* bit length                 */        
    
    struct structdef *v_struct; /* structure pointer      */
} specifier ;

/* types of declarators */
enum {  POINTER   = 0,       /* pointer to near data */
        FPOINTER     ,       /* pointer to far data  */
        CPOINTER     ,       /* pointer to code space */
        GPOINTER     ,       /* _generic pointer     */
        PPOINTER     ,       /* paged area pointer   */
        IPOINTER     ,       /* pointer to upper 128 bytes */
	UPOINTER     ,       /* unknown pointer used only when parsing */
        ARRAY        ,
        FUNCTION     };

typedef struct declarator {
    short    dcl_type;     /* POINTER,ARRAY or FUNCTION  */
    short    num_elem;     /* # of elems if type==array  */
    short    ptr_const :1;   /* pointer is constant        */
    short    ptr_volatile:1; /* pointer is volatile        */
    struct link *tspec;     /* pointer type specifier      */
} declarator ;

#define DECLARATOR   0
#define SPECIFIER    1

typedef struct link {
    unsigned class : 1      ;  /* DECLARATOR or SPECIFIER    */
    unsigned tdef  : 1      ;  /* current link created by    */
    /* typedef if this flag is set*/
    union {
	specifier      s     ;  /* if CLASS == SPECIFIER      */
	declarator     d     ;  /* if CLASS == DECLARATOR     */
    } select ;
    
    struct link    *next    ;  /* next element on the chain  */
} link ;

typedef struct symbol {
    char     *name               ;
    
    short    size               ;
    short    level	       	;  /* declration lev,fld offset */
    short    block              ;  /* sequential block # of defintion */       
    short    isonstack          ;  /* is the variable on stack */
    unsigned isfunc        :1   ;  /* is a functions           */
    unsigned offset		;  /* offset from top if struct */
    unsigned addr               ;  /* address if the symbol */
    unsigned eaddr              ;  /* end address for functions */
    char     addr_type          ;  /* which address space   */
    link     *type              ;  /* start of type chain        */
    link     *etype             ;  /* end of type chain          */
    char      scopetype         ;  /* 'G' global, 'F' - file, 'L' local */
    char     *sname             ;  /* if 'F' or 'L' then scope name */
    char     *rname             ;  /* real name i.e. mangled beyond recognition */
    char     addrspace          ;  /* address space designator      */
    struct symbol *next         ;
} symbol ;

/* size's in bytes  */
#define CHARSIZE    1
#define SHORTSIZE   1
#define INTSIZE     2
#define LONGSIZE    4
#define PTRSIZE     1
#define FPTRSIZE    2
#define GPTRSIZE    3
#define BITSIZE     1
#define FLOATSIZE   4
#define MAXBASESIZE 4

/* Easy Access Macros */
#define DCL_TYPE(l)  l->select.d.dcl_type
#define DCL_ELEM(l)  l->select.d.num_elem
#define DCL_PTR_CONST(l) l->select.d.ptr_const
#define DCL_PTR_VOLATILE(l) l->select.d.ptr_volatile
#define DCL_TSPEC(l) l->select.d.tspec
#define SPEC_NOUN(x) x->select.s.noun 
#define SPEC_LONG(x) x->select.s._long
#define SPEC_SHORT(x) x->select.s._short
#define SPEC_USIGN(x) x->select.s._unsigned
#define SPEC_SCLS(x) x->select.s.sclass
#define SPEC_OCLS(x) x->select.s.oclass 
#define SPEC_STAT(x) x->select.s._static
#define SPEC_EXTR(x) x->select.s._extern
#define SPEC_CODE(x) x->select.s._codesg
#define SPEC_RENT(x) x->select.s._reent
#define SPEC_INTN(x) x->select.s._IntNo
#define SPEC_ABSA(x) x->select.s._absadr
#define SPEC_BANK(x) x->select.s._regbank
#define SPEC_ADDR(x) x->select.s._addr
#define SPEC_STAK(x) x->select.s._stack
#define SPEC_CVAL(x) x->select.s.const_val
#define SPEC_BSTR(x) x->select.s._bitStart
#define SPEC_BLEN(x) x->select.s._bitLength
#define SPEC_BNKF(x) x->select.s._rbank
#define SPEC_INTRTN(x) x->select.s._intrtn
#define SPEC_CRTCL(x) x->select.s._critical
#define SPEC_VOLATILE(x) x->select.s._volatile
#define SPEC_CONST(x) x->select.s._const
#define SPEC_STRUCT(x) x->select.s.v_struct
#define SPEC_TYPEDEF(x) x->select.s._typedef

/* type check macros */
#define IS_DECL(x)   ( x && x->class == DECLARATOR	)
#define IS_SPEC(x)   ( x && x->class == SPECIFIER  )
#define IS_ARRAY(x)  (IS_DECL(x) && DCL_TYPE(x) == ARRAY)
#define IS_PTR(x)    (IS_DECL(x) && (DCL_TYPE(x) == POINTER    ||    \
                                     DCL_TYPE(x) == FPOINTER   ||    \
			             DCL_TYPE(x) == GPOINTER   ||    \
			             DCL_TYPE(x) == IPOINTER   ||    \
			             DCL_TYPE(x) == PPOINTER   ||    \
                                     DCL_TYPE(x) == CPOINTER   ||    \
                                     DCL_TYPE(x) == UPOINTER  ))
#define IS_PTR_CONST(x) (IS_PTR(x) && DCL_PTR_CONST(x))
#define IS_FARPTR(x) (IS_DECL(x) && DCL_TYPE(x) == FPOINTER)
#define IS_GENPTR(x) (IS_DECL(x) && DCL_TYPE(x) == GPOINTER)
#define IS_FUNC(x)   (IS_DECL(x) && DCL_TYPE(x) == FUNCTION)
#define IS_LONG(x)   (IS_SPEC(x) && x->select.s._long)
#define IS_SHORT(x)   (IS_SPEC(x) && x->select.s._short)
#define IS_TYPEDEF(x)(IS_SPEC(x) && x->select.s._typedef)
#define IS_CONSTANT(x)  (IS_SPEC(x) && (x->select.s.sclass == S_CONSTANT ||\
                                        x->select.s._const == 1))
#define IS_STRUCT(x) (IS_SPEC(x) && x->select.s.noun == V_STRUCT)
#define IS_ABSOLUTE(x)  (IS_SPEC(x) && x->select.s._absadr )
#define IS_REGISTER(x)  (IS_SPEC(x) && SPEC_SCLS(x) == S_REGISTER)
#define IS_RENT(x)   (IS_SPEC(x) && x->select.s._reent )
#define IS_STATIC(x) (IS_SPEC(x) && SPEC_STAT(x))
#define IS_INT(x)    (IS_SPEC(x) && x->select.s.noun == V_INT)
#define IS_VOID(x)   (IS_SPEC(x) && x->select.s.noun == V_VOID)
#define IS_CHAR(x)   (IS_SPEC(x) && x->select.s.noun == V_CHAR)
#define IS_EXTERN(x)	(IS_SPEC(x) && x->select.s._extern)
#define IS_VOLATILE(x)  (IS_SPEC(x) && x->select.s._volatile )
#define IS_INTEGRAL(x) (IS_SPEC(x) && (x->select.s.noun == V_INT ||  \
                                       x->select.s.noun == V_CHAR || \
                                       x->select.s.noun == V_BIT ||  \
                                       x->select.s.noun == V_SBIT ))
#define IS_BITFIELD(x) (IS_SPEC(x) && (x->select.s.noun == V_BIT))
#define IS_BITVAR(x) (IS_SPEC(x) && (x->select.s.noun  == V_BIT ||   \
                                     x->select.s.noun == V_SBIT ))
#define IS_FLOAT(x)  (IS_SPEC(x) && x->select.s.noun == V_FLOAT)
#define IS_ARITHMETIC(x) (IS_INTEGRAL(x) || IS_FLOAT(x))
#define IS_AGGREGATE(x) (IS_ARRAY(x) || IS_STRUCT(x))
#define IS_LITERAL(x)   (IS_SPEC(x)  && x->select.s.sclass == S_LITERAL)
#define IS_ISR(x)		(IS_SPEC(x)  && SPEC_INTRTN(x))


symbol *parseSymbol (char *, char **);
structdef *parseStruct (char *);
void parseFunc (char *);
module *parseModule (char *, bool  );
void parseLnkRec (char *);
symbol *symLookup (char *,context *);

DEFSETFUNC(moduleWithName);
DEFSETFUNC(moduleWithCName);
DEFSETFUNC(moduleWithAsmName);
unsigned int   getSize ( link * );

#endif

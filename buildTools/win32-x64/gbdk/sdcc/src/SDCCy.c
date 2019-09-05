/* A Bison parser, made by GNU Bison 3.4.1.  */

/* Bison implementation for Yacc-like parsers in C

   Copyright (C) 1984, 1989-1990, 2000-2015, 2018-2019 Free Software Foundation,
   Inc.

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.  */

/* As a special exception, you may create a larger work that contains
   part or all of the Bison parser skeleton and distribute that work
   under terms of your choice, so long as that work isn't itself a
   parser generator using the skeleton or a modified version thereof
   as a parser skeleton.  Alternatively, if you modify or redistribute
   the parser skeleton itself, you may (at your option) remove this
   special exception, which will cause the skeleton and the resulting
   Bison output files to be licensed under the GNU General Public
   License without this special exception.

   This special exception was added by the Free Software Foundation in
   version 2.2 of Bison.  */

/* C LALR(1) parser skeleton written by Richard Stallman, by
   simplifying the original so-called "semantic" parser.  */

/* All symbols defined below should begin with yy or YY, to avoid
   infringing on user name space.  This should be done even for local
   variables, as they might otherwise be expanded by user macros.
   There are some unavoidable exceptions within include files to
   define necessary library symbols; they are noted "INFRINGES ON
   USER NAME SPACE" below.  */

/* Undocumented macros, especially those whose name start with YY_,
   are private implementation details.  Do not rely on them.  */

/* Identify Bison output.  */
#define YYBISON 1

/* Bison version.  */
#define YYBISON_VERSION "3.4.1"

/* Skeleton name.  */
#define YYSKELETON_NAME "yacc.c"

/* Pure parsers.  */
#define YYPURE 0

/* Push parsers.  */
#define YYPUSH 0

/* Pull parsers.  */
#define YYPULL 1




/* First part of user prologue.  */
#line 24 "SDCC.y"

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


#line 108 "SDCCy.c"

# ifndef YY_NULLPTR
#  if defined __cplusplus
#   if 201103L <= __cplusplus
#    define YY_NULLPTR nullptr
#   else
#    define YY_NULLPTR 0
#   endif
#  else
#   define YY_NULLPTR ((void*)0)
#  endif
# endif

/* Enabling verbose error messages.  */
#ifdef YYERROR_VERBOSE
# undef YYERROR_VERBOSE
# define YYERROR_VERBOSE 1
#else
# define YYERROR_VERBOSE 0
#endif

/* Use api.header.include to #include this header
   instead of duplicating it here.  */
#ifndef YY_YY_SDCCY_H_INCLUDED
# define YY_YY_SDCCY_H_INCLUDED
/* Debug traces.  */
#ifndef YYDEBUG
# define YYDEBUG 0
#endif
#if YYDEBUG
extern int yydebug;
#endif

/* Token type.  */
#ifndef YYTOKENTYPE
# define YYTOKENTYPE
  enum yytokentype
  {
    IDENTIFIER = 258,
    TYPE_NAME = 259,
    CONSTANT = 260,
    STRING_LITERAL = 261,
    SIZEOF = 262,
    PTR_OP = 263,
    INC_OP = 264,
    DEC_OP = 265,
    LEFT_OP = 266,
    RIGHT_OP = 267,
    LE_OP = 268,
    GE_OP = 269,
    EQ_OP = 270,
    NE_OP = 271,
    AND_OP = 272,
    OR_OP = 273,
    MUL_ASSIGN = 274,
    DIV_ASSIGN = 275,
    MOD_ASSIGN = 276,
    ADD_ASSIGN = 277,
    SUB_ASSIGN = 278,
    LEFT_ASSIGN = 279,
    RIGHT_ASSIGN = 280,
    AND_ASSIGN = 281,
    XOR_ASSIGN = 282,
    OR_ASSIGN = 283,
    TYPEDEF = 284,
    EXTERN = 285,
    STATIC = 286,
    AUTO = 287,
    REGISTER = 288,
    CODE = 289,
    EEPROM = 290,
    INTERRUPT = 291,
    SFR = 292,
    AT = 293,
    SBIT = 294,
    REENTRANT = 295,
    USING = 296,
    XDATA = 297,
    DATA = 298,
    IDATA = 299,
    PDATA = 300,
    VAR_ARGS = 301,
    CRITICAL = 302,
    NONBANKED = 303,
    BANKED = 304,
    CHAR = 305,
    SHORT = 306,
    INT = 307,
    LONG = 308,
    SIGNED = 309,
    UNSIGNED = 310,
    FLOAT = 311,
    DOUBLE = 312,
    CONST = 313,
    VOLATILE = 314,
    VOID = 315,
    BIT = 316,
    STRUCT = 317,
    UNION = 318,
    ENUM = 319,
    ELIPSIS = 320,
    RANGE = 321,
    FAR = 322,
    CASE = 323,
    DEFAULT = 324,
    IF = 325,
    ELSE = 326,
    SWITCH = 327,
    WHILE = 328,
    DO = 329,
    FOR = 330,
    GOTO = 331,
    CONTINUE = 332,
    BREAK = 333,
    RETURN = 334,
    NAKED = 335,
    INLINEASM = 336,
    IFX = 337,
    ADDRESS_OF = 338,
    GET_VALUE_AT_ADDRESS = 339,
    SPIL = 340,
    UNSPIL = 341,
    GETHBIT = 342,
    BITWISEAND = 343,
    UNARYMINUS = 344,
    IPUSH = 345,
    IPOP = 346,
    PCALL = 347,
    ENDFUNCTION = 348,
    JUMPTABLE = 349,
    RRC = 350,
    RLC = 351,
    CAST = 352,
    CALL = 353,
    PARAM = 354,
    NULLOP = 355,
    BLOCK = 356,
    LABEL = 357,
    RECEIVE = 358,
    SEND = 359,
    ARRAYINIT = 360
  };
#endif
/* Tokens.  */
#define IDENTIFIER 258
#define TYPE_NAME 259
#define CONSTANT 260
#define STRING_LITERAL 261
#define SIZEOF 262
#define PTR_OP 263
#define INC_OP 264
#define DEC_OP 265
#define LEFT_OP 266
#define RIGHT_OP 267
#define LE_OP 268
#define GE_OP 269
#define EQ_OP 270
#define NE_OP 271
#define AND_OP 272
#define OR_OP 273
#define MUL_ASSIGN 274
#define DIV_ASSIGN 275
#define MOD_ASSIGN 276
#define ADD_ASSIGN 277
#define SUB_ASSIGN 278
#define LEFT_ASSIGN 279
#define RIGHT_ASSIGN 280
#define AND_ASSIGN 281
#define XOR_ASSIGN 282
#define OR_ASSIGN 283
#define TYPEDEF 284
#define EXTERN 285
#define STATIC 286
#define AUTO 287
#define REGISTER 288
#define CODE 289
#define EEPROM 290
#define INTERRUPT 291
#define SFR 292
#define AT 293
#define SBIT 294
#define REENTRANT 295
#define USING 296
#define XDATA 297
#define DATA 298
#define IDATA 299
#define PDATA 300
#define VAR_ARGS 301
#define CRITICAL 302
#define NONBANKED 303
#define BANKED 304
#define CHAR 305
#define SHORT 306
#define INT 307
#define LONG 308
#define SIGNED 309
#define UNSIGNED 310
#define FLOAT 311
#define DOUBLE 312
#define CONST 313
#define VOLATILE 314
#define VOID 315
#define BIT 316
#define STRUCT 317
#define UNION 318
#define ENUM 319
#define ELIPSIS 320
#define RANGE 321
#define FAR 322
#define CASE 323
#define DEFAULT 324
#define IF 325
#define ELSE 326
#define SWITCH 327
#define WHILE 328
#define DO 329
#define FOR 330
#define GOTO 331
#define CONTINUE 332
#define BREAK 333
#define RETURN 334
#define NAKED 335
#define INLINEASM 336
#define IFX 337
#define ADDRESS_OF 338
#define GET_VALUE_AT_ADDRESS 339
#define SPIL 340
#define UNSPIL 341
#define GETHBIT 342
#define BITWISEAND 343
#define UNARYMINUS 344
#define IPUSH 345
#define IPOP 346
#define PCALL 347
#define ENDFUNCTION 348
#define JUMPTABLE 349
#define RRC 350
#define RLC 351
#define CAST 352
#define CALL 353
#define PARAM 354
#define NULLOP 355
#define BLOCK 356
#define LABEL 357
#define RECEIVE 358
#define SEND 359
#define ARRAYINIT 360

/* Value type.  */
#if ! defined YYSTYPE && ! defined YYSTYPE_IS_DECLARED
union YYSTYPE
{
#line 63 "SDCC.y"

    symbol     *sym ;      /* symbol table pointer       */
    structdef  *sdef;      /* structure definition       */
    char       yychar[SDCC_NAME_MAX+1];
    sym_link       *lnk ;      /* declarator  or specifier   */
    int        yyint;      /* integer value returned     */
    value      *val ;      /* for integer constant       */
    initList   *ilist;     /* initial list               */
    char       *yyinline; /* inlined assembler code */
    ast       *asts;     /* expression tree            */

#line 373 "SDCCy.c"

};
typedef union YYSTYPE YYSTYPE;
# define YYSTYPE_IS_TRIVIAL 1
# define YYSTYPE_IS_DECLARED 1
#endif


extern YYSTYPE yylval;

int yyparse (void);

#endif /* !YY_YY_SDCCY_H_INCLUDED  */



#ifdef short
# undef short
#endif

#ifdef YYTYPE_UINT8
typedef YYTYPE_UINT8 yytype_uint8;
#else
typedef unsigned char yytype_uint8;
#endif

#ifdef YYTYPE_INT8
typedef YYTYPE_INT8 yytype_int8;
#else
typedef signed char yytype_int8;
#endif

#ifdef YYTYPE_UINT16
typedef YYTYPE_UINT16 yytype_uint16;
#else
typedef unsigned short yytype_uint16;
#endif

#ifdef YYTYPE_INT16
typedef YYTYPE_INT16 yytype_int16;
#else
typedef short yytype_int16;
#endif

#ifndef YYSIZE_T
# ifdef __SIZE_TYPE__
#  define YYSIZE_T __SIZE_TYPE__
# elif defined size_t
#  define YYSIZE_T size_t
# elif ! defined YYSIZE_T
#  include <stddef.h> /* INFRINGES ON USER NAME SPACE */
#  define YYSIZE_T size_t
# else
#  define YYSIZE_T unsigned
# endif
#endif

#define YYSIZE_MAXIMUM ((YYSIZE_T) -1)

#ifndef YY_
# if defined YYENABLE_NLS && YYENABLE_NLS
#  if ENABLE_NLS
#   include <libintl.h> /* INFRINGES ON USER NAME SPACE */
#   define YY_(Msgid) dgettext ("bison-runtime", Msgid)
#  endif
# endif
# ifndef YY_
#  define YY_(Msgid) Msgid
# endif
#endif

#ifndef YY_ATTRIBUTE
# if (defined __GNUC__                                               \
      && (2 < __GNUC__ || (__GNUC__ == 2 && 96 <= __GNUC_MINOR__)))  \
     || defined __SUNPRO_C && 0x5110 <= __SUNPRO_C
#  define YY_ATTRIBUTE(Spec) __attribute__(Spec)
# else
#  define YY_ATTRIBUTE(Spec) /* empty */
# endif
#endif

#ifndef YY_ATTRIBUTE_PURE
# define YY_ATTRIBUTE_PURE   YY_ATTRIBUTE ((__pure__))
#endif

#ifndef YY_ATTRIBUTE_UNUSED
# define YY_ATTRIBUTE_UNUSED YY_ATTRIBUTE ((__unused__))
#endif

/* Suppress unused-variable warnings by "using" E.  */
#if ! defined lint || defined __GNUC__
# define YYUSE(E) ((void) (E))
#else
# define YYUSE(E) /* empty */
#endif

#if defined __GNUC__ && ! defined __ICC && 407 <= __GNUC__ * 100 + __GNUC_MINOR__
/* Suppress an incorrect diagnostic about yylval being uninitialized.  */
# define YY_IGNORE_MAYBE_UNINITIALIZED_BEGIN \
    _Pragma ("GCC diagnostic push") \
    _Pragma ("GCC diagnostic ignored \"-Wuninitialized\"")\
    _Pragma ("GCC diagnostic ignored \"-Wmaybe-uninitialized\"")
# define YY_IGNORE_MAYBE_UNINITIALIZED_END \
    _Pragma ("GCC diagnostic pop")
#else
# define YY_INITIAL_VALUE(Value) Value
#endif
#ifndef YY_IGNORE_MAYBE_UNINITIALIZED_BEGIN
# define YY_IGNORE_MAYBE_UNINITIALIZED_BEGIN
# define YY_IGNORE_MAYBE_UNINITIALIZED_END
#endif
#ifndef YY_INITIAL_VALUE
# define YY_INITIAL_VALUE(Value) /* Nothing. */
#endif


#define YY_ASSERT(E) ((void) (0 && (E)))

#if ! defined yyoverflow || YYERROR_VERBOSE

/* The parser invokes alloca or malloc; define the necessary symbols.  */

# ifdef YYSTACK_USE_ALLOCA
#  if YYSTACK_USE_ALLOCA
#   ifdef __GNUC__
#    define YYSTACK_ALLOC __builtin_alloca
#   elif defined __BUILTIN_VA_ARG_INCR
#    include <alloca.h> /* INFRINGES ON USER NAME SPACE */
#   elif defined _AIX
#    define YYSTACK_ALLOC __alloca
#   elif defined _MSC_VER
#    include <malloc.h> /* INFRINGES ON USER NAME SPACE */
#    define alloca _alloca
#   else
#    define YYSTACK_ALLOC alloca
#    if ! defined _ALLOCA_H && ! defined EXIT_SUCCESS
#     include <stdlib.h> /* INFRINGES ON USER NAME SPACE */
      /* Use EXIT_SUCCESS as a witness for stdlib.h.  */
#     ifndef EXIT_SUCCESS
#      define EXIT_SUCCESS 0
#     endif
#    endif
#   endif
#  endif
# endif

# ifdef YYSTACK_ALLOC
   /* Pacify GCC's 'empty if-body' warning.  */
#  define YYSTACK_FREE(Ptr) do { /* empty */; } while (0)
#  ifndef YYSTACK_ALLOC_MAXIMUM
    /* The OS might guarantee only one guard page at the bottom of the stack,
       and a page size can be as small as 4096 bytes.  So we cannot safely
       invoke alloca (N) if N exceeds 4096.  Use a slightly smaller number
       to allow for a few compiler-allocated temporary stack slots.  */
#   define YYSTACK_ALLOC_MAXIMUM 4032 /* reasonable circa 2006 */
#  endif
# else
#  define YYSTACK_ALLOC YYMALLOC
#  define YYSTACK_FREE YYFREE
#  ifndef YYSTACK_ALLOC_MAXIMUM
#   define YYSTACK_ALLOC_MAXIMUM YYSIZE_MAXIMUM
#  endif
#  if (defined __cplusplus && ! defined EXIT_SUCCESS \
       && ! ((defined YYMALLOC || defined malloc) \
             && (defined YYFREE || defined free)))
#   include <stdlib.h> /* INFRINGES ON USER NAME SPACE */
#   ifndef EXIT_SUCCESS
#    define EXIT_SUCCESS 0
#   endif
#  endif
#  ifndef YYMALLOC
#   define YYMALLOC malloc
#   if ! defined malloc && ! defined EXIT_SUCCESS
void *malloc (YYSIZE_T); /* INFRINGES ON USER NAME SPACE */
#   endif
#  endif
#  ifndef YYFREE
#   define YYFREE free
#   if ! defined free && ! defined EXIT_SUCCESS
void free (void *); /* INFRINGES ON USER NAME SPACE */
#   endif
#  endif
# endif
#endif /* ! defined yyoverflow || YYERROR_VERBOSE */


#if (! defined yyoverflow \
     && (! defined __cplusplus \
         || (defined YYSTYPE_IS_TRIVIAL && YYSTYPE_IS_TRIVIAL)))

/* A type that is properly aligned for any stack member.  */
union yyalloc
{
  yytype_int16 yyss_alloc;
  YYSTYPE yyvs_alloc;
};

/* The size of the maximum gap between one aligned stack and the next.  */
# define YYSTACK_GAP_MAXIMUM (sizeof (union yyalloc) - 1)

/* The size of an array large to enough to hold all stacks, each with
   N elements.  */
# define YYSTACK_BYTES(N) \
     ((N) * (sizeof (yytype_int16) + sizeof (YYSTYPE)) \
      + YYSTACK_GAP_MAXIMUM)

# define YYCOPY_NEEDED 1

/* Relocate STACK from its old location to the new one.  The
   local variables YYSIZE and YYSTACKSIZE give the old and new number of
   elements in the stack, and YYPTR gives the new location of the
   stack.  Advance YYPTR to a properly aligned location for the next
   stack.  */
# define YYSTACK_RELOCATE(Stack_alloc, Stack)                           \
    do                                                                  \
      {                                                                 \
        YYSIZE_T yynewbytes;                                            \
        YYCOPY (&yyptr->Stack_alloc, Stack, yysize);                    \
        Stack = &yyptr->Stack_alloc;                                    \
        yynewbytes = yystacksize * sizeof (*Stack) + YYSTACK_GAP_MAXIMUM; \
        yyptr += yynewbytes / sizeof (*yyptr);                          \
      }                                                                 \
    while (0)

#endif

#if defined YYCOPY_NEEDED && YYCOPY_NEEDED
/* Copy COUNT objects from SRC to DST.  The source and destination do
   not overlap.  */
# ifndef YYCOPY
#  if defined __GNUC__ && 1 < __GNUC__
#   define YYCOPY(Dst, Src, Count) \
      __builtin_memcpy (Dst, Src, (Count) * sizeof (*(Src)))
#  else
#   define YYCOPY(Dst, Src, Count)              \
      do                                        \
        {                                       \
          YYSIZE_T yyi;                         \
          for (yyi = 0; yyi < (Count); yyi++)   \
            (Dst)[yyi] = (Src)[yyi];            \
        }                                       \
      while (0)
#  endif
# endif
#endif /* !YYCOPY_NEEDED */

/* YYFINAL -- State number of the termination state.  */
#define YYFINAL  53
/* YYLAST -- Last index in YYTABLE.  */
#define YYLAST   1777

/* YYNTOKENS -- Number of terminals.  */
#define YYNTOKENS  130
/* YYNNTS -- Number of nonterminals.  */
#define YYNNTS  87
/* YYNRULES -- Number of rules.  */
#define YYNRULES  250
/* YYNSTATES -- Number of states.  */
#define YYNSTATES  388

#define YYUNDEFTOK  2
#define YYMAXUTOK   360

/* YYTRANSLATE(TOKEN-NUM) -- Symbol number corresponding to TOKEN-NUM
   as returned by yylex, with out-of-bounds checking.  */
#define YYTRANSLATE(YYX)                                                \
  ((unsigned) (YYX) <= YYMAXUTOK ? yytranslate[YYX] : YYUNDEFTOK)

/* YYTRANSLATE[TOKEN-NUM] -- Symbol number corresponding to TOKEN-NUM
   as returned by yylex.  */
static const yytype_uint8 yytranslate[] =
{
       0,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,   117,     2,     2,     2,   119,   112,     2,
     106,   107,   113,   114,   111,   115,   110,   118,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,   125,   127,
     120,   126,   121,   124,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,   108,     2,   109,   122,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,   128,   123,   129,   116,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     1,     2,     3,     4,
       5,     6,     7,     8,     9,    10,    11,    12,    13,    14,
      15,    16,    17,    18,    19,    20,    21,    22,    23,    24,
      25,    26,    27,    28,    29,    30,    31,    32,    33,    34,
      35,    36,    37,    38,    39,    40,    41,    42,    43,    44,
      45,    46,    47,    48,    49,    50,    51,    52,    53,    54,
      55,    56,    57,    58,    59,    60,    61,    62,    63,    64,
      65,    66,    67,    68,    69,    70,    71,    72,    73,    74,
      75,    76,    77,    78,    79,    80,    81,    82,    83,    84,
      85,    86,    87,    88,    89,    90,    91,    92,    93,    94,
      95,    96,    97,    98,    99,   100,   101,   102,   103,   104,
     105
};

#if YYDEBUG
  /* YYRLINE[YYN] -- Source line where rule number YYN was defined.  */
static const yytype_uint16 yyrline[] =
{
       0,   126,   126,   127,   131,   134,   159,   164,   173,   174,
     178,   183,   187,   191,   195,   202,   212,   222,   223,   231,
     232,   233,   234,   238,   242,   243,   244,   246,   250,   257,
     263,   265,   270,   271,   275,   276,   277,   278,   279,   280,
     284,   285,   286,   287,   288,   289,   293,   294,   298,   299,
     300,   301,   305,   306,   307,   311,   312,   313,   317,   318,
     323,   328,   333,   341,   342,   347,   355,   356,   360,   361,
     365,   366,   370,   371,   376,   377,   382,   383,   391,   392,
     437,   438,   439,   440,   441,   442,   443,   444,   445,   446,
     447,   451,   452,   456,   460,   461,   478,   479,   492,   493,
     509,   510,   514,   515,   520,   525,   530,   535,   540,   548,
     552,   553,   563,   568,   573,   578,   583,   588,   593,   598,
     603,   608,   613,   618,   623,   628,   633,   638,   643,   652,
     653,   657,   665,   669,   675,   685,   700,   710,   711,   715,
     716,   723,   734,   735,   747,   771,   772,   780,   781,   785,
     792,   797,   813,   830,   831,   833,   840,   852,   858,   871,
     872,   880,   881,   902,   903,   904,   913,   929,   930,   930,
     955,   966,   967,   972,   978,  1018,  1026,  1028,  1044,  1045,
    1049,  1050,  1058,  1059,  1063,  1064,  1072,  1081,  1089,  1090,
    1102,  1103,  1104,  1108,  1109,  1114,  1120,  1126,  1134,  1135,
    1136,  1142,  1155,  1156,  1157,  1161,  1162,  1166,  1167,  1168,
    1169,  1170,  1171,  1172,  1182,  1183,  1184,  1187,  1190,  1194,
    1195,  1197,  1196,  1200,  1199,  1203,  1207,  1218,  1242,  1243,
    1247,  1248,  1252,  1253,  1258,  1259,  1259,  1282,  1295,  1308,
    1326,  1334,  1342,  1370,  1371,  1375,  1380,  1393,  1403,  1404,
    1408
};
#endif

#if YYDEBUG || YYERROR_VERBOSE || 0
/* YYTNAME[SYMBOL-NUM] -- String name of the symbol SYMBOL-NUM.
   First, the terminals, then, starting at YYNTOKENS, nonterminals.  */
static const char *const yytname[] =
{
  "$end", "error", "$undefined", "IDENTIFIER", "TYPE_NAME", "CONSTANT",
  "STRING_LITERAL", "SIZEOF", "PTR_OP", "INC_OP", "DEC_OP", "LEFT_OP",
  "RIGHT_OP", "LE_OP", "GE_OP", "EQ_OP", "NE_OP", "AND_OP", "OR_OP",
  "MUL_ASSIGN", "DIV_ASSIGN", "MOD_ASSIGN", "ADD_ASSIGN", "SUB_ASSIGN",
  "LEFT_ASSIGN", "RIGHT_ASSIGN", "AND_ASSIGN", "XOR_ASSIGN", "OR_ASSIGN",
  "TYPEDEF", "EXTERN", "STATIC", "AUTO", "REGISTER", "CODE", "EEPROM",
  "INTERRUPT", "SFR", "AT", "SBIT", "REENTRANT", "USING", "XDATA", "DATA",
  "IDATA", "PDATA", "VAR_ARGS", "CRITICAL", "NONBANKED", "BANKED", "CHAR",
  "SHORT", "INT", "LONG", "SIGNED", "UNSIGNED", "FLOAT", "DOUBLE", "CONST",
  "VOLATILE", "VOID", "BIT", "STRUCT", "UNION", "ENUM", "ELIPSIS", "RANGE",
  "FAR", "CASE", "DEFAULT", "IF", "ELSE", "SWITCH", "WHILE", "DO", "FOR",
  "GOTO", "CONTINUE", "BREAK", "RETURN", "NAKED", "INLINEASM", "IFX",
  "ADDRESS_OF", "GET_VALUE_AT_ADDRESS", "SPIL", "UNSPIL", "GETHBIT",
  "BITWISEAND", "UNARYMINUS", "IPUSH", "IPOP", "PCALL", "ENDFUNCTION",
  "JUMPTABLE", "RRC", "RLC", "CAST", "CALL", "PARAM", "NULLOP", "BLOCK",
  "LABEL", "RECEIVE", "SEND", "ARRAYINIT", "'('", "')'", "'['", "']'",
  "'.'", "','", "'&'", "'*'", "'+'", "'-'", "'~'", "'!'", "'/'", "'%'",
  "'<'", "'>'", "'^'", "'|'", "'?'", "':'", "'='", "';'", "'{'", "'}'",
  "$accept", "file", "external_definition", "function_definition",
  "function_attribute", "function_attributes", "function_body",
  "primary_expr", "string_literal", "postfix_expr", "argument_expr_list",
  "unary_expr", "unary_operator", "cast_expr", "multiplicative_expr",
  "additive_expr", "shift_expr", "relational_expr", "equality_expr",
  "and_expr", "exclusive_or_expr", "inclusive_or_expr", "logical_and_expr",
  "logical_or_expr", "conditional_expr", "assignment_expr",
  "assignment_operator", "expr", "constant_expr", "declaration",
  "declaration_specifiers", "init_declarator_list", "init_declarator",
  "storage_class_specifier", "Interrupt_storage", "type_specifier",
  "type_specifier2", "sfr_reg_bit", "struct_or_union_specifier",
  "struct_or_union", "opt_stag", "stag", "struct_declaration_list",
  "struct_declaration", "struct_declarator_list", "struct_declarator",
  "enum_specifier", "enumerator_list", "enumerator", "opt_assign_expr",
  "declarator", "declarator2_function_attributes", "declarator2", "$@1",
  "pointer", "unqualified_pointer", "type_specifier_list",
  "parameter_identifier_list", "identifier_list", "parameter_type_list",
  "parameter_list", "parameter_declaration", "type_name",
  "abstract_declarator", "abstract_declarator2", "initializer",
  "initializer_list", "statement", "labeled_statement", "start_block",
  "end_block", "compound_statement", "$@2", "$@3", "declaration_list",
  "statement_list", "expression_statement", "else_statement",
  "selection_statement", "@4", "while", "do", "for", "iteration_statement",
  "expr_opt", "jump_statement", "identifier", YY_NULLPTR
};
#endif

# ifdef YYPRINT
/* YYTOKNUM[NUM] -- (External) token number corresponding to the
   (internal) symbol number NUM (which must be that of a token).  */
static const yytype_uint16 yytoknum[] =
{
       0,   256,   257,   258,   259,   260,   261,   262,   263,   264,
     265,   266,   267,   268,   269,   270,   271,   272,   273,   274,
     275,   276,   277,   278,   279,   280,   281,   282,   283,   284,
     285,   286,   287,   288,   289,   290,   291,   292,   293,   294,
     295,   296,   297,   298,   299,   300,   301,   302,   303,   304,
     305,   306,   307,   308,   309,   310,   311,   312,   313,   314,
     315,   316,   317,   318,   319,   320,   321,   322,   323,   324,
     325,   326,   327,   328,   329,   330,   331,   332,   333,   334,
     335,   336,   337,   338,   339,   340,   341,   342,   343,   344,
     345,   346,   347,   348,   349,   350,   351,   352,   353,   354,
     355,   356,   357,   358,   359,   360,    40,    41,    91,    93,
      46,    44,    38,    42,    43,    45,   126,    33,    47,    37,
      60,    62,    94,   124,    63,    58,    61,    59,   123,   125
};
# endif

#define YYPACT_NINF -334

#define yypact_value_is_default(Yystate) \
  (!!((Yystate) == (-334)))

#define YYTABLE_NINF -222

#define yytable_value_is_error(Yytable_value) \
  0

  /* YYPACT[STATE-NUM] -- Index in YYTABLE of the portion describing
     STATE-NUM.  */
static const yytype_int16 yypact[] =
{
    1262,  -334,  -334,  -334,  -334,  -334,  -334,  -334,  -334,  -334,
    -334,  -334,  -334,  -334,  -334,  -334,  -334,  -334,  -334,  -334,
    -334,  -334,  -334,  -334,  -334,  -334,  -334,  -334,  -334,     2,
      30,  -334,  1225,  -334,  -334,  -334,     4,  1649,  1649,     8,
    -334,  -334,    22,  -334,   575,  -334,   263,    20,  1556,  -334,
      22,   -67,   -54,  -334,  -334,  -334,   -38,  -334,   538,  -334,
    -334,  1091,   -61,   -52,  -334,   -19,  -334,  -334,  -334,     4,
     358,  -334,   575,    76,  -334,    90,  -334,  -334,  -334,  -334,
      15,   905,  -334,   278,  -334,  -334,  -334,  -334,  1556,   -85,
    -334,    -6,    22,  -334,    30,  -334,   861,  -334,  -334,  -334,
    1118,  1135,  1135,  1003,  -334,  -334,  -334,  -334,  -334,  -334,
    -334,  -334,    69,  -334,  1091,  -334,    67,   119,   172,    44,
     220,   -24,    -9,    37,   121,    13,  -334,  -334,  -334,  1713,
    -334,    72,  1091,    16,    57,    64,  -334,  -334,  -334,    22,
      66,    75,   878,    95,  -334,  -334,   429,  -334,  -334,   -27,
    -334,  -334,  -334,  -334,   767,   437,  -334,  -334,   138,   641,
     139,  -334,  -334,   102,  -334,  -334,  -334,  -334,  -334,  1713,
     140,   135,  -334,  -334,   145,  -334,  -334,  -334,    22,  -334,
    1091,  -334,   -66,  -334,   861,  -334,  -334,  1003,  -334,  1091,
    -334,  -334,   -59,  1481,   141,    22,  -334,  -334,   976,  1091,
      22,  -334,  1091,  1091,  1091,  1091,  1091,  1091,  1091,  1091,
    1091,  1091,  1091,  1091,  1091,  1091,  1091,  1091,  1091,  1091,
    1091,   799,  -334,   890,   130,   641,  1091,  1091,   132,  -334,
    -334,  -334,   -18,  -334,  -334,  -334,  -334,  -334,  -334,  -334,
    -334,  -334,  -334,  -334,  -334,  1091,  1091,  -334,   131,   641,
    -334,  -334,  1091,   188,  1091,  -334,  1374,   157,   158,  -334,
    -334,  -334,    18,  -334,  -334,  -334,  -334,  -334,   -57,   161,
    -334,  1449,  1020,    63,  -334,    68,  1091,  -334,  -334,   163,
     160,    83,  -334,  -334,  -334,  -334,    67,    67,   119,   119,
     172,   172,   172,   172,    44,    44,   220,   -24,    -9,    37,
     121,    -4,  -334,  -334,  1091,   -13,  -334,   147,   641,  -334,
      38,    40,  -334,  -334,  -334,  -334,  -334,   437,    46,   168,
     165,   151,  1337,  -334,    34,  -334,  1681,  -334,  -334,   664,
    -334,  -334,  -334,   174,   175,  -334,   176,    68,  1588,  1065,
    -334,  -334,  1091,  -334,  1091,  -334,    10,  -334,  1091,  -334,
     641,  -334,  -334,   641,  1091,  1091,  -334,  -334,  -334,  -334,
    -334,  -334,  -334,  -334,   177,  -334,   178,  -334,  -334,  -334,
    -334,   212,   641,  -334,    47,   159,  -334,  -334,   641,  -334,
    -334,   162,  1091,  -334,  -334,   181,   641,  -334
};

  /* YYDEFACT[STATE-NUM] -- Default reduction number in state STATE-NUM.
     Performed when YYTABLE does not specify something else to do.  Zero
     means the default is an error.  */
static const yytype_uint8 yydefact[] =
{
       0,   250,   131,   104,   105,   106,   107,   108,   123,   124,
     134,   133,   122,   125,   126,   127,   112,   113,   114,   115,
     116,   117,   121,   119,   120,   118,   128,   137,   138,     0,
       0,   175,     0,     2,     4,     5,     0,    96,    98,   110,
     132,   129,   140,   130,     0,   159,   161,     0,   171,   163,
       0,   152,     0,     1,     3,    94,     0,   100,     0,    97,
      99,     0,     0,   136,   141,     0,   217,     6,   226,     0,
       0,    17,     0,     0,    11,     0,    12,    14,    15,    13,
     168,     0,   162,     8,    16,   160,   176,   173,   172,     0,
     153,   158,     0,   164,     0,    95,     0,     7,    20,    23,
       0,     0,     0,     0,    40,    41,    42,    43,    44,    45,
      24,    21,    34,    46,     0,    48,    52,    55,    58,    63,
      66,    68,    70,    72,    74,    76,    93,   111,    19,     0,
     225,   102,     0,     0,     0,     0,   237,   238,   239,     0,
       0,     0,     0,     0,   230,   218,    46,    78,    91,     0,
     228,   207,   219,   208,   223,     0,   209,   210,     0,     0,
       0,   211,   212,    19,   227,    18,   109,    10,   167,     0,
       0,   178,   180,   165,     0,     9,   177,   174,   154,   150,
       0,   156,     0,   101,     0,   202,   103,     0,    38,     0,
      35,    36,     0,   188,     0,     0,    30,    31,     0,     0,
       0,    37,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   142,     0,     0,     0,     0,     0,     0,   246,
     247,   248,     0,   213,    81,    82,    83,    84,    85,    86,
      87,    88,    89,    90,    80,     0,     0,   231,     0,     0,
     229,   220,     0,     0,   243,   214,   188,     0,   182,   184,
     187,   170,     0,   166,   155,   157,   151,   205,     0,     0,
      22,     0,     0,   190,   189,   191,     0,    29,    26,     0,
      32,     0,    28,    49,    50,    51,    53,    54,    56,    57,
      61,    62,    59,    60,    64,    65,    67,    69,    71,    73,
      75,     0,   135,   143,     0,     0,   145,   147,     0,   216,
       0,     0,   245,   249,    79,    92,   222,     0,     0,     0,
     244,     0,     0,   186,   190,   169,     0,   179,   181,     0,
     203,    39,   198,     0,     0,   194,     0,   192,     0,     0,
      47,    27,     0,    25,     0,   148,     0,   144,     0,   215,
       0,   235,   224,     0,     0,   243,   183,   185,   204,   206,
     199,   193,   195,   200,     0,   196,     0,    33,    77,   146,
     149,   233,     0,   240,     0,     0,   201,   197,     0,   234,
     236,     0,   243,   232,   241,     0,     0,   242
};

  /* YYPGOTO[NTERM-NUM].  */
static const yytype_int16 yypgoto[] =
{
    -334,  -334,   259,  -334,   209,  -334,   236,  -334,  -334,  -334,
     -47,     1,  -334,   -75,    32,    33,   -21,    29,    85,    91,
      84,    88,    94,    89,   -46,   -79,  -334,  -102,   -73,    19,
      28,  -334,   221,  -334,  -334,    74,  -334,  -334,  -334,  -334,
    -334,  -334,  -334,   100,  -334,   -30,  -334,   231,   150,  -334,
     -26,   -45,  -334,  -334,   -32,  -334,   -39,  -334,  -334,  -166,
    -334,     3,   -91,  -251,  -249,  -173,  -334,  -121,  -334,  -334,
    -149,   -17,  -334,  -334,   261,    86,  -334,  -334,  -334,  -334,
    -334,  -334,  -334,  -334,  -333,  -334,     0
};

  /* YYDEFGOTO[NTERM-NUM].  */
static const yytype_int16 yydefgoto[] =
{
      -1,    32,    33,    34,    82,    83,    67,   110,   111,   112,
     279,   146,   114,   115,   116,   117,   118,   119,   120,   121,
     122,   123,   124,   125,   147,   148,   245,   149,   127,    68,
      69,    56,    57,    37,    84,    86,    39,    40,    41,    42,
      62,    63,   221,   222,   305,   306,    43,    89,    90,   181,
      44,    45,    46,   169,    47,    48,   256,   170,   171,   333,
     258,   259,   260,   274,   275,   186,   268,   150,   151,    70,
     152,   153,   248,   249,    72,   155,   156,   379,   157,   372,
     158,   159,   160,   161,   321,   162,   128
};

  /* YYTABLE[YYPACT[STATE-NUM]] -- What to do in state STATE-NUM.  If
     positive, shift that token.  If negative, reduce the rule whose
     number is the opposite.  If YYTABLE_NINF, syntax error.  */
static const yytype_int16 yytable[] =
{
      49,   192,    85,   257,    52,     1,   251,     1,   174,    88,
      58,   267,   194,     1,   219,   126,    87,   185,     1,    35,
     334,     1,   375,     1,   337,     1,   178,    71,    36,    51,
      49,   219,    49,     1,   250,   126,    49,     1,   253,   201,
     232,    71,    64,   131,   179,   178,    61,    49,   270,   385,
      91,    35,   246,    93,   329,   165,   177,   209,   210,   224,
      36,    92,   113,   266,   193,    59,    60,   129,   131,    49,
     163,   334,   330,    94,    38,   337,  -139,   195,   196,   197,
     172,   166,   113,   327,   246,   192,   126,   192,   215,    95,
     223,   164,    91,   246,    49,   167,   269,   281,   346,   316,
     247,   188,   190,   191,   309,   185,    38,   265,   130,   313,
      30,    38,    38,   216,   347,   113,    30,    31,    38,   280,
     180,   344,   168,    31,   310,   311,    30,   283,   284,   285,
      50,    55,    38,   113,   126,   304,    30,   220,   218,   228,
     322,   225,   272,    31,    38,   350,    38,   351,   193,   246,
     318,   246,   320,   353,   381,   163,   359,   246,   246,   163,
     217,   273,   176,   226,   211,   212,   314,   315,   352,   271,
     227,   272,   364,   164,   338,   198,   339,   199,    91,   200,
     202,   113,   223,   207,   208,   203,   204,   349,   290,   291,
     292,   293,   343,   229,   246,   277,   250,   307,    96,   336,
     282,   340,   230,   113,   113,   113,   113,   113,   113,   113,
     113,   113,   113,   113,   113,   113,   113,   113,   113,   113,
     113,   113,   233,    49,   324,   163,   126,   255,    38,   371,
     323,   345,   373,   205,   206,   213,   214,   286,   287,   273,
     288,   289,   294,   295,   252,   254,   262,   261,   276,   163,
     185,   380,   374,   320,   263,   308,    49,   383,   126,   312,
     145,   319,   328,   280,   325,   387,   366,   176,   331,   326,
     341,   342,   348,   113,   354,   370,   246,   113,   355,    85,
     320,   360,   361,   378,   376,   362,   382,   377,   386,   384,
     324,    54,   175,   126,    97,   367,    52,   176,   368,    73,
     296,   298,   126,    74,    75,   113,   299,   297,   163,   301,
      76,    77,    78,   300,    73,   183,   369,   163,    74,    75,
     307,   303,    49,   182,    49,    76,    77,    78,   264,   357,
     176,   154,     0,     0,     0,   317,     0,     0,     0,     0,
     113,     0,     0,    79,     0,   113,    49,     0,     0,   113,
     163,     0,     0,   163,     0,     0,     0,     0,    79,    65,
       0,     1,     2,    98,    99,   100,     0,   101,   102,    80,
       0,    81,   163,     0,     0,     0,     0,     0,   163,     0,
       0,     0,     0,     0,     0,     0,   163,     3,     4,     5,
       6,     7,     8,     9,     0,    10,     0,    11,     0,     0,
      12,    13,    14,    15,     0,     0,     0,     0,    16,    17,
      18,    19,    20,    21,    22,     0,    23,    24,    25,    26,
      27,    28,    29,     0,     0,     0,   132,   133,   134,     0,
     135,   136,   137,   138,   139,   140,   141,   142,    65,   143,
       1,     0,    98,    99,   100,     0,   101,   102,   234,   235,
     236,   237,   238,   239,   240,   241,   242,   243,     0,     0,
       0,     0,     0,     0,   103,     0,     0,     0,     0,     0,
     104,   105,   106,   107,   108,   109,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   144,    66,   145,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   132,   133,   134,     0,   135,
     136,   137,   138,   139,   140,   141,   142,     0,   143,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,    65,
       0,     0,     2,   103,     0,     0,     0,     0,     0,   104,
     105,   106,   107,   108,   109,   244,     0,     0,     0,     0,
       0,     0,     0,     0,   144,    66,   145,     3,     4,     5,
       6,     7,     8,     9,     0,    10,    65,    11,     0,     2,
      12,    13,    14,    15,     0,     0,     0,     0,    16,    17,
      18,    19,    20,    21,    22,     0,    23,    24,    25,    26,
      27,    28,    29,     0,     3,     4,     5,     6,     7,     8,
       9,     0,    10,     0,    11,     0,     0,    12,    13,    14,
      15,     0,     0,     0,     0,    16,    17,    18,    19,    20,
      21,    22,     0,    23,    24,    25,    26,    27,    28,    29,
       0,     0,    65,     0,     1,     0,    98,    99,   100,  -102,
     101,   102,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,    96,  -102,    66,     1,     0,    98,
      99,   100,     0,   101,   102,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,    66,     0,     0,     0,     0,     0,   132,
     133,   134,     0,   135,   136,   137,   138,   139,   140,   141,
     142,     0,   143,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   103,     0,     0,
       0,     0,     0,   104,   105,   106,   107,   108,   109,     0,
       0,     0,     0,     0,     0,     0,     0,     0,   144,    66,
     103,     2,     0,     0,     0,     0,   104,   105,   106,   107,
     108,   109,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,   184,   358,     0,     0,     3,     4,     5,     6,
       7,     8,     9,     2,    10,     0,    11,     0,     0,    12,
      13,    14,    15,     0,     0,     0,     0,    16,    17,    18,
      19,    20,    21,    22,     0,    23,    24,    25,    26,    27,
      28,    29,     0,     8,     9,     0,    10,     0,    11,     0,
       0,    12,    13,    14,    15,     0,     0,     0,     0,    16,
      17,    18,    19,    20,    21,    22,     0,    23,    24,    25,
      26,    27,    28,    29,     1,     0,    98,    99,   100,     0,
     101,   102,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     1,     0,    98,    99,   100,     0,   101,   102,     0,
       0,     0,     0,     1,     2,     0,  -221,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     1,     0,
      98,    99,   100,     0,   101,   102,     0,     0,     0,     0,
       0,     0,     0,     0,     8,     9,     0,    10,   302,    11,
       0,     0,    12,    13,    14,    15,     0,     0,     0,     0,
      16,    17,    18,    19,    20,    21,    22,     0,    23,    24,
      25,    26,    27,    28,    29,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   103,     0,     0,
       0,     0,     0,   104,   105,   106,   107,   108,   109,     1,
       0,    98,    99,   100,   103,   101,   102,     0,     0,   184,
     104,   105,   106,   107,   108,   109,    30,     0,     0,     0,
       0,     0,     0,    31,     0,   231,     1,     2,    98,    99,
     100,   103,   101,   102,   173,   304,     0,   104,   105,   106,
     107,   108,   109,     1,     0,    98,    99,   100,     0,   101,
     102,     0,     0,     0,     0,     0,     0,     8,     9,     0,
      10,     0,    11,     0,     0,    12,    13,    14,    15,     0,
       0,     0,     0,    16,    17,    18,    19,    20,    21,    22,
       0,    23,    24,    25,    26,    27,    28,    29,     1,     0,
      98,    99,   100,     0,   101,   102,     0,     0,     0,     0,
       0,     0,   103,   278,     0,     0,     0,     0,   104,   105,
     106,   107,   108,   109,     1,     0,    98,    99,   100,     0,
     101,   102,     0,     0,     0,     0,     0,     0,     0,   103,
       0,     0,     0,     0,     0,   104,   105,   106,   107,   108,
     109,     1,     0,    98,    99,   100,   103,   101,   102,   335,
       0,     0,   104,   105,   106,   107,   108,   109,     1,     0,
      98,    99,   100,     0,   101,   102,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,   103,     0,     0,   365,     0,     0,   104,   105,   106,
     107,   108,   109,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   103,     0,     0,
       0,     0,     0,   104,   105,   106,   107,   108,   109,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,   187,    53,     0,     0,     1,     2,
     104,   105,   106,   107,   108,   109,     0,     0,     0,     0,
       0,   189,     0,     0,     0,     0,     0,   104,   105,   106,
     107,   108,   109,     0,     3,     4,     5,     6,     7,     8,
       9,     0,    10,     0,    11,     1,     2,    12,    13,    14,
      15,     0,     0,     0,     0,    16,    17,    18,    19,    20,
      21,    22,     0,    23,    24,    25,    26,    27,    28,    29,
       0,     3,     4,     5,     6,     7,     8,     9,     0,    10,
       0,    11,     0,     0,    12,    13,    14,    15,     0,     0,
       0,     0,    16,    17,    18,    19,    20,    21,    22,     0,
      23,    24,    25,    26,    27,    28,    29,     0,     0,     0,
       0,    30,     0,     0,     0,     0,     0,     0,    31,     0,
       1,     2,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,    30,     0,
       0,     8,     9,     0,    10,    31,    11,     1,     2,    12,
      13,    14,    15,     0,     0,     0,     0,    16,    17,    18,
      19,    20,    21,    22,     0,    23,    24,    25,    26,    27,
      28,    29,     0,     0,     0,     0,     0,     0,     8,     9,
       0,    10,     0,    11,     0,     0,    12,    13,    14,    15,
       0,     0,     0,     0,    16,    17,    18,    19,    20,    21,
      22,     0,    23,    24,    25,    26,    27,    28,    29,     0,
       0,     0,     0,   322,   332,   272,     0,     0,     0,     0,
      31,     0,     0,     2,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
     322,     0,   272,     8,     9,     2,    10,    31,    11,     0,
       0,    12,    13,    14,    15,     0,     0,     0,     0,    16,
      17,    18,    19,    20,    21,    22,     0,    23,    24,    25,
      26,    27,    28,    29,     0,     8,     9,     0,    10,     0,
      11,     0,     0,    12,    13,    14,    15,     0,     0,     0,
       0,    16,    17,    18,    19,    20,    21,    22,     0,    23,
      24,    25,    26,    27,    28,    29,     0,     0,     0,     0,
       0,     0,     0,     0,     0,   271,   332,   272,     0,     0,
       2,     0,    31,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,   271,     0,   272,
       8,     9,     2,    10,    31,    11,     0,     0,    12,    13,
      14,    15,     0,     0,     0,     0,    16,    17,    18,    19,
      20,    21,    22,     0,    23,    24,    25,    26,    27,    28,
      29,     0,     8,     9,     0,    10,     0,    11,     0,     0,
      12,    13,    14,    15,     0,     0,     0,     0,    16,    17,
      18,    19,    20,    21,    22,     0,    23,    24,    25,    26,
      27,    28,    29,     2,     0,     0,     0,     0,     0,     0,
       0,     0,     0,     0,     0,     0,     0,     0,     0,    31,
       0,     0,     0,     0,     0,     0,     0,     0,     3,     4,
       5,     6,     7,     8,     9,     2,    10,     0,    11,     0,
       0,    12,    13,    14,    15,   363,     0,     0,     0,    16,
      17,    18,    19,    20,    21,    22,     0,    23,    24,    25,
      26,    27,    28,    29,     0,     8,     9,     2,    10,     0,
      11,     0,     0,    12,    13,    14,    15,   356,     0,     0,
       0,    16,    17,    18,    19,    20,    21,    22,     0,    23,
      24,    25,    26,    27,    28,    29,     0,     8,     9,     0,
      10,     0,    11,     0,     0,    12,    13,    14,    15,     0,
       0,     0,     0,    16,    17,    18,    19,    20,    21,    22,
       0,    23,    24,    25,    26,    27,    28,    29
};

static const yytype_int16 yycheck[] =
{
       0,   103,    47,   169,    30,     3,   155,     3,    81,    48,
      36,   184,   103,     3,    18,    61,    48,    96,     3,     0,
     271,     3,   355,     3,   273,     3,   111,    44,     0,    29,
      30,    18,    32,     3,   155,    81,    36,     3,   159,   114,
     142,    58,    42,    69,   129,   111,    38,    47,   107,   382,
      50,    32,   111,   107,   111,    72,    88,    13,    14,   132,
      32,   128,    61,   129,   103,    37,    38,   128,    94,    69,
      70,   322,   129,   111,     0,   324,   128,     8,     9,    10,
      80,     5,    81,    65,   111,   187,   132,   189,   112,   127,
     129,    72,    92,   111,    94,     5,   187,   199,   111,   248,
     127,   100,   101,   102,   225,   184,    32,   180,   127,   127,
     106,    37,    38,   122,   127,   114,   106,   113,    44,   198,
     126,   125,   107,   113,   226,   227,   106,   202,   203,   204,
     128,   127,    58,   132,   180,   125,   106,   124,    17,   139,
     106,   125,   108,   113,    70,   107,    72,   107,   187,   111,
     252,   111,   254,   107,   107,   155,   329,   111,   111,   159,
     123,   193,    88,   106,   120,   121,   245,   246,   317,   106,
     106,   108,   338,   154,   106,   106,   108,   108,   178,   110,
     113,   180,   221,    11,    12,   118,   119,   308,   209,   210,
     211,   212,   109,   127,   111,   195,   317,   223,   126,   272,
     200,   276,   127,   202,   203,   204,   205,   206,   207,   208,
     209,   210,   211,   212,   213,   214,   215,   216,   217,   218,
     219,   220,   127,   223,   256,   225,   272,   125,   154,   350,
     256,   304,   353,   114,   115,    15,    16,   205,   206,   271,
     207,   208,   213,   214,   106,   106,   111,   107,   107,   249,
     329,   372,   354,   355,   109,   125,   256,   378,   304,   127,
     129,    73,   262,   342,   107,   386,   339,   193,   107,   111,
     107,   111,   125,   272,   106,   348,   111,   276,   127,   324,
     382,   107,   107,    71,   107,   109,   127,   109,   107,   127,
     322,    32,    83,   339,    58,   342,   322,   223,   344,    36,
     215,   217,   348,    40,    41,   304,   218,   216,   308,   220,
      47,    48,    49,   219,    36,    94,   346,   317,    40,    41,
     346,   221,   322,    92,   324,    47,    48,    49,   178,   326,
     256,    70,    -1,    -1,    -1,   249,    -1,    -1,    -1,    -1,
     339,    -1,    -1,    80,    -1,   344,   346,    -1,    -1,   348,
     350,    -1,    -1,   353,    -1,    -1,    -1,    -1,    80,     1,
      -1,     3,     4,     5,     6,     7,    -1,     9,    10,   106,
      -1,   108,   372,    -1,    -1,    -1,    -1,    -1,   378,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,   386,    29,    30,    31,
      32,    33,    34,    35,    -1,    37,    -1,    39,    -1,    -1,
      42,    43,    44,    45,    -1,    -1,    -1,    -1,    50,    51,
      52,    53,    54,    55,    56,    -1,    58,    59,    60,    61,
      62,    63,    64,    -1,    -1,    -1,    68,    69,    70,    -1,
      72,    73,    74,    75,    76,    77,    78,    79,     1,    81,
       3,    -1,     5,     6,     7,    -1,     9,    10,    19,    20,
      21,    22,    23,    24,    25,    26,    27,    28,    -1,    -1,
      -1,    -1,    -1,    -1,   106,    -1,    -1,    -1,    -1,    -1,
     112,   113,   114,   115,   116,   117,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   127,   128,   129,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    68,    69,    70,    -1,    72,
      73,    74,    75,    76,    77,    78,    79,    -1,    81,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     1,
      -1,    -1,     4,   106,    -1,    -1,    -1,    -1,    -1,   112,
     113,   114,   115,   116,   117,   126,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   127,   128,   129,    29,    30,    31,
      32,    33,    34,    35,    -1,    37,     1,    39,    -1,     4,
      42,    43,    44,    45,    -1,    -1,    -1,    -1,    50,    51,
      52,    53,    54,    55,    56,    -1,    58,    59,    60,    61,
      62,    63,    64,    -1,    29,    30,    31,    32,    33,    34,
      35,    -1,    37,    -1,    39,    -1,    -1,    42,    43,    44,
      45,    -1,    -1,    -1,    -1,    50,    51,    52,    53,    54,
      55,    56,    -1,    58,    59,    60,    61,    62,    63,    64,
      -1,    -1,     1,    -1,     3,    -1,     5,     6,     7,   111,
       9,    10,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   126,   127,   128,     3,    -1,     5,
       6,     7,    -1,     9,    10,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,   128,    -1,    -1,    -1,    -1,    -1,    68,
      69,    70,    -1,    72,    73,    74,    75,    76,    77,    78,
      79,    -1,    81,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   106,    -1,    -1,
      -1,    -1,    -1,   112,   113,   114,   115,   116,   117,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   127,   128,
     106,     4,    -1,    -1,    -1,    -1,   112,   113,   114,   115,
     116,   117,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,   128,   129,    -1,    -1,    29,    30,    31,    32,
      33,    34,    35,     4,    37,    -1,    39,    -1,    -1,    42,
      43,    44,    45,    -1,    -1,    -1,    -1,    50,    51,    52,
      53,    54,    55,    56,    -1,    58,    59,    60,    61,    62,
      63,    64,    -1,    34,    35,    -1,    37,    -1,    39,    -1,
      -1,    42,    43,    44,    45,    -1,    -1,    -1,    -1,    50,
      51,    52,    53,    54,    55,    56,    -1,    58,    59,    60,
      61,    62,    63,    64,     3,    -1,     5,     6,     7,    -1,
       9,    10,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,     3,    -1,     5,     6,     7,    -1,     9,    10,    -1,
      -1,    -1,    -1,     3,     4,    -1,   129,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,     3,    -1,
       5,     6,     7,    -1,     9,    10,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    34,    35,    -1,    37,   129,    39,
      -1,    -1,    42,    43,    44,    45,    -1,    -1,    -1,    -1,
      50,    51,    52,    53,    54,    55,    56,    -1,    58,    59,
      60,    61,    62,    63,    64,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   106,    -1,    -1,
      -1,    -1,    -1,   112,   113,   114,   115,   116,   117,     3,
      -1,     5,     6,     7,   106,     9,    10,    -1,    -1,   128,
     112,   113,   114,   115,   116,   117,   106,    -1,    -1,    -1,
      -1,    -1,    -1,   113,    -1,   127,     3,     4,     5,     6,
       7,   106,     9,    10,   109,   125,    -1,   112,   113,   114,
     115,   116,   117,     3,    -1,     5,     6,     7,    -1,     9,
      10,    -1,    -1,    -1,    -1,    -1,    -1,    34,    35,    -1,
      37,    -1,    39,    -1,    -1,    42,    43,    44,    45,    -1,
      -1,    -1,    -1,    50,    51,    52,    53,    54,    55,    56,
      -1,    58,    59,    60,    61,    62,    63,    64,     3,    -1,
       5,     6,     7,    -1,     9,    10,    -1,    -1,    -1,    -1,
      -1,    -1,   106,   107,    -1,    -1,    -1,    -1,   112,   113,
     114,   115,   116,   117,     3,    -1,     5,     6,     7,    -1,
       9,    10,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   106,
      -1,    -1,    -1,    -1,    -1,   112,   113,   114,   115,   116,
     117,     3,    -1,     5,     6,     7,   106,     9,    10,   109,
      -1,    -1,   112,   113,   114,   115,   116,   117,     3,    -1,
       5,     6,     7,    -1,     9,    10,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,   106,    -1,    -1,   109,    -1,    -1,   112,   113,   114,
     115,   116,   117,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   106,    -1,    -1,
      -1,    -1,    -1,   112,   113,   114,   115,   116,   117,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,   106,     0,    -1,    -1,     3,     4,
     112,   113,   114,   115,   116,   117,    -1,    -1,    -1,    -1,
      -1,   106,    -1,    -1,    -1,    -1,    -1,   112,   113,   114,
     115,   116,   117,    -1,    29,    30,    31,    32,    33,    34,
      35,    -1,    37,    -1,    39,     3,     4,    42,    43,    44,
      45,    -1,    -1,    -1,    -1,    50,    51,    52,    53,    54,
      55,    56,    -1,    58,    59,    60,    61,    62,    63,    64,
      -1,    29,    30,    31,    32,    33,    34,    35,    -1,    37,
      -1,    39,    -1,    -1,    42,    43,    44,    45,    -1,    -1,
      -1,    -1,    50,    51,    52,    53,    54,    55,    56,    -1,
      58,    59,    60,    61,    62,    63,    64,    -1,    -1,    -1,
      -1,   106,    -1,    -1,    -1,    -1,    -1,    -1,   113,    -1,
       3,     4,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   106,    -1,
      -1,    34,    35,    -1,    37,   113,    39,     3,     4,    42,
      43,    44,    45,    -1,    -1,    -1,    -1,    50,    51,    52,
      53,    54,    55,    56,    -1,    58,    59,    60,    61,    62,
      63,    64,    -1,    -1,    -1,    -1,    -1,    -1,    34,    35,
      -1,    37,    -1,    39,    -1,    -1,    42,    43,    44,    45,
      -1,    -1,    -1,    -1,    50,    51,    52,    53,    54,    55,
      56,    -1,    58,    59,    60,    61,    62,    63,    64,    -1,
      -1,    -1,    -1,   106,   107,   108,    -1,    -1,    -1,    -1,
     113,    -1,    -1,     4,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
     106,    -1,   108,    34,    35,     4,    37,   113,    39,    -1,
      -1,    42,    43,    44,    45,    -1,    -1,    -1,    -1,    50,
      51,    52,    53,    54,    55,    56,    -1,    58,    59,    60,
      61,    62,    63,    64,    -1,    34,    35,    -1,    37,    -1,
      39,    -1,    -1,    42,    43,    44,    45,    -1,    -1,    -1,
      -1,    50,    51,    52,    53,    54,    55,    56,    -1,    58,
      59,    60,    61,    62,    63,    64,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,   106,   107,   108,    -1,    -1,
       4,    -1,   113,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,   106,    -1,   108,
      34,    35,     4,    37,   113,    39,    -1,    -1,    42,    43,
      44,    45,    -1,    -1,    -1,    -1,    50,    51,    52,    53,
      54,    55,    56,    -1,    58,    59,    60,    61,    62,    63,
      64,    -1,    34,    35,    -1,    37,    -1,    39,    -1,    -1,
      42,    43,    44,    45,    -1,    -1,    -1,    -1,    50,    51,
      52,    53,    54,    55,    56,    -1,    58,    59,    60,    61,
      62,    63,    64,     4,    -1,    -1,    -1,    -1,    -1,    -1,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,   113,
      -1,    -1,    -1,    -1,    -1,    -1,    -1,    -1,    29,    30,
      31,    32,    33,    34,    35,     4,    37,    -1,    39,    -1,
      -1,    42,    43,    44,    45,   107,    -1,    -1,    -1,    50,
      51,    52,    53,    54,    55,    56,    -1,    58,    59,    60,
      61,    62,    63,    64,    -1,    34,    35,     4,    37,    -1,
      39,    -1,    -1,    42,    43,    44,    45,    46,    -1,    -1,
      -1,    50,    51,    52,    53,    54,    55,    56,    -1,    58,
      59,    60,    61,    62,    63,    64,    -1,    34,    35,    -1,
      37,    -1,    39,    -1,    -1,    42,    43,    44,    45,    -1,
      -1,    -1,    -1,    50,    51,    52,    53,    54,    55,    56,
      -1,    58,    59,    60,    61,    62,    63,    64
};

  /* YYSTOS[STATE-NUM] -- The (internal number of the) accessing
     symbol of state STATE-NUM.  */
static const yytype_uint8 yystos[] =
{
       0,     3,     4,    29,    30,    31,    32,    33,    34,    35,
      37,    39,    42,    43,    44,    45,    50,    51,    52,    53,
      54,    55,    56,    58,    59,    60,    61,    62,    63,    64,
     106,   113,   131,   132,   133,   159,   160,   163,   165,   166,
     167,   168,   169,   176,   180,   181,   182,   184,   185,   216,
     128,   216,   180,     0,   132,   127,   161,   162,   180,   160,
     160,    38,   170,   171,   216,     1,   128,   136,   159,   160,
     199,   201,   204,    36,    40,    41,    47,    48,    49,    80,
     106,   108,   134,   135,   164,   181,   165,   184,   186,   177,
     178,   216,   128,   107,   111,   127,   126,   136,     5,     6,
       7,     9,    10,   106,   112,   113,   114,   115,   116,   117,
     137,   138,   139,   141,   142,   143,   144,   145,   146,   147,
     148,   149,   150,   151,   152,   153,   154,   158,   216,   128,
     127,   180,    68,    69,    70,    72,    73,    74,    75,    76,
      77,    78,    79,    81,   127,   129,   141,   154,   155,   157,
     197,   198,   200,   201,   204,   205,   206,   208,   210,   211,
     212,   213,   215,   216,   159,   201,     5,     5,   107,   183,
     187,   188,   216,   109,   158,   134,   165,   184,   111,   129,
     126,   179,   177,   162,   128,   155,   195,   106,   141,   106,
     141,   141,   157,   186,   192,     8,     9,    10,   106,   108,
     110,   143,   113,   118,   119,   114,   115,    11,    12,    13,
      14,   120,   121,    15,    16,   112,   122,   123,    17,    18,
     124,   172,   173,   186,   158,   125,   106,   106,   216,   127,
     127,   127,   157,   127,    19,    20,    21,    22,    23,    24,
      25,    26,    27,    28,   126,   156,   111,   127,   202,   203,
     197,   200,   106,   197,   106,   125,   186,   189,   190,   191,
     192,   107,   111,   109,   178,   158,   129,   195,   196,   192,
     107,   106,   108,   184,   193,   194,   107,   216,   107,   140,
     155,   157,   216,   143,   143,   143,   144,   144,   145,   145,
     146,   146,   146,   146,   147,   147,   148,   149,   150,   151,
     152,   153,   129,   173,   125,   174,   175,   180,   125,   197,
     157,   157,   127,   127,   155,   155,   200,   205,   157,    73,
     157,   214,   106,   180,   184,   107,   111,    65,   216,   111,
     129,   107,   107,   189,   193,   109,   158,   194,   106,   108,
     143,   107,   111,   109,   125,   158,   111,   127,   125,   197,
     107,   107,   200,   107,   106,   127,    46,   191,   129,   195,
     107,   107,   109,   107,   189,   109,   158,   140,   154,   175,
     158,   197,   209,   197,   157,   214,   107,   109,    71,   207,
     197,   107,   127,   197,   127,   214,   107,   197
};

  /* YYR1[YYN] -- Symbol number of symbol that rule YYN derives.  */
static const yytype_uint8 yyr1[] =
{
       0,   130,   131,   131,   132,   132,   133,   133,   134,   134,
     135,   135,   135,   135,   135,   135,   135,   136,   136,   137,
     137,   137,   137,   138,   139,   139,   139,   139,   139,   139,
     139,   139,   140,   140,   141,   141,   141,   141,   141,   141,
     142,   142,   142,   142,   142,   142,   143,   143,   144,   144,
     144,   144,   145,   145,   145,   146,   146,   146,   147,   147,
     147,   147,   147,   148,   148,   148,   149,   149,   150,   150,
     151,   151,   152,   152,   153,   153,   154,   154,   155,   155,
     156,   156,   156,   156,   156,   156,   156,   156,   156,   156,
     156,   157,   157,   158,   159,   159,   160,   160,   160,   160,
     161,   161,   162,   162,   163,   163,   163,   163,   163,   164,
     165,   165,   166,   166,   166,   166,   166,   166,   166,   166,
     166,   166,   166,   166,   166,   166,   166,   166,   166,   166,
     166,   166,   166,   167,   167,   168,   168,   169,   169,   170,
     170,   171,   172,   172,   173,   174,   174,   175,   175,   175,
     176,   176,   176,   177,   177,   177,   178,   179,   179,   180,
     180,   181,   181,   182,   182,   182,   182,   182,   183,   182,
     182,   184,   184,   184,   184,   185,   186,   186,   187,   187,
     188,   188,   189,   189,   190,   190,   191,   191,   192,   192,
     193,   193,   193,   194,   194,   194,   194,   194,   194,   194,
     194,   194,   195,   195,   195,   196,   196,   197,   197,   197,
     197,   197,   197,   197,   198,   198,   198,   199,   200,   201,
     201,   202,   201,   203,   201,   201,   204,   204,   205,   205,
     206,   206,   207,   207,   208,   209,   208,   210,   211,   212,
     213,   213,   213,   214,   214,   215,   215,   215,   215,   215,
     216
};

  /* YYR2[YYN] -- Number of symbols on the right hand side of rule YYN.  */
static const yytype_uint8 yyr2[] =
{
       0,     2,     1,     2,     1,     1,     2,     3,     1,     2,
       2,     1,     1,     1,     1,     1,     1,     1,     2,     1,
       1,     1,     3,     1,     1,     4,     3,     4,     3,     3,
       2,     2,     1,     3,     1,     2,     2,     2,     2,     4,
       1,     1,     1,     1,     1,     1,     1,     4,     1,     3,
       3,     3,     1,     3,     3,     1,     3,     3,     1,     3,
       3,     3,     3,     1,     3,     3,     1,     3,     1,     3,
       1,     3,     1,     3,     1,     3,     1,     5,     1,     3,
       1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     3,     1,     2,     3,     1,     2,     1,     2,
       1,     3,     1,     3,     1,     1,     1,     1,     1,     2,
       1,     3,     1,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     1,     1,     1,     1,     1,
       1,     1,     1,     1,     1,     5,     2,     1,     1,     1,
       0,     1,     1,     2,     3,     1,     3,     1,     2,     3,
       4,     5,     2,     1,     2,     3,     2,     2,     0,     1,
       2,     1,     2,     1,     3,     3,     4,     3,     0,     5,
       4,     1,     2,     2,     3,     1,     1,     2,     1,     3,
       1,     3,     1,     3,     1,     3,     2,     1,     1,     2,
       1,     1,     2,     3,     2,     3,     3,     4,     2,     3,
       3,     4,     1,     3,     4,     1,     3,     1,     1,     1,
       1,     1,     1,     2,     2,     4,     3,     1,     1,     2,
       3,     0,     4,     0,     5,     2,     1,     2,     1,     2,
       1,     2,     2,     0,     6,     0,     6,     1,     1,     1,
       5,     7,     9,     0,     1,     3,     2,     2,     2,     3,
       1
};


#define yyerrok         (yyerrstatus = 0)
#define yyclearin       (yychar = YYEMPTY)
#define YYEMPTY         (-2)
#define YYEOF           0

#define YYACCEPT        goto yyacceptlab
#define YYABORT         goto yyabortlab
#define YYERROR         goto yyerrorlab


#define YYRECOVERING()  (!!yyerrstatus)

#define YYBACKUP(Token, Value)                                    \
  do                                                              \
    if (yychar == YYEMPTY)                                        \
      {                                                           \
        yychar = (Token);                                         \
        yylval = (Value);                                         \
        YYPOPSTACK (yylen);                                       \
        yystate = *yyssp;                                         \
        goto yybackup;                                            \
      }                                                           \
    else                                                          \
      {                                                           \
        yyerror (YY_("syntax error: cannot back up")); \
        YYERROR;                                                  \
      }                                                           \
  while (0)

/* Error token number */
#define YYTERROR        1
#define YYERRCODE       256



/* Enable debugging if requested.  */
#if YYDEBUG

# ifndef YYFPRINTF
#  include <stdio.h> /* INFRINGES ON USER NAME SPACE */
#  define YYFPRINTF fprintf
# endif

# define YYDPRINTF(Args)                        \
do {                                            \
  if (yydebug)                                  \
    YYFPRINTF Args;                             \
} while (0)

/* This macro is provided for backward compatibility. */
#ifndef YY_LOCATION_PRINT
# define YY_LOCATION_PRINT(File, Loc) ((void) 0)
#endif


# define YY_SYMBOL_PRINT(Title, Type, Value, Location)                    \
do {                                                                      \
  if (yydebug)                                                            \
    {                                                                     \
      YYFPRINTF (stderr, "%s ", Title);                                   \
      yy_symbol_print (stderr,                                            \
                  Type, Value); \
      YYFPRINTF (stderr, "\n");                                           \
    }                                                                     \
} while (0)


/*-----------------------------------.
| Print this symbol's value on YYO.  |
`-----------------------------------*/

static void
yy_symbol_value_print (FILE *yyo, int yytype, YYSTYPE const * const yyvaluep)
{
  FILE *yyoutput = yyo;
  YYUSE (yyoutput);
  if (!yyvaluep)
    return;
# ifdef YYPRINT
  if (yytype < YYNTOKENS)
    YYPRINT (yyo, yytoknum[yytype], *yyvaluep);
# endif
  YYUSE (yytype);
}


/*---------------------------.
| Print this symbol on YYO.  |
`---------------------------*/

static void
yy_symbol_print (FILE *yyo, int yytype, YYSTYPE const * const yyvaluep)
{
  YYFPRINTF (yyo, "%s %s (",
             yytype < YYNTOKENS ? "token" : "nterm", yytname[yytype]);

  yy_symbol_value_print (yyo, yytype, yyvaluep);
  YYFPRINTF (yyo, ")");
}

/*------------------------------------------------------------------.
| yy_stack_print -- Print the state stack from its BOTTOM up to its |
| TOP (included).                                                   |
`------------------------------------------------------------------*/

static void
yy_stack_print (yytype_int16 *yybottom, yytype_int16 *yytop)
{
  YYFPRINTF (stderr, "Stack now");
  for (; yybottom <= yytop; yybottom++)
    {
      int yybot = *yybottom;
      YYFPRINTF (stderr, " %d", yybot);
    }
  YYFPRINTF (stderr, "\n");
}

# define YY_STACK_PRINT(Bottom, Top)                            \
do {                                                            \
  if (yydebug)                                                  \
    yy_stack_print ((Bottom), (Top));                           \
} while (0)


/*------------------------------------------------.
| Report that the YYRULE is going to be reduced.  |
`------------------------------------------------*/

static void
yy_reduce_print (yytype_int16 *yyssp, YYSTYPE *yyvsp, int yyrule)
{
  unsigned long yylno = yyrline[yyrule];
  int yynrhs = yyr2[yyrule];
  int yyi;
  YYFPRINTF (stderr, "Reducing stack by rule %d (line %lu):\n",
             yyrule - 1, yylno);
  /* The symbols being reduced.  */
  for (yyi = 0; yyi < yynrhs; yyi++)
    {
      YYFPRINTF (stderr, "   $%d = ", yyi + 1);
      yy_symbol_print (stderr,
                       yystos[yyssp[yyi + 1 - yynrhs]],
                       &yyvsp[(yyi + 1) - (yynrhs)]
                                              );
      YYFPRINTF (stderr, "\n");
    }
}

# define YY_REDUCE_PRINT(Rule)          \
do {                                    \
  if (yydebug)                          \
    yy_reduce_print (yyssp, yyvsp, Rule); \
} while (0)

/* Nonzero means print parse trace.  It is left uninitialized so that
   multiple parsers can coexist.  */
int yydebug;
#else /* !YYDEBUG */
# define YYDPRINTF(Args)
# define YY_SYMBOL_PRINT(Title, Type, Value, Location)
# define YY_STACK_PRINT(Bottom, Top)
# define YY_REDUCE_PRINT(Rule)
#endif /* !YYDEBUG */


/* YYINITDEPTH -- initial size of the parser's stacks.  */
#ifndef YYINITDEPTH
# define YYINITDEPTH 200
#endif

/* YYMAXDEPTH -- maximum size the stacks can grow to (effective only
   if the built-in stack extension method is used).

   Do not make this value too large; the results are undefined if
   YYSTACK_ALLOC_MAXIMUM < YYSTACK_BYTES (YYMAXDEPTH)
   evaluated with infinite-precision integer arithmetic.  */

#ifndef YYMAXDEPTH
# define YYMAXDEPTH 10000
#endif


#if YYERROR_VERBOSE

# ifndef yystrlen
#  if defined __GLIBC__ && defined _STRING_H
#   define yystrlen strlen
#  else
/* Return the length of YYSTR.  */
static YYSIZE_T
yystrlen (const char *yystr)
{
  YYSIZE_T yylen;
  for (yylen = 0; yystr[yylen]; yylen++)
    continue;
  return yylen;
}
#  endif
# endif

# ifndef yystpcpy
#  if defined __GLIBC__ && defined _STRING_H && defined _GNU_SOURCE
#   define yystpcpy stpcpy
#  else
/* Copy YYSRC to YYDEST, returning the address of the terminating '\0' in
   YYDEST.  */
static char *
yystpcpy (char *yydest, const char *yysrc)
{
  char *yyd = yydest;
  const char *yys = yysrc;

  while ((*yyd++ = *yys++) != '\0')
    continue;

  return yyd - 1;
}
#  endif
# endif

# ifndef yytnamerr
/* Copy to YYRES the contents of YYSTR after stripping away unnecessary
   quotes and backslashes, so that it's suitable for yyerror.  The
   heuristic is that double-quoting is unnecessary unless the string
   contains an apostrophe, a comma, or backslash (other than
   backslash-backslash).  YYSTR is taken from yytname.  If YYRES is
   null, do not copy; instead, return the length of what the result
   would have been.  */
static YYSIZE_T
yytnamerr (char *yyres, const char *yystr)
{
  if (*yystr == '"')
    {
      YYSIZE_T yyn = 0;
      char const *yyp = yystr;

      for (;;)
        switch (*++yyp)
          {
          case '\'':
          case ',':
            goto do_not_strip_quotes;

          case '\\':
            if (*++yyp != '\\')
              goto do_not_strip_quotes;
            else
              goto append;

          append:
          default:
            if (yyres)
              yyres[yyn] = *yyp;
            yyn++;
            break;

          case '"':
            if (yyres)
              yyres[yyn] = '\0';
            return yyn;
          }
    do_not_strip_quotes: ;
    }

  if (! yyres)
    return yystrlen (yystr);

  return (YYSIZE_T) (yystpcpy (yyres, yystr) - yyres);
}
# endif

/* Copy into *YYMSG, which is of size *YYMSG_ALLOC, an error message
   about the unexpected token YYTOKEN for the state stack whose top is
   YYSSP.

   Return 0 if *YYMSG was successfully written.  Return 1 if *YYMSG is
   not large enough to hold the message.  In that case, also set
   *YYMSG_ALLOC to the required number of bytes.  Return 2 if the
   required number of bytes is too large to store.  */
static int
yysyntax_error (YYSIZE_T *yymsg_alloc, char **yymsg,
                yytype_int16 *yyssp, int yytoken)
{
  YYSIZE_T yysize0 = yytnamerr (YY_NULLPTR, yytname[yytoken]);
  YYSIZE_T yysize = yysize0;
  enum { YYERROR_VERBOSE_ARGS_MAXIMUM = 5 };
  /* Internationalized format string. */
  const char *yyformat = YY_NULLPTR;
  /* Arguments of yyformat. */
  char const *yyarg[YYERROR_VERBOSE_ARGS_MAXIMUM];
  /* Number of reported tokens (one for the "unexpected", one per
     "expected"). */
  int yycount = 0;

  /* There are many possibilities here to consider:
     - If this state is a consistent state with a default action, then
       the only way this function was invoked is if the default action
       is an error action.  In that case, don't check for expected
       tokens because there are none.
     - The only way there can be no lookahead present (in yychar) is if
       this state is a consistent state with a default action.  Thus,
       detecting the absence of a lookahead is sufficient to determine
       that there is no unexpected or expected token to report.  In that
       case, just report a simple "syntax error".
     - Don't assume there isn't a lookahead just because this state is a
       consistent state with a default action.  There might have been a
       previous inconsistent state, consistent state with a non-default
       action, or user semantic action that manipulated yychar.
     - Of course, the expected token list depends on states to have
       correct lookahead information, and it depends on the parser not
       to perform extra reductions after fetching a lookahead from the
       scanner and before detecting a syntax error.  Thus, state merging
       (from LALR or IELR) and default reductions corrupt the expected
       token list.  However, the list is correct for canonical LR with
       one exception: it will still contain any token that will not be
       accepted due to an error action in a later state.
  */
  if (yytoken != YYEMPTY)
    {
      int yyn = yypact[*yyssp];
      yyarg[yycount++] = yytname[yytoken];
      if (!yypact_value_is_default (yyn))
        {
          /* Start YYX at -YYN if negative to avoid negative indexes in
             YYCHECK.  In other words, skip the first -YYN actions for
             this state because they are default actions.  */
          int yyxbegin = yyn < 0 ? -yyn : 0;
          /* Stay within bounds of both yycheck and yytname.  */
          int yychecklim = YYLAST - yyn + 1;
          int yyxend = yychecklim < YYNTOKENS ? yychecklim : YYNTOKENS;
          int yyx;

          for (yyx = yyxbegin; yyx < yyxend; ++yyx)
            if (yycheck[yyx + yyn] == yyx && yyx != YYTERROR
                && !yytable_value_is_error (yytable[yyx + yyn]))
              {
                if (yycount == YYERROR_VERBOSE_ARGS_MAXIMUM)
                  {
                    yycount = 1;
                    yysize = yysize0;
                    break;
                  }
                yyarg[yycount++] = yytname[yyx];
                {
                  YYSIZE_T yysize1 = yysize + yytnamerr (YY_NULLPTR, yytname[yyx]);
                  if (yysize <= yysize1 && yysize1 <= YYSTACK_ALLOC_MAXIMUM)
                    yysize = yysize1;
                  else
                    return 2;
                }
              }
        }
    }

  switch (yycount)
    {
# define YYCASE_(N, S)                      \
      case N:                               \
        yyformat = S;                       \
      break
    default: /* Avoid compiler warnings. */
      YYCASE_(0, YY_("syntax error"));
      YYCASE_(1, YY_("syntax error, unexpected %s"));
      YYCASE_(2, YY_("syntax error, unexpected %s, expecting %s"));
      YYCASE_(3, YY_("syntax error, unexpected %s, expecting %s or %s"));
      YYCASE_(4, YY_("syntax error, unexpected %s, expecting %s or %s or %s"));
      YYCASE_(5, YY_("syntax error, unexpected %s, expecting %s or %s or %s or %s"));
# undef YYCASE_
    }

  {
    YYSIZE_T yysize1 = yysize + yystrlen (yyformat);
    if (yysize <= yysize1 && yysize1 <= YYSTACK_ALLOC_MAXIMUM)
      yysize = yysize1;
    else
      return 2;
  }

  if (*yymsg_alloc < yysize)
    {
      *yymsg_alloc = 2 * yysize;
      if (! (yysize <= *yymsg_alloc
             && *yymsg_alloc <= YYSTACK_ALLOC_MAXIMUM))
        *yymsg_alloc = YYSTACK_ALLOC_MAXIMUM;
      return 1;
    }

  /* Avoid sprintf, as that infringes on the user's name space.
     Don't have undefined behavior even if the translation
     produced a string with the wrong number of "%s"s.  */
  {
    char *yyp = *yymsg;
    int yyi = 0;
    while ((*yyp = *yyformat) != '\0')
      if (*yyp == '%' && yyformat[1] == 's' && yyi < yycount)
        {
          yyp += yytnamerr (yyp, yyarg[yyi++]);
          yyformat += 2;
        }
      else
        {
          yyp++;
          yyformat++;
        }
  }
  return 0;
}
#endif /* YYERROR_VERBOSE */

/*-----------------------------------------------.
| Release the memory associated to this symbol.  |
`-----------------------------------------------*/

static void
yydestruct (const char *yymsg, int yytype, YYSTYPE *yyvaluep)
{
  YYUSE (yyvaluep);
  if (!yymsg)
    yymsg = "Deleting";
  YY_SYMBOL_PRINT (yymsg, yytype, yyvaluep, yylocationp);

  YY_IGNORE_MAYBE_UNINITIALIZED_BEGIN
  YYUSE (yytype);
  YY_IGNORE_MAYBE_UNINITIALIZED_END
}




/* The lookahead symbol.  */
int yychar;

/* The semantic value of the lookahead symbol.  */
YYSTYPE yylval;
/* Number of syntax errors so far.  */
int yynerrs;


/*----------.
| yyparse.  |
`----------*/

int
yyparse (void)
{
    int yystate;
    /* Number of tokens to shift before error messages enabled.  */
    int yyerrstatus;

    /* The stacks and their tools:
       'yyss': related to states.
       'yyvs': related to semantic values.

       Refer to the stacks through separate pointers, to allow yyoverflow
       to reallocate them elsewhere.  */

    /* The state stack.  */
    yytype_int16 yyssa[YYINITDEPTH];
    yytype_int16 *yyss;
    yytype_int16 *yyssp;

    /* The semantic value stack.  */
    YYSTYPE yyvsa[YYINITDEPTH];
    YYSTYPE *yyvs;
    YYSTYPE *yyvsp;

    YYSIZE_T yystacksize;

  int yyn;
  int yyresult;
  /* Lookahead token as an internal (translated) token number.  */
  int yytoken = 0;
  /* The variables used to return semantic value and location from the
     action routines.  */
  YYSTYPE yyval;

#if YYERROR_VERBOSE
  /* Buffer for error messages, and its allocated size.  */
  char yymsgbuf[128];
  char *yymsg = yymsgbuf;
  YYSIZE_T yymsg_alloc = sizeof yymsgbuf;
#endif

#define YYPOPSTACK(N)   (yyvsp -= (N), yyssp -= (N))

  /* The number of symbols on the RHS of the reduced rule.
     Keep to zero when no symbol should be popped.  */
  int yylen = 0;

  yyssp = yyss = yyssa;
  yyvsp = yyvs = yyvsa;
  yystacksize = YYINITDEPTH;

  YYDPRINTF ((stderr, "Starting parse\n"));

  yystate = 0;
  yyerrstatus = 0;
  yynerrs = 0;
  yychar = YYEMPTY; /* Cause a token to be read.  */
  goto yysetstate;


/*------------------------------------------------------------.
| yynewstate -- push a new state, which is found in yystate.  |
`------------------------------------------------------------*/
yynewstate:
  /* In all cases, when you get here, the value and location stacks
     have just been pushed.  So pushing a state here evens the stacks.  */
  yyssp++;


/*--------------------------------------------------------------------.
| yynewstate -- set current state (the top of the stack) to yystate.  |
`--------------------------------------------------------------------*/
yysetstate:
  YYDPRINTF ((stderr, "Entering state %d\n", yystate));
  YY_ASSERT (0 <= yystate && yystate < YYNSTATES);
  *yyssp = (yytype_int16) yystate;

  if (yyss + yystacksize - 1 <= yyssp)
#if !defined yyoverflow && !defined YYSTACK_RELOCATE
    goto yyexhaustedlab;
#else
    {
      /* Get the current used size of the three stacks, in elements.  */
      YYSIZE_T yysize = (YYSIZE_T) (yyssp - yyss + 1);

# if defined yyoverflow
      {
        /* Give user a chance to reallocate the stack.  Use copies of
           these so that the &'s don't force the real ones into
           memory.  */
        YYSTYPE *yyvs1 = yyvs;
        yytype_int16 *yyss1 = yyss;

        /* Each stack pointer address is followed by the size of the
           data in use in that stack, in bytes.  This used to be a
           conditional around just the two extra args, but that might
           be undefined if yyoverflow is a macro.  */
        yyoverflow (YY_("memory exhausted"),
                    &yyss1, yysize * sizeof (*yyssp),
                    &yyvs1, yysize * sizeof (*yyvsp),
                    &yystacksize);
        yyss = yyss1;
        yyvs = yyvs1;
      }
# else /* defined YYSTACK_RELOCATE */
      /* Extend the stack our own way.  */
      if (YYMAXDEPTH <= yystacksize)
        goto yyexhaustedlab;
      yystacksize *= 2;
      if (YYMAXDEPTH < yystacksize)
        yystacksize = YYMAXDEPTH;

      {
        yytype_int16 *yyss1 = yyss;
        union yyalloc *yyptr =
          (union yyalloc *) YYSTACK_ALLOC (YYSTACK_BYTES (yystacksize));
        if (! yyptr)
          goto yyexhaustedlab;
        YYSTACK_RELOCATE (yyss_alloc, yyss);
        YYSTACK_RELOCATE (yyvs_alloc, yyvs);
# undef YYSTACK_RELOCATE
        if (yyss1 != yyssa)
          YYSTACK_FREE (yyss1);
      }
# endif

      yyssp = yyss + yysize - 1;
      yyvsp = yyvs + yysize - 1;

      YYDPRINTF ((stderr, "Stack size increased to %lu\n",
                  (unsigned long) yystacksize));

      if (yyss + yystacksize - 1 <= yyssp)
        YYABORT;
    }
#endif /* !defined yyoverflow && !defined YYSTACK_RELOCATE */

  if (yystate == YYFINAL)
    YYACCEPT;

  goto yybackup;


/*-----------.
| yybackup.  |
`-----------*/
yybackup:
  /* Do appropriate processing given the current state.  Read a
     lookahead token if we need one and don't already have one.  */

  /* First try to decide what to do without reference to lookahead token.  */
  yyn = yypact[yystate];
  if (yypact_value_is_default (yyn))
    goto yydefault;

  /* Not known => get a lookahead token if don't already have one.  */

  /* YYCHAR is either YYEMPTY or YYEOF or a valid lookahead symbol.  */
  if (yychar == YYEMPTY)
    {
      YYDPRINTF ((stderr, "Reading a token: "));
      yychar = yylex ();
    }

  if (yychar <= YYEOF)
    {
      yychar = yytoken = YYEOF;
      YYDPRINTF ((stderr, "Now at end of input.\n"));
    }
  else
    {
      yytoken = YYTRANSLATE (yychar);
      YY_SYMBOL_PRINT ("Next token is", yytoken, &yylval, &yylloc);
    }

  /* If the proper action on seeing token YYTOKEN is to reduce or to
     detect an error, take that action.  */
  yyn += yytoken;
  if (yyn < 0 || YYLAST < yyn || yycheck[yyn] != yytoken)
    goto yydefault;
  yyn = yytable[yyn];
  if (yyn <= 0)
    {
      if (yytable_value_is_error (yyn))
        goto yyerrlab;
      yyn = -yyn;
      goto yyreduce;
    }

  /* Count tokens shifted since error; after three, turn off error
     status.  */
  if (yyerrstatus)
    yyerrstatus--;

  /* Shift the lookahead token.  */
  YY_SYMBOL_PRINT ("Shifting", yytoken, &yylval, &yylloc);

  /* Discard the shifted token.  */
  yychar = YYEMPTY;

  yystate = yyn;
  YY_IGNORE_MAYBE_UNINITIALIZED_BEGIN
  *++yyvsp = yylval;
  YY_IGNORE_MAYBE_UNINITIALIZED_END
  goto yynewstate;


/*-----------------------------------------------------------.
| yydefault -- do the default action for the current state.  |
`-----------------------------------------------------------*/
yydefault:
  yyn = yydefact[yystate];
  if (yyn == 0)
    goto yyerrlab;
  goto yyreduce;


/*-----------------------------.
| yyreduce -- do a reduction.  |
`-----------------------------*/
yyreduce:
  /* yyn is the number of a rule to reduce with.  */
  yylen = yyr2[yyn];

  /* If YYLEN is nonzero, implement the default value of the action:
     '$$ = $1'.

     Otherwise, the following line sets YYVAL to garbage.
     This behavior is undocumented and Bison
     users should not rely upon it.  Assigning to YYVAL
     unconditionally makes the parser a bit smaller, and it avoids a
     GCC warning that YYVAL may be used uninitialized.  */
  yyval = yyvsp[1-yylen];


  YY_REDUCE_PRINT (yyn);
  switch (yyn)
    {
  case 4:
#line 131 "SDCC.y"
    { 
                               blockNo=0;
                             }
#line 2078 "SDCCy.c"
    break;

  case 5:
#line 134 "SDCC.y"
    { 
			       if ((yyvsp[0].sym) && (yyvsp[0].sym)->type
				&& IS_FUNC((yyvsp[0].sym)->type))
			       {
 				   /* The only legal storage classes for 
				    * a function prototype (declaration)
				    * are extern and static. extern is the
				    * default. Thus, if this function isn't
				    * explicitly marked static, mark it
				    * extern.
				    */
				   if ((yyvsp[0].sym)->etype 
				    && IS_SPEC((yyvsp[0].sym)->etype)
				    && !SPEC_STAT((yyvsp[0].sym)->etype))
				   {
				   	SPEC_EXTR((yyvsp[0].sym)->etype) = 1;
				   }
			       }
                               addSymChain ((yyvsp[0].sym));
                               allocVariables ((yyvsp[0].sym)) ;
			       cleanUpLevel (SymbolTab,1);
                             }
#line 2105 "SDCCy.c"
    break;

  case 6:
#line 159 "SDCC.y"
    {   /* function type not specified */
                                   /* assume it to be 'int'       */
                                   addDecl((yyvsp[-1].sym),0,newIntLink());
				   (yyval.asts) = createFunction((yyvsp[-1].sym),(yyvsp[0].asts)); 
                               }
#line 2115 "SDCCy.c"
    break;

  case 7:
#line 165 "SDCC.y"
    {   
				    pointerTypes((yyvsp[-1].sym)->type,copyLinkChain((yyvsp[-2].lnk)));
				    addDecl((yyvsp[-1].sym),0,(yyvsp[-2].lnk)); 
				    (yyval.asts) = createFunction((yyvsp[-1].sym),(yyvsp[0].asts));   
				}
#line 2125 "SDCCy.c"
    break;

  case 9:
#line 174 "SDCC.y"
    { (yyval.lnk) = mergeSpec((yyvsp[-1].lnk),(yyvsp[0].lnk),"function_attribute"); }
#line 2131 "SDCCy.c"
    break;

  case 10:
#line 178 "SDCC.y"
    {
                        (yyval.lnk) = newLink() ;
                        (yyval.lnk)->class = SPECIFIER   ;
			FUNC_REGBANK((yyval.lnk)) = (int) floatFromVal((yyvsp[0].val));
                     }
#line 2141 "SDCCy.c"
    break;

  case 11:
#line 183 "SDCC.y"
    {  (yyval.lnk) = newLink ();
                        (yyval.lnk)->class = SPECIFIER   ;
			FUNC_ISREENT((yyval.lnk))=1;
                     }
#line 2150 "SDCCy.c"
    break;

  case 12:
#line 187 "SDCC.y"
    {  (yyval.lnk) = newLink ();
                        (yyval.lnk)->class = SPECIFIER   ;
			FUNC_ISCRITICAL((yyval.lnk)) = 1;
                     }
#line 2159 "SDCCy.c"
    break;

  case 13:
#line 191 "SDCC.y"
    {  (yyval.lnk) = newLink ();
                        (yyval.lnk)->class = SPECIFIER   ;
			FUNC_ISNAKED((yyval.lnk))=1;
                     }
#line 2168 "SDCCy.c"
    break;

  case 14:
#line 195 "SDCC.y"
    {(yyval.lnk) = newLink ();
                        (yyval.lnk)->class = SPECIFIER   ;
                        FUNC_NONBANKED((yyval.lnk)) = 1;
			if (FUNC_BANKED((yyval.lnk))) {
			    werror(W_BANKED_WITH_NONBANKED);
			}
                     }
#line 2180 "SDCCy.c"
    break;

  case 15:
#line 202 "SDCC.y"
    {(yyval.lnk) = newLink ();
                        (yyval.lnk)->class = SPECIFIER   ;
                        FUNC_BANKED((yyval.lnk)) = 1;
			if (FUNC_NONBANKED((yyval.lnk))) {
			    werror(W_BANKED_WITH_NONBANKED);
			}
			if (SPEC_STAT((yyval.lnk))) {
			    werror(W_BANKED_WITH_STATIC);
			}
                     }
#line 2195 "SDCCy.c"
    break;

  case 16:
#line 213 "SDCC.y"
    {
                        (yyval.lnk) = newLink () ;
                        (yyval.lnk)->class = SPECIFIER ;
                        FUNC_INTNO((yyval.lnk)) = (yyvsp[0].yyint) ;
                        FUNC_ISISR((yyval.lnk)) = 1;
                     }
#line 2206 "SDCCy.c"
    break;

  case 18:
#line 224 "SDCC.y"
    {
            werror(E_OLD_STYLE,((yyvsp[-1].sym) ? (yyvsp[-1].sym)->name: "")) ;
	    exit(1);
         }
#line 2215 "SDCCy.c"
    break;

  case 19:
#line 231 "SDCC.y"
    {  (yyval.asts) = newAst_VALUE(symbolVal((yyvsp[0].sym)));  }
#line 2221 "SDCCy.c"
    break;

  case 20:
#line 232 "SDCC.y"
    {  (yyval.asts) = newAst_VALUE((yyvsp[0].val));  }
#line 2227 "SDCCy.c"
    break;

  case 22:
#line 234 "SDCC.y"
    {  (yyval.asts) = (yyvsp[-1].asts) ;                   }
#line 2233 "SDCCy.c"
    break;

  case 23:
#line 238 "SDCC.y"
    { (yyval.asts) = newAst_VALUE((yyvsp[0].val)); }
#line 2239 "SDCCy.c"
    break;

  case 25:
#line 243 "SDCC.y"
    { (yyval.asts) = newNode	('[', (yyvsp[-3].asts), (yyvsp[-1].asts)) ; }
#line 2245 "SDCCy.c"
    break;

  case 26:
#line 244 "SDCC.y"
    { (yyval.asts) = newNode  (CALL,(yyvsp[-2].asts),NULL); 
                                          (yyval.asts)->left->funcName = 1;}
#line 2252 "SDCCy.c"
    break;

  case 27:
#line 247 "SDCC.y"
    { 	   
	    (yyval.asts) = newNode  (CALL,(yyvsp[-3].asts),(yyvsp[-1].asts)) ; (yyval.asts)->left->funcName = 1;
	  }
#line 2260 "SDCCy.c"
    break;

  case 28:
#line 251 "SDCC.y"
    {    
			(yyvsp[0].sym) = newSymbol((yyvsp[0].sym)->name,NestLevel);
			(yyvsp[0].sym)->implicit = 1;
			(yyval.asts) = newNode(PTR_OP,newNode('&',(yyvsp[-2].asts),NULL),newAst_VALUE(symbolVal((yyvsp[0].sym))));
/* 			$$ = newNode('.',$1,newAst(EX_VALUE,symbolVal($3))) ;		        */
		      }
#line 2271 "SDCCy.c"
    break;

  case 29:
#line 258 "SDCC.y"
    { 
			(yyvsp[0].sym) = newSymbol((yyvsp[0].sym)->name,NestLevel);
			(yyvsp[0].sym)->implicit = 1;			
			(yyval.asts) = newNode(PTR_OP,(yyvsp[-2].asts),newAst_VALUE(symbolVal((yyvsp[0].sym))));
		      }
#line 2281 "SDCCy.c"
    break;

  case 30:
#line 264 "SDCC.y"
    {	(yyval.asts) = newNode(INC_OP,(yyvsp[-1].asts),NULL);}
#line 2287 "SDCCy.c"
    break;

  case 31:
#line 266 "SDCC.y"
    {	(yyval.asts) = newNode(DEC_OP,(yyvsp[-1].asts),NULL); }
#line 2293 "SDCCy.c"
    break;

  case 33:
#line 271 "SDCC.y"
    { (yyval.asts) = newNode(PARAM,(yyvsp[-2].asts),(yyvsp[0].asts)); }
#line 2299 "SDCCy.c"
    break;

  case 35:
#line 276 "SDCC.y"
    { (yyval.asts) = newNode(INC_OP,NULL,(yyvsp[0].asts));  }
#line 2305 "SDCCy.c"
    break;

  case 36:
#line 277 "SDCC.y"
    { (yyval.asts) = newNode(DEC_OP,NULL,(yyvsp[0].asts));  }
#line 2311 "SDCCy.c"
    break;

  case 37:
#line 278 "SDCC.y"
    { (yyval.asts) = newNode((yyvsp[-1].yyint),(yyvsp[0].asts),NULL)    ;  }
#line 2317 "SDCCy.c"
    break;

  case 38:
#line 279 "SDCC.y"
    { (yyval.asts) = newNode(SIZEOF,NULL,(yyvsp[0].asts));  }
#line 2323 "SDCCy.c"
    break;

  case 39:
#line 280 "SDCC.y"
    { (yyval.asts) = newAst_VALUE(sizeofOp((yyvsp[-1].lnk))); }
#line 2329 "SDCCy.c"
    break;

  case 40:
#line 284 "SDCC.y"
    { (yyval.yyint) = '&' ;}
#line 2335 "SDCCy.c"
    break;

  case 41:
#line 285 "SDCC.y"
    { (yyval.yyint) = '*' ;}
#line 2341 "SDCCy.c"
    break;

  case 42:
#line 286 "SDCC.y"
    { (yyval.yyint) = '+' ;}
#line 2347 "SDCCy.c"
    break;

  case 43:
#line 287 "SDCC.y"
    { (yyval.yyint) = '-' ;}
#line 2353 "SDCCy.c"
    break;

  case 44:
#line 288 "SDCC.y"
    { (yyval.yyint) = '~' ;}
#line 2359 "SDCCy.c"
    break;

  case 45:
#line 289 "SDCC.y"
    { (yyval.yyint) = '!' ;}
#line 2365 "SDCCy.c"
    break;

  case 47:
#line 294 "SDCC.y"
    { (yyval.asts) = newNode(CAST,newAst_LINK((yyvsp[-2].lnk)),(yyvsp[0].asts)); }
#line 2371 "SDCCy.c"
    break;

  case 49:
#line 299 "SDCC.y"
    { (yyval.asts) = newNode('*',(yyvsp[-2].asts),(yyvsp[0].asts));}
#line 2377 "SDCCy.c"
    break;

  case 50:
#line 300 "SDCC.y"
    { (yyval.asts) = newNode('/',(yyvsp[-2].asts),(yyvsp[0].asts));}
#line 2383 "SDCCy.c"
    break;

  case 51:
#line 301 "SDCC.y"
    { (yyval.asts) = newNode('%',(yyvsp[-2].asts),(yyvsp[0].asts));}
#line 2389 "SDCCy.c"
    break;

  case 53:
#line 306 "SDCC.y"
    { (yyval.asts)=newNode('+',(yyvsp[-2].asts),(yyvsp[0].asts));}
#line 2395 "SDCCy.c"
    break;

  case 54:
#line 307 "SDCC.y"
    { (yyval.asts)=newNode('-',(yyvsp[-2].asts),(yyvsp[0].asts));}
#line 2401 "SDCCy.c"
    break;

  case 56:
#line 312 "SDCC.y"
    { (yyval.asts) = newNode(LEFT_OP,(yyvsp[-2].asts),(yyvsp[0].asts)); }
#line 2407 "SDCCy.c"
    break;

  case 57:
#line 313 "SDCC.y"
    { (yyval.asts) = newNode(RIGHT_OP,(yyvsp[-2].asts),(yyvsp[0].asts)); }
#line 2413 "SDCCy.c"
    break;

  case 59:
#line 318 "SDCC.y"
    { 
	(yyval.asts) = (port->lt_nge ? 
	      newNode('!',newNode(GE_OP,(yyvsp[-2].asts),(yyvsp[0].asts)),NULL) :
	      newNode('<', (yyvsp[-2].asts),(yyvsp[0].asts)));
   }
#line 2423 "SDCCy.c"
    break;

  case 60:
#line 323 "SDCC.y"
    { 
	   (yyval.asts) = (port->gt_nle ? 
		 newNode('!',newNode(LE_OP,(yyvsp[-2].asts),(yyvsp[0].asts)),NULL) :
		 newNode('>',(yyvsp[-2].asts),(yyvsp[0].asts)));
   }
#line 2433 "SDCCy.c"
    break;

  case 61:
#line 328 "SDCC.y"
    { 
	   (yyval.asts) = (port->le_ngt ? 
		 newNode('!', newNode('>', (yyvsp[-2].asts) , (yyvsp[0].asts) ), NULL) :
		 newNode(LE_OP,(yyvsp[-2].asts),(yyvsp[0].asts)));
   }
#line 2443 "SDCCy.c"
    break;

  case 62:
#line 333 "SDCC.y"
    { 
	   (yyval.asts) = (port->ge_nlt ? 
		 newNode('!', newNode('<', (yyvsp[-2].asts) , (yyvsp[0].asts) ), NULL) :
		 newNode(GE_OP,(yyvsp[-2].asts),(yyvsp[0].asts)));
   }
#line 2453 "SDCCy.c"
    break;

  case 64:
#line 342 "SDCC.y"
    { 
    (yyval.asts) = (port->eq_nne ? 
	  newNode('!',newNode(NE_OP,(yyvsp[-2].asts),(yyvsp[0].asts)),NULL) : 
	  newNode(EQ_OP,(yyvsp[-2].asts),(yyvsp[0].asts)));
   }
#line 2463 "SDCCy.c"
    break;

  case 65:
#line 347 "SDCC.y"
    { 
       (yyval.asts) = (port->ne_neq ? 
	     newNode('!', newNode(EQ_OP,(yyvsp[-2].asts),(yyvsp[0].asts)), NULL) : 
	     newNode(NE_OP,(yyvsp[-2].asts),(yyvsp[0].asts)));
   }
#line 2473 "SDCCy.c"
    break;

  case 67:
#line 356 "SDCC.y"
    { (yyval.asts) = newNode('&',(yyvsp[-2].asts),(yyvsp[0].asts));}
#line 2479 "SDCCy.c"
    break;

  case 69:
#line 361 "SDCC.y"
    { (yyval.asts) = newNode('^',(yyvsp[-2].asts),(yyvsp[0].asts));}
#line 2485 "SDCCy.c"
    break;

  case 71:
#line 366 "SDCC.y"
    { (yyval.asts) = newNode('|',(yyvsp[-2].asts),(yyvsp[0].asts));}
#line 2491 "SDCCy.c"
    break;

  case 73:
#line 372 "SDCC.y"
    { (yyval.asts) = newNode(AND_OP,(yyvsp[-2].asts),(yyvsp[0].asts));}
#line 2497 "SDCCy.c"
    break;

  case 75:
#line 378 "SDCC.y"
    { (yyval.asts) = newNode(OR_OP,(yyvsp[-2].asts),(yyvsp[0].asts)); }
#line 2503 "SDCCy.c"
    break;

  case 77:
#line 384 "SDCC.y"
    {
                        (yyval.asts) = newNode(':',(yyvsp[-2].asts),(yyvsp[0].asts)) ;
                        (yyval.asts) = newNode('?',(yyvsp[-4].asts),(yyval.asts)) ;
                     }
#line 2512 "SDCCy.c"
    break;

  case 79:
#line 393 "SDCC.y"
    { 
				 
			     switch ((yyvsp[-1].yyint)) {
			     case '=':
				     (yyval.asts) = newNode((yyvsp[-1].yyint),(yyvsp[-2].asts),(yyvsp[0].asts));
				     break;
			     case MUL_ASSIGN:
				     (yyval.asts) = newNode('=',(yyvsp[-2].asts),newNode('*',copyAst((yyvsp[-2].asts)),(yyvsp[0].asts)));
				     break;
			     case DIV_ASSIGN:
				     (yyval.asts) = newNode('=',(yyvsp[-2].asts),newNode('/',copyAst((yyvsp[-2].asts)),(yyvsp[0].asts)));
				     break;
			     case MOD_ASSIGN:
			     	     (yyval.asts) = newNode('=',(yyvsp[-2].asts),newNode('%',copyAst((yyvsp[-2].asts)),(yyvsp[0].asts)));
				     break;
			     case ADD_ASSIGN:
				     (yyval.asts) = newNode('=',(yyvsp[-2].asts),newNode('+',copyAst((yyvsp[-2].asts)),(yyvsp[0].asts)));
				     break;
			     case SUB_ASSIGN:
				     (yyval.asts) = newNode('=',(yyvsp[-2].asts),newNode('-',copyAst((yyvsp[-2].asts)),(yyvsp[0].asts)));
				     break;
			     case LEFT_ASSIGN:
				     (yyval.asts) = newNode('=',(yyvsp[-2].asts),newNode(LEFT_OP,copyAst((yyvsp[-2].asts)),(yyvsp[0].asts)));
				     break;
			     case RIGHT_ASSIGN:
				     (yyval.asts) = newNode('=',(yyvsp[-2].asts),newNode(RIGHT_OP,copyAst((yyvsp[-2].asts)),(yyvsp[0].asts)));
				     break;
			     case AND_ASSIGN:
				     (yyval.asts) = newNode('=',(yyvsp[-2].asts),newNode('&',copyAst((yyvsp[-2].asts)),(yyvsp[0].asts)));
				     break;
			     case XOR_ASSIGN:
				     (yyval.asts) = newNode('=',(yyvsp[-2].asts),newNode('^',copyAst((yyvsp[-2].asts)),(yyvsp[0].asts)));
				     break;
			     case OR_ASSIGN:
				     (yyval.asts) = newNode('=',(yyvsp[-2].asts),newNode('|',copyAst((yyvsp[-2].asts)),(yyvsp[0].asts)));
				     break;
			     default :
				     (yyval.asts) = NULL;
			     }
				     
                     }
#line 2558 "SDCCy.c"
    break;

  case 80:
#line 437 "SDCC.y"
    { (yyval.yyint) = '=' ;}
#line 2564 "SDCCy.c"
    break;

  case 92:
#line 452 "SDCC.y"
    { (yyval.asts) = newNode(',',(yyvsp[-2].asts),(yyvsp[0].asts));}
#line 2570 "SDCCy.c"
    break;

  case 94:
#line 460 "SDCC.y"
    { (yyval.sym) = NULL ; }
#line 2576 "SDCCy.c"
    break;

  case 95:
#line 462 "SDCC.y"
    {
         /* add the specifier list to the id */
         symbol *sym , *sym1;

         for (sym1 = sym = reverseSyms((yyvsp[-1].sym));sym != NULL;sym = sym->next) {
	     sym_link *lnk = copyLinkChain((yyvsp[-2].lnk));
	     /* do the pointer stuff */
	     pointerTypes(sym->type,lnk);
	     addDecl (sym,0,lnk) ;
	 }
        
	 (yyval.sym) = sym1 ;
      }
#line 2594 "SDCCy.c"
    break;

  case 96:
#line 478 "SDCC.y"
    { (yyval.lnk) = (yyvsp[0].lnk); }
#line 2600 "SDCCy.c"
    break;

  case 97:
#line 479 "SDCC.y"
    { 
     /* if the decl $2 is not a specifier */
     /* find the spec and replace it      */
     if ( !IS_SPEC((yyvsp[0].lnk))) {
       sym_link *lnk = (yyvsp[0].lnk) ;
       while (lnk && !IS_SPEC(lnk->next))
	 lnk = lnk->next;
       lnk->next = mergeSpec((yyvsp[-1].lnk),lnk->next, yytext);
       (yyval.lnk) = (yyvsp[0].lnk) ;
     }
     else
       (yyval.lnk) = mergeSpec((yyvsp[-1].lnk),(yyvsp[0].lnk), yytext);
   }
#line 2618 "SDCCy.c"
    break;

  case 98:
#line 492 "SDCC.y"
    { (yyval.lnk) = (yyvsp[0].lnk); }
#line 2624 "SDCCy.c"
    break;

  case 99:
#line 493 "SDCC.y"
    { 
     /* if the decl $2 is not a specifier */
     /* find the spec and replace it      */
     if ( !IS_SPEC((yyvsp[0].lnk))) {
       sym_link *lnk = (yyvsp[0].lnk) ;
       while (lnk && !IS_SPEC(lnk->next))
	 lnk = lnk->next;
       lnk->next = mergeSpec((yyvsp[-1].lnk),lnk->next, yytext);
       (yyval.lnk) = (yyvsp[0].lnk) ;
     }
     else
       (yyval.lnk) = mergeSpec((yyvsp[-1].lnk),(yyvsp[0].lnk), yytext);
   }
#line 2642 "SDCCy.c"
    break;

  case 101:
#line 510 "SDCC.y"
    { (yyvsp[0].sym)->next = (yyvsp[-2].sym) ; (yyval.sym) = (yyvsp[0].sym);}
#line 2648 "SDCCy.c"
    break;

  case 102:
#line 514 "SDCC.y"
    { (yyvsp[0].sym)->ival = NULL ; }
#line 2654 "SDCCy.c"
    break;

  case 103:
#line 515 "SDCC.y"
    { (yyvsp[-2].sym)->ival = (yyvsp[0].ilist)   ; }
#line 2660 "SDCCy.c"
    break;

  case 104:
#line 520 "SDCC.y"
    {
                  (yyval.lnk) = newLink () ;
                  (yyval.lnk)->class = SPECIFIER ;
                  SPEC_TYPEDEF((yyval.lnk)) = 1 ;
               }
#line 2670 "SDCCy.c"
    break;

  case 105:
#line 525 "SDCC.y"
    {
                  (yyval.lnk) = newLink();
                  (yyval.lnk)->class = SPECIFIER ;
                  SPEC_EXTR((yyval.lnk)) = 1 ;
               }
#line 2680 "SDCCy.c"
    break;

  case 106:
#line 530 "SDCC.y"
    {
                  (yyval.lnk) = newLink ();
                  (yyval.lnk)->class = SPECIFIER ;
                  SPEC_STAT((yyval.lnk)) = 1 ;
               }
#line 2690 "SDCCy.c"
    break;

  case 107:
#line 535 "SDCC.y"
    {
                  (yyval.lnk) = newLink () ;
                  (yyval.lnk)->class = SPECIFIER ;
                  SPEC_SCLS((yyval.lnk)) = S_AUTO  ;
               }
#line 2700 "SDCCy.c"
    break;

  case 108:
#line 540 "SDCC.y"
    {
                  (yyval.lnk) = newLink ();
                  (yyval.lnk)->class = SPECIFIER ;
                  SPEC_SCLS((yyval.lnk)) = S_REGISTER ;
               }
#line 2710 "SDCCy.c"
    break;

  case 109:
#line 548 "SDCC.y"
    { (yyval.yyint) = (int) floatFromVal((yyvsp[0].val)) ;  }
#line 2716 "SDCCy.c"
    break;

  case 111:
#line 554 "SDCC.y"
    {
           /* add this to the storage class specifier  */
           SPEC_ABSA((yyvsp[-2].lnk)) = 1;   /* set the absolute addr flag */
           /* now get the abs addr from value */
           SPEC_ADDR((yyvsp[-2].lnk)) = (int) floatFromVal(constExprValue((yyvsp[0].asts),TRUE)) ;
        }
#line 2727 "SDCCy.c"
    break;

  case 112:
#line 563 "SDCC.y"
    {
               (yyval.lnk)=newLink();
               (yyval.lnk)->class = SPECIFIER   ;
               SPEC_NOUN((yyval.lnk)) = V_CHAR  ;
            }
#line 2737 "SDCCy.c"
    break;

  case 113:
#line 568 "SDCC.y"
    {
               (yyval.lnk)=newLink();
               (yyval.lnk)->class = SPECIFIER   ;
	       (yyval.lnk)->select.s._short = 1 ;
            }
#line 2747 "SDCCy.c"
    break;

  case 114:
#line 573 "SDCC.y"
    {
               (yyval.lnk)=newLink();
               (yyval.lnk)->class = SPECIFIER   ;
               SPEC_NOUN((yyval.lnk)) = V_INT   ;
            }
#line 2757 "SDCCy.c"
    break;

  case 115:
#line 578 "SDCC.y"
    {
               (yyval.lnk)=newLink();
               (yyval.lnk)->class = SPECIFIER   ;
	       SPEC_LONG((yyval.lnk)) = 1       ;
            }
#line 2767 "SDCCy.c"
    break;

  case 116:
#line 583 "SDCC.y"
    {
               (yyval.lnk)=newLink();
               (yyval.lnk)->class = SPECIFIER   ;
               (yyval.lnk)->select.s._signed = 1;
            }
#line 2777 "SDCCy.c"
    break;

  case 117:
#line 588 "SDCC.y"
    {
               (yyval.lnk)=newLink();
               (yyval.lnk)->class = SPECIFIER   ;
               SPEC_USIGN((yyval.lnk)) = 1      ;
            }
#line 2787 "SDCCy.c"
    break;

  case 118:
#line 593 "SDCC.y"
    {
               (yyval.lnk)=newLink();
               (yyval.lnk)->class = SPECIFIER   ;
               SPEC_NOUN((yyval.lnk)) = V_VOID  ;
            }
#line 2797 "SDCCy.c"
    break;

  case 119:
#line 598 "SDCC.y"
    {
               (yyval.lnk)=newLink();
	       (yyval.lnk)->class = SPECIFIER ;
	       SPEC_CONST((yyval.lnk)) = 1;
            }
#line 2807 "SDCCy.c"
    break;

  case 120:
#line 603 "SDCC.y"
    {
               (yyval.lnk)=newLink();
	       (yyval.lnk)->class = SPECIFIER ;
	       SPEC_VOLATILE((yyval.lnk)) = 1 ;
            }
#line 2817 "SDCCy.c"
    break;

  case 121:
#line 608 "SDCC.y"
    {
               (yyval.lnk)=newLink();
	       SPEC_NOUN((yyval.lnk)) = V_FLOAT;
	       (yyval.lnk)->class = SPECIFIER ;
            }
#line 2827 "SDCCy.c"
    break;

  case 122:
#line 613 "SDCC.y"
    {
                  (yyval.lnk) = newLink ();
                  (yyval.lnk)->class = SPECIFIER ;
                  SPEC_SCLS((yyval.lnk)) = S_XDATA  ;
               }
#line 2837 "SDCCy.c"
    break;

  case 123:
#line 618 "SDCC.y"
    {
                  (yyval.lnk) = newLink () ;
                  (yyval.lnk)->class = SPECIFIER  ;
                  SPEC_SCLS((yyval.lnk)) = S_CODE ;                 
               }
#line 2847 "SDCCy.c"
    break;

  case 124:
#line 623 "SDCC.y"
    {
                  (yyval.lnk) = newLink () ;
                  (yyval.lnk)->class = SPECIFIER  ;
                  SPEC_SCLS((yyval.lnk)) = S_EEPROM ;
               }
#line 2857 "SDCCy.c"
    break;

  case 125:
#line 628 "SDCC.y"
    {
                  (yyval.lnk) = newLink ();
                  (yyval.lnk)->class = SPECIFIER ;
                  SPEC_SCLS((yyval.lnk)) = S_DATA   ;
               }
#line 2867 "SDCCy.c"
    break;

  case 126:
#line 633 "SDCC.y"
    {
                  (yyval.lnk) = newLink ();
                  (yyval.lnk)->class = SPECIFIER ;
                  SPEC_SCLS((yyval.lnk)) = S_IDATA  ;
               }
#line 2877 "SDCCy.c"
    break;

  case 127:
#line 638 "SDCC.y"
    { 
                  (yyval.lnk) = newLink ();
                  (yyval.lnk)->class = SPECIFIER ;
                  SPEC_SCLS((yyval.lnk)) = S_PDATA  ;
               }
#line 2887 "SDCCy.c"
    break;

  case 128:
#line 643 "SDCC.y"
    {
               (yyval.lnk)=newLink();
               (yyval.lnk)->class = SPECIFIER   ;
               SPEC_NOUN((yyval.lnk)) = V_BIT   ;
	       SPEC_SCLS((yyval.lnk)) = S_BIT   ;
	       SPEC_BLEN((yyval.lnk)) = 1;
	       SPEC_BSTR((yyval.lnk)) = 0;
            }
#line 2900 "SDCCy.c"
    break;

  case 130:
#line 653 "SDCC.y"
    {                           
                           cenum = NULL ;
                           (yyval.lnk) = (yyvsp[0].lnk) ;                              
                        }
#line 2909 "SDCCy.c"
    break;

  case 131:
#line 658 "SDCC.y"
    {
            symbol *sym;
            sym_link   *p  ;
            sym = findSym(TypedefTab,NULL,(yyvsp[0].yychar)) ;
            (yyval.lnk) = p = copyLinkChain(sym->type);
	    SPEC_TYPEDEF(getSpec(p)) = 0;
         }
#line 2921 "SDCCy.c"
    break;

  case 133:
#line 669 "SDCC.y"
    {
               (yyval.lnk) = newLink() ;
               (yyval.lnk)->class = SPECIFIER ;
               SPEC_NOUN((yyval.lnk)) = V_SBIT;
               SPEC_SCLS((yyval.lnk)) = S_SBIT;
            }
#line 2932 "SDCCy.c"
    break;

  case 134:
#line 675 "SDCC.y"
    {
               (yyval.lnk) = newLink() ;
               (yyval.lnk)->class = SPECIFIER ;
               SPEC_NOUN((yyval.lnk)) = V_CHAR;
               SPEC_SCLS((yyval.lnk)) = S_SFR ;
	       SPEC_USIGN((yyval.lnk)) = 1 ;
            }
#line 2944 "SDCCy.c"
    break;

  case 135:
#line 686 "SDCC.y"
    {
           structdef *sdef ;

           /* Create a structdef   */
           sdef = (yyvsp[-3].sdef) ;
           sdef->fields   = reverseSyms((yyvsp[-1].sym)) ;   /* link the fields */
           sdef->size  = compStructSize((yyvsp[-4].yyint),sdef);   /* update size of  */

           /* Create the specifier */
           (yyval.lnk) = newLink () ;
           (yyval.lnk)->class = SPECIFIER   ;
           SPEC_NOUN((yyval.lnk)) = V_STRUCT;
           SPEC_STRUCT((yyval.lnk))= sdef ;
        }
#line 2963 "SDCCy.c"
    break;

  case 136:
#line 701 "SDCC.y"
    {
            (yyval.lnk) = newLink() ;
            (yyval.lnk)->class = SPECIFIER   ;
            SPEC_NOUN((yyval.lnk)) = V_STRUCT;
            SPEC_STRUCT((yyval.lnk)) = (yyvsp[0].sdef) ;
         }
#line 2974 "SDCCy.c"
    break;

  case 137:
#line 710 "SDCC.y"
    { (yyval.yyint) = STRUCT ; }
#line 2980 "SDCCy.c"
    break;

  case 138:
#line 711 "SDCC.y"
    { (yyval.yyint) = UNION  ; }
#line 2986 "SDCCy.c"
    break;

  case 140:
#line 716 "SDCC.y"
    {  /* synthesize a name add to structtable */
     (yyval.sdef) = newStruct(genSymName(NestLevel)) ;
     (yyval.sdef)->level = NestLevel ;
     addSym (StructTab, (yyval.sdef), (yyval.sdef)->tag,(yyval.sdef)->level,currBlockno, 0);
}
#line 2996 "SDCCy.c"
    break;

  case 141:
#line 723 "SDCC.y"
    {  /* add name to structure table */
     (yyval.sdef) = findSymWithBlock (StructTab,(yyvsp[0].sym),currBlockno);
     if (! (yyval.sdef) ) {
       (yyval.sdef) = newStruct((yyvsp[0].sym)->name) ;
       (yyval.sdef)->level = NestLevel ;
       addSym (StructTab, (yyval.sdef), (yyval.sdef)->tag,(yyval.sdef)->level,currBlockno,0);
     }
}
#line 3009 "SDCCy.c"
    break;

  case 143:
#line 736 "SDCC.y"
    {
	   symbol *sym = (yyvsp[0].sym);
	   /* go to the end of the chain */
	   while (sym->next) sym = sym->next;

           sym->next = (yyvsp[-1].sym) ;
           (yyval.sym) = (yyvsp[0].sym);
       }
#line 3022 "SDCCy.c"
    break;

  case 144:
#line 748 "SDCC.y"
    {
           /* add this type to all the symbols */
           symbol *sym ;
           for ( sym = (yyvsp[-1].sym) ; sym != NULL ; sym = sym->next ) {
	       
	       /* make the symbol one level up */
	       sym->level-- ;

	       pointerTypes(sym->type,copyLinkChain((yyvsp[-2].lnk)));
	       if (!sym->type) {
		   sym->type = copyLinkChain((yyvsp[-2].lnk));
		   sym->etype = getSpec(sym->type);
	       }
	       else
		   addDecl (sym,0,cloneSpec((yyvsp[-2].lnk)));   	       
	       /* make sure the type is complete and sane */
	       checkTypeSanity(sym->etype, sym->name);
	   }
           (yyval.sym) = (yyvsp[-1].sym);
       }
#line 3047 "SDCCy.c"
    break;

  case 146:
#line 773 "SDCC.y"
    {
           (yyvsp[0].sym)->next  = (yyvsp[-2].sym) ;
           (yyval.sym) = (yyvsp[0].sym) ;
       }
#line 3056 "SDCCy.c"
    break;

  case 148:
#line 781 "SDCC.y"
    {  
                           (yyval.sym) = newSymbol (genSymName(NestLevel),NestLevel) ; 
                           (yyval.sym)->bitVar = (int) floatFromVal(constExprValue((yyvsp[0].asts),TRUE));
                        }
#line 3065 "SDCCy.c"
    break;

  case 149:
#line 786 "SDCC.y"
    { 
			  (yyvsp[-2].sym)->bitVar = (int) floatFromVal(constExprValue((yyvsp[0].asts),TRUE));			
                        }
#line 3073 "SDCCy.c"
    break;

  case 150:
#line 792 "SDCC.y"
    {
                                                addSymChain ((yyvsp[-1].sym));
                                                allocVariables(reverseSyms((yyvsp[-1].sym))) ;
                                                (yyval.lnk) = copyLinkChain(cenum->type);
                                             }
#line 3083 "SDCCy.c"
    break;

  case 151:
#line 797 "SDCC.y"
    {
                                                symbol *csym ;

                                                (yyvsp[-3].sym)->type = copyLinkChain(cenum->type);
                                                (yyvsp[-3].sym)->etype = getSpec((yyvsp[-3].sym)->type);
                                                /* add this to the enumerator table */
                                                if (!(csym=findSym(enumTab,(yyvsp[-3].sym),(yyvsp[-3].sym)->name)) && 
						    (csym && csym->level == (yyvsp[-3].sym)->level))
                                                   werror(E_DUPLICATE_TYPEDEF,csym->name);

                                                addSym ( enumTab,(yyvsp[-3].sym),(yyvsp[-3].sym)->name,(yyvsp[-3].sym)->level,(yyvsp[-3].sym)->block, 0);
						addSymChain ((yyvsp[-1].sym));
                                                allocVariables (reverseSyms((yyvsp[-1].sym)));
                                                (yyval.lnk) = copyLinkChain(cenum->type);
                                                SPEC_SCLS(getSpec((yyval.lnk))) = 0 ;
                                             }
#line 3104 "SDCCy.c"
    break;

  case 152:
#line 813 "SDCC.y"
    {
                                                symbol *csym ;

                                                /* check the enumerator table */
                                                if ((csym = findSym(enumTab,(yyvsp[0].sym),(yyvsp[0].sym)->name)))
                                                   (yyval.lnk) = copyLinkChain(csym->type);
                                                else  {
                                                   (yyval.lnk) = newLink() ;
                                                   (yyval.lnk)->class = SPECIFIER   ;
                                                   SPEC_NOUN((yyval.lnk)) = V_INT   ;
                                                }

                                                SPEC_SCLS(getSpec((yyval.lnk))) = 0 ;
                                             }
#line 3123 "SDCCy.c"
    break;

  case 154:
#line 831 "SDCC.y"
    {
                         }
#line 3130 "SDCCy.c"
    break;

  case 155:
#line 833 "SDCC.y"
    {
                                       (yyvsp[0].sym)->next = (yyvsp[-2].sym) ;
                                       (yyval.sym) = (yyvsp[0].sym)  ;
                                    }
#line 3139 "SDCCy.c"
    break;

  case 156:
#line 840 "SDCC.y"
    {
                                    /* make the symbol one level up */
                                    (yyvsp[-1].sym)->level-- ;
                                    (yyvsp[-1].sym)->type = copyLinkChain((yyvsp[0].val)->type); 
                                    (yyvsp[-1].sym)->etype= getSpec((yyvsp[-1].sym)->type);
				    SPEC_ENUM((yyvsp[-1].sym)->etype) = 1;
                                    (yyval.sym) = (yyvsp[-1].sym) ;

                                 }
#line 3153 "SDCCy.c"
    break;

  case 157:
#line 852 "SDCC.y"
    {
                              value *val ;
							
                              val = constExprValue((yyvsp[0].asts),TRUE);                         
                              (yyval.val) = cenum = val ;
                           }
#line 3164 "SDCCy.c"
    break;

  case 158:
#line 858 "SDCC.y"
    {                              
                              if (cenum)  {
                                 sprintf(lbuff,"%d",(int) floatFromVal(cenum)+1);
                                 (yyval.val) = cenum = constVal(lbuff);
                              }
                              else {
                                 sprintf(lbuff,"%d",0);
                                 (yyval.val) = cenum = constVal(lbuff);
                              }   
                           }
#line 3179 "SDCCy.c"
    break;

  case 159:
#line 871 "SDCC.y"
    { (yyval.sym) = (yyvsp[0].sym); }
#line 3185 "SDCCy.c"
    break;

  case 160:
#line 873 "SDCC.y"
    {
	     addDecl ((yyvsp[0].sym),0,reverseLink((yyvsp[-1].lnk)));
	     (yyval.sym) = (yyvsp[0].sym) ;
         }
#line 3194 "SDCCy.c"
    break;

  case 161:
#line 880 "SDCC.y"
    { (yyval.sym) = (yyvsp[0].sym) ; }
#line 3200 "SDCCy.c"
    break;

  case 162:
#line 881 "SDCC.y"
    { 
       // copy the functionAttributes (not the args and hasVargs !!)
       sym_link *funcType=(yyvsp[-1].sym)->etype;
       struct value *args=FUNC_ARGS(funcType);
       unsigned hasVargs=FUNC_HASVARARGS(funcType);

       memcpy (&funcType->funcAttrs, &(yyvsp[0].lnk)->funcAttrs, 
	       sizeof((yyvsp[0].lnk)->funcAttrs));

       FUNC_ARGS(funcType)=args;
       FUNC_HASVARARGS(funcType)=hasVargs;

       // just to be sure
       memset (&(yyvsp[0].lnk)->funcAttrs, 0,
	       sizeof((yyvsp[0].lnk)->funcAttrs));
       
       addDecl ((yyvsp[-1].sym),0,(yyvsp[0].lnk)); 
   }
#line 3223 "SDCCy.c"
    break;

  case 164:
#line 903 "SDCC.y"
    { (yyval.sym) = (yyvsp[-1].sym); }
#line 3229 "SDCCy.c"
    break;

  case 165:
#line 905 "SDCC.y"
    {
            sym_link   *p;

            p = newLink ();
            DCL_TYPE(p) = ARRAY ;
            DCL_ELEM(p) = 0     ;
            addDecl((yyvsp[-2].sym),0,p);
         }
#line 3242 "SDCCy.c"
    break;

  case 166:
#line 914 "SDCC.y"
    {
            sym_link   *p ;
			value *tval;
			
            p = (tval = constExprValue((yyvsp[-1].asts),TRUE))->etype;
            /* if it is not a constant then Error  */
            if ( SPEC_SCLS(p) != S_LITERAL)
               werror(E_CONST_EXPECTED) ;
            else {
               p = newLink ();
               DCL_TYPE(p) = ARRAY ;
               DCL_ELEM(p) = (int) floatFromVal(tval) ;
               addDecl((yyvsp[-3].sym),0,p);
            }		                
         }
#line 3262 "SDCCy.c"
    break;

  case 167:
#line 929 "SDCC.y"
    {  addDecl ((yyvsp[-2].sym),FUNCTION,NULL) ;   }
#line 3268 "SDCCy.c"
    break;

  case 168:
#line 930 "SDCC.y"
    { NestLevel++ ; currBlockno++; }
#line 3274 "SDCCy.c"
    break;

  case 169:
#line 931 "SDCC.y"
    {
	   
	     addDecl ((yyvsp[-4].sym),FUNCTION,NULL) ;
	   
	     FUNC_HASVARARGS((yyvsp[-4].sym)->type) = IS_VARG((yyvsp[-1].val));
	     FUNC_ARGS((yyvsp[-4].sym)->type) = reverseVal((yyvsp[-1].val));
	     
	     /* nest level was incremented to take care of the parms  */
	     NestLevel-- ;
	     currBlockno--;

	     // if this was a pointer (to a function)
	     if (IS_PTR((yyvsp[-4].sym)->type)) {
	       // move the args and hasVargs to the function
	       FUNC_ARGS((yyvsp[-4].sym)->etype)=FUNC_ARGS((yyvsp[-4].sym)->type);
	       FUNC_HASVARARGS((yyvsp[-4].sym)->etype)=FUNC_HASVARARGS((yyvsp[-4].sym)->type);
	       memset (&(yyvsp[-4].sym)->type->funcAttrs, 0,
		       sizeof((yyvsp[-4].sym)->type->funcAttrs));
	       // remove the symbol args (if any)
	       cleanUpLevel(SymbolTab,NestLevel+1);
	     }
	     
	     (yyval.sym) = (yyvsp[-4].sym);
         }
#line 3303 "SDCCy.c"
    break;

  case 170:
#line 956 "SDCC.y"
    {	   
	   werror(E_OLD_STYLE,(yyvsp[-3].sym)->name) ;	  
	   
	   /* assume it returns an int */
	   (yyvsp[-3].sym)->type = (yyvsp[-3].sym)->etype = newIntLink();
	   (yyval.sym) = (yyvsp[-3].sym) ;
         }
#line 3315 "SDCCy.c"
    break;

  case 171:
#line 966 "SDCC.y"
    { (yyval.lnk) = (yyvsp[0].lnk) ;}
#line 3321 "SDCCy.c"
    break;

  case 172:
#line 968 "SDCC.y"
    {
	     (yyval.lnk) = (yyvsp[-1].lnk)  ;		
	     DCL_TSPEC((yyvsp[-1].lnk)) = (yyvsp[0].lnk);
	 }
#line 3330 "SDCCy.c"
    break;

  case 173:
#line 973 "SDCC.y"
    {
	     (yyval.lnk) = (yyvsp[-1].lnk) ;		
	     (yyval.lnk)->next = (yyvsp[0].lnk) ;
	     DCL_TYPE((yyvsp[0].lnk))=GPOINTER;
	 }
#line 3340 "SDCCy.c"
    break;

  case 174:
#line 979 "SDCC.y"
    {
	     (yyval.lnk) = (yyvsp[-2].lnk) ;  	     
	     if (IS_SPEC((yyvsp[-1].lnk)) && DCL_TYPE((yyvsp[0].lnk)) == UPOINTER) {
		 DCL_PTR_CONST((yyvsp[-2].lnk)) = SPEC_CONST((yyvsp[-1].lnk));
		 DCL_PTR_VOLATILE((yyvsp[-2].lnk)) = SPEC_VOLATILE((yyvsp[-1].lnk));
		 switch (SPEC_SCLS((yyvsp[-1].lnk))) {
		 case S_XDATA:
		     DCL_TYPE((yyvsp[0].lnk)) = FPOINTER;
		     break;
		 case S_IDATA:
		     DCL_TYPE((yyvsp[0].lnk)) = IPOINTER ;
		     break;
		 case S_PDATA:
		     DCL_TYPE((yyvsp[0].lnk)) = PPOINTER ;
		     break;
		 case S_DATA:
		     DCL_TYPE((yyvsp[0].lnk)) = POINTER ;
		     break;
		 case S_CODE:
		     DCL_PTR_CONST((yyvsp[0].lnk)) = 1;
		     DCL_TYPE((yyvsp[0].lnk)) = CPOINTER ;
		     break;
		 case S_EEPROM:
		     DCL_TYPE((yyvsp[0].lnk)) = EEPPOINTER;
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
	     (yyval.lnk)->next = (yyvsp[0].lnk) ;
	 }
#line 3381 "SDCCy.c"
    break;

  case 175:
#line 1019 "SDCC.y"
    {
	(yyval.lnk) = newLink();
	DCL_TYPE((yyval.lnk))=UPOINTER;
      }
#line 3390 "SDCCy.c"
    break;

  case 177:
#line 1028 "SDCC.y"
    {
     /* if the decl $2 is not a specifier */
     /* find the spec and replace it      */
     if ( !IS_SPEC((yyvsp[0].lnk))) {
       sym_link *lnk = (yyvsp[0].lnk) ;
       while (lnk && !IS_SPEC(lnk->next))
	 lnk = lnk->next;
       lnk->next = mergeSpec((yyvsp[-1].lnk),lnk->next, "type_specifier_list");
       (yyval.lnk) = (yyvsp[0].lnk) ;
     }
     else
       (yyval.lnk) = mergeSpec((yyvsp[-1].lnk),(yyvsp[0].lnk), "type_specifier_list");
   }
#line 3408 "SDCCy.c"
    break;

  case 181:
#line 1051 "SDCC.y"
    {            
	   (yyvsp[0].sym)->next = (yyvsp[-2].sym);
	   (yyval.sym) = (yyvsp[0].sym) ;
         }
#line 3417 "SDCCy.c"
    break;

  case 183:
#line 1059 "SDCC.y"
    { (yyvsp[-2].val)->vArgs = 1;}
#line 3423 "SDCCy.c"
    break;

  case 185:
#line 1065 "SDCC.y"
    {
            (yyvsp[0].val)->next = (yyvsp[-2].val) ;
            (yyval.val) = (yyvsp[0].val) ;	    
         }
#line 3432 "SDCCy.c"
    break;

  case 186:
#line 1073 "SDCC.y"
    {	
		  symbol *loop ;
		  pointerTypes((yyvsp[0].sym)->type,(yyvsp[-1].lnk));
                  addDecl ((yyvsp[0].sym),0,(yyvsp[-1].lnk));		  
		  for (loop=(yyvsp[0].sym);loop;loop->_isparm=1,loop=loop->next);
		  addSymChain ((yyvsp[0].sym));
		  (yyval.val) = symbolVal((yyvsp[0].sym));
               }
#line 3445 "SDCCy.c"
    break;

  case 187:
#line 1081 "SDCC.y"
    { 
                  (yyval.val) = newValue() ; 
                  (yyval.val)->type = (yyvsp[0].lnk);
                  (yyval.val)->etype = getSpec((yyval.val)->type);
               }
#line 3455 "SDCCy.c"
    break;

  case 188:
#line 1089 "SDCC.y"
    { (yyval.lnk) = (yyvsp[0].lnk) ;}
#line 3461 "SDCCy.c"
    break;

  case 189:
#line 1091 "SDCC.y"
    {
		 /* go to the end of the list */
		 sym_link *p;
		 pointerTypes((yyvsp[0].lnk),(yyvsp[-1].lnk));
		 for ( p = (yyvsp[0].lnk) ; p->next ; p=p->next);
                  p->next = (yyvsp[-1].lnk) ;
                  (yyval.lnk) = (yyvsp[0].lnk) ;
               }
#line 3474 "SDCCy.c"
    break;

  case 190:
#line 1102 "SDCC.y"
    { (yyval.lnk) = reverseLink((yyvsp[0].lnk)); }
#line 3480 "SDCCy.c"
    break;

  case 192:
#line 1104 "SDCC.y"
    { (yyvsp[-1].lnk) = reverseLink((yyvsp[-1].lnk)); (yyvsp[-1].lnk)->next = (yyvsp[0].lnk) ; (yyval.lnk) = (yyvsp[-1].lnk);}
#line 3486 "SDCCy.c"
    break;

  case 193:
#line 1108 "SDCC.y"
    { (yyval.lnk) = (yyvsp[-1].lnk) ; }
#line 3492 "SDCCy.c"
    break;

  case 194:
#line 1109 "SDCC.y"
    {             
                                       (yyval.lnk) = newLink ();
                                       DCL_TYPE((yyval.lnk)) = ARRAY ;
                                       DCL_ELEM((yyval.lnk)) = 0     ;
                                    }
#line 3502 "SDCCy.c"
    break;

  case 195:
#line 1114 "SDCC.y"
    { 
                                       value *val ;
                                       (yyval.lnk) = newLink ();
                                       DCL_TYPE((yyval.lnk)) = ARRAY ;
                                       DCL_ELEM((yyval.lnk)) = (int) floatFromVal(val = constExprValue((yyvsp[-1].asts),TRUE));
                                    }
#line 3513 "SDCCy.c"
    break;

  case 196:
#line 1120 "SDCC.y"
    {
                                       (yyval.lnk) = newLink ();
                                       DCL_TYPE((yyval.lnk)) = ARRAY ;
                                       DCL_ELEM((yyval.lnk)) = 0     ;
                                       (yyval.lnk)->next = (yyvsp[-2].lnk) ;
                                    }
#line 3524 "SDCCy.c"
    break;

  case 197:
#line 1127 "SDCC.y"
    {
                                       value *val ;
                                       (yyval.lnk) = newLink ();
                                       DCL_TYPE((yyval.lnk)) = ARRAY ;
                                       DCL_ELEM((yyval.lnk)) = (int) floatFromVal(val = constExprValue((yyvsp[-1].asts),TRUE));
                                       (yyval.lnk)->next = (yyvsp[-3].lnk) ;
                                    }
#line 3536 "SDCCy.c"
    break;

  case 198:
#line 1134 "SDCC.y"
    { (yyval.lnk) = NULL;}
#line 3542 "SDCCy.c"
    break;

  case 199:
#line 1135 "SDCC.y"
    { (yyval.lnk) = NULL;}
#line 3548 "SDCCy.c"
    break;

  case 200:
#line 1136 "SDCC.y"
    {
     // $1 must be a pointer to a function
     sym_link *p=newLink();
     DCL_TYPE(p) = FUNCTION;
     (yyvsp[-2].lnk)->next=p;
   }
#line 3559 "SDCCy.c"
    break;

  case 201:
#line 1142 "SDCC.y"
    {
     if (!IS_VOID((yyvsp[-1].val)->type)) {
       // this is nonsense, so let's just burp something
       werror(E_TOO_FEW_PARMS);
     } else {
       // $1 must be a pointer to a function
       sym_link *p=newLink();
       DCL_TYPE(p) = FUNCTION;
       (yyvsp[-3].lnk)->next=p;
     }
   }
#line 3575 "SDCCy.c"
    break;

  case 202:
#line 1155 "SDCC.y"
    { (yyval.ilist) = newiList(INIT_NODE,(yyvsp[0].asts)); }
#line 3581 "SDCCy.c"
    break;

  case 203:
#line 1156 "SDCC.y"
    { (yyval.ilist) = newiList(INIT_DEEP,revinit((yyvsp[-1].ilist))); }
#line 3587 "SDCCy.c"
    break;

  case 204:
#line 1157 "SDCC.y"
    { (yyval.ilist) = newiList(INIT_DEEP,revinit((yyvsp[-2].ilist))); }
#line 3593 "SDCCy.c"
    break;

  case 206:
#line 1162 "SDCC.y"
    {  (yyvsp[0].ilist)->next = (yyvsp[-2].ilist); (yyval.ilist) = (yyvsp[0].ilist); }
#line 3599 "SDCCy.c"
    break;

  case 213:
#line 1172 "SDCC.y"
    {
                            ast *ex = newNode(INLINEASM,NULL,NULL);
			    ex->values.inlineasm = malloc(strlen((yyvsp[-1].yyinline))+1);
			    strcpy(ex->values.inlineasm,(yyvsp[-1].yyinline));			    
			    (yyval.asts) = ex;
                         }
#line 3610 "SDCCy.c"
    break;

  case 214:
#line 1182 "SDCC.y"
    {  (yyval.asts) = createLabel((yyvsp[-1].sym),NULL);  }
#line 3616 "SDCCy.c"
    break;

  case 215:
#line 1183 "SDCC.y"
    {  (yyval.asts) = createCase(STACK_PEEK(swStk),(yyvsp[-2].asts),(yyvsp[0].asts)); }
#line 3622 "SDCCy.c"
    break;

  case 216:
#line 1184 "SDCC.y"
    {  (yyval.asts) = createDefault(STACK_PEEK(swStk),(yyvsp[0].asts)); }
#line 3628 "SDCCy.c"
    break;

  case 217:
#line 1187 "SDCC.y"
    { STACK_PUSH(blockNum,currBlockno); currBlockno = ++blockNo ;  }
#line 3634 "SDCCy.c"
    break;

  case 218:
#line 1190 "SDCC.y"
    { currBlockno = STACK_POP(blockNum); }
#line 3640 "SDCCy.c"
    break;

  case 219:
#line 1194 "SDCC.y"
    { (yyval.asts) = createBlock(NULL,NULL); }
#line 3646 "SDCCy.c"
    break;

  case 220:
#line 1195 "SDCC.y"
    { (yyval.asts) = createBlock(NULL,(yyvsp[-1].asts)) ;  }
#line 3652 "SDCCy.c"
    break;

  case 221:
#line 1197 "SDCC.y"
    { addSymChain((yyvsp[0].sym)); }
#line 3658 "SDCCy.c"
    break;

  case 222:
#line 1198 "SDCC.y"
    { (yyval.asts) = createBlock((yyvsp[-2].sym),NULL) ;  }
#line 3664 "SDCCy.c"
    break;

  case 223:
#line 1200 "SDCC.y"
    {  addSymChain ((yyvsp[0].sym)); }
#line 3670 "SDCCy.c"
    break;

  case 224:
#line 1202 "SDCC.y"
    {(yyval.asts) = createBlock((yyvsp[-3].sym),(yyvsp[-1].asts))   ;  }
#line 3676 "SDCCy.c"
    break;

  case 225:
#line 1203 "SDCC.y"
    { (yyval.asts) = NULL ; }
#line 3682 "SDCCy.c"
    break;

  case 226:
#line 1208 "SDCC.y"
    {
       /* if this is typedef declare it immediately */
       if ( (yyvsp[0].sym) && IS_TYPEDEF((yyvsp[0].sym)->etype)) {
	 allocVariables ((yyvsp[0].sym));
	 (yyval.sym) = NULL ;
       }
       else
	 (yyval.sym) = (yyvsp[0].sym) ;
     }
#line 3696 "SDCCy.c"
    break;

  case 227:
#line 1219 "SDCC.y"
    {
       symbol   *sym;
       
       /* if this is a typedef */
       if ((yyvsp[0].sym) && IS_TYPEDEF((yyvsp[0].sym)->etype)) {
	 allocVariables ((yyvsp[0].sym));
	 (yyval.sym) = (yyvsp[-1].sym) ;
       }
       else {
				/* get to the end of the previous decl */
	 if ( (yyvsp[-1].sym) ) {
	   (yyval.sym) = sym = (yyvsp[-1].sym) ;
	   while (sym->next)
	     sym = sym->next ;
	   sym->next = (yyvsp[0].sym);
	 } 
	 else
	   (yyval.sym) = (yyvsp[0].sym) ;
       }
     }
#line 3721 "SDCCy.c"
    break;

  case 229:
#line 1243 "SDCC.y"
    {  (yyval.asts) = newNode(NULLOP,(yyvsp[-1].asts),(yyvsp[0].asts)) ;}
#line 3727 "SDCCy.c"
    break;

  case 230:
#line 1247 "SDCC.y"
    { (yyval.asts) = NULL;}
#line 3733 "SDCCy.c"
    break;

  case 232:
#line 1252 "SDCC.y"
    { (yyval.asts) = (yyvsp[0].asts)  ; }
#line 3739 "SDCCy.c"
    break;

  case 233:
#line 1253 "SDCC.y"
    { (yyval.asts) = NULL;}
#line 3745 "SDCCy.c"
    break;

  case 234:
#line 1258 "SDCC.y"
    { noLineno++ ; (yyval.asts) = createIf ((yyvsp[-3].asts), (yyvsp[-1].asts), (yyvsp[0].asts) ); noLineno--;}
#line 3751 "SDCCy.c"
    break;

  case 235:
#line 1259 "SDCC.y"
    { 
                              ast *ex ;                              
                              static   int swLabel = 0 ;

                              /* create a node for expression  */
                              ex = newNode(SWITCH,(yyvsp[-1].asts),NULL);
                              STACK_PUSH(swStk,ex);   /* save it in the stack */
                              ex->values.switchVals.swNum = swLabel ;
                                 
                              /* now create the label */
                              sprintf(lbuff,"_swBrk_%d",swLabel++);
                              (yyval.sym)  =  newSymbol(lbuff,NestLevel);
                              /* put label in the break stack  */
                              STACK_PUSH(breakStack,(yyval.sym));   
                           }
#line 3771 "SDCCy.c"
    break;

  case 236:
#line 1274 "SDCC.y"
    {  
                              /* get back the switch form the stack  */
                              (yyval.asts) = STACK_POP(swStk)  ;
                              (yyval.asts)->right = newNode (NULLOP,(yyvsp[0].asts),createLabel((yyvsp[-1].sym),NULL));
                              STACK_POP(breakStack);   
                           }
#line 3782 "SDCCy.c"
    break;

  case 237:
#line 1282 "SDCC.y"
    {  /* create and push the continue , break & body labels */
                  static int Lblnum = 0 ;
		  /* continue */
                  sprintf (lbuff,"_whilecontinue_%d",Lblnum);
		  STACK_PUSH(continueStack,newSymbol(lbuff,NestLevel));
		  /* break */
		  sprintf (lbuff,"_whilebreak_%d",Lblnum);
		  STACK_PUSH(breakStack,newSymbol(lbuff,NestLevel));
		  /* body */
		  sprintf (lbuff,"_whilebody_%d",Lblnum++);
		  (yyval.sym) = newSymbol(lbuff,NestLevel);
               }
#line 3799 "SDCCy.c"
    break;

  case 238:
#line 1295 "SDCC.y"
    {  /* create and push the continue , break & body Labels */
           static int Lblnum = 0 ;

	   /* continue */
	   sprintf(lbuff,"_docontinue_%d",Lblnum);
	   STACK_PUSH(continueStack,newSymbol(lbuff,NestLevel));
	   /* break */
	   sprintf (lbuff,"_dobreak_%d",Lblnum);
	   STACK_PUSH(breakStack,newSymbol(lbuff,NestLevel));
	   /* do body */
	   sprintf (lbuff,"_dobody_%d",Lblnum++);
	   (yyval.sym) = newSymbol (lbuff,NestLevel);	   
        }
#line 3817 "SDCCy.c"
    break;

  case 239:
#line 1308 "SDCC.y"
    { /* create & push continue, break & body labels */
            static int Lblnum = 0 ;
         
            /* continue */
	    sprintf (lbuff,"_forcontinue_%d",Lblnum);
	    STACK_PUSH(continueStack,newSymbol(lbuff,NestLevel));
	    /* break    */
	    sprintf (lbuff,"_forbreak_%d",Lblnum);
	    STACK_PUSH(breakStack,newSymbol(lbuff,NestLevel));
	    /* body */
	    sprintf (lbuff,"_forbody_%d",Lblnum);
	    (yyval.sym) = newSymbol(lbuff,NestLevel);
	    /* condition */
	    sprintf (lbuff,"_forcond_%d",Lblnum++);
	    STACK_PUSH(forStack,newSymbol(lbuff,NestLevel));
          }
#line 3838 "SDCCy.c"
    break;

  case 240:
#line 1327 "SDCC.y"
    { 
			   noLineno++ ;
			   (yyval.asts) = createWhile ( (yyvsp[-4].sym), STACK_POP(continueStack),
					      STACK_POP(breakStack), (yyvsp[-2].asts), (yyvsp[0].asts) ); 
			   (yyval.asts)->lineno = (yyvsp[-4].sym)->lineDef ;
			   noLineno-- ;
			 }
#line 3850 "SDCCy.c"
    break;

  case 241:
#line 1335 "SDCC.y"
    { 
			  noLineno++ ; 
			  (yyval.asts) = createDo ( (yyvsp[-6].sym) , STACK_POP(continueStack), 
					  STACK_POP(breakStack), (yyvsp[-2].asts), (yyvsp[-5].asts));
			  (yyval.asts)->lineno = (yyvsp[-6].sym)->lineDef ;
			  noLineno-- ;
			}
#line 3862 "SDCCy.c"
    break;

  case 242:
#line 1343 "SDCC.y"
    {
			  noLineno++ ;	
			  
			  /* if break or continue statement present
			     then create a general case loop */
			  if (STACK_PEEK(continueStack)->isref ||
			      STACK_PEEK(breakStack)->isref) {
			      (yyval.asts) = createFor ((yyvsp[-8].sym), STACK_POP(continueStack),
					      STACK_POP(breakStack) ,
					      STACK_POP(forStack)   ,
					      (yyvsp[-6].asts) , (yyvsp[-4].asts) , (yyvsp[-2].asts), (yyvsp[0].asts) );
			  } else {
			      (yyval.asts) = newNode(FOR,(yyvsp[0].asts),NULL);
			      AST_FOR((yyval.asts),trueLabel) = (yyvsp[-8].sym);
			      AST_FOR((yyval.asts),continueLabel) =  STACK_POP(continueStack);
			      AST_FOR((yyval.asts),falseLabel) = STACK_POP(breakStack);
			      AST_FOR((yyval.asts),condLabel)  = STACK_POP(forStack)  ;
			      AST_FOR((yyval.asts),initExpr)   = (yyvsp[-6].asts);
			      AST_FOR((yyval.asts),condExpr)   = (yyvsp[-4].asts);
			      AST_FOR((yyval.asts),loopExpr)   = (yyvsp[-2].asts);
			  }
			  
			  noLineno-- ;
			}
#line 3891 "SDCCy.c"
    break;

  case 243:
#line 1370 "SDCC.y"
    { (yyval.asts) = NULL ; }
#line 3897 "SDCCy.c"
    break;

  case 245:
#line 1375 "SDCC.y"
    { 
                              (yyvsp[-1].sym)->islbl = 1;
                              (yyval.asts) = newAst_VALUE(symbolVal((yyvsp[-1].sym))); 
                              (yyval.asts) = newNode(GOTO,(yyval.asts),NULL);
                           }
#line 3907 "SDCCy.c"
    break;

  case 246:
#line 1380 "SDCC.y"
    {  
       /* make sure continue is in context */
       if (STACK_PEEK(continueStack) == NULL) {
	   werror(E_BREAK_CONTEXT);
	   (yyval.asts) = NULL;
       }
       else {
	   (yyval.asts) = newAst_VALUE(symbolVal(STACK_PEEK(continueStack)));      
	   (yyval.asts) = newNode(GOTO,(yyval.asts),NULL);
	   /* mark the continue label as referenced */
	   STACK_PEEK(continueStack)->isref = 1;
       }
   }
#line 3925 "SDCCy.c"
    break;

  case 247:
#line 1393 "SDCC.y"
    { 
       if (STACK_PEEK(breakStack) == NULL) {
	   werror(E_BREAK_CONTEXT);
	   (yyval.asts) = NULL;
       } else {
	   (yyval.asts) = newAst_VALUE(symbolVal(STACK_PEEK(breakStack)));
	   (yyval.asts) = newNode(GOTO,(yyval.asts),NULL);
	   STACK_PEEK(breakStack)->isref = 1;
       }
   }
#line 3940 "SDCCy.c"
    break;

  case 248:
#line 1403 "SDCC.y"
    { (yyval.asts) = newNode(RETURN,NULL,NULL)    ; }
#line 3946 "SDCCy.c"
    break;

  case 249:
#line 1404 "SDCC.y"
    { (yyval.asts) = newNode(RETURN,NULL,(yyvsp[-1].asts)) ; }
#line 3952 "SDCCy.c"
    break;

  case 250:
#line 1408 "SDCC.y"
    { (yyval.sym) = newSymbol ((yyvsp[0].yychar),NestLevel) ; }
#line 3958 "SDCCy.c"
    break;


#line 3962 "SDCCy.c"

      default: break;
    }
  /* User semantic actions sometimes alter yychar, and that requires
     that yytoken be updated with the new translation.  We take the
     approach of translating immediately before every use of yytoken.
     One alternative is translating here after every semantic action,
     but that translation would be missed if the semantic action invokes
     YYABORT, YYACCEPT, or YYERROR immediately after altering yychar or
     if it invokes YYBACKUP.  In the case of YYABORT or YYACCEPT, an
     incorrect destructor might then be invoked immediately.  In the
     case of YYERROR or YYBACKUP, subsequent parser actions might lead
     to an incorrect destructor call or verbose syntax error message
     before the lookahead is translated.  */
  YY_SYMBOL_PRINT ("-> $$ =", yyr1[yyn], &yyval, &yyloc);

  YYPOPSTACK (yylen);
  yylen = 0;
  YY_STACK_PRINT (yyss, yyssp);

  *++yyvsp = yyval;

  /* Now 'shift' the result of the reduction.  Determine what state
     that goes to, based on the state we popped back to and the rule
     number reduced by.  */
  {
    const int yylhs = yyr1[yyn] - YYNTOKENS;
    const int yyi = yypgoto[yylhs] + *yyssp;
    yystate = (0 <= yyi && yyi <= YYLAST && yycheck[yyi] == *yyssp
               ? yytable[yyi]
               : yydefgoto[yylhs]);
  }

  goto yynewstate;


/*--------------------------------------.
| yyerrlab -- here on detecting error.  |
`--------------------------------------*/
yyerrlab:
  /* Make sure we have latest lookahead translation.  See comments at
     user semantic actions for why this is necessary.  */
  yytoken = yychar == YYEMPTY ? YYEMPTY : YYTRANSLATE (yychar);

  /* If not already recovering from an error, report this error.  */
  if (!yyerrstatus)
    {
      ++yynerrs;
#if ! YYERROR_VERBOSE
      yyerror (YY_("syntax error"));
#else
# define YYSYNTAX_ERROR yysyntax_error (&yymsg_alloc, &yymsg, \
                                        yyssp, yytoken)
      {
        char const *yymsgp = YY_("syntax error");
        int yysyntax_error_status;
        yysyntax_error_status = YYSYNTAX_ERROR;
        if (yysyntax_error_status == 0)
          yymsgp = yymsg;
        else if (yysyntax_error_status == 1)
          {
            if (yymsg != yymsgbuf)
              YYSTACK_FREE (yymsg);
            yymsg = (char *) YYSTACK_ALLOC (yymsg_alloc);
            if (!yymsg)
              {
                yymsg = yymsgbuf;
                yymsg_alloc = sizeof yymsgbuf;
                yysyntax_error_status = 2;
              }
            else
              {
                yysyntax_error_status = YYSYNTAX_ERROR;
                yymsgp = yymsg;
              }
          }
        yyerror (yymsgp);
        if (yysyntax_error_status == 2)
          goto yyexhaustedlab;
      }
# undef YYSYNTAX_ERROR
#endif
    }



  if (yyerrstatus == 3)
    {
      /* If just tried and failed to reuse lookahead token after an
         error, discard it.  */

      if (yychar <= YYEOF)
        {
          /* Return failure if at end of input.  */
          if (yychar == YYEOF)
            YYABORT;
        }
      else
        {
          yydestruct ("Error: discarding",
                      yytoken, &yylval);
          yychar = YYEMPTY;
        }
    }

  /* Else will try to reuse lookahead token after shifting the error
     token.  */
  goto yyerrlab1;


/*---------------------------------------------------.
| yyerrorlab -- error raised explicitly by YYERROR.  |
`---------------------------------------------------*/
yyerrorlab:
  /* Pacify compilers when the user code never invokes YYERROR and the
     label yyerrorlab therefore never appears in user code.  */
  if (0)
    YYERROR;

  /* Do not reclaim the symbols of the rule whose action triggered
     this YYERROR.  */
  YYPOPSTACK (yylen);
  yylen = 0;
  YY_STACK_PRINT (yyss, yyssp);
  yystate = *yyssp;
  goto yyerrlab1;


/*-------------------------------------------------------------.
| yyerrlab1 -- common code for both syntax error and YYERROR.  |
`-------------------------------------------------------------*/
yyerrlab1:
  yyerrstatus = 3;      /* Each real token shifted decrements this.  */

  for (;;)
    {
      yyn = yypact[yystate];
      if (!yypact_value_is_default (yyn))
        {
          yyn += YYTERROR;
          if (0 <= yyn && yyn <= YYLAST && yycheck[yyn] == YYTERROR)
            {
              yyn = yytable[yyn];
              if (0 < yyn)
                break;
            }
        }

      /* Pop the current state because it cannot handle the error token.  */
      if (yyssp == yyss)
        YYABORT;


      yydestruct ("Error: popping",
                  yystos[yystate], yyvsp);
      YYPOPSTACK (1);
      yystate = *yyssp;
      YY_STACK_PRINT (yyss, yyssp);
    }

  YY_IGNORE_MAYBE_UNINITIALIZED_BEGIN
  *++yyvsp = yylval;
  YY_IGNORE_MAYBE_UNINITIALIZED_END


  /* Shift the error token.  */
  YY_SYMBOL_PRINT ("Shifting", yystos[yyn], yyvsp, yylsp);

  yystate = yyn;
  goto yynewstate;


/*-------------------------------------.
| yyacceptlab -- YYACCEPT comes here.  |
`-------------------------------------*/
yyacceptlab:
  yyresult = 0;
  goto yyreturn;


/*-----------------------------------.
| yyabortlab -- YYABORT comes here.  |
`-----------------------------------*/
yyabortlab:
  yyresult = 1;
  goto yyreturn;


#if !defined yyoverflow || YYERROR_VERBOSE
/*-------------------------------------------------.
| yyexhaustedlab -- memory exhaustion comes here.  |
`-------------------------------------------------*/
yyexhaustedlab:
  yyerror (YY_("memory exhausted"));
  yyresult = 2;
  /* Fall through.  */
#endif


/*-----------------------------------------------------.
| yyreturn -- parsing is finished, return the result.  |
`-----------------------------------------------------*/
yyreturn:
  if (yychar != YYEMPTY)
    {
      /* Make sure we have latest lookahead translation.  See comments at
         user semantic actions for why this is necessary.  */
      yytoken = YYTRANSLATE (yychar);
      yydestruct ("Cleanup: discarding lookahead",
                  yytoken, &yylval);
    }
  /* Do not reclaim the symbols of the rule whose action triggered
     this YYABORT or YYACCEPT.  */
  YYPOPSTACK (yylen);
  YY_STACK_PRINT (yyss, yyssp);
  while (yyssp != yyss)
    {
      yydestruct ("Cleanup: popping",
                  yystos[*yyssp], yyvsp);
      YYPOPSTACK (1);
    }
#ifndef yyoverflow
  if (yyss != yyssa)
    YYSTACK_FREE (yyss);
#endif
#if YYERROR_VERBOSE
  if (yymsg != yymsgbuf)
    YYSTACK_FREE (yymsg);
#endif
  return yyresult;
}
#line 1410 "SDCC.y"



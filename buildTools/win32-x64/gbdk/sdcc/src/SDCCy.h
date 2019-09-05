/* A Bison parser, made by GNU Bison 3.4.1.  */

/* Bison interface for Yacc-like parsers in C

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

/* Undocumented macros, especially those whose name start with YY_,
   are private implementation details.  Do not rely on them.  */

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

#line 279 "SDCCy.h"

};
typedef union YYSTYPE YYSTYPE;
# define YYSTYPE_IS_TRIVIAL 1
# define YYSTYPE_IS_DECLARED 1
#endif


extern YYSTYPE yylval;

int yyparse (void);

#endif /* !YY_YY_SDCCY_H_INCLUDED  */

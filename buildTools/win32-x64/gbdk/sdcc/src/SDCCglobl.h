/* SDCCglobl.h - global macros etc required by all files */
#ifndef SDCCGLOBL_H
#define SDCCGLOBL_H
#include <memory.h>
#include <assert.h>
#include <stdlib.h>
#include <setjmp.h>
#include <stdio.h>

/*
 * Define host port dependant constants etc.
 */

#define DOS_DIR_SEPARATOR_CHAR	    '\\'
#define DOS_DIR_SEPARATOR_STRING   "\\"
#define UNIX_DIR_SEPARATOR_CHAR    '/'
#define UNIX_DIR_SEPARATOR_STRING  "/"

#if defined(__BORLANDC__)	/* Borland Turbo C/Win32 Host */

#define NATIVE_WIN32 		1
#define DIR_SEPARATOR_CHAR	    DOS_DIR_SEPARATOR_CHAR
#define DIR_SEPARATOR_STRING	    DOS_DIR_SEPARATOR_STRING

#elif defined(_MSC_VER)		/* Miscosoft VC6/Win32 Host */

#define NATIVE_WIN32 		1
#include "sdcc_vc.h"
#define DIR_SEPARATOR_CHAR	    DOS_DIR_SEPARATOR_CHAR
#define DIR_SEPARATOR_STRING	    DOS_DIR_SEPARATOR_STRING

#elif defined(__MINGW32__)	/* MINGW32 DOS Host */

#define NATIVE_WIN32		1
#define DIR_SEPARATOR_CHAR	    DOS_DIR_SEPARATOR_CHAR
#define DIR_SEPARATOR_STRING	    DOS_DIR_SEPARATOR_STRING

#else /* Assume Un*x style system */

#include "sdccconf.h"
#define DIR_SEPARATOR_CHAR	    UNIX_DIR_SEPARATOR_CHAR
#define DIR_SEPARATOR_STRING	    UNIX_DIR_SEPARATOR_STRING

#endif // _MSC_VER

#include "SDCCerr.h"

#define SPACE ' '
#define ZERO  0

#include <limits.h>		/* PATH_MAX		     */
#ifndef PATH_MAX		/* POSIX, but not required   */
#define PATH_MAX 255		/* define a reasonable value */
#endif

#define  MAX_FNAME_LEN  128
#define  MAX_REG_PARMS  1
typedef int bool;

#ifndef max
#define max(a,b) (a > b ? a : b)
#endif

#ifndef min
#define min(a,b) (a < b ? a : b)
#endif

#ifndef THROWS
#define THROWS
#define THROW_NONE  0
#define THROW_SRC   1
#define THROW_DEST  2
#define THROW_BOTH  3
#endif

/* size's in bytes  */
#define CHARSIZE    port->s.char_size
#define SHORTSIZE   port->s.short_size
#define INTSIZE     port->s.int_size
#define LONGSIZE    port->s.long_size
#define PTRSIZE     port->s.ptr_size
#define FPTRSIZE    port->s.fptr_size
#define GPTRSIZE    port->s.gptr_size
#define BITSIZE     port->s.bit_size
#define FLOATSIZE   port->s.float_size
#define MAXBASESIZE port->s.max_base_size


#define PRAGMA_SAVE        "SAVE"
#define PRAGMA_RESTORE     "RESTORE"
#define PRAGMA_NOINDUCTION "NOINDUCTION"
#define PRAGMA_NOINVARIANT "NOINVARIANT"
#define PRAGMA_NOLOOPREV   "NOLOOPREVERSE"
#define PRAGMA_INDUCTION   "INDUCTION"
#define PRAGMA_STACKAUTO   "STACKAUTO"
#define PRAGMA_NOJTBOUND   "NOJTBOUND"
#define PRAGMA_NOGCSE      "NOGCSE"
#define PRAGMA_NOOVERLAY   "NOOVERLAY"
#define PRAGMA_CALLEESAVES "CALLEE-SAVES"
#define PRAGMA_EXCLUDE     "EXCLUDE"
#define  SMALL_MODEL 0
#define  LARGE_MODEL 1
#define  TRUE 1
#define  FALSE 0

#define MAX_TVAR 6
#define INITIAL_INLINEASM 4*1024
#define DEFPOOLSTACK(type,size)     \
    type       *type##Pool        ; \
    type *type##FreeStack [size]  ; \
    int   type##StackPtr = 0      ;

#define PUSH(x,y)   x##FreeStack[x##StackPtr++] = y
#define PEEK(x)     x##FreeStack[x##StackPtr-1]
#define POP(type)   type##FreeStack[--type##StackPtr]
/* #define POP(x)    (x##StackPtr ? x##FreeStack[--x##StackPtr] :       \
   (assert(x##StackPtr),0)) */
#ifdef UNIX
#define EMPTY(x)        (x##StackPtr <= 1 ? 1 : 0)
#else
#define EMPTY(x)	(x##StackPtr == 0 ? 1 : 0)
#endif


#define COPYTYPE(start,end,from) (end = getSpec (start = from))


/* generalpurpose stack related macros */
#define  STACK_DCL(stack,type,size)                   \
         typedef  type  t_##stack   ;                 \
         t_##stack   stack[size]    ;                 \
         t_##stack   (*p_##stack) = stack + (size);   \

/* define extern stack */
#define EXTERN_STACK_DCL(stack,type,size)             \
        typedef type t_##stack     ;                  \
        extern t_##stack stack[size] ;                \
        extern t_##stack *p_##stack;

#define  STACK_FULL(stack)    ((p_##stack) <= stack )
#define  STACK_EMPTY(stack)   ((p_##stack) >= (stack +      \
                              sizeof(stack)/sizeof(*stack)) )

#define  STACK_PUSH_(stack,x) (*--p_##stack = (x))
#define  STACK_POP_(stack)    (*p_##stack++)

#define  STACK_PUSH(stack,x)  (STACK_FULL(stack)                  \
                              ?((t_##stack)(long)(STACK_ERR(1)))  \
                              : STACK_PUSH_(stack,x)              )

#define  STACK_POP(stack)     (STACK_EMPTY(stack)                 \
                              ?((t_##stack)(long)(STACK_ERR(0)))  \
                              : STACK_POP_(stack)                 )

#define  STACK_PEEK(stack)    (STACK_EMPTY(stack)                 \
                              ?((t_##stack) NULL)                 \
                              : *p_##stack                        )

#define  STACK_ERR(o)         ( o                                 \
                              ? fprintf(stderr,"stack Overflow\n")\
                              : fprintf(stderr,"stack underflow\n"))

/* optimization options */
struct optimize
  {
    unsigned global_cse;
    unsigned ptrArithmetic;
    unsigned label1;
    unsigned label2;
    unsigned label3;
    unsigned label4;
    unsigned loopInvariant;
    unsigned loopInduction;
    unsigned noJTabBoundary;
    unsigned noLoopReverse;
  };

/** Build model.
    Used in options.model.A bit each as port.supported_models is an OR
    of these. 
*/
enum
  {
    MODEL_SMALL = 1,
    MODEL_COMPACT = 2,
    MODEL_MEDIUM = 4,
    MODEL_LARGE = 8,
    MODEL_FLAT24 = 16
  };

/* other command line options */
struct options
  {
    int model;			/* see MODEL_* defines above */
    int stackAuto;		/* Stack Automatic  */
    int useXstack;		/* use Xternal Stack */
    int stack10bit;		/* use 10 bit stack (flat24 model only) */
    int genericPtr;		/* use generic pointers */
    int dump_raw;		/* dump after intermediate code generation */
    int dump_gcse;		/* dump after gcse */
    int dump_loop;		/* dump after loop optimizations */
    int dump_kill;		/* dump after dead code elimination */
    int dump_range;		/* dump after live range analysis */
    int dump_pack;		/* dump after register packing */
    int dump_rassgn;		/* dump after register assignment */
    int dump_tree;              /* dump front-end tree before lowering to iCode */
    int cc_only;		/* compile only flag              */
    int intlong_rent;		/* integer & long support routines reentrant */
    int float_rent;		/* floating point routines are reentrant */
    int out_fmt;		/* 1 = motorola S19 format 0 = intel Hex format */
    int cyclomatic;		/* print cyclomatic information */
    int noOverlay;		/* don't overlay local variables & parameters */
    int mainreturn;		/* issue a return after main */
    int nopeep;			/* no peep hole optimization */
    int asmpeep;		/* pass inline assembler thru peep hole */
    int debug;			/* generate extra debug info */
    int stackOnData;		/* stack after data segment  */
    int c1mode;			/* Act like c1 - no pre-proc, asm or link */
    char *peep_file;		/* additional rules for peep hole */
    char *out_name;		/* Asm output name for c1 mode */
    int nostdlib;		/* Don't use standard lib files */
    int nostdinc;		/* Don't use standard include files */
    int noRegParams;            /* Disable passing some parameters in registers */
    int verbose;		/* Show what the compiler is doing */
    int shortis8bits;           /* treat short like int or char */
    int lessPedantic;           /* disable some warnings */
    int profile;                /* Turn on extra profiling information */
    int ommitFramePtr;		/* Turn off the frame pointer. */

    char *calleeSaves[128];	/* list of functions using callee save */
    char *excludeRegs[32];	/* registers excluded from saving */

    /* starting address of the segments */
    int xstack_loc;		/* initial location of external stack */
    int stack_loc;		/* initial value of internal stack pointer */
    int xdata_loc;		/* xternal ram starts at address */
    int data_loc;		/* interram start location       */
    int idata_loc;		/* indirect address space        */
    int code_loc;		/* code location start           */
    int iram_size;		/* internal ram size (used only for error checking) */
  };

/* forward definition for variables accessed globally */
extern int noAssemble;         /* no assembly, stop after code generation */
extern char *yytext;
extern char *currFname;
extern char *srcFileName;	/* source file name without the extenstion */
extern char *moduleName;	/* source file name without path & extension */
extern int currLineno;		/* current line number    */
extern int yylineno;		/* line number of the current file SDCC.lex */
extern FILE *yyin;		/* */
extern FILE *asmFile;		/* assembly output file */
extern FILE *cdbFile;		/* debugger symbol file */
extern int NestLevel;		/* NestLevel                 SDCC.y   */
extern int stackPtr;		/* stack pointer             SDCC.y   */
extern int xstackPtr;		/* external stack pointer    SDCC.y   */
extern int reentrant;		/* /X flag has been sent     SDCC.y */
extern char buffer[];		/* general buffer      SDCCgen.c   */
extern int currRegBank;		/* register bank being used   SDCCgens.c   */
extern struct symbol *currFunc;	/* current function    SDCCgens.c */
extern int cNestLevel;		/* block nest level  SDCCval.c      */
extern int currBlockno;		/* sequentail block number */
extern struct optimize optimize;
extern struct options options;
extern unsigned maxInterrupts;

/* Visible from SDCCmain.c */
extern int nrelFiles;
extern char *relFiles[128];
extern char *libFiles[128];
extern int nlibFiles;
extern char *libPaths[128];
extern int nlibPaths;

extern bool verboseExec ;

void parseWithComma (char **, char *);

/** Creates a temporary file a'la tmpfile which avoids the bugs
    in cygwin wrt c:\tmp.
    Scans, in order: TMP, TEMP, TMPDIR, else uses tmpfile().
*/
FILE *tempfile (void);

/** Creates a temporary file name a'la tmpnam which avoids the bugs
    in cygwin wrt c:\tmp.
    Scans, in order: TMP, TEMP, TMPDIR, else uses tmpfile().
*/
char *
tempfilename (void);

/** An assert() macro that will go out through sdcc's error
    system.
*/
#define wassertl(a,s)	((a) ? 0 : \
        (werror (E_INTERNAL_ERROR,__FILE__,__LINE__, s), 0))

#define wassert(a)    wassertl(a,"code generator internal error")

#define DUMP_RAW0 1
#define DUMP_RAW1 DUMP_RAW0+1
#define DUMP_CSE DUMP_RAW1+1
#define DUMP_DFLOW DUMP_CSE+1
#define DUMP_GCSE DUMP_DFLOW+1
#define DUMP_DEADCODE DUMP_GCSE+1
#define DUMP_LOOP DUMP_DEADCODE+1
#define DUMP_LOOPG DUMP_LOOP+1
#define DUMP_LOOPD DUMP_LOOPG+1
#define DUMP_RANGE DUMP_LOOPD+1
#define DUMP_PACK DUMP_RANGE+1
#define DUMP_RASSGN DUMP_PACK+1
#define DUMP_LRANGE DUMP_RASSGN+1

struct _dumpFiles {
  int id;
  char *ext;
  FILE *filePtr;
};

extern struct _dumpFiles dumpFiles[];

/* Buffer which can be used to hold a file name; assume it will
 * be trashed by any function call within SDCC.
 */
extern char scratchFileName[PATH_MAX];

#endif

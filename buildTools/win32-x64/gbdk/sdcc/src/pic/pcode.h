/*-------------------------------------------------------------------------

   pcode.h - post code generation
   Written By -  Scott Dattalo scott@dattalo.com

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
   
-------------------------------------------------------------------------*/

//#include "ralloc.h"
struct regs;

/*
   Post code generation

   The post code generation is an assembler optimizer. The assembly code
   produced by all of the previous steps is fully functional. This step
   will attempt to analyze the flow of the assembly code and agressively 
   optimize it. The peep hole optimizer attempts to do the same thing.
   As you may recall, the peep hole optimizer replaces blocks of assembly
   with more optimal blocks (e.g. removing redundant register loads).
   However, the peep hole optimizer has to be somewhat conservative since
   an assembly program has implicit state information that's unavailable 
   when only a few instructions are examined.
     Consider this example:

   example1:
     movwf  t1
     movf   t1,w

   The movf seems redundant since we know that the W register already
   contains the same value of t1. So a peep hole optimizer is tempted to
   remove the "movf". However, this is dangerous since the movf affects
   the flags in the status register (specifically the Z flag) and subsequent
   code may depend upon this. Look at these two examples:

   example2:
     movwf  t1
     movf   t1,w     ; Can't remove this movf
     skpz
      return

   example3:
     movwf  t1
     movf   t1,w     ; This  movf can be removed
     xorwf  t2,w     ; since xorwf will over write Z 
     skpz
      return

*/


#ifndef __PCODE_H__
#define __PCODE_H__

/***********************************************************************
 *  PIC status bits - this will move into device dependent headers
 ***********************************************************************/
#define PIC_C_BIT    0
#define PIC_DC_BIT   1
#define PIC_Z_BIT    2

/***********************************************************************
 *  Operand types 
 ***********************************************************************/
#define POT_RESULT  0
#define POT_LEFT    1
#define POT_RIGHT   2


/***********************************************************************
 *
 *  PIC_OPTYPE - Operand types that are specific to the PIC architecture
 *
 *  If a PIC assembly instruction has an operand then here is where we
 *  associate a type to it. For example,
 *
 *     movf    reg,W
 *
 *  The movf has two operands: 'reg' and the W register. 'reg' is some
 *  arbitrary general purpose register, hence it has the type PO_GPR_REGISTER.
 *  The W register, which is the PIC's accumulator, has the type PO_W.
 *
 ***********************************************************************/



typedef enum 
{
  PO_NONE=0,         // No operand e.g. NOP
  PO_W,              // The 'W' register
  PO_STATUS,         // The 'STATUS' register
  PO_FSR,            // The "file select register" (in 18c it's one of three)
  PO_INDF,           // The Indirect register
  PO_GPR_REGISTER,   // A general purpose register
  PO_GPR_BIT,        // A bit of a general purpose register
  PO_GPR_TEMP,       // A general purpose temporary register
  PO_SFR_REGISTER,   // A special function register (e.g. PORTA)
  PO_PCL,            // Program counter Low register
  PO_PCLATH,         // Program counter Latch high register
  PO_LITERAL,        // A constant
  PO_IMMEDIATE,      //  (8051 legacy)
  PO_DIR,            // Direct memory (8051 legacy)
  PO_CRY,            // bit memory (8051 legacy)
  PO_BIT,            // bit operand.
  PO_STR,            //  (8051 legacy)
  PO_LABEL,
  PO_WILD            // Wild card operand in peep optimizer
} PIC_OPTYPE;


/*************************************************
 * pCode conditions:
 *
 * The "conditions" are bit-mapped flags that describe
 * input and/or output conditions that are affected by
 * the instructions. For example:
 *
 *    MOVF   SOME_REG,W
 *
 * This instruction depends upon 'SOME_REG'. Consequently
 * it has the input condition PCC_REGISTER set to true.
 *
 * In addition, this instruction affects the Z bit in the
 * status register and affects W. Thus the output conditions
 * are the logical or:
 *  PCC_ZERO_BIT | PCC_W
 *
 * The conditions are intialized when the pCode for an
 * instruction is created. They're subsequently used
 * by the pCode optimizer determine state information
 * in the program flow.
 *************************************************/

#define  PCC_NONE          0
#define  PCC_REGISTER      (1<<0)
#define  PCC_C             (1<<1)
#define  PCC_Z             (1<<2)
#define  PCC_DC            (1<<3)
#define  PCC_W             (1<<4)
#define  PCC_EXAMINE_PCOP  (1<<5)

/***********************************************************************
 *
 *  PIC_OPCODE
 *
 *  This is not a list of the PIC's opcodes per se, but instead
 *  an enumeration of all of the different types of pic opcodes. 
 *
 ***********************************************************************/

typedef enum
{
  POC_WILD=-1,   /* Wild card - used in the pCode peep hole optimizer
		  * to represent ANY pic opcode */
  POC_ADDLW=0,
  POC_ADDWF,
  POC_ADDFW,
  POC_ANDLW,
  POC_ANDWF,
  POC_ANDFW,
  POC_BCF,
  POC_BSF,
  POC_BTFSC,
  POC_BTFSS,
  POC_CALL,
  POC_COMF,
  POC_COMFW,
  POC_CLRF,
  POC_CLRW,
  POC_DECF,
  POC_DECFW,
  POC_DECFSZ,
  POC_DECFSZW,
  POC_GOTO,
  POC_INCF,
  POC_INCFW,
  POC_INCFSZ,
  POC_INCFSZW,
  POC_IORLW,
  POC_IORWF,
  POC_IORFW,
  POC_MOVF,
  POC_MOVFW,
  POC_MOVLW,
  POC_MOVWF,
  POC_NEGF,
  POC_RETLW,
  POC_RETURN,
  POC_RLF,
  POC_RLFW,
  POC_RRF,
  POC_RRFW,
  POC_SUBLW,
  POC_SUBWF,
  POC_SUBFW,
  POC_SWAPF,
  POC_SWAPFW,
  POC_TRIS,
  POC_XORLW,
  POC_XORWF,
  POC_XORFW
} PIC_OPCODE;


/***********************************************************************
 *  PC_TYPE  - pCode Types
 ***********************************************************************/

typedef enum
{
  PC_COMMENT=0,   // pCode is a comment
  PC_OPCODE,      // PORT dependent opcode
  PC_LABEL,       // assembly label
  PC_FUNCTION,    // Function start or end
  PC_WILD         // wildcard - an opcode place holder
} PC_TYPE;

/************************************************/
/***************  Structures ********************/
/************************************************/
struct pCode;

/*************************************************
  pBranch

  The first step in optimizing pCode is determining
 the program flow. This information is stored in
 single-linked lists in the for of 'from' and 'to'
 objects with in a pcode. For example, most instructions
 don't involve any branching. So their from branch
 points to the pCode immediately preceding them and
 their 'to' branch points to the pcode immediately
 following them. A skip instruction is an example of
 a pcode that has multiple (in this case two) elements
 in the 'to' branch. A 'label' pcode is an where there
 may be multiple 'from' branches.
 *************************************************/

typedef struct pBranch
{
  struct pCode   *pc;    // Next pCode in a branch
  struct pBranch *next;  /* If more than one branch
			  * the next one is here */

} pBranch;

/*************************************************
  pCodeOp

  pCode Operand structure.
  For those assembly instructions that have arguments, 
  the pCode will have a pCodeOp in which the argument
  can be stored. For example

    movf   some_register,w

  'some_register' will be stored/referenced in a pCodeOp

 *************************************************/

typedef struct pCodeOp
{
  PIC_OPTYPE type;
  char *name;
  
} pCodeOp;

typedef struct pCodeOpBit
{
  pCodeOp pcop;
  int bit;
  unsigned int inBitSpace: 1; /* True if in bit space, else
				 just a bit of a register */
} pCodeOpBit;

typedef struct pCodeOpLit
{
  pCodeOp pcop;
  int lit;
} pCodeOpLit;

typedef struct pCodeOpLabel
{
  pCodeOp pcop;
  int key;
} pCodeOpLabel;

typedef struct pCodeOpReg
{
  pCodeOp pcop;    // Can be either GPR or SFR
  int rIdx;        // Index into the register table
  struct regs *r;
  struct pBlock *pb;
} pCodeOpReg;

typedef struct pCodeOpRegBit
{
  pCodeOpReg  pcor;       // The Register containing this bit
  int bit;                // 0-7 bit number.
  PIC_OPTYPE subtype;     // The type of this register.
} pCodeOpRegBit;


/*************************************************
    pCode

    Here is the basic build block of a PIC instruction.
    Each pic instruction will get allocated a pCode.
    A linked list of pCodes makes a program.

**************************************************/

typedef struct pCode
{
  PC_TYPE    type;

  struct pCode *prev;  // The pCode objects are linked together
  struct pCode *next;  // in doubly linked lists.

  int seq;             // sequence number

  pBranch *from;       // pCodes that execute before this one
  pBranch *to;         // pCodes that execute after
  pBranch *label;      // pCode instructions that have labels

  struct pBlock *pb;   // The pBlock that contains this pCode.

  /* "virtual functions"
   *  The pCode structure is like a base class
   * in C++. The subsequent structures that "inherit"
   * the pCode structure will initialize these function
   * pointers to something useful */
  void (*analyze) (struct pCode *_this);
  void (*destruct)(struct pCode *_this);
  void (*print)  (FILE *of,struct pCode *_this);

} pCode;


/*************************************************
    pCodeComment
**************************************************/

typedef struct pCodeComment
{

  pCode  pc;

  char *comment;

} pCodeComment;

/*************************************************
    pCodeInstruction

    Here we describe all the facets of a PIC instruction
    (expansion for the 18cxxx is also provided).

**************************************************/

typedef struct pCodeInstruction
{

  pCode  pc;

  PIC_OPCODE op;        // The opcode of the instruction.

  char const * const mnemonic;       // Pointer to mnemonic string

  pCodeOp *pcop;        // Operand

  unsigned int num_ops;
  unsigned int dest:     1;       // If destination is W or F, then 1==F
  unsigned int bit_inst: 1;

  unsigned int inCond;   // Input conditions for this instruction
  unsigned int outCond;  // Output conditions for this instruction

} pCodeInstruction;


/*************************************************
    pCodeLabel
**************************************************/

typedef struct pCodeLabel
{

  pCode  pc;

  char *label;
  int key;

} pCodeLabel;

/*************************************************
    pCodeFunction
**************************************************/

typedef struct pCodeFunction
{

  pCode  pc;

  char *modname;
  char *fname;     /* If NULL, then this is the end of
		      a function. Otherwise, it's the
		      start and the name is contained
		      here */

} pCodeFunction;


/*************************************************
    pCodeWild
**************************************************/

typedef struct pCodeWild
{

  pCode  pc;

  int    id;     /* Index into the wild card array of a peepBlock 
		  * - this wild card will get expanded into that pCode
		  *   that is stored at this index */


  pCodeOp *operand;  // Optional operand
  pCodeOp *label;    // Optional label

} pCodeWild;

/*************************************************
    pBlock

    Here are PIC program snippets. There's a strong
    correlation between the eBBlocks and pBlocks.
    SDCC subdivides a C program into managable chunks.
    Each chunk becomes a eBBlock and ultimately in the
    PIC port a pBlock.

**************************************************/

typedef struct pBlock
{
  memmap *cmemmap;   /* The snippet is from this memmap */
  char   dbName;     /* if cmemmap is NULL, then dbName will identify the block */
  pCode *pcHead;     /* A pointer to the first pCode in a link list of pCodes */
  pCode *pcTail;     /* A pointer to the last pCode in a link list of pCodes */

  struct pBlock *next;      /* The pBlocks will form a doubly linked list */
  struct pBlock *prev;

  set *function_entries;    /* dll of functions in this pblock */
  set *function_exits;
  set *function_calls;
  set *registers;

  unsigned visited:1;       /* set true if traversed in call tree */

  unsigned seq;             /* sequence number of this pBlock */

} pBlock;

/*************************************************
    pFile

    The collection of pBlock program snippets are
    placed into a linked list that is implemented
    in the pFile structure.

    The pcode optimizer will parse the pFile.

**************************************************/

typedef struct pFile
{
  pBlock *pbHead;     /* A pointer to the first pBlock */
  pBlock *pbTail;     /* A pointer to the last pBlock */

  pBranch *functions; /* A SLL of functions in this pFile */

} pFile;



/*************************************************
  pCodePeep

  The pCodePeep object mimics the peep hole optimizer
  in the main SDCC src (e.g. SDCCpeeph.c). Essentially
  there is a target pCode chain and a replacement
  pCode chain. The target chain is compared to the
  pCode that is generated by gen.c. If a match is
  found then the pCode is replaced by the replacement
  pCode chain.
**************************************************/
typedef struct pCodePeep {

  pBlock *target;    // code we'd like to optimize
  pBlock *replace;   // and this is what we'll optimize it with.

  int     nvars;       // Number of wildcard registers in target.
  char  **vars;        // array of pointers to them
  int     nops;             // Number of wildcard operands in target.
  pCodeOp **wildpCodeOps;   // array of pointers to the pCodeOp's.

  int     nwildpCodes; // Number of wildcard pCodes in target/replace
  pCode **wildpCodes;  // array of pointers to the pCode's.


  /* (Note: a wildcard register is a place holder. Any register
   * can be replaced by the wildcard when the pcode is being 
   * compared to the target. */

  /* Post Conditions. A post condition is a condition that
   * must be either true or false before the peep rule is
   * accepted. For example, a certain rule may be accepted
   * if and only if the Z-bit is not used as an input to 
   * the subsequent instructions in a pCode chain.
   */
  unsigned int postFalseCond;  
  unsigned int postTrueCond;

} pCodePeep;

typedef struct pCodeOpWild
{
  pCodeOp pcop;
  //PIC_OPTYPE subtype;      Wild get's expanded to this by the optimizer
  pCodePeep *pcp;         // pointer to the parent peep block 
  int id;                 /* index into an array of char *'s that will match
			   * the wild card. The array is in *pcp. */
  pCodeOp *subtype;       /* Pointer to the Operand type into which this wild
			   * card will be expanded */
  pCodeOp *matched;       /* When a wild matches, we'll store a pointer to the
			   * opcode we matched */

} pCodeOpWild;

/*************************************************
    pCode Macros

**************************************************/
#define PCODE(x)  ((pCode *)(x))
#define PCI(x)    ((pCodeInstruction *)(x))
#define PCL(x)    ((pCodeLabel *)(x))
#define PCF(x)    ((pCodeFunction *)(x))
#define PCW(x)    ((pCodeWild *)(x))

#define PCOP(x)   ((pCodeOp *)(x))
#define PCOB(x)   ((pCodeOpBit *)(x))
#define PCOL(x)   ((pCodeOpLit *)(x))
#define PCOLAB(x) ((pCodeOpLabel *)(x))
#define PCOR(x)   ((pCodeOpReg *)(x))
#define PCORB(x)  ((pCodeOpRegBit *)(x))
#define PCOW(x)   ((pCodeOpWild *)(x))

#define PBR(x)    ((pBranch *)(x))

/*-----------------------------------------------------------------*
 * pCode functions.
 *-----------------------------------------------------------------*/

pCode *newpCode (PIC_OPCODE op, pCodeOp *pcop); // Create a new pCode given an operand
pCode *newpCodeCharP(char *cP);              // Create a new pCode given a char *
pCode *newpCodeFunction(char *g, char *f);   // Create a new function
pCode *newpCodeLabel(int key);               // Create a new label given a key
pCode *newpCodeLabelStr(char *str);          // Create a new label given a string
pBlock *newpCodeChain(memmap *cm,char c, pCode *pc); // Create a new pBlock
void printpBlock(FILE *of, pBlock *pb);      // Write a pBlock to a file
void printpCode(FILE *of, pCode *pc);        // Write a pCode to a file
void addpCode2pBlock(pBlock *pb, pCode *pc); // Add a pCode to a pBlock
void addpBlock(pBlock *pb);                  // Add a pBlock to a pFile
void copypCode(FILE *of, char dbName);       // Write all pBlocks with dbName to *of
void movepBlock2Head(char dbName);           // move pBlocks around
void AnalyzepCode(char dbName);
void OptimizepCode(char dbName);
void printCallTree(FILE *of);
void pCodePeepInit(void);

pCodeOp *newpCodeOpLabel(int key);
pCodeOp *newpCodeOpLit(int lit);
pCodeOp *newpCodeOpBit(char *name, int bit,int inBitSpace);
pCodeOp *newpCodeOp(char *name, PIC_OPTYPE p);
extern void pcode_test(void);

/*-----------------------------------------------------------------*
 * pCode objects.
 *-----------------------------------------------------------------*/

extern pCodeOpReg pc_status;
extern pCodeOpReg pc_indf;
extern pCodeOpReg pc_fsr;
extern pCodeOpReg pc_pcl;
extern pCodeOpReg pc_pclath;


////////////////////   DELETE THIS ///////////////////
/*-----------------------------------------------------------------*/
/* Allocation macros that replace those in SDCCalloc.h             */
/*   Why? I dunno. I ran across a bug with those macros that       */
/*   I couldn't fix, but I could work around...                    */
/*-----------------------------------------------------------------*/
# define GC_malloc(x) calloc((x), 1)

#define  _ALLOC(x,sz) if (!(x = calloc((sz),1) ))      \
         {                                          \
            werror(E_OUT_OF_MEM,__FILE__,(long) sz);\
            exit (1);                               \
         }

#define _ALLOC_ATOMIC(x,y) if (!((x) = malloc(y)))   \
         {                                               \
            werror(E_OUT_OF_MEM,__FILE__,(long) y);     \
            exit (1);                                    \
         }

#endif // __PCODE_H__

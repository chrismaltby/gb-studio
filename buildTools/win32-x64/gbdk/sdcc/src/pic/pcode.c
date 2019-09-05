/*-------------------------------------------------------------------------

   pcode.c - post code generation
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

#include <stdio.h>

#include "common.h"   // Include everything in the SDCC src directory
#include "newalloc.h"


#include "pcode.h"
#include "ralloc.h"

#if defined(__BORLANDC__) || defined(_MSC_VER)
#define STRCASECMP stricmp
#else
#define STRCASECMP strcasecmp
#endif

// Eventually this will go into device dependent files:
pCodeOpReg pc_status    = {{PO_STATUS,  "STATUS"}, -1, NULL,NULL};
pCodeOpReg pc_indf      = {{PO_INDF,    "INDF"}, -1, NULL,NULL};
pCodeOpReg pc_fsr       = {{PO_FSR,     "FSR"}, -1, NULL,NULL};
pCodeOpReg pc_pcl       = {{PO_PCL,     "PCL"}, -1, NULL,NULL};
pCodeOpReg pc_pclath    = {{PO_PCLATH,  "PCLATH"}, -1, NULL,NULL};

static int mnemonics_initialized = 0;


static hTab *pic14MnemonicsHash = NULL;



static pFile *the_pFile = NULL;
static int peepOptimizing = 1;
static int GpCodeSequenceNumber = 1;

/****************************************************************/
/*                      Forward declarations                    */
/****************************************************************/

static void unlinkPC(pCode *pc);
static void genericAnalyze(pCode *pc);
static void AnalyzeGOTO(pCode *pc);
static void AnalyzeSKIP(pCode *pc);
static void AnalyzeRETURN(pCode *pc);

static void genericDestruct(pCode *pc);
static void genericPrint(FILE *of,pCode *pc);

static void pCodePrintLabel(FILE *of, pCode *pc);
static void pCodePrintFunction(FILE *of, pCode *pc);
static void pCodeOpPrint(FILE *of, pCodeOp *pcop);
static char *get_op( pCodeInstruction *pcc);
int pCodePeepMatchLine(pCodePeep *peepBlock, pCode *pcs, pCode *pcd);
int pCodePeepMatchRule(pCode *pc);


pCodeInstruction pciADDWF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_ADDWF,
  "ADDWF",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  (PCC_W | PCC_REGISTER),   // inCond
  (PCC_REGISTER | PCC_Z) // outCond
};

pCodeInstruction pciADDFW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_ADDWF,
  "ADDWF",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  (PCC_W | PCC_REGISTER),   // inCond
  (PCC_W | PCC_Z) // outCond
};

pCodeInstruction pciADDLW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_ADDLW,
  "ADDLW",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_W,   // inCond
  (PCC_W | PCC_Z | PCC_C | PCC_DC) // outCond
};

pCodeInstruction pciANDLW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_ANDLW,
  "ANDLW",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_W,   // inCond
  (PCC_W | PCC_Z) // outCond
};

pCodeInstruction pciANDWF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_ANDWF,
  "ANDWF",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  (PCC_W | PCC_REGISTER),   // inCond
  (PCC_REGISTER | PCC_Z) // outCond
};

pCodeInstruction pciANDFW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_ANDWF,
  "ANDWF",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  (PCC_W | PCC_REGISTER),   // inCond
  (PCC_W | PCC_Z) // outCond
};

pCodeInstruction pciBCF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_BCF,
  "BCF",
  NULL, // operand
  2,    // num ops
  0,1,  // dest, bit instruction
  PCC_NONE,   // inCond
  PCC_EXAMINE_PCOP // outCond
};

pCodeInstruction pciBSF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_BSF,
  "BSF",
  NULL, // operand
  2,    // num ops
  0,1,  // dest, bit instruction
  PCC_NONE,   // inCond
  PCC_EXAMINE_PCOP // outCond
};

pCodeInstruction pciBTFSC = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   AnalyzeSKIP,
   genericDestruct,
   genericPrint},
  POC_BTFSC,
  "BTFSC",
  NULL, // operand
  2,    // num ops
  0,1,  // dest, bit instruction
  PCC_EXAMINE_PCOP,   // inCond
  PCC_NONE // outCond
};

pCodeInstruction pciBTFSS = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   AnalyzeSKIP,
   genericDestruct,
   genericPrint},
  POC_BTFSS,
  "BTFSS",
  NULL, // operand
  2,    // num ops
  0,1,  // dest, bit instruction
  PCC_EXAMINE_PCOP,   // inCond
  PCC_NONE // outCond
};

pCodeInstruction pciCALL = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_CALL,
  "CALL",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_NONE, // inCond
  PCC_NONE  // outCond
};

pCodeInstruction pciCOMF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_COMF,
  "COMF",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  PCC_REGISTER,  // inCond
  PCC_REGISTER   // outCond
};

pCodeInstruction pciCOMFW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_COMFW,
  "COMF",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  PCC_REGISTER,  // inCond
  PCC_W   // outCond
};

pCodeInstruction pciCLRF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_CLRF,
  "CLRF",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_REGISTER, // inCond
  PCC_REGISTER  // outCond
};

pCodeInstruction pciCLRW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_CLRW,
  "CLRW",
  NULL, // operand
  0,    // num ops
  0,0,  // dest, bit instruction
  PCC_W, // inCond
  PCC_W  // outCond
};

pCodeInstruction pciDECF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_DECF,
  "DECF",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  PCC_REGISTER,   // inCond
  PCC_REGISTER    // outCond
};

pCodeInstruction pciDECFW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_DECFW,
  "DECF",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  PCC_REGISTER,   // inCond
  PCC_W    // outCond
};

pCodeInstruction pciDECFSZ = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   AnalyzeSKIP,
   genericDestruct,
   genericPrint},
  POC_DECFSZ,
  "DECFSZ",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  PCC_REGISTER,   // inCond
  PCC_REGISTER    // outCond
};

pCodeInstruction pciDECFSZW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   AnalyzeSKIP,
   genericDestruct,
   genericPrint},
  POC_DECFSZW,
  "DECFSZ",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  PCC_REGISTER,   // inCond
  PCC_W           // outCond
};

pCodeInstruction pciGOTO = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   AnalyzeGOTO,
   genericDestruct,
   genericPrint},
  POC_GOTO,
  "GOTO",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_NONE,   // inCond
  PCC_NONE    // outCond
};


pCodeInstruction pciINCF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_INCF,
  "INCF",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  PCC_REGISTER,   // inCond
  PCC_REGISTER    // outCond
};

pCodeInstruction pciINCFW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_INCFW,
  "INCF",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  PCC_REGISTER,   // inCond
  PCC_W    // outCond
};

pCodeInstruction pciINCFSZ = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   AnalyzeSKIP,
   genericDestruct,
   genericPrint},
  POC_INCFSZ,
  "INCFSZ",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  PCC_REGISTER,   // inCond
  PCC_REGISTER    // outCond
};

pCodeInstruction pciINCFSZW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   AnalyzeSKIP,
   genericDestruct,
   genericPrint},
  POC_INCFSZW,
  "INCFSZ",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  PCC_REGISTER,   // inCond
  PCC_W           // outCond
};

pCodeInstruction pciIORWF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_IORWF,
  "IORWF",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  (PCC_W | PCC_REGISTER),   // inCond
  (PCC_REGISTER | PCC_Z) // outCond
};

pCodeInstruction pciIORFW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_IORWF,
  "IORWF",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  (PCC_W | PCC_REGISTER),   // inCond
  (PCC_W | PCC_Z) // outCond
};

pCodeInstruction pciIORLW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_IORLW,
  "IORLW",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_W,   // inCond
  (PCC_W | PCC_Z) // outCond
};

pCodeInstruction pciMOVF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_MOVF,
  "MOVF",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  PCC_REGISTER,   // inCond
  PCC_Z // outCond
};

pCodeInstruction pciMOVFW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_MOVFW,
  "MOVF",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  PCC_REGISTER,   // inCond
  (PCC_W | PCC_Z) // outCond
};

pCodeInstruction pciMOVWF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_MOVWF,
  "MOVWF",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_W,   // inCond
  0 // outCond
};

pCodeInstruction pciMOVLW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_MOVLW,
  "MOVLW",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_NONE,   // inCond
  PCC_W // outCond
};

pCodeInstruction pciNEGF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_NEGF,
  "NEGF",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_REGISTER,   // inCond
  PCC_NONE // outCond
};


pCodeInstruction pciRETLW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   AnalyzeRETURN,
   genericDestruct,
   genericPrint},
  POC_RETLW,
  "RETLW",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_NONE,   // inCond
  PCC_W // outCond
};

pCodeInstruction pciRETURN = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   AnalyzeRETURN,
   genericDestruct,
   genericPrint},
  POC_RETURN,
  "RETURN",
  NULL, // operand
  0,    // num ops
  0,0,  // dest, bit instruction
  PCC_NONE,   // inCond
  PCC_W // outCond
};


pCodeInstruction pciRLF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_RLF,
  "RLF",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  (PCC_C | PCC_REGISTER),   // inCond
  (PCC_REGISTER | PCC_Z | PCC_C | PCC_DC) // outCond
};

pCodeInstruction pciRLFW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_RLFW,
  "RLF",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  (PCC_C | PCC_REGISTER),   // inCond
  (PCC_W | PCC_Z | PCC_C | PCC_DC) // outCond
};

pCodeInstruction pciRRF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_RRF,
  "RRF",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  (PCC_C | PCC_REGISTER),   // inCond
  (PCC_REGISTER | PCC_Z | PCC_C | PCC_DC) // outCond
};

pCodeInstruction pciRRFW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_RRFW,
  "RRF",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  (PCC_C | PCC_REGISTER),   // inCond
  (PCC_W | PCC_Z | PCC_C | PCC_DC) // outCond
};

pCodeInstruction pciSUBWF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_SUBWF,
  "SUBWF",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  (PCC_W | PCC_REGISTER),   // inCond
  (PCC_REGISTER | PCC_Z) // outCond
};

pCodeInstruction pciSUBFW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_SUBWF,
  "SUBWF",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  (PCC_W | PCC_REGISTER),   // inCond
  (PCC_W | PCC_Z) // outCond
};

pCodeInstruction pciSUBLW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_SUBLW,
  "SUBLW",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_W,   // inCond
  (PCC_W | PCC_Z | PCC_C | PCC_DC) // outCond
};

pCodeInstruction pciSWAPF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_SWAPF,
  "SWAPF",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  (PCC_REGISTER),   // inCond
  (PCC_REGISTER) // outCond
};

pCodeInstruction pciSWAPFW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_SWAPFW,
  "SWAPF",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  (PCC_REGISTER),   // inCond
  (PCC_W) // outCond
};
pCodeInstruction pciTRIS = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_TRIS,
  "TRIS",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_NONE,   // inCond
  PCC_NONE
};


pCodeInstruction pciXORWF = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_XORWF,
  "XORWF",
  NULL, // operand
  2,    // num ops
  1,0,  // dest, bit instruction
  (PCC_W | PCC_REGISTER),   // inCond
  (PCC_REGISTER | PCC_Z) // outCond
};

pCodeInstruction pciXORFW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_XORWF,
  "XORWF",
  NULL, // operand
  2,    // num ops
  0,0,  // dest, bit instruction
  (PCC_W | PCC_REGISTER),   // inCond
  (PCC_W | PCC_Z) // outCond
};

pCodeInstruction pciXORLW = {
  {PC_OPCODE, NULL, NULL, 0, NULL, NULL, NULL, NULL, 
   genericAnalyze,
   genericDestruct,
   genericPrint},
  POC_XORLW,
  "XORLW",
  NULL, // operand
  1,    // num ops
  0,0,  // dest, bit instruction
  PCC_W,   // inCond
  (PCC_W | PCC_Z | PCC_C | PCC_DC) // outCond
};


#define MAX_PIC14MNEMONICS 100
pCodeInstruction *pic14Mnemonics[MAX_PIC14MNEMONICS];

/*-----------------------------------------------------------------*/
/* SAFE_snprintf - like snprintf except the string pointer is      */
/*                 after the string has been printed to. This is   */
/*                 useful for printing to string as though if it   */
/*                 were a stream.                                  */
/*-----------------------------------------------------------------*/
void SAFE_snprintf(char **str, size_t *size, const  char  *format, ...)
{
  va_list val;
  int len;

  if(!str || !*str)
    return;

  va_start(val, format);
#if 0
  // Alas, vsnprintf is not ANSI standard, and does not exist
  // on Solaris (and probably other non-Gnu flavored Unixes).
  vsnprintf(*str, *size, format, val);
#else
  // This, of course, is *not* safe, despite the name.
  vsprintf(*str, format, val);
#endif
    
  va_end (val);

  len = strlen(*str);
  *str += len;
  *size -= len;

}

void  pCodeInitRegisters(void)
{

  pc_fsr.rIdx = 4;
  pc_fsr.r = pic14_regWithIdx(4);

}

/*-----------------------------------------------------------------*/
/*  mnem2key - convert a pic mnemonic into a hash key              */
/*   (BTW - this spreads the mnemonics quite well)                 */
/*                                                                 */
/*-----------------------------------------------------------------*/

int mnem2key(char const *mnem)
{
  int key = 0;

  if(!mnem)
    return 0;

  while(*mnem) {

    key += toupper(*mnem++) +1;

  }

  return (key & 0x1f);

}

void pic14initMnemonics(void)
{
  int i = 0;
  int key;
  //  char *str;
  pCodeInstruction *pci;

  if(mnemonics_initialized)
    return;

  pic14Mnemonics[POC_ADDLW] = &pciADDLW;
  pic14Mnemonics[POC_ADDWF] = &pciADDWF;
  pic14Mnemonics[POC_ADDFW] = &pciADDFW;
  pic14Mnemonics[POC_ANDLW] = &pciANDLW;
  pic14Mnemonics[POC_ANDWF] = &pciANDWF;
  pic14Mnemonics[POC_ANDFW] = &pciANDFW;
  pic14Mnemonics[POC_BCF] = &pciBCF;
  pic14Mnemonics[POC_BSF] = &pciBSF;
  pic14Mnemonics[POC_BTFSC] = &pciBTFSC;
  pic14Mnemonics[POC_BTFSS] = &pciBTFSS;
  pic14Mnemonics[POC_CALL] = &pciCALL;
  pic14Mnemonics[POC_COMF] = &pciCOMF;
  pic14Mnemonics[POC_COMFW] = &pciCOMFW;
  pic14Mnemonics[POC_CLRF] = &pciCLRF;
  pic14Mnemonics[POC_CLRW] = &pciCLRW;
  pic14Mnemonics[POC_DECF] = &pciDECF;
  pic14Mnemonics[POC_DECFW] = &pciDECFW;
  pic14Mnemonics[POC_DECFSZ] = &pciDECFSZ;
  pic14Mnemonics[POC_DECFSZW] = &pciDECFSZW;
  pic14Mnemonics[POC_GOTO] = &pciGOTO;
  pic14Mnemonics[POC_INCF] = &pciINCF;
  pic14Mnemonics[POC_INCFW] = &pciINCFW;
  pic14Mnemonics[POC_INCFSZ] = &pciINCFSZ;
  pic14Mnemonics[POC_INCFSZW] = &pciINCFSZW;
  pic14Mnemonics[POC_IORLW] = &pciIORLW;
  pic14Mnemonics[POC_IORWF] = &pciIORWF;
  pic14Mnemonics[POC_IORFW] = &pciIORFW;
  pic14Mnemonics[POC_MOVF] = &pciMOVF;
  pic14Mnemonics[POC_MOVFW] = &pciMOVFW;
  pic14Mnemonics[POC_MOVLW] = &pciMOVLW;
  pic14Mnemonics[POC_MOVWF] = &pciMOVWF;
  pic14Mnemonics[POC_NEGF] = &pciNEGF;
  pic14Mnemonics[POC_RETLW] = &pciRETLW;
  pic14Mnemonics[POC_RETURN] = &pciRETURN;
  pic14Mnemonics[POC_RLF] = &pciRLF;
  pic14Mnemonics[POC_RLFW] = &pciRLFW;
  pic14Mnemonics[POC_RRF] = &pciRRF;
  pic14Mnemonics[POC_RRFW] = &pciRRFW;
  pic14Mnemonics[POC_SUBLW] = &pciSUBLW;
  pic14Mnemonics[POC_SUBWF] = &pciSUBWF;
  pic14Mnemonics[POC_SUBFW] = &pciSUBFW;
  pic14Mnemonics[POC_SWAPF] = &pciSWAPF;
  pic14Mnemonics[POC_SWAPFW] = &pciSWAPFW;
  pic14Mnemonics[POC_TRIS] = &pciTRIS;
  pic14Mnemonics[POC_XORLW] = &pciXORLW;
  pic14Mnemonics[POC_XORWF] = &pciXORWF;
  pic14Mnemonics[POC_XORFW] = &pciXORFW;

  for(i=0; i<MAX_PIC14MNEMONICS; i++)
    if(pic14Mnemonics[i])
      hTabAddItem(&pic14MnemonicsHash, mnem2key(pic14Mnemonics[i]->mnemonic), pic14Mnemonics[i]);
  pci = hTabFirstItem(pic14MnemonicsHash, &key);

  while(pci) {
    fprintf( stderr, "element %d key %d, mnem %s\n",i++,key,pci->mnemonic);
    pci = hTabNextItem(pic14MnemonicsHash, &key);
  }

  mnemonics_initialized = 1;
}

int getpCode(char *mnem,unsigned dest)
{

  pCodeInstruction *pci;
  int key = mnem2key(mnem);

  if(!mnemonics_initialized)
    pic14initMnemonics();

  pci = hTabFirstItemWK(pic14MnemonicsHash, key);

  while(pci) {

    if(STRCASECMP(pci->mnemonic, mnem) == 0) {
      if((pci->num_ops <= 1) || (pci->dest == dest))
	return(pci->op);
    }

    pci = hTabNextItemWK (pic14MnemonicsHash);
  
  }

  return -1;
}

char getpBlock_dbName(pBlock *pb)
{
  if(!pb)
    return 0;

  if(pb->cmemmap)
    return pb->cmemmap->dbName;

  return pb->dbName;
}
/*-----------------------------------------------------------------*/
/* movepBlock2Head - given the dbname of a pBlock, move all        */
/*                   instances to the front of the doubly linked   */
/*                   list of pBlocks                               */
/*-----------------------------------------------------------------*/

void movepBlock2Head(char dbName)
{
  pBlock *pb;

  pb = the_pFile->pbHead;

  while(pb) {

    if(getpBlock_dbName(pb) == dbName) {
      pBlock *pbn = pb->next;
      pb->next = the_pFile->pbHead;
      the_pFile->pbHead->prev = pb;
      the_pFile->pbHead = pb;

      if(pb->prev)
	pb->prev->next = pbn;

      // If the pBlock that we just moved was the last
      // one in the link of all of the pBlocks, then we
      // need to point the tail to the block just before
      // the one we moved.
      // Note: if pb->next is NULL, then pb must have 
      // been the last pBlock in the chain.

      if(pbn)
	pbn->prev = pb->prev;
      else
	the_pFile->pbTail = pb->prev;

      pb = pbn;

    } else
      pb = pb->next;

  }

}

void copypCode(FILE *of, char dbName)
{
  pBlock *pb;

  if(!of || !the_pFile)
    return;

  for(pb = the_pFile->pbHead; pb; pb = pb->next) {
    if(getpBlock_dbName(pb) == dbName)
      printpBlock(of,pb);
  }

}
void pcode_test(void)
{

  printf("pcode is alive!\n");

  //initMnemonics();

  if(the_pFile) {

    pBlock *pb;
    FILE *pFile;
    char buffer[100];

    /* create the file name */
    strcpy(buffer,srcFileName);
    strcat(buffer,".p");

    if( !(pFile = fopen(buffer, "w" ))) {
      werror(E_FILE_OPEN_ERR,buffer);
      exit(1);
    }

    fprintf(pFile,"pcode dump\n\n");

    for(pb = the_pFile->pbHead; pb; pb = pb->next) {
      fprintf(pFile,"\n\tNew pBlock\n\n");
      if(pb->cmemmap)
	fprintf(pFile,"%s",pb->cmemmap->sname);
      else
	fprintf(pFile,"internal pblock");

      fprintf(pFile,", dbName =%c\n",getpBlock_dbName(pb));
      printpBlock(pFile,pb);
    }
  }
}
static int RegCond(pCodeOp *pcop)
{

  if(!pcop)
    return 0;

  if(pcop->type == PO_BIT  && !strcmp(pcop->name, pc_status.pcop.name)) {
    switch(PCOB(pcop)->bit) {
    case PIC_C_BIT:
      return PCC_C;
    case PIC_DC_BIT:
	return PCC_DC;
    case PIC_Z_BIT:
      return PCC_Z;
    }

  }

  return 0;
}

/*-----------------------------------------------------------------*/
/* newpCode - create and return a newly initialized pCode          */
/*                                                                 */
/*  fixme - rename this                                            */
/*                                                                 */
/* The purpose of this routine is to create a new Instruction      */
/* pCode. This is called by gen.c while the assembly code is being */
/* generated.                                                      */
/*                                                                 */
/* Inouts:                                                         */
/*  PIC_OPCODE op - the assembly instruction we wish to create.    */
/*                  (note that the op is analogous to but not the  */
/*                  same thing as the opcode of the instruction.)  */
/*  pCdoeOp *pcop - pointer to the operand of the instruction.     */
/*                                                                 */
/* Outputs:                                                        */
/*  a pointer to the new malloc'd pCode is returned.               */
/*                                                                 */
/*                                                                 */
/*                                                                 */
/*-----------------------------------------------------------------*/
pCode *newpCode (PIC_OPCODE op, pCodeOp *pcop)
{
  pCodeInstruction *pci ;

  if(!mnemonics_initialized)
    pic14initMnemonics();
    
  pci = Safe_calloc(1, sizeof(pCodeInstruction));

  if((op>=0) && (op < MAX_PIC14MNEMONICS) && pic14Mnemonics[op]) {
    memcpy(pci, pic14Mnemonics[op], sizeof(pCodeInstruction));
    pci->pcop = pcop;

    if(pci->inCond == PCC_EXAMINE_PCOP)
      pci->inCond   = RegCond(pcop);

    if(pci->outCond == PCC_EXAMINE_PCOP)
      pci->outCond   = RegCond(pcop);

    return (pCode *)pci;
  }

  fprintf(stderr, "pCode mnemonic error %s,%d\n",__FUNCTION__,__LINE__);
  exit(1);

  return NULL;
}     	

/*-----------------------------------------------------------------*/
/* newpCodeWild - create a "wild" as in wild card pCode            */
/*                                                                 */
/* Wild pcodes are used during the peep hole optimizer to serve    */
/* as place holders for any instruction. When a snippet of code is */
/* compared to a peep hole rule, the wild card opcode will match   */
/* any instruction. However, the optional operand and label are    */
/* additional qualifiers that must also be matched before the      */
/* line (of assembly code) is declared matched. Note that the      */
/* operand may be wild too.                                        */
/*                                                                 */
/*   Note, a wild instruction is specified just like a wild var:   */
/*      %4     ; A wild instruction,                               */
/*  See the peeph.def file for additional examples                 */
/*                                                                 */
/*-----------------------------------------------------------------*/

pCode *newpCodeWild(int pCodeID, pCodeOp *optional_operand, pCodeOp *optional_label)
{

  pCodeWild *pcw;
    
  pcw = Safe_calloc(1,sizeof(pCodeWild));

  pcw->pc.type = PC_WILD;
  pcw->pc.prev = pcw->pc.next = NULL;
  pcw->pc.from = pcw->pc.to = pcw->pc.label = NULL;
  pcw->pc.pb = NULL;

  pcw->pc.analyze = genericAnalyze;
  pcw->pc.destruct = genericDestruct;
  pcw->pc.print = genericPrint;

  pcw->id = pCodeID;              // this is the 'n' in %n
  pcw->operand = optional_operand;
  pcw->label   = optional_label;

  return ( (pCode *)pcw);
  
}

/*-----------------------------------------------------------------*/
/* newPcodeCharP - create a new pCode from a char string           */
/*-----------------------------------------------------------------*/

pCode *newpCodeCharP(char *cP)
{

  pCodeComment *pcc ;
    
  pcc = Safe_calloc(1,sizeof(pCodeComment));

  pcc->pc.type = PC_COMMENT;
  pcc->pc.prev = pcc->pc.next = NULL;
  pcc->pc.from = pcc->pc.to = pcc->pc.label = NULL;
  pcc->pc.pb = NULL;

  pcc->pc.analyze = genericAnalyze;
  pcc->pc.destruct = genericDestruct;
  pcc->pc.print = genericPrint;

  if(cP)
    pcc->comment = Safe_strdup(cP);
  else
    pcc->comment = NULL;

  return ( (pCode *)pcc);

}

/*-----------------------------------------------------------------*/
/* newpCodeGLabel - create a new global label                      */
/*-----------------------------------------------------------------*/


pCode *newpCodeFunction(char *mod,char *f)
{
  pCodeFunction *pcf;

  _ALLOC(pcf,sizeof(pCodeFunction));

  pcf->pc.type = PC_FUNCTION;
  pcf->pc.prev = pcf->pc.next = NULL;
  pcf->pc.from = pcf->pc.to = pcf->pc.label = NULL;
  pcf->pc.pb = NULL;

  pcf->pc.analyze = genericAnalyze;
  pcf->pc.destruct = genericDestruct;
  pcf->pc.print = pCodePrintFunction;

  if(mod) {
    _ALLOC_ATOMIC(pcf->modname,strlen(mod)+1);
    strcpy(pcf->modname,mod);
  } else
    pcf->modname = NULL;

  if(f) {
    _ALLOC_ATOMIC(pcf->fname,strlen(f)+1);
    strcpy(pcf->fname,f);
  } else
    pcf->fname = NULL;

  return ( (pCode *)pcf);

}

static void pCodeLabelDestruct(pCode *pc)
{

  if(!pc)
    return;

  if((pc->type == PC_LABEL) && PCL(pc)->label)
    free(PCL(pc)->label);

  free(pc);

}

pCode *newpCodeLabel(int key)
{

  char *s = buffer;
  pCodeLabel *pcl;
    
  pcl = Safe_calloc(1,sizeof(pCodeLabel) );

  pcl->pc.type = PC_LABEL;
  pcl->pc.prev = pcl->pc.next = NULL;
  pcl->pc.from = pcl->pc.to = pcl->pc.label = NULL;
  pcl->pc.pb = NULL;

  pcl->pc.analyze = genericAnalyze;
  pcl->pc.destruct = pCodeLabelDestruct;
  pcl->pc.print = pCodePrintLabel;

  pcl->key = key;

  pcl->label = NULL;
  if(key>0) {
    sprintf(s,"_%05d_DS_",key);
    if(s)
      pcl->label = Safe_strdup(s);
  }


  return ( (pCode *)pcl);

}
pCode *newpCodeLabelStr(char *str)
{
  pCode *pc = newpCodeLabel(-1);

  if(str)
    PCL(pc)->label = Safe_strdup(str);
  else
    PCL(pc)->label = NULL;

  return pc;
}

/*-----------------------------------------------------------------*/
/* newpBlock - create and return a pointer to a new pBlock         */
/*-----------------------------------------------------------------*/
pBlock *newpBlock(void)
{

  pBlock *PpB;

  PpB = Safe_calloc(1,sizeof(pBlock) );
  PpB->next = PpB->prev = NULL;

  PpB->function_entries = PpB->function_exits = PpB->function_calls = NULL;
  PpB->registers = NULL;
  PpB->visited = 0;

  return PpB;

}

/*-----------------------------------------------------------------*/
/* newpCodeChai0n - create a new chain of pCodes                    */
/*-----------------------------------------------------------------*
 *
 *  This function will create a new pBlock and the pointer to the
 *  pCode that is passed in will be the first pCode in the block.
 *-----------------------------------------------------------------*/


pBlock *newpCodeChain(memmap *cm,char c, pCode *pc)
{

  pBlock *pB  = newpBlock();

  pB->pcHead  = pB->pcTail = pc;
  pB->cmemmap = cm;
  pB->dbName  = c;

  return pB;
}

/*-----------------------------------------------------------------*/
/* newpCodeOpLabel - Create a new label given the key              */
/*  Note, a negative key means that the label is part of wild card */
/*  (and hence a wild card label) used in the pCodePeep            */
/*   optimizations).                                               */
/*-----------------------------------------------------------------*/

pCodeOp *newpCodeOpLabel(int key)
{
  char *s = buffer;
  pCodeOp *pcop;

  pcop = Safe_calloc(1,sizeof(pCodeOpLabel) );
  pcop->type = PO_LABEL;

  pcop->name = NULL;
  if(key>0) {
    sprintf(s,"_%05d_DS_",key);
    if(s)
      pcop->name = Safe_strdup(s);
  } 


  ((pCodeOpLabel *)pcop)->key = key;

  return pcop;
}

pCodeOp *newpCodeOpLit(int lit)
{
  char *s = buffer;
  pCodeOp *pcop;


  pcop = Safe_calloc(1,sizeof(pCodeOpLit) );
  pcop->type = PO_LITERAL;
  pcop->name = NULL;
  if(lit>=0) {
    sprintf(s,"0x%02x",lit);
    if(s)
      pcop->name = Safe_strdup(s);
  } 


  ((pCodeOpLit *)pcop)->lit = lit;

  return pcop;
}

pCodeOp *newpCodeOpWild(int id, pCodePeep *pcp, pCodeOp *subtype)
{
  char *s = buffer;
  pCodeOp *pcop;


  if(!pcp || !subtype) {
    fprintf(stderr, "Wild opcode declaration error: %s-%d\n",__FILE__,__LINE__);
    exit(1);
  }

  pcop = Safe_calloc(1,sizeof(pCodeOpWild));
  pcop->type = PO_WILD;
  sprintf(s,"%%%d",id);
  pcop->name = Safe_strdup(s);

  PCOW(pcop)->id = id;
  PCOW(pcop)->pcp = pcp;
  PCOW(pcop)->subtype = subtype;
  PCOW(pcop)->matched = NULL;

  return pcop;
}

pCodeOp *newpCodeOpBit(char *s, int bit, int inBitSpace)
{
  pCodeOp *pcop;

  pcop = Safe_calloc(1,sizeof(pCodeOpBit) );
  pcop->type = PO_BIT;
  if(s)
    pcop->name = Safe_strdup(s);   
  else
    pcop->name = NULL;

  PCOB(pcop)->bit = bit;
  PCOB(pcop)->inBitSpace = inBitSpace;

  return pcop;
}

pCodeOp *newpCodeOpReg(int rIdx)
{
  pCodeOp *pcop;

  pcop = Safe_calloc(1,sizeof(pCodeOpReg) );

  PCOR(pcop)->rIdx = rIdx;
  PCOR(pcop)->r = pic14_regWithIdx(rIdx);
  pcop->type = PCOR(pcop)->r->pc_type;

  return pcop;
}

/*-----------------------------------------------------------------*/
/*-----------------------------------------------------------------*/

pCodeOp *newpCodeOp(char *name, PIC_OPTYPE type)
{
  pCodeOp *pcop;

  switch(type) {
  case PO_BIT:
    pcop = newpCodeOpBit(name, -1,0);
    break;

  case PO_LITERAL:
    pcop = newpCodeOpLit(-1);
    break;

  case PO_LABEL:
    pcop = newpCodeOpLabel(-1);
    break;

  default:
    pcop = Safe_calloc(1,sizeof(pCodeOp) );
    pcop->type = type;
    if(name)
      pcop->name = Safe_strdup(name);   
    else
      pcop->name = NULL;
  }

  return pcop;
}

/*-----------------------------------------------------------------*/
/* addpCode2pBlock - place the pCode into the pBlock linked list   */
/*-----------------------------------------------------------------*/
void addpCode2pBlock(pBlock *pb, pCode *pc)
{
  if(!pb->pcHead) {
    /* If this is the first pcode to be added to a block that
     * was initialized with a NULL pcode, then go ahead and
     * make this pcode the head and tail */
    pb->pcHead  = pb->pcTail = pc;
  } else {
    pb->pcTail->next = pc;
    pc->prev = pb->pcTail;
    pc->next = NULL;
    pc->pb = pb;
    pb->pcTail = pc;
  }
}

/*-----------------------------------------------------------------*/
/* addpBlock - place a pBlock into the pFile                       */
/*-----------------------------------------------------------------*/
void addpBlock(pBlock *pb)
{

  if(!the_pFile) {
    /* First time called, we'll pass through here. */
    _ALLOC(the_pFile,sizeof(pFile));
    the_pFile->pbHead = the_pFile->pbTail = pb;
    the_pFile->functions = NULL;
    return;
  }

  the_pFile->pbTail->next = pb;
  pb->prev = the_pFile->pbTail;
  pb->next = NULL;
  the_pFile->pbTail = pb;
}

/*-----------------------------------------------------------------*/
/* printpCode - write the contents of a pCode to a file            */
/*-----------------------------------------------------------------*/
void printpCode(FILE *of, pCode *pc)
{

  if(!pc || !of)
    return;

  if(pc->print) {
    pc->print(of,pc);
    return;
  }

  fprintf(of,"warning - unable to print pCode\n");
}

/*-----------------------------------------------------------------*/
/* printpBlock - write the contents of a pBlock to a file          */
/*-----------------------------------------------------------------*/
void printpBlock(FILE *of, pBlock *pb)
{
  pCode *pc;

  if(!pb)
    return;

  if(!of)
    of = stderr;

  for(pc = pb->pcHead; pc; pc = pc->next)
    printpCode(of,pc);

}

/*-----------------------------------------------------------------*/
/*                                                                 */
/*       pCode processing                                          */
/*                                                                 */
/*                                                                 */
/*                                                                 */
/*-----------------------------------------------------------------*/

static void unlinkPC(pCode *pc)
{


  if(pc) {

    if(pc->prev) 
      pc->prev->next = pc->next;
    if(pc->next)
      pc->next->prev = pc->prev;

    pc->prev = pc->next = NULL;
  }
}
static void genericDestruct(pCode *pc)
{
  fprintf(stderr,"warning, calling default pCode destructor\n");

  unlinkPC(pc);

  free(pc);

}


void pBlockRegs(FILE *of, pBlock *pb)
{

  regs  *r;

  r = setFirstItem(pb->registers);
  while (r) {
    r = setNextItem(pb->registers);
  }
}


static char *get_op( pCodeInstruction *pcc)
{
  regs *r;

  if(pcc && pcc->pcop) {


    switch(pcc->pcop->type) {

    case PO_FSR:
      r = pic14_regWithIdx(PCOR(pcc->pcop)->rIdx);
      return r->name;
      break;
    case PO_GPR_TEMP:
    case PO_GPR_BIT:
      r = pic14_regWithIdx(PCOR(pcc->pcop)->r->rIdx);
      //fprintf(stderr,"getop: getting %s\nfrom:\n",r->name); //pcc->pcop->name);
      pBlockRegs(stderr,pcc->pc.pb);
      return r->name;

    default:
      if  (pcc->pcop->name)
	return pcc->pcop->name;

    }
  }

  return "NO operand";
}

/*-----------------------------------------------------------------*/
/*-----------------------------------------------------------------*/
static void pCodeOpPrint(FILE *of, pCodeOp *pcop)
{

  fprintf(of,"pcodeopprint\n");
}

char *pCode2str(char *str, int size, pCode *pc)
{
  char *s = str;

  switch(pc->type) {

  case PC_OPCODE:

    SAFE_snprintf(&s,&size, "\t%s\t", PCI(pc)->mnemonic);

    if( (PCI(pc)->num_ops >= 1) && (PCI(pc)->pcop)) {

      if(PCI(pc)->bit_inst) {
	if(PCI(pc)->pcop->type == PO_BIT) {
	  if( (((pCodeOpBit *)(PCI(pc)->pcop))->inBitSpace) )
	    SAFE_snprintf(&s,&size,"(%s >> 3), (%s & 7)", 
			  PCI(pc)->pcop->name ,
			  PCI(pc)->pcop->name );
	  else
	    SAFE_snprintf(&s,&size,"%s,%d", get_op(PCI(pc)), 
			  (((pCodeOpBit *)(PCI(pc)->pcop))->bit ));
	} else if(PCI(pc)->pcop->type == PO_GPR_BIT) {
	  SAFE_snprintf(&s,&size,"%s,%d", get_op(PCI(pc)),PCORB(PCI(pc)->pcop)->bit);
	}else
	  SAFE_snprintf(&s,&size,"%s,0 ; ?bug", get_op(PCI(pc)));
	//PCI(pc)->pcop->t.bit );
      } else {

	if(PCI(pc)->pcop->type == PO_BIT) {
	  if( PCI(pc)->num_ops == 2)
	    SAFE_snprintf(&s,&size,"(%s >> 3),%c",get_op(PCI(pc)),((PCI(pc)->dest) ? 'F':'W'));
	  else
	    SAFE_snprintf(&s,&size,"(1 << (%s & 7))",get_op(PCI(pc)));

	}else {
	  SAFE_snprintf(&s,&size,"%s",get_op(PCI(pc)));

	  if( PCI(pc)->num_ops == 2)
	    SAFE_snprintf(&s,&size,",%c", ( (PCI(pc)->dest) ? 'F':'W'));
	}
      }

    }
    break;

  case PC_COMMENT:
    /* assuming that comment ends with a \n */
    SAFE_snprintf(&s,&size,";%s", ((pCodeComment *)pc)->comment);
    break;

  case PC_LABEL:
    SAFE_snprintf(&s,&size,";label=%s, key=%d\n",PCL(pc)->label,PCL(pc)->key);
    break;
  case PC_FUNCTION:
    SAFE_snprintf(&s,&size,";modname=%s,function=%s: id=%d\n",PCF(pc)->modname,PCF(pc)->fname);
    break;
  case PC_WILD:
    SAFE_snprintf(&s,&size,";\tWild opcode: id=%d\n",PCW(pc)->id);
    break;

  }

  return str;

}

/*-----------------------------------------------------------------*/
/* genericPrint - the contents of a pCode to a file                */
/*-----------------------------------------------------------------*/
static void genericPrint(FILE *of, pCode *pc)
{

  if(!pc || !of)
    return;

  switch(pc->type) {
  case PC_COMMENT:
    fprintf(of,";%s\n", ((pCodeComment *)pc)->comment);
    break;

  case PC_OPCODE:
    // If the opcode has a label, print that first
    {
      pBranch *pbl = pc->label;
      while(pbl && pbl->pc) {
	if(pbl->pc->type == PC_LABEL)
	  pCodePrintLabel(of, pbl->pc);
	pbl = pbl->next;
      }
    }


    {
      char str[256];
      
      pCode2str(str, 256, pc);

      fprintf(of,"%s",str);
    }

    {
      pBranch *dpb = pc->to;   // debug
      while(dpb) {
	switch ( dpb->pc->type) {
	case PC_OPCODE:
	  fprintf(of, "\t;%s", PCI(dpb->pc)->mnemonic);
	  break;
	case PC_LABEL:
	  fprintf(of, "\t;label %d", PCL(dpb->pc)->key);
	  break;
	case PC_FUNCTION:
	  fprintf(of, "\t;function %s", ( (PCF(dpb->pc)->fname) ? (PCF(dpb->pc)->fname) : "[END]"));
	  break;
	case PC_COMMENT:
	case PC_WILD:
	  break;
	}
	dpb = dpb->next;
      }
      fprintf(of,"\n");
    }

    break;

  case PC_WILD:
    fprintf(of,";\tWild opcode: id=%d\n",PCW(pc)->id);
    if(pc->label)
      pCodePrintLabel(of, pc->label->pc);

    if(PCW(pc)->operand) {
      fprintf(of,";\toperand  ");
      pCodeOpPrint(of,PCW(pc)->operand );
    }
    break;

  case PC_LABEL:
  default:
    fprintf(of,"unknown pCode type %d\n",pc->type);
  }

}

/*-----------------------------------------------------------------*/
/* pCodePrintFunction - prints function begin/end                  */
/*-----------------------------------------------------------------*/

static void pCodePrintFunction(FILE *of, pCode *pc)
{

  if(!pc || !of)
    return;

  if( ((pCodeFunction *)pc)->modname) 
    fprintf(of,"F_%s",((pCodeFunction *)pc)->modname);

  if(PCF(pc)->fname) {
    pBranch *exits = pc->to;
    int i=0;
    fprintf(of,"%s\t;Function start\n",PCF(pc)->fname);
    while(exits) {
      i++;
      exits = exits->next;
    }
    //if(i) i--;
    fprintf(of,"; %d exit point%c\n",i, ((i==1) ? ' ':'s'));
    
  }else {
    if(pc->from && 
       pc->from->pc->type == PC_FUNCTION &&
       PCF(pc->from->pc)->fname) 
      fprintf(of,"; exit point of %s\n",PCF(pc->from->pc)->fname);
    else
      fprintf(of,"; exit point [can't find entry point]\n");
  }
}
/*-----------------------------------------------------------------*/
/* pCodePrintLabel - prints label                                  */
/*-----------------------------------------------------------------*/

static void pCodePrintLabel(FILE *of, pCode *pc)
{

  if(!pc || !of)
    return;

  if(PCL(pc)->label) 
    fprintf(of,"%s\n",PCL(pc)->label);
  else if (PCL(pc)->key >=0) 
    fprintf(of,"_%05d_DS_:\n",PCL(pc)->key);
  else
    fprintf(of,";wild card label: id=%d\n",-PCL(pc)->key);

}
/*-----------------------------------------------------------------*/
/* unlinkpCodeFromBranch - Search for a label in a pBranch and     */
/*                         remove it if it is found.               */
/*-----------------------------------------------------------------*/
static void unlinkpCodeFromBranch(pCode *pcl , pCode *pc)
{
  pBranch *b, *bprev;

  bprev = NULL;
  b = pcl->label;
  while(b) {
    if(b->pc == pc) {

      /* Found a label */
      if(bprev) {
	bprev->next = b->next;  /* Not first pCode in chain */
	free(b);
      } else {
	pc->destruct(pc);
	pcl->label = b->next;   /* First pCode in chain */
	free(b);
      }
      return;  /* A label can't occur more than once */
    }
    bprev = b;
    b = b->next;
  }

}

static pBranch * pBranchAppend(pBranch *h, pBranch *n)
{
  pBranch *b;

  if(!h)
    return n;

  b = h;
  while(b->next)
    b = b->next;

  b->next = n;

  return h;
  
}  
/*-----------------------------------------------------------------*/
/* pBranchLink - given two pcodes, this function will link them    */
/*               together through their pBranches                  */
/*-----------------------------------------------------------------*/
static void pBranchLink(pCode *f, pCode *t)
{
  pBranch *b;

  // Declare a new branch object for the 'from' pCode.

  _ALLOC(b,sizeof(pBranch));
  b->pc = t;                    // The link to the 'to' pCode.
  b->next = NULL;

  f->to = pBranchAppend(f->to,b);

  // Now do the same for the 'to' pCode.

  _ALLOC(b,sizeof(pBranch));
  b->pc = f;
  b->next = NULL;

  t->from = pBranchAppend(t->from,b);
  
}

#if 0
/*-----------------------------------------------------------------*/
/* pBranchFind - find the pBranch in a pBranch chain that contains */
/*               a pCode                                           */
/*-----------------------------------------------------------------*/
static pBranch *pBranchFind(pBranch *pb,pCode *pc)
{
  while(pb) {

    if(pb->pc == pc)
      return pb;

    pb = pb->next;
  }

  return NULL;
}

/*-----------------------------------------------------------------*/
/* pCodeUnlink - Unlink the given pCode from its pCode chain.      */
/*-----------------------------------------------------------------*/
static void pCodeUnlink(pCode *pc)
{
  pBranch *pb1,*pb2;
  pCode *pc1;

  if(!pc->prev || !pc->next) {
    fprintf(stderr,"unlinking bad pCode in %s:%d\n",__FILE__,__LINE__);
    exit(1);
  }

  /* first remove the pCode from the chain */
  pc->prev->next = pc->next;
  pc->next->prev = pc->prev;

  /* Now for the hard part... */

  /* Remove the branches */

  pb1 = pc->from;
  while(pb1) {
    pc1 = pb1->pc;    /* Get the pCode that branches to the
		       * one we're unlinking */

    /* search for the link back to this pCode (the one we're
     * unlinking) */
    if(pb2 = pBranchFind(pc1->to,pc)) {
      pb2->pc = pc->to->pc;  // make the replacement

      /* if the pCode we're unlinking contains multiple 'to'
       * branches (e.g. this a skip instruction) then we need
       * to copy these extra branches to the chain. */
      if(pc->to->next)
	pBranchAppend(pb2, pc->to->next);
    }
    
    pb1 = pb1->next;
  }


}
#endif
/*-----------------------------------------------------------------*/
/*-----------------------------------------------------------------*/
static void genericAnalyze(pCode *pc)
{
  switch(pc->type) {
  case PC_WILD:
  case PC_COMMENT:
    return;
  case PC_LABEL:
  case PC_FUNCTION:
  case PC_OPCODE:
    {
      // Go through the pCodes that are in pCode chain and link
      // them together through the pBranches. Note, the pCodes
      // are linked together as a contiguous stream like the 
      // assembly source code lines. The linking here mimics this
      // except that comments are not linked in.
      // 
      pCode *npc = pc->next;
      while(npc) {
	if(npc->type == PC_OPCODE || npc->type == PC_LABEL) {
	  pBranchLink(pc,npc);
	  return;
	} else
	  npc = npc->next;
      }
    }
  }
}

/*-----------------------------------------------------------------*/
int compareLabel(pCode *pc, pCodeOpLabel *pcop_label)
{
  pBranch *pbr;

  if(pc->type == PC_LABEL) {
    if( ((pCodeLabel *)pc)->key ==  pcop_label->key)
      return TRUE;
  }
  if(pc->type == PC_OPCODE) {
    pbr = pc->label;
    while(pbr) {
      if(pbr->pc->type == PC_LABEL) {
	if( ((pCodeLabel *)(pbr->pc))->key ==  pcop_label->key)
	  return TRUE;
      }
      pbr = pbr->next;
    }
  }

  return FALSE;
}

/*-----------------------------------------------------------------*/
/* findLabel - Search the pCode for a particular label             */
/*-----------------------------------------------------------------*/
pCode * findLabel(pCodeOpLabel *pcop_label)
{
  pBlock *pb;
  pCode  *pc;

  if(!the_pFile)
    return NULL;

  for(pb = the_pFile->pbHead; pb; pb = pb->next) {
    for(pc = pb->pcHead; pc; pc = pc->next) 
      if(compareLabel(pc,pcop_label))
	return pc;
    
  }

  fprintf(stderr,"Couldn't find label %s", pcop_label->pcop.name);
  return NULL;
}

/*-----------------------------------------------------------------*/
/* findNextInstruction - given a pCode, find the next instruction  */
/*                       in the linked list                        */
/*-----------------------------------------------------------------*/
pCode * findNextInstruction(pCode *pc)
{

  while(pc) {
    if((pc->type == PC_OPCODE) || (pc->type == PC_WILD))
      return pc;

    pc = pc->next;
  }

  fprintf(stderr,"Couldn't find instruction\n");
  return NULL;
}

/*-----------------------------------------------------------------*/
/* findFunctionEnd - given a pCode find the end of the function    */
/*                   that contains it     t                        */
/*-----------------------------------------------------------------*/
pCode * findFunctionEnd(pCode *pc)
{

  while(pc) {
    if(pc->type == PC_FUNCTION &&  !(PCF(pc)->fname))
      return pc;

    pc = pc->next;
  }

  fprintf(stderr,"Couldn't find function end\n");
  return NULL;
}

#if 0
/*-----------------------------------------------------------------*/
/* AnalyzeLabel - if the pCode is a label, then merge it with the  */
/*                instruction with which it is associated.         */
/*-----------------------------------------------------------------*/
static void AnalyzeLabel(pCode *pc)
{

  pCodeUnlink(pc);

}
#endif

static void AnalyzeGOTO(pCode *pc)
{

  pBranchLink(pc,findLabel( (pCodeOpLabel *) (PCI(pc)->pcop) ));

}

static void AnalyzeSKIP(pCode *pc)
{

  pBranchLink(pc,findNextInstruction(pc->next));
  pBranchLink(pc,findNextInstruction(pc->next->next));

}

static void AnalyzeRETURN(pCode *pc)
{

  //  branch_link(pc,findFunctionEnd(pc->next));

}


void AnalyzepBlock(pBlock *pb)
{
  pCode *pc;

  if(!pb)
    return;

  /* Find all of the registers used in this pBlock */
  for(pc = pb->pcHead; pc; pc = pc->next) {
    if(pc->type == PC_OPCODE) {
      if(PCI(pc)->pcop && PCI(pc)->pcop->type == PO_GPR_TEMP) {

	/* Loop through all of the registers declared so far in
	   this block and see if we find this new there */

	regs *r = setFirstItem(pb->registers);

	while(r) {
	  if(r->rIdx == PCOR(PCI(pc)->pcop)->r->rIdx) {
	    PCOR(PCI(pc)->pcop)->r = r;
	    break;
	  }
	  r = setNextItem(pb->registers);
	}

	if(!r) {
	  /* register wasn't found */
	  r = Safe_calloc(1, sizeof(regs));
	  memcpy(r,PCOR(PCI(pc)->pcop)->r, sizeof(regs));
	  addSet(&pb->registers, r);
	  PCOR(PCI(pc)->pcop)->r = r;
	  fprintf(stderr,"added register to pblock: reg %d\n",r->rIdx);
	} else 
	  fprintf(stderr,"found register in pblock: reg %d\n",r->rIdx);
      }
    }
  }
}

int OptimizepBlock(pBlock *pb)
{
  pCode *pc;
  int matches =0;

  if(!pb || !peepOptimizing)
    return 0;

  fprintf(stderr," Optimizing pBlock: %c\n",getpBlock_dbName(pb));
  for(pc = pb->pcHead; pc; pc = pc->next)
    matches += pCodePeepMatchRule(pc);

  return matches;

}

/*-----------------------------------------------------------------*/
/* pBlockRemoveUnusedLabels - remove the pCode labels from the     */
/*-----------------------------------------------------------------*/
pCode * findInstructionUsingLabel(pCodeLabel *pcl, pCode *pcs)
{
  pCode *pc;

  for(pc = pcs; pc; pc = pc->next) {

    if((pc->type == PC_OPCODE) && 
       (PCI(pc)->pcop) && 
       (PCI(pc)->pcop->type == PO_LABEL) &&
       (PCOLAB(PCI(pc)->pcop)->key == pcl->key))
      return pc;
  }
 

  return NULL;
}

/*-----------------------------------------------------------------*/
/* pBlockRemoveUnusedLabels - remove the pCode labels from the     */
/*                            pCode chain if they're not used.     */
/*-----------------------------------------------------------------*/
void pBlockRemoveUnusedLabels(pBlock *pb)
{
  pCode *pc; pCodeLabel *pcl;

  if(!pb)
    return;

  for(pc = pb->pcHead; pc; pc = pc->next) {

    if(pc->type == PC_LABEL)
      pcl = PCL(pc);
    else if (pc->label)
      pcl = PCL(pc->label->pc);
    else continue;

      /* This pCode is a label, so search the pBlock to see if anyone
       * refers to it */

    if( (pcl->key>0) && (!findInstructionUsingLabel(pcl, pb->pcHead))) {
      /* Couldn't find an instruction that refers to this label
       * So, unlink the pCode label from it's pCode chain
       * and destroy the label */

      fprintf(stderr," !!! REMOVED A LABEL !!! key = %d\n", pcl->key);

      if(pc->type == PC_LABEL) {
	unlinkPC(pc);
	pCodeLabelDestruct(pc);
      } else {
	unlinkpCodeFromBranch(pc, PCODE(pcl));
	/*if(pc->label->next == NULL && pc->label->pc == NULL) {
	  free(pc->label);
	}*/
      }

    }
  }

}


/*-----------------------------------------------------------------*/
/* pBlockMergeLabels - remove the pCode labels from the pCode      */
/*                     chain and put them into pBranches that are  */
/*                     associated with the appropriate pCode       */
/*                     instructions.                               */
/*-----------------------------------------------------------------*/
void pBlockMergeLabels(pBlock *pb)
{
  pBranch *pbr;
  pCode *pc, *pcnext=NULL;

  if(!pb)
    return;

  /* First, Try to remove any unused labels */
  //pBlockRemoveUnusedLabels(pb);

  /* Now loop through the pBlock and merge the labels with the opcodes */

  for(pc = pb->pcHead; pc; pc = pc->next) {

    if(pc->type == PC_LABEL) {
      fprintf(stderr,"Checking label key = %d\n",PCL(pc)->key);
      if( !(pcnext = findNextInstruction(pc)) ) 
	return;  // Couldn't find an instruction associated with this label

      // Unlink the pCode label from it's pCode chain
      unlinkPC(pc);

      fprintf(stderr,"Merged label key = %d\n",PCL(pc)->key);
      // And link it into the instruction's pBranch labels. (Note, since
      // it's possible to have multiple labels associated with one instruction
      // we must provide a means to accomodate the additional labels. Thus
      // the labels are placed into the singly-linked list "label" as 
      // opposed to being a single member of the pCodeInstruction.)

      _ALLOC(pbr,sizeof(pBranch));
      pbr->pc = pc;
      pbr->next = NULL;

      pcnext->label = pBranchAppend(pcnext->label,pbr);
      if(pcnext->prev) 
	pc = pcnext->prev;
      else
	pc = pcnext;
    }

  }
  pBlockRemoveUnusedLabels(pb);

}

/*-----------------------------------------------------------------*/
/*-----------------------------------------------------------------*/
void OptimizepCode(char dbName)
{
#define MAX_PASSES 4

  int matches = 0;
  int passes = 0;
  pBlock *pb;

  if(!the_pFile)
    return;

  fprintf(stderr," Optimizing pCode\n");

  do {
    for(pb = the_pFile->pbHead; pb; pb = pb->next) {
      if('*' == dbName || getpBlock_dbName(pb) == dbName)
	matches += OptimizepBlock(pb);
    }
  }
  while(matches && ++passes < MAX_PASSES);

}

/*-----------------------------------------------------------------*/
/* AnalyzepCode - parse the pCode that has been generated and form */
/*                all of the logical connections.                  */
/*                                                                 */
/* Essentially what's done here is that the pCode flow is          */
/* determined.                                                     */
/*-----------------------------------------------------------------*/

void AnalyzepCode(char dbName)
{
  pBlock *pb;
  pCode *pc;
  pBranch *pbr;

  int i,changes;

  if(!the_pFile)
    return;

  fprintf(stderr," Analyzing pCode");

  changes = 0;
  i = 0;
  do {
    /* First, merge the labels with the instructions */
    for(pb = the_pFile->pbHead; pb; pb = pb->next) {
      if('*' == dbName || getpBlock_dbName(pb) == dbName) {

	fprintf(stderr," analyze and merging block %c\n",dbName);
	pBlockMergeLabels(pb);
	AnalyzepBlock(pb);
      }
    }

    for(pb = the_pFile->pbHead; pb; pb = pb->next) {
      if('*' == dbName || getpBlock_dbName(pb) == dbName)
	changes += OptimizepBlock(pb);
    }
      
  } while(changes && (i++ < MAX_PASSES));

  /* Now build the call tree.
     First we examine all of the pCodes for functions.
     Keep in mind that the function boundaries coincide
     with pBlock boundaries. 

     The algorithm goes something like this:
     We have two nested loops. The outer loop iterates
     through all of the pBlocks/functions. The inner
     loop iterates through all of the pCodes for
     a given pBlock. When we begin iterating through
     a pBlock, the variable pc_fstart, pCode of the start
     of a function, is cleared. We then search for pCodes
     of type PC_FUNCTION. When one is encountered, we
     initialize pc_fstart to this and at the same time
     associate a new pBranch object that signifies a 
     branch entry. If a return is found, then this signifies
     a function exit point. We'll link the pCodes of these
     returns to the matching pc_fstart.

     When we're done, a doubly linked list of pBranches
     will exist. The head of this list is stored in
     `the_pFile', which is the meta structure for all
     of the pCode. Look at the printCallTree function
     on how the pBranches are linked together.

   */
  for(pb = the_pFile->pbHead; pb; pb = pb->next) {
    if('*' == dbName || getpBlock_dbName(pb) == dbName) {
      pCode *pc_fstart=NULL;
      for(pc = pb->pcHead; pc; pc = pc->next) {
	if(pc->type == PC_FUNCTION) {
	  if (PCF(pc)->fname) {
	    // I'm not liking this....
	    // Found the beginning of a function.
	    _ALLOC(pbr,sizeof(pBranch));
	    pbr->pc = pc_fstart = pc;
	    pbr->next = NULL;

	    the_pFile->functions = pBranchAppend(the_pFile->functions,pbr);

	    // Here's a better way of doing the same:
	    addSet(&pb->function_entries, pc);

	  } else {
	    // Found an exit point in a function, e.g. return
	    // (Note, there may be more than one return per function)
	    if(pc_fstart)
	      pBranchLink(pc_fstart, pc);

	    addSet(&pb->function_exits, pc);
	  }
	} else	if(pc->type == PC_OPCODE && PCI(pc)->op == POC_CALL) {
	  addSet(&pb->function_calls,pc);
	}
      }
    }
  }
}

/*-----------------------------------------------------------------*/
/* ispCodeFunction - returns true if *pc is the pCode of a         */
/*                   function                                      */
/*-----------------------------------------------------------------*/
bool ispCodeFunction(pCode *pc)
{

  if(pc && pc->type == PC_FUNCTION && PCF(pc)->fname)
    return 1;

  return 0;
}

/*-----------------------------------------------------------------*/
/* findFunction - Search for a function by name (given the name)   */
/*                in the set of all functions that are in a pBlock */
/* (note - I expect this to change because I'm planning to limit   */
/*  pBlock's to just one function declaration                      */
/*-----------------------------------------------------------------*/
pCode *findFunction(char *fname)
{
  pBlock *pb;
  pCode *pc;
  if(!fname)
    return NULL;

  for(pb = the_pFile->pbHead; pb; pb = pb->next) {

    pc = setFirstItem(pb->function_entries);
    while(pc) {
    
      if((pc->type == PC_FUNCTION) &&
	 (PCF(pc)->fname) && 
	 (strcmp(fname, PCF(pc)->fname)==0))
	return pc;

      pc = setNextItem(pb->function_entries);

    }

  }
  return NULL;
}

void MarkUsedRegisters(set *regset)
{

  regs *r1,*r2;

  for(r1=setFirstItem(regset); r1; r1=setNextItem(regset)) {
    r2 = pic14_regWithIdx(r1->rIdx);
    r2->isFree = 0;
    r2->wasUsed = 1;
  }
}

void pBlockStats(FILE *of, pBlock *pb)
{

  pCode *pc;
  regs  *r;

  fprintf(of,"***\n  pBlock Stats\n***\n");

  // for now just print the first element of each set
  pc = setFirstItem(pb->function_entries);
  if(pc) {
    fprintf(of,"entry\n");
    pc->print(of,pc);
  }
  pc = setFirstItem(pb->function_exits);
  if(pc) {
    fprintf(of,"has an exit\n");
    pc->print(of,pc);
  }

  pc = setFirstItem(pb->function_calls);
  if(pc) {
    fprintf(of,"functions called\n");

    while(pc) {
      pc->print(of,pc);
      pc = setNextItem(pb->function_calls);
    }
  }

  r = setFirstItem(pb->registers);
  if(r) {
    int n = elementsInSet(pb->registers);

    fprintf(of,"%d compiler assigned register%c:\n",n, ( (n!=1) ? 's' : ' '));

    while (r) {
      fprintf(of,"   %s\n",r->name);
      r = setNextItem(pb->registers);
    }
  }
}

/*-----------------------------------------------------------------*/
/*-----------------------------------------------------------------*/
void sequencepCode(void)
{
  pBlock *pb;
  pCode *pc;


  for(pb = the_pFile->pbHead; pb; pb = pb->next) {

    pb->seq = GpCodeSequenceNumber+1;

    for( pc = pb->pcHead; pc; pc = pc->next)
      pc->seq = ++GpCodeSequenceNumber;
  }

}

/*-----------------------------------------------------------------*/
/*-----------------------------------------------------------------*/
set *register_usage(pBlock *pb)
{
  pCode *pc,*pcn;
  set *registers=NULL;
  set *registersInCallPath = NULL;

  /* check recursion */

  pc = setFirstItem(pb->function_entries);

  if(!pc)
    return registers;

  pb->visited = 1;

  if(pc->type != PC_FUNCTION)
    fprintf(stderr,"%s, first pc is not a function???\n",__FUNCTION__);

  pc = setFirstItem(pb->function_calls);
  for( ; pc; pc = setNextItem(pb->function_calls)) {

    if(pc->type == PC_OPCODE && PCI(pc)->op == POC_CALL) {
      char *dest = get_op(PCI(pc));

      pcn = findFunction(dest);
      if(pcn) 
	registersInCallPath = register_usage(pcn->pb);
    } else
      fprintf(stderr,"BUG? pCode isn't a POC_CALL %d\n",__LINE__);

  }


  pBlockStats(stderr,pb);  // debug

  // Mark the registers in this block as used.

  MarkUsedRegisters(pb->registers);
  if(registersInCallPath) {
    /* registers were used in the functions this pBlock has called */
    /* so now, we need to see if these collide with the ones we are */
    /* using here */

    regs *r1,*r2, *newreg;

    fprintf(stderr,"comparing registers\n");

    r1 = setFirstItem(registersInCallPath);
    while(r1) {

      r2 = setFirstItem(pb->registers);

      while(r2) {

	if(r2->rIdx == r1->rIdx) {
	  newreg = pic14_findFreeReg();


	  if(!newreg) {
	    fprintf(stderr,"Bummer, no more registers.\n");
	    exit(1);
	  }

	  fprintf(stderr,"Cool found register collision nIdx=%d moving to %d\n",
		  r1->rIdx, newreg->rIdx);
	  r2->rIdx = newreg->rIdx;
	  //if(r2->name) free(r2->name);
	  if(newreg->name)
	    r2->name = Safe_strdup(newreg->name);
	  else
	    r2->name = NULL;
	  newreg->isFree = 0;
	  newreg->wasUsed = 1;
	}
	r2 = setNextItem(pb->registers);
      }

      r1 = setNextItem(registersInCallPath);
    }

    /* Collisions have been resolved. Now free the registers in the call path */
    r1 = setFirstItem(registersInCallPath);
    while(r1) {
      newreg = pic14_regWithIdx(r1->rIdx);
      newreg->isFree = 1;
      r1 = setNextItem(registersInCallPath);
    }

  }// else
  //    MarkUsedRegisters(pb->registers);

  registers = unionSets(pb->registers, registersInCallPath, THROW_NONE);

  if(registers) 
    fprintf(stderr,"returning regs\n");
  else
    fprintf(stderr,"not returning regs\n");

  fprintf(stderr,"pBlock after register optim.\n");
  pBlockStats(stderr,pb);  // debug


  return registers;
}

/*-----------------------------------------------------------------*/
/* printCallTree - writes the call tree to a file                  */
/*                                                                 */
/*-----------------------------------------------------------------*/
void pct2(FILE *of,pBlock *pb,int indent)
{
  pCode *pc,*pcn;
  int i;
  //  set *registersInCallPath = NULL;

  if(!of)
    return;// registers;

  if(indent > 10)
    return; // registers;   //recursion ?

  pc = setFirstItem(pb->function_entries);

  if(!pc)
    return;

  pb->visited = 0;

  for(i=0;i<indent;i++)   // Indentation
    fputc(' ',of);

  if(pc->type == PC_FUNCTION)
    fprintf(of,"%s\n",PCF(pc)->fname);
  else
    return;  // ???


  pc = setFirstItem(pb->function_calls);
  for( ; pc; pc = setNextItem(pb->function_calls)) {

    if(pc->type == PC_OPCODE && PCI(pc)->op == POC_CALL) {
      char *dest = get_op(PCI(pc));

      pcn = findFunction(dest);
      if(pcn) 
	pct2(of,pcn->pb,indent+1);
    } else
      fprintf(of,"BUG? pCode isn't a POC_CALL %d\n",__LINE__);

  }


}

#if 0
  fprintf(stderr,"pBlock before register optim.\n");
  pBlockStats(stderr,pb);  // debug

  if(registersInCallPath) {
    /* registers were used in the functions this pBlock has called */
    /* so now, we need to see if these collide with the ones we are using here */

    regs *r1,*r2, *newreg;

    fprintf(stderr,"comparing registers\n");

    r1 = setFirstItem(registersInCallPath);
    while(r1) {

      r2 = setFirstItem(pb->registers);

      while(r2) {

	if(r2->rIdx == r1->rIdx) {
	  newreg = pic14_findFreeReg();


	  if(!newreg) {
	    fprintf(stderr,"Bummer, no more registers.\n");
	    exit(1);
	  }

	  fprintf(stderr,"Cool found register collision nIdx=%d moving to %d\n",
		  r1->rIdx, newreg->rIdx);
	  r2->rIdx = newreg->rIdx;
	  //if(r2->name) free(r2->name);
	  if(newreg->name)
	    r2->name = Safe_strdup(newreg->name);
	  else
	    r2->name = NULL;
	  newreg->isFree = 0;
	  newreg->wasUsed = 1;
	}
	r2 = setNextItem(pb->registers);
      }

      r1 = setNextItem(registersInCallPath);
    }

    /* Collisions have been resolved. Now free the registers in the call path */
    r1 = setFirstItem(registersInCallPath);
    while(r1) {
      newreg = pic14_regWithIdx(r1->rIdx);
      newreg->isFree = 1;
      r1 = setNextItem(registersInCallPath);
    }

  } else
    MarkUsedRegisters(pb->registers);

  registers = unionSets(pb->registers, registersInCallPath, THROW_NONE);

  if(registers) 
    fprintf(stderr,"returning regs\n");
  else
    fprintf(stderr,"not returning regs\n");

  fprintf(stderr,"pBlock after register optim.\n");
  pBlockStats(stderr,pb);  // debug


  return registers;

#endif


/*-----------------------------------------------------------------*/
/* printCallTree - writes the call tree to a file                  */
/*                                                                 */
/*-----------------------------------------------------------------*/

void printCallTree(FILE *of)
{
  pBranch *pbr;
  pBlock  *pb;
  pCode   *pc;

  if(!the_pFile)
    return;

  if(!of)
    of = stderr;

  fprintf(of, "\npBlock statistics\n");
  for(pb = the_pFile->pbHead; pb;  pb = pb->next )
    pBlockStats(stderr,pb);



  fprintf(of,"Call Tree\n");
  pbr = the_pFile->functions;
  while(pbr) {
    if(pbr->pc) {
      pc = pbr->pc;
      if(!ispCodeFunction(pc))
	fprintf(of,"bug in call tree");


      fprintf(of,"Function: %s\n", PCF(pc)->fname);

      while(pc->next && !ispCodeFunction(pc->next)) {
	pc = pc->next;
	if(pc->type == PC_OPCODE && PCI(pc)->op == POC_CALL)
	  fprintf(of,"\t%s\n",get_op(PCI(pc)));
      }
    }

    pbr = pbr->next;
  }


  /* Re-allocate the registers so that there are no collisions
   * between local variables when one function call another */

  pic14_deallocateAllRegs();

  for(pb = the_pFile->pbHead; pb; pb = pb->next) {
    if(!pb->visited)
      register_usage(pb);
  }

  fprintf(of,"\n**************\n\na better call tree\n");
  for(pb = the_pFile->pbHead; pb; pb = pb->next) {
    if(pb->visited)
      pct2(of,pb,0);
  }

  for(pb = the_pFile->pbHead; pb; pb = pb->next) {
    fprintf(of,"block dbname: %c\n", getpBlock_dbName(pb));
  }
}

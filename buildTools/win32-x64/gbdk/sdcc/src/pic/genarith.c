/*-------------------------------------------------------------------------
  genarith.c - source file for code generation - arithmetic 
  
  Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1998)
         and -  Jean-Louis VERN.jlvern@writeme.com (1999)
  Bug Fixes  -  Wojciech Stryjewski  wstryj1@tiger.lsu.edu (1999 v2.1.9a)
  PIC port   -  Scott Dattalo scott@dattalo.com (2000)
  
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
  
  Notes:
  000123 mlh	Moved aopLiteral to SDCCglue.c to help the split
  		Made everything static
-------------------------------------------------------------------------*/

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include "SDCCglobl.h"
#include "newalloc.h"

#if defined(_MSC_VER)
#define __FUNCTION__		__FILE__
#endif

#ifdef HAVE_SYS_ISA_DEFS_H
#include <sys/isa_defs.h>
#else
#ifdef HAVE_MACHINE_ENDIAN_H
#include <machine/endian.h>
#else
#ifdef HAVE_ENDIAN_H
#include <endian.h>
#else
#if !defined(__BORLANDC__) && !defined(_MSC_VER) && !defined(__MINGW32__) && !defined(__CYGWIN__)
#warning "Cannot determine ENDIANESS of this machine assuming LITTLE_ENDIAN"
#warning "If you running sdcc on an INTEL 80x86 Platform you are okay"
#endif
#endif
#endif
#endif

#include "common.h"
#include "SDCCpeeph.h"
#include "ralloc.h"
#include "pcode.h"
#include "gen.h"


#define BYTEofLONG(l,b) ( (l>> (b<<3)) & 0xff)

const char *AopType(short type)
{
  switch(type) {
  case AOP_LIT:
    return "AOP_LIT";
    break;
  case AOP_REG:
    return "AOP_REG";
    break;
  case AOP_DIR:
    return "AOP_DIR";
    break;
  case AOP_DPTR:
    return "AOP_DPTR";
    break;
  case AOP_DPTR2:
    return "AOP_DPTR2";
    break;
  case AOP_R0:
    return "AOP_R0";
    break;
  case AOP_R1:
    return "AOP_R1";
    break;
  case AOP_STK:
    return "AOP_STK";
    break;
  case AOP_IMMD:
    return "AOP_IMMD";
    break;
  case AOP_STR:
    return "AOP_STR";
    break;
  case AOP_CRY:
    return "AOP_CRY";
    break;
  case AOP_ACC:
    return "AOP_ACC";
    break;
  }

  return "BAD TYPE";
}
/*-----------------------------------------------------------------*/
/* genPlusIncr :- does addition with increment if possible         */
/*-----------------------------------------------------------------*/
bool genPlusIncr (iCode *ic)
{
    unsigned int icount ;
    unsigned int size = pic14_getDataSize(IC_RESULT(ic));

    DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);
    DEBUGpic14_emitcode ("; ","result %s, left %s, right %s",
			 AopType(AOP_TYPE(IC_RESULT(ic))),
			 AopType(AOP_TYPE(IC_LEFT(ic))),
			 AopType(AOP_TYPE(IC_RIGHT(ic))));

    /* will try to generate an increment */
    /* if the right side is not a literal 
       we cannot */
    if (AOP_TYPE(IC_RIGHT(ic)) != AOP_LIT)
        return FALSE ;
    
    DEBUGpic14_emitcode ("; ","%s  %d",__FUNCTION__,__LINE__);
    /* if the literal value of the right hand side
       is greater than 1 then it is faster to add */
    if ((icount = (unsigned int) floatFromVal (AOP(IC_RIGHT(ic))->aopu.aop_lit)) > 2)
        return FALSE ;
    
    /* if increment 16 bits in register */
    if (pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic))) &&
        (icount == 1)) {

      int offset = MSB16;

      emitpcode(POC_INCF, popGet(AOP(IC_RESULT(ic)),LSB,FALSE,FALSE));
      //pic14_emitcode("incf","%s,f",aopGet(AOP(IC_RESULT(ic)),LSB,FALSE,FALSE));

      while(--size) {
	emitSKPNZ;
	emitpcode(POC_INCF, popGet(AOP(IC_RESULT(ic)),offset++,FALSE,FALSE));
	//pic14_emitcode(" incf","%s,f",aopGet(AOP(IC_RESULT(ic)),offset++,FALSE,FALSE));
      }

      return TRUE;
    }
    
    DEBUGpic14_emitcode ("; ","%s  %d",__FUNCTION__,__LINE__);
    /* if left is in accumulator  - probably a bit operation*/
    if( strcmp(aopGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE),"a")  &&
	(AOP_TYPE(IC_RESULT(ic)) == AOP_CRY) ) {
      
      emitpcode(POC_BCF, popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
      pic14_emitcode("bcf","(%s >> 3), (%s & 7)",
	       AOP(IC_RESULT(ic))->aopu.aop_dir,
	       AOP(IC_RESULT(ic))->aopu.aop_dir);
      if(icount)
	emitpcode(POC_XORLW,popGetLit(1));
      //pic14_emitcode("xorlw","1");
      else
	emitpcode(POC_ANDLW,popGetLit(1));
      //pic14_emitcode("andlw","1");

      emitSKPZ;
      emitpcode(POC_BSF, popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
      pic14_emitcode("bsf","(%s >> 3), (%s & 7)",
	       AOP(IC_RESULT(ic))->aopu.aop_dir,
	       AOP(IC_RESULT(ic))->aopu.aop_dir);

      return TRUE;
    }



    /* if the sizes are greater than 1 then we cannot */
    if (AOP_SIZE(IC_RESULT(ic)) > 1 ||
        AOP_SIZE(IC_LEFT(ic)) > 1   )
        return FALSE ;
    
    /* If we are incrementing the same register by two: */

    if (pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic))) ) {
	
      while (icount--) 
	emitpcode(POC_INCF, popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
      //pic14_emitcode("incf","%s,f",aopGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	
      return TRUE ;
    }
    
    DEBUGpic14_emitcode ("; ","couldn't increment ");

    return FALSE ;
}

/*-----------------------------------------------------------------*/
/* pic14_outBitAcc - output a bit in acc                                 */
/*-----------------------------------------------------------------*/
void pic14_outBitAcc(operand *result)
{
    symbol *tlbl = newiTempLabel(NULL);
    /* if the result is a bit */
    DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);

    if (AOP_TYPE(result) == AOP_CRY){
        aopPut(AOP(result),"a",0);
    }
    else {
        pic14_emitcode("jz","%05d_DS_",tlbl->key+100);
        pic14_emitcode("mov","a,#01");
        pic14_emitcode("","%05d_DS_:",tlbl->key+100);
        pic14_outAcc(result);
    }
}

/*-----------------------------------------------------------------*/
/* genPlusBits - generates code for addition of two bits           */
/*-----------------------------------------------------------------*/
void genPlusBits (iCode *ic)
{

  DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);

  DEBUGpic14_emitcode ("; ","result %s, left %s, right %s",
		       AopType(AOP_TYPE(IC_RESULT(ic))),
		       AopType(AOP_TYPE(IC_LEFT(ic))),
		       AopType(AOP_TYPE(IC_RIGHT(ic))));
  /*
    The following block of code will add two bits. 
    Note that it'll even work if the destination is
    the carry (C in the status register).
    It won't work if the 'Z' bit is a source or destination.
  */

  /* If the result is stored in the accumulator (w) */
  //if(strcmp(aopGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE),"a") == 0 ) {
  switch(AOP_TYPE(IC_RESULT(ic))) {
  case AOP_ACC:
    emitpcode(POC_CLRW, NULL);
    emitpcode(POC_BTFSC, popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
    emitpcode(POC_XORLW, popGetLit(1));
    emitpcode(POC_BTFSC, popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
    emitpcode(POC_XORLW, popGetLit(1));

    pic14_emitcode("clrw","");
    pic14_emitcode("btfsc","(%s >> 3), (%s & 7)",
		   AOP(IC_RIGHT(ic))->aopu.aop_dir,
		   AOP(IC_RIGHT(ic))->aopu.aop_dir);
    pic14_emitcode("xorlw","1");
    pic14_emitcode("btfsc","(%s >> 3), (%s & 7)",
		   AOP(IC_LEFT(ic))->aopu.aop_dir,
		   AOP(IC_LEFT(ic))->aopu.aop_dir);
    pic14_emitcode("xorlw","1");
    break;
  case AOP_REG:
    emitpcode(POC_MOVLW, popGetLit(0));
    emitpcode(POC_BTFSC, popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
    emitpcode(POC_XORLW, popGetLit(1));
    emitpcode(POC_BTFSC, popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
    emitpcode(POC_XORLW, popGetLit(1));
    emitpcode(POC_MOVWF, popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
    break;
  default:
    emitpcode(POC_MOVLW, popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
    emitpcode(POC_BCF,   popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
    emitpcode(POC_BTFSC, popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
    emitpcode(POC_XORWF, popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
    emitpcode(POC_BTFSC, popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
    emitpcode(POC_XORWF, popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

    pic14_emitcode("movlw","(1 << (%s & 7))",
		   AOP(IC_RESULT(ic))->aopu.aop_dir,
		   AOP(IC_RESULT(ic))->aopu.aop_dir);
    pic14_emitcode("bcf","(%s >> 3), (%s & 7)",
		   AOP(IC_RESULT(ic))->aopu.aop_dir,
		   AOP(IC_RESULT(ic))->aopu.aop_dir);
    pic14_emitcode("btfsc","(%s >> 3), (%s & 7)",
		   AOP(IC_RIGHT(ic))->aopu.aop_dir,
		   AOP(IC_RIGHT(ic))->aopu.aop_dir);
    pic14_emitcode("xorwf","(%s >>3),f",
		   AOP(IC_RESULT(ic))->aopu.aop_dir);
    pic14_emitcode("btfsc","(%s >> 3), (%s & 7)",
		   AOP(IC_LEFT(ic))->aopu.aop_dir,
		   AOP(IC_LEFT(ic))->aopu.aop_dir);
    pic14_emitcode("xorwf","(%s>>3),f",
		   AOP(IC_RESULT(ic))->aopu.aop_dir);
    break;
  }

}

#if 0
/* This is the original version of this code.
 *
 * This is being kept around for reference, 
 * because I am not entirely sure I got it right...
 */
static void adjustArithmeticResult(iCode *ic)
{
    if (AOP_SIZE(IC_RESULT(ic)) == 3 && 
	AOP_SIZE(IC_LEFT(ic)) == 3   &&
	!pic14_sameRegs(AOP(IC_RESULT(ic)),AOP(IC_LEFT(ic))))
	aopPut(AOP(IC_RESULT(ic)),
	       aopGet(AOP(IC_LEFT(ic)),2,FALSE,FALSE),
	       2);

    if (AOP_SIZE(IC_RESULT(ic)) == 3 && 
	AOP_SIZE(IC_RIGHT(ic)) == 3   &&
	!pic14_sameRegs(AOP(IC_RESULT(ic)),AOP(IC_RIGHT(ic))))
	aopPut(AOP(IC_RESULT(ic)),
	       aopGet(AOP(IC_RIGHT(ic)),2,FALSE,FALSE),
	       2);
    
    if (AOP_SIZE(IC_RESULT(ic)) == 3 &&
	AOP_SIZE(IC_LEFT(ic)) < 3    &&
	AOP_SIZE(IC_RIGHT(ic)) < 3   &&
	!pic14_sameRegs(AOP(IC_RESULT(ic)),AOP(IC_LEFT(ic))) &&
	!pic14_sameRegs(AOP(IC_RESULT(ic)),AOP(IC_RIGHT(ic)))) {
	char buffer[5];
	sprintf(buffer,"#%d",pointerCode(getSpec(operandType(IC_LEFT(ic)))));
	aopPut(AOP(IC_RESULT(ic)),buffer,2);
    }
}
//#else
/* This is the pure and virtuous version of this code.
 * I'm pretty certain it's right, but not enough to toss the old 
 * code just yet...
 */
static void adjustArithmeticResult(iCode *ic)
{
    if (opIsGptr(IC_RESULT(ic)) &&
    	opIsGptr(IC_LEFT(ic))   &&
	!pic14_sameRegs(AOP(IC_RESULT(ic)),AOP(IC_LEFT(ic))))
    {
	aopPut(AOP(IC_RESULT(ic)),
	       aopGet(AOP(IC_LEFT(ic)), GPTRSIZE - 1,FALSE,FALSE),
	       GPTRSIZE - 1);
    }

    if (opIsGptr(IC_RESULT(ic)) &&
        opIsGptr(IC_RIGHT(ic))   &&
	!pic14_sameRegs(AOP(IC_RESULT(ic)),AOP(IC_RIGHT(ic))))
    {
	aopPut(AOP(IC_RESULT(ic)),
	       aopGet(AOP(IC_RIGHT(ic)),GPTRSIZE - 1,FALSE,FALSE),
	       GPTRSIZE - 1);
    }

    if (opIsGptr(IC_RESULT(ic)) 	   &&
        AOP_SIZE(IC_LEFT(ic)) < GPTRSIZE   &&
        AOP_SIZE(IC_RIGHT(ic)) < GPTRSIZE  &&
	 !pic14_sameRegs(AOP(IC_RESULT(ic)),AOP(IC_LEFT(ic))) &&
	 !pic14_sameRegs(AOP(IC_RESULT(ic)),AOP(IC_RIGHT(ic)))) {
	 char buffer[5];
	 sprintf(buffer,"#%d",pointerCode(getSpec(operandType(IC_LEFT(ic)))));
	 aopPut(AOP(IC_RESULT(ic)),buffer,GPTRSIZE - 1);
     }
}
#endif

/*-----------------------------------------------------------------*/
/* genAddlit - generates code for addition                         */
/*-----------------------------------------------------------------*/
static void genAddLit2byte (operand *result, int offr, int lit)
{

  switch(lit & 0xff) {
  case 0:
    break;
  case 1:
    emitpcode(POC_INCF, popGet(AOP(result),offr,FALSE,FALSE));
    break;
  case 0xff:
    emitpcode(POC_DECF, popGet(AOP(result),offr,FALSE,FALSE));
    break;
  default:
    emitpcode(POC_MOVLW,popGetLit(lit&0xff));
    emitpcode(POC_ADDWF,popGet(AOP(result),offr,FALSE,FALSE));
  }

}

static void emitMOVWF(operand *reg, int offset)
{
  if(!reg)
    return;

  if (AOP_TYPE(reg) == AOP_ACC) {
    DEBUGpic14_emitcode ("; ***","%s  %d ignoring mov into W",__FUNCTION__,__LINE__);
    return;
  }

  emitpcode(POC_MOVWF, popGet(AOP(reg),offset,FALSE,FALSE));

}

static void genAddLit (iCode *ic, int lit)
{

  int size,same;
  int lo;

  operand *result;
  operand *left;

  DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);


  left = IC_LEFT(ic);
  result = IC_RESULT(ic);
  same = pic14_sameRegs(AOP(left), AOP(result));
  size = pic14_getDataSize(result);

  if(same) {

    /* Handle special cases first */
    if(size == 1) 
      genAddLit2byte (result, 0, lit);
     
    else if(size == 2) {
      int hi = 0xff & (lit >> 8);
      lo = lit & 0xff;

      switch(hi) {
      case 0: 

	/* lit = 0x00LL */
	DEBUGpic14_emitcode ("; hi = 0","%s  %d",__FUNCTION__,__LINE__);
	switch(lo) {
	case 0:
	  break;
	case 1:
	  emitpcode(POC_INCF, popGet(AOP(result),0,FALSE,FALSE));
	  emitSKPNZ;
	  emitpcode(POC_INCF, popGet(AOP(result),MSB16,FALSE,FALSE));	
	  break;
	case 0xff:
	  emitpcode(POC_DECF, popGet(AOP(result),0,FALSE,FALSE));
	  emitpcode(POC_INCFSZW, popGet(AOP(result),0,FALSE,FALSE));
	  emitpcode(POC_INCF, popGet(AOP(result),MSB16,FALSE,FALSE));	

	  break;
	default:
	  emitpcode(POC_MOVLW,popGetLit(lit&0xff));
	  emitpcode(POC_ADDWF,popGet(AOP(result),0,FALSE,FALSE));
	  emitSKPNC;
	  emitpcode(POC_INCF, popGet(AOP(result),MSB16,FALSE,FALSE));	


	}
	break;

      case 1:
	/* lit = 0x01LL */
	DEBUGpic14_emitcode ("; hi = 1","%s  %d",__FUNCTION__,__LINE__);
	switch(lo) {
	case 0:  /* 0x0100 */
	  emitpcode(POC_INCF, popGet(AOP(result),MSB16,FALSE,FALSE));	
	  break;
	case 1:  /* 0x0101  */
	  emitpcode(POC_INCF, popGet(AOP(result),MSB16,FALSE,FALSE));
	  emitpcode(POC_INCF, popGet(AOP(result),0,FALSE,FALSE));
	  emitSKPNZ;
	  emitpcode(POC_INCF, popGet(AOP(result),MSB16,FALSE,FALSE));	
	  break;
	case 0xff: /* 0x01ff */
	  emitpcode(POC_DECF, popGet(AOP(result),0,FALSE,FALSE));
	  emitpcode(POC_INCFSZW, popGet(AOP(result),0,FALSE,FALSE));
	  emitpcode(POC_INCF, popGet(AOP(result),MSB16,FALSE,FALSE));	
	  emitpcode(POC_INCF, popGet(AOP(result),MSB16,FALSE,FALSE));	
	}	  
	break;

      case 0xff:
	DEBUGpic14_emitcode ("; hi = ff","%s  %d",__FUNCTION__,__LINE__);
	/* lit = 0xffLL */
	switch(lo) {
	case 0:  /* 0xff00 */
	  emitpcode(POC_DECF, popGet(AOP(result),MSB16,FALSE,FALSE));
	  break;
	case 1:  /*0xff01 */
	  emitpcode(POC_INCFSZ, popGet(AOP(result),0,FALSE,FALSE));
	  emitpcode(POC_DECF, popGet(AOP(result),MSB16,FALSE,FALSE));
	  break;
/*	case 0xff: * 0xffff *
	  emitpcode(POC_INCFSZW, popGet(AOP(result),0,FALSE,FALSE));
	  emitpcode(POC_INCF, popGet(AOP(result),MSB16,FALSE,FALSE));
	  emitpcode(POC_DECF, popGet(AOP(result),0,FALSE,FALSE));
	  break;
*/
	default:
	  emitpcode(POC_MOVLW,popGetLit(lo));
	  emitpcode(POC_ADDWF,popGet(AOP(result),0,FALSE,FALSE));
	  emitSKPC;
	  emitpcode(POC_DECF, popGet(AOP(result),MSB16,FALSE,FALSE));
	  
	}

	break;
	
      default:
	DEBUGpic14_emitcode ("; hi is generic","%d   %s  %d",hi,__FUNCTION__,__LINE__);

	/* lit = 0xHHLL */
	switch(lo) {
	case 0:  /* 0xHH00 */
	  genAddLit2byte (result, MSB16, hi);
	  break;
	case 1:  /* 0xHH01 */
	  emitpcode(POC_MOVLW,popGetLit((hi+1)&0xff));
	  emitpcode(POC_INCFSZ, popGet(AOP(result),0,FALSE,FALSE));
	  emitpcode(POC_MOVLW,popGetLit(hi));
	  emitpcode(POC_ADDWF,popGet(AOP(result),MSB16,FALSE,FALSE));
	  break;
/*	case 0xff: * 0xHHff *
	  emitpcode(POC_MOVFW, popGet(AOP(result),0,FALSE,FALSE));
	  emitpcode(POC_DECF, popGet(AOP(result),MSB16,FALSE,FALSE));
	  emitpcode(POC_MOVLW,popGetLit(hi));
	  emitpcode(POC_ADDWF,popGet(AOP(result),MSB16,FALSE,FALSE));
	  break;
*/	default:  /* 0xHHLL */
	  emitpcode(POC_MOVLW,popGetLit(lo));
	  emitpcode(POC_ADDWF, popGet(AOP(result),0,FALSE,FALSE));
	  emitpcode(POC_MOVLW,popGetLit(hi));
	  emitSKPNC;
	  emitpcode(POC_MOVLW,popGetLit((hi+1) & 0xff));
	  emitpcode(POC_ADDWF,popGet(AOP(result),MSB16,FALSE,FALSE));
	  break;
	}

      }
    } else {
      int carry_info = 0;
      int offset = 0;
      /* size > 2 */
      DEBUGpic14_emitcode (";  add lit to long","%s  %d",__FUNCTION__,__LINE__);

      while(size--) {
	lo = BYTEofLONG(lit,0);

	if(carry_info) {
	  switch(lo) {
	  case 0:
	    switch(carry_info) {
	    case 1:
	      emitSKPNZ;
	      emitpcode(POC_INCF, popGet(AOP(result),offset,FALSE,FALSE));
	      break;
	    case 2:
	      emitpcode(POC_RLFW, popGet(AOP(result),offset,FALSE,FALSE));
	      emitpcode(POC_ANDLW,popGetLit(1));
	      emitpcode(POC_ADDWF, popGet(AOP(result),offset,FALSE,FALSE));
	      break;
	    default: /* carry_info = 3  */
	      emitSKPNC;
	      emitpcode(POC_INCF, popGet(AOP(result),offset,FALSE,FALSE));
	      carry_info = 1;
	      break;
	    }
	    break;
	  case 0xff:
	    emitpcode(POC_MOVLW,popGetLit(lo));
	    if(carry_info==1) 
	      emitSKPZ;
	    else
	      emitSKPC;
	    emitpcode(POC_ADDWF, popGet(AOP(result),offset,FALSE,FALSE));
	    break;
	  default:
	    emitpcode(POC_MOVLW,popGetLit(lo));
	    if(carry_info==1) 
	      emitSKPNZ;
	    else
	      emitSKPNC;
	    emitpcode(POC_MOVLW,popGetLit(lo+1));
	    emitpcode(POC_ADDWF, popGet(AOP(result),offset,FALSE,FALSE));
	    carry_info=2;
	    break;
	  }
	}else {
	  /* no carry info from previous step */
	  /* this means this is the first time to add */
	  switch(lo) {
	  case 0:
	    break;
	  case 1:
	    emitpcode(POC_INCF, popGet(AOP(result),offset,FALSE,FALSE));
	    carry_info=1;
	    break;
	  default:
	    emitpcode(POC_MOVLW,popGetLit(lo));
	    emitpcode(POC_ADDWF, popGet(AOP(result),offset,FALSE,FALSE));
	    if(lit <0x100) 
	      carry_info = 3;  /* Were adding only one byte and propogating the carry */
	    else
	      carry_info = 2;
	    break;
	  }
	}
	offset++;
	lit >>= 8;
      }
    
/*
      lo = BYTEofLONG(lit,0);

      if(lit < 0x100) {
	if(lo) {
	  if(lo == 1) {
	    emitpcode(POC_INCF, popGet(AOP(result),0,FALSE,FALSE));
	    emitSKPNZ;
	  } else {
	    emitpcode(POC_MOVLW,popGetLit(lo));
	    emitpcode(POC_ADDWF, popGet(AOP(result),0,FALSE,FALSE));
	    emitSKPNC;
	  }
	  emitpcode(POC_INCF, popGet(AOP(result),1,FALSE,FALSE));
	  emitSKPNZ;
	  emitpcode(POC_INCF, popGet(AOP(result),2,FALSE,FALSE));
	  emitSKPNZ;
	  emitpcode(POC_INCF, popGet(AOP(result),3,FALSE,FALSE));

	} 
      } 
    }

*/
    }
  } else {
    int offset = 1;
    DEBUGpic14_emitcode (";  left and result aren't same","%s  %d",__FUNCTION__,__LINE__);

    if(size == 1) {

      if(AOP_TYPE(left) == AOP_ACC) {
	/* left addend is already in accumulator */
	switch(lit & 0xff) {
	case 0:
	  //emitpcode(POC_MOVWF, popGet(AOP(result),0,FALSE,FALSE));
	  emitMOVWF(result,0);
	  break;
	default:
	  emitpcode(POC_ADDLW, popGetLit(lit & 0xff));
	  //emitpcode(POC_MOVWF, popGet(AOP(result),0,FALSE,FALSE));
	  emitMOVWF(result,0);
	}
      } else {
	/* left addend is in a register */
	switch(lit & 0xff) {
	case 0:
	  emitpcode(POC_MOVFW, popGet(AOP(left),0,FALSE,FALSE));
	  emitMOVWF(result, 0);
	  //emitpcode(POC_MOVWF, popGet(AOP(result),0,FALSE,FALSE));
	  emitMOVWF(result,0);
	  break;
	case 1:
	  emitpcode(POC_INCFW, popGet(AOP(left),0,FALSE,FALSE));
	  //emitpcode(POC_MOVWF, popGet(AOP(result),0,FALSE,FALSE));
	  emitMOVWF(result,0);
	  break;
	case 0xff:
	  emitpcode(POC_DECFW, popGet(AOP(left),0,FALSE,FALSE));
	  //emitpcode(POC_MOVWF, popGet(AOP(result),0,FALSE,FALSE));
	  emitMOVWF(result,0);
	  break;
	default:
	  emitpcode(POC_MOVLW, popGetLit(lit & 0xff));
	  emitpcode(POC_ADDFW, popGet(AOP(left),0,FALSE,FALSE));
	  //emitpcode(POC_MOVWF, popGet(AOP(result),0,FALSE,FALSE));
	  emitMOVWF(result,0);
	}
      }

    } else {

      /* left is not the accumulator */
      if(lit & 0xff) {
	emitpcode(POC_MOVLW, popGetLit(lit & 0xff));
	emitpcode(POC_ADDFW, popGet(AOP(left),0,FALSE,FALSE));
      } else
	emitpcode(POC_MOVFW, popGet(AOP(left),0,FALSE,FALSE));

      //emitpcode(POC_MOVWF, popGet(AOP(result),0,FALSE,FALSE));
      emitMOVWF(result,0);
      lit >>= 8;
      while(--size) {
      
	if(lit & 0xff) {
	  emitpcode(POC_MOVLW, popGetLit(lit & 0xff));
	  //emitpcode(POC_MOVWF, popGet(AOP(result),offset,FALSE,FALSE));
	  emitMOVWF(result,offset);
	  emitpcode(POC_MOVFW, popGet(AOP(left),offset,FALSE,FALSE));
	  emitSKPNC;
	  emitpcode(POC_INCFSZW,popGet(AOP(left),offset,FALSE,FALSE));
	  emitpcode(POC_ADDWF,  popGet(AOP(result),offset,FALSE,FALSE));
	} else {
	  emitpcode(POC_CLRF,  popGet(AOP(result),offset,FALSE,FALSE));
	  emitpcode(POC_RLF,   popGet(AOP(result),offset,FALSE,FALSE));
	  emitpcode(POC_MOVFW, popGet(AOP(left),offset,FALSE,FALSE));
	  emitpcode(POC_ADDWF, popGet(AOP(result),offset,FALSE,FALSE));
	}
      offset++;
      }
    }
  }
}

/*-----------------------------------------------------------------*/
/* genPlus - generates code for addition                           */
/*-----------------------------------------------------------------*/
void genPlus (iCode *ic)
{
  int size, offset = 0;

  /* special cases :- */
  DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);

  aopOp (IC_LEFT(ic),ic,FALSE);
  aopOp (IC_RIGHT(ic),ic,FALSE);
  aopOp (IC_RESULT(ic),ic,TRUE);

  /* if literal, literal on the right or
     if left requires ACC or right is already
     in ACC */

  if (AOP_TYPE(IC_LEFT(ic)) == AOP_LIT) {
    operand *t = IC_RIGHT(ic);
    IC_RIGHT(ic) = IC_LEFT(ic);
    IC_LEFT(ic) = t;
  }

  /* if both left & right are in bit space */
  if (AOP_TYPE(IC_LEFT(ic)) == AOP_CRY &&
      AOP_TYPE(IC_RIGHT(ic)) == AOP_CRY) {
    genPlusBits (ic);
    goto release ;
  }

  /* if left in bit space & right literal */
  if (AOP_TYPE(IC_LEFT(ic)) == AOP_CRY &&
      AOP_TYPE(IC_RIGHT(ic)) == AOP_LIT) {
    /* if result in bit space */
    if(AOP_TYPE(IC_RESULT(ic)) == AOP_CRY){
      if((unsigned long)floatFromVal(AOP(IC_RIGHT(ic))->aopu.aop_lit) != 0L) {
	emitpcode(POC_MOVLW, popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	if (!pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic))) )
	  emitpcode(POC_BTFSC, popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	emitpcode(POC_XORWF, popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
      }
    } else {
      size = pic14_getDataSize(IC_RESULT(ic));
      while (size--) {
	MOVA(aopGet(AOP(IC_RIGHT(ic)),offset,FALSE,FALSE));  
	pic14_emitcode("addc","a,#00  ;%d",__LINE__);
	aopPut(AOP(IC_RESULT(ic)),"a",offset++);
      }
    }
    goto release ;
  }

  /* if I can do an increment instead
     of add then GOOD for ME */
  if (genPlusIncr (ic) == TRUE)
    goto release;   

  size = pic14_getDataSize(IC_RESULT(ic));

  if(AOP(IC_RIGHT(ic))->type == AOP_LIT) {
    /* Add a literal to something else */
    //bool know_W=0;
    unsigned lit = (unsigned) floatFromVal(AOP(IC_RIGHT(ic))->aopu.aop_lit);
    //      unsigned l1=0;

    //      offset = 0;
    DEBUGpic14_emitcode(";","adding lit to something. size %d",size);

    genAddLit (ic,  lit);

  } else if(AOP_TYPE(IC_RIGHT(ic)) == AOP_CRY) {

    pic14_emitcode(";bitadd","right is bit: %s",aopGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
    pic14_emitcode(";bitadd","left is bit: %s",aopGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
    pic14_emitcode(";bitadd","result is bit: %s",aopGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

    /* here we are adding a bit to a char or int */
    if(size == 1) {
      if (pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic))) ) {

	emitpcode(POC_BTFSC , popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	emitpcode(POC_INCF ,  popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

	pic14_emitcode("btfsc","(%s >> 3), (%s & 7)",
		       AOP(IC_RIGHT(ic))->aopu.aop_dir,
		       AOP(IC_RIGHT(ic))->aopu.aop_dir);
	pic14_emitcode(" incf","%s,f", aopGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
      } else {

	if(AOP_TYPE(IC_LEFT(ic)) == AOP_ACC) {
	  emitpcode(POC_BTFSC , popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	  emitpcode(POC_XORLW , popGetLit(1));

	  pic14_emitcode("btfsc","(%s >> 3), (%s & 7)",
			 AOP(IC_RIGHT(ic))->aopu.aop_dir,
			 AOP(IC_RIGHT(ic))->aopu.aop_dir);
	  pic14_emitcode(" xorlw","1");
	} else {
	  emitpcode(POC_MOVFW , popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	  emitpcode(POC_BTFSC , popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	  emitpcode(POC_INCFW , popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));

	  pic14_emitcode("movf","%s,w", aopGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	  pic14_emitcode("btfsc","(%s >> 3), (%s & 7)",
			 AOP(IC_RIGHT(ic))->aopu.aop_dir,
			 AOP(IC_RIGHT(ic))->aopu.aop_dir);
	  pic14_emitcode(" incf","%s,w", aopGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	}
	  
	if(AOP_TYPE(IC_RESULT(ic)) != AOP_ACC) {
	    
	  if(AOP_TYPE(IC_RESULT(ic)) == AOP_CRY) {
	    emitpcode(POC_ANDLW , popGetLit(1));
	    emitpcode(POC_BCF ,   popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	    emitSKPZ;
	    emitpcode(POC_BSF ,   popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	  } else {
	    emitpcode(POC_MOVWF ,   popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	    pic14_emitcode("movwf","%s", aopGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	  }
	}
      }

    } else {
      int offset = 1;
      DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);
      if (pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic))) ) {
	emitCLRZ;
	emitpcode(POC_BTFSC, popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	emitpcode(POC_INCF,  popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

	pic14_emitcode("clrz","");

	pic14_emitcode("btfsc","(%s >> 3), (%s & 7)",
		       AOP(IC_RIGHT(ic))->aopu.aop_dir,
		       AOP(IC_RIGHT(ic))->aopu.aop_dir);
	pic14_emitcode(" incf","%s,f", aopGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

      } else {

	emitpcode(POC_MOVFW, popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	emitpcode(POC_BTFSC, popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	emitpcode(POC_INCFW, popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	//emitpcode(POC_MOVWF, popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	emitMOVWF(IC_RIGHT(ic),0);

	pic14_emitcode("movf","%s,w", aopGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	pic14_emitcode("btfsc","(%s >> 3), (%s & 7)",
		       AOP(IC_RIGHT(ic))->aopu.aop_dir,
		       AOP(IC_RIGHT(ic))->aopu.aop_dir);
	pic14_emitcode(" incf","%s,w", aopGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	pic14_emitcode("movwf","%s", aopGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

      }

      while(--size){
	emitSKPZ;
	emitpcode(POC_INCF,  popGet(AOP(IC_RESULT(ic)),offset++,FALSE,FALSE));
	//pic14_emitcode(" incf","%s,f", aopGet(AOP(IC_RIGHT(ic)),offset++,FALSE,FALSE));
      }

    }
      
  } else {
    DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);    
    if(strcmp(aopGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE),"a") == 0 ) {
      emitpcode(POC_ADDFW, popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
      emitpcode(POC_MOVWF,popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
    } else {

      if ( AOP_TYPE(IC_LEFT(ic)) == AOP_ACC) {
	emitpcode(POC_ADDFW, popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	if ( AOP_TYPE(IC_RESULT(ic)) != AOP_ACC)
	  emitpcode(POC_MOVWF,popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
      } else {

	emitpcode(POC_MOVFW,popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));

	if (pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic))) )
	  emitpcode(POC_ADDWF, popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	else {
	  if( (AOP_TYPE(IC_LEFT(ic)) == AOP_IMMD) ||
	      (AOP_TYPE(IC_LEFT(ic)) == AOP_LIT) ) {
	    emitpcode(POC_ADDLW, popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	  } else {
	    emitpcode(POC_ADDFW, popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	    if ( AOP_TYPE(IC_RESULT(ic)) != AOP_ACC)
	      emitpcode(POC_MOVWF,popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	  }
	}
      }
    }

    offset = 1;
    size--;

    while(size--){
      if (!pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic))) ) {
	emitpcode(POC_MOVFW, popGet(AOP(IC_LEFT(ic)),offset,FALSE,FALSE));
	emitpcode(POC_MOVWF, popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));

	pic14_emitcode("movf","%s,w",  aopGet(AOP(IC_LEFT(ic)),offset,FALSE,FALSE));
	pic14_emitcode("movwf","%s",  aopGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));
      }

      emitpcode(POC_MOVFW,   popGet(AOP(IC_RIGHT(ic)),offset,FALSE,FALSE));
      emitSKPNC;
      emitpcode(POC_INCFSZW, popGet(AOP(IC_RIGHT(ic)),offset,FALSE,FALSE));
      emitpcode(POC_ADDWF,   popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));

      /*
	pic14_emitcode("movf","%s,w",  aopGet(AOP(IC_RIGHT(ic)),offset,FALSE,FALSE));
	emitSKPNC;
	pic14_emitcode("incfsz","%s,w",aopGet(AOP(IC_RIGHT(ic)),offset,FALSE,FALSE));
	pic14_emitcode("addwf","%s,f", aopGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));
      */

      offset++;
    }

  }

  //adjustArithmeticResult(ic);

 release:
  freeAsmop(IC_LEFT(ic),NULL,ic,(RESULTONSTACK(ic) ? FALSE : TRUE));
  freeAsmop(IC_RIGHT(ic),NULL,ic,(RESULTONSTACK(ic) ? FALSE : TRUE));
  freeAsmop(IC_RESULT(ic),NULL,ic,TRUE);
}

/*-----------------------------------------------------------------*/
/* genMinusDec :- does subtraction with decrement if possible     */
/*-----------------------------------------------------------------*/
bool genMinusDec (iCode *ic)
{
    unsigned int icount ;
    unsigned int size = pic14_getDataSize(IC_RESULT(ic));

    DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);
    /* will try to generate an increment */
    /* if the right side is not a literal 
    we cannot */
    if ((AOP_TYPE(IC_RIGHT(ic)) != AOP_LIT) || 
	(AOP_TYPE(IC_LEFT(ic)) == AOP_CRY) || 
	(AOP_TYPE(IC_RESULT(ic)) == AOP_CRY) )
        return FALSE ;

    DEBUGpic14_emitcode ("; lit val","%d",(unsigned int) floatFromVal (AOP(IC_RIGHT(ic))->aopu.aop_lit));

    /* if the literal value of the right hand side
    is greater than 4 then it is not worth it */
    if ((icount = (unsigned int) floatFromVal (AOP(IC_RIGHT(ic))->aopu.aop_lit)) > 2)
        return FALSE ;

    /* if decrement 16 bits in register */
    if (pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic))) &&
        (size > 1) &&
        (icount == 1)) {

      if(size == 2) { 
	emitpcode(POC_DECF,    popGet(AOP(IC_RESULT(ic)),LSB,FALSE,FALSE));
	emitpcode(POC_INCFSZW, popGet(AOP(IC_RESULT(ic)),LSB,FALSE,FALSE));
	emitpcode(POC_INCF,    popGet(AOP(IC_RESULT(ic)),MSB16,FALSE,FALSE));
	emitpcode(POC_DECF,    popGet(AOP(IC_RESULT(ic)),MSB16,FALSE,FALSE));

	pic14_emitcode("decf","%s,f",aopGet(AOP(IC_RESULT(ic)),LSB,FALSE,FALSE));
	pic14_emitcode("incfsz","%s,w",aopGet(AOP(IC_RESULT(ic)),LSB,FALSE,FALSE));
	pic14_emitcode(" decf","%s,f",aopGet(AOP(IC_RESULT(ic)),MSB16,FALSE,FALSE));
      } else {
	/* size is 3 or 4 */
	emitpcode(POC_MOVLW,  popGetLit(0xff));
	emitpcode(POC_ADDWF,  popGet(AOP(IC_RESULT(ic)),LSB,FALSE,FALSE));
	emitSKPNC;
	emitpcode(POC_ADDWF,  popGet(AOP(IC_RESULT(ic)),MSB16,FALSE,FALSE));
	emitSKPNC;
	emitpcode(POC_ADDWF,  popGet(AOP(IC_RESULT(ic)),MSB24,FALSE,FALSE));

	pic14_emitcode("movlw","0xff");
	pic14_emitcode("addwf","%s,f",aopGet(AOP(IC_RESULT(ic)),LSB,FALSE,FALSE));

	emitSKPNC;
	pic14_emitcode("addwf","%s,f",aopGet(AOP(IC_RESULT(ic)),MSB16,FALSE,FALSE));
	emitSKPNC;
	pic14_emitcode("addwf","%s,f",aopGet(AOP(IC_RESULT(ic)),MSB24,FALSE,FALSE));

	if(size > 3) {
	  emitSKPNC;
	  emitpcode(POC_ADDWF,  popGet(AOP(IC_RESULT(ic)),MSB32,FALSE,FALSE));

	  pic14_emitcode("skpnc","");
	  emitSKPNC;
	  pic14_emitcode("addwf","%s,f",aopGet(AOP(IC_RESULT(ic)),MSB32,FALSE,FALSE));
	}

      }

      return TRUE;

    }

    /* if the sizes are greater than 1 then we cannot */
    if (AOP_SIZE(IC_RESULT(ic)) > 1 ||
        AOP_SIZE(IC_LEFT(ic)) > 1   )
        return FALSE ;

    /* we can if the aops of the left & result match or
    if they are in registers and the registers are the
    same */
    if (pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic)))) {

      while (icount--) 
	emitpcode(POC_DECF, popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

	//pic14_emitcode ("decf","%s,f",aopGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

        return TRUE ;
    }

    DEBUGpic14_emitcode ("; returning"," result=%s, left=%s",
		   aopGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE),
		   aopGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
    if(size==1) {

      pic14_emitcode("decf","%s,w",aopGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
      pic14_emitcode("movwf","%s",aopGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

      emitpcode(POC_DECFW,  popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
      emitpcode(POC_MOVWF,  popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

      return TRUE;
    }

    return FALSE ;
}

/*-----------------------------------------------------------------*/
/* addSign - complete with sign                                    */
/*-----------------------------------------------------------------*/
void addSign(operand *result, int offset, int sign)
{
    int size = (pic14_getDataSize(result) - offset);
    DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);
    if(size > 0){
        if(sign){
            pic14_emitcode("rlc","a");
            pic14_emitcode("subb","a,acc");
            while(size--)
                aopPut(AOP(result),"a",offset++); 
        } else
            while(size--)
                aopPut(AOP(result),"#0",offset++);
    }
}

/*-----------------------------------------------------------------*/
/* genMinusBits - generates code for subtraction  of two bits      */
/*-----------------------------------------------------------------*/
void genMinusBits (iCode *ic)
{
    symbol *lbl = newiTempLabel(NULL);
    DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);
    if (AOP_TYPE(IC_RESULT(ic)) == AOP_CRY){
        pic14_emitcode("mov","c,%s",AOP(IC_LEFT(ic))->aopu.aop_dir);
        pic14_emitcode("jnb","%s,%05d_DS_",AOP(IC_RIGHT(ic))->aopu.aop_dir,(lbl->key+100));
        pic14_emitcode("cpl","c");
        pic14_emitcode("","%05d_DS_:",(lbl->key+100));
        pic14_outBitC(IC_RESULT(ic));
    }
    else{
        pic14_emitcode("mov","c,%s",AOP(IC_RIGHT(ic))->aopu.aop_dir);
        pic14_emitcode("subb","a,acc");
        pic14_emitcode("jnb","%s,%05d_DS_",AOP(IC_LEFT(ic))->aopu.aop_dir,(lbl->key+100));
        pic14_emitcode("inc","a");
        pic14_emitcode("","%05d_DS_:",(lbl->key+100));
        aopPut(AOP(IC_RESULT(ic)),"a",0);
        addSign(IC_RESULT(ic), MSB16, SPEC_USIGN(getSpec(operandType(IC_RESULT(ic)))));
    }
}

/*-----------------------------------------------------------------*/
/* genMinus - generates code for subtraction                       */
/*-----------------------------------------------------------------*/
void genMinus (iCode *ic)
{
  int size, offset = 0, same=0;
  unsigned long lit = 0L;

  DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);
  aopOp (IC_LEFT(ic),ic,FALSE);
  aopOp (IC_RIGHT(ic),ic,FALSE);
  aopOp (IC_RESULT(ic),ic,TRUE);

  if (AOP_TYPE(IC_RESULT(ic)) == AOP_CRY  &&
      AOP_TYPE(IC_RIGHT(ic)) == AOP_LIT) {
    operand *t = IC_RIGHT(ic);
    IC_RIGHT(ic) = IC_LEFT(ic);
    IC_LEFT(ic) = t;
  }

  DEBUGpic14_emitcode ("; ","result %s, left %s, right %s",
		   AopType(AOP_TYPE(IC_RESULT(ic))),
		   AopType(AOP_TYPE(IC_LEFT(ic))),
		   AopType(AOP_TYPE(IC_RIGHT(ic))));

  /* special cases :- */
  /* if both left & right are in bit space */
  if (AOP_TYPE(IC_LEFT(ic)) == AOP_CRY &&
      AOP_TYPE(IC_RIGHT(ic)) == AOP_CRY) {
    genPlusBits (ic);
    goto release ;
  }

  /* if I can do an decrement instead
     of subtract then GOOD for ME */
  //  if (genMinusDec (ic) == TRUE)
  //    goto release;   

  size = pic14_getDataSize(IC_RESULT(ic));   
  same = pic14_sameRegs(AOP(IC_RIGHT(ic)), AOP(IC_RESULT(ic)));

  if(AOP(IC_RIGHT(ic))->type == AOP_LIT) {
    /* Add a literal to something else */

    lit = (unsigned long)floatFromVal(AOP(IC_RIGHT(ic))->aopu.aop_lit);
    lit = - (long)lit;

    genAddLit ( ic,  lit);
    
#if 0
    /* add the first byte: */
    pic14_emitcode("movlw","0x%x", lit & 0xff);
    pic14_emitcode("addwf","%s,f", aopGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
    emitpcode(POC_MOVLW,  popGetLit(lit & 0xff));
    emitpcode(POC_ADDWF,  popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));


    offset = 1;
    size--;

    while(size-- > 0) {

      lit >>= 8;

      if(lit & 0xff) {

	if((lit & 0xff) == 0xff) {
	  emitpcode(POC_MOVLW,  popGetLit(0xff));
	  emitSKPC;
	  emitpcode(POC_ADDWF,  popGet(AOP(IC_LEFT(ic)),offset,FALSE,FALSE));
	} else {
	  emitpcode(POC_MOVLW,  popGetLit(lit & 0xff));
	  emitSKPNC;
	  emitpcode(POC_MOVLW,  popGetLit((lit+1) & 0xff));
	  emitpcode(POC_ADDWF,  popGet(AOP(IC_LEFT(ic)),offset,FALSE,FALSE));
	}

      } else {
	/* do the rlf known zero trick here */
	emitpcode(POC_MOVLW,  popGetLit(1));
	emitSKPNC;
	emitpcode(POC_ADDWF,  popGet(AOP(IC_LEFT(ic)),offset,FALSE,FALSE));
      }
      offset++;
    }
#endif
  } else if(AOP_TYPE(IC_RIGHT(ic)) == AOP_CRY) {
    // bit subtraction

    pic14_emitcode(";bitsub","right is bit: %s",aopGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
    pic14_emitcode(";bitsub","left is bit: %s",aopGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
    pic14_emitcode(";bitsub","result is bit: %s",aopGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

    /* here we are subtracting a bit from a char or int */
    if(size == 1) {
      if (pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic))) ) {

	emitpcode(POC_BTFSC , popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	emitpcode(POC_DECF ,  popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

	pic14_emitcode("btfsc","(%s >> 3), (%s & 7)",
		 AOP(IC_RIGHT(ic))->aopu.aop_dir,
		 AOP(IC_RIGHT(ic))->aopu.aop_dir);
	pic14_emitcode(" incf","%s,f", aopGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
      } else {

	if(AOP_TYPE(IC_LEFT(ic)) == AOP_ACC) {
	  emitpcode(POC_BTFSC , popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	  emitpcode(POC_XORLW , popGetLit(1));
	}else  if( (AOP_TYPE(IC_LEFT(ic)) == AOP_IMMD) ||
	      (AOP_TYPE(IC_LEFT(ic)) == AOP_LIT) ) {

	  lit = (unsigned long)floatFromVal(AOP(IC_LEFT(ic))->aopu.aop_lit);

	  if(AOP_TYPE(IC_RESULT(ic)) == AOP_CRY) {
	    if (pic14_sameRegs(AOP(IC_RIGHT(ic)), AOP(IC_RESULT(ic))) ) {
	      if(lit & 1) {
		emitpcode(POC_MOVLW , popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
		emitpcode(POC_XORWF , popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	      }
	    }else{
	      emitpcode(POC_BCF ,     popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	      if(lit & 1) 
		emitpcode(POC_BTFSS , popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	      else
		emitpcode(POC_BTFSC , popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	      emitpcode(POC_BSF ,     popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	    }
	    goto release;
	  } else {
	    emitpcode(POC_MOVLW , popGetLit(lit & 0xff));
	    emitpcode(POC_BTFSC , popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	    emitpcode(POC_MOVLW , popGetLit((lit-1) & 0xff));
	    emitpcode(POC_MOVWF , popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

	  }

	} else {
	  emitpcode(POC_MOVFW , popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	  emitpcode(POC_BTFSC , popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	  emitpcode(POC_DECFW , popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	}
	  
	if(AOP_TYPE(IC_RESULT(ic)) != AOP_ACC) {
	    
	  emitpcode(POC_MOVWF ,   popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));

	} else  {
	  emitpcode(POC_ANDLW , popGetLit(1));
/*
	  emitpcode(POC_BCF ,   popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	  emitSKPZ;
	  emitpcode(POC_BSF ,   popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
*/
	}

      }

    }
  } else   if(// (AOP_TYPE(IC_LEFT(ic)) == AOP_IMMD) || 
	      (AOP(IC_LEFT(ic))->type == AOP_LIT) &&
	      (AOP_TYPE(IC_RIGHT(ic)) != AOP_ACC)) {

    lit = (unsigned long)floatFromVal(AOP(IC_LEFT(ic))->aopu.aop_lit);
    DEBUGpic14_emitcode ("; left is lit","line %d result %s, left %s, right %s",__LINE__,
		   AopType(AOP_TYPE(IC_RESULT(ic))),
		   AopType(AOP_TYPE(IC_LEFT(ic))),
		   AopType(AOP_TYPE(IC_RIGHT(ic))));


    if( (size == 1) && ((lit & 0xff) == 0) ) {
      /* res = 0 - right */
      if (pic14_sameRegs(AOP(IC_RIGHT(ic)), AOP(IC_RESULT(ic))) ) {
	emitpcode(POC_COMF,  popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
      } else { 
	emitpcode(POC_MOVFW,  popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	emitpcode(POC_MOVWF,  popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
      }
      goto release;
    }

    emitpcode(POC_MOVFW,  popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
    emitpcode(POC_SUBLW, popGetLit(lit & 0xff));    
    emitpcode(POC_MOVWF,popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));


    offset = 1;
    while(--size) {
      lit >>= 8;

      if(size == 1) {
	/* This is the last byte in a multibyte subtraction 
	 * There are a couple of tricks we can do by not worrying about 
	 * propogating the carry */
	if(lit == 0xff) {
	  /* 0xff - x == ~x */
	  if(same) {
	    emitpcode(POC_COMF,  popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));
	    emitSKPC;
	    emitpcode(POC_DECF,  popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));
	  } else {
	    emitpcode(POC_COMFW, popGet(AOP(IC_RIGHT(ic)),offset,FALSE,FALSE));
	    emitpcode(POC_MOVWF, popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));
	    emitSKPC;
	    emitpcode(POC_DECF,  popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));
	  }
	} else {
	    emitpcode(POC_MOVFW, popGet(AOP(IC_RIGHT(ic)),offset,FALSE,FALSE));
	    emitSKPC;
	    emitpcode(POC_INCFW, popGet(AOP(IC_RIGHT(ic)),offset,FALSE,FALSE));
	    emitpcode(POC_SUBLW, popGetLit(lit & 0xff));
	    emitpcode(POC_MOVWF, popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));
	}

	goto release;
      }

      if(same) {

	if(lit & 0xff) {
	  emitpcode(POC_MOVLW, popGetLit(lit & 0xff));
	  emitSKPC;
	  emitpcode(POC_MOVLW, popGetLit((lit & 0xff)-1));
	  emitpcode(POC_SUBWF,  popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));
	} else {
	  emitSKPNC;
	  emitpcode(POC_SUBWF,  popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));

	}
      } else {

	if(lit & 0xff) {
	  emitpcode(POC_MOVLW, popGetLit(lit & 0xff));
	  emitpcode(POC_MOVWF, popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));
	} else
	  emitpcode(POC_CLRF, popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));

	emitpcode(POC_MOVFW,  popGet(AOP(IC_RIGHT(ic)),offset,FALSE,FALSE));
	emitSKPC;
	emitpcode(POC_INCFSZW,popGet(AOP(IC_RIGHT(ic)),offset,FALSE,FALSE));
	emitpcode(POC_SUBWF,  popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));
      }
    }
  

  } else {

    DEBUGpic14_emitcode ("; ","line %d result %s, left %s, right %s",__LINE__,
		   AopType(AOP_TYPE(IC_RESULT(ic))),
		   AopType(AOP_TYPE(IC_LEFT(ic))),
		   AopType(AOP_TYPE(IC_RIGHT(ic))));

    if(strcmp(aopGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE),"a") == 0 ) {
      DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);
      emitpcode(POC_SUBFW, popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
      emitpcode(POC_SUBLW, popGetLit(0));
      emitpcode(POC_MOVWF,popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
    } else {

      if ( AOP_TYPE(IC_LEFT(ic)) == AOP_ACC) {
	emitpcode(POC_SUBFW, popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));
	emitpcode(POC_SUBLW, popGetLit(0));
	if ( AOP_TYPE(IC_RESULT(ic)) != AOP_ACC)
	  emitpcode(POC_MOVWF,popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
      } else {

	DEBUGpic14_emitcode ("; ***","%s  %d",__FUNCTION__,__LINE__);
	if(AOP_TYPE(IC_RIGHT(ic)) != AOP_ACC) 
	  emitpcode(POC_MOVFW,popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));

	if (pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic))) )
	  emitpcode(POC_SUBWF, popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	else {
	  if( (AOP_TYPE(IC_LEFT(ic)) == AOP_IMMD) ||
	      (AOP_TYPE(IC_LEFT(ic)) == AOP_LIT) ) {
	    emitpcode(POC_SUBLW, popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	  } else {
	    emitpcode(POC_SUBFW, popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
	  }
	  if ( AOP_TYPE(IC_RESULT(ic)) != AOP_ACC) {
	    if ( AOP_TYPE(IC_RESULT(ic)) == AOP_CRY) {
	      emitpcode(POC_BCF ,   popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	      emitSKPZ;
	      emitpcode(POC_BSF ,   popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	    }else
	      emitpcode(POC_MOVWF,popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
	  }
	}
      }
    }

    /*
      emitpcode(POC_MOVFW,  popGet(AOP(IC_RIGHT(ic)),0,FALSE,FALSE));

      if (pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic))) ) {
      emitpcode(POC_SUBFW,  popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
      } else {
      emitpcode(POC_SUBFW,  popGet(AOP(IC_LEFT(ic)),0,FALSE,FALSE));
      emitpcode(POC_MOVWF,  popGet(AOP(IC_RESULT(ic)),0,FALSE,FALSE));
      }
    */
    offset = 1;
    size--;

    while(size--){
      if (!pic14_sameRegs(AOP(IC_LEFT(ic)), AOP(IC_RESULT(ic))) ) {
	emitpcode(POC_MOVFW,  popGet(AOP(IC_LEFT(ic)),offset,FALSE,FALSE));
	emitpcode(POC_MOVWF,  popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));
      }
      emitpcode(POC_MOVFW,  popGet(AOP(IC_RIGHT(ic)),offset,FALSE,FALSE));
      emitSKPC;
      emitpcode(POC_INCFSZW,popGet(AOP(IC_RIGHT(ic)),offset,FALSE,FALSE));
      emitpcode(POC_SUBWF,  popGet(AOP(IC_RESULT(ic)),offset,FALSE,FALSE));

      offset++;
    }

  }


  //    adjustArithmeticResult(ic);
        
 release:
  freeAsmop(IC_LEFT(ic),NULL,ic,(RESULTONSTACK(ic) ? FALSE : TRUE));
  freeAsmop(IC_RIGHT(ic),NULL,ic,(RESULTONSTACK(ic) ? FALSE : TRUE));
  freeAsmop(IC_RESULT(ic),NULL,ic,TRUE);
}



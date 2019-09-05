/*-------------------------------------------------------------------------
  break.c - Source file for break point management
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

#include "sdcdb.h"
#include "symtab.h"
#include "break.h"
#include "newalloc.h"

static hTab *bptable = NULL;
char userBpPresent = 0;
/* call stack can be 1024 deep */
STACK_DCL(callStack,function *,1024);

#ifdef SDCDB_DEBUG
char *debug_bp_type_strings[] =
    {"ERR-0",
     "DATA",
    "CODE"    ,
    "A_CODE"  ,
    "USER"    ,
    "STEP"    ,
    "NEXT"    ,
    "FENTRY"  ,
    "FEXIT", "", ""};
#endif

/*-----------------------------------------------------------------*/
/* setBreakPoint - creates an entry in the break point table       */
/*-----------------------------------------------------------------*/
int setBreakPoint (unsigned addr, char addrType, char bpType,
        int (*callBack)(unsigned,char,char,int,context *) ,
        char *fileName, int lineno)
{
    breakp *bp, *bpl;
    static long bpnum = 0;
    char simbuf[50];

    Dprintf(D_break, ("setBreakPoint: addr:%x atype:%s bpType:%s [%s:%d]\n",
        addr,
        debug_bp_type_strings[addrType],
        debug_bp_type_strings[bpType],
        fileName, lineno));

    /* allocate & init a new bp */
    bp = Safe_calloc(1,sizeof(breakp));
    bp->addr = addr;
    bp->addrType = addrType;
    bp->bpType = bpType;
    bp->callBack = callBack;
    bp->bpnum = (bpType == USER ? ++bpnum : 0);
    bp->filename = fileName;
    bp->lineno = lineno;

    /* if this is an user break point then
       check if there already exists one for this address */
    if (bpType == USER) {
  for ( bpl = hTabFirstItemWK(bptable,addr) ; bpl;
        bpl = hTabNextItemWK(bptable)) {

      /* if also a user break point then issue Note : */
      if (bpl->bpType == USER)
    fprintf(stderr,"Note: breakpoint %d also set at pc 0x%x\n",
      bpl->bpnum,bpl->addr);
  }

  fprintf(stderr,"Breakpoint %d at 0x%x: file %s, line %d.\n",
    bp->bpnum, addr, fileName, lineno);

  userBpPresent++;
    }

    /* if a break point does not already exist then
       send command to simulator to add one */
    if (!hTabSearch(bptable,addr))
  /* send the break command to the simulator */
  simSetBP (addr);


    /* now add the break point to list */
    hTabAddItem(&bptable,addr,bp);

    return bp->bpnum ;
}

/*-----------------------------------------------------------------*/
/* deleteSTEPbp - deletes all step break points                    */
/*-----------------------------------------------------------------*/
void deleteSTEPbp ()
{
    breakp *bp;
    int k;

    Dprintf(D_break, ("Deleting all STEP BPs\n"));
    /* for break points delete if they are STEP */
    for ( bp = hTabFirstItem(bptable,&k); bp ;
    bp = hTabNextItem(bptable,&k)) {

  /* if this is a step then delete */
  if (bp->bpType == STEP) {
      hTabDeleteItem(&bptable,bp->addr,bp,DELETE_ITEM,NULL);

      /* if this leaves no other break points then
         send command to simulator to delete bp from this addr */
      if (hTabSearch(bptable,bp->addr) == NULL)
    simClearBP (bp->addr);

      free(bp);
  }
    }

}

/*-----------------------------------------------------------------*/
/* deleteNEXTbp - deletes all step break points                    */
/*-----------------------------------------------------------------*/
void deleteNEXTbp ()
{
    breakp *bp;
    int k;
    char simcmd[50];

    Dprintf(D_break, ("Deleting all NEXT BPs\n"));

    /* for break points delete if they are NEXT */
    for ( bp = hTabFirstItem(bptable,&k); bp ;
    bp = hTabNextItem(bptable,&k)) {

  /* if this is a step then delete */
  if (bp->bpType == NEXT) {
      hTabDeleteItem(&bptable,bp->addr,bp,DELETE_ITEM,NULL);

      /* if this leaves no other break points then
         send command to simulator to delete bp from this addr */
      if (hTabSearch(bptable,bp->addr) == NULL) {
    simClearBP(bp->addr);

      }

      free(bp);
  }
    }

}

/*-----------------------------------------------------------------*/
/* deleteUSERbp - deletes USER break point with number             */
/*-----------------------------------------------------------------*/
void deleteUSERbp (int bpnum)
{
    breakp *bp;
    int k;
    char simcmd[50];

    Dprintf(D_break, ("deleteUSERbp %d\n", bpnum));

    /* for break points delete if they are STEP */
    for ( bp = hTabFirstItem(bptable,&k); bp ;
    bp = hTabNextItem(bptable,&k)) {

  /* if this is a user then delete if break
     point matches or bpnumber == -1 (meaning delete
     all user break points */
  if (bp->bpType == USER && ( bp->bpnum == bpnum || bpnum == -1)) {
      hTabDeleteItem(&bptable,bp->addr,bp,DELETE_ITEM,NULL);

      /* if this leaves no other break points then
         send command to simulator to delete bp from this addr */
      if (hTabSearch(bptable,bp->addr) == NULL) {
    simClearBP (bp->addr);
    Dprintf(D_break, ("deleteUSERbp:simClearBP 0x%x\n", bp->addr));

      }
      fprintf(stdout,"Deleted breakpoint %d\n",
        bp->bpnum);
      userBpPresent --;
      if (bpnum == -1)
    continue ;
      else
    break;
  }
    }

    if (!bp && bpnum != -1)
  fprintf(stderr,"No breakpoint number %d.\n",bpnum);
}

/*-----------------------------------------------------------------*/
/* listUSERbp - list all user break points                         */
/*-----------------------------------------------------------------*/
void listUSERbp ()
{
    breakp *bp;
    int k;

    /* if there are none then say so & return */
    if (!userBpPresent) {
  fprintf(stdout,"No breakpoints.\n");
  return ;
    }
    fprintf(stdout,"Num Address What\n");
    for ( bp = hTabFirstItem(bptable,&k) ; bp ;
    bp = hTabNextItem(bptable,&k)) {

  if (bp->bpType == USER ) {
      fprintf(stdout,"%-3d 0x%04x  at %s:%d\n",
        bp->bpnum,bp->addr,
        bp->filename,bp->lineno);

  }
    }
}

/*-----------------------------------------------------------------*/
/* simStopBPCB - simulator stopped break point                     */
/*-----------------------------------------------------------------*/
static int simStopBPCB( unsigned int addr)
{
  fprintf(stdout,"Simulator stopped at Address 0x%04x\n",addr);
  fprintf(stdout,"%s",simResponse());
  return 1;
}

/*-----------------------------------------------------------------*/
/* clearUSERbp - deletes USER break point at address               */
/*-----------------------------------------------------------------*/
void clearUSERbp ( unsigned int addr )
{
    breakp *bp;
    char simcmd[50];

    /* for break points delete if they are STEP */
    for ( bp = hTabFirstItemWK(bptable,addr); bp ;
    bp = hTabNextItemWK(bptable)) {

  /* if this is a step then delete */
  if (bp->bpType == USER) {
      hTabDeleteItem(&bptable,bp->addr,bp,DELETE_ITEM,NULL);

      /* if this leaves no other break points then
         send command to simulator to delete bp from this addr */
      if (hTabSearch(bptable,bp->addr) == NULL) {
    simClearBP(bp->addr);

      }
      fprintf(stdout,"Deleted breakpoint %d\n",
        bp->bpnum);
      userBpPresent-- ;
      break;
  }
    }

    if (!bp)
  fprintf(stderr,"No breakpoint at address 0x%x.\n",addr);
}

/*-----------------------------------------------------------------*/
/* dispatchCB - will lookup the bp table and dispatch the cb funcs */
/*-----------------------------------------------------------------*/
int dispatchCB (unsigned addr, context *ctxt)
{
    breakp *bp;
    int rv =0;

    Dprintf(D_break, ("dispatchCB: addr:0x%x \n", addr));

    /* if no break points set for this address
       then use a simulator stop break point */
    if ((bp = hTabFirstItemWK(bptable,addr)) == NULL) {
      return simStopBPCB(addr);
    }

    /* dispatch the call back functions */
    for (; bp; bp = hTabNextItemWK(bptable)) {

      rv += (*bp->callBack)(addr,bp->addrType,
          bp->bpType,bp->bpnum,ctxt);

    }

    if (rv == 0) {
      Dprintf(D_break, ("dispatchCB: WARNING rv==0\n", rv));
    }

    return rv;
}

/*-----------------------------------------------------------------*/
/* fentryCB - callback function for function entry                 */
/*-----------------------------------------------------------------*/
BP_CALLBACK(fentryCB)
{
    Dprintf(D_break, ("fentryCB: BP_CALLBACK entry\n"));

    /* add the current function into the call stack */
    STACK_PUSH(callStack,ctxt->func);

    /* will have to add code here to get the value of SP
       which will be used to display the value of local variables
       and parameters on the stack */

    return 0;
}

/*-----------------------------------------------------------------*/
/* fexitCB - call back for function exit                           */
/*-----------------------------------------------------------------*/
BP_CALLBACK(fexitCB)
{
    Dprintf(D_break, ("fexitCB: BP_CALLBACK entry\n"));

    /* pop the top most from the call stack */
    STACK_POP(callStack);
    return 0;
}
/*-----------------------------------------------------------------*/
/* userBpCB - call back function for user break points             */
/*-----------------------------------------------------------------*/
BP_CALLBACK(userBpCB)
{
    Dprintf(D_break, ("userBpCB: BP_CALLBACK entry\n"));

    if (srcMode == SRC_CMODE) {
  fprintf(stdout,"Breakpoint %d, %s() at %s:%d\n",
    bpnum,
    ctxt->func->sym->name,
    ctxt->func->mod->c_name,
    ctxt->cline);
  if (ctxt->func->mod && ctxt->cline > 0)
      fprintf(stdout,"%d\t%s",ctxt->cline,
        ctxt->func->mod->cLines[ctxt->cline]->src);
    } else {
  fprintf(stdout,"Breakpoint %d, %s() at %s:%d\n",
    bpnum,
    ctxt->func->sym->name,
    ctxt->func->mod->asm_name,
    ctxt->asmline);
  if (ctxt->func->mod && ctxt->asmline > 0)
      fprintf(stdout,"%d\t%s",ctxt->asmline,
        ctxt->func->mod->asmLines[ctxt->asmline]->src);
    }

    return 1;
}

/*-----------------------------------------------------------------*/
/* stepBpCB - call back function for step break points             */
/*-----------------------------------------------------------------*/
BP_CALLBACK(stepBpCB)
{
    static function *lfunc = NULL;

    Dprintf(D_break, ("stepBpCB: BP_CALLBACK entry\n"));

    if (srcMode == SRC_CMODE) {
  if ((lfunc && lfunc != ctxt->func) || !lfunc)
      fprintf(stdout,"%s () at %s:%d\n",
        ctxt->func->sym->name,
        ctxt->func->mod->c_name,
        ctxt->cline);

  if (ctxt->func->mod && ctxt->cline > 0) {
      fprintf(stdout,"%d\t%s",ctxt->cline ,
        ctxt->func->mod->cLines[ctxt->cline]->src);
  }
    } else {
  if ((lfunc && lfunc != ctxt->func) || !lfunc)
      fprintf(stdout,"%s () at %s:%d\n",
        ctxt->func->sym->name,
        ctxt->func->mod->asm_name,
        ctxt->asmline);

  if (ctxt->func->mod && ctxt->cline > 0) {
      fprintf(stdout,"%d\t%s",ctxt->asmline ,
        ctxt->func->mod->asmLines[ctxt->asmline]->src);
  }
    }
    lfunc = ctxt->func;

    deleteSTEPbp();
    return 1;
}

/*-----------------------------------------------------------------*/
/* nextBpCB - call back function for next break points             */
/*-----------------------------------------------------------------*/
BP_CALLBACK(nextBpCB)
{
    static function *lfunc = NULL;

    Dprintf(D_break, ("nextBpCB: BP_CALLBACK entry\n"));

    if (srcMode == SRC_CMODE) {
  if ((lfunc && lfunc != ctxt->func) || !lfunc)
      fprintf(stdout,"%s () at %s:%d\n",
        ctxt->func->sym->name,
        ctxt->func->mod->c_name,
        ctxt->cline);

  if (ctxt->func->mod && ctxt->cline > 0)
      fprintf(stdout,"%d\t%s",ctxt->cline,
        ctxt->func->mod->cLines[ctxt->cline]->src);
    } else {
  if ((lfunc && lfunc != ctxt->func) || !lfunc)
      fprintf(stdout,"%s () at %s:%d\n",
        ctxt->func->sym->name,
        ctxt->func->mod->asm_name,
        ctxt->asmline);

  if (ctxt->func->mod && ctxt->asmline > 0)
      fprintf(stdout,"%d\t%s",ctxt->asmline,
        ctxt->func->mod->asmLines[ctxt->asmline]->src);

    }
    lfunc = ctxt->func;

    deleteNEXTbp();
    return 1;
}

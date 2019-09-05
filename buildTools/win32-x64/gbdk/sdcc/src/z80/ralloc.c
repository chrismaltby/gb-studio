/** @name Z80 Register allocation functions.
    @author Michael Hope

    Note: much of this is ripped straight from Sandeep's mcs51 code.

    This code maps the virtual symbols and code onto the real
    hardware.  It allocates based on usage and how long the varible
    lives into registers or temporary memory on the stack.

    On the Z80 hl and ix and a are reserved for the code generator,
    leaving bc and de for allocation.  iy is unusable due to currently
    as it's only adressable as a pair.  The extra register pressure
    from reserving hl is made up for by how much easier the sub
    operations become.  You could swap hl for iy if the undocumented
    iyl/iyh instructions are available.

    The stack frame is the common ix-bp style.  Basically:

    ix+4+n: 	param 1 
    ix+4: 	param 0 
    ix+2: 	return address 
    ix+0: 	calling functions ix 
    ix-n: 	local varibles 
    ...  
    sp: 	end of local varibles

    There is currently no support for bit spaces or banked functions.
    
    This program is free software; you can redistribute it and/or
    modify it under the terms of the GNU General Public License as
    published by the Free Software Foundation; either version 2, or (at
    your option) any later version.  This program is distributed in the
    hope that it will be useful, but WITHOUT ANY WARRANTY; without even
    the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
    PURPOSE.  See the GNU General Public License for more details.
    
    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307,
    USA.  In other words, you are welcome to use, share and improve
    this program.  You are forbidden to forbid anyone else to use,
    share and improve what you give them.  Help stamp out
    software-hoarding!  
*/

#include "z80.h"

/* Flags to turn off optimisations.
 */
enum
  {
    DISABLE_PACK_ACC = 0,
    DISABLE_PACK_ASSIGN = 0,
    /* Pack for one use is quite broken. */
    DISABLE_PACK_ONE_USE = 1,
    DISABLE_PACK_HL = 0,
  };

/* Flags to turn on debugging code.
 */
enum
  {
    D_ALLOC = 0,
    D_ALLOC2 = 0,
    D_ACCUSE2 = 0,
    D_ACCUSE2_VERBOSE = 0,
    D_HLUSE = 0
  };

#if 1
#define D(_a, _s)	if (_a)  { printf _s; fflush(stdout); }
#else
#define D(_a, _s)
#endif

#define DISABLE_PACKREGSFORSUPPORT	1
#define DISABLE_PACKREGSFORACCUSE	1

extern void genZ80Code (iCode *);

/** Local static variables */
static struct
{
  bitVect *spiltSet;
  set *stackSpil;
  bitVect *regAssigned;
  short blockSpil;
  int slocNum;
  /* registers used in a function */
  bitVect *funcrUsed;
  int stackExtend;
  int dataExtend;
  int nRegs;
} _G;

static regs _gbz80_regs[] =
{
  {REG_GPR, C_IDX, "c", 1},
  {REG_GPR, B_IDX, "b", 1},
  {REG_CND, CND_IDX, "c", 1}
};

static regs _z80_regs[] =
{
  {REG_GPR, C_IDX, "c", 1},
  {REG_GPR, B_IDX, "b", 1},
  {REG_GPR, E_IDX, "e", 1},
  {REG_GPR, D_IDX, "d", 1},
  {REG_CND, CND_IDX, "c", 1}
};

regs *regsZ80;

/** Number of usable registers (all but C) */
#define Z80_MAX_REGS ((sizeof(_z80_regs)/sizeof(_z80_regs[0]))-1)
#define GBZ80_MAX_REGS ((sizeof(_gbz80_regs)/sizeof(_gbz80_regs[0]))-1)

static void spillThis (symbol *);

/** Allocates register of given type.
    'type' is not used on the z80 version.  It was used to select
    between pointer and general purpose registers on the mcs51 version.

    @return 		Pointer to the newly allocated register.
 */
static regs *
allocReg (short type)
{
  int i;

  for (i = 0; i < _G.nRegs; i++)
    {
      /* For now we allocate from any free */
      if (regsZ80[i].isFree)
	{
	  regsZ80[i].isFree = 0;
	  if (currFunc)
            {
              currFunc->regsUsed = bitVectSetBit (currFunc->regsUsed, i);
            }
	  D (D_ALLOC, ("allocReg: alloced %p\n", &regsZ80[i]));
	  return &regsZ80[i];
	}
    }
  D (D_ALLOC, ("allocReg: No free.\n"));
  return NULL;
}

/** Returns pointer to register wit index number
 */
regs *
regWithIdx (int idx)
{
  int i;

  for (i = 0; i < _G.nRegs; i++)
    {
      if (regsZ80[i].rIdx == idx)
        {
          return &regsZ80[i];
        }
    }

  wassertl (0, "regWithIdx not found");
  exit (1);
}

/** Frees a register.
 */
static void 
freeReg (regs * reg)
{
  wassert (!reg->isFree);
  reg->isFree = 1;
  D (D_ALLOC, ("freeReg: freed %p\n", reg));
}


/** Returns number of free registers.
 */
static int 
nFreeRegs (int type)
{
  int i;
  int nfr = 0;

  for (i = 0; i < _G.nRegs; i++)
    {
      /* For now only one reg type */
      if (regsZ80[i].isFree)
        {
          nfr++;
        }
    }
  return nfr;
}

/** Free registers with type.
 */
static int 
nfreeRegsType (int type)
{
  int nfr;
  if (type == REG_PTR)
    {
      if ((nfr = nFreeRegs (type)) == 0)
        {
          return nFreeRegs (REG_GPR);
        }
    }

  return nFreeRegs (type);
}


#if 0
/*-----------------------------------------------------------------*/
/* allDefsOutOfRange - all definitions are out of a range          */
/*-----------------------------------------------------------------*/
static bool 
allDefsOutOfRange (bitVect * defs, int fseq, int toseq)
{
  int i;

  if (!defs)
    return TRUE;

  for (i = 0; i < defs->size; i++)
    {
      iCode *ic;

      if (bitVectBitValue (defs, i) &&
	  (ic = hTabItemWithKey (iCodehTab, i)) &&
	  (ic->seq >= fseq && ic->seq <= toseq))

	return FALSE;

    }

  return TRUE;
}
#endif

/*-----------------------------------------------------------------*/
/* computeSpillable - given a point find the spillable live ranges */
/*-----------------------------------------------------------------*/
static bitVect *
computeSpillable (iCode * ic)
{
  bitVect *spillable;

  /* spillable live ranges are those that are live at this 
     point . the following categories need to be subtracted
     from this set. 
     a) - those that are already spilt
     b) - if being used by this one
     c) - defined by this one */

  spillable = bitVectCopy (ic->rlive);
  spillable =
    bitVectCplAnd (spillable, _G.spiltSet);	/* those already spilt */
  spillable =
    bitVectCplAnd (spillable, ic->uses);	/* used in this one */
  bitVectUnSetBit (spillable, ic->defKey);
  spillable = bitVectIntersect (spillable, _G.regAssigned);

  return spillable;
}

/*-----------------------------------------------------------------*/
/* noSpilLoc - return true if a variable has no spil location      */
/*-----------------------------------------------------------------*/
static int 
noSpilLoc (symbol * sym, eBBlock * ebp, iCode * ic)
{
  return (sym->usl.spillLoc ? 0 : 1);
}

/*-----------------------------------------------------------------*/
/* hasSpilLoc - will return 1 if the symbol has spil location      */
/*-----------------------------------------------------------------*/
static int 
hasSpilLoc (symbol * sym, eBBlock * ebp, iCode * ic)
{
  return (sym->usl.spillLoc ? 1 : 0);
}

/** Will return 1 if the remat flag is set.
    A symbol is rematerialisable if it doesnt need to be allocated
    into registers at creation as it can be re-created at any time -
    i.e. it's constant in some way.
*/
static int 
rematable (symbol * sym, eBBlock * ebp, iCode * ic)
{
  return sym->remat;
}

/*-----------------------------------------------------------------*/
/* allLRs - return true for all                                    */
/*-----------------------------------------------------------------*/
static int 
allLRs (symbol * sym, eBBlock * ebp, iCode * ic)
{
  return 1;
}

/** liveRangesWith - applies function to a given set of live range 
 */
static set *
liveRangesWith (bitVect * lrs, int (func) (symbol *, eBBlock *, iCode *),
		eBBlock * ebp, iCode * ic)
{
  set *rset = NULL;
  int i;

  if (!lrs || !lrs->size)
    return NULL;

  for (i = 1; i < lrs->size; i++)
    {
      symbol *sym;
      if (!bitVectBitValue (lrs, i))
	continue;

      /* if we don't find it in the live range 
         hash table we are in serious trouble */
      if (!(sym = hTabItemWithKey (liveRanges, i)))
	{
          wassertl (0, "liveRangesWith could not find liveRange");
	  exit (1);
	}

      if (func (sym, ebp, ic) && bitVectBitValue (_G.regAssigned, sym->key))
        {
          addSetHead (&rset, sym);
        }
    }

  return rset;
}


/** leastUsedLR - given a set determines which is the least used 
 */
static symbol *
leastUsedLR (set * sset)
{
  symbol *sym = NULL, *lsym = NULL;

  sym = lsym = setFirstItem (sset);

  if (!lsym)
    return NULL;

  for (; lsym; lsym = setNextItem (sset))
    {

      /* if usage is the same then prefer
         the spill the smaller of the two */
      if (lsym->used == sym->used)
	if (getSize (lsym->type) < getSize (sym->type))
	  sym = lsym;

      /* if less usage */
      if (lsym->used < sym->used)
	sym = lsym;

    }

  setToNull ((void **) &sset);
  sym->blockSpil = 0;
  return sym;
}

/** noOverLap - will iterate through the list looking for over lap
 */
static int 
noOverLap (set * itmpStack, symbol * fsym)
{
  symbol *sym;

  for (sym = setFirstItem (itmpStack); sym;
       sym = setNextItem (itmpStack))
    {
            // if sym starts before (or on) our end point
            // and ends after (or on) our start point, 
            // it is an overlap.
	    if (sym->liveFrom <= fsym->liveTo &&
		sym->liveTo   >= fsym->liveFrom)
	    {
	    	return 0;
	    }
    }
  return 1;
}

/*-----------------------------------------------------------------*/
/* isFree - will return 1 if the a free spil location is found     */
/*-----------------------------------------------------------------*/
DEFSETFUNC (isFree)
{
  symbol *sym = item;
  V_ARG (symbol **, sloc);
  V_ARG (symbol *, fsym);

  /* if already found */
  if (*sloc)
    return 0;

  /* if it is free && and the itmp assigned to
     this does not have any overlapping live ranges
     with the one currently being assigned and
     the size can be accomodated  */
  if (sym->isFree &&
      noOverLap (sym->usl.itmpStack, fsym) &&
      getSize (sym->type) >= getSize (fsym->type))
    {
      *sloc = sym;
      return 1;
    }

  return 0;
}

/*-----------------------------------------------------------------*/
/* createStackSpil - create a location on the stack to spil        */
/*-----------------------------------------------------------------*/
static symbol *
createStackSpil (symbol * sym)
{
  symbol *sloc = NULL;

  D (D_ALLOC, ("createStackSpil: for sym %p\n", sym));

  /* first go try and find a free one that is already 
     existing on the stack */
  if (applyToSet (_G.stackSpil, isFree, &sloc, sym))
    {
      /* found a free one : just update & return */
      sym->usl.spillLoc = sloc;
      sym->stackSpil = 1;
      sloc->isFree = 0;
      addSetHead (&sloc->usl.itmpStack, sym);
      D (D_ALLOC, ("createStackSpil: found existing\n"));
      return sym;
    }

  /* could not then have to create one , this is the hard part
     we need to allocate this on the stack : this is really a
     hack!! but cannot think of anything better at this time */

  sprintf (buffer, "sloc%d", _G.slocNum++);
  sloc = newiTemp (buffer);

  /* set the type to the spilling symbol */
  sloc->type = copyLinkChain (sym->type);
  sloc->etype = getSpec (sloc->type);
  SPEC_SCLS (sloc->etype) = S_AUTO;

  allocLocal (sloc);

  sloc->isref = 1;		/* to prevent compiler warning */

  /* if it is on the stack then update the stack */
  if (IN_STACK (sloc->etype))
    {
      currFunc->stack += getSize (sloc->type);
      _G.stackExtend += getSize (sloc->type);
    }
  else
    {
      _G.dataExtend += getSize (sloc->type);
    }

  /* add it to the stackSpil set */
  addSetHead (&_G.stackSpil, sloc);
  sym->usl.spillLoc = sloc;
  sym->stackSpil = 1;

  /* add it to the set of itempStack set 
     of the spill location */
  addSetHead (&sloc->usl.itmpStack, sym);

  D (D_ALLOC, ("createStackSpil: created new\n"));
  return sym;
}

/*-----------------------------------------------------------------*/
/* spillThis - spils a specific operand                            */
/*-----------------------------------------------------------------*/
static void 
spillThis (symbol * sym)
{
  int i;

  D (D_ALLOC, ("spillThis: spilling %p\n", sym));

  /* if this is rematerializable or has a spillLocation
     we are okay, else we need to create a spillLocation
     for it */
  if (!(sym->remat || sym->usl.spillLoc))
    {
      createStackSpil (sym);
    }

  /* mark it has spilt & put it in the spilt set */
  sym->isspilt = 1;
  _G.spiltSet = bitVectSetBit (_G.spiltSet, sym->key);

  bitVectUnSetBit (_G.regAssigned, sym->key);

  for (i = 0; i < sym->nRegs; i++)
    {
      if (sym->regs[i])
	{
	  freeReg (sym->regs[i]);
	  sym->regs[i] = NULL;
	}
    }

  if (sym->usl.spillLoc && !sym->remat)
    {
      sym->usl.spillLoc->allocreq = 1;
    }
  return;
}

#if DISABLED
/*-----------------------------------------------------------------*/
/* allDefsOutOfRange - all definitions are out of a range          */
/*-----------------------------------------------------------------*/
static bool
allDefsOutOfRange (bitVect * defs, int fseq, int toseq)
{
  int i;

  if (!defs)
    return TRUE;

  for (i = 0; i < defs->size; i++)
    {
      iCode *ic;

      if (bitVectBitValue (defs, i) &&
	  (ic = hTabItemWithKey (iCodehTab, i)) &&
	  (ic->seq >= fseq && ic->seq <= toseq))

	return FALSE;

    }

  return TRUE;
}

/*-----------------------------------------------------------------*/
/* hasSpilLocnoUptr - will return 1 if the symbol has spil location */
/*                    but is not used as a pointer                 */
/*-----------------------------------------------------------------*/
static int
hasSpilLocnoUptr (symbol * sym, eBBlock * ebp, iCode * ic)
{
  return ((sym->usl.spillLoc && !sym->uptr) ? 1 : 0);
}

/*-----------------------------------------------------------------*/
/* notUsedInBlock - not used in this block                         */
/*-----------------------------------------------------------------*/
static int
notUsedInBlock (symbol * sym, eBBlock * ebp, iCode * ic)
{
  return (!bitVectBitsInCommon (sym->defs, ebp->usesDefs) &&
	  allDefsOutOfRange (sym->defs, ebp->fSeq, ebp->lSeq));
/*     return (!bitVectBitsInCommon(sym->defs,ebp->usesDefs)); */
}

/*-----------------------------------------------------------------*/
/* notUsedInRemaining - not used or defined in remain of the block */
/*-----------------------------------------------------------------*/
static int
notUsedInRemaining (symbol * sym, eBBlock * ebp, iCode * ic)
{
  return ((usedInRemaining (operandFromSymbol (sym), ic) ? 0 : 1) &&
	  allDefsOutOfRange (sym->defs, ebp->fSeq, ebp->lSeq));
}
#endif

/** Select a iTemp to spil : rather a simple procedure.
 */
symbol *
selectSpil (iCode * ic, eBBlock * ebp, symbol * forSym)
{
  bitVect *lrcs = NULL;
  set *selectS;
  symbol *sym;

  D (D_ALLOC, ("selectSpil: finding spill for ic %p\n", ic));
  /* get the spillable live ranges */
  lrcs = computeSpillable (ic);

  /* get all live ranges that are rematerizable */
  if ((selectS = liveRangesWith (lrcs, rematable, ebp, ic)))
    {
      D (D_ALLOC, ("selectSpil: using remat.\n"));
      /* return the least used of these */
      return leastUsedLR (selectS);
    }

#if 0
  /* get live ranges with spillLocations in direct space */
  if ((selectS = liveRangesWith (lrcs, directSpilLoc, ebp, ic)))
    {
      sym = leastUsedLR (selectS);
      strcpy (sym->rname, (sym->usl.spillLoc->rname[0] ?
			   sym->usl.spillLoc->rname :
			   sym->usl.spillLoc->name));
      sym->spildir = 1;
      /* mark it as allocation required */
      sym->usl.spillLoc->allocreq = 1;
      return sym;
    }

  /* if the symbol is local to the block then */
  if (forSym->liveTo < ebp->lSeq)
    {

      /* check if there are any live ranges allocated
         to registers that are not used in this block */
      if (!_G.blockSpil && (selectS = liveRangesWith (lrcs, notUsedInBlock, ebp, ic)))
	{
	  sym = leastUsedLR (selectS);
	  /* if this is not rematerializable */
	  if (!sym->remat)
	    {
	      _G.blockSpil++;
              wassertl (0, "Attempted to do an unsupported block spill");
	      sym->blockSpil = 1;
	    }
	  return sym;
	}

      /* check if there are any live ranges that not
         used in the remainder of the block */
      if (!_G.blockSpil && (selectS = liveRangesWith (lrcs, notUsedInRemaining, ebp, ic)))
	{
	  sym = leastUsedLR (selectS);
	  if (sym != forSym)
	    {
	      if (!sym->remat)
		{
                  wassertl (0, "Attempted to do an unsupported remain spill");
		  sym->remainSpil = 1;
		  _G.blockSpil++;
		}
	      return sym;
	    }
	}
    }
  /* find live ranges with spillocation && not used as pointers */
  if ((selectS = liveRangesWith (lrcs, hasSpilLocnoUptr, ebp, ic)))
    {

      sym = leastUsedLR (selectS);
      /* mark this as allocation required */
      sym->usl.spillLoc->allocreq = 1;
      return sym;
    }
#endif

  /* find live ranges with spillocation */
  if ((selectS = liveRangesWith (lrcs, hasSpilLoc, ebp, ic)))
    {
      D (D_ALLOC, ("selectSpil: using with spill.\n"));
      sym = leastUsedLR (selectS);
      sym->usl.spillLoc->allocreq = 1;
      return sym;
    }

  /* couldn't find then we need to create a spil
     location on the stack , for which one? the least
     used ofcourse */
  if ((selectS = liveRangesWith (lrcs, noSpilLoc, ebp, ic)))
    {
      D (D_ALLOC, ("selectSpil: creating new spill.\n"));
      /* return a created spil location */
      sym = createStackSpil (leastUsedLR (selectS));
      sym->usl.spillLoc->allocreq = 1;
      return sym;
    }

  /* this is an extreme situation we will spill
     this one : happens very rarely but it does happen */
  D (D_ALLOC, ("selectSpil: using spillThis.\n"));
  spillThis (forSym);
  return forSym;

}

/** Spil some variable & mark registers as free.
    A spill occurs when an iTemp wont fit into the available registers.
 */
bool 
spilSomething (iCode * ic, eBBlock * ebp, symbol * forSym)
{
  symbol *ssym;
  int i;

  D (D_ALLOC, ("spilSomething: spilling on ic %p\n", ic));

  /* get something we can spil */
  ssym = selectSpil (ic, ebp, forSym);

  /* mark it as spilt */
  ssym->isspilt = 1;
  _G.spiltSet = bitVectSetBit (_G.spiltSet, ssym->key);

  /* mark it as not register assigned &
     take it away from the set */
  bitVectUnSetBit (_G.regAssigned, ssym->key);

  /* mark the registers as free */
  for (i = 0; i < ssym->nRegs; i++)
    if (ssym->regs[i])
      freeReg (ssym->regs[i]);

  wassertl (ssym->blockSpil == 0, "Encountered a sym with a block spill");
  wassertl (ssym->remainSpil == 0, "Encountered a sym with a remain spill");
#if 0
  /* if spilt on stack then free up r0 & r1 
     if they could have been assigned to as gprs */
  if (!ptrRegReq && isSpiltOnStack (ssym))
    {
      ptrRegReq++;
      spillLRWithPtrReg (ssym);
    }

  /* if this was a block level spil then insert push & pop 
     at the start & end of block respectively */
  if (ssym->blockSpil)
    {
      iCode *nic = newiCode (IPUSH, operandFromSymbol (ssym), NULL);
      /* add push to the start of the block */
      addiCodeToeBBlock (ebp, nic, (ebp->sch->op == LABEL ?
				    ebp->sch->next : ebp->sch));
      nic = newiCode (IPOP, operandFromSymbol (ssym), NULL);
      /* add pop to the end of the block */
      addiCodeToeBBlock (ebp, nic, NULL);
    }

  /* if spilt because not used in the remainder of the
     block then add a push before this instruction and
     a pop at the end of the block */
  if (ssym->remainSpil)
    {

      iCode *nic = newiCode (IPUSH, operandFromSymbol (ssym), NULL);
      /* add push just before this instruction */
      addiCodeToeBBlock (ebp, nic, ic);

      nic = newiCode (IPOP, operandFromSymbol (ssym), NULL);
      /* add pop to the end of the block */
      addiCodeToeBBlock (ebp, nic, NULL);
    }
#endif

  D (D_ALLOC, ("spilSomething: done.\n"));

  if (ssym == forSym)
    return FALSE;
  else
    return TRUE;
}

/** Will try for GPR if not spil.
 */
regs *
getRegGpr (iCode * ic, eBBlock * ebp, symbol * sym)
{
  regs *reg;

  D (D_ALLOC, ("getRegGpr: on ic %p\n", ic));
tryAgain:
  /* try for gpr type */
  if ((reg = allocReg (REG_GPR)))
    {
      D (D_ALLOC, ("getRegGpr: got a reg.\n"));
      return reg;
    }

  /* we have to spil */
  if (!spilSomething (ic, ebp, sym))
    {
      D (D_ALLOC, ("getRegGpr: have to spill.\n"));
      return NULL;
    }

  /* this looks like an infinite loop but 
     in really selectSpil will abort  */
  goto tryAgain;
}

/** Symbol has a given register.
 */
static bool 
symHasReg (symbol * sym, regs * reg)
{
  int i;

  for (i = 0; i < sym->nRegs; i++)
    if (sym->regs[i] == reg)
      return TRUE;

  return FALSE;
}

/** Check the live to and if they have registers & are not spilt then
    free up the registers 
*/
static void 
deassignLRs (iCode * ic, eBBlock * ebp)
{
  symbol *sym;
  int k;
  symbol *result;

  for (sym = hTabFirstItem (liveRanges, &k); sym;
       sym = hTabNextItem (liveRanges, &k))
    {

      symbol *psym = NULL;
      /* if it does not end here */
      if (sym->liveTo > ic->seq)
	continue;

      /* if it was spilt on stack then we can 
         mark the stack spil location as free */
      if (sym->isspilt)
	{
	  if (sym->stackSpil)
	    {
	      sym->usl.spillLoc->isFree = 1;
	      sym->stackSpil = 0;
	    }
	  continue;
	}

      if (!bitVectBitValue (_G.regAssigned, sym->key))
	continue;

      /* special case check if this is an IFX &
         the privious one was a pop and the 
         previous one was not spilt then keep track
         of the symbol */
      if (ic->op == IFX && ic->prev &&
	  ic->prev->op == IPOP &&
	  !ic->prev->parmPush &&
	  !OP_SYMBOL (IC_LEFT (ic->prev))->isspilt)
	psym = OP_SYMBOL (IC_LEFT (ic->prev));

      D (D_ALLOC, ("deassignLRs: in loop on sym %p nregs %u\n", sym, sym->nRegs));

      if (sym->nRegs)
	{
	  int i = 0;

	  bitVectUnSetBit (_G.regAssigned, sym->key);

	  /* if the result of this one needs registers
	     and does not have it then assign it right
	     away */
	  if (IC_RESULT (ic) &&
	      !(SKIP_IC2 (ic) ||	/* not a special icode */
		ic->op == JUMPTABLE ||
		ic->op == IFX ||
		ic->op == IPUSH ||
		ic->op == IPOP ||
		ic->op == RETURN) &&
	      (result = OP_SYMBOL (IC_RESULT (ic))) &&	/* has a result */
	      result->liveTo > ic->seq &&	/* and will live beyond this */
	      result->liveTo <= ebp->lSeq &&	/* does not go beyond this block */
	      result->regType == sym->regType &&	/* same register types */
	      result->nRegs &&	/* which needs registers */
	      !result->isspilt &&	/* and does not already have them */
	      !result->remat &&
	      !bitVectBitValue (_G.regAssigned, result->key) &&
	  /* the number of free regs + number of regs in this LR
	     can accomodate the what result Needs */
	      ((nfreeRegsType (result->regType) +
		sym->nRegs) >= result->nRegs)
	    )
	    {
	      for (i = 0; i < result->nRegs; i++)
		{
		  if (i < sym->nRegs)
		    result->regs[i] = sym->regs[i];
		  else
		    result->regs[i] = getRegGpr (ic, ebp, result);

		  /* if the allocation falied which means
		     this was spilt then break */
		  if (!result->regs[i])
		    {
		      wassert (0);
		      assert (0);
		      break;
		    }
		}

	      _G.regAssigned = bitVectSetBit (_G.regAssigned, result->key);
	    }

	  /* free the remaining */
	  for (; i < sym->nRegs; i++)
	    {
	      if (psym)
		{
		  if (!symHasReg (psym, sym->regs[i]))
		    freeReg (sym->regs[i]);
		}
	      else
		freeReg (sym->regs[i]);
	      //              sym->regs[i] = NULL;
	    }
	}
    }
}


/** Reassign this to registers.
 */
static void 
reassignLR (operand * op)
{
  symbol *sym = OP_SYMBOL (op);
  int i;

  D (D_ALLOC, ("reassingLR: on sym %p\n", sym));

  /* not spilt any more */
  sym->isspilt = sym->blockSpil = sym->remainSpil = 0;
  bitVectUnSetBit (_G.spiltSet, sym->key);

  _G.regAssigned = bitVectSetBit (_G.regAssigned, sym->key);

  _G.blockSpil--;

  for (i = 0; i < sym->nRegs; i++)
    sym->regs[i]->isFree = 0;
}

/** Determines if allocating will cause a spill.
 */
static int 
willCauseSpill (int nr, int rt)
{
  /* first check if there are any avlb registers
     of te type required */
  if (nFreeRegs (0) >= nr)
    return 0;

  /* it will cause a spil */
  return 1;
}

/** The allocator can allocate same registers to result and operand,
    if this happens make sure they are in the same position as the operand
    otherwise chaos results.
*/
static void 
positionRegs (symbol * result, symbol * opsym, int lineno)
{
  int count = min (result->nRegs, opsym->nRegs);
  int i, j = 0, shared = 0;

  D (D_ALLOC, ("positionRegs: on result %p opsum %p line %u\n", result, opsym, lineno));

  /* if the result has been spilt then cannot share */
  if (opsym->isspilt)
    return;
again:
  shared = 0;
  /* first make sure that they actually share */
  for (i = 0; i < count; i++)
    {
      for (j = 0; j < count; j++)
	{
	  if (result->regs[i] == opsym->regs[j] && i != j)
	    {
	      shared = 1;
	      goto xchgPositions;
	    }
	}
    }
xchgPositions:
  if (shared)
    {
      regs *tmp = result->regs[i];
      result->regs[i] = result->regs[j];
      result->regs[j] = tmp;
      goto again;
    }
}

/** Try to allocate a pair of registers to the symbol.
 */
bool 
tryAllocatingRegPair (symbol * sym)
{
  int i;
  wassert (sym->nRegs == 2);
  for (i = 0; i < _G.nRegs; i += 2)
    {
      if ((regsZ80[i].isFree) && (regsZ80[i + 1].isFree))
	{
	  regsZ80[i].isFree = 0;
	  sym->regs[0] = &regsZ80[i];
	  regsZ80[i + 1].isFree = 0;
	  sym->regs[1] = &regsZ80[i + 1];
	  if (currFunc)
	    {
	      currFunc->regsUsed =
		bitVectSetBit (currFunc->regsUsed, i);
	      currFunc->regsUsed =
		bitVectSetBit (currFunc->regsUsed, i + 1);
	    }
	  D (D_ALLOC, ("tryAllocRegPair: succeded for sym %p\n", sym));
	  return TRUE;
	}
    }
  D (D_ALLOC, ("tryAllocRegPair: failed on sym %p\n", sym));
  return FALSE;
}

/** Serially allocate registers to the variables.
    This is the main register allocation function.  It is called after
    packing.
 */
static void 
serialRegAssign (eBBlock ** ebbs, int count)
{
  int i;

  /* for all blocks */
  for (i = 0; i < count; i++)
    {

      iCode *ic;

      if (ebbs[i]->noPath &&
	  (ebbs[i]->entryLabel != entryLabel &&
	   ebbs[i]->entryLabel != returnLabel))
	continue;

      /* of all instructions do */
      for (ic = ebbs[i]->sch; ic; ic = ic->next)
	{

	  /* if this is an ipop that means some live
	     range will have to be assigned again */
	  if (ic->op == IPOP)
	    {
	      wassert (0);
	      reassignLR (IC_LEFT (ic));
	    }

	  /* if result is present && is a true symbol */
	  if (IC_RESULT (ic) && ic->op != IFX &&
	      IS_TRUE_SYMOP (IC_RESULT (ic)))
	    OP_SYMBOL (IC_RESULT (ic))->allocreq = 1;

	  /* take away registers from live
	     ranges that end at this instruction */
	  deassignLRs (ic, ebbs[i]);

	  /* some don't need registers */
	  /* MLH: removed RESULT and POINTER_SET condition */
	  if (SKIP_IC2 (ic) ||
	      ic->op == JUMPTABLE ||
	      ic->op == IFX ||
	      ic->op == IPUSH ||
	      ic->op == IPOP)
	    continue;

	  /* now we need to allocate registers only for the result */
	  if (IC_RESULT (ic))
	    {
	      symbol *sym = OP_SYMBOL (IC_RESULT (ic));
	      bitVect *spillable;
	      int willCS;
	      int j;

	      D (D_ALLOC, ("serialRegAssign: in loop on result %p\n", sym));

	      /* if it does not need or is spilt 
	         or is already assigned to registers
	         or will not live beyond this instructions */
	      if (!sym->nRegs ||
		  sym->isspilt ||
		  bitVectBitValue (_G.regAssigned, sym->key) ||
		  sym->liveTo <= ic->seq)
		{
		  D (D_ALLOC, ("serialRegAssign: wont live long enough.\n"));
		  continue;
		}

	      /* if some liverange has been spilt at the block level
	         and this one live beyond this block then spil this
	         to be safe */
	      if (_G.blockSpil && sym->liveTo > ebbs[i]->lSeq)
		{
		  D (D_ALLOC, ("serialRegAssign: \"spilling to be safe.\"\n"));
		  spillThis (sym);
		  continue;
		}
	      /* if trying to allocate this will cause
	         a spill and there is nothing to spill 
	         or this one is rematerializable then
	         spill this one */
	      willCS = willCauseSpill (sym->nRegs, sym->regType);
	      spillable = computeSpillable (ic);
	      if (sym->remat ||
		  (willCS && bitVectIsZero (spillable)))
		{

		  D (D_ALLOC, ("serialRegAssign: \"remat spill\"\n"));
		  spillThis (sym);
		  continue;

		}

	      /* if it has a spillocation & is used less than
	         all other live ranges then spill this */
	      if (willCS) {
		      if (sym->usl.spillLoc) {
			      symbol *leastUsed = leastUsedLR (liveRangesWith (spillable,
									       allLRs, ebbs[i], ic));
			      if (leastUsed && leastUsed->used > sym->used) {
				      spillThis (sym);
				      continue;
			      }
		      } else {
			      /* if none of the liveRanges have a spillLocation then better
				 to spill this one than anything else already assigned to registers */
			      if (liveRangesWith(spillable,noSpilLoc,ebbs[i],ic)) {
				      spillThis (sym);
				      continue;
			      }
		      }
	      }

	      /* else we assign registers to it */
	      _G.regAssigned = bitVectSetBit (_G.regAssigned, sym->key);

	      /* Special case:  Try to fit into a reg pair if
	         available */
	      D (D_ALLOC, ("serialRegAssign: actually allocing regs!\n"));
	      if ((sym->nRegs == 2) && tryAllocatingRegPair (sym))
		{
		}
	      else
		{
		  for (j = 0; j < sym->nRegs; j++)
		    {
		      sym->regs[j] = getRegGpr (ic, ebbs[i], sym);

		      /* if the allocation falied which means
		         this was spilt then break */
		      if (!sym->regs[j])
			{
			  D (D_ALLOC, ("Couldnt alloc (spill)\n"))
			    break;
			}
		    }
		}
	      /* if it shares registers with operands make sure
	         that they are in the same position */
	      if (IC_LEFT (ic) && IS_SYMOP (IC_LEFT (ic)) &&
		  OP_SYMBOL (IC_LEFT (ic))->nRegs && ic->op != '=')
		positionRegs (OP_SYMBOL (IC_RESULT (ic)),
			      OP_SYMBOL (IC_LEFT (ic)), ic->lineno);
	      /* do the same for the right operand */
	      if (IC_RIGHT (ic) && IS_SYMOP (IC_RIGHT (ic)) &&
		  OP_SYMBOL (IC_RIGHT (ic))->nRegs)
		positionRegs (OP_SYMBOL (IC_RESULT (ic)),
			      OP_SYMBOL (IC_RIGHT (ic)), ic->lineno);

	    }
	}
    }
}

/*-----------------------------------------------------------------*/
/* rUmaskForOp :- returns register mask for an operand             */
/*-----------------------------------------------------------------*/
bitVect *
rUmaskForOp (operand * op)
{
  bitVect *rumask;
  symbol *sym;
  int j;

  /* only temporaries are assigned registers */
  if (!IS_ITEMP (op))
    return NULL;

  sym = OP_SYMBOL (op);

  /* if spilt or no registers assigned to it
     then nothing */
  if (sym->isspilt || !sym->nRegs)
    return NULL;

  rumask = newBitVect (_G.nRegs);

  for (j = 0; j < sym->nRegs; j++)
    {
      rumask = bitVectSetBit (rumask, sym->regs[j]->rIdx);
    }

  return rumask;
}

bitVect *
z80_rUmaskForOp (operand * op)
{
  return rUmaskForOp (op);
}

/** Returns bit vector of registers used in iCode.
 */
bitVect *
regsUsedIniCode (iCode * ic)
{
  bitVect *rmask = newBitVect (_G.nRegs);

  /* do the special cases first */
  if (ic->op == IFX)
    {
      rmask = bitVectUnion (rmask,
			    rUmaskForOp (IC_COND (ic)));
      goto ret;
    }

  /* for the jumptable */
  if (ic->op == JUMPTABLE)
    {
      rmask = bitVectUnion (rmask,
			    rUmaskForOp (IC_JTCOND (ic)));

      goto ret;
    }

  /* of all other cases */
  if (IC_LEFT (ic))
    rmask = bitVectUnion (rmask,
			  rUmaskForOp (IC_LEFT (ic)));


  if (IC_RIGHT (ic))
    rmask = bitVectUnion (rmask,
			  rUmaskForOp (IC_RIGHT (ic)));

  if (IC_RESULT (ic))
    rmask = bitVectUnion (rmask,
			  rUmaskForOp (IC_RESULT (ic)));

ret:
  return rmask;
}

/** For each instruction will determine the regsUsed.
 */
static void 
createRegMask (eBBlock ** ebbs, int count)
{
  int i;

  /* for all blocks */
  for (i = 0; i < count; i++)
    {
      iCode *ic;

      if (ebbs[i]->noPath &&
	  (ebbs[i]->entryLabel != entryLabel &&
	   ebbs[i]->entryLabel != returnLabel))
	continue;

      /* for all instructions */
      for (ic = ebbs[i]->sch; ic; ic = ic->next)
	{

	  int j;

	  if (SKIP_IC2 (ic) || !ic->rlive)
	    continue;

	  /* first mark the registers used in this
	     instruction */
	  ic->rUsed = regsUsedIniCode (ic);
	  _G.funcrUsed = bitVectUnion (_G.funcrUsed, ic->rUsed);

	  /* now create the register mask for those 
	     registers that are in use : this is a
	     super set of ic->rUsed */
	  ic->rMask = newBitVect (_G.nRegs + 1);

	  /* for all live Ranges alive at this point */
	  for (j = 1; j < ic->rlive->size; j++)
	    {
	      symbol *sym;
	      int k;

	      /* if not alive then continue */
	      if (!bitVectBitValue (ic->rlive, j))
		continue;

	      /* find the live range we are interested in */
	      if (!(sym = hTabItemWithKey (liveRanges, j)))
		{
		  werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
			  "createRegMask cannot find live range");
		  exit (0);
		}

	      /* if no register assigned to it */
	      if (!sym->nRegs || sym->isspilt)
		continue;

	      /* for all the registers allocated to it */
	      for (k = 0; k < sym->nRegs; k++)
		if (sym->regs[k])
		  ic->rMask =
		    bitVectSetBit (ic->rMask, sym->regs[k]->rIdx);
	    }
	}
    }
}

/** Returns the rematerialized string for a remat var.
 */
char *
rematStr (symbol * sym)
{
  char *s = buffer;
  iCode *ic = sym->rematiCode;

  while (1)
    {

      /* if plus or minus print the right hand side */
      if (ic->op == '+' || ic->op == '-')
	{
	  sprintf (s, "0x%04x %c ", (int) operandLitValue (IC_RIGHT (ic)),
		   ic->op);
	  s += strlen (s);
	  ic = OP_SYMBOL (IC_LEFT (ic))->rematiCode;
	  continue;
	}
      /* we reached the end */
      sprintf (s, "%s", OP_SYMBOL (IC_LEFT (ic))->rname);
      break;
    }

  return buffer;
}

/*-----------------------------------------------------------------*/
/* regTypeNum - computes the type & number of registers required   */
/*-----------------------------------------------------------------*/
static void 
regTypeNum (void)
{
  symbol *sym;
  int k;

  /* for each live range do */
  for (sym = hTabFirstItem (liveRanges, &k); sym;
       sym = hTabNextItem (liveRanges, &k))
    {

      /* if used zero times then no registers needed */
      if ((sym->liveTo - sym->liveFrom) == 0)
	continue;

      D (D_ALLOC, ("regTypeNum: loop on sym %p\n", sym));

      /* if the live range is a temporary */
      if (sym->isitmp)
	{

	  /* if the type is marked as a conditional */
	  if (sym->regType == REG_CND)
	    continue;

	  /* if used in return only then we don't 
	     need registers */
	  if (sym->ruonly || sym->accuse)
	    {
	      if (IS_AGGREGATE (sym->type) || sym->isptr)
		sym->type = aggrToPtr (sym->type, FALSE);
	      continue;
	    }

	  /* if not then we require registers */
	  D (D_ALLOC, ("regTypeNum: isagg %u nRegs %u type %p\n", IS_AGGREGATE (sym->type) || sym->isptr, sym->nRegs, sym->type));
	  sym->nRegs = ((IS_AGGREGATE (sym->type) || sym->isptr) ?
			getSize (sym->type = aggrToPtr (sym->type, FALSE)) :
			getSize (sym->type));
	  D (D_ALLOC, ("regTypeNum: setting nRegs of %s (%p) to %u\n", sym->name, sym, sym->nRegs));

	  D (D_ALLOC, ("regTypeNum: setup to assign regs sym %p\n", sym));

	  if (sym->nRegs > 4)
	    {
	      fprintf (stderr, "allocated more than 4 or 0 registers for type ");
	      printTypeChain (sym->type, stderr);
	      fprintf (stderr, "\n");
	    }

	  /* determine the type of register required */
	  /* Always general purpose */
	  sym->regType = REG_GPR;

	}
      else
	{
	  /* for the first run we don't provide */
	  /* registers for true symbols we will */
	  /* see how things go                  */
	  D (D_ALLOC, ("regTypeNum: #2 setting num of %p to 0\n", sym));
	  sym->nRegs = 0;
	}
    }

}

/** Mark all registers as free.
 */
static void 
freeAllRegs ()
{
  int i;

  D (D_ALLOC, ("freeAllRegs: running.\n"));

  for (i = 0; i < _G.nRegs; i++)
    regsZ80[i].isFree = 1;
}

/*-----------------------------------------------------------------*/
/* deallocStackSpil - this will set the stack pointer back         */
/*-----------------------------------------------------------------*/
DEFSETFUNC (deallocStackSpil)
{
  symbol *sym = item;

  deallocLocal (sym);
  return 0;
}

/** Register reduction for assignment.
 */
static int 
packRegsForAssign (iCode * ic, eBBlock * ebp)
{
  iCode *dic, *sic;

  D (D_ALLOC, ("packRegsForAssign: running on ic %p\n", ic));

  if (!IS_ITEMP (IC_RIGHT (ic)) ||
      OP_SYMBOL (IC_RIGHT (ic))->isind ||
      OP_LIVETO (IC_RIGHT (ic)) > ic->seq)
    {
      return 0;
    }

#if 0
  /* if the true symbol is defined in far space or on stack
     then we should not since this will increase register pressure */
  if (isOperandInFarSpace (IC_RESULT (ic)))
    {
      if ((dic = farSpacePackable (ic)))
	goto pack;
      else
	return 0;
    }
#endif

  /* find the definition of iTempNN scanning backwards if we find a 
     a use of the true symbol in before we find the definition then 
     we cannot */
  for (dic = ic->prev; dic; dic = dic->prev)
    {
      /* if there is a function call and this is
         a parameter & not my parameter then don't pack it */
      if ((dic->op == CALL || dic->op == PCALL) &&
	  (OP_SYMBOL (IC_RESULT (ic))->_isparm &&
	   !OP_SYMBOL (IC_RESULT (ic))->ismyparm))
	{
	  dic = NULL;
	  break;
	}

      if (SKIP_IC2 (dic))
	continue;

      if (IS_SYMOP (IC_RESULT (dic)) &&
	  IC_RESULT (dic)->key == IC_RIGHT (ic)->key)
	{
	  break;
	}

      if (IS_SYMOP (IC_RIGHT (dic)) &&
	  (IC_RIGHT (dic)->key == IC_RESULT (ic)->key ||
	   IC_RIGHT (dic)->key == IC_RIGHT (ic)->key))
	{
	  dic = NULL;
	  break;
	}

      if (IS_SYMOP (IC_LEFT (dic)) &&
	  (IC_LEFT (dic)->key == IC_RESULT (ic)->key ||
	   IC_LEFT (dic)->key == IC_RIGHT (ic)->key))
	{
	  dic = NULL;
	  break;
	}
#if 0
      if (POINTER_SET (dic) &&
	  IC_RESULT (dic)->key == IC_RESULT (ic)->key)
	{
	  dic = NULL;
	  break;
	}
#endif
    }

  if (!dic)
    return 0;			/* did not find */

  /* if the result is on stack or iaccess then it must be
     the same atleast one of the operands */
  if (OP_SYMBOL (IC_RESULT (ic))->onStack ||
      OP_SYMBOL (IC_RESULT (ic))->iaccess)
    {

      /* the operation has only one symbol
         operator then we can pack */
      if ((IC_LEFT (dic) && !IS_SYMOP (IC_LEFT (dic))) ||
	  (IC_RIGHT (dic) && !IS_SYMOP (IC_RIGHT (dic))))
	goto pack;

      if (!((IC_LEFT (dic) &&
	     IC_RESULT (ic)->key == IC_LEFT (dic)->key) ||
	    (IC_RIGHT (dic) &&
	     IC_RESULT (ic)->key == IC_RIGHT (dic)->key)))
	return 0;
    }
pack:
  /* found the definition */
  /* replace the result with the result of */
  /* this assignment and remove this assignment */
  IC_RESULT (dic) = IC_RESULT (ic);

  if (IS_ITEMP (IC_RESULT (dic)) && OP_SYMBOL (IC_RESULT (dic))->liveFrom > dic->seq)
    {
      OP_SYMBOL (IC_RESULT (dic))->liveFrom = dic->seq;
    }
  /* delete from liverange table also 
     delete from all the points inbetween and the new
     one */
  for (sic = dic; sic != ic; sic = sic->next)
    {
      bitVectUnSetBit (sic->rlive, IC_RESULT (ic)->key);
      if (IS_ITEMP (IC_RESULT (dic)))
	bitVectSetBit (sic->rlive, IC_RESULT (dic)->key);
    }

  remiCodeFromeBBlock (ebp, ic);
  // PENDING: Check vs mcs51
  return 1;
}

/** Scanning backwards looks for first assig found.
 */
iCode *
findAssignToSym (operand * op, iCode * ic)
{
  iCode *dic;

  for (dic = ic->prev; dic; dic = dic->prev)
    {

      /* if definition by assignment */
      if (dic->op == '=' &&
	  !POINTER_SET (dic) &&
	  IC_RESULT (dic)->key == op->key)
	/*      &&  IS_TRUE_SYMOP(IC_RIGHT(dic)) */
	{

	  /* we are interested only if defined in far space */
	  /* or in stack space in case of + & - */

	  /* if assigned to a non-symbol then return
	     true */
	  if (!IS_SYMOP (IC_RIGHT (dic)))
	    break;

	  /* if the symbol is in far space then
	     we should not */
	  if (isOperandInFarSpace (IC_RIGHT (dic)))
	    return NULL;

	  /* for + & - operations make sure that
	     if it is on the stack it is the same
	     as one of the three operands */
	  if ((ic->op == '+' || ic->op == '-') &&
	      OP_SYMBOL (IC_RIGHT (dic))->onStack)
	    {

	      if (IC_RESULT (ic)->key != IC_RIGHT (dic)->key &&
		  IC_LEFT (ic)->key != IC_RIGHT (dic)->key &&
		  IC_RIGHT (ic)->key != IC_RIGHT (dic)->key)
		return NULL;
	    }

	  break;

	}

      /* if we find an usage then we cannot delete it */
      if (IC_LEFT (dic) && IC_LEFT (dic)->key == op->key)
	return NULL;

      if (IC_RIGHT (dic) && IC_RIGHT (dic)->key == op->key)
	return NULL;

      if (POINTER_SET (dic) && IC_RESULT (dic)->key == op->key)
	return NULL;
    }

  /* now make sure that the right side of dic
     is not defined between ic & dic */
  if (dic)
    {
      iCode *sic = dic->next;

      for (; sic != ic; sic = sic->next)
	if (IC_RESULT (sic) &&
	    IC_RESULT (sic)->key == IC_RIGHT (dic)->key)
	  return NULL;
    }

  return dic;


}

#if !DISABLE_PACKREGSFORSUPPORT
// PENDING

/*-----------------------------------------------------------------*/
/* packRegsForSupport :- reduce some registers for support calls   */
/*-----------------------------------------------------------------*/
static int 
packRegsForSupport (iCode * ic, eBBlock * ebp)
{
  int change = 0;
  /* for the left & right operand :- look to see if the
     left was assigned a true symbol in far space in that
     case replace them */
  D (D_ALLOC, ("packRegsForSupport: running on ic %p\n", ic));

  if (IS_ITEMP (IC_LEFT (ic)) &&
      OP_SYMBOL (IC_LEFT (ic))->liveTo <= ic->seq)
    {
      iCode *dic = findAssignToSym (IC_LEFT (ic), ic);
      iCode *sic;

      if (!dic)
	goto right;

      /* found it we need to remove it from the
         block */
      for (sic = dic; sic != ic; sic = sic->next)
	bitVectUnSetBit (sic->rlive, IC_LEFT (ic)->key);

      IC_LEFT (ic)->operand.symOperand =
	IC_RIGHT (dic)->operand.symOperand;
      IC_LEFT (ic)->key = IC_RIGHT (dic)->operand.symOperand->key;
      remiCodeFromeBBlock (ebp, dic);
      // PENDING: Check vs mcs51
      change++;
    }

  /* do the same for the right operand */
right:
  if (!change &&
      IS_ITEMP (IC_RIGHT (ic)) &&
      OP_SYMBOL (IC_RIGHT (ic))->liveTo <= ic->seq)
    {
      iCode *dic = findAssignToSym (IC_RIGHT (ic), ic);
      iCode *sic;

      if (!dic)
	return change;

      /* found it we need to remove it from the block */
      for (sic = dic; sic != ic; sic = sic->next)
	bitVectUnSetBit (sic->rlive, IC_RIGHT (ic)->key);

      IC_RIGHT (ic)->operand.symOperand =
	IC_RIGHT (dic)->operand.symOperand;
      IC_RIGHT (ic)->key = IC_RIGHT (dic)->operand.symOperand->key;

      remiCodeFromeBBlock (ebp, dic);
      // PENDING: vs mcs51
      change++;
    }

  return change;
}
#endif

#define IS_OP_RUONLY(x) (x && IS_SYMOP(x) && OP_SYMBOL(x)->ruonly)

/** Will reduce some registers for single use.
 */
static iCode *
packRegsForOneuse (iCode * ic, operand * op, eBBlock * ebp)
{
  bitVect *uses;
  iCode *dic, *sic;

  // PENDING: Disable
  D (D_ALLOC, ("packRegsForOneUse: running on ic %p\n", ic));

  /* if returning a literal then do nothing */
  if (!IS_SYMOP (op))
    return NULL;

  /* only upto 2 bytes since we cannot predict
     the usage of b, & acc */
  if (getSize (operandType (op)) > 2 &&
      ic->op != RETURN &&
      ic->op != SEND)
    return NULL;

  /* this routine will mark the a symbol as used in one 
     instruction use only && if the defintion is local 
     (ie. within the basic block) && has only one definition &&
     that definiion is either a return value from a 
     function or does not contain any variables in
     far space */
  uses = bitVectCopy (OP_USES (op));
  bitVectUnSetBit (uses, ic->key);	/* take away this iCode */
  if (!bitVectIsZero (uses))	/* has other uses */
    return NULL;

  /* if it has only one defintion */
  if (bitVectnBitsOn (OP_DEFS (op)) > 1)
    return NULL;		/* has more than one definition */

  /* get the that definition */
  if (!(dic =
	hTabItemWithKey (iCodehTab,
			 bitVectFirstBit (OP_DEFS (op)))))
    return NULL;

  /* found the definition now check if it is local */
  if (dic->seq < ebp->fSeq ||
      dic->seq > ebp->lSeq)
    return NULL;		/* non-local */

  /* now check if it is the return from a function call */
  if (dic->op == CALL || dic->op == PCALL)
    {
      if (ic->op != SEND && ic->op != RETURN)
	{
	  OP_SYMBOL (op)->ruonly = 1;
	  return dic;
	}
      dic = dic->next;
    }

  /* otherwise check that the definition does
     not contain any symbols in far space */
  if (isOperandInFarSpace (IC_LEFT (dic)) ||
      isOperandInFarSpace (IC_RIGHT (dic)) ||
      IS_OP_RUONLY (IC_LEFT (ic)) ||
      IS_OP_RUONLY (IC_RIGHT (ic)))
    {
      return NULL;
    }

  /* if pointer set then make sure the pointer is one byte */
  if (POINTER_SET (dic))
    return NULL;

  if (POINTER_GET (dic))
    return NULL;

  sic = dic;

  /* also make sure the intervenening instructions
     don't have any thing in far space */
  for (dic = dic->next; dic && dic != ic; dic = dic->next)
    {
      /* if there is an intervening function call then no */
      if (dic->op == CALL || dic->op == PCALL)
	return NULL;
      /* if pointer set then make sure the pointer
         is one byte */
      if (POINTER_SET (dic))
	return NULL;

      if (POINTER_GET (dic))
	return NULL;

      /* if address of & the result is remat the okay */
      if (dic->op == ADDRESS_OF &&
	  OP_SYMBOL (IC_RESULT (dic))->remat)
	continue;

      /* if left or right or result is in far space */
      if (isOperandInFarSpace (IC_LEFT (dic)) ||
	  isOperandInFarSpace (IC_RIGHT (dic)) ||
	  isOperandInFarSpace (IC_RESULT (dic)) ||
	  IS_OP_RUONLY (IC_LEFT (dic)) ||
	  IS_OP_RUONLY (IC_RIGHT (dic)) ||
	  IS_OP_RUONLY (IC_RESULT (dic)))
	{
	  return NULL;
	}
    }

  OP_SYMBOL (op)->ruonly = 1;
  return sic;
}

/*-----------------------------------------------------------------*/
/* isBitwiseOptimizable - requirements of JEAN LOUIS VERN          */
/*-----------------------------------------------------------------*/
static bool 
isBitwiseOptimizable (iCode * ic)
{
  sym_link *rtype = getSpec (operandType (IC_RIGHT (ic)));

  /* bitwise operations are considered optimizable
     under the following conditions (Jean-Louis VERN) 

     x & lit
     bit & bit
     bit & x
     bit ^ bit
     bit ^ x
     x   ^ lit
     x   | lit
     bit | bit
     bit | x
   */
  if (IS_LITERAL (rtype))
    return TRUE;
  return FALSE;
}

/** Optimisations:
    Certian assignments involving pointers can be temporarly stored
    in HL.  Esp.
genAssign
    ld	iy,#_Blah
    ld	bc,(iy)
genAssign (ptr)
    ld	hl,bc
    ld	iy,#_Blah2
    ld	(iy),(hl)
*/

#if !DISABLE_PACKREGSFORACCUSE
// PENDING

/** Pack registers for acc use.
    When the result of this operation is small and short lived it may
    be able to be stored in the accumelator.
 */
static void 
packRegsForAccUse (iCode * ic)
{
  iCode *uic;

  /* if + or - then it has to be one byte result */
  if ((ic->op == '+' || ic->op == '-')
      && getSize (operandType (IC_RESULT (ic))) > 1)
    return;

  /* if shift operation make sure right side is not a literal */
  if (ic->op == RIGHT_OP &&
      (isOperandLiteral (IC_RIGHT (ic)) ||
       getSize (operandType (IC_RESULT (ic))) > 1))
    return;

  if (ic->op == LEFT_OP &&
      (isOperandLiteral (IC_RIGHT (ic)) ||
       getSize (operandType (IC_RESULT (ic))) > 1))
    return;

  /* has only one definition */
  if (bitVectnBitsOn (OP_DEFS (IC_RESULT (ic))) > 1)
    return;

  /* has only one use */
  if (bitVectnBitsOn (OP_USES (IC_RESULT (ic))) > 1)
    return;

  /* and the usage immediately follows this iCode */
  if (!(uic = hTabItemWithKey (iCodehTab,
			       bitVectFirstBit (OP_USES (IC_RESULT (ic))))))
    return;

  if (ic->next != uic)
    return;

  /* if it is a conditional branch then we definitely can */
  if (uic->op == IFX)
    goto accuse;

  if (uic->op == JUMPTABLE)
    return;

#if 0
  /* if the usage is not is an assignment or an 
     arithmetic / bitwise / shift operation then not */
  if (POINTER_SET (uic) &&
      getSize (aggrToPtr (operandType (IC_RESULT (uic)), FALSE)) > 1)
    return;
#endif

  if (uic->op != '=' &&
      !IS_ARITHMETIC_OP (uic) &&
      !IS_BITWISE_OP (uic) &&
      uic->op != LEFT_OP &&
      uic->op != RIGHT_OP)
    return;

  /* if used in ^ operation then make sure right is not a 
     literl */
  if (uic->op == '^' && isOperandLiteral (IC_RIGHT (uic)))
    return;

  /* if shift operation make sure right side is not a literal */
  if (uic->op == RIGHT_OP &&
      (isOperandLiteral (IC_RIGHT (uic)) ||
       getSize (operandType (IC_RESULT (uic))) > 1))
    return;

  if (uic->op == LEFT_OP &&
      (isOperandLiteral (IC_RIGHT (uic)) ||
       getSize (operandType (IC_RESULT (uic))) > 1))
    return;

#if 0
  /* make sure that the result of this icode is not on the
     stack, since acc is used to compute stack offset */
  if (IS_TRUE_SYMOP (IC_RESULT (uic)) &&
      OP_SYMBOL (IC_RESULT (uic))->onStack)
    return;
#endif

#if 0
  /* if either one of them in far space then we cannot */
  if ((IS_TRUE_SYMOP (IC_LEFT (uic)) &&
       isOperandInFarSpace (IC_LEFT (uic))) ||
      (IS_TRUE_SYMOP (IC_RIGHT (uic)) &&
       isOperandInFarSpace (IC_RIGHT (uic))))
    return;
#endif

  /* if the usage has only one operand then we can */
  if (IC_LEFT (uic) == NULL ||
      IC_RIGHT (uic) == NULL)
    goto accuse;

  /* make sure this is on the left side if not
     a '+' since '+' is commutative */
  if (ic->op != '+' &&
      IC_LEFT (uic)->key != IC_RESULT (ic)->key)
    return;

  // See mcs51 ralloc for reasoning
#if 0
  /* if one of them is a literal then we can */
  if ((IC_LEFT (uic) && IS_OP_LITERAL (IC_LEFT (uic))) ||
      (IC_RIGHT (uic) && IS_OP_LITERAL (IC_RIGHT (uic))))
    {
      goto accuse;
      return;
    }
#endif

/** This is confusing :)  Guess for now */
  if (IC_LEFT (uic)->key == IC_RESULT (ic)->key &&
      (IS_ITEMP (IC_RIGHT (uic)) ||
       (IS_TRUE_SYMOP (IC_RIGHT (uic)))))
    goto accuse;

  if (IC_RIGHT (uic)->key == IC_RESULT (ic)->key &&
      (IS_ITEMP (IC_LEFT (uic)) ||
       (IS_TRUE_SYMOP (IC_LEFT (uic)))))
    goto accuse;
  return;
accuse:
  OP_SYMBOL (IC_RESULT (ic))->accuse = ACCUSE_A;
}
#endif

static void 
packRegsForHLUse (iCode * ic)
{
  iCode *uic;

  /* has only one definition */
  if (bitVectnBitsOn (OP_DEFS (IC_RESULT (ic))) > 1)
    {
      D (D_HLUSE, ("  + Dropping as has more than one def\n"));
      return;
    }

  /* has only one use */
  if (bitVectnBitsOn (OP_USES (IC_RESULT (ic))) > 1)
    {
      D (D_HLUSE, ("  + Dropping as has more than one use\n"));
      return;
    }

  /* and the usage immediately follows this iCode */
  if (!(uic = hTabItemWithKey (iCodehTab,
			       bitVectFirstBit (OP_USES (IC_RESULT (ic))))))
    {
      D (D_HLUSE, ("  + Dropping as usage isn't in this block\n"));
      return;
    }

  if (ic->next != uic)
    {
      D (D_HLUSE, ("  + Dropping as usage doesn't follow this\n"));
      return;
    }

  if (getSize (operandType (IC_RESULT (ic))) != 2)
    {
      D (D_HLUSE, ("  + Dropping as the result size is not 2\n"));
    }

  if (IS_Z80)
    {
      if (ic->op == CAST && uic->op == IPUSH)
        goto hluse;
      if (ic->op == ADDRESS_OF && uic->op == IPUSH)
        goto hluse;
      if (ic->op == CALL && ic->parmBytes == 0 && (uic->op == '-' || uic->op == '+'))
        goto hluse;
    }
  else if (IS_GB)
    {
      /* Case of assign a constant to offset in a static array. */
      if (ic->op == '+' && IS_VALOP (IC_RIGHT (ic)))
        {
          if (uic->op == '=' && POINTER_SET (uic))
            {
              goto hluse;
            }
          else if (uic->op == IPUSH && getSize (operandType (IC_LEFT (uic))) == 2)
            {
              goto hluse;
            }
        }
    }

  D (D_HLUSE, ("  + Dropping as it's a bad op\n"));
  return;
hluse:
  OP_SYMBOL (IC_RESULT (ic))->accuse = ACCUSE_SCRATCH;
}

static bool 
opPreservesA (iCode * ic, iCode * uic)
{
  if (uic->op == IFX)
    {
      /* If we've gotten this far then the thing to compare must be
         small enough and must be in A.
      */
      return TRUE;
    }

  if (uic->op == JUMPTABLE)
    {
      D (D_ACCUSE2, ("  + Dropping as operation is a Jumptable\n"));
      return FALSE;
    }

  /* A pointer assign preserves A if A is the left value. */
  if (uic->op == '=' && POINTER_SET (uic))
    {
      return TRUE;
    }

  /* if the usage has only one operand then we can */
  /* PENDING: check */
  if (IC_LEFT (uic) == NULL ||
      IC_RIGHT (uic) == NULL)
    {
      D (D_ACCUSE2, ("  + Dropping as operation has only one operand\n"));
      return FALSE;
    }

  /* PENDING: check this rule */
  if (getSize (operandType (IC_RESULT (uic))) > 1)
    {
      D (D_ACCUSE2, ("  + Dropping as operation has size is too big\n"));
      return FALSE;
    }


  /* Disabled all of the old rules as they weren't verified and have
     caused at least one problem.
   */
  return FALSE;
}

static bool
opIgnoresA (iCode * ic, iCode * uic)
{
  /* A increment of an iTemp by a constant is OK. */
  if ( uic->op == '+' &&
       IS_ITEMP (IC_LEFT (uic)) &&
       IS_ITEMP (IC_RESULT (uic)) &&
       IS_OP_LITERAL (IC_RIGHT (uic)))
    {
      unsigned int icount = (unsigned int) floatFromVal (IC_RIGHT (uic)->operand.valOperand);

      /* Being an ITEMP means that we're already a symbol. */
      if (icount == 1 &&
          IC_RESULT (uic)->operand.symOperand->key == IC_LEFT (uic)->operand.symOperand->key
          )
        {
          return TRUE;
        }
    }

  return FALSE;
}


/* Some optimisation cases:

   1. Part of memcpy
;	genPointerGet
	ld	l,-4(ix)
	ld	h,-3(ix)
	ld	c,(hl)
;	genPlus
	inc	-4(ix)
	jp	nz,00108$
	inc	-3(ix)
00108$:
;	genAssign (pointer)
	ld	a,c
	ld	(de),a
 
      want to optimise down to:
        ld       hl,-4(ix) ...
        ld       a,(hl)
        inc      -4(ix).w  ...
        ld       (de),a

      So genPointer get is OK
      genPlus where the right is constant, left is iTemp, and result is same as left
      genAssign (pointer) is OK

    2. Part of _strcpy
;	genPointerGet
	ld	a,(de)
	ld	c,a
;	genIfx
	xor	a,a
	or	a,c
	jp	z,00103$
;	_strcpy.c 40
;	genAssign (pointer)
;	AOP_STK for _strcpy_to_1_1
	ld	l,-2(ix)
	ld	h,-1(ix)
	ld	(hl),c

      want to optimise down to:
        ld 	a,(de)
        or	a,a
        jp	z,00103$
        ld	(bc),a
      
      So genIfx where IC_COND has size of 1 and is a constant.
*/

/** Pack registers for acc use.
    When the result of this operation is small and short lived it may
    be able to be stored in the accumulator.

    Note that the 'A preserving' list is currently emperical :)
 */
static void 
packRegsForAccUse2 (iCode * ic)
{
  iCode *uic;

  D (D_ALLOC, ("packRegsForAccUse2: running on ic %p\n", ic));

  /* Filter out all but those 'good' commands */
  if (
       !POINTER_GET (ic) &&
       ic->op != '+' &&
       !IS_BITWISE_OP (ic) &&
       ic->op != '=' &&
       ic->op != EQ_OP &&
       ic->op != CAST &&
       1)
    {
      D (D_ACCUSE2, ("  + Dropping as not a 'good' source command\n"));
      return;
    }

  /* if + or - then it has to be one byte result.
     MLH: Ok.
   */
  if ((ic->op == '+' || ic->op == '-')
      && getSize (operandType (IC_RESULT (ic))) > 1)
    {
      D (D_ACCUSE2, ("  + Dropping as it's a big + or -\n"));
      return;
    }

  /* has only one definition */
  if (bitVectnBitsOn (OP_DEFS (IC_RESULT (ic))) > 1)
    {
      D (D_ACCUSE2, ("  + Dropping as it has more than one definition\n"));
      return;
    }

  /* Right.  We may be able to propagate it through if:
     For each in the chain of uses the intermediate is OK.
   */
  /* Get next with 'uses result' bit on
     If this->next == next
     Validate use of next
     If OK, increase count
   */
  /* and the usage immediately follows this iCode */
  if (!(uic = hTabItemWithKey (iCodehTab,
			       bitVectFirstBit (OP_USES (IC_RESULT (ic))))))
    {
      D (D_ACCUSE2, ("  + Dropping as usage does not follow first\n"));
      return;
    }

  {
    /* Create a copy of the OP_USES bit vect */
    bitVect *uses = bitVectCopy (OP_USES (IC_RESULT (ic)));
    int setBit;
    iCode *scan = ic, *next;

    do
      {
	setBit = bitVectFirstBit (uses);
	next = hTabItemWithKey (iCodehTab, setBit);
	if (scan->next == next)
	  {
            D (D_ACCUSE2_VERBOSE, ("  ! Is next in line\n"));

	    bitVectUnSetBit (uses, setBit);
	    /* Still contigous. */
	    if (!opPreservesA (ic, next))
	      {
                D (D_ACCUSE2, ("  + Dropping as operation doesn't preserve A\n"));
		return;
	      }
            D (D_ACCUSE2_VERBOSE, ("  ! Preserves A, so continue scanning\n"));
	    scan = next;
	  }
        else if (scan->next == NULL && bitVectnBitsOn (uses) == 1 && next != NULL)
          {
            if (next->prev == NULL)
              {
                if (!opPreservesA (ic, next))
                  {
                    D (D_ACCUSE2, ("  + Dropping as operation doesn't preserve A #2\n"));
                    return;
                  }
                bitVectUnSetBit (uses, setBit);
                scan = next;
              }
            else 
              {
                D (D_ACCUSE2, ("  + Dropping as last in list and next doesn't start a block\n"));
                return;
              }
          }
        else if (scan->next == NULL)
          {
            D (D_ACCUSE2, ("  + Dropping as hit the end of the list\n"));
            D (D_ACCUSE2, ("  + Next in htab: %p\n", next));
            return;
          }
	else
	  {
            if (opIgnoresA (ic, scan->next))
              {
                /* Safe for now. */
                scan = scan->next;
                D (D_ACCUSE2_VERBOSE, ("  ! Op ignores A, so continue scanning\n"));
              }
            else
              {
                D (D_ACCUSE2, ("  + Dropping as parts are not consecuitive and intermediate might use A\n"));
                return;
              }
	  }
      }
    while (!bitVectIsZero (uses));

    OP_SYMBOL (IC_RESULT (ic))->accuse = ACCUSE_A;
    return;
  }

  /* OLD CODE FOLLOWS */
  /* if it is a conditional branch then we definitely can
     MLH: Depends.
   */
#if 0
  if (uic->op == IFX)
    goto accuse;

  /* MLH: Depends. */
  if (uic->op == JUMPTABLE)
    return;
#endif

  /* if the usage is not is an assignment or an 
     arithmetic / bitwise / shift operation then not.
     MLH: Pending:  Invalid.  Our pointer sets are always peechy.
   */
#if 0
  if (POINTER_SET (uic) &&
      getSize (aggrToPtr (operandType (IC_RESULT (uic)), FALSE)) > 1)
    {
      printf ("e5 %u\n", getSize (aggrToPtr (operandType (IC_RESULT (uic)), FALSE)));
      return;
    }
#endif

  printf ("1\n");
  if (uic->op != '=' &&
      !IS_ARITHMETIC_OP (uic) &&
      !IS_BITWISE_OP (uic) &&
      uic->op != LEFT_OP &&
      uic->op != RIGHT_OP)
    {
      printf ("e6\n");
      return;
    }

  /* if used in ^ operation then make sure right is not a 
     literl */
  if (uic->op == '^' && isOperandLiteral (IC_RIGHT (uic)))
    return;

  /* if shift operation make sure right side is not a literal */
  if (uic->op == RIGHT_OP &&
      (isOperandLiteral (IC_RIGHT (uic)) ||
       getSize (operandType (IC_RESULT (uic))) > 1))
    return;

  if (uic->op == LEFT_OP &&
      (isOperandLiteral (IC_RIGHT (uic)) ||
       getSize (operandType (IC_RESULT (uic))) > 1))
    return;

#if 0
  /* make sure that the result of this icode is not on the
     stack, since acc is used to compute stack offset */
  if (IS_TRUE_SYMOP (IC_RESULT (uic)) &&
      OP_SYMBOL (IC_RESULT (uic))->onStack)
    return;
#endif

#if 0
  /* if either one of them in far space then we cannot */
  if ((IS_TRUE_SYMOP (IC_LEFT (uic)) &&
       isOperandInFarSpace (IC_LEFT (uic))) ||
      (IS_TRUE_SYMOP (IC_RIGHT (uic)) &&
       isOperandInFarSpace (IC_RIGHT (uic))))
    return;
#endif

  /* if the usage has only one operand then we can */
  if (IC_LEFT (uic) == NULL ||
      IC_RIGHT (uic) == NULL)
    goto accuse;

  /* make sure this is on the left side if not
     a '+' since '+' is commutative */
  if (ic->op != '+' &&
      IC_LEFT (uic)->key != IC_RESULT (ic)->key)
    return;

  /* if one of them is a literal then we can */
  if ((IC_LEFT (uic) && IS_OP_LITERAL (IC_LEFT (uic))) ||
      (IC_RIGHT (uic) && IS_OP_LITERAL (IC_RIGHT (uic))))
    {
      goto accuse;
      return;
    }

/** This is confusing :)  Guess for now */
  if (IC_LEFT (uic)->key == IC_RESULT (ic)->key &&
      (IS_ITEMP (IC_RIGHT (uic)) ||
       (IS_TRUE_SYMOP (IC_RIGHT (uic)))))
    goto accuse;

  if (IC_RIGHT (uic)->key == IC_RESULT (ic)->key &&
      (IS_ITEMP (IC_LEFT (uic)) ||
       (IS_TRUE_SYMOP (IC_LEFT (uic)))))
    goto accuse;
  return;
accuse:
  printf ("acc ok!\n");
  OP_SYMBOL (IC_RESULT (ic))->accuse = ACCUSE_A;
}

/** Does some transformations to reduce register pressure.
 */
static void 
packRegisters (eBBlock * ebp)
{
  iCode *ic;
  int change = 0;

  D (D_ALLOC, ("packRegisters: entered.\n"));

  while (1 && !DISABLE_PACK_ASSIGN)
    {
      change = 0;
      /* look for assignments of the form */
      /* iTempNN = TRueSym (someoperation) SomeOperand */
      /*       ....                       */
      /* TrueSym := iTempNN:1             */
      for (ic = ebp->sch; ic; ic = ic->next)
	{
	  /* find assignment of the form TrueSym := iTempNN:1 */
	  if (ic->op == '=' && !POINTER_SET (ic))
	    change += packRegsForAssign (ic, ebp);
	}
      if (!change)
	break;
    }

  for (ic = ebp->sch; ic; ic = ic->next)
    {
      /* Safe: address of a true sym is always constant. */
      /* if this is an itemp & result of a address of a true sym 
         then mark this as rematerialisable   */
      D (D_ALLOC, ("packRegisters: looping on ic %p\n", ic));

      if (ic->op == ADDRESS_OF &&
	  IS_ITEMP (IC_RESULT (ic)) &&
	  IS_TRUE_SYMOP (IC_LEFT (ic)) &&
	  bitVectnBitsOn (OP_DEFS (IC_RESULT (ic))) == 1 &&
	  !OP_SYMBOL (IC_LEFT (ic))->onStack)
	{

	  OP_SYMBOL (IC_RESULT (ic))->remat = 1;
	  OP_SYMBOL (IC_RESULT (ic))->rematiCode = ic;
	  OP_SYMBOL (IC_RESULT (ic))->usl.spillLoc = NULL;
	}

      /* Safe: just propagates the remat flag */
      /* if straight assignment then carry remat flag if this is the
         only definition */
      if (ic->op == '=' &&
	  !POINTER_SET (ic) &&
	  IS_SYMOP (IC_RIGHT (ic)) &&
	  OP_SYMBOL (IC_RIGHT (ic))->remat &&
	  bitVectnBitsOn (OP_SYMBOL (IC_RESULT (ic))->defs) <= 1)
	{

	  OP_SYMBOL (IC_RESULT (ic))->remat =
	    OP_SYMBOL (IC_RIGHT (ic))->remat;
	  OP_SYMBOL (IC_RESULT (ic))->rematiCode =
	    OP_SYMBOL (IC_RIGHT (ic))->rematiCode;
	}

      /* if the condition of an if instruction is defined in the
         previous instruction then mark the itemp as a conditional */
      if ((IS_CONDITIONAL (ic) ||
	   ((ic->op == BITWISEAND ||
	     ic->op == '|' ||
	     ic->op == '^') &&
	    isBitwiseOptimizable (ic))) &&
	  ic->next && ic->next->op == IFX &&
	  bitVectnBitsOn (OP_USES(IC_RESULT(ic)))==1 &&
	  isOperandEqual (IC_RESULT (ic), IC_COND (ic->next)) &&
	  OP_SYMBOL (IC_RESULT (ic))->liveTo <= ic->next->seq)
	{

	  OP_SYMBOL (IC_RESULT (ic))->regType = REG_CND;
	  continue;
	}

#if 0
      /* reduce for support function calls */
      if (ic->supportRtn || ic->op == '+' || ic->op == '-')
	packRegsForSupport (ic, ebp);
#endif

      /* if pointer set & left has a size more than
         one and right is not in far space */
      if (!DISABLE_PACK_ONE_USE &&
          POINTER_SET (ic) &&
          /* MLH: no such thing.
             !isOperandInFarSpace(IC_RIGHT(ic)) && */
	  !OP_SYMBOL (IC_RESULT (ic))->remat &&
	  !IS_OP_RUONLY (IC_RIGHT (ic)) &&
	  getSize (aggrToPtr (operandType (IC_RESULT (ic)), FALSE)) > 1)
	{

	  packRegsForOneuse (ic, IC_RESULT (ic), ebp);
	}

      /* if pointer get */
      if (!DISABLE_PACK_ONE_USE &&
	  POINTER_GET (ic) &&
      /* MLH: dont have far space
         !isOperandInFarSpace(IC_RESULT(ic))&& */
	  !OP_SYMBOL (IC_LEFT (ic))->remat &&
	  !IS_OP_RUONLY (IC_RESULT (ic)) &&
	  getSize (aggrToPtr (operandType (IC_LEFT (ic)), FALSE)) > 1)
	{

	  packRegsForOneuse (ic, IC_LEFT (ic), ebp);
	}

      /* pack registers for accumulator use, when the result of an
         arithmetic or bit wise operation has only one use, that use is
         immediately following the defintion and the using iCode has
         only one operand or has two operands but one is literal & the
         result of that operation is not on stack then we can leave the
         result of this operation in acc:b combination */

      if (!DISABLE_PACK_HL && IS_ITEMP (IC_RESULT (ic)))
	{
	  packRegsForHLUse (ic);
	}

      if (!DISABLE_PACK_ACC && IS_ITEMP (IC_RESULT (ic)) &&
	  getSize (operandType (IC_RESULT (ic))) == 1)
	{
	  packRegsForAccUse2 (ic);
	}
    }
}

/** Joins together two byte constant pushes into one word push.
 */
static iCode *
joinPushes (iCode *lic)
{
  iCode *ic, *uic;

  for (ic = lic; ic; ic = ic->next)
    {
      int first, second;
      value *val;

      uic = ic->next;

      /* Anything past this? */
      if (uic == NULL)
        {
          continue;
        }
      /* This and the next pushes? */
      if (ic->op != IPUSH || uic->op != IPUSH)
        {
          continue;
        }
      /* Both literals? */
      if ( !IS_OP_LITERAL (IC_LEFT (ic)) || !IS_OP_LITERAL (IC_LEFT (uic)))
        {
          continue;
        }
      /* Both characters? */
      if ( getSize (operandType (IC_LEFT (ic))) != 1 || getSize (operandType (IC_LEFT (uic))) != 1)
        {
          continue;
        }
      /* Pull out the values, make a new type, and create the new iCode for it.
       */
      first = (int)operandLitValue ( IC_LEFT (ic));
      second = (int)operandLitValue ( IC_LEFT (uic));

      sprintf (buffer, "%u", ((first << 8) | (second & 0xFF)) & 0xFFFFU);
      val = constVal (buffer);
      SPEC_NOUN (val->type) = V_INT;
      IC_LEFT (ic)->operand.valOperand = val;
      
      /* Now remove the second one from the list. */
      ic->next = uic->next;
      if (uic->next)
        {
          /* Patch up the reverse link */
          uic->next->prev = ic;
        }
    }

  return lic;
}

/*-----------------------------------------------------------------*/
/* assignRegisters - assigns registers to each live range as need  */
/*-----------------------------------------------------------------*/
void 
z80_assignRegisters (eBBlock ** ebbs, int count)
{
  iCode *ic;
  int i;

  D (D_ALLOC, ("\n-> z80_assignRegisters: entered.\n"));

  setToNull ((void *) &_G.funcrUsed);
  _G.stackExtend = _G.dataExtend = 0;

  if (IS_GB)
    {
      /* DE is required for the code gen. */
      _G.nRegs = GBZ80_MAX_REGS;
      regsZ80 = _gbz80_regs;
    }
  else
    {
      _G.nRegs = Z80_MAX_REGS;
      regsZ80 = _z80_regs;
    }

  /* change assignments this will remove some
     live ranges reducing some register pressure */
  for (i = 0; i < count; i++)
    packRegisters (ebbs[i]);

  if (options.dump_pack)
    dumpEbbsToFileExt (DUMP_PACK, ebbs, count);

  /* first determine for each live range the number of 
     registers & the type of registers required for each */
  regTypeNum ();

  /* and serially allocate registers */
  serialRegAssign (ebbs, count);

  /* if stack was extended then tell the user */
  if (_G.stackExtend)
    {
/*      werror(W_TOOMANY_SPILS,"stack", */
/*             _G.stackExtend,currFunc->name,""); */
      _G.stackExtend = 0;
    }

  if (_G.dataExtend)
    {
/*      werror(W_TOOMANY_SPILS,"data space", */
/*             _G.dataExtend,currFunc->name,""); */
      _G.dataExtend = 0;
    }

  if (options.dump_rassgn) {
    dumpEbbsToFileExt (DUMP_RASSGN, ebbs, count);
    dumpLiveRanges (DUMP_LRANGE, liveRanges);
  }

  /* after that create the register mask
     for each of the instruction */
  createRegMask (ebbs, count);

  /* now get back the chain */
  ic = iCodeLabelOptimize (iCodeFromeBBlock (ebbs, count));

  ic = joinPushes (ic);

  /* redo that offsets for stacked automatic variables */
  redoStackOffsets ();

  genZ80Code (ic);

  /* free up any stackSpil locations allocated */
  applyToSet (_G.stackSpil, deallocStackSpil);
  _G.slocNum = 0;
  setToNull ((void **) &_G.stackSpil);
  setToNull ((void **) &_G.spiltSet);
  /* mark all registers as free */
  freeAllRegs ();

  return;
}

/** @file izt/ralloc.c
 */
#include "izt.h"

/// Static data.
static struct
  {
    struct
      {
	/// Used to generate a unique name for the spill location.
	int loc;
	/// Set of all iTemps spilt onto the stack.
	set *set;
	/// Similar to stackSpill
	bitVect *vect;
      }
    spill;
    /// Bitvector of all registers used in this function.
    bitVect *funcUsedRegs;
    /// If a bit is set in this then the iCode at that sequence has had
    /// registers allocated.
    bitVect *regAssigned;
    int blockSpill;
    int stackExtend;
  }
_G;

static REG *
_findRegById (REG_ID id)
{
  REG *r = izt_port->regs;

  while (r->size)
    {
      if (r->id == id)
	return r;
      r++;
    }
  wassert (0);
  return NULL;
}

static REG *
_getSubReg (REG * r, int size, int offset)
{
  wassert (r->size >= size);

  if (r->size == size)
    {
      wassert (offset == 0);
      return r;
    }
  // We use the hiding table to get the parts of the register.
  else if (size == 1)
    {
      wassert (offset == 0 || offset == 1);
      return _findRegById (r->hides[offset]);
    }
  else if (size == 2)
    {
      wassert (offset == 0);
      return _findRegById (r->hides[2]);
    }
  // Cant.
  wassert (0);
  return NULL;
}

static int
_numRegsAvailable (int size)
{
  REG *r = izt_port->regs;
  int ret = 0;

  while (r->size)
    {
      if (r->size == size && r->used == 0)
	ret++;
      r++;
    }

  return ret;
}

static void
_setClearUsed (REG_ID id, int clear)
{
  REG *r = _findRegById (id);
  wassert (r);

  if (!clear)
    {
      // The parent shouldnt be able to be allocated if this child
      // is already.
      wassert ((r->used & REG_USED_HIDDEN) == 0);
      r->used |= REG_USED_HIDDEN;
    }
  else
    {
      wassert ((r->used & REG_USED_HIDDEN) != 0);
      r->used &= ~REG_USED_HIDDEN;
    }
}

static void
_markAsUsed (REG_ID id)
{
  _setClearUsed (id, FALSE);
}

static void
_markAsFree (REG_ID id)
{
  _setClearUsed (id, TRUE);
}

static REG *
_allocateReg (int size)
{
  REG *r = izt_port->regs;

  while (r->size)
    {
      if (r->size == size && r->used == 0)
	{
	  // Now go through the interference table and mark all other
	  // registers as used.
	  int i;
	  for (i = 0; i < NUM_OF (r->hides); i++)
	    {
	      if (r->hides[i] == REG_ID_NONE)
		{
		  break;
		}
	      _markAsUsed (r->hides[i]);
	    }
	  r->used |= REG_USED;
	  return r;
	}
      r++;
    }
  return NULL;
}

static bitVect *
_markRegBits (bitVect * v, REG * r)
{
  int i;

  // Mark the primary register.
  v = bitVectSetBit (v, r->id);

  // Now add all the hidden registers.
  for (i = 0; i < NUM_OF (r->hides); i++)
    {
      if (r->hides[i] == REG_ID_NONE)
	{
	  break;
	}
      v = bitVectSetBit (v, r->hides[i]);
    }

  return v;
}

static void
_freeReg (REG * r)
{
  int i;
  wassert (r->used == REG_USED);

  r->used = 0;

  for (i = 0; i < NUM_OF (r->hides); i++)
    {
      if (r->hides[i] == REG_ID_NONE)
	{
	  break;
	}
      _markAsFree (r->hides[i]);
    }
}

static void
_freeAllRegs (viod)
{
  REG *r = izt_port->regs;

  while (r->size)
    {
      r->used = 0;
      r++;
    }
}

static void
_dumpRegs (void)
{
  REG *r = izt_port->regs;

  while (r->size)
    {
      printf ("%u\t%u\t%s\t%u\n", r->size, r->id, r->name, r->used);
      r++;
    }
}

void
izt_init (IZT_PORT * port)
{
  wassert (port && port->regs);
  izt_port = port;
  izt_initEmitters ();
}

/// Lower register pressure by packing iTemps where possible.
static void
_packRegisters (eBBlock * ebp)
{
  // PENDING: Assignment packing
  // PENDING: Mark address of a true symbol as remat.
  // PENDING: Propagate remat through equals.
  // PENDING: Assign bitwise which is followed by a conditional into carry.
  // PENDING: Pack for one use on pointer get or set.  Assumes that the pointer
  //  is stored in the scratch register.
  // PENDING: Pack short use iTemps into ACC or the scratch register.
}

static void
_computeRequiredRegs (void)
{
  symbol *sym;
  int k;

  // Iterate over each live range.
  for (sym = hTabFirstItem (liveRanges, &k); sym;
       sym = hTabNextItem (liveRanges, &k))
    {

      sym->nRegs = 0;

      // If the symbol is never used, then next.
      if ((sym->liveTo - sym->liveFrom) == 0)
	continue;

      // Only temporaries need registers.
      if (!sym->isitmp)
	continue;

      // Conditionals live in carry and dont need registers.
      if (sym->regType == REG_TYPE_CND)
	continue;


#if 0				// PENDING.  Currently we dont compute ruonly or accuse.
      if (sym->ruonly || sym->accuse)
	{
	  if (IS_AGGREGATE (sym->type) || sym->isptr)
	    sym->type = aggrToPtr (sym->type, FALSE);
	  continue;
	}
#endif
      // We need registers.
      if (IS_AGGREGATE (sym->type) || sym->isptr)
	{
	  // Turn an aggregate into something real.
	  sym->type = aggrToPtr (sym->type, FALSE);
	}

      sym->nRegs = getSize (sym->type);
      wassert (sym->nRegs <= 4);
    }
}

static bool
_doesntNeedRegs (iCode * ic)
{
  // Some types of instructions dont need registers.
  // PENDING: Flush out the types and make processor specific.
  if (SKIP_IC2 (ic) ||
      ic->op == JUMPTABLE ||
      ic->op == IFX ||
      ic->op == IPUSH ||
      ic->op == IPOP ||
      ic->op == RETURN)
    {
      return TRUE;
    }
  return FALSE;
}

static bool
_willCauseSpill (int size)
{
  return _numRegsAvailable (size) == 0;
}

static void
_deassignLRs (iCode * ic, eBBlock * ebp)
{
  symbol *sym;
  int ignored;
  symbol *result;

  // For each symbol
  for (sym = hTabFirstItem (liveRanges, &ignored); sym; sym = hTabNextItem (liveRanges, &ignored))
    {

      // Has this symbol expired yet?
      if (sym->liveTo > ic->seq)
	{
	  // No.  Cant deassign.
	  continue;
	}

      // It has expired.  Free up the resources.

      // If it was spilt, then free up the stack spill location.
      if (sym->isspilt)
	{
	  if (sym->stackSpil)
	    {
	      sym->usl.spillLoc->isFree = 1;
	      sym->stackSpil = 0;
	    }
	  continue;
	}

      // If it currently has no registers assigned, then continue.
      if (bitVectBitValue (_G.regAssigned, sym->key) == 0)
	{
	  continue;
	}

      // If it has no registers assigned to it, then continue.
      if (sym->nRegs == 0)
	{
	  continue;
	}

      // Mark this sym as not having registers assigned.
      bitVectUnSetBit (_G.regAssigned, sym->key);

      // Free the registers.
      _freeReg (sym->regs[0]);

      // If deallocating will free up enough registers for this iCode
      // then steal them immediatly.
      if (IC_RESULT (ic) && !_doesntNeedRegs (ic))
	{
	  result = OP_SYMBOL (IC_RESULT (ic));
	  if (result &&		// Has a result
	       result->liveTo > ic->seq &&	// and lives past this instruction
	       result->liveTo <= ebp->lSeq &&	// and doesnt go past this block
	       result->nRegs &&	// and actually needs registers
	       !result->isspilt &&	// and doesnt have them yet
	       !result->remat &&	// and wouldnt waste them
	       !bitVectBitValue (_G.regAssigned, result->key) &&	// doesnt have them yet
	       !_willCauseSpill (result->nRegs)
	    )
	    {
	      result->regs[0] = _allocateReg (result->nRegs);
	    }
	}
    }
}

/// Returns true if the live range of the given symbol doesnt overlap
/// with any of the live ranges in the set.
static bool
_noOverlap (set * itmpStack, symbol * fsym)
{
  symbol *sym;

  for (sym = setFirstItem (itmpStack); sym; sym = setNextItem (itmpStack))
    {
      if (sym->liveTo > fsym->liveFrom)
	{
	  return FALSE;
	}
    }
  return TRUE;
}

/// Set operator that returns 1 if a free spill location is found.
DEFSETFUNC (_stackIsFree)
{
  symbol *sym = item;
  V_ARG (symbol **, sloc);
  V_ARG (symbol *, fsym);

  // Dont bother if one has already been found.
  if (*sloc)
    return 0;

  if (sym->isFree &&		// This location is free...
       _noOverlap (sym->usl.itmpStack, fsym) &&		// and its usage doesnt overlap with the usage of this sym
       getSize (sym->type) >= getSize (fsym->type) &&	// and the location is big enough to hold the sym
       1)
    {
      // All good.  Take this location.
      *sloc = sym;
      return 1;
    }
  else
    {
      // No match.
      return 0;
    }
}

/// Create a new spill location on the stack for this symbol.
symbol *
_createStackSpill (symbol * sym)
{
  symbol *sloc = NULL;

  // Try to reuse an exisiting spill location.
  if (applyToSet (_G.spill.set, _stackIsFree, &sloc, sym))
    {
      // Found one.  Take it over.
      sym->usl.spillLoc = sloc;
      sym->stackSpil = TRUE;
      sloc->isFree = 0;
      addSetHead (&sloc->usl.itmpStack, sym);
      return sym;
    }

  // No existing location.  Time to create one.
  // Give it a pretty name.
  sprintf (buffer, "sloc%d", ++_G.spill.loc);
  // And create.
  sloc = newiTemp (buffer);

  // Setup the type.
  sloc->type = copyLinkChain (sym->type);
  sloc->etype = getSpec (sloc->type);
  SPEC_SCLS (sloc->etype) = S_AUTO;

  allocLocal (sloc);

  // "To prevent compiler warning"
  sloc->isref = 1;

  // Increase the local variable stack size on this function.
  if (IN_STACK (sloc->etype))
    {
      currFunc->stack += getSize (sloc->type);
      _G.stackExtend += getSize (sloc->type);
    }
  else
    {
      // The IZT port currently doesnt support loading locals into data space.
      wassert (0);
    }

  // And add it to the spill set.
  addSetHead (&_G.spill.set, sloc);
  sym->usl.spillLoc = sloc;
  sym->stackSpil = TRUE;

  // "Add it to the set of itempStack set of the spill location
  addSetHead (&sloc->usl.itmpStack, sym);

  return sym;
}

static void
_spillThis (symbol * sym)
{
  // Create a spill location if it needs one and doesnt have one yet.
  if (!(sym->remat || sym->usl.spillLoc))
    {
      _createStackSpill (sym);
    }

  sym->isspilt = TRUE;
  // Add it to the spilt set.
  _G.spill.vect = bitVectSetBit (_G.spill.vect, sym->key);
  // and remove it from the 'has registers' set.
  bitVectUnSetBit (_G.regAssigned, sym->key);

  // Free up any registers that were assigned to this.
  if (sym->regs[0])
    {
      _freeReg (sym->regs[0]);
      sym->regs[0] = NULL;
    }

  // CHECK: If this sym now has a spill location, mark it as allocated
  // so that the stack packing later doesnt remove it.
  if (sym->usl.spillLoc && !sym->remat)
    {
      sym->usl.spillLoc->allocreq = TRUE;
    }

  return;
}

static bitVect *
_findSpillable (iCode * ic)
{
  bitVect *spillable;

  // First create a copy of the currently live ranges.
  spillable = bitVectCopy (ic->rlive);
  // Remove those which are already spilt.
  spillable = bitVectCplAnd (spillable, _G.spill.vect);
  // Remove those that this iCode uses.
  spillable = bitVectCplAnd (spillable, ic->uses);
  // Remove those that this iCode defines.
  bitVectUnSetBit (spillable, ic->defKey);

  // Only those that have registers assigned can actually be spilt :)
  spillable = bitVectIntersect (spillable, _G.regAssigned);

  return spillable;
}

/// Finds the least used live range
static symbol *
_leastUsedLR (set * sset)
{
  // sym is the currently least used symbol.
  symbol *sym;
  // walk walks the list of symbols in the scan set.
  symbol *walk;

  // Use the first as the seed.
  sym = walk = setFirstItem (sset);

  while (walk)
    {
      // Prefer spilling the symbol with the least allocated registers.
      // PENDING: Why?
      if (walk->used == sym->used)
	{
	  if (getSize (walk->type) < getSize (sym->type))
	    {
	      sym = walk;
	    }
	}
      else if (walk->used < sym->used)
	{
	  // This is used less than the current best.  It looses.
	  sym = walk;
	}

      walk = setNextItem (sset);
    }

  setToNull ((void **) &sset);
  sym->blockSpil = 0;

  return sym;
}

/// Applies a function to a given set of live ranges.
static set *
_liveRangesWith (bitVect * lrs, int (func) (symbol *, eBBlock *, iCode *),
		 eBBlock * ebp, iCode * ic)
{
  set *rset = NULL;
  int i;

  // Dont do anything if the bitVect is empty.
  if (!lrs || !lrs->size)
    return NULL;

  for (i = 1; i < lrs->size; i++)
    {
      symbol *sym;

      // If this bit isnt turned on, skip.
      if (!bitVectBitValue (lrs, i))
	continue;

      // If we don't find it in the live range hash table we are in serious trouble.
      if (!(sym = hTabItemWithKey (liveRanges, i)))
	{
	  werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
		  "liveRangesWith could not find liveRange");
	  exit (1);
	}

      // If the function likes it, and it has registers assigned to
      // it, add it to the return set.
      if (func (sym, ebp, ic) && bitVectBitValue (_G.regAssigned, sym->key))
	{
	  addSetHead (&rset, sym);
	}
    }

  return rset;
}

/// Returns TRUE always.  Used to fetch all live ranges.
static int
_allLRs (symbol * sym, eBBlock * ebp, iCode * ic)
{
  return 1;
}

static void
_serialRegAssign (eBBlock ** ebbs, int count)
{
  int i;

  // For each block, do...
  for (i = 0; i < count; i++)
    {
      iCode *ic;

      if (ebbs[i]->noPath &&
	  (ebbs[i]->entryLabel != entryLabel &&
	   ebbs[i]->entryLabel != returnLabel))
	{
	  // PENDING:  Dont understand.
	  continue;
	}


      // For each iCode in this block, do...
      for (ic = ebbs[i]->sch; ic; ic = ic->next)
	{
	  symbol *sym;
	  bitVect *spillable;
	  int willCauseSpill;

	  // Dont support IPOP
	  wassert (ic->op != IPOP);

	  // if result is present && is a true symbol
	  if (IC_RESULT (ic) && ic->op != IFX &&
	      IS_TRUE_SYMOP (IC_RESULT (ic)))
	    OP_SYMBOL (IC_RESULT (ic))->allocreq = 1;

	  // Take away registers from live ranges that end at this
	  // instruction.
	  _deassignLRs (ic, ebbs[i]);

	  // Some instructions dont need registers.
	  if (_doesntNeedRegs (ic))
	    {
	      continue;
	    }

	  // If there is no result, then it doesnt need registers.
	  if (!IC_RESULT (ic))
	    {
	      continue;
	    }

	  sym = OP_SYMBOL (IC_RESULT (ic));

	  // Does it need any registers?
	  if (sym->nRegs == 0)
	    {
	      continue;
	    }

	  // Is it already split?
	  if (sym->isspilt)
	    {
	      continue;
	    }

	  // Does it already have registers assigned?
	  if (bitVectBitValue (_G.regAssigned, sym->key))
	    {
	      continue;
	    }

	  // Will it live past this instruction?
	  if (sym->liveTo <= ic->seq)
	    {
	      continue;
	    }

	  // MLH Doesnt understand this.
	  /* "Iif some liverange has been spilt at the block level
	     and this one live beyond this block then spil this
	     to be safe" */
	  if (_G.blockSpill && sym->liveTo > ebbs[i]->lSeq)
	    {
	      _spillThis (sym);
	      continue;
	    }

	  // Seems that this symbol needs registers.  See if 
	  // allocating will cause a spill.
	  willCauseSpill = _willCauseSpill (sym->nRegs);
	  spillable = _findSpillable (ic);

	  // If this is remat., then dont waste any regsiters on it.
	  if (sym->remat)
	    {
	      _spillThis (sym);
	      continue;
	    }

	  // If trying to allocate will cause a spill, and nothing
	  // else is spillable then this sym looses.
	  if (willCauseSpill && bitVectIsZero (spillable))
	    {
	      _spillThis (sym);
	      continue;
	    }

	  // If this will cause a spill, and it already has a spill
	  // location then spill this if it is the least used.
	  if (willCauseSpill && sym->usl.spillLoc)
	    {
	      symbol *leastUsed = _leastUsedLR (_liveRangesWith (spillable, _allLRs, ebbs[i], ic));
	      if (leastUsed && leastUsed->used > sym->used)
		{
		  _spillThis (sym);
		  continue;
		}
	    }

	  // Hmm.  Here we could have no registers available but
	  // we'll still try to allocate.  MLH wonders how this will
	  // work.

	  // Mark this iCode as having registers assigned to it.
	  _G.regAssigned = bitVectSetBit (_G.regAssigned, sym->key);

	  // And do it.
	  sym->regs[0] = _allocateReg (sym->nRegs);
	}
    }
}

static
DEFSETFUNC (_deallocStackSpil)
{
  symbol *sym = item;

  deallocLocal (sym);
  return 0;
}

/// Compute the register mask for an operand.
bitVect *
_rUmaskForOp (operand * op)
{
  bitVect *rumask;
  symbol *sym;

  // "Only temporaries are assigned registers"
  if (!IS_ITEMP (op))
    return NULL;

  sym = OP_SYMBOL (op);

  // If its spilt or no registers are needed, then no regs are assigned.
  if (sym->isspilt || !sym->nRegs)
    return NULL;

  rumask = newBitVect (REG_ID_MAX);

  if (sym->regs[0])
    {
      rumask = _markRegBits (rumask, sym->regs[0]);
    }

  return rumask;
}

/// Returns bit vector of registers used in iCode.
bitVect *
_regsUsedIniCode (iCode * ic)
{
  bitVect *rmask = newBitVect (REG_ID_MAX);

  do
    {
      // Special cases first.
      if (ic->op == IFX)
	{
	  rmask = bitVectUnion (rmask, _rUmaskForOp (IC_COND (ic)));
	  break;
	}

      if (ic->op == JUMPTABLE)
	{
	  rmask = bitVectUnion (rmask, _rUmaskForOp (IC_JTCOND (ic)));
	  break;
	}

      // Now the good old left, right, and result.
      if (IC_LEFT (ic))
	{
	  rmask = bitVectUnion (rmask, _rUmaskForOp (IC_LEFT (ic)));
	}

      if (IC_RIGHT (ic))
	{
	  rmask = bitVectUnion (rmask, _rUmaskForOp (IC_RIGHT (ic)));
	}

      if (IC_RESULT (ic))
	{
	  rmask = bitVectUnion (rmask, _rUmaskForOp (IC_RESULT (ic)));
	}
    }
  while (0);

  return rmask;
}

/// Compute the helper bitVect that contains the register used mask.
static void
_createRegMask (eBBlock ** ebbs, int count)
{
  int i;

  /* for all blocks */
  for (i = 0; i < count; i++)
    {
      iCode *ic;

      // If this code is unused, skip it.
      if (ebbs[i]->noPath &&
	  (ebbs[i]->entryLabel != entryLabel &&
	   ebbs[i]->entryLabel != returnLabel))
	{
	  continue;
	}

      /* for all instructions */
      for (ic = ebbs[i]->sch; ic; ic = ic->next)
	{
	  int j;

	  if (SKIP_IC2 (ic) || !ic->rlive)
	    continue;

	  // Mark the registers used in this instruction.
	  ic->rUsed = _regsUsedIniCode (ic);
	  // Mark them as used at least once in the function.
	  _G.funcUsedRegs = bitVectUnion (_G.funcUsedRegs, ic->rUsed);

	  /* now create the register mask for those 
	     registers that are in use : this is a
	     super set of ic->rUsed */
	  ic->rMask = newBitVect (REG_ID_MAX + 1);

	  // "For all live Ranges alive at this point"
	  for (j = 1; j < ic->rlive->size; j++)
	    {
	      symbol *sym;

	      // "If if not alive then continue"
	      if (!bitVectBitValue (ic->rlive, j))
		{
		  continue;
		}

	      // "Find the live range we are interested in"
	      if (!(sym = hTabItemWithKey (liveRanges, j)))
		{
		  werror (E_INTERNAL_ERROR, __FILE__, __LINE__,
			  "createRegMask cannot find live range");
		  exit (0);
		}

	      // "If no register assigned to it"
	      if (!sym->nRegs || sym->isspilt)
		{
		  continue;
		}

	      // If this has any registers allocated, mark them as such.
	      if (sym->regs[0])
		{
		  ic->rMask = _markRegBits (ic->rMask, sym->regs[0]);
		}
	    }
	}
    }
}

void
izt_assignRegisters (eBBlock ** ebbs, int count)
{
  // Contains a flat version of ebbs used in code generation.
  iCode *chain;

  // Clear the bit vector of registers used in this function.
  // Assumes that assignRegisters is called once per function.
  setToNull ((void *) &_G.funcUsedRegs);

  // First scan each live range, and figure out what registers
  // are required.
  _computeRequiredRegs ();

  // Now allocate the registers.
  _serialRegAssign (ebbs, count);

  // And create the helper register used mask.
  _createRegMask (ebbs, count);

  // Turn the bblock array into an optimised list of iCode entries.
  chain = iCodeLabelOptimize (iCodeFromeBBlock (ebbs, count));

  // Redo the stack offsets.  This will remove any redundent stack
  // locations ie iTemps that exist only in registers.
  redoStackOffsets ();

  izt_gen (chain);

  // Deallocate any stack spill locations.
  applyToSet (_G.spill.set, _deallocStackSpil);

  _G.spill.loc = 0;
  setToNull ((void **) &_G.spill.set);
  setToNull ((void **) &_G.spill.vect);

  // And free all registers.
  _freeAllRegs ();
}

void
warningStopper (void)
{
  // For now references all unused functions.
  _dumpRegs ();
  _packRegisters (NULL);
  _getSubReg (NULL, 0, 0);
}

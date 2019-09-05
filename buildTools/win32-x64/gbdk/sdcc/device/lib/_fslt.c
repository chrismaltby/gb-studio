/*
** libgcc support for software floating point.
** Copyright (C) 1991 by Pipeline Associates, Inc.  All rights reserved.
** Permission is granted to do *anything* you want with this file,
** commercial or otherwise, provided this message remains intact.  So there!
** I would appreciate receiving any updates/patches/changes that anyone
** makes, and am willing to be the repository for said changes (am I
** making a big mistake?).

Warning! Only single-precision is actually implemented.  This file
won't really be much use until double-precision is supported.

However, once that is done, this file might eventually become a
replacement for libgcc1.c.  It might also make possible
cross-compilation for an IEEE target machine from a non-IEEE
host such as a VAX.

If you'd like to work on completing this, please talk to rms@gnu.ai.mit.edu.


**
** Pat Wood
** Pipeline Associates, Inc.
** pipeline!phw@motown.com or
** sun!pipeline!phw or
** uunet!motown!pipeline!phw
**
** 05/01/91 -- V1.0 -- first release to gcc mailing lists
** 05/04/91 -- V1.1 -- added float and double prototypes and return values
**                  -- fixed problems with adding and subtracting zero
**                  -- fixed rounding in truncdfsf2
**                  -- fixed SWAP define and tested on 386
*/

/*
** The following are routines that replace the libgcc soft floating point
** routines that are called automatically when -msoft-float is selected.
** The support single and double precision IEEE format, with provisions
** for byte-swapped machines (tested on 386).  Some of the double-precision
** routines work at full precision, but most of the hard ones simply punt
** and call the single precision routines, producing a loss of accuracy.
** long long support is not assumed or included.
** Overall accuracy is close to IEEE (actually 68882) for single-precision
** arithmetic.  I think there may still be a 1 in 1000 chance of a bit
** being rounded the wrong way during a multiply.  I'm not fussy enough to
** bother with it, but if anyone is, knock yourself out.
**
** Efficiency has only been addressed where it was obvious that something
** would make a big difference.  Anyone who wants to do this right for
** best speed should go in and rewrite in assembler.
**
** I have tested this only on a 68030 workstation and 386/ix integrated
** in with -msoft-float.
*/

/* the following deal with IEEE single-precision numbers */
#define EXCESS		126
#define SIGNBIT		((unsigned long)0x80000000)
#define HIDDEN		(unsgined long)(1 << 23)
#define SIGN(fp)	((fp >> (8*sizeof(fp)-1)) & 1)
#define EXP(fp)		(((fp) >> 23) & (unsigned int)0x00FF)
#define MANT(fp)	(((fp) & (unsigned long)0x007FFFFF) | HIDDEN)
#define PACK(s,e,m)	((s) | ((e) << 23) | (m))

union float_long
  {
    float f;
    long l;
  };

/* compare two floats */
char
__fslt (float a1, float a2)
{
  volatile union float_long fl1, fl2;

  fl1.f = a1;
  fl2.f = a2;

  if (SIGN (fl1.l) && SIGN (fl2.l))
    {
      fl1.l ^= SIGNBIT;
      fl2.l ^= SIGNBIT;
    }
  if (fl1.l < fl2.l)
    return (1);
  return (0);
}

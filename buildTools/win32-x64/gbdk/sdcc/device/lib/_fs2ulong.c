/*
** libgcc support for software floating point.
** Copyright (C) 1991 by Pipeline Associates, Inc.  All rights reserved.
** Permission is granted to do *anything* you want with this file,
** commercial or otherwise, provided this message remains intact.  So there!
** I would appreciate receiving any updates/patches/changes that anyone
** makes, and am willing to be the repository for said changes (am I
** making a big mistake?).
**
** Pat Wood
** Pipeline Associates, Inc.
** pipeline!phw@motown.com or
** sun!pipeline!phw or
** uunet!motown!pipeline!phw
*/

/* (c)2000: hacked a little by johan.knol@iduna.nl for sdcc */

#include <limits.h>

/* the following deal with IEEE single-precision numbers */
#define EXCESS		126
#define SIGNBIT		((unsigned long)0x80000000)
#define HIDDEN		(unsigned long)(1 << 23)
#define SIGN(fp)	((fp >> (8*sizeof(fp)-1)) & 1)
#define EXP(fp)		(((fp) >> 23) & (unsigned int) 0x00FF)
#define MANT(fp)	(((fp) & (unsigned long) 0x007FFFFF) | HIDDEN)
#define PACK(s,e,m)	((s) | ((e) << 23) | (m))

union float_long
{
  float f;
  long l;
};

/* convert float to unsigned long */
unsigned long 
__fs2ulong (float a1)
{
  volatile union float_long fl1;
  volatile int exp;
  volatile long l;
  
  fl1.f = a1;
  
  if (!fl1.l || SIGN(fl1.l))
    return (0);

  if (a1>=ULONG_MAX)
    return ULONG_MAX;

  exp = EXP (fl1.l) - EXCESS - 24;
  l = MANT (fl1.l);
  
  l >>= -exp;

  return l;
}





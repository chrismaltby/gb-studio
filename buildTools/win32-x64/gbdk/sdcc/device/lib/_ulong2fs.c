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

/* the following deal with IEEE single-precision numbers */
#define EXCESS		126
#define SIGNBIT		((unsigned long)0x80000000)
#define HIDDEN		(unsigned long)(1 << 23)
#define SIGN(fp)	((fp) & SIGNBIT)
#define EXP(fp)		(((fp) >> 23) & (unsigned int) 0x00FF)
#define MANT(fp)	(((fp) & (unsigned long)0x007FFFFF) | HIDDEN)
#define PACK(s,e,m)	((s) | ((e) << 23) | (m))

union float_long
  {
    float f;
    long l;
  };

float 
__ulong2fs (unsigned long a )
{
  int exp = 24 + EXCESS;
  volatile union float_long fl;

  if (!a)
    {
      return 0.0;
    }

  while (a < HIDDEN)
    {
      a <<= 1;
      exp--;
    }

   a &= ~HIDDEN ;
  /* pack up and go home */
  fl.l = PACK(0,(unsigned long)exp, a);

  return (fl.f);
}

/* the following deal with IEEE single-precision numbers */
#define EXCESS          126
#define SIGNBIT         ((unsigned long)0x80000000)
#define HIDDEN          (unsigned long)(1 << 23)
#define SIGN(fp)        ((fp >> (8*sizeof(fp)-1)) & 1) 
#define EXP(fp)         (((fp) >> 23) & (unsigned int)0x00FF)
#define MANT(fp)        (((fp) & (unsigned long)0x007FFFFF) | HIDDEN)
#define PACK(s,e,m)     ((s) | ((e) << 23) | (m))

union float_long
  {
    float f;
    long l;
  };
/* add two floats */
float
__fsadd (float a1, float a2)
{
  volatile long mant1, mant2;
  volatile union float_long fl1, fl2;
  volatile int exp1, exp2;
  volatile long sign = 0;

  fl1.f = a1;
  fl2.f = a2;

  /* check for zero args */
  if (!fl1.l)
    return (fl2.f);
  if (!fl2.l)
    return (fl1.f);

  exp1 = EXP (fl1.l);
  exp2 = EXP (fl2.l);

  if (exp1 > exp2 + 25)
    return (fl1.l);
  if (exp2 > exp1 + 25)
    return (fl2.l);

  /* do everything in excess precision so's we can round later */
  mant1 = MANT (fl1.l) << 6;
  mant2 = MANT (fl2.l) << 6;

  if (SIGN (fl1.l))
    mant1 = -mant1;
  if (SIGN (fl2.l))
    mant2 = -mant2;

  if (exp1 > exp2)
    {
      mant2 >>= exp1 - exp2;
    }
  else
    {
      mant1 >>= exp2 - exp1;
      exp1 = exp2;
    }
  mant1 += mant2;

  if (mant1 < 0)
    {
      mant1 = -mant1;
      sign = SIGNBIT;
    }
  else if (!mant1)
    return (0);

  /* normalize up */
  while (!(mant1 & (unsigned long) 0xE0000000))
    {
      mant1 <<= 1;
      exp1--;
    }

  /* normalize down? */
  if (mant1 & (unsigned long)(1 << 30))
    {
      mant1 >>= 1 ;
      exp1++;
    }

  /* round to even */
  mant1 += (mant1 & (unsigned long)0x40) ? (unsigned long) 0x20 : (unsigned long) 0x1F;

  /* normalize down? */
  if (mant1 & (unsigned long)(1 << 30))
    {
      mant1 >>= 1;
      exp1++;
    }

  /* lose extra precision */
  mant1 >>= 6;

  /* turn off hidden bit */
  mant1 &= ~HIDDEN;

  /* pack up and go home */
  fl1.l = PACK (sign, (unsigned long) exp1, mant1);
  return (fl1.f);
}

/** @file z80/support.c
 */
#include "z80.h"
#include <math.h>

int
convertFloat (Z80_FLOAT * f, double native)
{
  unsigned long mantissa, exponent;
  double f2;
  wassert (f);
  if (native != 0)
    {
      f2 = floor (log (fabs (native)) / log (2)) + 1;
      mantissa = (unsigned long) (0x1000000 * fabs (native) / exp (f2 * log (2))) ;
      mantissa &= 0xffffff;
      exponent = (unsigned long) (f2 + 0x40) ;
      if (native < 0)
	exponent |= 0x80;
    }
  else
    {
      mantissa = 0;
      exponent = 0;
    }

  f->w[0] = (WORD) mantissa;
  f->w[1] = (BYTE) (mantissa >> 16);
  f->w[1] |= exponent << 8;

  f->b[0] = (BYTE) f->w[0];
  f->b[1] = (BYTE) (f->w[0] >> 8);
  f->b[2] = (BYTE) f->w[1];
  f->b[3] = (BYTE) (f->w[1] >> 8);

  return 0;
}

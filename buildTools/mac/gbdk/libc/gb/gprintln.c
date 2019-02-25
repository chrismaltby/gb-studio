#include <gb/drawing.h>

/* Print a long number in any radix */

extern char *digits;

void gprintln(INT16 number, INT8 radix, INT8 signed_value)
{
  UINT16 l;

  if(number < 0 && signed_value) {
    wrtchr('-');
    number = -number;
  }
  if((l = (UINT16)number / (UINT16)radix) != 0)
    gprintln(l, radix, UNSIGNED);
  wrtchr(digits[(UINT16)number % (UINT16)radix]);
}

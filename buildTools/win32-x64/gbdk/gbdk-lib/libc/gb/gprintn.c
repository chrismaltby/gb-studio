#include <gb/drawing.h>

/* Print a number in any radix */

extern char *digits;

void gprintn(BYTE number, BYTE radix, BYTE signed_value)
{
  UBYTE i;

  if(number < 0 && signed_value) {
    wrtchr('-');
    number = -number;
  }
  if((i = (UBYTE)number / (UBYTE)radix) != 0)
    gprintn(i, radix, UNSIGNED);
  wrtchr(digits[(UBYTE)number % (UBYTE)radix]);
}

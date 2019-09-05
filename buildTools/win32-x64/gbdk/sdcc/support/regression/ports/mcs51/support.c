// #define MICROCONTROLLER_8051 
#include <mcs51reg.h>

void
_putchar (char c)
{
  SBUF = c;
}

void
_exitEmu (void)
{
  * (char idata *) 0 = * (char xdata *) 0x7654;
}

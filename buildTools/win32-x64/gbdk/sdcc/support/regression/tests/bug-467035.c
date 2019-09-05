/* Tests a bug in for loops where b in plot_point is always 1.
   Stripped down from the gbdk filltest.c
 */
#include <testfwk.h>

typedef unsigned char UBYTE;

UBYTE 
getpix(UBYTE x, UBYTE y)
{
  UNUSED(x);
  UNUSED(y);

  return 0;
}

void 
color(UBYTE a, UBYTE b, UBYTE c)
{
  UNUSED(a & b & c);
}

void 
line(UBYTE a, UBYTE b, UBYTE c, UBYTE d)
{
  UNUSED(a & b & c & d);
}

void 
plot_point(UBYTE a, UBYTE b)
{
  static UBYTE ea, eb;

  ASSERT(b == eb);
  ASSERT(a == ea);

  ea++;
  if (ea > 12) {
    ea = 0;
    eb++;
  }
  LOG(("(a, b) -> (%u, %u)\n", (unsigned int)a, (unsigned int)b));
}

void
testForMerge(void)
{
  UBYTE  a,b;

  for (b=0; b<=10U; b++) {
    for (a=0; a<=12U; a++) {
      color(getpix(a,b+1), 0, 1);
      plot_point(a,b);
    }
    color(0, 0, 1);
  }
}

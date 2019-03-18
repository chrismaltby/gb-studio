#include "Math.h"

UBYTE ClampUBYTE(UBYTE v, UBYTE min, UBYTE max)
{
  UBYTE t;
  t = v < min ? min : v;
  return t > max ? max : t;
}

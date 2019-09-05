/** Test long OR.
    Was a bug where 1 was turned into 0x10000 on PPC.
 */
#include <testfwk.h>

void
testLongOR(void)
{
  volatile unsigned long l;

  l = 0;
  l |= 1L;
  ASSERT(l == 1);

  l = 0;
  l |= 1;
  ASSERT(l == 1);
}

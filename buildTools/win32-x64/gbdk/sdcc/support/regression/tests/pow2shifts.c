/* Test power of 2 based shifts.
   sign: signed, unsigned
 */
#include <testfwk.h>

void
testIntShift(void)
{
  volatile {sign} int left;

  left = 4;
  ASSERT(left * 1024 == 4096);
  ASSERT(left * 2048 == 8192);
  ASSERT(left * 256 == 1024);
  ASSERT(left * 64 == 256);

  left = 4096;
  ASSERT(left / 1024 == 4);
  ASSERT(left / 2048 == 2);
  ASSERT(left / 256 == 16);
  ASSERT(left / 4 == 1024);
}

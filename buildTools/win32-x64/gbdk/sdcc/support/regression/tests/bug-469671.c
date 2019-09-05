/* bug 469671.c

   storage: static, 
 */
#include <testfwk.h>

void
testMul(void)
{
  {storage} volatile int a, b;

  a = 5;
  b = a*2;
  ASSERT(b == 10);

  a = -33;
  b = a*2;
  ASSERT(b == -66);
}

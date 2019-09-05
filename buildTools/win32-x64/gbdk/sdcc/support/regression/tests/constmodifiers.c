/* Tests usage of constant modifiers.
 */
#include <testfwk.h>

void
testUMod(void)
{
  volatile unsigned char a = 0;

  ASSERT((a |= 0xFFL) == 0xFFL);
}

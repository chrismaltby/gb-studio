/* Tests that a cast used as a parameter gets packed into
   HL
*/
#include <testfwk.h>

void
spoil(int a)
{
  UNUSED(a);
}

void
testCastPack(char x)
{
  int i, j;
  volatile char a = x;

  for (i = 0; i < 5; i++)
    {
      for (j = 0; j < 5; j++)
        {
          spoil(a);
        }
    }
}

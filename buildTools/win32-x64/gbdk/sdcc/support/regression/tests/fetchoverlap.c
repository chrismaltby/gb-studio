/* Test to reproduce a bug in the z80 compiler where A is used as the
   left and right of an operand.
*/
#include <testfwk.h>
#include <string.h>

/* In the previous bug, both *p and val in the compare operation were
   assigned into A due to *p being packed for ACC use into A.
*/
int
verifyBlock(char *p, char val, int len)
{
  while (len--) {
    if (*p++ != val) {
      return 0;
    }
  }
  return 1;
}

void
testOverlap(void)
{
  char buf[20];
  memset(buf, 12, sizeof(buf));

  buf[12] = 13;
  ASSERT(!verifyBlock(buf, 12, sizeof(buf)));

  buf[12] = 12;
  ASSERT(verifyBlock(buf, 12, sizeof(buf)));
}


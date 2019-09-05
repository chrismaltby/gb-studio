/* bug 460444
 */
#include <testfwk.h>

void
testXOR(void)
{
  volatile int p = 5;
  
  if (p ^ 0x60) {
    // Good.
  }
  else {
    FAIL();
  }

  /* Test is to see if it compiles. */
  ASSERT((p^0x60) == 0x65);
  ASSERT((p&0x61) == 0x01);
  ASSERT((p|0x60) == 0x65);

  p = 0x1234;
  if (p ^ 0x5678) {
    // Good.
  }
  else {
    FAIL();
  }

  if (p & 0x4324) {
    // Good
  }
  else {
    FAIL();
  }

  if (p | 0x1279) {
    // Good
  }
  else {
    FAIL();
  }
}

void
testLeftRightXor(void)
{
  volatile int left, right;

  left = 0x123;
  right = 0x8101;

  if (left ^ right) {
    // Good
  }
  else {
    FAIL();
  }

  if (left & right) {
    // Good
  }
  else {
    FAIL();
  }

  if (left | right) {
    // Good
  }
  else {
    FAIL();
  }
}

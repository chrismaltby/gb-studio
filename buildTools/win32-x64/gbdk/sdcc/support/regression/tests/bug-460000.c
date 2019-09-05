/* bug 460000
 */
#include <testfwk.h>

int 
func( int a )
{
  return a;
}

int x = -1024; 

void 
testByteShift(void) 
{ 
  ASSERT(func( x >> 8 ) == -4);
  ASSERT(func( x / 256 ) == -4);
} 

void
testOtherSignedShifts(void)
{
  volatile int left;

  left = -2345;
  ASSERT(left >> 3 == (-2345>>3));
  ASSERT(left >> 8 == (-2345>>8));
  ASSERT(left >> 9 == (-2345>>9));
}

void
testShiftByParam(void)
{
  volatile int left, count;

  left = -2345;

  count = 3;
  ASSERT(left >> count == (-2345>>3));
  count = 8;
  ASSERT(left >> count == (-2345>>8));
  count = 9;
  ASSERT(left >> count == (-2345>>9));
}

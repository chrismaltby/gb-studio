/* bug-221100.c

   If test_index is char, loses high bit when indexes table 
   workaround is to use [(unsigned int) test_index] 
 */
#include <testfwk.h>

#ifdef __mcs51
xdata
#endif
static unsigned int
testArray[130];

static unsigned int test_int ; 
static unsigned char test_index ; 

static void 
fetch(void) 
{ 
  test_int = testArray [test_index] ; 
} 

static void
testUnsignedCharIndex(void)
{
  int i;
  for (i = 0; i < 130; i++) {
    testArray[i] = i;
  }

  test_index = 5;
  fetch();
  ASSERT(test_int == 5);

  test_index = 129;
  fetch();
  ASSERT(test_int == 129);
}

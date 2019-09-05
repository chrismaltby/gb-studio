/* bug-435214.c
 */
#include <testfwk.h>

static 
unsigned int divide(long a)
{
    return a/512ul;
}

static void
testDivide()
{
    assert(divide(1300) == 2);
    assert(divide(0x12345678) == 0x91A2B);
}


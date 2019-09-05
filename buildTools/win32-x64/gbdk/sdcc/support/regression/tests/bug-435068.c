/* bug-435068.c
 */
#include <testfwk.h>

char c, d; 

static void
testQuestion(void)
{
    volatile char c, d;

    c = (0x100 & 0x100) ? 4 : 8; // ok 
    d = ((0x100 & 0x100) ? 4 : 8) + 1; 

    ASSERT(c == 4);
    ASSERT(d == 5);
} 

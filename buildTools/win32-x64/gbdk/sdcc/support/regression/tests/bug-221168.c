/* bug-221168.c
 */
#include <testfwk.h>

#ifdef __mcs51
#  define XDATA xdata
#else
#  define XDATA
#endif

XDATA static char x[10][20];

XDATA char *
getAddrOfCell(unsigned char y, unsigned char z)
{
    return &x[y][z];
}

static void
testMultiDimensionalAddress(void)
{
    ASSERT(getAddrOfCell(5, 6) == (char XDATA *)x + 106);
}

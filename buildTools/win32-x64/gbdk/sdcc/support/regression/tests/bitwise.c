/** Test the bitwise operators.
    
    type: char, int, long
    attr: volatile,
    storage: static,
 */
#include <testfwk.h>

static void
testTwoOpBitwise(void)
{
    {storage} {attr} {type} left, right;

    left = ({type})0x3df7;
    right = ({type})0xc1ec;

    ASSERT(({type})(left & right) == ({type})0x1E4);
    ASSERT(({type})(right & left) == ({type})0x1E4);
    ASSERT(({type})(left & 0xc1ec) == ({type})0x1E4);
    ASSERT(({type})(0x3df7 & right) == ({type})0x1E4);

    ASSERT(({type})(left | right) == ({type})0xFDFF);
    ASSERT(({type})(right | left) == ({type})0xFDFF);
    ASSERT(({type})(left | 0xc1ec) == ({type})0xFDFF);
    ASSERT(({type})(0x3df7 | right) == ({type})0xFDFF);

    ASSERT(({type})(left ^ right) == ({type})0xFC1B);
    ASSERT(({type})(right ^ left) == ({type})0xFC1B);
    ASSERT(({type})(left ^ 0xc1ec) == ({type})0xFC1B);
    ASSERT(({type})(0x3df7 ^ right) == ({type})0xFC1B);
}

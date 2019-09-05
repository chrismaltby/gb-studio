/** Tests covering the shift operators.

    sign: signed, unsigned
    type: char, int, long
    storage: static, 
    attr: volatile

    vals: 3

    pending - 1792, 851968, 1560281088, -3, -1792, -851968, -1560000000
*/
#include <testfwk.h>

void
testShiftClasses(void)
{
    {attr} {storage} {sign} {type} i, result;

    i = 30;
    ASSERT(i>>3 == 3);
    ASSERT(i<<2 == 120);
    
    result = i;
    result >>= 2;
    ASSERT(result == 7);

    result = i;
    result <<= 2;
    ASSERT(result == 120);
}

void
testShiftRight(void)
{
    {attr} {storage} {type} i, result;

    i = -120;
    ASSERT(i>>2 == -30);

    result = i;
    result >>= 3;
    ASSERT(result == -15); 
}

/** PENDING: Disabled. */
static void
testShiftByteMultiples(void)
{
#if 0
    /* PENDING */
    {attr} {storage} {type} i;

    i = ({type}){vals};
    ASSERT(i>>8  == (({type}){vals} >> 8));
    ASSERT(i>>16 == (({type}){vals} >> 16));
    ASSERT(i>>24 == (({type}){vals} >> 24));

    i = ({type}){vals};
    ASSERT(i<<8  == (({type}){vals} << 8));;
    ASSERT(i<<16 == (({type}){vals} << 16));
    ASSERT(i<<24 == (({type}){vals} << 24));
#endif
}

static void
testShiftOne(void)
{
    {attr} {storage} {sign} {type} i;
    {sign} {type} result;

    i = ({type}){vals};

    result = i >> 1;
    ASSERT(result == ({type})(({type}){vals} >> 1));

    result = i;
    result >>= 1;
    ASSERT(result == ({type})(({type}){vals} >> 1));

    result = i << 1;
    ASSERT(result == ({type})(({type}){vals} << 1));

    result = i;
    result <<= 1;
    ASSERT(result == ({type})(({type}){vals} << 1));
}

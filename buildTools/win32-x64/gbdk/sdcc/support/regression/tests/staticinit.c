/** Tests that the static initialiser code works.
    As the init code is now clever we have to be careful.

    type: char, int, long
*/
#include <testfwk.h>

static {type} smallDense[] = {
    1, 2, 3, 4, 5, 6
};

static void
testSmallDense(void)
{
    ASSERT(smallDense[0] == 1);
    ASSERT(smallDense[1] == 2);
    ASSERT(smallDense[2] == 3);
    ASSERT(smallDense[3] == 4);
    ASSERT(smallDense[4] == 5);
    ASSERT(smallDense[5] == 6);
}

#ifdef __mcs51
idata at 0xa0	/* leave space for the stack */
#endif
static {type} smallSparse[] = {
    1, 1, 1, 1, 1, 1, 1, 1, 1
};

static void
testSmallSparse(void)
{
    ASSERT(smallSparse[0] == 1);
    ASSERT(smallSparse[1] == 1);
    ASSERT(smallSparse[2] == 1);
    ASSERT(smallSparse[3] == 1);
    ASSERT(smallSparse[4] == 1);
    ASSERT(smallSparse[5] == 1);
    ASSERT(smallSparse[6] == 1);
    ASSERT(smallSparse[7] == 1);
    ASSERT(smallSparse[8] == 1);
}

#ifdef __mcs51
idata at 0xd0
#endif
static {type} smallSparseZero[] = {
    0, 0, 0, 0, 0, 0, 0, 0, 0
};

static {type} smallSparseZeroTail[] = {
    1, 2, 3
};

static void
testSmallSparseZero(void)
{
    ASSERT(smallSparseZero[0] == 0);
    ASSERT(smallSparseZero[1] == 0);
    ASSERT(smallSparseZero[2] == 0);
    ASSERT(smallSparseZero[3] == 0);
    ASSERT(smallSparseZero[4] == 0);
    ASSERT(smallSparseZero[5] == 0);
    ASSERT(smallSparseZero[6] == 0);
    ASSERT(smallSparseZero[7] == 0);
    ASSERT(smallSparseZero[8] == 0);

    // Make the compiler happy
    ASSERT(smallSparseZeroTail[0] == 1);
}

#ifdef __mcs51
xdata
#endif
static {type} largeMixed[] = {
    1, 2, 3, 4, 5, 6, 7,	/* 0-6 */
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,	/* 8*12 = 96+7 = -102 */
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    3, 4, 5, 6, 3, 4, 5, 6,	/* 8*17 = 136+7 */
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6,
    3, 4, 5, 6, 3, 4, 5, 6
};

static void
testLargeMixed(void)
{
    ASSERT(largeMixed[0] == 1);
    ASSERT(largeMixed[1] == 2);
    ASSERT(largeMixed[7] == 1);
    ASSERT(largeMixed[102] == 1);
    ASSERT(largeMixed[143] == 3);
    ASSERT(largeMixed[143+8] == 3);
    ASSERT(largeMixed[143+16] == 3);
    ASSERT(largeMixed[143+1] == 4);
    ASSERT(largeMixed[143+8+1] == 4);
    ASSERT(largeMixed[143+16+1] == 4);
}

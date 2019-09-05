/** Tests the basic logical operations.

    type: char, int, long
    storage: static, 
    attr: volatile
    values: 5, 350, 31734
 */
#include <testfwk.h>

static {type}
alwaysTrue(void)
{
    return ({type}){values};
}

static {type}
alwaysFalse(void)
{
    return 0;
}

static {type}
neverGetHere(void)
{
    FAILM("Shouldn't get here");
    return 0;
}

static int hit;

static void
resetGetHere(void)
{
    hit = 0;
}

static {type}
alwaysGetHere(void)
{
    hit++;
    return 1;
}

static void
testLogicalAnd(void)
{
    {type} true = alwaysTrue();
    {type} false = alwaysFalse();

    ASSERT(true && true && true);
    ASSERT(true && !false);
    ASSERT(!false && true);

#if 1
    /* PENDING: Doesn't work. */
    /* Test that the evaluation is aborted on the first false. */
    if (true && false && neverGetHere()) {
        /* Tested using neverGetHere() */
    }
#else
    /* Alternate that is similar. */
    if (true && false) {
        neverGetHere();
        /* Tested using neverGetHere() */
    }
#endif

    resetGetHere();
    /* Test that the evaluation is done left to right. */
    if (alwaysGetHere() && true && false) {
        ASSERT(hit == 1);
    }
}

static void
testLogicalOr(void)
{
    {type} true = alwaysTrue();
    {type} false = alwaysFalse();

    ASSERT(false || false || true);
    ASSERT(!true || !false);
    ASSERT(false || true);

#if 0
    /* PENDING: Doesn't work in sdcc. */
    /* Test that the evaluation is aborted on the first hit. */
    if (false || true || neverGetHere()) {
        /* Tested using neverGetHere() */
    }
#else
    /* No equivalent. */
#endif

    resetGetHere();
    /* Test that the evaluation is done left to right. */
    if (alwaysGetHere() || true || false) {
        ASSERT(hit == 1);
    }
}

static void
testNot(void)
{
    {type} true = alwaysTrue();
    {type} false = alwaysFalse();

    ASSERT(!false);
    ASSERT(!!true);
    ASSERT(!!!false);
}

static void
testFlagToVariable(void)
{
    {type} true = alwaysTrue();
    {type} false = alwaysFalse();
    {type} val = !true;

    ASSERT(!val);
    val = !!false;
    ASSERT(!false);
}

/** Tests argument passing to functions.
    Assumes that up to the first two arguments can be passed in registers.

    type1: char, int, long
    type2: char, int, long
    type3: char, int, long
 */
#include <testfwk.h>

static {type1}
returnFirstArg({type1} arg1, {type2} arg2, {type3} arg3)
{
    UNUSED(arg2);
    UNUSED(arg3);
    return arg1;
}

static {type2}
returnSecondArg({type1} arg1, {type2} arg2, {type3} arg3)
{
    UNUSED(arg1);
    UNUSED(arg3);
    return arg2;
}

static {type3}
returnThirdArg({type1} arg1, {type2} arg2, {type3} arg3)
{
    UNUSED(arg1);
    UNUSED(arg2);
    return arg3;
}

static void
testArgs(void)
{
    ASSERT(returnFirstArg(123, 45, 67) == 123);
    ASSERT(returnFirstArg(-123, 45, 67) == -123);

    ASSERT(returnSecondArg(1, -23, 64) == -23);
    ASSERT(returnSecondArg(1, 8, 64) == 8);

    ASSERT(returnThirdArg(-33, -34, -35) == -35);
    ASSERT(returnThirdArg(-33, -34, 35) == 35);

}

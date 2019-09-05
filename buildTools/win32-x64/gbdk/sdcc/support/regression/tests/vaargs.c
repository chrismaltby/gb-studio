/** Tests argument passing to functions via va_args.
    Assumes that up to the first two arguments can be passed in registers.

    type1: char, int
    type2: char, int
    type3: char, int
 */
#include <testfwk.h>
#include <stdarg.h>

static {type1}
returnFirstArg(int marker, ...)
{
    va_list ap;
    {type1} i;

    va_start(ap, marker);
    i = va_arg(ap, {type1});

    va_end(ap);

    LOG(("Returning %u\n", i));
    return i;
}

static {type2}
returnSecondArg(int marker, ...)
{
    va_list ap;
    {type2} i;

    va_start(ap, marker);
    UNUSED(va_arg(ap, {type1}));
    i = va_arg(ap, {type2});

    va_end(ap);

    LOG(("Returning %u\n", i));
    return i;
}

static {type3}
returnThirdArg(int marker, ...)
{
    va_list ap;
    {type3} i;

    va_start(ap, marker);
    UNUSED(va_arg(ap, {type1}));
    UNUSED(va_arg(ap, {type2}));
    i = va_arg(ap, {type3});

    va_end(ap);

    LOG(("Returning %u\n", i));
    return i;
}

void
disabled_testArgs(void)
{
    int marker = 12;

    LOG(("First arg: %u\n", returnFirstArg(marker, ({type1})123, ({type2})45, ({type3})67)));
    ASSERT(returnFirstArg(marker, ({type1})123, ({type2})45, ({type3})67) == 123);
    ASSERT(returnFirstArg(marker, ({type1})-123, ({type2})45, ({type3})67) == -123);

    ASSERT(returnSecondArg(marker, ({type1})1, ({type2})-23, ({type3})64) == -23);
    ASSERT(returnSecondArg(marker, ({type1})1, ({type2})8, ({type3})64) == 8);

    ASSERT(returnThirdArg(marker, -33, -34, -35) == -35);
    ASSERT(returnThirdArg(marker, -33, -34, 35) == 35);
}

/* bug-221220.c
   Or an approximation there of.
*/
#include <testfwk.h>

typedef struct {
    int filler;
    int value;
} TESTSTRUCT;

static void
incrementValue(TESTSTRUCT *ps)
{
    ps->value++;
}

static void
subTestStructVolatile(TESTSTRUCT *ps)
{
    int a, b;

    /* sdcc used to cache the value of ps->value into registers, such
       that as a = ps->value and b = ps->value, then a = b.  However
       if an intervening function uses the structure then ps->value
       could change.
    */
    a = ps->value;
    incrementValue(ps);
    b = ps->value;

    ASSERT(a == 7);
    ASSERT(b == 8);
}

static void
testStructVolatile(void)
{
    TESTSTRUCT s;

    s.value = 7;
    subTestStructVolatile(&s);
}

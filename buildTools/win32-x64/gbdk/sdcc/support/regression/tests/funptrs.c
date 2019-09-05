/** Function pointer tests.
 */
#include <testfwk.h>

/* Must use a typedef as there is no way of adding the code modifier
   on the z80.
*/
typedef void (*NOARGFUNPTR)(void);
typedef void (*ONEARGFUNPTR)(int) REENTRANT;

int count;

void
incCount(void)
{
  count++;
}

void
incBy(int a) REENTRANT
{
  count += a;
}

void
callViaPtr(NOARGFUNPTR fptr)
{
  (*fptr)();
}

void
callViaPtr2(ONEARGFUNPTR fptr, int arg)
{
  (*fptr)(arg);
}

void
callViaPtr3(void (*fptr)(void))
{
  (*fptr)();
}

void
testFunPtr(void)
{
  ASSERT(count == 0);
  callViaPtr(incCount);
  ASSERT(count == 1);
  callViaPtr2(incBy, 7);
  ASSERT(count == 8);
}

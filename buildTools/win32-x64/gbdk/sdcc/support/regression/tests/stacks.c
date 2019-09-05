/*
  size: 126, 127, 128, 129
 */
#include <testfwk.h>

void
spoil(char a)
{
  UNUSED(a);
}

void
spoilPtr(volatile char *p)
{
  UNUSED(p);
}

void
testStack(void)
{
  volatile char above;
  volatile char above2;
  volatile char ac[{size}];
  volatile char below;
  volatile char * volatile p;

  spoil(ac[0]);
  spoilPtr(&above);
  spoilPtr(&below);

  p = &above2;
  spoilPtr(p);
}

/*
  Pointer tests
*/
#include <testfwk.h>

unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;
unsigned char *acharP = 0;

void
f1 (unsigned char *ucP)
{

  if (ucP == 0)
    {
      ASSERT(0);
      return;
    }

  ASSERT (!(*ucP));
}

void
f2 (unsigned int *uiP)
{

  if (uiP == 0)
    {
      ASSERT(0);
      return;
    }

  ASSERT (!(*uiP));

}

unsigned char *
f3 (void)
{

  return &achar0;
}

void
testPointer1 (void)
{
  f1 (&achar0);
  f2 (&aint0);

  acharP = f3 ();
  ASSERT (!((acharP == 0) || (*acharP)));
}

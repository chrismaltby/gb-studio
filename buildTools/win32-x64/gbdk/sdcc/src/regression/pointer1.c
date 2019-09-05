//#include "p16c84.h"
// Pointer tests

unsigned char success = 0;
unsigned char failures = 0;
unsigned char dummy = 0;

bit bit0 = 0;
unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;
unsigned char *acharP = 0;

void
done ()
{

  dummy++;

}

void
f1 (unsigned char *ucP)
{

  if (ucP == 0)
    {
      failures++;
      return;
    }

  if (*ucP)
    failures++;
}

void
f2 (unsigned int *uiP)
{

  if (uiP == 0)
    {
      failures++;
      return;
    }

  if (*uiP)
    failures++;

}

unsigned char *
f3 (void)
{

  return &achar0;
}

void
main (void)
{
  f1 (&achar0);
  f2 (&aint0);

  acharP = f3 ();
  if ((acharP == 0) || (*acharP))
    failures++;

  success = failures;
  done ();
}

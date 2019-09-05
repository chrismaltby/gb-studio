//#include "p16c84.h"

unsigned char success = 0;
unsigned char failures = 0;
unsigned char dummy = 0;

bit bit0 = 0;
unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;

unsigned char call3 (void);

void
done ()
{

  dummy++;

}

void
call1 (unsigned char uc0)
{
  if (uc0)
    failures++;
}

void
call2 (unsigned int ui0)
{
  if (ui0)
    failures++;

}

unsigned char
call3 (void)
{
  if (achar0)
    failures++;

  return (failures);

}

unsigned int
call4 (void)
{
  unsigned int i = 0;

  if (aint0)
    i++;

  return (i);

}

unsigned int
call5 (unsigned int k)
{

  if (k)
    failures++;

  return (k);

}

void
main (void)
{

  call1 (achar0);
  call2 (aint0);
  achar1 = call3 ();
  aint1 = call4 ();
  if (aint1)
    failures++;

  aint1 = call5 (aint0);
  if (aint1)
    failures++;

  success = failures;
  done ();
}

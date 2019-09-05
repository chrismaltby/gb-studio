/*
 */
#include <testfwk.h>

unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;

unsigned char call3 (void);

void
call1 (unsigned char uc0)
{
  ASSERT (!(uc0));
}

void
call2 (unsigned int ui0)
{
  ASSERT (!(ui0));

}

unsigned char
call3 (void)
{
  ASSERT (!(achar0));

  return 0;
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

  ASSERT (!(k));

  return (k);

}

void
testCall1 (void)
{

  call1 (achar0);
  call2 (aint0);
  achar1 = call3 ();
  aint1 = call4 ();
  ASSERT (!(aint1));

  aint1 = call5 (aint0);
  ASSERT (!(aint1));
}

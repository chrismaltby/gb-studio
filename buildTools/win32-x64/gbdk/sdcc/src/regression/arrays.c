//#include "p16c84.h"

unsigned char success = 0;
unsigned char failures = 0;
unsigned char dummy = 0;

bit bit0 = 0;
unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;

void
done ()
{

  dummy++;

}

void
bool_or1 (void)
{

  if ((achar0 > 0) || (achar1 > 0))
    failures++;
}

void
bool_or2 (void)
{

  if (achar0 || achar1)
    failures++;
}

void
bool_test1 (void)
{

  if ((achar0 == 0) || achar1)
    failures++;
}


void
bool_test2 (void)
{

  if ((achar0 == 0) || aint0)
    failures++;
}

void
bool_and1 (void)
{

  if (achar0 && achar1)
    failures++;
}

void
bin_or1 (void)
{

  char t;

  t = achar0 | achar1;
  if (t)
    failures++;
}

void
bin_xor1 (void)
{

  if (achar0 ^ achar1)
    failures++;
}


void
bool_test3 (void)
{

  if ((achar0 == 0x42) || (achar1 == 42))
    failures++;
}


void
bool_or_lit1 (void)
{

  achar0 |= 0x0f;

  if (achar0 > 0x10)
    failures++;

  if ((achar0 | 0x10) > 0xf0)
    failures++;

}

void
bool_and_lit1 (void)
{

  achar0 &= 0xf0;

  if (achar0 > 0x10)
    failures++;

  if ((achar0 & 0x10) > 0xf0)
    failures++;

  achar0 &= 0xef;

}

void
main (void)
{

  bool_or1 ();
  bool_or2 ();
  bool_and1 ();
  bin_or1 ();
  bin_xor1 ();

  achar0++;
  bool_and1 ();
  bool_test1 ();
  bool_test2 ();
  bool_test3 ();


  achar0--;
  achar1++;
  bool_and1 ();

  achar0 = 0;
  achar1 = 0;

  bool_or_lit1 ();
  bool_and_lit1 ();

  success = failures;
  done ();
}

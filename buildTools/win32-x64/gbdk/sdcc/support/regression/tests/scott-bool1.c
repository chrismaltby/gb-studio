/*
 */
#include <testfwk.h>

unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;

void bool_or1(void)
{

  ASSERT(!( (achar0 >0) || (achar1 >0 )));
}

void bool_or2(void)
{

  ASSERT(!( achar0 || achar1));
}

void bool_test1(void)
{

  ASSERT(!( (achar0==0) || achar1));
}


void bool_test2(void)
{

  ASSERT(!( (achar0==0) || aint0));
}

void bool_and1(void)
{

  ASSERT(!( achar0 && achar1));
}

void bin_or1(void)
{

  char t;

  t = achar0 | achar1;
  ASSERT(!(t));
}

void bin_xor1(void)
{

  ASSERT(!(achar0 ^ achar1));
}


void bool_test3(void)
{

  ASSERT(!((achar0 == 0x42) || (achar1 == 42)));
}


void bool_or_lit1(void)
{

  achar0 |= 0x0f;

  ASSERT(!(achar0 > 0x10));

  ASSERT(!( (achar0 | 0x10) > 0xf0));

}

void bool_and_lit1(void)
{

  achar0 &= 0xf0;

  ASSERT(!(achar0 > 0x10));

  ASSERT(!( (achar0 & 0x10) > 0xf0));

  achar0 &= 0xef;

}

void 
testBool1(void)
{

  bool_or1();
  bool_or2();
  bool_and1();
  bin_or1();
  bin_xor1();

  achar0++;
  bool_and1();
  bool_test1();
  bool_test2();
  bool_test3();


  achar0--; achar1++;
  bool_and1();

  achar0=0;
  achar1=0;

  bool_or_lit1();
  bool_and_lit1();
}

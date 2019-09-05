/**
   compare3.c
   regression testing program for comparing literals to variables
*/
#include <testfwk.h>

unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;

// compare to 0
// assumes
// achar0 == 0
// achar1 != 0
// aint0  == 0
// aint1  != 0

void c_0(void)
{

  ASSERT(!(achar0 != 0));

  ASSERT(!(achar0));

  ASSERT(!(achar1 == 0));

  ASSERT(!(!achar1));

  ASSERT(!(aint0 != 0));

  ASSERT(!(aint0));

  ASSERT(!(aint1 == 0));

  ASSERT(!(!aint1));

}

// compare to 1
// assumes
// achar0 != 1
// achar1 == 1
// aint0  != 1
// aint1  == 1

void c_1(void)
{

  ASSERT(!(achar0 == 1));

  ASSERT(!(achar1 != 1));

  ASSERT(!(aint0 == 1));

  ASSERT(!(aint1 != 1));

}

// compare to 2
// assumes
// achar0 == 2
// aint0  == 2

void c_2(void)
{

  ASSERT(!(achar0 != 2));

  ASSERT(!(aint0 != 2));

}

// compare to 0xff
// assumes
// achar0 == 0xff
// aint0  == 0xff

void c_ff(void)
{

  ASSERT(!(achar0 != 0xff));

  ASSERT(!(aint0 != 0xff));

  ASSERT(!(aint0 == 0xfe));

  ASSERT(!(aint0 == 0xff00U));

}


// compare to 0x00a5
// assumes
// achar0  == 0xa5
// aint0  == 0x00a5

void c_a5(void)
{

  ASSERT(!(achar0 != 0xa5));

  ASSERT(!(aint0 != 0xa5));

  ASSERT(!(aint0 == 0xa4));

  ASSERT(!(aint0 == 0xa500U));

}

// compare to 0xa500
// assumes
// achar0  == 0xa5
// aint0  == 0xa500

void c_a500(void)
{

  ASSERT(!(achar0 == (unsigned char)0xa500U));

  ASSERT(!(aint0 != 0xa500U));

  ASSERT(!(aint0 == 0xa400U));

  ASSERT(!(aint0 == 0x00a5));

}

// compare to 0xabcd
// assumes
// achar0  == 0xa5
// aint0  == 0xabcd

void c_abcd(void)
{

  ASSERT(!(achar0 == (unsigned char)0xabcdU));

  ASSERT(!(aint0 != 0xabcdU));

  ASSERT(!(aint0 == 0xab00U));

  ASSERT(!(aint0 == 0x00cd));

  ASSERT(!(aint0 == (unsigned int)0x1234abcdU));

}

void
testCompare3 (void)
{

  aint1 = 1;
  achar1 = 1;
  c_0();
  c_1();

  aint0 = 2;
  achar0 = 2;
  c_2();

  aint0 = 0xff;
  achar0 = 0xff;
  c_ff();

  aint0 = 0xa5;
  achar0 = 0xa5;
  c_a5();

  aint0 = 0xabcd;
  c_abcd();
}

/*
  Addition tests
*/
#include <testfwk.h>

/* bit types are not ANSI - so provide a way of disabling bit types
 * if this file is used to test other compilers besides SDCC */
#define SUPPORT_BIT_TYPES 0

/* Some compilers that support bit types do not support bit arithmetic 
 * (like bitx = bity + bitz;) */
#define SUPPORT_BIT_ARITHMETIC 0

#if SUPPORT_BIT_TYPES

bit bit0 = 0;
bit bit1 = 0;
bit bit2 = 0;
bit bit3 = 0;
bit bit4 = 0;
bit bit5 = 0;
bit bit6 = 0;
bit bit7 = 0;
bit bit8 = 0;
bit bit9 = 0;
bit bit10 = 0;
bit bit11 = 0;

#endif

unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;
unsigned char achar2 = 0;
unsigned char achar3 = 0;
unsigned char *acharP = 0;

void sub_lit_from_uchar(void)
{

  achar0 = achar0 - 5;

  ASSERT(!(achar0 != 0xfb));

  achar0 -= 10;

  ASSERT(!(achar0 != 0xf1));

  achar0 = achar0 -1;  // Should be a decrement
  ASSERT(!(achar0 != 0xf0));

  for(achar1 = 0; achar1 < 100; achar1++)
    achar0 -= 2;

  ASSERT(!(achar0 != 40));

}

// achar0 = 1
// achar1 = 100

void sub_uchar2uchar(void)
{

  achar1 = achar1 - achar0;

  ASSERT(!(achar1 != 99));

  for(achar2 = 0; achar2<7; achar2++)
    achar1 -= achar0;

  ASSERT(!(achar1 != 92));

}

// assumes
//  achar0 = 10
//  achar1 = 32
//  achar2, achar3 can be anything.

void sub_uchar2uchar2(void)
{


  achar0--;
  achar0 = achar0 - 1;
  achar0 = achar0 - 2;
  achar0 = achar0 - 3;
  ASSERT(!(achar0 != 3));


  achar1 -= achar0;
  ASSERT(!(achar1 != 29));

  achar2 = achar1 - achar0;
  ASSERT(!(achar2 != 26));


  achar3 = achar2 - achar1 - achar0;
  ASSERT(!(achar3 != 0xfa));

}

// sub_bits
// all bit variables are 0 upon entry.

#if SUPPORT_BIT_TYPES
void sub_bits(void)
{

  bit1 = bit0;

  bit0 = 1;

  ASSERT(!(bit1 != 0));

  bit1 = bit0-bit1;   // 1 - 0 => 1
  ASSERT(!(bit1 != 1));

#if SUPPORT_BIT_ARITHMETIC
  bit2 = bit1-bit0;   // 1 - 1 => 0
  ASSERT(!(bit2));

  bit7 = bit4-bit5;
  bit6 = bit4+bit5;
  bit3 = bit4-bit5-bit6-bit7-bit0; // 0-0-0-0-1 => 1
  ASSERT(!(!bit3));
#endif
}

/* sub_bit2uchar(void) - assumes bit0 = 1, achar0 = 7  */

void sub_bit2uchar(void)
{

  achar0 -= bit0;

  ASSERT(!(achar0 != 6));

  ASSERT(!(achar0 == bit0));

}

void sub_bit2uint(void)
{

  ASSERT(!(aint0 != bit11));

  aint0 -= bit0;
  ASSERT(!(aint0!=0xffff));

}
#endif

void 
testSub(void)
{

  sub_lit_from_uchar();

  achar0=1;
  achar1=100;
  sub_uchar2uchar();


  achar0 = 10;
  achar1 = 32;
  sub_uchar2uchar2();

#if SUPPORT_BIT_TYPES
  sub_bits();

  achar0 = 7;
  bit0 = 1;
  sub_bit2uchar();
  sub_bit2uint();
#endif
}

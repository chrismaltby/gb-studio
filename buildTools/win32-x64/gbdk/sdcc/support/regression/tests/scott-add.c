/* Addition tests
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

void 
test_add_lit2uchar(void)
{
  achar0 = achar0 + 5;

  ASSERT(achar0 == 5);

  achar0 += 10;
  
  ASSERT(achar0 == 15);

  achar0 = achar0 +1;  // Should be an increment

  ASSERT(achar0 == 16);

  for(achar1 = 0; achar1 < 100; achar1++)
    achar0 += 2;

  ASSERT(achar0 == 216);
}

void
test_add_uchar2uchar_setup(void)
{
  achar0=16;
  achar1=0;
}

void 
test_add_uchar2uchar(void)
{
  achar1 = achar1 + achar0;

  ASSERT(achar1 == 16);

  for(achar2 = 0; achar2<7; achar2++)
    achar1 += achar0;

  ASSERT(achar1 == 128);
}

// assumes
//  achar0 = 0
//  achar1 = 32
//  achar2, achar3 can be anything.

void 
test_add_uchar2uchar2_setup(void)
{
  achar0 = 0;
  achar1 = 32;
}

void 
test_add_uchar2uchar2(void)
{
  achar0++;
  achar0 = achar0 + 1;
  achar0 = achar0 + 2;
  achar0 = achar0 + 3;

  ASSERT(achar0 == 7);

  achar1 += achar0;
  ASSERT(achar1 == 39);

  achar2 = achar1 + achar0;
  ASSERT(achar2 == 46);

  achar3 = achar2 + achar1 + achar0;
  ASSERT(achar3 == 92);

}

#if SUPPORT_BIT_TYPES
void add_bits(void)
{

  bit1 = bit0;

  bit0 = 1;

  if(bit1 != 0)
    failures++;

  bit1 = bit1+bit0;
  ASSERT(bit1 == 1);

#if SUPPORT_BIT_ARITHMETIC
  bit2 = bit1+bit3;
  ASSERT(bit2 != 0);

  bit3 = bit4+bit5+bit6+bit7+bit0;
  ASSERT(bit3 == 0);
#endif
}

/* add_bit2uchar(void) - assumes bit0 = 1, achar0 = 7  */

void 
disabled_test_add_bit2uchar(void)
{
  achar0 += bit0;

  ASSERT(achar0 == 8);

  ASSERT(achar0 == bit0);
}

void 
disabled_test_add_bit2uint(void)
{
  ASSERT(aint0 == bit11);

  aint0 += bit0;
  ASSERT(aint0 == 1);
}
#endif

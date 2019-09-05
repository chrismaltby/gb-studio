//#include "p16c84.h"
// Addition tests

/* bit types are not ANSI - so provide a way of disabling bit types
 * if this file is used to test other compilers besides SDCC */
#define SUPPORT_BIT_TYPES 1

/* Some compilers that support bit types do not support bit arithmetic 
 * (like bitx = bity + bitz;) */
#define SUPPORT_BIT_ARITHMETIC 1

unsigned char success=0;
unsigned char failures=0;
unsigned char dummy=0;

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

void done()
{

  dummy++;

}

void sub_lit_from_uchar(void)
{

  achar0 = achar0 - 5;

  if(achar0 != 0xfb)
    failures++;

  achar0 -= 10;

  if(achar0 != 0xf1)
    failures++;

  achar0 = achar0 -1;  // Should be a decrement
  if(achar0 != 0xf0)
    failures++;

  for(achar1 = 0; achar1 < 100; achar1++)
    achar0 -= 2;

  if(achar0 != 40)
    failures++;

}

// achar0 = 1
// achar1 = 100

void sub_uchar2uchar(void)
{

  achar1 = achar1 - achar0;

  if(achar1 != 99)
    failures++;

  for(achar2 = 0; achar2<7; achar2++)
    achar1 -= achar0;

  if(achar1 != 92)
    failures++;

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
  if(achar0 != 3)
    failures++;


  achar1 -= achar0;
  if(achar1 != 29)
    failures++;

  achar2 = achar1 - achar0;
  if(achar2 != 26)
    failures++;


  achar3 = achar2 - achar1 - achar0;
  if(achar3 != 0xfa)
    failures++;

}

// sub_bits
// all bit variables are 0 upon entry.

#if SUPPORT_BIT_TYPES
void sub_bits(void)
{

  bit1 = bit0;

  bit0 = 1;

  if(bit1 != 0)
    failures++;

  bit1 = bit0-bit1;   // 1 - 0 => 1
  if(bit1 != 1)
    failures++;

#if SUPPORT_BIT_ARITHMETIC
  bit2 = bit1-bit0;   // 1 - 1 => 0
  if(bit2)
    failures++;

  bit7 = bit4-bit5;
  bit6 = bit4+bit5;
  bit3 = bit4-bit5-bit6-bit7-bit0; // 0-0-0-0-1 => 1
  if(!bit3)
    failures++;
#endif
}
#endif

/* sub_bit2uchar(void) - assumes bit0 = 1, achar0 = 7  */

void sub_bit2uchar(void)
{

  achar0 -= bit0;

  if(achar0 != 6)
    failures++;

  if(achar0 == bit0)
    failures++;

}

void sub_bit2uint(void)
{

  if(aint0 != bit11)
    failures++;

  aint0 -= bit0;
  if(aint0!=0xffff)
    failures++;

}

void sub_ucharFromLit(void)
{

  achar0 = 2 - achar0;

  if(achar0 != 2)
    failures++;


  aint0 = 2 - aint0;

  if(aint0 != 2)
    failures++;

  aint0--;

  if(aint0 != 1)
    failures++;

  aint0 = 0x100 - aint0;

  if(aint0 != 0xff)
    failures++;

  aint0 = 0xff00 - aint0;

  if(aint0 != 0xfe01)
    failures++;

  aint0 = 0x0e01 - aint0;

  if(aint0 != 0x1000)
    failures++;

  aint0 = 0x10ff - aint0;

  if(aint0 != 0xff)
    failures++;



}

void main(void)
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

  aint0 = 0;
  achar0 = 0;
  sub_ucharFromLit();

  success = failures;
  done();
}

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

void add_lit2uchar(void)
{

  achar0 = achar0 + 5;

  if(achar0 != 5)
    failures++;

  achar0 += 10;

  if(achar0 != 15)
    failures++;

  achar0 = achar0 +1;  // Should be an increment
  if(achar0 != 16)
    failures++;

  for(achar1 = 0; achar1 < 100; achar1++)
    achar0 += 2;

  if(achar0 != 216)
    failures++;

}

void add_uchar2uchar(void)
{

  achar1 = achar1 + achar0;

  if(achar1 != 16)
    failures++;

  for(achar2 = 0; achar2<7; achar2++)
    achar1 += achar0;

  if(achar1 != 128)
    failures++;

}

// assumes
//  achar0 = 0
//  achar1 = 32
//  achar2, achar3 can be anything.

void add_uchar2uchar2(void)
{


  achar0++;
  achar0 = achar0 + 1;
  achar0 = achar0 + 2;
  achar0 = achar0 + 3;
  if(achar0 != 7)
    failures++;

  achar1 += achar0;
  if(achar1 != 39)
    failures++;

  achar2 = achar1 + achar0;
  if(achar2 != 46)
    failures++;

  achar3 = achar2 + achar1 + achar0;
  if(achar3 != 92)
    failures++;

}

#if SUPPORT_BIT_TYPES
void add_bits(void)
{

  bit1 = bit0;

  bit0 = 1;

  if(bit1 != 0)
    failures++;

  bit1 = bit1+bit0;
  if(bit1 != 1)
    failures++;

#if SUPPORT_BIT_ARITHMETIC
  bit2 = bit1+bit3;
  if(!bit2)
    failures++;

  bit3 = bit4+bit5+bit6+bit7+bit0;
  if(!bit3)
    failures++;
#endif
}
#endif

/* add_bit2uchar(void) - assumes bit0 = 1, achar0 = 7  */

void add_bit2uchar(void)
{

  achar0 += bit0;

  if(achar0 != 8)
    failures++;

  if(achar0 == bit0)
    failures++;

}

void add_bit2uint(void)
{

  if(aint0 != bit11)
    failures++;

  aint0 += bit0;
  if(aint0!=1)
    failures++;

}
void main(void)
{

  add_lit2uchar();

  achar0=16;
  achar1=0;
  add_uchar2uchar();


  achar0 = 0;
  achar1 = 32;
  add_uchar2uchar2();

#if SUPPORT_BIT_TYPES
  add_bits();

  add_bit2uchar();
  add_bit2uint();
#endif


  success = failures;
  done();
}


// Addition tests - mostly int's

/* bit types are not ANSI - so provide a way of disabling bit types
 * if this file is used to test other compilers besides SDCC */
#define SUPPORT_BIT_TYPES 1


unsigned char success=0;
unsigned char failures=0;
unsigned char dummy=0;


unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned int aint2 = 0;
unsigned int aint3 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;
unsigned char achar2 = 0;
unsigned char achar3 = 0;
unsigned char *acharP = 0;

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


void done()
{

  dummy++;

}

void add_lit2uint(void)
{

  aint0 = aint0 + 5;

  if(aint0 != 5)
    failures++;

  aint0 += 10;

  if(aint0 != 15)
    failures++;

  aint0 = aint0 +1;  // Should be an increment
  if(aint0 != 16)
    failures++;

  for(aint1 = 0; aint1 < 100; aint1++)
    aint0 += 2;

  if(aint0 != 216)
    failures++;

}

void add_uint2uint (void)
{

  aint1 = aint1 + aint0;

  if(aint1 != 16)
    failures++;

  for(aint2 = 0; aint2<7; aint2++)
    aint1 += aint0;

  if(aint1 != 128)
    failures++;

}

// assumes
//  aint0 = 0
//  aint1 = 32
//  aint2, aint3 can be anything.

void add_uint2uint2(void)
{


  aint0++;
  aint0 = aint0 + 1;
  aint0 = aint0 + 2;
  aint0 = aint0 + 3;
  if(aint0 != 7)
    failures++;

  aint1 += aint0;
  if(aint1 != 0x27)
    failures++;

  aint2 = aint1 + aint0;
  if(aint2 != 0x2e)
    failures++;

  aint3 = aint2 + aint1 + aint0;
  if(aint3 != 0x5c)
    failures++;

  aint3 += 0xa0;
  if(aint3 != 0xfc)
    failures++;

  aint3 += aint0;
  if(aint3 != 0x103)
    failures++;

  aint1 += 0xffc0;
  if(aint1 != 0xffe7)
    failures++;

  aint3 = aint2 + aint1 + aint0;
  if(aint3 != 0x1c)
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

  bit2 = bit1+bit3;
  if(!bit2)
    failures++;

  bit3 = bit4+bit5+bit6+bit7+bit0;
  if(!bit3)
    failures++;
}
#endif

/* add_bit2uchar(void) - assumes bit0 = 1, aint0 = 7  */

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

/***********************************/

void addlits(void)
{
  aint0 += 0x0001;

  if(aint0 != 1)
    failures++;

  aint0 += 0x00;

  if(aint0 != 1)
    failures++;

  aint0 += 0x00fe;
  if(aint0 != 0x00ff)
    failures++;

  aint0 += 0x0001;

  if(aint0 != 0x0100)
    failures++;

  aint0++;
  if(aint0 != 0x0101)
    failures++;

  aint0 += 0x00ff;
  if(aint0 != 0x0200)
    failures++;

  aint0 += 0x00a0;
  if(aint0 != 0x02a0)
    failures++;

  aint0 += 0x0061;
  if(aint0 != 0x0301)
    failures++;

  aint0 += 0x0100;
  if(aint0 != 0x0401)
    failures++;

  aint0 += 0x0101;
  if(aint0 != 0x0502)
    failures++;

  aint0 += 0x00fd;
  if(aint0 != 0x05ff)
    failures++;

  aint0 += 0x0101;
  if(aint0 != 0x0700)
    failures++;

  aint0 += 0x01ff;
  if(aint0 != 0x08ff)
    failures++;

  aint0 += 0x01ff;
  if(aint0 != 0x0afe)
    failures++;

  aint0 += 0xff02;
  if(aint0 != 0x0a00)
    failures++;

  aint0 += 0xffff;
  if(aint0 != 0x09ff)
    failures++;

  aint0 += 0xff01;
  if(aint0 != 0x0900)
    failures++;

  aint0 += 0xff00;
  if(aint0 != 0x0800)
    failures++;

  aint0 += 0xff01;
  if(aint0 != 0x0701)
    failures++;

  aint0 += 0x0300;
  if(aint0 != 0x0a01)
    failures++;

  aint0 += 0x03ff;
  if(aint0 != 0x0e00)
    failures++;

  aint0 += 0x0301;
  if(aint0 != 0x1101)
    failures++;

  aint0 += 0x03fe;
  if(aint0 != 0x14ff)
    failures++;

  aint0 += 0x0301;
  if(aint0 != 0x1800)
    failures++;
 
}


void main(void)
{

  add_lit2uint();

  aint0=16;
  aint1=0;
  add_uint2uint();


  aint0 = 0;
  aint1 = 32;
  aint2 = 0;
  add_uint2uint2();

#if SUPPORT_BIT_TYPES
  add_bits();

  achar0 = 7;
  add_bit2uchar();

  aint0 = 0;
  bit0 = 1;
  add_bit2uint();
#endif

  aint0 = 0;
  addlits();

  success = failures;
  done();
}

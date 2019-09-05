//#include "p16c84.h"

unsigned char success=0;
unsigned char failures=0;
unsigned char dummy=0;

bit bit0 = 0;
unsigned int uint0 = 0;
unsigned int uint1 = 0;
unsigned char uchar0 = 0;
unsigned char uchar1 = 0;

unsigned char call3(void);

void done()
{

  dummy++;

}

void for1(void)
{
  unsigned char i=0;

  for(i=0; i<10; i++)
    uchar0++;

  if(uchar0 != 10)
    failures++;

}

void for2(void)
{
  unsigned char i=0;

  for(i=0; i<10; i++)
    uchar0++;

  if(i < 10)
    failures++;

}

void for3(void)
{
  unsigned int i=0;

  for(i=0; i<10; i++)
    uint0++;

  if(i < 10)
    failures++;

}

void for4(void)
{

  for(uint0=1; uint0<10; uint0++)
    uchar0++;

  if(uchar0 != 9)
    failures++;

}

void for5(void)
{

  for(uint0=1; uint0<=10; uint0++)
    uchar0++;

  if(uchar0 != 10)
    failures++;

}

void inc_uchar0(void)
{
  uchar0++;
}

void for6(void)
{
  uchar0 = 0;
  for(uint0=1; uint0<=10; uint0++)
    inc_uchar0();

}

void main(void)
{
  for1();
  for2();
  for3();
  uchar0 = 0;
  for4();
  uchar0 = 0;
  for5();

  for6();
  if(uchar0 != 10)
    failures++;

  success = failures;
  done();
}

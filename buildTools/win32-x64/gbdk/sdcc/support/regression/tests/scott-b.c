/*
 */
#include <testfwk.h>

unsigned char uchar0=0;
unsigned char uchar1=0;
unsigned char uchar2=0;

void inc(unsigned char k)
{
  uchar0 = uchar0 + k;
}

void f1(void)
{

  uchar2++;
}

void nested_call(unsigned char u)
{

  f1();
  uchar1 = uchar1 + u;
  inc(uchar1);

}
  //  uchar1 = uchar1 + uchar0;
  //  uchar2 = uchar1 + k;

void 
testB(void)
{

  uchar0=1;
  inc(uchar0);
  ASSERT(uchar0 == 2);

  uchar0 = 2;
  uchar1 = 1;
  uchar2 = 1;
  nested_call(uchar2);

  ASSERT(uchar0 == 4);
}

/*
 */
#include <testfwk.h>

unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;

unsigned char call3(void);

void for1(void)
{
  unsigned char i=0;

  for(i=0; i<10; i++)
    achar0++;

  ASSERT(!(achar0 != 10));

}

void for2(void)
{
  unsigned char i=0;

  for(i=0; i<10; i++)
    achar0++;

  ASSERT(!(i < 10));

}

void 
testFor(void)
{
  for1();
  for2();
}

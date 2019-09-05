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

int int0 = 0;
int int1 = 0;
char char0 = 0;
char char1 = 0;
char char2 = 0;


void done()
{

  dummy++;

}

void sub_int1(void)
{
  if(int0 != 5)
    failures++;

  if(int1 != 4)
    failures++;

  int0 = int0 - int1;

  if(int0 != 1)
    failures++;

  int0 = 4 - int0;
  if(int0 != 3)
    failures++;

  int0 = int0 - int1;

  if(int0 != -1)
    failures++;

  int0 = int0 - 0xff;

  if(int0 != -0x100)
    failures++;

  int0 = 0xff - int0;

  if(int0 != 0x1ff)
    failures++;


}

void sub_char_int(void)
{

  int0 = int0 - char0;

  if(int0 != 3)
    failures++;

  if(int0 < char0)
    failures++;

  int0 = int0 - char0;

  if(int0 != 1)
    failures++;

  if(int0 > char0)
    failures++;


  int0 = int0 - char0;
  if(int0 != -1)
    failures++;

  if(int0>0)
    failures++;

}

void assign_char2int(void)
{

  int0 = char0;
  if(int0 != 0x7f)
    failures++;

  int1 = char1;
  if(int1 != -5)
    failures++;

}


void sub_compound_char(void)
{

  char0 = char1 - 5;
  if(char0 != 4)
    failures++;

  if((char1 - char0 - 5) != 0)
    failures++;

}

void sub_compound_int(void)
{

  int0 = int1 - 5;
  if(int0 != 4)
    failures++;

  if((int1 - int0 - 5) != 0)
    failures++;

}

void main(void)
{

  int0 = 5;
  int1 = 4;

  sub_int1();

  int0 = 5;
  int1 = 4;
  char0 = 2;

  sub_char_int();

  char0 = 0x7f;
  char1 = -5;
  assign_char2int();

  char1 = 9;
  sub_compound_char();
  
  int1 = 9;
  sub_compound_int();

  success = failures;
  done();
}

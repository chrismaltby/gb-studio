
// Addition tests - mostly int's

/* bit types are not ANSI - so provide a way of disabling bit types
 * if this file is used to test other compilers besides SDCC */
#define SUPPORT_BIT_TYPES 1


unsigned char success=0;
unsigned char failures=0;
unsigned char dummy=0;


char char0 = 0;
char char1 = 0;
char char2 = 0;
int int0 = 0;
int int1 = 0;
long long0 = 0;
long long1 = 0;
unsigned long ulong0 = 0;
unsigned long ulong1 = 0;

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

void add_char2char(void)
{
  if(char0 != 4)
    failures++;
  if(char1 != 5)
    failures++;

  char0 = char0 + char1;

  if(char0 != 9)
    failures++;

  char0 += 127;
  if(char0 > 0)
    failures++;

  if(char0 != -0x78)
    failures++;


}

void add_compound_char(void)
{
  char0 = char1+5;

  if(char0 != 9)
    failures++;

  if((char0+char1) != 13)
    failures++;
}

void add_int2int(void)
{
  if(int0 != 4)
    failures++;
  if(int1 != 5)
    failures++;

  int0 += int1;
  if(int0 != 9)
    failures++;

  int0 += 0x7fff;
  if(int0 != -0x7ff8)
    failures++;

}

void add_compound_int(void)
{
  int0 = int1+5;

  if(int0 != 9)
    failures++;

  if((int0+int1) != 13)
    failures++;
}


void add_lit2long(void)
{

  if(long0 != 0)
    failures++;

  long0++;

  if(long0 != 1)
    failures++;

  long0 = long0 + 0xff;

  if(long0 != 0x100)
    failures++;

  long0 = long0 + 0x100;
  if(long0 != 0x200)
    failures++;


  long0 = long0 + 0xfe00;
  if(long0 != 0x10000)
    failures++;

  long0 = long0 + 0xff0000;
  if(long0 != 0x1000000)
    failures++;

  long0 = long0 + 0x7e000000;
  if(long0 != 0x7f000000)
    failures++;

  /* wrap around zero */
  long0 = long0 + 0x2000000;
  if(long0 != -0x7f000000)
    failures++;

  long0 = long0 + 0x7f000000;
  if(long0 != 0)
    failures++;

}

void add_lit2ulong(void)
{

  if(ulong0 != 0)
    failures++;

  ulong0++;

  if(ulong0 != 1)
    failures++;

  ulong0 = ulong0 + 0xff;

  if(ulong0 != 0x100)
    failures++;

  ulong0 = ulong0 + 0x100;
  if(ulong0 != 0x200)
    failures++;


  ulong0 = ulong0 + 0xfe00;
  if(ulong0 != 0x10000)
    failures++;

  ulong0 = ulong0 + 0xff0000;
  if(ulong0 != 0x1000000)
    failures++;

  ulong0 = ulong0 + 0x7e000000;
  if(ulong0 != 0x7f000000)
    failures++;

  ulong0 = ulong0 + 0x2000000;
  if(ulong0 != 0x81000000)
    failures++;

  /* wrap around zero */
  ulong0 = ulong0 + 0x7f000000;
  if(ulong0)
    failures++;

}

void main(void)
{
  char0=4;
  char1 = char0 + 1;
  add_char2char();

  char1=4;
  add_compound_char();

  int0 = 4;
  int1 = int0 + 1;
  add_int2int();

  int1=4;
  add_compound_int();

  add_lit2long();
  add_lit2ulong();

  success = failures;
  done();
}

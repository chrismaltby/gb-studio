//#include "p16c84.h"
// Addition tests

/* bit types are not ANSI - so provide a way of disabling bit types
 * if this file is used to test other compilers besides SDCC */
#define SUPPORT_BIT_TYPES 1

/* Some compilers that support bit types do not support bit arithmetic 
 * (like bitx = bity + bitz;) */
#define SUPPORT_BIT_ARITHMETIC 1

unsigned char success = 0;
unsigned char failures = 0;
unsigned char dummy = 0;

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
unsigned char *acharP = 0;

struct chars
  {
    unsigned char c0, c1;
    unsigned int  i0, i1;
  };


struct chars struct1;

void
done ()
{

  dummy++;

}

void
struct_test (void)
{

  if (struct1.c0 || struct1.c1)
    failures++;

  struct1.c0++;

  if (struct1.c0 != 1)
    failures++;
}
/*
void
ptr_to_struct (struct chars *p)
{

  if (p->c1)
    failures++;


  p->c1++;

  if (p->c1 != 1)
    failures++;
}
*/
void add_chars(void)
{

  achar0 = struct1.c0 + struct1.c1;

  if(achar0 != 1)
    failures++;
}

void
main (void)
{


  struct1.c0 = 0;
  struct1.c1 = 0;
  struct_test ();
  //  ptr_to_struct (&struct1);

  struct1.c0 = 0;
  struct1.c1 = 1;
  add_chars();

  success = failures;
  done ();
}

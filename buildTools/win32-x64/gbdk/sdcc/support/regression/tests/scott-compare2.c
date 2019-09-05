/*
 */
#include <testfwk.h>

unsigned int aint0 = 0;
unsigned int aint1 = 0;
unsigned char achar0 = 0;
unsigned char achar1 = 0;

void
char_lt_char (void)
{
  ASSERT (!(achar0 < achar1));
}

void
char_gt_char (void)
{
  ASSERT (!(achar1 > achar0));
}

void
char_lte_char (void)
{
  ASSERT (!(achar0 <= achar1));
}

void
char_gte_char (void)
{
  ASSERT (!(achar1 >= achar0));
}

void
char_lt_lit (void)
{
  ASSERT (!(achar1 < 0x10));
}

void
char_gt_lit (void)
{
  ASSERT (!(achar1 > 0x10));
}

void
char_lte_lit (void)
{
  ASSERT (!(achar1 <= 0x0f));
}

void
char_gte_lit (void)
{
  ASSERT (!(achar1 >= 0x11));
}


/* ints */

void
int_lt_int (void)
{
  ASSERT (!(aint0 < aint1));
}

void
int_gt_int (void)
{
  ASSERT (!(aint1 > aint0));
}

void
int_lte_int (void)
{
  ASSERT (!(aint0 <= aint1));
}

void
int_gte_int (void)
{
  ASSERT (!(aint1 >= aint0));
}

void
int_lt_lit (void)
{
  ASSERT (!(aint1 < 0x10));
}

void
int_gt_lit (void)
{
  ASSERT (!(aint1 > 0x10));
}

void
int_lte_lit (void)
{
  ASSERT (!(aint1 <= 0x0f));
}

void
int_gte_lit (void)
{
  ASSERT (!(aint1 >= 0x11));
}







void
testCompare2 (void)
{

  char_lt_char ();
  char_gt_char ();

  achar0++;
  char_lt_char ();
  char_gt_char ();
  char_gte_char ();
  char_lte_char ();

  achar1 = 0x10;
  char_lt_lit ();
  char_gt_lit ();
  char_lte_lit ();
  char_gte_lit ();



  int_lt_int ();
  int_gt_int ();

  aint0++;
  int_lt_int ();
  int_gt_int ();
  int_gte_int ();
  int_lte_int ();

  aint1 = 0x10;
  int_lt_lit ();
  int_gt_lit ();
}

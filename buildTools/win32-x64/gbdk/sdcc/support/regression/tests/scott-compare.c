/*
   compare.c test compare

 */
#include <testfwk.h>

unsigned char achar0 = 0;
unsigned char achar1 = 0;
unsigned int aint0 = 0;
unsigned int aint1 = 0;

char schar0 = 0;
char schar1 = 0;

/* achar0 should be zero */

void
compare_char_to_lits1 (void)
{

  ASSERT (!(achar0));

  ASSERT (!(achar0 == 1));

  ASSERT (!(achar0 == 7));

  ASSERT (!(achar0 != 0));
}

/* achar0 should be `5' */
void
compare_char_to_lits2 (void)
{

  ASSERT (!(!achar0));

  ASSERT (!(achar0 == 1));

  ASSERT (!(achar0 == 7));

  ASSERT (!(achar0 != 5));
}


/* achar0 should equal achar1 */
void
compare_char_to_char1 (void)
{

  ASSERT (!(achar0 != achar1));

  ASSERT (!(schar0 != schar1));
}

/* achar0 should be different than achar1 */
void
compare_char_to_char2 (void)
{

  ASSERT (!(achar0 == achar1));

}

/* aint0 should be zero */

void
compare_int_to_lits1 (void)
{

  ASSERT (!(aint0));

  ASSERT (!(aint0 == 1));

  ASSERT (!(aint0 == 7));

  ASSERT (!(aint0 != 0));
}

/* aint0 should be `5' */
void
compare_int_to_lits2 (void)
{

  ASSERT (!(!aint0));

  ASSERT (!(aint0 == 1));

  ASSERT (!(aint0 == 7));

  ASSERT (!(aint0 != 5));
}

/* aint0 should be `0x1234' */
void
compare_int_to_lits3 (void)
{

  ASSERT (!(!aint0));

  ASSERT (!(aint0 == 1));

  ASSERT (!(aint0 == 7));

  ASSERT (!(aint0 != 0x1234));
}

/* aint0 should equal aint1 */
void
compare_int_to_int1 (void)
{

  ASSERT (!(aint0 != aint1));

}

/* aint0 should be different than aint1 */
void
compare_int_to_int2 (void)
{

  ASSERT (!(aint0 == aint1));

}

void
testCompare (void)
{

  compare_char_to_lits1 ();
  compare_char_to_char1 ();
  achar0 = 5;
  compare_char_to_lits2 ();
  compare_char_to_char2 ();


  compare_int_to_lits1 ();
  aint0 = 5;
  compare_int_to_lits2 ();
  aint0 = 0x1234;
  compare_int_to_lits3 ();
  compare_int_to_int2 ();
  aint0 = 0;
  compare_int_to_int1 ();
}

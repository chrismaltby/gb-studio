/*

   PIC PORT Test code

 */

/*
   compare.c test compare

 */

bit bit0 = 0;
bit bit1 = 0;

unsigned char success = 0;
unsigned char failures = 0;
unsigned char dummy = 0;

unsigned char achar0 = 0;
unsigned char achar1 = 0;
unsigned int aint0 = 0;
unsigned int aint1 = 0;

char schar0 = 0;
char schar1 = 0;

void
done ()
{

  dummy++;

}

/* achar0 should be zero */

void
compare_char_to_lits1 (void)
{

  if (achar0)
    failures++;

  if (achar0 == 1)
    failures++;

  if (achar0 == 7)
    failures++;

  if (achar0 != 0)
    failures++;
}

/* achar0 should be `5' */
void
compare_char_to_lits2 (void)
{

  if (!achar0)
    failures++;

  if (achar0 == 1)
    failures++;

  if (achar0 == 7)
    failures++;

  if (achar0 != 5)
    failures++;
}


/* achar0 should equal achar1 */
void
compare_char_to_char1 (void)
{

  if (achar0 != achar1)
    failures++;

  if (schar0 != schar1)
    failures++;
}

/* achar0 should be different than achar1 */
void
compare_char_to_char2 (void)
{

  if (achar0 == achar1)
    failures++;

}

/* aint0 should be zero */

void
compare_int_to_lits1 (void)
{

  if (aint0)
    failures++;

  if (aint0 == 1)
    failures++;

  if (aint0 == 7)
    failures++;

  if (aint0 != 0)
    failures++;
}

/* aint0 should be `5' */
void
compare_int_to_lits2 (void)
{

  if (!aint0)
    failures++;

  if (aint0 == 1)
    failures++;

  if (aint0 == 7)
    failures++;

  if (aint0 != 5)
    failures++;
}

/* aint0 should be `0x1234' */
void
compare_int_to_lits3 (void)
{

  if (!aint0)
    failures++;

  if (aint0 == 1)
    failures++;

  if (aint0 == 7)
    failures++;

  if (aint0 != 0x1234)
    failures++;
}

/* aint0 should equal aint1 */
void
compare_int_to_int1 (void)
{

  if (aint0 != aint1)
    failures++;

}

/* aint0 should be different than aint1 */
void
compare_int_to_int2 (void)
{

  if (aint0 == aint1)
    failures++;

}

void
main (void)
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

  success = failures;
  done ();
}

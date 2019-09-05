/*-------------------------------------------------------------------------
 integer to string conversion

 Written by:   Bela Torok, 1999
               bela.torok@kssg.ch
 usage:

 uitoa(unsigned int value, char* string, int radix)
 itoa(int value, char* string, int radix)

 value  ->  Number to be converted
 string ->  Result
 radix  ->  Base of value (e.g.: 2 for binary, 10 for decimal, 16 for hex)
---------------------------------------------------------------------------*/

#define NUMBER_OF_DIGITS 16   /* space for NUMBER_OF_DIGITS + '\0' */

void uitoa(unsigned int value, char* string, int radix)
{
unsigned char index, i;

  index = NUMBER_OF_DIGITS;
  i = 0;

  do {
    string[--index] = '0' + (value % radix);
    if ( string[index] > '9') string[index] += 'A' - ':';   /* continue with A, B,.. */
    value /= radix;
  } while (value != 0);

  do {
    string[i++] = string[index++];
  } while ( index < NUMBER_OF_DIGITS );

  string[i] = 0; /* string terminator */
}

void itoa(int value, char* string, int radix)
{
  if (value < 0 && radix == 10) {
    *string++ = '-';
    uitoa(-value, string, radix);
  }
  else {
    uitoa(value, string, radix);
  }
}
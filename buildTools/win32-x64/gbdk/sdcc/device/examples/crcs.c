#include <8051.h>
typedef unsigned char byte;

byte accum_checksum(byte cs, byte val)
{
	register unsigned char tmp;

	tmp = ((cs<<1) | (cs>>7)) + val;

        return (CY ? ( tmp + 1 ) : tmp);
}

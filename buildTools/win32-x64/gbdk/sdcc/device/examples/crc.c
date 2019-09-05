typedef unsigned char byte;

byte accum_checksum(byte cs, byte val)
{
        unsigned int tmp;

	tmp = ((cs<<7) | (cs>>1)) + val;

	return (byte)tmp + ((byte) (tmp>>8) & 1);
}

/*
  test-memset.c

  Test the speed of memset() on various sized blocks
  Relies on the cycle counter of rrgb for benchmarking
*/

#include <stdlib.h>
#include <string.h>

/*
  Tests

  Size		1	10	256	1000	4096 
  memset-old	44	368	9224	36008	147464
  memset	64	244	5180	20080	82160

  		68%	150%	178%	179%	179%
*/
#define SIZE	(1000)
void main(void)
{
    UBYTE *area, *ptr;
    UWORD i;

    area = malloc(SIZE);
    
    /* Write one bit pattern... */
    memset(area, 0x55U, SIZE);

    /* And another... */
    memset(area, 0xAAU, SIZE);

    /* See if it worked */
    ptr = area;
    for (i=0; i<SIZE; i++) {
	if (*(ptr++) != 0xAAU) {
	    printf("Failed at offset %lx\n", i);
	}
	if (!((UBYTE)i)) {
	    printf("At %lx\r", i);
	}
    }

    /* Dump around the end */
    ptr = area + SIZE - 16;
    printf("\nAt end: \n");
    for (i=0; i<32; i++) {
	printf("%lx: %x\n", (UWORD)((UWORD)&ptr[i] - (UWORD)area - SIZE), ptr[i]);
    }
    printf("\n");
}

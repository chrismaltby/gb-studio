/*
  stress.c

  Stress the malloc system by randomly allocating and freeing various sized
  blocks.  Test of the speed and fragmentation handling, but probably not
  a very good one :)

  Michael Hope 1999
*/
#include <stdlib.h>
#include <stdio.h>
#include <gb.h>
#include <rand.h>
#include "malloc.h"

fixed seed;
extern pmmalloc_hunk malloc_first;

/*
  With malloc_gc(): 10287/20, 601 541 636 t-states = 58475/malloc
  Without: 4468/20, 157 238 544 t-states = 35192/malloc
  With improved free() (join with next): 5322/20, 163 329 020 t-states = 30689/malloc
  With imporved free() (join with last): 10287/20, 254 483 948 t-states = 24738/malloc
*/

/* 
   With the different header: 19377/20, 653 749 348 t-states = 33738/malloc
   With position caching: 12364/20, 220 908 784 t-states = 17867/malloc
*/

/* Stats using rrgb:
   malloc-plain:		22224	
   malloc-short-header:		17777
   malloc-asm:			2620
*/

/* Define if platform has a waitpad() (rrgb doesnt) */
#undef GETSEED

void main(void) 
{
    UBYTE *base[32];
    UBYTE offset;
    UWORD worked = 0;
    UBYTE done = 0;
    UBYTE tests = 0;
    UWORD size;
    UWORD total = 0;

#ifdef GETSEED
    puts("Getting seed");
    puts("Push any key (1)");
    waitpad(0xFF);
    waitpadup();
    seed.b.l = DIV_REG;
    puts("Push any key (2)");
    waitpad(0xFF);
    waitpadup();
    seed.b.h = DIV_REG;

    /* initarand() calls initrand() */
    initrand(seed.w);
#endif
    printf("Testing...\n");

    /* Wipe it */
    memset(base, 0, 32*sizeof(UBYTE *));

    for (tests = 0; tests < 20; tests++) {
	/* And go... */
	done = 0;
	worked = 0;
	malloc_first = 0;

	while (!done) {
	    offset = rand()&0x1f;
	    if (base[offset] != NULL) {
		free(base[offset]);
		//		malloc_gc();
	    }
	    
	    base[offset] = malloc((UWORD)rand() + (UWORD)(rand()&0x3f));
	    if (base[offset] == NULL) {
		done = 1;
	    }
	    worked++;
	    if (!(worked&0xff)) {
		printf("%lu\r", worked);
		//		gotoxy(0, posy());
	    }
	}
	total += worked;
	printf("%lu worked.\n", worked);
    }
    printf("Total: %lu\n", total);
}

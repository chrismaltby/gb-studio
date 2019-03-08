/*
  malloc.c

  Simple implementation of a malloc library for the GB

  Notes:
  * Designed for the Nintendo GB - 8 bitter with little RAM, so efficency and allocation
  speed are important.  recursion or malloc/free pairs are rare.
  * Garbage collection is lazy
  * Singly linked list of 'hunks' - regions of memory
  * Each hunk is preceeded by a header - header describes a singly linked list
  * If the header is corrupted, this system dies - but so does the program so youve got other problems
  * All allocations are on byte boundries
  * See types.h for the definitions of UINT8, INT8...
  * Theres a bug in GBDK 2.0b9 - cant handle pointer addition, requiring (UINT16) casting
*/
#include <gb/malloc.h>
#include <types.h>
#include <stdio.h>

/* First hunk in the linked list */
pmmalloc_hunk malloc_first;

/*
  Simple debug message logger.  Logs to stdout (which is, of course, all that a GB has :)
*/
void debug( char *fun, char *msg )
{
/*	return; */
/*	printf("%s: %s\n", fun, msg );*/
}

/*
  malloc_init

  Initialise the malloc system.  
  Only initalises if the magic number on the first hunk is invalid.
  Note that this number is invalidated in crt0.s 
  
  Returns: INT8, -1 on failure, 0 on success
*/
INT8 malloc_init(void) BANKED
{
	if (malloc_first->magic!=MALLOC_MAGIC) {
		/* Init by setting up the first hunk */

		debug("malloc_init", "Setting up");
		/* malloc_heap_start is set by the linker to point to the start of free memory */
		malloc_first = (pmmalloc_hunk)&malloc_heap_start;

		/* Initalise the linked list */
		malloc_first->next = NULL;
		/* Set the size to all of free memory (mem ends at 0xE000), less 200h for the stack */
		malloc_first->size = (UINT8 *)(0xDFFFU - 0x200) - sizeof(mmalloc_hunk) - (UINT8 *)&malloc_heap_start;
		malloc_first->status = MALLOC_FREE;

		malloc_first->magic = MALLOC_MAGIC;
		return 0;
	}
	return -1;
}

/*
  malloc_gc

  Do a grabage collect on the malloc list.  Join any adjacent, free hunks into one
  free hunk.  Called by malloc() when there is no one free block of memory big
  enough.
  Note that malloc_gc is only called when needed to save processor time
  Note:  assumes that hunks ae consecutive
*/
void malloc_gc(void) NONBANKED
{
    /* Note: assumes that hunks are consecutive */

   
    /* thisHunk is the one that were lookin at */
    /* nextHunk is used when joining hunks */
    pmmalloc_hunk thisHunk, nextHunk;

    /* changed is set if at least two hunks are joined */
    /* Note that logically all will be joined on the first pass, but you get that */
    UINT8 changed;
    
    debug("malloc_gc","Running");

    do {
	thisHunk = malloc_first;
	changed = 0;
	/* Walk the whole of the linked list */
	while (thisHunk && (thisHunk->magic==MALLOC_MAGIC)) {
	    /* Is this hunk free ? */
	    if (thisHunk->status == MALLOC_FREE) {
		/* Yes - if the next is as well, join them */
		nextHunk = thisHunk->next;
		/* This catches the case where there are many consecutive free hunks */
		while (nextHunk->status == MALLOC_FREE) {
		    /* Must be consecutive */
		    changed = 1;
		    thisHunk->size+=nextHunk->size+sizeof(mmalloc_hunk);
		    nextHunk = nextHunk->next;
		    thisHunk->next = nextHunk;
		}
	    }
	    thisHunk=thisHunk->next;
	}
	/* If thisHunk is not NULL, then the magic number was corrupt */
	if (thisHunk!=NULL)
	    debug("malloc_gc", "Corrupted malloc list found.");
    } while (changed);
}
		
/*
  malloc

  Attempt to allocate a hunk of at least 'size' bytes from free memory
  Return:  pointer to the base of free memory on success, NULL if no memory
  was available
*/
void *malloc( UINT16 size ) BANKED
{
    /* thisHunk: list walker
    */
    pmmalloc_hunk thisHunk, insertBefore;
    pmmalloc_hunk newHunk;

    UINT8 firstTry;

    /* Init the system if required */
    if (malloc_first->magic != MALLOC_MAGIC)
	malloc_init();
    
    firstTry = 1;	/* Allows gc if no big enough hunk is found */
	
    do {
	thisHunk = malloc_first;
	
	/* Walk the list */
	while (thisHunk&&(thisHunk->magic == MALLOC_MAGIC)) {
	    debug("malloc", "Entering hunk" );
	    if (thisHunk->status == MALLOC_FREE) {
		debug("malloc", "Found free hunk" );
		
		/* Free, is it big enough? (dont forget the size of the header) */
		if (thisHunk->size >= size+sizeof(mmalloc_hunk)) {
		    
		    debug("malloc","Found a big enough hunk.");
		    
		    /* Yes, big enough */
		    /* Create a new header at the end of this block */
		    /* Note: the header can be of zero length - should add code to combine */
		    newHunk = (pmmalloc_hunk)((UINT8 *)thisHunk + size + sizeof(mmalloc_hunk));
		    newHunk->next = thisHunk->next;
		    /* size is the free space, less that allocated, less the new header */
		    newHunk->size = thisHunk->size - sizeof(mmalloc_hunk) - size;
		    /* Mark it as free and valid */
		    newHunk->status = MALLOC_FREE;
		    newHunk->magic = MALLOC_MAGIC;
		    
		    /* Shrink this hunk, and mark it as used */
		    thisHunk->size = size;
		    thisHunk->status = MALLOC_USED;
		    thisHunk->next = newHunk;
		    
		    /* Return a pointer to the new region */
		    return (void *)((UINT8 *)thisHunk + sizeof(mmalloc_hunk));
		}
	    }
	    thisHunk = thisHunk->next;
	}
	malloc_gc();
	/* Try again after a garbage collect */
    } while (firstTry--);

    /* Couldnt do it */
    return NULL;
}

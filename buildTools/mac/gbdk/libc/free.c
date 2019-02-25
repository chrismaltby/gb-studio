/*
  free.c
  
  Implementation of free()
*/
#include <gb/malloc.h>
#include <stdlib.h>
#include <types.h>

/*
  free

  Attempts to free the memory pointed to by 'ptr'
  Different from the standard free:  returns -1 if already free, or -2 if not part of the malloc list
*/
INT8 free( void *ptr)
{
    /* Do a relativly safe free by only freeing vaild used hunks */
    pmmalloc_hunk thisHunk;
    
    thisHunk = malloc_first;
    
    /* Adjust the pointer to point to the start of the hunk header - makes the comparision easier */
    ptr = (void *)((UINT8 *)ptr - sizeof(mmalloc_hunk));
    
    /* Walk the linked list */
    while (thisHunk && (thisHunk->magic==MALLOC_MAGIC)) {
	/* Is this the hunk? */
	if (thisHunk == ptr) {
	    debug("free", "Found hunk");
	    /* Only free it if it's used */
	    if (thisHunk->status == MALLOC_USED) {
		thisHunk->status = MALLOC_FREE;
		return 0;
	    }
	    debug("free", "Attempt to free a free hunk");
	    return -1;
	}
	/* walking... */
	thisHunk = thisHunk->next;
    };
    
    debug("free", "No hunk found");
    return -2;
}

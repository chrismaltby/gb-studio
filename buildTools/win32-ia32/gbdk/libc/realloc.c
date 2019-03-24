#include <sys/malloc.h>
#include <stdlib.h>
#include <types.h>
#include <string.h>

void *realloc( void *current, int size )
{
	/* First see if the following hunk is free */
	UINT16 nextSize;
	pmmalloc_hunk thisHunk, newHunk, ptr;
	void *newRegion;

	thisHunk = malloc_first;

	ptr = (void *)((UINT16)current - sizeof(mmalloc_hunk));

	if (size==0) {
		free(current);
		return NULL;
	}
	if (current==NULL) {
		return malloc(size);
	}
		
	while (thisHunk && (thisHunk->magic==MALLOC_MAGIC)) {
		if (thisHunk == ptr) {
			debug("realloc", "Found hunk");
			if (thisHunk->size == size )
				return current;
				
			if (thisHunk->size > size ) {
				if (thisHunk->size > size + sizeof( mmalloc_hunk )) {
					/* Shrink the hunk */
					newHunk = (pmmalloc_hunk)(size + sizeof( mmalloc_hunk )+(UINT16)thisHunk);
					newHunk->status = MALLOC_FREE;
					newHunk->size = thisHunk->size - size -sizeof( mmalloc_hunk );
					newHunk->magic = MALLOC_MAGIC;
					newHunk->next = thisHunk->next;

					thisHunk->next = newHunk;
					thisHunk->size = size;
					return current;
				}
				else {	
					/* Cant shrink the hunk as there's not enough room to put a new hunk header */
					return current;
				}
			}
			if (thisHunk->next != NULL) {
				if (thisHunk->next->status == MALLOC_FREE) {
					/* Stand a much better change if we gc first */
					malloc_gc();
					nextSize = thisHunk->next->size;
					
					if ((nextSize + thisHunk->size + sizeof( mmalloc_hunk )) >= size ) {
						/* Next hunk + this is big enough to contain the new hunk */
						
						newHunk = (pmmalloc_hunk)(size + sizeof( mmalloc_hunk )+(UINT16)thisHunk);
						newHunk->next = thisHunk->next->next;
						newHunk->status = MALLOC_FREE;
						newHunk->size = thisHunk->size + nextSize - size -sizeof( mmalloc_hunk );
						newHunk->magic = MALLOC_MAGIC;

						thisHunk->next = newHunk;
						thisHunk->size = size;
						return current;
					}
				}
				/* Oh well.  Allocate a new hunk then free this one */
				newRegion = malloc (size);
				if (newRegion) {
					memcpy( newRegion, current, thisHunk->size );
					free( current );
					return newRegion;
				}
				return NULL;	/* Couldnt do it */
			}
		}
		thisHunk = thisHunk->next;
	};

	debug("realloc", "No hunk found");
	return NULL;
}


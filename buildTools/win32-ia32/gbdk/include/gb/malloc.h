/** @file gb/malloc.h

    Header for a simple implementation of malloc().  This library
    may currently be broken.
*/
#ifndef __SYS_MALLOC_H
#define __SYS_MALLOC_H

#include <types.h>

/* The various constants */
/** The malloc hunk flags
    Note:  Cound have used a negative size a'la TI
*/
#define MALLOC_FREE	1
#define MALLOC_USED	2

/** Magic number of a header.  Gives us some chance of 
    surviving if the list is corrupted*/
#define MALLOC_MAGIC	123

/* malloc hunk header definition */
typedef struct smalloc_hunk	mmalloc_hunk;
typedef struct smalloc_hunk *	pmmalloc_hunk;

struct smalloc_hunk {
    UBYTE 		magic;		/* Magic number - indicates valid hunk header */
    pmmalloc_hunk	next;		/* Pointer to the next hunk */
    UWORD 		size;		/* Size in bytes of this region */
    int 		status;		/* One of MALLOC_FREE or MALLOC_USED */
};

/** Start of free memory, as defined by the linker */
extern UBYTE malloc_heap_start;

/** First hunk */
extern pmmalloc_hunk malloc_first;

/** Garbage collect (join free hunks) */
void malloc_gc(void) NONBANKED;
/** debug message logger */
void debug( char *routine, char *msg ) NONBANKED;

#endif	/* __SYS_MALLOC_H */

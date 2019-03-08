#include <sys/malloc.h>
#include <string.h>
#include <stdlib.h>

void *calloc( int nmem, int size )
{
	void *malloced;

	malloced = malloc( nmem*size );
	if (malloced!=NULL) {
		memset( malloced, 0, nmem*size );
		return malloced;
	}
	return	NULL;
}

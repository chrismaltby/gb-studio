/* strstore.c */

#include <stdio.h>
#include <setjmp.h>
#include <string.h>
#include "asm.h"

/*
 * Allocate space for "str", copy str into new space
 * Return a pointer to the allocated name, or NULL if out of memory
 */
char *StoreString( char *str )
{
   /* To avoid wasting memory headers on small allocations, we
   /  allocate a big chunk and parcel it out as required.
   /  These static variables remember our hunk
   */
   #define STR_STORE_HUNK 2000
   static char *pNextFree = NULL;
   static int  bytesLeft = 0;
   
   int  length;
   char *pStoredString;
   
   length = strlen( str ) + 1;	/* what we need, including null */

   if (length > bytesLeft)
   {
      /* no space.  Allocate a new hunk.  We lose the pointer to any
      /  old hunk.  We don't care, as the names are never deleted.
      */
      pNextFree = (char*)new( STR_STORE_HUNK );
      bytesLeft = STR_STORE_HUNK;
   }

   /* Copy the name and terminating null into the name store */
   pStoredString = pNextFree;
   memcpy( pStoredString, str, length );

   pNextFree += length;
   bytesLeft -= length;

   return pStoredString;
}

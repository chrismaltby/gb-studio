/*
===============================================================================
NEWALLOC - SDCC Memory allocation functions

These functions are wrappers for the standard malloc, realloc and free
functions.


     This program is free software; you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation; either version 2, or (at your option) any
   later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.

   In other words, you are welcome to use, share and improve this program.
   You are forbidden to forbid anyone else to use, share and improve
   what you give them.   Help stamp out software-hoarding!

===============================================================================
*/

#include <stdio.h>
#if defined(__APPLE__) && defined(__MACH__)
#include <sys/malloc.h>
#else
#include <malloc.h>
#endif
#include <stdlib.h>
#include <string.h>
#include <memory.h>
#include <assert.h>
#include "newalloc.h"
#include "sdccconf.h"

#if OPT_ENABLE_LIBGC
#include <gc/gc.h>

#define MALLOC	GC_malloc
#define REALLOC GC_realloc
/* PENDING: This is a mild hack.  If we try to GC_free something
   allocated with malloc() then the program will segfault.  Might as
   well drop it and let the garbase collector take care of things.
*/
#define FREE(_a)	

#else

#define MALLOC	malloc
#define REALLOC realloc
#define FREE	free

#endif

#define TRACEMALLOC	0

#if TRACEMALLOC
enum 
  {
    TRACESIZE = 4096
  };

static int _allocs[TRACESIZE];
static int _above;

static void
_dumpTrace(int code, void *parg)
{
  int i;
  for (i = 0; i < TRACESIZE; i++)
    {
      if (_allocs[i])
        {
          printf("%u %u\n", _allocs[i], i);
        }
    }
  printf("%u above\n", _above);
}

static void
_log(int size)
{
  static int registered;

  if (registered == 0)
    {
      on_exit(_dumpTrace, NULL);
      registered = 1;
    }
  if (size == 12)
    {
      _above++;
    }

  if (size >= TRACESIZE)
    {
      _above++;
    }
  else
    {
      _allocs[size]++;
    }
}
#endif

/*
-------------------------------------------------------------------------------
Clear_realloc - Reallocate a memory block and clear any memory added with
out of memory error detection

-------------------------------------------------------------------------------
*/

void *Clear_realloc(void *OldPtr,size_t OldSize,size_t NewSize)

{
void *NewPtr ;

NewPtr = REALLOC(OldPtr,NewSize) ;

if (!NewPtr)
  {
  printf("ERROR - No more memory\n") ;
/*  werror(E_OUT_OF_MEM,__FILE__,NewSize);*/
  exit (1);
  }

if (NewPtr)
  if (NewSize > OldSize)
    memset((char *) NewPtr + OldSize,0x00,NewSize - OldSize) ;

return NewPtr ;
}
/*
-------------------------------------------------------------------------------
Safe_realloc - Reallocate a memory block with out of memory error detection

-------------------------------------------------------------------------------
*/

void *Safe_realloc(void *OldPtr,size_t NewSize)

{
void *NewPtr ;

NewPtr = REALLOC(OldPtr,NewSize) ;

if (!NewPtr)
  {
  printf("ERROR - No more memory\n") ;
/*  werror(E_OUT_OF_MEM,__FILE__,NewSize);*/
  exit (1);
  }

return NewPtr ;
}
/*
-------------------------------------------------------------------------------
Safe_calloc - Allocate a block of memory from the application heap, clearing
all data to zero and checking for out of memory errors.

-------------------------------------------------------------------------------
*/

void *Safe_calloc(size_t Elements,size_t Size)

{
void *NewPtr ;

NewPtr = MALLOC(Elements*Size) ;
#if TRACEMALLOC
 _log(Elements*Size);
#endif
 
if (!NewPtr)
  {
  printf("ERROR - No more memory\n") ;
/*  werror(E_OUT_OF_MEM,__FILE__,Size);*/
  exit (1);
  }

 memset(NewPtr, 0, Elements*Size);

return NewPtr ;
}
/*
-------------------------------------------------------------------------------
Safe_malloc - Allocate a block of memory from the application heap
and checking for out of memory errors.

-------------------------------------------------------------------------------
*/

void *Safe_malloc(size_t Size)

{
void *NewPtr ;

NewPtr = MALLOC(Size) ;

#if TRACEMALLOC
 _log(Size);
#endif

if (!NewPtr)
  {
  printf("ERROR - No more memory\n") ;
/*  werror(E_OUT_OF_MEM,__FILE__,Size);*/
  exit (1);
  }

return NewPtr ;
}

void *Safe_alloc(size_t Size)
{
  return Safe_calloc(1, Size);
}

void Safe_free(void *p)
{
  FREE(p);
}

char *Safe_strdup(const char *sz)
{
  char *pret;
  assert(sz);

  pret = Safe_alloc(strlen(sz) +1);
  strcpy(pret, sz);

  return pret;
}

void *traceAlloc(allocTrace *ptrace, void *p)
{
  assert(ptrace);
  assert(p);

  /* Also handles where max == 0 */
  if (ptrace->num == ptrace->max)
    {
      /* Add an offset to handle max == 0 */
      ptrace->max = (ptrace->max+2)*2;
      ptrace->palloced = Safe_realloc(ptrace->palloced, ptrace->max * sizeof(*ptrace->palloced));
    }
  ptrace->palloced[ptrace->num++] = p;

  return p;
}

void freeTrace(allocTrace *ptrace)
{
  int i;
  assert(ptrace);

  for (i = 0; i < ptrace->num; i++)
    {
      Safe_free(ptrace->palloced[i]);
    }
  ptrace->num = 0;

  Safe_free(ptrace->palloced);
  ptrace->palloced = NULL;
  ptrace->max = 0;
}



#ifndef _SDCCalloc_H
#define _SDCCalloc_H

#include "SDCCerr.h"

#if OPT_DISABLE_GC != 0

# include <malloc.h>
# define GC_malloc(x) calloc((x), 1)
# define GC_free(x)   free(x)
# define GC_realloc   realloc
# define GC_malloc_atomic malloc

#else

#include "./gc/gc.h" 

#endif


#define  ALLOC(x,sz) if (!(x = GC_malloc(sz)))      \
         {                                          \
            werror(E_OUT_OF_MEM,__FILE__,(long) sz);\
            exit (1);                               \
         }

#define ALLOC_ATOMIC(x,sz)   if (!((x) = GC_malloc_atomic(sz)))   \
         {                                               \
            werror(E_OUT_OF_MEM,__FILE__,(long) sz);     \
            exit (1);                                    \
         }


#endif

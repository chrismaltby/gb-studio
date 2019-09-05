/*-----------------------------------------------------------------
    SDCCset.h - contains support routines for sets .

    Written By - Sandeep Dutta . sandeep.dutta@usa.net (1998)

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
-------------------------------------------------------------------------*/

#ifndef SDCCSET_H
#define SDCCSET_H
#include <stdarg.h>

#if defined(_MSC_VER)
#include "sdcc_vc.h"
#else
#include "sdccconf.h"
#endif // _MSC_VER


#ifndef THROWS
#define THROWS
#define THROW_NONE  0
#define THROW_SRC   1
#define THROW_DEST  2
#define THROW_BOTH  3
#endif

/* linear linked list generic */
typedef struct set
  {
    void *item;
    struct set *curr;
    struct set *next;
  }
set;

#define DEFSETFUNC(fname)  int fname ( void *item, va_list ap)
#define V_ARG(type,var) type var = va_arg(ap,type)

/* set related functions */
void *addSet (set **, void *);
void *addSetHead (set **, void *);
void *getSet (set **);
void deleteSetItem (set **, void *);
void deleteItemIf (set **, int (*cond) (void *, va_list),...);
int isinSet (set *, void *);
typedef int (* insetwithFunc) (void *, void *);
int isinSetWith (set *, void *, insetwithFunc cfunc);
int applyToSet (set * list, int (*somefunc) (void *, va_list),...);
int applyToSetFTrue (set * list, int (*somefunc) (void *, va_list),...);
set *unionSets (set *, set *, int);
set *unionSetsWith (set *, set *, int (*cFunc) (), int);
set *intersectSets (set *, set *, int);
void *addSetIfnotP (set **, void *);
set *setFromSet (set *);
int isSetsEqual (set *, set *);
set *subtractFromSet (set *, set *, int);
int elementsInSet (set *);
set *intersectSetsWith (set *, set *, int (*cFunc) (void *, void *), int);
int isSetsEqualWith (set *, set *, int (*cFunc) (void *, void *));
void *peekSet (set *);
void *setFirstItem (set *);
void *setNextItem (set *);
void setToNull (void **);


#endif

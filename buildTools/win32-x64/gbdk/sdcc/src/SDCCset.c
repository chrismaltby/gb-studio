/*-----------------------------------------------------------------
    SDCCset.c - contains support routines for sets

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

#include <stdio.h>
#include "newalloc.h"
#include <assert.h>
#include "SDCCset.h"

/*-----------------------------------------------------------------*/
/* newSet - will allocate & return a new set entry             */
/*-----------------------------------------------------------------*/
set *
newSet ()
{
  set *lp;

  lp = Safe_alloc ( sizeof (set));
//  if (lp == 0) {
  //  fprintf(stderr, "out of virtual memory: %s\n", __FILE__);
  //  exit(1);
  //  }

  lp->item = lp->curr = lp->next = NULL;
  return lp;
}


/*-----------------------------------------------------------------*/
/* setFromSet - creates a list from another list                */
/*-----------------------------------------------------------------*/
set *
setFromSet (set * lp)
{
  set *lfl = NULL;

  while (lp)
    {
      addSetHead (&lfl, lp->item);
      lp = lp->next;
    }

  return lfl;

}

/*-----------------------------------------------------------------*/
/* isSetsEqual - are the lists equal, they are equal if they have  */
/*               the same objects & the same number of objects     */
/*-----------------------------------------------------------------*/
int 
isSetsEqual (set * dest, set * src)
{
  set *src1 = src;

  for (; dest && src; dest = dest->next, src = src->next)
    {
      if (!isinSet (src1, dest->item))
	return 0;
    }
  if (!dest && !src)
    return 1;
  return 0;
}

/*-----------------------------------------------------------------*/
/* isSetsEqualWith - are the lists equal, they are equal if they have  */
/* the same objects & the same number of objects , compare function    */
/*-----------------------------------------------------------------*/
int 
isSetsEqualWith (set * dest, set * src, int (*cFunc) (void *, void *))
{
  set *src1 = src;

  for (; dest && src; dest = dest->next, src = src->next)
    {
      if (!isinSetWith (src1, dest->item, cFunc))
	return 0;
    }
  if (!dest && !src)
    return 1;
  return 0;
}

/*-----------------------------------------------------------------*/
/* addSetIfnotP - adds to a linked list if not already present   */
/*-----------------------------------------------------------------*/
void *
addSetIfnotP (set ** list, void *item)
{

  if (isinSet (*list, item))
    return item;

  addSetHead (list, item);

  return item;
}

/*-----------------------------------------------------------------*/
/* addSetHead - add item to head of linked list                  */
/*-----------------------------------------------------------------*/
void *
addSetHead (set ** list, void *item)
{
  set *lp = newSet ();

  lp->item = item;
  lp->next = *list;

  assert (lp != lp->item);
  *list = lp;
  return item;

}

/*-----------------------------------------------------------------*/
/* addSet - add an item to a linear linked list                  */
/*-----------------------------------------------------------------*/
void *
addSet (set ** list, void *item)
{
  set *lp;

  /* item added to the tail of the list */

  /* if the list is empty */
  if (*list == NULL)
    {
      lp = *list = newSet ();
    }
  else
    {
      /* go to the end of the list */
      for (lp = *list; lp->next; lp = lp->next);
      lp = lp->next = newSet ();
    }

  /* lp now all set */
  lp->item = item;

  return item;
}

/*-----------------------------------------------------------------*/
/* deleteItemIf - will delete from set if cond function returns 1  */
/*-----------------------------------------------------------------*/
void 
deleteItemIf (set ** sset, int (*cond) (void *, va_list),...)
{
  set *sp = *sset;
  va_list ap;

  while (sp)
    {
      // On the x86 va_list is just a pointer, so due to pass by value
      // ap is not mofified by the called function.  On the PPC va_list
      // is a pointer to a structure, so ap is modified.  Re-init each time.
      va_start (ap, cond);

      if ((*cond) (sp->item, ap))
	{
	  deleteSetItem (sset, sp->item);
	  sp = *sset;
	  continue;
	}

      va_end(ap);
      sp = sp->next;
    }
}

/*-----------------------------------------------------------------*/
/* deleteSetItem - will delete a given item from the list          */
/*-----------------------------------------------------------------*/
void 
deleteSetItem (set ** list, void *item)
{
  set *lp, *lp1;

  /* if list is empty */
  if (*list == NULL)
    return;

  /* if this item is at the head of the list */
  if ((*list)->item == item)
    {
      lp = *list;
      *list = (*list)->next;
      return;
    }

  /* find the item in the list */
  for (lp = *list; lp->next; lp = lp->next)
    {
      if (lp->next->item == item)	/* the next one is it */
	{
	  lp1 = lp->next;	/* this one will need to be freed */
	  lp->next = lp->next->next;	/* take out of list */
	  return;
	}
    }

  /* could not find it */
  return;
}

/*-----------------------------------------------------------------*/
/* isinSet - the item is present in the linked list              */
/*-----------------------------------------------------------------*/
int 
isinSet (set * list, void *item)
{
  set *lp;

  for (lp = list; lp; lp = lp->next)
    if (lp->item == item)
      return 1;

  return 0;
}

/*-----------------------------------------------------------------*/
/* isinSetWith - the item is present in the linked list            */
/*-----------------------------------------------------------------*/
int 
isinSetWith (set * list, void *item, int (*cFunc) (void *, void *))
{
  set *lp;

  for (lp = list; lp; lp = lp->next)
    if ((*cFunc) (lp->item, item))
      return 1;

  return 0;
}

/*-----------------------------------------------------------------*/
/* unionSets - will return the union of the two lists             */
/*-----------------------------------------------------------------*/
set *
unionSets (set * list1, set * list2, int throw)
{
  set *un = NULL;
  set *lp;

  /* add all elements in the first list */
  for (lp = list1; lp; lp = lp->next)
    addSet (&un, lp->item);

  /* now for all those in list2 which does not */
  /* already exist in the list add             */
  for (lp = list2; lp; lp = lp->next)
    if (!isinSet (un, lp->item))
      addSet (&un, lp->item);

  switch (throw)
    {
    case THROW_SRC:
      setToNull ((void **) &list2);
      break;
    case THROW_DEST:
      setToNull ((void **) &list1);
      break;
    case THROW_BOTH:
      setToNull ((void **) &list1);
      setToNull ((void **) &list2);
    }

  return un;
}

/*-----------------------------------------------------------------*/
/* unionSetsWith - will return the union of the two lists          */
/*-----------------------------------------------------------------*/
set *
unionSetsWith (set * list1, set * list2, int (*cFunc) (), int throw)
{
  set *un = NULL;
  set *lp;

  /* add all elements in the first list */
  for (lp = list1; lp; lp = lp->next)
    addSet (&un, lp->item);

  /* now for all those in list2 which does not */
  /* already exist in the list add             */
  for (lp = list2; lp; lp = lp->next)
    if (!isinSetWith (un, lp->item, (int (*)(void *, void *)) cFunc))
      addSet (&un, lp->item);

  switch (throw)
    {
    case THROW_SRC:
      setToNull ((void **) &list2);
      break;
    case THROW_DEST:
      setToNull ((void **) &list1);
      break;
    case THROW_BOTH:
      setToNull ((void **) &list1);
      setToNull ((void **) &list2);
    }

  return un;
}

/*-----------------------------------------------------------------*/
/* intersectSets - returns list of items in common to two lists    */
/*-----------------------------------------------------------------*/
set *
intersectSets (set * list1, set * list2, int throw)
{
  set *in = NULL;
  set *lp;

  /* we can take any one of the lists and iterate over it */
  for (lp = list1; lp; lp = lp->next)
    if (isinSet (list2, lp->item))
      addSetHead (&in, lp->item);

  switch (throw)
    {
    case THROW_SRC:
      setToNull ((void **) &list2);
      break;
    case THROW_DEST:
      setToNull ((void **) &list1);
      break;
    case THROW_BOTH:
      setToNull ((void **) &list1);
      setToNull ((void **) &list2);
    }

  return in;
}

/*-----------------------------------------------------------------*/
/* intersectSetsWith - returns list of items in common to two lists */
/*-----------------------------------------------------------------*/
set *
intersectSetsWith (set * list1, set * list2,
		   int (*cFunc) (void *, void *), int throw)
{
  set *in = NULL;
  set *lp;

  /* we can take any one of the lists and iterate over it */
  for (lp = list1; lp; lp = lp->next)
    if (isinSetWith (list2, lp->item, cFunc))
      addSetHead (&in, lp->item);

  switch (throw)
    {
    case THROW_SRC:
      setToNull ((void **) &list2);
      break;
    case THROW_DEST:
      setToNull ((void **) &list1);
      break;
    case THROW_BOTH:
      setToNull ((void **) &list1);
      setToNull ((void **) &list2);
    }

  return in;
}

/*-----------------------------------------------------------------*/
/* elementsInSet - elements count of a set                         */
/*-----------------------------------------------------------------*/
int 
elementsInSet (set * s)
{
  set *loop = s;
  int count = 0;

  while (loop)
    {
      count++;
      loop = loop->next;
    }

  return count;
}

/*-----------------------------------------------------------------*/
/* subtractFromSet - take away from set1 elements of set2          */
/*-----------------------------------------------------------------*/
set *
subtractFromSet (set * left, set * right, int throw)
{
  set *result = setFromSet (left);
  set *loop;

  if (right)
    {
      for (loop = right; loop; loop = loop->next)
	if (isinSet (result, loop->item))
	  deleteSetItem (&result, loop->item);
    }

  switch (throw)
    {
    case THROW_SRC:
      setToNull ((void **) &right);
      break;
    case THROW_DEST:
      setToNull ((void **) &left);
      break;
    case THROW_BOTH:
      setToNull ((void **) &left);
      setToNull ((void **) &right);
      break;
    }

  return result;
}

/*-----------------------------------------------------------------*/
/* applyToSet - will call the supplied function with each item     */
/*-----------------------------------------------------------------*/
int 
applyToSet (set * list, int (*somefunc) (void *, va_list),...)
{
  set *lp;
  va_list ap;
  int rvalue = 0;

  for (lp = list; lp; lp = lp->next)
    {
      va_start (ap, somefunc);
      rvalue += (*somefunc) (lp->item, ap);
      va_end (ap);
    }
  return rvalue;
}

/*-----------------------------------------------------------------*/
/* applyToSetFTrue - will call the supplied function with each item */
/*                   until list is exhausted or a true is returned */
/*-----------------------------------------------------------------*/
int 
applyToSetFTrue (set * list, int (*somefunc) (void *, va_list),...)
{
  set *lp;
  va_list ap;
  int rvalue = 0;

  for (lp = list; lp; lp = lp->next)
    {
      va_start (ap, somefunc);
      rvalue += (*somefunc) (lp->item, ap);
      va_end (ap);
      if (rvalue)
	break;
    }
  return rvalue;
}

/*-----------------------------------------------------------------*/
/* peekSet - will return the first element of the set              */
/*-----------------------------------------------------------------*/
void *
peekSet (set * sp)
{
  if (!sp)
    return NULL;

  return sp->item;
}

/*-----------------------------------------------------------------*/
/* setFirstItem - gets the first item in the set, begins iteration */
/*-----------------------------------------------------------------*/
void *
setFirstItem (set * sset)
{
  if (sset)
    {
      sset->curr = sset;
      return sset->item;
    }

  return NULL;
}
/*-----------------------------------------------------------------*/
/* setNextItem - gets the next item, changes the iteration         */
/*-----------------------------------------------------------------*/
void *
setNextItem (set * sset)
{
  if (sset && sset->curr)
    {
      sset->curr = sset->curr->next;
      if (sset->curr)
	return sset->curr->item;
    }
  return NULL;
}

/*-----------------------------------------------------------------*/
/* getSet - will delete & return the first item from the set   */
/*-----------------------------------------------------------------*/
void *
getSet (set ** list)
{
  set *lp;
  void *item;

  /* if list is empty then we cannot delete */
  if (*list == NULL)
    return (void *) NULL;


  /* find the item in the list */
  lp = *list;
  item = lp->item;		/* save the item */

  *list = lp->next;
  return item;
}

/*-----------------------------------------------------------------*/
/* setToNull - will throw away the entire list                   */
/*-----------------------------------------------------------------*/
void 
setToNull (void **item)
{

  if (!item)
    return;

  if (!*item)
    return;
  Safe_free (*item);
  *item = NULL;
}

/*-----------------------------------------------------------------
    SDCChast.c - contains support routines for hashtables

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
#include <string.h>
#include <limits.h>
#include <assert.h>
#include "SDCCglobl.h"
#include "SDCChasht.h"
#include "newalloc.h"

#define DEFAULT_HTAB_SIZE 128

/*-----------------------------------------------------------------*/
/* newHashtItem - creates a new hashtable Item                     */
/*-----------------------------------------------------------------*/
static hashtItem *
_newHashtItem (int key, void *pkey, void *item)
{
  hashtItem *htip;

  htip = Safe_alloc ( sizeof (hashtItem));

  htip->key = key;
  htip->pkey = pkey;
  htip->item = item;
  htip->next = NULL;
  return htip;
}

/*-----------------------------------------------------------------*/
/* newHashTable - allocates a new hashtable of size                */
/*-----------------------------------------------------------------*/
hTab *
newHashTable (int size)
{
  hTab *htab;

  htab = Safe_alloc ( sizeof (hTab));

  if (!(htab->table = Safe_alloc ((size + 1) * sizeof (hashtItem *))))
    {
      fprintf (stderr, "out of virtual memory %s %d\n",
	       __FILE__, (size + 1) * sizeof (hashtItem *));
      exit (1);
    }
  htab->minKey = htab->size = size;
  return htab;
}


void 
hTabAddItemLong (hTab ** htab, int key, void *pkey, void *item)
{
  hashtItem *htip;
  hashtItem *last;

  if (!(*htab))
    *htab = newHashTable (DEFAULT_HTAB_SIZE);

  if (key > (*htab)->size)
    {
      int i;
      (*htab)->table = Safe_realloc ((*htab)->table,
				     (key * 2 + 2) * sizeof (hashtItem *));
      for (i = (*htab)->size + 1; i <= (key * 2 + 1); i++)
	(*htab)->table[i] = NULL;
      (*htab)->size = key * 2 + 1;
    }

  /* update the key */
  if ((*htab)->maxKey < key)
    (*htab)->maxKey = key;

  if ((*htab)->minKey > key)
    (*htab)->minKey = key;

  /* create the item */
  htip = _newHashtItem (key, pkey, item);

  /* if there is a clash then goto end of chain */
  if ((last = (*htab)->table[key]))
    {
      while (last->next)
	last = last->next;
      last->next = htip;
    }
  else
    /* else just add it */
    (*htab)->table[key] = htip;
  (*htab)->nItems++;
}

/*-----------------------------------------------------------------*/
/* hTabAddItem - adds an item to the hash table                    */
/*-----------------------------------------------------------------*/
void 
hTabAddItem (hTab ** htab, int key, void *item)
{
  hTabAddItemLong (htab, key, NULL, item);
}

/*-----------------------------------------------------------------*/
/* hTabDeleteItem - either delete an item                          */
/*-----------------------------------------------------------------*/
void 
hTabDeleteItem (hTab ** htab, int key,
		const void *item, DELETE_ACTION action,
		int (*compareFunc) (const void *, const void *))
{
  hashtItem *htip, **htipp;

  if (!(*htab))
    return;

  /* first check if anything exists in the slot */
  if (!(*htab)->table[key])
    return;

  /* if delete chain */
  if (action == DELETE_CHAIN)
    (*htab)->table[key] = NULL;
  else
    {

      /* delete specific item */
      /* if a compare function is given then use the compare */
      /* function to find the item, else just compare the items */

      htipp = &((*htab)->table[key]);
      htip = (*htab)->table[key];
      for (; htip; htip = htip->next)
	{

	  if (compareFunc ? compareFunc (item, htip->item) :
	      (item == htip->item))
	    {
	      *htipp = htip->next;
	      break;
	    }

	  htipp = &(htip->next);
	}

    }

  (*htab)->nItems--;

  if (!(*htab)->nItems)
    {
      *htab = NULL;
    }
}

/*-----------------------------------------------------------------*/
/* hTabDeleteAll - deletes all items in a hash table to reduce mem */
/*                 leaks written by                                */
/*                "BESSIERE Jerome" <BESSIERE_Jerome@stna.dgac.fr> */
/*-----------------------------------------------------------------*/
void 
hTabDeleteAll (hTab * p)
{
  if (p && p->table)
    {
      register int i;
      register hashtItem *jc, *jn;
      for (i = 0; i < p->size; i++)
	{

	  if (!(jc = p->table[i]))
	    continue;
	  jn = jc->next;
	  while (jc)
	    {
	      Safe_free (jc);
	      if ((jc = jn))
		jn = jc->next;
	    }
	  p->table[i] = NULL;
	}
      Safe_free (p->table);
    }
}

/*-----------------------------------------------------------------*/
/* hTabClearAll - clear all entries in the table (does not free)    */
/*-----------------------------------------------------------------*/
void 
hTabClearAll (hTab * htab)
{

  if (!htab || !htab->table)
    {
      printf ("null table\n");
      return;
    }
  memset (htab->table, 0, htab->size * sizeof (hashtItem *));

  htab->minKey = htab->size;
  htab->currKey = htab->nItems = htab->maxKey = 0;
}

static const hashtItem *
_findItem (hTab * htab, int key, void *item, int (*compareFunc) (void *, void *))
{
  hashtItem *htip;

  for (htip = htab->table[key]; htip; htip = htip->next)
    {
      /* if a compare function is given use it */
      if (compareFunc && compareFunc (item, htip->item))
	break;
      else if (item == htip->item)
	break;
    }
  return htip;
}

static const hashtItem *
_findByKey (hTab * htab, int key, const void *pkey, int (*compare) (const void *, const void *))
{
  hashtItem *htip;

  assert (compare);

  if (!htab)
    return NULL;

  for (htip = htab->table[key]; htip; htip = htip->next)
    {
      /* if a compare function is given use it */
      if (compare && compare (pkey, htip->pkey))
	{
	  break;
	}
      else
	{
	  if (pkey == htip->pkey)
	    {
	      break;
	    }
	}
    }
  return htip;
}

void *
hTabFindByKey (hTab * h, int key, const void *pkey, int (*compare) (const void *, const void *))
{
  const hashtItem *item;

  if ((item = _findByKey (h, key, pkey, compare)))
    return item->item;
  return NULL;
}

int 
hTabDeleteByKey (hTab ** h, int key, const void *pkey, int (*compare) (const void *, const void *))
{
  hashtItem *htip, **htipp;
  bool found = FALSE;

  if (!(*h))
    return 0;

  /* first check if anything exists in the slot */
  if (!(*h)->table[key])
    return 0;

  /* delete specific item */
  /* if a compare function is given then use the compare */
  /* function to find the item, else just compare the items */

  htipp = &((*h)->table[key]);
  htip = (*h)->table[key];
  for (; htip; htip = htip->next)
    {
      if (
	   (compare && compare (pkey, htip->pkey)) ||
	   pkey == htip->pkey)
	{
	  *htipp = htip->next;
          found = TRUE;
	  break;
	}
      htipp = &(htip->next);
    }

  if (found == TRUE)
    {
      (*h)->nItems--;
      
      if (!(*h)->nItems)
        {
          *h = NULL;
        }
    }

  return 1;
}

/*-----------------------------------------------------------------*/
/* hTabIsInTable - will determine if an Item is in the hasht       */
/*-----------------------------------------------------------------*/
int 
hTabIsInTable (hTab * htab, int key,
	       void *item, int (*compareFunc) (void *, void *))
{
  if (_findItem (htab, key, item, compareFunc))
    return 1;
  return 0;
}

/*-----------------------------------------------------------------*/
/* hTabFirstItem - returns the first Item in the hTab              */
/*-----------------------------------------------------------------*/
void *
hTabFirstItem (hTab * htab, int *k)
{
  int key;

  if (!htab)
    return NULL;

  for (key = htab->minKey; key <= htab->maxKey; key++)
    {
      if (htab->table[key])
	{
	  htab->currItem = htab->table[key];
	  htab->currKey = key;
	  *k = key;
	  return htab->table[key]->item;
	}
    }
  return NULL;
}

/*-----------------------------------------------------------------*/
/* hTabNextItem - returns the next item in the hTab                */
/*-----------------------------------------------------------------*/
void *
hTabNextItem (hTab * htab, int *k)
{
  int key;

  if (!htab)
    return NULL;

  /* if this chain not ended then */
  if (htab->currItem->next)
    {
      *k = htab->currItem->key;
      return (htab->currItem = htab->currItem->next)->item;
    }

  /* find the next chain which has something */
  for (key = htab->currKey + 1; key <= htab->maxKey; key++)
    {
      if (htab->table[key])
	{
	  htab->currItem = htab->table[key];
	  *k = htab->currKey = key;
	  return htab->table[key]->item;
	}
    }

  return NULL;
}

/*-----------------------------------------------------------------*/
/* hTabFirstItemWK - returns the first Item in the hTab for a key  */
/*-----------------------------------------------------------------*/
void *
hTabFirstItemWK (hTab * htab, int wk)
{

  if (!htab)
    return NULL;

  if (wk < htab->minKey || wk > htab->maxKey)
    return NULL;

  htab->currItem = htab->table[wk];
  htab->currKey = wk;

  return (htab->table[wk] ? htab->table[wk]->item : NULL);
}

/*-----------------------------------------------------------------*/
/* hTabNextItem - returns the next item in the hTab for a key      */
/*-----------------------------------------------------------------*/
void *
hTabNextItemWK (hTab * htab)
{

  if (!htab)
    return NULL;

  /* if this chain not ended then */
  if (htab->currItem->next)
    {
      return (htab->currItem = htab->currItem->next)->item;
    }

  return NULL;
}

/*-----------------------------------------------------------------*/
/* hTabFromTable - hash Table from a hash table                    */
/*-----------------------------------------------------------------*/
hTab *
hTabFromTable (hTab * htab)
{
  hTab *nhtab;
  hashtItem *htip;
  int key;

  if (!htab)
    return NULL;

  nhtab = newHashTable (htab->size);

  for (key = htab->minKey; key <= htab->maxKey; key++)
    {

      for (htip = htab->table[key]; htip; htip = htip->next)
	hTabAddItem (&nhtab, htip->key, htip->item);
    }

  return nhtab;
}

/*-----------------------------------------------------------------*/
/* isHtabsEqual - returns 1 if all items in htab1 is found in htab2 */
/*-----------------------------------------------------------------*/
int 
isHtabsEqual (hTab * htab1, hTab * htab2,
	      int (*compareFunc) (void *, void *))
{
  void *item;
  int key;

  if (htab1 == htab2)
    return 1;

  if (htab1 == NULL || htab2 == NULL)
    return 0;

  /* if they are different sizes then */
  if (htab1->nItems != htab2->nItems)
    return 0;

  /* now do an item by item check */
  for (item = hTabFirstItem (htab1, &key); item;
       item = hTabNextItem (htab1, &key))
    if (!hTabIsInTable (htab2, key, item, compareFunc))
      return 0;

  return 1;
}


/*-----------------------------------------------------------------*/
/* hTabSearch - returns the first Item with the specified key      */
/*-----------------------------------------------------------------*/
hashtItem *
hTabSearch (hTab * htab, int key)
{
  if (!htab)
    return NULL;

  if ((key < htab->minKey) || (key > htab->maxKey))
    return NULL;

  if (!htab->table[key])
    return NULL;

  return htab->table[key];
}

/*-----------------------------------------------------------------*/
/* hTabItemWithKey - returns the first item with the given key     */
/*-----------------------------------------------------------------*/
void *
hTabItemWithKey (hTab * htab, int key)
{
  hashtItem *htip;

  if (!(htip = hTabSearch (htab, key)))
    return NULL;

  return htip->item;
}

/*-----------------------------------------------------------------*/
/*hTabAddItemIfNotP - adds an item with nothing found with key     */
/*-----------------------------------------------------------------*/
void 
hTabAddItemIfNotP (hTab ** htab, int key, void *item)
{
  if (!*htab)
    {
      hTabAddItem (htab, key, item);
      return;
    }

  if (hTabItemWithKey (*htab, key))
    return;

  hTabAddItem (htab, key, item);
}

/** Simple implementation of a hash table which uses
    string (key, value) pairs.  If a key already exists in the
    table, the newly added value will replace it.
    This is used for the assembler token table.  The replace existing
    condition is used to implement inheritance.
*/
static int 
_compare (const void *s1, const void *s2)
{
  return !strcmp (s1, s2);
}

static int 
_hash (const char *sz)
{
  /* Dumb for now */
  return *sz;
}

void 
shash_add (hTab ** h, const char *szKey, const char *szValue)
{
  int key = _hash (szKey);
  /* First, delete any that currently exist */
  hTabDeleteByKey (h, key, szKey, _compare);
  /* Now add in ours */
  hTabAddItemLong (h, key, Safe_strdup (szKey), Safe_strdup (szValue));
}

const char *
shash_find (hTab * h, const char *szKey)
{
  int key = _hash (szKey);
  return (char *) hTabFindByKey (h, key, szKey, _compare);
}

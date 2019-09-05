/*-----------------------------------------------------------------
    SDCChast.h - contains support routines for hashtables/sets .

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


#ifndef SDCCHASHT_H
#define SDCCHASHT_H



/* hashtable item */
typedef struct hashtItem
  {
    int key;
    /* Pointer to the key that was hashed for key.
       Used for a hash table with unique keys. */
    void *pkey;
    void *item;
    struct hashtItem *next;
  }
hashtItem;

/* hashtable */
typedef struct hTab
  {
    int size;			/* max number of items */
    int minKey;			/* minimum key value   */
    int maxKey;			/* maximum key value */
    hashtItem **table;		/* the actual table  */
    int currKey;		/* used for iteration */
    hashtItem *currItem;	/* current item within the list */
    int nItems;
  }
hTab;

typedef enum
  {
    DELETE_CHAIN = 1,
    DELETE_ITEM
  }
DELETE_ACTION;


/*-----------------------------------------------------------------*/
/*           Forward   definition    for   functions               */
/*-----------------------------------------------------------------*/

/* hashtable related functions */
hTab *newHashTable (int);
void hTabAddItem (hTab **, int key, void *item);
/** Adds a new item to the hash table.
    @param h		The hash table to add to
    @param key		A hashed version of pkey
    @param pkey		A copy of the key.  Owned by the
    			hash table after this function.
    @param item		Value for this key.
*/
void hTabAddItemLong (hTab ** h, int key, void *pkey, void *item);
/** Finds a item by exact key.
    Searches all items in the key 'key' for a key that
    according to 'compare' matches pkey.
    @param h		The hash table to search
    @param key		A hashed version of pkey.
    @param pkey		The key to search for
    @param compare	Returns 0 if pkey == this
*/
void *hTabFindByKey (hTab * h, int key, const void *pkey, int (*compare) (const void *, const void *));
/** Deletes an item with the exact key 'pkey'
    @see hTabFindByKey
*/
int hTabDeleteByKey (hTab ** h, int key, const void *pkey, int (*compare) (const void *, const void *));

void hTabDeleteItem (hTab **, int key,
		     const void *item, DELETE_ACTION action,
		     int (*compareFunc) (const void *, const void *));
int hTabIsInTable (hTab *, int, void *,
		   int (*compareFunc) (void *, void *));
void *hTabFirstItem (hTab *, int *);
void *hTabNextItem (hTab *, int *);
hTab *hTabFromTable (hTab *);
int isHtabsEqual (hTab *, hTab *, int (*compareFunc) (void *, void *));
hashtItem *hTabSearch (hTab *, int);
void *hTabItemWithKey (hTab *, int);
void hTabAddItemIfNotP (hTab **, int, void *);
void hTabDeleteAll (hTab *);
void *hTabFirstItemWK (hTab * htab, int wk);
void *hTabNextItemWK (hTab * htab);
void hTabClearAll (hTab * htab);

/** Find the first item that either is 'item' or which
    according to 'compareFunc' is the same as item.
    @param compareFunc		strcmp like compare function, may be null.
*/
void *hTabFindItem (hTab * htab, int key,
		    void *item, int (*compareFunc) (void *, void *));

void shash_add (hTab ** h, const char *szKey, const char *szValue);
const char *shash_find (hTab * h, const char *szKey);

#endif

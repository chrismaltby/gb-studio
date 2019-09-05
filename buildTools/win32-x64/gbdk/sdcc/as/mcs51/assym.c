/* assym.c */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 *
 * 28-Oct-97 JLH: 
 *	     - lookup: Use StoreString for sym construction
 *	     - change symeq() to do length-independent string compare
 *	     - change hash() to do length-independent hash calculation
 * 29-Oct-97 JLH:
 *           - make mnemonics case insensitive ALWAYS
 *           - make hash() case-insensitive always
 *           - replace symeq() call in mlookup with strcmpi
 */

#include <stdio.h>
#include <setjmp.h>
#include <string.h>
#if defined(_MSC_VER)
#include <malloc.h>
#else
#include <alloc.h>
#endif
#include "asm.h"

/*)Module	assym.c
 *
 *	The module assym.c contains the functions that operate
 *	on the mnemonic/directive and symbol structures.
 *
 *	assym.c contains the following functions:
 *		VOID	allglob()
 *		area *	alookup()
 *		int	hash()
 *		sym *	lookup()
 *		mne *	mlookup()
 *		VOID *	new()
 *		int	symeq()
 *		VOID	syminit()
 *		VOID	symglob()
 *
 *	assym.c contains no local/static variables.
 */

/*)Function	VOID	syminit()
 *
 *	The function syminit() is called early in the game
 *	to set up the hashtables.  First all buckets in a
 *	table are cleared.  Then a pass is made through
 *	the respective symbol lists, linking them into
 *	their hash buckets.  Finally the base area pointer
 *	is set to 'dca'.
 *
 *	local variables:
 *		int	h		computed hash value
 *		mne *	mp		pointer to a mne structure
 *		mne **	mpp		pointer to an array of
 *					mne structure pointers
 *		sym *	sp		pointer to a sym structure
 *		sym **	spp		pointer to an array of
 *					sym structure pointers
 *
 *	global variables:
 *		area	area[]		single elememt area array
 *		area	dca		defined as area[0]
 *		mne * mnehash[]		array of pointers to NHASH
 *					linked mnemonic/directive lists
 *		sym * symhash[]		array of pointers to NHASH
 *					linked symbol lists
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		(1)	The symbol hash tables are initialized,
 *			the only defined symbol is '.'.
 *		(2)	The mnemonic/directive hash tables are
 *			initialized with the assembler directives
 *			and mnemonics found in the machine dependent
 *			file ___pst.c.
 *		(3)	The area pointer is initialized to dca (area[0]).
 */

VOID
syminit()
{
	register struct mne  *mp;
	struct mne **mpp;
	register struct sym  *sp;
	struct sym **spp;
	register int h;

	mpp = &mnehash[0];
	while (mpp < &mnehash[NHASH])
		*mpp++ = NULL;
	mp = &mne[0];
	for (;;) {
		h = hash(mp->m_id);
		mp->m_mp = mnehash[h];
		mnehash[h] = mp;
		if (mp->m_flag&S_END)
			break;
		++mp;
	}

	spp = &symhash[0];
	while (spp < &symhash[NHASH])
		*spp++ = NULL;
	sp = &sym[0];
	for (;;) {
		h = hash(sp->s_id);
		sp->s_sp = symhash[h];
		symhash[h] = sp;
		if (sp->s_flag&S_END)
			break;
		++sp;
	}

	areap = &dca;
}

/*)Function	area *	alookup(id)
 *
 *		char *	id		area name string
 *
 *	The function alookup() searches the area list for a
 *	match with id.  If the area is defined then a pointer
 *	to this area is returned else a NULL is returned.
 *
 *	local variables:
 *		area *	ap		pointer to area structure
 *
 *	global variables:
 *		area *	areap		pointer to an area structure
 *
 *	functions called:
 *		int	symeq()		assym.c
 *
 *	side effects:
 *		none
 */

struct area *
alookup(id)
char *id;
{
	register struct area *ap;

	ap = areap;
	while (ap) {
		if (symeq(id, ap->a_id)) {
			return (ap);
		}
		ap = ap->a_ap;
	}
	return(NULL);
}

/*)Function	mne *	mlookup(id)
 *
 *		char *	id		mnemonic/directive name string
 *
 *	The function mlookup() searches the mnemonic/directive
 *	hash tables for a match returning a pointer to the
 *	mne structure else it returns a NULL.
 *
 *	local variables:
 *		mne *	mp		pointer to mne structure
 *		int	h		calculated hash value
 *
 *	global variables:
 *		mne * mnehash[]		array of pointers to NHASH
 *					linked mnemonic/directive lists
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		none
 */

struct mne *
mlookup(id)
char *id;
{
	register struct mne *mp;
	register int h;

	h = hash(id);
	mp = mnehash[h];
	while (mp) {
		if (strcmpi(id, mp->m_id) == 0)	/* JLH: case insensitive */
			return (mp);
		mp = mp->m_mp;
	}
	return (NULL);
}

/*)Function	sym *	lookup(id)
 *
 *		char *	id		symbol name string
 *
 *	The function lookup() searches the symbol hash tables for
 *	a symbol name match returning a pointer to the sym structure.
 *	If the symbol is not found then a sym structure is created,
 *	initialized, and linked to the appropriate hash table.
 *	A pointer to this new sym structure is returned.
 *
 *	local variables:
 *		int	h		computed hash value
 *		sym *	sp		pointer to a sym structure
 *
 *	global varaibles:
 *		sym * symhash[]		array of pointers to NHASH
 *					linked symbol lists
 *
 *	functions called:
 *		int	hash()		assym.c
 *		VOID *	new()		assym.c
 *		int	symeq()		assym.c
 *
 *	side effects:
 *		If the function new() fails to allocate space
 *		for the new sym structure the assembly terminates.
 */

struct sym *
lookup(id)
char *id;
{
	register struct sym *sp;
	register int h;

	h = hash(id);
	sp = symhash[h];
	while (sp) {
		if (symeq(id, sp->s_id))
			return (sp);
		sp = sp->s_sp;
	}
	sp = (struct sym *) new (sizeof(struct sym));
	sp->s_sp = symhash[h];
	symhash[h] = sp;
	sp->s_tsym = NULL;
	sp->s_id = StoreString( id ); /* JLH */
	sp->s_type = S_NEW;
	sp->s_flag = 0;
	sp->s_area = NULL;
	sp->s_ref = 0;
	sp->s_addr = 0;
	return (sp);
}

/*)Function	VOID	symglob()
 *
 *	The function symglob() will mark all symbols of
 *	type S_NEW as global.  Called at the beginning of pass 1
 *	if the assembly option -g was specified.
 *
 *	local variables:
 *		sym *	sp		pointer to a sym structure
 *		int	i		loop index
 *
 *	global variables:
 *		sym * symhash[]		array of pointers to NHASH
 *					linked symbol lists
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		Symbol types changed.
 */

VOID
symglob()
{
	register struct sym *sp;
	register int i;

	for (i=0; i<NHASH; ++i) {
		sp = symhash[i];
		while (sp != NULL) {
			if (sp->s_type == S_NEW)
				sp->s_flag |= S_GBL;
			sp = sp->s_sp;
		}
	}
}

/*)Function	VOID	allglob()
 *
 *	The function allglob() will mark all symbols of
 *	type S_USER as global.  Called at the beginning of pass 1
 *	if the assembly option -a was specified.
 *
 *	local variables:
 *		sym *	sp		pointer to a sym structure
 *		int	i		loop index
 *
 *	global variables:
 *		sym * symhash[]		array of pointers to NHASH
 *					linked symbol lists
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		Symbol types changed.
 */

VOID
allglob()
{
	register struct sym *sp;
	register int i;

	for (i=0; i<NHASH; ++i) {
		sp = symhash[i];
		while (sp != NULL) {
			if (sp != &dot && sp->s_type == S_USER)
				sp->s_flag |= S_GBL;
			sp = sp->s_sp;
		}
	}
}

/*)Function	int	symeq(p1, p2)
 *
 *		char *	p1		name string
 *		char *	p2		name string
 *
 *	The function symeq() compares the two name strings for a match.
 *	The return value is 1 for a match and 0 for no match.
 *
 *	local variables:
 *		int	h		loop counter
 *
 *	global variables:
 *		char	ccase[]		an array of characters which
 *					perform the case translation function
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		none
 *
 */

int
symeq(p1, p2)
register char *p1, *p2;
{
#if	CASE_SENSITIVE
		return (strcmp( p1, p2 ) == 0);
#else
		return (strcmpi( p1, p2 ) == 0);
#endif
}

/*)Function	int	hash(p)
 *
 *		char *	p		pointer to string to hash
 *
 *	The function hash() computes a hash code using the sum
 *	of all characters mod table size algorithm.
 *
 *	local variables:
 *		int	h		accumulated character sum
 *		int	n		loop counter
 *
 *	global variables:
 *		char	ccase[]		an array of characters which
 *					perform the case translation function
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		none
 */
 
int
hash(p)
register char *p;
{
	register int h;

	h = 0;
	while (*p) {
        	/* JLH: case insensitive hash:  Doesn't much affect
                 * hashing, and allows same function for mnemonics and symbols
                 */
		h += ccase[(int)*p++];
	}
	return (h&HMASK);
}

/*)Function	VOID *	new(n)
 *
 *		unsigned int	n	allocation size in bytes
 *
 *	The function new() allocates n bytes of space and returns
 *	a pointer to this memory.  If no space is available the
 *	assembly is terminated.
 *
 *	local variables:
 *		VOID *	p		a general pointer
 *
 *	global variables:
 *		none
 *
 *	functions called:
 *		VOID	asexit()	asmain.c
 *		int	fprintf()	c_library
 *		VOID *	malloc()	c_library
 *
 *	side effects:
 *		Memory is allocated, if allocation fails
 *		the assembly is terminated.
 */

VOID *
new(n)
unsigned int n;
{
	register VOID *p;

	if ((p = (VOID *) malloc(n)) == NULL) {
		fprintf(stderr, "Out of space!\n");
		asexit(1);
	}
	return (p);
}

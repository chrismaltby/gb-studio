/* lksym.c */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 */

#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "aslink.h"

/*)Module	lksym.c
 *
 *	The module lksym.c contains the functions that operate
 *	on the symbol structures.
 *
 *	lksym.c contains the following functions:
 *		int	hash()
 *		sym *	lkpsym()
 *		VOID *	new()
 *		sym *	newsym()
 *		VOID	symdef()
 *		int	symeq()
 *		VOID	syminit()
 *		VOID	symmod()
 *		Addr_T	symval()
 *
 *	lksym.c contains no local/static variables.
 */

/*)Function	VOID	syminit()
 *
 *	The function syminit() is called to clear the hashtable.
 *
 *	local variables:
 *		int	h		computed hash value
 *		sym **	spp		pointer to an array of
 *					sym structure pointers
 *
 *	global variables:
 *		sym * symhash[]		array of pointers to NHASH
 *					linked symbol lists
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		(1)	The symbol hash tables are cleared
 */

VOID
syminit()
{
	struct sym **spp;

	spp = &symhash[0];
	while (spp < &symhash[NHASH])
		*spp++ = NULL;
}

/*)Function	sym *	newsym()
 *
 *	The function newsym() is called to evaluate the symbol
 *	definition/reference directive from the .rel file(s).
 *	If the symbol is not found in the symbol table a new
 *	symbol structure is created.  Evaluation of the
 *	directive determines if this is a reference or a definition.
 *	Multiple definitions of the same variable will be flagged
 *	as an error if the values are not identical.  A symbol
 *	definition places the symbol value and area extension
 *	into the symbols data structure.  And finally, a pointer
 *	to the symbol structure is placed into the head structure
 *	symbol list.  Refer to the description of the header, symbol,
 *	area, and areax structures in lkdata.c for structure and
 *	linkage details.
 *
 *	local variables:
 *		int	c		character from input text
 *		int	i		evaluation value
 *		char	id[]		symbol name
 *		int	nglob		number of symbols in this header
 *		sym *	tsp		pointer to symbol structure
 *		sym **	s		list of pointers to symbol structures
 *
 *	global variables:
 *		areax	*axp		Pointer to the current
 *				 	areax structure
 *		head	*headp		The pointer to the first
 *				 	head structure of a linked list
 *		int	lkerr		error flag
 *
 *	functions called:
 *		Addr_T	eval()		lkeval.c
 *		VOID	exit()		c_library
 *		int	fprintf()	c_library
 *		char	get()		lklex.c
 *		char	getnb()		lklex.c
 *		sym *	lkpsym()	lksym.c
 *
 *	side effects:
 *		A symbol structure is created and/or modified.
 *		If structure space allocation fails linker will abort.
 *		Several severe errors (these are internal errors
 *		indicating a corrupted .rel file or corrupted
 *		assembler or linker) will terminated the linker.
 */

/*
 * Find/Create a global symbol entry.
 *
 * S xxxxxx Defnnnn
 *   |      |  |
 *   |      |  `-- sp->s_addr
 *   |      `----- sp->s_type
 *   `------------ sp->s_id
 *
 */
struct sym *
newsym()
{
	register int c, i, nglob;
	struct sym *tsp;
	struct sym **s;
	char id[NCPS];

	getid(id, -1);
	tsp = lkpsym(id, 1);
	c = getnb();get();get();
	if (c == 'R') {
		tsp->s_type |= S_REF;
		if (eval()) {
			fprintf(stderr, "Non zero S_REF\n");
			lkerr++;
		}
	} else
	if (c == 'D') {
		i = eval();
		if (tsp->s_type & S_DEF && tsp->s_addr != i) {
#ifdef SDK
			fprintf(stderr, "Multiple definition of %s\n", id);
#else
			fprintf(stderr, "Multiple definition of %.8s\n", id);
#endif
			lkerr++;
		}
		tsp->s_type |= S_DEF;
		/*
		 * Set value and area extension link.
		 */
		tsp->s_addr = i;
		tsp->s_axp = axp;
	} else {
		fprintf(stderr, "Invalid symbol type %c for %.8s\n", c, id);
		lkexit(1);
	}
	/*
	 * Place pointer in header symbol list
	 */
	if (headp == NULL) {
		fprintf(stderr, "No header defined\n");
		lkexit(1);
	}
	nglob = hp->h_nglob;
	s = hp->s_list;
	for (i=0; i < nglob ;++i) {
		if (s[i] == NULL) {
			s[i] = tsp;
			return(tsp);
		}
	}
	fprintf(stderr, "Header symbol list overflow\n");
	lkexit(1);

	/* Never reached */
        return 0;
}

/*)Function	sym *	lkpsym(id,f)
 *
 *		char *	id		symbol name string
 *		int	f		f == 0, lookup only
 *					f != 0, create if not found
 *
 *	The function lookup() searches the symbol hash tables for
 *	a symbol name match returning a pointer to the sym structure.
 *	If the symbol is not found then a sym structure is created,
 *	initialized, and linked to the appropriate hash table if f != 0.
 *	A pointer to this new sym structure is returned or a NULL
 *	pointer is returned if f == 0.
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
 *		int	hash()		lksym.c
 *		VOID *	new()		lksym.c
 *		int	symeq()		lksym.c
 *
 *	side effects:
 *		If the function new() fails to allocate space
 *		for the new sym structure the linker terminates.
 */

struct sym *
lkpsym(id, f)
char *id;
{
	register struct sym *sp;
	register int h;

	h = hash(id);
	sp = symhash[h];
	while (sp != NULL) {
		if (symeq(id, sp->s_id))
			return (sp);
		sp = sp->s_sp;
	}
	if (f == 0)
		return (NULL);
	sp = (struct sym *) new (sizeof(struct sym));
	sp->s_sp = symhash[h];
	symhash[h] = sp;
	strncpy(sp->s_id, id, NCPS);
	return (sp);
}

/*)Function	Addr_T	symval(tsp)
 *
 *		sym *	tsp		pointer to a symbol structure
 *
 *	The function symval() returns the value of the
 *	relocated symbol by adding the variable definition
 *	value to the areax base address.
 *
 *	local variables:
 *		Addr_T	val		relocated address value
 *
 *	global variables:
 *		none
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		none
 */

Addr_T
symval(tsp)
register struct sym *tsp;
{
	register Addr_T val;

	val = tsp->s_addr;
	if (tsp->s_axp) {
		val += tsp->s_axp->a_addr;
	}
	return(val);
}

/*)Function	VOID	symdef(fp)
 *
 *		FILE *	fp		file handle for output
 *
 *	The function symdef() scans the hashed symbol table
 *	searching for variables referenced but not defined.
 *	Undefined variables are linked to the default
 *	area "_CODE" and reported as referenced by the
 *	appropriate module.
 *
 *	local variables:
 *		int	i		hash table index loop variable
 *		sym *	sp		pointer to linked symbol structure
 *
 *	global variables:
 *		area	*areap		The pointer to the first
 *				 	area structure of a linked list
 *		sym *symhash[NHASH] 	array of pointers to NHASH
 *				      	linked symbol lists
 *
 *	functions called:
 *		symmod()		lksym.c
 *
 *	side effects:
 *		Undefined variables have their areas set to "_CODE".
 */

VOID
symdef(fp)
FILE *fp;
{
	register struct sym *sp;
	register int i;

	for (i=0; i<NHASH; ++i) {
		sp = symhash[i];
		while (sp) {
			if (sp->s_axp == NULL)
				sp->s_axp = areap->a_axp;
			if ((sp->s_type & S_DEF) == 0)
				symmod(fp, sp);
			sp = sp->s_sp;
		}
	}
}

/*)Function	VOID	symmod(fp,tsp)
 *
 *		FILE *	fp		output file handle
 *		sym *	tsp		pointer to a symbol structure
 *
 *	The function symmod() scans the header structures
 *	searching for a reference to the symbol structure
 *	pointer to by tsp.  The function then generates an error
 *	message whichs names the module having referenced the
 *	undefined variable.
 *
 *	local variables:
 *		int	i		loop counter
 *		sym **	p		pointer to a list of pointers
 *					to symbol structures
 *
 *	global variables:
 *		head	*headp		The pointer to the first
 *				 	head structure of a linked list
 *		head	*hp		Pointer to the current
 *				 	head structure
 *		int	lkerr		error flag
 *
 *	functions called:
 *		int	fprintf()	c_library
 *
 *	side effects:
 *		Error output generated.
 */

VOID
symmod(fp, tsp)
FILE *fp;
struct sym *tsp;
{
    register int i;
	struct sym **p;

	if ((hp = headp) != NULL) {
	    while(hp) {
		p = hp->s_list;
		for (i=0; i<hp->h_nglob; ++i) {
		    if (p[i] == tsp) {
			fprintf(fp, "\n?ASlink-Warning-Undefined Global %s ", tsp->s_id);
			fprintf(fp, "referenced by module %s\n", hp->m_id);
			lkerr++;
		    }
		}
	    hp = hp->h_hp;
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
	register int n;

	n = NCPS;
	do {

#if	CASE_SENSITIVE
		if (*p1++ != *p2++)
			return (0);
#else
		if (ccase[(unsigned char)(*p1++)] != ccase[(unsigned char)(*p2++)])
			return (0);
#endif

	} while (--n);
	return (1);
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
 *
 */
 
int
hash(p)
register char *p;
{
	register int h, n;

	h = 0;
	n = NCPS;
	do {

#if	CASE_SENSITIVE
		h += *p++;
#else
		h += ccase[(unsigned char)(*p++)];
#endif

	} while (--n);
	return (h&HMASK);
}

/*)Function	VOID *	new(n)
 *
 *		unsigned int	n	allocation size in bytes
 *
 *	The function new() allocates n bytes of space and returns
 *	a pointer to this memory.  If no space is available the
 *	linker is terminated.
 *
 *	local variables:
 *		char *	p		a general pointer
 *		char *	q		a general pointer
 *
 *	global variables:
 *		none
 *
 *	functions called:
 *		int	fprintf()	c_library
 *		VOID *	malloc()	c_library
 *
 *	side effects:
 *		Memory is allocated, if allocation fails
 *		the linker is terminated.
 */

VOID *
new(n)
unsigned int n;
{
	register char *p,*q;
	register unsigned int i;

	if ((p = (char *) malloc(n)) == NULL) {
		fprintf(stderr, "Out of space!\n");
		lkexit(1);
	}
	for (i=0,q=p; i<n; i++) {
		*q++ = 0;
	}
	return (p);
}

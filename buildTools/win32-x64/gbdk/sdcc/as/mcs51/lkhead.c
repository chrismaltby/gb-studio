/* lkhead.c */

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
#include "aslink.h"

/*Module	lkhead.c
 *
 *	The module lkhead.c contains the function newhead() which
 *	creates a head structure and the function module() which
 *	loads the module name into the current head structure.
 *
 *	lkhead.c contains the following functions:
 *		VOID	newhead()
 *		VOID	module()
 *
 *	lkhead.c contains no local variables.
 */

/*)Function	VOID	newhead()
 *
 *	The function newhead() creates a head structure.  All head
 *	structures are linked to form a linked list of head structures
 *	with the current head structure at the tail of the list.
 *
 *	local variables:
 *		int	i		evaluation value
 *		head *	thp		temporary pointer
 *					to a header structure
 *
 *	global variables:
 *		area	*ap		Pointer to the current
 *				 	area structure
 *		lfile	*cfp		The pointer *cfp points to the
 *				 	current lfile structure
 *		head	*headp		The pointer to the first
 *				 	head structure of a linked list
 *		head	*hp		Pointer to the current
 *				 	head structure
 *
 *	functions called:
 *		Addr_T	expr()		lkeval.c
 *		VOID *	new()		lksym.c
 *		VOID	lkparea()	lkarea.c
 *
 *	side effects:
 *		A new head structure is created and linked to any
 *		existing linked head structure.  The head structure
 *		parameters of file handle, number of areas, and number
 *		of global symbols are loaded into the structure.
 *		The default area "_abs_" is created when the first
 *		head structure is created and an areax structure is
 *		created for every head structure called.
 */

/*
 * Create a new header entry.
 *
 * H n areas n global symbols
 *   |       |
 *   |       `---- hp->h_nglob
 *   `------------ hp->h_narea
 *
 */
VOID
newhead()
{
	register int i;
	struct head *thp;

	hp = (struct head *) new (sizeof(struct head));
	if (headp == NULL) {
		headp = hp;
	} else {
		thp = headp;
		while (thp->h_hp)
			thp = thp->h_hp;
		thp->h_hp = hp;
	}
	/*
	 * Set file pointer
	 */
	hp->h_lfile = cfp;
	/*
	 * Evaluate and build Area pointer list
	 */
	i = hp->h_narea = eval();
	if (i)
		hp->a_list = (struct areax **) new (i*sizeof(struct areax *));
	/*
	 * Evaluate and build Global symbol pointer list
	 */
	skip(-1);
	i = hp->h_nglob = eval();
	if (i)
		hp->s_list = (struct sym **) new (i*sizeof(struct sym *));
	/*
	 * Setup Absolute DEF linkage.
	 */
	lkparea(_abs_);
	ap->a_flag = A_ABS|A_OVR;
}

/*)Function	VOID	module()
 *
 *	The function module() copies the module name into
 *	the current head structure.
 *
 *	local variables:
 *		char	id[]		module id string
 *
 *	global variables:
 *		head	*headp		The pointer to the first
 *				 	head structure of a linked list
 *		head	*hp		Pointer to the current
 *				 	head structure
 *		int	lkerr		error flag
 *		FILE *	stderr		c_library
 *
 *	functions called:
 *		int	fprintf()	c_library
 *		VOID	getid()		lklex.c
 *		char *	strncpy()	c_library
 *
 *	side effects:
 *		The module name is copied into the head structure.
 */

/*
 * Module Name
 */
VOID
module()
{
	char id[NCPS];

	if (headp) {
		getid(id, -1);
		strncpy(hp->m_id, id, NCPS);
	} else {
		fprintf(stderr, "No header defined\n");
		lkerr++;
	}
}

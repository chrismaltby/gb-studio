/* assubr.c */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 */

#include <stdio.h>
#include <setjmp.h>
#include <string.h>
#include "asm.h"

/*)Module	assubr.c
 *
 *	The module assubr.c contains the error
 *	processing routines.
 *
 *	assubr.c contains the following functions:
 *		VOID	aerr()
 *		VOID	diag()
 *		VOID	err()
 *		VOID	qerr()
 *		VOID	rerr()
 *
 *	assubr.c contains the local array of *error[]
 */

/*)Function	VOID	err(c)
 *
 *		int	c		error type character
 *
 *	The function err() logs the error code character
 *	suppressing duplicate errors.  If the error code
 *	is 'q' then the parse of the current assembler-source
 *	text line is terminated.
 *
 *	local variables:
 *		char *	p		pointer to the error array
 *
 *	global variables:
 *		char	eb[]		array of generated error codes
 *
 *	functions called:
 *		VOID	longjmp()	c_library
 *
 *	side effects:
 *		The error code may be inserted into the
 *		error code array eb[] or the parse terminated.
 */

VOID
err(c)
register int c;
{
	register char *p;

	aserr++;
	p = eb;
	while (p < ep)
		if (*p++ == c)
			return;
	if (p < &eb[NERR]) {
		*p++ = c;
		ep = p;
	}
	if (c == 'q')
		longjmp(jump_env, -1);
}

/*)Function	VOID	diag()
 *
 *	The function diag() prints any error codes and
 *	the source line number to the stderr output device.
 *
 *	local variables:
 *		char *	p		pointer to error code array eb[]
 *
 *	global variables:
 *		int	cfile		current source file index
 *		char	eb[]		array of generated error codes
 *		char *	ep		pointer into error list
 *		int	incfile		current include file index
 *		char	incfn[]		array of include file names
 *		int	incline[]	array of include line numbers
 *		char	srcfn[]		array of source file names
 *		int	srcline[]	array of source line numbers
 *		FILE *	stderr		c_library
 *
 *	functions called:
 *		int	fprintf()	c_library
 *		char *	geterr()	assubr.c
 *
 *	side effects:
 *		none
 */

extern int fatalErrors;

VOID
diag()
{
	register char *p,*errstr;

	if (eb != ep) {
	        fatalErrors++;
		p = eb;
		fprintf(stderr, "?ASxxxx-Error-<");
		while (p < ep) {
			fprintf(stderr, "%c", *p++);
		}
		fprintf(stderr, "> in line ");
		if (incfil >= 0) {
			fprintf(stderr, "%d", incline[incfil]);
			fprintf(stderr, " of %s\n", incfn[incfil]);
		} else {
			fprintf(stderr, "%d", srcline[cfile]);
			fprintf(stderr, " of %s\n", srcfn[cfile]);
		}
		p = eb;
		while (p < ep) {
			if ((errstr = geterr(*p++)) != NULL) {
				fprintf(stderr, "              %s\n", errstr);
			}
		}
	}
}

/*)Function	VOID	warnBanner()
 *
 *	The function warnBanner() prints a generic warning message
 *	header (including the current source file/line) and positions
 *	the output for a more specific warning message.
 *
 *	It is assumed that the call to warnBanner will be followed with
 *	a fprintf to stderr (or equivalent) with the specific warning
 *	text.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		int	cfile		current source file index
 *		int	incfile		current include file index
 *		char	incfn[]		array of include file names
 *		int	incline[]	array of include line numbers
 *		char	srcfn[]		array of source file names
 *		int	srcline[]	array of source line numbers
 *		FILE *	stderr		c_library
 *
 *	functions called:
 *		int	fprintf()	c_library
 *
 *	side effects:
 *		none
 */
VOID
warnBanner(void)
{
	fprintf(stderr, "?ASxxxx-Warning in line ");
	if (incfil >= 0) {
		fprintf(stderr, "%d", incline[incfil]);
		fprintf(stderr, " of %s\n", incfn[incfil]);
	} else {
		fprintf(stderr, "%d", srcline[cfile]);
		fprintf(stderr, " of %s\n", srcfn[cfile]);
	}
	fprintf(stderr, "               ");
}	

/*)Functions:	VOID	aerr()
 *		VOID	qerr()
 *		VOID	rerr()
 *
 *	The functions aerr(), qerr(), and rerr() report their
 *	respective error type.  These are included only for
 *	convenience.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		none
 *
 *	functions called:
 *		VOID	err()		assubr.c
 *
 *	side effects:
 *		The appropriate error code is inserted into the
 *		error array and the parse may be terminated.
 */

/*
 * Note an 'r' error.
 */
VOID
rerr()
{
	err('r');
}

/*
 * Note an 'a' error.
 */
VOID
aerr()
{
	err('a');
}

/*
 * Note a 'q' error.
 */
VOID
qerr()
{
	err('q');
}

/*
 * ASxxxx assembler errors
 */
char *errors[] = {
	"<.> use \". = . + <arg>\" not \". = <arg>\"",
	"<a> machine specific addressing or addressing mode error",
	"<b> direct page boundary error",
	"<d> direct page addressing error",
	"<i> .include file error or an .if/.endif mismatch",
	"<m> multiple definitions error",
	"<o> .org in REL area or directive / mnemonic error",
	"<p> phase error: label location changing between passes 2 and 3",
	"<q> missing or improper operators, terminators, or delimiters",
	"<r> relocation error",
	"<u> undefined symbol encountered during assembly",
	NULL
};
	
/*)Function:	char	*getarr(c)
 *
 *		int	c		the error code character
 *
 *	The function geterr() scans the list of errors returning the
 *	error string corresponding to the input error character.
 *
 *	local variables:
 *		int	i		error index counter
 *
 *	global variables:
 *		char	*errors[]	array of pointers to the
 *					error strings
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		A pointer to the appropriate
 *		error code string is returned.
 */
char *
geterr(c)
int c;
{
	int	i;

	for (i=0; errors[i]!=NULL; i++) {
		if (c == errors[i][1]) {
			return(errors[i]);
		}
	}
	return(NULL);
}


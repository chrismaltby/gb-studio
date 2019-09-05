/* lklex.c */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 */

/*
 * Extensions: P. Felber, M. Hope
 */

#include <stdio.h>
#include <string.h>
//#include <alloc.h>
#include "aslink.h"

/*)Module	lklex.c
 *
 *	The module lklex.c contains the general lexical analysis
 *	functions used to scan the text lines from the .rel files.
 *
 *	lklex.c contains the fllowing functions:
 *		char	endline()
 *		char	get()
 *		VOID	getfid()
 *		VOID	getid()
 *		int	getline()
 *		int	getmap()
 *		char	getnb()
 *		int	more()
 *		VOID	skip()
 *		VOID	unget()
 *
 *	lklex.c contains no local variables.
 */

/*)Function	VOID	getid(id,c)
 *
 *		char *	id		a pointer to a string of
 *					maximum length NCPS
 *		int	c		mode flag
 *					>=0	this is first character to
 *						copy to the string buffer
 *					<0	skip white space
 *
 *	The function getid() scans the current input text line
 *	from the current position copying the next LETTER | DIGIT string
 *	into the external string buffer (id).  The string ends when a non
 *	LETTER or DIGIT character is found. The maximum number of
 *	characters copied is NCPS.  If the input string is larger than
 *	NCPS characters then the string is truncated, if the input string
 *	is shorter than NCPS characters then the string is NULL filled.
 *	If the mode argument (c) is >=0 then (c) is the first character
 *	copied to the string buffer, if (c) is <0 then intervening white
 *	space (SPACES and TABS) are skipped.
 *
 *	local variables:
 *		char *	p		pointer to external string buffer
 *		int	c		current character value
 *
 *	global variables:
 *		char	ctype[]		a character array which defines the
 *					type of character being processed.
 *					This index is the character
 *					being processed.
 *
 *	called functions:
 *		char	get()		lklex.c
 *		char	getnb()		lklex.c
 *		VOID	unget()		lklex.c
 *
 *	side effects:
 *		use of getnb(), get(), and unget() updates the
 *		global pointer ip the position in the current
 *		input text line.
 */

VOID
getid(id, c)
register int c;
char *id;
{
	register char *p;

	if (c < 0) {
		c = getnb();
	}
	p = id;
	do {
		if (p < &id[NCPS])
			*p++ = c;
	} while (ctype[c=get()] & (LETTER|DIGIT));
	unget(c);
	while (p < &id[NCPS])
		*p++ = 0;
}

/*)Function	VOID	getfid(fid,c)
 *
 *		char *	str		a pointer to a string of
 *					maximum length FILSPC
 *		int	c		this is first character to
 *					copy to the string buffer
 *
 *	The function getfid() scans the current input text line
 *	from the current position copying the next string
 *	into the external string buffer (str).  The string ends when a
 *	non SPACE type character is found. The maximum number of
 *	characters copied is FILSPC. If the input string is larger than
 *	FILSPC characters then the string is truncated, if the input string
 *	is shorter than FILSPC characters then the string is NULL filled.
 *
 *	local variables:
 *		char *	p		pointer to external string buffer
 *		int	c		current character value
 *
 *	global variables:
 *		char	ctype[]		a character array which defines the
 *					type of character being processed.
 *					This index is the character
 *					being processed.
 *
 *	called functions:
 *		char	get()		lklex.c
 *
 *	side effects:
 *		use of get() updates the global pointer ip
 *		the position in the current input text line.
 */

VOID
getfid(str, c)
register int c;
char *str;
{
	register char *p;

	p = str;
	do {
		if (p < &str[FILSPC-1])
			*p++ = c;
		c = get();
#ifdef SDK
	} while (c);
#else /* SDK */
	} while (c && (ctype[c] != SPACE));
#endif /* SDK */
	while (p < &str[FILSPC])
		*p++ = 0;
}

/*)Function	char	getnb()
 *
 *	The function getnb() scans the current input text
 *	line returning the first character not a SPACE or TAB.
 *
 *	local variables:
 *		int	c		current character from input
 *
 *	global variables:
 *		none
 *
 *	called functions:
 *		char	get()		lklex.c
 *
 *	side effects:
 *		use of get() updates the global pointer ip, the position
 *		in the current input text line
 */

char
getnb()
{
	register int c;

	while ((c=get())==' ' || c=='\t')
		;
	return (c);
}

/*)Function	VOID	skip()
 *
 *	The function skip() scans the input text skipping all
 *	letters and digits.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		char	ctype[]		array of character types, one per
 *				 	ASCII character
 *		
 *	functions called:
 *		char	get()		lklex.c
 *		char	getnb()		lklex.c
 *		VOID	unget()		lklex.c
 *
 *	side effects:
 *		Input letters and digits are skipped.
 */

VOID
skip(c)
register int c;
{
	if (c < 0)
		c = getnb();
	while (ctype[c=get()] & (LETTER|DIGIT)) { ; }
	unget(c);
}

/*)Function	char	get()
 *
 *	The function get() returns the next character in the
 *	input text line, at the end of the line a
 *	NULL character is returned.
 *
 *	local variables:
 *		int	c		current character from
 *					input text line
 *
 *	global variables:
 *		char *	ip		pointer into the current
 *					input text line
 *
 *	called functions:
 *		none
 *
 *	side effects:
 *		updates ip to the next character position in the
 *		input text line.  If ip is at the end of the
 *		line, ip is not updated.
 */

char
get()
{
	register int c;

	if ((c = *ip) != 0)
		++ip;
	return (c);
}

/*)Function	VOID	unget(c)
 *
 *		int	c		value of last character
 *					read from input text line
 *
 *	If (c) is not a NULL character then the global pointer ip
 *	is updated to point to the preceeding character in the
 *	input text line.
 *
 *	NOTE:	This function does not push the character (c)
 *		back into the input text line, only
 *		the pointer ip is changed.
 *
 *	local variables:
 *		int	c		last character read
 *					from input text line
 *
 *	global variables:
 *		char *	ip		position into the current
 *					input text line
 *
 *	called functions:
 *		none
 *
 *	side effects:
 *		ip decremented by 1 character position
 */

VOID
unget(c)
{
	if (c != 0)
		--ip;
}

/*)Function	int	getmap(d)
 *
 *		int	d		value to compare with the
 *					input text line character
 *
 *	The function getmap() converts the 'C' style characters \b, \f,
 *	\n, \r, and \t to their equivalent ascii values and also
 *	converts 'C' style octal constants '\123' to their equivalent
 *	numeric values.  If the first character is equivalent to (d) then
 *	a (-1) is returned, if the end of the line is detected then
 *	a 'q' error terminates the parse for this line, or if the first
 *	character is not a \ then the character value is returned.
 *
 *	local variables:
 *		int	c		value of character
 *					from input text line
 *		int	n		looping counter
 *		int	v		current value of numeric conversion
 *
 *	global variables:
 *		none
 *
 *	called functions:
 *		char	get()		lklex.c
 *		VOID	unget()		lklex.c
 *
 *	side effects:
 *		use of get() updates the global pointer ip the position
 *		in the current input text line
 */

int
getmap(d)
{
	register int c, n, v;

	if ((c = get()) == '\0')
		return (-1);
	if (c == d)
		return (-1);
	if (c == '\\') {
		c = get();
		switch (c) {

		case 'b':
			c = '\b';
			break;

		case 'f':
			c = '\f';
			break;

		case 'n':
			c = '\n';
			break;

		case 'r':
			c = '\r';
			break;

		case 't':
			c = '\t';
			break;

		case '0':
		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
			n = 0;
			v = 0;
			while (++n<=3 && c>='0' && c<='7') {
				v = (v<<3) + c - '0';
				c = get();
			}
			unget(c);
			c = v;
			break;
		}
	}
	return (c);
}

/*)Function	int	getline()
 *
 *	The function getline() reads a line of input text from a
 *	.rel source text file, a .lnk command file or from stdin.
 *	Lines of text are processed from a single .lnk file or
 *	multiple .rel files until all files have been read.
 *	The input text line is copied into the global string ib[]
 *	and converted to a NULL terminated string.  The function
 *	getline() returns a (1) after succesfully reading a line
 *	or a (0) if all files have been read.
 *	This function also opens each input .lst file and output
 *	.rst file as each .rel file is processed.
 *
 *	local variables:
 *		int	i		string length
 *		int	ftype		file type
 *		char *	fid		file name
 *
 *	global variables:
 *		lfile	*cfp		The pointer *cfp points to the
 *				 	current lfile structure
 *		lfile	*filep	 	The pointer *filep points to the
 *				 	beginning of a linked list of
 *				 	lfile structures.
 *		int	gline		get a line from the LST file
 *					to translate for the RST file
 *		char	ib[NINPUT]	REL file text line
 *		int	pass		linker pass number
 *		int	pflag		print linker command file flag
 *		FILE	*rfp		The file handle to the current
 *					output RST file
 *		FILE	*sfp		The file handle sfp points to the
 *				 	currently open file
 *		FILE *	stdin		c_library
 *		FILE *	stdout		c_library
 *		FILE	*tfp		The file handle to the current
 *					LST file being scanned
 *		int	uflag		update listing flag
 *
 *	called functions:
 *		FILE *	afile()		lkmain.c
 *		int	fclose()	c_library
 *		char *	fgets()		c_library
 *		int	fprintf()	c_library
 *		VOID	lkulist()	lklist.c
 *		VOID	lkexit()	lkmain.c
 *		int	strlen()	c_library
 *
 *	side effects:
 *		The input stream is scanned.  The .rel files will be
 *		opened and closed sequentially scanning each in turn.
 */

int
getline(char **__restrict __lineptr, size_t *__restrict __n, FILE *__restrict __stream)
{
	register int i, ftype;
	register char *fid;

loop:	if (pflag && cfp && cfp->f_type == F_STD)
		fprintf(stdout, "ASlink >> ");

#ifdef SDK
	if(cfp == NULL && filep != NULL && filep->f_type == F_CMD) {
		char **argv = (char **)filep->f_idp;
		if(argv[0] != NULL && strlen(argv[0]) < sizeof ib) {
			strcpy(ib, argv[0]);
			filep->f_idp = (char *)&argv[1];			
		} else {
			filep = NULL;
			return(0);
		}
	} else
#endif /* SDK */
	if (sfp == NULL || fgets(ib, sizeof ib, sfp) == NULL) {
		if (sfp) {
			fclose(sfp);
#ifdef SDK
			sfp = NULL;
#endif /* SDK */
			lkulist(0);
		}
		if (cfp == NULL) {
			cfp = filep;
		} else {
			cfp = cfp->f_flp;
		}
		if (cfp) {
			ftype = cfp->f_type;
			fid = cfp->f_idp;
			if (ftype == F_STD) {
				sfp = stdin;
			} else
			if (ftype == F_LNK) {
#ifdef SDK
				sfp = afile(fid, "lnk", 0);
#else /* SDK */
				sfp = afile(fid, "LNK", 0);
#endif /* SDK */
			} else
			if (ftype == F_REL) {
#ifdef SDK
				sfp = afile(fid, "", 0);
				if (uflag && pass != 0) {
				 if ((tfp = afile(fid, "lst", 0)) != NULL) {
				  if ((rfp = afile(fid, "rst", 1)) == NULL) {
#else /* SDK */
				sfp = afile(fid, "REL", 0);
				if (uflag && pass != 0) {
				 if ((tfp = afile(fid, "LST", 0)) != NULL) {
				  if ((rfp = afile(fid, "RST", 1)) == NULL) {
#endif /* SDK */
					fclose(tfp);
					tfp = NULL;
				  }
				 }
				}
				gline = 1;
			} else {
				fprintf(stderr, "Invalid file type\n");
				lkexit(1);
			}
			if (sfp == NULL) {
				lkexit(1);
			}
			goto loop;
		} else {
			filep = NULL;
			return(0);
		}
	}
	i = strlen(ib) - 1;
	if (ib[i] == '\n')
		ib[i] = 0;
	return (1);
}

/*)Function	int	more()
 *
 *	The function more() scans the input text line
 *	skipping white space (SPACES and TABS) and returns a (0)
 *	if the end of the line or a comment delimeter (;) is found,
 *	or a (1) if their are additional characters in the line.
 *
 *	local variables:
 *		int	c		next character from
 *					the input text line
 *
 *	global variables:
 *		none
 *
 *	called functions:
 *		char	getnb()		lklex.c
 *		VOID	unget()		lklex.c
 *
 *	side effects:
 *		use of getnb() and unget() updates the global pointer ip
 *		the position in the current input text line
 */

int
more()
{
	register int c;

	c = getnb();
	unget(c);
	return( (c == '\0' || c == ';') ? 0 : 1 );
}

/*)Function	char	endline()
 *
 *	The function endline() scans the input text line
 *	skipping white space (SPACES and TABS) and returns the next
 *	character or a (0) if the end of the line is found or a
 *	comment delimiter (;) is found.
 *
 *	local variables:
 *		int	c		next character from
 *					the input text line
 *
 *	global variables:
 *		none
 *
 *	called functions:
 *		char	getnb()		lklex.c
 *
 *	side effects:
 *		Use of getnb() updates the global pointer ip the
 *		position in the current input text line.
 */

char
endline()
{
	register int c;

	c = getnb();
	return( (c == '\0' || c == ';') ? 0 : c );
}

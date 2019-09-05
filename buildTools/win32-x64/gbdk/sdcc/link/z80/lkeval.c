/* lkeval.c */

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
//#include <alloc.h>
#include "aslink.h"

/*)Module	lkeval.c
 *
 *	The module lkeval.c contains the routines to evaluate
 *	arithmetic/numerical expressions.  The functions in
 *	lkeval.c perform a recursive evaluation of the arithmetic
 *	expression read from the input text line.
 *	The expression may include binary/unary operators, brackets,
 *	symbols, labels, and constants in hexadecimal, decimal, octal
 *	and binary.  Arithmetic operations are prioritized and
 *	evaluated by normal arithmetic conventions.
 *
 *	lkeval.c contains the following functions:
 *		int	digit()
 *		Addr_T	eval()
 *		Addr_T	expr()
 *		int	oprio()
 *		Addr_T	term()
 *
 *	lkeval.c contains no local/static variables
 */

/*)Function	Addr_T	eval()
 *
 *	The function eval() evaluates a character string to a
 *	numerical value.
 *
 *	local variables:
 *		int	c		character from input string
 *		int	v		value of character in current radix
 *		Addr_T	n		evaluation value
 *
 *	global variables:
 *		int	radix		current number conversion radix
 *
 *	functions called:
 *		int	digit()		lkeval.c
 *		char	get()		lklex.c
 *		char	getnb()		lklex.c
 *		VOID	unget()		lklex.c
 *
 *	side effects:
 *		Input test is scanned and evaluated to a
 *		numerical value.
 */

Addr_T
eval()
{
	register int c, v;
	register Addr_T n;

	c = getnb();
	n = 0;
	while ((v = digit(c, radix)) >= 0) {
		n = n*radix + v;
		c = get();
	}
	unget(c);
	return(n);
}

/*)Function	Addr_T	expr(n)
 *
 *		int	n		a firewall priority; all top
 *					level calls (from the user)
 *					should be made with n set to 0.
 *
 *	The function expr() evaluates an expression and
 *	returns the value.
 *
 *	local variables:
 *		int	c		current input text character
 *		int	p		current operator priority
 *		Addr_T	v		value returned by term()
 *		Addr_T	ve		value returned by a
 *					recursive call to expr()
 *
 *	global variables:
 *		char	ctype[]		array of character types, one per
 *					ASCII character
 *		int	lkerr		error flag
 *		FILE *	stderr		c_library
 *
 *	functions called:
 *		VOID	expr()		lkeval.c
 *		int	fprintf()	c_library
 *		int	getnb()		lklex.c
 *		int	oprio()		lkeval.c
 *		VOID	term()		lkeval.c
 *		VOID	unget()		lklex.c
 *
 *
 *	side effects:
 *		An expression is evaluated by scanning the input
 *		text string.
 */

Addr_T
expr (n)
{
	register int c, p;
	register Addr_T v, ve;

	v = term();
	while (ctype[c = getnb()] & BINOP) {
		if ((p = oprio(c)) <= n)
			break;
		if ((c == '>' || c == '<') && c != get()) {
			fprintf(stderr, "Invalid expression");
			lkerr++;
			return(v);
		}
		ve = expr(p);
		if (c == '+') {
			v += ve;
		} else
		if (c == '-') {
			v -= ve;
		} else {
			switch (c) {

			case '*':
				v *= ve;
				break;

			case '/':
				v /= ve;
				break;

			case '&':
				v &= ve;
				break;

			case '|':
				v |= ve;
				break;

			case '%':
				v %= ve;
				break;

			case '^':
				v ^= ve;
				break;

			case '<':
				v <<= ve;
				break;

			case '>':
				v >>= ve;
				break;
			}
		}
	}
	unget(c);
	return(v);
}

/*)Function	Addr_T	term()
 *
 *	The function term() evaluates a single constant
 *	or symbol value prefaced by any unary operator
 *	( +, -, ~, ', ", >, or < ).
 *
 *	local variables:
 *		int	c		current character
 *		char	id[]		symbol name
 *		int	n		value of digit in current radix
 *		int	r		current evaluation radix
 *		sym *	sp		pointer to a sym structure
 *		Addr_T	v		evaluation value
 *
 *	global variables:
 *		char	ctype[]		array of character types, one per
 *					ASCII character
 *		int	lkerr		error flag
 *
 *	functions called:
 *		int	digit()		lkeval.c
 *		VOID	expr()		lkeval.c
 *		int	fprintf()	c_library
 *		int	get()		lklex.c
 *		VOID	getid()		lklex.c
 *		int	getmap()	lklex.c
 *		int	getnb()		lklex.c
 *		sym *	lkpsym()	lksym.c
 *		Addr_T	symval()	lksym.c
 *		VOID	unget()		lklex.c
 *
 *	side effects:
 *		An arithmetic term is evaluated by scanning input text.
 */

Addr_T
term()
{
	register int c, r, n;
	register Addr_T v;
	struct sym *sp;
	char id[NCPS];

	c = getnb();
	if (c == '#') { c = getnb(); }
	if (c == '(') {
		v = expr(0);
		if (getnb() != ')') {
			fprintf(stderr, "Missing delimiter");
			lkerr++;
		}
		return(v);
	}
	if (c == '-') {
		return(-expr(100));
	}
	if (c == '~') {
		return(~expr(100));
	}
	if (c == '\'') {
		return(getmap(-1)&0377);
	}
	if (c == '\"') {
		if (hilo) {
			v  = (getmap(-1)&0377)<<8;
			v |=  getmap(-1)&0377;
		} else {
			v  =  getmap(-1)&0377;
			v |= (getmap(-1)&0377)<<8;
		}
		return(v);
	}
	if (c == '>' || c == '<') {
		v = expr(100);
		if (c == '>')
			v >>= 8;
		return(v&0377);
	}
	if (ctype[c] & DIGIT) {
		r = 10;
		if (c == '0') {
			c = get();
			switch (c) {
			case 'b':
			case 'B':
				r = 2;
				c = get();
				break;
			case '@':
			case 'o':
			case 'O':
			case 'q':
			case 'Q':
				r = 8;
				c = get();
				break;
			case 'd':
			case 'D':
				r = 10;
				c = get();
				break;
			case 'h':
			case 'H':
			case 'x':
			case 'X':
				r = 16;
				c = get();
				break;
			default:
				break;
			}
		}
		v = 0;
		while ((n = digit(c, r)) >= 0) {
			v = r*v + n;
			c = get();
		}
		unget(c);
		return(v);
	}
	if (ctype[c] & LETTER) {
		getid(id, c);
		if ((sp = lkpsym(id, 0)) == NULL) {
			fprintf(stderr, "Undefined symbol %8s\n", id);
			lkerr++;
			return(0);
		} else {
			return(symval(sp));
		}
	}
        /* Shouldn't get here. */
        return 0;
}

/*)Function	int	digit(c, r)
 *
 *		int	c		digit character
 *		int	r		current radix
 *
 *	The function digit() returns the value of c
 *	in the current radix r.  If the c value is not
 *	a number of the current radix then a -1 is returned.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		char	ctype[]		array of character types, one per
 *					ASCII character
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		none
 */

int
digit(c, r)
register int c, r;
{
	if (r == 16) {
		if (ctype[c] & RAD16) {
			if (c >= 'A' && c <= 'F')
				return (c - 'A' + 10);
			if (c >= 'a' && c <= 'f')
				return (c - 'a' + 10);
			return (c - '0');
		}
	} else
	if (r == 10) {
		if (ctype[c] & RAD10)
			return (c - '0');
	} else
	if (r == 8) {
		if (ctype[c] & RAD8)
			return (c - '0');
	} else
	if (r == 2) {
		if (ctype[c] & RAD2)
			return (c - '0');
	}
	return (-1);
}

/*)Function	int	oprio(c)
 *
 *		int	c		operator character
 *
 *	The function oprio() returns a relative priority
 *	for all valid unary and binary operators.
 *
 *	local variables:
 *		none
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
 
int
oprio(c)
register int c;
{
	if (c == '*' || c == '/' || c == '%')
		return (10);
	if (c == '+' || c == '-')
		return (7);
	if (c == '<' || c == '>')
		return (5);
	if (c == '^')
		return (4);
	if (c == '&')
		return (3);
	if (c == '|')
		return (1);
	return (0);
}

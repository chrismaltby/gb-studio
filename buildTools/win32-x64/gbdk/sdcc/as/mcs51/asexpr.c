	/* asexpr.c */

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

/*)Module	asexpr.c
 *
 *	The module asexpr.c contains the routines to evaluate
 *	arithmetic/numerical expressions.  The functions in
 *	asexpr.c perform a recursive evaluation of the arithmetic
 *	expression read from the assembler-source text line.
 *	The expression may include binary/unary operators, brackets,
 *	symbols, labels, and constants in hexadecimal, decimal, octal
 *	and binary.  Arithmetic operations are prioritized and
 *	evaluated by normal arithmetic conventions.
 *
 *	asexpr.c contains the following functions:
 *		VOID	abscheck()
 *		Addr_T	absexpr()
 *		VOID	clrexpr()
 *		int	digit()
 *		VOID	expr()
 *		int	oprio()
 *		VOID	term()
 *
 *	asexpr.c contains no local/static variables
 */

/*)Function	VOID	expr(esp, n)
 *
 *		expr *	esp		pointer to an expr structure
 *		int	n		a firewall priority; all top
 *					level calls (from the user)
 *					should be made with n set to 0.
 *
 *	The function expr() evaluates an expression and
 *	stores its value and relocation information into
 *	the expr structure supplied by the user.
 *
 *	local variables:
 *		int	c		current assembler-source
 *					text character
 *		int	p		current operator priority
 *		area *	ap		pointer to an area structure
 *		exp	re		internal expr structure
 *
 *	global variables:
 *		char	ctype[]		array of character types, one per
 *					ASCII character
 *
 *	functions called:
 *		VOID	abscheck()	asexpr.c
 *		VOID	clrexpr()	asexpr.c
 *		VOID	expr()		asexpr.c
 *		int	getnb()		aslex.c
 *		int	oprio()		asexpr.c
 *		VOID	qerr()		assubr.c
 *		VOID	rerr()		assubr.c
 *		VOID	term()		asexpr.c
 *		VOID	unget()		aslex.c
 *
 *
 *	side effects:
 *		An expression is evaluated modifying the user supplied
 *		expr structure, a sym structure maybe created for an
 *		undefined symbol, and the parse of the expression may
 *		terminate if a 'q' error occurs.
 */

VOID
expr(esp, n)
register struct expr *esp;
int n;
{
        register int c, p;
        struct area *ap;
        struct expr re;

        term(esp);
        while (ctype[c = getnb()] & BINOP) {
		/*
		 * Handle binary operators + - * / & | % ^ << >>
		 */
                if ((p = oprio(c)) <= n)
                        break;
                if ((c == '>' || c == '<') && c != get())
                        qerr();
		clrexpr(&re);
                expr(&re, p);
		esp->e_rlcf |= re.e_rlcf;
                if (c == '+') {
			/*
			 * esp + re, at least one must be absolute
			 */
                        if (esp->e_base.e_ap == NULL) {
				/*
				 * esp is absolute (constant),
				 * use area from re
				 */
                                esp->e_base.e_ap = re.e_base.e_ap;
                        } else
                        if (re.e_base.e_ap) {
				/*
				 * re should be absolute (constant)
				 */
                                rerr();
                        }
                        if (esp->e_flag && re.e_flag)
                                rerr();
                        if (re.e_flag)
                                esp->e_flag = 1;
                        esp->e_addr += re.e_addr;
                } else
                if (c == '-') {
			/*
			 * esp - re
			 */
                        if ((ap = re.e_base.e_ap) != NULL) {
                                if (esp->e_base.e_ap == ap) {
                                        esp->e_base.e_ap = NULL;
                                } else {
                                        rerr();
                                }
                        }
                        if (re.e_flag)
                                rerr();
                        esp->e_addr -= re.e_addr;
                } else {
			/*
			 * Both operands (esp and re) must be constants
			 */
		    /* SD :- moved the abscheck to each case
		       case and change the right shift operator.. if
		       right shift by 8 bits of a relocatable address then
		       the user wants the higher order byte. set the R_MSB
		       for the expression */
                       switch (c) {

                        case '*':
			    abscheck(esp);
			    abscheck(&re);
			    esp->e_addr *= re.e_addr;
			    break;

                        case '/':
			    abscheck(esp);
			    abscheck(&re);			    
			    esp->e_addr /= re.e_addr;
			    break;

                        case '&':
			    abscheck(esp);
			    abscheck(&re);			    
			    esp->e_addr &= re.e_addr;
			    break;

                        case '|':
			    abscheck(esp);
			    abscheck(&re);			    
			    esp->e_addr |= re.e_addr;
			    break;

                        case '%':
			    abscheck(esp);
			    abscheck(&re);			    
			    esp->e_addr %= re.e_addr;
			    break;

                        case '^':
			    abscheck(esp);
			    abscheck(&re);			    
			    esp->e_addr ^= re.e_addr;
			    break;

                        case '<':
			    abscheck(esp);
			    abscheck(&re);			    
			    esp->e_addr <<= re.e_addr;
			    break;

                        case '>':
			    /* SD change here */			   
			    abscheck(&re);	
			    /* if the left is a relative address &
			       the right side is == 8 then */
			    if (esp->e_base.e_ap && re.e_addr == 8) {
				esp->e_rlcf |= R_MSB ;
				break;
			    }
			    else if (esp->e_base.e_ap && re.e_addr == 16)
			    {
			    	if (flat24Mode)
			       	{
			       	    esp->e_rlcf |= R_HIB;
			       	}
			       	else
			       	{
			       	    warnBanner();
			       	    fprintf(stderr, 
			       	    	    "(expr >> 16) is only meaningful in "
			       	    	    ".flat24 mode.\n");
			       	    qerr();
			       	}
			            
			       break;
			    }
			    /* else continue with the normal processing */
			    abscheck(esp);
			    esp->e_addr >>= re.e_addr;
			    break;
			    
		       default:
			   qerr();
			   break;
		       }
                }
        }
        unget(c);
}

/*)Function	Addr_T	absexpr()
 *
 *	The function absexpr() evaluates an expression, verifies it
 *	is absolute (i.e. not position dependent or relocatable), and
 *	returns its value.
 *
 *	local variables:
 *		expr	e		expr structure
 *
 *	global variables:
 *		none
 *
 *	functions called:
 *		VOID	abscheck()	asexpr.c
 *		VOID	clrexpr()	asexpr.c
 *		VOID	expr()		asexpr.c
 *
 *	side effects:
 *		If the expression is not absolute then
 *		a 'r' error is reported.
 */

Addr_T
absexpr()
{
        struct expr e;

	clrexpr(&e);
	expr(&e, 0);
	abscheck(&e);
	return (e.e_addr);
}

/*)Function	VOID	term(esp)
 *
 *		expr *	esp		pointer to an expr structure
 *
 *	The function term() evaluates a single constant
 *	or symbol value prefaced by any unary operator
 *	( +, -, ~, ', ", >, or < ).  This routine is also
 *	responsible for setting the relocation type to symbol
 *	based (e.flag != 0) on global references.
 *
 *	local variables:
 *		int	c		current character
 *		char	id[]		symbol name
 *		char *	jp		pointer to assembler-source text
 *		int	n		constant evaluation running sum
 *		int	r		current evaluation radix
 *		sym *	sp		pointer to a sym structure
 *		tsym *	tp		pointer to a tsym structure
 *		int	v		current digit evaluation
 *
 *	global variables:
 *		char	ctype[]		array of character types, one per
 *					ASCII character
 *		sym *	symp		pointer to a symbol structure
 *
 *	functions called:
 *		VOID	abscheck()	asexpr.c
 *		int	digit()		asexpr.c
 *		VOID	err()		assubr.c
 *		VOID	expr()		asexpr.c
 *		int	is_abs()	asexpr.c
 *		int	get()		aslex.c
 *		VOID	getid()		aslex.c
 *		int	getmap()	aslex.c
 *		int	getnb()		aslex.c
 *		sym *	lookup()	assym.c
 *		VOID	qerr()		assubr.c
 *		VOID	unget()		aslex.c
 *
 *	side effects:
 *		An arithmetic term is evaluated, a symbol structure
 *		may be created, term evaluation may be terminated
 *		by a 'q' error.
 */

VOID
term(esp)
register struct expr *esp;
{
        register int c, n;
        register char *jp;
        char id[NCPS];
        struct sym  *sp;
        struct tsym *tp;
        int r=0, v;

        c = getnb();
	/*
 	 * Discard the unary '+' at this point and
	 * also any reference to numerical arguments
	 * associated with the '#' prefix.
	 */
        while (c == '+' || c == '#') { c = getnb(); }
	/*
 	 * Evaluate all binary operators
	 * by recursively calling expr().
	 */
        if (c == LFTERM) {
                expr(esp, 0);
                if (getnb() != RTTERM)
                        qerr();
                return;
        }
        if (c == '-') {
                expr(esp, 100);
                abscheck(esp);
                esp->e_addr = 0-esp->e_addr;
                return;
        }
        if (c == '~') {
                expr(esp, 100);
                abscheck(esp);
                esp->e_addr = ~esp->e_addr;
                return;
        }
        if (c == '\'') {
                esp->e_mode = S_USER;
                esp->e_addr = getmap(-1)&0377;
                return;
        }
        if (c == '\"') {
                esp->e_mode = S_USER;
                if (hilo) {
                    esp->e_addr  = (getmap(-1)&0377)<<8;
                    esp->e_addr |= (getmap(-1)&0377);
                } else {
                    esp->e_addr  = (getmap(-1)&0377);
                    esp->e_addr |= (getmap(-1)&0377)<<8;
                }
                return;
        }
        if (c == '>' || c == '<') {
                expr(esp, 100);
		if (is_abs (esp)) {
			/*
			 * evaluate msb/lsb directly
			 */
			if (c == '>')
				esp->e_addr >>= 8;
			esp->e_addr &= 0377;
			return;
		} else {
			/*
			 * let linker perform msb/lsb, lsb is default
			 */
			esp->e_rlcf |= R_BYT2;
			if (c == '>')
				esp->e_rlcf |= R_MSB;
			return;
		}
        }
	/*
	 * Evaluate digit sequences as local symbols
	 * if followed by a '$' or as constants.
	 */
        if (ctype[c] & DIGIT) {
                esp->e_mode = S_USER;
                jp = ip;
                while (ctype[(int)*jp] & RAD10) {
                        jp++;
                }
                if (*jp == '$') {
                        n = 0;
                        while ((v = digit(c, 10)) >= 0) {
                                n = 10*n + v;
                                c = get();
                        }
                        tp = symp->s_tsym;
                        while (tp) {
                                if (n == tp->t_num) {
                                        esp->e_base.e_ap = tp->t_area;
                                        esp->e_addr = tp->t_addr;
                                        return;
                                }
                                tp = tp->t_lnk;
                        }
                        /* err('u'); */
                        return;
                }
                r = radix;
                if (c == '0') {
                        c = get();
                        switch (c) {
                                case 'b':
                                case 'B':
                                        r = 2;
                                        c = get();
                                        break;
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
                n = 0;
                while ((v = digit(c, r)) >= 0) {
                        n = r*n + v;
                        c = get();
                }
                unget(c);
                esp->e_addr = n;
                return;
        }
	/*
	 * Evaluate '$' sequences as a temporary radix
	 * if followed by a '%', '&', '#', or '$'.
	 */
        if (c == '$') {
                c = get();
                if (c == '%' || c == '&' || c == '#' || c == '$') {
	                switch (c) {
	        	        case '%':
        		                r = 2;
        		                break;
        		        case '&':
        		                r = 8;
        		                break;
        		        case '#':
        		                r = 10;
        		                break;
        		        case '$':
        		                r = 16;        	                
        		                break;
        		        default:
        		                break;
        	        }
        	        c = get();
        	        n = 0;
        	        while ((v = digit(c, r)) >= 0) {
        	                n = r*n + v;
        	                c = get();
        	        }
        	        unget(c);
	                esp->e_mode = S_USER;
        	        esp->e_addr = n;
        	        return;
        	}
        	unget(c);
        	c = '$';
        }
	/*
	 * Evaluate symbols and labels
	 */
        if (ctype[c] & LETTER) {
                esp->e_mode = S_USER;
                getid(id, c);
                sp = lookup(id);
                if (sp->s_type == S_NEW) {
                        esp->e_addr = 0;
			if (sp->s_flag&S_GBL) {
				esp->e_flag = 1;
				esp->e_base.e_sp = sp;
				return;
			}
			/* err('u'); */
                } else {
                        esp->e_mode = sp->s_type;
                        esp->e_addr = sp->s_addr;
                        esp->e_base.e_ap = sp->s_area;
                }
                return;
        }
	/*
	 * Else not a term.
	 */
        qerr();
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

/*)Function	VOID	abscheck(esp)
 *
 *		expr *	esp		pointer to an expr structure
 *
 *	The function abscheck() tests the evaluation of an
 *	expression to verify it is absolute.  If the evaluation
 *	is relocatable then an 'r' error is noted and the expression
 *	made absolute.
 *
 *	Note:	The area type (i.e. ABS) is not checked because
 *		the linker can be told to explicitly relocate an
 *		absolute area.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		none
 *
 *	functions called:
 *		VOID	rerr()		assubr.c
 *
 *	side effects:
 *		The expression may be changed to absolute and the
 *		'r' error invoked.
 */

VOID
abscheck(esp)
register struct expr *esp;
{
        if (esp->e_flag || esp->e_base.e_ap) {
                esp->e_flag = 0;
                esp->e_base.e_ap = NULL;
                rerr();
        }
}

/*)Function	int	is_abs(esp)
 *
 *		expr *	esp		pointer to an expr structure
 *
 *	The function is_abs() tests the evaluation of an
 *	expression to verify it is absolute.  If the evaluation
 *	is absolute then 1 is returned, else 0 is returned.
 *
 *	Note:	The area type (i.e. ABS) is not checked because
 *		the linker can be told to explicitly relocate an
 *		absolute area.
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
is_abs (esp)
register struct expr *esp;
{
        if (esp->e_flag || esp->e_base.e_ap) {
		return(0);
        }
	return(1);
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

/*)Function	VOID	clrexpr(esp)
 *
 *		expr *	esp		pointer to expression structure
 *
 *	The function clrexpr() clears the expression structure.
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
 *		expression structure cleared.
 */
 
VOID
clrexpr(esp)
register struct expr *esp;
{
	esp->e_mode = 0;
	esp->e_flag = 0;
	esp->e_addr = 0;
	esp->e_base.e_ap = NULL;
	esp->e_rlcf = 0;
}

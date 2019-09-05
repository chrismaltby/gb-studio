/* asout.c */

/*
 * (C) Copyright 1989-1995
 * All Rights Reserved
 *
 * Alan R. Baldwin
 * 721 Berkeley St.
 * Kent, Ohio  44240
 *
 * 28-Oct-97 JLH: 
 *	     - outsym: show s_id as string rather than array [NCPS]
 *           - Added outr11 to support 8051's 11 bit destination address
 */

#include <stdio.h>
#include <setjmp.h>
#include <string.h>
#include "asm.h"


/*)Module	asout.c
 *
 *	The module asout.c contains all the functions used to
 *	generate the .REL assembler output file.
 *
 *
 * 	The  assemblers' output object file is an ascii file containing
 *	the information needed by the linker  to  bind  multiple  object
 *	modules into a complete loadable memory image.  
 *
 *	The object module contains the following designators:  
 *
 *		[XDQ][HL]
 *			X	 Hexadecimal radix
 *			D	 Decimal radix
 *			Q	 Octal radix
 *	
 *			H	 Most significant byte first
 *			L	 Least significant byte first
 *	
 *		H	 Header 
 *		M	 Module
 *		A	 Area
 *		S	 Symbol
 *		T	 Object code
 *		R	 Relocation information
 *		P	 Paging information
 *
 *
 *	(1)	Radix Line
 *
 * 	The  first  line  of  an object module contains the [XDQ][HL]
 *	format specifier (i.e.  XH indicates  a  hexadecimal  file  with
 *	most significant byte first) for the following designators.  
 *
 *
 *	(2)	Header Line
 *
 *		H aa areas gg global symbols 
 *
 * 	The  header  line  specifies  the number of areas(aa) and the
 *	number of global symbols(gg) defined or referenced in  this  ob-
 *	ject module segment.  
 *
 *
 *	(3)	Module Line 
 *
 *		M name 
 *
 * 	The  module  line  specifies  the module name from which this
 *	header segment was assembled.  The module line will  not  appear
 *	if the .module directive was not used in the source program.  
 *
 *
 *	(4)	Symbol Line 
 *
 *		S string Defnnnn 
 *
 *			or 
 *
 *		S string Refnnnn 
 *
 * 	The  symbol line defines (Def) or references (Ref) the symbol
 *	'string' with the value nnnn.  The defined value is relative  to
 *	the  current area base address.  References to constants and ex-
 *	ternal global symbols will always appear before the  first  area
 *	definition.  References to external symbols will have a value of
 *	zero.  
 *
 *
 *	(5)	Area Line 
 *
 *		A label size ss flags ff 
 *
 * 	The  area  line  defines the area label, the size (ss) of the
 *	area in bytes, and the area flags (ff).  The area flags  specify
 *	the ABS, REL, CON, OVR, and PAG parameters:  
 *
 *		OVR/CON (0x04/0x00 i.e.  bit position 2) 
 *
 *		ABS/REL (0x08/0x00 i.e.  bit position 3) 
 *
 *		PAG (0x10 i.e.  bit position 4) 
 *
 *
 *	(6)	T Line 
 *
 *		T xx xx nn nn nn nn nn ...  
 *
 * 	The  T  line contains the assembled code output by the assem-
 *	bler with xx xx being the offset address from the  current  area
 *	base address and nn being the assembled instructions and data in
 *	byte format.  
 *
 *
 *	(7)	R Line 
 *
 *		R 0 0 nn nn n1 n2 xx xx ...  
 *
 * 	The R line provides the relocation information to the linker.
 *	The nn nn value is the current area index, i.e.  which area  the
 *	current  values  were  assembled.  Relocation information is en-
 *	coded in groups of 4 bytes:  
 *
 *	1.  n1 is the relocation mode and object format 
 *	 	1.  bit 0 word(0x00)/byte(0x01) 
 *	 	2.  bit 1 relocatable area(0x00)/symbol(0x02) 
 *	 	3.  bit 2 normal(0x00)/PC relative(0x04) relocation 
 *	 	4.  bit  3  1-byte(0x00)/2-byte(0x08) object format for
 *		    byte data 
 *	 	5.  bit 4 signed(0x00)/unsigned(0x10) byte data 
 *	 	6.  bit 5 normal(0x00)/page '0'(0x20) reference 
 *	 	7.  bit 6 normal(0x00)/page 'nnn'(0x40) reference 
 *		8.  bit 7 normal(0x00)/MSB of value
 *
 *	2.  n2  is  a byte index into the corresponding (i.e.  pre-
 *	 	ceeding) T line data (i.e.  a pointer to the data to be
 *	 	updated  by  the  relocation).   The T line data may be
 *	 	1-byte or  2-byte  byte  data  format  or  2-byte  word
 *	 	format.  
 *
 *	3.  xx xx  is the area/symbol index for the area/symbol be-
 *	 	ing referenced.  the corresponding area/symbol is found
 *		in the header area/symbol lists.  
 *
 *
 *	The groups of 4 bytes are repeated for each item requiring relo-
 *	cation in the preceeding T line.  
 *
 *
 *	(8)	P Line 
 *
 *		P 0 0 nn nn n1 n2 xx xx 
 *
 * 	The  P  line provides the paging information to the linker as
 *	specified by a .setdp directive.  The format of  the  relocation
 *	information is identical to that of the R line.  The correspond-
 *	ing T line has the following information:  
 *		T xx xx aa aa bb bb 
 *
 * 	Where  aa aa is the area reference number which specifies the
 *	selected page area and bb bb is the base address  of  the  page.
 *	bb bb will require relocation processing if the 'n1 n2 xx xx' is
 *	specified in the P line.  The linker will verify that  the  base
 *	address is on a 256 byte boundary and that the page length of an
 *	area defined with the PAG type is not larger than 256 bytes.  
 *
 * 	The  linker  defaults any direct page references to the first
 *	area defined in the input REL file.  All ASxxxx assemblers  will
 *	specify the _CODE area first, making this the default page area. 
 *
 *
 *	asout.c contains the following functions:
 *		int	lobyte()
 *		int	hibyte()
 *		VOID	out()
 *		VOID	outab()
 *		VOID	outall()
 *		VOID	outarea()
 *		VOID	outaw()
 *		VOID	outbuf()
 *		VOID	outchk()
 *		VOID	outdot()
 *		VOID	outdp()
 *		VOID	outgsd()
 *		VOID	outrb()
 *		VOID	outrw()
 *		VOID	outsym()
 *		VOID	out_lb()
 *		VOID	out_lw()
 *		VOID	out_rw()
 *		VOID	out_tw()
 *
 *	The module asout.c contains the following local variables:
 *		int	rel[]		relocation data for code/data array
 *		int *	relp		pointer to rel array
 *		int	txt[]		assembled code/data array
 *		int *	txtp		pointer to txt array
 */

#define	 NTXT	16
#define	 NREL	16

char	 txt[NTXT];
char	 rel[NREL];

char	*txtp = { &txt[0] };
char	*relp = { &rel[0] };

/*)Function	VOID	outab(b)
 *
 *		int	b		assembler data word
 *
 *	The function outab() processes a single word of
 *	assembled data in absolute format.
 *
 *	local variables:
 *		int *	txtp		pointer to data word
 *
 *	global variables:
 *		int	oflag		-o, generate relocatable output flag
 *		int	pass		assembler pass number
 *
 *	functions called:
 *		VOID	outchk()	asout.c
 *		VOID	out_lb()	asout.c
 *
 *	side effects:
 *		The current assembly address is incremented by 1.
 */

VOID
outab(b)
{
	if (pass == 2) {
		out_lb(b,0);
		if (oflag) {
			outchk(1, 0);
			*txtp++ = lobyte(b);
		}
	}
	++dot.s_addr;
}

/*)Function	VOID	outaw(w)
 *
 *		int	w		assembler data word
 *
 *	The function outaw() processes a single word of
 *	assembled data in absolute format.
 *
 *	local variables:
 *		int *	txtp		pointer to data word
 *
 *	global variables:
 *		int	oflag		-o, generate relocatable output flag
 *		int	pass		assembler pass number
 *
 *	functions called:
 *		VOID	outchk()	asout.c
 *		VOID	out_lw()	asout.c
 *
 *	side effects:
 *		The current assembly address is incremented by 2.
 */

VOID
outaw(w)
{
	if (pass == 2) {
		out_lw(w,0);
		if (oflag) {
			outchk(2, 0);
			out_tw(w);
		}
	}
	dot.s_addr += 2;
}

/*)Function	VOID	write_rmode(r)
 *
 *		int	r		relocation mode
 *
 *	write_rmode puts the passed relocation mode into the 
 *	output relp buffer, escaping it if necessary.
 *
 *	global variables:
 *		int *	relp		pointer to rel array
 *
 *	functions called:
 *		VOID	rerr()		assubr.c
 *
 *	side effects:
 *		relp is incremented appropriately.
 */
VOID
write_rmode(int r)
{
    /* We need to escape the relocation mode if it is greater
     * than a byte, or if it happens to look like an escape.
     * (I don't think that the latter case is legal, but
     * better safe than sorry).
     */
    if ((r > 0xff) || ((r & R_ESCAPE_MASK) == R_ESCAPE_MASK))
    {
    	/* Hack in up to an extra 4 bits of flags with escape. */
    	if (r > 0xfff)
    	{
    	     /* uh-oh.. we have more than 4 extra bits. */
    	     fprintf(stderr, 
    	     	     "Internal error: relocation mode 0x%X too big.\n", 
    	     	     r);
    	     rerr();
    	}
    	/* printf("escaping relocation mode\n"); */
    	*relp++ = R_ESCAPE_MASK | (r >> 8);
    	*relp++ = r & 0xff;
    }
    else
    {
    	*relp++ = r;
    }
}

/*)Function	VOID	outrb(esp, r)
 *
 *		expr *	esp		pointer to expr structure
 *		int	r		relocation mode
 *
 *	The function outrb() processes a byte of generated code
 *	in either absolute or relocatable format dependent upon
 *	the data contained in the expr structure esp.  If the
 *	.REL output is enabled then the appropriate information
 *	is loaded into the txt and rel buffers.
 *
 *	local variables:
 *		int	n		symbol/area reference number
 *		int *	relp		pointer to rel array
 *		int *	txtp		pointer to txt array
 *
 *	global variables:
 *		sym	dot		defined as sym[0]
 *		int	oflag		-o, generate relocatable output flag
 *		int	pass		assembler pass number
 *		
 *	functions called:
 *		VOID	aerr()		assubr.c
 *		VOID	outchk()	asout.c
 *		VOID	out_lb()	asout.c
 *		VOID	out_rb()	asout.c
 *		VOID	out_tb()	asout.c
 *
 *	side effects:
 *		The current assembly address is incremented by 1.
 */

VOID
outrb(struct expr *esp, int r)
{
	register int n;

	if (pass == 2) {
		if (esp->e_flag==0 && esp->e_base.e_ap==NULL) {
			/* This is a constant; simply write the
			 * const byte to the T line and don't
			 * generate any relocation info.
			 */
			out_lb(lobyte(esp->e_addr),0);
			if (oflag) {
				outchk(1, 0);
				*txtp++ = lobyte(esp->e_addr);
			}
		} else {
		        /* We are generating a single byte of relocatable
		         * info.
		         *
		         * In 8051 mode, we generate a 16 bit address. The 
		         * linker will later select a single byte based on
		         * whether R_MSB is set.
		         *
		         * In flat24 mode, we generate a 24 bit address. The
		         * linker will select a single byte based on 
		         * whether R_MSB or R_HIB is set.
		         */
		        if (!flat24Mode)
		        { 
			    r |= R_BYTE | R_BYT2 | esp->e_rlcf;
			    if (r & R_MSB) {
				out_lb(hibyte(esp->e_addr),r|R_RELOC|R_HIGH);
			    } else {
				out_lb(lobyte(esp->e_addr),r|R_RELOC);
			    }
			    if (oflag) {
				outchk(2, 5);
				out_tw(esp->e_addr);
				if (esp->e_flag) {
					n = esp->e_base.e_sp->s_ref;
					r |= R_SYM;
				} else {
					n = esp->e_base.e_ap->a_ref;
				}
				write_rmode(r);
				*relp++ = txtp - txt - 2;
				out_rw(n);
			    }
			}
			else
			{
			    /* 24 bit mode. */
			    r |= R_BYTE | R_BYT3 | esp->e_rlcf;
			    if (r & R_HIB)
			    {
			        /* Probably should mark this differently in the
			         * listing file.
			         */
			        out_lb(byte3(esp->e_addr),r|R_RELOC|R_HIGH);
			    }
			    else if (r & R_MSB) {
				out_lb(hibyte(esp->e_addr),r|R_RELOC|R_HIGH);
			    } else {
				out_lb(lobyte(esp->e_addr),r|R_RELOC);
			    }
			    if (oflag) {
				outchk(3, 5);
				out_t24(esp->e_addr);
				if (esp->e_flag) {
					n = esp->e_base.e_sp->s_ref;
					r |= R_SYM;
				} else {
					n = esp->e_base.e_ap->a_ref;
				}
				write_rmode(r);
				*relp++ = txtp - txt - 3;
				out_rw(n);			    
			    }
			}
		}
	}
	++dot.s_addr;
}

/*)Function	VOID	outrw(esp, r)
 *
 *		expr *	esp		pointer to expr structure
 *		int	r		relocation mode
 *
 *	The function outrw() processes a word of generated code
 *	in either absolute or relocatable format dependent upon
 *	the data contained in the expr structure esp.  If the
 *	.REL output is enabled then the appropriate information
 *	is loaded into the txt and rel buffers.
 *
 *	local variables:
 *		int	n		symbol/area reference number
 *		int *	relp		pointer to rel array
 *		int *	txtp		pointer to txt array
 *
 *	global variables:
 *		sym	dot		defined as sym[0]
 *		int	oflag		-o, generate relocatable output flag
 *		int	pass		assembler pass number
 *		
 *	functions called:
 *		VOID	aerr()		assubr.c
 *		VOID	outchk()	asout.c
 *		VOID	out_lw()	asout.c
 *		VOID	out_rw()	asout.c
 *		VOID	out_tw()	asout.c
 *
 *	side effects:
 *		The current assembly address is incremented by 2.
 */

VOID
outrw(struct expr *esp, int r)
{
	register int n;

	if (pass == 2) {
	
		if (esp->e_addr > 0xffff)
		{
		    warnBanner();
		    fprintf(stderr,
		    	    "large constant 0x%x truncated to 16 bits\n",
		    	    esp->e_addr);
		}
		if (esp->e_flag==0 && esp->e_base.e_ap==NULL) {
			out_lw(esp->e_addr,0);
			if (oflag) {
				outchk(2, 0);
				out_tw(esp->e_addr);
			}
		} else {
			r |= R_WORD | esp->e_rlcf;
			if (r & R_BYT2) {
				rerr();
				if (r & R_MSB) {
					out_lw(hibyte(esp->e_addr),r|R_RELOC);
				} else {
					out_lw(lobyte(esp->e_addr),r|R_RELOC);
				}
			} else {
				out_lw(esp->e_addr,r|R_RELOC);
			}
			if (oflag) {
				outchk(2, 5);
				out_tw(esp->e_addr);
				if (esp->e_flag) {
					n = esp->e_base.e_sp->s_ref;
					r |= R_SYM;
				} else {
					n = esp->e_base.e_ap->a_ref;
				}
				
				if (IS_C24(r))
				{
				    /* If this happens, the linker will
				     * attempt to process this 16 bit field
				     * as 24 bits. That would be bad.
				     */
				    fprintf(stderr,
				    	    "***Internal error: C24 out in "
				    	    "outrw()\n");
				    rerr();
				}
				write_rmode(r);
				*relp++ = txtp - txt - 2;
				out_rw(n);
			}
		}
	}
	dot.s_addr += 2;
}

/*)Function	VOID	outr24(esp, r)
 *
 *		expr *	esp		pointer to expr structure
 *		int	r		relocation mode
 *
 *	The function outr24() processes 24 bits of generated code
 *	in either absolute or relocatable format dependent upon
 *	the data contained in the expr structure esp.  If the
 *	.REL output is enabled then the appropriate information
 *	is loaded into the txt and rel buffers.
 *
 *	local variables:
 *		int	n		symbol/area reference number
 *		int *	relp		pointer to rel array
 *		int *	txtp		pointer to txt array
 *
 *	global variables:
 *		sym	dot		defined as sym[0]
 *		int	oflag		-o, generate relocatable output flag
 *		int	pass		assembler pass number
 *		
 *	functions called:
 *		VOID	aerr()		assubr.c
 *		VOID	outchk()	asout.c
 *		VOID	out_l24()	asout.c
 *		VOID	out_rw()	asout.c
 *		VOID	out_t24()	asout.c
 *
 *	side effects:
 *		The current assembly address is incremented by 3.
 */

VOID
outr24(struct expr *esp, int r)
{
	register int n;

	if (pass == 2) {
		if (esp->e_flag==0 && esp->e_base.e_ap==NULL) {
			/* This is a constant expression. */
			out_l24(esp->e_addr,0);
			if (oflag) {
				outchk(3, 0);
				out_t24(esp->e_addr);
			}
		} else {
			/* This is a symbol. */
			r |= R_WORD | esp->e_rlcf;
			if (r & R_BYT2) {
				/* I have no idea what this case is. */
				rerr();
				if (r & R_MSB) {
					out_lw(hibyte(esp->e_addr),r|R_RELOC);
				} else {
					out_lw(lobyte(esp->e_addr),r|R_RELOC);
				}
			} else {
				out_l24(esp->e_addr,r|R_RELOC);
			}
			if (oflag) {
				outchk(3, 5);
				out_t24(esp->e_addr);
				if (esp->e_flag) {
					n = esp->e_base.e_sp->s_ref;
					r |= R_SYM;
				} else {
					n = esp->e_base.e_ap->a_ref;
				}
				
				if (r & R_BYTE)
				{
				    /* If this occurs, we cannot properly
				     * code the relocation data with the
				     * R_C24 flag. This means the linker
				     * will fail to do the 24 bit relocation.
				     * Which will suck.
				     */
				    fprintf(stderr,
				    	    "***Internal error: BYTE out in 24 "
				    	    "bit flat mode unexpected.\n");
				    rerr();
				}
				
				write_rmode(r | R_C24);
				*relp++ = txtp - txt - 3;
				out_rw(n);
			}
		}
	}
	dot.s_addr += 3;
}

/*)Function	VOID	outdp(carea, esp)
 *
 *		area *	carea		pointer to current area strcuture
 *		expr *	esp		pointer to expr structure
 *
 *	The function outdp() flushes the output buffer and
 *	outputs paging information to the .REL file.
 *
 *	local variables:
 *		int	n		symbol/area reference number
 *		int	r		relocation mode
 *		int *	relp		pointer to rel array
 *		int *	txtp		pointer to txt array
 *
 *	global variables:
 *		int	oflag		-o, generate relocatable output flag
 *		int	pass		assembler pass number
 *		
 *	functions called:
 *		VOID	outbuf()	asout.c
 *		VOID	outchk()	asout.c
 *		VOID	out_rw()	asout.c
 *		VOID	out_tw()	asout.c
 *
 *	side effects:
 *		Output buffer flushed to .REL fiel.
 *		Paging information dumped to .REL file.
 */

VOID
outdp(carea, esp)
register struct area *carea;
register struct expr *esp;
{
	register int n, r;

	if (oflag && pass==2) {
		outchk(HUGE,HUGE);
		out_tw(carea->a_ref);
		out_tw(esp->e_addr);
		if (esp->e_flag || esp->e_base.e_ap!=NULL) {
			r = R_WORD;
			if (esp->e_flag) {
				n = esp->e_base.e_sp->s_ref;
				r |= R_SYM;
			} else {
				n = esp->e_base.e_ap->a_ref;
			}
			write_rmode(r);
			*relp++ = txtp - txt - 2;
			out_rw(n);
		}
		outbuf("P");
	}
}

/*)Function	VOID	outall()
 *
 *	The function outall() will output any bufferred assembled
 *	data and relocation information (during pass 2 if the .REL
 *	output has been enabled).
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		int	oflag		-o, generate relocatable output flag
 *		int	pass		assembler pass number
 *
 *	functions called:
 *		VOID	outbuf()	asout.c
 *
 *	side effects:
 *		assembled data and relocation buffers will be cleared.
 */

VOID
outall()
{
	if (oflag && pass==2)
		outbuf("R");
}

/*)Function	VOID	outdot()
 *
 *	The function outdot() outputs information about the
 *	current program counter value (during pass 2 if the .REL
 *	output has been enabled).
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		int	oflag		-o, generate relocatable output flag
 *		int	pass		assembler pass number
 *
 *	functions called:
 *		int	fprintf()	c_library
 *		VOID	out()		asout.c
 *
 *	side effects:
 *		assembled data and relocation buffers will be cleared.
 */

VOID
outdot()
{
	if (oflag && pass==2) {
		fprintf(ofp, "T");
		out(txt,(int) (txtp-txt));
		fprintf(ofp, "\n");
		fprintf(ofp, "R");
		out(rel,(int) (relp-rel));
		fprintf(ofp, "\n");
		txtp = txt;
		relp = rel;
	}
}

/*)Function	outchk(nt, nr)
 *
 *		int	nr		number of additional relocation words
 *		int	nt		number of additional data words
 *
 *	The function outchk() checks the data and relocation buffers
 *	for space to insert the nt data words and nr relocation words.
 *	If space is not available then output the current data and
 *	initialize the data buffers to receive the new data.
 *
 *	local variables:
 *		area *	ap		pointer to an area structure
 *		int *	relp		pointer to rel array
 *		int *	txtp		pointer to txt array
 *
 *	global variables:
 *		sym	dot		defined as sym[0]
 *
 *	functions called:
 *		VOID	outbuf()	asout.c
 *
 *	side effects:
 *		Data and relocation buffers may be emptied and initialized.
 */

VOID
outchk(nt, nr)
{
	register struct area *ap;

	if (txtp+nt > &txt[NTXT] || relp+nr > &rel[NREL]) {
		outbuf("R");
	}
	if (txtp == txt) {
		out_tw(dot.s_addr);
		if ((ap = dot.s_area) != NULL) {
			write_rmode(R_WORD|R_AREA);
			*relp++ = 0;
			out_rw(ap->a_ref);
		}
	}
}

/*)Function	VOID	outbuf()
 *
 *	The function outbuf() will output any bufferred data
 *	and relocation information to the .REL file.  The output
 *	buffer pointers and counters are initialized.
 *
 *	local variables:
 *		int	rel[]		relocation data for code/data array
 *		int *	relp		pointer to rel array
 *		int	txt[]		assembled code/data array
 *		int *	txtp		pointer to txt array
 *
 *	global variables:
 *		FILE *	ofp		relocation output file handle
 *
 *	functions called:
 *		VOID	out()		asout.c
 *
 *	side effects:
 *		All bufferred data written to .REL file and
 *		buffer pointers and counters initialized.
 */

VOID
outbuf(s)
char *s;
{
	if (txtp > &txt[2]) {
		fprintf(ofp, "T");
		out(txt,(int) (txtp-txt));
		fprintf(ofp, "\n");
		fprintf(ofp, "%s", s);
		out(rel,(int) (relp-rel));
		fprintf(ofp, "\n");
	}
	txtp = txt;
	relp = rel;
}

/*)Function	VOID	outgsd()
 *
 *	The function outgsd() performs the following:
 *	(1)	outputs the .REL file radix
 *	(2)	outputs the header specifying the number
 *		of areas and global symbols
 *	(3)	outputs the module name
 *	(4)	set the reference number and output a symbol line
 *		for all external global variables and absolutes
 *	(5)	output an area name, set reference number and output
 *		a symbol line for all global relocatables in the area.
 *		Repeat this proceedure for all areas.
 *
 *	local variables:
 *		area *	ap		pointer to an area structure
 *		sym *	sp		pointer to a sym structure
 *		int	i		loop counter
 *		int	j		loop counter
 *		int	c		string character value
 *		int	narea		number of code areas
 *		char *	ptr		string pointer
 *		int	nglob		number of global symbols
 *		int	rn		symbol reference number
 *
 *	global variables:
 *		area *	areap		pointer to an area structure
 *		char	module[]	module name string
 *		sym * symhash[]		array of pointers to NHASH
 *					linked symbol lists
 *		int	xflag		-x, listing radix flag
 *
 *	functions called:
 *		int	fprintf()	c_library
 *		VOID	outarea()	asout.c
 *		VOID	outsym()	asout.c
 *		int	putc()		c_library
 *
 *	side effects:
 *		All symbols are given reference numbers, all symbol
 *		and area information is output to the .REL file.
 */

VOID
outgsd()
{
	register struct area *ap;
	register struct sym  *sp;
	register int i, j;
	char *ptr;
	int c, narea, nglob, rn;

	/*
	 * Number of areas
	 */
	narea = areap->a_ref + 1;

	/*
	 * Number of global references/absolutes
	 */
	nglob = 0;
	for (i = 0; i < NHASH; ++i) {
		sp = symhash[i];
		while (sp) {
			if (sp->s_flag&S_GBL)
				++nglob;
			sp = sp->s_sp;
		}
	}

	/*
	 * Output Radix and number of areas and symbols
	 */
	if (xflag == 0) {
		fprintf(ofp, "X%c\n", hilo ? 'H' : 'L');
		fprintf(ofp, "H %X areas %X global symbols\n", narea, nglob);
	} else
	if (xflag == 1) {
		fprintf(ofp, "Q%c\n", hilo ? 'H' : 'L');
		fprintf(ofp, "H %o areas %o global symbols\n", narea, nglob);
	} else
	if (xflag == 2) {
		fprintf(ofp, "D%c\n", hilo ? 'H' : 'L');
		fprintf(ofp, "H %u areas %u global symbols\n", narea, nglob);
	}		

	/*
	 * Module name
	 */
	if (module[0]) {
		fprintf(ofp, "M ");
		ptr = &module[0];
		while (ptr < &module[NCPS]) {
			if ((c = *ptr++) != 0)
				putc(c, ofp);
		}
		putc('\n', ofp);
	}

	/*
	 * Global references and absolutes.
	 */
	rn = 0;
	for (i=0; i<NHASH; ++i) {
		sp = symhash[i];
		while (sp) {
			if (sp->s_area==NULL && sp->s_flag&S_GBL) {
				sp->s_ref = rn++;
				outsym(sp);
			}
			sp = sp->s_sp;
		}
	}

	/*
	 * Global relocatables.
	 */
	for (i=0; i<narea; ++i) {
		ap = areap;
		while (ap->a_ref != i)
			ap = ap->a_ap;
		outarea(ap);
		for (j=0; j<NHASH; ++j) {
			sp = symhash[j];
			while (sp) {
				if (sp->s_area==ap && sp->s_flag&S_GBL) {
					sp->s_ref = rn++;
					outsym(sp);
				}
				sp = sp->s_sp;
			}
		}
	}
}

/*)Function	VOID	outarea(ap)
 *
 *		area *	ap		pointer to an area structure
 *
 *	The function outarea()	outputs the A line to the .REL
 *	file.  The A line contains the area's name, size, and
 *	attributes.
 *
 *	local variables:
 *		char *	ptr		pointer to area id string
 *		int	c		character value
 *
 *	global variables:
 *		FILE *	ofp		relocation output file handle
 *		int	xflag		-x, listing radix flag
 *
 *	functions called:
 *		int	fprintf()	c_library
 *		int	putc()		c_library
 *
 *	side effects:
 *		The A line is sent to the .REL file.
 */

VOID
outarea(ap)
register struct area *ap;
{
	register char *ptr;
	register int c;

	fprintf(ofp, "A ");
	ptr = &ap->a_id[0];
	while (ptr < &ap->a_id[NCPS]) {
		if ((c = *ptr++) != 0)
			putc(c, ofp);
	}
	if (xflag == 0) {
		fprintf(ofp, " size %X flags %X\n", ap->a_size, ap->a_flag);
	} else
	if (xflag == 1) {
		fprintf(ofp, " size %o flags %o\n", ap->a_size, ap->a_flag);
	} else
	if (xflag == 2) {
		fprintf(ofp, " size %u flags %u\n", ap->a_size, ap->a_flag);
	}
}

/*)Function	VOID	outsym(sp)
 *
 *		sym *	sp		pointer to a sym structure
 *
 *	The function outsym() outputs the S line to the .REL
 *	file.  The S line contains the symbols name and whether the
 *	the symbol is defined or referenced.
 *
 *	local variables:
 *		char *	ptr		pointer to symbol id string
 *		int	c		character value
 *
 *	global variables:
 *		FILE *	ofp		relocation output file handle
 *		int	xflag		-x, listing radix flag
 *
 *	functions called:
 *		int	fprintf()	c_library
 *		int	putc()		c_library
 *
 *	side effects:
 *		The S line is sent to the .REL file.
 */

VOID
outsym(sp)
register struct sym *sp;
{
	register char *ptr;       

	fprintf(ofp, "S ");
	ptr = &sp->s_id[0];
	fprintf(ofp, "%s", ptr );
	fprintf(ofp, " %s", sp->s_type==S_NEW ? "Ref" : "Def");
	if (xflag == 0) {
		fprintf(ofp, "%04X\n", sp->s_addr);
	} else
	if (xflag == 1) {
		fprintf(ofp, "%06o\n", sp->s_addr);
	} else
	if (xflag == 2) {
		fprintf(ofp, "%05u\n", sp->s_addr);
	}
}

/*)Function	VOID	out(p, n)
 *
 *		int	n		number of words to output
 *		int *	p		pointer to data words
 *
 *	The function out() outputs the data words to the .REL file
 *	int the specified radix.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		FILE *	ofp		relocation output file handle
 *		int	xflag		-x, listing radix flag
 *
 *	functions called:
 *		int	fprintf()	c_library
 *
 *	side effects:
 *		Data is sent to the .REL file.
 */

VOID
out(char *p, int n)
{
	while (n--) {
		if (xflag == 0) {
			fprintf(ofp, " %02X", (*p++)&0xff);
		} else
		if (xflag == 1) {
			fprintf(ofp, " %03o", (*p++)&0xff);
		} else
		if (xflag == 2) {
			fprintf(ofp, " %03u", (*p++)&0xff);
		}
	}
}

/*)Function	VOID	out_lb(b, t)
 *
 *		int	b		assembled data
 *		int	t		relocation type
 *
 *	The function out_lb() copies the assembled data and
 *	its relocation type to the list data buffers.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		int *	cp		pointer to assembler output array cb[]
 *		int *	cpt		pointer to assembler relocation type
 *					output array cbt[]
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		Pointers to data and relocation buffers incremented by 1.
 */

VOID
out_lb(b,t)
register int b,t;
{
	if (cp < &cb[NCODE]) {
		*cp++ = b;
		*cpt++ = t;
	}
}

/*)Function	VOID	out_lw(n, t)
 *
 *		int	n		assembled data
 *		int	t		relocation type
 *
 *	The function out_lw() copies the assembled data and
 *	its relocation type to the list data buffers.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		int *	cp		pointer to assembler output array cb[]
 *		int *	cpt		pointer to assembler relocation type
 *					output array cbt[]
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		Pointers to data and relocation buffers incremented by 2.
 */

VOID
out_lw(n,t)
register int n,t;
{
	if (hilo) {
		out_lb(hibyte(n),t ? t|R_HIGH : 0);
		out_lb(lobyte(n),t);
	} else {
		out_lb(lobyte(n),t);
		out_lb(hibyte(n),t ? t|R_HIGH : 0);
	}
}

/*)Function	VOID	out_l24(n, t)
 *
 *		int	n		assembled data
 *		int	t		relocation type
 *
 *	The function out_l24() copies the assembled data and
 *	its relocation type to the list data buffers.
 *
 *	local variables:
 *		none
 *
 *	global variables:
 *		int *	cp		pointer to assembler output array cb[]
 *		int *	cpt		pointer to assembler relocation type
 *					output array cbt[]
 *
 *	functions called:
 *		none
 *
 *	side effects:
 *		Pointers to data and relocation buffers incremented by 3.
 */

VOID
out_l24(int n, int t)
{
	if (hilo) {
		out_lb(byte3(n),t ? t|R_HIGH : 0);
		out_lb(hibyte(n),t);
		out_lb(lobyte(n),t);
	} else {
		out_lb(lobyte(n),t);
		out_lb(hibyte(n),t);
		out_lb(byte3(n),t ? t|R_HIGH : 0);
	}
}

/*)Function	VOID	out_rw(n)
 *
 *		int	n		data word
 *
 *	The function out_rw() outputs the relocation (R)
 *	data word as two bytes ordered according to hilo.
 *
 *	local variables:
 *		int *	relp		pointer to rel array
 *
 *	global variables:
 *		none
 *
 *	functions called:
 *		int	lobyte()	asout.c
 *		int	hibyte()	asout.c
 *
 *	side effects:
 *		Pointer to relocation buffer incremented by 2.
 */

VOID
out_rw(n)
register int n;
{
	if (hilo) {
		*relp++ = hibyte(n);
		*relp++ = lobyte(n);
	} else {
		*relp++ = lobyte(n);
		*relp++ = hibyte(n);
	}
}

/*)Function	VOID	out_tw(n)
 *
 *		int	n		data word
 *
 *	The function out_tw() outputs the text (T)
 *	data word as two bytes ordered according to hilo.
 *
 *	local variables:
 *		int *	txtp		pointer to txt array
 *
 *	global variables:
 *		none
 *
 *	functions called:
 *		int	lobyte()	asout.c
 *		int	hibyte()	asout.c
 *
 *	side effects:
 *		Pointer to relocation buffer incremented by 2.
 */

VOID
out_tw(n)
register int n;
{
	if (hilo) {
		*txtp++ = hibyte(n);
		*txtp++ = lobyte(n);
	} else {
		*txtp++ = lobyte(n);
		*txtp++ = hibyte(n);
	}
}

/*)Function	VOID	out_t24(n)
 *
 *		int	n		data word
 *
 *	The function out_t24() outputs the text (T)
 *	data word as three bytes ordered according to hilo.
 *
 *	local variables:
 *		int *	txtp		pointer to txt array
 *
 *	global variables:
 *		none
 *
 *	functions called:
 *		int	lobyte()	asout.c
 *		int	hibyte()	asout.c
 *
 *	side effects:
 *		Pointer to relocation buffer incremented by 3.
 */

VOID
out_t24(int n)
{
	if (hilo) {
		*txtp++ = byte3(n);
		*txtp++ = hibyte(n);
		*txtp++ = lobyte(n);
	} else {
		*txtp++ = lobyte(n);
		*txtp++ = hibyte(n);
		*txtp++ = byte3(n);
	}
}

/*)Function	int	lobyte(n)
 *
 *		int	n		data word
 *
 *	The function lobyte() returns the lower byte of
 *	integer n.
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
lobyte(n)
{
	return (n&0377);
}

/*)Function	int	hibyte(n)
 *
 *		int	n		data word
 *
 *	The function hibyte() returns the higher byte of
 *	integer n.
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
hibyte(n)
{
	return ((n>>8)&0377);
}

/*)Function	int	byte3(n)
 *
 *		int	n		24 bit data
 *
 *	The function byte3() returns the MSB of the
 *	24 bit integer n.
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
byte3(int n)
{
	return ((n >> 16) & 0xff);
}

/*
 * JLH: Output relocatable 11 bit jump/call
 *
 * This function is derived from outrw(), adding the parameter for the
 * 11 bit address.  This form of address is used only on the 8051 and 8048.
 */
VOID
outr11(esp, op, r)
register struct expr *esp;
int op;
int r;
{
	register int n;

	if (pass == 2) {
		if (esp->e_flag==0 && esp->e_base.e_ap==NULL) {
                	/* equated absolute destination.  Assume value
                         * relative to current area */
                        esp->e_base.e_ap = dot.s_area;
		}

                /* Relocatable destination.  Build THREE
                 * byte output: relocatable word, followed
                 * by op-code.  Linker will combine them.
                 * Listing shows only the address.
                 */
		r |= R_WORD | esp->e_rlcf;
                out_lw(esp->e_addr,r|R_RELOC);
                if (oflag) {
                        outchk(3, 5);
                        out_tw(esp->e_addr);
                        *txtp++ = op;

                        if (esp->e_flag) {
                                n = esp->e_base.e_sp->s_ref;
                                r |= R_SYM;
                        } else {
                                n = esp->e_base.e_ap->a_ref;
                        }
                        write_rmode(r);
                        *relp++ = txtp - txt - 3;
                        out_rw(n);
                }
	}
	dot.s_addr += 2;
}

/*
 * Output relocatable 19 bit jump/call
 *
 * This function is derived from outrw(), adding the parameter for the
 * 19 bit address.  This form of address is used only in the DS80C390
 * Flat24 mode.
 */
VOID
outr19(struct expr * esp, int op, int r)
{
	register int n;

	if (pass == 2) {
		if (esp->e_flag==0 && esp->e_base.e_ap==NULL) {
                	/* equated absolute destination.  Assume value
                         * relative to current area */
                        esp->e_base.e_ap = dot.s_area;
		}

                /* Relocatable destination.  Build FOUR
                 * byte output: relocatable 24-bit entity, followed
                 * by op-code.  Linker will combine them.
                 * Listing shows only the address.
                 */
		r |= R_WORD | esp->e_rlcf;
                out_l24(esp->e_addr,r|R_RELOC);
                if (oflag) {
                        outchk(4, 5);
                        out_t24(esp->e_addr);
                        *txtp++ = op;
                        
                        if (esp->e_flag) {
                                n = esp->e_base.e_sp->s_ref;
                                r |= R_SYM;
                        } else {
                                n = esp->e_base.e_ap->a_ref;
                        }
                        write_rmode(r);
                        *relp++ = txtp - txt - 4;
                        out_rw(n);
                }
	}
	dot.s_addr += 3;
}

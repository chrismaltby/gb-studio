/*-------------------------------------------------------------------------
  _modsint.c :- routine for signed int (16 bit) modulus

             Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1999)

   This library is free software; you can redistribute it and/or modify it
   under the terms of the GNU Library General Public License as published by the
   Free Software Foundation; either version 2, or (at your option) any
   later version.

   This library is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU Library General Public License for more details.

   You should have received a copy of the GNU Library General Public License
   along with this program; if not, write to the Free Software
   Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.

   In other words, you are welcome to use, share and improve this program.
   You are forbidden to forbid anyone else to use, share and improve
   what you give them.   Help stamp out software-hoarding!
-------------------------------------------------------------------------*/


#include <sdcc-lib.h>

#if _SDCC_MANGLES_SUPPORT_FUNS
unsigned unsigned _moduint (unsigned a, unsigned b);
#endif

/*   Assembler-functions are provided for:
     mcs51 small
     mcs51 small stack-auto
*/

#if !defined(SDCC_USE_XSTACK) && !defined(_SDCC_NO_ASM_LIB_FUNCS)
#  if defined(SDCC_mcs51)
#    if defined(SDCC_MODEL_SMALL)
#      if defined(SDCC_STACK_AUTO)
#        define _MODSINT_ASM_SMALL_AUTO
#      else
#        define _MODSINT_ASM_SMALL
#      endif
#    endif
#  endif
#endif

#if defined _MODSINT_ASM_SMALL

static void
_modsint_dummy (void) _naked
{
	_asm

		#define a0	dpl
		#define a1	dph

		.globl __modsint

		// _modsint_PARM_2 shares the same memory with _moduint_PARM_2
		// and is defined in _moduint.c
		#define b0      (__modsint_PARM_2)
		#define b1      (__modsint_PARM_2 + 1)

	__modsint:
					; a1 in dph
					; b1 in (__modsint_PARM_2 + 1)

		clr	F0 		; Flag 0 in PSW
					; available to user for general purpose
		mov	a,a1
		jnb	acc.7,a_not_negative

		setb	F0

		clr	a
		clr	c
		subb	a,a0
		mov	a0,a
		clr	a
		subb	a,a1
		mov	a1,a

	a_not_negative:

		mov	a,b1
		jnb	acc.7,b_not_negative

		cpl	F0

		clr	a
		clr	c
		subb	a,b0
		mov	b0,a
		clr	a
		subb	a,b1
		mov	b1,a

	b_not_negative:

		lcall	__moduint

		jnb	F0,not_negative

		clr	a
		clr	c
		subb	a,a0
		mov	a0,a
		clr	a
		subb	a,a1
		mov	a1,a

	not_negative:
		ret

	_endasm ;
}

#elif defined _MODSINT_ASM_SMALL_AUTO

static void
_modsint_dummy (void) _naked
{
	_asm

		#define a0	dpl
		#define a1	dph

		ar0 = 0			; BUG register set is not considered
		ar1 = 1

		.globl __modsint

	__modsint:

		clr	F0 		; Flag 0 in PSW
					; available to user for general purpose
		mov	a,a1
		jnb	acc.7,a_not_negative

		setb	F0

		clr	a
		clr	c
		subb	a,a0
		mov	a0,a
		clr	a
		subb	a,a1
		mov	a1,a

	a_not_negative:

		mov	a,sp
		add	a,#-2		; 2 bytes return address
		mov	r0,a		; r0 points to b1
		mov	a,@r0		; b1

		jnb	acc.7,b_not_negative

		cpl	F0

		dec	r0

		clr	a
		clr	c
		subb	a,@r0		; b0
		mov	@r0,a
		clr	a
		inc	r0
		subb	a,@r0		; b1
		mov	@r0,a

	b_not_negative:

		mov	ar1,@r0		; b1
		dec	r0
		mov	ar0,@r0		; b0

		lcall	__modint

		jnb	F0,not_negative

		clr	a
		clr	c
		subb	a,a0
		mov	a0,a
		clr	a
		subb	a,a1
		mov	a1,a

	not_negative:
		ret

	_endasm ;
}

#else  // _MODSINT_ASM_

int _modsint (int a, int b)
{
       register int r;
       
       r = _moduint((a < 0 ? -a : a),
	            (b < 0 ? -b : b));

       if ( (a < 0) ^ (b < 0))
	    return -r;
	else
	    return r;
}        	

#endif  // _MODSINT_ASM_

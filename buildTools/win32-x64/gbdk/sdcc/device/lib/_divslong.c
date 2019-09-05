/*-------------------------------------------------------------------------
   _divslong.c - routine for division of 32 bit long

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
unsigned long _divulong (unsigned long a, unsigned long b);
#endif

/*   Assembler-functions are provided for:
     mcs51 small
     mcs51 small stack-auto
*/

#if !defined(SDCC_USE_XSTACK) && !defined(_SDCC_NO_ASM_LIB_FUNCS)
#  if defined(SDCC_mcs51)
#    if defined(SDCC_MODEL_SMALL)
#      if defined(SDCC_STACK_AUTO)
#        define _DIVSLONG_ASM_SMALL_AUTO
#      else
#        define _DIVSLONG_ASM_SMALL
#      endif
#    endif
#  endif
#endif

#if defined _DIVSLONG_ASM_SMALL

static void
_divslong_dummy (void) _naked
{
	_asm

		#define a0	dpl
		#define a1	dph
		#define a2	b
		#define a3	r3

		.globl __divslong

		// _divslong_PARM_2 shares the same memory with _divulong_PARM_2
		// and is defined in _divulong.c
		#define b0      (__divslong_PARM_2)
		#define b1      (__divslong_PARM_2 + 1)
		#define b2      (__divslong_PARM_2 + 2)
		#define b3      (__divslong_PARM_2 + 3)

	__divslong:
					; a3 in acc
					; b3 in (__divslong_PARM_2 + 3)
		mov	a3,a		; save a3

		clr	F0 		; Flag 0 in PSW
					; available to user for general purpose
		jnb	acc.7,a_not_negative

		setb	F0

		clr	a
		clr	c
		subb	a,a0
		mov	a0,a
		clr	a
		subb	a,a1
		mov	a1,a
		clr	a
		subb	a,a2
		mov	a2,a
		clr	a
		subb	a,a3
		mov	a3,a

	a_not_negative:

		mov	a,b3
		jnb	acc.7,b_not_negative

		cpl	F0

		clr	a
		clr	c
		subb	a,b0
		mov	b0,a
		clr	a
		subb	a,b1
		mov	b1,a
		clr	a
		subb	a,b2
		mov	b2,a
		clr	a
		subb	a,b3
		mov	b3,a

	b_not_negative:

		mov	a,a3		; restore a3 in acc

		lcall	__divulong

		jnb	F0,not_negative

		mov	a3,a		; save a3

		clr	a
		clr	c
		subb	a,a0
		mov	a0,a
		clr	a
		subb	a,a1
		mov	a1,a
		clr	a
		subb	a,a2
		mov	a2,a
		clr	a
		subb	a,a3
		mov	a3,a

	not_negative:
		ret

	_endasm ;
}

#elif defined _DIVSLONG_ASM_SMALL_AUTO

static void
_divslong_dummy (void) _naked
{
	_asm

		#define a0	dpl
		#define a1	dph
		#define a2	b
		#define a3	r3

		.globl __divslong

	__divslong:

					; a3 in acc
		mov	a3,a		; save a3

		clr	F0 		; Flag 0 in PSW
					; available to user for general purpose
		jnb	acc.7,a_not_negative

		setb	F0

		clr	a
		clr	c
		subb	a,a0
		mov	a0,a
		clr	a
		subb	a,a1
		mov	a1,a
		clr	a
		subb	a,a2
		mov	a2,a
		clr	a
		subb	a,a3
		mov	a3,a

	a_not_negative:

		mov	a,sp
		add	a,#-2		; 2 bytes return address
		mov	r0,a		; r0 points to b3
		mov	a,@r0		; b3

		jnb	acc.7,b_not_negative

		cpl	F0

		dec	r0
		dec	r0
		dec	r0

		clr	a
		clr	c
		subb	a,@r0		; b0
		mov	@r0,a
		clr	a
		inc	r0
		subb	a,@r0		; b1
		mov	@r0,a
		clr	a
		inc	r0
		subb	a,@r0		; b2
		mov	@r0,a
		clr	a
		inc	r0
		subb	a,@r0		; b3
		mov	@r0,a

	b_not_negative:
		dec	r0
		dec	r0
		dec	r0		; r0 points to b0

		lcall	__divlong

		jnb	F0,not_negative

		mov	a3,a		; save a3

		clr	a
		clr	c
		subb	a,a0
		mov	a0,a
		clr	a
		subb	a,a1
		mov	a1,a
		clr	a
		subb	a,a2
		mov	a2,a
		clr	a
		subb	a,a3
		mov	a3,a

	not_negative:
		ret

	_endasm ;
}

#else // _DIVSLONG_ASM

long
_divslong (long a, long b)
{
  long r;

  r = _divulong((a < 0 ? -a : a),
                (b < 0 ? -b : b));
  if ( (a < 0) ^ (b < 0))
    return -r;
  else
    return r;
}

#endif // _DIVSLONG_ASM

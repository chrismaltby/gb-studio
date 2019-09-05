/*-------------------------------------------------------------------------
  _mulint.c :- routine for (unsigned) int (16 bit) multiplication

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

/* Signed and unsigned multiplication are the same - as long as the output
   has the same precision as the input.

   To do: _muluint and _mulsint should be replaced by _mulint.

   bernhard@bernhardheld.de

   Assembler-functions are provided for:
     ds390
     mcs51 small
     mcs51 small stack-auto
     mcs51 large
*/

#if !defined(SDCC_USE_XSTACK) && !defined(_SDCC_NO_ASM_LIB_FUNCS)
#  if defined(SDCC_ds390)
#    if !defined(SDCC_STACK_AUTO)
#      define _MULINT_ASM_LARGE
#    endif
#  elif defined(SDCC_mcs51)
#    if defined(SDCC_MODEL_SMALL)
#      if defined(SDCC_STACK_AUTO)
#        define _MULINT_ASM_SMALL_AUTO
#      else
#        define _MULINT_ASM_SMALL
#      endif
#    else // must be SDCC_MODEL_LARGE
#      if !defined(SDCC_STACK_AUTO)
#        define _MULINT_ASM_LARGE
#     endif
#   endif
#  endif
#endif

#ifdef _MULINT_ASM_LARGE

unsigned int
_muluint (unsigned int a, unsigned int b)	// in future: _mulint
{
  a*b; // hush the compiler

  /* mulint=
      (int)(lsb_a*lsb_b) +
      (char)(msb_a*lsb_b)<<8 +
      (char)(lsb_a*msb_b)<<8
  */

  _asm
    mov r2,dph ; msb_a
    mov r3,dpl ; lsb_a

    mov b,r3 ; lsb_a
    mov dptr,#__muluint_PARM_2
    movx a,@dptr ; lsb_b
    mul ab ; lsb_a*lsb_b
    mov r0,a
    mov r1,b

    mov b,r2 ; msb_a
    movx a,@dptr ; lsb_b
    mul ab ; msb_a*lsb_b
    add a,r1
    mov r1,a

    mov b,r3 ; lsb_a
    inc dptr
    movx a,@dptr ; msb_b
    mul ab ; lsb_a*msb_b
    add a,r1

    mov dph,a
    mov dpl,r0
    ret
  _endasm;
}

int
_mulsint (int a, int b)		// obsolete
{
  return _muluint (a, b);
}

#elif defined _MULINT_ASM_SMALL || defined _MULINT_ASM_SMALL_AUTO

void
_mulint_dummy (void) _naked
{
	_asm

	__mulint:
	__muluint:				; obsolete
	__mulsint:				; obsolete

		.globl __mulint
		.globl __muluint		; obsolete
		.globl __mulsint		; obsolete

#if !defined(SDCC_STACK_AUTO)

#if defined(SDCC_NOOVERLAY)
		.area DSEG    (DATA)
#else
		.area OSEG    (OVR,DATA)
#endif

	__mulint_PARM_2:
	__muluint_PARM_2:			; obsolete
	__mulsint_PARM_2:			; obsolete

		.globl __mulint_PARM_2
		.globl __muluint_PARM_2		; obsolete
		.globl __mulsint_PARM_2		; obsolete

		.ds	2

		.area CSEG    (CODE)

		; globbered registers none

		mov	a,dpl			;  1  al
		mov	b,__mulint_PARM_2	;  2  bl
		mul	ab			;  4  al * bl
		xch	a,dpl			;  1  store low-byte of return value, fetch al
		push	b			;  2

		mov	b,__mulint_PARM_2 + 1	;  2  bh
		mul	ab			;  4  al * bh
		pop	b			;  2
		add	a,b			;  1
		xch	a,dph			;  1  ah -> acc

		mov	b,__mulint_PARM_2	;  2  bl
		mul	ab			;  4  ah * bl
		add	a,dph			;  1
		mov	dph,a			;  1
		ret				;  2
						; 30

#else // SDCC_STACK_AUTO

		; globbered registers r0

		mov	a,#-2			;  1  return address 2 bytes
		add	a,sp			;  1
		mov	r0,a			;  1  r0 points to bh

		mov	a,@r0			;  1  bh
		mov	b,dpl			;  2  al
		mul	ab			;  4  al * bh
		push	acc			;  2

		mov	b,dpl			;  2  al
		dec	r0			;  1
		mov	a,@r0			;  1  bl
		mul	ab			;  4  al * bl

		mov	dpl,a			;  1  low-byte of return-value

		pop	acc			;  2
		add	a,b			;  1
		xch	a,dph			;  1  ah -> acc

		mov	b,@r0			;  2  bl
		mul	ab			;  4  ah * bl
		add	a,dph			;  1
		mov	dph,a			;  1

		ret

#endif // SDCC_STACK_AUTO

	_endasm ;
}

#else

union uu {
	struct { unsigned char lo,hi ;} s;
        unsigned int t;
} ;

unsigned int
_muluint (unsigned int a, unsigned int b)	// in future: _mulint
{
#ifdef SDCC_MODEL_LARGE		// still needed for large + stack-auto
	union uu xdata *x;
	union uu xdata *y;
	union uu t;
        x = (union uu xdata *)&a;
        y = (union uu xdata *)&b;
#else
	register union uu *x;
	register union uu *y;
	union uu t;
        x = (union uu *)&a;
        y = (union uu *)&b;
#endif

        t.t = x->s.lo * y->s.lo;
        t.s.hi += (x->s.lo * y->s.hi) + (x->s.hi * y->s.lo);

       return t.t;
}

int
_mulsint (int a, int b)		// obsolete
{
  return _muluint (a, b);
}

#endif

#undef _MULINT_ASM

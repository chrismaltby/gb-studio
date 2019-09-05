/*-------------------------------------------------------------------------
  _moduint.c :- routine for unsigned int (16 bit) modulus

             Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1999)

             Bug fixes by Martijn van Balen, aed@iae.nl

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

/*   Assembler-functions are provided for:
     mcs51 small
     mcs51 small stack-auto
*/

#if !defined(SDCC_USE_XSTACK) && !defined(_SDCC_NO_ASM_LIB_FUNCS)
#  if defined(SDCC_mcs51)
#    if defined(SDCC_MODEL_SMALL)
#      if defined(SDCC_STACK_AUTO)
#        define _MODUINT_ASM_SMALL_AUTO
#      else
#        define _MODUINT_ASM_SMALL
#      endif
#    endif
#  endif
#endif

#if defined _MODUINT_ASM_SMALL || defined _MODUINT_ASM_SMALL_AUTO

static void
_moduint_dummy (void) _naked
{
	_asm

		.globl __moduint

	__moduint:

		#define count   r2
		#define al      dpl
		#define ah      dph

#ifdef SDCC_STACK_AUTO

		ar0 = 0			; BUG register set is not considered
		ar1 = 1

		.globl __modint

		mov	a,sp
		add	a,#-2		; 2 bytes return address
		mov	r0,a		; r0 points to bh
		mov	ar1,@r0		; load bh
		dec	r0
		mov	ar0,@r0		; load bl

		#define bl      r0
		#define bh      r1

	__modint:			; entry point for __modsint


#else // SDCC_STACK_AUTO

#if defined(SDCC_NOOVERLAY)
		.area DSEG    (DATA)
#else
		.area OSEG    (OVR,DATA)
#endif

		.globl __moduint_PARM_2
		.globl __modsint_PARM_2

	__moduint_PARM_2:
	__modsint_PARM_2:
		.ds	2

		.area CSEG    (CODE)

		#define bl      (__moduint_PARM_2)
		#define bh      (__moduint_PARM_2 + 1)

#endif // SDCC_STACK_AUTO

		mov	a,bl		; avoid endless loop
		orl	a,bh
		jz	div_by_0

		mov	count,#1

	loop1:	mov	a,bl		; b <<= 1
		add	a,acc
		mov	bl,a
		mov	a,bh
		rlc	a
		jc	msbset
		mov	bh,a

		mov	a,al		; a - b
		subb	a,bl		; here carry is always clear
		mov	a,ah
		subb	a,bh

		jc	start

		inc	count
		sjmp	loop1


	start:	clr	c
		mov	a,bh		; b >>= 1;
	msbset:	rrc	a
		mov	bh,a
		mov	a,bl
		rrc	a
		mov	bl,a


	loop2:	clr	c
		mov	a,al		; a - b
		subb	a,bl

		mov	b,a
		mov	a,ah
		subb	a,bh

		jc	smaller		; a >= b?

		mov	ah,a		; -> yes;  a = a - b;
		mov	al,b
	smaller:			; -> no
		clr	c
		mov	a,bh		; b >>= 1;
		rrc	a
		mov	bh,a
		mov	a,bl
		rrc	a
		mov	bl,a

		djnz	count,loop2
	div_by_0:
		ret

	_endasm ;
}

#else  // defined _MODUINT_ASM_SMALL || defined _MODUINT_ASM_SMALL_AUTO

#define MSB_SET(x) ((x >> (8*sizeof(x)-1)) & 1) 

unsigned int
_moduint (unsigned int a, unsigned int b)
{
  unsigned char count = 0;
    
    
  while (!MSB_SET(b))
  {
    b <<= 1;
    if (b > a)
    {
      b >>=1;
      break;
    }
    count++;
  }
  do
  {
    if (a >= b)
      a -= b;
    b >>= 1;
  }
  while (count--);
  return a;
}

#endif  // defined _MODUINT_ASM_SMALL || defined _MODUINT_ASM_SMALL_AUTO

/*-------------------------------------------------------------------------
   _modulong.c - routine for modulus of 32 bit unsigned long

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
#        define _MODULONG_ASM_SMALL_AUTO
#      else
#        define _MODULONG_ASM_SMALL
#      endif
#    endif
#  endif
#endif

#if defined _MODULONG_ASM_SMALL

static void
_modlong_dummy (void) _naked
{
	_asm

		.globl __modulong

	__modulong:

#if defined(SDCC_NOOVERLAY)
		.area DSEG    (DATA)
#else
		.area OSEG    (OVR,DATA)
#endif

		.globl __modulong_PARM_2
		.globl __modslong_PARM_2

	__modulong_PARM_2:
	__modslong_PARM_2:
		.ds	4

		.area CSEG    (CODE)

		#define count   r0

		#define a0	dpl
		#define a1	dph
		#define a2	b
		#define a3	r1

		#define b0      (__modulong_PARM_2)
		#define b1      (__modulong_PARM_2 + 1)
		#define b2      (__modulong_PARM_2 + 2)
		#define b3      (__modulong_PARM_2 + 3)

					; parameter a comes in a, b, dph, dpl
		mov	a3,a		; save parameter a3

		mov	a,b0		; b == 0? avoid endless loop
		orl	a,b1
		orl	a,b2
		orl	a,b3
		jz	div_by_0

		mov	count,#0
		clr	c		; when loop1 jumps immediately to loop2

	loop1:	inc	count

		mov	a,b3		; if (!MSB_SET(b))
		jb	acc.7,loop2

		mov	a,b0		; b <<= 1
		add	a,acc
		mov	b0,a
		mov	a,b1
		rlc	a
		mov	b1,a
		mov	a,b2
		rlc	a
		mov	b2,a
		mov	a,b3
		rlc	a
		mov	b3,a

		mov	a,a0		; a - b
		subb	a,b0		; here carry is always clear
		mov	a,a1
		subb	a,b1
		mov	a,a2
		subb	a,b2
		mov	a,a3
		subb	a,b3

		jnc	loop1


		clr	c
		mov	a,b3		; b >>= 1;
		rrc	a
		mov	b3,a
		mov	a,b2
		rrc	a
		mov	b2,a
		mov	a,b1
		rrc	a
		mov	b1,a
		mov	a,b0
		rrc	a
		mov	b0,a

	loop2:	; clr	c		  never set
		mov	a,a0		; a - b
		subb	a,b0
		mov	r4,a
		mov	a,a1
		subb	a,b1
		mov	r5,a
		mov	a,a2
		subb	a,b2
		mov	r6,a
		mov	a,a3
		subb	a,b3

		jc	smaller		; a >= b?

		mov	a3,a		; -> yes;  a = a - b;
		mov	a2,r6
		mov	a1,r5
		mov	a0,r4
	smaller:			; -> no
		clr	c
		mov	a,b3		; b >>= 1;
		rrc	a
		mov	b3,a
		mov	a,b2
		rrc	a
		mov	b2,a
		mov	a,b1
		rrc	a
		mov	b1,a
		mov	a,b0
		rrc	a
		mov	b0,a

		djnz	count,loop2

		mov	a,a3		; prepare the return value
	div_by_0:
		ret

	_endasm ;
}

#elif defined _MODULONG_ASM_SMALL_AUTO

static void
_modlong_dummy (void) _naked
{
	_asm

		.globl __modulong

	__modulong:

		#define count   r0

		#define a0	dpl
		#define a1	dph
		#define a2	b
		#define a3	r1

		#define b0	r2
		#define b1	r3
		#define b2	r4
		#define b3	r5

		ar2 = 2			; BUG register set is not considered
		ar3 = 3
		ar4 = 4
		ar5 = 5

		.globl __modlong	; entry point for __modslong

					; parameter a comes in a, b, dph, dpl
		mov	a3,a		; save parameter a3

		mov	a,sp
		add	a,#-2-3		; 2 bytes return address, 3 bytes param b
		mov	r0,a		; r1 points to b0


		mov	ar2,@r0		; load b0
		inc	r0		; r0 points to b1
		mov	ar3,@r0		; b1
		inc	r0
		mov	ar4,@r0		; b2
		inc	r0
		mov	ar5,@r0		; b3

	__modlong:			; entry point for __modslong
					; a in r1, b, dph, dpl
					; b in r5, r4, r3, r2 

		mov	count,#0

		mov	a,b0		; b == 0? avoid endless loop
		orl	a,b1
		orl	a,b2
		orl	a,b3
		jz	div_by_0

		mov	count,#0
		clr	c		; when loop1 jumps immediately to loop2

	loop1:	inc	count

		mov	a,b3		; if (!MSB_SET(b))
		jb	acc.7,loop2

		mov	a,b0		; b <<= 1
		add	a,acc
		mov	b0,a
		mov	a,b1
		rlc	a
		mov	b1,a
		mov	a,b2
		rlc	a
		mov	b2,a
		mov	a,b3
		rlc	a
		mov	b3,a

		mov	a,a0		; a - b
		subb	a,b0		; here carry is always clear
		mov	a,a1
		subb	a,b1
		mov	a,a2
		subb	a,b2
		mov	a,a3
		subb	a,b3

		jnc	loop1


		clr	c
		mov	a,b3		; b >>= 1;
		rrc	a
		mov	b3,a
		mov	a,b2
		rrc	a
		mov	b2,a
		mov	a,b1
		rrc	a
		mov	b1,a
		mov	a,b0
		rrc	a
		mov	b0,a

	loop2:	; clr	c		  never set
		mov	a,a0		; a - b
		subb	a,b0
		mov	a,a1
		subb	a,b1
		mov	r6,a		; d1
		mov	a,a2
		subb	a,b2
		mov	r7,a		; d2
		mov	a,a3
		subb	a,b3

		jc	smaller		; a >= b?

		mov	a3,a		; -> yes;  a = a - b;
		mov	a2,r7
		mov	a1,r6
		mov	a,a0
		subb	a,b0
		mov	a0,a
	smaller:			; -> no
		clr	c
		mov	a,b3		; b >>= 1;
		rrc	a
		mov	b3,a
		mov	a,b2
		rrc	a
		mov	b2,a
		mov	a,b1
		rrc	a
		mov	b1,a
		mov	a,b0
		rrc	a
		mov	b0,a

		djnz	count,loop2

		mov	a,a3		; prepare the return value
	div_by_0:
		ret

	_endasm ;
}

#else // _MODULONG_ASM

#define MSB_SET(x) ((x >> (8*sizeof(x)-1)) & 1)

unsigned long
_modulong (unsigned long a, unsigned long b)
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

#endif // _MODULONG_ASM

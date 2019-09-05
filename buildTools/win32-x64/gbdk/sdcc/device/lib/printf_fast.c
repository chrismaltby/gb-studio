/* Fast printf routine for use with sdcc/mcs51
 * Copyright (c) 2001, Paul Stoffregen, paul@pjrc.com
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Library General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 */


// include support for 32 bit base 10 integers (%ld and %lu)
#define LONG_INT

// include support for minimum field widths (%8d, %20s)
#define FIELD_WIDTH


/* extern void putchar(char ); */


static bit long_flag, short_flag, print_zero_flag, negative_flag;

#ifdef FIELD_WIDTH
static bit field_width_flag;
static data unsigned char field_width;
#endif


void printf_fast(code char *fmt, ...) reentrant
{
	fmt;	/* supress unreferenced variable warning */

	_asm

printf_begin:
	mov	a, _bp		// r0 will point to va_args (stack)
	add	a, #253
	mov	r0, a		// r0 points to MSB of fmt
	mov	dph, @r0
	dec	r0
	mov	dpl, @r0	// dptr has address of fmt
	dec	r0

printf_main_loop:
	clr	a
	movc	a, @a+dptr	// get next byte of fmt string
	inc	dptr
	//cjne	a, #'%', printf_normal
	cjne	a, #37, printf_normal

printf_format:
	clr	_long_flag
	clr	_short_flag
	clr	_print_zero_flag
	clr	_negative_flag
#ifdef FIELD_WIDTH
	clr	_field_width_flag
	mov	_field_width, #0
#endif

printf_format_loop:
	clr	a
	movc	a, @a+dptr	// get next byte of data format
	inc	dptr

	/* parse and consume the field width digits, even if */
	/* we don't build the code to make use of them */
	add	a, #198
	jc	printf_nondigit1
	add	a, #10
	jnc	printf_nondigit2
#ifdef FIELD_WIDTH
printf_digit:
	setb	_field_width_flag
	mov	r1, a
	mov	a, _field_width
	mov	b, #10
	mul	ab
	add	a, r1
	mov	_field_width, a
#endif
	sjmp	printf_format_loop
printf_nondigit1:
	add	a, #10
printf_nondigit2:
	add	a, #48


printf_format_l:
	//cjne	a, #'l', printf_format_h
	cjne	a, #108, printf_format_h
	setb	_long_flag
	sjmp	printf_format_loop

printf_format_h:
	//cjne	a, #'h', printf_format_s
	cjne	a, #104, printf_format_s
	setb	_short_flag
	sjmp	printf_format_loop

printf_format_s:
	//cjne	a, #'s', printf_format_d
	cjne	a, #115, printf_format_d
	ljmp	printf_string

printf_format_d:
	//cjne	a, #'d', printf_format_u
	cjne	a, #100, printf_format_u
	lcall	printf_get_int
	ljmp	printf_int

printf_format_u:
	//cjne	a, #'u', printf_format_c
	cjne	a, #117, printf_format_c
	lcall	printf_get_int
	ljmp	printf_uint

printf_format_c:
	//cjne	a, #'c', printf_format_x
	cjne	a, #99, printf_format_x
	mov	a, @r0		// Acc has the character to print
	dec	r0
	sjmp	printf_char

printf_format_x:
	//cjne	a, #'x', printf_normal
	cjne	a, #120, printf_normal
	ljmp	printf_hex

printf_normal:
	jz	printf_eot
printf_char:
	lcall	printf_putchar
	sjmp	printf_main_loop

printf_eot:
	ljmp	printf_end




	/* print a string... just grab each byte with __gptrget */
	/* the user much pass a 24 bit generic pointer */

printf_string:
	push	dph		// save addr in fmt onto stack
	push	dpl
	mov	b, @r0		// b has type of address (generic *)
	dec	r0
	mov	dph, @r0
	dec	r0
	mov	dpl, @r0	// dptr has address of user's string
	dec	r0

#ifdef FIELD_WIDTH
	jnb	_field_width_flag, printf_str_loop
	push	dpl
	push	dph
printf_str_fw_loop:
	lcall	__gptrget
	jz	printf_str_space
	inc	dptr
	dec	_field_width
	mov	a, _field_width
	jnz	printf_str_fw_loop
printf_str_space:
	lcall	printf_space
	pop	dph
	pop	dpl
#endif // FIELD_WIDTH

printf_str_loop:
	lcall	__gptrget
	jz	printf_str_done
	inc	dptr
	lcall	printf_putchar
	sjmp	printf_str_loop
printf_str_done:
	pop	dpl		// restore addr withing fmt
	pop	dph
	ljmp	printf_main_loop








	/* printing in hex is easy because sdcc pushes the LSB first */

printf_hex:
	lcall	printf_hex8
	jb	_short_flag, printf_hex_end
	lcall	printf_hex8
	jnb	_long_flag, printf_hex_end
	lcall	printf_hex8
	lcall	printf_hex8
printf_hex_end:
	lcall	printf_zero
	ljmp	printf_main_loop
printf_hex8:
	mov	a, @r0
	lcall	printf_phex_msn
	mov	a, @r0
	dec	r0
	ljmp	printf_phex_lsn


#ifndef LONG_INT
printf_ld_in_hex:
	//mov	a, #'0'
	mov	a, #48
	lcall	printf_putchar
	//mov	a, #'x'
	mov	a, #120
	lcall	printf_putchar
	mov	a, r0
	add	a, #4
	mov	r0, a
	sjmp	printf_hex
#endif


	/* printing an integer is not so easy.  For a signed int */
	/* check if it is negative and print the minus sign and */
	/* invert it to a positive integer */

printf_int:
	mov	a, r5
	jnb	acc.7, printf_uint	/* check if negative */
	setb	_negative_flag
	mov	a, r1			/* invert integer */
	cpl	a
	addc	a, #1
	mov	r1, a
	jb	_short_flag, printf_uint
	mov	a, r2
	cpl	a
	addc	a, #0
	mov	r2, a
	jnb	_long_flag, printf_uint
	mov	a, r3
	cpl	a
	addc	a, #0
	mov	r3, a
	mov	a, r4
	cpl	a
	addc	a, #0
	mov	r4, a


	/* printing integers is a lot of work... because it takes so */
	/* long, the first thing to do is make sure we're doing as */
	/* little work as possible, then convert the binary int to */
	/* packed BCD, and finally print each digit of the BCD number */

printf_uint:

	jb	_short_flag, printf_uint_ck8
	jnb	_long_flag, printf_uint_ck16
printf_uint_ck32:
	/* it's a 32 bit int... but if the upper 16 bits are zero */
	/* we can treat it like a 16 bit integer and convert much faster */
#ifdef LONG_INT
	mov	a, r3
	jnz	printf_uint_begin
	mov	a, r4
	jnz	printf_uint_begin
#else
	mov	a, r3
	jnz	printf_ld_in_hex	;print long integer as hex
	mov	a, r4			;rather than just the low 16 bits
	jnz	printf_ld_in_hex
#endif
	clr	_long_flag
printf_uint_ck16:
	/* it's a 16 bit int... but if the upper 8 bits are zero */
	/* we can treat it like a 8 bit integer and convert much faster */
	mov	a, r2
	jnz	printf_uint_begin
	setb	_short_flag
printf_uint_ck8:
	/* it's an 8 bit int... if it's zero, it's a lot faster to just */
	/* print the digit zero and skip all the hard work! */
	mov	a, r1
	jnz	printf_uint_begin
#ifdef FIELD_WIDTH
	jnb	_field_width_flag, printf_uint_zero
	dec	_field_width
	lcall	printf_space
#endif
printf_uint_zero:
	//mov	a, #'0'
	mov	a, #48
	lcall	printf_putchar
	ljmp	printf_main_loop


printf_uint_begin:
	push	dpl
	push	dph
	lcall	printf_int2bcd		// bcd number in r3/r2/r7/r6/r5

#ifdef FIELD_WIDTH
	jnb	_field_width_flag, printf_uifw_end
#ifdef LONG_INT
printf_uifw_32:
	mov	r1, #10
	jnb	_long_flag, printf_uifw_16
	mov	a, r3
	anl	a, #0xF0
	jnz	printf_uifw_sub
	dec	r1
	mov	a, r3
	anl	a, #0x0F
	jnz	printf_uifw_sub
	dec	r1
	mov	a, r2
	anl	a, #0xF0
	jnz	printf_uifw_sub
	dec	r1
	mov	a, r2
	anl	a, #0x0F
	jnz	printf_uifw_sub
	dec	r1
	mov	a, r7
	anl	a, #0xF0
	jnz	printf_uifw_sub
#endif
printf_uifw_16:
	mov	r1, #5
	jb	_short_flag, printf_uifw_8
	mov	a, r7
	anl	a, #0x0F
	jnz	printf_uifw_sub
	dec	r1
	mov	a, r6
	anl	a, #0xF0
	jnz	printf_uifw_sub
printf_uifw_8:
	mov	r1, #3
	mov	a, r6
	anl	a, #0x0F
	jnz	printf_uifw_sub
	dec	r1
	mov	a, r5
	anl	a, #0xF0
	jnz	printf_uifw_sub
	dec	r1
printf_uifw_sub:
	;r1 has the number of digits for the number
	mov	a, _field_width
	mov	c, _negative_flag
	subb	a, r1
	jc	printf_uifw_end
	mov	_field_width, a

#ifdef LONG_INT
	push	ar3
	push	ar2
#endif
	push	ar7
	push	ar6
	push	ar5
	lcall	printf_space
	pop	ar5
	pop	ar6
	pop	ar7
#ifdef LONG_INT
	pop	ar2
	pop	ar3
#endif
printf_uifw_end:
#endif


printf_uint_doit:
	jnb	_negative_flag, printf_uint_pos
	//mov	a, #"-"
	mov	a, #45
	lcall	printf_putchar
printf_uint_pos:
	jb	_short_flag, printf_uint8
#ifdef LONG_INT
	jnb	_long_flag, printf_uint16
printf_uint32:
	push	ar5
	push	ar6
	push	ar7
	mov	dpl, r2
	mov	a, r3
	mov	dph, a
	lcall	printf_phex_msn
	mov	a, dph
	lcall	printf_phex_lsn
	mov	a, dpl
	lcall	printf_phex_msn
	mov	a, dpl
	lcall	printf_phex_lsn
	pop	acc
	mov	dpl, a
	lcall	printf_phex_msn
	mov	a, dpl
	pop	dph
	pop	dpl
	sjmp	printf_uint16a
#endif

printf_uint16:
	mov	dpl, r5
	mov	dph, r6
	mov	a, r7
printf_uint16a:
	lcall	printf_phex_lsn
	mov	a, dph
	lcall	printf_phex_msn
	mov	a, dph
	sjmp	printf_uint8a

printf_uint8:
	mov	dpl, r5
	mov	a, r6
printf_uint8a:
	lcall	printf_phex_lsn
	mov	a, dpl
	lcall	printf_phex_msn
	mov	a, dpl
	lcall	printf_phex_lsn
	lcall	printf_zero
	pop	dph
	pop	dpl
	ljmp	printf_main_loop











	/* read an integer into r1/r2/r3/r4, and msb into r5 */
printf_get_int:
	mov	a, @r0
	mov	r1, a
	mov	r5, a
	dec	r0
	jb	_short_flag, printf_get_done
	mov	r2, ar1
	mov	a, @r0
	mov	r1, a
	dec	r0
	jnb	_long_flag, printf_get_done
	mov	r4, ar2
	mov	r3, ar1
	mov	a, @r0
	mov	r2, a
	dec	r0
	mov	a, @r0
	mov	r1, a
	dec	r0
printf_get_done:
	ret







	/* convert binary number in r4/r3/r2/r1 into bcd packed number
	 * in r3/r2/r7/r6/r5.  The input number is destroyed in the
	 * process, to avoid needing extra memory for the result (and
	 * r1 gets used for temporary storage).  dptr is overwritten,
	 * but r0 is not changed.
	 */

printf_int2bcd:
	mov	a, r1
	anl	a, #0x0F
	mov	dptr, #_int2bcd_0
	movc	a, @a+dptr
	mov	r5, a

	mov	a, r1
	swap	a
	anl	a, #0x0F
	mov	r1, a			// recycle r1 for holding nibble
	mov	dptr, #_int2bcd_1
	movc	a, @a+dptr
	add	a, r5
	da	a
	mov	r5, a
	mov	a, r1
	orl	a, #16
	movc	a, @a+dptr
	addc	a, #0
	da	a
	mov	r6, a

	jnb	_short_flag, printf_i2bcd_16	// if 8 bit int, we're done
	ret

printf_i2bcd_16:
	mov	a, r2
	anl	a, #0x0F
	mov	r1, a
	mov	dptr, #_int2bcd_2
	movc	a, @a+dptr
	add	a, r5
	da	a
	mov	r5, a
	mov	a, r1
	orl	a, #16
	movc	a, @a+dptr
	addc	a, r6
	da	a
	mov	r6, a

	mov	a, r2
	swap	a
	anl	a, #0x0F
	mov	r1, a
	mov	dptr, #_int2bcd_3
	movc	a, @a+dptr
	add	a, r5
	da	a
	mov	r5, a
	mov	a, r1
	orl	a, #16
	movc	a, @a+dptr
	addc	a, r6
	da	a
	mov	r6, a
	mov	a, r1
	orl	a, #32
	movc	a, @a+dptr
	addc	a, #0
	da	a
	mov	r7, a

	jb	_long_flag, printf_i2bcd_32	// if 16 bit int, we're done
	ret

printf_i2bcd_32:

#ifdef LONG_INT
	mov	a, r3
	anl	a, #0x0F
	mov	r1, a
	mov	dptr, #_int2bcd_4
	movc	a, @a+dptr
	add	a, r5
	da	a
	mov	r5, a
	mov	a, r1
	orl	a, #16
	movc	a, @a+dptr
	addc	a, r6
	da	a
	mov	r6, a
	mov	a, r1
	orl	a, #32
	movc	a, @a+dptr
	addc	a, r7
	da	a
	mov	r7, a
	clr	a
	addc	a, #0
	mov	r2, a

	mov	a, r3
	swap	a
	anl	a, #0x0F
	mov	r1, a
	mov	dptr, #_int2bcd_5
	movc	a, @a+dptr
	add	a, r5
	da	a
	mov	r5, a
	mov	a, r1
	orl	a, #16
	movc	a, @a+dptr
	addc	a, r6
	da	a
	mov	r6, a
	mov	a, r1
	orl	a, #32
	movc	a, @a+dptr
	addc	a, r7
	da	a
	mov	r7, a
	mov	a, r1
	orl	a, #48
	movc	a, @a+dptr
	addc	a, r2
	da	a
	mov	r2, a

	mov	a, r4
	anl	a, #0x0F
	mov	r1, a
	mov	dptr, #_int2bcd_6
	mov	r3, #0
	lcall	printf_bcd_add10	// saves 27 bytes, costs 5 cycles

	mov	a, r4
	swap	a
	anl	a, #0x0F
	mov	r1, a
	mov	dptr, #_int2bcd_7
printf_bcd_add10:
	movc	a, @a+dptr
	add	a, r5
	da	a
	mov	r5, a
	mov	a, r1
	orl	a, #16
	movc	a, @a+dptr
	addc	a, r6
	da	a
	mov	r6, a
	mov	a, r1
	orl	a, #32
	movc	a, @a+dptr
	addc	a, r7
	da	a
	mov	r7, a
	mov	a, r1
	orl	a, #48
	movc	a, @a+dptr
	addc	a, r2
	da	a
	mov	r2, a
	mov	a, r1
	orl	a, #64
	movc	a, @a+dptr
	addc	a, r3
	da	a
	mov	r3, a
#endif
	ret




#ifdef FIELD_WIDTH
printf_space_loop:
	//mov	a, #' '
	mov	a, #32
	lcall	printf_putchar
	dec	_field_width
printf_space:
	mov	a, _field_width
	jnz	printf_space_loop
	ret
#endif





	/* print a hex digit, either upper 4 bit (msn) or lower 4 bits (lsn) */

printf_phex_msn:
	swap	a
printf_phex_lsn:
	anl	a, #15
	jnz	printf_phex_ok
	jnb	_print_zero_flag, printf_ret
printf_phex_ok:
	setb	_print_zero_flag
	add	a, #0x90
	da	a
	addc    a, #0x40
	da	a
printf_putchar:
	push	dph
	push	dpl
	push	ar0
	mov	dpl, a
	lcall	_putchar
	pop	ar0
	pop	dpl
	pop	dph
printf_ret:
	ret

	/* print a zero if all the calls to print the digits ended up */
	/* being leading zeros */

printf_zero:
        jb	_print_zero_flag, printf_ret
        //mov	a, #'0'
        mov	a, #48
        ljmp	printf_putchar
  
printf_end:
	_endasm;
}


/*
 * #! /usr/bin/perl
 * for ($d=0; $d < 8; $d++) {
 * 	$n = 16 ** $d;
 * 	for ($p=0; $p < 5; $p++) {
 * 		last unless (((16 ** $d) * 15) / (10 ** ($p * 2))) % 100;
 * 		printf "code unsigned char int2bcd_%d_%d[15] = {", $d, $p;
 * 		for ($i=0; $i < 16; $i++) {
 * 			printf "0x%02d",
 * 			   (((16 ** $d) * $i) / (10 ** ($p * 2))) % 100;
 * 			print ", " if $i < 15;
 * 		}
 * 		print "};\n";
 * 	}
 * }
 */


code unsigned char int2bcd_0[] = {
0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
0x08, 0x09, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15};

code unsigned char int2bcd_1[] = {
0x00, 0x16, 0x32, 0x48, 0x64, 0x80, 0x96, 0x12,
0x28, 0x44, 0x60, 0x76, 0x92, 0x08, 0x24, 0x40,
0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
0x01, 0x01, 0x01, 0x01, 0x01, 0x02, 0x02, 0x02};

code unsigned char int2bcd_2[] = {
0x00, 0x56, 0x12, 0x68, 0x24, 0x80, 0x36, 0x92,
0x48, 0x04, 0x60, 0x16, 0x72, 0x28, 0x84, 0x40,
0x00, 0x02, 0x05, 0x07, 0x10, 0x12, 0x15, 0x17,
0x20, 0x23, 0x25, 0x28, 0x30, 0x33, 0x35, 0x38};

code unsigned char int2bcd_3[] = {
0x00, 0x96, 0x92, 0x88, 0x84, 0x80, 0x76, 0x72,
0x68, 0x64, 0x60, 0x56, 0x52, 0x48, 0x44, 0x40,
0x00, 0x40, 0x81, 0x22, 0x63, 0x04, 0x45, 0x86,
0x27, 0x68, 0x09, 0x50, 0x91, 0x32, 0x73, 0x14,
0x00, 0x00, 0x00, 0x01, 0x01, 0x02, 0x02, 0x02,
0x03, 0x03, 0x04, 0x04, 0x04, 0x05, 0x05, 0x06};

#ifdef LONG_INT
code unsigned char int2bcd_4[] = {
0x00, 0x36, 0x72, 0x08, 0x44, 0x80, 0x16, 0x52,
0x88, 0x24, 0x60, 0x96, 0x32, 0x68, 0x04, 0x40,
0x00, 0x55, 0x10, 0x66, 0x21, 0x76, 0x32, 0x87,
0x42, 0x98, 0x53, 0x08, 0x64, 0x19, 0x75, 0x30,
0x00, 0x06, 0x13, 0x19, 0x26, 0x32, 0x39, 0x45,
0x52, 0x58, 0x65, 0x72, 0x78, 0x85, 0x91, 0x98};

code unsigned char int2bcd_5[] = {
0x00, 0x76, 0x52, 0x28, 0x04, 0x80, 0x56, 0x32,
0x08, 0x84, 0x60, 0x36, 0x12, 0x88, 0x64, 0x40,
0x00, 0x85, 0x71, 0x57, 0x43, 0x28, 0x14, 0x00,
0x86, 0x71, 0x57, 0x43, 0x29, 0x14, 0x00, 0x86,
0x00, 0x04, 0x09, 0x14, 0x19, 0x24, 0x29, 0x34,
0x38, 0x43, 0x48, 0x53, 0x58, 0x63, 0x68, 0x72,
0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
0x08, 0x09, 0x10, 0x11, 0x12, 0x13, 0x14, 0x15};

code unsigned char int2bcd_6[] = {
0x00, 0x16, 0x32, 0x48, 0x64, 0x80, 0x96, 0x12,
0x28, 0x44, 0x60, 0x76, 0x92, 0x08, 0x24, 0x40,
0x00, 0x72, 0x44, 0x16, 0x88, 0x60, 0x32, 0x05,
0x77, 0x49, 0x21, 0x93, 0x65, 0x38, 0x10, 0x82,
0x00, 0x77, 0x55, 0x33, 0x10, 0x88, 0x66, 0x44,
0x21, 0x99, 0x77, 0x54, 0x32, 0x10, 0x88, 0x65,
0x00, 0x16, 0x33, 0x50, 0x67, 0x83, 0x00, 0x17,
0x34, 0x50, 0x67, 0x84, 0x01, 0x18, 0x34, 0x51,
0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x01,
0x01, 0x01, 0x01, 0x01, 0x02, 0x02, 0x02, 0x02};

code unsigned char int2bcd_7[] = {
0x00, 0x56, 0x12, 0x68, 0x24, 0x80, 0x36, 0x92,
0x48, 0x04, 0x60, 0x16, 0x72, 0x28, 0x84, 0x40,
0x00, 0x54, 0x09, 0x63, 0x18, 0x72, 0x27, 0x81,
0x36, 0x91, 0x45, 0x00, 0x54, 0x09, 0x63, 0x18,
0x00, 0x43, 0x87, 0x30, 0x74, 0x17, 0x61, 0x04,
0x48, 0x91, 0x35, 0x79, 0x22, 0x66, 0x09, 0x53,
0x00, 0x68, 0x36, 0x05, 0x73, 0x42, 0x10, 0x79,
0x47, 0x15, 0x84, 0x52, 0x21, 0x89, 0x58, 0x26,
0x00, 0x02, 0x05, 0x08, 0x10, 0x13, 0x16, 0x18,
0x21, 0x24, 0x26, 0x29, 0x32, 0x34, 0x37, 0x40};
#endif



/*-------------------------------------------------------------------------
   setjmp.h - header file for setjmp & longjmp ANSI routines

   Copyright (C) 1999, Sandeep Dutta . sandeep.dutta@usa.net

   This library is free software; you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation; either version 2, or (at your option) any
   later version.

   This library is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this library; see the file COPYING. If not, write to the
   Free Software Foundation, 51 Franklin Street, Fifth Floor, Boston,
   MA 02110-1301, USA.

   As a special exception, if you link this library with other files,
   some of which are compiled with SDCC, to produce an executable,
   this library does not by itself cause the resulting executable to
   be covered by the GNU General Public License. This exception does
   not however invalidate any other reasons why the executable file
   might be covered by the GNU General Public License.
-------------------------------------------------------------------------*/

#ifndef __SDCC_SETJMP_H
#define __SDCC_SETJMP_H

#define SP_SIZE		1

#ifdef __SDCC_STACK_AUTO
#define BP_SIZE		SP_SIZE
#else
#define BP_SIZE		0
#endif

#ifdef __SDCC_USE_XSTACK
#define SPX_SIZE	1
#else
#define SPX_SIZE	0
#endif

#define BPX_SIZE	SPX_SIZE

#ifdef __SDCC_MODEL_HUGE
#define RET_SIZE	3
#else
#define RET_SIZE	2
#endif

#if defined (__SDCC_z80) || defined (__SDCC_z180) || defined (__SDCC_r2k) || defined (__SDCC_r3ka) || defined (__SDCC_tlcs90) || defined (__SDCC_ez80_z80) || defined (__SDCC_z80n)
typedef unsigned char jmp_buf[6]; /* 2 for the stack pointer, 2 for the return address, 2 for the frame pointer. */
#elif defined (__SDCC_ds390) || defined (__SDCC_stm8) && defined (__SDCC_MODEL_LARGE)
typedef unsigned char jmp_buf[5]; /* 2 for the stack pointer, 3 for the return address. */
#elif defined (__SDCC_stm8) || defined (__SDCC_gbz80) || defined (__SDCC_hc08) || defined (__SDCC_s08)
typedef unsigned char jmp_buf[4]; /* 2 for the stack pointer, 2 for the return address. */
#elif defined (__SDCC_pdk13) || defined (__SDCC_pdk14) || defined (__SDCC_pdk15)
typedef unsigned char jmp_buf[3]; /* 1 for the stack pointer, 2 for the return address. */
#else
typedef unsigned char jmp_buf[RET_SIZE + SP_SIZE + BP_SIZE + SPX_SIZE + BPX_SIZE];
#endif

int __setjmp (jmp_buf);

/* C99 might require setjmp to be a macro. The standard seems self-contradicting on this issue. */
/* However, it is clear that the standards allow setjmp to be a macro. */
#define setjmp(jump_buf) __setjmp(jump_buf)

#ifndef __SDCC_HIDE_LONGJMP
_Noreturn void longjmp(jmp_buf, int);
#endif

#undef RET_SIZE
#undef SP_SIZE
#undef BP_SIZE
#undef SPX_SIZE
#undef BPX_SIZE

#endif


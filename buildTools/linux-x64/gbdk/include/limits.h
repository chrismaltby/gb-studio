/*-------------------------------------------------------------------------
   limits.h - ANSI defines constants for sizes of integral types

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

#ifndef __SDC51_LIMITS_H
#define __SDC51_LIMITS_H 1

#define CHAR_BIT    8    /* bits in a char */
#define SCHAR_MAX   127
#define SCHAR_MIN  -128
#define UCHAR_MAX   0xff

#ifdef __SDCC_CHAR_UNSIGNED
#define CHAR_MAX    UCHAR_MAX
#define CHAR_MIN    0
#else
#define CHAR_MAX    SCHAR_MAX
#define CHAR_MIN    SCHAR_MIN
#endif

#if defined(__STDC_VERSION__) && __STDC_VERSION__ >= 199409L
#define MB_LEN_MAX  4
#endif

#define INT_MIN     (-32767 - 1)
#define INT_MAX     32767
#define SHRT_MAX    INT_MAX
#define SHRT_MIN    INT_MIN
#define UINT_MAX    0xffff
#define UINT_MIN    0
#define USHRT_MAX   UINT_MAX
#define USHRT_MIN   UINT_MIN
#define LONG_MIN    (-2147483647L-1)
#define LONG_MAX    2147483647L
#define ULONG_MAX   0xffffffff
#define ULONG_MIN   0

#if defined(__STDC_VERSION__) && __STDC_VERSION__ >= 199901L
#define LLONG_MIN   (-9223372036854775807LL-1)
#define LLONG_MAX   9223372036854775807LL
#define ULLONG_MAX  18446744073709551615ULL
#endif

#endif


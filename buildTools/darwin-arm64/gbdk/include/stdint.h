/*-------------------------------------------------------------------------
   stdint.h - ISO C99 7.18 Integer types <stdint.h>

   Copyright (C) 2005, Maarten Brock, sourceforge.brock@dse.nl
   Copyright (C) 2011, Philipp Klaus Krause, pkk@spth.de

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

#ifndef _STDINT_H
#define _STDINT_H       1

/* Exact integral types.  */

#if !defined(__SDCC_pic14) && !defined(__SDCC_pic16)
#if __STDC_VERSION__ >= 199901L
#define __SDCC_LONGLONG
#endif
#endif

/* Signed.  */

typedef signed char             int8_t;
typedef short int               int16_t;
typedef long int                int32_t;
#ifdef __SDCC_LONGLONG
typedef long long int           int64_t;
#endif

/* Unsigned.  */
typedef unsigned char           uint8_t;
typedef unsigned short int      uint16_t;
typedef unsigned long int       uint32_t;
#ifdef __SDCC_LONGLONG
typedef unsigned long long int  uint64_t;
#endif

/* Small types.  */

/* Signed.  */
typedef signed char             int_least8_t;
typedef short int               int_least16_t;
typedef long int                int_least32_t;
#ifdef __SDCC_LONGLONG
typedef long long int           int_least64_t;
#endif

/* Unsigned.  */
typedef unsigned char           uint_least8_t;
typedef unsigned short int      uint_least16_t;
typedef unsigned long int       uint_least32_t;
#ifdef __SDCC_LONGLONG
typedef unsigned long long int  uint_least64_t;
#endif

/* Fast types.  */

/* Signed.  */
typedef signed char             int_fast8_t;
typedef int                     int_fast16_t;
typedef long int                int_fast32_t;
#ifdef __SDCC_LONGLONG
typedef long long int           int_fast64_t;
#endif

/* Unsigned.  */
typedef unsigned char           uint_fast8_t;
typedef unsigned int            uint_fast16_t;
typedef unsigned long int       uint_fast32_t;
#ifdef __SDCC_LONGLONG
typedef unsigned long long int  uint_fast64_t;
#endif

/* Types for `void *' pointers.  */
#if defined (__SDCC_mcs51) || defined (__SDCC_ds390)
  typedef long int              intptr_t;
  typedef unsigned long int     uintptr_t;
#else
  typedef int                   intptr_t;
  typedef unsigned int          uintptr_t;
#endif


/* Largest integral types.  */
#ifndef __SDCC_LONGLONG
typedef long int                intmax_t;
typedef unsigned long int       uintmax_t;
#else
typedef long long int           intmax_t;
typedef unsigned long long int  uintmax_t;
#endif

/* Limits of integral types.  */

/* Minimum of signed integral types.  */
#define INT8_MIN               (-128)
#define INT16_MIN              (-32767-1)
#define INT32_MIN              (-2147483647L-1)
#ifdef __SDCC_LONGLONG
#define INT64_MIN              (-9223372036854775807LL-1)
#endif

/* Maximum of signed integral types.  */
#define INT8_MAX               (127)
#define INT16_MAX              (32767)
#define INT32_MAX              (2147483647L)
#ifdef __SDCC_LONGLONG
#define INT64_MAX              (9223372036854775807LL)
#endif

/* Maximum of unsigned integral types.  */
#define UINT8_MAX              (255)
#define UINT16_MAX             (65535)
#define UINT32_MAX             (4294967295UL)
#ifdef __SDCC_LONGLONG
#define UINT64_MAX             (18446744073709551615ULL)
#endif

/* Minimum of signed integral types having a minimum size.  */
#define INT_LEAST8_MIN         INT8_MIN
#define INT_LEAST16_MIN        INT16_MIN
#define INT_LEAST32_MIN        INT32_MIN
#ifdef __SDCC_LONGLONG
#define INT_LEAST64_MIN        INT64_MIN
#endif

/* Maximum of signed integral types having a minimum size.  */
#define INT_LEAST8_MAX         INT8_MAX
#define INT_LEAST16_MAX        INT16_MAX
#define INT_LEAST32_MAX        INT32_MAX
#ifdef __SDCC_LONGLONG
#define INT_LEAST64_MAX        INT64_MAX
#endif

/* Maximum of unsigned integral types having a minimum size.  */
#define UINT_LEAST8_MAX        UINT8_MAX
#define UINT_LEAST16_MAX       UINT16_MAX
#define UINT_LEAST32_MAX       UINT32_MAX
#ifdef __SDCC_LONGLONG
#define UINT_LEAST64_MAX       UINT64_MAX
#endif

/* Minimum of fast signed integral types having a minimum size.  */
#define INT_FAST8_MIN          INT8_MIN
#define INT_FAST16_MIN         INT16_MIN
#define INT_FAST32_MIN         INT32_MIN
#ifdef __SDCC_LONGLONG
#define INT_FAST64_MIN         INT64_MIN
#endif

/* Maximum of fast signed integral types having a minimum size.  */
#define INT_FAST8_MAX          INT8_MAX
#define INT_FAST16_MAX         INT16_MAX
#define INT_FAST32_MAX         INT32_MAX
#ifdef __SDCC_LONGLONG
#define INT_FAST64_MAX         INT64_MAX
#endif

/* Maximum of fast unsigned integral types having a minimum size.  */
#define UINT_FAST8_MAX         UINT8_MAX
#define UINT_FAST16_MAX        UINT16_MAX
#define UINT_FAST32_MAX        UINT32_MAX
#ifdef __SDCC_LONGLONG
#define UINT_FAST64_MAX        UINT64_MAX
#endif

/* Values to test for integral types holding `void *' pointer.  */
#if defined (__SDCC_mcs51) || defined (__SDCC_ds390)
#define INTPTR_MIN             (-2147483647L-1)
#define INTPTR_MAX             (2147483647L)
#define UINTPTR_MAX            (4294967295UL)
#else
#define INTPTR_MIN             (-32767-1)
#define INTPTR_MAX             (32767)
#define UINTPTR_MAX            (65535)
#endif

/* Minimum for largest signed integral type.  */
#ifndef __SDCC_LONGLONG
#define INTMAX_MIN             (-2147483647L-1)
#else
#define INTMAX_MIN             (-9223372036854775807LL-1)
#endif

/* Maximum for largest signed integral type.  */
#ifndef __SDCC_LONGLONG
#define INTMAX_MAX             (2147483647L)
#else
#define INTMAX_MAX             (9223372036854775807LL)
#endif

/* Maximum for largest unsigned integral type.  */
#ifndef __SDCC_LONGLONG
#define UINTMAX_MAX            (4294967295UL)
#else
#define UINTMAX_MAX            (18446744073709551615ULL)
#endif

/* Limits of other integer types.  */

/* Limits of `ptrdiff_t' type.  */
#if defined (__SDCC_mcs51) || defined (__SDCC_ds390)
#define PTRDIFF_MIN           (-2147483647L-1)
#define PTRDIFF_MAX           (2147483647L)
#else
#define PTRDIFF_MIN           (-32767-1)
#define PTRDIFF_MAX           (32767)
#endif

/* */
#define SIG_ATOMIC_MIN        (0)
#define SIG_ATOMIC_MAX        (255)

/* Limit of `size_t' type.  */
#define SIZE_MAX               (65535u)

/* Signed.  */
#define INT8_C(c)      c
#define INT16_C(c)     c
#define INT32_C(c)     c ## L
#ifdef __SDCC_LONGLONG
#define INT64_C(c)     c ## LL
#endif

/* Unsigned.  */
#define UINT8_C(c)     c ## U
#define UINT16_C(c)    c ## U
#define UINT32_C(c)    c ## UL
#ifdef __SDCC_LONGLONG
#define UINT64_C(c)    c ## ULL
#endif

#define WCHAR_MIN      0
#define WCHAR_MAX      0xffffffff

#define WINT_MIN       0
#define WINT_MAX       0xffffffff

/* Maximal type.  */
#ifdef __SDCC_LONGLONG
#define INTMAX_C(c)    c ## LL
#define UINTMAX_C(c)   c ## ULL
#else
#define INTMAX_C(c)    c ## L
#define UINTMAX_C(c)   c ## UL
#endif

/* Bounds-checking interfaces from annex K of the C11 standard. */
#if defined (__STDC_WANT_LIB_EXT1__) && __STDC_WANT_LIB_EXT1__
#define RSIZE_MAX SIZE_MAX
#endif

#endif /* stdint.h */


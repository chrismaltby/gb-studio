/*-------------------------------------------------------------------------
   stddef.h - ANSI functions forward declarations

   Copyright (C) 2004, Maarten Brock / sourceforge.brock@dse.nl
   Copyright (C) 2011, Philipp Klaus Krause / pkk@spth.de

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

#ifndef __SDCC_STDDEF_H
#define __SDCC_STDDEF_H 1

#ifndef NULL
  #define NULL (void *)0
#endif

#ifndef __PTRDIFF_T_DEFINED
#define __PTRDIFF_T_DEFINED
#if defined (__SDCC_mcs51) || defined (__SDCC_ds390)
  typedef long int ptrdiff_t;
#else
  typedef int ptrdiff_t;
#endif
#endif

#ifndef __SIZE_T_DEFINED
#define __SIZE_T_DEFINED
  typedef unsigned int size_t;
#endif

#if __STDC_VERSION__ >= 201112L
  typedef unsigned char max_align_t;
#endif

#ifndef __WCHAR_T_DEFINED
#define __WCHAR_T_DEFINED
  typedef unsigned long int wchar_t;
#endif

/* Bounds-checking interfaces from annex K of the C11 standard. */
#if defined (__STDC_WANT_LIB_EXT1__) && __STDC_WANT_LIB_EXT1__

#ifndef __RSIZE_T_DEFINED
#define __RSIZE_T_DEFINED
typedef size_t rsize_t;
#endif

#ifndef __ERRNO_T_DEFINED
#define __ERRNO_T_DEFINED
typedef int errno_t;
#endif

#endif

#define offsetof(s, m) __builtin_offsetof (s, m)

#endif


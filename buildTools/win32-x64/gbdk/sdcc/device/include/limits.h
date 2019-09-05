/*-------------------------------------------------------------------------
  limits.h - ANSI defines constants for sizes of integral types 
 
             Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1999)

   This program is free software; you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation; either version 2, or (at your option) any
   later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
   
   In other words, you are welcome to use, share and improve this program.
   You are forbidden to forbid anyone else to use, share and improve
   what you give them.   Help stamp out software-hoarding!  
-------------------------------------------------------------------------*/

#ifndef __SDC51_LIMITS_H
#define __SDC51_LIMITS_H 1

#define CHAR_BIT      8    /* bits in a char */
#define CHAR_MAX    127
#define CHAR_MIN   -128
#define SCHAR_MAX   CHAR_MAX
#define SCHAR_MIN   CHAR_MIN
#define UCHAR_MAX   0xff
#define UCHAR_MIN   0
#define SHRT_MAX    CHAR_MAX
#define SHRT_MIN    CHAR_MIN
#define USHRT_MAX   UCHAR_MAX
#define USHRT_MIN   UCHAR_MIN
#define INT_MIN    -32768
#define INT_MAX     32767
#define UINT_MAX    0xffff
#define UINT_MIN    0
#define LONG_MIN   -2147483648
#define LONG_MAX    2147483647
#define ULONG_MAX   0xffffffff
#define ULONG_MIN   0


#endif







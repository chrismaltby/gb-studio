/*-------------------------------------------------------------------------
   typeof.h - Contains enumerations of values returned by __typeof
 
   Copyright (C) 2001, Sandeep Dutta . sandeep.dutta@usa.net

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

#ifndef __SDC51_TYPEOF_H
#define __SDC51_TYPEOF_H 1

#define TYPEOF_INT        1
#define TYPEOF_SHORT      2
#define TYPEOF_CHAR       3
#define TYPEOF_LONG       4
#define TYPEOF_FLOAT      5
#define TYPEOF_FIXED16X16 6
#define TYPEOF_BIT        7
#define TYPEOF_BITFIELD   8
#define TYPEOF_SBIT       9
#define TYPEOF_SFR        10
#define TYPEOF_VOID       11
#define TYPEOF_STRUCT     12
#define TYPEOF_ARRAY      13
#define TYPEOF_FUNCTION   14
#define TYPEOF_POINTER    15
#define TYPEOF_FPOINTER   16
#define TYPEOF_CPOINTER   17
#define TYPEOF_GPOINTER   18
#define TYPEOF_PPOINTER   19
#define TYPEOF_IPOINTER   20
#define TYPEOF_EEPPOINTER 21

#endif

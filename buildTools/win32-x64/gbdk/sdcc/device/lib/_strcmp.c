/*-------------------------------------------------------------------------
  _strcmp.c - part of string library functions

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
#include "string.h" 
#include <sdcc-lib.h>

#if !_SDCC_PORT_PROVIDES_STRCMP

#define NULL (void *)0

int strcmp (
	char * asrc,
	char * adst
	)
{
#if _SDCC_Z80_STYLE_LIB_OPT
#pragma NOINDUCTION

	char ret = 0 ;
        char * src = asrc;
        char * dst = adst;

	while( ! (*src - *dst) && *dst)
		++src, ++dst;

	return *src - *dst;
#else
	register int ret = 0 ;

	while( ! (ret = *asrc - *adst) && *adst)
		++asrc, ++adst;

	if ( ret < 0 )
		ret = -1 ;
	else if ( ret > 0 )
		ret = 1 ;

	return( ret );
#endif
}

#endif


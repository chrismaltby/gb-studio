/*-------------------------------------------------------------------------

  _decdptr.c :-  decrement dptr by 1 

             Ecrit par -  Jean-Louis Vern jlvern@writeme.com (1999)

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

unsigned char _decdptr ()
{
#ifdef SDCC_ds390    
    	_asm
        orl dps, #0xc0
        inc dptr
        anl dps, #0x3f
        _endasm ;
#else
    	_asm
		xch	a,dpl
		jnz     00001$
		dec	dph
00001$:
		dec	a
		xch	a,dpl
	_endasm ;
#endif    
}

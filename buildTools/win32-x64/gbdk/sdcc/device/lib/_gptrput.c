/*-------------------------------------------------------------------------

  _gptrput.c :- put value for a generic pointer               

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

unsigned char _gptrput ()
{
    _asm
        xch      a,r0
	push     acc
	xch      a,r0
	push     acc
    ;
    ;   depending on the pointer type
    ;
        mov     a,b
	jz      00001$
        dec     a
        jz      00002$
        dec     a
        jz      00003$
        dec     a
        jz      00004$
	pop     acc
	sjmp    00005$
;
;       store into near space
;       
 00001$:
	pop     acc
	mov     r0,dpl
	mov     @r0,a
	sjmp    00005$

 00002$:
	pop     acc
	movx    @dptr,a
	sjmp    00005$

 00003$:
	pop     acc    ; do nothing
	sjmp    00005$

 00004$:
	pop     acc
	mov     r0,dpl
	movx    @r0,a
 00005$:       
	xch     a,r0
	pop     acc
	xch     a,r0
_endasm;
}

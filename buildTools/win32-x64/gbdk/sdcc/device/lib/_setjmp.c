/*-------------------------------------------------------------------------
  setjmp.c - source file for ANSI routines setjmp & longjmp 

             Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1998)

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
#include <8051.h>



int longjmp (unsigned char *bp, int rv)
{
    unsigned char lsp; 
    lsp = *(bp+2);
    *((unsigned char data *) lsp) = *bp++;
    *((unsigned char data *) lsp - 1) = *bp;
    SP = lsp;
    return rv;
}

int setjmp (unsigned char *bp)
{    
    /* registers would have been saved on the
       stack anyway so we need to save SP
       and the return address */     
    *bp++ = *((unsigned char data *) SP  );   
    *bp++ = *((unsigned char data *)SP - 1);    
    *bp   = SP;
    return 0;
}

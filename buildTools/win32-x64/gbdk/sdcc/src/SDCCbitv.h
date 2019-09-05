/*-----------------------------------------------------------------
    SDCCbitv.h - contains support routines for bitVectors

    Written By - Sandeep Dutta . sandeep.dutta@usa.net (1998)

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

/* #include "SDCCglobl.h" */
/* #include "SDCCsymt.h" */

#ifndef SDCCBITV_H
#define SDCCBITV_H

/* bitvector */
typedef struct bitVect
  {
    int size;
    int bSize;
    unsigned char *vect;
  }
bitVect;


extern int bitVectDefault;
/*-----------------------------------------------------------------*/
/*           Forward   definition    for   functions               */
/*-----------------------------------------------------------------*/
/* bitvector related functions */
bitVect *newBitVect (int);
bitVect *bitVectResize (bitVect *, int);
bitVect *bitVectSetBit (bitVect *, int);
void bitVectUnSetBit (bitVect *, int);
int bitVectBitValue (bitVect *, int);
bitVect *bitVectUnion (bitVect *, bitVect *);
bitVect *bitVectIntersect (bitVect *, bitVect *);
int bitVectBitsInCommon (bitVect *, bitVect *);
bitVect *bitVectCplAnd (bitVect *, bitVect *);
int bitVectEqual (bitVect *, bitVect *);
bitVect *bitVectCopy (bitVect *);
int bitVectIsZero (bitVect *);
int bitVectnBitsOn (bitVect *);
int bitVectFirstBit (bitVect *);
void bitVectDebugOn (bitVect *, FILE *);
#endif

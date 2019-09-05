/*-----------------------------------------------------------------
    SDCCbitv.c - contains support routines for bitvectors

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

#include "common.h"

#include "newalloc.h"

int bitVectDefault = 1024;

/* genernal note about a bitvectors:
   bit vectors are stored from left to right i.e.
   bit position 0 is the MS bit of the first byte
   this also means that bit positions must start from 0 */
/*-----------------------------------------------------------------*/
/* newBitVect - returns a new bitvector of size                    */
/*-----------------------------------------------------------------*/
bitVect *
newBitVect (int size)
{
  bitVect *bvp;
  int byteSize;

  bvp = Safe_calloc (1, sizeof (bitVect));

  bvp->size = size;
  bvp->bSize = byteSize = (size / 8) + 1;
  bvp->vect = Safe_calloc (1, byteSize);
  return bvp;
}

/*-----------------------------------------------------------------*/
/* bitVectResize - changes the size of a bit vector                */
/*-----------------------------------------------------------------*/
bitVect *
bitVectResize (bitVect * bvp, int size)
{
  int bSize = (size / 8) + 1;

  if (!bvp)
    return newBitVect (size);

  /* if we already have enough space */
  if (bvp->bSize >= bSize)
    {
      if (size > bvp->size)
	bvp->size = size;
      return bvp;
    }

  bvp->vect = Clear_realloc (bvp->vect, bvp->bSize, bSize);
  bvp->size = size;
  bvp->bSize = bSize;

  return bvp;
}

/*-----------------------------------------------------------------*/
/* bitVectSetBit - sets a given bit in the bit vector              */
/*-----------------------------------------------------------------*/
bitVect *
bitVectSetBit (bitVect * bvp, int pos)
{
  int byteSize;
  int offset;

  /* if set is null then allocate it */
  if (!bvp)
    bvp = newBitVect (bitVectDefault);	/* allocate for twice the size */

  if (bvp->size <= pos)
    bvp = bitVectResize (bvp, pos + 2);		/* conservatively resize */

  byteSize = pos / 8;
  offset = pos % 8;
  bvp->vect[byteSize] |= (((unsigned char) 1) <<
			  (7 - offset));
  return bvp;
}

/*-----------------------------------------------------------------*/
/* bitVectUnSetBit - unsets the value of a bit in a bitvector      */
/*-----------------------------------------------------------------*/
void 
bitVectUnSetBit (bitVect * bvp, int pos)
{
  int byteSize;
  int offset;

  if (!bvp)
    return;

  byteSize = pos / 8;
  if (bvp->bSize <= byteSize)
    return;

  offset = pos % 8;

  bvp->vect[byteSize] &= ~(((unsigned char) 1) <<
			   (7 - offset));
}

/*-----------------------------------------------------------------*/
/* bitVectBitValue - returns value value at bit position           */
/*-----------------------------------------------------------------*/
int 
bitVectBitValue (bitVect * bvp, int pos)
{
  int byteSize;
  int offset;

  if (!bvp)
    return 0;

  byteSize = pos / 8;

  if (bvp->bSize <= byteSize)
    return 0;

  offset = pos % 8;

  return ((bvp->vect[byteSize] >> (7 - offset)) & ((unsigned char) 1));

}

/*-----------------------------------------------------------------*/
/* bitVectUnion - unions two bitvectors                            */
/*-----------------------------------------------------------------*/
bitVect *
bitVectUnion (bitVect * bvp1, bitVect * bvp2)
{
  int i;
  bitVect *newBvp;
  unsigned int *pn, *p1, *p2;
  int nbits;

  /* if both null */
  if (!bvp1 && !bvp2)
    return NULL;

  /* if one of them null then return the other */
  if (!bvp1 && bvp2)
    return bitVectCopy (bvp2);

  if (bvp1 && !bvp2)
    return bitVectCopy (bvp1);

  /* if they are not the same size */
  /* make them the same size */
  if (bvp1->bSize < bvp2->bSize)
    bvp1 = bitVectResize (bvp1, bvp2->size);
  else if (bvp2->bSize < bvp1->bSize)
    bvp2 = bitVectResize (bvp2, bvp1->size);

  newBvp = newBitVect (bvp1->size);
  nbits = bvp1->bSize;
  i = 0;

  pn = (unsigned int *)newBvp->vect; 
  p1 = (unsigned int *)bvp1->vect;
  p2 = (unsigned int *)bvp2->vect;

  while ((nbits - i) >= sizeof(*pn))
    {
      *pn++ = *p1++ | *p2++;
      i += sizeof(*pn);
    }

  for (; i < nbits; i++)
    newBvp->vect[i] = bvp1->vect[i] | bvp2->vect[i];


  return newBvp;
}

/*-----------------------------------------------------------------*/
/* bitVectIntersect - intersect  two bitvectors                    */
/*-----------------------------------------------------------------*/
bitVect *
bitVectIntersect (bitVect * bvp1, bitVect * bvp2)
{
  int i;
  bitVect *newBvp;
  unsigned int *pn, *p1, *p2;
  int nbits;

  if (!bvp2 || !bvp1)
    return NULL;

  /* if they are not the same size */
  /* make them the same size */
  if (bvp1->bSize < bvp2->bSize)
    bvp1 = bitVectResize (bvp1, bvp2->bSize);
  else if (bvp2->size < bvp1->size)
    bvp2 = bitVectResize (bvp2, bvp1->size);

  newBvp = newBitVect (bvp1->size);
  nbits = bvp1->bSize;
  i = 0;

  pn = (unsigned int *)newBvp->vect; 
  p1 = (unsigned int *)bvp1->vect;
  p2 = (unsigned int *)bvp2->vect;

  while ((nbits - i) >= sizeof(*pn))
    {
      *pn++ = *p1++ & *p2++;
      i += sizeof(*pn);
    }

  for (; i < nbits; i++)
    newBvp->vect[i] = bvp1->vect[i] & bvp2->vect[i];

  return newBvp;
}

/*-----------------------------------------------------------------*/
/* bitVectBitsInCommon - special case of intersection determines   */
/*                       if the vectors have any common bits set   */
/*-----------------------------------------------------------------*/
int 
bitVectBitsInCommon (bitVect * bvp1, bitVect * bvp2)
{
  int i;
  int nbits;
  unsigned int *p1, *p2;

  if (!bvp1 || !bvp2)
    return 0;

  nbits = min (bvp1->bSize, bvp2->bSize);
  i = 0;

  p1 = (unsigned int *)bvp1->vect;
  p2 = (unsigned int *)bvp2->vect;

  while ((nbits-i) >= sizeof(*p1))
    {
      if (*p1 & *p2)
        return 1;
      p1++; p2++;
      i += sizeof(*p1);
    }

  for (; i < nbits; i++)
    if (bvp1->vect[i] & bvp2->vect[i])
      return 1;

  return 0;
}

/*-----------------------------------------------------------------*/
/* bitVectCplAnd - complement the second & and it with the first   */
/*-----------------------------------------------------------------*/
bitVect *
bitVectCplAnd (bitVect * bvp1, bitVect * bvp2)
{
  int i;
  unsigned int *p1, *p2;
  int nbits;

  if (!bvp2)
    return bvp1;

  if (!bvp1)
    return bvp1;

  /* if they are not the same size */
  /* make them the same size */
  if (bvp1->bSize < bvp2->bSize)
    bvp1 = bitVectResize (bvp1, bvp2->bSize);
  else if (bvp2->size < bvp1->size)
    bvp2 = bitVectResize (bvp2, bvp1->size);

  nbits = bvp1->bSize;
  i = 0;

  p1 = (unsigned int *)bvp1->vect;
  p2 = (unsigned int *)bvp2->vect;

  while ((nbits - i) >= sizeof(*p1))
    {
      *p1 = *p1 & (~*p2);
      p2++; p1++;
      i += sizeof(*p1);
    }

  for (; i < nbits; i++)
    bvp1->vect[i] = bvp1->vect[i] & (~bvp2->vect[i]);

  return bvp1;
}

/*-----------------------------------------------------------------*/
/* bitVectIsZero - bit vector has all bits turned off              */
/*-----------------------------------------------------------------*/
int 
bitVectIsZero (bitVect * bvp)
{
  int i;

  if (!bvp)
    return 1;

  for (i = 0; i < bvp->bSize; i++)
    if (bvp->vect[i] != 0)
      return 0;

  return 1;
}

/*-----------------------------------------------------------------*/
/* bitVectsEqual - returns 1 if the two bit vectors are equal      */
/*-----------------------------------------------------------------*/
int 
bitVectEqual (bitVect * bvp1, bitVect * bvp2)
{
  int i;

  if (!bvp1 || !bvp1)
    return 0;

  if (bvp1 == bvp2)
    return 1;

  if (bvp1->bSize != bvp2->bSize)
    return 0;

  for (i = 0; i < bvp1->bSize; i++)
    if (bvp1->vect[i] != bvp2->vect[i])
      return 0;

  return 1;
}

/*-----------------------------------------------------------------*/
/* bitVectCopy - creates a bitvector from another bit Vector       */
/*-----------------------------------------------------------------*/
bitVect *
bitVectCopy (bitVect * bvp)
{
  bitVect *newBvp;
  int i;

  if (!bvp)
    return NULL;

  newBvp = newBitVect (bvp->size);
  for (i = 0; i < bvp->bSize; i++)
    newBvp->vect[i] = bvp->vect[i];

  return newBvp;
}

/*-----------------------------------------------------------------*/
/* bitVectnBitsOn - returns the number of bits that are on         */
/*-----------------------------------------------------------------*/
int 
bitVectnBitsOn (bitVect * bvp)
{
  int i, j;
  unsigned char byte;
  int count = 0;
  unsigned int *p1;

  /* The bit vector is highest to lowest.  Interesting. */
  unsigned int mask[] = {
    0, 128, 128+64, 128+64+32, 128+64+32+16,
    128+64+32+16+8, 128+64+32+16+8+4, 128+64+32+16+8+4+2
  };

  if (!bvp)
    return 0;

  /* j is the number of bytes in the bitvect */
  j = (bvp->size+7) / 8;

  /* Fix up the highest bits in the top byte so that we can iterate over
     all of them. */
  if (bvp->size%8 != 0)
    {
      bvp->vect[j-1] &= mask[bvp->size&7];
    }

  /* Take care of things in machine word chunks if possible.  As we
     are only counting bits it does not matter which order they are
     counted in.
  */
  i = 0;
  p1 = (unsigned int *)bvp->vect;

  while ((j-i) >= sizeof(*p1))
    {
      unsigned int word = *p1++;
      while (word)
        {
          count++;
          word &= word-1;
        }
      i += sizeof(*p1);
    }

  /* Take care of the rest of the bitvect. */
  for (; i < j; i++)
    {
      byte = bvp->vect[i];
      while (byte)
        {
          count++;
          byte &= byte-1;
        }
    }
  return count;
}

/*-----------------------------------------------------------------*/
/* bitVectFirstBit - returns the key for the first bit that is on  */
/*-----------------------------------------------------------------*/
int 
bitVectFirstBit (bitVect * bvp)
{
  int i;

  if (!bvp)
    return -1;
  for (i = 0; i < bvp->size; i++)
    if (bitVectBitValue (bvp, i))
      return i;

  return -1;
}

/*-----------------------------------------------------------------*/
/* bitVectDebugOn - prints bits that are on                        */
/*-----------------------------------------------------------------*/
void 
bitVectDebugOn (bitVect * bvp, FILE * of)
{
  int i;

  if (of == NULL)
    of = stdout;
  if (!bvp)
    return;

  fprintf (of, "bitvector Size = %d bSize = %d\n", bvp->size, bvp->bSize);
  fprintf (of, "Bits on { ");
  for (i = 0; i < bvp->size; i++)
    {
      if (bitVectBitValue (bvp, i))
	fprintf (of, "(%d) ", i);
    }
  fprintf (of, "}\n");
}

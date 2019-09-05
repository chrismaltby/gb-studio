/*-------------------------------------------------------------------------

  SDCCBBlock.h - header file for Basic Blocks

             Written By -  Sandeep Dutta . sandeep.dutta@usa.net (1998)

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

#ifndef SDCCBBLOCK_H
#define SDCCBBLOCK_H 1

/* definition of a basic block */
typedef struct eBBlock
  {
    int dfnum;			/* depth first number */
    int bbnum;			/* index into array of numbers */
    int depth;			/* loop depth of this block */
    int fSeq;			/* sequence number of first iCode */
    int lSeq;			/* sequence number of the last iCode */
    unsigned int visited:1;	/* visitied flag      */
    unsigned int hasFcall:1;	/* has a function call */
    unsigned int noPath:1;	/* there is no path from _entry to this block */
    unsigned int isLastInLoop:1;	/* is the last block in a loop */
    symbol *entryLabel;		/* entry label */

    iCode *sch;			/* pointer to start of code chain */
    iCode *ech;			/* pointer to last of code chain  */

    struct eBBlock *preHeader;	/* preheader if this is a loop entry */
    struct region *partOfLoop;	/* pointer to the loop region this block is part of */

    /* control flow analysis */
    set *succList;		/* list eBBlocks which are successors  */
    bitVect *succVect;		/* bitVector of successors             */
    set *predList;		/* predecessors of this basic block    */
    bitVect *domVect;		/* list of nodes this is dominated by  */

    /* data flow analysis */
    set *inExprs;		/* in coming common expressions    */
    set *outExprs;		/* out going common expressions    */
    bitVect *inDefs;		/* in coming defintions            */
    bitVect *outDefs;		/* out going defintions            */
    bitVect *defSet;		/* symbols defined in block        */
    bitVect *ldefs;		/* local definitions only          */
    bitVect *usesDefs;		/* which definitions are used in this block */
    bitVect *ptrsSet;		/* pointers assigned values in the block */
    bitVect *inPtrsSet;		/* in coming pointers assigned values */
    bitVect *ndompset;		/* pointers set by non-dominating basic blocks */
    set *addrOf;		/* symbols for which addres has been taken in the block */
    bitVect *linds;		/* if loop exit this contains defNumbers
				   for the inductions */
  }
eBBlock;

typedef struct edge
  {

    eBBlock *from;		/* from basic block */
    eBBlock *to;		/* to Basic Block   */
  }
edge;

extern int eBBNum;
extern set *graphEdges;


DEFSETFUNC (printEntryLabel);
eBBlock *neweBBlock ();
edge *newEdge (eBBlock *, eBBlock *);
eBBlock *eBBWithEntryLabel (eBBlock **, symbol *, int);
DEFSETFUNC (ifFromIs);
set *edgesTo (eBBlock *);
void remiCodeFromeBBlock (eBBlock *, iCode *);
void addiCodeToeBBlock (eBBlock *, iCode *, iCode *);
eBBlock **iCodeBreakDown (iCode *, int *);
void replaceSymBySym (set *, operand *, operand *);
iCode *iCodeFromeBBlock (eBBlock **, int);
int otherPathsPresent (eBBlock **, eBBlock *);
void replaceLabel (eBBlock *, symbol *, symbol *);
void dumpEbbsToFileExt (int, eBBlock **, int);
void dumpLiveRanges (int, hTab * liveRanges);
void closeDumpFiles();

#endif

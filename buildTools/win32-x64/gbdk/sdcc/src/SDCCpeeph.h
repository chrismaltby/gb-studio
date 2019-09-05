/*-------------------------------------------------------------------------
  SDCCpeeph.h - Header file for The peep hole optimizer: for interpreting 
                the peep hole rules

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

#ifndef  SDCCPEEPH_H
#define SDCCPEEPH_H 1

#define MAX_PATTERN_LEN 128

typedef struct lineNode
  {
    char *line;
    unsigned int isInline:1;
    unsigned int isComment:1;
    unsigned int isDebug:1;
    struct lineNode *prev;
    struct lineNode *next;
  }
lineNode;

typedef struct peepRule
  {
    lineNode *match;
    lineNode *replace;
    unsigned int restart:1;
    char *cond;
    hTab *vars;
    struct peepRule *next;
  }
peepRule;

void printLine (lineNode *, FILE *);
lineNode *newLineNode (char *);
lineNode *connectLine (lineNode *, lineNode *);
void initPeepHole (void);
void peepHole (lineNode **);

#endif

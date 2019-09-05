/*-------------------------------------------------------------------------
  SDCCutil.c - Small utility functions.

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

#ifndef SDCCUTIL_H
#define SDCCUTIL_H

#include "SDCChasht.h"

/* PENDING: Hacks as I can't work autoconf */
#define BINDIR	PREFIX "/bin"

/** Given an array of name, value string pairs creates a new hash
    containing all of the pairs.
*/
hTab *populateStringHash(const char **pin);

/** Given an array of string pointers and another string, adds the
    string to the end of the list.  The end of the list is assumed to
    be the first NULL pointer.
*/
void addToList (const char **list, const char *str);

/** Given an array of string pointers returns a string containing all
    of the strings seperated by spaces.  The returned string is on the
    heap.  The join stops when a NULL pointer is hit.
*/
char *join(const char **pplist);

/** Given an array of string pointers, returns a string containing all
    of the strings seperated by spaces.  The returned string is on the
    heap.  n is the number of strings in the list.
*/
char *joinn(char **pplist, int n);

/** Returns the characters in the path p2 past the last matching characters in
    p1.  Processes in a host dependent way.  For example, on win32 the
    test is case insensitive and treats '/' and '\' as the same.
*/
char *getPathDifference (char *pinto, const char *p1, const char *p2);

/** Given a file with path information in the binary files directory,
    returns what PREFIX must be to get this path.  Used for discovery
    of where SDCC is installed.  Returns NULL if the path is
    impossible.
*/
char *getPrefixFromBinPath (const char *prel);

/** Returns true if the given path exists.
 */
bool pathExists (const char *ppath);

void setMainValue (const char *pname, const char *pvalue);

void populateMainValues (const char **ppin);

void buildCmdLine2 (char *pbuffer, const char *pcmd);

/** Returns true if sz starts with the string given in key.
 */
bool startsWith (const char *sz, const char *key);

/** Removes any newline characters from the string.  Not strictly the
    same as perl's chomp.
*/
void chomp (char *sz);

hTab *
getRuntimeVariables(void);

#endif


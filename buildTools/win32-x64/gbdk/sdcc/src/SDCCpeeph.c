/*-------------------------------------------------------------------------
  SDCCpeeph.c - The peep hole optimizer: for interpreting the
                peep hole rules

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

#include "common.h"

static peepRule *rootRules = NULL;
static peepRule *currRule = NULL;

#define HTAB_SIZE 53
typedef struct
  {
    char name[SDCC_NAME_MAX + 1];
    int refCount;
  }
labelHashEntry;

static hTab *labelHash = NULL;

static struct
{
  allocTrace values;
  allocTrace labels;
} _G;

static int hashSymbolName (const char *name);
static void buildLabelRefCountHash (lineNode * head);

static bool matchLine (char *, char *, hTab **);

#define FBYNAME(x) int x (hTab *vars, lineNode *currPl, lineNode *head, \
        const char *cmdLine)

#if !OPT_DISABLE_PIC
void  peepRules2pCode(peepRule *);
#endif

/*-----------------------------------------------------------------*/
/* pcDistance - afinds a label back ward or forward                */
/*-----------------------------------------------------------------*/
int 
pcDistance (lineNode * cpos, char *lbl, bool back)
{
  lineNode *pl = cpos;
  char buff[MAX_PATTERN_LEN];
  int dist = 0;

  sprintf (buff, "%s:", lbl);
  while (pl)
    {

      if (pl->line &&
	  *pl->line != ';' &&
	  pl->line[strlen (pl->line) - 1] != ':' &&
	  !pl->isDebug)

	dist++;

      if (strncmp (pl->line, buff, strlen (buff)) == 0)
	return dist;

      if (back)
	pl = pl->prev;
      else
	pl = pl->next;

    }
  return 0;
}

/*-----------------------------------------------------------------*/
/* flat24bitMode - will check to see if we are in flat24 mode      */
/*-----------------------------------------------------------------*/
FBYNAME (flat24bitMode)
{
  return (options.model == MODEL_FLAT24);
}

/*-----------------------------------------------------------------*/
/* labelInRange - will check to see if label %5 is within range    */
/*-----------------------------------------------------------------*/
FBYNAME (labelInRange)
{
  /* assumes that %5 pattern variable has the label name */
  char *lbl = hTabItemWithKey (vars, 5);
  int dist = 0;

  if (!lbl)
    return FALSE;

  /* if the previous two instructions are "ljmp"s then don't
     do it since it can be part of a jump table */
  if (currPl->prev && currPl->prev->prev &&
      strstr (currPl->prev->line, "ljmp") &&
      strstr (currPl->prev->prev->line, "ljmp"))
    return FALSE;

  /* calculate the label distance : the jump for reladdr can be
     +/- 127 bytes, here Iam assuming that an average 8051
     instruction is 2 bytes long, so if the label is more than
     63 intructions away, the label is considered out of range
     for a relative jump. we could get more precise this will
     suffice for now since it catches > 90% cases */
  dist = (pcDistance (currPl, lbl, TRUE) +
	  pcDistance (currPl, lbl, FALSE));

/*    if (!dist || dist > 45) has produced wrong sjmp */
  /* 07-Sep-2000 Michael Schmitt */
  /* FIX for Peephole 132 */
  /* switch with lots of case can lead to a sjmp with a distance */
  /* out of the range for sjmp */
  if (!dist || dist > 43)
    return FALSE;

  return TRUE;
}

/*-----------------------------------------------------------------*/
/* operandsNotSame - check if %1 & %2 are the same                 */
/*-----------------------------------------------------------------*/
FBYNAME (operandsNotSame)
{
  char *op1 = hTabItemWithKey (vars, 1);
  char *op2 = hTabItemWithKey (vars, 2);

  if (strcmp (op1, op2) == 0)
    return FALSE;
  else
    return TRUE;
}

/* labelRefCount:

 * takes two parameters: a variable (bound to a label name)
 * and an expected reference count.
 *
 * Returns TRUE if that label is defined and referenced exactly
 * the given number of times.
 */
FBYNAME (labelRefCount)
{
  int varNumber, expectedRefCount;
  bool rc = FALSE;

  /* If we don't have the label hash table yet, build it. */
  if (!labelHash)
    {
      buildLabelRefCountHash (head);
    }

  if (sscanf (cmdLine, "%*[ \t%]%d %d", &varNumber, &expectedRefCount) == 2)
    {
      char *label = hTabItemWithKey (vars, varNumber);

      if (label)
	{
	  labelHashEntry *entry;

	  entry = hTabFirstItemWK (labelHash, hashSymbolName (label));

	  while (entry)
	    {
	      if (!strcmp (label, entry->name))
		{
		  break;
		}
	      entry = hTabNextItemWK (labelHash);
	    }
	  if (entry)
	    {
#if 0
	      /* debug spew. */
	      fprintf (stderr, "labelRefCount: %s has refCount %d, want %d\n",
		       label, entry->refCount, expectedRefCount);
#endif

	      rc = (expectedRefCount == entry->refCount);
	    }
	  else
	    {
	      fprintf (stderr, "*** internal error: no label has entry for"
		       " %s in labelRefCount peephole.\n",
		       label);
	    }
	}
      else
	{
	  fprintf (stderr, "*** internal error: var %d not bound"
		   " in peephole labelRefCount rule.\n",
		   varNumber);
	}

    }
  else
    {
      fprintf (stderr,
	       "*** internal error: labelRefCount peephole restriction"
	       " malformed: %s\n", cmdLine);
    }
  return rc;
}

/*-----------------------------------------------------------------*/
/* callFuncByName - calls a function as defined in the table       */
/*-----------------------------------------------------------------*/
int 
callFuncByName (char *fname,
		hTab * vars,
		lineNode * currPl,
		lineNode * head)
{
  struct ftab
  {
    char *fname;
    int (*func) (hTab *, lineNode *, lineNode *, const char *);
  }
  ftab[] =
  {
    {
      "labelInRange", labelInRange
    }
    ,
    {
      "operandsNotSame", operandsNotSame
    }
    ,
    {
      "24bitMode", flat24bitMode
    }
    ,
    {
      "labelRefCount", labelRefCount
    }
    ,
  };
  int i;

  for (i = 0; i < ((sizeof (ftab)) / (sizeof (struct ftab))); i++)
    if (strncmp (ftab[i].fname, fname, strlen (ftab[i].fname)) == 0)
      {
	return (*ftab[i].func) (vars, currPl, head,
				fname + strlen (ftab[i].fname));
      }
  fprintf (stderr, "could not find named function in function table\n");
  return TRUE;
}

/*-----------------------------------------------------------------*/
/* printLine - prints a line chain into a given file               */
/*-----------------------------------------------------------------*/
void 
printLine (lineNode * head, FILE * of)
{
  if (!of)
    of = stdout;

  while (head)
    {
      /* don't indent comments & labels */
      if (head->line &&
	  (*head->line == ';' ||
	   head->line[strlen (head->line) - 1] == ':')) {
	fprintf (of, "%s\n", head->line);
      } else {
	if (head->isInline && *head->line=='#') {
	  // comment out preprocessor directives in inline asm
	  fprintf (of, ";");
	}
	fprintf (of, "\t%s\n", head->line);
      }
      head = head->next;
    }
}

/*-----------------------------------------------------------------*/
/* newPeepRule - creates a new peeprule and attach it to the root  */
/*-----------------------------------------------------------------*/
peepRule *
newPeepRule (lineNode * match,
	     lineNode * replace,
	     char *cond,
	     int restart)
{
  peepRule *pr;

  pr = Safe_alloc ( sizeof (peepRule));
  pr->match = match;
  pr->replace = replace;
  pr->restart = restart;

  if (cond && *cond)
    {
      pr->cond = Safe_alloc ( strlen (cond) + 1);
      strcpy (pr->cond, cond);
    }
  else
    pr->cond = NULL;

  pr->vars = newHashTable (100);

  /* if root is empty */
  if (!rootRules)
    rootRules = currRule = pr;
  else
    currRule = currRule->next = pr;

  return pr;
}

/*-----------------------------------------------------------------*/
/* newLineNode - creates a new peep line                           */
/*-----------------------------------------------------------------*/
lineNode *
newLineNode (char *line)
{
  lineNode *pl;

  pl = Safe_alloc ( sizeof (lineNode));
  pl->line = Safe_alloc ( strlen (line) + 1);
  strcpy (pl->line, line);
  return pl;
}

/*-----------------------------------------------------------------*/
/* connectLine - connects two lines                                */
/*-----------------------------------------------------------------*/
lineNode *
connectLine (lineNode * pl1, lineNode * pl2)
{
  if (!pl1 || !pl2)
    {
      fprintf (stderr, "trying to connect null line\n");
      return NULL;
    }

  pl2->prev = pl1;
  pl1->next = pl2;

  return pl2;
}

#define SKIP_SPACE(x,y) { while (*x && (isspace(*x) || *x == '\n')) x++; \
                         if (!*x) { fprintf(stderr,y); return ; } }

#define EXPECT_STR(x,y,z) { while (*x && strncmp(x,y,strlen(y))) x++ ;   \
                           if (!*x) { fprintf(stderr,z); return ; } }
#define EXPECT_CHR(x,y,z) { while (*x && *x != y) x++ ;   \
                           if (!*x) { fprintf(stderr,z); return ; } }

/*-----------------------------------------------------------------*/
/* getPeepLine - parses the peep lines                             */
/*-----------------------------------------------------------------*/
static void 
getPeepLine (lineNode ** head, char **bpp)
{
  char lines[MAX_PATTERN_LEN];
  char *lp;

  lineNode *currL = NULL;
  char *bp = *bpp;
  while (1)
    {

      if (!*bp)
	{
	  fprintf (stderr, "unexpected end of match pattern\n");
	  return;
	}

      if (*bp == '\n')
	{
	  bp++;
	  while (isspace (*bp) ||
		 *bp == '\n')
	    bp++;
	}

      if (*bp == '}')
	{
	  bp++;
	  break;
	}

      /* read till end of line */
      lp = lines;
      while ((*bp != '\n' && *bp != '}') && *bp)
	*lp++ = *bp++;

      *lp = '\0';
      if (!currL)
	*head = currL = newLineNode (lines);
      else
	currL = connectLine (currL, newLineNode (lines));
    }

  *bpp = bp;
}

/*-----------------------------------------------------------------*/
/* readRules - reads the rules from a string buffer                */
/*-----------------------------------------------------------------*/
static void 
readRules (char *bp)
{
  char restart = 0;
  char lines[MAX_PATTERN_LEN];
  char *lp;
  lineNode *match;
  lineNode *replace;
  lineNode *currL = NULL;

  if (!bp)
    return;
top:
  restart = 0;
  /* look for the token "replace" that is the
     start of a rule */
  while (*bp && strncmp (bp, "replace", 7))
    bp++;

  /* if not found */
  if (!*bp)
    return;

  /* then look for either "restart" or '{' */
  while (strncmp (bp, "restart", 7) &&
	 *bp != '{' && bp)
    bp++;

  /* not found */
  if (!*bp)
    {
      fprintf (stderr, "expected 'restart' or '{'\n");
      return;
    }

  /* if brace */
  if (*bp == '{')
    bp++;
  else
    {				/* must be restart */
      restart++;
      bp += strlen ("restart");
      /* look for '{' */
      EXPECT_CHR (bp, '{', "expected '{'\n");
      bp++;
    }

  /* skip thru all the blank space */
  SKIP_SPACE (bp, "unexpected end of rule\n");

  match = replace = currL = NULL;
  /* we are the start of a rule */
  getPeepLine (&match, &bp);

  /* now look for by */
  EXPECT_STR (bp, "by", "expected 'by'\n");

  /* then look for a '{' */
  EXPECT_CHR (bp, '{', "expected '{'\n");
  bp++;

  SKIP_SPACE (bp, "unexpected end of rule\n");
  getPeepLine (&replace, &bp);

  /* look for a 'if' */
  while ((isspace (*bp) || *bp == '\n') && *bp)
    bp++;

  if (strncmp (bp, "if", 2) == 0)
    {
      bp += 2;
      while ((isspace (*bp) || *bp == '\n') && *bp)
	bp++;
      if (!*bp)
	{
	  fprintf (stderr, "expected condition name\n");
	  return;
	}

      /* look for the condition */
      lp = lines;
      while (*bp && (*bp != '\n'))
	{
	  *lp++ = *bp++;
	}
      *lp = '\0';

      newPeepRule (match, replace, lines, restart);
    }
  else
    newPeepRule (match, replace, NULL, restart);
  goto top;

}

/*-----------------------------------------------------------------*/
/* keyForVar - returns the numeric key for a var                   */
/*-----------------------------------------------------------------*/
static int 
keyForVar (char *d)
{
  int i = 0;

  while (isdigit (*d))
    {
      i *= 10;
      i += (*d++ - '0');
    }

  return i;
}

/*-----------------------------------------------------------------*/
/* bindVar - binds a value to a variable in the given hashtable    */
/*-----------------------------------------------------------------*/
static void 
bindVar (int key, char **s, hTab ** vtab)
{
  char vval[MAX_PATTERN_LEN];
  char *vvx;
  char *vv = vval;

  /* first get the value of the variable */
  vvx = *s;
  /* the value is ended by a ',' or space or newline or null or ) */
  while (*vvx &&
	 *vvx != ',' &&
	 !isspace (*vvx) &&
	 *vvx != '\n' &&
	 *vvx != ':' &&
	 *vvx != ')')
    {
      char ubb = 0;
      /* if we find a '(' then we need to balance it */
      if (*vvx == '(')
	{
	  ubb++;
	  while (ubb)
	    {
	      *vv++ = *vvx++;
	      if (*vvx == '(')
		ubb++;
	      if (*vvx == ')')
		ubb--;
	    }
	}
      else
	*vv++ = *vvx++;
    }
  *s = vvx;
  *vv = '\0';
  /* got value */
  vvx = traceAlloc (&_G.values, Safe_alloc(strlen (vval) + 1));
  strcpy (vvx, vval);

  hTabAddItem (vtab, key, vvx);
}

/*-----------------------------------------------------------------*/
/* matchLine - matches one line                                    */
/*-----------------------------------------------------------------*/
static bool 
matchLine (char *s, char *d, hTab ** vars)
{

  if (!s || !(*s))
    return FALSE;

  while (*s && *d)
    {

      /* skip white space in both */
      while (isspace (*s))
	s++;
      while (isspace (*d))
	d++;

      /* if the destination is a var */
      if (*d == '%' && isdigit (*(d + 1)))
	{
	  char *v = hTabItemWithKey (*vars, keyForVar (d + 1));
	  /* if the variable is already bound
	     then it MUST match with dest */
	  if (v)
	    {
	      while (*v)
		if (*v++ != *s++)
		  return FALSE;
	    }
	  else
	    /* variable not bound we need to
	       bind it */
	    bindVar (keyForVar (d + 1), &s, vars);

	  /* in either case go past the variable */
	  d++;
	  while (isdigit (*d))
	    d++;
	}

      /* they should be an exact match other wise */
      if (*s && *d)
	{
	  while (isspace (*s))
	    s++;
	  while (isspace (*d))
	    d++;
	  if (*s++ != *d++)
	    return FALSE;
	}

    }

  /* get rid of the trailing spaces
     in both source & destination */
  if (*s)
    while (isspace (*s))
      s++;

  if (*d)
    while (isspace (*d))
      d++;

  /* after all this if only one of them
     has something left over then no match */
  if (*s || *d)
    return FALSE;

  return TRUE;
}

/*-----------------------------------------------------------------*/
/* matchRule - matches a all the rule lines                        */
/*-----------------------------------------------------------------*/
static bool 
matchRule (lineNode * pl,
	   lineNode ** mtail,
	   peepRule * pr,
	   lineNode * head)
{
  lineNode *spl;		/* source pl */
  lineNode *rpl;		/* rule peep line */

/*     setToNull((void **) &pr->vars);    */
/*     pr->vars = newHashTable(100); */

  /* for all the lines defined in the rule */
  rpl = pr->match;
  spl = pl;
  while (spl && rpl)
    {

      /* if the source line starts with a ';' then
         comment line don't process or the source line
         contains == . debugger information skip it */
      if (spl->line &&
	  (*spl->line == ';' || spl->isDebug))
	{
	  spl = spl->next;
	  continue;
	}

      if (!matchLine (spl->line, rpl->line, &pr->vars))
	return FALSE;

      rpl = rpl->next;
      if (rpl)
	spl = spl->next;
    }

  /* if rules ended */
  if (!rpl)
    {
      /* if this rule has additional conditions */
      if (pr->cond)
	{
	  if (callFuncByName (pr->cond, pr->vars, pl, head))
	    {
	      *mtail = spl;
	      return TRUE;
	    }
	  else
	    return FALSE;
	}
      else
	{
	  *mtail = spl;
	  return TRUE;
	}
    }
  else
    return FALSE;
}

/*-----------------------------------------------------------------*/
/* replaceRule - does replacement of a matching pattern            */
/*-----------------------------------------------------------------*/
static void 
replaceRule (lineNode ** shead, lineNode * stail, peepRule * pr)
{
  lineNode *cl = NULL;
  lineNode *pl = NULL, *lhead = NULL;
  /* a long function name and long variable name can evaluate to
     4x max pattern length e.g. "mov dptr,((fie_var>>8)<<8)+fie_var" */
  char lb[MAX_PATTERN_LEN*4];
  char *lbp;
  lineNode *comment = NULL;

  /* collect all the comment lines in the source */
  for (cl = *shead; cl != stail; cl = cl->next)
    {
      if (cl->line && (*cl->line == ';' || cl->isDebug))
	{
	  pl = (pl ? connectLine (pl, newLineNode (cl->line)) :
		(comment = newLineNode (cl->line)));
	  pl->isDebug = cl->isDebug;
	}
    }
  cl = NULL;

  /* for all the lines in the replacement pattern do */
  for (pl = pr->replace; pl; pl = pl->next)
    {
      char *v;
      char *l;
      lbp = lb;

      l = pl->line;

      while (*l)
	{
	  /* if the line contains a variable */
	  if (*l == '%' && isdigit (*(l + 1)))
	    {
	      v = hTabItemWithKey (pr->vars, keyForVar (l + 1));
	      if (!v)
		{
		  fprintf (stderr, "used unbound variable in replacement\n");
		  l++;
		  continue;
		}
	      while (*v) {
		*lbp++ = *v++;
	      }
	      l++;
	      while (isdigit (*l)) {
		l++;
	      }
	      continue;
	    }
	  *lbp++ = *l++;
	}

      *lbp = '\0';
      if (cl)
	cl = connectLine (cl, newLineNode (lb));
      else
	lhead = cl = newLineNode (lb);
    }

  /* add the comments if any to the head of list */
  if (comment)
    {
      lineNode *lc = comment;
      while (lc->next)
	lc = lc->next;
      lc->next = lhead;
      if (lhead)
	lhead->prev = lc;
      lhead = comment;
    }

  /* now we need to connect / replace the original chain */
  /* if there is a prev then change it */
  if ((*shead)->prev)
    {
      (*shead)->prev->next = lhead;
      lhead->prev = (*shead)->prev;
    }
  else
    *shead = lhead;
  /* now for the tail */
  if (stail && stail->next)
    {
      stail->next->prev = cl;
      if (cl)
	cl->next = stail->next;
    }
}

/* Returns TRUE if this line is a label definition.

 * If so, start will point to the start of the label name,
 * and len will be it's length.
 */
bool 
isLabelDefinition (const char *line, const char **start, int *len)
{
  const char *cp = line;

  /* This line is a label if if consists of:
   * [optional whitespace] followed by identifier chars
   * (alnum | $ | _ ) followed by a colon.
   */

  while (*cp && isspace (*cp))
    {
      cp++;
    }

  if (!*cp)
    {
      return FALSE;
    }

  *start = cp;

  while (isalnum (*cp) || (*cp == '$') || (*cp == '_'))
    {
      cp++;
    }

  if ((cp == *start) || (*cp != ':'))
    {
      return FALSE;
    }

  *len = (cp - (*start));
  return TRUE;
}

/* Quick & dirty string hash function. */
static int 
hashSymbolName (const char *name)
{
  int hash = 0;

  while (*name)
    {
      hash = (hash << 6) ^ *name;
      name++;
    }

  if (hash < 0)
    {
      hash = -hash;
    }

  return hash % HTAB_SIZE;
}

/* Build a hash of all labels in the passed set of lines
 * and how many times they are referenced.
 */
static void 
buildLabelRefCountHash (lineNode * head)
{
  lineNode *line;
  const char *label;
  int labelLen;
  int i;

  assert (labelHash == NULL);
  labelHash = newHashTable (HTAB_SIZE);

  /* First pass: locate all the labels. */
  line = head;

  while (line)
    {
      if (isLabelDefinition (line->line, &label, &labelLen)
	  && labelLen <= SDCC_NAME_MAX)
	{
	  labelHashEntry *entry;

	  entry = traceAlloc (&_G.labels, Safe_alloc(sizeof (labelHashEntry)));

	  memcpy (entry->name, label, labelLen);
	  entry->name[labelLen] = 0;
	  entry->refCount = -1;

	  hTabAddItem (&labelHash, hashSymbolName (entry->name), entry);
	}
      line = line->next;
    }


  /* Second pass: for each line, note all the referenced labels. */
  /* This is ugly, O(N^2) stuff. Optimizations welcome... */
  line = head;
  while (line)
    {
      for (i = 0; i < HTAB_SIZE; i++)
	{
	  labelHashEntry *thisEntry;

	  thisEntry = hTabFirstItemWK (labelHash, i);

	  while (thisEntry)
	    {
	      if (strstr (line->line, thisEntry->name))
		{
		  thisEntry->refCount++;
		}
	      thisEntry = hTabNextItemWK (labelHash);
	    }
	}
      line = line->next;
    }

#if 0
  /* Spew the contents of the table. Debugging fun only. */
  for (i = 0; i < HTAB_SIZE; i++)
    {
      labelHashEntry *thisEntry;

      thisEntry = hTabFirstItemWK (labelHash, i);

      while (thisEntry)
	{
	  fprintf (stderr, "label: %s ref %d\n",
		   thisEntry->name, thisEntry->refCount);
	  thisEntry = hTabNextItemWK (labelHash);
	}
    }
#endif
}

/* How does this work?
   peepHole
    For each rule,
     For each line,
      Try to match
      If it matches,
       replace and restart.

    matchRule
     matchLine

  Where is stuff allocated?
  
*/

/*-----------------------------------------------------------------*/
/* peepHole - matches & substitutes rules                          */
/*-----------------------------------------------------------------*/
void 
peepHole (lineNode ** pls)
{
  lineNode *spl;
  peepRule *pr;
  lineNode *mtail = NULL;
  bool restart;

  assert(labelHash == NULL);

  do
    {
      restart = FALSE;

      /* for all rules */
      for (pr = rootRules; pr; pr = pr->next)
        {
          for (spl = *pls; spl; spl = spl->next)
            {
              /* if inline assembler then no peep hole */
              if (spl->isInline)
                continue;
              
              mtail = NULL;

              /* Tidy up any data stored in the hTab */
              
              /* if it matches */
              if (matchRule (spl, &mtail, pr, *pls))
                {
                  
                  /* then replace */
                  if (spl == *pls)
                    replaceRule (pls, mtail, pr);
                  else
                    replaceRule (&spl, mtail, pr);
                  
                  /* if restart rule type then
                     start at the top again */
                  if (pr->restart)
                    {
                      restart = TRUE;
                    }
                }
              
              if (pr->vars)
                {
                  hTabDeleteAll (pr->vars);
                  Safe_free (pr->vars);
                  pr->vars = NULL;
                }
              
              freeTrace (&_G.values);
            }
        }
    } while (restart == TRUE);

  if (labelHash)
    {
      hTabDeleteAll (labelHash);
      freeTrace (&_G.labels);
    }
  labelHash = NULL;
}


/*-----------------------------------------------------------------*/
/* readFileIntoBuffer - reads a file into a string buffer          */
/*-----------------------------------------------------------------*/
static char *
readFileIntoBuffer (char *fname)
{
  FILE *f;
  char *rs = NULL;
  int nch = 0;
  int ch;
  char lb[MAX_PATTERN_LEN];

  if (!(f = fopen (fname, "r")))
    {
      fprintf (stderr, "cannot open peep rule file\n");
      return NULL;
    }

  while ((ch = fgetc (f)) != EOF)
    {
      lb[nch++] = ch;

      /* if we maxed out our local buffer */
      if (nch >= (MAX_PATTERN_LEN - 2))
	{
	  lb[nch] = '\0';
	  /* copy it into allocated buffer */
	  if (rs)
	    {
	      rs = Safe_realloc (rs, strlen (rs) + strlen (lb) + 1);
	      strcat (rs, lb);
	    }
	  else
	    {
	      rs = Safe_alloc ( strlen (lb) + 1);
	      strcpy (rs, lb);
	    }
	  nch = 0;
	}
    }

  /* if some charaters left over */
  if (nch)
    {
      lb[nch] = '\0';
      /* copy it into allocated buffer */
      if (rs)
	{
	  rs = Safe_realloc (rs, strlen (rs) + strlen (lb) + 1);
	  strcat (rs, lb);
	}
      else
	{
	  rs = Safe_alloc ( strlen (lb) + 1);
	  strcpy (rs, lb);
	}
    }
  return rs;
}

/*-----------------------------------------------------------------*/
/* initPeepHole - initialises the peep hole optimizer stuff        */
/*-----------------------------------------------------------------*/
void 
initPeepHole ()
{
  char *s;

  /* read in the default rules */
  readRules (port->peep.default_rules);

  /* if we have any additional file read it too */
  if (options.peep_file)
    {
      readRules (s = readFileIntoBuffer (options.peep_file));
      setToNull ((void **) &s);
    }


#if !OPT_DISABLE_PIC
  /* Convert the peep rules into pcode.
     NOTE: this is only support in the PIC port (at the moment)
  */
  if (TARGET_IS_PIC) {
    peepRules2pCode(rootRules);
  }
#endif

}

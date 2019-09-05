/*-------------------------------------------------------------------------
  symtab.c - Header file for symbol table for sdcdb ( debugger )
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

#include "sdcdb.h"
#include "symtab.h"
#include "newalloc.h"

extern char *currModName ;
structdef *structWithName (char *);

/*------------------------------------------------------------------*/
/* getSize - returns size of a type chain in bits                   */
/*------------------------------------------------------------------*/
unsigned int   getSize ( link *p )
{
    /* if nothing return 0 */
    if ( ! p )
  return 0 ;

    if ( IS_SPEC(p) ) { /* if this is the specifier then */

  switch (SPEC_NOUN(p)) { /* depending on the specifier type */
  case V_INT:
      return (IS_LONG(p) ? LONGSIZE : ( IS_SHORT(p) ? SHORTSIZE: INTSIZE)) ;
  case V_FLOAT:
      return FLOATSIZE ;
  case V_CHAR:
      return   CHARSIZE ;
  case V_VOID:
      return   0 ;
  case V_STRUCT:
      return   SPEC_STRUCT(p)->size ;
  case V_LABEL:
      return 0 ;
  case V_SBIT:
      return BITSIZE ;
  case V_BIT:
      return ((SPEC_BLEN(p) / 8) + (SPEC_BLEN(p) % 8 ? 1 : 0)) ;
  default  :
      return 0 ;
  }
    }

    /* this is a specifier  */
    switch (DCL_TYPE(p))  {
    case FUNCTION:
  return 2;
    case ARRAY:
  return DCL_ELEM(p) * getSize (p->next) ;
    case IPOINTER:
    case PPOINTER:
    case POINTER:
  return ( PTRSIZE ) ;
    case FPOINTER:
    case CPOINTER:
  return ( FPTRSIZE );
    case GPOINTER:
  return ( GPTRSIZE );

    default     :
  return  0 ;
    }
}


/*-----------------------------------------------------------------*/
/* parseFunc - creates a function record entry                     */
/*-----------------------------------------------------------------*/
void parseFunc (char *line)
{
    function *func ;
    char *rs;
    int i;
    func = Safe_calloc(1,sizeof(function));
    func->sym = parseSymbol(line,&rs);
    func->sym->isfunc = 1;
    func->modName = currModName ;
    while(*rs != ',') rs++;
    rs++;
    sscanf(rs,"%d,%d,%d",&i,
     &(SPEC_INTN(func->sym->etype)),
     &(SPEC_BANK(func->sym->etype)));
    SPEC_INTRTN(func->sym->etype) = i;
    addSet(&functions,func);
}

/*-----------------------------------------------------------------*/
/* parseTypeInfo - parse the type info of a symbol expects the type*/
/*                 info to be of the form                          */
/*                 ({<size>}<type info chain)                      */
/*-----------------------------------------------------------------*/
static char  *parseTypeInfo (symbol *sym, char *s)
{
    char *bp;

    s += 2; /* go past the ({ */
    /* get the size */
    sym->size = strtol (s,&bp,10);
    /* bp now points to '}' ... go past it */
    s = ++bp;
    while (*s != ')') { /* till we reach the end */
  link *type;
  type = Safe_calloc(1,sizeof(link));
  if (*s == ',') s++;

  /* is a declarator */
  if (*s == 'D') {
      s++;
      switch (*s) {
      case 'F':
    DCL_TYPE(type) = FUNCTION;
    s++;
    break;
      case 'G':
    DCL_TYPE(type) = GPOINTER;
    s++;
    break;
      case 'C':
    DCL_TYPE(type) = CPOINTER;
    s++;
    break;
      case 'X':
    DCL_TYPE(type) = FPOINTER;
    s++;
    break;
      case 'D':
    DCL_TYPE(type) = POINTER;
    s++;
    break;
      case 'I':
    DCL_TYPE(type) = IPOINTER;
    s++;
    break;
      case 'P':
    DCL_TYPE(type) = PPOINTER;
    s++;
    break;
      case 'A':
    s++;
    DCL_TYPE(type) = ARRAY ;
    DCL_ELEM(type) = strtol(s,&s,10);
    break;
      }
  } else {
      /* is a specifier */
      type->class = SPECIFIER ;
      s++;
      switch (*s) {
      case 'L':
    SPEC_NOUN(type) = V_INT;
    SPEC_LONG(type) = 1;
    s++;
    break;
      case 'I':
    SPEC_NOUN(type) = V_INT;
    s++;
    break;
      case 'S':
      case 'C':
    SPEC_NOUN(type) = V_CHAR ;
    s++;
    break;
      case 'V':
    SPEC_NOUN(type) = V_VOID;
    s++;
    break;
      case 'F':
    SPEC_NOUN(type) = V_FLOAT;
    s++;
    break;
      case 'T':
    s++;
    SPEC_NOUN(type) = V_STRUCT;
    {
        char *ss = strtok(strdup(s),",):");

        SPEC_STRUCT(type) = structWithName(ss);
        free(ss);
    }
    break;
      case 'X':
    s++;
    SPEC_NOUN(type) = V_SBIT;
    break;
      case 'B':
    SPEC_NOUN(type) = V_BIT;
    s++;
    SPEC_BSTR(type) = strtol(s,&s,10);
    s++;
    SPEC_BLEN(type) = strtol(s,&s,10);
    break;
      }
      while (*s != ':') s++;
      s++;
      if (*s++ == 'S')
    SPEC_USIGN(type) = 0;
      else
    SPEC_USIGN(type) = 1;

  }

  /* add the type to the symbol's type chain */
  if (sym->type)
      sym->etype = sym->etype->next = type;
  else
      sym->type = sym->etype = type;
    }

    return ++s;

}

/*-----------------------------------------------------------------*/
/* symFromRec - parse a symbol record and extract and create a sym */
/*              expects the input string to be of the form         */
/*              {G|F<filename>|L<functionName>}'$'<name>'$'<level> */
/*              '$'<block><type info>                              */
/*-----------------------------------------------------------------*/
symbol *parseSymbol (char *s, char **rs)
{
    symbol *nsym ;
    char *bp = s;

    nsym = Safe_calloc(1,sizeof(symbol));

    /* copy over the mangled name */
    while (*bp != '(') bp++;
     bp -= 1;
    nsym->rname = alloccpy(s,bp - s);

    /* if this is a Global Symbol */
    nsym->scopetype = *s;
    s++ ;
    if (nsym->scopetype != 'G') {
  /* get the function name it is local to */
  bp = s;
  while (*s != '$') s++;
  nsym->sname = alloccpy(bp,s - bp);
    }

    /* next get the name */
    bp = ++s;
    while ( *s != '$' ) s++;
    nsym->name = alloccpy(bp,s - bp);

    s++;
    /* get the level number */
    nsym->level = strtol (s,&bp,10);
    s = ++bp;
    /* skip the '$' & get the block number */
    nsym->block = strtol (s,&bp,10);

    s = parseTypeInfo(nsym,bp);

    /* get the address space after going past the comma */
    s++;
    nsym->addrspace =*s;

    s+= 2;
    nsym->isonstack = strtol(s,&s,10);
    /* get the stack offset */
    s++;
    nsym->offset = strtol(s,&s,10);
    *rs = s;

    addSet(&symbols,nsym);

    return nsym;
}


/*-----------------------------------------------------------------*/
/* parseStruct - parses a structure record expected in format      */
/*         {F<filename>}$<tag>[()()()...]                          */
/*-----------------------------------------------------------------*/
structdef *parseStruct (char *s)
{
    structdef *nsdef ;
    char *bp;
    char *name;
    symbol *fields = NULL;

    while (*s != '$') s++;

    bp =++s;
    while (*s != '[') s++ ;
    name = alloccpy(bp,s - bp);
    nsdef = structWithName(name);
    nsdef->fields = NULL;
    s++;
    while (*s && *s != ']') {
  int offset ;
  symbol *sym ;
  while (!isdigit(*s)) s++;
  offset = strtol(s,&s,10);
  while (*s != ':') s++;
  s++;
  sym = parseSymbol(s,&s);
  sym->offset = offset ;
  s += 3;
  if (!fields)
      fields = nsdef->fields = sym;
  else
      fields = fields->next = sym;

    }

    return nsdef;
}

/*-----------------------------------------------------------------*/
/* parseModule - creates a module with a given name                */
/*-----------------------------------------------------------------*/
module *parseModule (char *s, bool createName )
{
    module *nmod ;
    char buffer[512];

    nmod = Safe_calloc(1,sizeof(module));

    addSet (&modules,nmod);


    /* create copy file name */
    nmod->name = s;

    if (createName) {
  sprintf(buffer,"%s.c",s);

  nmod->c_name = Safe_malloc(strlen(buffer)+1);
  strcpy(nmod->c_name,buffer);

  sprintf(buffer,"%s.asm",s);
  nmod->asm_name = Safe_malloc(strlen(buffer)+1);
  strcpy(nmod->asm_name,buffer);
    }

    return nmod;
}

/*-----------------------------------------------------------------*/
/* moduleWithName - finds and returns a module with a given name   */
/*-----------------------------------------------------------------*/
DEFSETFUNC(moduleWithName)
{
    module *mod = item;
    V_ARG(char *,s);
    V_ARG(module **,rmod);

    if (*rmod)
  return 0;

    if (strcmp(mod->name,s) == 0) {
  *rmod = mod ;
  return 1;
    }

    return 0;
}

/*-----------------------------------------------------------------*/
/* moduleWithCName - finds and returns a module with a given c_name*/
/*-----------------------------------------------------------------*/
DEFSETFUNC(moduleWithCName)
{
    module *mod = item;
    V_ARG(char *,s);
    V_ARG(module **,rmod);

    if (*rmod)
  return 0;
    if (strcmp(mod->c_name,s) == 0) {
  *rmod = mod;
  return 1;
    }

    return 0;
}

/*-----------------------------------------------------------------*/
/* moduleWithAsmName - finds & returns a module with given asm_name*/
/*-----------------------------------------------------------------*/
DEFSETFUNC(moduleWithAsmName)
{
    module *mod = item;
    V_ARG(char *,s);
    V_ARG(module **,rmod);

    if (*rmod)
  return 0;
    if (strcmp(mod->asm_name,s) == 0) {
  *rmod = mod;
  return 1;
    }

    return 0;
}


/*-----------------------------------------------------------------*/
/* structWithName - returns a structure with a given name          */
/*-----------------------------------------------------------------*/
structdef *structWithName (char *s)
{
    int i;
    structdef *nsdef ;

    /* go thru the struct table looking for a match */
    for ( i = 0 ; i < nStructs ; i++ ) {

  if (strcmp(currModName,structs[i]->sname) == 0 &&
      strcmp(s,structs[i]->tag) == 0)
      return structs[i];
    }

    nsdef = Safe_calloc(1,sizeof(structdef));
    nsdef->tag = alloccpy(s,strlen(s));
    nsdef->sname = currModName ;

    nStructs++;
    structs = (struct structdef **)resize((void **)structs,nStructs);
    structs[nStructs-1] = nsdef;
    return nsdef;
}

/*-----------------------------------------------------------------*/
/* symWithRName - look for symbol with mangled name = parm         */
/*-----------------------------------------------------------------*/
DEFSETFUNC(symWithRName)
{
    symbol *sym = item;
    V_ARG(char *,s);
    V_ARG(symbol **,rsym);

    if (*rsym)
  return 0;

    if (strcmp(sym->rname,s) == 0) {
  *rsym = sym;
  return 1;
    }

    return 0;
}

/*-----------------------------------------------------------------*/
/* funcWithRName - look for function with name                     */
/*-----------------------------------------------------------------*/
DEFSETFUNC(funcWithRName)
{
    function *func = item;
    V_ARG(char *,s);
    V_ARG(function **,rfunc);

    if (*rfunc)
  return 0;

    if (strcmp(func->sym->rname,s) == 0) {
  *rfunc = func;
  return 1;
    }

    return 0;
}

/*-----------------------------------------------------------------*/
/* symLocal - local symbol respecting blocks & levels              */
/*-----------------------------------------------------------------*/
DEFSETFUNC(symLocal)
{
    symbol *sym = item;
    V_ARG(char *,name);
    V_ARG(char *,sname);
    V_ARG(int   ,block);
    V_ARG(int   ,level);
    V_ARG(symbol **,rsym);

    if (strcmp(name,sym->name) == 0 && /* name matches */
  sym->scopetype != 'G'       && /* local scope  */
  (sym->sname && strcmp(sym->sname,sname) == 0) && /* scope == specified scope */
  sym->block <= block         && /* block & level kindo matches */
  sym->level <= level) {

  /* if a symbol was previously found then
     sure that ones block & level are less
     then this one */
  if (*rsym && (*rsym)->block >= block &&
      (*rsym)->level >= level)
      return 0;

  *rsym = sym;
  return 1;
    }

    return 0;
}

/*-----------------------------------------------------------------*/
/* symGlobal - return global symbol of name                        */
/*-----------------------------------------------------------------*/
DEFSETFUNC(symGlobal)
{
    symbol *sym = item;
    V_ARG(char *,name);
    V_ARG(symbol **,rsym);

    if (*rsym)
  return 0;

    /* simple :: global & name matches */
    if (sym->scopetype == 'G' &&
  strcmp(sym->name,name) == 0) {
  *rsym = sym;
  return 1;
    }

    return 0;
}

/*-----------------------------------------------------------------*/
/* symLookup - determine symbol from name & context                */
/*-----------------------------------------------------------------*/
symbol *symLookup (char *name, context *ctxt)
{
    symbol *sym = NULL ;

    /* first try & find a local variable for the
       given name */
    if ( applyToSet(symbols,symLocal,
        name,
        ctxt->func->sym->name,
        ctxt->block,
        ctxt->level,
        &sym))
  return sym;

    sym = NULL;
    /* then try local to this module */
    if (applyToSet(symbols,symLocal,
       name,
       ctxt->func->mod->name,
       0,0,&sym))
  return sym;
    sym = NULL;
    /* no:: try global */
    if ( applyToSet(symbols,symGlobal,name,&sym))
  return sym;

    /* cannot find return null */
    return NULL;
}

/*-----------------------------------------------------------------*/
/* lnkFuncEnd - link record for end of function                    */
/*-----------------------------------------------------------------*/
static void lnkFuncEnd (char *s)
{
    char sname[128], *bp = sname;
    function *func;

    /* copy till we get to a ':' */
    while ( *s != ':' )
  *bp++ = *s++;
    bp -= 1;
    *bp = '\0';

    func = NULL;
    if (!applyToSet(functions,funcWithRName,sname,&func))
  return ;

    s++;
    sscanf(s,"%x",&func->sym->eaddr);

    Dprintf(D_symtab, ("%s(eaddr%x)\n",func->sym->name,func->sym->eaddr));
}

/*-----------------------------------------------------------------*/
/* lnkSymRec - record for a symbol                                 */
/*-----------------------------------------------------------------*/
static void lnkSymRec (char *s)
{
    char sname[128], *bp = sname;
    symbol *sym;

    /* copy till we get to a ':' */
    while ( *s != ':')
  *bp++ = *s++;
    bp -= 1;
    *bp = '\0';


    sym = NULL;
    if (!applyToSet(symbols,symWithRName,sname,&sym))
  return ;

    s++;
    sscanf(s,"%x",&sym->addr);

    Dprintf(D_symtab, ("%s(%x)\n",sym->name,sym->addr));
}

/*-----------------------------------------------------------------*/
/* lnkAsmSrc - process linker record for asm sources               */
/*-----------------------------------------------------------------*/
static void lnkAsmSrc (char *s)
{
    char mname[128], *bp = mname;
    int line ;
    unsigned addr;
    module *mod = NULL;

    /* input will be of format
       filename$<line>:<address> */
    while (*s != '$' && *s != '.')
  *bp++ = *s++;
    *bp = '\0';
    /* skip to line stuff */
    while (*s != '$') s++;

    if (!applyToSet(modules,moduleWithName,mname,&mod))
  return ;

    if (sscanf(s,"$%d:%x",&line,&addr) != 2)
  return ;

    line--;
    if (line < mod->nasmLines) {
  mod->asmLines[line]->addr = addr;
  Dprintf(D_symtab, ("%s(%d:%x) %s",mod->asm_name,line,addr,mod->asmLines[line]->src));
    }
}

/*-----------------------------------------------------------------*/
/* lnkCSrc - process linker output for c source                    */
/*-----------------------------------------------------------------*/
static void lnkCSrc (char *s)
{
    char mname[128], *bp = mname;
    int block,level,line;
    unsigned int addr;
    module *mod ;

    /* input will be of format
       filename.ext$<level>$<block>$<line>:<address> */
    /* get the module name */
    while (*s != '$' )
  *bp++ = *s++;
    *bp = '\0';
    /* skip the extension */
    while (*s != '$') s++;

    if (sscanf(s,"$%d$%d$%d:%x",
         &line,&level,&block,&addr) != 4)
  return ;

    mod = NULL;
    if (!applyToSet(modules,moduleWithCName,mname,&mod)) {
  mod = parseModule(mname,FALSE);
  mod->c_name = alloccpy(mname,strlen(mname));
  mod->cfullname=searchDirsFname(mod->c_name);
  mod->cLines = loadFile(mod->c_name,&mod->ncLines);
    }

    line--;
    if (line < mod->ncLines && line > 0) {
  mod->cLines[line]->addr = addr;
  mod->cLines[line]->block = block;
  mod->cLines[line]->level = level;
  Dprintf(D_symtab, ("%s(%d:%x) %s",mod->c_name,
         line+1,addr,mod->cLines[line]->src));
    }
    return;

}

/*-----------------------------------------------------------------*/
/* parseLnkRec - parses a linker generated record                  */
/*-----------------------------------------------------------------*/
void parseLnkRec (char *s)
{
    /* link records can be several types
       dpeneding on the type do */

    switch (*s) {

  /* c source line address */
    case 'C':
  lnkCSrc(s+2);
  break;
  /* assembler source address */
    case 'A':
  lnkAsmSrc(s+2);
  break;

    case 'X':
  lnkFuncEnd(s+1);
  break;

    default :
  lnkSymRec(s);
  break;
    }
}

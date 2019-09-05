/*
 * Simulator of microcontrollers (cmd.src/cmdutil.cc)
 *
 * Copyright (C) 1999,99 Drotos Daniel, Talker Bt.
 * 
 * To contact author send email to drdani@mazsola.iit.uni-miskolc.hu
 *
 */

/* This file is part of microcontroller simulator: ucsim.

UCSIM is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

UCSIM is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with UCSIM; see the file COPYING.  If not, write to the Free
Software Foundation, 59 Temple Place - Suite 330, Boston, MA
02111-1307, USA. */
/*@1@*/

#include "ddconfig.h"

#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include <sys/types.h>
#ifdef HAVE_SYS_SOCKET_H
# include <sys/socket.h>
# include <netinet/in.h>
# include <arpa/inet.h>
#endif
#include "i_string.h"

#include "stypes.h"
#include "globals.h"
#include "uccl.h"


/*
 * Making a socket which can be used to listen for a specified port
 */

#ifdef SOCKET_AVAIL
int
make_server_socket(unsigned short int port)
{
  int sock, i;
  struct sockaddr_in name;
     
  /* Create the socket. */
  sock= socket(PF_INET, SOCK_STREAM, 0);
  if (sock < 0)
    {
      perror("socket");
      return(0);
    }
     
  /* Give the socket a name. */
  i= 1;
  if (setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, (char*)&i, sizeof(i)) < 0)
    {
      perror("setsockopt");
    }
  name.sin_family     = AF_INET;
  name.sin_port       = htons(port);
  name.sin_addr.s_addr= htonl(INADDR_ANY);
  if (bind(sock, (struct sockaddr *)&name, sizeof(name)) < 0)
    {
      perror("bind");
      return(0);
    }

  return(sock);
}
#endif


/*
 * Printing out an integer in binary format
 */

/*void
print_bin(long data, int bits, class cl_console *con)
{
  long mask= 1;

  mask= mask << ((bits >= 1)?(bits-1):0);
  while (bits--)
    {
      con->printf("%c", (data&mask)?'1':'0');
      mask>>= 1;
    }
}*/


/*
 * Searching for a name in the specified table
 */

struct name_entry *
get_name_entry(struct name_entry tabl[], char *name, class cl_uc *uc)
{
  int i= 0;
  char *p;

  if (!tabl ||
      !name ||
      !(*name))
    return(0);
  for (p= name; *p; *p= toupper(*p), p++);
  while (tabl[i].name &&
	 (!(tabl[i].cpu_type & uc->type) ||
	 (strcmp(tabl[i].name, name) != 0)))
    i++;
  if (tabl[i].name != NULL)
    return(&tabl[i]);
  else
    return(0);
}


/*
 * Interpreting a bitname
 */

bool
interpret_bitname(char *name, class cl_uc *uc,
		  uchar **cell, uchar *celladdr,
		  uchar *bitaddr, uchar *bitmask,
		  char **symname)
{
  char *dot, *p;
  char *sym, bitnumstr[2];
  struct name_entry *ne;
  int bitnum, i;
  
  if ((dot= strchr(name, '.')) != NULL)
    {
      *dot++= '\0';
      if ((ne= get_name_entry(uc->sfr_tbl(), name, uc)) == NULL)
	{
	  *celladdr= strtol(name, &p, 0);
	  if (p && *p)
	    {
	      dot--;
	      *dot= '.';
	      return(DD_FALSE);
	    }
	}
      else
	*celladdr= ne->addr;
      if ((*celladdr < 0x20) ||
	  ((*celladdr > 0x2f) && (*celladdr < 0x80)) ||
	  ((*celladdr > 0x7f) && (*celladdr & 0x07)))
	return(DD_FALSE);
      bitnum= strtol(dot, &p, 0);
      if ((p && *p) ||
	  (bitnum < 0) ||
	  (bitnum > 7))
	return(DD_FALSE);
      if (*celladdr > 0x7f)
	*bitaddr= *celladdr + bitnum;
      else
	*bitaddr= (*celladdr - 0x20)*8 + bitnum;
      dot--;
      *dot= '.';
    }
  else
    {
      if ((ne= get_name_entry(uc->bit_tbl(), name, uc)) == NULL)
	{
	  *bitaddr= strtol(name, &p, 0);
	  if ((p && *p) ||
	      (*bitaddr > 0xff))
	    return(DD_FALSE);
	}
      else
	*bitaddr= ne->addr;
      if (*bitaddr > 0x7f)
	*celladdr= *bitaddr & 0xf8;
      else
	*celladdr= (*bitaddr >> 3) + 0x20;
    }
  // *bitaddr, *celladdr now OK
  *cell= uc->get_bit/*FIXME*/(*bitaddr);
  *bitmask= BIT_MASK(*bitaddr);
  // making symbolic name
  if (!symname)
    return(DD_TRUE);
  i= 0;
  while (uc->bit_tbl()[i].name &&
	 (uc->bit_tbl()[i].addr != *bitaddr))
    i++;
  if (uc->bit_tbl()[i].name)
    {
      sym= strdup(uc->bit_tbl()[i].name);
      *symname= sym;
      return(DD_TRUE);
    }
  i= 0;
  while (uc->sfr_tbl()[i].name &&
	 (uc->sfr_tbl()[i].addr != *celladdr))
    i++;
  if (uc->sfr_tbl()[i].name)
    sym= strdup(uc->sfr_tbl()[i].name);
  else
    {
      sym= (char *)malloc(3);
      sprintf(sym, "%02x", *celladdr);
    }
  sym= (char *)realloc(sym, strlen(sym)+2);
  strcat(sym, ".");
  sprintf(bitnumstr, "%1d", *bitaddr & 0x07);
  strcat(sym, bitnumstr);
  *symname= sym;
  return(DD_TRUE);
}


/*
 * Processing escape sequencies in a string
 */

char *
proc_escape(char *string, int *len)
{
  char  spec_chars[]= "fnrtvab\"";
  char  spec[]= "\f\n\r\t\v\a\b\"";
  char  *s, *str, *p;

  s  = string;
  str= (char *)malloc(strlen(string)+1);
  p  = str;
  while (*s)
    {
      char *spec_c;

      if (*s == '\\' &&
	  *(s+1))
	{
	  s++;
	  if (*s == '0')
	    {
	      if (!isdigit(*(s+1)))
		{
		  *p++= '\0';
		  s++;
		}
	      else
		{
		  char *octal, *chk, data;
		  int i, j;
		  i= strspn(s, "01234567");
		  octal= (char *)malloc(i+1);
		  j= 0;
		  while (*s &&
			 (j < i))
		    octal[j++]= *s++;
		  octal[j]= '\0';
		  data= strtol(octal, &chk, 8);
		  if (!chk || !(*chk))
		    *p++= data;
		}
	    }
	  else
	    if ((spec_c= strchr(spec_chars, *s)) != NULL)
	      {
		*p++= spec[spec_c-spec_chars];
		s++;
	      }
	    else
	      *p++= *s++;
	}
      else
	*p++= *s++;
    }
  *p= '\0';
  *len= p-str;
  return(str);
}


/* End of cmd.src/cmdutil.cc */

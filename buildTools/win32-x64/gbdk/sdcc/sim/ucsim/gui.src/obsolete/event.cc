/*
 * Simulator of microcontrollers (event.cc)
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

#include <curses.h>

//#include <stdio.h>

#include "eventcl.h"


cl_input_src::cl_input_src(FILE *ifile, class cl_view *iview)
{
  file= ifile;
  view= iview;
}


cl_gin::cl_gin(void)
{
  FD_ZERO(&in_set);
  max_fdes= 0;
  inputs= new cl_list(1, 1);
}

cl_gin::~cl_gin(void)
{
  delete inputs;
}


int
cl_gin::add_input(FILE *ifile, class cl_view *iview)
{
  int d= fileno(ifile);

  inputs->add(new cl_input_src(ifile, iview));
  if (d > max_fdes)
    max_fdes= d;
  FD_SET(d, &in_set);
  return(0);
}

class cl_input_src *
cl_gin::get_input_src(int fdes)
{
  int i;
  
  for (i= 0; i < inputs->count; i++)
    {
      class cl_input_src *s= (class cl_input_src *)(inputs->at(i));
      if (fileno(s->file) == fdes)
	return(s);
    }
  return(0);
}

int
cl_gin::get_event(struct t_event *event)
{
  fd_set set;
  //static struct timeval timeout= {0,0};
  wchar_t c;

  //FD_ZERO(&set);
  set= in_set;
  //FD_SET(fileno(stdin), &set);
  if(::select(/*fileno(stdin)*/max_fdes+1,
	      &set, NULL, NULL,
	      NULL/*&timeout*/) > 0)
    {
      int i;
      for (i= 0; i < inputs->count; i++)
	{
	  class cl_input_src *s= (class cl_input_src *)(inputs->at(i));
	  if (!s->file ||
	      !(FD_ISSET(fileno(s->file), &set)))
	    continue;
	  if (s->view)
	    {
	      if (s->file)
		{
		  c= fgetc(s->file);
		  return(s->view->mk_event(event, s->file, c));
		}
	    }
	  else
	    if ((c= getch()) > 0)
	      {
		event->what= EV_KEY;
		event->event.key= c;
		return(1);
	      }
	}
    }
  
  return(0);
}


/* End of gui.src/event.cc */

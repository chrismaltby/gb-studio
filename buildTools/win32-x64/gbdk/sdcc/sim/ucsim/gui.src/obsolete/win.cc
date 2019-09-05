/*
 * Simulator of microcontrollers (win.cc)
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

#include <stdlib.h>
#include "i_string.h"

#include "wincl.h"


cl_win::cl_win(class cl_box *ipos, char *ititle, class cl_app *iapp):
  cl_group(ipos, 0, iapp)
{
  title= strdup(ititle);
  free(name);
  if (!ititle ||
      !(*ititle))
    {
      name= (char*)malloc(100);
      sprintf(name, "win%p", this);
    }
  else
    name= strdup(ititle);
}

cl_win::~cl_win(void)
{
  if (frame)
    delete frame;
  if (title)
    free(title);
}

int
cl_win::init(void)
{
  cl_group::init();
  if ((frame= mk_frame(pos)))
    insert(frame);
  class cl_box *b= new cl_box(pos->x,pos->y, pos->w,pos->h);
  b->move_rel(1,1);
  b->grow(-2,-2);
  if ((intern= mk_intern(b)))
    insert(intern);
  //draw();
  delete b;
  return(0);
}

int *
cl_win::mk_palette(void)
{
  int *p= (int*)malloc(8*sizeof(int)), i;
  for (i= 0; i < 8; i++)
    p[i]= i+C_WIN;
  return(p);
}

class cl_frame *
cl_win::mk_frame(class cl_box *ipos)
{
  char n[100]= "";
  
  sprintf(n, "frameof_\"%s\"", name);
  class cl_frame *f= new cl_frame(ipos, this, n, app);
  f->init();
  return(f);
}

class cl_view *
cl_win::mk_intern(class cl_box *ipos)
{
  class cl_view *v= new cl_view(ipos, 0, app);
  v->init();
  v->options&= ~OF_SELECTABLE;
  return(v);
}

char *
cl_win::get_title(void)
{
  return(title);
}


/* End of gui.src/win.cc */

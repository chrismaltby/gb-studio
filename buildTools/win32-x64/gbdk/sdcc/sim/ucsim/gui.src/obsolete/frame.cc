/*
 * Simulator of microcontrollers (frame.cc)
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

#include "framecl.h"
#include "wincl.h"


cl_frame::cl_frame(class cl_box *ipos, class cl_view *iwindow, char *iname,
		   class cl_app *iapp):
  cl_view(ipos, iname, iapp)
{
  win= iwindow;
  options&= ~OF_SELECTABLE;
}

int *
cl_frame::mk_palette(void)
{
  int *p;

  p= (int*)malloc(2*sizeof(int));
  p[0]= C_WIN_FPASSIVE;
  p[1]= C_WIN_FACTIVE;
  return(p);
}

int
cl_frame::draw(void)
{
  char *t;
  int color;

  color= get_color((win && (win->state&SF_SELECTED))?1:0);
  wattrset(window, color);
  box(window, ACS_VLINE, ACS_HLINE);
  if (!(t= strdup(((class cl_win *)win)->get_title())))
    return(0);
  if ((signed)strlen(t) > (pos->w)-4)
    t[(pos->w)-4]= '\0';
  mvwprintw(window, 0,((pos->w)-strlen(t))/2, "[%s]", t);
  free(t);
  app->drawn++;
  return(0);
}


/* End of gui.src/frame.cc */

/*
 * Simulator of microcontrollers (bg.cc)
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

#include <stdlib.h>

#include "bgcl.h"


cl_bg::cl_bg(class cl_box *ipos, char *iname, class cl_app *iapp):
  cl_view(ipos, iname, iapp)
{
  options&= ~OF_SELECTABLE;
}

int *
cl_bg::mk_palette(void)
{
  int *p;

  p= (int*)malloc(1*sizeof(int));
  p[0]= C_DSK_BG;
  return(p);
}

int
cl_bg::draw(void)
{
  int x, y, color= get_color(0);
  
  wmove(window, 0, 0);
  wattrset(window, color);
  for (y= 0; y < pos->h; y++)
    for (x= 0; x < pos->w; x++)
      waddch(window, ACS_CKBOARD);
  return(0);
}


/* End of gui.src/bg.cc */

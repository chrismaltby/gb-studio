/*
 * Simulator of microcontrollers (label.cc)
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

#include "labelcl.h"


cl_label::cl_label(class cl_box *ipos, class cl_app *iapp, char *ilabel):
  cl_view(ipos, "label", iapp)
{
  options&= ~OF_SELECTABLE;
  if (!ilabel ||
      !(*ilabel))
    label= strdup("");
  else
    label= strdup(ilabel);
}

cl_label::~cl_label(void)
{
  free(label);
}

int *
cl_label::mk_palette(void)
{
  int *p;

  p= (int*)malloc(1*sizeof(int));
  p[0]= C_WIN_NORMAL;
  return(p);
}

int
cl_label::draw(void)
{
  int color= get_color(0);

  cl_view::draw();
  wattrset(window, color);
  mvwprintw(window, 0,0, "%s", label);
  return(0);
}


/* End of gui.src/label.cc */

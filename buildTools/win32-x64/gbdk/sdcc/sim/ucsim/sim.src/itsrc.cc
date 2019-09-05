/*
 * Simulator of microcontrollers (itsrc.cc)
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
#include "i_string.h"

#include "itsrccl.h"
#include "pobjcl.h"
#include "stypes.h"


/*
 * Interrupt source
 ******************************************************************************
 */

cl_it_src::cl_it_src(uchar Iie_mask,
		     uchar Isrc_reg,
		     uchar Isrc_mask,
		     uint  Iaddr,
		     bool  Iclr_bit,
		     char  *Iname):
  cl_base()
{
  ie_mask = Iie_mask;
  src_reg = Isrc_reg;
  src_mask= Isrc_mask;
  addr    = Iaddr;
  clr_bit = Iclr_bit;
  if (Iname != NULL)
    name= strdup(Iname);
  else
    name= strdup("unknown");
  active= DD_TRUE;
}

cl_it_src::~cl_it_src(void)
{
  free(name);
}

bool
cl_it_src::is_active(void)
{
  return(active);
}

void
cl_it_src::set_active_status(bool Aactive)
{
  active= Aactive;
}

void
cl_it_src::activate(void)
{
  set_active_status(DD_TRUE);
}

void
cl_it_src::deactivate(void)
{
  set_active_status(DD_FALSE);
}


/*
 * Interrupt level
 ******************************************************************************
 */

it_level::it_level(int alevel, uint aaddr, uint aPC, class cl_it_src *is):
  cl_base()
{
  level = alevel;
  addr  = aaddr;
  PC    = aPC;
  source= is;
}



/* End of itsrc.cc */

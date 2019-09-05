/*
 * Simulator of microcontrollers (port.cc)
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

#include <ctype.h>

#include "portcl.h"
#include "regs51.h"


cl_port::cl_port(class cl_uc *auc, int aid):
  cl_hw(auc, HW_PORT, aid, "port")
{}

int
cl_port::init(void)
{
  switch (id)
    {
    case 0: sfr= P0; break;
    case 1: sfr= P1; break;
    case 2: sfr= P2; break;
    case 3: sfr= P3; break;
    default: sfr= P0; return(1);
    }
  return(0);
}

void
cl_port::print_info(class cl_console *con)
{
  uchar data;

  con->printf("%s[%d]\n", id_string, id);
  data= uc->get_mem(MEM_SFR, sfr);
  con->printf("P%d    ", id);
  con->print_bin(data, 8);
  con->printf(" 0x%02x %3d %c (Value in SFR register)\n",
	      data, data, isprint(data)?data:'.');

  data= uc->port_pins[id];
  con->printf("Pin%d  ", id);
  con->print_bin(data, 8);
  con->printf(" 0x%02x %3d %c (Output of outside circuits)\n",
	      data, data, isprint(data)?data:'.');

  data= uc->port_pins[id] & uc->get_mem(MEM_SFR, sfr);
  con->printf("Port%d ", id);
  con->print_bin(data, 8);
  con->printf(" 0x%02x %3d %c (Value on the port pins)\n",
	      data, data, isprint(data)?data:'.');
}


/* End of s51.src/port.cc */

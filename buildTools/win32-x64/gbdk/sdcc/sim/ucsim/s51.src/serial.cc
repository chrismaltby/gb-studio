/*
 * Simulator of microcontrollers (serial.cc)
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

#include "serialcl.h"
#include "regs51.h"


cl_serial::cl_serial(class cl_uc *auc):
  cl_hw(auc, HW_UART, 0, "uart")
{}

/*int
cl_serial::init(void)
{
  return(0);
}*/

void
cl_serial::print_info(class cl_console *con)
{
  char *modes[]= { "Shift, fixed clock",
		   "8 bit UART timer clocked",
		   "9 bit UART fixed clock",
		   "9 bit UART timer clocked" };
  int scon= uc->get_mem(MEM_SFR, SCON);

  con->printf("%s[%d]", id_string, id);
  int mode= (scon&(bmSM0|bmSM1))>>6;
  con->printf(" %s MultiProc=%s", modes[mode],
	      (mode&2)?((scon&bmSM2)?"ON":"OFF"):"none");
  con->printf(" irq=%s", (uc->get_mem(MEM_SFR, IE)&bmES)?"en":"dis");
  con->printf(" prio=%d", uc->it_priority(bmPS));
  con->printf("\n");

  con->printf("Receiver");
  con->printf(" %s", (scon&bmREN)?"ON":"OFF");
  con->printf(" RB8=%c", (scon&bmRB8)?'1':'0');
  con->printf(" irq=%c", (scon&bmRI)?'1':'0');
  con->printf("\n");

  con->printf("Transmitter");
  con->printf(" TB8=%c", (scon&bmTB8)?'1':'0');
  con->printf(" irq=%c", (scon&bmTI)?'1':'0');
  con->printf("\n");
}


/* End of s51.src/serial.cc */

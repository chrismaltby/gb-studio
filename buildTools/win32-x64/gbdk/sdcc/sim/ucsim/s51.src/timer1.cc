/*
 * Simulator of microcontrollers (timer1.cc)
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

#include "timer1cl.h"
#include "regs51.h"


cl_timer1::cl_timer1(class cl_uc *auc):
  cl_hw(auc, HW_TIMER, 1, "timer1")
{}

/*int
cl_timer1::init(void)
{
  return(0);
}*/

void
cl_timer1::print_info(class cl_console *con)
{
  char *modes[]= { "13 bit", "16 bit", "8 bit autoreload", "stop" };
  int tmod= uc->get_mem(MEM_SFR, TMOD);
  int on;

  con->printf("%s[%d] 0x%04x", id_string, id,
	      256*uc->get_mem(MEM_SFR, TH1)+uc->get_mem(MEM_SFR, TL1));
  int mode= (tmod & (bmM11|bmM01)) >> 4;
  con->printf(" %s", modes[mode]);
  con->printf(" %s", (tmod&bmC_T1)?"counter":"timer");
  if (tmod&bmGATE1)
    {
      con->printf(" gated");
      on= uc->get_mem(MEM_SFR, P3) & uc->port_pins[3] & bm_INT0;
    }
  else
    on= uc->get_mem(MEM_SFR, TCON) & bmTR1;
  con->printf(" %s", on?"ON":"OFF");
  con->printf(" irq=%c", (uc->get_mem(MEM_SFR, TCON)&bmTF1)?'1':'0');
  con->printf(" %s", (uc->get_mem(MEM_SFR, IE)&bmET1)?"en":"dis");
  con->printf(" prio=%d", uc->it_priority(bmPT1));
  con->printf("\n");
}


/* End of timer1.cc */

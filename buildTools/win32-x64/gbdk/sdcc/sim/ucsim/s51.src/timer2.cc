/*
 * Simulator of microcontrollers (timer2.cc)
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

#include "timer2cl.h"
#include "regs51.h"


cl_timer2::cl_timer2(class cl_uc *auc):
  cl_hw(auc, HW_TIMER, 2, "timer2")
{}

/*int
cl_timer2::init(void)
{
  return(0);
}*/

void
cl_timer2::print_info(class cl_console *con)
{
  int t2con= uc->get_mem(MEM_SFR, T2CON);

  con->printf("%s[%d] 0x%04x", id_string, id,
	      256*uc->get_mem(MEM_SFR, TH2)+uc->get_mem(MEM_SFR, TL2));
  if (t2con & (bmRCLK|bmTCLK))
    {
      con->printf(" baud");
      if (t2con & bmRCLK)
	con->printf(" RCLK");
      if (t2con & bmTCLK)
	con->printf(" TCLK");
    }
  else
    con->printf(" %s", (t2con&bmCP_RL2)?"capture":"reload");
  con->printf(" 0x%04x",
	      256*uc->get_mem(MEM_SFR, RCAP2H)+uc->get_mem(MEM_SFR, RCAP2L));
  con->printf(" %s", (t2con&bmC_T2)?"counter":"timer");
  con->printf(" %s", (t2con&bmTR2)?"ON":"OFF");
  con->printf(" irq=%c", (t2con&bmTF2)?'1':'0');
  con->printf(" %s", (uc->get_mem(MEM_SFR, IE)&bmET2)?"en":"dis");
  con->printf(" prio=%d", uc->it_priority(bmPT2));
  con->printf("\n");
}


/* End of s51.src/timer2.cc */

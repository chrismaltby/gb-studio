/*
 * Simulator of microcontrollers (uc52.cc)
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

// local
#include "uc52cl.h"
#include "regs51.h"
#include "timer2cl.h"


/*
 * Making an 8052 CPU object
 */

t_uc52::t_uc52(int Itype, int Itech, class cl_sim *asim):
  t_uc51(Itype, Itech, asim)
{
  it_sources->add(new cl_it_src(bmET2, T2CON, bmTF2, 0x002b, false,
				"timer #2 TF2"));
  exf2it= new cl_it_src(bmET2, T2CON, bmEXF2, 0x002b, false,
			"timer #2 EXF2");
  it_sources->add(exf2it);
}


void
t_uc52::mk_hw_elements(void)
{
  class cl_hw *h;

  t_uc51::mk_hw_elements();
  hws->add(h= new cl_timer2(this));
  h->init();
}


/*
 * Calculating address of indirectly addressed IRAM cell
 *
 * If CPU is 8051 and addr is over 127, it must be illegal! But in 52
 * it is legal.
 *
 */

uchar *
t_uc52::get_indirect(uchar addr, int *res)
{
  *res= resGO;
  return(&(/*MEM(MEM_IRAM)*/iram->umem8[addr]));
}


/*
 * Simulating timers
 *
 * Calling inherited method to simulate timer #0 and #1 and then 
 * simulating timer #2.
 *
 */

int
t_uc52::do_timers(int cycles)
{
  int res;

  if ((res= t_uc51::do_timers(cycles)) != resGO)
    return(res);
  return(do_timer2(cycles));
}


/*
 * Simulating timer 2
 */

int
t_uc52::do_timer2(int cycles)
{
  bool nocount= DD_FALSE;
  uint t2con= get_mem(MEM_SFR, T2CON);

  exf2it->activate();
  if (!(t2con & bmTR2))
    /* Timer OFF */
    return(resGO);

  if (t2con & (bmRCLK | bmTCLK))
    return(do_t2_baud(cycles));

  /* Determining nr of input clocks */
  if (!(t2con & bmTR2))
    nocount= DD_TRUE; // Timer OFF
  else
    if (t2con & bmC_T2)
      {
	// Counter mode, falling edge on P1.0 (T2)
	if ((prev_p1 & bmT2) &&
	    !(get_mem(MEM_SFR, P1) & port_pins[1] & bmT2))
	  cycles= 1;
	else
	  nocount= DD_TRUE;
      }
  /* Counting */
  while (cycles--)
    {
      if (t2con & bmCP_RL2)
	do_t2_capture(&cycles, nocount);
      else
	do_t2_reload(&cycles, nocount);
    }// while cycles
  
  return(resGO);
}


/*
 * Baud rate generator mode of Timer #2
 */

int
t_uc52::do_t2_baud(int cycles)
{
  uint t2con= get_mem(MEM_SFR, T2CON);
  uint p1= get_mem(MEM_SFR, P1);

  /* Baud Rate Generator */
  if ((prev_p1 & bmT2EX) &&
      !(p1 & port_pins[1] & bmT2EX) &&
      (t2con & bmEXEN2))
    mem(MEM_SFR)->set_bit1(T2CON, bmEXF2);
  if (t2con & bmC_T2)
    {
      if ((prev_p1 & bmT2) &&
	  !(p1 & port_pins[1] & bmT2))
	cycles= 1;
      else
	cycles= 0;
    }
  else
    cycles*= 6;
  if (t2con & bmTR2)
    while (cycles--)
      {
	if (!/*++(MEM(MEM_SFR)[TL2])*/sfr->add(TL2, 1))
	  if (!/*++(MEM(MEM_SFR)[TH2])*/sfr->add(TH2, 1))
	    {
	      //MEM(MEM_SFR)[TH2]= MEM(MEM_SFR)[RCAP2H];
	      sfr->set(TH2, sfr->get(RCAP2H));
	      //MEM(MEM_SFR)[TL2]= MEM(MEM_SFR)[RCAP2L];
	      sfr->set(TL2, sfr->get(RCAP2L));
	      s_rec_t2++;
	      s_tr_t2++;
	    }
      }
  return(resGO);
}


/*
 * Capture function of Timer #2
 */

void
t_uc52::do_t2_capture(int *cycles, bool nocount)
{
  uint p1= get_mem(MEM_SFR, P1);
  uint t2con= get_mem(MEM_SFR, T2CON);

  /* Capture mode */
  if (nocount)
    *cycles= 0;
  else
    {
      if (!/*++(MEM(MEM_SFR)[TL2])*/sfr->add(TL2, 1))
	{
	  if (!/*++(MEM(MEM_SFR)[TH2])*/sfr->add(TH2, 1))
	    mem(MEM_SFR)->set_bit1(T2CON, bmTF2);
	}
    }
  // capture
  if ((prev_p1 & bmT2EX) &&
      !(p1 & port_pins[1] & bmT2EX) &&
      (t2con & bmEXEN2))
    {
      //MEM(MEM_SFR)[RCAP2H]= MEM(MEM_SFR)[TH2];
      sfr->set(RCAP2H, sfr->get(TH2));
      //MEM(MEM_SFR)[RCAP2L]= MEM(MEM_SFR)[TL2];
      sfr->set(RCAP2L, sfr->get(TL2));
      mem(MEM_SFR)->set_bit1(T2CON, bmEXF2);
      prev_p1&= ~bmT2EX; // Falling edge has been handled
    }
}


/*
 * Auto Reload mode of Timer #2, counting UP
 */

void
t_uc52::do_t2_reload(int *cycles, bool nocount)
{
  int overflow;
  bool ext2= 0;
  
  /* Auto-Relode mode */
  overflow= 0;
  if (nocount)
    *cycles= 0;
  else
    {
      if (!/*++(MEM(MEM_SFR)[TL2])*/sfr->add(TL2, 1))
	{
	  if (!/*++(MEM(MEM_SFR)[TH2])*/sfr->add(TH2, 1))
	    {
	      mem(MEM_SFR)->set_bit1(T2CON, bmTF2);
	      overflow++;
	    }
	}
    }
  // reload
  if ((prev_p1 & bmT2EX) &&
      !(get_mem(MEM_SFR, P1) & port_pins[1] & bmT2EX) &&
      (get_mem(MEM_SFR, T2CON) & bmEXEN2))
    {
      ext2= DD_TRUE;
      mem(MEM_SFR)->set_bit1(T2CON, bmEXF2);
      prev_p1&= ~bmT2EX; // Falling edge has been handled
    }
  if (overflow ||
      ext2)
    {
      //MEM(MEM_SFR)[TH2]= MEM(MEM_SFR)[RCAP2H];
      sfr->set(TH2, sfr->get(RCAP2H));
      //MEM(MEM_SFR)[TL2]= MEM(MEM_SFR)[RCAP2L];
      sfr->set(TL2, sfr->get(RCAP2L));
    }
}


/*
 *
 */

int
t_uc52::serial_bit_cnt(int mode)
{
  int divby= 12;
  int *tr_src= 0, *rec_src= 0;

  switch (mode)
    {
    case 0:
      divby  = 12;
      tr_src = &s_tr_tick;
      rec_src= &s_rec_tick;
      break;
    case 1:
    case 3:
      divby  = (get_mem(MEM_SFR, PCON)&bmSMOD)?16:32;
      tr_src = (get_mem(MEM_SFR, T2CON)&bmTCLK)?(&s_tr_t2):(&s_tr_t1);
      rec_src= (get_mem(MEM_SFR, T2CON)&bmTCLK)?(&s_rec_t2):(&s_rec_t1);
      break;
    case 2:
      divby  = (get_mem(MEM_SFR, PCON)&bmSMOD)?16:32;
      tr_src = &s_tr_tick;
      rec_src= &s_rec_tick;
      break;
    }
  if (s_sending)
    {
      while (*tr_src >= divby)
	{
	  (*tr_src)-= divby;
	  s_tr_bit++;
	}
    }
  if (s_receiving)
    {
      while (*rec_src >= divby)
	{
	  (*rec_src)-= divby;
	  s_rec_bit++;
	}
    }
  return(0);
}


/* End of s51.src/uc52.cc */

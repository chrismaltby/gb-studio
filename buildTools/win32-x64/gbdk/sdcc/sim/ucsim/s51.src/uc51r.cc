/*
 * Simulator of microcontrollers (uc51r.cc)
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
#include "uc51rcl.h"
#include "regs51.h"


/*
 * Making an 8051r CPU object
 */

t_uc51r::t_uc51r(int Itype, int Itech, class cl_sim *asim):
  t_uc52(Itype, Itech, asim)
{
  int i;

  for (i= 0; i < ERAM_SIZE; i++)
    ERAM[i]= 0;
  clock_out= 0;
}


/*
 * Resetting of the microcontroller
 *
 * Original method is extended with handling of WDT.
 */

void
t_uc51r::reset(void)
{
  t_uc52::reset();
  WDT= -1; // Disable WDT
  wdtrst= 0;
  //MEM(MEM_SFR)[SADDR]= MEM(MEM_SFR)[SADEN]= 0;
  sfr->set(SADDR, 0);
  sfr->set(SADEN, 0);
}


/*
 * Copying ERAM to XRAM and vice versa
 *
 * This two methods are used by command interpreter to make ERAM and
 * beginning of XRAM to be equivalent.
 */

void
t_uc51r::eram2xram(void)
{
  int i;

  for (i= 0; i < ERAM_SIZE; i++)
    set_mem(MEM_XRAM, i, ERAM[i]);
}

void
t_uc51r::xram2eram(void)
{
  int i;

  for (i= 0; i < ERAM_SIZE; i++)
    ERAM[i]= get_mem(MEM_XRAM, i);
}


/*
 * Processing write operation of SFR
 *
 * Inherited method is extended with WDT handling.
 */

void
t_uc51r::proc_write(uchar *addr)
{
  t_uc52::proc_write(addr);
  // Handling WDT
  if (addr == &(/*MEM(MEM_SFR)*/sfr->umem8[WDTRST]))
    {
      if ((wdtrst == 0x1e) &&
	  (*addr == 0xe1))
	{
	  WDT= 0;
	  sim->app->get_commander()->
	    debug("%g sec (%d tick): Watchdog timer enabled/reset PC= 0x%06x"
		  "\n", get_rtime(), ticks->ticks, PC);
	}
      wdtrst= *addr;
    }
}


/*
 * Simulating timers
 *
 * Calling inherited method to simulate timer #0 and #1 and then 
 * simulating timer #2.
 */

int
t_uc51r::do_timers(int cycles)
{
  int res;

  if ((res= t_uc51::do_timers(cycles)) != resGO)
    return(res);
  return(do_timer2(cycles));
}


/*
 * Simulating timer 2
 *
 * It is something wrong: T2MOD is not implemented in 52?!
 */

int
t_uc51r::do_timer2(int cycles)
{
  bool nocount= DD_FALSE;
  uint t2mod= get_mem(MEM_SFR, T2MOD);
  uint t2con= get_mem(MEM_SFR, T2CON);
  uint p1= get_mem(MEM_SFR, P1);

  exf2it->activate();
  if (!(t2con & bmTR2))
    /* Timer OFF */
    return(resGO);

  if (t2mod & bmT2OE)
    return(do_t2_clockout(cycles));

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
	    !(p1 & port_pins[1] & bmT2))
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
	{
	  int overflow;
	  overflow= 0;
	  /* Auto-Relode mode */
	  if (t2mod & bmDCEN)
	    {
	      /* DCEN= 1 */
	      exf2it->deactivate();
	      if (nocount)
		cycles= 0;
	      else
		{
		  if (p1 & port_pins[1] & bmT2EX)
		    {
		      // UP
		      if (!/*++(MEM(MEM_SFR)[TL2])*/sfr->add(TL2, 1))
			if (!/*++(MEM(MEM_SFR)[TH2])*/sfr->add(TH2, 1))
			  {
			    overflow++;
			    //MEM(MEM_SFR)[TH2]= MEM(MEM_SFR)[RCAP2H];
			    sfr->set(TH2, sfr->get(RCAP2H));
			    //MEM(MEM_SFR)[TL2]= MEM(MEM_SFR)[RCAP2L];
			    sfr->set(TL2, sfr->get(RCAP2L));
			    mem(MEM_SFR)->set_bit1(T2CON, bmTF2);
			  }
		    }
		  else
		    {
		      // DOWN
		      //MEM(MEM_SFR)[TL2]--;
		      if (/*MEM(MEM_SFR)[TL2]*/sfr->add(TL2, -1) == 0xff)
			/*MEM(MEM_SFR)[TH2]--*/sfr->add(TH2, -1);
		      /*if (MEM(MEM_SFR)[TH2] == MEM(MEM_SFR)[RCAP2H] &&
			MEM(MEM_SFR)[TL2] == MEM(MEM_SFR)[RCAP2L])*/
		      if (sfr->get(TH2) == sfr->get(RCAP2H) &&
			  sfr->get(TL2) == sfr->get(RCAP2L))
			{
			  overflow++;
			  //MEM(MEM_SFR)[TH2]= MEM(MEM_SFR)[TL2]= 0xff;
			  sfr->set(TH2, 0xff);
			  sfr->set(TL2, 0xff);
			  mem(MEM_SFR)->set_bit1(T2CON, bmTF2);
			}
		    }
		  while (overflow--)
		    //MEM(MEM_SFR)[P1]^= bmEXF2;
		    sfr->set(P1, sfr->get(P1) ^ bmEXF2);
		}
	    }
	  else
	    /* DCEN= 0 */
	    do_t2_reload(&cycles, nocount);
	}
    }// while cycles

  return(resGO);
}


/*
 * Clock out mode of Timer #2
 */

int
t_uc51r::do_t2_clockout(int cycles)
{
  uint t2con= get_mem(MEM_SFR, T2CON);
  uint p1= get_mem(MEM_SFR, P1);

  /* Programmable Clock Out Mode */
  if ((prev_p1 & bmT2EX) &&
      !(p1 & port_pins[1] & bmT2EX) &&
      (t2con & bmEXEN2))
    mem(MEM_SFR)->set_bit1(T2CON, bmEXF2);
  if (t2con & bmCP_RL2)
    return(resGO);
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
	      clock_out++;
	      if (!(t2con & bmC_T2))
		{
		  SET_BIT((clock_out&1), P1, bmT2);
		}
	    }
      }
  return(resGO);
}


/*
 * Handling serial line
 */

int
t_uc51r::serial_bit_cnt(int mode)
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

void
t_uc51r::received(int c)
{
  uint br= get_mem(MEM_SFR, SADDR) | get_mem(MEM_SFR, SADEN);
  int scon= get_mem(MEM_SFR, SCON);

  if ((0 < scon >> 6) &&
      (scon & bmSM2))
    {
      if (
	  /* Check for individual address */
	  ((get_mem(MEM_SFR, SADDR) & get_mem(MEM_SFR, SADEN)) ==
	  (c & get_mem(MEM_SFR, SADEN)))
	  ||
	  /* Check for broadcast address */
	  (br == (br & c))
	  )
	mem(MEM_SFR)->set_bit1(SCON, bmRI);
      return;
    }
  mem(MEM_SFR)->set_bit1(SCON, bmRI);
}


/*
 * Handling WDT
 */

int
t_uc51r::do_wdt(int cycles)
{
  if (WDT >= 0)
    {
      WDT+= cycles;
      if (WDT & ~(0x3fff))
	{
	  sim->app->get_commander()->
	    debug("%g sec (%d ticks): Watchdog timer resets the CPU, "
		  "PC= 0x%06x\n", get_rtime(), ticks->ticks, PC);
	  reset();
	  return(resWDTRESET);
	}
    }
  return(resGO);
}


/*
 * 0xe0 1 24 MOVX A,@DPTR
 *____________________________________________________________________________
 *
 */

int
t_uc51r::inst_movx_a_$dptr(uchar code)
{
  if ((get_mem(MEM_SFR, AUXR) & bmEXTRAM) ||
      /*MEM(MEM_SFR)[DPH]*/sfr->get(DPH))
    /*MEM(MEM_SFR)[event_at.ws= ACC]= read_mem(MEM_XRAM,
					     event_at.rx=
					     MEM(MEM_SFR)[DPH]*256+
					     MEM(MEM_SFR)[DPL]);*/
    sfr->set(event_at.ws= ACC, read_mem(MEM_XRAM,
					event_at.rx=
					/*MEM(MEM_SFR)[DPH]*/sfr->get(DPH)*256+
					/*MEM(MEM_SFR)[DPL]*/sfr->get(DPL)));
  else
    //MEM(MEM_SFR)[event_at.ws= ACC]= ERAM[event_at.rx= MEM(MEM_SFR)[DPL]];
    sfr->set(event_at.ws= ACC, ERAM[event_at.rx=
				   /*MEM(MEM_SFR)[DPL]*/sfr->get(DPL)]);
  tick(1);
  return(resGO);
}


/*
 * 0xe2-0xe3 1 24 MOVX A,@Ri
 *____________________________________________________________________________
 *
 */

int
t_uc51r::inst_movx_a_$ri(uchar code)
{
  uchar *addr;
  int res;

  addr= get_indirect(*(get_reg(code & 0x01)), &res);
  if (get_mem(MEM_SFR, AUXR) & bmEXTRAM)
    /*MEM(MEM_SFR)[event_at.ws= ACC]=
      read_mem(MEM_XRAM,
      event_at.rx= (MEM(MEM_SFR)[P2]&port_pins[2])*256+*addr);*/
    sfr->set(event_at.ws= ACC,
	     read_mem(MEM_XRAM,
		      event_at.rx=
		      (/*MEM(MEM_SFR)[P2]*/sfr->get(P2)&port_pins[2])*256+*addr));
  else
    //MEM(MEM_SFR)[event_at.ws= ACC]= ERAM[event_at.rx= *addr];
    sfr->set(event_at.ws= ACC, ERAM[event_at.rx= *addr]);
  tick(1);
  return(res);
}


/*
 * 0xf0 1 24 MOVX @DPTR,A
 *____________________________________________________________________________
 *
 */

int
t_uc51r::inst_movx_$dptr_a(uchar code)
{
  if ((get_mem(MEM_SFR, AUXR) & bmEXTRAM) ||
      /*MEM(MEM_SFR)[DPH]*/sfr->get(DPH))
    write_mem(MEM_XRAM,
	      event_at.wx= /*MEM(MEM_SFR)[DPH]*/sfr->get(DPH)*256 +
	                   /*MEM(MEM_SFR)[DPL]*/sfr->get(DPL),
	      /*MEM(MEM_SFR)[event_at.rs= ACC]*/sfr->get(event_at.rs= ACC));
  else
    ERAM[event_at.wx= /*MEM(MEM_SFR)[DPL]*/sfr->get(DPL)]=
      /*MEM(MEM_SFR)[*/sfr->get(event_at.rs= ACC)/*]*/;
  return(resGO);
}


/*
 * 0xf2-0xf3 1 24 MOVX @Ri,A
 *____________________________________________________________________________
 *
 */

int
t_uc51r::inst_movx_$ri_a(uchar code)
{
  uchar *addr;
  int res;

  addr= get_indirect(event_at.wi= *(get_reg(code & 0x01)), &res);
  if (get_mem(MEM_SFR, AUXR) & bmEXTRAM)
    write_mem(MEM_XRAM,
	      event_at.wx=
	      (/*MEM(MEM_SFR)[P2]*/sfr->get(P2) & port_pins[2])*256 + *addr,
	      /*MEM(MEM_SFR)[ACC]*/sfr->get(ACC));
  else
    ERAM[event_at.wx= *addr]= /*MEM(MEM_SFR)[ACC]*/sfr->get(ACC);
  tick(1);
  return(res);
}


/* End of s51.src/uc51r.cc */

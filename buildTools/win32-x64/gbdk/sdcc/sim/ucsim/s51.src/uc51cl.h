/*
 * Simulator of microcontrollers (uc51cl.h)
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

#ifndef UC51CL_HEADER
#define UC51CL_HEADER

#include <stdio.h>
#include <termios.h>

#include "pobjcl.h"

#include "simcl.h"
#include "memcl.h"
#include "uccl.h"
#include "itsrccl.h"
#include "brkcl.h"
#include "stypes.h"


class t_uc51: public cl_uc
{
public:
  // Options
  bool debug;
  bool stop_at_it;
int jaj;
  // Data for breakpoint handling
  struct event_rec event_at;

  FILE *serial_in;	// Serial line input
  FILE *serial_out;	// Serial line output

  class cl_mem *sfr, *iram;

protected:
  struct termios saved_attributes_in; // Attributes of serial interface
  struct termios saved_attributes_out;

  // Help to detect external it requests (falling edge)
  uchar prev_p1;	// Prev state of P1
  uchar prev_p3;	// Prev state of P3
  
  // Seral line simulation
  uchar s_in;		// Serial channel input reg
  uchar s_out;		// Serial channel output reg
  bool  s_sending;	// Transmitter is working
  bool  s_receiving;	// Receiver is working
  int   s_rec_bit;	// Bit counter of receiver
  int   s_tr_bit;	// Bit counter of transmitter
  int   s_rec_t1;	// T1 overflows for receiving
  int   s_tr_t1;	// T1 overflows for sending
  int   s_rec_tick;	// Machine cycles for receiving
  int   s_tr_tick;	// Machine cycles for sending

  // Simulation of interrupt system
  bool  was_reti;	// Instruction had an effect on IE

public:
  int result;		// result of instruction execution

  t_uc51(int Itype, int Itech,
	 class cl_sim *asim);
  ~t_uc51(void);
  virtual int    init(void);
  virtual char  *id_string(void);
  virtual void mk_hw_elements(void);
  virtual class cl_mem *mk_mem(enum mem_class type, char *class_name);

          void   write_rom(t_addr addr, ulong data);
  virtual int clock_per_cycle(void) { return(12); }
  virtual struct dis_entry *dis_tbl(void);
  virtual struct name_entry *sfr_tbl(void);
  virtual struct name_entry *bit_tbl(void);
  //virtual char   *disass(uint addr, char *sep);
  virtual char *disass(t_addr addr, char *sep);
  virtual void   print_regs(class cl_console *con);
  virtual bool   extract_bit_address(t_addr bit_address,
				     class cl_mem **mem,
				     t_addr *mem_addr,
				     t_mem *bit_mask);
  virtual void   reset(void);
  virtual void   clear_sfr(void);
  virtual void   analyze(t_addr addr);
  virtual void   set_p_flag(void);
  virtual void   proc_write(uchar *addr);
  virtual void   proc_write_sp(uchar val);
  virtual uchar  *get_bit(uchar bitaddr);
  virtual uchar  *get_bit(uchar bitaddr, t_addr *ev_i, t_addr *ev_s);
  virtual int    it_priority(uchar ie_mask);

  virtual int    do_inst(int step);

protected:
  virtual int  do_hardware(int cycles);
  virtual int  do_interrupt(void);
  virtual int  accept_it(class it_level *il);
  virtual int  serial_bit_cnt(int mode);
  virtual int  do_serial(int cycles);
  virtual void received(int c);
  virtual int  do_timers(int cycles);
  virtual int  do_timer0(int cycles);
  virtual int  t0_overflow(void);
  virtual int  do_timer1(int cycles);
  virtual int  do_wdt(int cycles);
  virtual int  idle_pd(void);
  virtual int  tick(int cycles);
  virtual int  check_events(void);

  virtual uchar *get_direct(t_mem addr, t_addr *ev_i, t_addr *ev_s);
  virtual uchar *get_indirect(uchar addr, int *res);
  virtual uchar *get_reg(uchar regnum);
  virtual uchar *get_reg(uchar regnum, t_addr *event);
  virtual uchar get_bitidx(uchar bitaddr);
  virtual uchar read(uchar *addr);
  virtual void  pre_inst(void);
  virtual int   exec_inst(void);
  virtual void  post_inst(void);

  virtual int inst_unknown(uchar code);
  virtual int inst_nop(uchar code);			/* 00 */
  virtual int inst_ajmp_addr(uchar code);		/* [02468ace]1 */
  virtual int inst_ljmp(uchar code);			/* 02 */
  virtual int inst_rr(uchar code);			/* 03 */
  virtual int inst_inc_a(uchar code);			/* 04 */
  virtual int inst_inc_addr(uchar code);		/* 05 */
  virtual int inst_inc_$ri(uchar code);			/* 06,07 */
  virtual int inst_inc_rn(uchar code);			/* 08-0f */
  virtual int inst_jbc_bit_addr(uchar code);		/* 10 */
  virtual int inst_acall_addr(uchar code);		/* [13579bdf]1 */
  virtual int inst_lcall(uchar code, uint addr);	/* 12 */
  virtual int inst_rrc(uchar code);			/* 13 */
  virtual int inst_dec_a(uchar code);			/* 14 */
  virtual int inst_dec_addr(uchar code);		/* 15 */
  virtual int inst_dec_$ri(uchar code);			/* 16,17 */
  virtual int inst_dec_rn(uchar code);			/* 18-1f */
  virtual int inst_jb_bit_addr(uchar code);		/* 20 */
  virtual int inst_ret(uchar code);			/* 22 */
  virtual int inst_rl(uchar code);			/* 23 */
  virtual int inst_add_a_$data(uchar code);		/* 24 */
  virtual int inst_add_a_addr(uchar code);		/* 25 */
  virtual int inst_add_a_$ri(uchar code);		/* 26,27 */
  virtual int inst_add_a_rn(uchar code);		/* 28-2f */
  virtual int inst_jnb_bit_addr(uchar code);		/* 30 */
  virtual int inst_reti(uchar code);			/* 32 */
  virtual int inst_rlc(uchar code);			/* 33 */
  virtual int inst_addc_a_$data(uchar code);		/* 34 */
  virtual int inst_addc_a_addr(uchar code);		/* 35 */
  virtual int inst_addc_a_$ri(uchar code);		/* 36,37 */
  virtual int inst_addc_a_rn(uchar code);		/* 38-3f */
  virtual int inst_jc_addr(uchar code);			/* 40 */
  virtual int inst_orl_addr_a(uchar code);		/* 42 */
  virtual int inst_orl_addr_$data(uchar code);		/* 43 */
  virtual int inst_orl_a_$data(uchar code);		/* 44 */
  virtual int inst_orl_a_addr(uchar code);		/* 45 */
  virtual int inst_orl_a_$ri(uchar code);		/* 46,47 */
  virtual int inst_orl_a_rn(uchar code);		/* 48-4f */
  virtual int inst_jnc_addr(uchar code);		/* 50 */
  virtual int inst_anl_addr_a(uchar code);		/* 52 */
  virtual int inst_anl_addr_$data(uchar code);		/* 53 */
  virtual int inst_anl_a_$data(uchar code);		/* 54 */
  virtual int inst_anl_a_addr(uchar code);		/* 55 */
  virtual int inst_anl_a_$ri(uchar code);		/* 56,57 */
  virtual int inst_anl_a_rn(uchar code);		/* 58-5f */
  virtual int inst_jz_addr(uchar code);			/* 60 */
  virtual int inst_xrl_addr_a(uchar code);		/* 62 */
  virtual int inst_xrl_addr_$data(uchar code);		/* 63 */
  virtual int inst_xrl_a_$data(uchar code);		/* 64 */
  virtual int inst_xrl_a_addr(uchar code);		/* 65 */
  virtual int inst_xrl_a_$ri(uchar code);		/* 66,67 */
  virtual int inst_xrl_a_rn(uchar code);		/* 68-6f */
  virtual int inst_jnz_addr(uchar code);		/* 70 */
  virtual int inst_orl_c_bit(uchar code);		/* 72 */
  virtual int inst_jmp_$a_dptr(uchar code);		/* 73 */
  virtual int inst_mov_a_$data(uchar code);		/* 74 */
  virtual int inst_mov_addr_$data(uchar code);		/* 75 */
  virtual int inst_mov_$ri_$data(uchar code);		/* 76,77 */
  virtual int inst_mov_rn_$data(uchar code);		/* 78-7f */
  virtual int inst_sjmp(uchar code);			/* 80 */
  virtual int inst_anl_c_bit(uchar code);		/* 82 */
  virtual int inst_movc_a_$a_pc(uchar code);		/* 83 */
  virtual int inst_div_ab(uchar code);			/* 84 */
  virtual int inst_mov_addr_addr(uchar code);		/* 85 */
  virtual int inst_mov_addr_$ri(uchar code);		/* 86,87 */
  virtual int inst_mov_addr_rn(uchar code);		/* 88-8f */
  virtual int inst_mov_dptr_$data(uchar code);		/* 90 */
  virtual int inst_mov_bit_c(uchar code);		/* 92 */
  virtual int inst_movc_a_$a_dptr(uchar code);		/* 93 */
  virtual int inst_subb_a_$data(uchar code);		/* 94 */
  virtual int inst_subb_a_addr(uchar code);		/* 95 */
  virtual int inst_subb_a_$ri(uchar code);		/* 96,97 */
  virtual int inst_subb_a_rn(uchar code);		/* 98-9f */
  virtual int inst_mov_c_bit(uchar code);		/* a2 */
  virtual int inst_inc_dptr(uchar code);		/* a3 */
  virtual int inst_mul_ab(uchar code);			/* a4 */
  virtual int inst_mov_$ri_addr(uchar code);		/* a6,a7 */
  virtual int inst_mov_rn_addr(uchar code);		/* a8-af */
  virtual int inst_anl_c_$bit(uchar code);		/* b0 */
  virtual int inst_cpl_bit(uchar code);			/* b2 */
  virtual int inst_cpl_c(uchar code);			/* b3 */
  virtual int inst_cjne_a_$data_addr(uchar code);	/* b4 */
  virtual int inst_cjne_a_addr_addr(uchar code);	/* b5 */
  virtual int inst_cjne_$ri_$data_addr(uchar code);	/* b6,b7 */
  virtual int inst_cjne_rn_$data_addr(uchar code);	/* b8-bf */
  virtual int inst_push(uchar code);			/* c0 */
  virtual int inst_clr_bit(uchar code);			/* c2 */
  virtual int inst_clr_c(uchar code);			/* c3*/
  virtual int inst_swap(uchar code);			/* c4 */
  virtual int inst_xch_a_addr(uchar code);		/* c5 */
  virtual int inst_xch_a_$ri(uchar code);		/* c6,c7 */
  virtual int inst_xch_a_rn(uchar code);		/* c8-cf */
  virtual int inst_pop(uchar code);			/* d0 */
  virtual int inst_setb_bit(uchar code);		/* d2 */
  virtual int inst_setb_c(uchar code);			/* d3 */
  virtual int inst_da_a(uchar code);			/* d4 */
  virtual int inst_djnz_addr_addr(uchar code);		/* d5 */
  virtual int inst_xchd_a_$ri(uchar code);		/* d6,d7 */
  virtual int inst_djnz_rn_addr(uchar code);		/* d8-df */
  virtual int inst_movx_a_$dptr(uchar code);		/* e0 */
  virtual int inst_movx_a_$ri(uchar code);		/* e2,e3 */
  virtual int inst_clr_a(uchar code);			/* e4 */
  virtual int inst_mov_a_addr(uchar code);		/* e5 */
  virtual int inst_mov_a_$ri(uchar code);		/* e6,e7 */
  virtual int inst_mov_a_rn(uchar code);		/* e8-ef */
  virtual int inst_movx_$dptr_a(uchar code);		/* f0 */
  virtual int inst_movx_$ri_a(uchar code);		/* f2,f3 */
  virtual int inst_cpl_a(uchar code);			/* f4 */
  virtual int inst_mov_addr_a(uchar code);		/* f5 */
  virtual int inst_mov_$ri_a(uchar code);		/* f6,f7 */
  virtual int inst_mov_rn_a(uchar code);		/* f8-ff */
};


#endif

/* End of s51.src/uc51cl.h */

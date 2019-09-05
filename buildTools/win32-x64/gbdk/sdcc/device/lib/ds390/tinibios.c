/*-------------------------------------------------------------------------
  tinibios.c - startup and serial routines for the DS80C390 (tested on TINI)
  
   Written By - Johan Knol, johan.knol@iduna.nl
    
   This program is free software; you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation; either version 2, or (at your option) any
   later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
   
   In other words, you are welcome to use, share and improve this program.
   You are forbidden to forbid anyone else to use, share and improve
   what you give them.   Help stamp out software-hoarding!  
-------------------------------------------------------------------------*/

#include <tinibios.h>
#include <stdio.h>

#define TIMED_ACCESS(sfr,value) { TA=0xaa; TA=0x55; sfr=value; }
 
unsigned char _sdcc_external_startup(void)
{
  IE=0; // disable ALL interrupts

  // use A19..16 and !CE3..0, no CAN
  TIMED_ACCESS(P4CNT,0x3f);

  // use !PCE3..0, serial 1 at P5.2/3
  TIMED_ACCESS(P5CNT,0x27);

  // disable watchdog
  EWT=0;

  // watchdog set to 9.1 seconds
  // CKCON|=0xc0;

  // default stretch cycles for MOVX
  //CKCON = (CKCON&0xf8)|(CPU_MOVX_STRETCH&0x07);
  CKCON=0xf9;

  // use internal 4k RAM as data(stack) memory at 0x400000 and
  // move CANx memory access to 0x401000 and upwards
  // use !CE* for program and/or data memory access
  TIMED_ACCESS(MCON,0xaf);

  // select default cpu speed
  CpuSpeed(CPU_SPEED);

  _asm
    ; save the 24-bit return address
    pop ar2; msb
    pop ar1
    pop ar0; lsb


    mov _TA,#0xaa; timed access
    mov _TA,#0x55
    mov _ACON,#0x06; 24 bit addresses, 10 bit stack at 0x400000

    mov _ESP,#0x00; reinitialize the stack
    mov _SP,#0x00

    ; restore the 24-bit return address
    push ar0; lsb
    push ar1
    push ar2; msb
  _endasm;

  // Copy the Interrupt Vector Table (128 bytes) from 0x10000 to 0x100000
  // This isn't needed for older bootloaders than the 0515, but it won't harm
  _asm
  push dpx
  push dph
  push dpl
  push dps
  push b
  push acc
  mov dps,#0x00 ; make sure no autoincrement in progress
  mov dptr,#0x10000 ; from
  inc dps ; switch to alternate dptr
  mov dptr,#0x100000 ; to
  mov b,#0x80 ; count

_Startup390CopyIVT:
  inc dps
  movx a,@dptr
  inc dptr
  inc dps
  movx @dptr,a
  inc dptr
  djnz b,_Startup390CopyIVT

  pop acc
  pop b
  pop dps
  pop dpl
  pop dph
  pop dpx
  _endasm;

  // global interrupt enable, all masks cleared
  // let the Gods be with us :)
  IE = 0x80; 

  Serial0Init(SERIAL_0_BAUD,1);
  //Serial1Init(SERIAL_1_BAUD,1);
  ClockInit();
  //RtcInit();
  //WatchDogInit();

  // signal _sdcc_gsinit_startup to initialize data (call _sdcc_init_data)
  return 0; 
}

/* Set the cpu speed in clocks per machine cycle, valid values are:
   1024: Power management mode
      4: Divide-by-4 mode
      2: Use frequency multiplier (2x)
      1: Use frequency multiplier (4x) (Don't do this on a TINI at 18.432MHz)

   TODO: TINI seems to support only 2 and 4: write only bits in PMR ?
*/

unsigned int cpuSpeed;

void CpuSpeed(unsigned int speed) {

  while (0 && (EXIF&0x04))
    ; // cpu operates from ring buffer
  PMR = 0x80; // div4, CTM off, multiplier 2x
  switch (speed) 
    {
    case 1:
      PMR=0x88; // div4, CTM off, multiplier 4x
      PMR=0x98; // div4, CTM on, multiplier 4x
      while ((EXIF&0x08)==0) {
	; // wait for the multiplier to be ready
      }
      PMR = 0x18; // use multiplier
      cpuSpeed=speed;
      break;
    case 2:
      PMR=0x90; // div4, CTM on, multilier 2x
      while ((EXIF&0x08)==0) {
	; // wait for the multiplier to be ready
      }
      PMR = 0x10; // use multiplier
      cpuSpeed=speed;
      break;
    case 4:
      // nothing to do
      cpuSpeed=speed;
      break;
    case 1024:
      PMR = 0xc0; // div1024, CTM off
      cpuSpeed=speed;
      break;
    }
}  

// now the serial0 stuff

// just to make the code more readable 
#define S0RBS SERIAL_0_RECEIVE_BUFFER_SIZE

// this is a ring buffer and can overflow at anytime!
static volatile unsigned char receive0Buffer[S0RBS];
static volatile int receive0BufferHead=0;
static volatile int receive0BufferTail=0;
// no buffering for transmit
static volatile char transmit0IsBusy=0;

static data unsigned char serial0Buffered;

/* Initialize serial0.

   Available baudrates are from 110 upto 115200 (using 16-bit timer 2)
   If baud==0, the port is disabled.

   If buffered!=0, characters received are buffered using an interrupt
*/

void Serial0Init (unsigned long baud, unsigned char buffered) {
  
  if (baud==0) {
    ES0=0; // disable interrupts
    SCON0 &= 0xef; // disable receiver
    return;
  }

  ES0 = 0; // disable serial channel 0 interrupt
  TR2 = 0; // stop timer 2
  
  // set 8 bit uart with variable baud from timer 1/2
  // enable receiver and clear RI and TI
  SCON0 = 0x50;
  
  PCON |= 0x80; // clock is 16x bitrate
  CKCON|=0x20; // timer uses xtal/4
  
  T2MOD=0; // no fancy functions
  T2CON=0x34; // start timer as a baudrate generator for serial0
  
  // set the baud rate
  Serial0Baud(baud);
  
  serial0Buffered=buffered;
 
 if (buffered) {
    RI_0=TI_0=0; // clear "pending" interrupts
    ES0 = 1; // enable serial channel 0 interrupt
  } else {
    RI_0=0; // receive buffer empty
    TI_0=1; // transmit buffer empty
  }
}

void Serial0Baud(unsigned long baud) {
  TR2=0; // stop timer
  baud=-((long)OSCILLATOR/(32*baud));
  TL2=RCAP2L= baud;
  TH2=RCAP2H= baud>>8;
  TF2=0; // clear overflow flag
  TR2=1; // start timer
}  

void Serial0IrqHandler (void) interrupt 4 {
  if (RI_0) {
    receive0Buffer[receive0BufferHead]=SBUF0;
    receive0BufferHead=(receive0BufferHead+1)&(S0RBS-1);
    if (receive0BufferHead==receive0BufferTail) {
      /* buffer overrun, sorry :) */
      receive0BufferTail=(receive0BufferTail+1)&(S0RBS-1);
    }
    RI_0=0;
  }
  if (TI_0) {
    TI_0=0;
    transmit0IsBusy=0;
  }
}

char Serial0CharArrived(void) {
  if (serial0Buffered) {
    if (receive0BufferHead!=receive0BufferTail)
      return receive0Buffer[receive0BufferTail];
  } else {
    if (RI_0)
      return SBUF0;
  }
  return 0;
}

void Serial0PutChar (char c)
{
  if (serial0Buffered) {
    while (transmit0IsBusy)
      ;
    transmit0IsBusy=1;
    SBUF0=c;
  } else {
    while (!TI_0)
      ;
    SBUF0=c;
    TI_0=0;
  }
}

char Serial0GetChar (void)
{
  char c;
  if (serial0Buffered) {
    while (receive0BufferHead==receive0BufferTail)
      ;
    c=receive0Buffer[receive0BufferTail];
    ES0=0; // disable serial interrupts
    receive0BufferTail=(receive0BufferTail+1)&(S0RBS-1);
    ES0=1; // enable serial interrupts
  } else {
    while (!RI_0)
      ;
    c=SBUF0;
    RI_0=0;
  }
  return c;
}

void Serial0SendBreak() {
  P3 &= ~0x02;
  ClockMilliSecondsDelay(2);
  P3 |= 0x02;
}

void Serial0Flush() {
  ES0=0; // disable interrupts
  receive0BufferHead=receive0BufferTail=0;
  RI_0=0;
  if (serial0Buffered) {
    TI_0=0;
    ES0=1; // enable interrupts
  } else {
    TI_0=1;
  }
}

/* now let's go for the serial1 stuff, basically it's a replicate of 
   serial0 except it uses timer 1
*/

// just to make the code more readable 
#define S1RBS SERIAL_1_RECEIVE_BUFFER_SIZE

// this is a ring buffer and can overflow at anytime!
static volatile unsigned char receive1Buffer[S1RBS];
static volatile int receive1BufferHead=0;
static volatile int receive1BufferTail=0;
// no buffering for transmit
static volatile char transmit1IsBusy=0;

static data unsigned char serial1Buffered;

/* Initialize serial1.

   Available baudrates are from 4800 upto 115200 (using 8-bit timer 1)
   If baud==0, the port is disabled.

   If buffered!=0, characters received are buffered using an interrupt
*/

void Serial1Init (unsigned long baud, unsigned char buffered) {
  
  if (baud==0) {
    ES1=0; // disable interrupt
    SCON1 &= 0xef; // disable receiver
    return; // and don't touch it
  }

  ES1 = 0; // disable channel 1 interrupt
  TR1 = 0; // stop timer 1
  
  // set 8 bit uart with variable baud from timer 1
  // enable receiver and clear RI and TI
  SCON1 = 0x50;
  
  WDCON |= 0x80; // clock is 16x bitrate
  CKCON|=0x10; // timer uses xtal/4
  
  TMOD = (TMOD&0x0f) | 0x20; // timer 1 is an 8bit auto-reload counter
  
  // set the baud rate
  Serial1Baud(baud);
  
  serial1Buffered=buffered;

  if (buffered) {
    RI_1=TI_1=0; // clear "pending" interrupts
    ES1 = 1; // enable serial channel 1 interrupt
  } else {
    RI_1=0; // receive buffer empty
    TI_1=1; // transmit buffer empty
  }
}

void Serial1Baud(unsigned long baud) {
  TR1=0; // stop timer
  baud=-((long)OSCILLATOR/(32*baud));
  TL1=TH1 = baud;
  TF1=0; // clear overflow flag
  TR1=1; // start timer
}  

void Serial1IrqHandler (void) interrupt 7 {
  if (RI_1) {
    receive1Buffer[receive1BufferHead]=SBUF1;
    receive1BufferHead=(receive1BufferHead+1)&(S1RBS-1);
    if (receive1BufferHead==receive1BufferTail) /* buffer overrun, sorry :) */
      receive1BufferTail=(receive1BufferTail+1)&(S1RBS-1);
    RI_1=0;
  }
  if (TI_1) {
    TI_1=0;
    transmit1IsBusy=0;
  }
}

char Serial1CharArrived(void) {
  if (serial1Buffered) {
    if (receive1BufferHead!=receive1BufferTail)
      return receive1Buffer[receive1BufferTail];
  } else {
    if (RI_1)
      return SBUF1;
  }
  return 0;
}

void Serial1PutChar (char c)
{
  if (serial1Buffered) {
    while (transmit1IsBusy)
      ;
    transmit1IsBusy=1;
    SBUF1=c;
  } else {
    while (!TI_1)
      ;
    SBUF1=c;
    TI_1=0;
  }
}

char Serial1GetChar (void)
{
  char c;
  if (serial1Buffered) {
    while (receive1BufferHead==receive1BufferTail)
      ;
    c=receive1Buffer[receive1BufferTail];
    ES1=0; // disable serial interrupts
    receive1BufferTail=(receive1BufferTail+1)&(S1RBS-1);
    ES1=1; // enable serial interrupts
  } else {
    while (!RI_1)
      ;
    c=SBUF1;
    RI_1=0;
  }
  return c;
}

void Serial1SendBreak() {
  P5 &= ~0x08;
  ClockMilliSecondsDelay(2);
  P5 |= 0x08;
}

void Serial1Flush() {
  ES1=0; // disable interrupts
  receive1BufferHead=receive1BufferTail=0;
  RI_1=0;
  if (serial1Buffered) {
    TI_1=0;
    ES1=1; // enable interrupts
  } else {
    TI_1=1;
  }
}

// now let's go for the clock stuff

// these REALLY need to be in data space for the irq routine!
static data unsigned long milliSeconds=0;
static data unsigned int timer0ReloadValue;

void ClockInit() {
  unsigned long timerReloadValue=OSCILLATOR/1000;

  switch (cpuSpeed) {
  case 4: timerReloadValue/=4; break;
  case 1: // not tested yet
  case 2:  // not tested yet
  default: timerReloadValue/=2; break;
  }
  timer0ReloadValue=~timerReloadValue;
  // initialise timer 0
  ET0=0; // disable timer interrupts initially
  TCON = (TCON&0xcc)|0x00; // stop timer, clear overflow
  TMOD = (TMOD&0xf0)|0x01; // 16 bit counter
  CKCON|=0x08; // timer uses xtal/4
  
  TL0=timer0ReloadValue&0xff;
  TH0=timer0ReloadValue>>8;
  
  ET0=1; // enable timer interrupts
  TR0=1; // start timer
}

// This needs to be SUPER fast. What we really want is:

#if 0
void junk_ClockIrqHandler (void) interrupt 10 {
  TL0=timer0ReloadValue&0xff;
  TH0=timer0ReloadValue>>8;
  milliSeconds++;
}
#else
// but look at the code, and the pushes and pops, so:
void ClockIrqHandler (void) interrupt 1 _naked
{
  _asm
    push acc
    push psw
    mov _TL0,_timer0ReloadValue
    mov _TH0,_timer0ReloadValue+1
    clr a
    inc _milliSeconds+0
    cjne a,_milliSeconds+0,_ClockIrqHandlerDone
    inc _milliSeconds+1
    cjne a,_milliSeconds+1,_ClockIrqHandlerDone
    inc _milliSeconds+2
    cjne a,_milliSeconds+2,_ClockIrqHandlerDone
    inc _milliSeconds+3
   _ClockIrqHandlerDone:
    pop psw
    pop acc
    reti
  _endasm;
}
#endif

// we can't just use milliSeconds
unsigned long ClockTicks(void) {
  unsigned long ms;
  ET0=0;
  ms=milliSeconds;
  ET0=1;
  return ms;
}

void ClockMilliSecondsDelay(unsigned long delay) {
  long ms=ClockTicks()+delay;

  while (ms>ClockTicks())
    ;
}

// stolen from Kevin Vigor, works only for TINI at default speed
void ClockMicroSecondsDelay(unsigned int delay) {
   delay; /* shut compiler up. */
   
   _asm
     
   ; delay is in dpl/dph
   mov	r0, dpl
   mov  r1, dph
   
   mov	a, r0
   orl  a, r1			; quick out for zero case.
   jz   _usDelayDone
   
   inc	r1
   cjne r0, #0, _usDelayLoop
   dec  r1
   
   _usDelayLoop:
   nop
   nop
   nop
   nop
   nop
   nop
   nop				; 7 nops
   djnz r0, _usDelayLoop	; 3 cycles x 1 = 3 cycles
      				; 10 cycles per iter
				; we want 9.216, but more is better
      				; than less.
   djnz r1, _usDelayLoop	
_usDelayDone:
   
   _endasm;
  
}

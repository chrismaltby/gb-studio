#include "8051.h"

#include "hw.h"

// timer 0 used for systemclock
#define TIMER0_RELOAD_VALUE -OSCILLATOR/12/1000 // 0.999348ms for 11.059Mhz

// timer 1 used for baudrate generator
#define TIMER1_RELOAD_VALUE -(2*OSCILLATOR)/(32*12*BAUD)

static long data milliSeconds;

void ClockIrqHandler (void) interrupt 1 using 3 {
  TL0 = TIMER0_RELOAD_VALUE&0xff;
  TH0 = TIMER0_RELOAD_VALUE>>8;
  milliSeconds++;
}

// we can't just use milliSeconds
unsigned long ClockTicks(void) {
  unsigned long ms;
  ET0=0;
  ms=milliSeconds;
  ET0=1;
  return ms;
}

unsigned char _sdcc_external_startup() {
  // initialize timer0 for system clock
  TR0=0; // stop timer 0
  TMOD =(TMOD&0xf0)|0x01; // T0=16bit timer
  // timeout is xtal/12
  TL0 = -TIMER0_RELOAD_VALUE&0xff;
  TH0 = -TIMER0_RELOAD_VALUE>>8;
  milliSeconds=0; // reset system time
  TR0=1; // start timer 0
  ET0=1; // enable timer 0 interrupt
  
  // initialize timer1 for baudrate
  TR1=0; // stop timer 1
  TMOD = (TMOD&0x0f)|0x20; // T1=8bit autoreload timer
  // baud = ((2^SMOD)*xtal)/(32*12*(256-TH1))
  PCON |= 0x80; // SMOD=1: double baudrate
  TH1=TL1=TIMER1_RELOAD_VALUE;
  TR1=1; // start timer 1

  // initialize serial port
  SCON=0x52; // mode 1, ren, txrdy, rxempty

  EA=1; // enable global interrupt

  return 0;
}

char getchar() {
  char c;
  while (!RI)
    ;
  RI=0;
  c=SBUF;
  return c;
}

void putchar(char c) {
  while (!TI)
    ;
  TI=0;
  SBUF=c;
  if (c=='\n') {
    putchar('\r');
  }
}

#include <reg51.h>

#define BUFSIZE 16
#define T0H 0xfc
#define T0L 0x67

unsigned char buf[BUFSIZE];
unsigned char first_free= 0, last_occupied= 0;
bit transmitting, overflow;
volatile int t0cnt;

void ser_it(void) interrupt 4
{
  unsigned char temp;
  if (RI) {
    buf[first_free]= SBUF;
    first_free= ((temp= first_free)+1) % BUFSIZE;
    if (first_free == last_occupied) {
      first_free= temp;
      overflow= 1;
    }
    RI= 0;
  }
  if (TI) {
    transmitting= 0;
    TI= 0;
  }
}

void t0_it(void) interrupt 1
{
  TL0= T0L;
  TH0= T0H;
  if (t0cnt)
    t0cnt--;
}

char empty(void)
{
  return(first_free == last_occupied);
}

unsigned char get_ch(void)
{
  unsigned char c;
  c= buf[last_occupied];
  last_occupied= (last_occupied+1) % BUFSIZE;
  overflow= 0;
  return(c);
}

void send_ch(unsigned char c)
{
  while (transmitting) ;
  transmitting= 1;
  SBUF= c;
}

void send_str(char *str)
{
  while (*str) {
    send_ch(*str);
    str++;
  }
}

void process(void)
{
  unsigned char c;
  c= get_ch();
  if ((c >= 'a' && c <= 'z') ||
      (c >= 'A' && c <= 'Z'))
    c^= 0x20;
  send_ch(c);
}

void wait(int delay)
{
  t0cnt= delay;
  while (t0cnt)
    PCON|= 1;
}

char test(char c)
{
  return(c+1);
}

void main(void)
{
  t0cnt= 0;
  transmitting= overflow= 0;
  SCON= 0x7c;
  TL1= TH1= 250; /* 9600 baud */
  TH0= T0H;
  TL0= T0L;
  TMOD= 0x21;
  TR0= TR1= 1;
  ES= ET0= 1;
  EA= 1;
  send_str("\nOK\n");
  test(0);
  wait(1000);
  test(1);
  send_str("delay off\n");
  for (;;) {
    if (!empty()) {
      if (overflow) {
	send_str("Overflow!\n");
      }
      process();
    }
  }
}

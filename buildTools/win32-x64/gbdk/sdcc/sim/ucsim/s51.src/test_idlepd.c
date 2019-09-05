#include <reg51.h>

sfr at 0xa6 WDTRST;

void jaj_ex0() interrupt 0 { P2= P0; }

void jaj_t0() interrupt 1 { P2= P0; }

void main()
{
  TH0= 0x80;
  TL0= 0x80;
  TMOD= 0x02;

  IT0=0; /* low level triggered */
  IT0=1; /* falling edge triggered */
  EX0=1; /* enable ex #0 */
  ET0=1; /* en t0 */
  
  TR0= 1;

  EA=1;
  P0=0;
  while (1)
    {
      P0= 0;
      PCON|= 1;/*idle*/
      P0++;
      P0++;
      P0++;
    }
  WDTRST= 0x1e;
  WDTRST= 0xe1;
  PCON|= 2;/*pd*/
}

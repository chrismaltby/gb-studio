/*-------------------------------------------------------------------------
  rtc390.c - time demo using the DS1315 (tested on TINI)
  
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

#include <stdio.h>
#include <ctype.h>

// until we have a decent scanf:
int ScanInt(int current) {
  char reply[32], *r;

  gets(reply);
  if (isdigit(*(r=reply))) {
    current=0;
    do {
      current*=10;
      current+=(*r++)-'0';
    } while (isdigit(*r));
  }
  return current;
}

char GetTime(struct tm *rtcTime) {
  printf ("Enter year [%d]: ", rtcTime->tm_year+1900);
  rtcTime->tm_year=ScanInt(rtcTime->tm_year+1900);
  printf ("Enter month [%d]: ", rtcTime->tm_mon+1);
  rtcTime->tm_mon=ScanInt(rtcTime->tm_mon)-1;
  printf ("Enter day [%d]: ", rtcTime->tm_mday);
  rtcTime->tm_mday=ScanInt(rtcTime->tm_mday);
  printf ("Enter hour [%d]: ", rtcTime->tm_hour);
  rtcTime->tm_hour=ScanInt(rtcTime->tm_hour);
  printf ("Enter minute [%d]: ", rtcTime->tm_min);
  rtcTime->tm_min=ScanInt(rtcTime->tm_min);
  printf ("Enter second [%d]: ", rtcTime->tm_sec);
  rtcTime->tm_sec=ScanInt(rtcTime->tm_sec);
  return 1;
}

void PrintTime(struct tm *rtcTime, char verbose) {

  printf ("%s%04d-%02d-%02d %02d:%02d:%02d.%02d\n", 
	  verbose ? "RTC time: " : "",
	  rtcTime->tm_year+1900, rtcTime->tm_mon+1, rtcTime->tm_mday,
	  rtcTime->tm_hour, rtcTime->tm_min, rtcTime->tm_sec,
	  rtcTime->tm_hundredth);

  if (verbose) {
    time_t calendarTime=mktime(rtcTime);
    printf ("Seconds since 00:00:00 Jan 01 1970: %ld\n", calendarTime);
  }
}

void main (void) {
  struct tm rtcTime, *now;
  time_t calendarTime;
  char seconds=-1;

  printf ("\nStarting RTC demo.\n");

  RtcRead(&rtcTime);
  PrintTime(&rtcTime,1);

  while(1) {
    calendarTime=time(0);
    now=localtime(&calendarTime);

    if (now->tm_sec!=seconds) {
      printf(ctime(&calendarTime));
      seconds=now->tm_sec;
    }

    if (Serial0CharArrived()) {
      switch (getchar()) 
	{
	case 0:
	  break;
	case 'q': 
	  printf ("Ok.\n");
	  return;
	default:
	  RtcRead(&rtcTime);
	  if (GetTime(&rtcTime)) {
	    RtcWrite(&rtcTime);
	    printf ("Time written.\n");
	  }
	}
    }
  }
}


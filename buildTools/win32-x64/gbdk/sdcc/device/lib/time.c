/*-------------------------------------------------------------------------
  time.c - stdlib time conversion routines
  
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
#include <time.h>

#define FIXDS390BUG (long)

// please note that the tm structure has the years since 1900,
// but time returns the seconds since 1970

/* You need some kind of real time clock for the time() function.
   Either a rtc-chip or some kind of DCF device will do. For TINI, the 
   HAVE_RTC is defined in tinibios.h
   If not, the conversion routines still work.
*/

#ifndef HAVE_RTC
unsigned char RtcRead(struct tm *timeptr) {
  // no real time hardware 
  timeptr; // hush the compiler
  return 0;
}
#endif

// return the calendar time, seconds since the Epoch (Jan 1 1970 00:00:00)
time_t time(time_t *timeptr) {
  struct tm now;
  time_t t=-1;

  if (RtcRead(&now)) {
    t=mktime(&now);
  }
  if (timeptr) {
    *timeptr=t;
  }
  return t;
}

static _CODE char monthDays[]={31,28,31,30,31,30,31,31,30,31,30,31};

_CODE char * _CODE __month[]={"Jan","Feb","Mar","Apr","May","Jun",
			      "Jul","Aug","Sep","Oct","Nov","Dec"};

_CODE char * _CODE __day[]={"Sun","Mon","Tue","Wed","Thu","Fri","Sat"};

static char ascTimeBuffer[32];

// validate the tm structure
static void CheckTime(struct tm *timeptr) {
    // we could do some normalization here, e.g.
    // change 40 october to 9 november
    if (timeptr->tm_sec<0) timeptr->tm_sec=0;
    else if (timeptr->tm_sec>59) timeptr->tm_sec=59;
    if (timeptr->tm_min<0) timeptr->tm_min=0;
    else if (timeptr->tm_min>59) timeptr->tm_min=59;
    if (timeptr->tm_hour<0) timeptr->tm_hour=0;
    else if (timeptr->tm_hour>23) timeptr->tm_hour=23;
    if (timeptr->tm_wday<0) timeptr->tm_wday=0;
    else if (timeptr->tm_wday>6) timeptr->tm_wday=6;
    if (timeptr->tm_mday<1) timeptr->tm_mday=1;
    else if (timeptr->tm_mday>31) timeptr->tm_mday=31;
    if (timeptr->tm_mon<0) timeptr->tm_mon=0;
    else if (timeptr->tm_mon>11) timeptr->tm_mon=11;
    if (timeptr->tm_year<0) timeptr->tm_year=0;
}

// format the time into "Sat Feb 17 17:45:23 2001\n"
char *asctime(struct tm *timeptr) {
  CheckTime(timeptr);
  sprintf (ascTimeBuffer, "%s %s %2d %02d:%02d:%02d %04d\n",
	   __day[timeptr->tm_wday], __month[timeptr->tm_mon], timeptr->tm_mday,
	   timeptr->tm_hour, timeptr->tm_min, timeptr->tm_sec, 
	   timeptr->tm_year+1900);
  return ascTimeBuffer;
}

char *ctime(time_t *timep) {
  return asctime(localtime(timep));
}

static struct tm lastTime;

/* convert calendar time (seconds since 1970) to broken-time
   This only works for dates between 01-01-1970 00:00:00 and 
   19-01-2038 03:14:07

   A leap year is ((((year%4)==0) && ((year%100)!=0)) || ((year%400)==0)) 
   but since we have no fancy years between 1970 and 2038 we can do:
*/

#define LEAP_YEAR(year) ((year%4)==0)

// forget about timezones for now
struct tm *localtime(time_t *timep) {
    return gmtime(timep);
}

struct tm *gmtime(time_t *timep) {
  unsigned long epoch=*timep;
  unsigned int year;
  unsigned char month, monthLength;
  unsigned long days;
  
  lastTime.tm_sec=epoch%60;
  epoch/=60; // now it is minutes
  lastTime.tm_min=epoch%60;
  epoch/=60; // now it is hours
  lastTime.tm_hour=epoch%24;
  epoch/=24; // now it is days
  lastTime.tm_wday=(epoch+4)%7;
  
  year=1970;
  days=0;
  while((days += (LEAP_YEAR(year) ? 366 : 365)) <= epoch) {
    year++;
  }
  lastTime.tm_year=year-1900;
  
  days -= LEAP_YEAR(year) ? 366 : 365;
  epoch -= days; // now it is days in this year, starting at 0
  lastTime.tm_yday=epoch;
  
  days=0;
  month=0;
  monthLength=0;
  for (month=0; month<12; month++) {
    if (month==1) { // februari
      if (LEAP_YEAR(year)) {
	monthLength=29;
      } else {
	monthLength=28;
      }
    } else {
      monthLength = monthDays[month];
    }
    
    if (epoch>=monthLength) {
      epoch-=monthLength;
    } else {
	break;
    }
  }
  lastTime.tm_mon=month;
  lastTime.tm_mday=epoch+1;
  
  lastTime.tm_isdst=0;
  
  return &lastTime;
}

// convert broken time to calendar time (seconds since 1970)
time_t mktime(struct tm *timeptr) {
    int year=timeptr->tm_year+1900, month=timeptr->tm_mon, i;
    long seconds;
    
    CheckTime(timeptr);

    // seconds from 1970 till 1 jan 00:00:00 this year
    seconds= FIXDS390BUG (year-1970)*60*60*24*365;

    // add extra days for leap years
    for (i=1970; i<year; i++) {
	if (LEAP_YEAR(i)) {
	    seconds+= FIXDS390BUG 60*60*24;
	}
    }

    // add days for this year
    for (i=0; i<month; i++) {
      if (i==1 && LEAP_YEAR(year)) { 
	seconds+= FIXDS390BUG 60*60*24*29;
      } else {
	seconds+= FIXDS390BUG 60*60*24*monthDays[i];
      }
    }

    seconds+= FIXDS390BUG (timeptr->tm_mday-1)*60*60*24;
    seconds+= FIXDS390BUG timeptr->tm_hour*60*60;
    seconds+= FIXDS390BUG timeptr->tm_min*60;
    seconds+= FIXDS390BUG timeptr->tm_sec;
    return seconds;
}


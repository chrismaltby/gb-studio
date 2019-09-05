//---------------------------------------------------------------------------
// Copyright (C) 2000 Dallas Semiconductor Corporation, All Rights Reserved.
// 
// Permission is hereby granted, free of charge, to any person obtaining a 
// copy of this software and associated documentation files (the "Software"), 
// to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, 
// and/or sell copies of the Software, and to permit persons to whom the 
// Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included 
// in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS 
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
// MERCHANTABILITY,  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
// IN NO EVENT SHALL DALLAS SEMICONDUCTOR BE LIABLE FOR ANY CLAIM, DAMAGES 
// OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR 
// OTHER DEALINGS IN THE SOFTWARE.
// 
// Except as contained in this notice, the name of Dallas Semiconductor 
// shall not be used except as stated in the Dallas Semiconductor 
// Branding Policy. 
//---------------------------------------------------------------------------
//
//  tstfind.C - Test application to search for all 1-Wire devices on 1-Wire 
//              Net.
//
//  Version: 2.00
//
//           1.02 -> 1.03  Removed caps in #includes for Linux capatibility
//                         Removed "ds2480.h", <windows.h> and <conio.h> 
//                           includes because not needed
//                         Added "ownet.h" include to define TRUE/FALSE
//                         Prompt to search again 
//                         Changed to use Acquire/Release 1-Wire Net functions
//           1.03 -> 2.00  Changed 'MLan' to 'ow'. Added support for 
//                         multiple ports.  Don't stop loop at end of each
//                         search round.  
 
#include <stdio.h>
#include <stdlib.h>
#include "ownet.h"

// local funcitons
static void PrintSerialNum(int);

// tini hack
int argc=2;
char *argv[]={__FILE__, "exow"};

//----------------------------------------------------------------------
//  Main for tstfind
//
int main() //short argc, char **argv)
{
   int rslt,cnt;
   char return_msg[128];
   int portnum=0;
  
   // check for required port name
   if (argc != 2)
   {
      printf("1-Wire Net name required on command line!\n"
             " (example: \"COM1\" (Win32 DS2480),\"/dev/cua0\" "
             "(Linux DS2480),\"1\" (Win32 TMEX)\n");
      exit(1);
   }

   // attempt to acquire the 1-Wire Net
   if (!owAcquire(portnum,argv[1],return_msg))
   {  
      printf("%s",return_msg);
      exit(1);
   }

   // success
   printf("%s",return_msg);

   //----------------------------------------
   // Introduction
   printf("\n/---------------------------------------------\n");
   printf("  Loop to find all iButton on 1-Wire Net.\n\n");

   do
   {
      printf("-------------------- Start of search\n");
      cnt = 0;

      // find the first device (all devices not just alarming)
      rslt = owFirst(portnum, TRUE, FALSE);
      while (rslt)
      {
         // print the device number
         cnt++;
         printf("(%d) ",cnt);

         // print the Serial Number of the device just found
         PrintSerialNum(portnum);

         // find the next device
         rslt = owNext(portnum, TRUE, FALSE);
      }
      printf("-------------------- End of search\n\n");

   }
   while (!key_abort());

   // release the 1-Wire Net
   owRelease(portnum,return_msg);
   printf("%s",return_msg);
   exit(0);

   return 0;
}

//----------------------------------------------------------------------
//  Read and print the Serial Number.
//
void PrintSerialNum(int portnum)
{
   uchar serial_num[8];
   int i;

   owSerialNum(portnum,serial_num,TRUE);
   for (i = 7; i >= 0; i--)
      printf("%02X",serial_num[i]);
   printf("\n");
}

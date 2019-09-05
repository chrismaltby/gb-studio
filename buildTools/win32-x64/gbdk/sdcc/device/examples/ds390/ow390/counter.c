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
//  counter.c - Application to read the 1-Wire Net DS2423 - counter.
//               
//             This application uses the files from the 'Public Domain' 
//             1-Wire Net libraries ('general' and 'userial'). 
//
//  Version: 2.00
//

#include <stdio.h>
#include <stdlib.h>
#include "ownet.h"
#include "cnt1d.h"

// defines 
#define MAXDEVICES           20

// local functions
void PrintSerialNum(uchar *SerialNum);

// local serial numbers 
static uchar FamilySN[MAXDEVICES][8];

// tini hack
int argc=2;
char *argv[]={__FILE__, "exow"};

//----------------------------------------------------------------------
//  Main Test for the DS2423 - counter
//
int main() //short argc, char **argv)
{
   char return_msg[128];
   int NumDevices=0;
   int i;
   int CounterPage;
   ulong Count;
   int portnum=0;
      
   //------------------------------------------------------
   // Introduction header
   printf("\n/---------------------------------------------\n");
   printf("  Counter Application - V2.00\n"
          "  The following is a test to excersize a\n"
          "  DS2423 - counter \n\n");
          
   printf("  Press any CTRL-C to stop this program.\n\n");
   printf("  Output   [Serial Number(s) ... Counter Value ... Counter Value ... " 
                         "Counter Value ... Counter Value] \n\n");
      
   // check for required port name
   if (argc != 2)
   {
      printf("1-Wire Net name required on command line!\n"
             " (example: \"COM1\" (Win32 DS2480),\"/dev/cua0\" "
             "(Linux DS2480),\"1\" (Win32 TMEX)\n");
      exit(1);
   }

   // attempt to acquire the 1-Wire Net
   if (!owAcquire(portnum, argv[1], return_msg))
   {  
      printf("%s",return_msg);
      exit(1);
   }

   // success
   printf("%s",return_msg);

   // Find the device(s)
   NumDevices = FindDevices(portnum, &FamilySN[0], 0x1D, MAXDEVICES);
   if (NumDevices>0)
   {
      printf("\n");
      printf("Device(s) Found: \n");
      for (i = 0; i < NumDevices; i++) 
      {
         PrintSerialNum(FamilySN[i]);
         printf("\n");
      }
      printf("\n\n");

      // (stops on CTRL-C)
      do
      {
         // read the current counters
         for (i = 0; i < NumDevices; i++)
         {
            printf("\n");
            PrintSerialNum(FamilySN[i]);
           
            for (CounterPage = 12; CounterPage <= 15; CounterPage++)
            {
               if (ReadCounter(portnum, FamilySN[i], CounterPage, &Count))
               {
                   printf(" %10ld  ", Count);
               }
               else
                  printf("\nError reading counter, verify device present:%d\n",
                  owVerify(portnum,FALSE));
            }
         }
         printf("\n\n");
      }
      while (!key_abort());
   }
   else 
      printf("\n\n\n ERROR, device not found!\n");
   
   // release the 1-Wire Net
   owRelease(portnum,return_msg);
   printf("%s",return_msg);
   exit(0);

   return 0;
}

// -------------------------------------------------------------------------------
// Read and print the serial number
//
void PrintSerialNum(uchar *SerialNum)
{
   int i;

   for (i = 7; i>=0; i--)    
      printf("%02X", SerialNum[i]);
}




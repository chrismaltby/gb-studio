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
//--------------------------------------------------------------------------
//
//  swtoper.C - Menu-driven test of DS2406(DS2407) 1-Wire switch
//  version 2.00


// Include files
#include <stdio.h>
#include <stdlib.h>
#include <ctype.h>
#include "ownet.h"
#include "swt12.h"

// Constant definition
#define MAXDEVICES         15

// tini hack
int argc=2;
char *argv[]={__FILE__, "exow"};
#define getkeystroke getchar

//---------------------------------------------------------------------------
// The main program that performs the operations on switches
//
int main() //short argc, char **argv)
{
   char return_msg[128];           //returned message from 1-wire operations
   short test;                     //info byte data
   short clear=0;                  //used to clear the button
   short done;                     //to tell when the user is done
   SwitchProps sw;                 //used to set Channel A and B
   uchar SwitchSN[MAXDEVICES][8];  //the serial number for the devices
   int num;                        //for the number of devices present
   int ch;                         //inputed character from user
   int i,j,n;                      //loop counters and indexes
   char out[140];                  //used for output of the info byte data
   int count;                      //the number of characters in the info byte data
   int portnum=0;

   //----------------------------------------
   // Introduction header
   printf("\n/---------------------------------------------\n");
   printf("  Switch - V2.00\n"
          "  The following is a test to excersize the \n"
          "  setting of the state in a DS2406.\n");

   printf("  Press any CTRL-C to stop this program.\n\n");

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

   // this is to get the number of the devices and the serial numbers
   num = FindDevices(portnum, &SwitchSN[0], SWITCH_FAMILY, MAXDEVICES);

   // setting up the first print out for the frist device
   owSerialNum(portnum, SwitchSN[0], FALSE);

   printf("\n");
   n=0;
   if(owAccess(portnum))
   {
      // loop while not done 
      do
      {
         test = ReadSwitch12(portnum, clear);

         for(i=7; i>=0; i--)
         printf("%02X", SwitchSN[n][i]);

         printf("\n");

         count = SwitchStateToString12(test, out);
         printf("%s", out);

         // print menu 
         printf("\n\n(1) Display the switch Info\n"
              "(2) Clear activity Latches\n"
              "(3) Set Flip Flop(s) on switch\n"
              "(4) Select different device\n"
              "(5) Quit\n"
              "Select a Number:");
         ch = getkeystroke();
         printf("\n\n");

         // do something from the menu selection              
         clear = FALSE;
         switch(ch)
         {        
            case '1': // Display the switch Info
               done = FALSE;
               break;
            case '2': // Clear activity Latches
               clear = TRUE;
               done = FALSE;
               break;
            case '3': // Set Flip Flop(s) on switch
               printf("Channel %c Flip Flop (1 set, 0 clear):",'A');
               ch = getkeystroke();
               if (ch == '0')
                  sw.Chan_A = 0;
               else
                  sw.Chan_A = 1;
               printf("\n");

               if(test & 0x40)
               {
                 printf("Channel %c Flip Flop (1 set, 0 clear):",'B');
                 ch = getkeystroke();
                 if (ch == '0')
                     sw.Chan_B = 0;
                 else
                     sw.Chan_B = 1;
                 printf("\n");
               }
               else
               {
                 printf("\n");
                 sw.Chan_B = 0;
               }
               printf("\n");

               if(!SetSwitch12(portnum, SwitchSN[n], &sw))
               {
                  msDelay(50);
                  if(SetSwitch12(portnum, SwitchSN[n], &sw))
                     msDelay(50);
                  else
                     printf("Switch not set\n");
               }
               done = FALSE;
               break;
            case '4': // Switch Devices
               for(j=0; j < num; j++)
               {
                  printf("%d  ", j+1);
                  for(i=7; i>=0; i--)
                  {
                     printf("%02X", SwitchSN[j][i]);
                  }
                  printf("\n");
               }
               printf("\n");

               do
               {
                  printf("Pick a device\n");
                  ch = getkeystroke();
                  n = 0;
                  n = (10*n + (ch - '0')) - 1;
                  printf("\n");
               }
               while((!isalnum(ch)) || (n>num-1));
               printf("\n");

               n = 0;
               n = (10*n + (ch - '0')) - 1;

               owSerialNum(portnum, SwitchSN[n], FALSE);

               done = FALSE;
               break;

            case '5': case 'q': case 'Q': // Done
               done = TRUE;  
               break;                             
               default:
            break;
         }
      }
      while (!done);
   }
   //One Wire Access
   owRelease(portnum,return_msg);
   printf("%s",return_msg);
   exit(0);

   return 0;
}


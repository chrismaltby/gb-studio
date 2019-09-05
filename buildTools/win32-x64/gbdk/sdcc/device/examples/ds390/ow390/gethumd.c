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
//  getV.c - This utility gets the Volts for pins Vad and Vdd from the DS2438. 
//
//  Version:   2.00
//  History: 

#include <stdio.h>
#include "ownet.h"  
#include "ad26.h"

#define MAXDEVICES 5

// Global necessary for screenio
int VERBOSE;

// tini hack
int argc=2;
char *argv[]={__FILE__, "exow"};

//----------------------------------------------------------------------
//  This is the Main routine for debit
//
int main() //short argc, char **argv)
{
   char msg[200];
   int portnum = 0;
   float Vdd,Vad;
   double humid,temp;
   int i;
   int numbat;
   uchar famvolt[MAXDEVICES][8];

   // check for required port name
   if (argc != 2)
   {
      sprintf(msg,"1-Wire Net name required on command line!\n"
	          " (example: \"COM1\" (Win32 DS2480),\"/dev/cua0\" "
                  "(Linux DS2480),\"1\" (Win32 TMEX)\n");
      //output_status(LV_ALWAYS,msg);
      printf (msg);
      return 0;
   }

   if(!owAcquire(portnum,argv[1],msg))
   {
      //output_status(LV_ALWAYS,msg);
      printf (msg);
      return 0;
   }
   else
   {

      do
      {
         numbat = FindDevices(portnum,&famvolt[0],SBATTERY_FAM,MAXDEVICES);
	 if (numbat==0) {
	   printf ("No device found.\n");
	 }

         for(i=0;i<numbat;i++)
         {
            Vdd = Volt_Reading(portnum,TRUE,&famvolt[0][0]);
            Vad = Volt_Reading(portnum,FALSE,&famvolt[0][0]);

            temp = Get_Temperature(portnum,&famvolt[0][0]);

            humid = (((Vad/Vdd) - 0.16)/0.0062)/(1.0546 - 0.00216 * temp);
               
            printf("\n");
            printf("The humidity is:  %4.4f\n", humid);
            printf("Given that the temp was:   %2.2f\n", temp);
            printf("and the volt supply was:   %2.2f\n", Vdd);
            printf("with the volt output was:  %2.2f\n", Vad);
            printf("\n");

         }//for loop
  
      }while(!key_abort());  

      owRelease(portnum,msg);
      //output_status(LV_ALWAYS,msg);
      printf (msg);
   }

   return 1;
}

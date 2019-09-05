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
//  thermodl.c - This utility uses to download the results of the
//               current mission of a DS1921 Thermochron iButton.
//
//  Version: 2.00
//    
//    History:
//           1.03 -> 2.00  Reorganization of Public Domain Kit 
//                         Y2K update, display all histogram bins, debug
//                         dump.  Supports multiple thermochons.
//

#include <stdio.h>
#include <stdlib.h>
#include "ownet.h"   
#include "thermo21.h"

// defines
#define MAXDEVICES   20

// local function prototypes
void PrintResults(ThermoStateType *,FILE *,int);

// tini hack
#define ExitProg(msg,exit_code) {printf("%s\n",msg); exit(exit_code);}
int argc=2;
char *argv[]={__FILE__, "exow"};

//----------------------------------------------------------------------
//  This is the Main routine for thermodl.
//
int main() //short argc, char **argv)
{
   int Fahrenheit=FALSE,filenum,num,i,j;
   char return_msg[128];
   FILE *fp;
   ThermoStateType ThermoState;
   uchar ThermoSN[MAXDEVICES][8]; //the serial numbers for the devices
   int portnum=0;

   // check arguments to see if request instruction with '?' or too many
   if ((argc < 2) || (argc > 4) || ((argc > 1) && (argv[1][0] == '?' || argv[1][1] == '?')))
       ExitProg("\nusage: thermodl 1wire_net_name <output_filename> </Fahrenheit>\n"
              "  - Thermochron download on the 1-Wire Net port\n"
              "  - 1wire_net_port required port name\n"
              "    example: \"COM1\" (Win32 DS2480),\"/dev/cua0\" \n"
              "    (Linux DS2480),\"1\" (Win32 TMEX)\n"
              "  - <output_filename> optional output filename\n"
              "  - </Fahrenheit> optional Fahrenheit mode (default Celsius)\n"
              "  - version 2.00\n",1);

   // attempt to acquire the 1-Wire Net
   if (!owAcquire(portnum,argv[1],return_msg))
      ExitProg(return_msg,1);

   // success
   printf("%s",return_msg);

   //----------------------------------------
   // Introduction
   printf("\n/----------------------------------------------\n");
   printf("  Find and download DS1921 Thermochron iButton(s)\n" 
          "  Version 2.00\n\n");

   // check arguments for temperature conversion and filename
   Fahrenheit = FALSE;
   filenum = 0;
   if (argc >= 3)
   {
      if (argv[2][0] != '/')
         filenum = 2;
      else if ((argv[2][1] == 'F') || (argv[2][1] == 'f'))
         Fahrenheit = TRUE;

      if (argc == 4)
      {    
         if (argv[3][0] != '/')
            filenum = 3;
         else if ((argv[3][1] == 'F') || (argv[3][1] == 'f'))
            Fahrenheit = TRUE;
      }   
   }

   // open the output file  
   fp = NULL;
   if (filenum > 0)
   {
     fp = fopen(argv[filenum],"w+");
     if(fp == NULL)
       {    
         printf("ERROR, Could not open output file!\n");
         exit(1);
       }
     else
       printf("File '%s' opened to write mission results.\n",
	      argv[filenum]);
   }

   // get list of Thermochron's 
   num = FindDevices(portnum, &ThermoSN[0],THERMO_FAM, MAXDEVICES);

   // check if not present or more then 1 present
   if (num == 0)
      ExitProg("Thermochron not present on 1-Wire\n",1);   

   // loop to download each Thermochron
   for (i = 0; i < num; i++)
   {
      // set the serial number portion in the thermo state
      printf("\nDownloading: ");
      for (j = 7; j >= 0; j--)
      {
         ThermoState.MissStat.serial_num[j] = ThermoSN[i][j];
         printf("%02X",ThermoSN[i][j]);
      }
      printf("\n");
      // download the Thermochron found
      if (DownloadThermo(portnum,&ThermoSN[i][0],&ThermoState,stdout))
      {
	// interpret the results of the download
	InterpretStatus(&ThermoState.MissStat);
	InterpretAlarms(&ThermoState.AlarmData, &ThermoState.MissStat);
	InterpretHistogram(&ThermoState.HistData);
	InterpretLog(&ThermoState.LogData, &ThermoState.MissStat);

         // print the output
	PrintResults(&ThermoState,fp,Fahrenheit);
      }
      else
      {
         fprintf(fp,"\nError downloading device: ");
         for (j = 0; j < 8; j++)
            fprintf(fp,"%02X",ThermoSN[i][j]);
         fprintf(fp,"\n");
      }
   }

   // close opened file
   if (fp != NULL)
   {
      printf("File '%s' closed.\n",
              argv[filenum]);
      fclose(fp);
   }

   // release the 1-Wire Net
   //owRelease(portnum,return_msg);
   printf("\n%s",return_msg);
   ExitProg("End program normally\n",0);
   return 0;
}

//--------------------------------------------------------------------------
//  Prints the mission data optionaly to a file or standard out
//
void PrintResults(ThermoStateType *ThermoState, FILE *fp, int ConvertToF)
{
  // aslink only can handle 64k, so we use the second 64k bank
   char *str=(xdata char*)0x190000;

   // check if need to use standard out
   if (fp == NULL)
      fp = stdout;

#if 0
   // get big block to use as a buffer
   str = malloc(80000);   
   if (str == NULL)
   {
      printf("Insufficient memory available to print!\n"); 
      return;
   }
#endif

   // mission status 
   MissionStatusToString(&ThermoState->MissStat, ConvertToF, &str[0]);
   fprintf(fp,"\n%s\n",str);

   // alarm events
   AlarmsToString(&ThermoState->AlarmData, &str[0]);
   fprintf(fp,"%s\n",str);

   // histogram
   HistogramToString(&ThermoState->HistData, ConvertToF, &str[0]);
   fprintf(fp,"%s\n",str);

   // log data
   LogToString(&ThermoState->LogData, ConvertToF, &str[0]);
   fprintf(fp,"%s\n",str);

   // debug raw data
   DebugToString(&ThermoState->MissStat, &ThermoState->AlarmData, 
      &ThermoState->HistData, &ThermoState->LogData, &str[0]); 
   fprintf(fp,"%s\n",str);

#if 0
   // free the memory block used
   free(str);
#endif
}


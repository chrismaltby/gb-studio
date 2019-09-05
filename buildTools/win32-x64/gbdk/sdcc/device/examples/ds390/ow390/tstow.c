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
//  tstow.C - Test application to test 1-Wire Net functions. No EPROM writes.
//
//  Version: 2.00
//
//  History: 1.00 -> 1.01  Change to use msDelay instead of Sleep. 
//
//           1.01 -> 1.02  Changed to generic OpenCOM/CloseCOM for easier 
//                           use with other platforms.  
//           1.02 -> 1.03  Removed caps in #includes for Linux capatibility
//                         Changed to use Acquire/Release 1-Wire Net functions
//           1.03 -> 2.00  Reorganization of Public Domain Kit 
//

#include <stdio.h>
#include <stdlib.h>
#include "ownet.h"

// local funcitons
void PrintSerialNum(int portnum);

// tini hack
int argc=2;
char *argv[]={__FILE__, "exow"};

//----------------------------------------------------------------------
//  Main Test
//
int main() //short argc, char **argv)
{
   int PortNum=1,rslt,i,j,testcnt=0,length;
   uchar TempSerialNum[8];
   uchar tran_buffer[2000], filename[10];
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
   if (!owAcquire(portnum, argv[1], return_msg))
   {  
      printf("%s",return_msg);
      exit(1);
   }

   // success
   printf("%s",return_msg);

   //----------------------------------------
   // Introduction
   printf("\n/---------------------------------------------\n");
    printf("  The following is a test excersize of the\n"
          "  1-Wire Net public domain library Version 2.00.\n\n"
          "  This test was run using with 2 DS1920's (DS1820),\n"
          "  1 DS1971 (DS2430), and 1 DS1996.\n\n");

   //----------------------------------------
   // First the devices on the 1-Wire Net
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Searching for devices on 1-Wire Net\n",testcnt++);

   // find the first device (all devices not just alarming)
   rslt = owFirst(portnum,TRUE, FALSE);
   while (rslt)
   {
      // print the Serial Number of the device just found
      PrintSerialNum(portnum);

      // find the next device
      rslt = owNext(portnum,TRUE, FALSE);
   }

   //----------------------------------------
   // now search for the part with a 0x0C family code (DS1996)
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Set to find first device with 0x0C family code\n",testcnt++);

   owFamilySearchSetup(portnum,0x0C);

   // find the first 0x0c device
   TempSerialNum[0]=0;
   while (TempSerialNum[0]!=0x0c && owNext(portnum,TRUE,FALSE)) {
     owSerialNum(portnum,TempSerialNum,TRUE);
   }
   printf("search result %d\n",TempSerialNum[0]==0x0c);

   // print the Serial Number of the device just found
   PrintSerialNum(portnum);
   
   //----------------------------------------
   // Access a device and read ram
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Access the current device and read ram\n",testcnt++);

   printf("owAccess %d\n",owAccess(portnum));

   printf("Read Ram 0xF0: %02X\n",owTouchByte(portnum,0xF0));
   printf("Address0 0x00: %02X\n",owTouchByte(portnum,0x00));
   printf("Address1 0x00: %02X\n",owTouchByte(portnum,0x00));

   printf("Page 0: ");
   for (i = 0; i < 32; i++)
      printf("%02X ",owTouchByte(portnum,0xFF));
   printf("\n");

   //----------------------------------------
   // Read ram with owBlock
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Read ram with owBlock\n",testcnt++);
   for (i = 0; i < 32; i++)
      tran_buffer[i] = 0xFF;

   printf("owBlock %d\n",owBlock(portnum,FALSE,tran_buffer,32));
   printf("Page 1: ");
   for (i = 0; i < 32; i++)
      printf("%02X ",tran_buffer[i]);
   printf("\n");

   //----------------------------------------
   // Write a packet in each page of DS1996
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Place the DS1996 into overdrive\n",testcnt++);
   printf("owOverdriveAccess %d\n",owOverdriveAccess(portnum));

   //----------------------------------------
   // Write 4 packets with owWritePacketStd 
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Write 4 packets with owWritePacketStd\n",testcnt++);
     
   for (j = 0; j < 4; j++)
   {
      for (i = 0; i < 29; i++)
	tran_buffer[i] = (uchar)i + j;

      printf("Write page %d: %d\n",j,owWritePacketStd(portnum,j,tran_buffer,29,FALSE,FALSE));

      for (i = 0; i < 29; i++)
         tran_buffer[i] = 0;
   
      length = owReadPacketStd(portnum,TRUE,j,tran_buffer);

      printf("Read page %d: %d\n",j,length);

      for (i = 0; i < length; i++)
         printf("%02X",tran_buffer[i]);
      printf("\n");
   }

   //----------------------------------------
   // Write a file to DS1996
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Format and write a file (in overdrive)\n",testcnt++);
   sprintf(filename,"DEMO");
   // set the data to write
   for (i = 0; i < 2000; i++)
      tran_buffer[i] = i % 255;
   printf("Format and write file DEMO.000 %d\n",
	  owFormatWriteFile(portnum,filename,2000,tran_buffer));

   // clear the buffer
   for (i = 0; i < 2000; i++)
      tran_buffer[i] = 0x55;
   printf("Read file DEMO.000 %d\n",owReadFile(portnum,filename,tran_buffer));
   // print the data result
   for (i = 0; i < 2000; i++)
   {
      if ((i % 0x20) == 0)
         printf("\n%03X    ",i);
      printf("%02X",tran_buffer[i]);
   }
   printf("\n");
  
   //----------------------------------------
   // Turn off overdrive
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Turn off overdrive\n",testcnt++);
   printf("Set 1-Wire Net speed to normal %d\n",owSpeed(portnum,MODE_NORMAL));

   //----------------------------------------
   // Verify a device
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Verify the current device\n",testcnt++);

   printf("owVerify (normal) %d\n",owVerify(portnum,FALSE));
   printf("owVerify (alarm)  %d\n",owVerify(portnum,TRUE));

   //----------------------------------------
   // Skip the first family code found
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Skip the first family code found\n",testcnt++);
   
   // find the next device
   printf("search result of owFirst %d\n",owFirst(portnum,TRUE, FALSE));

   // print the Serial Number of the device just found
   PrintSerialNum(portnum);

   // skip the first family type found
   owSkipFamily(portnum);
   printf("owSkipFamily called\n");

   // find the next device
   printf("search result of owNext %d\n",owNext(portnum,TRUE, FALSE));
   
   // print the Serial Number of the device just found
   PrintSerialNum(portnum);

   //----------------------------------------
   // Find first family code (DS1920) and read temperature
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Find first family code (DS1920) and read temperature\n",testcnt++);

   // find the next device
   printf("search result of owFirst %d\n",owFirst(portnum,TRUE, FALSE));

   // print the Serial Number of the device just found
   PrintSerialNum(portnum);

   // send the convert temperature command
   printf("Convert temperature command %02X\n",owTouchByte(portnum,0x44));

   // set the 1-Wire Net to strong pull-up
   printf("Set power delivery %d\n",owLevel(portnum,MODE_STRONG5));

   // sleep for 1 second
   msDelay(1000);

   // turn off the 1-Wire Net strong pull-up
   printf("Disable power delivery %d\n",owLevel(portnum,MODE_NORMAL));

   // read the DS1920 temperature value
   printf("Access the DS1920 %d\n",owAccess(portnum));
   tran_buffer[0] = 0xBE;
   tran_buffer[1] = 0xFF;
   tran_buffer[2] = 0xFF;
   printf("Block to read temperature %d\n",owBlock(portnum,FALSE,tran_buffer,3));
   // interpret the result
   printf("result: DS1920 temperature read: %d C\n", (tran_buffer[1] |
           ((int)tran_buffer[2] << 8)) / 2);
  
   //----------------------------------------
   //  Verify the current device, could also be alarming
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Verify the current device, could also be alarming\n",testcnt++);

   printf("owVerify (normal) %d\n",owVerify(portnum,FALSE));
   printf("owVerify (alarm)  %d\n",owVerify(portnum,TRUE));

   //----------------------------------------
   // Test setting the Serial Number with owSerialNum
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Test setting the Serial Number with owSerialNum\n",testcnt++);

   // set the Serial Num to 0 to 7
   for (i = 0; i < 8; i++)
      TempSerialNum[i] = (uchar)i;
   owSerialNum(portnum,TempSerialNum,FALSE);

   // read back the Serial Number 
   PrintSerialNum(portnum);

   //----------------------------------------
   //  Verify the current device (should fail, no such device)
   printf("\n/---------------------------------------------\n");
   printf("TEST%d: Verify the current device (should fail, no such device)\n",testcnt++);

   printf("owVerify (normal) %d\n",owVerify(portnum,FALSE));
   printf("owVerify (alarm)  %d\n",owVerify(portnum,TRUE));

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
   uchar TempSerialNumber[8];
   int i;

   owSerialNum(portnum,TempSerialNumber,TRUE);
   for (i = 7; i >= 0; i--)
      printf("%02X",TempSerialNumber[i]);
   printf("\n");
}

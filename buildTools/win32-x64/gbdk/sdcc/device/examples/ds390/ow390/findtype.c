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
//  findtype.c - Test module to find all devices of one type.
//      
//  Version: 2.00
// 
//----------------------------------------------------------------------
//
//
#include "ownet.h"

//----------------------------------------------------------------------
// Search for devices 
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number is provided to
//              indicate the symbolic port number.
//
// Returns: TRUE(1)  success, device type found
//          FALSE(0) device not found
//
int FindDevices(int portnum, uchar FamilySN[][8], int family_code, int MAXDEVICES)
{
   int NumDevices=0;
   int TotalDevices=0;
   
   // find the devices
   // set the search to first find that family code
   owFamilySearchSetup(portnum,family_code);

   // loop to find all of the devices up to MAXDEVICES
   NumDevices = 0;  
   do
   {
      // perform the search
      if (!owNext(portnum,TRUE, FALSE)) 
         break;
      owSerialNum(portnum,FamilySN[NumDevices], TRUE);   
      if (FamilySN[NumDevices][0] == family_code)
      {
         NumDevices++;
      } 
   }
   while (NumDevices < (MAXDEVICES - 1));

   // check if not at least 1 device
   return NumDevices;
}

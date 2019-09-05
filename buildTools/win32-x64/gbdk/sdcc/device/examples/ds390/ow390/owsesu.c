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
//  owSesU.C - Acquire and release a Session on the 1-Wire Net.
//
//  Version: 2.00
//
//  History: 1.03 -> 2.00  Changed 'MLan' to 'ow'. Added support for 
//                         multiple ports.  

#include <stdio.h>
#include "ownet.h"
#include "ds2480.h"

// keep port name for later message when closing
static char portname[MAX_PORTNUM][128];

//---------------------------------------------------------------------------
// Attempt to acquire a 1-Wire net using a com port and a DS2480 based
// adapter.  
//
// 'portnum'    - number 0 to MAX_PORTNUM-1.  This number was provided to
//                OpenCOM to indicate the port number.
// 'port_zstr'  - zero terminated port name.  For this platform
//                use format COMX where X is the port number.
// 'return_msg' - zero terminated return message. 
//
// Returns: TRUE - success, COM port opened
//
int owAcquire(int portnum, char *port_zstr, char *return_msg)
{
   int cnt=0;
   portname[portnum][0] = 0;

   // attempt to open the communications port
   if (OpenCOM(portnum,port_zstr))
      cnt += sprintf(&return_msg[cnt],"%s opened\n",port_zstr);
   else
   {
      cnt += sprintf(&return_msg[cnt],"Could not open port %s,"
              " aborting.\nClosing port %s.\n",port_zstr,port_zstr);
      return FALSE;
   }

   // detect DS2480
   if (DS2480Detect(portnum))
      cnt += sprintf(&return_msg[cnt],"DS2480-based adapter detected\n");
   else
   {
      cnt += sprintf(&return_msg[cnt],"DS2480-based adapter not detected, aborting program\n");
      cnt += sprintf(&return_msg[cnt],"Closing port %s.\n",port_zstr);
      CloseCOM(portnum);
      return FALSE;
   }      

   // success
   sprintf(portname[portnum],"%s",port_zstr);
   return TRUE;
}

//---------------------------------------------------------------------------
// Release the previously acquired a 1-Wire net.
//
// 'portnum'    - number 0 to MAX_PORTNUM-1.  This number was provided to
//                OpenCOM to indicate the port number.
// 'return_msg' - zero terminated return message. 
//
void owRelease(int portnum, char *return_msg)
{
   // close the communications port
   sprintf(return_msg,"Closing port %s.\n",portname[portnum]);
   CloseCOM(portnum);
}

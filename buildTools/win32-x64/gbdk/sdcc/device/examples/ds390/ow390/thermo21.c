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
//  thermo21.c - Thermochron iButton utility functions 
//
//  Version: 2.00
//    
//    History:
//           1.03 -> 2.00  Reorganization of Public Domain Kit 
//                         Convert to global CRC utility functions
//                         Y2K fix.

#include <stdio.h>
#include "time.h"
#include <string.h>
#include "ownet.h"
#include "thermo21.h"   

// a hack for sdcc/TINI, just printf to stdout
int fprintf (FILE *fp, char *format, ...) reentrant {
  va_list arg;
  *fp; // hush the compiler
  va_start(arg, format);
  vsprintf(NULL, format, arg);
  va_end(arg);
}

FILE * fopen(char * path, char *mode) {
  path, mode; //hush the compiler
  return (FILE *)0;
}

int fclose(FILE *fp) {
  fp; // hust the compiler
  return 0;
}

static int RunThermoScript(int,ThermoStateType *,ThermoScript script[], FILE *fp);
static int ThermoStep(int,ThermoStateType *,ThermoScript *,int *,int *,int *,char *);
static int ReadPages(int,int,int,int *,uchar *);
static int WriteScratch(int,uchar *,int,int);
static int CopyScratch(int,int,int);
static int WriteMemory(int,uchar *, int, int);

// step constants
enum { ST_SETUP=0, ST_READ_STATUS, ST_READ_ALARM, ST_READ_HIST,
       ST_READ_LOG, ST_CLEAR_MEM, ST_CLEAR_VERIFY, ST_WRITE_TIME,
       ST_WRITE_CONTROL, ST_WRITE_RATE, ST_FINISH, ST_GET_SESSION, 
       ST_FIND_THERMO, ST_REL_SESSION, ST_READ_PAGES, ST_WRITE_MEM,
       ST_CLEAR_SETUP };

// status contants
enum { STATUS_STEP_COMPLETE, STATUS_COMPLETE, STATUS_INPROGRESS,
       STATUS_ERROR_HALT, STATUS_ERROR_TRANSIENT };

// download steps
static ThermoScript Download[] = 
    {{ ST_READ_STATUS,  "Setup to read the mission status"},
     { ST_READ_PAGES,   "Read the status page"},
     { ST_READ_ALARM,   "Setup to read alarm pages"},
     { ST_READ_PAGES,   "Read the alarm pages"},
     { ST_READ_HIST,    "Setup to read histogram pages"},
     { ST_READ_PAGES,   "Read the histogram pages"},
     { ST_READ_LOG,     "Setup to read log pages"},
     { ST_READ_PAGES,   "Read the log pages"},
     { ST_FINISH,       "Finished"}}; 

// read status only steps
static ThermoScript GetStatus[] = 
    {{ ST_READ_STATUS,  "Setup to read the mission status"},
     { ST_READ_PAGES,   "Read the status page"},
     { ST_FINISH,       "Finished"}}; 

// mission steps (assume already did StatusThermo)
static ThermoScript Mission[] = 
    {{ ST_CLEAR_SETUP,  "Setup clear memory"},
     { ST_WRITE_MEM,    "Write clear memory bit"},
     { ST_CLEAR_MEM,    "Clear the memory"},
     { ST_READ_STATUS,  "Setup to read the mission status"},
     { ST_READ_PAGES,   "Read the status page"},
     { ST_CLEAR_VERIFY, "Verify memory is clear"},
     { ST_WRITE_TIME,   "Setup to write the real time clock"},
     { ST_WRITE_MEM,    "Write the real time clock"},
     { ST_WRITE_CONTROL,"Setup to write the control"},
     { ST_WRITE_MEM,    "Write the control"},
     { ST_WRITE_RATE,   "Setup to write the sample rate to start mission"},
     { ST_WRITE_MEM,    "Write the sample rate"},
     { ST_READ_STATUS,  "Read the new mission status"},
     { ST_FINISH,       "Finished"}}; 

// global state information
static int current_speed[MAX_PORTNUM];

//--------------------------------------------------------------------------
// The 'DownloadThermo' downloads the specified Thermochron in 'SerialNum'
// and puts the data in the state variable 'ThermoState'.  Progress output
// is printed to the specified file 'fp'. 
//
// 'portnum'     - number 0 to MAX_PORTNUM-1.  This number is provided to
//                 indicate the symbolic port number.
// 'SerialNum'   - Device serial number to download
// 'ThermoState' - pointer to a structure type that holds the raw and
//                 translated Thermochron data.
// 'fp'          - file pointer to print status information to
//
// Returns:   TRUE (1) : Thermochron download with raw data in ThermoState
//            FALSE (0): not downloaded.  Abort due to repeated errors
//                       or user keypress.
//
int DownloadThermo(int portnum, uchar *SerialNum, 
                   ThermoStateType *ThermoState, FILE *fp)
{
   // set the serial num
   owSerialNum(portnum, SerialNum, FALSE);

   // run the script and download thermochron
   return RunThermoScript(portnum,ThermoState,Download,fp);
}

//--------------------------------------------------------------------------
// The 'ReadThermoStatus' reads the Thermochron status in 'SerialNum'
// and puts the data in the state variable 'ThermoState'.  Progress output
// is printed to the specified file 'fp'. 
//
// 'portnum'     - number 0 to MAX_PORTNUM-1.  This number is provided to
//                 indicate the symbolic port number.
// 'SerialNum'   - Device serial number to download
// 'ThermoState' - pointer to a structure type that holds the raw and
//                 translated Thermochron data.
// 'fp'          - file pointer to print status information to
//
// Returns:   TRUE (1) : Thermochron status read with raw data in ThermoState
//            FALSE (0): status not read.  Abort due to repeated errors
//                       or user keypress.
//
int ReadThermoStatus(int portnum, uchar *SerialNum, 
                   ThermoStateType *ThermoState, FILE *fp)
{
   // set the serial num
   owSerialNum(portnum, SerialNum, FALSE);

   // run the script and read status of thermochron
   return RunThermoScript(portnum,ThermoState,GetStatus,fp);
} 

//--------------------------------------------------------------------------
// The 'MissionThermo' starts a new Thermochron mission on 'SerialNum'
// from the state information provided in 'ThermoState'. Progress output
// is printed to the specified file 'fp'. 
//
// 'portnum'     - number 0 to MAX_PORTNUM-1.  This number is provided to
//                 indicate the symbolic port number.
// 'SerialNum'   - Device serial number to download
// 'ThermoState' - pointer to a structure type that holds the raw and
//                 translated Thermochron data.
// 'fp'          - file pointer to print status information to
//
// Returns:   TRUE (1) : Thermochron missioned
//            FALSE (0): not missioned.  Abort due to repeated errors
//                       or user keypress.
//
int MissionThermo(int portnum, uchar *SerialNum, 
                   ThermoStateType *ThermoState, FILE *fp)
{
   // set the serial num
   owSerialNum(portnum, SerialNum, FALSE);

   // run the script and mission thermochron
   return RunThermoScript(portnum,ThermoState,Mission,fp);
}

//--------------------------------------------------------------------------
// Run the specified script.  Return TRUE if all steps completed else FALSE.
// Status is printed to file 'fp'.  
//
int RunThermoScript(int portnum, ThermoStateType *ThermoState,
                    ThermoScript script[], FILE *fp)
{
   char msg[256],LastDescription[256],LastMsg[256];
   int StepCount,SubStep,ErrorCount,Status;
   int last_clear_step=0;
   
   // reset the step to the begining
   StepCount = 0;
   SubStep = 0;
   ErrorCount = 0;
   Status = STATUS_INPROGRESS;
 
   // loop to perform all of the steps to download the Thermochron
   do
   {   
      // switch on the status of the last step done
      switch(Status)
      {
         // step complete so go to the next
         case STATUS_STEP_COMPLETE:
            StepCount++;
            SubStep = 0;
            ErrorCount = 0;
            Status = STATUS_INPROGRESS;
            LastDescription[0] = 0;
            LastMsg[0] = 0;
            break;
         // in progress so call again
         case STATUS_INPROGRESS:
            // record the step position of the last memory clear
            // this is in case we need to attempt a clear again
            if (script[StepCount].Step == ST_CLEAR_SETUP)
               last_clear_step = StepCount;               

            // print step description if different 
            if (strcmp(LastDescription,
                script[StepCount].StepDescription) != 0)
            {
               fprintf(fp,"%s --> ",script[StepCount].StepDescription);
               sprintf(LastDescription,"%s",script[StepCount].StepDescription);
            }

            // perform a step in the job
            ThermoStep(portnum,ThermoState,&script[StepCount],&SubStep, 
                      &Status, &ErrorCount, msg);

            // print results if different
            if (strcmp(LastMsg,msg) != 0)
            {
               fprintf(fp,"%s\n",msg);
               sprintf(LastMsg,"%s",msg);
            }
            else
               fprintf(fp,".");
            break;     
         // encountered a transient error
         case STATUS_ERROR_TRANSIENT:
            // check if transient error is a memory clear
            if (script[StepCount].Step == ST_CLEAR_VERIFY)
            {
               // put back to starting clear over again
               StepCount = last_clear_step;
               SubStep = 0;
               ErrorCount = 0;
               Status = STATUS_INPROGRESS;
               break; 
            }    
            // if 20 tansient errors in a row then abort
            if (ErrorCount > 20)
               Status = STATUS_ERROR_HALT;
            else
               Status = STATUS_INPROGRESS;
            break;
         // all steps complete
         case STATUS_COMPLETE:
            fprintf(fp,"End script normally\n");
            return TRUE;
            break;
         // non-recoverable error
         case STATUS_ERROR_HALT:
            fprintf(fp,"Aborting script due to non-recoverable error\n");
            return FALSE;
            break;
      }
   }
   while (!Serial0CharArrived());
 
   // key abort
   fprintf(fp,"Aborting script due to key press\n");
   return FALSE;
}

//----------------------------------------------------------------------
//  Use the script to perform a step and return.
//
int ThermoStep(int portnum, ThermoStateType *ThermoState, 
               ThermoScript *StateScript, int *SubStep, 
               int *Status, int *ErrorCount, char *msg)
{
   short  rslt;
   static int read_page_num, read_pages, write_addr, write_len;
   static uchar *read_buf, *write_buf;
   static uchar tbuf[5];

   ErrorCount; // hush the compiler

   // do the current step
   switch (StateScript->Step)
   {
      // the operation is complete      
      case ST_FINISH:
         sprintf(msg,"Operation complete");
         *Status = STATUS_COMPLETE;
         break;      

      // read the mission status page
      case ST_READ_STATUS:
         read_page_num = STATUS_PAGE;
         read_pages = 1;
         read_buf = ThermoState->MissStat.status_raw;
         sprintf(msg,"Ready to read status page %d",
                      read_page_num);
         *Status = STATUS_STEP_COMPLETE;
         break;      

      // set up to read the alarm registers
      case ST_READ_ALARM:
         read_page_num = 17;
         read_pages = 3;
         read_buf = ThermoState->AlarmData.alarm_raw;
         sprintf(msg,"Ready to read alarm pages %d to %d",
                      read_page_num, read_page_num + read_pages - 1);
         *Status = STATUS_STEP_COMPLETE;
         break;
         
      // set up to read the histogram data
      case ST_READ_HIST:
         read_page_num = 64;
         read_pages = 4;
         read_buf = ThermoState->HistData.hist_raw;
         sprintf(msg,"Ready to read histogram pages %d to %d",
                      read_page_num, read_page_num + read_pages - 1);
         *Status = STATUS_STEP_COMPLETE;
         break;

      // set up to read the log data
      case ST_READ_LOG:
         read_page_num = 128;
         read_pages = 64;
         read_buf = ThermoState->LogData.log_raw;
         sprintf(msg,"Ready to read log pages %d to %d",
                      read_page_num, read_page_num + read_pages - 1);
         *Status = STATUS_STEP_COMPLETE;
         break;

      // read the specified pages
      case ST_READ_PAGES:
         // check for last page
         if (*SubStep == 0)
            // set the sub-step to the current page being read
            *SubStep =  read_page_num;
         // read the status page
         rslt = ReadPages(portnum, read_page_num, read_pages, SubStep, read_buf);
         if (rslt == FALSE)
         {
            sprintf(msg,"Thermochron not on 1-Wire Net");
            *Status = STATUS_INPROGRESS;
         }
         else 
         {
            sprintf(msg,"Pages read from Thermochron");
            *Status = STATUS_STEP_COMPLETE;
         }
         break;      

      // setup the clear memory
      case ST_CLEAR_SETUP:
         // create a small buff to write to start the clear memory
         tbuf[0] = 0x40;
         write_buf = &tbuf[0];
         write_len = 1;
         write_addr = 0x20E;
         sprintf(msg,"Write to setup clear memory");
         *Status = STATUS_STEP_COMPLETE;
         break;

      // clear the memory
      case ST_CLEAR_MEM:
         // set the clear memory command (not check return because verify)        
         owAccess(portnum);
         owWriteByte(portnum,0x3C);
         msDelay(3);
         owTouchReset(portnum);
         sprintf(msg,"Clear memory command sent");
         *Status = STATUS_STEP_COMPLETE;
         break;

      // clear the memory
      case ST_CLEAR_VERIFY:
         // look at the memory clear bit
         if ((ThermoState->MissStat.status_raw[0x14] & 0x40) == 0x40)
         {
            sprintf(msg,"Memory is clear");
            *Status = STATUS_STEP_COMPLETE;
            break;
         }
         else
         {
            sprintf(msg,"Memory did NOT clear");
            *Status = STATUS_ERROR_TRANSIENT;
            break;
         }
         break;      

      // setup write time, clock alarm, control, trips
      case ST_WRITE_TIME:
         // create the write buffer
         FormatMission(&ThermoState->MissStat);
         write_buf = &ThermoState->MissStat.status_raw[0x00];
         write_len = 13;
         write_addr = 0x200;
         sprintf(msg,"Write time, clock alarm, and trips setup");
         *Status = STATUS_STEP_COMPLETE;
         break;

      // write the control, mission delay and clear flags
      case ST_WRITE_CONTROL:
         write_buf = &ThermoState->MissStat.status_raw[0x0E];
         write_len = 7;
         write_addr = 0x20E;
         sprintf(msg,"Write control, mission delay, clear flags setup");
         *Status = STATUS_STEP_COMPLETE;
         break;

      case ST_WRITE_RATE:
         write_buf = &ThermoState->MissStat.status_raw[0x0D];
         write_len = 1;
         write_addr = 0x20D;
         sprintf(msg,"Write sample rate setup");
         *Status = STATUS_STEP_COMPLETE;
         break;

      // write the specified memory location 
      case ST_WRITE_MEM:
         if (WriteMemory(portnum, write_buf, write_len, write_addr))
         {
            sprintf(msg,"Memory written to Thermochron");
            *Status = STATUS_STEP_COMPLETE;
         }
         else
         {
            sprintf(msg,"Thermochron not on 1-Wire Net");
            *Status = STATUS_INPROGRESS;
         }
      default:
           break;
   }

   return *Status;
}

//----------------------------------------------------------------------
//  Read a specified number of pages in overdrive
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number is provided to
//              indicate the symbolic port number.
//
int ReadPages(int portnum, int start_pg, int num_pgs, int *last_pg, uchar *finalbuf)
{
   int skip_overaccess = 0, skip_access = 0;
   uchar pkt[60];
   int len,i;
   uchar  SerialNumber[8];
   ushort lastcrc16;

   // read the rom number 
   owSerialNum(portnum,SerialNumber,TRUE);

   // verify device is in overdrive
   if (current_speed[portnum] == MODE_OVERDRIVE)
   {
      if (owVerify(portnum,FALSE)) 
         skip_overaccess = 1;
   }

   if (!skip_overaccess)
   {
      if (owOverdriveAccess(portnum))
         current_speed[portnum] = MODE_OVERDRIVE;
      else
         current_speed[portnum] = MODE_NORMAL;
   }

   // loop while there is pages to read
   do
   {
      // create a packet to read a page
      len = 0;
      setcrc16(portnum,0);
      // optional skip access on subsequent pages 
      if (!skip_access)
      {  
         // match
         pkt[len++] = 0x55; 
         // rom number
         for (i = 0; i < 8; i++)
            pkt[len++] = SerialNumber[i];
         // read memory with crc command 
         pkt[len] = 0xA5; 
         docrc16(portnum,pkt[len++]);         
         // address
         pkt[len] = (uchar)((*last_pg << 5) & 0xFF);
         docrc16(portnum,pkt[len++]);         
         pkt[len] = (uchar)(*last_pg >> 3); 
         docrc16(portnum,pkt[len++]);         
      }

      // set 32 reads for data and 2 for crc
      for (i = 0; i < 34; i++)
         pkt[len++] = 0xFF; 
         
      // send the bytes
      if (owBlock(portnum,!skip_access,pkt,len))
      {
         // calucate the CRC over the last 34 bytes
         for (i = 0; i < 34; i++)
            lastcrc16 = docrc16(portnum,pkt[len - 34 + i]);

         // check crc
         if (lastcrc16 == 0xB001)
         {
            // copy the data into the buffer
#ifdef LetsCrashTheCompiler
	   for (i = 0; i < 32; i++)
	     finalbuf[i + (*last_pg - start_pg) * 32] = pkt[len - 34 + i];
#endif
	   {
	     ushort k;
	     for (i = 0; i < 32; i++) {
	       k=i + (*last_pg - start_pg) * 32;
	       finalbuf[k] = pkt[len - 34 + i];
	     }
	   }
            // change number of pages 
            *last_pg = *last_pg + 1;

            // now skip access 
            skip_access = TRUE;
         }
         else
            return FALSE;
      }
      else
         return FALSE;
   }
   while ((*last_pg - start_pg) < num_pgs);

   return TRUE;
}

//----------------------------------------------------------------------------}
// Write a memory location. Data must all be on the same page
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number is provided to
//              indicate the symbolic port number.
//
int WriteMemory(int portnum, uchar *Buf, int ln, int adr)
{
   // write to scratch and then copy
   if (WriteScratch(portnum,Buf,ln,adr)) 
      return CopyScratch(portnum,ln,adr);

   return FALSE;
}

//----------------------------------------------------------------------------}
// Write the scratch pad
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number is provided to
//              indicate the symbolic port number.
//
int WriteScratch(int portnum, uchar *Buf, int ln, int adr)
{
   int i;
   uchar pbuf[80];

   // check for alarm indicator 
   if (owAccess(portnum)) 
   {
      // construct a packet to send  
      pbuf[0] = 0x0F; // write scratch command 
      pbuf[1] = (adr & 0xFF); // address 1 
      pbuf[2] = ((adr >> 8) & 0xFF); // address 2 

      // the write bytes 
      for (i = 0; i < ln; i++)
        pbuf[3 + i] = (uchar)(Buf[i]); // data 

      // perform the block 
      if (!owBlock(portnum,FALSE,pbuf,ln+3))
         return FALSE;

      // Now read back the scratch 
      if (owAccess(portnum)) 
      {
         // construct a packet to send 
         pbuf[0] = 0xAA; // read scratch command 
         pbuf[1] = 0xFF; // address 1 
         pbuf[2] = 0xFF; // address 2 
         pbuf[3] = 0xFF; // offset 

         // the write bytes 
         for (i = 0; i < ln; i++)
            pbuf[4 + i] = 0xFF; // data 

         // perform the block  
         if (!owBlock(portnum,FALSE,pbuf,ln+4))
            return FALSE;

         // read address 1 
         if (pbuf[1] != (adr & 0xFF)) 
            return FALSE;
         // read address 2 
         if (pbuf[2] != ((adr >> 8) & 0xFF)) 
            return FALSE;
         // read the offset 
         if (pbuf[3] != ((adr + ln - 1) & 0x1F)) 
            return FALSE;
         // read and compare the contents 
         for (i = 0; i < ln; i++)
         {
            if (pbuf[4 + i] != Buf[i]) 
              return FALSE;
         }
         // success
         return TRUE;
      }
   }

   return FALSE;
}


//----------------------------------------------------------------------------}
// Copy the scratch pad
//
// 'portnum'  - number 0 to MAX_PORTNUM-1.  This number is provided to
//              indicate the symbolic port number.
//
int CopyScratch(int portnum, int ln, int adr)
{
   int i;
   uchar pbuf[50];

   // check for alarm indicator 
   if (owAccess(portnum)) 
   {
      // construct a packet to send 
      pbuf[0] = 0x55;                  // copy scratch command 
      pbuf[1] = (adr & 0xFF);          // address 1 
      pbuf[2] = ((adr >> 8) & 0xFF);   // address 2 
      pbuf[3] = (adr + ln - 1) & 0x1F; // offset 
      for (i = 0; i <= 9; i++)
         pbuf[4 + i] = 0xFF;           // result of copy 

      // perform the block 
      if (owBlock(portnum,FALSE,pbuf,14))
      {
         if ((pbuf[13] == 0x55) ||
             (pbuf[13] == 0xAA)) 
           return TRUE;
      }
   }

   return FALSE;
}

//----------------------------------------------------------------------
//  Interpret the Status by looking at the 'raw' portion of the 
//  mission status structure.
//
void InterpretStatus(MissionStatus *mstatus)
{
   timedate td,tdtmp;
   int offset;
   ulong tmtmp;
   time_t tlong; 
   struct tm *tstruct; 

   // mission in progress flag
   mstatus->mission_in_progress = (0x20 & mstatus->status_raw[0x14]) >> 5;

   // sample rate
   mstatus->sample_rate = mstatus->status_raw[0x0D];

   // rollover enabled 
   mstatus->rollover_enable = (0x08 & mstatus->status_raw[0x0E]) >> 3;

   // startdelay
   mstatus->start_delay = ((int)mstatus->status_raw[0x13] << 8) | 
                            mstatus->status_raw[0x12];

   // number of samples in this mission
   mstatus->mission_samples = ((long)mstatus->status_raw[0x1C] << 16) |
                              ((int)mstatus->status_raw[0x1B] << 8) | 
                               mstatus->status_raw[0x1A];

   // total number of samples 
   mstatus->samples_total = ((long)mstatus->status_raw[0x1F] << 16) |
                            ((int)mstatus->status_raw[0x1E] << 8) | 
                             mstatus->status_raw[0x1D];

   // temperature thresholds
   mstatus->high_threshold = mstatus->status_raw[0x0C];
   mstatus->low_threshold = mstatus->status_raw[0x0B];

   // rollover occurred
   if ((mstatus->mission_samples > 2048) && mstatus->rollover_enable)
      mstatus->rollover_occurred = 1;
   else
      mstatus->rollover_occurred = 0;

   // current real-time clock value
   offset = 0x00;
   td.second = BCDToBin((uchar)(mstatus->status_raw[offset] & 0x7F));
   td.minute = BCDToBin((uchar)(mstatus->status_raw[offset + 1] & 0x7F));
   // check for 12 hour mode
   if (mstatus->status_raw[offset + 2] & 0x40)
   {
      td.hour = BCDToBin((uchar)(mstatus->status_raw[offset + 2] & 0x1F));
      // check for PM
      if (mstatus->status_raw[offset + 2] & 0x20)
         td.hour += 12;
   }
   else
      td.hour = BCDToBin((uchar)(mstatus->status_raw[offset + 2] & 0x3F));
   td.day = BCDToBin((uchar)(mstatus->status_raw[offset + 4] & 0x3F));
   td.month = BCDToBin((uchar)(mstatus->status_raw[offset + 5] & 0x1F));
   td.year = BCDToBin(mstatus->status_raw[offset + 6]) + 1900;
   // check for century bit
   if (mstatus->status_raw[offset + 5] & 0x80)
      td.year = BCDToBin(mstatus->status_raw[offset + 6]) + 2000; // (2.00)
   // convert to seconds since 1970
   mstatus->current_time = DateToSeconds(&td);

   // date/time when mission started
   offset = 0x15;
   td.second = (uchar)0;
   td.minute = BCDToBin((uchar)(mstatus->status_raw[offset] & 0x7F));
   // check for 12 hour mode
   if (mstatus->status_raw[offset + 1] & 0x40)
   {
      td.hour = BCDToBin((uchar)(mstatus->status_raw[offset + 1] & 0x1F));
      // check for PM
      if (mstatus->status_raw[offset + 1] & 0x20)
         td.hour += 12;
   }
   else
      td.hour = BCDToBin((uchar)(mstatus->status_raw[offset + 1] & 0x3F));
   td.day = BCDToBin((uchar)(mstatus->status_raw[offset + 2] & 0x3F));
   td.month = BCDToBin((uchar)(mstatus->status_raw[offset + 3] & 0x1F));
   td.year = BCDToBin((uchar)(mstatus->status_raw[offset + 4])); // (2.00)
   // (2.00) logic to decide on century of mission stamp   
   // check if century bit set in mission stamp
   if (mstatus->status_raw[offset + 3] & 0x80)
      td.year += 2000;
   // check in mission in progress
   else if (mstatus->mission_in_progress)
   {
      // calculate the mission start year back from real time clock
      tmtmp = mstatus->current_time - 
             (mstatus->sample_rate * mstatus->mission_samples * 60);
      SecondsToDate(&tdtmp,tmtmp);
      td.year = tdtmp.year;      
   }
   else
   {
      // mission stopped so get century by year window
      if (td.year <= 70)
         td.year += 2000;
      else
         td.year += 1900;
   }
   // convert to seconds since 1970
   if ((td.month == 0) || (td.day == 0))
      mstatus->mission_start_time = 0;
   else
      mstatus->mission_start_time = DateToSeconds(&td);
      
   // download stations time of reading
   time(&tlong);
   tstruct = localtime(&tlong); 
   td.day = tstruct->tm_mday;
   td.month = tstruct->tm_mon + 1;  // (1.01)
   td.year = tstruct->tm_year + 1900;
   td.hour = tstruct->tm_hour;
   td.minute = tstruct->tm_min;
   td.second = tstruct->tm_sec;
   mstatus->download_time = DateToSeconds(&td);

   // skip alarm modes and status for now
}

//--------------------------------------------------------------------------
// Take the Mission Status structure and create new raw data to start
// a new mission.
//
void FormatMission(MissionStatus *mstatus)
{
   int i;
   time_t tlong; 
   struct tm *tstruct; 

   // clear the buffer
   for (i = 0; i < 32; i++)
      mstatus->status_raw[i] = 0;
   
   // Real Time Clock
   time(&tlong);
   tlong++;  // add 1 second
   tstruct = localtime(&tlong); 
   // convert to BCD
   mstatus->status_raw[0x00] = ToBCD((short)tstruct->tm_sec);
   mstatus->status_raw[0x01] = ToBCD((short)tstruct->tm_min);
   mstatus->status_raw[0x02] = ToBCD((short)tstruct->tm_hour);
   mstatus->status_raw[0x03] = ToBCD((short)(tstruct->tm_wday + 1));
   mstatus->status_raw[0x04] = ToBCD((short)tstruct->tm_mday);
   mstatus->status_raw[0x05] = ToBCD((short)(tstruct->tm_mon + 1));
   if (tstruct->tm_year >= 100)
      mstatus->status_raw[0x05] |= 0x80;
   mstatus->status_raw[0x06] = ToBCD((short)(tstruct->tm_year % 100));
   // Real Time clock Alarm (leave 0's)
   // Low temp alarm
   mstatus->status_raw[0x0B] = mstatus->low_threshold;
   // High temp alarm
   mstatus->status_raw[0x0C] = mstatus->high_threshold;
   // sample rate
   mstatus->status_raw[0x0D] = mstatus->sample_rate;
   // control
   mstatus->status_raw[0x0E] = 0x40;
   if (mstatus->rollover_enable)
      mstatus->status_raw[0x0E] |= 0x08;
   // mission start delay
   mstatus->status_raw[0x12] = mstatus->start_delay & 0xFF;
   mstatus->status_raw[0x13] = (mstatus->start_delay >> 8) & 0xFF;
}

//--------------------------------------------------------------------------
// Convert an integer to a 1 Byte BCD number (99 max) 
//
uchar ToBCD(short num)
{
   uchar rtbyte;

   rtbyte = (num - ((num / 10) * 10)) & 0x0F;
   rtbyte = rtbyte | ((num / 10) << 4);
   
   return rtbyte;
}


//--------------------------------------------------------------------------
// Take the Mission Status structure and convert to string format
//
void MissionStatusToString(MissionStatus *mstatus, int ConvertToF, char *str)
{
   int cnt=0,i;
   timedate td;
   time_t tlong; 
   struct tm *tstruct; 

   // title
   cnt += sprintf(&str[cnt],"Mission State\n-------------\n");

   // serial number
   cnt += sprintf(&str[cnt],"Serial Number of DS1921: ");
   for (i = 7; i >= 0; i--)
      cnt += sprintf(&str[cnt],"%02X",mstatus->serial_num[i]);

   // mission state
   if (mstatus->mission_in_progress)
      cnt += sprintf(&str[cnt],"\nMission is in progress\n");
   else
      cnt += sprintf(&str[cnt],"\nMission is ended\n");

   // sample rate
   cnt += sprintf(&str[cnt],"Sample rate: %d minute(s)\n",mstatus->sample_rate);

   // rollover
   cnt += sprintf(&str[cnt],"Roll-Over Enabled: ");
   if (mstatus->rollover_enable)
      cnt += sprintf(&str[cnt],"yes\n");
   else
      cnt += sprintf(&str[cnt],"no\n");
   cnt += sprintf(&str[cnt],"Roll-Over Occurred: ");
   if (mstatus->rollover_occurred)
      cnt += sprintf(&str[cnt],"yes\n");
   else
      cnt += sprintf(&str[cnt],"no\n");
  
   // mission start time
   if (mstatus->start_delay == 0)
   {
      SecondsToDate(&td,mstatus->mission_start_time);      
      if (mstatus->mission_start_time == 0)
         cnt += sprintf(&str[cnt],"Mission Start time: not started yet\n");
      else
         cnt += sprintf(&str[cnt],"Mission Start time: %02d/%02d/%04d  %02d:%02d:%02d\n",
            td.month,td.day,td.year,td.hour,td.minute,td.second);
   }
   else
      cnt += sprintf(&str[cnt],"Mission Start time: na\n");

   // mission start delay
   cnt += sprintf(&str[cnt],"Mission Start delay: %d minute(s)\n",mstatus->start_delay);
   
   // mission samples
   cnt += sprintf(&str[cnt],"Mission Samples: %d\n",mstatus->mission_samples);

   // device total samples
   cnt += sprintf(&str[cnt],"Device total samples: %d\n",mstatus->samples_total);

   // temperature display mode
   cnt += sprintf(&str[cnt],"Temperature displayed in: ");   
   if (ConvertToF)
      cnt += sprintf(&str[cnt],"(Fahrenheit)\n");
   else
      cnt += sprintf(&str[cnt],"(Celsius)\n");

   // thresholds
   cnt += sprintf(&str[cnt],"High Threshold: %6.1f\n",
          TempToFloat(mstatus->high_threshold,ConvertToF));   
   cnt += sprintf(&str[cnt],"Low Threshold: %6.1f\n",
          TempToFloat(mstatus->low_threshold,ConvertToF));   
   
   // time from D1921
   SecondsToDate(&td,mstatus->current_time);      
   cnt += sprintf(&str[cnt],"Current Real-Time Clock from DS1921: %02d/%02d/%04d  %02d:%02d:%02d\n",
       td.month,td.day,td.year,td.hour,td.minute,td.second);

   // current PC time
   time(&tlong);
   tstruct = localtime(&tlong); 
   cnt += sprintf(&str[cnt],"Current PC Time: %02d/%02d/%04d  %02d:%02d:%02d\n",
       tstruct->tm_mon + 1,tstruct->tm_mday,tstruct->tm_year + 1900,
       tstruct->tm_hour,tstruct->tm_min,tstruct->tm_sec);

   // zero terminate string
   str[cnt] = 0;
}

//----------------------------------------------------------------------
//  Interpret the Histogram by looking at the 'raw' portion of the 
//  Histogram structure.  Store the temperature range values in Celsius.
//
void InterpretHistogram(Histogram *hist)
{
   int i;

   // loop through each bin value
   for (i = 0; i < 126; i += 2) // (2.00)
   {
      // get the bin value
      hist->bin_count[i / 2] = hist->hist_raw[i] | ((int)hist->hist_raw[i + 1] << 8);

      // start value for this bin
      hist->start_range[i / 2] = TempToFloat((uchar)((i / 2) << 2),FALSE);

      // end value for this bin
      hist->end_range[i / 2] = TempToFloat((uchar)(((i / 2) << 2) | 0x03),FALSE);
   }
}

//--------------------------------------------------------------------------
// Take the Histogram structure and convert to string format
//
void HistogramToString(Histogram *hist, int ConvertToF, char *str)
{
   int cnt=0,i;

   // title
   cnt += sprintf(&str[cnt],"Temperature Histogram\n---------------------\n"  
                            "Format: [Temp Range, Count] ");
   if (ConvertToF)
      cnt += sprintf(&str[cnt],"(Fahrenheit)\n");
   else
      cnt += sprintf(&str[cnt],"(Celsius)\n");

   // loop through bins
   for (i = 0; i < 63; i++) // (2.00)
   {
      cnt += sprintf(&str[cnt],"%6.1f to %6.1f, %d\n", 
                     (ConvertToF) ? CToF(hist->start_range[i]): hist->start_range[i],
                     (ConvertToF) ? CToF(hist->end_range[i]): hist->end_range[i],
                      hist->bin_count[i]);
   }

   // zero terminate string
   str[cnt] = 0;
}

//----------------------------------------------------------------------
//  Interpret the Temperature Alarm Event data by looking at the 'raw' 
//  portion of the TempAlarmEvents structure.  Mission Status is needed
//  to interpret the events.
//
void InterpretAlarms(TempAlarmEvents *alarm, MissionStatus *mstatus)
{
   int i;
   ulong event_mission_count;
   uchar duration;

   // low events
   alarm->num_low = 0;
   for (i = 0; i < 48; i += 4)
   {
      // get the mission start count of this event
      event_mission_count = ((long)alarm->alarm_raw[i + 2] << 16) |
                            ((int)alarm->alarm_raw[i + 1] << 8) |
                             alarm->alarm_raw[i];  

      // check if done with low events
      if (!event_mission_count)
         break;

      // get the duration
      duration = alarm->alarm_raw[i + 3];
   
      // calculate the start time
      alarm->low_start_time[alarm->num_low] =
          mstatus->mission_start_time + 
          (event_mission_count - 1) * (mstatus->sample_rate * 60);  

      // calculate the end time
      alarm->low_end_time[alarm->num_low] =
          alarm->low_start_time[alarm->num_low] + 
          (duration - 1) * (mstatus->sample_rate * 60);

      // increment number of low events
      alarm->num_low++;
   }

   // high events
   alarm->num_high = 0;
   for (i = 48; i < 96; i += 4)
   {
      // get the mission start count of this event
      event_mission_count = ((long)alarm->alarm_raw[i + 2] << 16) |
                            ((int)alarm->alarm_raw[i + 1] << 8) |
                             alarm->alarm_raw[i];  

      // check if done with low events
      if (!event_mission_count)
         break;

      // get the duration
      duration = alarm->alarm_raw[i + 3];

      // calculate the start time
      alarm->high_start_time[alarm->num_high] =
          mstatus->mission_start_time + 
          (event_mission_count - 1) * (mstatus->sample_rate * 60);  

      // calculate the end time
      alarm->high_end_time[alarm->num_high] =
          alarm->high_start_time[alarm->num_high] + 
          (duration - 1) * (mstatus->sample_rate * 60);

      // increment number of low events
      alarm->num_high++;
   }
}

//--------------------------------------------------------------------------
// Take the Temperature Alarms Events structure and convert to string 
// format
//
void AlarmsToString(TempAlarmEvents *alarm, char *str)
{
   int i, cnt=0;
   timedate td;

   // title
   cnt += sprintf(&str[cnt],"Temperature Alarms\n------------------\n"  
                            "Format: [(HIGH/LOW), Time/Date Range]\n");

   // loop through each low alarm
   for (i = 0; i < alarm->num_low; i++)
   {
      cnt += sprintf(&str[cnt],"LOW  , ");
      // start time
      SecondsToDate(&td,alarm->low_start_time[i]);      
      cnt += sprintf(&str[cnt]," %02d/%02d/%04d  %02d:%02d  to  ",
         td.month,td.day,td.year,td.hour,td.minute);
      // end time
      SecondsToDate(&td,alarm->low_end_time[i]);      
      cnt += sprintf(&str[cnt]," %02d/%02d/%04d  %02d:%02d\n",
         td.month,td.day,td.year,td.hour,td.minute);
   }

   // loop through each high alarm
   for (i = 0; i < alarm->num_high; i++)
   {
      cnt += sprintf(&str[cnt],"HIGH , ");
      // start time
      SecondsToDate(&td,alarm->high_start_time[i]);      
      cnt += sprintf(&str[cnt]," %02d/%02d/%04d  %02d:%02d  to  ",
         td.month,td.day,td.year,td.hour,td.minute);
      // end time
      SecondsToDate(&td,alarm->high_end_time[i]);      
      cnt += sprintf(&str[cnt]," %02d/%02d/%04d  %02d:%02d\n",
         td.month,td.day,td.year,td.hour,td.minute);
   }

   // zero terminate string
   str[cnt] = 0;
}

//----------------------------------------------------------------------
//  Interpret the Log data by looking at the 'raw' 
//  portion of the Log structure.  Mission Status is needed
//  to interpret when the logs occurred.
//
void InterpretLog(Log *log, MissionStatus *mstatus)
{
   ulong loops=0,overlap=0,lastlog=2048,i;
   int logcnt=0;

   // check if wrap occurred
   if (mstatus->rollover_occurred)
   {
      // calculate the number loops 
      loops = (mstatus->mission_samples / 2048) - 1;
      // calculate the number of overlap
      overlap = mstatus->mission_samples % 2048;
      log->num_log = 2048;
   }
   else
   {
      log->start_time = mstatus->mission_start_time;
      if (mstatus->mission_samples > 2048)  // (1.02)  
         lastlog = 2048;
      else
         lastlog = mstatus->mission_samples;
      log->num_log = (int)lastlog;
   }

   // set the interval
   log->interval = mstatus->sample_rate * 60;

   // caluclate the start time of the first log value
   log->start_time = mstatus->mission_start_time +
      loops * 2048 * log->interval + overlap * log->interval;

   // loop to fill in the remainder first
   for (i = overlap; i < lastlog; i++)
      log->temp[logcnt++] = TempToFloat(log->log_raw[i],FALSE);

   // loop to get the overlap
   for (i = 0; i < overlap; i++)
      log->temp[logcnt++] = TempToFloat(log->log_raw[i],FALSE);
}

//--------------------------------------------------------------------------
// Take the Log structure and convert to string 
// format
//
void LogToString(Log *log, int ConvertToF, char *str)
{
   int i,cnt=0;
   ulong logtime;
   timedate td;

   // title
   cnt += sprintf(&str[cnt],"Log Data\n--------\n"  
                            "Format: [Time/Date , Temperature] ");
   if (ConvertToF)
      cnt += sprintf(&str[cnt],"(Fahrenheit)\n");
   else
      cnt += sprintf(&str[cnt],"(Celsius)\n");

   // loop through the logs
   logtime = log->start_time;
   for (i = 0; i < log->num_log; i++)
   {
      // time
      SecondsToDate(&td,logtime);      
      cnt += sprintf(&str[cnt],"%02d/%02d/%04d  %02d:%02d ,",
         td.month,td.day,td.year,td.hour,td.minute);
      // temp
      cnt += sprintf(&str[cnt],"%6.1f\n", 
             (ConvertToF) ? CToF(log->temp[i]): log->temp[i]);

      // increment the time
      logtime += log->interval;
   }

   // zero terminate string
   str[cnt] = 0;
}

//--------------------------------------------------------------------------
// Convert the raw debug data to a string
//
void DebugToString(MissionStatus *mstatus, TempAlarmEvents *alarm, 
                   Histogram *hist, Log *log, char *str) 
{
   int i,cnt=0;

   // title
   cnt += sprintf(&str[cnt],"Debug Dump\n----------\nRegister Page:\n");

   // reg
   for (i = 0; i < 32; i++)
   {
      cnt += sprintf(&str[cnt],"%02X ",mstatus->status_raw[i]);
      if (i && (((i + 1) % 16) == 0))
         cnt += sprintf(&str[cnt],"\n");
   }

   // alarms
   cnt += sprintf(&str[cnt],"Alarms:\n");
   for (i = 0; i < 96; i++)
   {
      cnt += sprintf(&str[cnt],"%02X ",alarm->alarm_raw[i]);
      if (i && (((i + 1) % 16) == 0))
         cnt += sprintf(&str[cnt],"\n");
   }

   // histogram
   cnt += sprintf(&str[cnt],"Histogram:\n");
   for (i = 0; i < 128; i++)
   {
      cnt += sprintf(&str[cnt],"%02X ",hist->hist_raw[i]);
      if (i && (((i + 1) % 16) == 0))
         cnt += sprintf(&str[cnt],"\n");
   }


   // log
   cnt += sprintf(&str[cnt],"Log:\n");
   for (i = 0; i < ((log->num_log > 2048) ? 2048 : log->num_log); i++)
   {
      cnt += sprintf(&str[cnt],"%02X ",log->log_raw[i]);
      if (i && (((i + 1) % 16) == 0))
         cnt += sprintf(&str[cnt],"\n");
   }

   // zero terminate string
   str[cnt] = 0;
}

//--------------------------------------------------------------------------
// Take one byte BCD value and return binary value
//
uchar BCDToBin(uchar bcd)
{
   return (((bcd & 0xF0) >> 4) * 10) + (bcd & 0x0F);
}


//--------------------------------------------------------------------------
// Take a 4 byte long string and convert it into a timedata structure.
//
static int dm[] = { 0,0,31,59,90,120,151,181,212,243,273,304,334,365 };

void SecondsToDate(timedate *td, ulong x)
{
   short tmp,i,j;
   ulong y;
   
   // check to make sure date is not over 2070 (sanity check)
   if (x > 0xBBF81E00L)
      x = 0;
   
   y = x/60;  td->second = (ushort)(x-60*y);
   x = y/60;  td->minute = (ushort)(y-60*x);
   y = x/24;  td->hour   = (ushort)(x-24*y);
   x = 4*(y+731);  td->year = (ushort)(x/1461);
   i = (int)((x-1461*(ulong)(td->year))/4);  td->month = 13;
   
   do
   {
      td->month -= 1;
      tmp = (td->month > 2) && ((td->year & 3)==0) ? 1 : 0;
      j = dm[td->month]+tmp;
   
   } while (i < j);
   
   td->day = i-j+1;
   
   // slight adjustment to algorithm 
   if (td->day == 0) 
      td->day = 1;
   
   td->year = (td->year < 32)  ? td->year + 68 + 1900: td->year - 32 + 2000;
}

//--------------------------------------------------------------------------
// DateToSeconds takes a time/date structure and converts it into the 
// number of seconds since 1970
//
ulong DateToSeconds(timedate *td)
{
   ulong Sv,Bv,Xv;

   // convert the date/time values into the 5 byte format used in the touch 
   if (td->year >= 2000) 
      Sv = td->year + 32 - 2000;
   else 
      Sv = td->year - 68 - 1900;

   if ((td->month > 2) && ( (Sv & 3) == 0))
     Bv = 1;
   else
     Bv = 0;

   Xv = 365 * (Sv-2) + (Sv-1)/4 + dm[td->month] + td->day + Bv - 1;

   Xv = 86400 * Xv + (ulong)(td->second) + 60*((ulong)(td->minute) + 60*(ulong)(td->hour));

   return Xv;
}

//--------------------------------------------------------------------------
// Convert from DS1921 termature format to a float
// 
//
float TempToFloat(uchar tmp, int ConvertToF)
{
   float tfloat;

   tfloat = (float)((tmp / 2.0) - 40.0);

   if (ConvertToF)
      return (float)(tfloat * 9.0 / 5.0 + 32.0);
   else
      return tfloat;   
}

//--------------------------------------------------------------------------
// Convert from Celsius to Fahrenheit
//
float CToF(float CVal)
{
   return (float)(CVal * 9.0 / 5.0 + 32.0);
}

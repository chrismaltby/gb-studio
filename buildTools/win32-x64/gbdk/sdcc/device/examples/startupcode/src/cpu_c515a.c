/********************************************************************/
/* Function    : Siemens CPU C515A-L24M dependinge Functions   FILE */
/*------------------------------------------------------------------*/
/* Description : All CPU dependig functions like UART fe. are       */
/*               are initialized here                               */
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : none                                               */
/*------------------------------------------------------------------*/
/* Returnvalue : none                                               */
/*------------------------------------------------------------------*/
/* History     : 00/03    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/
#ifndef __FILE_CPU_C515A
#define __FILE_CPU_C515A

// All that has to be included and / or defined is done here

#include "../inc/hardware_description.h"

// END INCLUDES & DEFINES ===========================================

/********************************************************************/
/* Function    : CpuIdle()                                      SUB */
/*------------------------------------------------------------------*/
/* Description : If no CPU Power is need, we put into idle mode     */
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : none                                               */
/*------------------------------------------------------------------*/
/* Returnvalue : none                                               */
/*------------------------------------------------------------------*/
/* History     : 00/03    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/

void CpuIdle()
{
    // The Siemens Manual says, that we have to wait until the AD-Conversion
    // is completed before we put the cpu into idle mode

    // wait until AD-Conversion is finished
    while( BSY )
    {
        //
    }


    CPUIDLE = 1;
#ifdef USE_SYSTEM_TIMER
    PCON |= 0x01; // IDL-Bit in register PCON starts IDLE Mode
    PCON |= 0x20; //
#else
    // If there is no regular INT source, we better do not use
    // the IDLE Mode
    NOP;
#endif
    CPUIDLE = 0;
}

/********************************************************************/
/* Function    : WatchDog()                                     SUB */
/*------------------------------------------------------------------*/
/* Description : Internal (and external) Watchdogs trigger          */
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : none                                               */
/*------------------------------------------------------------------*/
/* Returnvalue : none                                               */
/*------------------------------------------------------------------*/
/* History     : 00/03    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/

void WatchDog( void )
{
    //NOP;
    // retrigger Externer Watchdog
    // Interner Watchdog not yet implemented
}


// ===========================================================================
// Serial IO with the internal UART in Interrupt Mode
#ifdef SERIAL_VIA_INTERRUPT

#define SERIAL_IS_DEFINED

// Transmit Buffersize
#ifndef SERIAL_VIA_INTERRUPT_XBUFLEN
#error "SERIAL_VIA_INTERRUPT_XBUFLEN not defined using default size 8"
#define SERIAL_VIA_INTERRUPT_XBUFLEN 8
#endif

// Receive Buffersize
#ifndef SERIAL_VIA_INTERRUPT_RBUFLEN
#error "SERIAL_VIA_INTERRUPT_RBUFLEN not defined using default size 8"
#define SERIAL_VIA_INTERRUPT_RBUFLEN 8
#endif

// in interrupt mode the ing buffer is placed in XDATA memory
volatile xdata static unsigned char SERIAL_VIA_INTERRUPT_RBUF[SERIAL_VIA_INTERRUPT_RBUFLEN];
volatile xdata static unsigned char SERIAL_VIA_INTERRUPT_XBUF[SERIAL_VIA_INTERRUPT_XBUFLEN];
volatile xdata static unsigned char SERIAL_VIA_INTERRUPT_RCNT;
volatile xdata static unsigned char SERIAL_VIA_INTERRUPT_XCNT;
volatile xdata static unsigned char SERIAL_VIA_INTERRUPT_RPOS;
volatile xdata static unsigned char SERIAL_VIA_INTERRUPT_XPOS;
volatile xdata static unsigned char SERIAL_VIA_INTERRUPT_BUSY;

#endif // SERIAL_VIA_INTERRUPT

// ===========================================================================
// Serial IO with them internal UART in Polling Mode
#ifdef SERIAL_VIA_POLLING
#define SERIAL_IS_DEFINED
#endif // SERIAL_VIA_POLLING

#ifdef SERIAL_IS_DEFINED
// calculate the reloadvalues acc. to the definitions
#ifndef CPUCLKHZ
#error "CPUCLKHZ not defined !"
#endif
#ifndef BAUDRATE
#error "BAUDRATE not defined !"
#endif
// The Siemens CPU C515A has a build in Baudrategenerator, therefore we use it instead
// of timer 1 this gives a better resolution

#define BAUDRATEGENRELOADVALUE (1024-(2*CPUCLKHZ/64/BAUDRATE))
#define TIMER1MODE2RELOADVALUE  (256-(2*CPUCLKHZ/32/12/BAUDRATE))

#endif // SERIAL_IS_DEFINED

// ===========================================================================
// now to the serial functions
#ifdef SERIAL_VIA_INTERRUPT
/********************************************************************/
/* Function    : SERIAL_VIA_INTERRUPT()                         ISR */
/*------------------------------------------------------------------*/
/* Description : If a serial INT occours, the sub function is called*/
/*               if a char is not yet transmitted, it is stored in  */
/*               the uart and transmitted, if a char has been       */
/*               received, it will be placed in the rx-buffer
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : none                                               */
/*------------------------------------------------------------------*/
/* Returnvalue : none                                               */
/*------------------------------------------------------------------*/
/* History     : 00/03    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/
void SERIALVIAINTERRUPT (void) interrupt SI0_VECTOR
{
    if (RI)
    {
        RI = 0;
        // char that are already inside the buffer should not be overwritten
        if (SERIAL_VIA_INTERRUPT_RCNT < SERIAL_VIA_INTERRUPT_RBUFLEN)
        {
            SERIAL_VIA_INTERRUPT_RBUF [(SERIAL_VIA_INTERRUPT_RPOS+SERIAL_VIA_INTERRUPT_RCNT++) % SERIAL_VIA_INTERRUPT_RBUFLEN] = SBUF;
        }
   }
   if (TI)
   {
       TI = 0;
       if (SERIAL_VIA_INTERRUPT_BUSY = SERIAL_VIA_INTERRUPT_XCNT)
       {   /* Assignment, _not_ comparison! */
           SERIAL_VIA_INTERRUPT_XCNT--;
           SBUF = SERIAL_VIA_INTERRUPT_XBUF [SERIAL_VIA_INTERRUPT_XPOS++];
           if (SERIAL_VIA_INTERRUPT_XPOS >= SERIAL_VIA_INTERRUPT_XBUFLEN)
           {
               SERIAL_VIA_INTERRUPT_XPOS = 0;
           }
       }
   }
}

/********************************************************************/
/* Function    : putchar()                                      SUB */
/*------------------------------------------------------------------*/
/* Description : everybody knows what this function is doing        */
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : char Byte                                          */
/*------------------------------------------------------------------*/
/* Returnvalue : none                                               */
/*------------------------------------------------------------------*/
/* History     : 00/03    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/
void putchar(  char Byte )
{
    while (SERIAL_VIA_INTERRUPT_XCNT >= SERIAL_VIA_INTERRUPT_XBUFLEN)
    {
        // buffer is full, wait until room
        WatchDog();
        CpuIdle();
    }
    ES = 0;

    if (SERIAL_VIA_INTERRUPT_BUSY)
    {
        SERIAL_VIA_INTERRUPT_XBUF[(SERIAL_VIA_INTERRUPT_XPOS+SERIAL_VIA_INTERRUPT_XCNT++) % SERIAL_VIA_INTERRUPT_XBUFLEN] = Byte;
    }
    else
    {
        SBUF = Byte;
        SERIAL_VIA_INTERRUPT_BUSY = 1;
    }
    ES = 1;
}

/********************************************************************/
/* Function    : getchar()                                      SUB */
/*------------------------------------------------------------------*/
/* Description : everybody knows what this function is doing        */
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : none                                               */
/*------------------------------------------------------------------*/
/* Returnvalue : char Byte                                          */
/*------------------------------------------------------------------*/
/* History     : 00/03    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/
char getchar( void )
{
    unsigned char c;
    while (!SERIAL_VIA_INTERRUPT_RCNT)
    {
        // no char avail, so wait
        WatchDog();
        CpuIdle();
    }
    ES = 0;
    SERIAL_VIA_INTERRUPT_RCNT--;
    c = SERIAL_VIA_INTERRUPT_RBUF [SERIAL_VIA_INTERRUPT_RPOS++];
    if (SERIAL_VIA_INTERRUPT_RPOS >= SERIAL_VIA_INTERRUPT_RBUFLEN)
    {
        SERIAL_VIA_INTERRUPT_RPOS = 0;

    }
    ES = 1;
    return (c);
}

/********************************************************************/
/* Function    : keypressed()                                   SUB */
/*------------------------------------------------------------------*/
/* Description : checks, if a char is available                     */
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : none                                               */
/*------------------------------------------------------------------*/
/* Returnvalue : TRUE yes, FALSE no                                 */
/*------------------------------------------------------------------*/
/* History     : 00/03    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/
char keypressed( void )
{
    unsigned char c;

    if(SERIAL_VIA_INTERRUPT_RCNT)
    {
        c = TRUE;
    }
    else
    {
        c = FALSE;
    }
    return (c);
}

#endif

// ===========================================================================
// Now the Internal UART Handling if Polling Method is used
#ifdef SERIAL_VIA_POLLING
/********************************************************************/
/* Function    : putchar()                                      SUB */
/*------------------------------------------------------------------*/
/* Description : everybody knows what this function is doing        */
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : char Byte                                          */
/*------------------------------------------------------------------*/
/* Returnvalue : none                                               */
/*------------------------------------------------------------------*/
/* History     : 00/03    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/
void putchar(  char Byte )
{
    while( !TI ) /* wait for TI==1 */
    {
        WatchDog();
        CpuIdle();
    }
    SBUF = Byte;
    TI = 0;
}

/********************************************************************/
/* Function    : getchar()                                      SUB */
/*------------------------------------------------------------------*/
/* Description : everybody knows what this function is doing        */
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : none                                               */
/*------------------------------------------------------------------*/
/* Returnvalue : char Byte                                          */
/*------------------------------------------------------------------*/
/* History     : 00/03    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/
char getchar( void )
{
    while( !RI ) /* wait for RI==1 */
    {
        WatchDog();
        CpuIdle();
    }
    RI=0;
    return (SBUF);
}

/********************************************************************/
/* Function    : keypressed()                                   SUB */
/*------------------------------------------------------------------*/
/* Description : is a char available ?                              */
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : none                                               */
/*------------------------------------------------------------------*/
/* Returnvalue : TRUE yes, FALSE no                                 */
/*------------------------------------------------------------------*/
/* History     : 00/03    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/
char keypressed( void )
{
    unsigned char c;

    if(RI)
    {
        c = TRUE;
    }
    else
    {
        c = FALSE;
    }
    return (c);
}

#endif

// ===========================================================================
// System Timer
#ifdef USE_SYSTEM_TIMER

volatile unsigned long SystemTicks1msec;

// Here are the definitions of the 1kHz Timer 0
// used for delay( xx_msec )
#ifndef CPUCLKHZ
#error "CPUCLKHZ is not defined !"
#endif

#define TIMER0INTSPERSECOND     1000
#define TIMER0MODE1RELOADVALUE  (-((CPUCLKHZ/TIMER0INTSPERSECOND)/12))

/********************************************************************/
/* Function    : delayMsec()                                    SUB */
/*------------------------------------------------------------------*/
/* Description : waste some CPU-Time, CPU will be set into IDLE Mode*/
/*               and is waked up every 1msec by TIMER0              */
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : unsigned long delayTime                            */
/*------------------------------------------------------------------*/
/* Returnvalue : none                                               */
/*------------------------------------------------------------------*/
/* History     : 99/10    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/
void DelayMsec( unsigned long delayTime )
{
    delayTime += SystemTicks1msec;
    WatchDog();
    while( SystemTicks1msec < delayTime )
    {
        CpuIdle();
        WatchDog();
    }
    WatchDog();
}

/********************************************************************/
/* Function    : timer0_isr                                     ISR */
/*------------------------------------------------------------------*/
/* Description : This ISR is called every 1msec and inc. a variable */
/*               that is used for delay()                           */
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : none                                               */
/*------------------------------------------------------------------*/
/* Returnvalue : none                                               */
/*------------------------------------------------------------------*/
/* History     : 99/10    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/
void timer0_isr (void) interrupt TF0_VECTOR
{
    /* Interruptrate will be slightly slower than wanted */
    /* because TL0 is not 0 here, not bug-fix yet */
    TL0 = (TIMER0MODE1RELOADVALUE & 0x00FF);
    TH0 = (TIMER0MODE1RELOADVALUE >> 8);
    SystemTicks1msec++;
}
#endif // USE_SYSTEM_TIMER

// ===========================================================================
// Analog Stuff
#ifdef USE_ANALOGPORT

unsigned int ADCGetValue( char ADCPort )
{
    // if a conversion is busy, wait
    while( BSY )
    {
        //
    }
    WatchDog();

    // set AD-Port
    ADCON1 &= 0xF8;             // clear MX0 to MX2
    ADCON1 |= (ADCPort & 0x07); // set Port

    // start AD Conversion
    ADDATL = 0x00;

    while( BSY )
    {
        //
    }
    WatchDog();

    // read AD Converter Register
    return( (((unsigned int)ADDATH) << 2) + ((unsigned int)ADDATL >> 6) );
}
#endif

// ===========================================================================

// ===================================================================
// Global Hardware Init
/********************************************************************/
/* Function    : InitHardware()                                 SUB */
/*------------------------------------------------------------------*/
/* Description : Should be the first executed after reset to get a  */
/*               proper initalised CPU                              */
/*------------------------------------------------------------------*/
/* Author      : Michael Schmitt                                    */
/*------------------------------------------------------------------*/
/* Input       : none                                               */
/*------------------------------------------------------------------*/
/* Returnvalue : none                                               */
/*------------------------------------------------------------------*/
/* History     : 99/10    V1.0 Initial Version                      */
/*                                                                  */
/********************************************************************/
void InitHardware( void )
{
#ifdef USE_SYSTEM_TIMER
    SystemTicks1msec = 0x0;
#endif // USE_SYSTEM_TIMER

    EA = 0;         // Disable ALL Ints
    ES = 0;         // Disable Serial Int
    ET1 = 0;        // Disable Timer 1 Int
    EX1 = 0;        // Disable External Interrupt 1
    ET0 = 0;        // Disable Timer 0 Int
    EX0 = 0;        // Disable External Interrupt 0
    EADC = 0;       // Disable A/D Converter Interrupt

    TR1 = 0;        // Stop Timer 1
    TR0 = 0;        // Stop Timer 0

    // The Siemens CPU C515A has 8 Analog inputs with 10Bit resolution
    // Conversion Clock is generated from CPU-Clock but should be less
    // than max 2MHZ.
    if( CPUCLKHZ < 16000000 )
    {
        // CPU Speed < 16MHz Prescaler Ratio is divide by 4 (Reset default)
        ADCON1 &= ~ADCON1_ADCL;
        // the automatic A/D Converter Calibration needs
        // Reset Calibration phase = 26624 / CPUCLKHZ
        // @ 16MHz this is about 1,7msec
        // or 2219 machine cycle
    }
    else
    {
        // CPU Speed > 16MHz Prescaler Ratio is divide by 4 (Reset default)
        ADCON1 |= ADCON1_ADCL;
        // the automatic A/D Converter Calibration needs
        // Reset Calibration phase = 53248 / CPUCLKHZ
        // @ 246MHz this is about 2,3msec
        // or 4438 machine cycle
    }


    // AD-Conversion stars intern and not with P40 ADST#
    ADCON0 &= ~ADCON0_ADM;

#ifdef USE_SYSTEM_TIMER
    // Init Timer 0 as Software Interrupt for 1mSec Timer
    TL0 = (TIMER0MODE1RELOADVALUE & 0x00FF);
    TH0 = (TIMER0MODE1RELOADVALUE >> 8);
    TMOD &= 0xf0;
    TMOD |= 0x01;       // Setting Timer 0 als GATE=0 TIMER und MODE 1 16-bit Timer mode
    TR0  = 1;           // Enabling Timer 0
    TR0 = 1;            // Start Timer 0
    ET0 = 1;            // Enable Timer 0 Interrupt
#endif

#ifdef SERIAL_VIA_INTERRUPT
    // Ringbuffer for Serielle UART  init
    SERIAL_VIA_INTERRUPT_RCNT = 0;
    SERIAL_VIA_INTERRUPT_XCNT = 0;
    SERIAL_VIA_INTERRUPT_RPOS = 0;
    SERIAL_VIA_INTERRUPT_XPOS = 0;
    SERIAL_VIA_INTERRUPT_BUSY = 0;
#endif

#ifdef SERIAL_IS_DEFINED
#ifdef BAUDRATEGENENATOR_USED

    // We use the internal Bauratengenerator of the Siemens CPU
    SRELL = (BAUDRATEGENRELOADVALUE & 0x00FF);
    SRELH = (BAUDRATEGENRELOADVALUE >> 8);
    ADCON0 |= 0x80; // set BD-Bit, we use internal Baudrate gen.
    PCON |= 0x80;   // SMOD-Bit forr double Baudrate

#else

    // use TIMER1 im Mode 2
    PCON |= 0x80;   // set SMOD-Bit for double Baudrate
    TH1 = TIMER1MODE2RELOADVALUE;
    TL1 = TIMER1MODE2RELOADVALUE;
    TMOD &= 0x0f;
    TMOD |= 0x20;   // Timer 1 als GATE=0 TIMER und MODE 2 8-bit auto reload
    TR1  = 1;       // Enabling Timer 1

#endif

    SCON  = 0x40;       // Init Serial Port as 8-Bit UART
    SCON |= 0x10;       // Enabling Seriel receive REN-Bit
    SCON |= 0x02;       // Setting TI-Bit

#ifdef SERIAL_VIA_INTERRUPT
        ES = 1;         // Enable Serial Interrupt
#endif

#endif

#ifdef USE_CPU_Internal_XRAM
    // CPU Internal SRAM einable
    SYSCON = ((SYSCON) & ((UBYTE)~(XMAP0_BIT | XMAP1_BIT)));
#endif

    EA = 1;             // Enable all Enabled Interrupts
}

#endif

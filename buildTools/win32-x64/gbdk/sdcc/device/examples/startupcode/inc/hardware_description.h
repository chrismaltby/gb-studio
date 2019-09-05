// INCLUDES & DEFINES ===============================================
// here are some definition about the CPU type

#ifndef __FILE_HARDWARE_DESCRIBTION_H
#define __FILE_HARDWARE_DESCRIBTION_H

#define CPUTYPE C515A

#include "..\inc\c515a.h"         // Definitions of registers, SFRs and Bits
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <assert.h>
#include <limits.h>
#include <malloc.h>

// First some useful definitions
#define FALSE 0
#define TRUE !FALSE

// here is a definition of a single nop command as it has to be declared under keil-C and sdcc
#ifdef SDCC
#define NOP _asm nop _endasm
//#define UBYTE unsigned char
//#define UINT unsigned int
//#define BOOL unsigned char
#else
// This is for Keil-C
#define NOP _nop_()
#endif

// now we specify at what crystal speed the cpu runs (unit is Hz !!)
//#define CPUCLKHZ                11059200
#define CPUCLKHZ                24000000

// We use the internal UART, so we have to set the desired BAUDRATE
//#define BAUDRATE                9600
//#define BAUDRATE                19200
#define BAUDRATE                57600

// For serial com. we use the internal UART and data exchange is done by interrupt and not via polling
#define SERIAL_VIA_INTERRUPT
// Achtung maximal 127Bytes ! Puffer
#define SERIAL_VIA_INTERRUPT_XBUFLEN 100
#define SERIAL_VIA_INTERRUPT_RBUFLEN 100
// disable the above three lines and enable the next one if polling method is used
//#define SERIAL_VIA_POLLING

// The Siemens CPU C515A has a build in Baudrategenerator, therefore we use it instead
// of timer 1 this gives a better resolution
#define BAUDRATEGENENATOR_USED

// to measure time and delays we include a 1msec timer
#define USE_SYSTEM_TIMER

// CPU-Ports

#define CPUIDLE             P3_3
#define EXTWATCHDOG         P3_5

#include "..\inc\cpu_c515a.h"

#endif
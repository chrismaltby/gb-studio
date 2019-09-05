#ifndef TINIBIOS_H

#define TINIBIOS_H

#include <ds80c390.h>
#include <time.h>

#define Serial0GetChar getchar
#define Serial0PutChar putchar

void Serial0Init (unsigned long baud, unsigned char buffered);
char Serial0GetChar(void);
void Serial0PutChar(char);
char Serial0CharArrived(void);
void Serial0Baud(unsigned long baud);
void Serial0SendBreak(void);
void Serial0Flush(void);

void Serial1Init (unsigned long baud, unsigned char buffered);
char Serial1GetChar(void);
void Serial1PutChar(char);
char Serial1CharArrived(void);
void Serial1Baud(unsigned long baud);
void Serial1SendBreak(void);
void Serial1Flush(void);

unsigned long ClockTicks();
void ClockMilliSecondsDelay(unsigned long ms);
void ClockMicroSecondsDelay(unsigned int us);

#define SERIAL_0_BAUD 115200L
#define SERIAL_1_BAUD 9600L

// these need to be binary numbers
#define SERIAL_0_RECEIVE_BUFFER_SIZE 1024
#define SERIAL_1_RECEIVE_BUFFER_SIZE 64

// I know someone is fooling with the crystals
#define OSCILLATOR 18432000L

/* Set the cpu speed in clocks per machine cycle, valid values are:
   1024: Divide-by-1024 (power management) mode (screws ALL timers and serial)
      4: Standard 8051 divide-by-4 mode
      2: Use 2x xtal multiplier 
      1: Use 4x xtal multiplier (Don't do this with a TINI at 18.432MHz)
*/
#define CPU_SPEED 2
void CpuSpeed(unsigned int speed);

// The MOVX stretch cycles, see datasheet
#define CPU_MOVX_STRETCH 0x01

// from rtc390.c
#define HAVE_RTC
unsigned char RtcRead(struct tm *rtcDate);
void RtcWrite(struct tm *rtcDate);

// from lcd390.c
extern void LcdInit(void);
extern void LcdOn(void);
extern void LcdOff(void);
extern void LcdClear(void);
extern void LcdHome(void);
extern void LcdGoto(unsigned int collumnRow);
extern void LcdPutChar(char c);
extern void LcdPutString(char *string);
extern void LcdLPutString(unsigned int collumnRow, char *string);
extern void LcdPrintf(const char *format, ...) reentrant;
extern void LcdLPrintf(unsigned int collumnRow, const char *format, ...) reentrant;

// from i2c390.c
#define I2C_BUFSIZE 128
extern char I2CReset(void);
extern char I2CStart(void);
extern char I2CStop(void);
extern char I2CSendStop(char addr, char count, 
			char send_stop);
extern char I2CReceive(char addr, char count);
extern char I2CSendReceive(char addr, char tx_count, 
			   char rx_count);
//extern char I2CByteOut(char);
//extern void I2CDumpError(char);

/* global transfer buffers */
extern char i2cTransmitBuffer[I2C_BUFSIZE];
extern char i2cReceiveBuffer[I2C_BUFSIZE];

// Macro for normal send transfer ending with a stop condition
#define I2CSend(addr, count)   I2CSendStop(addr, count, 1)


// internal functions used by tinibios.c
unsigned char _sdcc_external_startup(void);
void Serial0IrqHandler (void) interrupt 4;
void Serial1IrqHandler (void) interrupt 7;
void ClockInit();
void ClockIrqHandler (void) interrupt 1 _naked;

#endif /* TINIBIOS_H */

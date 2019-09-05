#define OSCILLATOR 11059200
#define BAUD 19200

void ClockIrqHandler (void) interrupt 1 using 3;
unsigned long ClockTicks(void);


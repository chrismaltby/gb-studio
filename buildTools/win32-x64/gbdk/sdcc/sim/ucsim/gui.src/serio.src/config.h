/******************************************************************************
 * to emulate the serial input and output of an 8051 controller               *
 * config.h - general defintions                                              *
 ******************************************************************************/

#ifndef DEF_INFILE
// the processors serial output
#define DEF_INFILE "/tmp/out"
#endif

#ifndef DEF_OUTFILE
// the processors serial input
#define DEF_OUTFILE "/tmp/in"
#endif

#define MAX_SIZ 1024

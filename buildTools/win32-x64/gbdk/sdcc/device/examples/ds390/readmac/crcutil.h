#ifndef CRCUTIL_H_
#define CRCUTIL_H_

#ifdef WANT_CRC_16
unsigned int docrc16(unsigned int oldCrc, unsigned int byte);
#endif

unsigned char docrc8(unsigned char oldCrc, unsigned char x);
#endif
